import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import App from "./App.jsx";
import "./index.css";

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

// ── Mount ──────────────────────────────────────────────────────────────────
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        {/* DevTools only included in development builds */}
        {import.meta.env.DEV && (
          <ReactQueryDevtools initialIsOpen={false} position="bottom" />
        )}
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
