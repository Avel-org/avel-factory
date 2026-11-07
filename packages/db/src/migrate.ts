// Applies or reverses the drizzle-kit migrations in drizzle/ on the database in DATABASE_URL.
//
//   node src/migrate.ts up     apply every migration not yet applied (drizzle-orm's migrator)
//   node src/migrate.ts down   reverse every applied migration, newest first, using drizzle/down/<tag>.sql
//
// The package scripts `migrate:up` and `migrate:down` run these. Node runs this file directly
// (type stripping), so it imports only node builtins and packages, never the schema.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));
/** drizzle-orm's own bookkeeping, outside `public`. */
const journalTable = `"drizzle"."__drizzle_migrations"`;

type Journal = { entries: { idx: number; when: number; tag: string }[] };

async function up(client: pg.Client): Promise<void> {
  await migrate(drizzle(client), { migrationsFolder });
}

async function down(client: pg.Client): Promise<void> {
  const journal = JSON.parse(
    readFileSync(join(migrationsFolder, "meta", "_journal.json"), "utf8"),
  ) as Journal;
  const exists = await client.query<{ present: boolean }>(
    `select to_regclass('drizzle.__drizzle_migrations') is not null as present`,
  );
  if (!exists.rows[0]?.present) {
    console.log("migrate:down: no migration has been applied");
    return;
  }
  const applied = await client.query<{ created_at: string }>(
    `select created_at::text as created_at from ${journalTable}`,
  );
  const appliedAt = new Set(applied.rows.map((r) => Number(r.created_at)));
  const toReverse = [...journal.entries].reverse().filter((e) => appliedAt.has(e.when));
  if (toReverse.length === 0) {
    console.log("migrate:down: no migration has been applied");
    return;
  }
  // Read every down file first, so a missing one fails before anything changes.
  const steps = toReverse.map((e) => ({
    entry: e,
    sql: readFileSync(join(migrationsFolder, "down", `${e.tag}.sql`), "utf8"),
  }));
  await client.query("begin");
  try {
    for (const { entry, sql } of steps) {
      await client.query(sql);
      await client.query(`delete from ${journalTable} where created_at = $1`, [entry.when]);
      console.log(`migrate:down: reversed ${entry.tag}`);
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

async function main(): Promise<void> {
  const direction = process.argv[2];
  if (direction !== "up" && direction !== "down") {
    throw new Error("usage: node src/migrate.ts up|down");
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL isn't set");
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    if (direction === "up") await up(client);
    else await down(client);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
