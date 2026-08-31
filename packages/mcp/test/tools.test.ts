import { describe, expect, it } from "vitest";
import {
  FORBIDDEN_TOOLS,
  TOOLS,
  dispatch,
  get_sign_payload,
  list_pads,
  list_networks,
  handleAgentHttp,
} from "../src/index.js";
import { handleJsonRpc } from "../src/jsonrpc.js";
import { x402WellKnown, mppWellKnown, openapi } from "../src/discovery.js";

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

  it("will not build a Pons stock-pair payload", async () => {
    const r = await get_sign_payload({
      name: "HOOD",
      symbol: "HOOD",
      chainId: 4663,
      pad: "pons",
      creator: "0x1111111111111111111111111111111111111111",
      pairedAsset: "RH_STOCK",
    });
    expect(r.ok).toBe(false);
  });

  it("lists every chain a pad actually supports", () => {
    const nets = list_networks();
    expect(nets.some((n) => n.chainId === 8453 && n.pads.includes("clanker"))).toBe(
      true,
    );
    expect(nets.some((n) => n.chainId === 10143)).toBe(true);
    expect(nets.find((n) => n.chainId === 4663)?.pads).toContain("poolsfun");
  });

  it("json-rpc tools/list has no deploy tool", async () => {
    const r = (await handleJsonRpc({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
    })) as { result: { tools: { name: string }[] } };
    const names = r.result.tools.map((t) => t.name);
    expect(names).toContain("list_pads");
    expect(names).not.toContain("broadcast");
  });

  it("x402 and MPP catalogs are amount 0 and uniquely addressed", () => {
    const x = x402WellKnown("https://example.test");
    expect(x.resources).toHaveLength(8);
    const urls = x.resources.map((r) => r.resource);
    expect(new Set(urls).size).toBe(8);
    expect(x.resources.every((r) => r.accepts[0].amount === "0")).toBe(true);
    expect(
      x.resources.every((r) => r.extensions.bazaar.discoverable === true),
    ).toBe(true);
    const m = mppWellKnown("https://example.test");
    expect(m.price).toBe("0");
  });

  it("openapi declares x402 (amount 0), not security []", () => {
    const spec = openapi("https://example.test") as {
      security: unknown;
      paths: Record<string, { post: { security: unknown; responses: Record<string, unknown> } }>;
    };
    expect(spec.security).toEqual([{ x402: [] }]);
    const paths = Object.keys(spec.paths);
    expect(paths).toHaveLength(8);
    for (const p of paths) {
      expect(spec.paths[p].post.security).toEqual([{ x402: [] }]);
      expect(spec.paths[p].post.responses["402"]).toBeTruthy();
    }
  });

  it("bare POST 402s before validation; payment header lets the call through for $0", async () => {
    const bare = await handleAgentHttp(
      new Request("https://example.test/api/v1/list_pads", { method: "POST" }),
    );
    expect(bare?.status).toBe(402);
    expect(bare?.headers.get("PAYMENT-REQUIRED")).toBeTruthy();
    const body = (await bare!.json()) as {
      x402Version: number;
      accepts: { amount: string }[];
    };
    expect(body.x402Version).toBe(2);
    expect(body.accepts[0].amount).toBe("0");

    const paid = await handleAgentHttp(
      new Request("https://example.test/api/v1/list_pads", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "PAYMENT-SIGNATURE": "e30=",
        },
        body: "{}",
      }),
    );
    expect(paid?.status).toBe(200);
    const rows = (await paid!.json()) as { id: string }[];
    expect(rows.some((p) => p.id === "clanker")).toBe(true);
  });

  it("dispatch list_pads returns the matrix", async () => {
    const rows = (await dispatch("list_pads", {})) as { id: string }[];
    expect(rows.some((p) => p.id === "clanker")).toBe(true);
  });

  it("offers the same howToSign to agents as the Mini App", async () => {
    const rows = (await dispatch("list_pads", {})) as {
      id: string;
      howToSign: { surfaces: string[]; action: string };
    }[];
    for (const id of ["clanker", "bankr", "poolsfun"]) {
      const row = rows.find((p) => p.id === id);
      expect(row?.howToSign.surfaces).toEqual(
        expect.arrayContaining(["mini-app", "mcp"]),
      );
    }
    const split = (await dispatch("check_bankr_split", {
      feeDistribution: {
        creator: 5700,
        bankr: 3610,
        alt: 190,
        protocol: 500,
      },
    })) as { ok: boolean };
    expect(split.ok).toBe(true);
  });
});
