import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth.service";
import useAuthStore from "@/store/useAuthStore";

// ── Query key constants ────────────────────────────────────────────────────
export const AUTH_QUERY_KEYS = {
  me: ["auth", "me"],
};

// ── Queries ───────────────────────────────────────────────────────────────

/**
 * Fetches the currently authenticated user's profile.
 * Only runs when `isAuthenticated` is true in the store.
 * Side-effect: updates the Zustand user state on success.
 */
export const useCurrentUser = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: AUTH_QUERY_KEYS.me,
    queryFn: async () => {
      const res = await authService.getMe();
      setUser(res.data);
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
};

// ── Mutations ─────────────────────────────────────────────────────────────

/**
 * Registration mutation.
 * On success: redirects to /login with a success message toast trigger.
 */
export const useRegister = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      navigate("/login", {
        state: { message: "Account created successfully! Please sign in." },
        replace: true,
      });
    },
  });
};

/**
 * Login mutation.
 * On success: populates auth store, seeds TanStack cache, navigates to dashboard.
 */
export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (res) => {
      const { user, accessToken } = res.data;
      setAuth(user, accessToken);
      // Pre-seed the cache so useCurrentUser doesn't fetch immediately
      queryClient.setQueryData(AUTH_QUERY_KEYS.me, user);
      navigate("/dashboard", { replace: true });
    },
  });
};

/**
 * Logout mutation.
 * Clears store + TanStack cache regardless of server response.
 */
export const useLogout = () => {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const clearAndRedirect = () => {
    clearAuth();
    queryClient.clear();
    navigate("/login", { replace: true });
  };

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: clearAndRedirect,
    // Force logout even if the server request fails (e.g. expired token)
    onError: clearAndRedirect,
  });
};
