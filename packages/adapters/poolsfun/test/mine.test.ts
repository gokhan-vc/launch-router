import { describe, expect, it } from "vitest";
import {
  minePoolsfunSalt,
  saltFromInt,
  sortsAsToken0,
  WETH_RH,
} from "../src/index.js";

const deployer = "0x1111111111111111111111111111111111111111" as const;

describe("minePoolsfunSalt", () => {
  it("increments until predicted token sorts below the pair", async () => {
    const r = await minePoolsfunSalt({
      deployer,
      name: "PALMS",
      symbol: "PALMS",
      metadataUri: "",
      pairedAsset: WETH_RH,
      predict: (salt) => {
        const n = Number.parseInt(salt.slice(2), 16);
        // First 4 salts land above WETH; salt 4 sorts below.
        if (n < 4) return "0xF000000000000000000000000000000000000000";
        return "0x00000000000000000000000000000000000000aa";
      },
    });
    expect(r.salt).toBe(saltFromInt(4));
    expect(r.tries).toBe(5);
    expect(sortsAsToken0(r.token, WETH_RH)).toBe(true);
  });

  it("compares addresses case-insensitively", () => {
    expect(
      sortsAsToken0(
        "0x0ad7d308f8e1639fab988df18a8011f41eacad73",
        WETH_RH,
      ),
    ).toBe(true);
    expect(
      sortsAsToken0(
        "0x0Cd7D308f8E1639FAb988df18A8011f41EAcAD73",
        WETH_RH,
      ),
    ).toBe(false);
  });
});
