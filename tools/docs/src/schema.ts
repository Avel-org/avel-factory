// The schema as the docs see it: every table in @avel/db, read through drizzle-orm's
// getTableConfig, reduced to what the ERD and the drift check compare. Nothing here
// reads the migrations; the Drizzle objects are the source (DATABASE.md, Source of truth).
import { tableOwners, tables } from "@avel/db";
import { is } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";

export interface Column {
  name: string;
  /** The SQL type as the ERD writes it: `timestamp with time zone` is `timestamptz`. */
  type: string;
  notNull: boolean;
}

export interface ForeignKey {
  name: string;
  columns: string[];
  parent: string;
  parentColumns: string[];
}

export interface SchemaTable {
  name: string;
  owner: string;
  columns: Column[];
  primaryKey: string[];
  foreignKeys: ForeignKey[];
  /** Column sets that are unique on every row: the primary key, unique constraints, and unique indexes with no WHERE. */
  uniqueSets: string[][];
}

/** One parent and child pair, however many foreign keys join them, the way the ERD draws it. */
export interface Relationship {
  parent: string;
  child: string;
  /** `||` when some foreign key to the parent is required, `|o` when every one is optional. */
  parentMark: "||" | "|o";
  /** `o|` when every foreign key to the parent is unique in the child, `o{` otherwise. */
  childMark: "o|" | "o{";
}

function sqlType(raw: string): string {
  return raw
    .replace(/^timestamp with time zone/, "timestamptz")
    .replace(/^timestamp without time zone/, "timestamp")
    .replace(/^character varying/, "varchar")
    .replace(/^double precision/, "float8");
}

const sameSet = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((x) => b.includes(x));

function readTable(table: PgTable, owner: string): SchemaTable {
  const config = getTableConfig(table);
  const columns = config.columns.map((c) => ({
    name: c.name,
    type: sqlType(c.getSQLType()),
    notNull: c.notNull,
  }));

  const singlePk = config.columns.filter((c) => c.primary).map((c) => c.name);
  const compositePk = config.primaryKeys[0]?.columns.map((c) => c.name) ?? [];
  if (singlePk.length > 0 && compositePk.length > 0) {
    throw new Error(`${config.name}: both a column primary key and a composite one`);
  }
  const primaryKey = singlePk.length > 0 ? singlePk : compositePk;

  const foreignKeys = config.foreignKeys.map((fk) => {
    const ref = fk.reference();
    return {
      name: fk.getName(),
      columns: ref.columns.map((c) => c.name),
      parent: getTableConfig(ref.foreignTable).name,
      parentColumns: ref.foreignColumns.map((c) => c.name),
    };
  });

  const uniqueSets: string[][] = [];
  if (primaryKey.length > 0) uniqueSets.push(primaryKey);
  for (const c of config.columns) if (c.isUnique) uniqueSets.push([c.name]);
  for (const u of config.uniqueConstraints) uniqueSets.push(u.columns.map((c) => c.name));
  for (const ix of config.indexes) {
    if (!ix.config.unique || ix.config.where) continue;
    const names = ix.config.columns.map((c) => ("name" in c ? c.name : null));
    if (names.every((n): n is string => typeof n === "string")) uniqueSets.push(names);
  }

  return { name: config.name, owner, columns, primaryKey, foreignKeys, uniqueSets };
}

let cached: SchemaTable[] | undefined;

/** Every table in the schema, sorted by name. */
export function readSchema(): SchemaTable[] {
  if (cached) return cached;
  const owners: Record<string, string> = tableOwners;
  const read: SchemaTable[] = [];
  for (const value of Object.values(tables)) {
    if (!is(value, PgTable)) continue;
    const name = getTableConfig(value).name;
    const owner = owners[name];
    if (!owner) throw new Error(`${name} has no owner in @avel/db's tableOwners`);
    read.push(readTable(value, owner));
  }
  read.sort((a, b) => cmp(a.name, b.name));
  for (let i = 1; i < read.length; i++) {
    if (read[i]?.name === read[i - 1]?.name) throw new Error(`${read[i]?.name} is defined twice`);
  }
  cached = read;
  return read;
}

/** Every parent and child pair, sorted by parent then child. */
export function relationships(schema: readonly SchemaTable[]): Relationship[] {
  const byPair = new Map<string, { parent: string; child: string; fks: ForeignKey[] }>();
  for (const table of schema) {
    for (const fk of table.foreignKeys) {
      const key = `${fk.parent} ${table.name}`;
      const entry = byPair.get(key) ?? { parent: fk.parent, child: table.name, fks: [] };
      entry.fks.push(fk);
      byPair.set(key, entry);
    }
  }
  const byName = new Map(schema.map((t) => [t.name, t]));
  const out: Relationship[] = [];
  for (const { parent, child, fks } of byPair.values()) {
    const table = byName.get(child);
    if (!table) throw new Error(`no table ${child}`);
    const required = fks.some((fk) =>
      fk.columns.every((c) => table.columns.find((col) => col.name === c)?.notNull),
    );
    const unique = fks.every((fk) => table.uniqueSets.some((set) => sameSet(set, fk.columns)));
    out.push({
      parent,
      child,
      parentMark: required ? "||" : "|o",
      childMark: unique ? "o|" : "o{",
    });
  }
  out.sort((a, b) => cmp(a.parent, b.parent) || cmp(a.child, b.child));
  return out;
}

/** How the ERD writes a relationship, without its label: `clients ||--o{ missions`. */
export function edgeText(r: Relationship): string {
  return `${r.parent} ${r.parentMark}--${r.childMark} ${r.child}`;
}

/** Byte order, so the output never depends on the machine's locale. */
export function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
