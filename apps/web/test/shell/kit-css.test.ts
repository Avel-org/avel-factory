import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  fileURLToPath(new URL("../../src/kit/kit.css", import.meta.url)),
  "utf8",
).replace(/\/\*[\s\S]*?\*\//g, "");

/** Every top-level and nested rule with the at-rule preludes around it. */
function rules(src: string) {
  const out: { prelude: string; body: string; at: string[] }[] = [];
  const walk = (s: string, at: string[]) => {
    let i = 0;
    while (i < s.length) {
      const open = s.indexOf("{", i);
      if (open < 0) break;
      const prelude = s
        .slice(i, open)
        .trim()
        .replace(/^[;}\s]+/, "");
      let depth = 1;
      let j = open + 1;
      while (j < s.length && depth > 0) {
        if (s[j] === "{") depth++;
        else if (s[j] === "}") depth--;
        j++;
      }
      const body = s.slice(open + 1, j - 1);
      if (prelude.startsWith("@")) walk(body, [...at, prelude]);
      else out.push({ prelude, body, at });
      i = j;
    }
  };
  walk(src, []);
  return out;
}

describe("T-F2-05: kit.css, read as text", () => {
  const all = rules(css);

  it("has the 1024px and 760px breakpoints, as media queries", () => {
    expect(css).toMatch(/@media[^{]*\b1024px/);
    expect(css).toMatch(/@media[^{]*\b760px/);
    expect(css).not.toMatch(/matchMedia/);
  });

  it("draws the rounded canvas: inset, radius, page background, hairline, scroller", () => {
    const canvas = all.filter(
      (r) =>
        r.at.some((a) => /1024px/.test(a)) &&
        /var\(--canvas-inset\)/.test(r.body) &&
        /var\(--radius-dialog\)/.test(r.body),
    );
    expect(canvas.length, "a rule at 1024px with the inset and the radius").toBeGreaterThan(0);
    const body = canvas.map((r) => r.body).join(";");
    expect(body).toMatch(/background:\s*var\(--av-page-bg\)/);
    expect(body).toMatch(/box-shadow:\s*0 0 0 1px var\(--av-hairline\)/);
    expect(body).toMatch(/overscroll-behavior:\s*contain/);
    expect(body).toMatch(/scroll-padding-top:\s*76px/);
    expect(body).toMatch(/overflow(-y)?:\s*(auto|scroll)/);
  });

  it("pads main above the tab bar under [data-tabbar]", () => {
    expect(
      all.some((r) => /\[data-tabbar\]/.test(r.prelude) && /padding-bottom/.test(r.body)),
    ).toBe(true);
  });

  it("has no :hover outside @media (hover: hover) and (pointer: fine)", () => {
    const hovers = all.filter((r) => /:hover/.test(r.prelude));
    expect(hovers.length, "at least one hover rule, gated").toBeGreaterThan(0);
    for (const r of hovers) {
      const gated = r.at.some((a) => /\(hover:\s*hover\)/.test(a) && /\(pointer:\s*fine\)/.test(a));
      expect(gated, `${r.prelude} is outside the hover media query`).toBe(true);
    }
  });

  it("never redefines an --av-* token, and has no hard-coded colour", () => {
    expect(css).not.toMatch(/--av-[\w-]+\s*:/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\b(rgb|rgba|hsl|hsla)\(/);
  });

  it("moves nothing under prefers-reduced-motion", () => {
    expect(css).toMatch(/@media[^{]*prefers-reduced-motion:\s*reduce/);
  });
});
