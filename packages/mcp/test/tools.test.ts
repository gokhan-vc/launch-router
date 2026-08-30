import { describe, expect, it } from "vitest";
import { FORBIDDEN_TOOLS, TOOLS, get_sign_payload, list_pads } from "../src/index.js";

describe("mcp tools", () => {
  it("exposes no broadcast tool", () => {
    for (const t of FORBIDDEN_TOOLS) {
      expect((TOOLS as readonly string[]).includes(t)).toBe(false);
    }
  });

  it("lists unproven pads as unproven", () => {
    const pons = list_pads().find((p) => p.id === "pons");
    expect(pons?.status).toBe("unproven");
  });

  it("will not build a Pons stock-pair payload", () => {
    const r = get_sign_payload({
      name: "HOOD",
      symbol: "HOOD",
      chainId: 4663,
      pad: "pons",
      creator: "0x1111111111111111111111111111111111111111",
      pairedAsset: "RH_STOCK",
    });
    expect(r.ok).toBe(false);
  });
});
