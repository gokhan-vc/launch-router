import { route } from "@numetal/launch-kernel";

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
};

export function splitMatchesStandard(d: FeeDistribution): boolean {
  return (
    d.creator === STANDARD_SPLIT.creator &&
    d.bankr === STANDARD_SPLIT.bankr &&
    d.alt === STANDARD_SPLIT.alt &&
    d.protocol === STANDARD_SPLIT.protocol
  );
}

export function draftBankr(raw: unknown) {
  const r = route(raw);
  if (!r.ok) return { ok: false as const, errors: r.errors };
  if (r.adapter !== "bankr") {
    return { ok: false as const, errors: [`expected pad bankr, got ${r.adapter}`] };
  }
  const i = r.intent;
  const body = {
    simulateOnly: true,
    name: i.name,
    symbol: i.symbol,
    image: i.image,
    description: i.description,
    chainId: i.chainId,
    beneficiary: i.feeRecipient ?? i.creator,
  };
  return {
    ok: true as const,
    warnings: r.warnings,
    payload: {
      pad: "bankr" as const,
      kind: "bankr-deploy-simulate" as const,
      method: "POST" as const,
      url: "https://api.bankr.bot/token-launches/deploy",
      body,
      expectedSplit: STANDARD_SPLIT,
      note: "Call with the user's Bankr credentials. Refuse to proceed unless feeDistribution matches expectedSplit. v0 does not send partner keys.",
    },
  };
}

export function acceptSimulatedSplit(
  distribution: FeeDistribution,
): { ok: true } | { ok: false; errors: string[] } {
  if (!splitMatchesStandard(distribution)) {
    return {
      ok: false,
      errors: [
        `feeDistribution ${JSON.stringify(distribution)} is not the standard 57% split; refusing payload. Partner keys silently change this forever.`,
      ],
    };
  }
  return { ok: true };
}
