import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Watches Particle wallet connection state.
 * When a wallet connects, upserts a profile row with the wallet address.
 * Dynamically imports useAccount to avoid SSR issues.
 */
export function useWalletProfile() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const lastSynced = useRef<string | null>(null);

  // Dynamically watch for Particle account changes (client-only)
  useEffect(() => {
    let cancelled = false;

    const watchAccount = async () => {
      try {
        const { useAccount } = await import("@particle-network/connectkit");
        
        // Since we cannot use hooks conditionally, we rely on the Particle SDK's 
        // event emitter or global state if available, or a polling mechanism 
        // if the hook is not directly usable in this context.
        const checkAccount = () => {
          if (cancelled) return;
          try {
            // Accessing the global particle instance if available
            const particle = (window as any).particle;
            if (particle?.auth?.walletAddress) {
              setWalletAddress(particle.auth.walletAddress);
            }
          } catch (e) {
            console.error("Error checking particle account", e);
          }
        };

        const interval = setInterval(checkAccount, 2000);
        checkAccount();
        return () => clearInterval(interval);
      } catch {
        // Particle SDK not available (SSR or not loaded yet)
      }
    };

    watchAccount();
    return () => { cancelled = true; };
  }, []);

  // Sync wallet address to profile when it changes
  useEffect(() => {
    if (!walletAddress || walletAddress === lastSynced.current) return;

    const syncProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { error } = await supabase
            .from("profiles")
            .update({ wallet_address: walletAddress })
            .eq("id", session.user.id);

          if (!error) {
            lastSynced.current = walletAddress;
            console.log("[wallet-profile] linked wallet", walletAddress);
          }
        }
      } catch (err) {
        console.error("[wallet-profile] unexpected error:", err);
      }
    };

    syncProfile();
  }, [walletAddress]);
}
