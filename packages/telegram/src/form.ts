import type { LaunchIntent, PadId } from "@numetal/launch-kernel";

export type LaunchForm = {
  name: string;
  symbol: string;
  pad: PadId;
  chainId: number;
  creator: string;
  image?: string;
  description?: string;
  metadataUri?: string;
  pairedAsset?: string;
  feeKind?: "static" | "dynamic";
  feePreset?: "StaticBasic" | "DynamicBasic" | "Dynamic3";
  poolPositions?: "Standard" | "Project" | "TwentyETH";
  vanity?: boolean;
  salt?: string;
};

const ADDR = /^0x[a-fA-F0-9]{40}$/;

export function formToIntent(form: LaunchForm): LaunchIntent {
  const creator = form.creator.trim();
  if (!ADDR.test(creator)) {
    throw new Error("connect a wallet — creator must be a 0x address");
  }
  const intent: LaunchIntent = {
    name: form.name.trim(),
    symbol: form.symbol.trim(),
    pad: form.pad,
    chainId: Number(form.chainId),
    creator: creator as `0x${string}`,
  };
  if (form.image?.trim()) intent.image = form.image.trim();
  if (form.description?.trim()) intent.description = form.description.trim();
  if (form.metadataUri?.trim()) intent.metadataUri = form.metadataUri.trim();
  if (form.pairedAsset?.trim()) {
    intent.pairedAsset = form.pairedAsset.trim() as LaunchIntent["pairedAsset"];
  }
  if (form.feeKind) {
    intent.fees = { kind: form.feeKind, preset: form.feePreset };
  }
  if (form.poolPositions) {
    intent.pool = { positions: form.poolPositions };
  }
  if (form.vanity) intent.vanity = true;
  if (form.salt?.trim()) intent.salt = form.salt.trim();
  return intent;
}

export const CHAINS: Record<number, string> = {
  8453: "Base",
  84532: "Base Sepolia",
  1: "Ethereum",
  42161: "Arbitrum",
  56: "BSC",
  130: "Unichain",
  4663: "Robinhood",
};
