import mongoose from "mongoose";
import { Message } from "../models/Message.model.js";
import { Conversation } from "../models/Conversation.model.js";
import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { emitToUser } from "../socket/socket.js";

const PUBLIC_PROJECTION = { _id: 1, name: 1, avatar: 1, department: 1, role: 1 };

const buildSenderEnrichment = () => [
  {
    $lookup: {
      from: "users",
      localField: "sender",
      foreignField: "_id",
      as: "sender",
      pipeline: [{ $project: PUBLIC_PROJECTION }],
    },
  },
  { $unwind: "$sender" },
  { $project: { __v: 0 } },
];

/**
 * Finds or atomically creates the conversation between two users, keyed by
 * their participant pair in canonical (sorted) order — see the design note
 * in Conversation.model.js.
 */
const getOrCreateConversation = async (userIdA, userIdB) => {
  const sortedIds = [userIdA, userIdB].map(String).sort();
  const participants = sortedIds.map((id) => new mongoose.Types.ObjectId(id));

  return Conversation.findOneAndUpdate(
    { participants },
    { $setOnInsert: { participants, unreadCount: 0 } },
    { upsert: true, new: true }
  );
};

/**
 * sendMessage — persists a message, updates the conversation's directional
 * unread streak, and pushes it to the recipient in real time.
 */
export const sendMessage = async ({ senderId, recipientId, text }) => {
  if (!mongoose.Types.ObjectId.isValid(recipientId)) throw new ApiError(400, "Invalid recipient ID");
  if (senderId === recipientId) throw new ApiError(400, "You cannot message yourself");

  const recipientExists = await User.exists({ _id: recipientId });
  if (!recipientExists) throw new ApiError(404, "Recipient not found");

  const message = await Message.create({ sender: senderId, recipient: recipientId, text });
  const conversation = await getOrCreateConversation(senderId, recipientId);

  // Directional unread streak — see the design note in Conversation.model.js.
  // Continues (+1) if the same person is still sending; resets (=1) to start
  // a fresh streak for the new recipient when the sender changes.
  let previousSenderId = null;
  if (conversation.lastMessage) {
    const previousMessage = await Message.findById(conversation.lastMessage).select("sender").lean();
    previousSenderId = previousMessage?.sender?.toString() ?? null;
  }
  const continuingStreak = previousSenderId === senderId;

  await Conversation.findByIdAndUpdate(conversation._id, {
    $set: {
      lastMessage: message._id,
      unreadCount: continuingStreak ? conversation.unreadCount + 1 : 1,
    },
  });

  const [enriched] = await Message.aggregate([
    { $match: { _id: message._id } },
    ...buildSenderEnrichment(),
  ]);

  try {
    emitToUser(recipientId, "receive_message", enriched);
  } catch {
    // Socket.io may not be initialized (e.g. tests); the message is already
    // persisted, so a missed real-time push is not fatal.
  }

  return enriched;
};

/**
 * markConversationRead — marks the other user's messages read and clears
 * the conversation's unread streak for the viewer, if it currently belongs
 * to them (see the directional design note in Conversation.model.js).
 *
 * Shared by getMessages (runs as a side effect of fetching chat history)
 * and the dedicated PATCH /messages/:userId/read endpoint, which exists
 * specifically for the case a GET never happens: a message arriving over
 * the socket while the recipient already has that chat open gets injected
 * straight into the UI (see useMessageSocket.js), so no GET ever fires to
 * trigger this side effect — without an explicit call here, the database
 * would keep disagreeing with what the user has actually already seen.
 */
export const markConversationRead = async ({ viewerId, otherUserId }) => {
  if (!mongoose.Types.ObjectId.isValid(otherUserId)) throw new ApiError(400, "Invalid user ID");
  if (viewerId === otherUserId) throw new ApiError(400, "Invalid conversation");

  const viewerObjId = new mongoose.Types.ObjectId(viewerId);
  const otherObjId = new mongoose.Types.ObjectId(otherUserId);

  await Message.updateMany(
    { sender: otherObjId, recipient: viewerObjId, read: false },
    { $set: { read: true } }
  );

  const sortedIds = [viewerId, otherUserId].map(String).sort();
  const conversation = await Conversation.findOne({
    participants: sortedIds.map((id) => new mongoose.Types.ObjectId(id)),
  }).populate("lastMessage", "sender");

  if (conversation?.lastMessage && conversation.lastMessage.sender.toString() !== viewerId) {
    await Conversation.findByIdAndUpdate(conversation._id, { $set: { unreadCount: 0 } });
  }
};

/**
 * getMessages — bidirectional chat history between the viewer and one other
 * user, newest-first pages (client reverses for display — see useMessages.js).
 * Side effect: marks the other user's messages read and clears the
 * conversation's unread streak for the viewer, if it currently belongs to them.
 */
export const getMessages = async ({ viewerId, otherUserId, page, limit }) => {
  if (!mongoose.Types.ObjectId.isValid(otherUserId)) throw new ApiError(400, "Invalid user ID");
  if (viewerId === otherUserId) throw new ApiError(400, "Invalid conversation");

  const otherUser = await User.findById(otherUserId).select(PUBLIC_PROJECTION);
  if (!otherUser) throw new ApiError(404, "User not found");

  const skip = (page - 1) * limit;
  const viewerObjId = new mongoose.Types.ObjectId(viewerId);
  const otherObjId = new mongoose.Types.ObjectId(otherUserId);

  const pipeline = [
    {
      $match: {
        $or: [
          { sender: viewerObjId, recipient: otherObjId },
          { sender: otherObjId, recipient: viewerObjId },
        ],
      },
    },
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $facet: {
        messages: [{ $skip: skip }, { $limit: limit }, ...buildSenderEnrichment()],
        totalCount: [{ $count: "count" }],
      },
    },
    { $addFields: { totalMessages: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] } } },
    { $project: { totalCount: 0 } },
  ];

  const [result] = await Message.aggregate(pipeline);
  const totalMessages = result?.totalMessages ?? 0;
  const totalPages = Math.ceil(totalMessages / limit);

  await markConversationRead({ viewerId, otherUserId });

  return {
    messages: result?.messages ?? [],
    otherUser,
    pagination: { currentPage: page, totalPages, totalMessages, hasNextPage: page < totalPages, hasPrevPage: page > 1, limit },
  };
};

/**
 * getConversations — the caller's inbox, newest-active-first, with a
 * viewer-relative unread badge per conversation.
 */
export const getConversations = async ({ viewerId, page, limit }) => {
  const skip = (page - 1) * limit;
  const viewerObjId = new mongoose.Types.ObjectId(viewerId);

  const pipeline = [
    { $match: { participants: viewerObjId } },
    { $sort: { updatedAt: -1 } },
    {
      $facet: {
        conversations: [
          { $skip: skip },
          { $limit: limit },
          {
            $addFields: {
              otherParticipantId: {
                $first: { $filter: { input: "$participants", cond: { $ne: ["$$this", viewerObjId] } } },
              },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "otherParticipantId",
              foreignField: "_id",
              as: "otherParticipant",
              pipeline: [{ $project: PUBLIC_PROJECTION }],
            },
          },
          { $unwind: "$otherParticipant" },
          {
            $lookup: {
              from: "messages",
              localField: "lastMessage",
              foreignField: "_id",
              as: "lastMessage",
            },
          },
          { $unwind: { path: "$lastMessage", preserveNullAndEmptyArrays: true } },
          {
            $addFields: {
              // Directional unread count is only meaningful for the viewer
              // when they didn't send the last message themselves.
              unreadCount: {
                $cond: [{ $eq: ["$lastMessage.sender", viewerObjId] }, 0, "$unreadCount"],
              },
            },
          },
          { $project: { participants: 0, otherParticipantId: 0, __v: 0 } },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
    { $addFields: { totalConversations: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] } } },
    { $project: { totalCount: 0 } },
  ];

  const [result] = await Conversation.aggregate(pipeline);
  const totalConversations = result?.totalConversations ?? 0;
  const totalPages = Math.ceil(totalConversations / limit);

  return {
    conversations: result?.conversations ?? [],
    pagination: { currentPage: page, totalPages, totalConversations, hasNextPage: page < totalPages, hasPrevPage: page > 1, limit },
  };
};

/**
 * getTotalUnreadCount — sums the viewer-relative unread streak across every
 * conversation the caller is part of, for the navbar badge.
 */
export const getTotalUnreadCount = async (viewerId) => {
  const viewerObjId = new mongoose.Types.ObjectId(viewerId);

  const result = await Conversation.aggregate([
    { $match: { participants: viewerObjId } },
    {
      $lookup: {
        from: "messages",
        localField: "lastMessage",
        foreignField: "_id",
        as: "lastMessage",
      },
    },
    { $unwind: { path: "$lastMessage", preserveNullAndEmptyArrays: true } },
    { $match: { "lastMessage.sender": { $ne: viewerObjId } } },
    { $group: { _id: null, total: { $sum: "$unreadCount" } } },
  ]);

  return { unreadCount: result[0]?.total ?? 0 };
};
