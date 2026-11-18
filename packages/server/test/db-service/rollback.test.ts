/**
 * T-B4-02: a program that fails with a tagged error, dies, or is interrupted is rolled back, and
 * the pool client is released each time.
 *
 * "Released" is observed two ways: no backend of this database is left `idle in transaction`
 * (a client handed back mid-transaction, or never), and more runs than the pool has clients
 * (pg's default max is 10) still complete, which a leak per run could not.
 */
import { users } from "@avel/db";
import { Deferred, Effect, Exit, Fiber } from "effect";
import type pg from "pg";
import { describe, expect, it } from "vitest";
import { Db, Tx } from "../../src/platform/db/db.ts";
import { NotFound } from "../../src/platform/errors.ts";
import { testDatabase } from "../db/support/database.ts";
import { runDb } from "./support/db.ts";

const database = testDatabase("b4rollback");
const RUNS = 14;

const insertUser = (email: string) =>
  Effect.gen(function* () {
    const tx = yield* Tx;
    yield* Effect.promise(() => tx.insert(users).values({ name: "Rb", email }));
  });

async function openTransactions(admin: pg.Client, name: string): Promise<number> {
  const r = await admin.query(
    "select count(*)::int as n from pg_stat_activity where datname = $1 and state like 'idle in transaction%'",
    [name],
  );
  return r.rows[0].n;
}

async function userCount(client: pg.Client, prefix: string): Promise<number> {
  const r = await client.query("select count(*)::int as n from users where email like $1", [
    `${prefix}%`,
  ]);
  return r.rows[0].n;
}

describe("T-B4-02 · a failed, dead or interrupted program is rolled back and its client released", () => {
  it("a tagged failure reaches the caller as itself and leaves no row", async () => {
    const d = await database();
    const client = await d.client();
    const exit = await runDb(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        const failed = yield* Effect.exit(
          db.withTransaction(
            Effect.gen(function* () {
              yield* insertUser("rb-fail@avel.test");
              return yield* new NotFound({ message: "gone" });
            }),
          ),
        );
        return failed;
      }),
    );
    expect(Exit.isSuccess(exit)).toBe(true);
    const inner = Exit.isSuccess(exit) ? exit.value : undefined;
    expect(inner && Exit.isFailure(inner)).toBe(true);
    const error = inner && Exit.isFailure(inner) ? inner.cause.reasons : [];
    expect(JSON.stringify(error)).toContain("NotFound");
    expect(await userCount(client, "rb-fail")).toBe(0);
  });

  it("a defect rolls back, stays a defect, and leaves no row", async () => {
    const d = await database();
    const client = await d.client();
    const exit = await runDb(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        return yield* Effect.exit(
          db.withTransaction(
            Effect.gen(function* () {
              yield* insertUser("rb-die@avel.test");
              return yield* Effect.die(new Error("boom"));
            }),
          ),
        );
      }),
    );
    const inner = Exit.isSuccess(exit) ? exit.value : undefined;
    expect(
      inner && Exit.isFailure(inner) && inner.cause.reasons.some((r) => r._tag === "Die"),
    ).toBe(true);
    expect(await userCount(client, "rb-die")).toBe(0);
  });

  it("an interrupted program rolls back and leaves no row", async () => {
    const d = await database();
    const client = await d.client();
    await runDb(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        const started = yield* Deferred.make<void>();
        const fiber = yield* Effect.forkChild(
          db.withTransaction(
            Effect.gen(function* () {
              yield* insertUser("rb-int@avel.test");
              yield* Deferred.succeed(started, undefined);
              return yield* Effect.never;
            }),
          ),
        );
        yield* Deferred.await(started);
        yield* Fiber.interrupt(fiber);
      }),
    );
    expect(await userCount(client, "rb-int")).toBe(0);
  });

  it(`releases the client every time: ${RUNS} runs of each kind, more than the pool holds, leave nothing open`, async () => {
    const d = await database();
    const client = await d.client();
    const exit = await runDb(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        for (let i = 0; i < RUNS; i++) {
          yield* Effect.exit(
            db.withTransaction(
              Effect.gen(function* () {
                yield* insertUser(`rl-fail-${i}@avel.test`);
                return yield* new NotFound({ message: "gone" });
              }),
            ),
          );
          yield* Effect.exit(
            db.withTransaction(
              Effect.gen(function* () {
                yield* insertUser(`rl-die-${i}@avel.test`);
                return yield* Effect.die(new Error("boom"));
              }),
            ),
          );
          const started = yield* Deferred.make<void>();
          const fiber = yield* Effect.forkChild(
            db.withTransaction(
              Effect.gen(function* () {
                yield* insertUser(`rl-int-${i}@avel.test`);
                yield* Deferred.succeed(started, undefined);
                return yield* Effect.never;
              }),
            ),
          );
          yield* Deferred.await(started);
          yield* Fiber.interrupt(fiber);
        }
        // The pool is still usable, and this one commits.
        yield* db.withTransaction(insertUser("rl-after@avel.test"));
        // Still inside the layer: the pool is open, so a leaked client would show here.
        return yield* Effect.promise(() => openTransactions(client, d.name));
      }),
    );
    expect(Exit.isSuccess(exit) && exit.value).toBe(0);
    expect(await userCount(client, "rl-fail")).toBe(0);
    expect(await userCount(client, "rl-die")).toBe(0);
    expect(await userCount(client, "rl-int")).toBe(0);
    expect(await userCount(client, "rl-after")).toBe(1);
  });
});
