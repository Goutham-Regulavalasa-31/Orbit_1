import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * verifyJWT middleware — guards protected routes.
 *
 * Token extraction order:
 *  1. `req.cookies.accessToken`  (HTTP-only cookie set on login)
 *  2. `Authorization: Bearer <token>` header (for API clients)
 *
 * On success, attaches the full user document (sans password + refreshToken)
 * to `req.user` and calls `next()`.
 */
export const verifyJWT = asyncHandler(async (req, _res, next) => {
  const token =
    req.cookies?.accessToken ??
    req.header("Authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new ApiError(401, "Access denied. No token provided.");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    const message =
      err.name === "TokenExpiredError"
        ? "Access token has expired."
        : "Invalid access token.";
    throw new ApiError(401, message);
  }

  const user = await User.findById(decoded._id).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError(
      401,
      "The user associated with this token no longer exists."
    );
  }

  req.user = user;
  next();
});
