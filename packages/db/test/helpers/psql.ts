// Talks to the real Postgres from scripts/pg-local.sh through the `psql` client.
// The workspace has no Postgres driver (package.json is Atlas's), and the db
// suite must run before packages/db exists, so psql is the one dependency-free
// way to reach a real database. Nothing here mocks the database.
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

export const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));

export type Run = { status: number; stdout: string; stderr: string };

let cachedBase: string | undefined;

/** The server's URL: DATABASE_URL, or the throwaway container from scripts/pg-local.sh. */
export function baseUrl(): string {
  if (cachedBase) return cachedBase;
  const fromEnv = process.env.DATABASE_URL;
  if (fromEnv) {
    cachedBase = fromEnv;
  } else {
    const started = spawnSync("scripts/pg-local.sh", ["start"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    cachedBase = started.stdout.trim().split("\n").pop() ?? "";
  }
  return cachedBase;
}

export function withDatabase(url: string, name: string): string {
  const u = new URL(url);
  u.pathname = `/${name}`;
  return u.toString();
}

/** Runs a script on `url`. ON_ERROR_STOP is on, so the first error ends it with a non-zero status. */
export function psql(url: string, script: string): Run {
  const r = spawnSync(
    "psql",
    ["-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-d", url, "-f", "-"],
    {
      input: script,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      env: { ...process.env, PGOPTIONS: "-c client_min_messages=notice", PGCONNECT_TIMEOUT: "20" },
    },
  );
  return { status: r.status ?? -1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** Runs one query and returns its rows as objects. Throws if the query fails. */
export function rows<T = Record<string, unknown>>(url: string, sql: string): T[] {
  const r = psql(
    url,
    `select coalesce(json_agg(q), '[]'::json) from (${sql.replace(/;\s*$/, "")}) q;`,
  );
  if (r.status !== 0) throw new Error(`query failed: ${r.stderr}\n${sql}`);
  return JSON.parse(r.stdout.trim()) as T[];
}

export function lit(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

export function ident(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}

export function createDatabase(prefix: string): string {
  const base = baseUrl();
  const name = `rigg_${prefix}_${randomBytes(4).toString("hex")}`
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");
  const r = psql(withDatabase(base, "postgres"), `create database ${ident(name)};`);
  if (r.status !== 0) throw new Error(`create database failed: ${r.stderr}`);
  return withDatabase(base, name);
}

export function dropDatabase(url: string): void {
  const name = new URL(url).pathname.slice(1);
  psql(withDatabase(baseUrl(), "postgres"), `drop database if exists ${ident(name)} with (force);`);
}

/** The package's own commands, run from the repo root with DATABASE_URL pointing at `url`. */
export function pnpmDb(script: "migrate:up" | "migrate:down", url: string): Run {
  const r = spawnSync("pnpm", ["--filter", "@avel/db", script], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, DATABASE_URL: url },
    timeout: 180_000,
  });
  return {
    status: r.status ?? -1,
    stdout: r.stdout ?? "",
    stderr: `${r.stderr ?? ""}${r.error ? `\n${String(r.error)}` : ""}`,
  };
}

/** A committed copy of a migrated database, for the few tests that need real commits. */
export function cloneDatabase(sourceUrl: string, prefix: string): string {
  const base = baseUrl();
  const name = `rigg_${prefix}_${randomBytes(4).toString("hex")}`
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");
  const r = psql(
    withDatabase(base, "postgres"),
    `create database ${ident(name)} template ${ident(new URL(sourceUrl).pathname.slice(1))};`,
  );
  if (r.status !== 0) throw new Error(`clone failed: ${r.stderr}`);
  return withDatabase(base, name);
}
