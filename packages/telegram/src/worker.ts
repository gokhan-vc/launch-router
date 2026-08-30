import { handleCommand } from "./commands.js";
import { parseUser, validateInitData } from "./init-data.js";

export interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  TELEGRAM_BOT_TOKEN?: string;
  MINIAPP_URL?: string;
}

const API = "https://api.telegram.org/bot";

async function tg(
  token: string,
  method: string,
  body: unknown,
): Promise<void> {
  await fetch(`${API}${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function webAppKeyboard(url: string) {
  return {
    inline_keyboard: [
      [{ text: "Open Mini App — you sign", web_app: { url } }],
    ],
  };
}

async function handleTelegram(req: Request, env: Env): Promise<Response> {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) return new Response("bot token missing", { status: 503 });
  const update = (await req.json()) as {
    message?: { chat: { id: number }; text?: string };
  };
  const msg = update.message;
  if (!msg?.chat) return new Response("ok");
  const text = msg.text ?? "";
  const mini = env.MINIAPP_URL;
  const reply = handleCommand(text || "/start");
  await tg(token, "sendMessage", {
    chat_id: msg.chat.id,
    text: reply.text,
    reply_markup: mini ? webAppKeyboard(mini) : undefined,
  });
  return new Response("ok");
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/telegram/webhook" && req.method === "POST") {
      return handleTelegram(req, env);
    }

    if (url.pathname === "/api/session" && req.method === "POST") {
      const { initData } = (await req.json()) as { initData?: string };
      const token = env.TELEGRAM_BOT_TOKEN ?? "";
      const ok = initData
        ? await validateInitData(initData, token)
        : false;
      return Response.json({
        ok,
        user: ok && initData ? parseUser(initData) : null,
      });
    }

    if (url.pathname === "/api/health") {
      return Response.json({ ok: true, product: "launch-router" });
    }

    const res = await env.ASSETS.fetch(req);
    const headers = new Headers(res.headers);
    headers.set("Cache-Control", "no-store");
    headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' https://telegram.org https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline'",
        "connect-src 'self' https: wss:",
        "img-src 'self' data: https:",
        "frame-src https:",
      ].join("; "),
    );
    return new Response(res.body, { status: res.status, headers });
  },
};
