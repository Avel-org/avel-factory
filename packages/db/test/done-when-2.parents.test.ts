// Done-when 2: the exactly-one-parent rules (and their kin: at most one owner, the parent a kind needs).
// Every combination of parent columns and kind is tried against the real table, and the table must
// agree with the rule on each one: accepted when the rule holds, refused by that rule when it doesn't.
import { describe, expect, it } from "vitest";
import { migratedDb } from "./helpers/db.ts";
import { attempts, insertSql, isolate, prepare, search } from "./helpers/rowkit.ts";
import { parentRules } from "./helpers/rules.ts";

const db = migratedDb("dw2parent");

describe("done-when 2: parent rules", () => {
  it.each(parentRules.map((r) => [`${r.table}.${r.name}`, r] as const))(
    "[done-when 2] exactly-one-parent rule %s accepts exactly the parent combinations it allows",
    (_title, rule) => {
      const url = db();
      const found = search(url, rule.table, rule.def, { truthTable: true });
      expect(
        found.combos.some((c) => c.pass),
        "some combination is allowed",
      ).toBe(true);
      expect(
        found.combos.some((c) => !c.pass),
        "some combination is refused",
      ).toBe(true);
      const prep = prepare(url, rule.table);
      const setup = [
        ...prep.setup,
        ...isolate(url, rule.table, { checks: [rule.name] }, { dropKeys: true }),
      ];
      const steps = found.combos.map((c, i) => ({
        label: `c${i}`,
        sql: [insertSql(url, rule.table, { ...prep.set, ...c.values })],
      }));
      const { setupError, outcomes } = attempts(url, setup, steps);
      expect(setupError, "the table can be prepared").toBeUndefined();
      const wrong: string[] = [];
      found.combos.forEach((c, i) => {
        const o = outcomes.get(`c${i}`);
        const shown = JSON.stringify(c.values);
        if (c.pass && !o?.ok) wrong.push(`allowed but refused: ${shown}: ${o?.message}`);
        if (!c.pass && o?.ok) wrong.push(`not allowed but accepted: ${shown}`);
        if (!c.pass && o && !o.ok && !o.message?.includes(`"${rule.name}"`))
          wrong.push(`refused by something else: ${shown}: ${o.message}`);
      });
      expect(
        wrong,
        `${rule.name} disagrees with its rule on ${wrong.length} of ${found.combos.length} combinations`,
      ).toEqual([]);
    },
  );
});
