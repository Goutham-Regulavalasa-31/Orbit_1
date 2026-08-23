import axiosInstance from "./axiosInstance";

/**
 * User profile API functions.
 * All routed through axiosInstance (Bearer token + auto-refresh).
 */

/**
 * Fetches a user's public profile.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export const fetchUserProfile = async (userId) => {
  const { data } = await axiosInstance.get(`/users/${userId}`);
  return data.data; // unwrap ApiResponse envelope
};

/**
 * Fetches a paginated page of a user's post history.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {number} params.pageParam  - Page number from useInfiniteQuery
 * @param {number} [params.limit=10]
 * @returns {Promise<{ posts: object[], pagination: object }>}
 */
export const fetchUserPosts = async ({ userId, pageParam = 1, limit = 10 }) => {
  const { data } = await axiosInstance.get(`/users/${userId}/posts`, {
    params: { page: pageParam, limit },
  });
  return data.data;
};
