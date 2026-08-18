import { z } from "zod";

// ── Shared password rules ─────────────────────────────────────────────────
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[0-9]/, "Must contain at least one number");

// ── Login ─────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// ── Registration ──────────────────────────────────────────────────────────
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(60, "Name cannot exceed 60 characters")
      .trim(),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    department: z
      .string()
      .max(100, "Department name is too long")
      .optional()
      .default(""),
    bio: z
      .string()
      .max(300, "Bio cannot exceed 300 characters")
      .optional()
      .default(""),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/** @typedef {import('zod').infer<typeof loginSchema>} LoginFormValues */
/** @typedef {import('zod').infer<typeof registerSchema>} RegisterFormValues */
