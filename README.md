# launch-router

**Nuclear Crypto Launch Pad** — a joke title. Numetal **agentic** pad aggregator at [launch.numetal.xyz](https://launch.numetal.xyz). Skill + MCP for Grok, Cursor, Claude, Codex/ChatGPT, OpenRouter, OpenCode, Amp, Devin, Telegram AI bots, Grok bot, Hermes, [Aeon](https://www.aeon.fun), anything that speaks MCP, HTTP, or `SKILL.md`.

Pick an existing launchpad. We build **that pad’s** payload. **The user signs.** Not a launchpad. Not [coins.numetal.xyz](https://coins.numetal.xyz).

v0 wired: **Clanker**, **Bankr**, **pools.fun**. Unproven matrix: Pons, Feel.cash, pools.trade, pump.fun, Flap.

**No broadcast tool.** Agents never hold keys.

```bash
npm test
npm run mcp              # stdio MCP
npm run dev:worker       # HTTP MCP + well-known + optional Mini App
```

## Agents

| Host | How |
|---|---|
| Cursor / Claude / Grok / Codex / Amp / OpenCode / Devin / ChatGPT MCP | stdio: `npx tsx packages/mcp/src/stdio.ts` |
| Telegram AI / Grok bot / Hermes / OpenRouter HTTP | `POST {origin}/mcp` JSON-RPC or `POST {origin}/api/v1/{tool}` |
| Aeon (`aeon.fun`) | `skills/launch-router/SKILL.md` + `skills-pack.json`. Copy into the instance, or `bin/add-skill <owner>/<repo> launch-router` / `bin/install-skill-pack <owner>/<repo>` once this repo is public. Lands **disabled**, `workflow_dispatch`, `mode: read-only`. `./aeon mcp add launch-router {origin}/mcp`. Unattended runs **notify the sign payload** — they never broadcast. |
| Any crawler | `GET {origin}/llms.txt` |

Discovery is **free** (x402 `amount: "0"`, MPP `price: "0"`):

- `GET /.well-known/x402`
- `GET /.well-known/mpp.json`
- `GET /.well-known/mcp.json`
- `GET /openapi.json`

Skill: `skills/launch-router/SKILL.md` (Aeon-compatible: `category: crypto`, `mode: read-only`). Copy into `~/.agents/skills/`, `.cursor/skills/`, `.claude/skills/`, or an Aeon instance `skills/launch-router/`. Pack manifest: `skills-pack.json`. Do not PR `aeonfun/aeon` unless asked.

This repo has no GitHub remote. From an Aeon instance:

```bash
cp -R /path/to/launch-router/skills/launch-router skills/launch-router
# then in aeon.yml, before the heartbeat fallback, quoted schedule:
#   launch-router: { enabled: false, schedule: "workflow_dispatch" }
./aeon mcp add launch-router "$LAUNCH_ROUTER_ORIGIN/mcp"   # HTTP, no auth
# confirm with the operator before: ./aeon skills enable launch-router
```

## Networks

We support **every chain a pad lists** — no extras. `list_networks` is the union. Clanker: Base, Base Sepolia, Ethereum, Arbitrum, BSC, Unichain, Robinhood, Monad, Monad testnet, Abstract. Bankr: Base + Robinhood. pools.fun: Robinhood. pump.fun is Solana and **unproven** (no adapter).

## Mini App

Optional signing skin at `/` (not required). Chat still cannot sign.

```bash
npm run dev:miniapp    # http://localhost:5177  foyer; /app.html is Sign
```

Live: [launch.numetal.xyz](https://launch.numetal.xyz) · Sign: [/app.html](https://launch.numetal.xyz/app.html) · API catalog: [api.gokhan.vc](https://api.gokhan.vc/).
