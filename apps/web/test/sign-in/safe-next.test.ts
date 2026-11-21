import { describe, expect, it } from "vitest";
// login.md section 2: `safeNext(raw, origin)`, exported from the auth module's index (T-F12 builds it).
import { safeNext } from "@/auth";

const ORIGIN = "http://localhost:3000";

describe("T-F12-01 · LG-03: safeNext keeps a same-origin path, search and hash", () => {
  it.each([
    ["/missions?x=1#a", "/missions?x=1#a"],
    ["/#/settings", "/#/settings"],
    ["/#/missions/m-1?tab=plan", "/#/missions/m-1?tab=plan"],
    ["/missions", "/missions"],
    ["/", "/"],
  ])("keeps %s as %s", (raw, kept) => {
    expect(safeNext(raw, ORIGIN)).toBe(kept);
  });

  it("returns the parsed URL's pathname, search and hash, never the raw string", () => {
    expect(safeNext("/a/../missions?x=1#a", ORIGIN)).toBe("/missions?x=1#a");
  });

  it("keeps a path of exactly 2,048 characters", () => {
    const raw = `/${"a".repeat(2047)}`;
    expect(raw).toHaveLength(2048);
    expect(safeNext(raw, ORIGIN)).toBe(raw);
  });
});

describe("T-F12-01 · LG-03: safeNext turns every hostile or oversized next into /", () => {
  it.each([
    ["//evil.example", "protocol-relative"],
    ["/\\evil.example", "backslash"],
    ["https://evil.example/x", "absolute"],
    ["http://localhost:3000/missions", "absolute, same origin"],
    ["javascript:alert(1)", "javascript scheme"],
    ["/\t/evil.example", "tab"],
    ["/\n/evil.example", "newline"],
    ["/\r/evil", "carriage return"],
    ["/missions\u0000", "NUL"],
    ["/missions\u007f", "DEL"],
    ["/login", "the login page"],
    ["/login?x=1", "the login page with a search"],
    ["/login#a", "the login page with a hash"],
    ["missions", "no leading slash"],
    ["", "empty"],
    [`/${"a".repeat(2048)}`, "2,049 characters"],
  ])("%j (%s) gives /", (raw) => {
    expect(safeNext(raw, ORIGIN)).toBe("/");
  });

  it("gives / for none, and for a value that isn't a string", () => {
    expect(safeNext(undefined, ORIGIN)).toBe("/");
    expect(safeNext(null, ORIGIN)).toBe("/");
    expect(safeNext(42, ORIGIN)).toBe("/");
    expect(safeNext(["/missions"], ORIGIN)).toBe("/");
  });
});
