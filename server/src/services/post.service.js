import mongoose from "mongoose";
import { Post } from "../models/Post.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

// ── Aggregation helpers ───────────────────────────────────────────────────────

/**
 * Builds the shared $lookup + $project pipeline stages that enrich a post
 * document with author profile, likesCount, and isLikedByCurrentUser.
 *
 * Extracted to a function so it can be reused in both getFeed and getPostById
 * without duplication.
 *
 * @param {string|mongoose.Types.ObjectId} userId - The requesting user's _id
 * @returns {Array} - Array of aggregation pipeline stages
 */
const buildEnrichmentPipeline = (userId) => [
  // ── Populate author (equivalent to .populate('author') but single-pass) ──
  {
    $lookup: {
      from: "users",
      localField: "author",
      foreignField: "_id",
      as: "author",
      pipeline: [
        {
          $project: {
            _id: 1,
            name: 1,
            avatar: 1,
            department: 1,
            role: 1,
          },
        },
      ],
    },
  },
  // $lookup returns an array — unwind to a single object
  { $unwind: "$author" },

  // ── Computed fields ───────────────────────────────────────────────────────
  {
    $addFields: {
      likesCount: { $size: "$likes" },
      isLikedByCurrentUser: {
        $in: [new mongoose.Types.ObjectId(userId), "$likes"],
      },
    },
  },

  // ── Project: strip internal `likes` array from the response ──────────────
  // The client only needs likesCount + isLikedByCurrentUser, not the raw array
  {
    $project: {
      likes: 0,          // omit raw array (PII-sensitive: exposes all likers)
      __v: 0,
    },
  },
];

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Creates a new post with optional Cloudinary media uploads.
 *
 * @param {{ authorId: string, caption: string, postType: string, tags: string[], files: Express.Multer.File[] }}
 * @returns {Promise<object>} Enriched post document
 */
export const createPost = async ({ authorId, caption, postType, tags, files }) => {
  // ── Upload media concurrently ────────────────────────────────────────────
  let mediaUrls = [];

  if (files && files.length > 0) {
    try {
      const uploads = files.map((file) =>
        uploadToCloudinary(file.buffer, file.mimetype)
      );
      mediaUrls = await Promise.all(uploads);
    } catch (error) {
      throw new ApiError(500, `Media upload failed: ${error.message}`);
    }
  }

  // ── Persist post ─────────────────────────────────────────────────────────
  const post = await Post.create({
    author: authorId,
    caption,
    postType: postType ?? "general",
    tags: tags ?? [],
    mediaUrls,
  });

  // ── Return enriched document (single aggregation) ────────────────────────
  const [enriched] = await Post.aggregate([
    { $match: { _id: post._id } },
    ...buildEnrichmentPipeline(authorId),
  ]);

  return enriched;
};

/**
 * Fetches the paginated social feed using a single $facet aggregation.
 *
 * The $facet stage runs two parallel sub-pipelines on the same dataset:
 *  1. `posts`      — paginated, enriched documents
 *  2. `totalCount` — a simple $count
 *
 * This eliminates the need for a separate countDocuments() round-trip.
 *
 * @param {{ userId: string, page: number, limit: number, postType?: string }}
 * @returns {Promise<{ posts: object[], pagination: object }>}
 */
export const getFeed = async ({ userId, page, limit, postType }) => {
  const skip = (page - 1) * limit;

  // ── Optional postType filter ─────────────────────────────────────────────
  const matchStage = postType ? { $match: { postType } } : { $match: {} };

  const pipeline = [
    matchStage,
    { $sort: { createdAt: -1, _id: -1 } }, // newest first, _id as tiebreaker

    // ── $facet: parallel sub-pipelines ──────────────────────────────────
    {
      $facet: {
        posts: [
          { $skip: skip },
          { $limit: limit },
          ...buildEnrichmentPipeline(userId),
        ],
        totalCount: [{ $count: "count" }],
      },
    },

    // ── Flatten totalCount from array to scalar ──────────────────────────
    {
      $addFields: {
        totalPosts: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] },
      },
    },
    { $project: { totalCount: 0 } }, // remove raw array
  ];

  const [result] = await Post.aggregate(pipeline);

  const totalPosts  = result?.totalPosts ?? 0;
  const totalPages  = Math.ceil(totalPosts / limit);

  return {
    posts: result?.posts ?? [],
    pagination: {
      currentPage:  page,
      totalPages,
      totalPosts,
      hasNextPage:  page < totalPages,
      hasPrevPage:  page > 1,
      limit,
    },
  };
};

/**
 * Fetches a single post with full enrichment.
 *
 * @param {{ postId: string, userId: string }}
 * @returns {Promise<object>}
 */
export const getPostById = async ({ postId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  const [post] = await Post.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(postId) } },
    ...buildEnrichmentPipeline(userId),
  ]);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  return post;
};

/**
 * Toggles the like status for a post atomically.
 *
 * Uses $addToSet / $pull with findOneAndUpdate to avoid race conditions
 * from concurrent like/unlike requests. The update returns the new document
 * so we can compute the accurate count without a second query.
 *
 * @param {{ postId: string, userId: string }}
 * @returns {Promise<{ liked: boolean, likesCount: number }>}
 */
export const toggleLike = async ({ postId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Check current like state
  const post = await Post.findById(postId).select("likes");
  if (!post) throw new ApiError(404, "Post not found");

  const alreadyLiked = post.likes.some((id) => id.equals(userObjectId));

  // Atomic update — $addToSet is idempotent; $pull removes if exists
  const updated = await Post.findByIdAndUpdate(
    postId,
    alreadyLiked
      ? { $pull: { likes: userObjectId } }
      : { $addToSet: { likes: userObjectId } },
    { new: true, select: "likes" }
  );

  return {
    liked:      !alreadyLiked,
    likesCount: updated.likes.length,
  };
};

/**
 * Deletes a post and cleans up its Cloudinary media assets.
 * Only the post author or an admin can delete a post.
 *
 * @param {{ postId: string, userId: string, userRole: string }}
 */
export const deletePost = async ({ postId, userId, userRole }) => {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  const post = await Post.findById(postId).select("author mediaUrls");
  if (!post) throw new ApiError(404, "Post not found");

  const isAuthor = post.author.toString() === userId;
  const isAdmin  = userRole === "admin";

  if (!isAuthor && !isAdmin) {
    throw new ApiError(403, "You are not authorized to delete this post");
  }

  // ── Delete Cloudinary assets concurrently ────────────────────────────────
  if (post.mediaUrls.length > 0) {
    await Promise.allSettled(
      post.mediaUrls.map(({ publicId, resourceType }) =>
        deleteFromCloudinary(publicId, resourceType)
      )
    );
    // allSettled: even if some deletions fail, we still remove the DB record
  }

  await post.deleteOne();
};
