import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Orbit,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { loginSchema } from "@/lib/validators";
import { useLogin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();

  // Success message passed from the register page via router state
  const successMessage = location.state?.message ?? null;

  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data) => login(data);

  const serverError =
    error?.response?.data?.message ??
    (error ? "Login failed. Please try again." : null);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* ── Logo + header ─────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/25">
            <Orbit className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back to Orbit
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your student community account
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            {/* ── Success flash (from register redirect) ────────────── */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 flex items-center gap-2.5 rounded-lg border border-green-500/20 bg-green-500/10 px-3.5 py-3 text-sm text-green-400"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {successMessage}
              </motion.div>
            )}

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

            <form
              id="login-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-foreground/80">
                  Email address
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@university.edu"
                  autoComplete="email"
                  className={cn(
                    "bg-background/50",
                    errors.email &&
                      "border-destructive/60 focus-visible:ring-destructive"
                  )}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="flex items-center gap-1 text-xs text-destructive/80">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="login-password"
                    className="text-foreground/80"
                  >
                    Password
                  </Label>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground transition-colors hover:text-primary"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={cn(
                      "bg-background/50 pr-10",
                      errors.password &&
                        "border-destructive/60 focus-visible:ring-destructive"
                    )}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    id="login-toggle-password"
                    onClick={() => setShowPassword((prev) => !prev)}
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
                {errors.password && (
                  <p className="flex items-center gap-1 text-xs text-destructive/80">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                id="login-submit-btn"
                type="submit"
                size="lg"
                disabled={isPending}
                className="mt-1 w-full gap-2 font-semibold tracking-wide"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center border-t border-border py-5">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
              >
                Create one
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
