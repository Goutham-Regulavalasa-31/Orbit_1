import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import App from "./App.jsx";
import "./index.css";
import useAuthStore from "@/store/useAuthStore";
import useSocketStore from "@/store/useSocketStore";

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
  const connect = useSocketStore((s) => s.connect);
  const disconnect = useSocketStore((s) => s.disconnect);

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
        {/* SocketBridge must be inside QueryClientProvider but outside App
            so it survives route changes. */}
        <SocketBridge />
        <App />
        {/* DevTools only included in development builds */}
        {import.meta.env.DEV && (
          <ReactQueryDevtools initialIsOpen={false} position="bottom" />
        )}
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
