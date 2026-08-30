import { describe, expect, it } from "vitest";
import { route } from "../src/route.js";
import type { LaunchIntent } from "../src/intent.js";

const signer = "0x1111111111111111111111111111111111111111" as const;

function clankerBase(over: Partial<LaunchIntent> = {}): LaunchIntent {
  return {
    name: "Test",
    symbol: "TEST",
    chainId: 8453,
    pad: "clanker",
    creator: signer,
    fees: { kind: "static", preset: "StaticBasic" },
    ...over,
  };
}

describe("route", () => {
  it("rejects poolsfun + dynamic fees", () => {
    const r = route({
      name: "Palms",
      symbol: "PALMS",
      chainId: 4663,
      pad: "poolsfun",
      creator: signer,
      fees: { kind: "dynamic", preset: "DynamicBasic" },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => /fees/i.test(e) && /poolsfun/i.test(e))).toBe(
        true,
      );
    }
  });

  it("rejects clanker + RH stock pair", () => {
    const r = route(clankerBase({ pairedAsset: "RH_STOCK" }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => /stock/i.test(e))).toBe(true);
    }
  });

  it("refuses unproven pons instead of faking a deploy", () => {
    const r = route({
      name: "HOOD",
      symbol: "HOOD",
      chainId: 4663,
      pad: "pons",
      creator: signer,
      pairedAsset: "RH_STOCK",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => /unproven/i.test(e))).toBe(true);
  });

  it("accepts clanker Base + StaticBasic", () => {
    const r = route(clankerBase());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.adapter).toBe("clanker");
      expect(r.intent.fees?.preset).toBe("StaticBasic");
    }
  });
});
