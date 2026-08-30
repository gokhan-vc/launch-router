import {
  encodeFunctionData,
  parseEther,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import {
  PARTY_FACTORY,
  PARTY_FACTORY_ABI,
  WETH_RH,
} from "./factory.js";
import { defaultPoolsfunClient } from "./mine.js";

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
  /** Always "0" for native-ETH WETH buys (msg.value carries the ETH). */
  devBuyAmountIn: string;
  devBuyMinOut: string;
};

export type PoolsFunTx = {
  to: typeof PARTY_FACTORY;
  chainId: 4663;
  from: Address;
  data: Hex;
  value: Hex;
};

function asWeiString(n: bigint): string {
  return n.toString();
}

export function nativeDevBuyWei(ethAmount: number | undefined): bigint {
  if (!ethAmount || ethAmount <= 0) return 0n;
  return parseEther(String(ethAmount));
}

export function encodeLaunch(args: PoolsFunLaunchArgs): Hex {
  return encodeFunctionData({
    abi: PARTY_FACTORY_ABI,
    functionName: "launch",
    args: [
      args.name,
      args.symbol,
      args.metadataUri,
      args.salt,
      args.pairedAsset,
      args.expectedStartTick,
      BigInt(args.deadline),
      args.creator,
      args.feeRecipient,
      BigInt(args.devBuyAmountIn),
      BigInt(args.devBuyMinOut),
    ],
  });
}

export function valueHex(wei: bigint): Hex {
  return `0x${wei.toString(16)}` as Hex;
}

export function launchTx(args: PoolsFunLaunchArgs, valueWei: bigint): PoolsFunTx {
  return {
    to: PARTY_FACTORY,
    chainId: 4663,
    from: args.creator,
    data: encodeLaunch(args),
    value: valueHex(valueWei),
  };
}

export async function readStartTick(
  pairedAsset?: Address,
  client?: PublicClient,
): Promise<{ tick: number; live: boolean }> {
  const pair = pairedAsset ?? WETH_RH;
  const c = client ?? defaultPoolsfunClient();
  const [tick, live] = (await c.readContract({
    address: PARTY_FACTORY,
    abi: PARTY_FACTORY_ABI,
    functionName: "startTickFor",
    args: [pair],
  })) as [number, boolean];
  return { tick, live };
}

export async function simulateLaunch(
  args: PoolsFunLaunchArgs,
  valueWei: bigint,
  client: PublicClient = defaultPoolsfunClient(),
): Promise<
  | {
      ok: true;
      token: Address;
      pool: Address;
      devBuyOut: bigint;
      minOut: string;
    }
  | { ok: false; errors: string[] }
> {
  try {
    const { result } = await client.simulateContract({
      address: PARTY_FACTORY,
      abi: PARTY_FACTORY_ABI,
      functionName: "launch",
      args: [
        args.name,
        args.symbol,
        args.metadataUri,
        args.salt,
        args.pairedAsset,
        args.expectedStartTick,
        BigInt(args.deadline),
        args.creator,
        args.feeRecipient,
        BigInt(args.devBuyAmountIn),
        0n,
      ],
      account: args.creator,
      value: valueWei,
    });
    const [token, pool, devBuyOut] = result as [Address, Address, bigint];
    return {
      ok: true,
      token,
      pool,
      devBuyOut,
      minOut: asWeiString(devBuyOut),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, errors: [`PartyFactory.launch eth_call failed: ${msg}`] };
  }
}

export function withMinOut(
  args: PoolsFunLaunchArgs,
  minOut: string,
): PoolsFunLaunchArgs {
  return { ...args, devBuyMinOut: minOut };
}
