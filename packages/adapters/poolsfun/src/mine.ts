import {
  createPublicClient,
  http,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { PARTY_FACTORY } from "./factory.js";

export const COMPUTE_TOKEN_ADDRESS_ABI = [
  {
    type: "function",
    name: "computeTokenAddress",
    stateMutability: "view",
    inputs: [
      { name: "deployer", type: "address" },
      { name: "salt", type: "bytes32" },
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "metadataUri", type: "string" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

const RH_RPC = "https://rpc.mainnet.chain.robinhood.com";

export function saltFromInt(n: number): Hex {
  return `0x${n.toString(16).padStart(64, "0")}` as Hex;
}

export function sortsAsToken0(token: Address, paired: Address): boolean {
  return token.toLowerCase() < paired.toLowerCase();
}

export type MineSaltArgs = {
  deployer: Address;
  name: string;
  symbol: string;
  metadataUri: string;
  pairedAsset: Address;
  /** Injected predictor — tests. Live path uses PartyFactory.computeTokenAddress. */
  predict?: (salt: Hex) => Address | Promise<Address>;
  client?: PublicClient;
  maxTries?: number;
  batchSize?: number;
};

export type MinedSalt = {
  salt: Hex;
  token: Address;
  tries: number;
};

export function defaultPoolsfunClient(): PublicClient {
  return createPublicClient({
    transport: http(RH_RPC),
  }) as PublicClient;
}

async function factoryPredict(
  client: PublicClient,
  args: Omit<MineSaltArgs, "predict" | "client" | "maxTries" | "batchSize">,
  salt: Hex,
): Promise<Address> {
  return (await client.readContract({
    address: PARTY_FACTORY,
    abi: COMPUTE_TOKEN_ADDRESS_ABI,
    functionName: "computeTokenAddress",
    args: [args.deployer, salt, args.name, args.symbol, args.metadataUri],
  })) as Address;
}

/**
 * Mine a user salt so CREATE2(token) < pairedAsset (TokenNotToken0 otherwise).
 * Effective salt is keccak256(deployer, salt) inside the factory — this loop
 * uses the factory's own `computeTokenAddress` so we do not re-derive initcode.
 */
export async function minePoolsfunSalt(
  args: MineSaltArgs,
): Promise<MinedSalt> {
  const maxTries = args.maxTries ?? 4096;
  const batchSize = args.batchSize ?? 32;
  const client = args.predict
    ? undefined
    : (args.client ?? defaultPoolsfunClient());
  const predict =
    args.predict ??
    ((salt: Hex) => factoryPredict(client as PublicClient, args, salt));

  for (let start = 0; start < maxTries; start += batchSize) {
    const end = Math.min(start + batchSize, maxTries);
    const batch = await Promise.all(
      Array.from({ length: end - start }, async (_, i) => {
        const n = start + i;
        const salt = saltFromInt(n);
        const token = await predict(salt);
        return { n, salt, token };
      }),
    );
    const hit = batch.find((row) =>
      sortsAsToken0(row.token, args.pairedAsset),
    );
    if (hit) {
      return { salt: hit.salt, token: hit.token, tries: hit.n + 1 };
    }
  }
  throw new Error(
    `could not mine a pools.fun salt under ${args.pairedAsset} in ${maxTries} tries`,
  );
}
