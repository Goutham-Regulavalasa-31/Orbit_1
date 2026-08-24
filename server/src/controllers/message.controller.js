import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as messageService from "../services/message.service.js";

// ── Validation constants ──────────────────────────────────────────────────────
const MAX_LIMIT = 30;
const MAX_TEXT_LENGTH = 2000;

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/v1/messages/conversations
 * Protected — requires valid access token.
 *
 * Query params:
 *  - page  {number} default 1
 *  - limit {number} default 20, max 30
 */
export const getConversations = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit) || 20));

  const data = await messageService.getConversations({
    viewerId: req.user._id.toString(),
    page,
    limit,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Conversations fetched successfully"));
});

/**
 * GET /api/v1/messages/unread-count
 * Protected — cheap poll for the navbar badge.
 */
export const getUnreadMessagesCount = asyncHandler(async (req, res) => {
  const data = await messageService.getTotalUnreadCount(req.user._id.toString());

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Unread message count fetched successfully"));
});

/**
 * GET /api/v1/messages/:userId
 * Protected — requires valid access token.
 * Fetches (and marks read) the caller's chat history with :userId.
 *
 * Query params:
 *  - page  {number} default 1
 *  - limit {number} default 20, max 30
 */
export const getMessages = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit) || 20));

  const data = await messageService.getMessages({
    viewerId: req.user._id.toString(),
    otherUserId: req.params.userId,
    page,
    limit,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Messages fetched successfully"));
});

/**
 * POST /api/v1/messages/:userId
 * Protected — requires valid access token.
 *
 * Body fields:
 *  - text {string} required, 1-2000 chars
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Message text is required",
      errors: [{ field: "text", message: "Message cannot be empty" }],
      data: null,
    });
  }

  if (text.trim().length > MAX_TEXT_LENGTH) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Message is too long",
      errors: [{ field: "text", message: `Message cannot exceed ${MAX_TEXT_LENGTH} characters` }],
      data: null,
    });
  }

  const message = await messageService.sendMessage({
    senderId: req.user._id.toString(),
    recipientId: req.params.userId,
    text: text.trim(),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, message, "Message sent successfully"));
});
