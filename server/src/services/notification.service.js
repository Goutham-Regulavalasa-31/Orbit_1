import mongoose from "mongoose";
import { Notification } from "../models/Notification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { emitToUser } from "../socket/socket.js";

const SENDER_PROJECTION = { _id: 1, name: 1, avatar: 1, department: 1, role: 1 };

const buildSenderEnrichment = () => [
  {
    $lookup: {
      from: "users",
      localField: "sender",
      foreignField: "_id",
      as: "sender",
      pipeline: [{ $project: SENDER_PROJECTION }],
    },
  },
  { $unwind: "$sender" },
  { $project: { __v: 0 } },
];

/**
 * notifyUser — creates a notification and pushes it in real time.
 *
 * Best-effort by design: called from post/comment services *after* the
 * triggering write has already succeeded, so a socket hiccup here must
 * never fail the caller's request.
 *
 * @param {object} params
 * @param {string} params.recipientId
 * @param {string} params.senderId
 * @param {"like"|"comment"|"reply"} params.type
 * @param {string} params.postId
 * @param {string|null} [params.commentId]
 */
export const notifyUser = async ({ recipientId, senderId, type, postId, commentId = null }) => {
  if (String(recipientId) === String(senderId)) return; // no self-notifications

  const notification = await Notification.create({
    recipient: recipientId,
    sender: senderId,
    type,
    post: postId,
    comment: commentId,
  });

  const [enriched] = await Notification.aggregate([
    { $match: { _id: notification._id } },
    ...buildSenderEnrichment(),
  ]);

  const unreadCount = await Notification.countDocuments({ recipient: recipientId, read: false });

  try {
    emitToUser(recipientId, "new_notification", { ...enriched, unreadCount });
  } catch {
    // Socket.io may not be initialized (e.g. tests); the notification is
    // already persisted, so a missed real-time push is not fatal.
  }
};

export const getNotifications = async ({ userId, page, limit }) => {
  const skip = (page - 1) * limit;
  const recipientObjId = new mongoose.Types.ObjectId(userId);

  const pipeline = [
    { $match: { recipient: recipientObjId } },
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $facet: {
        notifications: [{ $skip: skip }, { $limit: limit }, ...buildSenderEnrichment()],
        totalCount: [{ $count: "count" }],
        unreadCount: [{ $match: { read: false } }, { $count: "count" }],
      },
    },
    {
      $addFields: {
        totalNotifications: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] },
        unreadCount: { $ifNull: [{ $arrayElemAt: ["$unreadCount.count", 0] }, 0] },
      },
    },
    { $project: { totalCount: 0 } },
  ];

  const [result] = await Notification.aggregate(pipeline);
  const totalNotifications = result?.totalNotifications ?? 0;
  const totalPages = Math.ceil(totalNotifications / limit);

  return {
    notifications: result?.notifications ?? [],
    unreadCount: result?.unreadCount ?? 0,
    pagination: { currentPage: page, totalPages, totalNotifications, hasNextPage: page < totalPages, hasPrevPage: page > 1, limit },
  };
};

export const getUnreadCount = async (userId) => {
  const unreadCount = await Notification.countDocuments({ recipient: userId, read: false });
  return { unreadCount };
};

export const markAsRead = async ({ notificationId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) throw new ApiError(400, "Invalid notification ID");

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { read: true } },
    { new: true }
  );

  if (!notification) throw new ApiError(404, "Notification not found");
  return notification;
};

export const markAllAsRead = async (userId) => {
  await Notification.updateMany({ recipient: userId, read: false }, { $set: { read: true } });
};
