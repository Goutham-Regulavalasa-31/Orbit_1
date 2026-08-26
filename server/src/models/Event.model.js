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
 * Event Schema — campus events with RSVP.
 *
 * Design decisions:
 * - `attendees` stores User ObjectIds directly (same pattern as Post.likes /
 *   Club.members), so attendeesCount/isAttending can be computed via
 *   $size/$in in aggregation without a join.
 * - The creator is added to `attendees` on creation (consistent with how
 *   Club auto-adds its creator to `members`), but — unlike a club's
 *   creator, who is barred from leaving — there's no restriction on the
 *   creator un-RSVPing: attending is just presence at the event, not
 *   ownership of it.
 */
const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    date: {
      type: Date,
      required: [true, "Event date is required"],
      validate: {
        validator: (value) => value > new Date(),
        message: "Event date must be in the future",
      },
    },

    location: {
      type: String,
      required: [true, "Event location is required"],
      trim: true,
      minlength: [3, "Location must be at least 3 characters"],
      maxlength: [150, "Location cannot exceed 150 characters"],
    },

    coverImage: {
      type: coverImageSchema,
      default: null,
    },

    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Event must have a creator"],
      index: true,
    },

    attendees: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Primary access pattern: paginated upcoming events sorted by date
eventSchema.index({ date: 1 });

// ── Virtual: attendeesCount (for non-aggregation use cases) ───────────────────
eventSchema.virtual("attendeesCount").get(function () {
  return this.attendees.length;
});

export const Event = mongoose.model("Event", eventSchema);
