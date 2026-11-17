/**
 * Harness for T-B3's tests, reused by T-B4's: each test file gets its own migrated database on
 * the real Postgres from scripts/pg-local.sh (E10), made on first use and dropped when the file
 * ends. The migration runs through `@avel/db`'s own `migrate:up`. Nothing here mocks Postgres.
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { afterAll } from "vitest";

const repoRoot = fileURLToPath(new URL("../../../../../", import.meta.url));

function baseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url)
    throw new Error("DATABASE_URL is not set: export DATABASE_URL=$(scripts/pg-local.sh start)");
  return url;
}

function withDatabase(url: string, name: string): string {
  const u = new URL(url);
  u.pathname = `/${name}`;
  return u.toString();
}

async function admin<T>(use: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: withDatabase(baseUrl(), "postgres") });
  await c.connect();
  try {
    return await use(c);
  } finally {
    await c.end();
  }
}

export interface TestDatabase {
  readonly name: string;
  readonly url: string;
  /** A connected client; ended when the file ends. */
  client(): Promise<pg.Client>;
}

/**
 * Call once per file at the top level; call the returned function inside a test. The first call
 * creates and migrates this file's database. Each call to `testDatabase` makes a different one.
 */
export function testDatabase(label: string): () => Promise<TestDatabase> {
  let made: Promise<TestDatabase> | undefined;
  const clients: pg.Client[] = [];
  const name = `rigg_${label}_${randomBytes(4).toString("hex")}`
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");

  afterAll(async () => {
    await Promise.all(clients.map((c) => c.end().catch(() => undefined)));
    if (made) {
      await admin((c) => c.query(`drop database if exists "${name}" with (force)`));
    }
  }, 60_000);

  return () => {
    made ??= (async () => {
      await admin((c) => c.query(`create database "${name}"`));
      const url = withDatabase(baseUrl(), name);
      const run = spawnSync("pnpm", ["--filter", "@avel/db", "migrate:up"], {
        cwd: repoRoot,
        encoding: "utf8",
        env: { ...process.env, DATABASE_URL: url },
        timeout: 180_000,
      });
      if (run.status !== 0) {
        throw new Error(`migrate:up exited ${run.status}:\n${run.stdout}\n${run.stderr}`);
      }
      return {
        name,
        url,
        async client() {
          const c = new pg.Client({ connectionString: url });
          await c.connect();
          clients.push(c);
          return c;
        },
      };
    })();
    return made;
  };
}
