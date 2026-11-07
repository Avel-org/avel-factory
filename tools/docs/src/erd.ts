// erd.md: the schema as Mermaid erDiagrams, one per owning module (`tableOwners` in @avel/db),
// generated from the Drizzle objects. The same relationships are what the drift check
// expects in DATABASE.md's diagrams (schema.ts, `relationships`).
import { Module } from "@avel/contract";
import { cmp, edgeText, type Relationship, relationships, type SchemaTable } from "./schema.ts";

function attribute(table: SchemaTable, name: string, type: string, notNull: boolean): string {
  const keys: string[] = [];
  if (table.primaryKey.includes(name)) keys.push("PK");
  if (table.foreignKeys.some((fk) => fk.columns.includes(name))) keys.push("FK");
  const marks = keys.length > 0 ? ` ${keys.join(", ")}` : "";
  return `    ${type} ${name}${marks}${notNull ? "" : ' "optional"'}`;
}

function label(r: Relationship, child: SchemaTable): string {
  const sets = child.foreignKeys
    .filter((fk) => fk.parent === r.parent)
    .map((fk) => fk.columns.join(", "))
    .sort(cmp);
  return `"${sets.join("; ")}"`;
}

export function renderErd(schema: readonly SchemaTable[]): string {
  const byName = new Map(schema.map((t) => [t.name, t]));
  const rels = relationships(schema);
  const fkCount = schema.reduce((n, t) => n + t.foreignKeys.length, 0);
  const modules = Module.filter((m) => schema.some((t) => t.owner === m));
  const unknown = schema.filter((t) => !(Module as readonly string[]).includes(t.owner));
  if (unknown.length > 0) {
    throw new Error(`owners that aren't modules: ${unknown.map((t) => t.name).join(", ")}`);
  }

  const lines: string[] = [
    "# AVEL database: entity relationships",
    "",
    "Generated from the Drizzle schema in `packages/db` by `pnpm --filter @avel/docs generate`.",
    "Don't edit it by hand: change the schema and generate again. `docs/design/DATABASE.md` is",
    "checked against the same schema by `pnpm --filter @avel/docs drift`.",
    "",
    `${schema.length} tables and ${fkCount} foreign keys, drawn as ${rels.length} parent and child relationships.`,
    "",
    "- **Grouped by owning module** (`tableOwners` in `@avel/db`). A module's diagram draws its",
    "  own tables with their columns, and each relationship whose child is one of them; a parent",
    "  from another module appears there by name only.",
    "- **Relationship marks:** `||--` at least one foreign key to the parent is required, `|o--`",
    "  every one is optional; `--o{` a parent can have many such rows, `--o|` at most one. The",
    "  label lists the foreign-key columns.",
    '- **Columns:** `PK` primary key, `FK` in a foreign key, `"optional"` nullable.',
    "",
    "| Module | Tables |",
    "| --- | --- |",
  ];
  for (const m of modules) {
    const names = schema.filter((t) => t.owner === m).map((t) => `\`${t.name}\``);
    lines.push(`| \`${m}\` | ${names.join(", ")} |`);
  }

  for (const m of modules) {
    const own = schema.filter((t) => t.owner === m);
    lines.push("", `## ${m}`, "", "```mermaid", "erDiagram");
    for (const t of own) {
      lines.push(`  ${t.name} {`);
      for (const c of t.columns) lines.push(attribute(t, c.name, c.type, c.notNull));
      lines.push("  }");
    }
    for (const r of rels) {
      if (byName.get(r.child)?.owner !== m) continue;
      const child = byName.get(r.child);
      if (!child) throw new Error(`no table ${r.child}`);
      lines.push(`  ${edgeText(r)} : ${label(r, child)}`);
    }
    lines.push("```");
  }
  return `${lines.join("\n")}\n`;
}
