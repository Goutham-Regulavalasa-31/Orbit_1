import axiosInstance from "./axiosInstance";

/**
 * Event API functions.
 * All routed through axiosInstance (Bearer token + auto-refresh).
 */

/**
 * Fetches a paginated page of upcoming events, soonest-first.
 *
 * @param {object} params
 * @param {number} params.pageParam  - Page number from useInfiniteQuery
 * @param {number} [params.limit=12]
 * @returns {Promise<{ events: object[], pagination: object }>}
 */
export const fetchEvents = async ({ pageParam = 1, limit = 12 } = {}) => {
  const { data } = await axiosInstance.get("/events", {
    params: { page: pageParam, limit },
  });
  return data.data; // unwrap ApiResponse envelope
};

/**
 * Fetches a single event's details.
 *
 * @param {string} eventId
 * @returns {Promise<object>}
 */
export const fetchEventById = async (eventId) => {
  const { data } = await axiosInstance.get(`/events/${eventId}`);
  return data.data;
};

/**
 * Creates a new event with an optional cover image.
 *
 * @param {FormData} formData - multipart/form-data with title, description, date, location, coverImage?
 * @returns {Promise<object>} The created event document
 */
export const createEvent = async (formData) => {
  const { data } = await axiosInstance.post("/events", formData, {
    headers: {
      // Override the default application/json — axiosInstance sets it globally
      "Content-Type": "multipart/form-data",
    },
  });
  return data.data;
};

/**
 * Toggles the caller's RSVP status for an event.
 *
 * @param {string} eventId
 * @returns {Promise<{ attending: boolean, attendeesCount: number }>}
 */
export const toggleRSVP = async (eventId) => {
  const { data } = await axiosInstance.post(`/events/${eventId}/rsvp`);
  return data.data;
};
