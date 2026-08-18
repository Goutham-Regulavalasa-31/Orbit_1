import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { authService } from "../services/auth.service.js";

// ── Cookie configuration ───────────────────────────────────────────────────
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;          // 15 minutes in ms
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// ── Helpers ───────────────────────────────────────────────────────────────
/**
 * Applies both auth cookies to the response object.
 * Extracted to a helper to avoid repetition in login + refresh endpoints.
 */
const setAuthCookies = (res, accessToken, refreshToken) =>
  res
    .cookie("accessToken", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    })
    .cookie("refreshToken", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

// ── Controllers ───────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Public — no auth required.
 * Creates a new user account and returns the sanitized user document.
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, department, bio } = req.body;

  const user = await authService.register({
    name,
    email,
    password,
    department,
    bio,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, user, "User registered successfully"));
});

/**
 * POST /api/v1/auth/login
 * Public — no auth required.
 * Authenticates credentials, issues a token pair via HTTP-only cookies,
 * and returns the token pair + user in the response body as well
 * (useful for SPA clients that want to store the access token in memory).
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, accessToken, refreshToken } = await authService.login({
    email,
    password,
  });

  return setAuthCookies(res, accessToken, refreshToken)
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user, accessToken, refreshToken },
        "Login successful"
      )
    );
});

/**
 * POST /api/v1/auth/logout
 * Protected — requires valid access token.
 * Revokes the refresh token in DB and clears both auth cookies.
 */
export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);

  return res
    .status(200)
    .clearCookie("accessToken", COOKIE_OPTIONS)
    .clearCookie("refreshToken", COOKIE_OPTIONS)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

/**
 * POST /api/v1/auth/refresh-token
 * Public — relies on the refresh token cookie.
 * Validates the incoming refresh token, rotates it, and issues a new pair.
 */
export const refreshToken = asyncHandler(async (req, res) => {
  // Accept token from cookie (preferred) or body (fallback for testing)
  const incomingToken =
    req.cookies?.refreshToken ?? req.body?.refreshToken;

  const { accessToken, refreshToken: newRefreshToken } =
    await authService.refreshAccessToken(incomingToken);

  return setAuthCookies(res, accessToken, newRefreshToken)
    .status(200)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken: newRefreshToken },
        "Access token refreshed"
      )
    );
});

/**
 * GET /api/v1/auth/me
 * Protected — requires valid access token.
 * Returns the full profile of the currently authenticated user.
 */
export const getMe = asyncHandler(async (req, res) => {
  // req.user is already attached by verifyJWT; we re-fetch for freshness
  const user = await authService.getMe(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User profile fetched"));
});
