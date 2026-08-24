import axiosInstance from "./axiosInstance";

/**
 * Club API functions.
 * All routed through axiosInstance (Bearer token + auto-refresh).
 */

/**
 * Fetches a paginated page of the club directory.
 *
 * @param {object} params
 * @param {number} params.pageParam  - Page number from useInfiniteQuery
 * @param {number} [params.limit=12]
 * @param {string} [params.search]   - Matches club name or tags
 * @returns {Promise<{ clubs: object[], pagination: object }>}
 */
export const fetchClubs = async ({ pageParam = 1, limit = 12, search } = {}) => {
  const params = { page: pageParam, limit };
  if (search) params.search = search;

  const { data } = await axiosInstance.get("/clubs", { params });
  return data.data; // unwrap ApiResponse envelope
};

/**
 * Fetches a single club's details.
 *
 * @param {string} clubId
 * @returns {Promise<object>}
 */
export const fetchClubById = async (clubId) => {
  const { data } = await axiosInstance.get(`/clubs/${clubId}`);
  return data.data;
};

/**
 * Creates a new club with an optional cover image.
 *
 * @param {FormData} formData - multipart/form-data with name, description, tags, coverImage?
 * @returns {Promise<object>} The created club document
 */
export const createClub = async (formData) => {
  const { data } = await axiosInstance.post("/clubs", formData, {
    headers: {
      // Override the default application/json — axiosInstance sets it globally
      "Content-Type": "multipart/form-data",
    },
  });
  return data.data;
};

/**
 * Toggles the caller's membership in a club (join/leave).
 *
 * @param {string} clubId
 * @returns {Promise<{ joined: boolean, membersCount: number }>}
 */
export const toggleClubMembership = async (clubId) => {
  const { data } = await axiosInstance.post(`/clubs/${clubId}/join`);
  return data.data;
};

/**
 * Fetches a paginated page of a club's posts.
 *
 * @param {object} params
 * @param {string} params.clubId
 * @param {number} params.pageParam
 * @param {number} [params.limit=10]
 * @returns {Promise<{ posts: object[], pagination: object }>}
 */
export const fetchClubPosts = async ({ clubId, pageParam = 1, limit = 10 }) => {
  const { data } = await axiosInstance.get(`/clubs/${clubId}/posts`, {
    params: { page: pageParam, limit },
  });
  return data.data;
};
