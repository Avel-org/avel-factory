import { expectedSchema } from "./changes.ts";
import { loadMap } from "./map.ts";
import { clone, type Tbl, ws } from "./model.ts";
import { ident, psql } from "./psql.ts";

/**
 * The map with every change applied, with the defs a person wrote (`raw`) rewritten by Postgres
 * itself, so they compare with what the live catalog prints. Needs the migrated database only
 * for its column types.
 */
export function expectedNormalized(url: string): Tbl[] {
  const tables = expectedSchema(loadMap().tables);
  const lines: string[] = [];
  const todo: string[] = [];
  for (const t of tables) {
    const rawChecks = t.checks.filter((c) => c.raw);
    const rawUniques = t.uniques.filter((u) => u.raw);
    if (!rawChecks.length && !rawUniques.length) continue;
    lines.push(`create temp table _n as select * from public.${ident(t.name)} with no data;`);
    rawChecks.forEach((c, i) => {
      lines.push(`alter table _n add constraint ${ident(`raw_c${i}`)} check (${c.def});`);
      todo.push(`${t.name}|c|${c.name}|raw_c${i}`);
    });
    rawUniques.forEach((u, i) => {
      lines.push(
        `create index ${ident(`raw_u${i}`)} on _n (${u.cols.join(", ")}) where (${u.where});`,
      );
      todo.push(`${t.name}|u|${u.name}|raw_u${i}`);
    });
    lines.push(
      `select 'RAW|${t.name}|c|' || replace(conname, 'raw_c', '') || '|' || regexp_replace(pg_get_constraintdef(oid), '^CHECK ', '') from pg_constraint where conrelid = '_n'::regclass and conname like 'raw\\_c%';`,
      `select 'RAW|${t.name}|u|' || replace(c.relname, 'raw_u', '') || '|' || regexp_replace(pg_get_indexdef(i.indexrelid), '^.* WHERE ', '') from pg_index i join pg_class c on c.oid = i.indexrelid where i.indrelid = '_n'::regclass and c.relname like 'raw\\_u%';`,
      "drop table _n;",
    );
  }
  const r = psql(url, lines.join("\n"));
  if (r.status !== 0) throw new Error(`could not normalise the expected defs: ${r.stderr}`);
  const out = new Map<string, string>();
  // a def can run over several lines: each record starts at a line beginning RAW|
  for (const l of r.stdout.split(/(?=^RAW\|)/m)) {
    const m = /^RAW\|([^|]+)\|([cu])\|(\d+)\|([\s\S]*)$/.exec(l);
    if (m) out.set(`${m[1]}|${m[2]}|${m[3]}`, ws(m[4] as string));
  }
  const result = clone(tables);
  for (const t of result) {
    t.checks
      .filter((c) => c.raw)
      .forEach((c, i) => {
        const d = out.get(`${t.name}|c|${i}`);
        if (d === undefined) throw new Error(`no normal form for ${c.name}`);
        c.def = d;
        c.raw = false;
      });
    t.uniques
      .filter((u) => u.raw)
      .forEach((u, i) => {
        const d = out.get(`${t.name}|u|${i}`);
        if (d === undefined) throw new Error(`no normal form for ${u.name}`);
        u.where = d;
        u.raw = false;
      });
  }
  return result;
}
