/**
 * T-B8-06 and T-B8-07: the idempotency store over idempotency_keys, through Db, with time from
 * the Clock (TestClock here). Not wired into routes until T-B10 and T-B11.
 */
import { ErrorBody, REQUEST_ID_HEADER } from "@avel/contract";
import { it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { TestClock } from "effect/testing";
import { describe, expect } from "vitest";
import { errorTable } from "../../src/platform/errors.ts";
import { Idempotency, IdempotencyLive } from "../../src/platform/idempotency.ts";
import { testDatabase } from "../db/support/database.ts";
import { appRunning, fixedIds, get } from "../support/harness.ts";
import { dbLayer } from "./support.ts";

const database = testDatabase("b8idem");
const T0 = Date.UTC(2026, 10, 18, 12, 0, 0);
const DAY = 24 * 60 * 60 * 1000;
const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const ID = "0193a000-0000-7000-8000-0000000008a6";

const storeFor = (url: string) => IdempotencyLive.pipe(Layer.provide(Layer.orDie(dbLayer(url))));

/** A fresh database per test body, so keys never collide. */
const withStore = <A, E>(
  use: (url: string, store: Idempotency["Service"]) => Effect.Effect<A, E>,
) =>
  Effect.gen(function* () {
    const d = yield* Effect.promise(() => database());
    yield* TestClock.setTime(T0);
    return yield* Effect.gen(function* () {
      const store = yield* Idempotency;
      return yield* use(d.url, store);
    }).pipe(Effect.provide(storeFor(d.url)));
  });

describe("T-B8-06 · begin and complete", () => {
  it.effect("new, then replay, reused, in progress, and one principal never answers another", () =>
    withStore((url, store) =>
      Effect.gen(function* () {
        const first = yield* store.begin("user-1", "key-1", "POST /x", HASH_A);
        expect(first).toEqual({ _tag: "New" });

        // A second begin before complete is IDEMPOTENCY_IN_PROGRESS.
        const running = yield* Effect.flip(store.begin("user-1", "key-1", "POST /x", HASH_A));
        expect(running._tag).toBe("IdempotencyInProgress");
        expect(errorTable[running._tag]).toBe("IDEMPOTENCY_IN_PROGRESS");

        yield* store.complete(
          "user-1",
          "key-1",
          201,
          { id: "res-1", ok: true },
          { sensitive: false },
        );

        const replay = yield* store.begin("user-1", "key-1", "POST /x", HASH_A);
        expect(replay).toEqual({
          _tag: "Replay",
          status: 201,
          response: { id: "res-1", ok: true },
        });

        // Another body, or another route, with the same key.
        const otherBody = yield* Effect.flip(store.begin("user-1", "key-1", "POST /x", HASH_B));
        expect(otherBody._tag).toBe("IdempotencyKeyReused");
        expect(errorTable[otherBody._tag]).toBe("IDEMPOTENCY_KEY_REUSED");
        const otherRoute = yield* Effect.flip(store.begin("user-1", "key-1", "POST /y", HASH_A));
        expect(otherRoute._tag).toBe("IdempotencyKeyReused");

        // Another principal's identical key is its own: new, not a replay of user-1's.
        const other = yield* store.begin("user-2", "key-1", "POST /x", HASH_A);
        expect(other).toEqual({ _tag: "New" });
        // And user-1's replay is untouched by it.
        const again = yield* store.begin("user-1", "key-1", "POST /x", HASH_A);
        expect(again).toEqual({ _tag: "Replay", status: 201, response: { id: "res-1", ok: true } });

        // The first row expires 24 hours after it began (Clock, not the database's clock).
        const admin = yield* Effect.promise(async () => (await database()).client());
        const row = yield* Effect.promise(() =>
          admin.query(
            "select (extract(epoch from expires_at) * 1000)::float8 as ms, status from idempotency_keys where principal = 'user-1' and key = 'key-1'",
          ),
        );
        expect(row.rows[0].ms).toBe(T0 + DAY);
        expect(row.rows[0].status).toBe("completed");
        expect(url).toBeTruthy();
      }),
    ),
  );

  it.effect("reaches HTTP as 409 IDEMPOTENCY_KEY_REUSED with the requestId", () =>
    Effect.gen(function* () {
      const d = yield* Effect.promise(() => database());
      const app = appRunning(
        () =>
          Effect.gen(function* () {
            const store = yield* Idempotency;
            yield* store.begin("http-user", "http-key", "POST /x", HASH_A);
            yield* store.complete("http-user", "http-key", 200, { ok: true }, { sensitive: false });
            return yield* store.begin("http-user", "http-key", "POST /x", HASH_B);
          }).pipe(Effect.provide(storeFor(d.url))),
        { layer: fixedIds(ID) },
      );
      const res = yield* Effect.promise(() => get(app, "/api/health"));
      expect(res.status).toBe(409);
      const body = ErrorBody.parse(yield* Effect.promise(() => res.json()));
      expect(body.code).toBe("IDEMPOTENCY_KEY_REUSED");
      expect(body.requestId).toBe(ID);
      expect(res.headers.get(REQUEST_ID_HEADER)).toBe(ID);
    }),
  );
});

describe("T-B8-07 · sensitive responses and expiry", () => {
  it.effect(
    "a sensitive response is never stored and its replay is TOKEN_REPLAYED; a key past 24 hours is new",
    () =>
      withStore((_url, store) =>
        Effect.gen(function* () {
          const TOKEN = "tok_super-secret-value-1234";
          yield* store.begin("user-1", "tok-key", "POST /token", HASH_A);
          yield* store.complete("user-1", "tok-key", 201, { token: TOKEN }, { sensitive: true });

          const admin = yield* Effect.promise(async () => (await database()).client());
          const row = yield* Effect.promise(() =>
            admin.query(
              "select * from idempotency_keys where principal = 'user-1' and key = 'tok-key'",
            ),
          );
          expect(row.rows).toHaveLength(1);
          expect(row.rows[0].response).toBeNull();
          expect(JSON.stringify(row.rows[0])).not.toContain(TOKEN);

          const replay = yield* Effect.flip(
            store.begin("user-1", "tok-key", "POST /token", HASH_A),
          );
          expect(replay._tag).toBe("TokenReplayed");
          expect(errorTable[replay._tag]).toBe("TOKEN_REPLAYED");

          // An ordinary completed key, then 24 hours and a second pass: absent, so new.
          yield* store.begin("user-1", "old-key", "POST /x", HASH_A);
          yield* store.complete("user-1", "old-key", 200, { ok: true }, { sensitive: false });
          yield* TestClock.adjust(DAY - 1);
          const stillThere = yield* store.begin("user-1", "old-key", "POST /x", HASH_A);
          expect(stillThere._tag).toBe("Replay");
          yield* TestClock.adjust(2);
          // Past 24 hours the row counts as absent: even another body begins as new.
          const expired = yield* store.begin("user-1", "old-key", "POST /x", HASH_B);
          expect(expired).toEqual({ _tag: "New" });
          // The sensitive key expires too.
          const tokenExpired = yield* store.begin("user-1", "tok-key", "POST /token", HASH_A);
          expect(tokenExpired).toEqual({ _tag: "New" });
        }),
      ),
  );
});
