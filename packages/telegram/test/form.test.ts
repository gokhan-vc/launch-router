import { describe, expect, it } from "vitest";
import { formToIntent } from "../src/form.js";
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

  it("poolsfun + dynamic fees still fail at the kernel", () => {
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
    expect(r.ok).toBe(false);
  });
});
