import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hooks/agent-cycle")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Verify authorization
        const authHeader = request.headers.get("authorization");
        const lovableContext = request.headers.get("lovable-context");

        // Allow cron jobs or requests with the anon key
        const token = authHeader?.replace("Bearer ", "");
        if (!token) {
          return new Response(
            JSON.stringify({ error: "Missing authorization" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }

        try {
          const { createClient } = await import("@supabase/supabase-js");

          const url = process.env.SUPABASE_URL;
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (!url || !serviceKey) {
            return new Response(
              JSON.stringify({ error: "Missing env vars" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const supabase = createClient(url, serviceKey);

          // Get active posts
          const { data: posts, error: postsError } = await supabase
            .from("posts")
            .select("id, current_price, price_change_pct, volume, content")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(5);

          if (postsError || !posts?.length) {
            return new Response(
              JSON.stringify({ results: [], message: "No active posts" }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          const AGENTS = [
            { name: "RUSH", bias: "APE", tradeChance: 0.7, min: 1, max: 10 },
            { name: "ORACLE", bias: null, tradeChance: 0.4, min: 2, max: 8 },
            { name: "MYTH", bias: null, tradeChance: 0.5, min: 0.5, max: 15 },
          ];

          const results: Array<Record<string, unknown>> = [];

          for (const agent of AGENTS) {
            for (const post of posts) {
              if (Math.random() > agent.tradeChance) continue;

              const price = (post.current_price as number) ?? 1;
              const changePct = (post.price_change_pct as number) ?? 0;

              let action: "APE" | "EXIT";
              if (agent.name === "RUSH") {
                action = changePct >= 0 ? "APE" : "EXIT";
              } else if (agent.name === "ORACLE") {
                action = changePct > 5 ? "EXIT" : changePct < -3 ? "APE" : Math.random() > 0.5 ? "APE" : "EXIT";
              } else {
                action = Math.random() > 0.45 ? "APE" : "EXIT";
              }

              if (action === "EXIT" && price <= 0.05) action = "APE";

              const range = agent.max - agent.min;
              const amount = Math.round((agent.min + Math.random() * range) * 10) / 10;

              const { data: result } = await supabase.rpc("agent_process_trade", {
                _agent_name: agent.name,
                _post_id: post.id,
                _action: action,
                _amount: amount,
              });

              results.push({ agent: agent.name, postId: post.id, action, amount, result });
            }
          }

          return new Response(
            JSON.stringify({ success: true, trades: results.length, results }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (e) {
          console.error("Agent cycle error:", e);
          return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
