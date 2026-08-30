import { describe, expect, it } from "vitest";
import { PARTY_FACTORY, WETH_RH, draftPoolsfun } from "../src/index.js";

const creator = "0x1111111111111111111111111111111111111111";

describe("draftPoolsfun", () => {
  it("fills PALMS-shaped args and does not expose fee knobs", () => {
    const r = draftPoolsfun(
      {
        name: "PALMS",
        symbol: "PALMS",
        chainId: 4663,
        pad: "poolsfun",
        creator,
      },
      {
        expectedStartTick: -190600,
        deadline: 1_786_698_067,
        salt: "0x000000000000000000000000000000000000000000000000000000000000006b",
      },
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload.to).toBe(PARTY_FACTORY);
      expect(r.payload.args.pairedAsset).toBe(WETH_RH);
      expect(r.payload.args.creator).toBe(creator);
      expect(r.payload.args.devBuyAmountIn).toBe("0");
      expect(r.payload.tx.to).toBe(PARTY_FACTORY);
      expect(r.payload.tx.data.startsWith("0xce61a35c")).toBe(true);
      expect(r.payload.hardcoded.fee).toBe("1%");
    }
  });

  it("keeps dynamic fees visible and warns instead of rejecting", () => {
    const r = draftPoolsfun(
      {
        name: "PALMS",
        symbol: "PALMS",
        chainId: 4663,
        pad: "poolsfun",
        creator,
        fees: { kind: "dynamic", preset: "DynamicBasic" },
      },
      {
        expectedStartTick: -190600,
        deadline: 1,
        salt: "0x0000000000000000000000000000000000000000000000000000000000000001",
      },
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.warnings.some((w) => /ignored/i.test(w))).toBe(true);
      expect(r.payload.args.name).toBe("PALMS");
    }
  });
});
