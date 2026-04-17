import { useCallback } from "react";
import { useWallets, usePublicClient } from "@particle-network/connectkit";
import { bscTestnet } from "viem/chains";
import { EARLY_APE_CONTRACTS, EARLY_APE_ABI } from "./early-ape-contract";

export interface MintResult {
  txHash: `0x${string}`;
  tokenId: number;
}

/**
 * Hook to mint an Early Ape NFT badge on BSC Testnet.
 * Pairs with the DB record — caller passes the assigned tokenId.
 */
export function useEarlyApeMint() {
  const wallets = useWallets();
  const publicClient = usePublicClient({ chainId: bscTestnet.id });

  const mint = useCallback(
    async (params: { tokenId: number }): Promise<MintResult> => {
      const primary = wallets[0];
      if (!primary) throw new Error("Connect wallet to claim Early Ape NFT");
      if (!publicClient) throw new Error("Public client unavailable");

      const walletClient = primary.getWalletClient<"evm">();
      if (!walletClient) throw new Error("Wallet client unavailable");

      // Ensure BSC Testnet
      if (primary.chainId !== bscTestnet.id) {
        try {
          await (
            walletClient as unknown as {
              switchChain: (a: { id: number }) => Promise<void>;
            }
          ).switchChain({ id: bscTestnet.id });
        } catch {
          throw new Error(
            `Switch your wallet to BSC Testnet (chain id ${bscTestnet.id})`
          );
        }
      }

      const [account] = primary.accounts;
      const cfg = EARLY_APE_CONTRACTS[97];

      const txHash = (await walletClient.writeContract({
        account: account as `0x${string}`,
        address: cfg.address,
        abi: EARLY_APE_ABI,
        functionName: "mintTo",
        args: [account as `0x${string}`, BigInt(params.tokenId)],
        chain: bscTestnet,
      })) as `0x${string}`;

      // Wait for inclusion to confirm the badge was minted
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      return { txHash, tokenId: params.tokenId };
    },
    [wallets, publicClient]
  );

  const isReady = wallets.length > 0;
  return { mint, isReady };
}
