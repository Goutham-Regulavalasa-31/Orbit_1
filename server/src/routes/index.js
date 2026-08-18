import { Router } from "express";
import authRouter from "./auth.routes.js";

/**
 * Root API router.
 * All feature routers are mounted here under their resource prefix.
 * This file is the single import in app.js for all API routes.
 */
const router = Router();

router.use("/auth", authRouter);

// Future routers will be mounted here:
// router.use("/posts", postsRouter);
// router.use("/clubs", clubsRouter);
// router.use("/events", eventsRouter);

export default router;
