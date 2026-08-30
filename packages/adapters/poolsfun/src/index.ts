import { route } from "@numetal/launch-kernel";

/** Robinhood Chain PartyFactory — pools.fun, announced 2026-08-11. */
export const PARTY_FACTORY =
  "0x626C3d09B65bF5d1D40E0D5F25e19fa49783B3D4" as const;

export const WETH_RH = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73" as const;

/**
 * Field map from the 2026-08-14 PALMS write. Supply, 1% fee, LP lock are
 * factory-hardcoded — not present as args. ABI selector is not asserted until
 * Blockscout verification is wired; Mini App encodes these named args.
 */
export type PoolsFunLaunchArgs = {
  name: string;
  symbol: string;
  metadataUri: string;
  salt: `0x${string}`;
  pairedAsset: `0x${string}`;
  expectedStartTick: number;
  deadline: number;
  creator: `0x${string}`;
  feeRecipient: `0x${string}`;
  devBuyAmountIn: string;
  devBuyMinOut: string;
};

export function draftPoolsfun(
  raw: unknown,
  extras: {
    expectedStartTick: number;
    deadline: number;
    salt: `0x${string}`;
  },
) {
  const r = route(raw);
  if (!r.ok) return { ok: false as const, errors: r.errors };
  if (r.adapter !== "poolsfun") {
    return { ok: false as const, errors: [`expected pad poolsfun, got ${r.adapter}`] };
  }
  const i = r.intent;
  if (i.creator.toLowerCase() !== (i.tokenAdmin ?? i.creator).toLowerCase()) {
    return {
      ok: false as const,
      errors: ["creator must be the signer (CreatorNotCaller)"],
    };
  }
  const paired =
    !i.pairedAsset || i.pairedAsset === "WETH"
      ? WETH_RH
      : (i.pairedAsset as `0x${string}`);
  const args: PoolsFunLaunchArgs = {
    name: i.name,
    symbol: i.symbol,
    metadataUri: i.metadataUri ?? "",
    salt: extras.salt,
    pairedAsset: paired,
    expectedStartTick: extras.expectedStartTick,
    deadline: extras.deadline,
    creator: i.creator as `0x${string}`,
    feeRecipient: (i.feeRecipient ?? i.creator) as `0x${string}`,
    devBuyAmountIn: "0",
    devBuyMinOut: "0",
  };
  return {
    ok: true as const,
    payload: {
      pad: "poolsfun" as const,
      kind: "partyfactory-launch-args" as const,
      to: PARTY_FACTORY,
      chainId: 4663,
      args,
      hardcoded: {
        supply: "1000000000",
        fee: "1%",
        lp: "100% locked",
      },
      note: "Call startTickFor on the factory for expectedStartTick. Mine salt so the token sorts below WETH. User must sign.",
    },
  };
}
