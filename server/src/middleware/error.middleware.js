import { ApiError } from "../utils/ApiError.js";

/**
 * Centralized Express error handling middleware.
 * MUST be the last middleware registered in app.js (4 arguments).
 *
 * Handles:
 *  - Custom ApiError instances → structured JSON with statusCode + errors[]
 *  - Mongoose duplicate key (E11000) → 409 Conflict
 *  - Mongoose ValidationError  → 400 with field-level messages
 *  - Unhandled errors          → 500 Internal Server Error
 *
 * The `_next` parameter is intentionally unused but required by Express
 * to recognize this as an error-handling middleware (4-arg signature).
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  // ── Custom application errors ───────────────────────────────────────
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
      success: false,
      errors: err.errors,
      data: null,
    });
  }

  // ── Mongoose: duplicate key ────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? "field";
    const formattedField =
      field.charAt(0).toUpperCase() + field.slice(1);

    return res.status(409).json({
      statusCode: 409,
      message: `${formattedField} is already in use`,
      success: false,
      errors: [{ field, message: `${formattedField} already exists` }],
      data: null,
    });
  }

  // ── Mongoose: schema validation failure ───────────────────────────
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      statusCode: 400,
      message: "Database validation failed",
      success: false,
      errors,
      data: null,
    });
  }

  // ── JWT errors (shouldn't normally reach here, but defensive) ────
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      statusCode: 401,
      message: "Invalid or expired token",
      success: false,
      errors: [],
      data: null,
    });
  }

  // ── Unhandled / unexpected errors ─────────────────────────────────
  console.error("⚠️  Unhandled Error:", err);

  return res.status(err.statusCode ?? 500).json({
    statusCode: err.statusCode ?? 500,
    message: err?.message ?? "Internal Server Error",
    success: false,
    errors: [],
    data: null,
  });
};
