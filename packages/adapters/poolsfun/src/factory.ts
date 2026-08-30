import { defineChain } from "viem";

/** Robinhood Chain PartyFactory — pools.fun. Source verified on Blockscout. */
export const PARTY_FACTORY =
  "0x626C3d09B65bF5d1D40E0D5F25e19fa49783B3D4" as const;

export const WETH_RH = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73" as const;

export const RH_RPC = "https://rpc.mainnet.chain.robinhood.com";

export const RH_EXPLORER = "https://robinhoodchain.blockscout.com";

export const robinhood = defineChain({
  id: 4663,
  name: "Robinhood",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [RH_RPC] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: RH_EXPLORER },
  },
});

/**
 * Verified PartyFactory ABI (launch + views used to build a signable tx).
 * launch(string,string,string,bytes32,address,int24,uint256,address,address,uint256,uint256)
 */
export const PARTY_FACTORY_ABI = [
  {
    type: "function",
    name: "launch",
    stateMutability: "payable",
    inputs: [
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "metadataUri", type: "string" },
      { name: "salt", type: "bytes32" },
      { name: "pairedAsset", type: "address" },
      { name: "expectedStartTick", type: "int24" },
      { name: "deadline", type: "uint256" },
      { name: "creator", type: "address" },
      { name: "feeRecipient", type: "address" },
      { name: "devBuyAmountIn", type: "uint256" },
      { name: "devBuyMinOut", type: "uint256" },
    ],
    outputs: [
      { name: "token", type: "address" },
      { name: "pool", type: "address" },
      { name: "devBuyOut", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "startTickFor",
    stateMutability: "view",
    inputs: [{ name: "pairedAsset", type: "address" }],
    outputs: [
      { name: "tick", type: "int24" },
      { name: "live", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "computeTokenAddress",
    stateMutability: "view",
    inputs: [
      { name: "deployer", type: "address" },
      { name: "salt", type: "bytes32" },
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "metadataUri", type: "string" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "event",
    name: "TokenLaunched",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "pool", type: "address", indexed: true },
      { name: "pairedAsset", type: "address", indexed: false },
      { name: "creator", type: "address", indexed: true },
      { name: "deployer", type: "address", indexed: false },
      { name: "feeRecipient", type: "address", indexed: false },
      { name: "startTick", type: "int24", indexed: false },
      { name: "metadataUri", type: "string", indexed: false },
      { name: "devBuyAmountOut", type: "uint256", indexed: false },
    ],
  },
] as const;
