import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const openLeveragedPosition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      postId: z.string().uuid(),
      action: z.enum(["APE", "EXIT"]),
      amount: z.number().min(0.01).max(10000),
      leverage: z.number().refine((v) => [2, 5, 10].includes(v), "Must be 2, 5, or 10"),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: result, error } = await supabase.rpc("open_leveraged_position", {
      _post_id: data.postId,
      _action: data.action,
      _amount: data.amount,
      _leverage: data.leverage,
    });

    if (error) {
      console.error("openLeveragedPosition error:", error);
      return { success: false, error: error.message };
    }

    const parsed = result as {
      success: boolean;
      error?: string;
      position_id?: string;
      entry_price?: number;
      liquidation_price?: number;
      leverage?: number;
    };

    if (!parsed.success) {
      return { success: false, error: parsed.error ?? "Failed to open position" };
    }

    return {
      success: true,
      error: null,
      positionId: parsed.position_id,
      entryPrice: parsed.entry_price,
      liquidationPrice: parsed.liquidation_price,
      leverage: parsed.leverage,
    };
  });

export const getUserLeveragedPositions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      postId: z.string().uuid().optional(),
      openOnly: z.boolean().default(true),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    let query = supabase
      .from("leveraged_positions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data.postId) query = query.eq("post_id", data.postId);
    if (data.openOnly) query = query.eq("is_open", true);

    const { data: positions, error } = await query;

    if (error) {
      console.error("getUserLeveragedPositions error:", error);
      return { positions: [], error: error.message };
    }

    return { positions: positions ?? [], error: null };
  });

export const checkLiquidations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      postId: z.string().uuid(),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: result, error } = await supabase.rpc("check_liquidations", {
      _post_id: data.postId,
    });

    if (error) {
      console.error("checkLiquidations error:", error);
      return { liquidated: 0, error: error.message };
    }

    const parsed = result as { liquidated: number; current_price: number };
    return { liquidated: parsed.liquidated, currentPrice: parsed.current_price, error: null };
  });
