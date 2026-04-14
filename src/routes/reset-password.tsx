import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { auth } = Route.useRouteContext();
  const [mode, setMode] = useState<"request" | "update">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash.includes("type=recovery")) {
        setMode("update");
      }
    }
  }, []);

  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await auth.resetPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("passwords don't match. focus.");
      return;
    }
    setLoading(true);
    try {
      await auth.updatePassword(password);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success && mode === "request") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center max-w-md"
        >
          <h1 className="text-2xl font-black text-foreground mb-4">
            check your email.
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            if you're in the system, you'll get a reset link.
          </p>
        </motion.div>
      </div>
    );
  }

  if (success && mode === "update") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center max-w-md"
        >
          <h1 className="text-2xl font-black text-foreground mb-4">
            password updated.
          </h1>
          <Link
            to="/login"
            search={{ redirect: "/" }}
            className="text-primary hover:text-primary/80 font-mono transition-colors"
          >
            → back to login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-foreground">
            {mode === "request" ? "reset password" : "new password"}
          </h1>
        </div>

        <form
          onSubmit={mode === "request" ? handleRequestReset : handleUpdatePassword}
          className="space-y-4"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-sm font-mono"
            >
              {error}
            </motion.div>
          )}

          {mode === "request" ? (
            <div className="space-y-2">
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-card border-border focus:border-primary focus:ring-primary/20"
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  New Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="bg-card border-border focus:border-primary focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="bg-card border-border focus:border-primary focus:ring-primary/20"
                />
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full font-mono font-bold uppercase tracking-wider"
          >
            {loading
              ? "processing..."
              : mode === "request"
                ? "SEND RESET LINK →"
                : "UPDATE PASSWORD →"}
          </Button>

          <div className="text-center text-sm">
            <Link
              to="/login"
              search={{ redirect: "/" }}
              className="text-muted-foreground hover:text-foreground font-mono transition-colors"
            >
              ← back to login
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
