import { route } from "@numetal/launch-kernel";
import { PARTY_FACTORY, WETH_RH } from "./factory.js";
import { minePoolsfunSalt, type MinedSalt } from "./mine.js";

export { PARTY_FACTORY, WETH_RH } from "./factory.js";
export { minePoolsfunSalt, saltFromInt, sortsAsToken0 } from "./mine.js";

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
    predictedToken?: `0x${string}`;
    saltTries?: number;
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
    expectedStartTick: i.expectedStartTick ?? extras.expectedStartTick,
    deadline: i.deadline ?? extras.deadline,
    creator: i.creator as `0x${string}`,
    feeRecipient: (i.feeRecipient ?? i.creator) as `0x${string}`,
    devBuyAmountIn: i.devBuy ? String(i.devBuy.ethAmount) : "0",
    devBuyMinOut: "0",
  };
  return {
    ok: true as const,
    warnings: r.warnings,
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
      predictedToken: extras.predictedToken,
      saltMined: extras.saltTries !== undefined,
      saltTries: extras.saltTries,
      note: "Salt is mined so the token sorts below WETH (TokenNotToken0). Call startTickFor for expectedStartTick. User must sign.",
    },
  };
}

/** Draft + auto-mined CREATE2 salt. People never pick a salt. */
export async function draftPoolsfunMined(
  raw: unknown,
  extras: {
    expectedStartTick: number;
    deadline: number;
  },
) {
  const r = route(raw);
  if (!r.ok) return { ok: false as const, errors: r.errors };
  if (r.adapter !== "poolsfun") {
    return { ok: false as const, errors: [`expected pad poolsfun, got ${r.adapter}`] };
  }
  const i = r.intent;
  const paired =
    !i.pairedAsset || i.pairedAsset === "WETH"
      ? WETH_RH
      : (i.pairedAsset as `0x${string}`);
  let mined: MinedSalt;
  try {
    mined = await minePoolsfunSalt({
      deployer: i.creator as `0x${string}`,
      name: i.name,
      symbol: i.symbol,
      metadataUri: i.metadataUri ?? "",
      pairedAsset: paired,
    });
  } catch (e) {
    return {
      ok: false as const,
      errors: [e instanceof Error ? e.message : String(e)],
    };
  }
  return draftPoolsfun(raw, {
    expectedStartTick: extras.expectedStartTick,
    deadline: extras.deadline,
    salt: mined.salt,
    predictedToken: mined.token,
    saltTries: mined.tries,
  });
}
