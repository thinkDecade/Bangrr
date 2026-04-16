import { useCallback } from "react";
import { useWallets } from "@particle-network/connectkit";
import { bscTestnet } from "viem/chains";
import {
  buildTransferAuthorization,
  generateNonce,
  PIEVERSE_CONTRACTS,
} from "./pieverse-contract";

// BANGRR treasury address — receives pieUSD for trade settlement on testnet.
// In production, swap to a multisig / settlement contract.
const TREASURY_ADDRESS =
  "0x000000000000000000000000000000000000dEaD" as `0x${string}`;

export interface SignedAuthorization {
  signature: `0x${string}`;
  from: `0x${string}`;
  to: `0x${string}`;
  value: string; // stringified bigint (6 decimals — pieUSD wraps USDT)
  validAfter: number;
  validBefore: number;
  nonce: `0x${string}`;
}

/**
 * Hook that returns a function to sign an EIP-712 pieUSD TransferWithAuthorization.
 * Off-chain signature — the facilitator submits on-chain and pays gas.
 */
export function usePieverseSign() {
  const wallets = useWallets();

  const sign = useCallback(
    async (amountUsd: number): Promise<SignedAuthorization> => {
      const primary = wallets[0];
      if (!primary) throw new Error("No wallet connected");

      const walletClient = primary.getWalletClient<"evm">();
      if (!walletClient) throw new Error("Wallet client unavailable");

      // Ensure on BSC Testnet
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
      const from = account as `0x${string}`;
      const pieUSD = PIEVERSE_CONTRACTS[97].pieUSD;

      // pieUSD wraps USDT 1:1 with 6 decimals
      const value = BigInt(Math.round(amountUsd * 1_000_000));
      const now = Math.floor(Date.now() / 1000);
      const validAfter = 0;
      const validBefore = now + 60 * 10; // 10-minute window
      const nonce = generateNonce();

      const typedData = buildTransferAuthorization({
        from,
        to: TREASURY_ADDRESS,
        value,
        validAfter,
        validBefore,
        nonce,
        chainId: bscTestnet.id,
        verifyingContract: pieUSD,
      });

      const signature = (await walletClient.signTypedData({
        account: from,
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      })) as `0x${string}`;

      return {
        signature,
        from,
        to: TREASURY_ADDRESS,
        value: value.toString(),
        validAfter,
        validBefore,
        nonce,
      };
    },
    [wallets]
  );

  const isReady = wallets.length > 0;
  return { sign, isReady };
}
