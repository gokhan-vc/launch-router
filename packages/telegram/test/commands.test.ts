import { describe, expect, it } from "vitest";
import { handleCommand } from "../src/commands.js";

describe("telegram commands", () => {
  it("/pads lists unproven pons and says Mini App signs", () => {
    const r = handleCommand("/pads");
    expect(r.text).toMatch(/pons/);
    expect(r.text).toMatch(/unproven/);
    expect(r.text).toMatch(/Mini App/);
    expect(r.text).toMatch(/MCP/);
  });

  it("/caps clanker returns wired matrix row", () => {
    const r = handleCommand("/caps clanker");
    expect(r.text).toMatch(/"status": "wired"/);
  });
});
