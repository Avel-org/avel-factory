import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Black-box helpers for the @avel/docs tests. The generators are run the way CI
// runs them (`pnpm --filter @avel/docs run <script>`), so a test fails with an
// assertion on what the script produced, never with an import error.
//
// The interface these tests lock (Atlas builds to it):
//   generate  writes erd.md and openapi.json into $AVEL_DOCS_OUT
//             (default: docs/generated/ at the repo root); prints nothing required.
//   drift     compares the schema with the DATABASE.md at $AVEL_DOCS_DATABASE_MD
//             (default: docs/design/DATABASE.md). Drift: exit 1, and the output
//             names each table, column or relationship that differs. No drift:
//             exit 0 and the output says "no drift".
//
// pnpm exits 0 when --filter matches no package, so a test never treats exit 0
// alone as success: it also checks the output or the files.

export const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
export const databaseMdPath = join(repoRoot, "docs/design/DATABASE.md");
export const generatedDir = join(repoRoot, "docs/generated");

export type RunResult = { status: number | null; output: string };

export function runDocs(script: "generate" | "drift", env: Record<string, string> = {}): RunResult {
  const result = spawnSync("pnpm", ["--filter", "@avel/docs", "run", script], {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout: 100_000,
  });
  return { status: result.status, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

export function tempDir(label: string): string {
  return mkdtempSync(join(tmpdir(), `avel-docs-${label}-`));
}

export function generateInto(dir: string): RunResult {
  return runDocs("generate", { AVEL_DOCS_OUT: dir });
}

export function readText(path: string): string {
  return readFileSync(path, "utf8");
}

// A copy of the real DATABASE.md, to plant a mismatch in. The real file is never touched.
export function databaseMdCopy(label: string): string {
  const copy = join(tempDir(label), "DATABASE.md");
  copyFileSync(databaseMdPath, copy);
  return copy;
}

export function driftAgainst(path: string): RunResult {
  return runDocs("drift", { AVEL_DOCS_DATABASE_MD: path });
}

// The map's tables: `const ERD = {...};` in the database map, one line.
export function mapTableNames(): string[] {
  const html = readText(join(repoRoot, "docs/design/AVEL Database Map.html"));
  const line = html.split("\n").find((l) => l.startsWith("const ERD ="));
  if (!line) throw new Error("the database map has no `const ERD =` line");
  const erd = JSON.parse(line.slice("const ERD =".length).trim().replace(/;$/, ""));
  return erd.tables.map((t: { name: string }) => t.name);
}

// Step 0's tables: the map's 91, plus design_systems (decisions B9). The map has no outbox.
export function step0TableNames(): string[] {
  return [...mapTableNames(), "design_systems"].sort();
}

const METHODS = "GET|POST|PUT|PATCH|DELETE";
const LIBRARY_KINDS = ["skills", "kb-entries", "rules", "templates"];

// contract.md section 2: the 102 routes, as "METHOD /path" (query strings dropped).
// Table rows carry one route each, except the Library group row (74-77), which
// names the four routes for skills; the same four repeat for each library kind.
export function contractRoutes(): string[] {
  const text = readText(join(repoRoot, "docs/agent-dispatch/backend/sprint-00/contract.md"));
  const start = text.indexOf("## 2. Routes");
  const end = text.indexOf("**Total: 102.**");
  if (start < 0 || end < 0) throw new Error("contract.md section 2 not found");
  const routes = new Set<string>();
  const single = new RegExp(`^\\|.*?\`(${METHODS}) (/api/[^\`?]*)(?:\\?[^\`]*)?\``, "gm");
  for (const line of text.slice(start, end).split("\n")) {
    if (!line.startsWith("|")) continue;
    if (line.startsWith("| 74")) continue; // the Library group row, expanded below
    single.lastIndex = 0;
    const m = single.exec(line);
    if (m) routes.add(`${m[1]} ${m[2]}`);
  }
  for (const kind of LIBRARY_KINDS) {
    routes.add(`GET /api/library/${kind}`);
    routes.add(`POST /api/library/${kind}`);
    routes.add(`GET /api/library/${kind}/{itemId}`);
    routes.add(`PATCH /api/library/${kind}/{itemId}`);
  }
  return [...routes].sort();
}
