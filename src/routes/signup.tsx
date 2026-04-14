import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@particle-network/connectkit";
import { useWalletProfile } from "@/hooks/use-wallet-profile";

export const Route = createFileRoute("/signup")({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: "/" });
    }
  },
  component: SignupPage,
});

function SignupPage() {
  const { auth } = Route.useRouteContext();
  const navigate = Route.useNavigate();
  useWalletProfile();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await auth.signup(email, password, username);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(`nah. ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <h1 className="text-3xl font-black text-foreground mb-4">
            welcome to the chaos.
          </h1>
          <p className="text-muted-foreground font-mono text-sm mb-6">
            check your email to confirm. then come back and APE.
          </p>
          <Link
            to="/login"
            search={{ redirect: "/" }}
            className="text-primary hover:text-primary/80 font-mono transition-colors"
          >
            → go to login
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
          <h1 className="text-4xl font-black tracking-tighter text-foreground">
            BANGRR
          </h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm">
            join the market. trade attention.
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
              Username
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="degen_trader_69"
              required
              className="bg-card border-border focus:border-primary focus:ring-primary/20"
            />
          </div>

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
              minLength={6}
              className="bg-card border-border focus:border-primary focus:ring-primary/20"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full font-mono font-bold uppercase tracking-wider"
          >
            {loading ? "creating..." : "CREATE ACCOUNT →"}
          </Button>

          <div className="relative flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-mono text-muted-foreground uppercase">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex justify-center [&_button]:!w-full [&_button]:!font-mono [&_button]:!uppercase [&_button]:!tracking-wider">
            <ConnectButton label="CONNECT WALLET →" />
          </div>

          <div className="text-center text-sm">
            <Link
              to="/login"
              search={{ redirect: "/" }}
              className="text-primary hover:text-primary/80 font-mono transition-colors"
            >
              already in? login
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
