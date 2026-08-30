import type { PadId } from "./intent.js";

export type AdapterStatus = "wired" | "unproven";

export type PadCap = {
  id: PadId;
  status: AdapterStatus;
  chains: number[];
  knobs: string[];
  forbidden: string[];
  notes: string;
};

/** Robinhood Chain */
export const RH = 4663;

export const MATRIX: PadCap[] = [
  {
    id: "clanker",
    status: "wired",
    chains: [8453, 84532, 1, 42161, 56, 130, RH, 10143, 2741, 143],
    knobs: [
      "image",
      "description",
      "pairedAsset",
      "fees",
      "feesCustom",
      "pool",
      "vault",
      "airdrop",
      "sniperFees",
      "devBuy",
      "vanity",
      "salt",
      "tokenAdmin",
      "rewards",
      "socials",
      "auditUrls",
      "context",
      "locker",
      "poolExtension",
      "presaleBps",
    ],
    forbidden: ["RH_STOCK"],
    notes: "SDK. Chains the Clanker factory is deployed on. Monad = static fees only. Stock pairs are not Clanker.",
  },
  {
    id: "bankr",
    status: "wired",
    chains: [8453, RH],
    knobs: ["image", "description", "feeRecipient"],
    forbidden: ["RH_STOCK", "fees.dynamic"],
    notes: "1.2% swap; default split 57/36.1/1.9/5; immutable after deploy. User Bankr key (bk_usr_) POSTs simulate then live after the split check — Mini App, MCP, or curl. Never a partner key. Worker never sees the key.",
  },
  {
    id: "poolsfun",
    status: "wired",
    chains: [RH],
    knobs: [
      "metadataUri",
      "salt",
      "pairedAsset",
      "feeRecipient",
      "devBuy",
      "expectedStartTick",
      "deadline",
    ],
    forbidden: ["fees", "fees.dynamic", "pool", "RH_STOCK"],
    notes: "1B supply, 1% fee, LP locked — not knobs. WETH pair. creator=signer. User wallet sends PartyFactory.launch (live startTickFor, mined salt) — Mini App, MCP, or any wallet. Same tx object.",
  },
  {
    id: "pons",
    status: "unproven",
    chains: [RH],
    knobs: ["pairedAsset", "mode"],
    forbidden: [],
    notes: "Stock/ETH/USDG quotes. Adapter unproven — no fake deploy.",
  },
  {
    id: "feelcash",
    status: "unproven",
    chains: [8453, RH],
    knobs: ["image"],
    forbidden: [],
    notes: "letscash.fun SDK exists (wallet-signed factory.launch, vanity …cc) but is not wired here — no fake deploy.",
  },
  {
    id: "poolstrade",
    status: "unproven",
    chains: [RH],
    knobs: ["mode", "fees", "pool"],
    forbidden: [],
    notes: "Instant vs 4h Crowd. 0.25% v4. Adapter unproven.",
  },
  {
    id: "pumpfun",
    status: "unproven",
    chains: [],
    knobs: ["image"],
    forbidden: [],
    notes: "Solana. Matrix only in v0.",
  },
  {
    id: "flap",
    status: "unproven",
    chains: [RH, 56],
    knobs: ["image"],
    forbidden: [],
    notes: "Adapter unproven.",
  },
];

export function capFor(pad: PadId): PadCap {
  const row = MATRIX.find((p) => p.id === pad);
  if (!row) throw new Error(`unknown pad ${pad}`);
  return row;
}

/** Human names for every chain a v0 pad lists. Unknown ids stay numeric. */
export const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  56: "BSC",
  130: "Unichain",
  143: "Monad",
  2741: "Abstract",
  4663: "Robinhood",
  8453: "Base",
  84532: "Base Sepolia",
  10143: "Monad Testnet",
  42161: "Arbitrum",
};

export type NetworkRow = {
  chainId: number;
  name: string;
  pads: PadId[];
};

/** Union of pad.chains — we do not invent networks a pad does not list. */
export function networks(): NetworkRow[] {
  const map = new Map<number, PadId[]>();
  for (const p of MATRIX) {
    for (const id of p.chains) {
      const cur = map.get(id) ?? [];
      cur.push(p.id);
      map.set(id, cur);
    }
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([chainId, pads]) => ({
      chainId,
      name: CHAIN_NAMES[chainId] ?? String(chainId),
      pads,
    }));
}
