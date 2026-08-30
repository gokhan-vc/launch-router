import { capFor } from "./matrix.js";
import { LaunchIntent, type PadId } from "./intent.js";

export type RouteOk = {
  ok: true;
  adapter: PadId;
  intent: LaunchIntent;
  warnings: string[];
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
  const warnings: string[] = [];

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
    warnings.push(
      `${intent.pad} factory hard-codes the swap fee; fee fields are shown but ignored`,
    );
  }

  if (
    intent.fees?.kind === "dynamic" &&
    (cap.forbidden.includes("fees.dynamic") || cap.forbidden.includes("fees"))
  ) {
    warnings.push(`${intent.pad} does not support dynamic fees; ignored`);
  }

  if (intent.pool && cap.forbidden.includes("pool")) {
    warnings.push(
      `${intent.pad} does not take Uniswap v4 pool knobs; pool fields ignored`,
    );
  }

  const core = new Set([
    "name",
    "symbol",
    "chainId",
    "pad",
    "creator",
  ]);
  const allowed = new Set([...core, ...cap.knobs]);
  for (const [key, value] of Object.entries(intent)) {
    if (value === undefined || value === null || value === false) continue;
    if (allowed.has(key)) continue;
    if (cap.forbidden.some((f) => f === key || f.startsWith(`${key}.`))) continue;
    warnings.push(
      `${intent.pad} does not use ${key}; field is visible but omitted from the sign payload`,
    );
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, adapter: intent.pad, intent, warnings };
}
