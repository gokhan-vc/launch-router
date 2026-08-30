import { describe, expect, it } from "vitest";
import { formToIntent, pairOptionsFor } from "../src/form.js";
import { route } from "@numetal/launch-kernel";

const creator = "0x1111111111111111111111111111111111111111";

describe("formToIntent", () => {
  it("maps a clanker Base form into a routable intent", () => {
    const intent = formToIntent({
      name: "Test",
      symbol: "TEST",
      pad: "clanker",
      chainId: 8453,
      creator,
      feeKind: "static",
      feePreset: "StaticBasic",
    });
    const r = route(intent);
    expect(r.ok).toBe(true);
  });

  it("refuses a missing wallet", () => {
    expect(() =>
      formToIntent({
        name: "X",
        symbol: "X",
        pad: "clanker",
        chainId: 8453,
        creator: "",
      }),
    ).toThrow(/wallet/);
  });

  it("poolsfun + dynamic fees stays available with a warning", () => {
    const intent = formToIntent({
      name: "PALMS",
      symbol: "PALMS",
      pad: "poolsfun",
      chainId: 4663,
      creator,
      feeKind: "dynamic",
      feePreset: "DynamicBasic",
    });
    const r = route(intent);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("offers RH stock only on Pons", () => {
    expect(pairOptionsFor("bankr").some((o) => o.value === "RH_STOCK")).toBe(
      false,
    );
    expect(pairOptionsFor("clanker").some((o) => o.value === "RH_STOCK")).toBe(
      false,
    );
    expect(pairOptionsFor("poolsfun").some((o) => o.value === "RH_STOCK")).toBe(
      false,
    );
    expect(pairOptionsFor("pons").some((o) => o.value === "RH_STOCK")).toBe(
      true,
    );
  });

  it("maps social URLs and fee percent without JSON", () => {
    const intent = formToIntent({
      name: "Test",
      symbol: "TEST",
      pad: "clanker",
      chainId: 8453,
      creator,
      twitterUrl: "https://x.com/palms",
      feePct: 1,
      vaultPct: 10,
      vaultLockupDays: 30,
    });
    expect(intent.socials).toEqual([
      { platform: "x", url: "https://x.com/palms" },
    ]);
    expect(intent.fees?.bps).toBe(100);
    expect(intent.vault?.lockupDuration).toBe(2_592_000);
  });

  it("maps rewards JSON and custom pair without dropping empty fee kind", () => {
    const intent = formToIntent({
      name: "Test",
      symbol: "TEST",
      pad: "clanker",
      chainId: 8453,
      creator,
      customPair: "0x2222222222222222222222222222222222222222",
      rewardsJson:
        '[{"admin":"0x1111111111111111111111111111111111111111","recipient":"0x1111111111111111111111111111111111111111","bps":10000,"token":"Both"}]',
    });
    expect(intent.fees).toBeUndefined();
    expect(intent.pairedAsset).toBe(
      "0x2222222222222222222222222222222222222222",
    );
    expect(intent.rewards?.recipients?.[0]?.bps).toBe(10000);
    expect(route(intent).ok).toBe(true);
  });
});
