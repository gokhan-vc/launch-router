import { describe, expect, it } from "vitest";
import {
  STANDARD_SPLIT,
  acceptSimulatedSplit,
  assertUserBankrKey,
  draftBankr,
  deployBankrWithUserKey,
  parseFeeDistribution,
  postBankrDeploy,
} from "../src/index.js";

const creator = "0x1111111111111111111111111111111111111111";

describe("bankr adapter", () => {
  it("drafts simulateOnly body with tokenName/tokenSymbol and chain", () => {
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
      expect(r.payload.body.tokenName).toBe("X");
      expect(r.payload.body.tokenSymbol).toBe("X");
      expect(r.payload.body.chain).toBe("base");
      expect(r.payload.expectedSplit).toEqual(STANDARD_SPLIT);
      expect(r.payload.liveBody.simulateOnly).toBe(false);
      expect(r.payload.howToSign.surfaces).toEqual(
        expect.arrayContaining(["mini-app", "mcp", "curl"]),
      );
      expect(JSON.stringify(r.payload.body)).not.toMatch(/"name":/);
    }
  });

  it("maps Robinhood chainId to chain: robinhood", () => {
    const r = draftBankr({
      name: "Y",
      symbol: "Y",
      chainId: 4663,
      pad: "bankr",
      creator,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload.body.chain).toBe("robinhood");
  });

  it("accepts the documented 57% table", () => {
    expect(acceptSimulatedSplit(STANDARD_SPLIT).ok).toBe(true);
  });

  it("accepts nested { address, bps } tables", () => {
    const nested = {
      creator: { address: "0x1", bps: 5700 },
      bankr: { address: "0x2", bps: 3610 },
      alt: { address: "0x3", bps: 190 },
      protocol: { address: "0x4", bps: 500 },
    };
    expect(parseFeeDistribution(nested)).toEqual(STANDARD_SPLIT);
    expect(acceptSimulatedSplit(nested).ok).toBe(true);
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

  it("refuses a nested partner share even when creator is 57%", () => {
    const r = acceptSimulatedSplit({
      creator: { bps: 5700 },
      bankr: { bps: 1805 },
      partner: { bps: 1805 },
      alt: { bps: 190 },
      protocol: { bps: 500 },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(" ")).toMatch(/partner/i);
  });

  it("refuses partner API keys", () => {
    const r = assertUserBankrKey("bk_ptr_org_secret");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(" ")).toMatch(/Partner/);
  });

  it("accepts user API keys", () => {
    const r = assertUserBankrKey("bk_usr_abc_secret");
    expect(r.ok).toBe(true);
  });

  it("never sends X-Partner-Key and checks split before live POST", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchMock: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      const body = JSON.parse(String(init?.body)) as { simulateOnly?: boolean };
      if (body.simulateOnly) {
        return new Response(
          JSON.stringify({
            success: true,
            simulated: true,
            feeDistribution: STANDARD_SPLIT,
          }),
          { status: 200 },
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          tokenAddress: "0xabc",
          txHash: "0xdef",
          feeDistribution: STANDARD_SPLIT,
        }),
        { status: 201 },
      );
    };
    const r = await deployBankrWithUserKey({
      apiKey: "bk_usr_abc_secret",
      body: {
        tokenName: "X",
        tokenSymbol: "X",
        chain: "base",
      },
      fetch: fetchMock,
    });
    expect(r.ok).toBe(true);
    expect(calls).toHaveLength(2);
    expect(JSON.parse(String(calls[0].init.body)).simulateOnly).toBe(true);
    expect(JSON.parse(String(calls[1].init.body)).simulateOnly).toBe(false);
    for (const c of calls) {
      const headers = new Headers(c.init.headers);
      expect(headers.get("X-Partner-Key")).toBeNull();
      expect(headers.get("X-API-Key")).toBe("bk_usr_abc_secret");
    }
  });

  it("does not live-POST when simulate returns a partner split", async () => {
    let live = 0;
    const fetchMock: typeof fetch = async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as { simulateOnly?: boolean };
      if (!body.simulateOnly) live += 1;
      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          feeDistribution: {
            creator: { bps: 5700 },
            bankr: { bps: 1805 },
            partner: { bps: 1805 },
            alt: { bps: 190 },
            protocol: { bps: 500 },
          },
        }),
        { status: 200 },
      );
    };
    const r = await deployBankrWithUserKey({
      apiKey: "bk_usr_abc_secret",
      body: { tokenName: "X", tokenSymbol: "X", chain: "base" },
      fetch: fetchMock,
    });
    expect(r.ok).toBe(false);
    expect(live).toBe(0);
  });

  it("postBankrDeploy refuses a partner key before fetch", async () => {
    let hit = 0;
    const r = await postBankrDeploy({
      apiKey: "bk_ptr_nope",
      body: {
        tokenName: "X",
        tokenSymbol: "X",
        chain: "base",
        simulateOnly: true,
      },
      fetch: (async () => {
        hit += 1;
        return new Response("{}", { status: 200 });
      }) as typeof fetch,
    });
    expect(r.ok).toBe(false);
    expect(hit).toBe(0);
  });
});
