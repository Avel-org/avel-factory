import { afterAll, expect, inject, vi } from "vitest";
import { createDatabase, dropDatabase, pnpmDb, rows } from "./psql.ts";
import { cloneTemplate, TEMPLATE_KEY } from "./template.ts";

type Made = { url: string; status: number; output: string };

/**
 * A database with the migrations applied, made on first use and dropped
 * when the file ends. Tests use it through rolled-back transactions.
 * It's a clone of the template the global setup migrated with the package's
 * own command (`migrate:up`, the one the build's done-when names); with no
 * template, the file runs `migrate:up` itself. Call it inside a test, so a
 * missing build fails as an assertion in that test, never as a setup error.
 */
export function migratedDb(label: string): () => string {
  vi.setConfig({ testTimeout: 180_000, hookTimeout: 180_000 });
  let made: Made | undefined;
  afterAll(() => {
    if (made) dropDatabase(made.url);
  });
  return () => {
    if (!made) {
      const template = inject(TEMPLATE_KEY);
      if (template) {
        made = { url: cloneTemplate(template, label), status: 0, output: `cloned ${template}` };
      } else {
        const url = createDatabase(label);
        const run = pnpmDb("migrate:up", url);
        const output = `${run.stdout}\n${run.stderr}`.trim().split("\n").slice(-6).join("\n");
        made = { url, status: run.status, output };
      }
    }
    expect(
      made.status,
      `\`pnpm --filter @avel/db migrate:up\` must exit 0 on an empty database; it exited ${made.status}:\n${made.output}`,
    ).toBe(0);
    // pnpm exits 0 when no package matches the filter, so the exit status alone proves nothing
    const tables =
      rows<{ n: number }>(
        made.url,
        "select count(*)::int as n from pg_class c join pg_namespace s on s.oid = c.relnamespace where s.nspname = 'public' and c.relkind in ('r', 'p')",
      )[0]?.n ?? 0;
    expect(
      tables,
      "`migrate:up` must create the schema's tables in the public schema (it created none)",
    ).toBeGreaterThan(80);
    return made.url;
  };
}
