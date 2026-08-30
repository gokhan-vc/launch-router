import { route } from "@numetal/launch-kernel";

export const BANKR_DEPLOY_URL = "https://api.bankr.bot/token-launches/deploy";

/** Documented standard Bankr/Doppler split of the 1.2% swap fee, in bps. */
export const STANDARD_SPLIT = {
  creator: 5700,
  bankr: 3610,
  alt: 190,
  protocol: 500,
} as const;

export type FeeDistribution = {
  creator: number;
  bankr: number;
  alt: number;
  protocol: number;
  partner?: number;
};

export type BankrChain = "base" | "robinhood";

export type BankrFeeRecipient = {
  type: "wallet" | "x" | "farcaster" | "ens";
  value: string;
};

export type BankrDeployBody = {
  tokenName: string;
  tokenSymbol: string;
  chain: BankrChain;
  simulateOnly: boolean;
  image?: string;
  description?: string;
  feeRecipient?: BankrFeeRecipient;
};

export function bankrChain(chainId: number): BankrChain | null {
  if (chainId === 8453) return "base";
  if (chainId === 4663) return "robinhood";
  return null;
}

function dropUndef<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}

function bpsOf(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v && typeof v === "object" && "bps" in v) {
    const n = (v as { bps: unknown }).bps;
    if (typeof n === "number" && Number.isFinite(n)) return n;
  }
  return undefined;
}

/** Flatten Bankr's nested `{ address, bps }` table or a flat bps map. */
export function parseFeeDistribution(raw: unknown): FeeDistribution | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const creator = bpsOf(o.creator);
  const bankr = bpsOf(o.bankr);
  const alt = bpsOf(o.alt);
  const protocol = bpsOf(o.protocol);
  if (
    creator === undefined ||
    bankr === undefined ||
    alt === undefined ||
    protocol === undefined
  ) {
    return null;
  }
  const partner = bpsOf(o.partner);
  return partner === undefined
    ? { creator, bankr, alt, protocol }
    : { creator, bankr, alt, protocol, partner };
}

export function splitMatchesStandard(d: FeeDistribution): boolean {
  return (
    d.creator === STANDARD_SPLIT.creator &&
    d.bankr === STANDARD_SPLIT.bankr &&
    d.alt === STANDARD_SPLIT.alt &&
    d.protocol === STANDARD_SPLIT.protocol &&
    (d.partner === undefined || d.partner === 0)
  );
}

export function acceptSimulatedSplit(
  distribution: unknown,
): { ok: true; split: FeeDistribution } | { ok: false; errors: string[] } {
  const d = parseFeeDistribution(distribution);
  if (!d) {
    return {
      ok: false,
      errors: ["Bankr response had no readable feeDistribution; refusing payload."],
    };
  }
  if (d.partner && d.partner > 0) {
    return {
      ok: false,
      errors: [
        `feeDistribution includes a partner share (${d.partner} bps); partner keys silently change the split forever. Refusing.`,
      ],
    };
  }
  if (!splitMatchesStandard(d)) {
    return {
      ok: false,
      errors: [
        `feeDistribution ${JSON.stringify(d)} is not the standard 57% split; refusing payload. Partner keys silently change this forever.`,
      ],
    };
  }
  return { ok: true, split: d };
}

/**
 * User Bankr keys only. Partner keys (`bk_ptr_`) mutate the fee split
 * forever — never accepted, never sent as `X-Partner-Key`.
 */
export function assertUserBankrKey(
  raw: string,
): { ok: true; key: string } | { ok: false; errors: string[] } {
  const key = raw.trim();
  if (!key) {
    return {
      ok: false,
      errors: [
        "Paste your Bankr user API key (bk_usr_…) from bankr.bot/api-keys. We never store it.",
      ],
    };
  }
  if (/bk_ptr_/i.test(key) || /^bk_ptr_/i.test(key)) {
    return {
      ok: false,
      errors: [
        "Partner keys (bk_ptr_) are refused. They change the 57% split forever. Use a user key (bk_usr_).",
      ],
    };
  }
  if (!/^bk_usr_/i.test(key)) {
    return {
      ok: false,
      errors: [
        "Not a Bankr user key. Expected bk_usr_{keyId}_{secret} from bankr.bot/api-keys — never a partner key.",
      ],
    };
  }
  return { ok: true, key };
}

export function draftBankr(raw: unknown) {
  const r = route(raw);
  if (!r.ok) return { ok: false as const, errors: r.errors };
  if (r.adapter !== "bankr") {
    return { ok: false as const, errors: [`expected pad bankr, got ${r.adapter}`] };
  }
  const i = r.intent;
  const chain = bankrChain(i.chainId);
  if (!chain) {
    return {
      ok: false as const,
      errors: [`bankr chain ${i.chainId} is not base or robinhood`],
    };
  }
  const body = dropUndef({
    tokenName: i.name,
    tokenSymbol: i.symbol,
    chain,
    simulateOnly: true,
    image: i.image,
    description: i.description,
    feeRecipient: i.feeRecipient
      ? { type: "wallet" as const, value: i.feeRecipient }
      : undefined,
  }) as BankrDeployBody;
  return {
    ok: true as const,
    warnings: r.warnings,
    payload: {
      pad: "bankr" as const,
      kind: "bankr-deploy-simulate" as const,
      method: "POST" as const,
      url: BANKR_DEPLOY_URL,
      body,
      expectedSplit: STANDARD_SPLIT,
      note: "Call with the user's Bankr credentials (X-API-Key: bk_usr_…). Refuse unless feeDistribution matches expectedSplit. Never send partner keys. The Mini App POSTs from the browser — the worker never sees the key.",
    },
  };
}

export type BankrPostOk = {
  ok: true;
  status: number;
  simulated: boolean;
  data: Record<string, unknown>;
};

export type BankrPostErr = { ok: false; errors: string[]; status?: number };

/**
 * POST /token-launches/deploy. Browser or tests. Never sets X-Partner-Key.
 * Does not persist the key.
 */
export async function postBankrDeploy(opts: {
  apiKey: string;
  body: BankrDeployBody;
  fetch?: typeof fetch;
}): Promise<BankrPostOk | BankrPostErr> {
  const authed = assertUserBankrKey(opts.apiKey);
  if (!authed.ok) return authed;
  const fetchFn = opts.fetch ?? fetch;
  let res: Response;
  try {
    res = await fetchFn(BANKR_DEPLOY_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-API-Key": authed.key,
      },
      body: JSON.stringify(opts.body),
    });
  } catch (e) {
    return {
      ok: false,
      errors: [
        `Bankr deploy request failed (${e instanceof Error ? e.message : String(e)}). The key did not go to launch.numetal.xyz. If this is CORS/WAF, POST the payload yourself to ${BANKR_DEPLOY_URL}.`,
      ],
    };
  }
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = { raw: text.slice(0, 240) };
  }
  if (!res.ok) {
    const msg =
      (typeof data.message === "string" && data.message) ||
      (typeof data.error === "string" && data.error) ||
      `Bankr HTTP ${res.status}`;
    return { ok: false, errors: [msg], status: res.status };
  }
  const simulated = opts.body.simulateOnly === true;
  if (simulated && res.status !== 200) {
    return {
      ok: false,
      errors: [`Bankr simulate expected HTTP 200, got ${res.status}`],
      status: res.status,
    };
  }
  if (!simulated && res.status !== 201 && res.status !== 200) {
    return {
      ok: false,
      errors: [`Bankr live deploy expected HTTP 201, got ${res.status}`],
      status: res.status,
    };
  }
  return { ok: true, status: res.status, simulated, data };
}

/**
 * Simulate, check the 57% split, then live-deploy. Live POST never runs
 * unless the simulated feeDistribution matches STANDARD_SPLIT and has no
 * partner share.
 */
export async function deployBankrWithUserKey(opts: {
  apiKey: string;
  body: Omit<BankrDeployBody, "simulateOnly"> & { simulateOnly?: boolean };
  fetch?: typeof fetch;
}): Promise<BankrPostOk | BankrPostErr> {
  const authed = assertUserBankrKey(opts.apiKey);
  if (!authed.ok) return authed;
  const base = { ...opts.body, simulateOnly: true } as BankrDeployBody;
  const sim = await postBankrDeploy({
    apiKey: authed.key,
    body: base,
    fetch: opts.fetch,
  });
  if (!sim.ok) return sim;
  const split = acceptSimulatedSplit(sim.data.feeDistribution);
  if (!split.ok) return split;
  return postBankrDeploy({
    apiKey: authed.key,
    body: { ...base, simulateOnly: false },
    fetch: opts.fetch,
  });
}
