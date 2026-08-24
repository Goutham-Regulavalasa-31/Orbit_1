import mongoose, { Schema } from "mongoose";

/**
 * Conversation Schema — the 2-party thread wrapper around a Message stream.
 *
 * Design decisions:
 * - `participants` is always stored in canonical sorted order (see
 *   message.service.js's getOrCreateConversation) so a conversation between
 *   two specific users can be found/created atomically via a single
 *   findOneAndUpdate({participants: [sortedA, sortedB]}, ..., {upsert:true})
 *   — no separate unique index needed (a naive unique index on an array
 *   field would incorrectly forbid the same user from being in more than
 *   one conversation, since multikey unique indexes constrain individual
 *   array elements, not the pair as a whole).
 * - `unreadCount` is directional, not per-user: it always represents unread
 *   messages for whichever participant did *not* send `lastMessage`. See
 *   the detailed note in message.service.js's sendMessage — this keeps the
 *   schema exactly to spec (a single Number) while staying correct for the
 *   2-party case.
 */
const conversationSchema = new Schema(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      required: true,
      validate: {
        validator: (arr) => arr.length === 2,
        message: "A conversation must have exactly 2 participants",
      },
    },

    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    unreadCount: {
      type: Number,
      default: 0,
      min: [0, "unreadCount cannot be negative"],
    },
  },
  {
    timestamps: true, // createdAt + updatedAt — updatedAt drives inbox ordering
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Primary access pattern: "all conversations this user is part of"
conversationSchema.index({ participants: 1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
