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
  /** The sockets of clients that were proxied (not the ones Postgres answers on). */
  const proxied = new Set<net.Socket>();
  let hanging = false;
  let hungConnections = 0;
  const server = net.createServer((client) => {
    sockets.add(client);
    client.on("error", () => undefined);
    if (hanging) {
      hungConnections += 1;
      return;
    }
    proxied.add(client);
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
    /**
     * Switch to hang: end the proxied clients' sockets, and wait until each has closed. An end is a
     * graceful close, so a socket closes only once its peer, the pool's own socket, has ended too:
     * the pool has seen the end and dropped its dead client, which is the fact the test needs.
     * Only the client side is ended: ending Postgres's side too would close the client side by
     * destroying it, before the pool's socket had seen anything. Waiting a number of event-loop
     * turns for it fails under CPU load (T-B27, t-b18-rigg-03).
     */
    hang: async () => {
      hanging = true;
      const ending = [...proxied];
      proxied.clear();
      await Promise.all(
        ending.map(
          (s) =>
            new Promise<void>((ok) => {
              if (s.destroyed) return ok();
              s.once("close", () => ok());
              s.end();
            }),
        ),
      );
    },
    destroy: destroyAll,
    close: async () => {
      destroyAll();
      await new Promise<void>((ok) => server.close(() => ok()));
    },
  };
}

/**
 * Waits, in turns of the event loop and bounded by a count, for the proxy to have accepted a
 * connection: the kernel completed it already, and a loaded process runs the accept late.
 */
async function proxySaw(p: { hungConnections: () => number }) {
  for (let i = 0; i < 10_000 && p.hungConnections() === 0; i++) {
    await new Promise((r) => setImmediate(r));
  }
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
  // T-B13-G01 (#61): back on. Under CPU load the pool's connect timer can fire before this process
  // has run the proxy's accept, so the proxy's count is waited for where it listens, not read the
  // instant the program ends; and the timeout leaves headroom inside the guard.
  it("withTransaction fails as a defect within the connect timeout, and an interruption ends it", async () => {
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
            }).pipe(Effect.provide(dbLayerFor(p1.url, { DATABASE_CONNECT_TIMEOUT_MS: "1000" }))),
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
      await proxySaw(p1);
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
      await proxySaw(p2);
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
