import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { PKG_ROOT } from "../helpers/contract.ts";

// RIGG-01 (S1-6): packages/contract/src builds its schemas on zod/mini and zod/v4/core only.
// Any import or re-export of classic zod ("zod", "zod/v4", "zod/v3", ...) is a failure,
// reported as file:line. Static imports, type-only imports, side-effect imports, export-from
// (including `export * from`), dynamic import() and require() all count.

const SRC = join(PKG_ROOT, "src");
const ALLOWED = new Set(["zod/mini", "zod/v4/core"]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(path);
      return entry.name.endsWith(".ts") ? [path] : [];
    })
    .sort();
}

/** Blanks out comments, keeping every newline so line numbers stay true. */
function withoutComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(
      /(^|[^:"'`\\])\/\/[^\n]*/g,
      (m, lead: string) => lead + " ".repeat(m.length - lead.length),
    );
}

// A module specifier in any of the import/export/require forms.
const SPECIFIER_PATTERNS: RegExp[] = [
  /\b(?:import|export)\b[^;'"`]*?\bfrom\s*(["'])([^"'\n]+)\1/g, // import x from / export * from / export {x} from
  /\bimport\s*(["'])([^"'\n]+)\1/g, // import "x"
  /\bimport\s*\(\s*(["'])([^"'\n]+)\1\s*\)/g, // import("x"), also import("x").T in types
  /\brequire\s*\(\s*(["'])([^"'\n]+)\1\s*\)/g, // require("x"), import x = require("x")
];

export type Hit = { line: number; specifier: string };

export function zodSpecifiers(text: string): Hit[] {
  const code = withoutComments(text);
  const hits = new Map<string, Hit>();
  for (const pattern of SPECIFIER_PATTERNS) {
    for (const m of code.matchAll(pattern)) {
      const specifier = m[2] ?? "";
      if (!/^zod(\/|$)/.test(specifier) || ALLOWED.has(specifier)) continue;
      const at = (m.index ?? 0) + m[0].lastIndexOf(specifier);
      const line = code.slice(0, at).split("\n").length;
      hits.set(`${line}:${specifier}`, { line, specifier });
    }
  }
  return [...hits.values()].sort((a, b) => a.line - b.line);
}

describe("RIGG-01 (S1-6): no classic zod in packages/contract/src", () => {
  it("RIGG-01 (scanner self-check, passes on classic): the scanner flags every import form and allows zod/mini and zod/v4/core", () => {
    const sample = [
      `import { z } from "zod";`, // 1
      `import type { ZodType } from 'zod';`, // 2
      `import * as z from "zod/v4";`, // 3
      `export * from "zod";`, // 4
      `export { z } from "zod/v4";`, // 5
      `import "zod";`, // 6
      `const m = await import("zod");`, // 7
      `type T = import("zod/v3").ZodType;`, // 8
      `const r = require("zod");`, // 9
      `import {`, // 10
      `  a,`, // 11
      `  b,`, // 12
      `} from "zod/v4/classic";`, // 13
      `import * as z2 from "zod/mini";`, // allowed
      `import type { $ZodType } from "zod/v4/core";`, // allowed
      `export * from "./dto/common.js";`, // not zod
      `import { x } from "zod-validation";`, // not zod: another package
      `// import { z } from "zod";`, // a comment
      `/* export * from "zod"; */`, // a comment
    ].join("\n");
    expect(zodSpecifiers(sample)).toEqual([
      { line: 1, specifier: "zod" },
      { line: 2, specifier: "zod" },
      { line: 3, specifier: "zod/v4" },
      { line: 4, specifier: "zod" },
      { line: 5, specifier: "zod/v4" },
      { line: 6, specifier: "zod" },
      { line: 7, specifier: "zod" },
      { line: 8, specifier: "zod/v3" },
      { line: 9, specifier: "zod" },
      { line: 13, specifier: "zod/v4/classic" },
    ]);
  });

  it("RIGG-01 (passes on classic): the scan finds the contract's source files", () => {
    const files = sourceFiles(SRC);
    expect(files.length, `no .ts files under ${SRC}`).toBeGreaterThan(20);
    expect(files.map((f) => relative(SRC, f))).toContain("index.ts");
  });

  it("RIGG-01: no .ts file under packages/contract/src imports or re-exports zod other than zod/mini and zod/v4/core", () => {
    const violations = sourceFiles(SRC).flatMap((file) =>
      zodSpecifiers(readFileSync(file, "utf8")).map(
        (h) => `${relative(PKG_ROOT, file)}:${h.line} imports "${h.specifier}"`,
      ),
    );
    expect(
      violations,
      "classic zod is still imported in packages/contract/src (S1-6: only zod/mini and zod/v4/core)",
    ).toEqual([]);
  });
});
