import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as userService from "../services/user.service.js";

// ── Validation constants ──────────────────────────────────────────────────────
const MAX_POSTS_LIMIT = 20;

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/v1/users/:userId
 * Protected — requires valid access token.
 * Returns the public profile fields for any user.
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getUserProfile(req.params.userId);

  return res
    .status(200)
    .json(new ApiResponse(200, profile, "Profile fetched successfully"));
});

/**
 * GET /api/v1/users/:userId/posts
 * Protected — requires valid access token.
 *
 * Query params:
 *  - page  {number} default 1
 *  - limit {number} default 10, max 20
 */
export const getUserPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(MAX_POSTS_LIMIT, Math.max(1, parseInt(req.query.limit) || 10));

  const data = await userService.getUserPosts({
    userId: req.params.userId,
    viewerId: req.user._id.toString(),
    page,
    limit,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, data, "User posts fetched successfully"));
});
