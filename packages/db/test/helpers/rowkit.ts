// A kit for exercising one rule at a time on the live schema, inside a transaction that is
// always rolled back. A rule is isolated by dropping the table's other constraints for that
// transaction only (DDL is transactional in Postgres), so a refusal can only come from the rule
// under test. Nothing here changes the database for the next test.
import { ident, lit, psql, rows } from "./psql.ts";

export type ColInfo = {
  name: string;
  type: string;
  notnull: boolean;
  hasDefault: boolean;
  generated: boolean;
};
export type TableInfo = {
  name: string;
  columns: ColInfo[];
  fks: string[];
  checks: string[];
  keyConstraints: string[]; // primary key and unique constraints
  uniqueIndexes: string[]; // unique indexes that back no constraint
  partitionKey: string | null;
};

const cache = new Map<string, Map<string, TableInfo>>();

export function tableInfo(url: string): Map<string, TableInfo> {
  const hit = cache.get(url);
  if (hit) return hit;
  const list = rows<TableInfo>(
    url,
    `select c.relname as name,
      (select json_agg(json_build_object('name', a.attname, 'type', format_type(a.atttypid, a.atttypmod),
          'notnull', a.attnotnull, 'hasDefault', a.atthasdef, 'generated', a.attgenerated <> '') order by a.attnum)
         from pg_attribute a where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped) as columns,
      coalesce((select json_agg(conname) from pg_constraint where conrelid = c.oid and contype = 'f'), '[]') as fks,
      coalesce((select json_agg(conname) from pg_constraint where conrelid = c.oid and contype = 'c'), '[]') as checks,
      coalesce((select json_agg(conname) from pg_constraint where conrelid = c.oid and contype in ('p', 'u')), '[]') as "keyConstraints",
      coalesce((select json_agg(ic.relname) from pg_index i join pg_class ic on ic.oid = i.indexrelid
                 where i.indrelid = c.oid and i.indisunique
                   and not exists (select 1 from pg_constraint k where k.conindid = i.indexrelid and k.contype in ('p', 'u'))), '[]') as "uniqueIndexes",
      (select a.attname from pg_partitioned_table p join pg_attribute a on a.attrelid = p.partrelid and a.attnum = p.partattrs[0]
        where p.partrelid = c.oid) as "partitionKey"
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relispartition`,
  );
  const m = new Map<string, TableInfo>(list.map((t) => [t.name, t]));
  cache.set(url, m);
  return m;
}

export function info(url: string, table: string): TableInfo {
  const t = tableInfo(url).get(table);
  if (!t) throw new Error(`the live schema has no table ${table}`);
  return t;
}

/** A SQL expression giving a fresh non-null value of the type. */
export function randomExpr(type: string): string {
  if (type === "uuid") return "gen_random_uuid()";
  if (type === "text") return "('t_' || substr(md5(random()::text), 1, 12))";
  if (type === "integer" || type === "smallint" || type === "bigint")
    return `(1 + floor(random() * 100))::${type}`;
  if (type.startsWith("numeric")) return "1::numeric";
  if (type === "boolean") return "false";
  if (type.startsWith("timestamp")) return "now()";
  if (type === "jsonb") return "'{}'::jsonb";
  if (type === "text[]") return "'{}'::text[]";
  if (type === "tsvector") return "to_tsvector('x')";
  if (type === "bytea") return "'\\x00'::bytea";
  throw new Error(`no filler for type ${type}`);
}

const q = ident;

/** Statements that make one table free of every rule but the ones named in `keep`. */
export function isolate(
  url: string,
  table: string,
  keep: { checks?: string[]; fks?: string[]; keys?: string[] } = {},
  opts: {
    dropFks?: boolean;
    dropChecks?: boolean;
    dropKeys?: boolean;
    dropUniqueIndexes?: boolean;
    triggersOff?: boolean;
  } = {},
): string[] {
  const t = info(url, table);
  const out: string[] = [];
  const dropFks = opts.dropFks ?? true;
  const dropChecks = opts.dropChecks ?? true;
  const dropKeys = opts.dropKeys ?? false;
  if (dropChecks)
    for (const c of t.checks)
      if (!keep.checks?.includes(c)) out.push(`alter table ${q(table)} drop constraint ${q(c)}`);
  if (dropFks)
    for (const f of t.fks)
      if (!keep.fks?.includes(f))
        out.push(`alter table ${q(table)} drop constraint ${q(f)} cascade`);
  if (dropKeys) {
    for (const k of t.keyConstraints)
      if (!keep.keys?.includes(k))
        out.push(`alter table ${q(table)} drop constraint ${q(k)} cascade`);
    for (const k of t.uniqueIndexes) if (!keep.keys?.includes(k)) out.push(`drop index ${q(k)}`);
  }
  if (opts.dropUniqueIndexes && !dropKeys)
    for (const k of t.uniqueIndexes) out.push(`drop index ${q(k)}`);
  if (opts.triggersOff ?? true) out.push(`alter table ${q(table)} disable trigger user`);
  return out;
}

/** A partitioned table needs a partition to take a row: make one for year 2000, which exists for this transaction only. */
export function prepare(
  url: string,
  table: string,
): { setup: string[]; set: Record<string, string> } {
  const t = info(url, table);
  if (!t.partitionKey) return { setup: [], set: {} };
  return {
    setup: [
      `create table ${q(`${table}_rigg_part`)} partition of ${q(table)} for values from ('2000-01-01') to ('2001-01-01')`,
    ],
    set: { [t.partitionKey]: "'2000-06-01'::timestamptz" },
  };
}

/** INSERT with the NOT NULL columns that have no default filled, and `set` on top. */
export function insertSql(url: string, table: string, set: Record<string, string> = {}): string {
  const t = info(url, table);
  const cols: string[] = [];
  const vals: string[] = [];
  for (const c of t.columns) {
    if (c.generated) continue;
    if (c.name in set) {
      cols.push(q(c.name));
      vals.push(set[c.name] as string);
    } else if (c.notnull && !c.hasDefault) {
      cols.push(q(c.name));
      vals.push(randomExpr(c.type));
    }
  }
  for (const name of Object.keys(set))
    if (!t.columns.some((c) => c.name === name)) throw new Error(`${table} has no column ${name}`);
  return `insert into ${q(table)} (${cols.join(", ")}) values (${vals.join(", ")})`;
}

/** Copies the table's one row, with `replace` columns given new values. */
export function cloneRowSql(
  url: string,
  table: string,
  replace: Record<string, string> = {},
): string {
  const t = info(url, table);
  const cols = t.columns.filter((c) => !c.generated);
  return `insert into ${q(table)} (${cols.map((c) => q(c.name)).join(", ")}) select ${cols
    .map((c) => (c.name in replace ? (replace[c.name] as string) : q(c.name)))
    .join(", ")} from ${q(table)} limit 1`;
}

export type Outcome = { ok: boolean; sqlstate?: string; message?: string };

/**
 * Runs `setup` (which must succeed), then each step in its own subtransaction, and rolls everything back.
 * A step is a list of statements; it is refused if any of them raises. A step that succeeds stays applied
 * for the steps after it.
 */
export function attempts(
  url: string,
  setup: string[],
  steps: { label: string; sql: string[] }[],
): { setupError?: string; outcomes: Map<string, Outcome> } {
  const parts = ["begin;", ...setup.map((s) => `${s.replace(/;\s*$/, "")};`)];
  for (const s of steps) {
    if (s.label.includes("|")) throw new Error("a label cannot hold |");
    const body = s.sql.map((x) => `execute $rigg_q$${x}$rigg_q$;`).join("\n");
    parts.push(`do $rigg$ begin begin ${body}
      raise notice 'RIGG|%|ok', ${lit(s.label)};
    exception when others then
      raise notice 'RIGG|%|%|%', ${lit(s.label)}, sqlstate, replace(sqlerrm, E'\\n', ' ');
    end; end $rigg$;`);
  }
  parts.push("rollback;");
  const r = psql(url, parts.join("\n"));
  const outcomes = new Map<string, Outcome>();
  for (const line of r.stderr.split("\n")) {
    const m = /RIGG\|(.*?)\|(ok|[0-9A-Z]{5})(?:\|(.*))?$/.exec(line);
    if (!m) continue;
    outcomes.set(
      m[1] as string,
      m[2] === "ok" ? { ok: true } : { ok: false, sqlstate: m[2], message: m[3] },
    );
  }
  if (r.status !== 0 && outcomes.size < steps.length)
    return { setupError: r.stderr.trim().split("\n").slice(0, 4).join(" | "), outcomes };
  return { outcomes };
}

/** One value for the column, as the SQL literal from a candidate search result. */
export type Combo = Record<string, string>;

const FIXED_UUIDS = [
  "'00000000-0000-0000-0000-000000000001'",
  "'00000000-0000-0000-0000-000000000002'",
];

function candidates(c: ColInfo, def: string, truthTable: boolean): string[] {
  const t = c.type;
  const literals = [...def.matchAll(/'([^']*)'/g)].map((m) => m[1] as string);
  const out: string[] = [];
  if (t === "text") {
    const set = [...new Set(literals)];
    if (!truthTable || set.length === 0) set.push("zz_other");
    out.push(...set.map((v) => `${lit(v)}::text`));
  } else if (t === "integer" || t === "smallint" || t === "bigint" || t.startsWith("numeric")) {
    const nums = [
      ...new Set([...def.matchAll(/(?<![\w'.])(\d+)(?![\w'])/g)].map((m) => Number(m[1]))),
    ];
    const set = new Set<number>(nums);
    if (!truthTable) {
      for (const n of nums) {
        set.add(n + 1);
        set.add(n - 1);
      }
      set.add(-1);
      set.add(0);
      set.add(1);
    } else if (set.size === 0) set.add(1);
    out.push(...[...set].sort((a, b) => a - b).map((n) => `${n}::${t}`));
  } else if (t === "boolean") out.push("true", "false");
  else if (t.startsWith("timestamp"))
    out.push("'2026-01-01T00:00:00Z'::timestamptz", "'2026-01-02T00:00:00Z'::timestamptz");
  else if (t === "uuid")
    out.push(
      truthTable ? `${FIXED_UUIDS[0]}::uuid` : `${FIXED_UUIDS[0]}::uuid`,
      ...(truthTable ? [] : [`${FIXED_UUIDS[1]}::uuid`]),
    );
  else if (t === "jsonb") out.push("'{}'::jsonb", "'[]'::jsonb", "'\"x\"'::jsonb", "'1'::jsonb");
  else if (t === "text[]") out.push("'{}'::text[]", "'{x}'::text[]");
  else if (t === "tsvector") out.push("to_tsvector('x')");
  else if (t === "bytea") out.push("'\\x00'::bytea");
  else throw new Error(`no candidates for type ${t}`);
  if (!c.notnull) out.unshift(`NULL::${t}`);
  return out;
}

export type Search = { combos: { values: Combo; pass: boolean }[]; columns: string[] };

/**
 * Every combination of candidate values for the columns a rule mentions, each with whether the rule
 * (an SQL expression over the table's columns) holds for it, as Postgres itself decides.
 */
export function search(
  url: string,
  table: string,
  expr: string,
  opts: { truthTable?: boolean; limit?: number } = {},
): Search {
  const t = info(url, table);
  const bare = expr.replace(/'[^']*'/g, "''");
  const involved = t.columns.filter((c) => new RegExp(`(?<![\\w"])${c.name}(?![\\w"])`).test(bare));
  if (involved.length === 0) throw new Error(`rule on ${table} mentions no column: ${expr}`);
  const lists = involved.map((c) => candidates(c, expr, opts.truthTable ?? false));
  const size = lists.reduce((n, l) => n * l.length, 1);
  if (size > (opts.limit ?? 60000))
    throw new Error(`rule on ${table} has ${size} candidate rows (${involved.map((c) => c.name)})`);
  const from = lists
    .map((l, i) => `(values ${l.map((v) => `(${v})`).join(", ")}) v${i}(c)`)
    .join(" cross join ");
  const sel = involved.map((c, i) => `v${i}.c as ${q(c.name)}`).join(", ");
  const sql = `begin;
create temp table _s as select ${involved.map((c) => q(c.name)).join(", ")} from public.${q(table)} with no data;
insert into _s select ${sel} from ${from};
select json_agg(json_build_object('pass', (${expr}) is not false, 'values', (select json_object_agg(key, quote_nullable(value)) from json_each_text(row_to_json(s))))) from _s s;
rollback;`;
  const r = psql(url, sql);
  if (r.status !== 0) throw new Error(`candidate search failed: ${r.stderr}`);
  const json = r.stdout
    .trim()
    .split("\n")
    .filter((l) => l.startsWith("["))
    .pop();
  const raw = JSON.parse(json ?? "[]") as { pass: boolean; values: Record<string, string> }[];
  const typeOf = new Map(involved.map((c) => [c.name, c.type]));
  return {
    columns: involved.map((c) => c.name),
    combos: raw.map((x) => ({
      pass: x.pass,
      values: Object.fromEntries(
        Object.entries(x.values).map(([k, v]) => [
          k,
          v === "NULL" ? `NULL::${typeOf.get(k)}` : `${v}::${typeOf.get(k)}`,
        ]),
      ),
    })),
  };
}
