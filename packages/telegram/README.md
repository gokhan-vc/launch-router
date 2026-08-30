# Telegram Mini App

The human surface for launch-router. Kernel runs in the client. **You sign.** The Worker never holds keys.

```bash
# from repo root
npm run dev:miniapp     # http://localhost:5177  (open in a browser to preview)
npm run build:miniapp
npm run dev:worker      # serves dist + /telegram/webhook + /api/*
```

## Bot

1. @BotFather → `/newbot` → `/setmenubutton` → Mini App URL.
2. Set webhook: `https://api.telegram.org/bot$TOKEN/setWebhook?url=$ORIGIN/telegram/webhook`
3. `.dev.vars`: `TELEGRAM_BOT_TOKEN`, `MINIAPP_URL` (HTTPS origin of the Mini App).

`/start` and `/pads` reply with **Open Mini App — you sign**.

## Wallet

Telegram WebView has no `window.ethereum`.

| Env | What happens |
|---|---|
| Desktop browser + MetaMask | Connect works (injected). Clanker **Sign** can call `clanker-sdk`. |
| `VITE_WC_PROJECT_ID` | WalletConnect (not wired in v0 UI yet — use injected or Privy). |
| `VITE_PRIVY_APP_ID` | Zero-click Telegram login + embedded wallet (Privy). App id required; not bundled until set. |
| Neither, inside Telegram | Simulate still works. Sign is disabled until a wallet provider exists. |

## Pads

Clanker live-sign in the Mini App (user wallet + SDK). Bankr and pools.fun: simulate + payload only — no fake tx. Unproven pads (Pons, Feel.cash, …) are labelled and blocked.
