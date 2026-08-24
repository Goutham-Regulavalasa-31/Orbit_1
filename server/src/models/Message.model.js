import mongoose, { Schema } from "mongoose";

/**
 * Message Schema — a single direct message between two users.
 *
 * Design decisions:
 * - No `conversationId` field: conversations are looked up by participant
 *   pair (see Conversation.model.js), keeping this schema exactly to spec
 *   (sender, recipient, text, read) while Conversation.service still
 *   supports efficient bidirectional history queries via the indexes below.
 */
const messageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Message must have a sender"],
      index: true,
    },

    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Message must have a recipient"],
      index: true,
    },

    text: {
      type: String,
      required: [true, "Message text is required"],
      trim: true,
      minlength: [1, "Message cannot be empty"],
      maxlength: [2000, "Message cannot exceed 2000 characters"],
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
// Bidirectional history lookup: "all messages between A and B" queries both
// (sender:A, recipient:B) and (sender:B, recipient:A) — both directions indexed.
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, sender: 1, createdAt: -1 });

// Fast unread-count lookups
messageSchema.index({ recipient: 1, read: 1 });

export const Message = mongoose.model("Message", messageSchema);
