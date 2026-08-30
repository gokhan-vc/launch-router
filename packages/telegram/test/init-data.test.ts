import { describe, expect, it } from "vitest";
import {
  dataCheckString,
  parseUser,
  validateInitData,
} from "../src/init-data.js";

describe("initData", () => {
  it("sorts fields and strips hash for the check string", () => {
    const { hash, check } = dataCheckString(
      "query_id=AA&user=%7B%22id%22%3A1%7D&auth_date=1&hash=deadbeef",
    );
    expect(hash).toBe("deadbeef");
    expect(check.startsWith("auth_date=1")).toBe(true);
    expect(check).not.toMatch(/hash=/);
  });

  it("rejects empty initData", async () => {
    expect(await validateInitData("", "123:token")).toBe(false);
  });

  it("parses the Telegram user blob", () => {
    const u = parseUser(
      "user=" + encodeURIComponent(JSON.stringify({ id: 9, username: "g" })),
    );
    expect(u?.id).toBe(9);
    expect(u?.username).toBe("g");
  });
});
