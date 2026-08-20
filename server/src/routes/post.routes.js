import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload, validateFileSizes } from "../middleware/upload.middleware.js";
import {
  createPost,
  getFeed,
  getPostById,
  toggleLike,
  deletePost,
} from "../controllers/post.controller.js";

const router = Router();

// ── All post routes require authentication ────────────────────────────────────
router.use(verifyJWT);

/**
 * POST /api/v1/posts
 * Middleware chain:
 *  1. upload.array       — Multer parses multipart/form-data, buffers files
 *  2. validateFileSizes  — Enforces per-MIME size caps (10MB images, 20MB PDFs)
 *  3. createPost         — Controller delegates to service → Cloudinary → MongoDB
 */
router.post(
  "/",
  upload.array("media", 5),
  validateFileSizes,
  createPost
);

/**
 * GET /api/v1/posts/feed
 * NOTE: This route MUST be defined before /:id to prevent Express from
 * interpreting "feed" as a post ID parameter.
 */
router.get("/feed", getFeed);

/**
 * GET /api/v1/posts/:id
 */
router.get("/:id", getPostById);

/**
 * PATCH /api/v1/posts/:id/like
 * Idempotent toggle — no body required.
 */
router.patch("/:id/like", toggleLike);

/**
 * DELETE /api/v1/posts/:id
 * Author or admin only — enforced in the service layer.
 */
router.delete("/:id", deletePost);

export default router;
