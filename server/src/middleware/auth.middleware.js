import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * verifyJWT middleware — guards protected routes.
 *
 * Token extraction order:
 *  1. `Authorization: Bearer <token>` header — explicit per-request identity.
 *     The client always attaches its own in-memory access token here (see
 *     axiosInstance's request interceptor), so this is what a given tab
 *     actually intends to authenticate as.
 *  2. `req.cookies.accessToken` (HTTP-only cookie set on login) — fallback
 *     only, for requests with no Authorization header at all.
 *
 * This order matters more than it looks: the cookie is shared across every
 * tab on the origin, so if it were checked first, one tab logging in as a
 * different user would silently hijack every other open tab's requests even
 * though each holds its own valid Bearer token. Preferring the header keeps
 * each tab's identity actually scoped to that tab.
 *
 * On success, attaches the full user document (sans password + refreshToken)
 * to `req.user` and calls `next()`.
 */
export const verifyJWT = asyncHandler(async (req, _res, next) => {
  const token =
    req.header("Authorization")?.replace(/^Bearer\s+/i, "") ??
    req.cookies?.accessToken;

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
