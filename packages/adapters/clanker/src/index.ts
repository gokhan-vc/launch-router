import { route, type LaunchIntent } from "@numetal/launch-kernel";
import { FEE_CONFIGS, POOL_POSITIONS } from "clanker-sdk";

function dropUndef<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}

function mapFees(i: LaunchIntent) {
  // clanker-sdk fees is a zod discriminatedUnion whose variants both
  // `.default()` the `type` field. Passing `{ type: "static", ... }` throws
  // "Duplicate discriminator value undefined" on zod 4. Omit StaticBasic
  // (SDK default). For a custom static fee, pass clankerFee/pairedFee only.
  if (i.feesCustom && typeof i.feesCustom === "object") {
    const custom = { ...(i.feesCustom as Record<string, unknown>) };
    if (custom.type === "static") delete custom.type;
    return dropUndef(custom);
  }
  if (i.fees?.clankerFee != null || i.fees?.pairedFee != null || i.fees?.bps != null) {
    return {
      clankerFee: i.fees.clankerFee ?? i.fees.bps ?? 100,
      pairedFee: i.fees.pairedFee ?? i.fees.bps ?? 100,
    };
  }
  if (i.fees?.preset && i.fees.preset !== "StaticBasic") {
    const preset = FEE_CONFIGS[i.fees.preset as keyof typeof FEE_CONFIGS];
    if (preset && "baseFee" in preset) return preset;
  }
  return undefined;
}

function mapPool(i: LaunchIntent) {
  const named = i.pool?.positions ?? "Standard";
  const positions =
    i.pool?.customPositions ??
    POOL_POSITIONS[named as keyof typeof POOL_POSITIONS] ??
    POOL_POSITIONS.Standard;
  return dropUndef({
    pairedToken:
      i.pairedAsset === "WETH" || !i.pairedAsset ? "WETH" : i.pairedAsset,
    tickIfToken0IsClanker: i.pool?.tickIfToken0IsClanker,
    tickSpacing: i.pool?.tickSpacing,
    positions,
  });
}

/** Maps a routed intent to a ClankerTokenV4-shaped config. Does not broadcast. */
export function draftClanker(raw: unknown) {
  const r = route(raw);
  if (!r.ok) return { ok: false as const, errors: r.errors };
  if (r.adapter !== "clanker") {
    return { ok: false as const, errors: [`expected pad clanker, got ${r.adapter}`] };
  }
  const i = r.intent;
  const rewards = i.rewards?.recipients?.length
    ? { recipients: i.rewards.recipients }
    : i.rewards?.creatorBps !== undefined
      ? {
          recipients: [
            {
              admin: i.rewards.interfaceAdmin ?? i.creator,
              recipient: i.creator,
              bps: i.rewards.creatorBps,
              token: "Both" as const,
            },
          ],
        }
      : undefined;
  const config = dropUndef({
    name: i.name,
    symbol: i.symbol,
    tokenAdmin: (i.tokenAdmin ?? i.creator) as `0x${string}`,
    chainId: i.chainId,
    image: i.image ?? "",
    vanity: i.vanity ?? false,
    metadata:
      i.description || i.socials || i.auditUrls
        ? dropUndef({
            description: i.description,
            socialMediaUrls: i.socials,
            auditUrls: i.auditUrls,
          })
        : undefined,
    context: i.context ?? { interface: "numetal-launch-router" },
    pool: mapPool(i),
    fees: mapFees(i),
    vault: i.vault,
    sniperFees: i.sniperFees,
    devBuy: i.devBuy,
    rewards,
    airdrop: i.airdrop,
    salt: i.salt,
    locker: i.locker,
    poolExtension: i.poolExtension,
    presale: i.presaleBps !== undefined ? { bps: i.presaleBps } : undefined,
  });
  return {
    ok: true as const,
    warnings: r.warnings,
    payload: {
      pad: "clanker" as const,
      kind: "clanker-deploy-config" as const,
      config,
      note: "This JSON is the Clanker SDK deploy config your wallet signs. It is not a REST API request.",
    },
  };
}

export function getSignPayload(intent: LaunchIntent) {
  return draftClanker(intent);
}
