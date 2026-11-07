// Done-when 2: a `db` suite against real Postgres, one test per rule. This file: every CHECK that is
// not a parent rule (those are in done-when-2.parents.test.ts).
// Each rule is tested the same way: with the table's other constraints dropped for one rolled-back
// transaction, a row that breaks only this rule is refused by it (the error names it), and a row
// that keeps it is accepted. Postgres itself finds both rows by evaluating the rule over candidate values.
import { describe, expect, it } from "vitest";
import { migratedDb } from "./helpers/db.ts";
import { attempts, insertSql, isolate, prepare, search } from "./helpers/rowkit.ts";
import { plainCheckRules } from "./helpers/rules.ts";

const db = migratedDb("dw2ck");

describe("done-when 2: CHECK rules", () => {
  it.each(plainCheckRules.map((r) => [`${r.table}.${r.name}`, r] as const))(
    "[done-when 2] CHECK %s refuses a row that breaks it and accepts one that keeps it",
    (_title, rule) => {
      const url = db();
      const found = search(url, rule.table, rule.def);
      const bad = found.combos.find((c) => !c.pass);
      const good = found.combos.find((c) => c.pass);
      expect(bad, `some row breaks ${rule.name}`).toBeDefined();
      expect(good, `some row keeps ${rule.name}`).toBeDefined();
      const prep = prepare(url, rule.table);
      const setup = [
        ...prep.setup,
        ...isolate(url, rule.table, { checks: [rule.name] }, { dropKeys: true }),
      ];
      const { setupError, outcomes } = attempts(url, setup, [
        { label: "bad", sql: [insertSql(url, rule.table, { ...prep.set, ...bad?.values })] },
        { label: "good", sql: [insertSql(url, rule.table, { ...prep.set, ...good?.values })] },
      ]);
      expect(setupError, "the table can be prepared").toBeUndefined();
      const badOutcome = outcomes.get("bad");
      expect(badOutcome?.ok, `a row that breaks ${rule.name} is refused`).toBe(false);
      expect(badOutcome?.message, "the refusal names the rule").toContain(`"${rule.name}"`);
      expect(
        outcomes.get("good")?.ok,
        `a row that keeps ${rule.name} is accepted: ${outcomes.get("good")?.message}`,
      ).toBe(true);
    },
  );
});
