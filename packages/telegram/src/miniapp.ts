import { MATRIX, capFor, type PadId } from "@numetal/launch-kernel";
import { draftClanker } from "@numetal/adapter-clanker";
import { draftBankr } from "@numetal/adapter-bankr";
import { draftPoolsfunMined } from "@numetal/adapter-poolsfun";
import { CHAINS, formToIntent, pairOptionsFor, type LaunchForm } from "./form.js";
import { bootTelegram, type WebApp } from "./telegram.js";
import {
  connectInjected,
  connectWalletConnect,
  switchChain,
  walletClient,
  publicClientFor,
  type Connected,
} from "./wallet.js";

const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;

function val(id: string) {
  return (document.getElementById(id) as HTMLInputElement).value;
}

function form(): LaunchForm {
  return {
    name: val("name"),
    symbol: val("symbol"),
    pad: val("pad") as PadId,
    chainId: Number(val("chain")),
    creator: val("creator"),
    image: val("image"),
    description: val("description"),
    metadataUri: val("metadata"),
    pairedAsset: val("pair") || undefined,
    customPair: val("customPair"),
    feeKind: (val("feeKind") || undefined) as LaunchForm["feeKind"],
    feePreset: (val("feePreset") || undefined) as LaunchForm["feePreset"],
    feePct: val("feePct") ? Number(val("feePct")) : undefined,
    clankerFeePct: val("clankerFeePct") ? Number(val("clankerFeePct")) : undefined,
    pairedFeePct: val("pairedFeePct") ? Number(val("pairedFeePct")) : undefined,
    poolPositions: (val("positions") || undefined) as LaunchForm["poolPositions"],
    tickIfToken0IsClanker: val("tick") ? Number(val("tick")) : undefined,
    tickSpacing: val("tickSpacing") ? Number(val("tickSpacing")) : undefined,
    mode: (val("mode") || undefined) as LaunchForm["mode"],
    vaultPct: val("vaultPct") ? Number(val("vaultPct")) : undefined,
    vaultLockupDays: val("vaultLockupDays")
      ? Number(val("vaultLockupDays"))
      : undefined,
    vaultVestDays: val("vaultVestDays") ? Number(val("vaultVestDays")) : undefined,
    vaultRecipient: val("vaultRecipient"),
    sniperStartPct: val("sniperStartPct")
      ? Number(val("sniperStartPct"))
      : undefined,
    sniperEndPct: val("sniperEndPct") ? Number(val("sniperEndPct")) : undefined,
    sniperDecay: val("sniperDecay") ? Number(val("sniperDecay")) : undefined,
    devBuyEth: val("devBuy") ? Number(val("devBuy")) : undefined,
    devBuyRecipient: val("devBuyRecipient"),
    creatorRewardPct: val("creatorRewardPct")
      ? Number(val("creatorRewardPct"))
      : undefined,
    interfaceAdmin: val("interfaceAdmin"),
    rewardRecipient: val("rewardRecipient"),
    rewardRecipientPct: val("rewardRecipientPct")
      ? Number(val("rewardRecipientPct"))
      : undefined,
    vanity: $<HTMLInputElement>("vanity").checked,
    tokenAdmin: val("tokenAdmin"),
    feeRecipient: val("feeRecipient"),
    expectedStartTick: val("expectedStartTick")
      ? Number(val("expectedStartTick"))
      : undefined,
    deadline: val("deadline") ? Number(val("deadline")) : undefined,
    twitterUrl: val("twitterUrl"),
    websiteUrl: val("websiteUrl"),
    telegramUrl: val("telegramUrl"),
    airdropJson: val("airdrop"),
    socialsJson: val("socials"),
    auditUrls: val("auditUrls"),
    airdropRoot: val("airdropRoot"),
    airdropAmount: val("airdropAmount") ? Number(val("airdropAmount")) : undefined,
    airdropLockupDays: val("airdropLockupDays")
      ? Number(val("airdropLockupDays"))
      : undefined,
    airdropVestDays: val("airdropVestDays")
      ? Number(val("airdropVestDays"))
      : undefined,
    airdropAdmin: val("airdropAdmin"),
    contextInterface: val("contextInterface"),
    contextPlatform: val("contextPlatform"),
    locker: val("locker"),
    lockerData: val("lockerData"),
    poolExtAddress: val("poolExtAddress"),
    poolExtInit: val("poolExtInit"),
    presalePct: val("presalePct") ? Number(val("presalePct")) : undefined,
    feesCustomJson: val("feesCustom"),
    poolPositionsJson: val("poolPositions"),
    rewardsJson: val("rewards"),
  };
}

function setStatus(msg: string, kind: "ok" | "err" | "info" = "info") {
  const el = $("status");
  el.dataset.kind = kind;
  el.textContent = msg;
}

function renderPads() {
  $<HTMLSelectElement>("pad").innerHTML = MATRIX.map(
    (p) =>
      `<option value="${p.id}">${p.id}${p.status === "unproven" ? " (unproven)" : ""}</option>`,
  ).join("");
}

function renderChains(pad: PadId) {
  const cap = capFor(pad);
  const ids = cap.chains.length ? cap.chains : Object.keys(CHAINS).map(Number);
  $<HTMLSelectElement>("chain").innerHTML = ids
    .map((id) => `<option value="${id}">${CHAINS[id] ?? id} (${id})</option>`)
    .join("");
}

function renderPair(pad: PadId) {
  const sel = $<HTMLSelectElement>("pair");
  const prev = sel.value;
  const opts = pairOptionsFor(pad);
  sel.innerHTML = opts
    .map((o) => `<option value="${o.value}">${o.label}</option>`)
    .join("");
  sel.value = opts.some((o) => o.value === prev) ? prev : opts[0]?.value ?? "";
  const showPair = capFor(pad).knobs.includes("pairedAsset");
  $("pair-row").hidden = !showPair;
  $("custom-pair-row").hidden = !showPair || pad === "pons";
  if (!showPair) {
    sel.value = "";
    $<HTMLInputElement>("customPair").value = "";
  }
}

function applyPadUi() {
  const pad = $<HTMLSelectElement>("pad").value as PadId;
  const cap = capFor(pad);
  renderChains(pad);
  renderPair(pad);
  $("pad-notes").textContent = cap.notes;
  $("unproven").hidden = cap.status !== "unproven";
  const ignore: string[] = [];
  if (cap.forbidden.includes("fees")) ignore.push("fee kind/preset (factory hard-codes fee)");
  if (cap.forbidden.includes("pool")) ignore.push("v4 positions/ticks");
  $("ignored").textContent = ignore.length
    ? `On ${pad}, Simulate will warn (not hide): ${ignore.join("; ")}.`
    : "";
}

async function payloadFor(raw: ReturnType<typeof formToIntent>) {
  const pad = raw.pad;
  switch (pad) {
    case "clanker":
      return draftClanker(raw);
    case "bankr":
      return draftBankr(raw);
    case "poolsfun":
      setStatus("Mining CREATE2 salt so the token sorts below WETH…", "info");
      return draftPoolsfunMined(raw, {
        expectedStartTick: raw.expectedStartTick ?? -190600,
        deadline: raw.deadline ?? Math.floor(Date.now() / 1000) + 3600,
      });
    default:
      return {
        ok: false as const,
        errors: [`pad ${pad} is unproven — no sign payload`],
      };
  }
}

function showPayload(obj: unknown) {
  $("payload").textContent = JSON.stringify(
    obj,
    (_k, v) => (typeof v === "bigint" ? v.toString() : v),
    2,
  );
  const kind =
    obj &&
    typeof obj === "object" &&
    "payload" in obj &&
    obj.payload &&
    typeof obj.payload === "object" &&
    "kind" in obj.payload
      ? String((obj.payload as { kind?: string }).kind)
      : "";
  const captions: Record<string, string> = {
    "clanker-deploy-config":
      "Clanker SDK deploy() config. Your wallet signs this. It is not a REST API request.",
    "bankr-deploy-simulate":
      "Bankr POST /token-launches/deploy body (simulateOnly: true). v0 does not send partner keys.",
    "partyfactory-launch-args":
      "pools.fun PartyFactory.launch args. Salt was mined so the token sorts below WETH. 1B / 1% / LP lock are factory-hardcoded.",
  };
  $("payload-caption").textContent =
    captions[kind] ??
    (obj && typeof obj === "object" && "ok" in obj && !(obj as { ok: boolean }).ok
      ? "Rejected — nothing to sign."
      : "Pad-sign payload. Not a public REST argument.");
}

let connected: Connected | null = null;
let lastPayload: unknown = null;
let tg: WebApp | null = null;

function onWallet(c: Connected) {
  connected = c;
  $<HTMLInputElement>("creator").value = c.address;
  $("wallet").textContent = `${c.source ?? "wallet"} ${c.address.slice(0, 6)}…${c.address.slice(-4)}`;
  setStatus(`Connected ${c.address}`, "ok");
}

async function simulate() {
  try {
    const intent = formToIntent(form());
    const r = await payloadFor(intent);
    lastPayload = r;
    showPayload(r);
    if (!r.ok) {
      setStatus((r.errors ?? ["rejected"]).join(" · "), "err");
      tg?.HapticFeedback?.impactOccurred("heavy");
      return;
    }
    const warns = "warnings" in r && Array.isArray(r.warnings) ? r.warnings : [];
    setStatus(
      warns.length
        ? `Simulated with warnings: ${warns.join(" · ")}`
        : "Simulated. Review the pad-sign payload below, then Sign.",
      warns.length ? "info" : "ok",
    );
    tg?.MainButton.setText("Sign in wallet");
    tg?.MainButton.show();
    tg?.MainButton.enable();
  } catch (e) {
    setStatus(e instanceof Error ? e.message : String(e), "err");
  }
}

async function connectBrowser() {
  try {
    onWallet(await connectInjected());
  } catch (e) {
    setStatus(e instanceof Error ? e.message : String(e), "err");
  }
}

async function connectWc() {
  try {
    setStatus("Opening WalletConnect…", "info");
    onWallet(await connectWalletConnect());
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
    setStatus("Connect Telegram wallet, WalletConnect, or a browser wallet first.", "err");
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
      `${pad} payload is ready. Live sign in v0 is Clanker. Other pads: you still review/sign that payload — we do not invent a tx.`,
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
    const clanker = new Clanker({ wallet, publicClient } as never);
    const cfg = drafted.payload.config;
    const { txHash, waitForTransaction, error } = await clanker.deploy(
      cfg as never,
    );
    if (error) throw error;
    const rec = waitForTransaction
      ? await waitForTransaction()
      : { address: undefined };
    showPayload({ txHash, token: rec });
    setStatus(
      rec && "address" in rec && rec.address
        ? `Launched ${rec.address} on Clanker.`
        : `Submitted ${txHash}`,
      "ok",
    );
    tg?.HapticFeedback?.impactOccurred("soft");
  } catch (e) {
    setStatus(e instanceof Error ? e.message : String(e), "err");
  }
}

function main() {
  tg = bootTelegram();
  renderPads();
  applyPadUi();
  $("who").textContent = tg?.initDataUnsafe?.user?.username
    ? `@${tg.initDataUnsafe.user.username}`
    : tg?.initData
      ? "Telegram"
      : "browser preview";

  $("pad").addEventListener("change", applyPadUi);
  $("connect").addEventListener("click", () => void connectBrowser());
  $("connect-wc").addEventListener("click", () => void connectWc());
  $("simulate").addEventListener("click", () => void simulate());
  $("sign").addEventListener("click", () => void sign());

  let privy: { login: () => void } | null | undefined;
  async function ensurePrivy() {
    if (privy !== undefined) return privy;
    const { mountPrivy } = await import("./privy-mount.js");
    privy = mountPrivy($("privy-root"), onWallet);
    return privy;
  }

  $("connect-tg").addEventListener("click", () => {
    void (async () => {
      setStatus("Opening Telegram login…", "info");
      const p = await ensurePrivy();
      if (p) p.login();
      else
        setStatus(
          "Set VITE_PRIVY_APP_ID so Telegram Mini App login can mint an embedded EVM wallet. Official @wallet is TON and cannot sign Clanker.",
          "err",
        );
    })();
  });

  if (import.meta.env.VITE_PRIVY_APP_ID && tg?.initData) {
    void ensurePrivy().then((p) => p?.login());
  }

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
