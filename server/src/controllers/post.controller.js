import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as postService from "../services/post.service.js";
import { emitToPost } from "../socket/socket.js";

// ── Validation constants ──────────────────────────────────────────────────────
const VALID_POST_TYPES = new Set(["general", "note", "doubt"]);
const MAX_FEED_LIMIT   = 20;

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/v1/posts
 * Protected — requires valid access token.
 * Accepts multipart/form-data with optional media files.
 *
 * Body fields:
 *  - caption  {string}  required
 *  - postType {string}  optional ("general" | "note" | "doubt")
 *  - tags     {string}  optional, comma-separated
 * Files:
 *  - media    {File[]}  optional, max 5 (images + PDFs)
 */
export const createPost = asyncHandler(async (req, res) => {
  const { caption, postType, tags, clubId } = req.body;

  // ── Input validation ─────────────────────────────────────────────────────
  if (!caption || caption.trim().length === 0) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Caption is required",
      errors: [{ field: "caption", message: "Caption cannot be empty" }],
      data: null,
    });
  }

  if (caption.trim().length > 500) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Caption is too long",
      errors: [{ field: "caption", message: "Caption cannot exceed 500 characters" }],
      data: null,
    });
  }

  if (postType && !VALID_POST_TYPES.has(postType)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Invalid post type",
      errors: [{ field: "postType", message: "Must be 'general', 'note', or 'doubt'" }],
      data: null,
    });
  }

  // ── Parse tags: "react,js,orbit" → ["react", "js", "orbit"] ─────────────
  const parsedTags = tags
    ? tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0)
        .slice(0, 10)
    : [];

  const post = await postService.createPost({
    authorId: req.user._id.toString(),
    caption:  caption.trim(),
    postType: postType ?? "general",
    tags:     parsedTags,
    files:    req.files ?? [],
    clubId:   clubId || null,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, post, "Post created successfully"));
});

/**
 * GET /api/v1/posts/feed
 * Protected — requires valid access token.
 *
 * Query params:
 *  - page     {number}  default 1
 *  - limit    {number}  default 10, max 20
 *  - postType {string}  optional filter
 */
export const getFeed = asyncHandler(async (req, res) => {
  const page     = Math.max(1, parseInt(req.query.page)  || 1);
  const limit    = Math.min(MAX_FEED_LIMIT, Math.max(1, parseInt(req.query.limit) || 10));
  const postType = req.query.postType;

  // Validate postType if provided
  if (postType && !VALID_POST_TYPES.has(postType)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: `Invalid postType filter. Must be one of: ${[...VALID_POST_TYPES].join(", ")}`,
      errors: [],
      data: null,
    });
  }

  const data = await postService.getFeed({
    userId:   req.user._id.toString(),
    page,
    limit,
    postType: postType || undefined,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Feed fetched successfully"));
});

/**
 * GET /api/v1/posts/:id
 * Protected — requires valid access token.
 */
export const getPostById = asyncHandler(async (req, res) => {
  const post = await postService.getPostById({
    postId: req.params.id,
    userId: req.user._id.toString(),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post fetched successfully"));
});

/**
 * PATCH /api/v1/posts/:id/like
 * Protected — requires valid access token.
 * Idempotent toggle: liking a liked post unlikes it.
 */
export const toggleLike = asyncHandler(async (req, res) => {
  const result = await postService.toggleLike({
    postId: req.params.id,
    userId: req.user._id.toString(),
  });

  // ── Broadcast real-time update to all clients watching this post ─────────
  // emitToPost is safe to call even when no clients are in the room.
  try {
    emitToPost(req.params.id, "post_liked", {
      postId:     req.params.id,
      likesCount: result.likesCount,
      liked:      result.liked,
      userId:     req.user._id.toString(),
    });
  } catch {
    // Socket.io may not be initialized in test environments — do not fail the HTTP response
  }

  const message = result.liked ? "Post liked" : "Post unliked";

  return res
    .status(200)
    .json(new ApiResponse(200, result, message));
});

/**
 * POST /api/v1/posts/:id/summarize
 * Protected — requires valid access token.
 * Notes only. Serves a cached summary (see AI_SUMMARY_TTL_MS in
 * post.service.js) unless ?refresh=true forces regeneration.
 */
export const summarizePost = asyncHandler(async (req, res) => {
  const forceRefresh = req.query.refresh === "true";

  const data = await postService.summarizePost({
    postId: req.params.id,
    forceRefresh,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, data, data.cached ? "Summary retrieved from cache" : "Summary generated successfully"));
});

/**
 * DELETE /api/v1/posts/:id
 * Protected — requires valid access token.
 * Only the post author or an admin can delete a post.
 */
export const deletePost = asyncHandler(async (req, res) => {
  await postService.deletePost({
    postId:   req.params.id,
    userId:   req.user._id.toString(),
    userRole: req.user.role,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Post deleted successfully"));
});
