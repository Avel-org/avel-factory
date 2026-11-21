status: test-dispute
ticket: T-F12

# T-F12 · build a2 · Fantem: completion report

Branch `t/F12-sign-in`. Build a2, on top of a1's commits (`ac7a924`, `bea5a45`, `1dd1af8`, `33afc82`) and Fenn's tests a2 and relock (`76fdaf1`, `5ecc3b9`). This replaces a1's report at this path; a1's is kept at `<git common dir>/avel/reports/frontend-sprint-12-agent-fantem-t-f12-build.a1.md`. Not pushed: the status isn't done.

**In short:** the preview hook (the Nov 21 amendment) is in, as one commit, `1e4a285`. Four of a1's five failing preview tests now pass: budget.spec (T-F12-08) and both T-F7-07 tests, plus T-F8-02. **One locked test still fails, T-F8-03, and it's a test-dispute:** `e2e/control-room-budget/budget.spec.ts` holds `/` to its own `LIMIT = 220 * 1024`, the figure CR-W29 decision 6's second amendment replaced with 235 KB. Only `e2e/budget.spec.ts`'s limit was changed. `/`'s first load before the first decision card is 225,434 B, 154 B over the old 220 KB (225,280 B) and well under the amendment's 235 KB.

**`/`'s budget, by budget.spec's own method: 226,587 B gzipped (221.3 KB)**, 12 scripts plus 1,153 B of inline script. The limit is 240,640 B (235 KB) and the warning is at 230,400 B (225 KB), so it's under both, and budget.spec passes with no warning. budget.spec prints its total only over the warning, so I took the number from a scratch copy that adds one `console.log` (how: Limitations).

## The dispute: T-F8-03

| | |
| --- | --- |
| Test | `e2e/control-room-budget/budget.spec.ts:101` › T-F8-03: a phone on slow 4G › the first decision card is visible within the first load |
| Assertion | `expect(total, "JS fetched before the first card: …").toBeLessThanOrEqual(LIMIT)`, line 125, `LIMIT = 220 * 1024` (line 9) |
| Measured | 225,434 B: `index` 108,423, `main` 94,286, `world` 9,000, `icons` 6,435, `react` 3,008, `sheet` 1,084, `TabBar` 994, `dc` 664, `format` 464, `routes` 463, `rolldown-runtime` 429, `live` 184 |
| Over by | 154 B against 225,280 B; 15,206 B under the amendment's 240,640 B |
| Fails | every run: alone, and in both full Part 7 runs |

**Why it's the test, not the build:** CR-W29's second amendment says `/` "is held to at most 235 KB gzipped … It replaces the 220 KB limit", because T-F8 left 117 B of headroom and "T-F12's sign-in guard runs before Decisions is interactive". T-F8-03 checks the same thing, `/`'s first load, with its own copy of the old figure. Its comment says the limit "itself is held by e2e/budget.spec.ts", but the constant isn't imported from there, so the amendment never reached it. Under a1 this test couldn't reach Decisions (no `/api` in preview), so nobody saw it until the hook landed.

**What the 154 B is:** `/`'s entry chunk now carries the guard (`beforeLoad` and the server function's stub), and `/login`'s route options (`validateSearch` with `safeNext`, `head`). TanStack keeps route options in the entry chunk and splits only components. login.md section 2 puts `safeNext` in `/login`'s `validateSearch` ("an unsafe next is dropped here"). Squeezing 154 B out would mean moving that check out of `validateSearch` against login.md, or fiddling with byte counts to pass a superseded figure. Both are wrong, so I stopped (stop rule 7).

**Recommended fix (F2, Fenn):** set `control-room-budget/budget.spec.ts`'s `LIMIT` to `235 * 1024` with the amendment cited in its comment, or import budget.spec's `LIMIT` so the two can't drift. Nothing in this ticket's files changes. With that, the suite is green: the run below has 327 passed, 1 failed (this one), 1 skipped (T-F7-05, quarantined before this ticket).

## Pre-flight

Postgres: `scripts/pg-local.sh start`, this worktree's own database (D5). Node from nvm (v24.22.2, pnpm 10.33.2); the shell's default PATH had none. Fresh checkout: `pnpm install --frozen-lockfile`, then `pnpm build`.

**Starting state** (a2's start, `5ecc3b9`, before any change):

| Command | Result |
| --- | --- |
| `vitest run` | 10 files, 81 tests pass |
| `playwright test --project=setup --project=signed-in` on the five preview specs | 5 failed, 2 passed (the setup and budget.spec's dist check). Expected red: tests a2 starts the previews with `AVEL_API=mock`, and there was no hook yet |

I ran only the preview specs at the start, not the full 15-minute suite: a1's full run on the same product code is in its report (323 passed, 5 failed, 1 skipped), and tests a2 changed only the preview starters.

**After the hook, the preview specs alone:** 6 passed, 1 failed (T-F8-03).

**Part 7, at `1e4a285`:**

| # | Command | Result |
| --- | --- | --- |
| 1 | `pnpm build` | pass |
| 2 | `pnpm typecheck` | pass |
| 3 | `pnpm lint` | pass: 332 files, no errors, 6 warnings (the same 6 as a1 and Fenn's baseline, in files this ticket doesn't touch) |
| 4 | `vitest run && playwright test` | vitest: 10 files, 81 tests pass. Playwright: **327 passed, 1 failed (T-F8-03), 1 skipped**, 19.0 min. Exit 1 |
| 5 | `vitest run` | 10 files, 81 tests pass |
| 6 | `playwright test` | **327 passed, 1 failed (T-F8-03), 1 skipped**, 16.7 min. Exit 1 |
| 7 | `vite build` | pass |
| 8 | `pnpm typecheck` | pass |
| 9 | `pnpm lint` | pass, 6 warnings (as above) |

Also: `tsc -p apps/web/tsconfig.json --noEmit` passes (it includes `vite.config.ts`; `pnpm typecheck` doesn't cover apps/web), and `biome check apps/web/vite.config.ts` is clean.

**Per task:**

| Task | Test | Result |
| --- | --- | --- |
| T-F12-01 · LG-03 | `test/sign-in/safe-next.test.ts` | pass |
| T-F12-02 | `test/sign-in/api.test.ts` | pass |
| T-F12-03 · LG-02, LG-04 | `e2e/sign-in/submit.spec.ts` | pass |
| T-F12-04 · LG-20 | `e2e/sign-in/guard.spec.ts` | pass |
| T-F12-05 · LG-21 | `e2e/sign-in/layout.spec.ts` | pass |
| T-F12-06 · Step 1 test 7 | `e2e/sign-in/lockout.spec.ts` | pass |
| T-F12-07 · LG-22 | `e2e/sign-in/sign-out.spec.ts` | pass |
| T-F12-08 | `e2e/budget.spec.ts`: `/` ≤ 235 KB | pass, 226,587 B, no warning |
| T-F12-09 · LG-23 | `auth.setup.ts`, `storage-state.spec.ts`, every T-F7 to T-F11 spec signed in | pass |
| T-F12-10 | `budget.spec.ts` (both tests), `control-room/prod.spec.ts` (T-F7-07, 3 tests), `control-room-budget` T-F8-02 | pass |
| T-F12-10 | `control-room-budget` T-F8-03 | **fails: the dispute** |

**End-to-end screenshot:** `apps/web/test-results/sign-in-sign-out-T-F12-07--1a6fc-and-Back-lands-on-login-too-sign-in/test-finished-1.png` (sign in to `/#/settings`, Sign out, Back: Sign in). The preview's own shots: T-F8-02's in `control-room-budget-budget-9aade-r-own-script-the-first-time-signed-in/test-finished-1.png`, and T-F8-03's failure shot in `control-room-budget-budget-4410e-sible-within-the-first-load-signed-in/test-failed-1.png`. That one shows Decisions drawn signed in on the phone preview, with the first card and its actions, so T-F8-03 fails on bytes, not on the guard. I checked both, and the sign-out shot, by eye. The scratch budget run cleared `test-results/`, so these three come from a rerun after Part 7 (`sign-out.spec` and `control-room-budget`: 3 passed, 1 failed, T-F8-03 again). `test-results/` is git-ignored; CI's artifacts carry them (F6).

## What changed (a2)

| File | Why |
| --- | --- |
| `apps/web/vite.config.ts` | `mockApi()` gains `configurePreviewServer` beside `configureServer`. Both call one `serveMock(middlewares: Connect.Server)`, the dev server's former handler moved unchanged, so it isn't copied. It still returns before anything when `AVEL_API !== "mock"`, still loads `@avel/contract-mock` and `@avel/contract` by dynamic import, and the plugin is still `apply: "serve"` (vite preview resolves its config as `serve`, which is why the hook runs there). Nothing of the mock reaches `dist/` (budget.spec's second test passes). The guard is unchanged |
| this report | Part 7 |

a1's files (`src/auth/*`, `routes/__root.tsx`, `routes/login.tsx`, `routeTree.gen.ts`, `SettingsPage.jsx`, `SOURCE.md`) are unchanged in a2; a1's report describes them.

## Contract to files

| Requirement | Where |
| --- | --- |
| Amendment Nov 21: the preview serves the mock under `AVEL_API=mock`, one shared handler, a dynamic import, nothing in `dist/`, no `/api` without it | `vite.config.ts` `mockApi`, `serveMock` |
| The guard is unchanged: a failed session read is signed out | `routes/__root.tsx` untouched in a2 |
| CR-W29 decision 6, second amendment: `/` ≤ 235 KB, warn over 225 KB | 226,587 B, budget.spec passes |
| E16: `/login` | 114,919 B (a1's measure; its code is unchanged) |

## Deviations

1. **I didn't run the full suite before changing anything**, only vitest and the five preview specs. a1's full run on the same product code stands for the rest, and tests a2 changed only the preview starters.
2. **No lesson line in `.agents/memory/fantem.md`.** My prompt asks for one, but this task doc's territory says never change `.agents/**`, and the full-diff rule makes any other file a P1. The lesson I'd add: when a budget figure changes, grep every spec for a copy of the old one before the build starts.

## Limitations

- **T-F8-03 fails until Fenn's F2 fix** (the dispute). CI is red on it.
- **The `/` figure comes from a scratch copy of budget.spec,** in the session scratchpad, outside the repo: the same file with absolute import paths and one added `console.log(total)`, run against the same build and preview. Its two tests passed too. No repo file changed for it.
- **I didn't check by hand that a preview without `AVEL_API=mock` answers no `/api`:** the sandbox refused a background preview stopped with `pkill`. It follows from the code: `serveMock` returns before registering anything unless `AVEL_API=mock`, the same guard the dev server has always had.
- **I didn't run T-F8-03 on main for a side-by-side.** It passed there (Fenn's baseline, 303 passed), so `/`'s first load before the card was at most 225,280 B on main. T-F8 left 117 B of headroom by budget.spec's measure.
- a1's limitations still hold (the sidebar's own Sign out, one `readRoot` per navigation, the origin from Host, `reason=expired` untested here).

## Messages received

None. No instruction reached this session.
