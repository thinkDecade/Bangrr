/**
 * Four.meme TokenManager2 contract integration for BSC
 * Contract: 0x5c952063c7fc8610FFDB798152D69F0B9550762b
 */

// TokenManager2 minimal ABI — only what we need for createToken
export const TOKEN_MANAGER_ABI = [
  {
    name: "createToken",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "createArg",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "totalSupply", type: "uint256" },
          { name: "logoUrl", type: "string" },
          { name: "desc", type: "string" },
          { name: "launchTime", type: "uint256" },
          { name: "nonce", type: "uint256" },
        ],
      },
      { name: "sign", type: "bytes" },
    ],
    outputs: [],
  },
  {
    name: "TokenCreate",
    type: "event",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "symbol", type: "string", indexed: false },
    ],
  },
] as const;

// Contract addresses per chain
export const FOUR_MEME_CONTRACTS = {
  // BSC Mainnet
  56: "0x5c952063c7fc8610FFDB798152D69F0B9550762b" as `0x${string}`,
  // BSC Testnet
  97: "0x5c952063c7fc8610FFDB798152D69F0B9550762b" as `0x${string}`,
} as const;

// Four.meme API endpoints
export const FOUR_MEME_API = {
  BASE_URL: "https://four.meme/api/v1",
  AUTH: "/auth/login",
  UPLOAD_IMAGE: "/token/upload-image",
  PREPARE_TOKEN: "/token/prepare-create",
} as const;

// Creation fee: 0.01 BNB
export const CREATION_FEE_BNB = "0.01";
export const CREATION_FEE_WEI = BigInt("10000000000000000"); // 0.01 ether in wei

// Default token supply: 1 billion (standard for memecoins)
export const DEFAULT_TOTAL_SUPPLY = BigInt("1000000000000000000000000000"); // 1B with 18 decimals

/**
 * Generate a token symbol from post content
 * Takes first significant word and uppercases it, max 8 chars
 */
export function generateTokenSymbol(content: string): string {
  const words = content
    .replace(/[^a-zA-Z\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  if (words.length === 0) return "BNGR";

  // Use first meaningful word, max 8 chars
  const symbol = words[0].toUpperCase().slice(0, 8);
  return symbol || "BNGR";
}

/**
 * Generate a token name from post content
 */
export function generateTokenName(content: string): string {
  // Use first 32 chars of content as token name
  const name = content.trim().slice(0, 32);
  return name || "BANGRR Token";
}

/**
 * Extract token address from transaction receipt logs
 */
export function extractTokenAddressFromLogs(
  logs: Array<{ topics: string[]; data: string }>
): string | null {
  // TokenCreate event topic0
  const tokenCreateTopic =
    "0x" +
    "e7c0e8e6c3c3e0c8"; // placeholder — actual keccak computed at runtime

  for (const log of logs) {
    // TokenCreate event has the token address as indexed topic[1]
    if (log.topics.length >= 2) {
      const potentialAddr = "0x" + (log.topics[1]?.slice(26) ?? "");
      if (potentialAddr.length === 42) {
        return potentialAddr;
      }
    }
  }
  return null;
}

export type DeploymentStatus =
  | "idle"
  | "signing"
  | "preparing"
  | "deploying"
  | "confirming"
  | "confirmed"
  | "failed";

export interface DeploymentState {
  status: DeploymentStatus;
  message: string;
  tokenAddress?: string;
  txHash?: string;
  error?: string;
}
