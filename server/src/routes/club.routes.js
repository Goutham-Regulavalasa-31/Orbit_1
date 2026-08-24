import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  createClub,
  getClubs,
  getClubById,
  toggleMembership,
  getClubPosts,
} from "../controllers/club.controller.js";

const router = Router();

// All club routes require authentication
router.use(verifyJWT);

router.post("/", upload.single("coverImage"), createClub);
router.get("/", getClubs);
router.get("/:id", getClubById);
router.post("/:id/join", toggleMembership);
router.get("/:id/posts", getClubPosts);

export default router;
