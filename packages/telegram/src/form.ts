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
  customPair?: string;
  feeKind?: "static" | "dynamic";
  feePreset?: "StaticBasic" | "DynamicBasic" | "Dynamic3";
  feePct?: number;
  clankerFeePct?: number;
  pairedFeePct?: number;
  poolPositions?: "Standard" | "Project" | "TwentyETH";
  tickIfToken0IsClanker?: number;
  tickSpacing?: number;
  mode?: "instant" | "curve" | "crowd";
  vaultPct?: number;
  vaultLockupDays?: number;
  vaultVestDays?: number;
  vaultRecipient?: string;
  sniperStartPct?: number;
  sniperEndPct?: number;
  sniperDecay?: number;
  devBuyEth?: number;
  devBuyRecipient?: string;
  creatorRewardPct?: number;
  interfaceAdmin?: string;
  rewardRecipient?: string;
  rewardRecipientPct?: number;
  vanity?: boolean;
  tokenAdmin?: string;
  feeRecipient?: string;
  expectedStartTick?: number;
  deadline?: number;
  twitterUrl?: string;
  websiteUrl?: string;
  telegramUrl?: string;
  airdropJson?: string;
  socialsJson?: string;
  auditUrls?: string;
  airdropRoot?: string;
  airdropAmount?: number;
  airdropLockupDays?: number;
  airdropVestDays?: number;
  airdropAdmin?: string;
  contextInterface?: string;
  contextPlatform?: string;
  locker?: string;
  lockerData?: string;
  poolExtAddress?: string;
  poolExtInit?: string;
  presalePct?: number;
  feesCustomJson?: string;
  poolPositionsJson?: string;
  rewardsJson?: string;
};

const ADDR = /^0x[a-fA-F0-9]{40}$/;

function num(v: unknown): number | undefined {
  if (v === "" || v === undefined || v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function json<T>(raw: string | undefined, label: string): T | undefined {
  if (!raw?.trim()) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`${label} JSON is invalid`);
  }
}

function pctToBps(pct: number | undefined): number | undefined {
  if (pct === undefined) return undefined;
  return Math.round(pct * 100);
}

function pctToUniBps(pct: number | undefined): number | undefined {
  if (pct === undefined) return undefined;
  return Math.round(pct * 10_000);
}

function daysToSec(days: number | undefined): number | undefined {
  if (days === undefined) return undefined;
  return Math.round(days * 86_400);
}

export function formToIntent(form: LaunchForm): LaunchIntent {
  const creator = form.creator.trim();
  if (!ADDR.test(creator)) {
    throw new Error("connect a wallet — creator must be a 0x address");
  }
  const pair = form.customPair?.trim() || form.pairedAsset?.trim();
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
  if (pair) intent.pairedAsset = pair as LaunchIntent["pairedAsset"];
  const feeBps = pctToBps(num(form.feePct));
  if (form.feeKind || feeBps !== undefined) {
    intent.fees = {
      kind: form.feeKind ?? "static",
      preset: form.feePreset,
      bps: feeBps,
    };
  }
  const feesCustom = json<Record<string, unknown>>(
    form.feesCustomJson,
    "custom fees",
  );
  const clankerFee = pctToBps(num(form.clankerFeePct));
  const pairedFee = pctToBps(num(form.pairedFeePct));
  if (feesCustom) intent.feesCustom = feesCustom;
  else if (clankerFee !== undefined || pairedFee !== undefined) {
    intent.feesCustom = {
      type: form.feeKind || "static",
      clankerFee,
      pairedFee,
    };
  }
  const customPositions = json<
    { tickLower: number; tickUpper: number; positionBps: number }[]
  >(form.poolPositionsJson, "custom pool positions");
  const tick = num(form.tickIfToken0IsClanker);
  const spacing = num(form.tickSpacing);
  if (
    form.poolPositions ||
    tick !== undefined ||
    spacing !== undefined ||
    customPositions
  ) {
    intent.pool = {
      positions: form.poolPositions,
      tickIfToken0IsClanker: tick,
      tickSpacing: spacing,
      customPositions,
    };
  }
  if (form.mode) intent.mode = form.mode;
  const vp = num(form.vaultPct);
  if (vp !== undefined) {
    intent.vault = {
      percentage: vp,
      lockupDuration: daysToSec(num(form.vaultLockupDays)),
      vestingDuration: daysToSec(num(form.vaultVestDays)),
      recipient: form.vaultRecipient?.trim() || undefined,
    };
  }
  if (
    num(form.sniperStartPct) !== undefined ||
    num(form.sniperEndPct) !== undefined ||
    num(form.sniperDecay) !== undefined
  ) {
    intent.sniperFees = {
      startingFee: pctToUniBps(num(form.sniperStartPct)),
      endingFee: pctToUniBps(num(form.sniperEndPct)),
      secondsToDecay: num(form.sniperDecay),
    };
  }
  const buy = num(form.devBuyEth);
  if (buy !== undefined) {
    intent.devBuy = {
      ethAmount: buy,
      recipient: form.devBuyRecipient?.trim() || undefined,
    };
  }
  const rewardRecipients = json<
    NonNullable<LaunchIntent["rewards"]>["recipients"]
  >(form.rewardsJson, "rewards recipients");
  const extraPct = pctToBps(num(form.rewardRecipientPct));
  const extraAddr = form.rewardRecipient?.trim();
  const builtRecipients =
    rewardRecipients ??
    (extraAddr && extraPct !== undefined
      ? [
          {
            admin: extraAddr,
            recipient: extraAddr,
            bps: extraPct,
            token: "Both" as const,
          },
        ]
      : undefined);
  const creatorBps = pctToBps(num(form.creatorRewardPct));
  if (creatorBps !== undefined || form.interfaceAdmin?.trim() || builtRecipients) {
    intent.rewards = {
      creatorBps,
      interfaceAdmin: form.interfaceAdmin?.trim() || undefined,
      recipients: builtRecipients,
    };
  }
  if (form.vanity) intent.vanity = true;
  if (form.tokenAdmin?.trim()) intent.tokenAdmin = form.tokenAdmin.trim();
  if (form.feeRecipient?.trim()) intent.feeRecipient = form.feeRecipient.trim();
  const startTick = num(form.expectedStartTick);
  if (startTick !== undefined) intent.expectedStartTick = startTick;
  const deadline = num(form.deadline);
  if (deadline !== undefined) intent.deadline = deadline;
  const airdrop = json<Record<string, unknown>>(form.airdropJson, "airdrop");
  if (airdrop) intent.airdrop = airdrop;
  else if (
    form.airdropRoot?.trim() ||
    num(form.airdropAmount) !== undefined ||
    num(form.airdropLockupDays) !== undefined
  ) {
    intent.airdrop = {
      merkleRoot: form.airdropRoot?.trim(),
      amount: num(form.airdropAmount),
      lockupDuration: daysToSec(num(form.airdropLockupDays)),
      vestingDuration: daysToSec(num(form.airdropVestDays)),
      admin: form.airdropAdmin?.trim(),
    };
  }
  const socials = json<{ platform: string; url: string }[]>(
    form.socialsJson,
    "socials",
  );
  if (socials) intent.socials = socials;
  else {
    const fromUrls: { platform: string; url: string }[] = [];
    if (form.twitterUrl?.trim())
      fromUrls.push({ platform: "x", url: form.twitterUrl.trim() });
    if (form.websiteUrl?.trim())
      fromUrls.push({ platform: "website", url: form.websiteUrl.trim() });
    if (form.telegramUrl?.trim())
      fromUrls.push({ platform: "telegram", url: form.telegramUrl.trim() });
    if (fromUrls.length) intent.socials = fromUrls;
  }
  const audits = form.auditUrls
    ?.split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (audits?.length) intent.auditUrls = audits;
  if (form.contextInterface?.trim() || form.contextPlatform?.trim()) {
    intent.context = {
      interface: form.contextInterface?.trim() || "numetal-launch-router",
      platform: form.contextPlatform?.trim() || undefined,
    };
  }
  if (form.locker?.trim()) {
    intent.locker = {
      locker: form.locker.trim(),
      lockerData: form.lockerData?.trim() || undefined,
    };
  }
  if (form.poolExtAddress?.trim() && form.poolExtInit?.trim()) {
    intent.poolExtension = {
      address: form.poolExtAddress.trim(),
      initData: form.poolExtInit.trim(),
    };
  }
  const presale = pctToBps(num(form.presalePct));
  if (presale !== undefined) intent.presaleBps = presale;
  return intent;
}

/** Stock pairing is Pons only. Other pads never see RH_STOCK / USDG quotes. */
export function pairOptionsFor(
  pad: PadId,
): { value: string; label: string }[] {
  if (pad === "pons") {
    return [
      { value: "WETH", label: "ETH / WETH" },
      { value: "USDG", label: "USDG" },
      { value: "RH_STOCK", label: "RH stock" },
    ];
  }
  return [
    { value: "", label: "(pad default)" },
    { value: "WETH", label: "WETH" },
  ];
}

export { CHAIN_NAMES as CHAINS } from "@numetal/launch-kernel";
