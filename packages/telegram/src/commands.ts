import { MATRIX, capFor, type PadId } from "@numetal/launch-kernel";

export type TgReply = { text: string };

export function handleCommand(text: string): TgReply {
  const t = text.trim();
  if (t === "/pads" || t === "/start") {
    const lines = MATRIX.map(
      (p) => `• ${p.id} — ${p.status} — ${p.notes}`,
    );
    return {
      text: [
        "Launch router. You pick a pad. We build that pad's payload. You sign — Mini App or any agent with MCP. Same JSON.",
        "",
        ...lines,
        "",
        "This chat does not hold keys. Mini App, MCP get_sign_payload, or curl: you sign.",
      ].join("\n"),
    };
  }
  const caps = t.match(/^\/caps\s+(\w+)/i);
  if (caps) {
    const id = caps[1].toLowerCase() as PadId;
    try {
      const c = capFor(id);
      return {
        text: JSON.stringify(c, null, 2),
      };
    } catch {
      return { text: `unknown pad ${id}` };
    }
  }
  if (t.startsWith("/draft") || t.startsWith("/simulate")) {
    return {
      text: "Send a LaunchIntent JSON, open the Mini App, or call MCP get_sign_payload. Same payload. Natural language is filled against the matrix — unsupported knobs are rejected, not coerced.",
    };
  }
  return {
    text: "Commands: /pads /caps <pad> /draft /simulate. Sign in the Mini App or via MCP — same payload.",
  };
}
