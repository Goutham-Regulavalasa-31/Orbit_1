import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { MotionConfig } from "framer-motion";

import App from "./App.jsx";
import "./index.css";
import useAuthStore from "@/store/useAuthStore";
import useSocketStore from "@/store/useSocketStore";
import { authService } from "@/services/auth.service";

// ── TanStack Query client ──────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes before data is considered stale
      gcTime: 10 * 60 * 1000,     // 10 minutes before inactive data is garbage collected
      refetchOnWindowFocus: false, // Avoid refetch noise on tab switch
      retry: 1,                    // Retry once before reporting error
    },
    mutations: {
      retry: 0, // Never auto-retry mutations (e.g. form submissions)
    },
  },
});

/**
 * SocketBridge — a renderless component that subscribes to auth state
 * and manages the socket connection lifecycle.
 *
 * Why a component and not a top-level effect?
 * React's StrictMode double-invokes effects in development.
 * Keeping it inside the component tree lets useEffect properly clean up.
 */
const SocketBridge = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const connect = useSocketStore((s) => s.connect);
  const disconnect = useSocketStore((s) => s.disconnect);

  // On a hard page load, `isAuthenticated`/`user` survive in sessionStorage
  // but `accessToken` is intentionally not persisted (see useAuthStore) —
  // it's normally re-acquired by axiosInstance's 401 interceptor. But most
  // REST routes also accept the short-lived httpOnly accessToken cookie as
  // a fallback (see verifyJWT), so an ordinary page load's API calls all
  // succeed without ever 401ing, and the interceptor never runs. That left
  // accessToken null forever after any reload, and since the socket below
  // only connects once accessToken is truthy, every real-time feature
  // (RSVP, likes, messages, notifications) silently never went live until
  // something unrelated happened to trigger a 401. Proactively refreshing
  // once here closes that gap.
  useEffect(() => {
    if (isAuthenticated && !accessToken) {
      authService
        .refreshToken()
        .then((res) => setAccessToken(res.data.accessToken))
        .catch(() => {
          // Refresh cookie missing/expired — ProtectedRoute + the request
          // interceptor's own refresh-on-401 already handle that case.
        });
    }
  }, [isAuthenticated, accessToken, setAccessToken]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connect(accessToken);
    } else {
      disconnect();
    }
  }, [isAuthenticated, accessToken, connect, disconnect]);

  return null;
};

// ── Mount ──────────────────────────────────────────────────────────────────
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {/* reducedMotion="user" makes every Framer Motion animation in the
            app honor prefers-reduced-motion automatically (transform/opacity
            animations are skipped, instant transitions used instead) — set
            once here rather than checking useReducedMotion() in every
            component that animates. */}
        <MotionConfig reducedMotion="user">
          {/* SocketBridge must be inside QueryClientProvider but outside App
              so it survives route changes. */}
          <SocketBridge />
          <App />
          {/* DevTools only included in development builds */}
          {import.meta.env.DEV && (
            <ReactQueryDevtools initialIsOpen={false} position="bottom" />
          )}
        </MotionConfig>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
