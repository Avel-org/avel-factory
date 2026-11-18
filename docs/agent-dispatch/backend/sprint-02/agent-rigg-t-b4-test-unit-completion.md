status: done
ticket: T-B4

# T-B4 tests: completion report (Rigg)

## Messages received
All three came through OSA's session, relaying Axis:
1. "Test 6's violations must be raised through Tx, the Drizzle transaction, not a raw pg client; Drizzle 0.45.4 wraps pg errors in DrizzleQueryError with the pg error as .cause (t-b3-rigg-01)." Done: every violation in `errors-through-db.test.ts` is raised with `tx.insert/update` inside `withTransaction`, so the build must unwrap `.cause` before `mapDbError`. It narrows the task, so I accepted it.
2. "If root `pnpm test` is red locally only because the two @avel/contract tsc tests time out at 5 s, that's machine load, not this ticket. Name it." Named below. It was not what failed here (see Pre-flight).
3. "Add a 'Messages received' section listing every instruction OSA relayed." Done: this section.

## Pre-flight
Run with `DATABASE_URL=$(scripts/pg-local.sh start)` on the start commit plus my tests (no product code exists).
- `pnpm build`: pass.
- `pnpm typecheck`: **fails**, only in `packages/server`: `Cannot find module '../../src/platform/db/db.ts'` and `.../events.ts` (the seams don't exist), plus the unused `@ts-expect-error` lines in `append-outside-tx.test.ts` (they fail until `Events.append` is typed with `Tx`). A few `unknown`-typed errors in `errors-through-db.test.ts` follow from the missing `Db` type. Expected: this is the type-level test failing first (T-B4-04).
- `pnpm lint`: pass (2 existing warnings in apps/web).
- `pnpm test`: red. The server's 6 new files fail on the missing module. One other failure, `tools/repo-checks/test/effect-check.test.ts:67`, comes from `check:effect` reporting 3 `missingEffectError` errors in `errors-through-db.test.ts`; these follow from the unresolved `Db` type. I changed the `yield* Effect.fail(new NotFound())` calls to `yield* new NotFound()` after that run and did not re-run the whole suite, so I haven't confirmed that failure clears once `Db` exists. The 5 s @avel/contract tsc timeouts did not show up in this run.
- `pnpm --filter @avel/server test`: 6 files fail, 5 pass (24 tests pass).
- `pnpm --filter @avel/server typecheck`: fails as above.
- Last chained command: not run separately; it fails at typecheck for the same reasons.

## Failing first
Every new file fails at collection on the start commit:
```
FAIL test/db-service/{commit,rollback,events-rollback,append-outside-tx,seq-order,errors-through-db}.test.ts
Error: Cannot find module '../../src/platform/db/db.ts' imported from .../test/db-service/<file>
```
This is the reason the behaviour isn't built. It does not show that the assertions are right (see Limitations).

## What changed
All under `packages/server/test/db-service/`:
- `support/db.ts`: the seam contract (header comment), `dbLayer(url)` (DbLive with DATABASE_URL via `ConfigProvider.fromEnvRecord`), `runDb`, `event`.
- `commit.test.ts`: T-B4-01.
- `rollback.test.ts`: T-B4-02. A client counts as released if no backend is left `idle in transaction`, and 14 runs of each kind (more than pg's pool max of 10) still finish and the next commit works.
- `events-rollback.test.ts`: T-B4-03, with a control (commits with events) and the "queued but never committed is a defect" rule.
- `append-outside-tx.test.ts`: T-B4-04, `@ts-expect-error` lines checked by the server typecheck, plus a runtime check.
- `seq-order.test.ts`: T-B4-05, a deterministic order test (appended first, commits last, gets the later seq) and a 12-writer concurrent test with a polling reader, one failing writer, no seq holes.
- `errors-through-db.test.ts`: T-B4-06 through Tx, plus a non-constraint error that stays a defect, and the 409 and 422 over HTTP with `requestId`.

## Contract to files
Task doc T-B4-01 to 06 map one-to-one onto the files above. Spike 1 check 2 is T-B4-03 and T-B4-04; I cannot give its pass or fail, as nothing is built. The build's report must.

## Seams the build must provide (for Axis to confirm before the lock)
- `src/platform/db/db.ts`: `Db` (service with `withTransaction(program)` and `commitWithEvents: Effect<void, never, Tx>`), `Tx` (service holding the Drizzle transaction), `DbLive: Layer<Db, ConfigError>`.
- `src/platform/db/events.ts`: `Events.append(event): Effect<void, never, Tx>`, event `{ schemaVersion, kind, payload, missionId?, dispatchId?, attemptId? }`.
- `commitWithEvents` is a step inside the program, called before withTransaction commits. The task doc is ambiguous here: I chose this because "ends without it dies as a defect" only makes sense if it is a step.
- `Db` is used as `const db = yield* Db; db.withTransaction(...)`, not as static accessors.
- withTransaction maps a defect whose cause chain holds a pg error (the DrizzleQueryError case) to the tagged error.

## Deviations
- Plain vitest with `Effect.runPromiseExit`, not `@effect/vitest`'s `it.effect`: the tests need no clock, and I didn't want a TestClock to stall a build that uses Clock. No wall-clock sleeps anywhere. Ordering uses Deferreds; the reader loop polls with no delay.
- E13's four (DTO, `requestId`, replay, stale `rowVersion`) apply to routes; no route uses Db yet. I covered the error body with `requestId` and the stale version at the service level; no replay test exists.

## Limitations
- I could not run the tests against an implementation, so the assertions are unproven until Soap builds. The `Cause`/`Exit` calls (`cause.reasons`, `Cause.findError`) and `Effect.forkChild` follow Effect 4.1.1's types, but the type errors on them are hidden behind the missing-module errors.
- I couldn't observe commit order directly (no commit timestamps); the order test uses Deferred-ordered transactions, and the concurrent test checks the reader's view.
- Spike 1 check 2's result, and whether anything needed a beta package, a fork or a patch, are for the build report.
- `pnpm test` has other known red from @avel/contract tsc timeouts under load; that is machine load, not this ticket (Axis).

## Lock line
- T-B4: packages/server/test/db-service/** @ 5c0c633 (the tests commit; the report-only commit after it changes no test)
