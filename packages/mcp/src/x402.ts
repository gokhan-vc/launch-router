/** x402 v2, amount "0" — registered, free, agents can call. */

export const X402_VERSION = 2;
export const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const PAY_TO = "0x000000000000000000000000000000000000dEaD";

export function encodeX402Header(obj: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function hasPaymentHeader(req: Request): boolean {
  const h = req.headers;
  return Boolean(
    h.get("PAYMENT-SIGNATURE") ||
      h.get("payment-signature") ||
      h.get("X-Payment") ||
      h.get("x-payment") ||
      h.get("PAYMENT-RESPONSE") ||
      h.get("payment-response"),
  );
}

export type Accept = {
  scheme: "exact";
  network: "eip155:8453";
  amount: "0";
  maxTimeoutSeconds: number;
  payTo: string;
  asset: string;
  extra: { name: string; version: string };
};

export function zeroAccept(): Accept {
  return {
    scheme: "exact",
    network: "eip155:8453",
    amount: "0",
    maxTimeoutSeconds: 60,
    payTo: PAY_TO,
    asset: USDC_BASE,
    extra: { name: "USDC", version: "2" },
  };
}

export function challengeBody(
  resourceUrl: string,
  description: string,
  inputSchema?: Record<string, unknown>,
) {
  return {
    x402Version: X402_VERSION,
    error: "payment required",
    resource: {
      url: resourceUrl,
      description,
      mimeType: "application/json",
    },
    accepts: [zeroAccept()],
    extensions: {
      bazaar: {
        discoverable: true,
        category: "crypto",
        info: {
          input: {
            type: "http",
            method: "POST",
            bodyType: "json",
            ...(inputSchema ? { body: inputSchema } : {}),
          },
          output: { type: "json" },
        },
      },
    },
  };
}

export function paymentRequiredResponse(
  body: ReturnType<typeof challengeBody>,
  extraHeaders: Record<string, string> = {},
): Response {
  const b64 = encodeX402Header(body);
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    ...extraHeaders,
  });
  headers.set("PAYMENT-REQUIRED", b64);
  headers.set("x-payment-required", b64);
  let host = "launch.numetal.xyz";
  try {
    host = new URL(body.resource.url).hostname;
  } catch {
    /* keep default */
  }
  const expires = new Date(Date.now() + 60_000).toISOString();
  headers.set(
    "WWW-Authenticate",
    `Payment id="launch-router", realm="${host}", method="x402", intent="charge", expires="${expires}"`,
  );
  return new Response(JSON.stringify(body, null, 2), { status: 402, headers });
}
