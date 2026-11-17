import { canon, type Tbl } from "./model.ts";

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

function byName<T extends { name: string }>(list: T[]): Map<string, T> {
  return new Map(list.map((x) => [x.name, x]));
}

function compareNamed<T extends { name: string }>(
  kind: string,
  a: T[],
  b: T[],
  equal: (x: T, y: T) => boolean,
  keys: string[],
): void {
  const ma = byName(a);
  const mb = byName(b);
  for (const [name, x] of ma) {
    const y = mb.get(name);
    if (!y) keys.push(`${kind}- ${name}`);
    else if (!equal(x, y)) keys.push(`${kind}~ ${name}`);
  }
  for (const name of mb.keys()) if (!ma.has(name)) keys.push(`${kind}+ ${name}`);
}

/** Every difference between two schemas, as keys like `column+ missions.kind` (in `b`, not in `a`) or `check~ x` (changed). */
export function diffSchemas(a: Tbl[], b: Tbl[]): string[] {
  const keys: string[] = [];
  const ta = byName(a);
  const tb = byName(b);
  for (const name of ta.keys()) if (!tb.has(name)) keys.push(`table- ${name}`);
  for (const name of tb.keys()) if (!ta.has(name)) keys.push(`table+ ${name}`);
  for (const [name, x] of ta) {
    const y = tb.get(name);
    if (!y) continue;
    const colKey = (c: { name: string }) => ({ ...c, name: `${name}.${c.name}` });
    compareNamed(
      "column",
      x.columns.map(colKey),
      y.columns.map(colKey),
      (p, q) => same(p, q),
      keys,
    );
    if (!same(x.primaryKey, y.primaryKey)) keys.push(`pk~ ${name}`);
    if (x.partitioned !== y.partitioned) keys.push(`partitioned~ ${name}`);
    compareNamed("fk", x.foreignKeys, y.foreignKeys, (p, q) => same(p, q), keys);
    compareNamed("check", x.checks, y.checks, (p, q) => canon(p.def) === canon(q.def), keys);
    compareNamed(
      "unique",
      x.uniques,
      y.uniques,
      (p, q) => same(p.cols, q.cols) && canon(p.where ?? "") === canon(q.where ?? ""),
      keys,
    );
    compareNamed("index", x.indexes, y.indexes, (p, q) => canon(p.def) === canon(q.def), keys);
    compareNamed("trigger", x.triggers, y.triggers, (p, q) => p.def === q.def, keys);
  }
  return keys.sort();
}
