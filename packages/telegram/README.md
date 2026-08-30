# Telegram Mini App

The human surface for launch-router. Kernel runs in the client. **You sign.** The Worker never holds keys.

```bash
# from repo root
npm run dev:miniapp     # http://localhost:5177  foyer; Sign is /app.html
npm run build:miniapp
npm run dev:worker      # serves dist + /telegram/webhook + /api/*
```

## Bot

1. @BotFather → `/newbot` → `/setmenubutton` → Mini App URL.
2. Set webhook: `https://api.telegram.org/bot$TOKEN/setWebhook?url=$ORIGIN/telegram/webhook`
3. `.dev.vars`: `TELEGRAM_BOT_TOKEN`, `MINIAPP_URL` (HTTPS origin of the Mini App).

`/start` and `/pads` reply with **Open Mini App — you sign**.

## Wallet

Telegram WebView has no `window.ethereum`. Official Telegram **@wallet is TON** and cannot sign Clanker / Bankr / pools.fun (EVM).

| Env / button | What happens |
|---|---|
| **Telegram wallet** + `VITE_PRIVY_APP_ID` | Privy Telegram login. Inside the Mini App this is seamless (`initData`); it mints an **embedded EVM wallet** (`createOnLogin: all-users`) that can sign Clanker. App id only — never a Privy secret in `VITE_`. |
| **WalletConnect** + `VITE_WC_PROJECT_ID` | Reown Cloud project. QR / deep-link to MetaMask, Rainbow, etc. from inside Telegram. |
| **Browser wallet** | Injected `window.ethereum` (MetaMask on desktop). |
| None of the above | Simulate still works. Sign is refused until a wallet exists. |

`packages/telegram/.env.local` holds public ids. Production should use a dedicated Privy app (not the datebook one) with `https://web.telegram.org` in allowed domains.

## What the JSON panel is

It is **not** a public REST argument. After Simulate it is the **pad-sign payload**:

| Pad | `payload.kind` | What you sign |
|---|---|---|
| Clanker | `clanker-deploy-config` | Clanker SDK `deploy()` config |
| Bankr | `bankr-deploy-simulate` | `POST /token-launches/deploy` — Simulate is `simulateOnly: true`; Sign POSTs live with the **user** key after the 57% split check. Partner keys refused. Key never leaves the page except to api.bankr.bot. |
| pools.fun | `partyfactory-launch-args` | Wallet `eth_sendTransaction` of `PartyFactory.launch` (1B / 1% / LP lock are factory-hardcoded). Live `startTickFor`. |
| unproven | — | no payload; we do not fake a tx |

Advanced fields stay visible on every pad. If the pad ignores one, Simulate **warns** and omits it from that payload.

CREATE2 **salt is never a form field**. Clanker’s SDK fills it (and mines `0x…b07` when Vanity is checked). pools.fun mines a salt via `PartyFactory.computeTokenAddress` so the token sorts below WETH (`TokenNotToken0` otherwise). The mined salt still appears in the sign payload because the tx needs it — people do not type it.

## Pads

Live Sign in the Mini App: Clanker (wallet + SDK), Bankr (user API key, never partner keys), pools.fun (wallet sends `PartyFactory.launch`). Unproven pads (Pons, Feel.cash, pools.trade, pump.fun, Flap) are labelled and blocked. letscash.fun has a public SDK but is not wired here.
