import mongoose, { Schema } from "mongoose";

/**
 * Comment Schema — supports infinite nested threading via parentCommentId.
 *
 * Design decisions:
 * - `parentCommentId: null`  → top-level comment on the post
 * - `parentCommentId: <id>`  → reply to another comment (any depth)
 * - `likes` stores User ObjectIds for the same reasons as Post.likes
 * - Replies are NOT embedded (subdocs) to avoid unbounded document growth;
 *   instead they are queried via a $lookup self-join in the aggregation layer.
 * - Compound index on (postId, parentCommentId, createdAt) drives the two main
 *   query patterns:
 *     1. Get all top-level comments for a post   → postId + parentCommentId:null
 *     2. Get all replies for a comment           → postId + parentCommentId:<id>
 */
const commentSchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "Comment must be associated with a post"],
      index: true,
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Comment must have an author"],
    },

    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },

    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      // null = top-level comment; ObjectId = reply to another comment
    },

    likes: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

// Primary access pattern: all comments (top-level or replies) for a given post
commentSchema.index({ postId: 1, parentCommentId: 1, createdAt: 1 });

// Secondary: all comments by a given author (profile page, moderation)
commentSchema.index({ author: 1, createdAt: -1 });

// ── Virtual: likesCount ───────────────────────────────────────────────────────
commentSchema.virtual("likesCount").get(function () {
  return this.likes.length;
});

export const Comment = mongoose.model("Comment", commentSchema);
