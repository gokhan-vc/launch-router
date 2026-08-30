import { describe, expect, it } from "vitest";
import {
  STANDARD_SPLIT,
  acceptSimulatedSplit,
  draftBankr,
} from "../src/index.js";

const creator = "0x1111111111111111111111111111111111111111";

describe("bankr adapter", () => {
  it("drafts simulateOnly body", () => {
    const r = draftBankr({
      name: "X",
      symbol: "X",
      chainId: 8453,
      pad: "bankr",
      creator,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload.body.simulateOnly).toBe(true);
      expect(r.payload.expectedSplit).toEqual(STANDARD_SPLIT);
    }
  });

  it("accepts the documented 57% table", () => {
    expect(acceptSimulatedSplit(STANDARD_SPLIT).ok).toBe(true);
  });

  it("refuses a 95% partner split", () => {
    const r = acceptSimulatedSplit({
      creator: 5700,
      bankr: 0,
      alt: 190,
      protocol: 500,
    });
    expect(r.ok).toBe(false);
  });
});
