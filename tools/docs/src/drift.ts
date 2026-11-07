// `pnpm --filter @avel/docs drift`: checks docs/design/DATABASE.md (or $AVEL_DOCS_DATABASE_MD)
// against the Drizzle schema (DATABASE.md, Source of truth: "The build fails if this file is
// stale"). It only reads the file. Exit 0 and "no drift" when they agree; exit 1 and one line
// per difference when they don't; exit 2 when the check itself can't run.
//
// What it compares, table by table:
// - the tables: each one specified once, and no table the schema lacks;
// - the columns, by name, and whether each is optional (`?`). Omitted on purpose, as
//   DATABASE.md's notation says: `id` when no `key (...)` is shown, and `created_at`,
//   `row_version` and `updated_at`;
// - the key: `key (...)` is the primary key, and no key shown means `id`;
// - the foreign keys: every `→` is a foreign key on those columns to that table, and every
//   foreign key has its `→`;
// - the value lists: a CHECKed column shows its list, by name or as `'a'|'b'`, and it's the
//   list `@avel/contract` gives the column (`checkedColumns`); a SQL type after `:` is the
//   column's type;
// - the relationships: DATABASE.md's erDiagrams draw exactly the schema's parent and child
//   pairs, with the same marks as docs/generated/erd.md.

import { readFileSync } from "node:fs";
import { checkedColumns, valueLists } from "@avel/contract";
import { type DocTable, readDatabaseMd } from "./database-md.ts";
import { databaseMdPath } from "./paths.ts";
import { edgeText, readSchema, relationships, type SchemaTable } from "./schema.ts";

/** Columns DATABASE.md leaves out, because every table that has them has them the same way. */
const IMPLIED = ["created_at", "row_version", "updated_at"];

const lists: Record<string, readonly string[]> = valueLists;
const listOf: Record<string, string> = checkedColumns;

const sameList = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i]);

const tuple = (cols: readonly string[]): string =>
  cols.length === 1 ? (cols[0] ?? "") : `(${cols.join(", ")})`;

function checkAnnotation(
  table: SchemaTable,
  column: string,
  annotation: string | null,
  sqlTypes: ReadonlySet<string>,
): string[] {
  const where = `${table.name}.${column}`;
  const listName = listOf[where];
  const type = table.columns.find((c) => c.name === column)?.type;
  if (annotation === null) {
    return listName ? [`${where}: DATABASE.md doesn't show its value list (${listName})`] : [];
  }
  if (/^'[^']*'(\s*\|\s*'[^']*')*$/.test(annotation)) {
    const values = annotation.split("|").map((v) => v.trim().slice(1, -1));
    if (!listName) return [`${where}: DATABASE.md shows a value list, and the schema has none`];
    const expected = lists[listName] ?? [];
    if (sameList(values, expected)) return [];
    const missing = expected.filter((v) => !values.includes(v));
    const extra = values.filter((v) => !expected.includes(v));
    const parts = [
      missing.length > 0 ? `lacks ${missing.map((v) => `'${v}'`).join(", ")}` : "",
      extra.length > 0
        ? `has ${extra.map((v) => `'${v}'`).join(", ")}, which ${listName} doesn't`
        : "",
      missing.length === 0 && extra.length === 0
        ? `lists them in another order than ${listName}`
        : "",
    ].filter((p) => p !== "");
    return [`${where}: DATABASE.md's value list ${parts.join(" and ")}`];
  }
  if (annotation in lists) {
    if (annotation === listName) return [];
    return [
      listName
        ? `${where}: DATABASE.md says ${annotation}, the schema checks ${listName}`
        : `${where}: DATABASE.md says ${annotation}, and the schema has no value list on it`,
    ];
  }
  if (sqlTypes.has(annotation)) {
    if (listName)
      return [
        `${where}: DATABASE.md shows the type ${annotation}, not its value list (${listName})`,
      ];
    return annotation === type
      ? []
      : [`${where}: DATABASE.md says ${annotation}, the schema has ${type}`];
  }
  if (/^\d+(\s*\|\s*\d+)*$/.test(annotation)) return [];
  return [`${where}: can't read the annotation "${annotation}"`];
}

function compareTable(doc: DocTable, table: SchemaTable, sqlTypes: ReadonlySet<string>): string[] {
  const out: string[] = doc.problems.map((p) => `${table.name} (line ${doc.line}): ${p}`);
  const name = table.name;

  // The key.
  if (doc.key === null) {
    if (!sameList(table.primaryKey, ["id"])) {
      out.push(
        `${name}: the schema's key is ${tuple(table.primaryKey)}, and DATABASE.md shows no key (...)`,
      );
    }
  } else if (!sameList(doc.key, table.primaryKey)) {
    out.push(
      `${name}: DATABASE.md's key is ${tuple(doc.key)}, the schema's is ${tuple(table.primaryKey)}`,
    );
  }

  // The columns.
  const implied = new Set(IMPLIED);
  if (doc.key === null) implied.add("id");
  const docNames = new Set(doc.columns.map((c) => c.name));
  for (const c of doc.columns) {
    const col = table.columns.find((s) => s.name === c.name);
    if (!col) {
      out.push(`${name}.${c.name}: in DATABASE.md, not in the schema`);
      continue;
    }
    if (c.optional === col.notNull) {
      out.push(
        `${name}.${c.name}: ${col.notNull ? "required" : "optional"} in the schema, ${c.optional ? "optional (?)" : "required"} in DATABASE.md`,
      );
    }
    out.push(...checkAnnotation(table, c.name, c.annotation, sqlTypes));
  }
  for (const col of table.columns) {
    if (docNames.has(col.name) || implied.has(col.name)) continue;
    out.push(`${name}.${col.name}: in the schema, not in DATABASE.md`);
  }

  // The foreign keys.
  const unmatched = [...table.foreignKeys];
  for (const fk of doc.foreignKeys) {
    const i = unmatched.findIndex(
      (s) =>
        s.parent === fk.parent &&
        sameList(s.columns, fk.columns) &&
        (fk.parentColumns === null || sameList(s.parentColumns, fk.parentColumns)),
    );
    if (i >= 0) unmatched.splice(i, 1);
    else {
      const parentCols = fk.parentColumns ? ` (${fk.parentColumns.join(", ")})` : "";
      out.push(
        `${name}.${tuple(fk.columns)} → ${fk.parent}${parentCols}: in DATABASE.md, not a foreign key in the schema`,
      );
    }
  }
  for (const fk of unmatched) {
    out.push(
      `${name}.${tuple(fk.columns)} → ${fk.parent}: a foreign key in the schema (${fk.name}), not in DATABASE.md`,
    );
  }
  return out;
}

export function drift(text: string): { differences: string[]; summary: string } {
  const schema = readSchema();
  const doc = readDatabaseMd(text);
  const differences: string[] = [...doc.problems];
  const sqlTypes = new Set(schema.flatMap((t) => t.columns.map((c) => c.type)));

  // The tables.
  const byName = new Map(schema.map((t) => [t.name, t]));
  const seen = new Set<string>();
  for (const d of doc.tables) {
    const table = byName.get(d.name);
    if (seen.has(d.name)) {
      differences.push(`table ${d.name}: specified twice in DATABASE.md (again on line ${d.line})`);
      continue;
    }
    seen.add(d.name);
    if (!table) {
      differences.push(`table ${d.name}: in DATABASE.md (line ${d.line}), not in the schema`);
      continue;
    }
    differences.push(...compareTable(d, table, sqlTypes));
  }
  for (const t of schema) {
    if (!seen.has(t.name)) differences.push(`table ${t.name}: in the schema, not in DATABASE.md`);
  }

  // The relationships.
  const rels = relationships(schema);
  const expected = new Map(rels.map((r) => [`${r.parent} ${r.child}`, r]));
  const drawn = new Set<string>();
  for (const e of doc.edges) {
    const pair = `${e.parent} ${e.child}`;
    const written = `${e.parent} ${e.parentMark}--${e.childMark} ${e.child}`;
    if (drawn.has(pair)) {
      differences.push(
        `relationship ${written}: drawn twice in DATABASE.md (again on line ${e.line})`,
      );
      continue;
    }
    drawn.add(pair);
    const r = expected.get(pair);
    if (!r) {
      differences.push(
        `relationship ${written}: in DATABASE.md's ERD (line ${e.line}), not in the schema`,
      );
    } else if (edgeText(r) !== written) {
      differences.push(`relationship ${written} (line ${e.line}): the schema's is ${edgeText(r)}`);
    }
  }
  for (const r of rels) {
    if (!drawn.has(`${r.parent} ${r.child}`)) {
      differences.push(`relationship ${edgeText(r)}: in the schema, not in DATABASE.md's ERD`);
    }
  }

  const fks = schema.reduce((n, t) => n + t.foreignKeys.length, 0);
  const summary = `${schema.length} tables, ${fks} foreign keys, ${rels.length} relationships`;
  return { differences, summary };
}

function main(): void {
  const path = databaseMdPath();
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    console.error(`drift: can't read ${path}: ${error instanceof Error ? error.message : error}`);
    process.exit(2);
  }
  const { differences, summary } = drift(text);
  if (differences.length === 0) {
    console.log(`no drift: ${path} matches the schema (${summary})`);
    return;
  }
  console.log(
    `drift: ${differences.length} differences between the schema (${summary}) and ${path}`,
  );
  for (const d of differences) console.log(`- ${d}`);
  process.exitCode = 1;
}

try {
  main();
} catch (error) {
  // Exit 2, never 1: a crash mustn't read as drift.
  console.error(error);
  process.exit(2);
}
