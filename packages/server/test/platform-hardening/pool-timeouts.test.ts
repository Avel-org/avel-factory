/**
 * T-B8-02 and T-B8-03: the pool's timeouts.
 *
 * A connect that hangs can't be made by a closed port (that is refused at once), so the server
 * here accepts the TCP connection and never answers: the Postgres handshake waits for ever.
 * The real clock is unavoidable for a real socket; every wait below is a bound, not a sleep.
 */
import net from "node:net";
import { users } from "@avel/db";
import { sql } from "drizzle-orm";
import { Effect, Exit, Fiber } from "effect";
import type pg from "pg";
import { describe, expect, it } from "vitest";
import { Db, Tx } from "../../src/platform/db/db.ts";
import { testDatabase } from "../db/support/database.ts";
import { dbLayer as dbLayerFor, hasDie, runDb } from "./support.ts";

const database = testDatabase("b8pool");
const GUARD_MS = 4_000;

async function blackHole() {
  const sockets = new Set<net.Socket>();
  let connected = 0;
  const server = net.createServer((socket) => {
    sockets.add(socket);
    connected += 1;
    socket.on("error", () => undefined);
  });
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
  const port = (server.address() as net.AddressInfo).port;
  return {
    url: `postgres://avel:avel@127.0.0.1:${port}/avel`,
    connections: () => connected,
    destroy: () => {
      for (const s of sockets) s.destroy();
    },
    close: async () => {
      for (const s of sockets) s.destroy();
      await new Promise<void>((ok) => server.close(() => ok()));
    },
  };
}

/** The program's exit, or "hung" if it hasn't ended inside the guard. */
async function within<A, E>(
  start: (signal: AbortSignal) => Promise<Exit.Exit<A, E>>,
  hole: { destroy: () => void },
) {
  const abort = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  const guard = new Promise<"hung">((ok) => {
    timer = setTimeout(() => ok("hung"), GUARD_MS);
  });
  const began = performance.now();
  const result = await Promise.race([start(abort.signal), guard]);
  clearTimeout(timer);
  if (result === "hung") {
    abort.abort();
    hole.destroy();
  }
  return { result, ms: performance.now() - began };
}

describe("T-B8-02 · Postgres that never answers", () => {
  it("withTransaction fails as a defect within the connect timeout, and an interruption ends it", async () => {
    // Timeout: the connect gives up on its own.
    const hole = await blackHole();
    try {
      const run = await within(
        (signal) =>
          Effect.runPromiseExit(
            Effect.gen(function* () {
              const db = yield* Db;
              return yield* Effect.exit(db.withTransaction(Effect.void));
            }).pipe(Effect.provide(dbLayerFor(hole.url, { DATABASE_CONNECT_TIMEOUT_MS: "400" }))),
            { signal },
          ),
        hole,
      );
      expect(run.result, "withTransaction hung past the guard").not.toBe("hung");
      const exit = run.result as Exit.Exit<Exit.Exit<void, unknown>>;
      const inner = Exit.isSuccess(exit) ? exit.value : undefined;
      expect(inner && Exit.isFailure(inner) && hasDie(inner.cause)).toBe(true);
      expect(run.ms).toBeLessThan(GUARD_MS - 500);
    } finally {
      await hole.close();
    }

    // Interruption: a long timeout, and the fiber is interrupted while the connect is pending.
    const hole2 = await blackHole();
    try {
      const run = await within(
        (signal) =>
          Effect.runPromiseExit(
            Effect.gen(function* () {
              const db = yield* Db;
              const fiber = yield* Effect.forkChild(db.withTransaction(Effect.never));
              yield* Effect.promise(async () => {
                while (hole2.connections() === 0) await new Promise((r) => setImmediate(r));
              });
              yield* Fiber.interrupt(fiber);
              yield* Effect.promise(async () => hole2.destroy());
            }).pipe(
              Effect.provide(dbLayerFor(hole2.url, { DATABASE_CONNECT_TIMEOUT_MS: "20000" })),
            ),
            { signal },
          ),
        hole2,
      );
      expect(run.result, "the interruption didn't end the pending connect").not.toBe("hung");
      expect(run.ms).toBeLessThan(GUARD_MS - 500);
    } finally {
      await hole2.close();
    }
  });
});

async function openTransactions(admin: pg.Client, name: string): Promise<number> {
  const r = await admin.query(
    "select count(*)::int as n from pg_stat_activity where datname = $1 and state like 'idle in transaction%'",
    [name],
  );
  return r.rows[0].n;
}

describe("T-B8-03 · a statement past the statement timeout", () => {
  it("ends as a defect and the pool client is released (11 runs, more than the pool holds)", async () => {
    const d = await database();
    const admin = await d.client();
    const RUNS = 11;
    const exit = await runDb(
      d.url,
      { DATABASE_STATEMENT_TIMEOUT_MS: "200" },
      Effect.gen(function* () {
        const db = yield* Db;
        const outcomes: boolean[] = [];
        for (let i = 0; i < RUNS; i++) {
          const inner = yield* Effect.exit(
            db.withTransaction(
              Effect.gen(function* () {
                const tx = yield* Tx;
                yield* Effect.promise(() => tx.execute(sql`select pg_sleep(1)`));
              }),
            ),
          );
          outcomes.push(Exit.isFailure(inner) && hasDie(inner.cause));
        }
        yield* db.withTransaction(
          Effect.gen(function* () {
            const tx = yield* Tx;
            yield* Effect.promise(() =>
              tx.insert(users).values({ name: "St", email: "st@avel.test" }),
            );
          }),
        );
        const open = yield* Effect.promise(() => openTransactions(admin, d.name));
        return { outcomes, open };
      }),
    );
    expect(Exit.isSuccess(exit)).toBe(true);
    if (!Exit.isSuccess(exit)) return;
    expect(exit.value.outcomes).toEqual(Array(RUNS).fill(true));
    expect(exit.value.open).toBe(0);
    const rows = await admin.query(
      "select count(*)::int as n from users where email = 'st@avel.test'",
    );
    expect(rows.rows[0].n).toBe(1);
  });
});
