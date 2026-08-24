import axiosInstance from "./axiosInstance";

/**
 * Direct message API functions.
 * All routed through axiosInstance (Bearer token + auto-refresh).
 */

/**
 * Fetches a paginated page of the caller's inbox (conversation list).
 *
 * @param {object} params
 * @param {number} params.pageParam  - Page number from useInfiniteQuery
 * @param {number} [params.limit=20]
 * @returns {Promise<{ conversations: object[], pagination: object }>}
 */
export const fetchConversations = async ({ pageParam = 1, limit = 20 } = {}) => {
  const { data } = await axiosInstance.get("/messages/conversations", {
    params: { page: pageParam, limit },
  });
  return data.data; // unwrap ApiResponse envelope
};

/**
 * Fetches just the total unread message count, for the navbar badge.
 *
 * @returns {Promise<{ unreadCount: number }>}
 */
export const fetchUnreadMessagesCount = async () => {
  const { data } = await axiosInstance.get("/messages/unread-count");
  return data.data;
};

/**
 * Fetches a paginated page of chat history with a specific user
 * (newest-first — see useMessages.js for how pages are reversed for display).
 * Marks that user's messages as read as a server-side side effect.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {number} params.pageParam
 * @param {number} [params.limit=20]
 * @returns {Promise<{ messages: object[], otherUser: object, pagination: object }>}
 */
export const fetchMessages = async ({ userId, pageParam = 1, limit = 20 }) => {
  const { data } = await axiosInstance.get(`/messages/${userId}`, {
    params: { page: pageParam, limit },
  });
  return data.data;
};

/**
 * Sends a direct message to a specific user.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.text
 * @returns {Promise<object>} The created message document
 */
export const sendMessage = async ({ userId, text }) => {
  const { data } = await axiosInstance.post(`/messages/${userId}`, { text });
  return data.data;
};
