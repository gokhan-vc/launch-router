import { describe, expect, it } from "vitest";
import { toFunctionSelector } from "viem";
import {
  PARTY_FACTORY,
  encodeLaunch,
  launchTx,
  nativeDevBuyWei,
} from "../src/index.js";

const creator = "0x1111111111111111111111111111111111111111" as const;

const args = {
  name: "PALMS",
  symbol: "PALMS",
  metadataUri: "",
  salt: "0x000000000000000000000000000000000000000000000000000000000000006b" as const,
  pairedAsset: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73" as const,
  expectedStartTick: -200400,
  deadline: 1_786_698_067,
  creator,
  feeRecipient: creator,
  devBuyAmountIn: "0",
  devBuyMinOut: "0",
};

describe("pools.fun launch encode", () => {
  it("matches the verified PartyFactory.launch selector", () => {
    const data = encodeLaunch(args);
    const sel = toFunctionSelector(
      "launch(string,string,string,bytes32,address,int24,uint256,address,address,uint256,uint256)",
    );
    expect(data.slice(0, 10)).toBe(sel);
    expect(sel).toBe("0xce61a35c");
  });

  it("builds a wallet tx to the factory with native value, amountIn 0", () => {
    const wei = nativeDevBuyWei(0.01);
    const tx = launchTx(args, wei);
    expect(tx.to).toBe(PARTY_FACTORY);
    expect(tx.chainId).toBe(4663);
    expect(tx.from).toBe(creator);
    expect(tx.value).toBe(`0x${wei.toString(16)}`);
    expect(args.devBuyAmountIn).toBe("0");
  });

  it("startTickFor selector is the verified view", () => {
    expect(toFunctionSelector("startTickFor(address)")).toBe("0xcd5bf8ee");
  });
});
