import mongoose, { Schema } from "mongoose";

/**
 * Post Schema — the core content unit for the Orbit social feed.
 *
 * Design decisions:
 * - `likes` stores User ObjectIds directly (array of refs) so we can:
 *     a) compute likesCount via $size in a single aggregation stage
 *     b) check isLikedByCurrentUser via $in without a join
 * - `commentsCount` is a denormalized counter; updated by the comments
 *   controller when comments are added/removed (avoids expensive $count
 *   lookups on the hot feed query path).
 * - Compound index on (createdAt: -1, _id: -1) is the canonical MongoDB
 *   pattern for efficient reverse-chronological paginated feeds.
 */
const postSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Post must have an author"],
      index: true,
    },

    caption: {
      type: String,
      required: [true, "Caption is required"],
      trim: true,
      minlength: [1, "Caption cannot be empty"],
      maxlength: [500, "Caption cannot exceed 500 characters"],
    },

    mediaUrls: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String, required: true }, // Cloudinary public_id for deletion
          resourceType: {
            type: String,
            enum: ["image", "raw"], // raw = PDF in Cloudinary
            required: true,
          },
        },
      ],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: "A post can have at most 5 media files",
      },
    },

    postType: {
      type: String,
      enum: {
        values: ["general", "note", "doubt"],
        message: "{VALUE} is not a valid post type",
      },
      default: "general",
      index: true, // filtered in feed queries
    },

    likes: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },

    commentsCount: {
      type: Number,
      default: 0,
      min: [0, "commentsCount cannot be negative"],
    },

    tags: {
      type: [{ type: String, trim: true, lowercase: true }],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: "A post can have at most 10 tags",
      },
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Primary sort index for the reverse-chronological feed
postSchema.index({ createdAt: -1, _id: -1 });

// Compound index to support author-filtered feed (profile page, future)
postSchema.index({ author: 1, createdAt: -1 });

// ── Virtual: likesCount (for non-aggregation use cases) ───────────────────────
postSchema.virtual("likesCount").get(function () {
  return this.likes.length;
});

export const Post = mongoose.model("Post", postSchema);
