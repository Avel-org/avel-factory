/**
 * T-B4-03 (spike 1 check 2): a program that appends an event and then fails leaves no event and
 * no row. Controls: the same program that goes on to commitWithEvents leaves both; queued events
 * that the program never commits are a defect, not a silent drop.
 */
import { users } from "@avel/db";
import { Effect, Exit } from "effect";
import type pg from "pg";
import { describe, expect, it } from "vitest";
import { Db, Tx } from "../../src/platform/db/db.ts";
import { Events } from "../../src/platform/db/events.ts";
import { NotFound } from "../../src/platform/errors.ts";
import { testDatabase } from "../db/support/database.ts";
import { event, runDb } from "./support/db.ts";

const database = testDatabase("b4events");

const insertUser = (email: string) =>
  Effect.gen(function* () {
    const tx = yield* Tx;
    yield* Effect.promise(() => tx.insert(users).values({ name: "Ev", email }));
  });

const eventCount = async (c: pg.Client, kind: string) =>
  (await c.query("select count(*)::int as n from events where kind = $1", [kind])).rows[0].n;
const userCount = async (c: pg.Client, email: string) =>
  (await c.query("select count(*)::int as n from users where email = $1", [email])).rows[0].n;

describe("T-B4-03 · spike 1 check 2: append then fail leaves no event and no row", () => {
  it("a tagged failure after Events.append: no event, no row", async () => {
    const d = await database();
    const c = await d.client();
    await runDb(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        yield* Effect.exit(
          db.withTransaction(
            Effect.gen(function* () {
              yield* insertUser("ev-fail@avel.test");
              yield* Events.append(event("test.fail"));
              return yield* new NotFound({ message: "gone" });
            }),
          ),
        );
      }),
    );
    expect(await eventCount(c, "test.fail")).toBe(0);
    expect(await userCount(c, "ev-fail@avel.test")).toBe(0);
  });

  it("a failure after commitWithEvents has inserted the events still leaves none", async () => {
    const d = await database();
    const c = await d.client();
    await runDb(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        yield* Effect.exit(
          db.withTransaction(
            Effect.gen(function* () {
              yield* insertUser("ev-late@avel.test");
              yield* Events.append(event("test.late"));
              yield* db.commitWithEvents;
              return yield* new NotFound({ message: "gone" });
            }),
          ),
        );
      }),
    );
    expect(await eventCount(c, "test.late")).toBe(0);
    expect(await userCount(c, "ev-late@avel.test")).toBe(0);
  });

  it("control: the same program that commits with its events leaves the row and the event, in append order", async () => {
    const d = await database();
    const c = await d.client();
    const exit = await runDb(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        yield* db.withTransaction(
          Effect.gen(function* () {
            yield* insertUser("ev-ok@avel.test");
            yield* Events.append(event("test.ok", { n: 1 }));
            yield* Events.append(event("test.ok", { n: 2 }));
            yield* db.commitWithEvents;
          }),
        );
      }),
    );
    expect(Exit.isSuccess(exit)).toBe(true);
    expect(await userCount(c, "ev-ok@avel.test")).toBe(1);
    const rows = await c.query(
      "select seq, schema_version, payload from events where kind = 'test.ok' order by seq",
    );
    expect(rows.rows.map((r) => r.payload.n)).toEqual([1, 2]);
    expect(rows.rows.every((r) => r.schema_version === 1)).toBe(true);
    expect(Number(rows.rows[1].seq)).toBeGreaterThan(Number(rows.rows[0].seq));
  });

  it("queued events with no commitWithEvents: the transaction fails as a defect and commits nothing", async () => {
    const d = await database();
    const c = await d.client();
    const exit = await runDb(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        return yield* Effect.exit(
          db.withTransaction(
            Effect.gen(function* () {
              yield* insertUser("ev-drop@avel.test");
              yield* Events.append(event("test.drop"));
            }),
          ),
        );
      }),
    );
    const inner = Exit.isSuccess(exit) ? exit.value : undefined;
    expect(
      inner && Exit.isFailure(inner) && inner.cause.reasons.some((r) => r._tag === "Die"),
    ).toBe(true);
    expect(await eventCount(c, "test.drop")).toBe(0);
    expect(await userCount(c, "ev-drop@avel.test")).toBe(0);
  });
});
