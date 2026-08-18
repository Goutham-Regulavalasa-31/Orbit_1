import { Router } from "express";
import { z } from "zod";

import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = Router();

// ── Zod request body schemas ──────────────────────────────────────────────

const registerSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name cannot exceed 60 characters")
    .trim(),
  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  department: z.string().max(100).optional().default(""),
  bio: z.string().max(300, "Bio cannot exceed 300 characters").optional().default(""),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

// ── Public routes (no authentication required) ────────────────────────────
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh-token", refreshToken);

// ── Protected routes (valid access token required) ────────────────────────
router.post("/logout", verifyJWT, logout);
router.get("/me", verifyJWT, getMe);

export default router;
