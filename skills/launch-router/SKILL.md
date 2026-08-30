---
name: launch-router
description: Route a token launch through an existing pad (Clanker, Bankr, pools.fun). User signs. Never broadcast. Use when the user wants to launch/deploy a memecoin or token on a named launchpad from chat or an agent.
---

# Launch router

Numetal **entry point**. The user picks a pad and parameters. You build **that pad’s** payload. **The user signs.** You do not become a launchpad. You do not hold keys. You do not call a `broadcast` tool (there is none).

coins.numetal.xyz is the **register** of tokens already launched. Do not edit it as this product.

## Always

1. `list_pads` / read the matrix.
2. Fill a `LaunchIntent` (`name`, `symbol`, `chainId`, `pad`, `creator`).
3. If a knob is forbidden on that pad, **tell the user**. Do not coerce (no Clanker stock pair, no pools.fun dynamic fees).
4. `simulate_launch` then `get_sign_payload`.
5. Show the fee split. Bankr default is 57/36.1/1.9/5 of 1.2%. If simulate returns anything else, **stop**.
6. Hand the payload to the user's wallet / Mini App.

## v0 wired pads

| Pad | Wire | Hard-coded |
|---|---|---|
| clanker | SDK config | Monad = static fees only |
| bankr | HTTP `simulateOnly: true` | split immutable after deploy; no partner keys |
| poolsfun | PartyFactory args on Robinhood | 1B supply, 1% fee, 100% LP locked |

Unproven (matrix only — no fake tx): Pons, Feel.cash, pools.trade, pump.fun, Flap.sh.

Stock-pairing is **Pons / Robinhood**, not a global field. Feel.cash tickers are `[A-Z0-9]{3,}`.

## Telegram

Bot commands draft the intent. Signing is the **Mini App**. Slash-command cannot broadcast.
