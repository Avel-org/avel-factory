// Done-when 2: every unique and partial-unique index. With the table's primary key and every other
// unique constraint dropped for one rolled-back transaction, a second row with the same key is refused
// by this index alone; for a partial index, a duplicate that falls outside its predicate is accepted,
// and for a plain one, a row with a different key is.
import { describe, expect, it } from "vitest";
import { migratedDb } from "./helpers/db.ts";
import {
  attempts,
  cloneRowSql,
  info,
  insertSql,
  isolate,
  prepare,
  randomExpr,
  search,
} from "./helpers/rowkit.ts";
import { uniqueRules } from "./helpers/rules.ts";

const db = migratedDb("dw2uq");

describe("done-when 2: unique and partial-unique indexes", () => {
  it.each(
    uniqueRules.map((r) => [`${r.table}.${r.name}${r.where ? " (partial)" : ""}`, r] as const),
  )("[done-when 2] unique %s refuses a duplicate key", (_title, rule) => {
    const url = db();
    const t = info(url, rule.table);
    const type = (name: string) => t.columns.find((c) => c.name === name)?.type ?? "text";
    const key: Record<string, string> = Object.fromEntries(
      rule.cols.map((c) => [c, randomExpr(type(c))]),
    );
    let inside: Record<string, string> = {};
    let outside: Record<string, string> = {};
    if (rule.where) {
      const found = search(url, rule.table, rule.where);
      inside = found.combos.find((c) => c.pass)?.values ?? {};
      outside = found.combos.find((c) => !c.pass)?.values ?? {};
      expect(
        Object.keys(inside).length,
        `a row inside ${rule.name}'s predicate exists`,
      ).toBeGreaterThan(0);
      expect(
        Object.keys(outside).length,
        `a row outside ${rule.name}'s predicate exists`,
      ).toBeGreaterThan(0);
    }
    const prep = prepare(url, rule.table);
    const setup = [
      ...prep.setup,
      ...isolate(url, rule.table, { keys: [rule.name] }, { dropKeys: true }),
      insertSql(url, rule.table, { ...prep.set, ...key, ...inside }),
    ];
    const control = rule.where
      ? cloneRowSql(url, rule.table, outside)
      : cloneRowSql(url, rule.table, {
          [rule.cols[0] as string]: randomExpr(type(rule.cols[0] as string)),
        });
    const { setupError, outcomes } = attempts(url, setup, [
      { label: "duplicate", sql: [cloneRowSql(url, rule.table)] },
      { label: "control", sql: [control] },
    ]);
    expect(setupError, "the table can be prepared and its first row inserted").toBeUndefined();
    const dup = outcomes.get("duplicate");
    expect(dup?.ok, `a second row with the same key is refused by ${rule.name}`).toBe(false);
    expect(dup?.message, "the refusal names the index").toContain(`"${rule.name}"`);
    expect(
      outcomes.get("control")?.ok,
      `${rule.where ? "a duplicate outside the predicate" : "a row with a different key"} is accepted: ${outcomes.get("control")?.message}`,
    ).toBe(true);
  });
});
