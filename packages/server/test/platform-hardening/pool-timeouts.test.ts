/**
 * T-B8-02 and T-B8-03: the pool's timeouts.
 *
 * T-B8-02 needs a connect that hangs *after* DbLive has built: the boot check (`show lc_messages`)
 * takes a connection when the layer is built, so a server that never answers can't even build it.
 * A TCP proxy sits in front of the test's real Postgres: in pass-through it forwards both ways;
 * in hang it accepts new connections and never answers, and switching to it destroys every socket
 * it has proxied. The real clock is unavoidable for a real socket; every wait below is a bound
 * or an event, not a sleep.
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

/** A proxy to `target` that can be switched from pass-through to hang. */
async function proxy(target: string) {
  const to = new URL(target);
  const sockets = new Set<net.Socket>();
  let hanging = false;
  let hungConnections = 0;
  const server = net.createServer((client) => {
    sockets.add(client);
    client.on("error", () => undefined);
    if (hanging) {
      hungConnections += 1;
      return;
    }
    const upstream = net.connect(Number(to.port), to.hostname);
    sockets.add(upstream);
    upstream.on("error", () => client.destroy());
    client.on("error", () => upstream.destroy());
    client.on("close", () => upstream.destroy());
    upstream.on("close", () => client.destroy());
    client.pipe(upstream);
    upstream.pipe(client);
  });
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
  const port = (server.address() as net.AddressInfo).port;
  const destroyAll = () => {
    for (const s of sockets) s.destroy();
  };
  return {
    url: target.replace(`${to.host}`, `127.0.0.1:${port}`),
    /** Connections that reached the proxy after it switched to hang. */
    hungConnections: () => hungConnections,
    /** Switch to hang: destroy what was proxied, and wait until the clients' ends have closed. */
    hang: async () => {
      hanging = true;
      const proxied = [...sockets];
      sockets.clear();
      await Promise.all(
        proxied.map(
          (s) =>
            new Promise<void>((ok) => {
              if (s.destroyed) return ok();
              s.once("close", () => ok());
              s.destroy();
            }),
        ),
      );
      // Let the pool's own sockets see the close, in event-loop turns, not wall-clock time.
      for (let i = 0; i < 20; i++) await new Promise((r) => setImmediate(r));
    },
    destroy: destroyAll,
    close: async () => {
      destroyAll();
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

describe("T-B8-02 · Postgres that stops answering after the layer is built", () => {
  // Quarantined (Build rules F5, Javaris's OK, Nov 18): flaky under a full parallel run, issue #61.
  // T-B13's tests un-quarantine it.
  it.skip("withTransaction fails as a defect within the connect timeout, and an interruption ends it", async () => {
    const d = await database();

    // Timeout: built in pass-through, then hang; the connect gives up on its own.
    const p1 = await proxy(d.url);
    try {
      const run = await within(
        (signal) =>
          Effect.runPromiseExit(
            Effect.gen(function* () {
              const db = yield* Db;
              yield* Effect.promise(() => p1.hang());
              const started = performance.now();
              const inner = yield* Effect.exit(db.withTransaction(Effect.void));
              return { inner, ms: performance.now() - started };
            }).pipe(Effect.provide(dbLayerFor(p1.url, { DATABASE_CONNECT_TIMEOUT_MS: "400" }))),
            { signal },
          ),
        p1,
      );
      expect(run.result, "withTransaction hung past the guard").not.toBe("hung");
      const exit = run.result as Exit.Exit<{ inner: Exit.Exit<void, unknown>; ms: number }>;
      expect(Exit.isSuccess(exit), "the layer failed to build in pass-through").toBe(true);
      if (Exit.isSuccess(exit)) {
        const { inner } = exit.value;
        expect(Exit.isFailure(inner) && hasDie(inner.cause)).toBe(true);
      }
      expect(run.ms).toBeLessThan(GUARD_MS - 500);
      expect(
        p1.hungConnections(),
        "no new connection reached the proxy after the switch: the failure wasn't a pending connect",
      ).toBeGreaterThanOrEqual(1);
    } finally {
      await p1.close();
    }

    // Interruption: a long timeout, and the fiber is interrupted while the connect is pending.
    const p2 = await proxy(d.url);
    try {
      const run = await within(
        (signal) =>
          Effect.runPromiseExit(
            Effect.gen(function* () {
              const db = yield* Db;
              yield* Effect.promise(() => p2.hang());
              const fiber = yield* Effect.forkChild(db.withTransaction(Effect.never));
              yield* Effect.promise(async () => {
                while (p2.hungConnections() === 0) await new Promise((r) => setImmediate(r));
              });
              yield* Fiber.interrupt(fiber);
              yield* Effect.promise(async () => p2.destroy());
            }).pipe(Effect.provide(dbLayerFor(p2.url, { DATABASE_CONNECT_TIMEOUT_MS: "20000" }))),
            { signal },
          ),
        p2,
      );
      expect(run.result, "the interruption didn't end the pending connect").not.toBe("hung");
      expect(run.ms).toBeLessThan(GUARD_MS - 500);
      expect(
        p2.hungConnections(),
        "no new connection reached the proxy after the switch: the connect wasn't pending",
      ).toBeGreaterThanOrEqual(1);
    } finally {
      await p2.close();
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
