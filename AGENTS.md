# Launch router — agents

Read `/llms.txt` or `packages/mcp/src/llms.ts`.

- MCP stdio: `npm run mcp`
- MCP HTTP: `POST /mcp`
- REST: `POST /api/v1/<tool>`
- Discovery (free): `GET /.well-known/x402`, `GET /.well-known/mpp.json`
- Skill: `skills/launch-router/SKILL.md` (also Aeon: `category: crypto`, `mode: read-only`, pack `skills-pack.json`)
- No broadcast. User signs. Aeon unattended runs notify the payload and stop.
