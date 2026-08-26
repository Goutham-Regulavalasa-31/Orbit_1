import mongoose from "mongoose";
import { Event } from "../models/Event.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const EVENT_COVER_FOLDER = "orbit/events/covers";
const PUBLIC_PROJECTION = { _id: 1, name: 1, avatar: 1, department: 1, role: 1 };

const buildEventEnrichment = (userId) => {
  const userObjId = new mongoose.Types.ObjectId(userId);
  return [
    {
      $lookup: {
        from: "users",
        localField: "creator",
        foreignField: "_id",
        as: "creator",
        pipeline: [{ $project: PUBLIC_PROJECTION }],
      },
    },
    { $unwind: "$creator" },
    {
      $addFields: {
        attendeesCount: { $size: "$attendees" },
        isAttending: { $in: [userObjId, "$attendees"] },
        isCreator: { $eq: ["$creator._id", userObjId] },
      },
    },
    { $project: { attendees: 0, __v: 0 } },
  ];
};

export const createEvent = async ({ creatorId, title, description, date, location, coverFile }) => {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) throw new ApiError(400, "Invalid event date");
  if (parsedDate <= new Date()) throw new ApiError(400, "Event date must be in the future");

  let coverImage = null;

  if (coverFile) {
    if (!coverFile.mimetype.startsWith("image/")) {
      throw new ApiError(400, "Cover image must be an image file");
    }
    try {
      const uploaded = await uploadToCloudinary(coverFile.buffer, coverFile.mimetype, EVENT_COVER_FOLDER);
      coverImage = { url: uploaded.url, publicId: uploaded.publicId };
    } catch (error) {
      throw new ApiError(500, `Cover image upload failed: ${error.message}`);
    }
  }

  const event = await Event.create({
    title,
    description,
    date: parsedDate,
    location,
    coverImage,
    creator: creatorId,
    attendees: [creatorId],
  });

  const [enriched] = await Event.aggregate([
    { $match: { _id: event._id } },
    ...buildEventEnrichment(creatorId),
  ]);

  return enriched;
};

export const getEvents = async ({ userId, page, limit }) => {
  const skip = (page - 1) * limit;

  const pipeline = [
    { $match: { date: { $gte: new Date() } } },
    { $sort: { date: 1, _id: 1 } },
    {
      $facet: {
        events: [{ $skip: skip }, { $limit: limit }, ...buildEventEnrichment(userId)],
        totalCount: [{ $count: "count" }],
      },
    },
    { $addFields: { totalEvents: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] } } },
    { $project: { totalCount: 0 } },
  ];

  const [result] = await Event.aggregate(pipeline);
  const totalEvents = result?.totalEvents ?? 0;
  const totalPages = Math.ceil(totalEvents / limit);

  return {
    events: result?.events ?? [],
    pagination: { currentPage: page, totalPages, totalEvents, hasNextPage: page < totalPages, hasPrevPage: page > 1, limit },
  };
};

export const getEventById = async ({ eventId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(eventId)) throw new ApiError(400, "Invalid event ID");

  const [event] = await Event.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(eventId) } },
    ...buildEventEnrichment(userId),
  ]);

  if (!event) throw new ApiError(404, "Event not found");
  return event;
};

export const toggleRSVP = async ({ eventId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(eventId)) throw new ApiError(400, "Invalid event ID");

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const event = await Event.findById(eventId).select("attendees");
  if (!event) throw new ApiError(404, "Event not found");

  const isAttending = event.attendees.some((id) => id.equals(userObjectId));

  const updated = await Event.findByIdAndUpdate(
    eventId,
    isAttending ? { $pull: { attendees: userObjectId } } : { $addToSet: { attendees: userObjectId } },
    { new: true, select: "attendees" }
  );

  return { attending: !isAttending, attendeesCount: updated.attendees.length };
};
