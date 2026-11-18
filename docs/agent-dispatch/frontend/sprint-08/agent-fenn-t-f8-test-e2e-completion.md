status: done
ticket: T-F8

# T-F8 · tests · Fenn: completion report (attempt 2)

## Pre-flight
Node from nvm (not on PATH by default); `pnpm install --frozen-lockfile` and `pnpm build` run first.
- `vite build`: ok (run by the budget test itself)
- `pnpm typecheck`: ok
- `pnpm lint`: ok (2 Biome warnings, `innerText` suggestions, no errors)
- `vitest run`: 6 files, 30 tests pass
- `playwright test`: 9 passed, 3 failed (the 3 T-F8 tests, as intended). So `vitest run && playwright test` exits non-zero on the start commit.
- Postgres: started with pg-local.sh; these tests don't use it.

## Failing first (start commit 50ab754 plus a1 tests; a2 limit 220 KB = 225,280 B)
- T-F8-01 `e2e/budget.spec.ts`: gzipped JS for / is 354,051 B (index 110,551 + main 226,744 + icons 6,435 + world 9,000 + routes 347); limit 225,280.
- T-F8-02 `e2e/control-room-budget/budget.spec.ts`: `#/library fetched no script of its own the first time. Expected: > 0 Received: 0`.
- T-F8-03 same file, 390x844 slow 4G: `JS fetched before the first card ... Expected: <= 225280 Received: 353077`.

## What changed
- Commit a5df9d0: `apps/web/e2e/budget.spec.ts`: LIMIT 150 to 220 × 1024, WARN 130 to 200 × 1024.
- `apps/web/e2e/control-room-budget/budget.spec.ts`: LIMIT 150 to 220 × 1024.
- Nothing else in a1's tests changed (T-F8-04).

## Contract to files
- T-F8-04: the two constants above. T-F8-01 and T-F8-03 now hold 220 KB (CR-W29 decision 6 as amended); T-F8-02 is unchanged.

## Deviations
- Besides the constants, I changed the numbers in the text that states them: one comment, the describe title, the test title ("at most 220 KB gzipped"), the warning annotation ("over 200 KB") and a comment in the phone spec. Left as they were they would say 150/130 while the code holds 220/200. No assertion changed. If Zero reads "nothing else" strictly, this is the thing to revert.
- The phone test has no warning constant, so only its LIMIT changed.

## Limitations
- T-F8-02 needs a fresh script per page; a shared chunk for Live and Progress would fail it (a dispute for Zero).
- Sizes are gzipped bytes; wall-clock speed isn't asserted.
- Loading/empty/error states are covered by earlier locked tests; this test only asserts no Skeleton remains once idle.

## Lock line
- T-F8: apps/web/e2e/budget.spec.ts, apps/web/e2e/control-room-budget/budget.spec.ts, apps/web/e2e/control-room-budget/preview.ts @ <branch tip>

## Messages received
- OSA, relaying Zero (CR-37): do T-F8-04 in its own commit (220/200 KB in both specs, nothing else), re-check fail-first, report done. Followed; it matches the task doc. The only extra is the text-number updates under Deviations.
