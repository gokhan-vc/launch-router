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
      expect(r.payload.config.fees).toBeUndefined();
      expect(Array.isArray(r.payload.config.pool.positions)).toBe(true);
      expect(r.payload.config.chainId).toBe(8453);
    }
  });

  it("passes vault, rewards, and context into the sign config", () => {
    const r = draftClanker({
      name: "Test",
      symbol: "TEST",
      chainId: 8453,
      pad: "clanker",
      creator,
      vault: { percentage: 10, lockupDuration: 86400 },
      rewards: { creatorBps: 10000 },
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload.config.vault?.percentage).toBe(10);
      expect(r.payload.config.rewards?.recipients?.[0]?.bps).toBe(10000);
      expect(r.payload.config.context?.interface).toBe("numetal-launch-router");
      expect(r.payload.kind).toBe("clanker-deploy-config");
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
