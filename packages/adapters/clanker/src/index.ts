import { route, type LaunchIntent } from "@numetal/launch-kernel";

/** Maps a routed intent to a ClankerTokenV4-shaped config. Does not broadcast. */
export function draftClanker(raw: unknown) {
  const r = route(raw);
  if (!r.ok) return { ok: false as const, errors: r.errors };
  if (r.adapter !== "clanker") {
    return { ok: false as const, errors: [`expected pad clanker, got ${r.adapter}`] };
  }
  const i = r.intent;
  const config = {
    name: i.name,
    symbol: i.symbol,
    tokenAdmin: (i.tokenAdmin ?? i.creator) as `0x${string}`,
    chainId: i.chainId,
    image: i.image ?? "",
    vanity: i.vanity ?? false,
    metadata: i.description ? { description: i.description } : undefined,
    pool: {
      pairedToken: i.pairedAsset === "WETH" || !i.pairedAsset ? "WETH" : i.pairedAsset,
      positions: i.pool?.positions ?? "Standard",
    },
    fees: i.fees
      ? { type: i.fees.kind, preset: i.fees.preset ?? "StaticBasic" }
      : { type: "static" as const, preset: "StaticBasic" as const },
    vault: i.vault,
    devBuy: i.devBuy,
  };
  return {
    ok: true as const,
    payload: {
      pad: "clanker" as const,
      kind: "clanker-deploy-config" as const,
      config,
      note: "Pass this config to clanker-sdk/v4 with the user's wallet. Do not broadcast from the router.",
    },
  };
}

export function getSignPayload(intent: LaunchIntent) {
  return draftClanker(intent);
}
