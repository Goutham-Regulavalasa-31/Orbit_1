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

// CRITICAL FIX: We must import the comment routes!
import commentRoutes from "./comment.routes.js";

const router = Router();

// All post routes require authentication
router.use(verifyJWT);

router.post("/", upload.array("media", 5), validateFileSizes, createPost);
router.get("/feed", getFeed);
router.get("/:id", getPostById);
router.patch("/:id/like", toggleLike);
router.delete("/:id", deletePost);

// CRITICAL FIX: Mount the comment routes underneath the posts endpoint!
// Without this, every comment request returns a hidden 404 Not Found.
router.use("/:postId/comments", commentRoutes);

export default router;