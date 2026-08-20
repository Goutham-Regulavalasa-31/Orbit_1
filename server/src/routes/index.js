import { Router } from "express";
import authRouter from "./auth.routes.js";
import postsRouter from "./post.routes.js";

/**
 * Root API router.
 * All feature routers are mounted here under their resource prefix.
 * This file is the single import in app.js for all API routes.
 */
const router = Router();

router.use("/auth", authRouter);
router.use("/posts", postsRouter);

// Future routers will be mounted here:
// router.use("/clubs", clubsRouter);
// router.use("/events", eventsRouter);

export default router;
