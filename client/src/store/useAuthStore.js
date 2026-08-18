import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Zustand Auth Store — single source of truth for authentication state.
 *
 * Persistence strategy:
 *  - Stored in sessionStorage (cleared when tab closes)
 *  - `accessToken` is NOT persisted — re-acquired via cookie/interceptor
 *  - `user` + `isAuthenticated` are persisted for a seamless page refresh
 */
const useAuthStore = create(
  persist(
    (set) => ({
      /** @type {object | null} */
      user: null,

      /** @type {string | null} - In-memory only; not persisted */
      accessToken: null,

      /** @type {boolean} */
      isAuthenticated: false,

      /**
       * Set both user and access token after a successful login.
       * @param {object} user
       * @param {string} accessToken
       */
      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),

      /**
       * Update only the access token (called by the Axios refresh interceptor).
       * @param {string} accessToken
       */
      setAccessToken: (accessToken) => set({ accessToken }),

      /**
       * Update the user object (called after fetching /auth/me).
       * @param {object} user
       */
      setUser: (user) => set({ user }),

      /**
       * Clear all auth state (called on logout or when refresh fails).
       */
      clearAuth: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: "orbit-auth-store",
      storage: createJSONStorage(() => sessionStorage),
      // Selectively persist only non-sensitive fields
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // accessToken intentionally excluded — must be re-acquired each session
      }),
    }
  )
);

export default useAuthStore;
