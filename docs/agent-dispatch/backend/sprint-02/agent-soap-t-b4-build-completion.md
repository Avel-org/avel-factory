status: test-dispute
ticket: T-B4

# T-B4 · build · Soap: completion report (attempt a1)

**In short:** the Db service is built, and T-B4-01 to T-B4-05 pass against real Postgres. T-B4-06 can't pass, because the locked file `packages/server/test/db-service/errors-through-db.test.ts` has three faults that no build can fix: an inverted `Result` check, and two type annotations. The server typecheck and `check:effect` (T-B2-04) fail only on lines in locked tests. I changed no test. The checkpoint is commit `c500d6c`.

## The dispute (F2): what's wrong in the locked tests

The faults are all in `test/db-service/errors-through-db.test.ts`, except D4, which is in `append-outside-tx.test.ts`.

**D1. `failureOf` reads `Cause.findError` the wrong way round (it breaks 3 runtime tests).**
- In Effect 4.1.1, `Cause.findError` returns `Result.succeed(error)` when it finds a typed error (`node_modules/effect/dist/Cause.d.ts`, around line 911: "a `Result` whose success value is the first typed error value").
- The helper does `if (found._tag === "Failure") return found.failure`, so it throws on exactly the case it wants.
- Evidence from `pnpm --filter @avel/server test`:
  ```
  Error: expected a typed failure, got AlreadyExists: Already exists
  Error: expected a typed failure, got ConstraintViolation: A CHECK violation, or a missing parent
  Error: expected a typed failure, got StaleVersion: The body's version isn't current
  ```
- The StaleVersion case settles it. That error comes from T-B3's `requireUpdated`, a plain `Effect.fail` that never goes near the mapper, and the helper refuses it too.
- **Likely fix:** `if (found._tag === "Success") return found.success as E;`, or use `Cause.findErrorOption`.

**D2. Line 158: `dbLayer` is typed `Layer.Layer<Db, unknown>` (in `support/db.ts`, also locked).**
- `program.pipe(Effect.provide(dbLayer(url)))` therefore has error type `unknown`.
- `effectHandler` requires `E extends MappedError`, which gives `TS2322: Type 'Effect<unknown, unknown, never>' is not assignable to type 'Effect<unknown, MappedError, Services>'`.
- DbLive's own type, `Layer<Db, ConfigError>`, doesn't change this: `ConfigError` isn't a `MappedError` either.
- **Likely fix:** provide `Layer.orDie(dbLayer(url))` in `through`, or have `dbLayer` return `Layer.Layer<Db>` through `Layer.orDie`. A missing `DATABASE_URL` is a defect at the edge.

**D3. Lines 161 and 175: `through` takes only `AlreadyExists | ConstraintViolation`.**
- `withTransaction`'s error type truthfully includes `DeleteRefused`.
- Any statement can hit a foreign key that refuses a delete. `mapDbError` returns `AlreadyExists | ConstraintViolation | DeleteRefused`, and Axis's instruction names all three.
- The result is `TS2345: Type 'DeleteRefused' is not assignable to type 'AlreadyExists | ConstraintViolation'`.
- Narrowing the type to pass would make it lie, so I didn't.
- **Likely fix:** widen `through`'s parameter to `Effect<unknown, AlreadyExists | ConstraintViolation | DeleteRefused, Db>`.

**D4. `check:effect` (T-B2-04 in `tools/repo-checks`) stays red, and only on locked test lines.**
- `pnpm --filter @avel/server check:effect` reports 5 errors: D2 and D3 again (as `missingEffectError`), plus two in `append-outside-tx.test.ts`:
  ```
  append-outside-tx.test.ts:23:35 - error effect(missingEffectContext): ... missing from the expected Effect context: `Tx`.
  append-outside-tx.test.ts:30:13 - error effect(missingEffectContext): ... missing from the expected Effect context: `Tx`.
  ```
- Those two are the deliberate `@ts-expect-error` lines: `tsc` accepts them, but `effect-tsgo` still reports them.
- **Likely fix:** an `@effect-diagnostics-next-line missingEffectContext:off` comment in the test (the tsgo README lists the directive), or an override in `packages/server/tsconfig.json` like the one `test/errors.test.ts` has. That tsconfig belongs to T-B2 and is outside my territory.
- Axis said: "If it stays red with your build in, stop with test-dispute. Don't work around it." So I stopped.

## Pre-flight

These ran with `DATABASE_URL` from `scripts/pg-local.sh start`, and node and pnpm from `~/.nvm/versions/node/v24.22.2/bin`.

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 1: only the 3 errors in `errors-through-db.test.ts` (158, 161, 175; D2 and D3). No error in `src/`, and no unused `@ts-expect-error` in `append-outside-tx.test.ts` |
| `pnpm lint` | exit 0: "Found 2 warnings", both already there in `apps/web/e2e/control-room-budget/budget.spec.ts` |
| `pnpm test` | exit 1: 2 files and 4 tests failed, 947 passed. The failures are the 3 tests in D1, plus T-B2-04 `check:effect` (D4). The `@avel/contract` tsc tests didn't time out this run |
| `pnpm --filter @avel/server test` | exit 1: 1 file and 3 tests failed, 41 passed. The 3 are D1's |
| `pnpm --filter @avel/server typecheck` | exit 1: the same 3 errors (D2, D3) |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | stops at `pnpm typecheck`, exit 1, for the reasons above |

**Per task:**

| Task | Result |
| --- | --- |
| T-B4-01 (commit) | `commit.test.ts`: 2 of 2 pass |
| T-B4-02 (rollback and release) | `rollback.test.ts`: 4 of 4 pass, including 14 runs of each kind with 0 left `idle in transaction` |
| T-B4-03 (append, then fail) | `events-rollback.test.ts`: 4 of 4 pass |
| T-B4-04 (append outside a transaction) | Runtime: `append-outside-tx.test.ts` 2 of 2 pass. Type level: `tsc` accepts both `@ts-expect-error` lines, so the type-level check passes. `effect-tsgo` flags them (D4) |
| T-B4-05 (seq order) | `seq-order.test.ts`: 2 of 2 pass. Seq order is commit order, no holes, and the reader misses nothing |
| T-B4-06 (errors through Db) | `errors-through-db.test.ts`: 3 of 6 pass (rollback after a violation, an unmapped error stays a defect, HTTP 409 and 422 with the requestId). The other 3 fail only in `failureOf` (D1); each one got the expected error |

**Baseline before any change:** the 6 `db-service` files failed (their modules didn't exist), T-B2-04 failed, and 930 tests passed.

## Spike 1 check 2 (CR-30 section 6): pass on behaviour

1. **A rolled-back program leaves no event.**
   - Proven by `events-rollback.test.ts`: a tagged failure after `Events.append` leaves no event and no row, and so does a failure after `commitWithEvents` has inserted.
   - The control case commits both, in append order. Queued events with no `commitWithEvents` end as a defect that commits nothing.
2. **`Events.append` outside a transaction doesn't compile.**
   - `Events.append(e)` is `Effect<void, never, Tx>`, and only `withTransaction` provides `Tx`.
   - `tsc` confirms it: both `@ts-expect-error` lines in `append-outside-tx.test.ts` are needed (no TS2578).
   - At runtime, forcing it past the types dies for want of `Tx` and stores nothing.
3. **No beta package, fork or patch.** This runs on Effect 4.1.1, Drizzle 0.45.4 and node-postgres 8.23.1 as pinned.
   - One thing to note: `Tx` is a real `NodePgTransaction`, built with Drizzle's exported `NodePgTransaction`, `NodePgSession` and `PgDialect` classes on the client that `withTransaction` already holds.
   - Drizzle's own `db.transaction()` only takes a callback, and wrapping it would need `runPromise` outside the two allowed places (Writing Effect rule 2).
   - Those constructors are exported but not in Drizzle's guides, so a Drizzle upgrade should re-run these tests.

The remaining red is all in D1 to D4, so I'm not calling the spike a fail with `needs-cr`. The design held.

## What changed

**`packages/server/src/platform/db/tx.ts` (new):**
- The `Transaction` type: a Drizzle `NodePgTransaction` with no relational schema.
- The `Tx` service (`Context.Service`, `"avel/Tx"`), whose value is that transaction.

**`packages/server/src/platform/db/events.ts` (new):**
- `Events.append(event)`: `Effect<void, never, Tx>`. It queues `{ schemaVersion, kind, payload, missionId?, dispatchId?, attemptId? }` for this transaction and writes nothing.
- The queue is a `WeakMap` keyed by the transaction object. It has to be, because `Tx`'s value must be the Drizzle transaction itself and `append` may require only `Tx`.
- `takeQueued` and `hasQueued` are for `db.ts`.

**`packages/server/src/platform/db/db.ts` (new):**
- **`Db` service:**
  - `withTransaction<A, E, R>(program): Effect<A, E | DbError, Exclude<R, Tx>>`
  - `commitWithEvents: Effect<void, never, Tx>`
- **`withTransaction`:**
  - It acquires a pool client with `acquireRelease` in a scope.
  - It runs `begin`, provides `Tx`, and dies if events are still queued, then runs `commit`.
  - The release step hands the client back on success. On a failure, a defect or an interruption it runs `rollback` first, and destroys the client instead of reusing it if `rollback` fails.
  - Defects go through `toDbError`: a `DrizzleQueryError`'s `.cause`, or a raw pg error, goes to T-B3's `mapDbError` (Axis's instruction). A mapped error becomes a typed failure, and anything else dies again unchanged.
- **`commitWithEvents`:** it takes `pg_advisory_xact_lock(hashtext('avel.events.seq'))`, then inserts the queued events in one statement, so seq is assigned under the lock and the lock is held until commit. With nothing queued it does nothing.
- **`DbLive`:** a `Layer<Db, ConfigError>`. It reads `DATABASE_URL` with `Config.Redacted` and holds one `pg.Pool`, which `pool.end()` closes in the layer's finalizer.
- It also re-exports `Tx`, which the locked tests import from `db.ts`.

**`docs/agent-dispatch/backend/sprint-02/agent-soap-t-b4-build-completion.md`:** this report.

`index.ts` isn't created: nothing imports a barrel, so it would be dead code (E8).

## Contract to files

| Requirement | Where |
| --- | --- |
| withTransaction: scoped pool client, begin, provide Tx, commit or roll back, always release (CR-30 §2; Writing Effect rule 6) | `db.ts` `withTransaction`, `rollbackAndRelease`; `tx.ts` |
| A program sees tagged errors, never pg's (Step 1 item 3; Axis's instructions) | `db.ts` `toDbError` and `catchDefect` |
| Events.append needs Tx and only queues (AGENTS.md; CR-30 §2) | `events.ts` |
| commitWithEvents: advisory lock, events inserted last, seq in commit order; no other code takes the lock (Step 1 item 10) | `db.ts` `commitWithEvents` |
| Queued events never silently dropped | `db.ts` `hasQueued` check: a defect |
| DATABASE_URL through Config as Redacted; one Pool, ended in the finalizer (lead's note) | `db.ts` `DbLive` |

## Deviations

- **The lint fix:** `biome check --write` reformatted one long line in `db.ts`.
- **What I didn't do:** narrow `withTransaction`'s error type to `AlreadyExists | ConstraintViolation`. It would make the locked types compile, but it would hide `DeleteRefused`, which can really happen (D3).

Apart from those, I followed the task doc. I stopped with `test-dispute` and didn't work around the locked file.

## Limitations

- **Not wired into `app.ts`,** as the lead's note says: that comes with the first route that writes.
- **No `pool.on("error")` handler.** An idle client's network error would reach the process as an unhandled `error` event. No test asks for a handler, so I left it out (E8). It belongs with the server's boot and shutdown wiring.
- **`commitWithEvents` doesn't enforce being the last step.**
  - Statements a program runs after it still commit in order, because the lock is held until commit.
  - Only "no events after it" is enforced: anything appended later is still queued at the end and dies.
- **Interrupting mid-query:** `Effect.promise` can't cancel a pg query already sent. `rollback` waits behind it on the same client, then releases it.
- **The cross-check I couldn't run:** whether `check:effect` goes green once D2 to D4 are fixed. `src/` itself has no `check:effect` diagnostic.

## Messages received

1. **From Axis via OSA:**
   - Instruction: "errors.ts is must-not-change. In db.ts, unwrap a DrizzleQueryError's cause before calling mapDbError, so a program sees AlreadyExists, ConstraintViolation or DeleteRefused, never DrizzleQueryError."
   - What I did: followed it, within territory, in `toDbError` in `db.ts`. `errors.ts` is untouched.
2. **From Axis via OSA:**
   - Instruction: if the root `pnpm test` is red locally only because the two `@avel/contract` tsc tests time out at 5 s, that's machine load; name it in the report.
   - What I did: noted it. They didn't time out in this run, so there was nothing to name.
3. **From OSA (environment):**
   - Instruction: put `~/.nvm/versions/node/v24.22.2/bin` first on PATH, because the first pnpm is a Windows shim.
   - What I did: followed it for every command.
4. **From Axis via OSA:**
   - Instruction: find the pg error in the cause chain (`DrizzleQueryError.cause`), map it through `mapDbError`, and leave anything unmapped a defect. If `check:effect` stays red with the build in, stop with `test-dispute` and don't work around it. Axis also accepted Rigg's seams: `commitWithEvents` is `Effect<void, never, Tx>`, Db is used as `const db = yield* Db`, and `withTransaction` maps a defect whose cause chain holds a pg error.
   - What I did: followed it. `check:effect` stays red only on locked test lines (D4), so the status is `test-dispute`.

None of these widened the ticket, so I refused none.
