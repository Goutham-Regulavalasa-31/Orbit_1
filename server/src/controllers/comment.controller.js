import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as commentService from "../services/comment.service.js";

// ── Validation constants ──────────────────────────────────────────────────────
const MAX_COMMENT_LIMIT = 20;
const MAX_COMMENT_LENGTH = 1000;

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/v1/posts/:postId/comments
 * Returns a paginated 2-level threaded comment tree.
 *
 * Query params:
 *  - page  {number} default 1
 *  - limit {number} default 10, max 20
 */
export const getComments = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(
    MAX_COMMENT_LIMIT,
    Math.max(1, parseInt(req.query.limit) || 10)
  );

  const data = await commentService.getComments({
    postId: req.params.postId,
    userId: req.user._id.toString(),
    page,
    limit,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Comments fetched successfully"));
});

/**
 * POST /api/v1/posts/:postId/comments
 * Creates a top-level comment or a reply.
 *
 * Body:
 *  - text            {string}   required
 *  - parentCommentId {string}   optional (null = top-level)
 */
export const createComment = asyncHandler(async (req, res) => {
  const { text, parentCommentId } = req.body;

  // ── Input validation ─────────────────────────────────────────────────────
  if (!text || text.trim().length === 0) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Comment text is required",
      errors: [{ field: "text", message: "Comment cannot be empty" }],
      data: null,
    });
  }

  if (text.trim().length > MAX_COMMENT_LENGTH) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Comment is too long",
      errors: [
        {
          field: "text",
          message: `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters`,
        },
      ],
      data: null,
    });
  }

  const comment = await commentService.createComment({
    postId: req.params.postId,
    authorId: req.user._id.toString(),
    text: text.trim(),
    parentCommentId: parentCommentId ?? null,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment created successfully"));
});

/**
 * PATCH /api/v1/posts/:postId/comments/:commentId/like
 * Idempotent like toggle — no request body required.
 */
export const toggleCommentLike = asyncHandler(async (req, res) => {
  const result = await commentService.toggleCommentLike({
    commentId: req.params.commentId,
    postId: req.params.postId,
    userId: req.user._id.toString(),
  });

  const message = result.liked ? "Comment liked" : "Comment unliked";
  return res.status(200).json(new ApiResponse(200, result, message));
});

/**
 * DELETE /api/v1/posts/:postId/comments/:commentId
 * Author or admin only. Cascades to delete all child replies.
 */
export const deleteComment = asyncHandler(async (req, res) => {
  await commentService.deleteComment({
    commentId: req.params.commentId,
    postId: req.params.postId,
    userId: req.user._id.toString(),
    userRole: req.user.role,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});
