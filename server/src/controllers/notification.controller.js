import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as notificationService from "../services/notification.service.js";

// ── Validation constants ──────────────────────────────────────────────────────
const MAX_NOTIFICATION_LIMIT = 20;

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/v1/notifications
 * Protected — requires valid access token.
 *
 * Query params:
 *  - page  {number} default 1
 *  - limit {number} default 10, max 20
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(MAX_NOTIFICATION_LIMIT, Math.max(1, parseInt(req.query.limit) || 10));

  const data = await notificationService.getNotifications({
    userId: req.user._id.toString(),
    page,
    limit,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Notifications fetched successfully"));
});

/**
 * GET /api/v1/notifications/unread-count
 * Protected — cheap poll for the navbar badge.
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const data = await notificationService.getUnreadCount(req.user._id.toString());

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Unread count fetched successfully"));
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Protected — marks a single notification (owned by the caller) as read.
 */
export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead({
    notificationId: req.params.id,
    userId: req.user._id.toString(),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
});

/**
 * PATCH /api/v1/notifications/read-all
 * Protected — marks every unread notification for the caller as read.
 */
export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id.toString());

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "All notifications marked as read"));
});
