import { useEffect, useRef } from "react";
import { useAccount } from "@particle-network/connectkit";
import { supabase } from "@/integrations/supabase/client";

/**
 * Client-only component that syncs Particle wallet address to Supabase profile.
 * Must be rendered inside ParticleProvider and only on the client.
 */
export function WalletProfileSync() {
  const { address, isConnected } = useAccount();
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address || address === lastSynced.current) return;

    const syncProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { error } = await supabase
            .from("profiles")
            .update({ wallet_address: address })
            .eq("id", session.user.id);

          if (!error) {
            lastSynced.current = address;
            console.log("[wallet-profile] linked wallet", address);
          } else {
            console.error("[wallet-profile] update error:", error.message);
          }
        } else {
          // No Supabase session — create a wallet-based account
          const pseudoEmail = `${address.toLowerCase()}@wallet.bangrr.local`;
          const pseudoPass = `wallet_${address}`;

          const { error: signUpError } = await supabase.auth.signUp({
            email: pseudoEmail,
            password: pseudoPass,
            options: { data: { wallet_address: address } },
          });

          if (signUpError?.message?.includes("already registered")) {
            await supabase.auth.signInWithPassword({
              email: pseudoEmail,
              password: pseudoPass,
            });
          }

          const { data: { session: newSession } } = await supabase.auth.getSession();
          if (newSession?.user) {
            await supabase.from("profiles").update({ wallet_address: address }).eq("id", newSession.user.id);
          }

          lastSynced.current = address;
          console.log("[wallet-profile] created wallet profile", address);
        }
      } catch (err) {
        console.error("[wallet-profile] unexpected error:", err);
      }
    };

    syncProfile();
  }, [isConnected, address]);

  return null;
}
