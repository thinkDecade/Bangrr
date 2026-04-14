/**
 * Pieverse x402b — pieUSD gasless payment contract integration for BSC
 * 
 * pieUSD wraps USDT 1:1 with EIP-3009 support for gasless transfers.
 * Users sign off-chain, the facilitator relays the tx and pays gas.
 *
 * Testnet contracts:
 * - pieUSD: 0xE3a4dB6165AfC991451D0eB86fd5149AFf84c919
 * - USDT:   0x337610d27c682E347C9cD60BD4b3b107C9d34dDd
 */

// pieUSD contract ABI (minimal — deposit, redeem, transferWithAuthorization)
export const PIE_USD_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "redeem",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "transferWithAuthorization",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "DOMAIN_SEPARATOR",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    name: "authorizationState",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "authorizer", type: "address" },
      { name: "nonce", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// Contract addresses — BSC Testnet (chain ID 97)
export const PIEVERSE_CONTRACTS = {
  97: {
    pieUSD: "0xE3a4dB6165AfC991451D0eB86fd5149AFf84c919" as `0x${string}`,
    USDT: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd" as `0x${string}`,
  },
} as const;

// EIP-712 type hash for TransferWithAuthorization
export const TRANSFER_WITH_AUTHORIZATION_TYPEHASH =
  "TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)";

/**
 * Build EIP-712 typed data for a gasless pieUSD transfer.
 * The user signs this off-chain; the facilitator submits it on-chain.
 */
export function buildTransferAuthorization(params: {
  from: `0x${string}`;
  to: `0x${string}`;
  value: bigint;
  validAfter: number;
  validBefore: number;
  nonce: `0x${string}`;
  chainId: number;
  verifyingContract: `0x${string}`;
}) {
  return {
    domain: {
      name: "pieUSD",
      version: "1",
      chainId: params.chainId,
      verifyingContract: params.verifyingContract,
    },
    types: {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    primaryType: "TransferWithAuthorization" as const,
    message: {
      from: params.from,
      to: params.to,
      value: params.value,
      validAfter: BigInt(params.validAfter),
      validBefore: BigInt(params.validBefore),
      nonce: params.nonce,
    },
  };
}

/**
 * Generate a random nonce for EIP-3009
 */
export function generateNonce(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")}` as `0x${string}`;
}

export type GaslessStatus =
  | "idle"
  | "signing"       // User signing EIP-712 message
  | "relaying"      // Facilitator submitting tx
  | "confirming"    // Waiting for block confirmation
  | "confirmed"     // Transfer complete
  | "failed";

export interface GaslessState {
  status: GaslessStatus;
  message: string;
  txHash?: string;
  error?: string;
}
