import mongoose, { Schema } from "mongoose";

// Single-nested (not array) subdocument — {_id:false} keeps it a plain
// value object instead of getting its own auto-generated ObjectId.
const coverImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

/**
 * Club Schema — student clubs / study groups.
 *
 * Design decisions:
 * - `members` stores User ObjectIds directly (same pattern as Post.likes),
 *   so membersCount/isMember can be computed via $size/$in in aggregation
 *   without a join.
 * - The creator is added to `members` on creation and is barred from
 *   leaving (see club.service.js's toggleMembership) — no ownership
 *   transfer flow exists yet, so an owner-less club would be unmanageable.
 */
const clubSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Club name is required"],
      trim: true,
      minlength: [3, "Club name must be at least 3 characters"],
      maxlength: [60, "Club name cannot exceed 60 characters"],
      unique: true,
    },

    description: {
      type: String,
      required: [true, "Club description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    coverImage: {
      type: coverImageSchema,
      default: null,
    },

    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Club must have a creator"],
      index: true,
    },

    members: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },

    tags: {
      type: [{ type: String, trim: true, lowercase: true }],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: "A club can have at most 10 tags",
      },
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
clubSchema.index({ createdAt: -1 });
clubSchema.index({ tags: 1 });

// ── Virtual: membersCount (for non-aggregation use cases) ─────────────────────
clubSchema.virtual("membersCount").get(function () {
  return this.members.length;
});

export const Club = mongoose.model("Club", clubSchema);
