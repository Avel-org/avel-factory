status: done
ticket: T-B8

All eight tasks pass on `f15eb7f`: T-B8-01 to T-B8-08. CI's commands are green.

This is attempt a3, review round 2. It fixes the three review findings that Axis routed to the build: t-b8-rigg-01, t-b8-rigg-04 and the first half of t-b8-rigg-05. Two commits after a2's report (`d5dff88`) make the fixes, both with `Refs: T-B8`:
- `3299519`: `idempotency.ts` (rigg-01 and rigg-05)
- `f15eb7f`: `db.ts` (rigg-04)

Everything else from a1 and a2 stands: `dd4b38e`, `9f82ebd` and `3c9d6cc`, plus a2's report at `d5dff88`.

## Findings

| Finding | Severity | Result | Why |
| --- | --- | --- | --- |
| t-b8-rigg-01: a non-sensitive `null` response replayed as TOKEN_REPLAYED | P2 | **fixed** | `begin`'s read now selects `response is null` as its own field (`sensitive`). Only SQL NULL, which `complete` writes for a sensitive response alone, is `TokenReplayed`. A stored jsonb `'null'` replays as `Replay { status, response: null }`. There is no schema change. |
| t-b8-rigg-04: no client-side timeout on a held client's query | P3 | **fixed** | The pool sets node-postgres's `query_timeout` to the statement timeout + 5000 ms (35 s by default). A connection that stops answering mid-query ends the query as a defect. `checkIn`'s rollback then has the same bound, and when it fails the client is destroyed, not returned. |
| t-b8-rigg-05, first half: `complete` was unconditional | P3 | **fixed, as Axis scoped it** | `complete` now updates only where `status = 'in_progress'`. A late `complete` can't overwrite a row that has already completed. When nothing matches, it is a no-op, so a late answer never turns a finished write into a 500. Limitations covers the case this doesn't close. |
| t-b8-rigg-05, second half: a failed write leaves its key in progress for 24 hours | P3 | **not changed** | Per Axis, the 24-hour in-progress behaviour is Javaris's decision, and T-B10 needs a rule for it. |
| t-b8-rigg-02, t-b8-rigg-03 | | **not mine** | Axis answered them through the plan. |

## Pre-flight

The Postgres came from `scripts/pg-local.sh start`. The worktree was fresh, so I first ran `pnpm install --frozen-lockfile`. It added no dependency and left `pnpm-lock.yaml` unchanged. Before any change, `pnpm --filter @avel/server test` passed: 54 tests in 17 files.

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0. 2 warnings, both already there and outside this ticket: `apps/web/e2e/control-room-budget/budget.spec.ts` 73 and 89 |
| `pnpm test` | exit 0: 971 passed in 55 files |
| `pnpm --filter @avel/server test` | exit 0: 54 passed in 17 files |
| `pnpm --filter @avel/server typecheck` | exit 0 |
| `pnpm --filter @avel/server check:effect` | exit 0: 0 errors. 6 warnings and 2 messages, all in test files and unchanged since a2: 3 in the locked `idempotency.test.ts`, 3 in the locked `rate-limit.test.ts`, 2 in `test/db/errors.test.ts`. None are in `src`. |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | exit 0: 971 passed in 55 files |

Every test in `test/platform-hardening` passes: T-B8-01 to T-B8-08, as a2's table lists them.

No locked test and no lock line changed: `git diff 43c5cc6` is empty for `packages/server/test/**` and for `locks.md`.

I also checked the fixes with a throwaway test against the real Postgres. I deleted it before committing; it was never committed. It showed three things:
- A `null` response with `sensitive: false` replays as `Replay { 200, null }`.
- A second `complete` on the finished row leaves it unchanged.
- A sensitive row is still `TokenReplayed`.

Under F2, Rigg can add a locked version of this check, as rigg-01 suggests.

## What changed

**In a3:**
- **`packages/server/src/platform/idempotency.ts`**
  - `begin`'s read of a live row now selects named columns plus `sensitive: response is null`, worked out in SQL. node-postgres reads jsonb `'null'` and SQL NULL both as JS `null`. `TokenReplayed` now tests `sensitive` (rigg-01).
  - `complete` updates only where `(principal, key)` matches and `status = 'in_progress'`. The doc comment says that a row no longer in progress is left as it is (rigg-05).
- **`packages/server/src/platform/db/db.ts`**
  - The pool gets `query_timeout: statementTimeoutMs + QUERY_TIMEOUT_MARGIN_MS` (5000), and the layer's doc comment says so (rigg-04).
  - The server's `statement_timeout` still fires first, so T-B8-03 still sees Postgres's own cancel.
- **This report:** it replaces a2's.

**From a1, unchanged:**
- `db.ts`: the defects carry no values, the pool timeouts, `checkOut` and `checkIn`, and the lc_messages boot check.
- `errors.ts`: the four new tagged errors.
- `idempotency.ts`: the store.
- `rate-limit.ts`: the limiter.

a2's report at `d5dff88` has the details.

## Contract to files

| Requirement | Where |
| --- | --- |
| T-B8-01: the defect log has no params or value; the 500 has no database text | `db.ts` `withoutValues` |
| T-B8-02: a connect that hangs gives up within the connect timeout, and an interruption ends it | `db.ts`: `connectionTimeoutMillis` and `checkOut` |
| T-B8-03: a statement past the timeout is a defect, and the client is released | `db.ts`: `statement_timeout` and `checkIn`. The new `query_timeout` is a backstop |
| T-B8-04: a backend killed mid-transaction is a defect, the process stays up, and the next transaction commits | `db.ts`: `checkOut`'s held-client listener and `checkIn` |
| T-B8-05: a non-English lc_messages fails the build | `db.ts`: `isEnglish` |
| T-B8-06 and T-B8-07, and Step 1 item 4 ("same key and body returns the first response", including a `null` one) | `idempotency.ts`, `errors.ts` |
| T-B8-08 | `rate-limit.ts`, `errors.ts` |
| AGENTS.md, Writing Effect rule 5: every external call has a timeout (rigg-04) | `db.ts`: `query_timeout` |

## Deviations

1. **a1's deviations stand.** Axis accepted each one:
   - `RateLimitLive` has the error type `never`.
   - The defect keeps the pg code and the query text.
   - The window is aligned to the Clock's minute.
2. **A `complete` that matches no row in progress is a silent no-op.** It doesn't die or report anything. rigg-05 allowed either; Axis's relay named only the `where`. A late answer that dies would turn a write that succeeded into a 500.
3. **`complete` doesn't also match the route and body hash,** which rigg-05 suggested. Axis's relay asked only for `status = 'in_progress'`, and matching them wouldn't tell a takeover by the same retried request apart (see Limitations).

## Limitations

- **rigg-05's takeover case is only partly closed.** Suppose request A outlives its key's 24 hours, B takes the expired row over, and A completes while B is still in progress. Then A's `complete` still matches, because the row is `in_progress`, and A overwrites it.
  - Closing this fully needs a claim token from `begin` that `complete` must present.
  - The locked tests fix the signature `complete(principal, key, status, response, { sensitive })`, so that would be a contract change for Axis or Javaris, probably with T-B10.
- **A connection that goes half-open is bounded twice in the worst case.**
  - The query gives up after `query_timeout`. `checkIn`'s rollback then waits up to its own `query_timeout` before the client is destroyed: about 70 s by default.
  - There's no test for this. rigg-04's check needs a proxy mode that stalls an established socket, and only Rigg can add it, under F2.
- **No test covers the rigg-01 or rigg-05 fixes yet.** Only my throwaway check did. rigg-01 suggests the test for Rigg.
- **Carried over from a2:**
  - `.env.example` doesn't list the new settings. `.env*` is outside my territory.
  - Reading-list item 10, `sprint-02/findings/t-b3-rigg-01.md`, doesn't exist.
  - Neither service is wired into a route yet. That happens in T-B9, T-B10 and T-B11.

## Messages received

1. **From OSA, relaying Axis (lead), a3, review round 2:**
   1. Fix t-b8-rigg-01 in SQL inside `idempotency.ts`, with no schema change. **Followed.**
   2. Consider rigg-04: `query_timeout` a little above the statement timeout, in `db.ts`. **Followed:** statement + 5000 ms.
   3. Make `complete` conditional on `status = 'in_progress'`, and leave the 24-hour in-progress behaviour alone. **Followed.**
   4. rigg-02 and rigg-03 aren't mine. **Followed:** neither was touched.
   5. Change no test, run all the verify commands, and give each finding as fixed or declined, with a reason. **Followed:** see Findings and Pre-flight.

   Every instruction stayed inside the territory and the task. None added a file, touched a locked test, added a dependency or changed rigor.
2. **Earlier attempts' instructions** are in a1's report (`18054a6`) and a2's report (`d5dff88`).
