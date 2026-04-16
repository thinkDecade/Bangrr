import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Relay a gasless pieUSD transfer via the facilitator.
 * 
 * Flow:
 * 1. Client signs EIP-712 TransferWithAuthorization off-chain
 * 2. Client sends signature + params to this server function
 * 3. Server relays to the facilitator (or directly to contract in testnet mode)
 * 4. Facilitator pays gas and submits transferWithAuthorization on-chain
 * 5. Returns tx hash to client
 */
export const relayGaslessTransfer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      from: z.string().min(1).max(42).regex(/^0x[a-fA-F0-9]{40}$/),
      to: z.string().min(1).max(42).regex(/^0x[a-fA-F0-9]{40}$/),
      value: z.string().min(1).max(78), // stringified bigint
      validAfter: z.number().int().min(0),
      validBefore: z.number().int().min(0),
      nonce: z.string().min(1).max(66).regex(/^0x[a-fA-F0-9]{64}$/),
      signature: z.string().min(1).max(200),
    })
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    try {
      // In production, this calls a Pieverse facilitator endpoint:
      // POST https://facilitator.pieverse.io/settle
      // with the x402b payment payload
      //
      // For testnet, we simulate the relay — the facilitator would:
      // 1. Call pieUSD.transferWithAuthorization() on-chain
      // 2. Pay the gas fee
      // 3. Return the tx hash

      // Simulate facilitator relay
      const mockTxHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")}`;

      // Simulate processing delay (facilitator submits + 1 block confirmation)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log(
        `[Pieverse] Gasless relay: ${data.from} → ${data.to}, value=${data.value}, user=${userId}`
      );

      return {
        success: true,
        txHash: mockTxHash,
        gasSponsored: true,
        error: null,
      };
    } catch (err) {
      console.error("[Pieverse] Relay failed:", err);
      return {
        success: false,
        txHash: null,
        gasSponsored: false,
        error: err instanceof Error ? err.message : "Relay failed",
      };
    }
  });

/**
 * Execute a gasless trade — combines Pieverse relay with BANGRR trade engine.
 * User signs the pieUSD transfer off-chain, we relay it, then process the trade.
 */
export const executeGaslessTrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      postId: z.string().uuid(),
      action: z.enum(["APE", "EXIT"]),
      amount: z.number().min(0.01).max(10000),
      // Signed EIP-712 TransferWithAuthorization
      gaslessSignature: z.string().min(1).max(200).regex(/^0x[a-fA-F0-9]+$/),
      from: z.string().min(1).max(42).regex(/^0x[a-fA-F0-9]{40}$/),
      to: z.string().min(1).max(42).regex(/^0x[a-fA-F0-9]{40}$/).optional(),
      value: z.string().min(1).max(78).optional(),
      validAfter: z.number().int().min(0).optional(),
      validBefore: z.number().int().min(0).optional(),
      nonce: z.string().min(1).max(66).regex(/^0x[a-fA-F0-9]{64}$/),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    try {
      // Step 1: Relay the gasless pieUSD transfer via facilitator
      // (In production, this deducts pieUSD from user → BANGRR treasury)
      const mockRelayTxHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")}`;

      // Step 2: Process the trade in BANGRR's engine (same as regular trade)
      const { data: result, error } = await supabase.rpc("process_trade", {
        _post_id: data.postId,
        _action: data.action,
        _amount: data.amount,
      });

      if (error) {
        console.error("Gasless trade RPC error:", error);
        return {
          success: false,
          error: error.message,
          gasless: true,
          relayTxHash: mockRelayTxHash,
          newPrice: 0,
          priceChangePct: 0,
        };
      }

      const parsed = result as {
        success: boolean;
        error?: string;
        new_price?: number;
        price_change_pct?: number;
      };

      if (!parsed.success) {
        return {
          success: false,
          error: parsed.error ?? "Trade failed",
          gasless: true,
          relayTxHash: mockRelayTxHash,
          newPrice: 0,
          priceChangePct: 0,
        };
      }

      // Log that this was a gasless trade
      await supabase.from("activity_feed").insert({
        actor_type: "system",
        actor_name: "PIEVERSE",
        action: "GASLESS_" + data.action,
        post_id: data.postId,
        metadata: {
          amount: data.amount,
          gasless: true,
          relay_tx: mockRelayTxHash,
          new_price: parsed.new_price,
        },
      });

      return {
        success: true,
        error: null,
        gasless: true,
        relayTxHash: mockRelayTxHash,
        newPrice: parsed.new_price ?? 0,
        priceChangePct: parsed.price_change_pct ?? 0,
      };
    } catch (err) {
      console.error("[Pieverse] Gasless trade failed:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Gasless trade failed",
        gasless: true,
        relayTxHash: null,
        newPrice: 0,
        priceChangePct: 0,
      };
    }
  });
