import mongoose, { Schema } from "mongoose";

/**
 * Notification Schema — fan-out events for likes, comments, and replies.
 *
 * Design decisions:
 * - `post` + `comment` are explicit typed refs (not a generic polymorphic
 *   "reference" field) so the client can link straight to the right place
 *   without a type-switch, and both stay indexable.
 * - `comment` is null for post-like notifications; set for comment-like,
 *   new-comment, and reply notifications.
 */
const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification must have a recipient"],
      index: true,
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification must have a sender"],
    },

    type: {
      type: String,
      enum: {
        values: ["like", "comment", "reply"],
        message: "{VALUE} is not a valid notification type",
      },
      required: [true, "Notification must have a type"],
    },

    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "Notification must reference a post"],
    },

    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Primary access pattern: a user's notifications, newest first
notificationSchema.index({ recipient: 1, createdAt: -1 });

// Fast unread-count lookups
notificationSchema.index({ recipient: 1, read: 1 });

export const Notification = mongoose.model("Notification", notificationSchema);
