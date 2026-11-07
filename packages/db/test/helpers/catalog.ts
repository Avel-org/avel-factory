// Reads the live schema from Postgres into the same shape as the map's.
import { indexBody, type Tbl, typeName, ws } from "./model.ts";
import { rows } from "./psql.ts";

const QUERY = `
select c.relname as name, (c.relkind = 'p') as partitioned,
  (select coalesce(json_agg(json_build_object(
      'name', a.attname, 'type', format_type(a.atttypid, a.atttypmod), 'required', a.attnotnull,
      'default', pg_get_expr(d.adbin, d.adrelid)) order by a.attnum), '[]'::json)
     from pg_attribute a left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
    where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped) as columns,
  (select coalesce(json_agg(a.attname order by k.ord), '[]'::json)
     from pg_constraint p cross join lateral unnest(p.conkey) with ordinality k(attnum, ord)
     join pg_attribute a on a.attrelid = p.conrelid and a.attnum = k.attnum
    where p.conrelid = c.oid and p.contype = 'p') as "primaryKey",
  (select coalesce(json_agg(json_build_object(
      'name', f.conname,
      'cols', (select json_agg(a.attname order by k.ord) from unnest(f.conkey) with ordinality k(attnum, ord)
                 join pg_attribute a on a.attrelid = f.conrelid and a.attnum = k.attnum),
      'parent', pc.relname,
      'parentCols', (select json_agg(a.attname order by k.ord) from unnest(f.confkey) with ordinality k(attnum, ord)
                 join pg_attribute a on a.attrelid = f.confrelid and a.attnum = k.attnum),
      'onDelete', case f.confdeltype when 'a' then 'NO ACTION' when 'r' then 'RESTRICT' when 'c' then 'CASCADE'
                                      when 'n' then 'SET NULL' else 'SET DEFAULT' end,
      'deferred', f.condeferred) order by f.conname), '[]'::json)
     from pg_constraint f join pg_class pc on pc.oid = f.confrelid
    where f.conrelid = c.oid and f.contype = 'f') as "foreignKeys",
  (select coalesce(json_agg(json_build_object('name', k.conname,
      'def', regexp_replace(pg_get_constraintdef(k.oid), '^CHECK ', '')) order by k.conname), '[]'::json)
     from pg_constraint k where k.conrelid = c.oid and k.contype = 'c') as checks,
  (select coalesce(json_agg(json_build_object('name', ic.relname,
      'cols', (select json_agg(a.attname order by k.ord) from unnest(i.indkey::int2[]) with ordinality k(attnum, ord)
                 join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum),
      'where', pg_get_expr(i.indpred, i.indrelid)) order by ic.relname), '[]'::json)
     from pg_index i join pg_class ic on ic.oid = i.indexrelid
    where i.indrelid = c.oid and i.indisunique and not i.indisprimary) as uniques,
  (select coalesce(json_agg(json_build_object('name', ic.relname, 'def', pg_get_indexdef(i.indexrelid)) order by ic.relname), '[]'::json)
     from pg_index i join pg_class ic on ic.oid = i.indexrelid
    where i.indrelid = c.oid and not i.indisunique) as indexes,
  (select coalesce(json_agg(json_build_object('name', t.tgname, 'def', pg_get_triggerdef(t.oid)) order by t.tgname), '[]'::json)
     from pg_trigger t where t.tgrelid = c.oid and not t.tgisinternal and t.tgparentid = 0) as triggers
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relispartition
order by c.relname`;

type Raw = {
  name: string;
  partitioned: boolean;
  columns: { name: string; type: string; required: boolean; default: string | null }[];
  primaryKey: string[];
  foreignKeys: {
    name: string;
    cols: string[];
    parent: string;
    parentCols: string[];
    onDelete: string;
    deferred: boolean | null;
  }[];
  checks: { name: string; def: string }[];
  uniques: { name: string; cols: string[]; where: string | null }[];
  indexes: { name: string; def: string }[];
  triggers: { name: string; def: string }[];
};

export function readCatalog(url: string): Tbl[] {
  return rows<Raw>(url, QUERY).map(
    (t): Tbl => ({
      name: t.name,
      partitioned: t.partitioned,
      columns: t.columns.map((c) => ({ ...c, type: typeName(c.type) })),
      primaryKey: t.primaryKey,
      foreignKeys: t.foreignKeys.map((f) => ({ ...f, deferred: Boolean(f.deferred) })),
      checks: t.checks.map((c) => ({ name: c.name, def: ws(c.def) })),
      uniques: t.uniques.map((u) => ({
        name: u.name,
        cols: u.cols,
        where: u.where ? ws(u.where) : null,
      })),
      indexes: t.indexes.map((i) => ({ name: i.name, def: indexBody(i.def) })),
      triggers: t.triggers.map((x) => ({ name: x.name, def: ws(x.def) })),
    }),
  );
}

export function readFunctions(url: string): string[] {
  return rows<{ name: string }>(
    url,
    `select p.proname as name from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.prokind = 'f' order by 1`,
  ).map((r) => r.name);
}
