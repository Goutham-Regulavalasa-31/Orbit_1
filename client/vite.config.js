import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Animation library (largest single dep)
          "vendor-framer": ["framer-motion"],
          // Server state management
          "vendor-query": ["@tanstack/react-query", "@tanstack/react-query-devtools"],
          // Radix UI primitives
          "vendor-radix": [
            "@radix-ui/react-avatar",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-slot",
            "@radix-ui/react-toast",
          ],
          // Utilities
          "vendor-utils": ["axios", "zustand", "zod", "clsx", "tailwind-merge", "class-variance-authority"],
          // Form handling
          "vendor-forms": ["react-hook-form", "@hookform/resolvers"],
        },
      },
    },
  },
});
