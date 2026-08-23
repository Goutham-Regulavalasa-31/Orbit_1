import axiosInstance from "./axiosInstance";

/**
 * Post API functions.
 * These are plain async functions (not hooks) — consumed by TanStack Query
 * mutations and queries in the hooks layer.
 *
 * All requests are routed through axiosInstance which:
 *  - Attaches the Bearer access token automatically
 *  - Handles 401 → token refresh → retry transparently
 */

/**
 * Fetches a page of the social feed.
 * Called by useInfiniteQuery in useFeed.js.
 *
 * @param {object} params
 * @param {number} params.pageParam  - Page number (provided by react-query)
 * @param {number} [params.limit=10] - Items per page
 * @param {string} [params.postType] - Optional type filter
 * @returns {Promise<{ posts: object[], pagination: object }>}
 */
export const fetchFeed = async ({ pageParam = 1, limit = 10, postType }) => {
  const params = { page: pageParam, limit };
  if (postType) params.postType = postType;

  const { data } = await axiosInstance.get("/posts/feed", { params });
  return data.data; // unwrap ApiResponse envelope
};

/**
 * Creates a new post with optional media files.
 *
 * @param {FormData} formData - multipart/form-data with caption, postType, tags, media[]
 * @returns {Promise<object>} The created post document
 */
export const createPost = async (formData) => {
  const { data } = await axiosInstance.post("/posts", formData, {
    headers: {
      // Override the default application/json — axiosInstance sets it globally
      "Content-Type": "multipart/form-data",
    },
  });
  return data.data;
};

/**
 * Toggles the like status of a post.
 *
 * @param {string} postId
 * @returns {Promise<{ liked: boolean, likesCount: number }>}
 */
export const toggleLike = async (postId) => {
  const { data } = await axiosInstance.patch(`/posts/${postId}/like`);
  return data.data;
};

/**
 * Deletes a post by ID. Only the author or admin can do this.
 *
 * @param {string} postId
 * @returns {Promise<void>}
 */
export const deletePost = async (postId) => {
  await axiosInstance.delete(`/posts/${postId}`);
};

/**
 * Fetches a single post by ID with full enrichment.
 *
 * @param {string} postId
 * @returns {Promise<object>}
 */
export const fetchPostById = async (postId) => {
  const { data } = await axiosInstance.get(`/posts/${postId}`);
  return data.data;
};

/**
 * Generates (or fetches the cached) AI study summary for a note post.
 *
 * @param {string} postId
 * @param {{ refresh?: boolean }} [options]
 * @returns {Promise<{ summary: string, keyPoints: string[], studyQuestions: string[], generatedAt: string, cached: boolean }>}
 */
export const summarizePost = async (postId, { refresh = false } = {}) => {
  // No request body — express.json()'s strict mode rejects a literal `null`
  // payload, so the config's `data` is omitted entirely rather than passed.
  const { data } = await axiosInstance.post(`/posts/${postId}/summarize`, undefined, {
    params: refresh ? { refresh: true } : undefined,
  });
  return data.data;
};
