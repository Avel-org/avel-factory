// Reads DATABASE.md the way the drift check compares it (DATABASE.md, Source of truth):
// - the table specs: every code block with no language. An entry starts at the first column
//   with the table's name, then an optional `key (...)`, then its columns in `{ ... }` (a
//   table with a key and no other columns may leave the braces out); indented lines continue
//   it. `// ...` and `/* ... */` are comments.
// - the relationships: every `parent ||--o{ child : label` line in a mermaid erDiagram.

export interface DocColumn {
  name: string;
  optional: boolean;
  /** What follows the `:`, if anything: a quoted value list, a list name, a SQL type, or numbers. */
  annotation: string | null;
}

export interface DocForeignKey {
  columns: string[];
  parent: string;
  /** The parent's columns, when the doc names them: `→ plan_modules (plan_id, id)`. */
  parentColumns: string[] | null;
}

export interface DocTable {
  name: string;
  line: number;
  /** The `key (...)` columns, or null when the table has the default `id` key. */
  key: string[] | null;
  columns: DocColumn[];
  foreignKeys: DocForeignKey[];
  /** What the drift check couldn't read in this entry. */
  problems: string[];
}

export interface DocEdge {
  parent: string;
  parentMark: string;
  childMark: string;
  child: string;
  line: number;
}

export interface DatabaseMd {
  tables: DocTable[];
  edges: DocEdge[];
  /** Problems outside any one table: a table specified twice, an edge that doesn't parse. */
  problems: string[];
}

interface Fence {
  lang: string;
  start: number;
  lines: string[];
}

function fences(text: string): Fence[] {
  const out: Fence[] = [];
  const lines = text.split("\n");
  let open: Fence | null = null;
  lines.forEach((line, i) => {
    const marker = /^\s*```(.*)$/.exec(line);
    if (open) {
      if (marker && marker[1]?.trim() === "") {
        out.push(open);
        open = null;
      } else open.lines.push(line);
    } else if (marker) {
      open = { lang: marker[1]?.trim() ?? "", start: i + 2, lines: [] };
    }
  });
  if (open) out.push(open);
  return out;
}

/** Splits on commas outside parentheses and braces. */
function splitTop(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of text) {
    if (ch === "(" || ch === "{") depth++;
    if (ch === ")" || ch === "}") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else current += ch;
  }
  parts.push(current);
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

const IDENT = /^[a-z_][a-z0-9_]*$/;

/** One item between the braces (or in `key (...)`), adding its columns and foreign key. */
function readItem(item: string, table: DocTable): void {
  const [left = "", ...arrow] = item.split("→");
  if (arrow.length > 1) {
    table.problems.push(`can't read "${item}": two arrows`);
    return;
  }
  let target: DocForeignKey | null = null;
  if (arrow.length === 1) {
    const m = /^\s*([a-z_][a-z0-9_]*)\s*(?:\(([^)]*)\))?\s*$/.exec(arrow[0] ?? "");
    if (!m?.[1]) {
      table.problems.push(`can't read "${item}": the arrow needs a table name`);
      return;
    }
    const parentColumns = m[2] ? m[2].split(",").map((c) => c.trim()) : null;
    target = { columns: [], parent: m[1], parentColumns };
  }

  const head = left.trim();
  const composite = /^\(([^)]*)\)(\?)?$/.exec(head);
  if (composite) {
    // `(a, b) → t`: a composite foreign key; its columns may also be listed on their own.
    const names = (composite[1] ?? "").split(",").map((c) => c.trim());
    if (!target || names.some((n) => !IDENT.test(n))) {
      table.problems.push(`can't read "${item}": a column tuple needs an arrow`);
      return;
    }
    for (const name of names) {
      if (!table.columns.some((c) => c.name === name)) {
        table.columns.push({ name, optional: composite[2] === "?", annotation: null });
      }
    }
    target.columns = names;
    table.foreignKeys.push(target);
    return;
  }

  const single = /^([a-z_][a-z0-9_]*)(\?)?\s*(?::\s*(.+))?$/.exec(head);
  if (!single?.[1]) {
    table.problems.push(`can't read "${item}"`);
    return;
  }
  const name = single[1];
  const optional = single[2] === "?";
  const annotation = single[3]?.trim() ?? null;
  const seen = table.columns.find((c) => c.name === name);
  if (seen) {
    if (seen.optional !== optional || (annotation && seen.annotation)) {
      table.problems.push(`${name} is listed twice`);
    }
    seen.annotation ??= annotation;
  } else table.columns.push({ name, optional, annotation });
  if (target) {
    target.columns = [name];
    table.foreignKeys.push(target);
  }
}

function readEntry(text: string, line: number): DocTable | null {
  const m = /^([a-z_][a-z0-9_]*)\s*(.*)$/s.exec(text);
  if (!m?.[1]) return null;
  const table: DocTable = {
    name: m[1],
    line,
    key: null,
    columns: [],
    foreignKeys: [],
    problems: [],
  };
  let rest = (m[2] ?? "").trim();

  const key = /^key\s*\(/.exec(rest);
  if (key) {
    let depth = 0;
    let end = -1;
    for (let i = key[0].length - 1; i < rest.length; i++) {
      if (rest[i] === "(") depth++;
      if (rest[i] === ")" && --depth === 0) {
        end = i;
        break;
      }
    }
    if (end < 0) {
      table.problems.push("its key (...) isn't closed");
      return table;
    }
    const items = splitTop(rest.slice(key[0].length, end));
    for (const item of items) readItem(item, table);
    table.key = table.columns.map((c) => c.name);
    rest = rest.slice(end + 1).trim();
  }

  if (rest.startsWith("{")) {
    const close = rest.lastIndexOf("}");
    if (close < 0) {
      table.problems.push("its { ... } isn't closed");
      return table;
    }
    for (const item of splitTop(rest.slice(1, close))) readItem(item, table);
    rest = rest.slice(close + 1).trim();
  } else if (table.key === null) {
    // Only a table whose key is all its columns (a link table) may leave out the braces.
    table.problems.push("it has no { ... } column list");
  }
  if (rest.length > 0) table.problems.push(`unexpected text after its columns: "${rest}"`);
  return table;
}

function stripComments(line: string): string {
  return line.replace(/\/\*.*?\*\//g, "").replace(/\/\/.*$/, "");
}

const EDGE =
  /^\s*([a-z_][a-z0-9_]*)\s+(\|\||\|o|\}o|\}\||o\|)--(\|\||o\||o\{|\|\{|\|o)\s+([a-z_][a-z0-9_]*)\s*(?::.*)?$/;

export function readDatabaseMd(text: string): DatabaseMd {
  const doc: DatabaseMd = { tables: [], edges: [], problems: [] };
  for (const fence of fences(text)) {
    if (fence.lang === "") {
      let entry: { text: string; line: number } | null = null;
      const flush = () => {
        if (!entry) return;
        const table = readEntry(entry.text.trim(), entry.line);
        if (table) doc.tables.push(table);
        else doc.problems.push(`line ${entry.line}: can't read a table name`);
        entry = null;
      };
      fence.lines.forEach((raw, i) => {
        const line = stripComments(raw);
        if (line.trim() === "") return;
        if (/^\S/.test(line)) {
          flush();
          entry = { text: line, line: fence.start + i };
        } else if (entry) entry.text += ` ${line.trim()}`;
        else doc.problems.push(`line ${fence.start + i}: an indented line with no table above it`);
      });
      flush();
    } else if (fence.lang === "mermaid" && fence.lines.some((l) => l.trim() === "erDiagram")) {
      fence.lines.forEach((raw, i) => {
        const line = raw.trim();
        if (line === "" || line === "erDiagram" || line.startsWith("%%")) return;
        const m = EDGE.exec(line);
        if (!m) {
          doc.problems.push(`line ${fence.start + i}: can't read the ERD line "${line}"`);
          return;
        }
        doc.edges.push({
          parent: m[1] ?? "",
          parentMark: m[2] ?? "",
          childMark: m[3] ?? "",
          child: m[4] ?? "",
          line: fence.start + i,
        });
      });
    }
  }
  return doc;
}
