import { TOOL_DEFS } from "./tools.js";

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export function originFrom(req?: Request): string {
  if (!req) return "http://localhost:8787";
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

/** x402 Bazaar catalog. amount "0" — freely callable. Listing itself is free. */
export function x402WellKnown(origin: string) {
  return {
    x402Version: 2,
    serviceName: "Numetal launch router",
    tags: ["launchpad", "clanker", "bankr", "poolsfun", "token", "mcp", "agent"],
    resources: TOOL_DEFS.map((t) => ({
      resource: `${origin}/mcp`,
      type: "mcp",
      x402Version: 2,
      accepts: [
        {
          scheme: "exact",
          network: "eip155:8453",
          amount: "0",
          maxTimeoutSeconds: 60,
          payTo: "0x000000000000000000000000000000000000dEaD",
          asset: USDC_BASE,
          extra: { name: "USDC", version: "2" },
        },
      ],
      extensions: {
        bazaar: {
          discoverable: true,
          category: "crypto",
          tags: ["launchpad", "clanker", "bankr", "poolsfun", "token", "mcp", "agent"],
          info: {
            input: {
              type: "mcp",
              toolName: t.name,
              description: t.description,
              transport: "streamable-http",
              inputSchema: t.inputSchema,
            },
            output: { type: "json" },
          },
        },
      },
    })),
  };
}

/** MPP catalog blob — price 0 so agents without a Tempo wallet still call. */
export function mppWellKnown(origin: string) {
  return {
    protocol: "mpp",
    version: 1,
    name: "Numetal launch router",
    description:
      "Pad aggregator. Same Sign for humans and agents on Clanker/Bankr/pools.fun. User signs. Free.",
    origin,
    price: "0",
    currency: "USD",
    endpoints: TOOL_DEFS.map((t) => ({
      method: "POST",
      path: `/api/v1/${t.name}`,
      tool: t.name,
      description: t.description,
      price: "0",
    })),
    mcp: `${origin}/mcp`,
    docs: `${origin}/llms.txt`,
  };
}

export function mcpManifest(origin: string) {
  return {
    name: "launch-router",
    description:
      "Route a token launch through an existing pad. User signs. Never broadcast.",
    transport: "streamable-http",
    url: `${origin}/mcp`,
    stdio: "npx tsx packages/mcp/src/stdio.ts",
    tools: TOOL_DEFS.map((t) => t.name),
    docs: `${origin}/llms.txt`,
  };
}
