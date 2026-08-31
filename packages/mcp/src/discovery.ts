import { TOOL_DEFS } from "./tools.js";
import { USDC_BASE, X402_VERSION, zeroAccept } from "./x402.js";

const X402_SECURITY = [{ x402: [] as string[] }];

export function originFrom(req?: Request): string {
  if (!req) return "http://localhost:8787";
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

function paidHttpResources(origin: string) {
  const mcp = {
    resource: `${origin}/mcp`,
    type: "http",
    x402Version: X402_VERSION,
    description:
      "MCP JSON-RPC. x402 amount 0 — agents pay $0 and call. Bare POST → 402.",
    mimeType: "application/json",
    accepts: [zeroAccept()],
    extensions: {
      bazaar: {
        discoverable: true,
        category: "crypto",
        tags: ["launchpad", "clanker", "bankr", "poolsfun", "token", "mcp", "agent"],
        info: {
          input: { type: "http", method: "POST", bodyType: "json" },
          output: { type: "json" },
        },
      },
    },
  };
  const rest = TOOL_DEFS.map((t) => ({
    resource: `${origin}/api/v1/${t.name}`,
    type: "http",
    x402Version: X402_VERSION,
    description: `${t.description} x402 amount 0.`,
    mimeType: "application/json",
    accepts: [zeroAccept()],
    extensions: {
      bazaar: {
        discoverable: true,
        category: "crypto",
        tags: ["launchpad", "clanker", "bankr", "poolsfun", "token", "mcp", "agent"],
        info: {
          input: {
            type: "http",
            method: "POST",
            bodyType: "json",
            body: t.inputSchema,
          },
          output: { type: "json" },
        },
      },
    },
  }));
  return [mcp, ...rest];
}

/** x402 Bazaar catalog. amount "0" — still a 402, still registered, $0 to call. */
export function x402WellKnown(origin: string) {
  return {
    x402Version: X402_VERSION,
    serviceName: "Numetal launch router",
    tags: ["launchpad", "clanker", "bankr", "poolsfun", "token", "mcp", "agent"],
    resources: paidHttpResources(origin),
  };
}

/** MPP catalog blob — price 0. */
export function mppWellKnown(origin: string) {
  return {
    protocol: "mpp",
    version: 1,
    name: "Numetal launch router",
    description:
      "Pad aggregator. Same Sign for humans and agents on Clanker/Bankr/pools.fun. User signs. x402 amount 0.",
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
      "Route a token launch through an existing pad. User signs. Never broadcast. x402 amount 0.",
    transport: "streamable-http",
    url: `${origin}/mcp`,
    stdio: "npx tsx packages/mcp/src/stdio.ts",
    tools: TOOL_DEFS.map((t) => t.name),
    docs: `${origin}/llms.txt`,
  };
}

const PAY_402 = {
  description:
    "x402 v2 Payment Required, amount 0. PAYMENT-REQUIRED is base64(JSON). Sign $0 and retry with PAYMENT-SIGNATURE (or X-Payment).",
};

export function openapi(origin: string) {
  const paths: Record<string, unknown> = {
    "/mcp": {
      post: {
        operationId: "mcp",
        summary:
          "MCP JSON-RPC 2.0. x402 amount 0. Bare POST → 402, then retry with payment header.",
        security: X402_SECURITY,
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "object", additionalProperties: true },
            },
          },
        },
        responses: {
          "200": { description: "JSON-RPC result" },
          "402": PAY_402,
        },
      },
    },
  };
  for (const t of TOOL_DEFS) {
    paths[`/api/v1/${t.name}`] = {
      post: {
        operationId: t.name,
        summary: t.description,
        security: X402_SECURITY,
        requestBody: {
          required: true,
          content: { "application/json": { schema: t.inputSchema } },
        },
        responses: {
          "200": { description: "ok" },
          "402": PAY_402,
        },
      },
    };
  }
  return {
    openapi: "3.1.0",
    info: {
      title: "Numetal launch router",
      version: "0.1.0",
      description:
        "x402 amount 0 on Base USDC. Bare POST → 402. Agents retry with PAYMENT-SIGNATURE and call for $0. User signs deploys. No broadcast.",
    },
    servers: [{ url: origin }],
    security: X402_SECURITY,
    components: {
      securitySchemes: {
        x402: {
          type: "apiKey",
          in: "header",
          name: "PAYMENT-SIGNATURE",
          description:
            "x402 v2. Bare request returns 402 with PAYMENT-REQUIRED (amount 0). Retry with PAYMENT-SIGNATURE or X-Payment. $0 — no on-chain transfer.",
        },
      },
    },
    paths,
  };
}

export { USDC_BASE };
