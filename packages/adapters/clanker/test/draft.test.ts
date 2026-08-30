import { describe, expect, it } from "vitest";
import { draftClanker } from "../src/index.js";

const creator = "0x1111111111111111111111111111111111111111";

describe("draftClanker", () => {
  it("maps Base StaticBasic to SDK-shaped config", () => {
    const r = draftClanker({
      name: "Test",
      symbol: "TEST",
      chainId: 8453,
      pad: "clanker",
      creator,
      fees: { kind: "static", preset: "StaticBasic" },
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload.config.tokenAdmin).toBe(creator);
      expect(r.payload.config.fees.preset).toBe("StaticBasic");
      expect(r.payload.config.chainId).toBe(8453);
    }
  });

  it("refuses RH stock pair", () => {
    const r = draftClanker({
      name: "Test",
      symbol: "TEST",
      chainId: 8453,
      pad: "clanker",
      creator,
      pairedAsset: "RH_STOCK",
    });
    expect(r.ok).toBe(false);
  });
});
