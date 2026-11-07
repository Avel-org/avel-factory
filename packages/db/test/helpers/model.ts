// The shape of a schema, the same for the map's ERD data and for the live catalog.
export type Col = { name: string; type: string; required: boolean; default: string | null };
export type Fk = {
  name: string;
  cols: string[];
  parent: string;
  parentCols: string[];
  onDelete: string;
  deferred: boolean;
};
/** `raw` means the def is SQL as a person wrote it; Postgres rewrites it into its own form before it is compared. */
export type Chk = { name: string; def: string; raw?: boolean };
export type Uq = { name: string; cols: string[]; where: string | null; raw?: boolean };
export type Ix = { name: string; def: string };
export type Trg = { name: string; def: string };
export type Tbl = {
  name: string;
  partitioned: boolean;
  columns: Col[];
  primaryKey: string[];
  foreignKeys: Fk[];
  checks: Chk[];
  uniques: Uq[];
  indexes: Ix[];
  triggers: Trg[];
};

export const ws = (s: string): string => s.replace(/\s+/g, " ").trim();

/** `CREATE [UNIQUE] INDEX n ON [ONLY] public.t USING btree (a) WHERE (p)` → `btree (a) WHERE (p)`. */
export function indexBody(def: string): string {
  return ws(def.replace(/^CREATE (UNIQUE )?INDEX \S+ ON (ONLY )?\S+ USING /, ""));
}

const TYPE_ALIASES: Record<string, string> = {
  "timestamp with time zone": "timestamptz",
  "character varying": "text",
};
export function typeName(t: string): string {
  const base = t.replace(/\(.*?\)/, "");
  return TYPE_ALIASES[base] ?? base;
}

/** Sorts the values inside every ARRAY[...], so two lists with the same values read the same. */
export const canon = (s: string): string =>
  ws(s).replace(
    /ARRAY\[(.*?)\]/g,
    (_m, body: string) => `ARRAY[${body.split(", ").sort().join(", ")}]`,
  );

export const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
