/**
 * T-B4-06: test 6 through the Db service. The violations are raised through Tx, the Drizzle
 * transaction, not a raw pg client: Drizzle 0.45.4 wraps the pg error in a DrizzleQueryError with
 * the pg error as `.cause` (t-b3-rigg-01), and withTransaction has to map through it.
 */
import { ErrorBody, REQUEST_ID_HEADER } from "@avel/contract";
import { jobs, users } from "@avel/db";
import { and, eq } from "drizzle-orm";
import { Cause, Effect, Exit } from "effect";
import { describe, expect, it } from "vitest";
import { Db, Tx } from "../../src/platform/db/db.ts";
import { requireUpdated } from "../../src/platform/db/errors.ts";
import { AlreadyExists, ConstraintViolation, StaleVersion } from "../../src/platform/errors.ts";
import { testDatabase } from "../db/support/database.ts";
import { appRunning, fixedIds, get } from "../support/harness.ts";
import { dbLayer, runDb } from "./support/db.ts";

const ID = "0193a000-0000-7000-8000-0000000000ee";
const database = testDatabase("b4errors");

const insertUser = (email: string) =>
  Effect.gen(function* () {
    const tx = yield* Tx;
    yield* Effect.promise(() => tx.insert(users).values({ name: "Er", email }));
  });

const badJob = (key: string) =>
  Effect.gen(function* () {
    const tx = yield* Tx;
    yield* Effect.promise(() => tx.insert(jobs).values({ kind: "k", key, state: "not-a-state" }));
  });

/** A versioned update at row_version 1 on a job already at version 2. */
const staleUpdate = (key: string) =>
  Effect.gen(function* () {
    const tx = yield* Tx;
    yield* Effect.promise(() => tx.insert(jobs).values({ kind: "k", key }));
    yield* Effect.promise(() => tx.update(jobs).set({ lastError: null }).where(eq(jobs.key, key)));
    const rows = yield* Effect.promise(() =>
      tx
        .update(jobs)
        .set({ lastError: "x" })
        .where(and(eq(jobs.key, key), eq(jobs.rowVersion, 1)))
        .returning({ id: jobs.id }),
    );
    return yield* requireUpdated(rows, 2);
  });

const failureOf = <A, E>(exit: Exit.Exit<A, E>) => {
  if (!Exit.isFailure(exit)) throw new Error("expected a failure");
  const found = Cause.findError(exit.cause);
  if (found._tag === "Failure") return found.failure as E;
  throw new Error(`expected a typed failure, got ${Cause.pretty(exit.cause)}`);
};

describe("T-B4-06 · database errors through withTransaction", () => {
  it("a unique violation raised through Tx is AlreadyExists naming the constraint", async () => {
    const d = await database();
    const exit = await runDb(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        yield* db.withTransaction(insertUser("dup@avel.test"));
        return yield* Effect.exit(db.withTransaction(insertUser("dup@avel.test")));
      }),
    );
    const inner = Exit.isSuccess(exit) ? exit.value : undefined;
    const error = failureOf(inner as Exit.Exit<void, AlreadyExists>);
    expect(error).toBeInstanceOf(AlreadyExists);
    expect(error.details).toEqual({ constraint: "users_email_uq" });
  });

  it("a CHECK violation raised through Tx is ConstraintViolation naming the CHECK", async () => {
    const d = await database();
    const exit = await runDb(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        return yield* Effect.exit(db.withTransaction(badJob("chk-1")));
      }),
    );
    const inner = Exit.isSuccess(exit) ? exit.value : undefined;
    const error = failureOf(inner as Exit.Exit<void, ConstraintViolation>);
    expect(error).toBeInstanceOf(ConstraintViolation);
    expect(error.details).toEqual({ constraint: "jobs_state_ck" });
  });

  it("a stale rowVersion update through Tx is StaleVersion with the current version", async () => {
    const d = await database();
    const exit = await runDb(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        return yield* Effect.exit(db.withTransaction(staleUpdate("stale-1")));
      }),
    );
    const inner = Exit.isSuccess(exit) ? exit.value : undefined;
    const error = failureOf(inner as Exit.Exit<unknown, StaleVersion>);
    expect(error).toBeInstanceOf(StaleVersion);
    expect(error.details).toEqual({ field: "rowVersion", currentVersion: 2 });
  });

  it("a violation rolls the transaction back, and the pool takes the next one", async () => {
    const d = await database();
    const c = await d.client();
    await runDb(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        yield* Effect.exit(
          db.withTransaction(
            Effect.gen(function* () {
              yield* insertUser("rb-map@avel.test");
              yield* badJob("chk-2");
            }),
          ),
        );
        yield* db.withTransaction(insertUser("rb-map-2@avel.test"));
      }),
    );
    const rows = await c.query("select email from users where email like 'rb-map%' order by email");
    expect(rows.rows.map((r) => r.email)).toEqual(["rb-map-2@avel.test"]);
  });

  it("an error that is not one of ours stays a defect", async () => {
    const d = await database();
    const exit = await runDb(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        return yield* Effect.exit(
          db.withTransaction(
            Effect.gen(function* () {
              const tx = yield* Tx;
              // Not a constraint: the table doesn't exist.
              yield* Effect.promise(() => tx.execute("select * from no_such_table" as never));
            }),
          ),
        );
      }),
    );
    const inner = Exit.isSuccess(exit) ? exit.value : undefined;
    expect(
      inner && Exit.isFailure(inner) && inner.cause.reasons.some((r) => r._tag === "Die"),
    ).toBe(true);
  });

  it("reaches HTTP as 409 ALREADY_EXISTS and 422 CONSTRAINT_VIOLATION with the requestId", async () => {
    const d = await database();
    await runDb(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        yield* db.withTransaction(insertUser("http-dup@avel.test"));
      }),
    );
    const through = (program: Effect.Effect<unknown, AlreadyExists | ConstraintViolation, Db>) =>
      appRunning(() => program.pipe(Effect.provide(dbLayer(d.url))), { layer: fixedIds(ID) });

    const dup = through(
      Effect.gen(function* () {
        const db = yield* Db;
        return yield* db.withTransaction(insertUser("http-dup@avel.test"));
      }),
    );
    const res409 = await get(dup, "/api/health");
    expect(res409.status).toBe(409);
    const b409 = ErrorBody.parse(await res409.json());
    expect(b409.code).toBe("ALREADY_EXISTS");
    expect(b409.details).toEqual({ constraint: "users_email_uq" });
    expect(b409.requestId).toBe(ID);
    expect(res409.headers.get(REQUEST_ID_HEADER)).toBe(ID);

    const bad = through(
      Effect.gen(function* () {
        const db = yield* Db;
        return yield* db.withTransaction(badJob("http-chk"));
      }),
    );
    const res422 = await get(bad, "/api/health");
    expect(res422.status).toBe(422);
    const b422 = ErrorBody.parse(await res422.json());
    expect(b422.code).toBe("CONSTRAINT_VIOLATION");
    expect(b422.requestId).toBe(ID);
  });
});
