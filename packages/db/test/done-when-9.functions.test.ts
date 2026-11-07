// Done-when 9: one test for the rule each function enforces. Seven functions: the map's six
// (`uuid_generate_v7`, `touch_updated_at`, `freeze_once_set`, `refuse_update`, `freeze_plan_detail`,
// `freeze_plan`) and `freeze_after_set` from CR-13. The map has no function bodies, so the rules come from
// the plan's own examples and the map's trigger list; which tables each one guards is read from the map.
// Triggers stay on in every test here (they are what is under test).
import { describe, expect, it } from "vitest";
import { readCatalog, readFunctions } from "./helpers/catalog.ts";
import { FUNCTIONS } from "./helpers/changes.ts";
import { migratedDb } from "./helpers/db.ts";
import type { Tbl } from "./helpers/model.ts";
import { cloneDatabase, dropDatabase, psql, rows } from "./helpers/psql.ts";
import { attempts, info, insertSql, isolate, prepare, randomExpr } from "./helpers/rowkit.ts";
import { schema } from "./helpers/rules.ts";

const db = migratedDb("dw9");

/** Tables whose map triggers call `fn`, with the quoted arguments each passes. */
function guarded(fn: string, tables: Tbl[] = schema): { table: string; args: string[] }[] {
  const out: { table: string; args: string[] }[] = [];
  for (const t of tables) {
    for (const trg of t.triggers) {
      const m = new RegExp(`EXECUTE FUNCTION ${fn}\\((.*)\\)$`).exec(trg.def);
      if (m)
        out.push({
          table: t.name,
          args: [...(m[1] as string).matchAll(/'([^']*)'/g)].map((x) => x[1] as string),
        });
    }
  }
  return out;
}

const UUID = (n: number) => `'00000000-0000-0000-0000-${String(n).padStart(12, "0")}'::uuid`;

/** A column to change without breaking any other rule: a text column gets a suffix, a time moves a day. */
function touchable(
  url: string,
  table: string,
  not: string[] = [],
): { name: string; changed: string } {
  const cols = info(url, table).columns.filter((c) => !c.generated && !not.includes(c.name));
  const pick =
    cols.find((c) => c.name === "created_at") ??
    cols.find((c) => c.type === "text" && c.name !== "id") ??
    cols.find((c) => c.type.startsWith("timestamp"));
  if (!pick) throw new Error(`no column of ${table} can be changed alone`);
  return {
    name: pick.name,
    changed: pick.type === "text" ? `"${pick.name}" || 'x'` : `"${pick.name}" + interval '1 day'`,
  };
}

describe("done-when 9: the seven functions exist", () => {
  it("[done-when 9] the schema has exactly the map's six functions and freeze_after_set", () => {
    expect(readFunctions(db())).toEqual([...FUNCTIONS].sort());
  });
});

describe("done-when 9: uuid_generate_v7", () => {
  it("[done-when 9] uuid_generate_v7 makes version-7 ids that sort by time and carry the current time", () => {
    const url = db();
    const script = `create temp table ids (i int, id uuid);
${Array.from({ length: 6 }, (_, i) => `insert into ids values (${i}, uuid_generate_v7()); select pg_sleep(0.012);`).join("\n")}
select json_agg(json_build_object('i', i, 'id', id, 'version', substr(id::text, 15, 1), 'variant', substr(id::text, 20, 1),
  'ms', ('x' || substr(replace(id::text, '-', ''), 1, 12))::bit(48)::bigint, 'now_ms', (extract(epoch from clock_timestamp()) * 1000)::bigint) order by i) from ids;`;
    const r = psql(url, script);
    expect(r.status, r.stderr).toBe(0);
    const ids = JSON.parse(
      r.stdout
        .trim()
        .split("\n")
        .filter((l) => l.startsWith("["))
        .pop() as string,
    ) as { id: string; version: string; variant: string; ms: number; now_ms: number }[];
    expect(
      ids.map((x) => x.version),
      "every id is version 7",
    ).toEqual(Array(6).fill("7"));
    expect(
      ids.every((x) => "89ab".includes(x.variant)),
      "every id has the RFC variant",
    ).toBe(true);
    expect([...ids].map((x) => x.id).sort(), "ids made later sort later").toEqual(
      ids.map((x) => x.id),
    );
    expect(new Set(ids.map((x) => x.id)).size, "ids are distinct").toBe(6);
    for (const x of ids)
      expect(
        Math.abs(x.now_ms - x.ms),
        "the id carries the current time in milliseconds",
      ).toBeLessThan(10_000);
  });
});

describe("done-when 9: touch_updated_at", () => {
  it("[done-when 9] touch_updated_at: updated_at moves forward and row_version goes up by one on every committed update", () => {
    const copy = cloneDatabase(db(), "dw9touch");
    try {
      const insert = psql(
        copy,
        `insert into clients (id, name, kind) values (${UUID(1)}, 'Touch', 'client');`,
      );
      expect(insert.status, insert.stderr).toBe(0);
      type Read = { row_version: number; updated_at: string };
      const read = () =>
        rows<Read>(
          copy,
          `select row_version, updated_at::text from clients where id = ${UUID(1)}`,
        )[0] as Read;
      const first = read();
      expect(first.row_version, "a new row starts at version 1").toBe(1);
      psql(
        copy,
        `select pg_sleep(0.05); update clients set name = 'Touch 2' where id = ${UUID(1)};`,
      );
      const second = read();
      expect(second.row_version, "one update, one version").toBe(2);
      expect(Date.parse(second.updated_at), "updated_at moved").toBeGreaterThan(
        Date.parse(first.updated_at),
      );
      psql(copy, `select pg_sleep(0.05); update clients set name = name where id = ${UUID(1)};`);
      const third = read();
      expect(third.row_version, "even an update that changes nothing counts").toBe(3);
      expect(Date.parse(third.updated_at)).toBeGreaterThan(Date.parse(second.updated_at));
    } finally {
      dropDatabase(copy);
    }
  });

  const touched = guarded("touch_updated_at").map((g) => g.table);
  it.each(touched)(
    "[done-when 9] touch_updated_at is on %s: an update raises row_version by one",
    (table) => {
      const url = db();
      const prep = prepare(url, table);
      const setup = [...prep.setup, ...isolate(url, table, {}, { triggersOff: false })];
      const { setupError, outcomes } = attempts(
        url,
        [...setup, insertSql(url, table, { ...prep.set })],
        [
          {
            label: "bump",
            sql: [
              `update "${table}" set row_version = row_version`,
              `do $c$ begin if (select row_version from "${table}" limit 1) <> 2 then raise exception 'row_version is %', (select row_version from "${table}" limit 1); end if; end $c$`,
            ],
          },
        ],
      );
      expect(setupError).toBeUndefined();
      expect(outcomes.get("bump")?.ok, `${outcomes.get("bump")?.message}`).toBe(true);
    },
  );
});

describe("done-when 9: refuse_update", () => {
  const tables = guarded("refuse_update").map((g) => g.table);
  it("[done-when 9] refuse_update guards exactly the immutable tables the schema doc names", () => {
    expect(
      guarded("refuse_update", readCatalog(db()))
        .map((g) => g.table)
        .sort(),
    ).toEqual([
      "check_results",
      "completion_reports",
      "pass_approvals",
      "payments",
      "receipts",
      "release_approvals",
      "task_docs",
    ]);
  });
  it.each(tables)(
    "[done-when 9] refuse_update: an update to %s is refused, and inserting a row is not",
    (table) => {
      const url = db();
      const target = touchable(url, table);
      const prep = prepare(url, table);
      const { setupError, outcomes } = attempts(
        url,
        [...prep.setup, ...isolate(url, table, {}, { triggersOff: false })],
        [
          { label: "insert", sql: [insertSql(url, table, prep.set)] },
          { label: "update", sql: [`update "${table}" set "${target.name}" = ${target.changed}`] },
        ],
      );
      expect(setupError).toBeUndefined();
      expect(
        outcomes.get("insert")?.ok,
        `a row can be inserted: ${outcomes.get("insert")?.message}`,
      ).toBe(true);
      expect(outcomes.get("update")?.ok, `an update to ${table} is refused`).toBe(false);
    },
  );
});

describe("done-when 9: freeze_once_set", () => {
  const cases = guarded("freeze_once_set").flatMap((g) =>
    g.args.map((column) => ({ table: g.table, column })),
  );
  it.each(cases.map((c) => [`${c.table}.${c.column}`, c] as const))(
    "[done-when 9] freeze_once_set: %s can't change once set, can be set from null, and its neighbours stay free",
    (_title, c) => {
      const url = db();
      const t = info(url, c.table);
      const colInfo = t.columns.find((x) => x.name === c.column);
      expect(colInfo, `${c.table} has the column`).toBeDefined();
      const frozenHere = guarded("freeze_once_set").find((g) => g.table === c.table)?.args ?? [];
      const prep = prepare(url, c.table);
      const set = (id: number, withColumn: boolean) =>
        insertSql(url, c.table, {
          ...prep.set,
          id: UUID(id),
          ...(withColumn ? { [c.column]: randomExpr((colInfo as { type: string }).type) } : {}),
        });
      const neighbour = touchable(url, c.table, [...frozenHere, "id"]);
      const change =
        colInfo?.type === "text"
          ? `"${c.column}" || 'x'`
          : colInfo?.type === "integer"
            ? `"${c.column}" + 1`
            : `"${c.column}" + interval '1 day'`;
      const steps = [
        {
          label: "change_when_set",
          sql: [`update "${c.table}" set "${c.column}" = ${change} where id = ${UUID(1)}`],
        },
        {
          label: "neighbour",
          sql: [
            `update "${c.table}" set "${neighbour.name}" = ${neighbour.changed} where id = ${UUID(1)}`,
          ],
        },
        ...(colInfo?.notnull
          ? []
          : [
              {
                label: "set_from_null",
                sql: [
                  `update "${c.table}" set "${c.column}" = ${randomExpr((colInfo as { type: string }).type)} where id = ${UUID(2)}`,
                ],
              },
              {
                label: "change_after_set",
                sql: [`update "${c.table}" set "${c.column}" = ${change} where id = ${UUID(2)}`],
              },
            ]),
      ];
      const { setupError, outcomes } = attempts(
        url,
        [
          ...prep.setup,
          ...isolate(url, c.table, {}, { triggersOff: false }),
          set(1, true),
          ...(colInfo?.notnull ? [] : [set(2, false)]),
        ],
        steps,
      );
      expect(setupError).toBeUndefined();
      expect(outcomes.get("change_when_set")?.ok, `${c.column} can't change once set`).toBe(false);
      expect(
        outcomes.get("neighbour")?.ok,
        `${neighbour.name} can still change: ${outcomes.get("neighbour")?.message}`,
      ).toBe(true);
      if (!colInfo?.notnull) {
        expect(
          outcomes.get("set_from_null")?.ok,
          `${c.column} can be set while null: ${outcomes.get("set_from_null")?.message}`,
        ).toBe(true);
        expect(outcomes.get("change_after_set")?.ok, `and then it is frozen`).toBe(false);
      }
    },
  );
});

describe("done-when 9: freeze_plan_detail", () => {
  const detail = guarded("freeze_plan_detail").map((g) => g.table);
  it("[done-when 9] freeze_plan_detail guards the nine plan detail tables", () => {
    expect(
      guarded("freeze_plan_detail", readCatalog(db()))
        .map((g) => g.table)
        .sort(),
    ).toEqual([
      "checks",
      "codebase_analysis",
      "module_checks",
      "plan_module_deps",
      "plan_modules",
      "quality_targets",
      "requirements",
      "scenario_modules",
      "scenarios",
    ]);
  });
  it.each(detail)(
    "[done-when 9] freeze_plan_detail: %s takes rows while its plan is a draft and refuses insert, update and delete once it is approved",
    (table) => {
      const url = db();
      const target = touchable(url, table, ["plan_id"]);
      const prep = prepare(url, table);
      const plan = (id: number) => insertSql(url, "plans", { id: UUID(id) });
      const row = (planId: number) => insertSql(url, table, { ...prep.set, plan_id: UUID(planId) });
      const { setupError, outcomes } = attempts(
        url,
        [
          ...prep.setup,
          ...isolate(url, "plans", {}, { triggersOff: false }),
          ...isolate(url, table, {}, { triggersOff: false }),
          plan(1),
          plan(2),
        ],
        [
          { label: "insert_draft", sql: [row(1)] },
          {
            label: "update_draft",
            sql: [
              `update "${table}" set "${target.name}" = ${target.changed} where plan_id = ${UUID(1)}`,
            ],
          },
          {
            label: "approve",
            sql: [
              `update plans set state = 'approved', approved_at = now(), approved_by = ${UUID(99)} where id = ${UUID(1)}`,
            ],
          },
          { label: "insert_approved", sql: [row(1)] },
          {
            label: "update_approved",
            sql: [
              `update "${table}" set "${target.name}" = ${target.changed} where plan_id = ${UUID(1)}`,
            ],
          },
          { label: "delete_approved", sql: [`delete from "${table}" where plan_id = ${UUID(1)}`] },
          { label: "other_plan", sql: [row(2)] },
        ],
      );
      expect(setupError).toBeUndefined();
      for (const l of ["insert_draft", "update_draft", "approve", "other_plan"])
        expect(outcomes.get(l)?.ok, `${l}: ${outcomes.get(l)?.message}`).toBe(true);
      for (const l of ["insert_approved", "update_approved", "delete_approved"])
        expect(outcomes.get(l)?.ok, `${l} is refused once the plan is approved`).toBe(false);
    },
  );
});

describe("done-when 9: freeze_plan", () => {
  const edits: [string, string][] = [
    ["brief_snapshot", `'{"changed": true}'::jsonb`],
    ["price_micros", "price_micros + 1"],
    ["package_key", "package_key || 'x'"],
    ["roster_version", "roster_version || 'x'"],
    ["version", "version + 1"],
    ["mission_id", "gen_random_uuid()"],
  ];
  it("[done-when 9] freeze_plan: a draft plan can change and be approved, an approved plan's content can't change, and it can still be superseded", () => {
    const url = db();
    const { setupError, outcomes } = attempts(
      url,
      [
        ...isolate(url, "plans", {}, { triggersOff: false }),
        insertSql(url, "plans", { id: UUID(1) }),
      ],
      [
        {
          label: "edit_draft",
          sql: [`update plans set price_micros = price_micros + 1 where id = ${UUID(1)}`],
        },
        {
          label: "approve",
          sql: [
            `update plans set state = 'approved', approved_at = now(), approved_by = ${UUID(99)} where id = ${UUID(1)}`,
          ],
        },
        ...edits.map(([col, value]) => ({
          label: `edit_${col}`,
          sql: [`update plans set "${col}" = ${value} where id = ${UUID(1)}`],
        })),
        {
          label: "supersede",
          sql: [`update plans set state = 'superseded' where id = ${UUID(1)}`],
        },
      ],
    );
    expect(setupError).toBeUndefined();
    for (const l of ["edit_draft", "approve", "supersede"])
      expect(outcomes.get(l)?.ok, `${l}: ${outcomes.get(l)?.message}`).toBe(true);
    for (const [col] of edits)
      expect(outcomes.get(`edit_${col}`)?.ok, `${col} can't change once the plan is approved`).toBe(
        false,
      );
  });
});

describe("done-when 9: freeze_after_set (CR-13)", () => {
  it("[done-when 9] freeze_after_set: missions.kind can't change once onboarding_started_at is set; it can before, and the other columns stay free", () => {
    const url = db();
    const m = UUID(1);
    const { setupError, outcomes } = attempts(
      url,
      [
        ...isolate(url, "missions", {}, { triggersOff: false }),
        insertSql(url, "missions", { id: m, kind: "'client'", client_kind: "'client'" }),
      ],
      [
        { label: "change_before", sql: [`update missions set kind = 'template' where id = ${m}`] },
        {
          label: "start",
          sql: [`update missions set onboarding_started_at = now() where id = ${m}`],
        },
        { label: "change_after", sql: [`update missions set kind = 'internal' where id = ${m}`] },
        {
          label: "other_after",
          sql: [`update missions set budget_micros = budget_micros + 1 where id = ${m}`],
        },
      ],
    );
    expect(setupError).toBeUndefined();
    expect(
      outcomes.get("change_before")?.ok,
      `kind can change before onboarding starts: ${outcomes.get("change_before")?.message}`,
    ).toBe(true);
    expect(
      outcomes.get("start")?.ok,
      `onboarding_started_at can be set: ${outcomes.get("start")?.message}`,
    ).toBe(true);
    expect(outcomes.get("change_after")?.ok, "kind can't change after").toBe(false);
    expect(
      outcomes.get("other_after")?.ok,
      `other columns can: ${outcomes.get("other_after")?.message}`,
    ).toBe(true);
  });
});
