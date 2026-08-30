/** Telegram Mini App initData HMAC (Bot API). */

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(
  key: BufferSource,
  msg: string,
): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(msg));
}

export function dataCheckString(initData: string): {
  hash: string;
  check: string;
} {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash") ?? "";
  params.delete("hash");
  const pairs = [...params.entries()].map(([k, v]) => `${k}=${v}`);
  pairs.sort();
  return { hash, check: pairs.join("\n") };
}

export async function validateInitData(
  initData: string,
  botToken: string,
): Promise<boolean> {
  if (!initData || !botToken) return false;
  const { hash, check } = dataCheckString(initData);
  if (!hash) return false;
  const secret = await hmacSha256(
    new TextEncoder().encode("WebAppData"),
    botToken,
  );
  const computed = hex(await hmacSha256(secret, check));
  return computed === hash.toLowerCase();
}

export function parseUser(initData: string): {
  id?: number;
  username?: string;
} | null {
  const raw = new URLSearchParams(initData).get("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { id?: number; username?: string };
  } catch {
    return null;
  }
}
