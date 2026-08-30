import { parseEther } from "viem";
import type { PublicClient } from "viem";
import { route } from "@numetal/launch-kernel";
import { PARTY_FACTORY, WETH_RH } from "./factory.js";
import { minePoolsfunSalt, type MinedSalt } from "./mine.js";
import {
  launchTx,
  nativeDevBuyWei,
  readStartTick,
  type PoolsFunLaunchArgs,
} from "./launch.js";

export { PARTY_FACTORY, WETH_RH, PARTY_FACTORY_ABI, robinhood, RH_RPC, RH_EXPLORER } from "./factory.js";
export { minePoolsfunSalt, saltFromInt, sortsAsToken0, defaultPoolsfunClient } from "./mine.js";
export {
  encodeLaunch,
  launchTx,
  readStartTick,
  simulateLaunch,
  withMinOut,
  nativeDevBuyWei,
  valueHex,
  type PoolsFunLaunchArgs,
  type PoolsFunTx,
} from "./launch.js";

/**
 * Field map from the verified PartyFactory. Supply, 1% fee, LP lock are
 * factory-hardcoded — not present as args. ABI is Blockscout-verified.
 */
function pairedAddress(raw: string | undefined): `0x${string}` {
  if (!raw || raw === "WETH") return WETH_RH;
  return raw as `0x${string}`;
}

export function draftPoolsfun(
  raw: unknown,
  extras: {
    expectedStartTick: number;
    deadline: number;
    salt: `0x${string}`;
    predictedToken?: `0x${string}`;
    saltTries?: number;
    startTickLive?: boolean;
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
  const paired = pairedAddress(i.pairedAsset);
  const eth = i.devBuy?.ethAmount ?? 0;
  if (eth > 0 && paired.toLowerCase() !== WETH_RH.toLowerCase()) {
    return {
      ok: false as const,
      errors: [
        "pools.fun v0 only native-ETH dev buys on WETH pairs (never both msg.value and amountIn)",
      ],
    };
  }
  const valueWei = nativeDevBuyWei(eth);
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
    // Native ETH buy uses msg.value. amountIn stays 0 (AmbiguousDevBuy otherwise).
    devBuyAmountIn: "0",
    devBuyMinOut: "0",
  };
  const tx = launchTx(args, valueWei);
  return {
    ok: true as const,
    warnings: r.warnings,
    payload: {
      pad: "poolsfun" as const,
      kind: "partyfactory-launch-args" as const,
      to: PARTY_FACTORY,
      chainId: 4663 as const,
      args,
      tx,
      valueWei: valueWei.toString(),
      hardcoded: {
        supply: "1000000000",
        fee: "1%",
        lp: "100% locked",
      },
      predictedToken: extras.predictedToken,
      saltMined: extras.saltTries !== undefined,
      saltTries: extras.saltTries,
      startTickLive: extras.startTickLive,
      note: "Salt is mined so the token sorts below WETH (TokenNotToken0). expectedStartTick is PartyFactory.startTickFor. Wallet must send this tx (creator == msg.sender).",
    },
  };
}

/** Draft + auto-mined CREATE2 salt + live startTickFor. People never pick a salt. */
export async function draftPoolsfunMined(
  raw: unknown,
  extras: {
    expectedStartTick?: number;
    deadline?: number;
    client?: PublicClient;
  } = {},
) {
  const r = route(raw);
  if (!r.ok) return { ok: false as const, errors: r.errors };
  if (r.adapter !== "poolsfun") {
    return { ok: false as const, errors: [`expected pad poolsfun, got ${r.adapter}`] };
  }
  const i = r.intent;
  const paired = pairedAddress(i.pairedAsset);
  let mined: MinedSalt;
  try {
    mined = await minePoolsfunSalt({
      deployer: i.creator as `0x${string}`,
      name: i.name,
      symbol: i.symbol,
      metadataUri: i.metadataUri ?? "",
      pairedAsset: paired,
      client: extras.client,
    });
  } catch (e) {
    return {
      ok: false as const,
      errors: [e instanceof Error ? e.message : String(e)],
    };
  }
  let tick = extras.expectedStartTick ?? i.expectedStartTick;
  let live = false;
  if (tick === undefined) {
    try {
      const q = await readStartTick(paired, extras.client);
      tick = q.tick;
      live = q.live;
    } catch (e) {
      return {
        ok: false as const,
        errors: [
          `startTickFor failed: ${e instanceof Error ? e.message : String(e)}`,
        ],
      };
    }
  }
  return draftPoolsfun(raw, {
    expectedStartTick: tick,
    deadline: extras.deadline ?? i.deadline ?? Math.floor(Date.now() / 1000) + 7200,
    salt: mined.salt,
    predictedToken: mined.token,
    saltTries: mined.tries,
    startTickLive: live,
  });
}

/** parseEther re-export so Mini App does not invent a conversion. */
export { parseEther };
