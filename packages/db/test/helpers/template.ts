// A migrated template database, made once per migration set (A6, Nov 20). Test files clone it with
// CREATE DATABASE ... TEMPLATE instead of each spawning `pnpm --filter @avel/db migrate:up`, which
// was most of the db and server suites' setup time. The template itself is made by that same real
// command, on the real Postgres (Build rules E10). done-when-1 still runs `migrate:up` on an empty
// database, so the proof that the command works stays where it was.
import { createHash, randomBytes } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { baseUrl, ident, lit, pnpmDb, psql, repoRoot, rows, withDatabase } from "./psql.ts";

/** The key the global setup provides and the helpers inject. */
export const TEMPLATE_KEY = "avelDbTemplate";

function files(dir: string): string[] {
  return readdirSync(dir)
    .sort()
    .flatMap((n) => {
      const p = join(dir, n);
      return statSync(p).isDirectory() ? files(p) : [p];
    });
}

/** avel_tpl_<hash of packages/db/drizzle and src/migrate.ts>: a new migration means a new template. */
export function templateName(): string {
  const h = createHash("sha256");
  const db = join(repoRoot, "packages/db");
  for (const f of [...files(join(db, "drizzle")), join(db, "src/migrate.ts")]) {
    h.update(`${relative(db, f)}\0`);
    h.update(readFileSync(f));
    h.update("\0");
  }
  return `avel_tpl_${h.digest("hex").slice(0, 16)}`;
}

function isTemplate(admin: string, name: string): boolean {
  return (
    rows<{ t: boolean }>(
      admin,
      `select datistemplate as t from pg_database where datname = ${lit(name)}`,
    )[0]?.t === true
  );
}

/**
 * The template for the current migrations: reused when it exists, otherwise migrated into a
 * scratch database with the real `migrate:up`, marked as a template, then renamed into place, so
 * no one ever sees a half-made template. Two runs racing (two packages, or two checkouts on the
 * shared server) each build one; the loser drops its copy. Returns no name when `migrate:up`
 * fails, so the tests run it themselves and fail as assertions, never as a setup error.
 */
export function ensureTemplate(): { name?: string; output: string } {
  const name = templateName();
  const admin = withDatabase(baseUrl(), "postgres");
  if (isTemplate(admin, name)) return { name, output: `reused ${name}` };
  const build = `${name}_b${randomBytes(3).toString("hex")}`;
  const made = psql(admin, `create database ${ident(build)};`);
  if (made.status !== 0) return { output: `create database failed: ${made.stderr}` };
  const run = pnpmDb("migrate:up", withDatabase(baseUrl(), build));
  if (run.status !== 0) {
    psql(admin, `drop database if exists ${ident(build)} with (force);`);
    return { output: `migrate:up exited ${run.status}:\n${run.stdout}\n${run.stderr}` };
  }
  psql(admin, `alter database ${ident(build)} is_template true;`);
  const renamed = psql(admin, `alter database ${ident(build)} rename to ${ident(name)};`);
  if (renamed.status !== 0) {
    psql(
      admin,
      `alter database ${ident(build)} is_template false; drop database if exists ${ident(build)} with (force);`,
    );
    if (!isTemplate(admin, name)) return { output: `rename failed: ${renamed.stderr}` };
  }
  return { name, output: `made ${name}` };
}

/** A new database cloned from the template, named like createDatabase's. Retries while another clone holds it. */
export function cloneTemplate(template: string, prefix: string): string {
  const name = `rigg_${prefix}_${randomBytes(4).toString("hex")}`
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");
  const admin = withDatabase(baseUrl(), "postgres");
  let last = "";
  for (let i = 0; i < 20; i++) {
    const r = psql(admin, `create database ${ident(name)} template ${ident(template)};`);
    if (r.status === 0) return withDatabase(baseUrl(), name);
    last = r.stderr;
    if (!/being accessed by other users/.test(last)) break;
    sleepSync(250);
  }
  throw new Error(`create database ${name} from ${template} failed: ${last}`);
}

function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
