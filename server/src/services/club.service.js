import mongoose from "mongoose";
import { Club } from "../models/Club.model.js";
import { Post } from "../models/Post.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const CLUB_COVER_FOLDER = "orbit/clubs/covers";
const PUBLIC_PROJECTION = { _id: 1, name: 1, avatar: 1, department: 1, role: 1 };

const buildClubEnrichment = (userId) => {
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
        membersCount: { $size: "$members" },
        isMember: { $in: [userObjId, "$members"] },
        isCreator: { $eq: ["$creator._id", userObjId] },
      },
    },
    { $project: { members: 0, __v: 0 } },
  ];
};

export const createClub = async ({ creatorId, name, description, tags, coverFile }) => {
  let coverImage = null;

  if (coverFile) {
    if (!coverFile.mimetype.startsWith("image/")) {
      throw new ApiError(400, "Cover image must be an image file");
    }
    try {
      const uploaded = await uploadToCloudinary(coverFile.buffer, coverFile.mimetype, CLUB_COVER_FOLDER);
      coverImage = { url: uploaded.url, publicId: uploaded.publicId };
    } catch (error) {
      throw new ApiError(500, `Cover image upload failed: ${error.message}`);
    }
  }

  let club;
  try {
    club = await Club.create({
      name,
      description,
      coverImage,
      creator: creatorId,
      members: [creatorId],
      tags: tags ?? [],
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "A club with this name already exists");
    }
    throw error;
  }

  const [enriched] = await Club.aggregate([
    { $match: { _id: club._id } },
    ...buildClubEnrichment(creatorId),
  ]);

  return enriched;
};

export const getClubs = async ({ userId, page, limit, search }) => {
  const skip = (page - 1) * limit;
  const matchStage = search
    ? { $match: { $or: [{ name: { $regex: search, $options: "i" } }, { tags: { $regex: search, $options: "i" } }] } }
    : { $match: {} };

  const pipeline = [
    matchStage,
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $facet: {
        clubs: [{ $skip: skip }, { $limit: limit }, ...buildClubEnrichment(userId)],
        totalCount: [{ $count: "count" }],
      },
    },
    { $addFields: { totalClubs: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] } } },
    { $project: { totalCount: 0 } },
  ];

  const [result] = await Club.aggregate(pipeline);
  const totalClubs = result?.totalClubs ?? 0;
  const totalPages = Math.ceil(totalClubs / limit);

  return {
    clubs: result?.clubs ?? [],
    pagination: { currentPage: page, totalPages, totalClubs, hasNextPage: page < totalPages, hasPrevPage: page > 1, limit },
  };
};

export const getClubById = async ({ clubId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(clubId)) throw new ApiError(400, "Invalid club ID");

  const [club] = await Club.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(clubId) } },
    ...buildClubEnrichment(userId),
  ]);

  if (!club) throw new ApiError(404, "Club not found");
  return club;
};

export const toggleMembership = async ({ clubId, userId }) => {
  console.log(`[club.service] toggleMembership called — clubId=${clubId} userId=${userId}`);

  if (!mongoose.Types.ObjectId.isValid(clubId)) throw new ApiError(400, "Invalid club ID");

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const club = await Club.findById(clubId).select("creator members");
  if (!club) {
    console.log(`[club.service] toggleMembership — club ${clubId} not found`);
    throw new ApiError(404, "Club not found");
  }

  // String comparison instead of ObjectId#equals() — a defensive safety net
  // against any type-casting edge case between the two, at effectively no cost.
  const isMember = club.members.some((id) => id.toString() === userObjectId.toString());
  console.log(
    `[club.service] toggleMembership — members=[${club.members.map((m) => m.toString()).join(", ")}] isMember=${isMember}`
  );

  if (club.creator.toString() === userObjectId.toString() && isMember) {
    console.log(`[club.service] toggleMembership — blocked: ${userId} is the creator and cannot leave`);
    throw new ApiError(400, "Club creators cannot leave their own club");
  }

  const updated = await Club.findByIdAndUpdate(
    clubId,
    isMember ? { $pull: { members: userObjectId } } : { $addToSet: { members: userObjectId } },
    { new: true, select: "members" }
  );
  console.log(
    `[club.service] toggleMembership — update result: membersCount=${updated?.members.length} joined=${!isMember}`
  );

  return { joined: !isMember, membersCount: updated.members.length };
};

const buildPostEnrichment = (userId) => [
  {
    $lookup: {
      from: "users",
      localField: "author",
      foreignField: "_id",
      as: "author",
      pipeline: [{ $project: PUBLIC_PROJECTION }],
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

export const getClubPosts = async ({ clubId, userId, page, limit }) => {
  if (!mongoose.Types.ObjectId.isValid(clubId)) throw new ApiError(400, "Invalid club ID");

  const clubExists = await Club.exists({ _id: clubId });
  if (!clubExists) throw new ApiError(404, "Club not found");

  const skip = (page - 1) * limit;
  const clubObjId = new mongoose.Types.ObjectId(clubId);

  const pipeline = [
    { $match: { clubId: clubObjId } },
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $facet: {
        posts: [{ $skip: skip }, { $limit: limit }, ...buildPostEnrichment(userId)],
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
