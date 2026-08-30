import { MATRIX, capFor, route, type PadId } from "@numetal/launch-kernel";
import { draftClanker } from "@numetal/adapter-clanker";
import { acceptSimulatedSplit, draftBankr } from "@numetal/adapter-bankr";
import { draftPoolsfun } from "@numetal/adapter-poolsfun";

export const TOOLS = [
  "list_pads",
  "get_capabilities",
  "draft_intent",
  "simulate_launch",
  "get_sign_payload",
] as const;

/** There is no broadcast tool. Do not add one. */
export const FORBIDDEN_TOOLS = ["broadcast", "send_transaction", "deploy"] as const;

export function list_pads() {
  return MATRIX.map((p) => ({
    id: p.id,
    status: p.status,
    chains: p.chains,
    notes: p.notes,
  }));
}

export function get_capabilities(pad: PadId) {
  return capFor(pad);
}

export function draft_intent(raw: unknown) {
  return route(raw);
}

export function get_sign_payload(
  raw: unknown,
  extras?: {
    expectedStartTick?: number;
    deadline?: number;
    salt?: `0x${string}`;
  },
) {
  const r = route(raw);
  if (!r.ok) return r;
  switch (r.adapter) {
    case "clanker":
      return draftClanker(raw);
    case "bankr":
      return draftBankr(raw);
    case "poolsfun":
      if (
        extras?.expectedStartTick == null ||
        extras.deadline == null ||
        extras.salt == null
      ) {
        return {
          ok: false as const,
          errors: [
            "poolsfun sign payload needs expectedStartTick, deadline, and salt (mine token0 vs WETH)",
          ],
        };
      }
      return draftPoolsfun(raw, {
        expectedStartTick: extras.expectedStartTick,
        deadline: extras.deadline,
        salt: extras.salt,
      });
    default:
      return {
        ok: false as const,
        errors: [`pad ${r.adapter} is unproven — no sign payload`],
      };
  }
}

/** Local stand-in for simulate: kernel + pad draft. Live eth_call / Bankr HTTP is later. */
export function simulate_launch(raw: unknown) {
  const payload = get_sign_payload(raw, {
    expectedStartTick: -190600,
    deadline: Math.floor(Date.now() / 1000) + 3600,
    salt: "0x0000000000000000000000000000000000000000000000000000000000000001",
  });
  return payload;
}

export { acceptSimulatedSplit };
