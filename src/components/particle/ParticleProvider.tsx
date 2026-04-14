import { ConnectKitProvider, createConfig } from "@particle-network/connectkit";
import { authWalletConnectors } from "@particle-network/connectkit/auth";
import { evmWalletConnectors } from "@particle-network/connectkit/evm";
import { bscTestnet, bsc } from "@particle-network/connectkit/chains";
import { wallet, EntryPosition } from "@particle-network/connectkit/wallet";
import { useEffect, useState, type ReactNode } from "react";

const config = createConfig({
  projectId: "bc0e6e7a-2ddb-40c7-8f35-2e38f04af404",
  clientKey: "cp78qvvXDPl5ZtIG9O8e4st1rOUWBWdT1DOUze9L",
  appId: "68a44ae7-dbfe-4276-86ba-bf3f14eca500",
  appearance: {
    recommendedWallets: [
      { walletId: "metaMask", label: "Recommended" },
      { walletId: "trustWallet", label: "Popular" },
    ],
    language: "en-US",
    mode: "dark",
    theme: {
      "--pcm-accent-color": "#00FF85",
      "--pcm-body-background": "#0a0a0a",
      "--pcm-body-background-secondary": "#141414",
      "--pcm-body-color": "#ffffff",
      "--pcm-body-color-secondary": "#8b8b8b",
      "--pcm-button-border-color": "#2a2a2a",
      "--pcm-primary-button-color": "#00FF85",
      "--pcm-primary-button-bankground": "#000000",
    },
    logo: "",
    connectorsOrder: ["social", "wallet"],
    collapseWalletList: false,
    hideContinueButton: false,
  },
  walletConnectors: [
    authWalletConnectors({
      authTypes: ["email", "google", "twitter", "github"],
      fiatCoin: "USD",
      promptSettingConfig: {
        promptMasterPasswordSettingWhenLogin: 1,
        promptPaymentPasswordSettingWhenSign: 1,
      },
    }),
    evmWalletConnectors({
      metadata: {
        name: "BANGRR",
        icon: "",
        description: "Trade attention. APE opinions. EXIT narratives.",
        url: typeof window !== "undefined" ? window.location.origin : "",
      },
    }),
  ],
  plugins: [
    wallet({
      entryPosition: EntryPosition.BR,
      visible: true,
    }),
  ],
  chains: [bscTestnet, bsc],
});

export function ParticleProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ConnectKitProvider config={config}>
      {children}
    </ConnectKitProvider>
  );
}
