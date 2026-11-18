status: done
ticket: T-B4

# T-B4 · build · Soap: completion report (attempt a3)

**In short:** this attempt makes the two review round 1 fixes Axis asked for, both in `packages/server/src/platform/db/db.ts` only (c8f84ef).
- **t-b4-rigg-01:** `DbLive`'s pool now has an `error` listener. A terminated idle backend is logged as one JSON line and no longer crashes the process. I checked this by hand with `pg_terminate_backend`.
- **t-b4-rigg-02:** `commitWithEvents`'s doc comment now says it must be the program's last step.
- Every locked test still passes against real Postgres. No test changed.
- Spike 1 check 2 still **passes**, with no beta package, fork or patch.

## Pre-flight

These ran on c8f84ef, in the task doc's order:
- `DATABASE_URL` came from `scripts/pg-local.sh start` (this worktree's own Postgres 17, D5).
- `~/.nvm/versions/node/v24.22.2/bin` was first on PATH.

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0. "Checked 221 files", "Found 2 warnings". Both were already on `main`, in `apps/web/e2e/control-room-budget/budget.spec.ts` (lines 73 and 89, `useDomNodeTextContent`) |
| `pnpm test` | First run: exit 1, with 950 of 951 passing. The one failure was `@avel/contract` `test/routes.test.ts` "done-when 5: `pnpm --filter @avel/contract build` exits 0", which timed out at 6951 ms against its 5000 ms limit. That's the known machine-load timeout, outside this ticket. Run on its own afterwards: exit 0, Test Files 47 passed (47), Tests 951 passed (951) |
| `pnpm --filter @avel/server test` | exit 0. Test Files 11 passed (11), Tests 44 passed (44) |
| `pnpm --filter @avel/server typecheck` | exit 0. Both `@ts-expect-error` lines in `append-outside-tx.test.ts` are still needed (no TS2578) |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | exit 0. Test Files 47 passed (47), Tests 951 passed (951) |

**Extra checks:**
- **The locked tests alone:** `vitest run test/db-service` gives Test Files 6 passed (6), Tests 20 passed (20).
- **`pnpm --filter @avel/server check:effect`:** "0 errors, 0 warnings and 2 messages". Both messages are in T-B3's locked `test/db/errors.test.ts`, as before. `src/` has none.
- **The H6 lock check:** `GITHUB_HEAD_REF=t/B4-db-service pnpm --filter @avel/repo-checks check-locks` printed "lock check passed: T-B4, 5 builder commit(s)".
- **The locked tests are unchanged:** `git diff 5e98b36 HEAD -- packages/server/test` is empty.
- **The full diff against `main`** lists only `db.ts`, `events.ts`, `tx.ts`, `packages/server/test/db-service/**`, `locks.md` and the two T-B4 dispatch reports.
- **The secret scan:** `git diff 52cfb60 HEAD | grep -iE "password|secret|token|postgres://|api[_-]?key"` finds nothing.

**The idle-client check, by hand (Axis's instruction).** I used a scratch script outside the repo, not committed.
- **The script:** it runs `withTransaction` through `DbLive` to get the client's `pg_backend_pid()`. That client then sits idle in the pool. A second connection runs `pg_terminate_backend` on it.
- **With this build:** the process logged one line and stayed up:
  ```
  {"level":"Error","time":"2026-11-18T05:00:42.926Z","message":"idle database client error","code":"57P01","error":"terminating connection due to administrator command"}
  ```
  - One second later it was still alive.
  - The next `withTransaction` committed, on a new backend.
  - The layer closed and the process exited 0.
  - The line carries no connection string and no query parameters.
- **The control:** the same steps on a bare `pg.Pool` with no listener crash with "Unhandled 'error' event", exit 1. That matches Rigg's evidence.

## What changed

**`packages/server/src/platform/db/db.ts`** (c8f84ef) is the only file changed besides this report.
- **`idleClientErrorLogger(clock)` (t-b4-rigg-01):**
  - **What it builds:** the pool's `error` listener.
  - **What it writes:** one JSON line through `stdoutLogLine`, the server's log output from `logger.ts`. The line has the same `level`, `time` and `message` fields as `jsonLogger`, plus the pg error's `code` and `message` (as `error`). Nothing else from the error or the client is written.
  - **Where the time comes from:** the layer's `Clock`, read from the `Clock.Clock` reference (Writing Effect rule 4).
  - **Why it can't throw:** it only builds a string and writes it.
  - **Why it doesn't go through Effect's logger:** that would mean running an Effect from a Node event callback, and `runPromise` and `runSync` are allowed only in the two places Writing Effect rule 2 names.
- **`DbLive`:**
  - It attaches the listener when the pool is created, inside the `acquireRelease` acquire.
  - The finalizer runs `pool.end()`, then removes the listener with `pool.off("error", …)` in a `finally`.
- **`Db.commitWithEvents`'s doc comment (t-b4-rigg-02, Axis's reading):**
  - It must be the program's last step.
  - Anything after it still runs while the transaction holds the one global event lock, so every other event-writing transaction waits until this one commits.
  - Seq order stays correct either way.

**`docs/agent-dispatch/backend/sprint-02/agent-soap-t-b4-build-completion.md`**
- This report, a3's. It replaces a2's.

`events.ts` and `tx.ts` are unchanged from a1 (a2532d0). `index.ts` still isn't created, because nothing imports a barrel (E8).

## Contract to files

| Requirement | Where |
| --- | --- |
| t-b4-rigg-01: an idle client's error is logged and never crashes the process; the listener doesn't throw; code and message only; removed when the pool ends (Axis, round 1) | `db.ts` `idleClientErrorLogger`, `DbLive` acquire and finalizer |
| t-b4-rigg-02: commitWithEvents is the program's last step, recorded in its doc comment (Axis's reading) | `db.ts`, `Db.commitWithEvents`'s doc comment |
| Writing Effect rule 6: the pool is a scoped resource, and its listener goes with it | `db.ts` `DbLive` |
| Writing Effect rule 4: time from `Clock` | `db.ts` `idleClientErrorLogger(yield* Clock.Clock)` |
| E6: no secret in logs | The log line holds only `code` and `message`. `DATABASE_URL` stays `Redacted` |
| T-B4-01 to 06 (unchanged from a1 and a2) | `db.ts`, `events.ts`, `tx.ts`. See a2's report for the mapping |

## Spike 1 check 2 (CR-30 section 6): pass

Unchanged from a2, and confirmed again on c8f84ef.
- **A rolled-back program leaves no event and no row:** T-B4-03, `events-rollback.test.ts` 4/4.
- **`Events.append` outside a transaction doesn't compile:** T-B4-04. The server typecheck passes, so both `@ts-expect-error` lines are needed.
- **No beta package, fork or patch.** The listener uses only `pg`'s documented `Pool` `error` event and Effect's `Clock`.

## Answers to t-b4-rigg-03 and 04 (Axis put them on the backlog)

- **t-b4-rigg-03 (P3), `Events.append` takes `kind: string`:**
  - I agree with the finding, and it can't be fixed in this build.
  - The locked tests' `event()` helper (`test/db-service/support/db.ts`) passes `test.*` kinds. Typing `kind` as the contract's `EventKind` would break their compile (A3, F2).
  - It belongs to the ticket that writes the first real event. There, `NewEvent`'s `kind` becomes `EventKind` (and the payload is typed per kind once the contract has one), and the checker changes the helper and adds the `@ts-expect-error` test Rigg proposes.
  - Nothing in `events.ts` stands in the way: it's a one-line change to `NewEvent`.
- **t-b4-rigg-04 (P3), T-B4-05 proves the lock only by chance:**
  - It's the checker's test, so it isn't mine to change.
  - The build doesn't stand in the way of Rigg's proposed `pg_locks` test. Statements after `commitWithEvents` are still allowed (Axis's reading of t-b4-rigg-02 keeps it that way), so writer A can hold the lock on a `Deferred` while the test sees writer B waiting.
  - The lock is taken only in `commitWithEvents`, so a mutation that removes it is one statement.

## Deviations

- **The install:** I ran `pnpm install --frozen-lockfile` first, because the fresh worktree had no `node_modules`. It installed from the existing lockfile and changed no file (E5 holds).
- **The extra `pnpm test` run:** the task doc's single `pnpm test` hit the contract timeout described above, so I ran it once more. The chained command (7) and the extra run are both green.
- **The review fixes:** they go beyond the task doc's six tasks, at Axis's instruction under G4. They stay inside `db.ts`, which is in Part 5.

## Limitations

- **No locked test covers the idle-client listener.** The check above was by hand, as Axis asked. Rigg's finding proposes an acceptance test, which is the checker's, by an F2 change or the next ticket.
- **The listener writes to stdout through `stdoutLogLine`,** not through Effect's logger. Its line has `jsonLogger`'s shape, but a writer passed to `createApp` doesn't reach it. That changes once `DbLive` is wired at boot.
- **`commitWithEvents` as the last step is a documented rule, not an enforced one.** That's Axis's reading of t-b4-rigg-02.
- **Not wired into `app.ts`,** as the lead's note says.
- **Axis's other second-review P2s are left for the first route that wires `Db`.** They are pool timeouts, and logging the bound parameters of an unmapped `DrizzleQueryError`. They're outside this round's instruction.
- **Interrupting mid-query:** `Effect.promise` can't cancel a pg query that is already sent. The `rollback` waits behind it on the same client, then releases it.

## Messages received

1. **From Axis, relayed by OSA (CR-37, under G4):**
   - **The instruction:**
     - Rigg's round 1 asks for changes. Fix t-b4-rigg-01 and t-b4-rigg-02 in `db.ts` and nothing else, and change no test.
     - For 01, the pool gets an `error` listener. It logs a JSON line through the server's logger output, with the pg error's code and message only. It never throws, and it's removed when the finalizer ends the pool.
     - For 02, `commitWithEvents`'s doc comment says it must be the last step: anything after it holds the global event lock until commit, while seq order stays correct.
     - Run the full verification against real Postgres.
     - Check by hand that the process survives `pg_terminate_backend` on an idle backend.
     - Answer 03 and 04 in the report (backlog).
   - **What I did:** followed it.
     - Both fixes are in `db.ts` only (c8f84ef), inside Part 5's territory.
     - No test changed and no dependency was added.
     - The verification and the by-hand check are under Pre-flight. The answers to 03 and 04 are above.
     - It narrowed the work to findings inside the ticket and widened nothing, so I refused nothing.
2. **From OSA (environment):**
   - **The instruction:** Rigg's round 1 report is in the factory's reports folder. Put `~/.nvm/versions/node/v24.22.2/bin` first on PATH, start pg-local for the db tests, and write a3's own report.
   - **What I did:** followed it.
