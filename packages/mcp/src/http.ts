import { dispatch } from "./tools.js";
import { handleJsonRpc, type JsonRpcReq } from "./jsonrpc.js";
import {
  mcpManifest,
  mppWellKnown,
  openapi,
  originFrom,
  x402WellKnown,
} from "./discovery.js";
import { LLMS_TXT } from "./llms.js";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers":
    "content-type, x-payment, authorization, payment-signature",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS },
  });
}

function text(body: string, type = "text/plain; charset=utf-8"): Response {
  return new Response(body, { headers: { "content-type": type, ...CORS } });
}

export async function handleAgentHttp(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const origin = originFrom(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  if (url.pathname === "/.well-known/x402") return json(x402WellKnown(origin));
  if (url.pathname === "/.well-known/mpp.json") return json(mppWellKnown(origin));
  if (url.pathname === "/.well-known/mcp.json") return json(mcpManifest(origin));
  if (url.pathname === "/llms.txt" || url.pathname === "/AGENTS.md")
    return text(LLMS_TXT, "text/markdown; charset=utf-8");
  if (url.pathname === "/openapi.json") return json(openapi(origin));

  if (url.pathname === "/mcp" && req.method === "POST") {
    const body = (await req.json()) as JsonRpcReq;
    const out = await handleJsonRpc(body);
    if (out == null) return new Response(null, { status: 204, headers: CORS });
    return json(out);
  }
  if (url.pathname === "/mcp" && req.method === "GET") return json(mcpManifest(origin));

  const api = url.pathname.match(/^\/api\/v1\/([a-z_]+)$/);
  if (api && req.method === "POST") {
    const name = api[1];
    const args = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    try {
      const result = await dispatch(name, args);
      return json(result);
    } catch (e) {
      return json(
        { ok: false, errors: [e instanceof Error ? e.message : String(e)] },
        400,
      );
    }
  }
  return null;
}
