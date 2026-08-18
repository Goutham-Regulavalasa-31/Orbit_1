import axiosInstance from "@/api/axiosInstance";

/**
 * Modularized auth API service.
 * All components and hooks must use these wrappers — never call
 * axiosInstance directly from UI code.
 */
export const authService = {
  /**
   * POST /auth/register
   * @param {{ name: string, email: string, password: string, department?: string, bio?: string }} userData
   */
  register: async (userData) => {
    const { data } = await axiosInstance.post("/auth/register", userData);
    return data;
  },

  /**
   * POST /auth/login
   * @param {{ email: string, password: string }} credentials
   */
  login: async (credentials) => {
    const { data } = await axiosInstance.post("/auth/login", credentials);
    return data;
  },

  /**
   * POST /auth/logout
   * Requires a valid access token (sent via Authorization header by interceptor).
   */
  logout: async () => {
    const { data } = await axiosInstance.post("/auth/logout");
    return data;
  },

  /**
   * POST /auth/refresh-token
   * The refresh token cookie is sent automatically by Axios (withCredentials).
   */
  refreshToken: async () => {
    const { data } = await axiosInstance.post("/auth/refresh-token");
    return data;
  },

  /**
   * GET /auth/me
   * Fetches the current authenticated user's profile.
   */
  getMe: async () => {
    const { data } = await axiosInstance.get("/auth/me");
    return data;
  },
};
