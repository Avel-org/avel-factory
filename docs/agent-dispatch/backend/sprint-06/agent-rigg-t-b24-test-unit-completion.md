status: done
ticket: T-B24

# T-B24 tests: completion report (Rigg)

## Pre-flight
| Command | Result |
| --- | --- |
| `pnpm build` | passes |
| `pnpm typecheck` | fails only in `@avel/server`: `test/decisions/07-per-mission-count.test.ts` imports `src/factory/decisions/index.ts`, which doesn't exist yet (TS2307 and the `unknown` that follows). Nothing else fails |
| `pnpm lint` | passes (6 warnings, none in my files) |
| `pnpm --filter @avel/server check:effect` | 0 errors, 13 warnings (none mine) |
| `pnpm --filter @avel/server test` | 143 passed, 12 failed: my 11 tests in 7 files, plus `platform-hardening/pool-timeouts.test.ts` (T-B8-02), an existing timing test I didn't touch. It failed under the full suite's load; I did not re-run it on its own or on a clean `main` checkout |
| root `pnpm test`, final `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | not run as one chain: typecheck fails by design until the build adds the seam above. The server suite ran as shown |

## Failing first
On the start commit (no route 52, 53 or 104; no `src/factory/`), every one of my tests fails. Excerpts from `pnpm --filter @avel/server exec vitest run test/decisions test/status`:

```
FAIL test/decisions/01-open-items.test.ts   (2 tests)   AssertionError: expected 404 to be 200
FAIL test/decisions/02-order-and-paging.test.ts (2)     AssertionError: expected 404 to be 200
FAIL test/decisions/03-route-53.test.ts     (3)         AssertionError: expected 404 to be 200
FAIL test/decisions/05-unauthenticated.test.ts          AssertionError: expected 404 to be 401
FAIL test/decisions/06-plain-text.test.ts               AssertionError: expected 404 to be 200
FAIL test/status/04-status.test.ts          (2)         AssertionError: expected 404 to be 200
FAIL test/decisions/07-per-mission-count.test.ts        Error: Cannot find module '../../src/factory/decisions/index.ts'
Tests 11 failed (11)
```
The 404 test in 03 first reads a seeded proposal and needs a 200, so it can't pass on a missing route. Every seed insert ran (it got as far as the 404), so the failures are the missing build, not my fixtures.

## What changed
All new, under my territory:
- `packages/server/test/decisions/support.ts`: the seams, seed helpers (SQL inserts with foreign keys off, `session_replication_role = replica`), and list helpers.
- `decisions/01-open-items.test.ts`: T-B24-01. `02-order-and-paging.test.ts`: T-B24-02. `03-route-53.test.ts`: T-B24-03. `05-unauthenticated.test.ts`: T-B24-05. `06-plain-text.test.ts`: T-B24-06. `07-per-mission-count.test.ts`: T-B24-07.
- `packages/server/test/status/04-status.test.ts`: T-B24-04.
- This report.

## Contract to files
- 01: route 52 serves nine kinds, one row each, valid against `PendingDecisionDto`, with resolved, expired, superseded and past-due proposals absent. `factory_change` is not served (its PRs live on GitHub, not in a table; they come with routes 72 and 73).
- 02: order returned first, expiring soonest, then no-expiry items oldest first; cursor paging at limits 1, 3, 4 equals the unpaged list.
- 03: route 53 `ProposalViewDto` (open and resolved) and 404 with the request's `requestId`.
- 04: route 104 slots `{ busy: 2, total: 6 }`, `needsYouCount` equal to route 52's count (9), uncleared alerts, `lastSeq`, no money.
- 05: 401 `UNAUTHORIZED` with `requestId` on routes 52, 53, 104 (no cookie and a bad cookie).
- 06: `<script>alert(1)</script>` comes back as the same characters on routes 52 and 53.
- 07: `countPendingDecisionsByMission` counts only each mission's items.

## Deviations
- **E13's four, for GETs:** all three routes are reads. They have no `Idempotency-Key` to replay and no `rowVersion` to go stale, so those two have no test. In their place: a repeated read of route 53 returns the same view (03), and the 401 and 404 bodies are checked (05, 03).
- **Seam I had to name (confirm before the lock):** the task says only "exported from its index.ts with a per-mission count". I wrote `countPendingDecisionsByMission: Effect<ReadonlyMap<string, number>, never, Db>` from `src/factory/decisions/index.ts`. If T-B25 needs another signature, tell me before the lock.
- **Where each open item comes from (my reading of DATABASE.md and CR-W2/W15; Axis should confirm; listed in `support.ts`):** a draft checkpoint; a draft plan; an unanswered question with no `after`; a `pass` receipt with no pass approval; a `verified` receipt on an `awaiting_release` mission with no release approval; a `mission_docs` row awaiting confirmation with Gate 1 passed; a drafted follow-up or upkeep offer; a returned item is an open proposal that another proposal names in `superseded_by`. Docs say less about some of these than E3 wants. If Axis rules any of them differently, it's a `test-dispute` on my side, not a build bug.
- Order of rows with no expiry: I assume they sort after rows that expire (CR-W2 gives no rule). Deadline risk isn't tested: no column holds it that I could place.
- `slots.busy` is tested with `running` against `pending` and `succeeded` only; `starting` and `reporting` are left to the build.
- Time is the database's `now()` and real clock, since route handlers read the real clock; nothing sleeps.

## Limitations
- I couldn't run the expectations that need the built routes (row shapes, order, status values); only the seeds and the failing state are proven. Expect the first build run to expose wrong guesses about the seed rows.
- Seeds switch foreign keys off, so they don't prove the build's joins hold on FK-valid data.
- Not covered: the `?missionId=` filter on route 52, `plain` wording per kind, `previous` contents beyond non-null, the 10th kind.
- `pool-timeouts.test.ts` failed in the full run (see Pre-flight); not mine.

## Lock line
- T-B24: packages/server/test/decisions/support.ts, packages/server/test/decisions/01-open-items.test.ts, packages/server/test/decisions/02-order-and-paging.test.ts, packages/server/test/decisions/03-route-53.test.ts, packages/server/test/decisions/05-unauthenticated.test.ts, packages/server/test/decisions/06-plain-text.test.ts, packages/server/test/decisions/07-per-mission-count.test.ts, packages/server/test/status/04-status.test.ts @ <branch tip>

## Messages received
None.
