import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  validateSearch: (search) => ({
    redirect: ((search as Record<string, unknown>).redirect as string) || "/",
  }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { auth } = Route.useRouteContext();
  const search = Route.useSearch();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const systemMessages = [
    "Wrong keys.",
    "Too slow.",
    "You missed it.",
    "Access denied.",
    "Try harder.",
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await auth.login(email, password);
      window.location.href = search.redirect;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      const randomVoice = systemMessages[Math.floor(Math.random() * systemMessages.length)];
      setError(`${randomVoice} (${msg})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-foreground">
            BANGRR
          </h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm">
            enter the market.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-sm font-mono"
            >
              {error}
            </motion.div>
          )}

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

          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-card border-border focus:border-primary focus:ring-primary/20"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full font-mono font-bold uppercase tracking-wider"
          >
            {loading ? "entering..." : "APE IN →"}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Link
              to="/signup"
              className="text-primary hover:text-primary/80 font-mono transition-colors"
            >
              create account
            </Link>
            <Link
              to="/reset-password"
              className="text-muted-foreground hover:text-foreground font-mono transition-colors"
            >
              forgot password?
            </Link>
          </div>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8 font-mono">
          attention is the asset. trade it.
        </p>
      </motion.div>
    </div>
  );
}
