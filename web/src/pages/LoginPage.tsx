import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, X, Loader2, Anchor, EyeOff, Eye } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const LoginPage = () => {
  const { login, isAuthenticated, role, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (!authLoading && isAuthenticated && role) {
    return <Navigate to={role === "admin" ? "/admin" : "/viewer"} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    // Validate inputs
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: { email?: string; password?: string } = {};
      result.error.issues.forEach((err) => {
        if (err.path[0] === "email") errors.email = err.message;
        if (err.path[0] === "password") errors.password = err.message;
      });

      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    const { success, error: loginError } = await login(email, password);

    // Clear local loading state now that login finished
    setIsLoading(false);

    if (success) {
      if (loginError) {
        // Login succeeded but we had an issue loading role/session
        setError(loginError);
      }
      // Redirect handled by AuthContext + role state
      return;
    } else {
      setError(loginError || "Login failed. Please try again.");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-white via-slate-50 to-primary/5 px-4">
      <div className="w-full max-w-md">
        <Link
          to="/"
          aria-label="Close"
          className="absolute top-6 right-6 flex items-center justify-center w-10 h-10 rounded-lg bg-slate-300 text-slate-900 hover:bg-slate-400 transition-all duration-200"
        >
          <X className="w-6 h-6" />
        </Link>

        {/* Card */}
        <div className="relative p-12">
          {/* Header */}
          <div className="mb-8 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
                <Anchor className="w-5 h-5 text-white" />
              </div>
              <span className="text-4xl font-semibold tracking-wide text-slate-900">
                MARINA
              </span>
            </div>
            <h2 className="text-2xl mt-12 font-semibold tracking-tight text-slate-700">
              Admin Portal
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to access the MARINA dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-slate-500"
              >
                Email
              </Label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 "
                  disabled={isLoading}
                />
              </div>

              {fieldErrors.email && (
                <p className="text-xs text-destructive">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-slate-500"
              >
                Password
              </Label>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />

                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11"
                  disabled={isLoading}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {fieldErrors.password && (
                <p className="text-xs text-destructive">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Forgot password?</span>

              <Link
                to="/forgot-password"
                className="font-medium text-primary hover:underline transition-colors"
              >
                Reset password
              </Link>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-11 text-base font-medium shadow-md hover:shadow-lg transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
            <div className="text-center space-y-1">
              <p className="text-xs text-slate-600">
                © 2025 MARINA Platform. All rights reserved.
              </p>
              <p className="text-[11px] text-slate-600">
                Version 1.0.0 · Thesis Build
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
