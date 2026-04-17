import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getEarlyApeNfts = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    postIds: z.array(z.string().uuid()).min(1).max(50).optional(),
    userId: z.string().uuid().optional(),
  }))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return { nfts: [], error: "Missing env vars" };
    const supabase = createClient(url, key);

    let query = (supabase.from as any)("early_ape_nfts")
      .select("*")
      .order("minted_at", { ascending: false })
      .limit(50);

    if (data.postIds) query = query.in("post_id", data.postIds);
    if (data.userId) query = query.eq("user_id", data.userId);

    const { data: nfts, error } = await query;
    if (error) return { nfts: [], error: error.message };
    return { nfts: nfts ?? [], error: null };
  });
