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
    chains: [8453, 84532, 1, 42161, 56, 130, RH],
    knobs: [
      "image",
      "pairedAsset",
      "fees",
      "pool",
      "vault",
      "airdrop",
      "sniperFees",
      "devBuy",
      "vanity",
      "tokenAdmin",
    ],
    forbidden: ["RH_STOCK"],
    notes: "SDK. Monad static fees only. Stock pairs are not Clanker.",
  },
  {
    id: "bankr",
    status: "wired",
    chains: [8453, RH],
    knobs: ["image", "description", "feeRecipient"],
    forbidden: ["RH_STOCK", "fees.dynamic"],
    notes: "1.2% swap; default split 57/36.1/1.9/5; immutable after deploy.",
  },
  {
    id: "poolsfun",
    status: "wired",
    chains: [RH],
    knobs: ["metadataUri", "salt", "pairedAsset", "feeRecipient", "devBuy"],
    forbidden: ["fees", "fees.dynamic", "pool", "RH_STOCK"],
    notes: "1B supply, 1% fee, LP locked — not knobs. WETH pair. creator=signer.",
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
    notes: "Ticker [A-Z0-9]{3,}. Hangul filler does not count.",
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
