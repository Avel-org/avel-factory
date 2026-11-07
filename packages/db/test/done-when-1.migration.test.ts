// Done-when 1: the first migration applies to an empty database and reverses cleanly.
// It runs through the package's own commands, `pnpm --filter @avel/db migrate:up` and `migrate:down`
// (the commands the build task names), with DATABASE_URL pointing at a database made for the test.
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFunctions } from "./helpers/catalog.ts";
import { expectedSchema, FUNCTIONS } from "./helpers/changes.ts";
import { loadMap } from "./helpers/map.ts";
import { createDatabase, dropDatabase, pnpmDb, type Run, rows } from "./helpers/psql.ts";

vi.setConfig({ testTimeout: 180_000, hookTimeout: 180_000 });
const made: string[] = [];
afterEach(() => {
  for (const url of made.splice(0)) dropDatabase(url);
});

const empty = () => {
  const url = createDatabase("dw1");
  made.push(url);
  return url;
};
const tail = (r: Run) => `${r.stdout}\n${r.stderr}`.trim().split("\n").slice(-6).join("\n");

/** What the schema leaves in the public schema. */
const leftovers = (url: string) =>
  rows<{ kind: string; name: string }>(
    url,
    `select 'relation' as kind, c.relname as name from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'S', 'f')
     union all select 'function', p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'
     union all select 'type', t.typname from pg_type t join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public' and t.typtype in ('e', 'd') order by 1, 2`,
  );

describe("done-when 1: the first migration", () => {
  it("[done-when 1] migrate:up applies to an empty database: every table and the seven functions are there", () => {
    const url = empty();
    expect(leftovers(url), "the database starts empty").toEqual([]);
    const up = pnpmDb("migrate:up", url);
    expect(up.status, `migrate:up exits 0:\n${tail(up)}`).toBe(0);
    const tables = new Set(
      leftovers(url)
        .filter((l) => l.kind === "relation")
        .map((l) => l.name),
    );
    const missing = expectedSchema(loadMap().tables)
      .map((t) => t.name)
      .filter((n) => !tables.has(n));
    expect(missing, "tables the migration did not make").toEqual([]);
    expect(readFunctions(url), "the seven functions").toEqual([...FUNCTIONS].sort());
  });

  it("[done-when 1] migrate:down reverses it cleanly: no table, sequence, function or type is left in the public schema", () => {
    const url = empty();
    const up = pnpmDb("migrate:up", url);
    expect(up.status, `migrate:up exits 0:\n${tail(up)}`).toBe(0);
    expect(leftovers(url).length, "something was applied").toBeGreaterThan(0);
    const down = pnpmDb("migrate:down", url);
    expect(down.status, `migrate:down exits 0:\n${tail(down)}`).toBe(0);
    expect(leftovers(url), "nothing of the schema is left").toEqual([]);
  });

  it("[done-when 1] the migration applies again after it was reversed, to the same schema", () => {
    const url = empty();
    const first = pnpmDb("migrate:up", url);
    expect(first.status, `migrate:up exits 0:\n${tail(first)}`).toBe(0);
    const before = leftovers(url);
    expect(before.length, "the first migrate:up made the schema").toBeGreaterThan(80);
    const down = pnpmDb("migrate:down", url);
    expect(down.status, `migrate:down exits 0:\n${tail(down)}`).toBe(0);
    const again = pnpmDb("migrate:up", url);
    expect(again.status, `migrate:up exits 0 a second time:\n${tail(again)}`).toBe(0);
    expect(leftovers(url)).toEqual(before);
  });
});
