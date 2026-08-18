import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import router from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

// ── Security headers ──────────────────────────────────────────────────────
app.use(helmet());

// ── CORS — restrict to the configured client origin ──────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true, // Required for HTTP-only cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Body parsers ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// ── Cookie parser (must come before routes) ───────────────────────────────
app.use(cookieParser());

// ── Health check (unauthenticated) ────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API routes ────────────────────────────────────────────────────────────
app.use("/api/v1", router);

// ── 404 — catch-all for unmatched routes ─────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    statusCode: 404,
    message: "The requested route does not exist",
    success: false,
    data: null,
  });
});

// ── Centralized error handler (MUST be last) ──────────────────────────────
app.use(errorHandler);

export default app;
