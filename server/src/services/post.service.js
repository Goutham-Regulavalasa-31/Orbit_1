import mongoose from "mongoose";
import { Post } from "../models/Post.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { emitToPost } from "../socket/socket.js";
import { notifyUser } from "./notification.service.js";

const buildEnrichmentPipeline = (userId) => [
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

export const createPost = async ({ authorId, caption, postType, tags, files }) => {
  let mediaUrls = [];

  if (files && files.length > 0) {
    try {
      const uploads = files.map((file) => uploadToCloudinary(file.buffer, file.mimetype));
      mediaUrls = await Promise.all(uploads);
    } catch (error) {
      throw new ApiError(500, `Media upload failed: ${error.message}`);
    }
  }

  const post = await Post.create({ author: authorId, caption, postType: postType ?? "general", tags: tags ?? [], mediaUrls });

  const [enriched] = await Post.aggregate([
    { $match: { _id: post._id } },
    ...buildEnrichmentPipeline(authorId),
  ]);

  return enriched;
};

export const getFeed = async ({ userId, page, limit, postType }) => {
  const skip = (page - 1) * limit;
  const matchStage = postType ? { $match: { postType } } : { $match: {} };

  const pipeline = [
    matchStage,
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $facet: {
        posts: [{ $skip: skip }, { $limit: limit }, ...buildEnrichmentPipeline(userId)],
        totalCount: [{ $count: "count" }],
      },
    },
    { $addFields: { totalPosts: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] } } },
    { $project: { totalCount: 0 } },
  ];

  const [result] = await Post.aggregate(pipeline);
  const totalPosts = result?.totalPosts ?? 0;
  const totalPages = Math.ceil(totalPosts / limit);

  return {
    posts: result?.posts ?? [],
    pagination: { currentPage: page, totalPages, totalPosts, hasNextPage: page < totalPages, hasPrevPage: page > 1, limit },
  };
};

export const getPostById = async ({ postId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(postId)) throw new ApiError(400, "Invalid post ID");

  const [post] = await Post.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(postId) } },
    ...buildEnrichmentPipeline(userId),
  ]);

  if (!post) throw new ApiError(404, "Post not found");
  return post;
};

export const toggleLike = async ({ postId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(postId)) throw new ApiError(400, "Invalid post ID");

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const post = await Post.findById(postId).select("author likes");
  if (!post) throw new ApiError(404, "Post not found");

  const alreadyLiked = post.likes.some((id) => id.equals(userObjectId));
  const updated = await Post.findByIdAndUpdate(
    postId,
    alreadyLiked ? { $pull: { likes: userObjectId } } : { $addToSet: { likes: userObjectId } },
    { new: true, select: "likes" }
  );

  // FIX: This broadcast was missing! Now other users will instantly see the like update.
  emitToPost(postId, "post_liked", { postId, likesCount: updated.likes.length, liked: !alreadyLiked, userId });

  if (!alreadyLiked) {
    try {
      await notifyUser({ recipientId: post.author, senderId: userId, type: "like", postId });
    } catch {
      // Notification delivery is best-effort — never fail a successful like.
    }
  }

  return { liked: !alreadyLiked, likesCount: updated.likes.length };
};

export const deletePost = async ({ postId, userId, userRole }) => {
  if (!mongoose.Types.ObjectId.isValid(postId)) throw new ApiError(400, "Invalid post ID");

  const post = await Post.findById(postId).select("author mediaUrls");
  if (!post) throw new ApiError(404, "Post not found");

  if (post.author.toString() !== userId && userRole !== "admin") {
    throw new ApiError(403, "You are not authorized to delete this post");
  }

  if (post.mediaUrls.length > 0) {
    await Promise.allSettled(post.mediaUrls.map(({ publicId, resourceType }) => deleteFromCloudinary(publicId, resourceType)));
  }

  await post.deleteOne();
};