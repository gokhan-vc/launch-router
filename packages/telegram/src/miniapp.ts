import { MATRIX, route, capFor, type PadId } from "@numetal/launch-kernel";
import { draftClanker } from "@numetal/adapter-clanker";
import { draftBankr } from "@numetal/adapter-bankr";
import { draftPoolsfun } from "@numetal/adapter-poolsfun";
import { CHAINS, formToIntent, type LaunchForm } from "./form.js";
import { bootTelegram, type WebApp } from "./telegram.js";
import { connectInjected, switchChain, walletClient, publicClientFor, type Connected } from "./wallet.js";

const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;

function form(): LaunchForm {
  const pad = $<HTMLSelectElement>("pad").value as PadId;
  const feesOn = !$("fees-row").hidden;
  const poolOn = !$("pool-row").hidden;
  return {
    name: $<HTMLInputElement>("name").value,
    symbol: $<HTMLInputElement>("symbol").value,
    pad,
    chainId: Number($<HTMLSelectElement>("chain").value),
    creator: $<HTMLInputElement>("creator").value,
    image: $<HTMLInputElement>("image").value,
    description: $<HTMLInputElement>("description").value,
    metadataUri: $<HTMLInputElement>("metadata").value,
    pairedAsset: $<HTMLSelectElement>("pair").value || undefined,
    feeKind: feesOn
      ? (($<HTMLSelectElement>("feeKind").value || undefined) as
          | LaunchForm["feeKind"]
          | undefined)
      : undefined,
    feePreset: feesOn
      ? (($<HTMLSelectElement>("feePreset").value || undefined) as
          | LaunchForm["feePreset"]
          | undefined)
      : undefined,
    poolPositions: poolOn
      ? (($<HTMLSelectElement>("positions").value || undefined) as
          | LaunchForm["poolPositions"])
      : undefined,
    vanity: $<HTMLInputElement>("vanity").checked,
    salt: $<HTMLInputElement>("salt").value,
  };
}

function setStatus(msg: string, kind: "ok" | "err" | "info" = "info") {
  const el = $("status");
  el.dataset.kind = kind;
  el.textContent = msg;
}

function renderPads() {
  const sel = $<HTMLSelectElement>("pad");
  sel.innerHTML = MATRIX.map(
    (p) =>
      `<option value="${p.id}">${p.id}${p.status === "unproven" ? " (unproven)" : ""}</option>`,
  ).join("");
}

function renderChains(pad: PadId) {
  const cap = capFor(pad);
  const sel = $<HTMLSelectElement>("chain");
  const ids = cap.chains.length ? cap.chains : Object.keys(CHAINS).map(Number);
  sel.innerHTML = ids
    .map((id) => `<option value="${id}">${CHAINS[id] ?? id} (${id})</option>`)
    .join("");
}

function applyPadUi() {
  const pad = $<HTMLSelectElement>("pad").value as PadId;
  const cap = capFor(pad);
  renderChains(pad);
  $("pad-notes").textContent = cap.notes;
  const feesOff = cap.forbidden.includes("fees");
  $("fees-row").hidden = feesOff;
  $("pool-row").hidden = cap.forbidden.includes("pool");
  $("unproven").hidden = cap.status !== "unproven";
}

function payloadFor(raw: ReturnType<typeof formToIntent>) {
  const r = route(raw);
  if (!r.ok) return r;
  switch (r.adapter) {
    case "clanker":
      return draftClanker(raw);
    case "bankr":
      return draftBankr(raw);
    case "poolsfun":
      return draftPoolsfun(raw, {
        expectedStartTick: -190600,
        deadline: Math.floor(Date.now() / 1000) + 3600,
        salt: (raw.salt ||
          "0x0000000000000000000000000000000000000000000000000000000000000001") as `0x${string}`,
      });
    default:
      return {
        ok: false as const,
        errors: [`pad ${r.adapter} is unproven — no sign payload`],
      };
  }
}

function showPayload(obj: unknown) {
  $("payload").textContent = JSON.stringify(
    obj,
    (_k, v) => (typeof v === "bigint" ? v.toString() : v),
    2,
  );
}

let connected: Connected | null = null;
let lastPayload: unknown = null;
let tg: WebApp | null = null;

async function simulate() {
  try {
    const intent = formToIntent(form());
    const r = payloadFor(intent);
    lastPayload = r;
    showPayload(r);
    if (!r.ok) {
      setStatus((r.errors ?? ["rejected"]).join(" · "), "err");
      tg?.HapticFeedback?.impactOccurred("heavy");
      return;
    }
    setStatus("Simulated. Review the payload, then sign in your wallet.", "ok");
    tg?.MainButton.setText("Sign in wallet");
    tg?.MainButton.show();
    tg?.MainButton.enable();
  } catch (e) {
    setStatus(e instanceof Error ? e.message : String(e), "err");
  }
}

async function connect() {
  try {
    connected = await connectInjected();
    $<HTMLInputElement>("creator").value = connected.address;
    $("wallet").textContent = `${connected.address.slice(0, 6)}…${connected.address.slice(-4)}`;
    setStatus(`Wallet ${connected.address}`, "ok");
  } catch (e) {
    setStatus(e instanceof Error ? e.message : String(e), "err");
  }
}

async function sign() {
  if (!lastPayload || !(lastPayload as { ok?: boolean }).ok) {
    await simulate();
    if (!lastPayload || !(lastPayload as { ok?: boolean }).ok) return;
  }
  if (!connected) {
    setStatus("Connect a wallet first. The router never holds keys.", "err");
    return;
  }
  const pad = $<HTMLSelectElement>("pad").value as PadId;
  const chainId = Number($<HTMLSelectElement>("chain").value);
  try {
    await switchChain(connected.provider, chainId);
  } catch (e) {
    setStatus(
      `Could not switch chain ${chainId}: ${e instanceof Error ? e.message : e}`,
      "err",
    );
    return;
  }

  if (pad !== "clanker") {
    setStatus(
      `${pad} payload is ready. v0 live sign is Clanker only (SDK). Bankr/pools.fun: copy the payload; do not fake a tx.`,
      "info",
    );
    return;
  }

  setStatus("Asking wallet to sign the Clanker deploy…", "info");
  try {
    const { Clanker } = await import("clanker-sdk/v4");
    const intent = formToIntent(form());
    const drafted = draftClanker(intent);
    if (!drafted.ok) {
      setStatus(drafted.errors.join(" · "), "err");
      return;
    }
    const wallet = walletClient(connected, chainId);
    const publicClient = publicClientFor(chainId);
    const clanker = new Clanker({
      wallet,
      publicClient,
    } as never);
    const cfg = drafted.payload.config;
    const { txHash, waitForTransaction, error } = await clanker.deploy({
      name: cfg.name,
      symbol: cfg.symbol,
      tokenAdmin: cfg.tokenAdmin,
      chainId: cfg.chainId,
      image: cfg.image,
      vanity: cfg.vanity,
    });
    if (error) throw error;
    const rec = waitForTransaction ? await waitForTransaction() : { address: undefined };
    showPayload({ txHash, token: rec });
    setStatus(
      rec && "address" in rec && rec.address
        ? `Launched ${rec.address} on Clanker. Token lives on that pad.`
        : `Submitted ${txHash}`,
      "ok",
    );
    tg?.HapticFeedback?.impactOccurred("soft");
  } catch (e) {
    setStatus(
      e instanceof Error
        ? e.message
        : "Clanker SDK could not run in this client. Payload is still in the panel — sign from a wallet that can load clanker-sdk.",
      "err",
    );
  }
}

function main() {
  tg = bootTelegram();
  renderPads();
  applyPadUi();
  $("who").textContent = tg?.initDataUnsafe?.user?.username
    ? `@${tg.initDataUnsafe.user.username}`
    : tg
      ? "Telegram"
      : "browser preview";

  $("pad").addEventListener("change", applyPadUi);
  $("connect").addEventListener("click", () => void connect());
  $("simulate").addEventListener("click", () => void simulate());
  $("sign").addEventListener("click", () => void sign());

  if (tg) {
    tg.MainButton.setText("Simulate");
    tg.MainButton.show();
    tg.MainButton.onClick(() => {
      const label = (tg?.MainButton as { text?: string }).text ?? "";
      if (/sign/i.test(label)) void sign();
      else void simulate();
    });
  }
}

main();
