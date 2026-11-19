/**
 * T-B8-04 (t-b4-rigg-05): a backend terminated between two statements inside withTransaction.
 * pg-pool removes its error listener while a client is checked out, so an unhandled 'error' on
 * it would end the process; the program must end as a defect instead.
 */
import { users } from "@avel/db";
import { sql } from "drizzle-orm";
import { Effect, Exit } from "effect";
import { describe, expect, it } from "vitest";
import { Db, Tx } from "../../src/platform/db/db.ts";
import { testDatabase } from "../db/support/database.ts";
import { hasDie, runDb } from "./support.ts";

const database = testDatabase("b8death");

describe("T-B8-04 · a backend that dies mid-transaction", () => {
  it("ends as a defect, the process stays up, and the next withTransaction commits", async () => {
    const d = await database();
    const admin = await d.client();
    const uncaught: unknown[] = [];
    const onUncaught = (error: unknown) => uncaught.push(error);
    process.on("uncaughtException", onUncaught);
    try {
      const exit = await runDb(
        d.url,
        {},
        Effect.gen(function* () {
          const db = yield* Db;
          const killed = yield* Effect.exit(
            db.withTransaction(
              Effect.gen(function* () {
                const tx = yield* Tx;
                const first = yield* Effect.promise(
                  () =>
                    tx.execute(sql`select pg_backend_pid() as pid`) as Promise<{
                      rows: { pid: number }[];
                    }>,
                );
                const pid = first.rows[0]?.pid as number;
                yield* Effect.promise(() => admin.query("select pg_terminate_backend($1)", [pid]));
                // Wait until Postgres has really dropped it (a bound on the other process).
                yield* Effect.promise(async () => {
                  for (let i = 0; i < 200; i++) {
                    const r = await admin.query("select 1 from pg_stat_activity where pid = $1", [
                      pid,
                    ]);
                    if (r.rowCount === 0) return;
                    await new Promise((ok) => setImmediate(ok));
                  }
                });
                yield* Effect.promise(() => tx.execute(sql`select 1`));
              }),
            ),
          );
          yield* db.withTransaction(
            Effect.gen(function* () {
              const tx = yield* Tx;
              yield* Effect.promise(() =>
                tx.insert(users).values({ name: "Dd", email: "after-death@avel.test" }),
              );
            }),
          );
          return killed;
        }),
      );
      expect(Exit.isSuccess(exit), "the program must survive, with the kill as a defect").toBe(
        true,
      );
      const killed = Exit.isSuccess(exit) ? exit.value : undefined;
      expect(killed && Exit.isFailure(killed) && hasDie(killed.cause)).toBe(true);
      const rows = await admin.query(
        "select count(*)::int as n from users where email = 'after-death@avel.test'",
      );
      expect(rows.rows[0].n).toBe(1);
      // Let any late 'error' event on the dead client surface before checking.
      await new Promise((ok) => setImmediate(ok));
      expect(uncaught).toEqual([]);
    } finally {
      process.off("uncaughtException", onUncaught);
    }
  });
});
