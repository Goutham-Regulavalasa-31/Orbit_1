import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Orbit,
  ArrowRight,
  Loader2,
  AlertCircle,
  Check,
  X,
} from "lucide-react";

import { registerSchema } from "@/lib/validators";
import { useRegister } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Password strength indicator row ──────────────────────────────────────
const PasswordRequirement = ({ met, label }) => (
  <div
    className={cn(
      "flex items-center gap-1.5 text-xs transition-colors duration-200",
      met ? "text-green-400" : "text-muted-foreground/60"
    )}
  >
    {met ? (
      <Check className="h-3 w-3 shrink-0" />
    ) : (
      <X className="h-3 w-3 shrink-0 opacity-40" />
    )}
    {label}
  </div>
);

// ── Field row animation variants ──────────────────────────────────────────
const fieldVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const { mutate: register, isPending, error } = useRegister();

  const {
    register: formRegister,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      department: "",
      bio: "",
    },
  });

  const passwordValue = watch("password", "");
  const hasMinLength = passwordValue.length >= 8;
  const hasUpper = /[A-Z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);

  const onSubmit = ({ confirmPassword: _omit, ...payload }) => {
    register(payload);
  };

  const serverError =
    error?.response?.data?.message ??
    (error ? "Registration failed. Please try again." : null);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* ── Ambient glow ──────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-indigo-500/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* ── Logo + header ─────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/25 shadow-xl shadow-primary/10"
          >
            <Orbit className="h-7 w-7 text-primary" />
          </motion.div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Join <span className="text-gradient">Orbit</span>
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Create your student community account
            </p>
          </div>
        </div>

        <Card className="glass shadow-2xl shadow-black/30">
          <CardContent className="pt-6">
            {/* ── Server error ──────────────────────────────────────── */}
            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-red-400"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {serverError}
              </motion.div>
            )}

            <motion.form
              id="register-form"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.07 } },
              }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              {/* ── Name + Department ─────────────────────────────── */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <motion.div variants={fieldVariants} className="space-y-1.5">
                  <Label htmlFor="reg-name" className="text-foreground/80">
                    Full name{" "}
                    <span className="text-destructive/70" aria-hidden>*</span>
                  </Label>
                  <Input
                    id="reg-name"
                    placeholder="Jane Doe"
                    autoComplete="name"
                    className={cn(
                      "bg-background/50",
                      errors.name && "border-destructive/60 focus-visible:ring-destructive"
                    )}
                    {...formRegister("name")}
                  />
                  {errors.name && (
                    <p className="flex items-center gap-1 text-xs text-destructive/80">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {errors.name.message}
                    </p>
                  )}
                </motion.div>

                <motion.div variants={fieldVariants} className="space-y-1.5">
                  <Label htmlFor="reg-department" className="text-foreground/80">
                    Department{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="reg-department"
                    placeholder="e.g. Computer Science"
                    className="bg-background/50"
                    {...formRegister("department")}
                  />
                </motion.div>
              </div>

              {/* ── Email ────────────────────────────────────────── */}
              <motion.div variants={fieldVariants} className="space-y-1.5">
                <Label htmlFor="reg-email" className="text-foreground/80">
                  Email address{" "}
                  <span className="text-destructive/70" aria-hidden>*</span>
                </Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@university.edu"
                  autoComplete="email"
                  className={cn(
                    "bg-background/50",
                    errors.email && "border-destructive/60 focus-visible:ring-destructive"
                  )}
                  {...formRegister("email")}
                />
                {errors.email && (
                  <p className="flex items-center gap-1 text-xs text-destructive/80">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.email.message}
                  </p>
                )}
              </motion.div>

              {/* ── Password ─────────────────────────────────────── */}
              <motion.div variants={fieldVariants} className="space-y-1.5">
                <Label htmlFor="reg-password" className="text-foreground/80">
                  Password{" "}
                  <span className="text-destructive/70" aria-hidden>*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    className={cn(
                      "bg-background/50 pr-10",
                      errors.password && "border-destructive/60 focus-visible:ring-destructive"
                    )}
                    {...formRegister("password")}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <button
                    type="button"
                    id="reg-toggle-password"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Inline password requirements */}
                <AnimatePresence>
                  {(passwordFocused || passwordValue.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-3 gap-x-4 gap-y-1 overflow-hidden pt-1.5"
                    >
                      <PasswordRequirement
                        met={hasMinLength}
                        label="8+ characters"
                      />
                      <PasswordRequirement
                        met={hasUpper}
                        label="Uppercase"
                      />
                      <PasswordRequirement
                        met={hasNumber}
                        label="Number"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {errors.password && (
                  <p className="flex items-center gap-1 text-xs text-destructive/80">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.password.message}
                  </p>
                )}
              </motion.div>

              {/* ── Confirm password ─────────────────────────────── */}
              <motion.div variants={fieldVariants} className="space-y-1.5">
                <Label htmlFor="reg-confirm-password" className="text-foreground/80">
                  Confirm password{" "}
                  <span className="text-destructive/70" aria-hidden>*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="reg-confirm-password"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className={cn(
                      "bg-background/50 pr-10",
                      errors.confirmPassword &&
                        "border-destructive/60 focus-visible:ring-destructive"
                    )}
                    {...formRegister("confirmPassword")}
                  />
                  <button
                    type="button"
                    id="reg-toggle-confirm"
                    onClick={() => setShowConfirm((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="flex items-center gap-1 text-xs text-destructive/80">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </motion.div>

              {/* ── Bio ──────────────────────────────────────────── */}
              <motion.div variants={fieldVariants} className="space-y-1.5">
                <Label htmlFor="reg-bio" className="text-foreground/80">
                  Bio{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    (optional, max 300 chars)
                  </span>
                </Label>
                <textarea
                  id="reg-bio"
                  rows={3}
                  placeholder="Tell the community a bit about yourself…"
                  className={cn(
                    "flex w-full resize-none rounded-md border border-input bg-background/50 px-3 py-2 text-sm",
                    "placeholder:text-muted-foreground",
                    "transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    errors.bio && "border-destructive/60 focus-visible:ring-destructive"
                  )}
                  {...formRegister("bio")}
                />
                {errors.bio && (
                  <p className="flex items-center gap-1 text-xs text-destructive/80">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.bio.message}
                  </p>
                )}
              </motion.div>

              {/* ── Submit ───────────────────────────────────────── */}
              <motion.div variants={fieldVariants} className="pt-1">
                <Button
                  id="register-submit-btn"
                  type="submit"
                  size="lg"
                  disabled={isPending}
                  className="w-full gap-2 font-semibold tracking-wide"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.form>
          </CardContent>

          <CardFooter className="justify-center border-t border-border/30 py-5">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground/40">
          By creating an account, you agree to our{" "}
          <button
            type="button"
            className="underline transition-colors hover:text-muted-foreground/70"
          >
            Terms of Service
          </button>{" "}
          and{" "}
          <button
            type="button"
            className="underline transition-colors hover:text-muted-foreground/70"
          >
            Privacy Policy
          </button>
          .
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
