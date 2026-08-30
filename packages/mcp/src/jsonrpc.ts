import { dispatch, TOOL_DEFS } from "./tools.js";

export type JsonRpcReq = {
  jsonrpc?: "2.0";
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

const SERVER_INFO = {
  name: "launch-router",
  version: "0.1.0",
  title: "Numetal launch router",
};

export async function handleJsonRpc(msg: JsonRpcReq): Promise<unknown> {
  const id = msg.id ?? null;
  const method = msg.method ?? "";
  try {
    if (method === "initialize") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions:
            "Pad aggregator. list_pads → get_capabilities → simulate_launch / get_sign_payload. The user signs. There is no broadcast tool.",
        },
      };
    }
    if (method === "notifications/initialized" || method === "ping") {
      if (method === "ping") {
        return { jsonrpc: "2.0", id, result: {} };
      }
      return null;
    }
    if (method === "tools/list") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: TOOL_DEFS.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
          })),
        },
      };
    }
    if (method === "tools/call") {
      const name = String(msg.params?.name ?? "");
      const args = (msg.params?.arguments ?? {}) as Record<string, unknown>;
      const result = await dispatch(name, args);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
          structuredContent: result,
        },
      };
    }
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `method not found: ${method}` },
    };
  } catch (e) {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32000,
        message: e instanceof Error ? e.message : String(e),
      },
    };
  }
}
