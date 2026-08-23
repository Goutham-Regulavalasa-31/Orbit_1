import { Router } from "express";
import authRouter from "./auth.routes.js";
import postsRouter from "./post.routes.js";
import userRouter from "./user.routes.js";
import notificationRouter from "./notification.routes.js";

/**
 * Root API router.
 * All feature routers are mounted here under their resource prefix.
 * This file is the single import in app.js for all API routes.
 */
const router = Router();

router.use("/auth", authRouter);

// ── Nested resource: comments live under their parent post ────────────────────
// postsRouter itself mounts commentRoutes at "/:postId/comments" (mergeParams
// propagates :postId into the comment controllers), so it is not mounted again here.
router.use("/posts", postsRouter);

router.use("/users", userRouter);
router.use("/notifications", notificationRouter);

// Future routers will be mounted here:
// router.use("/clubs", clubsRouter);
// router.use("/events", eventsRouter);

export default router;
