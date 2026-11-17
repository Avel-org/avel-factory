// Done-when 6: every value list the schema checks is imported from the contract package, not repeated.
//  (a) packages/db/src holds no value list of its own, and no Postgres enum;
//  (b) no two lists exported by the contract have the same values (contract.md section 3, D18);
//  (c) every value-list CHECK in the migrated schema holds exactly the values of one contract list.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readCatalog } from "./helpers/catalog.ts";
import { migratedDb } from "./helpers/db.ts";
import { repoRoot } from "./helpers/psql.ts";
import { checkRules } from "./helpers/rules.ts";

const db = migratedDb("dw6");
const SRC = join(repoRoot, "packages/db/src");

const listOf = (def: string): string[] | null => {
  const m = /ARRAY\[(.*?)\]/.exec(def);
  if (!m) return null;
  const values = [...(m[1] as string).matchAll(/'([^']*)'::text/g)].map((x) => x[1] as string);
  return values.length >= 2 ? values : null;
};

/** The value lists the schema checks, from the map with the changes applied. */
const checkedLists = checkRules.flatMap((r) => {
  const v = listOf(r.def);
  return v ? [{ name: r.name, values: v }] : [];
});

function sources(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? sources(p) : p.endsWith(".ts") ? [p] : [];
  });
}

const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

/** Runs of two or more string literals separated by commas, such as ["a", "b"] or ('a', 'b'). */
function literalRuns(text: string): string[][] {
  const lit = "(?:'[^'\\n]*'|\"[^\"\\n]*\"|`[^`\\n]*`)";
  const re = new RegExp(`${lit}(?:\\s*,\\s*${lit})+`, "g");
  return [...text.matchAll(re)].map((m) =>
    [...m[0].matchAll(new RegExp(lit, "g"))].map((x) => x[0].slice(1, -1)),
  );
}

describe("done-when 6: value lists are defined once", () => {
  it("[done-when 6] packages/db/src exists, imports its value lists from @avel/contract, and uses no Postgres enum", () => {
    const files = sources(SRC);
    expect(files.length, "packages/db/src has TypeScript files").toBeGreaterThan(0);
    const all = files.map((f) => stripComments(readFileSync(f, "utf8")));
    expect(
      all.some((t) => /from\s+["']@avel\/contract["']/.test(t)),
      "some file imports @avel/contract",
    ).toBe(true);
    expect(
      all.filter((t) => /\bpgEnum\s*\(/.test(t)).length,
      "value lists are text with a CHECK, never an enum",
    ).toBe(0);
  });

  it("[done-when 6] no value list is written out in packages/db/src: no run of string literals holds the values of a list the schema checks", () => {
    const files = sources(SRC);
    expect(files.length, "packages/db/src has TypeScript files").toBeGreaterThan(0);
    const repeats: string[] = [];
    for (const f of files) {
      for (const run of literalRuns(stripComments(readFileSync(f, "utf8")))) {
        for (const list of checkedLists) {
          const hit = run.filter((v) => list.values.includes(v));
          if (hit.length >= 2 && hit.length / run.length >= 0.75)
            repeats.push(`${f.replace(repoRoot, "")}: [${run.join(", ")}] repeats ${list.name}`);
        }
      }
    }
    expect([...new Set(repeats)], "value lists written in packages/db").toEqual([]);
  });

  /** Every exported value list: an array of strings, a Zod enum (`.options`), or a plain object of strings. */
  async function contractLists(): Promise<{ name: string; values: string[] }[]> {
    let mod: Record<string, unknown> | undefined;
    let failure = "";
    try {
      // a variable specifier, so this file type-checks before the contract package exists
      const specifier = "@avel/contract";
      mod = (await import(/* @vite-ignore */ specifier)) as Record<string, unknown>;
    } catch (e) {
      failure = String(e);
    }
    expect(mod, `@avel/contract can be imported: ${failure}`).toBeDefined();
    const out: { name: string; values: string[] }[] = [];
    for (const [name, v] of Object.entries(mod as Record<string, unknown>)) {
      const strings = (x: unknown): x is string[] =>
        Array.isArray(x) && x.length > 0 && x.every((y) => typeof y === "string");
      if (strings(v)) out.push({ name, values: [...v] });
      else if (v && typeof v === "object" && strings((v as { options?: unknown }).options))
        out.push({ name, values: [...(v as { options: string[] }).options] });
      else if (
        v &&
        typeof v === "object" &&
        !Array.isArray(v) &&
        Object.keys(v).length > 1 &&
        Object.values(v).every((y) => typeof y === "string") &&
        !("options" in v)
      )
        out.push({ name, values: Object.values(v) as string[] });
    }
    return out;
  }

  it("[done-when 6] no two lists exported by the contract have the same values", async () => {
    const lists = await contractLists();
    expect(lists.length, "the contract exports value lists").toBeGreaterThan(20);
    const seen = new Map<string, string[]>();
    for (const l of lists) {
      const key = JSON.stringify([...l.values].sort());
      seen.set(key, [...(seen.get(key) ?? []), l.name]);
    }
    const repeats = [...seen.values()].filter((names) => names.length > 1);
    expect(repeats, "groups of lists with the same values").toEqual([]);
  });

  it("[done-when 6] every value-list CHECK in the migrated schema holds exactly the values of one contract list", async () => {
    const lists = await contractLists();
    const known = new Set(lists.map((l) => JSON.stringify([...l.values].sort())));
    const url = db();
    // Only the value-list CHECKs: the columns @avel/contract names in checkedColumns.
    // The map's rule CHECKs (jobs_finished_ck and the like) may hold a subset of a list; done-when 8 checks those.
    const contract = (await import(/* @vite-ignore */ "@avel/contract")) as {
      checkedColumns: Record<string, string>;
    };
    const columns = Object.keys(contract.checkedColumns);
    expect(columns.length, "the contract names the CHECKed columns").toBeGreaterThanOrEqual(104);
    const valueListCheck = (table: string, def: string): string | undefined =>
      columns
        .filter((k) => k.startsWith(`${table}.`))
        .map((k) => k.slice(table.length + 1))
        .find((col) =>
          new RegExp(
            `^\\(+(?:\\(${col} IS NULL\\) OR \\()?${col} = ANY \\(ARRAY\\[[^\\]]*\\]\\)\\)+$`,
          ).test(def),
        );
    const unmatched: string[] = [];
    const found = new Set<string>();
    for (const t of readCatalog(url)) {
      for (const c of t.checks) {
        const col = valueListCheck(t.name, c.def);
        if (!col) continue;
        found.add(`${t.name}.${col}`);
        const v = listOf(c.def);
        if (!v || !known.has(JSON.stringify([...v].sort())))
          unmatched.push(`${t.name}.${c.name}: ${v ? v.join(", ") : c.def}`);
      }
    }
    expect(unmatched, "CHECK lists that no contract list has").toEqual([]);
    expect(
      columns.filter((k) => !found.has(k)),
      "checkedColumns with no value-list CHECK in the schema",
    ).toEqual([]);
    expect(checkedLists.length, "the map's lists were found").toBeGreaterThan(90);
  });
});
