import { capFor } from "./matrix.js";
import { LaunchIntent, type PadId } from "./intent.js";

export type RouteOk = {
  ok: true;
  adapter: PadId;
  intent: LaunchIntent;
};

export type RouteErr = {
  ok: false;
  errors: string[];
};

export type RouteResult = RouteOk | RouteErr;

export function route(raw: unknown): RouteResult {
  const parsed = LaunchIntent.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => i.message),
    };
  }
  const intent = parsed.data;
  const cap = capFor(intent.pad);
  const errors: string[] = [];

  if (cap.status === "unproven") {
    errors.push(
      `pad ${intent.pad} is unproven — listed in the matrix, no deploy adapter`,
    );
  }

  if (cap.chains.length > 0 && !cap.chains.includes(intent.chainId)) {
    errors.push(
      `pad ${intent.pad} does not support chain ${intent.chainId}`,
    );
  }

  if (intent.pairedAsset === "RH_STOCK" && cap.forbidden.includes("RH_STOCK")) {
    errors.push(
      `stock pairing is Pons/Robinhood, not ${intent.pad}`,
    );
  }

  if (intent.fees && cap.forbidden.includes("fees")) {
    errors.push(
      `pad ${intent.pad} does not take a fees knob (hard-coded on that factory)`,
    );
  }

  if (
    intent.fees?.kind === "dynamic" &&
    (cap.forbidden.includes("fees.dynamic") || cap.forbidden.includes("fees"))
  ) {
    errors.push(
      `pad ${intent.pad} does not support dynamic fees`,
    );
  }

  if (intent.pool && cap.forbidden.includes("pool")) {
    errors.push(`pad ${intent.pad} does not expose Uniswap v4 pool knobs`);
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, adapter: intent.pad, intent };
}
