import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as clubService from "../services/club.service.js";

// ── Validation constants ──────────────────────────────────────────────────────
const MAX_CLUBS_LIMIT = 20;
const MAX_POSTS_LIMIT = 20;

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/v1/clubs
 * Protected — requires valid access token.
 * Accepts multipart/form-data with an optional cover image.
 *
 * Body fields:
 *  - name        {string}  required, 3-60 chars
 *  - description {string}  required, 10-500 chars
 *  - tags        {string}  optional, comma-separated
 * Files:
 *  - coverImage  {File}    optional, image only
 */
export const createClub = asyncHandler(async (req, res) => {
  const { name, description, tags } = req.body;

  if (!name || name.trim().length < 3) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Club name must be at least 3 characters",
      errors: [{ field: "name", message: "Too short" }],
      data: null,
    });
  }

  if (name.trim().length > 60) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Club name is too long",
      errors: [{ field: "name", message: "Cannot exceed 60 characters" }],
      data: null,
    });
  }

  if (!description || description.trim().length < 10) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Club description must be at least 10 characters",
      errors: [{ field: "description", message: "Too short" }],
      data: null,
    });
  }

  const parsedTags = tags
    ? tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0)
        .slice(0, 10)
    : [];

  const club = await clubService.createClub({
    creatorId: req.user._id.toString(),
    name: name.trim(),
    description: description.trim(),
    tags: parsedTags,
    coverFile: req.file ?? null,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, club, "Club created successfully"));
});

/**
 * GET /api/v1/clubs
 * Protected — requires valid access token.
 *
 * Query params:
 *  - page   {number} default 1
 *  - limit  {number} default 12, max 20
 *  - search {string} optional, matches name or tags
 */
export const getClubs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(MAX_CLUBS_LIMIT, Math.max(1, parseInt(req.query.limit) || 12));
  const search = req.query.search?.trim() || undefined;

  const data = await clubService.getClubs({
    userId: req.user._id.toString(),
    page,
    limit,
    search,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Clubs fetched successfully"));
});

/**
 * GET /api/v1/clubs/:id
 * Protected — requires valid access token.
 */
export const getClubById = asyncHandler(async (req, res) => {
  const club = await clubService.getClubById({
    clubId: req.params.id,
    userId: req.user._id.toString(),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, club, "Club fetched successfully"));
});

/**
 * POST /api/v1/clubs/:id/join
 * Protected — requires valid access token.
 * Idempotent toggle: joining a joined club leaves it (except for the creator).
 */
export const toggleMembership = asyncHandler(async (req, res) => {
  const result = await clubService.toggleMembership({
    clubId: req.params.id,
    userId: req.user._id.toString(),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, result.joined ? "Joined club" : "Left club"));
});

/**
 * GET /api/v1/clubs/:id/posts
 * Protected — requires valid access token.
 * Strictly scoped to this club — never mixes with the global feed.
 */
export const getClubPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(MAX_POSTS_LIMIT, Math.max(1, parseInt(req.query.limit) || 10));

  const data = await clubService.getClubPosts({
    clubId: req.params.id,
    userId: req.user._id.toString(),
    page,
    limit,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Club posts fetched successfully"));
});
