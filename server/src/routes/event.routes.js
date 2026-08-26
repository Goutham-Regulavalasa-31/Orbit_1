import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  createEvent,
  getEvents,
  getEventById,
  toggleRSVP,
} from "../controllers/event.controller.js";

const router = Router();

// All event routes require authentication
router.use(verifyJWT);

router.post("/", upload.single("coverImage"), createEvent);
router.get("/", getEvents);
router.get("/:id", getEventById);
router.post("/:id/rsvp", toggleRSVP);

export default router;
