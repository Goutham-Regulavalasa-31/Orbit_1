import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  getComments,
  createComment,
  toggleCommentLike,
  deleteComment,
} from "../controllers/comment.controller.js";

/**
 * Comment routes — all protected by JWT.
 *
 * Mounted in index.js under /posts, so paths below are relative:
 *   GET    /api/v1/posts/:postId/comments
 *   POST   /api/v1/posts/:postId/comments
 *   PATCH  /api/v1/posts/:postId/comments/:commentId/like
 *   DELETE /api/v1/posts/:postId/comments/:commentId
 */
const router = Router({ mergeParams: true }); // mergeParams exposes :postId from parent

// All comment routes require authentication
router.use(verifyJWT);

router.route("/").get(getComments).post(createComment);

router.patch("/:commentId/like", toggleCommentLike);
router.delete("/:commentId", deleteComment);

export default router;
