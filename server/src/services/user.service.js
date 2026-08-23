import mongoose from "mongoose";
import { User } from "../models/User.model.js";
import { Post } from "../models/Post.model.js";
import { ApiError } from "../utils/ApiError.js";

const AUTHOR_PROJECTION = { _id: 1, name: 1, avatar: 1, department: 1, role: 1 };

const buildPostEnrichment = (viewerId) => [
  {
    $lookup: {
      from: "users",
      localField: "author",
      foreignField: "_id",
      as: "author",
      pipeline: [{ $project: AUTHOR_PROJECTION }],
    },
  },
  { $unwind: "$author" },
  {
    $addFields: {
      likesCount: { $size: "$likes" },
      isLikedByCurrentUser: { $in: [new mongoose.Types.ObjectId(viewerId), "$likes"] },
    },
  },
  { $project: { likes: 0, __v: 0 } },
];

export const getUserProfile = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new ApiError(400, "Invalid user ID");

  const user = await User.findById(userId).select("_id name avatar department bio role createdAt");
  if (!user) throw new ApiError(404, "User not found");

  const postsCount = await Post.countDocuments({ author: userId });

  return { ...user.toObject(), postsCount };
};

export const getUserPosts = async ({ userId, viewerId, page, limit }) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new ApiError(400, "Invalid user ID");

  const userExists = await User.exists({ _id: userId });
  if (!userExists) throw new ApiError(404, "User not found");

  const skip = (page - 1) * limit;
  const authorObjId = new mongoose.Types.ObjectId(userId);

  const pipeline = [
    { $match: { author: authorObjId } },
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $facet: {
        posts: [{ $skip: skip }, { $limit: limit }, ...buildPostEnrichment(viewerId)],
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
