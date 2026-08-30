import {
  HOW_TO_SIGN,
  MATRIX,
  capFor,
  networks,
  route,
  type PadId,
} from "@numetal/launch-kernel";
import { draftClanker } from "@numetal/adapter-clanker";
import { acceptSimulatedSplit, draftBankr } from "@numetal/adapter-bankr";
import { draftPoolsfunMined } from "@numetal/adapter-poolsfun";

export const TOOLS = [
  "list_pads",
  "list_networks",
  "get_capabilities",
  "draft_intent",
  "simulate_launch",
  "get_sign_payload",
  "check_bankr_split",
] as const;

export const FORBIDDEN_TOOLS = [
  "broadcast",
  "send_transaction",
  "deploy",
] as const;

export type JsonSchema = {
  type: string;
  description?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
};

export type ToolDef = {
  name: (typeof TOOLS)[number];
  description: string;
  inputSchema: JsonSchema;
};

const INTENT_DESC =
  "LaunchIntent: name, symbol, chainId, pad, creator (0x). Optional knobs per get_capabilities. Never salt. Never RH_STOCK except pad=pons.";

export const TOOL_DEFS: ToolDef[] = [
  {
    name: "list_pads",
    description:
      "List every pad in the matrix (wired + unproven) with chains, notes, and howToSign. Same matrix the Mini App uses. Call this first.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "list_networks",
    description:
      "Union of chain IDs the pads actually list. We do not invent networks.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_capabilities",
    description:
      "Knobs, forbidden fields, chains, status, and howToSign for one pad. Same as the Mini App. Stock pairing is Pons only.",
    inputSchema: {
      type: "object",
      properties: {
        pad: {
          type: "string",
          description: "Pad id from list_pads (clanker, bankr, poolsfun, …)",
        },
      },
      required: ["pad"],
      additionalProperties: false,
    },
  },
  {
    name: "draft_intent",
    description:
      "Validate a LaunchIntent against the matrix. Returns warnings for ignored knobs; errors for unproven pads / forbidden stock pairs.",
    inputSchema: {
      type: "object",
      properties: { intent: { type: "object", description: INTENT_DESC } },
      required: ["intent"],
      additionalProperties: false,
    },
  },
  {
    name: "simulate_launch",
    description:
      "Build the pad-sign payload (same object as Mini App Simulate and get_sign_payload). Does not broadcast. No keys.",
    inputSchema: {
      type: "object",
      properties: { intent: { type: "object", description: INTENT_DESC } },
      required: ["intent"],
      additionalProperties: false,
    },
  },
  {
    name: "get_sign_payload",
    description:
      "Same pad-sign payload the Mini App Sign uses. Clanker = SDK deploy() config. Bankr = POST body + liveBody + howToSign (user's bk_usr_ key on their machine; this origin never sees it). pools.fun = PartyFactory.launch tx. Never a REST argument this origin posts with a hot key.",
    inputSchema: {
      type: "object",
      properties: { intent: { type: "object", description: INTENT_DESC } },
      required: ["intent"],
      additionalProperties: false,
    },
  },
  {
    name: "check_bankr_split",
    description:
      "Same 57% split check the Mini App runs before a Bankr live POST. Pass feeDistribution from a simulate response. Refuses partner shares. No keys.",
    inputSchema: {
      type: "object",
      properties: {
        feeDistribution: {
          type: "object",
          description:
            "Bankr feeDistribution (flat bps or nested { bps }). Expected 5700/3610/190/500.",
        },
      },
      required: ["feeDistribution"],
      additionalProperties: false,
    },
  },
];

export function list_pads() {
  return MATRIX.map((p) => ({
    id: p.id,
    status: p.status,
    chains: p.chains,
    knobs: p.knobs,
    forbidden: p.forbidden,
    notes: p.notes,
    howToSign: HOW_TO_SIGN[p.id],
  }));
}

export function list_networks() {
  return networks();
}

export function get_capabilities(pad: PadId) {
  const cap = capFor(pad);
  return { ...cap, howToSign: HOW_TO_SIGN[pad] };
}

export function draft_intent(raw: unknown) {
  return route(raw);
}

export async function get_sign_payload(raw: unknown) {
  const r = route(raw);
  if (!r.ok) return r;
  switch (r.adapter) {
    case "clanker":
      return draftClanker(raw);
    case "bankr":
      return draftBankr(raw);
    case "poolsfun":
      return draftPoolsfunMined(raw, {
        expectedStartTick: r.intent.expectedStartTick,
        deadline: r.intent.deadline ?? Math.floor(Date.now() / 1000) + 7200,
      });
    default:
      return {
        ok: false as const,
        errors: [`pad ${r.adapter} is unproven — no sign payload`],
      };
  }
}

export function simulate_launch(raw: unknown) {
  return get_sign_payload(raw);
}

export async function dispatch(
  name: string,
  args: Record<string, unknown> = {},
): Promise<unknown> {
  if ((FORBIDDEN_TOOLS as readonly string[]).includes(name)) {
    throw new Error(`${name} does not exist — the user signs`);
  }
  switch (name) {
    case "list_pads":
      return list_pads();
    case "list_networks":
      return list_networks();
    case "get_capabilities":
      return get_capabilities(String(args.pad) as PadId);
    case "draft_intent":
      return draft_intent(args.intent ?? args);
    case "simulate_launch":
      return simulate_launch(args.intent ?? args);
    case "get_sign_payload":
      return get_sign_payload(args.intent ?? args);
    case "check_bankr_split":
      return acceptSimulatedSplit(args.feeDistribution ?? args);
    default:
      throw new Error(`unknown tool ${name}`);
  }
}

export { acceptSimulatedSplit };
