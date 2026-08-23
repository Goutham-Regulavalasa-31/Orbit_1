import axiosInstance from "./axiosInstance";

/**
 * Comments API functions.
 * All routed through axiosInstance (Bearer token + auto-refresh).
 */

/**
 * Fetches a paginated, threaded comment tree for a post.
 *
 * @param {object} params
 * @param {string} params.postId
 * @param {number} params.pageParam  - Page number from useInfiniteQuery
 * @param {number} [params.limit=10]
 * @returns {Promise<{ comments: object[], pagination: object }>}
 */
export const fetchComments = async ({ postId, pageParam = 1, limit = 10 }) => {
  const { data } = await axiosInstance.get(`/posts/${postId}/comments`, {
    params: { page: pageParam, limit },
  });
  return data.data; // unwrap ApiResponse envelope
};

/**
 * Creates a new comment (top-level or reply).
 *
 * @param {object} params
 * @param {string} params.postId
 * @param {string} params.text
 * @param {string | null} [params.parentCommentId]
 * @returns {Promise<object>} Enriched comment document
 */
export const createComment = async ({ postId, text, parentCommentId }) => {
  const { data } = await axiosInstance.post(`/posts/${postId}/comments`, {
    text,
    parentCommentId: parentCommentId ?? null,
  });
  return data.data;
};

/**
 * Toggles the like status of a comment.
 *
 * @param {object} params
 * @param {string} params.postId
 * @param {string} params.commentId
 * @returns {Promise<{ liked: boolean, likesCount: number }>}
 */
export const toggleCommentLike = async ({ postId, commentId }) => {
  const { data } = await axiosInstance.patch(
    `/posts/${postId}/comments/${commentId}/like`
  );
  return data.data;
};

/**
 * Deletes a comment (and its descendants) by ID.
 *
 * @param {object} params
 * @param {string} params.postId
 * @param {string} params.commentId
 * @returns {Promise<void>}
 */
export const deleteComment = async ({ postId, commentId }) => {
  await axiosInstance.delete(`/posts/${postId}/comments/${commentId}`);
};
