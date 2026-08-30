export const LLMS_TXT = `# Numetal launch router — agent instructions

You are talking to a **pad aggregator**, not a launchpad.
Pick an existing pad. Build **that pad's** sign payload. **The user signs.**
You never hold keys. There is **no** \`broadcast\`, \`send_transaction\`, or \`deploy\` tool.

coins.numetal.xyz is the register of tokens already launched. Do not edit it.

## Install (any MCP host)

stdio (Cursor, Claude Code, Claude Desktop, Grok, Codex, Amp, OpenCode, Devin, ChatGPT MCP, OpenRouter tool hosts, Hermes):

\`\`\`json
{
  "mcpServers": {
    "launch-router": {
      "command": "npx",
      "args": ["tsx", "packages/mcp/src/stdio.ts"],
      "cwd": "<path-to-launch-router>"
    }
  }
}
\`\`\`

HTTP (Telegram AI bots, Grok bot, remote Hermes, anything that speaks MCP-over-HTTP):

- \`POST {origin}/mcp\` — JSON-RPC 2.0 (\`initialize\`, \`tools/list\`, \`tools/call\`)
- \`POST {origin}/api/v1/{tool}\` — REST, body = tool arguments
- \`GET {origin}/llms.txt\` — this file
- \`GET {origin}/.well-known/x402\` — x402 Bazaar catalog, **amount 0**
- \`GET {origin}/.well-known/mpp.json\` — MPP descriptor, **price 0**
- \`GET {origin}/.well-known/mcp.json\` — MCP manifest
- \`GET {origin}/openapi.json\`

Skill file: \`skills/launch-router/SKILL.md\` (also copy into \`~/.agents/skills/\`, \`.cursor/skills/\`, \`.claude/skills/\`).

Aeon (https://www.aeon.fun): same file is a crypto-pack skill (\`metadata.category: crypto\`, \`metadata.mode: read-only\` exact). Pack manifest: \`skills-pack.json\`. Install into an instance with a copy, or \`bin/add-skill <owner>/<repo> launch-router\` / \`bin/install-skill-pack <owner>/<repo>\` once the repo is public. Lands disabled, on-demand (\`workflow_dispatch\`). Wire HTTP MCP: \`./aeon mcp add launch-router {origin}/mcp\` (no auth). Optional secret \`LAUNCH_ROUTER_ORIGIN\`. Unattended Actions **notify the sign payload and stop** — they never broadcast, even though Aeon can run with no human in the loop. Do not PR \`aeonfun/aeon\` unless asked.

## Always

1. \`list_pads\` then \`get_capabilities\` for the chosen pad.
2. Fill \`LaunchIntent\`: \`name\`, \`symbol\`, \`chainId\`, \`pad\`, \`creator\` (0x signer).
3. \`chainId\` MUST be in that pad's \`chains\`. Use \`list_networks\` for the union.
4. Forbidden knobs: tell the user. Do not coerce. Stock pairing (\`RH_STOCK\`) is **Pons only**.
5. Never ask for a CREATE2 salt. Clanker SDK fills it. pools.fun mines so the token sorts below WETH.
6. \`simulate_launch\` / \`get_sign_payload\`. Show the result. **Stop.**
7. Bankr: default split of the 1.2% swap is 57 / 36.1 / 1.9 / 5. If simulate returns anything else, refuse.
8. Hand the payload to the user's wallet. Optional Mini App at \`{origin}/app.html\` is a signing skin, not required. Human foyer: \`https://launch.numetal.xyz/\`.

## Wired pads (sign payload exists)

| Pad | Payload | Networks |
|---|---|---|
| clanker | Clanker SDK \`deploy()\` config | Base 8453, Base Sepolia 84532, Ethereum 1, Arbitrum 42161, BSC 56, Unichain 130, Robinhood 4663, Monad 143, Monad testnet 10143, Abstract 2741. Monad = static fees only. |
| bankr | \`POST https://api.bankr.bot/token-launches/deploy\` body, \`simulateOnly: true\` | Base 8453, Robinhood 4663 |
| poolsfun | \`PartyFactory.launch\` args (salt auto-mined) | Robinhood 4663. Factory hard-codes 1B supply, 1% fee, LP locked. |

## Unproven (matrix only — no fake tx)

pons (stock/ETH/USDG on Robinhood), feelcash, poolstrade, pumpfun (Solana — no EVM adapter), flap.

## LaunchIntent knobs (optional)

image, description, metadataUri, pairedAsset (WETH / USDG / RH_STOCK / 0x), fees, pool, vault (% + lockup seconds), airdrop, sniperFees (uniBps), devBuy, vanity, tokenAdmin, feeRecipient, rewards, socials, expectedStartTick, deadline.

Do not send JSON blobs unless the user already has one. Prefer URLs and percentages; convert % → bps (×100), days → seconds (×86400).

## What the payload is

Not a public REST argument. It is the object the **wallet** signs:

- clanker → \`kind: clanker-deploy-config\`
- bankr → \`kind: bankr-deploy-simulate\`
- poolsfun → \`kind: partyfactory-launch-args\`

## Discovery

Freely listed. x402 \`accepts[].amount\` is \`"0"\`. MPP \`price\` is \`"0"\`. No API key.
`;
