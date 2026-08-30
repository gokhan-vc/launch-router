import { z } from "zod";

export const PADS = [
  "clanker",
  "bankr",
  "poolsfun",
  "pons",
  "feelcash",
  "poolstrade",
  "pumpfun",
  "flap",
] as const;

export const FeePreset = z.enum([
  "StaticBasic",
  "DynamicBasic",
  "Dynamic3",
]);

export const Fees = z.object({
  kind: z.enum(["static", "dynamic"]),
  preset: FeePreset.optional(),
  bps: z.number().int().nonnegative().optional(),
});

export const PairedAsset = z.union([
  z.literal("WETH"),
  z.literal("USDG"),
  z.literal("RH_STOCK"),
  z.string().regex(/^0x[a-fA-F0-9]{40}$/),
]);

export const LaunchIntent = z.object({
  name: z.string().min(1),
  symbol: z.string().min(1),
  chainId: z.number().int().positive(),
  pad: z.enum(PADS),
  creator: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  image: z.string().optional(),
  description: z.string().optional(),
  metadataUri: z.string().optional(),
  pairedAsset: PairedAsset.optional(),
  fees: Fees.optional(),
  pool: z
    .object({
      tickIfToken0IsClanker: z.number().optional(),
      tickSpacing: z.number().optional(),
      positions: z.enum(["Standard", "Project", "TwentyETH"]).optional(),
    })
    .optional(),
  mode: z.enum(["instant", "curve", "crowd"]).optional(),
  vault: z.object({ percentage: z.number() }).optional(),
  airdrop: z.object({}).passthrough().optional(),
  sniperFees: z.object({}).passthrough().optional(),
  devBuy: z.object({ ethAmount: z.number() }).optional(),
  vanity: z.boolean().optional(),
  salt: z.string().optional(),
  tokenAdmin: z.string().optional(),
  feeRecipient: z.string().optional(),
});

export type LaunchIntent = z.infer<typeof LaunchIntent>;
export type PadId = (typeof PADS)[number];
