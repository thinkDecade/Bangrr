/**
 * Early Ape NFT — BEP-721 contract config (BSC Testnet).
 *
 * Mints a soul-bound badge to the first APE trader on a post once the price
 * crosses 5× the initial price. Token IDs are assigned by the DB and minted
 * on-chain via `mintTo(address, tokenId)`.
 *
 * Production address should be swapped via env when the deployed contract
 * is verified. Placeholder mints will revert — UX shows the wallet prompt
 * and a clear error toast.
 */

export const EARLY_APE_CONTRACTS = {
  // BSC Testnet (97)
  97: {
    address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  },
} as const;

// Minimal mint ABI (OpenZeppelin-style ERC721)
export const EARLY_APE_ABI = [
  {
    type: "function",
    name: "mintTo",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "owner", type: "address" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
    ],
  },
] as const;
