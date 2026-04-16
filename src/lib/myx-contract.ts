/**
 * MYX Finance — perpetual leverage contract config (BSC Testnet).
 *
 * MYX is a non-custodial perp DEX. On testnet we wire to a placeholder
 * PositionRouter that mirrors the production interface:
 *   openPosition(market, isLong, collateral, leverage) payable
 *   closePosition(positionId)
 *
 * Production address should be swapped via env when MYX testnet deployment
 * confirms. For now we use a known-format placeholder that will revert on
 * unfunded calls (safe — UX still shows wallet prompt + clear error).
 */

export const MYX_CONTRACTS = {
  // BSC Testnet (97)
  97: {
    positionRouter:
      "0x0000000000000000000000000000000000000000" as `0x${string}`,
    // Market identifier — for testnet, single mock perp market
    defaultMarket:
      "0x0000000000000000000000000000000000000001" as `0x${string}`,
  },
} as const;

// Minimal ABI matching the on-chain PositionRouter
export const MYX_POSITION_ROUTER_ABI = [
  {
    type: "function",
    name: "openPosition",
    stateMutability: "payable",
    inputs: [
      { name: "market", type: "address" },
      { name: "isLong", type: "bool" },
      { name: "collateral", type: "uint256" },
      { name: "leverage", type: "uint256" },
    ],
    outputs: [{ name: "positionId", type: "bytes32" }],
  },
  {
    type: "function",
    name: "closePosition",
    stateMutability: "nonpayable",
    inputs: [{ name: "positionId", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "event",
    name: "PositionOpened",
    inputs: [
      { name: "trader", type: "address", indexed: true },
      { name: "positionId", type: "bytes32", indexed: true },
      { name: "isLong", type: "bool", indexed: false },
      { name: "collateral", type: "uint256", indexed: false },
      { name: "leverage", type: "uint256", indexed: false },
    ],
  },
] as const;
