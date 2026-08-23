import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { getUserProfile, getUserPosts } from "../controllers/user.controller.js";

const router = Router();

// All user routes require authentication
router.use(verifyJWT);

router.get("/:userId", getUserProfile);
router.get("/:userId/posts", getUserPosts);

export default router;
