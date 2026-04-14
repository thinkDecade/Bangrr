import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Feed — BANGRRR" },
      { name: "description", content: "Trade attention on live opinions. APE or EXIT." },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-volt glow-volt">FEED</h1>
        <p className="text-muted-foreground">Trading feed coming soon.</p>
        <Link to="/" className="text-sm text-cyan hover:underline">
          ← Back to market
        </Link>
      </div>
    </div>
  );
}
