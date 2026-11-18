status: done
ticket: T-B4

# T-B4 · build · Soap: completion report (attempt a2)

**In short:** the Db service passes every locked acceptance test against real Postgres. That includes T-B4-06, the server typecheck and `check:effect`, now that Rigg's F2 fix (54d7a40, locked at 5e98b36) answers a1's upheld dispute.
- This attempt only confirms. It changes no build code: `db.ts`, `events.ts` and `tx.ts` are a1's, re-applied unchanged as a2532d0 when the branch was rebuilt.
- Spike 1 check 2 **passes**, with no beta package, fork or patch.

## Pre-flight

These ran on commit d9897aa plus this report, with `DATABASE_URL` from `scripts/pg-local.sh start` (Postgres 17, D5) and `~/.nvm/versions/node/v24.22.2/bin` first on PATH.

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0. "Checked 221 files", "Found 2 warnings". Both warnings were already there, in `apps/web/e2e/control-room-budget/budget.spec.ts` (lines 73 and 89, `useDomNodeTextContent`) |
| `pnpm test` | exit 0. Test Files 47 passed (47), Tests 951 passed (951) |
| `pnpm --filter @avel/server test` | exit 0. Test Files 11 passed (11), Tests 44 passed (44) |
| `pnpm --filter @avel/server typecheck` | exit 0. `tsc` accepts both `@ts-expect-error` lines in `append-outside-tx.test.ts`, so neither is unused (no TS2578) |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | exit 0. Test Files 47 passed (47), Tests 951 passed (951) |

**Extra checks, not in the task doc's list:**
- `pnpm --filter @avel/server check:effect` (T-B2-04's script) exits 0 with "0 errors, 0 warnings and 2 messages".
  - Both messages are `unnecessaryFailYieldableError` in T-B3's locked `test/db/errors.test.ts` (lines 56 and 275). They are informational and not in this ticket.
  - `src/` has none.
- The H6 lock check passes: `GITHUB_HEAD_REF=t/B4-db-service pnpm --filter @avel/repo-checks check-locks` printed "lock check passed: T-B4, 3 builder commit(s)".
- `git diff 5e98b36 HEAD -- packages/server/test/db-service` is empty, so the locked tests are exactly as locked.

**Per task** (`vitest run test/db-service --reporter=verbose`: Test Files 6 passed, Tests 20 passed):

| Task | Result |
| --- | --- |
| T-B4-01: commit | `commit.test.ts` 2/2 |
| T-B4-02: rollback and release | `rollback.test.ts` 4/4. That includes 14 runs each of a failure, a defect and an interruption: 0 backends left `idle in transaction`, and the pool still commits afterwards |
| T-B4-03: append, then fail | `events-rollback.test.ts` 4/4 |
| T-B4-04: append outside a transaction | `append-outside-tx.test.ts` 2/2 at runtime. At type level, the server typecheck passes with both `@ts-expect-error` lines needed |
| T-B4-05: seq order | `seq-order.test.ts` 2/2. Seq follows commit order, has no holes, and the reader misses nothing (12 writers, one failing) |
| T-B4-06: errors through Db | `errors-through-db.test.ts` 6/6: AlreadyExists `users_email_uq`, ConstraintViolation `jobs_state_ck`, StaleVersion `{ field: "rowVersion", currentVersion: 2 }`, rollback after a violation, an unmapped error stays a defect, and HTTP 409 and 422 with the requestId |

## Spike 1 check 2 (CR-30 section 6): pass

1. **A rolled-back program leaves no event.**
   - `events-rollback.test.ts`: a tagged failure after `Events.append` leaves no event and no row.
   - A failure after `commitWithEvents` has already inserted the events also leaves neither.
   - The control commits both, in append order.
   - Events left queued with no `commitWithEvents` end as a defect that commits nothing.
2. **`Events.append` outside a transaction doesn't compile.**
   - `Events.append(e)` is `Effect<void, never, Tx>`, and only `withTransaction` provides `Tx` (its result type is `Exclude<R, Tx>`).
   - The server's `tsc` proves it: both `@ts-expect-error` lines are needed.
   - Forced past the types, it dies at runtime for want of `Tx`, and stores nothing.
3. **No beta package, fork or patch** (CR-30 decision 1). It runs on Effect 4.1.1, Drizzle 0.45.4 and node-postgres 8.23.1 as pinned.
   - One thing to note: `Tx` is a real `NodePgTransaction`. It is built on the client that `withTransaction` holds, from Drizzle's exported `NodePgTransaction`, `NodePgSession` and `PgDialect` classes.
   - Drizzle's own `db.transaction()` only takes a callback, and wrapping it would need `runPromise` outside the two allowed places (Writing Effect rule 2).
   - Those constructors are exported but not covered in Drizzle's guides, so re-run these tests on any Drizzle upgrade.

## What changed

The build code is a1's, unchanged (a2532d0). This attempt adds only this report.

**`packages/server/src/platform/db/tx.ts`**
- The `Transaction` type: a Drizzle `NodePgTransaction` with no relational schema.
- The `Tx` service (`Context.Service`, `"avel/Tx"`), whose value is that transaction.

**`packages/server/src/platform/db/events.ts`**
- `Events.append(event)`: `Effect<void, never, Tx>`. It queues `{ schemaVersion, kind, payload, missionId?, dispatchId?, attemptId? }` for this transaction and writes nothing.
- The queue is a `WeakMap` keyed by the transaction object, because `Tx`'s value must be the Drizzle transaction itself.
- `takeQueued` and `hasQueued` are for `db.ts`.

**`packages/server/src/platform/db/db.ts`**
- **The `Db` service:**
  - `withTransaction<A, E, R>(program): Effect<A, E | DbError, Exclude<R, Tx>>`
  - `commitWithEvents: Effect<void, never, Tx>`
- **`withTransaction`, step by step:**
  1. It takes a pool client with `acquireRelease` in a scope.
  2. It runs `begin` and provides `Tx`.
  3. If events are still queued at the end, it dies.
  4. Otherwise it runs `commit`.
- **The release step:**
  - On success it hands the client back.
  - On a failure, a defect or an interruption it runs `rollback` first.
  - If the rollback fails, it destroys the client instead of returning it to the pool.
- **Defects:**
  - A `DrizzleQueryError`'s `.cause`, or a raw pg error, goes through T-B3's `mapDbError` and becomes a typed failure.
  - Anything else dies again, unchanged.
- **`commitWithEvents`:**
  - It takes `pg_advisory_xact_lock(hashtext('avel.events.seq'))`, then inserts the queued events in one statement.
  - So seq is assigned under the lock, and the lock is held until commit.
  - With nothing queued it does nothing.
- **`DbLive`:** a `Layer<Db, ConfigError>`.
  - It reads `DATABASE_URL` through `Config.Redacted`.
  - It holds one `pg.Pool`, ended by `pool.end()` in the layer's finalizer.
- It also re-exports `Tx`, because the locked tests import it from `db.ts`.

**`docs/agent-dispatch/backend/sprint-02/agent-soap-t-b4-build-completion.md`**
- a2's report. It replaces a1's `test-dispute` report.

**`index.ts`** isn't created. Nothing imports a barrel, so it would be dead code (E8).

## Contract to files

| Requirement | Where |
| --- | --- |
| withTransaction: a scoped pool client; begin, provide Tx, commit or roll back; always release (CR-30 §2; Writing Effect rule 6) | `db.ts` `withTransaction`, `rollbackAndRelease`; `tx.ts` |
| A program sees tagged errors, never pg's (Step 1 item 3, test 6) | `db.ts` `toDbError` with `catchDefect`, through T-B3's `mapDbError` |
| Events.append needs Tx and only queues (AGENTS.md; CR-30 §2) | `events.ts` |
| commitWithEvents: the advisory lock, then the events inserted last, so seq follows commit order; no other code takes the lock (Step 1 item 10, test 11) | `db.ts` `commitWithEvents` |
| Queued events are never silently dropped | `db.ts`: the `hasQueued` check dies |
| DATABASE_URL through Config as Redacted; one Pool, ended in the finalizer (the lead's note) | `db.ts` `DbLive` |

## Deviations

- I ran `pnpm install --frozen-lockfile` first, because the fresh worktree had no `node_modules` and the first `pnpm build` failed with `tsc: not found`. It installed from the existing lockfile and changed no file (E5 holds).
- Apart from that, I followed the task doc.

## Limitations

- **Not wired into `app.ts`,** as the lead's note says. That comes with the first route that writes.
- **No `pool.on("error")` handler.** A network error on an idle client would reach the process as an unhandled `error` event. No test asks for a handler, so it isn't built (E8). It belongs with the server's boot and shutdown wiring.
- **`commitWithEvents` isn't enforced as the last step.**
  - Statements a program runs after it still commit in order, because the lock is held until commit.
  - Only "no events after it" is enforced: an event appended later is still queued at the end, and the transaction dies.
- **Interrupting mid-query:** `Effect.promise` can't cancel a pg query that is already sent. The `rollback` waits behind it on the same client, then releases it.

## Messages received

1. **From Axis via OSA:**
   - **The instruction:**
     - Axis upheld a1's test-dispute (D1 to D4) under F2.
     - Rigg's fix (54d7a40) changes only `packages/server/test/db-service/` and no assertion.
     - The branch was rebuilt on main with one lock at 5e98b36, and a1's commits were re-applied unchanged as a2532d0 and d9897aa.
     - This attempt only confirms: run the full verification against real Postgres, expect no build-code change, and report `done` with spike 1 check 2's result.
     - If anything is red, stop and report it. Don't change a locked file.
     - Write a2's own report.
   - **What I did:** followed it. Every command is green, there's no build-code change, no locked file is touched, and this report replaces a1's.
2. **From OSA (environment):**
   - **The instruction:** put `~/.nvm/versions/node/v24.22.2/bin` first on PATH.
   - **What I did:** followed it for every command.

Neither one widened the ticket, so I refused nothing.
