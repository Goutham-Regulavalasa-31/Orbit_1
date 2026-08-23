import mongoose from "mongoose";
import { Comment } from "../models/Comment.model.js";
import { Post } from "../models/Post.model.js";
import { ApiError } from "../utils/ApiError.js";
import { emitToPost } from "../socket/socket.js";
import { notifyUser } from "./notification.service.js";

// Socket.io may not be initialized (e.g. tests); never let that fail a request
// whose DB write already succeeded.
const safeEmitToPost = (postId, event, payload) => {
  try {
    emitToPost(postId, event, payload);
  } catch {
    // ignore — real-time broadcast is best-effort
  }
};

const buildCommentEnrichment = (userId) => [
  {
    $lookup: {
      from: "users",
      localField: "author",
      foreignField: "_id",
      as: "author",
      pipeline: [{ $project: { _id: 1, name: 1, avatar: 1, department: 1, role: 1 } }],
    },
  },
  { $unwind: "$author" },
  {
    $addFields: {
      likesCount: { $size: "$likes" },
      isLikedByCurrentUser: { $in: [new mongoose.Types.ObjectId(userId), "$likes"] },
    },
  },
  { $project: { likes: 0, __v: 0 } },
];

export const getComments = async ({ postId, userId, page, limit }) => {
  if (!mongoose.Types.ObjectId.isValid(postId)) throw new ApiError(400, "Invalid post ID");

  const skip = (page - 1) * limit;
  const postObjId = new mongoose.Types.ObjectId(postId);

  const pipeline = [
    { $match: { postId: postObjId, parentCommentId: null } },
    { $sort: { createdAt: 1 } },
    {
      $facet: {
        comments: [
          { $skip: skip },
          { $limit: limit },
          ...buildCommentEnrichment(userId),
          {
            $lookup: {
              from: "comments",
              let: { parentId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$postId", postObjId] },
                        { $eq: ["$parentCommentId", "$$parentId"] }
                      ]
                    }
                  }
                },
                { $sort: { createdAt: 1 } },
                ...buildCommentEnrichment(userId),
                {
                  $lookup: {
                    from: "comments",
                    let: { grandParentId: "$_id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ["$postId", postObjId] },
                              { $eq: ["$parentCommentId", "$$grandParentId"] }
                            ]
                          }
                        }
                      },
                      { $sort: { createdAt: 1 } },
                      ...buildCommentEnrichment(userId),
                      { $addFields: { replies: [] } }
                    ],
                    as: "replies"
                  }
                }
              ],
              as: "replies"
            }
          }
        ],
        totalCount: [{ $count: "count" }]
      }
    },
    { $addFields: { totalComments: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] } } },
    { $project: { totalCount: 0 } }
  ];

  const [result] = await Comment.aggregate(pipeline);
  const totalComments = result?.totalComments ?? 0;
  const totalPages = Math.ceil(totalComments / limit);

  return {
    comments: result?.comments ?? [],
    pagination: { currentPage: page, totalPages, totalComments, hasNextPage: page < totalPages, hasPrevPage: page > 1, limit },
  };
};

export const createComment = async ({ postId, authorId, text, parentCommentId = null }) => {
  if (!mongoose.Types.ObjectId.isValid(postId)) throw new ApiError(400, "Invalid post ID");

  let parentObjId = null;
  let parent = null;
  if (parentCommentId) {
    if (!mongoose.Types.ObjectId.isValid(parentCommentId)) throw new ApiError(400, "Invalid parentCommentId");
    parentObjId = new mongoose.Types.ObjectId(parentCommentId);
    parent = await Comment.findOne({ _id: parentObjId, postId }).lean();
    if (!parent) throw new ApiError(404, "Parent comment not found");
  }

  const comment = await Comment.create({ postId, author: authorId, text, parentCommentId: parentObjId });
  const post = await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } }).select("author");

  const [enriched] = await Comment.aggregate([
    { $match: { _id: comment._id } },
    ...buildCommentEnrichment(authorId),
    { $addFields: { replies: [] } },
  ]);

  safeEmitToPost(postId, "new_comment", enriched);

  try {
    if (parent) {
      await notifyUser({ recipientId: parent.author, senderId: authorId, type: "reply", postId, commentId: comment._id });
    } else if (post) {
      await notifyUser({ recipientId: post.author, senderId: authorId, type: "comment", postId, commentId: comment._id });
    }
  } catch {
    // Notification delivery is best-effort — never fail a successful comment.
  }

  return enriched;
};

export const toggleCommentLike = async ({ commentId, postId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(commentId)) throw new ApiError(400, "Invalid comment ID");

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const comment = await Comment.findById(commentId).select("likes postId author");
  if (!comment) throw new ApiError(404, "Comment not found");

  const alreadyLiked = comment.likes.some((id) => id.equals(userObjectId));
  const updated = await Comment.findByIdAndUpdate(
    commentId,
    alreadyLiked ? { $pull: { likes: userObjectId } } : { $addToSet: { likes: userObjectId } },
    { new: true, select: "likes" }
  );

  safeEmitToPost(postId, "comment_liked", { commentId, likesCount: updated.likes.length, liked: !alreadyLiked, userId });

  if (!alreadyLiked) {
    try {
      await notifyUser({ recipientId: comment.author, senderId: userId, type: "like", postId, commentId });
    } catch {
      // Notification delivery is best-effort — never fail a successful like.
    }
  }

  return { liked: !alreadyLiked, likesCount: updated.likes.length };
};

export const deleteComment = async ({ commentId, postId, userId, userRole }) => {
  if (!mongoose.Types.ObjectId.isValid(commentId)) throw new ApiError(400, "Invalid comment ID");

  const comment = await Comment.findById(commentId).select("author postId parentCommentId");
  if (!comment) throw new ApiError(404, "Comment not found");

  if (comment.author.toString() !== userId && userRole !== "admin") {
    throw new ApiError(403, "You are not authorized to delete this comment");
  }

  const idsToDelete = await collectDescendantIds(commentId);
  idsToDelete.push(new mongoose.Types.ObjectId(commentId));

  await Comment.deleteMany({ _id: { $in: idsToDelete } });
  await Post.findByIdAndUpdate(postId, [
    { $set: { commentsCount: { $max: [{ $subtract: ["$commentsCount", idsToDelete.length] }, 0] } } },
  ]);

  safeEmitToPost(postId, "comment_deleted", { commentId, parentCommentId: comment.parentCommentId?.toString() ?? null, deletedCount: idsToDelete.length });
};

const collectDescendantIds = async (rootId) => {
  const result = [];
  const queue = [new mongoose.Types.ObjectId(rootId)];

  while (queue.length > 0) {
    const batch = queue.splice(0, queue.length);
    const children = await Comment.find({ parentCommentId: { $in: batch } }, "_id").lean();

    for (const child of children) {
      result.push(child._id);
      queue.push(child._id);
    }
  }
  return result;
};