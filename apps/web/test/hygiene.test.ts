import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const src = join(import.meta.dirname, "..", "src");

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.(ts|tsx|js|jsx|mjs)$/.test(name) ? [path] : [];
  });
}

describe("T-F1-05: no raw HTML, no classic zod", () => {
  const files = (() => {
    try {
      return sources(src);
    } catch {
      return [];
    }
  })();

  it("apps/web/src exists and has the files this ticket adds", () => {
    const names = files.map((f) => relative(src, f));
    expect(names).toContain("home/HomeView.tsx");
    expect(names).toContain("home/load-home.ts");
    expect(names).toContain("data/client.ts");
    expect(names).toContain("lib/utils.ts");
    expect(names.some((n) => n.startsWith("routes/__root"))).toBe(true);
  });

  it("no file uses dangerouslySetInnerHTML or sets innerHTML", () => {
    const bad = files.filter((f) =>
      /dangerouslySetInnerHTML|\.?innerHTML|outerHTML|insertAdjacentHTML/.test(
        readFileSync(f, "utf8"),
      ),
    );
    expect(bad.map((f) => relative(src, f))).toEqual([]);
    expect(files.length).toBeGreaterThan(0);
  });

  it("no file imports classic zod (only zod/mini is allowed)", () => {
    const pattern = /(?:from|import|require\()\s*["']zod(?:\/(?!mini["']))?[^"']*["']/;
    const bad = files.filter((f) => {
      const code = readFileSync(f, "utf8");
      return (
        [...code.matchAll(/["']zod(\/[^"']*)?["']/g)].some((m) => m[1] !== "/mini") &&
        pattern.test(code)
      );
    });
    expect(bad.map((f) => relative(src, f))).toEqual([]);
    expect(files.length).toBeGreaterThan(0);
  });
});
