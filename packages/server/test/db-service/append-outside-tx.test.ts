/**
 * T-B4-04 (spike 1 check 2): Events.append outside withTransaction fails to compile. The server's
 * typecheck (`tsc`, which includes test/) is the check: each `@ts-expect-error` below is itself an
 * error if the line compiles. The runtime half proves the same at the edge of the types.
 */
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { Db, type Tx } from "../../src/platform/db/db.ts";
import { Events } from "../../src/platform/db/events.ts";
import { testDatabase } from "../db/support/database.ts";
import { event, runDb } from "./support/db.ts";

const database = testDatabase("b4types");

describe("T-B4-04 · Events.append needs Tx", () => {
  it("its type requires Tx, so it can't be run, or committed, outside withTransaction", () => {
    const append = Events.append(event("test.type"));
    // The requirement is exactly Tx.
    const needsTx: Effect.Effect<void, never, Tx> = append;
    expect(needsTx).toBeDefined();

    // @ts-expect-error Tx is still required, so the effect can't be run as it is.
    void (() => Effect.runPromise(append));

    const inside = Effect.gen(function* () {
      const db = yield* Db;
      // Inside withTransaction the requirement is gone.
      const ok: Effect.Effect<void, unknown, never> = db.withTransaction(append);
      // @ts-expect-error commitWithEvents needs Tx too: only withTransaction provides it.
      const bad: Effect.Effect<void, never, never> = db.commitWithEvents;
      return [ok, bad];
    });
    expect(inside).toBeDefined();
  });

  it("run without a transaction anyway, it dies for want of Tx and stores nothing", async () => {
    const d = await database();
    const c = await d.client();
    await expect(
      Effect.runPromise(Events.append(event("test.untyped")) as unknown as Effect.Effect<void>),
    ).rejects.toBeDefined();
    const exit = await runDb(d.url, Effect.void);
    expect(exit._tag).toBe("Success");
    const rows = await c.query("select count(*)::int as n from events where kind = 'test.untyped'");
    expect(rows.rows[0].n).toBe(0);
  });
});
