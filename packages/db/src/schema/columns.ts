// Column types drizzle-orm's pg-core doesn't have, and the value-list CHECK builders.
import { type SQL, sql } from "drizzle-orm";
import { customType, type PgColumn } from "drizzle-orm/pg-core";

/** `bytea`: `secrets.ciphertext` and `secrets.wrapped_dek`. */
export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

/** `tsvector`: `kb_entries.search_text`, the agents' kb-search (GIN-indexed). */
export const tsvector = customType<{ data: string }>({
  dataType: () => "tsvector",
});

const literal = (value: string): string => `'${value.replaceAll("'", "''")}'`;
const ident = (name: string): string => `"${name.replaceAll('"', '""')}"`;

function inList(column: PgColumn, values: readonly string[]): string {
  if (values.length === 0) throw new Error(`an empty value list for ${column.name}`);
  return `${ident(column.name)} IN (${values.map(literal).join(", ")})`;
}

/**
 * A value-list CHECK: the column holds one of `values`. The list is always one imported from
 * `@avel/contract`, never written out here (DATABASE.md, Types; done-when 6). Postgres prints it
 * as `(column = ANY (ARRAY[...]))`, the map's form.
 */
export function oneOf(column: PgColumn, values: readonly string[]): SQL {
  return sql.raw(inList(column, values));
}

/** The same for an optional column: `NULL`, or one of `values`. */
export function oneOfOrNull(column: PgColumn, values: readonly string[]): SQL {
  return sql.raw(`(${ident(column.name)} IS NULL) OR (${inList(column, values)})`);
}
