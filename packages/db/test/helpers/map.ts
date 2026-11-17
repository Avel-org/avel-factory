// Reads the database map (docs/design/AVEL Database Map.html): the ERD data it embeds.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { indexBody, type Tbl, typeName, type Uq, ws } from "./model.ts";
import { repoRoot } from "./psql.ts";

type RawUnique = { name: string; cols?: string[]; def?: string; where?: string | null };
type RawTable = {
  name: string;
  partitioned?: boolean;
  columns: { name: string; type: string; required?: boolean; default?: string | null }[];
  primaryKey: string[];
  foreignKeys: {
    name: string;
    cols: string[];
    parent: string;
    parentCols: string[];
    onDelete: string;
    deferred?: boolean;
  }[];
  checks: { name: string; def: string }[];
  uniques: RawUnique[];
  indexes: { name: string; def: string }[];
  triggers: { name: string; def: string }[];
};

export type MapFile = { stats: Record<string, number>; tables: Tbl[] };

export function loadMap(): MapFile {
  const html = readFileSync(join(repoRoot, "docs/design/AVEL Database Map.html"), "utf8");
  const line = html.split("\n").find((l) => l.startsWith("const ERD = "));
  if (!line) throw new Error("the map has no `const ERD = ` line");
  const erd = JSON.parse(line.replace(/^const ERD = /, "").replace(/;\s*$/, ""));
  const tables: Tbl[] = (erd.tables as RawTable[]).map((t): Tbl => {
    const uniques: Uq[] = t.uniques.map((u) => {
      if (u.cols) return { name: u.name, cols: u.cols, where: u.where ? ws(u.where) : null };
      const m = /USING btree \((.*?)\)(?: WHERE (.*))?$/.exec(u.def ?? "");
      if (!m) throw new Error(`cannot read unique ${u.name}`);
      return {
        name: u.name,
        cols: (m[1] as string).split(",").map((c) => c.trim()),
        where: m[2] ? ws(m[2]) : null,
      };
    });
    return {
      name: t.name,
      partitioned: Boolean(t.partitioned),
      columns: t.columns.map((c) => ({
        name: c.name,
        type: typeName(c.type),
        required: Boolean(c.required),
        default: c.default ?? null,
      })),
      primaryKey: t.primaryKey,
      foreignKeys: t.foreignKeys.map((f) => ({
        name: f.name,
        cols: f.cols,
        parent: f.parent,
        parentCols: f.parentCols,
        onDelete: f.onDelete,
        deferred: Boolean(f.deferred),
      })),
      checks: t.checks.map((c) => ({ name: c.name, def: ws(c.def) })),
      uniques,
      indexes: t.indexes.map((i) => ({ name: i.name, def: indexBody(i.def) })),
      triggers: t.triggers.map((x) => ({ name: x.name, def: ws(x.def) })),
    };
  });
  return { stats: erd.stats, tables };
}
