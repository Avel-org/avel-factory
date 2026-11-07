// Done-when 2: every delete refusal. DATABASE.md: parents are never deleted, so every foreign key
// is RESTRICT, and the database refuses a delete that would orphan a row. The two foreign keys the map
// makes NO ACTION and deferred (the current plan, the task doc version) refuse at the check.
// Better Auth's three foreign keys cascade instead; those are pinned too.
// For each foreign key the parent and a child row are inserted with only that foreign key in force.
import { describe, expect, it } from "vitest";
import { migratedDb } from "./helpers/db.ts";
import { ident as q } from "./helpers/psql.ts";
import { attempts, info, insertSql, isolate, prepare, randomExpr } from "./helpers/rowkit.ts";

// Known values for the referenced columns, so the parent row can be found again.
function fixed(type: string): string {
  if (type === "uuid") return "'00000000-0000-0000-0000-0000000000a1'::uuid";
  if (type === "text") return "'rigg_parent'::text";
  if (type === "integer" || type === "smallint" || type === "bigint") return `7::${type}`;
  return randomExpr(type);
}

import { cascadeRules, type FkRule, restrictRules } from "./helpers/rules.ts";

const db = migratedDb("dw2fk");

function build(url: string, fk: FkRule) {
  const child = info(url, fk.table);
  const parent = info(url, fk.parent);
  const self = fk.table === fk.parent;
  const typeOf = (t: typeof child, c: string) =>
    t.columns.find((x) => x.name === c)?.type as string;
  const setup: string[] = [];
  // the parent: nothing else in force, and a row whose referenced columns are known to be filled
  setup.push(
    ...isolate(url, fk.parent, self ? { fks: [fk.name] } : {}, { dropUniqueIndexes: true }),
  );
  const pp = prepare(url, fk.parent);
  setup.push(...pp.setup);
  if (!self) {
    setup.push(...isolate(url, fk.table, { fks: [fk.name] }, { dropUniqueIndexes: true }));
    const cp = prepare(url, fk.table);
    setup.push(...cp.setup);
    setup.push(
      insertSql(url, fk.parent, {
        ...pp.set,
        ...Object.fromEntries(fk.parentCols.map((c) => [c, fixed(typeOf(parent, c))])),
      }),
    );
    return { setup, childSet: cp.set };
  }
  setup.push(
    insertSql(url, fk.parent, {
      ...pp.set,
      ...Object.fromEntries(fk.parentCols.map((c) => [c, fixed(typeOf(parent, c))])),
    }),
  );
  return { setup, childSet: pp.set };
}

function childInsert(url: string, fk: FkRule, set: Record<string, string>): string {
  const child = info(url, fk.table);
  const cols: string[] = [];
  const vals: string[] = [];
  for (const c of child.columns) {
    const i = fk.cols.indexOf(c.name);
    if (i >= 0) {
      cols.push(q(c.name));
      vals.push(`p.${q(fk.parentCols[i] as string)}`);
    } else if (c.name in set) {
      cols.push(q(c.name));
      vals.push(set[c.name] as string);
    } else if (c.notnull && !c.hasDefault && !c.generated) {
      cols.push(q(c.name));
      vals.push(randomExpr(c.type));
    }
  }
  const where = `(${fk.parentCols.map((c) => `p.${q(c)}`).join(", ")}) = (${lits(url, fk).join(", ")})`;
  return `insert into ${q(fk.table)} (${cols.join(", ")}) select ${vals.join(", ")} from ${q(fk.parent)} p where ${where} limit 1`;
}

function lits(url: string, fk: FkRule): string[] {
  return fk.parentCols.map((c) =>
    fixed(info(url, fk.parent).columns.find((x) => x.name === c)?.type as string),
  );
}
const parentWhere = (url: string, fk: FkRule) =>
  `(${fk.parentCols.map(q).join(", ")}) = (${lits(url, fk).join(", ")})`;
const childWhere = (url: string, fk: FkRule) =>
  `(${fk.cols.map(q).join(", ")}) = (${lits(url, fk).join(", ")})`;

describe("done-when 2: delete refusals", () => {
  it.each(restrictRules.map((f) => [`${f.table}.${f.name} → ${f.parent}`, f] as const))(
    "[done-when 2] foreign key %s refuses deleting a parent that has a child",
    (_title, fk) => {
      const url = db();
      const { setup, childSet } = build(url, fk);
      const { setupError, outcomes } = attempts(url, setup, [
        { label: "insert_child", sql: [childInsert(url, fk, childSet)] },
        {
          label: "delete_parent",
          sql: [
            `delete from ${q(fk.parent)} where ${parentWhere(url, fk)}`,
            "set constraints all immediate",
          ],
        },
        { label: "delete_child", sql: [`delete from ${q(fk.table)} where ${childWhere(url, fk)}`] },
        {
          label: "delete_parent_again",
          sql: [
            `delete from ${q(fk.parent)} where ${parentWhere(url, fk)}`,
            "set constraints all immediate",
          ],
        },
      ]);
      expect(setupError, "the two tables can be prepared").toBeUndefined();
      expect(
        outcomes.get("insert_child")?.ok,
        `a child row can be inserted: ${outcomes.get("insert_child")?.message}`,
      ).toBe(true);
      const refused = outcomes.get("delete_parent");
      expect(refused?.ok, "deleting the parent is refused").toBe(false);
      expect(refused?.message, "the refusal names the foreign key").toContain(`"${fk.name}"`);
      expect(outcomes.get("delete_child")?.ok, "the child can go").toBe(true);
      expect(
        outcomes.get("delete_parent_again")?.ok,
        `with no child left the parent can go: ${outcomes.get("delete_parent_again")?.message}`,
      ).toBe(true);
    },
  );

  it.each(cascadeRules.map((f) => [`${f.table}.${f.name} → ${f.parent}`, f] as const))(
    "[done-when 2] Better Auth foreign key %s cascades: deleting the user deletes the child (pins existing behaviour in the map)",
    (_title, fk) => {
      const url = db();
      const { setup, childSet } = build(url, fk);
      const { setupError, outcomes } = attempts(url, setup, [
        { label: "insert_child", sql: [childInsert(url, fk, childSet)] },
        {
          label: "delete_parent",
          sql: [
            `delete from ${q(fk.parent)} where ${parentWhere(url, fk)}`,
            "set constraints all immediate",
          ],
        },
        {
          label: "child_gone",
          sql: [
            `do $c$ begin if exists (select 1 from ${q(fk.table)} where ${childWhere(url, fk)}) then raise exception 'child still there'; end if; end $c$`,
          ],
        },
      ]);
      expect(setupError, "the two tables can be prepared").toBeUndefined();
      expect(
        outcomes.get("insert_child")?.ok,
        `a child row can be inserted: ${outcomes.get("insert_child")?.message}`,
      ).toBe(true);
      expect(
        outcomes.get("delete_parent")?.ok,
        `deleting the parent is allowed: ${outcomes.get("delete_parent")?.message}`,
      ).toBe(true);
      expect(outcomes.get("child_gone")?.ok, "the child went with it").toBe(true);
    },
  );
});
