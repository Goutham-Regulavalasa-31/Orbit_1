import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

import router from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

// ── Security headers ──────────────────────────────────────────────────────
app.use(helmet());

// ── Rate limiting — throttle abusive/scripted traffic on the API surface ──
// 100 requests per 15 minutes per IP. Scoped to /api/v1 only (below), so
// it never touches /health or static assets.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true, // return limit info in RateLimit-* headers
  legacyHeaders: false,  // disable the deprecated X-RateLimit-* headers
  message: {
    statusCode: 429,
    success: false,
    message: "Too many requests. Please try again later.",
    data: null,
  },
});

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

// ── NoSQL injection sanitization ───────────────────────────────────────────
// Strips any key starting with "$" or containing "." from req.body/params/
// query (e.g. { email: { "$gt": "" } }), which is how a Mongo query operator
// gets smuggled in through user input. Must run after the body parsers
// above, since it needs req.body already parsed, and before any route
// handler touches user input.
app.use(mongoSanitize());

// ── Health check (unauthenticated) ────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API routes ────────────────────────────────────────────────────────────
app.use("/api/v1", apiLimiter, router);

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
