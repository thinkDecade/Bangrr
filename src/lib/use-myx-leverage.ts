import { useCallback } from "react";
import { useWallets, usePublicClient } from "@particle-network/connectkit";
import { bscTestnet } from "viem/chains";
import { parseEther, parseEventLogs } from "viem";
import { MYX_CONTRACTS, MYX_POSITION_ROUTER_ABI } from "./myx-contract";

export interface MyxOpenResult {
  positionId: `0x${string}`;
  txHash: `0x${string}`;
}

/**
 * Hook to open a real leveraged position on MYX Finance (BSC Testnet).
 * Returns a positionId we persist server-side alongside the synthetic position.
 */
export function useMyxLeverage() {
  const wallets = useWallets();
  const publicClient = usePublicClient({ chainId: bscTestnet.id });

  const openPosition = useCallback(
    async (params: {
      action: "APE" | "EXIT";
      collateralBnb: number; // collateral in BNB (testnet)
      leverage: number;
    }): Promise<MyxOpenResult> => {
      const primary = wallets[0];
      if (!primary) throw new Error("Connect wallet to open leveraged position");
      if (!publicClient) throw new Error("Public client unavailable");

      const walletClient = primary.getWalletClient<"evm">();
      if (!walletClient) throw new Error("Wallet client unavailable");

      // Ensure BSC Testnet
      if (primary.chainId !== bscTestnet.id) {
        try {
          await (walletClient as unknown as {
            switchChain: (a: { id: number }) => Promise<void>;
          }).switchChain({ id: bscTestnet.id });
        } catch {
          throw new Error(
            `Switch your wallet to BSC Testnet (chain id ${bscTestnet.id})`
          );
        }
      }

      const [account] = primary.accounts;
      const cfg = MYX_CONTRACTS[97];
      const collateralWei = parseEther(params.collateralBnb.toString());

      const txHash = (await walletClient.writeContract({
        account: account as `0x${string}`,
        address: cfg.positionRouter,
        abi: MYX_POSITION_ROUTER_ABI,
        functionName: "openPosition",
        args: [
          cfg.defaultMarket,
          params.action === "APE",
          collateralWei,
          BigInt(params.leverage),
        ],
        value: collateralWei,
        chain: bscTestnet,
      })) as `0x${string}`;

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      const logs = parseEventLogs({
        abi: MYX_POSITION_ROUTER_ABI,
        eventName: "PositionOpened",
        logs: receipt.logs,
      });

      const positionId =
        (logs[0]?.args?.positionId as `0x${string}` | undefined) ??
        ("0x" + "00".repeat(32)) as `0x${string}`;

      return { positionId, txHash };
    },
    [wallets, publicClient]
  );

  const isReady = wallets.length > 0;
  return { openPosition, isReady };
}
