status: done
ticket: T-F8

# T-F8 · tests · Fenn: completion report

## Pre-flight
Node 22+ was not on PATH; I used nvm's v24.22.2. `pnpm build` was run first (workspace packages must exist for vite).
- `vite build`: ok (builds; first-load JS is far over 150 KB, as expected on the start commit)
- `pnpm typecheck`: ok
- `pnpm lint`: ok (2 Biome warnings: `innerText` suggestions in my spec, not errors)
- `vitest run`: 6 files, 30 tests pass
- `playwright test` (whole suite): 9 passed, 3 failed. The 3 failures are the 3 new tests, which is the point.
- The pair `vitest run && playwright test` therefore exits non-zero on the start commit, as required for a tests dispatch.

## Failing first (start commit 53b12c8)
- T-F8-01 `e2e/budget.spec.ts`: `Expected: <= 153600  Received: 354051` (gzipped JS for /: index 110,551 + main 226,744 + icons 6,435 + world 9,000 + routes 347 B)
- T-F8-02 `e2e/control-room-budget/budget.spec.ts`: `#/library fetched no script of its own the first time. Expected: > 0  Received: 0` (nothing is split; every page is in the first load)
- T-F8-03 same file, 390x844 on slow 4G: `JS fetched before the first card ... Expected: <= 153600  Received: 353077`

## What changed
- `apps/web/e2e/budget.spec.ts`: LIMIT 350 KB to 150 KB, WARN 150 KB to 130 KB, comments and titles updated (T-F8-01). Its other tests are unchanged.
- `apps/web/e2e/control-room-budget/preview.ts`: helper that builds once and serves `vite preview`.
- `apps/web/e2e/control-room-budget/budget.spec.ts`: T-F8-02 and T-F8-03.

## Contract to files
- T-F8-01: budget.spec.ts (E16, CR-W29 decision 6; warning over 130 KB, still annotated).
- T-F8-02: opens #/library, #/live and #/missions/01a1912f... (Spring launch site, running) from a loaded Decisions page. Each must fetch at least one script not seen before, show its h1 and non-trivial main text, and show no Skeleton once idle. Reopening Library fetches nothing and renders identical text. Axe and screenshot at the end.
- T-F8-03: CDP slow 4G (1.6 Mbps down, 150 ms RTT), 390x844. The first `DecisionHero` must be visible (30 s expect timeout, no sleeps), and the gzipped JS fetched by then (and by idle) must be at most 150 KB. Axe and screenshot at the end. Video and screenshot come from the config.

## Deviations
- Task said "one test per task in the test paths"; T-F8-01 lives in the existing root budget.spec.ts, as the task names.
- The "same text as before the split" claim can't compare against a pre-split run, so it asserts the page's own h1 and that main text is substantial and stable on reopen. It is not a snapshot.
- The state coverage (loading/empty/error) is the pages' own earlier locked tests; this ticket changes none. The loading state is asserted only as "no Skeleton left once idle".

## Limitations
- T-F8-02 requires a fresh script per page. If the builder merges two pages into one shared chunk (e.g. Live and Progress), the second would fetch nothing new and fail; that is a legitimate dispute for Zero.
- Throughput is measured as gzipped bytes, since `vite preview` doesn't compress; wall-clock speed isn't asserted.
- Run needed `pnpm build` of workspace packages; no Postgres is used by these tests.

## Lock line
- T-F8: apps/web/e2e/budget.spec.ts, apps/web/e2e/control-room-budget/budget.spec.ts, apps/web/e2e/control-room-budget/preview.ts @ <branch tip>

## Messages received
None
