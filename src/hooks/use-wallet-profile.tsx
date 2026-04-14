import { useEffect, useRef } from "react";
import { useAccount } from "@particle-network/connectkit";
import { supabase } from "@/integrations/supabase/client";

/**
 * Watches Particle wallet connection state.
 * When a wallet connects, upserts a profile row with the wallet address.
 * Works for both authenticated (Supabase) and anonymous users —
 * if no Supabase session exists, signs in anonymously first.
 */
export function useWalletProfile() {
  const { address, isConnected } = useAccount();
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address || address === lastSynced.current) return;

    const syncProfile = async () => {
      try {
        // Check for existing Supabase session
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // User is logged in — update their profile with wallet address
          const { error } = await supabase
            .from("profiles")
            .update({ wallet_address: address })
            .eq("id", session.user.id);

          if (error) {
            console.error("[wallet-profile] update error:", error.message);
          } else {
            lastSynced.current = address;
            console.log("[wallet-profile] linked wallet", address);
          }
        } else {
          // No Supabase session — sign up with a deterministic email
          // so the profile trigger fires and we can set the wallet address
          const pseudoEmail = `${address.toLowerCase()}@wallet.bangrr.local`;
          const pseudoPass = `wallet_${address}`;

          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: pseudoEmail,
            password: pseudoPass,
            options: {
              data: { wallet_address: address },
            },
          });

          if (signUpError) {
            // If already exists, try signing in
            if (signUpError.message.includes("already registered")) {
              const { error: loginError } = await supabase.auth.signInWithPassword({
                email: pseudoEmail,
                password: pseudoPass,
              });
              if (loginError) {
                console.error("[wallet-profile] login error:", loginError.message);
                return;
              }
            } else {
              console.error("[wallet-profile] signup error:", signUpError.message);
              return;
            }
          }

          // Now update profile with wallet address
          const { data: { session: newSession } } = await supabase.auth.getSession();
          if (newSession?.user) {
            await supabase
              .from("profiles")
              .update({ wallet_address: address })
              .eq("id", newSession.user.id);
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
}
