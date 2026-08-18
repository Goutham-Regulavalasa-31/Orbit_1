import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";

// ── Internal helper ───────────────────────────────────────────────────────
/**
 * Generates a fresh access + refresh token pair for a given user and
 * persists the new refresh token to the database.
 *
 * @param {string} userId - MongoDB ObjectId of the user
 * @returns {{ accessToken: string, refreshToken: string }}
 */
const generateTokenPair = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found during token generation");

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Persist the new refresh token (plain; compared directly on refresh)
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// ── Public service methods ────────────────────────────────────────────────

/**
 * Creates a new user account.
 * Throws ApiError(409) if email already exists.
 */
const register = async ({ name, email, password, department, bio }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const user = await User.create({
    name: name.trim(),
    email,
    password,
    department: department ?? "",
    bio: bio ?? "",
  });

  // Re-fetch without sensitive fields
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "User registration failed. Please try again.");
  }

  return createdUser;
};

/**
 * Authenticates a user with email + password.
 * Throws ApiError(401) for any credential mismatch (intentionally vague).
 */
const login = async ({ email, password }) => {
  // +password needed because schema has select: false
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  }).select("+password +refreshToken");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken } = await generateTokenPair(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return { user: loggedInUser, accessToken, refreshToken };
};

/**
 * Revokes a user's refresh token in the database.
 * Idempotent — safe to call even if already logged out.
 */
const logout = async (userId) => {
  await User.findByIdAndUpdate(
    userId,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );
};

/**
 * Validates an incoming refresh token, then issues a new token pair
 * (refresh token rotation — old token is invalidated on each use).
 */
const refreshAccessToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  let decoded;
  try {
    decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch (err) {
    throw new ApiError(
      401,
      err.name === "TokenExpiredError"
        ? "Refresh token has expired. Please log in again."
        : "Invalid refresh token."
    );
  }

  const user = await User.findById(decoded._id).select("+refreshToken");
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(
      401,
      "Refresh token has been revoked or does not match. Please log in again."
    );
  }

  const { accessToken, refreshToken: newRefreshToken } =
    await generateTokenPair(user._id);

  return { accessToken, refreshToken: newRefreshToken };
};

/**
 * Returns the authenticated user's profile (no sensitive fields).
 */
const getMe = async (userId) => {
  const user = await User.findById(userId).select("-password -refreshToken");
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

export const authService = {
  register,
  login,
  logout,
  refreshAccessToken,
  getMe,
};
