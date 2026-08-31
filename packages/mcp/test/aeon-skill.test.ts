import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { FORBIDDEN_TOOLS } from "../src/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const skill = readFileSync(join(root, "skills/launch-router/SKILL.md"), "utf8");
const landing = readFileSync(
  join(root, "packages/telegram/index.html"),
  "utf8",
);
const pack = JSON.parse(
  readFileSync(join(root, "skills-pack.json"), "utf8"),
) as {
  skills: {
    slug: string;
    category: string;
    schedule: string;
    default_enabled: boolean;
    capabilities: string[];
    secrets_required: string[];
  }[];
};

describe("aeon skill pack", () => {
  it("is crypto, exact read-only, on-demand, disabled", () => {
    expect(skill).toMatch(/^name:\s*launch-router$/m);
    expect(skill).toMatch(/^\s+mode:\s*read-only$/m);
    expect(skill).toMatch(/^\s+category:\s*crypto$/m);
    expect(skill).not.toMatch(/^\s*mode:\s*(readonly|read_only|write)\s*$/m);
    expect(pack.skills).toHaveLength(1);
    const s = pack.skills[0];
    expect(s.slug).toBe("launch-router");
    expect(s.category).toBe("crypto");
    expect(s.schedule).toBe("workflow_dispatch");
    expect(s.default_enabled).toBe(false);
    expect(s.secrets_required).toEqual([]);
    expect(s.capabilities).toEqual([
      "read_only",
      "external_api",
      "sends_notifications",
    ]);
    expect(s.capabilities).not.toContain("onchain_writes");
  });

  it("never instructs the unattended run to broadcast", () => {
    for (const t of FORBIDDEN_TOOLS) {
      expect(skill).toMatch(new RegExp(`no.*\\b${t}\\b|never.*\\b${t}\\b`, "i"));
    }
    expect(skill).toMatch(/LAUNCH_ROUTER_IDLE/);
    expect(skill).toMatch(/\.\/notify/);
    expect(skill).toMatch(/### launch-router/);
  });
});

describe("landing", () => {
  it("is the joke title, nautilus, people/machines, no mono UI font", () => {
    expect(landing).toContain("Nuclear Crypto Launch Pad");
    expect(landing).toContain("/nautilus.svg");
    expect(landing).toContain("col people");
    expect(landing).toContain("col machines");
    expect(landing).toContain("https://numetal.xyz");
    expect(landing).toContain("https://gokhan.vc");
    expect(landing).toContain("https://x.com/goekhanvc");
    expect(landing).toContain("IBM Plex Sans");
    expect(landing).toContain("IBM Plex Serif");
    expect(landing).not.toMatch(/IBM Plex Mono|ui-monospace|SF Mono/);
  });

  it("offers the same live Sign to people and machines", () => {
    expect(landing).toContain("col people");
    expect(landing).toContain("col machines");
    const people = landing.split('class="col machines"')[0];
    const machines = landing.split('class="col machines"')[1];
    for (const col of [people, machines]) {
      expect(col).toMatch(/Clanker/i);
      expect(col).toMatch(/Bankr/i);
      expect(col).toMatch(/PartyFactory\.launch/);
    }
    expect(landing).toMatch(/people and machines/i);
    expect(landing).toContain("https://t.me/numetalxyz");
    expect(landing).toContain("t.me/botusername/appname");
    expect(landing).toContain("t.me/botusername?startapp");
    expect(landing).toMatch(/We don’t have that bot yet|We don't have that bot yet/);
    expect(landing).not.toMatch(/Bot <code>\/start<\/code> opens/);
  });
});
