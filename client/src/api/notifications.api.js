import axiosInstance from "./axiosInstance";

/**
 * Notification API functions.
 * All routed through axiosInstance (Bearer token + auto-refresh).
 */

/**
 * Fetches a paginated page of the caller's notifications.
 *
 * @param {object} params
 * @param {number} params.pageParam  - Page number from useInfiniteQuery
 * @param {number} [params.limit=10]
 * @returns {Promise<{ notifications: object[], unreadCount: number, pagination: object }>}
 */
export const fetchNotifications = async ({ pageParam = 1, limit = 10 }) => {
  const { data } = await axiosInstance.get("/notifications", {
    params: { page: pageParam, limit },
  });
  return data.data; // unwrap ApiResponse envelope
};

/**
 * Fetches just the unread count, for the navbar badge.
 *
 * @returns {Promise<{ unreadCount: number }>}
 */
export const fetchUnreadCount = async () => {
  const { data } = await axiosInstance.get("/notifications/unread-count");
  return data.data;
};

/**
 * Marks a single notification as read.
 *
 * @param {string} notificationId
 * @returns {Promise<object>}
 */
export const markNotificationRead = async (notificationId) => {
  const { data } = await axiosInstance.patch(`/notifications/${notificationId}/read`);
  return data.data;
};

/**
 * Marks every unread notification for the caller as read.
 *
 * @returns {Promise<void>}
 */
export const markAllNotificationsRead = async () => {
  await axiosInstance.patch("/notifications/read-all");
};
