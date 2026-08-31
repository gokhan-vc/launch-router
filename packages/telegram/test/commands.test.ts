import { describe, expect, it } from "vitest";
import { handleCommand } from "../src/commands.js";

describe("telegram commands", () => {
  it("/pads lists unproven pons and points at Sign, not a generic /start", () => {
    const r = handleCommand("/pads");
    expect(r.text).toMatch(/pons/);
    expect(r.text).toMatch(/unproven/);
    expect(r.text).toMatch(/Mini App|MCP|sign/i);
  });

  it("/caps clanker returns wired matrix row", () => {
    const r = handleCommand("/caps clanker");
    expect(r.text).toMatch(/"status": "wired"/);
  });
});
