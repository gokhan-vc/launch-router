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
  clankerFee: z.number().optional(),
  pairedFee: z.number().optional(),
  baseFee: z.number().optional(),
  maxFee: z.number().optional(),
  referenceTickFilterPeriod: z.number().optional(),
  resetPeriod: z.number().optional(),
  resetTickFilter: z.number().optional(),
  feeControlNumerator: z.number().optional(),
  decayFilterBps: z.number().optional(),
});

export const Vault = z.object({
  percentage: z.number().min(0).max(100),
  lockupDuration: z.number().int().nonnegative().optional(),
  vestingDuration: z.number().int().nonnegative().optional(),
  recipient: z.string().optional(),
});

export const SniperFees = z.object({
  startingFee: z.number().int().nonnegative().optional(),
  endingFee: z.number().int().nonnegative().optional(),
  secondsToDecay: z.number().int().nonnegative().optional(),
});

export const Rewards = z.object({
  creatorBps: z.number().int().min(0).max(10000).optional(),
  interfaceAdmin: z.string().optional(),
  recipients: z
    .array(
      z.object({
        admin: z.string(),
        recipient: z.string(),
        bps: z.number().int().min(0).max(10000),
        token: z.enum(["Both", "Paired", "Clanker"]),
      }),
    )
    .optional(),
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
      customPositions: z
        .array(
          z.object({
            tickLower: z.number(),
            tickUpper: z.number(),
            positionBps: z.number(),
          }),
        )
        .optional(),
    })
    .optional(),
  mode: z.enum(["instant", "curve", "crowd"]).optional(),
  vault: Vault.optional(),
  airdrop: z.object({}).passthrough().optional(),
  sniperFees: SniperFees.optional(),
  devBuy: z
    .object({
      ethAmount: z.number().nonnegative(),
      recipient: z.string().optional(),
      amountOutMin: z.number().optional(),
    })
    .optional(),
  rewards: Rewards.optional(),
  vanity: z.boolean().optional(),
  salt: z.string().optional(),
  tokenAdmin: z.string().optional(),
  feeRecipient: z.string().optional(),
  expectedStartTick: z.number().optional(),
  deadline: z.number().int().optional(),
  socials: z
    .array(z.object({ platform: z.string(), url: z.string() }))
    .optional(),
  auditUrls: z.array(z.string()).optional(),
  context: z
    .object({
      interface: z.string().optional(),
      platform: z.string().optional(),
      messageId: z.string().optional(),
      id: z.string().optional(),
    })
    .optional(),
  locker: z
    .object({
      locker: z.string(),
      lockerData: z.string().optional(),
    })
    .optional(),
  poolExtension: z
    .object({
      address: z.string(),
      initData: z.string(),
    })
    .optional(),
  presaleBps: z.number().int().min(0).max(10000).optional(),
  feesCustom: z.record(z.string(), z.unknown()).optional(),
});

export type LaunchIntent = z.infer<typeof LaunchIntent>;
export type PadId = (typeof PADS)[number];
