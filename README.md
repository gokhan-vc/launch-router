# launch-router

Numetal pad aggregator. Users pick an existing launchpad and parameters; we build **that pad’s** payload; **they sign**. Telegram Mini App + MCP + skill.

Not a launchpad. Not [coins.numetal.xyz](https://coins.numetal.xyz) (that is the register of tokens already launched). Not the dropped Telegram trade-room fan-in.

v0 adapters: **Clanker**, **Bankr/Doppler**, **pools.fun**. Pons / Feel.cash / pools.trade / pump.fun are matrix rows until a first-party ABI/API is proven.

Telegram Bot API cannot sign. Humans confirm in a Mini App. Agents get `simulate_launch` and `get_sign_payload` — no broadcast tool.

```bash
npm test
npm run dev:miniapp    # Telegram Mini App at http://localhost:5177
```

The Mini App is the human surface. Chat cannot sign. Wallet is injected (MetaMask) in a browser preview; inside Telegram you need Privy or WalletConnect env vars. Worker: `npm run build:miniapp && npm run dev:worker`.
