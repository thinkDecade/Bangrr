import { useCallback } from "react";
import { usePublicClient, useWallets } from "@particle-network/connectkit";
import {
  parseEventLogs,
  type Address,
  type Hash,
} from "viem";
import { bscTestnet } from "viem/chains";
import {
  TOKEN_MANAGER_ABI,
  FOUR_MEME_CONTRACTS,
  CREATION_FEE_WEI,
  DEFAULT_TOTAL_SUPPLY,
} from "./fourmeme-contract";

export interface DeployArgs {
  name: string;
  symbol: string;
  description: string;
  launchTime: number; // unix seconds
  nonce: number;
}

export interface DeployResult {
  txHash: Hash;
  tokenAddress: Address;
}

/**
 * Hook that returns a function to deploy a Four.meme token via the user's connected wallet.
 * Calls TokenManager2.createToken on BSC Testnet with 0.01 BNB creation fee.
 */
export function useFourMemeDeploy() {
  const wallets = useWallets();
  const publicClient = usePublicClient({ chainId: bscTestnet.id });

  const deploy = useCallback(
    async (args: DeployArgs): Promise<DeployResult> => {
      const primary = wallets[0];
      if (!primary) throw new Error("No wallet connected");
      if (!publicClient) throw new Error("Public client unavailable");

      const walletClient = primary.getWalletClient<"evm">();
      if (!walletClient) throw new Error("Wallet client unavailable");

      // Ensure on BSC Testnet (chain 97)
      if (primary.chainId !== bscTestnet.id) {
        try {
          await (walletClient as unknown as {
            switchChain: (a: { id: number }) => Promise<void>;
          }).switchChain({ id: bscTestnet.id });
        } catch (e) {
          throw new Error(
            `Switch your wallet to BSC Testnet (chain id ${bscTestnet.id})`
          );
        }
      }

      const contractAddress = FOUR_MEME_CONTRACTS[97];
      const [account] = primary.accounts;

      const createArg = {
        name: args.name,
        symbol: args.symbol,
        totalSupply: DEFAULT_TOTAL_SUPPLY,
        logoUrl: "",
        desc: args.description,
        launchTime: BigInt(args.launchTime),
        nonce: BigInt(args.nonce),
      } as const;

      // Send the transaction — empty signature works for direct on-chain create on testnet
      const txHash = (await walletClient.writeContract({
        address: contractAddress,
        abi: TOKEN_MANAGER_ABI,
        functionName: "createToken",
        args: [createArg, "0x"],
        value: CREATION_FEE_WEI,
        account: account as Address,
        chain: bscTestnet,
      })) as Hash;

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
      });

      // Parse TokenCreate event for the deployed token address
      let tokenAddress: Address | null = null;
      try {
        const events = parseEventLogs({
          abi: TOKEN_MANAGER_ABI,
          eventName: "TokenCreate",
          logs: receipt.logs,
        });
        if (events.length > 0) {
          const ev = events[0] as unknown as { args: { token: Address } };
          tokenAddress = ev.args.token;
        }
      } catch {
        // fallback: scan logs for first indexed address
        for (const log of receipt.logs) {
          if (log.topics.length >= 2 && log.topics[1]) {
            const candidate = ("0x" + log.topics[1].slice(26)) as Address;
            if (candidate.length === 42) {
              tokenAddress = candidate;
              break;
            }
          }
        }
      }

      if (!tokenAddress) {
        throw new Error("Token created but address could not be parsed");
      }

      return { txHash, tokenAddress };
    },
    [wallets, publicClient]
  );

  const isReady = wallets.length > 0;

  return { deploy, isReady };
}
