import { errorMap } from "@avel/contract";
import { idempotencyKeys } from "@avel/db";
import { and, eq, lte, sql } from "drizzle-orm";
import { Clock, Context, Effect, Layer } from "effect";
import { Db, Tx } from "./db/db.ts";
import { IdempotencyInProgress, IdempotencyKeyReused, TokenReplayed } from "./errors.ts";

/** How long a key answers for its first request (AGENTS.md, API rules: writes). */
const KEPT_MS = 24 * 60 * 60 * 1000;

/** What `begin` found: a key to run the write under, or the first request's stored answer. */
export type Begun =
  | { readonly _tag: "New" }
  | { readonly _tag: "Replay"; readonly status: number; readonly response: unknown };

/**
 * The idempotency store over `idempotency_keys` (Step 1 item 4): one row per (principal, key),
 * kept 24 hours by the Clock. An expired row counts as absent.
 */
export class Idempotency extends Context.Service<
  Idempotency,
  {
    /**
     * Claims the key for this route and body hash: `New` when it is unused (the row is now in
     * progress), `Replay` when the same request already completed. The same key with another
     * route or body is `IdempotencyKeyReused`, one still running is `IdempotencyInProgress`,
     * and a completed sensitive one is `TokenReplayed`.
     */
    readonly begin: (
      principal: string,
      key: string,
      route: string,
      bodySha256: string,
    ) => Effect.Effect<Begun, IdempotencyKeyReused | IdempotencyInProgress | TokenReplayed>;
    /**
     * Stores the request's answer. A sensitive one (it carries a secret or token) stores no
     * response, so its replay is refused rather than answered. A row that is no longer in
     * progress is left as it is.
     */
    readonly complete: (
      principal: string,
      key: string,
      status: number,
      response: unknown,
      options: { readonly sensitive: boolean },
    ) => Effect.Effect<void>;
    /**
     * Gives up a key whose request died before it had an answer, so a retry with the same key
     * and body runs again instead of waiting out the 24 hours as in progress. A completed row is
     * left as it is.
     */
    readonly release: (principal: string, key: string) => Effect.Effect<void>;
  }
>()("avel/Idempotency") {}

const thisKey = (principal: string, key: string) =>
  and(eq(idempotencyKeys.principal, principal), eq(idempotencyKeys.key, key));

export const IdempotencyLive = Layer.effect(
  Idempotency,
  Effect.gen(function* () {
    const db = yield* Db;

    const begin = (principal: string, key: string, route: string, bodySha256: string) =>
      Effect.gen(function* () {
        const now = new Date(yield* Clock.currentTimeMillis);
        const expiresAt = new Date(now.getTime() + KEPT_MS);
        // Inserts the key, or takes over an expired row; a live row is left alone (and locked).
        const row = yield* db
          .withTransaction(
            Effect.gen(function* () {
              const tx = yield* Tx;
              const claimed = yield* Effect.promise(() =>
                tx
                  .insert(idempotencyKeys)
                  .values({ principal, key, route, bodySha256, expiresAt })
                  .onConflictDoUpdate({
                    target: [idempotencyKeys.principal, idempotencyKeys.key],
                    set: {
                      route,
                      bodySha256,
                      status: "in_progress",
                      httpStatus: null,
                      response: null,
                      expiresAt,
                    },
                    setWhere: lte(idempotencyKeys.expiresAt, now),
                  })
                  .returning({ key: idempotencyKeys.key }),
              );
              if (claimed.length > 0) return undefined;
              // node-postgres reads jsonb 'null' and SQL NULL alike, so SQL tells them apart.
              const [live] = yield* Effect.promise(() =>
                tx
                  .select({
                    route: idempotencyKeys.route,
                    bodySha256: idempotencyKeys.bodySha256,
                    status: idempotencyKeys.status,
                    httpStatus: idempotencyKeys.httpStatus,
                    response: idempotencyKeys.response,
                    sensitive: sql<boolean>`${idempotencyKeys.response} is null`,
                  })
                  .from(idempotencyKeys)
                  .where(thisKey(principal, key)),
              );
              return live;
            }),
          )
          .pipe(Effect.orDie);
        if (row === undefined) return { _tag: "New" } as const;
        if (row.route !== route || row.bodySha256 !== bodySha256) {
          return yield* new IdempotencyKeyReused({
            message: errorMap.IDEMPOTENCY_KEY_REUSED.message,
          });
        }
        if (row.status === "in_progress" || row.httpStatus === null) {
          return yield* new IdempotencyInProgress({
            message: errorMap.IDEMPOTENCY_IN_PROGRESS.message,
          });
        }
        if (row.sensitive) {
          return yield* new TokenReplayed({ message: errorMap.TOKEN_REPLAYED.message });
        }
        return { _tag: "Replay", status: row.httpStatus, response: row.response } as const;
      });

    const complete = (
      principal: string,
      key: string,
      status: number,
      response: unknown,
      options: { readonly sensitive: boolean },
    ) =>
      db
        .withTransaction(
          Effect.gen(function* () {
            const tx = yield* Tx;
            yield* Effect.promise(() =>
              tx
                .update(idempotencyKeys)
                .set({
                  status: "completed",
                  httpStatus: status,
                  // A stored response is always jsonb (a JSON null too), so SQL NULL marks only
                  // a sensitive one.
                  response: options.sensitive
                    ? null
                    : sql`${JSON.stringify(response ?? null)}::jsonb`,
                })
                // Only the request still running sets the answer: never a completed row.
                .where(and(thisKey(principal, key), eq(idempotencyKeys.status, "in_progress"))),
            );
          }),
        )
        .pipe(Effect.orDie);

    const release = (principal: string, key: string) =>
      db
        .withTransaction(
          Effect.gen(function* () {
            const tx = yield* Tx;
            yield* Effect.promise(() =>
              tx
                .delete(idempotencyKeys)
                .where(and(thisKey(principal, key), eq(idempotencyKeys.status, "in_progress"))),
            );
          }),
        )
        .pipe(Effect.orDie);

    return { begin, complete, release };
  }),
);
