status: done
ticket: T-F12

# T-F12 · build a3 · Fantem: completion report

Branch `t/F12-sign-in`, head `edddf73` before this report. Build a3 reruns Part 7 on a2's commits. Since then three things landed: Fenn's tests a3 (`eb22e6f`, the F2 fix that holds T-F8-03 to 235 KB), Zero's relock (`4d60ad7`) and the merge of main (#91, `edddf73`). As Zero expected, **a3 changes no code.** The only a3 commit is this report. It replaces a2's report at this path, and a2's and a1's are kept at `<git common dir>/avel/reports/frontend-sprint-12-agent-fantem-t-f12-build.a{1,2}.md`.

**In short:** every Part 7 command passes. Each Playwright run has **328 passed, 0 failed, 1 skipped** (T-F7-05, quarantined before this ticket). a2's dispute, T-F8-03, now passes under the 235 KB figure.

**`/`'s budget, by budget.spec's own method: 226,586 B gzipped (221.3 KB).** That is 12 scripts plus 1,152 B of inline script. The limit is 240,640 B (235 KB) and the warning is at 230,400 B (225 KB), so `/` is under both, and budget.spec passed in both full runs with no warning. a2 measured 226,587 B; the 1 B is in the inline script. budget.spec prints its total only over the warning, so I took the number from a scratch copy that adds one `console.log` (how: Limitations).

## Pre-flight

Postgres: `scripts/pg-local.sh start`, this worktree's own database (D5). Node v24.22.2 and pnpm 10.33.2 from nvm. `pnpm install --frozen-lockfile` first. I didn't run the full suite separately before starting: a3 has no code change, so Part 7's first run is the starting state (Deviations).

**Part 7, at `edddf73`**, run in order by one script, with each command's own exit code:

| # | Command | Result |
| --- | --- | --- |
| 1 | `pnpm build` | pass (exit 0; turbo cache, 2 of 2 tasks) |
| 2 | `pnpm typecheck` | pass (exit 0) |
| 3 | `pnpm lint` | pass (exit 0): 340 files, no errors, 6 warnings, the same 6 as a1, a2 and Fenn's baseline, in files this ticket doesn't touch |
| 4 | `vitest run && playwright test` | vitest: 10 files, 81 tests pass. Playwright: **328 passed, 1 skipped**, 20.4 min. Exit 0 |
| 5 | `vitest run` | 10 files, 81 tests pass |
| 6 | `playwright test` | **328 passed, 1 skipped**, 25.9 min. Exit 0. No failed, flaky or budget-warning lines |
| 7 | `vite build` | pass (exit 0) |
| 8 | `pnpm typecheck` | pass (exit 0) |
| 9 | `pnpm lint` | pass (exit 0), the same 6 warnings |

**Per task** (all pass in both full runs):

| Task | Test | Result |
| --- | --- | --- |
| T-F12-01 · LG-03 | `test/sign-in/safe-next.test.ts` | pass |
| T-F12-02 | `test/sign-in/api.test.ts` | pass |
| T-F12-03 · LG-02, LG-04 | `e2e/sign-in/submit.spec.ts` | pass |
| T-F12-04 · LG-20 | `e2e/sign-in/guard.spec.ts` | pass |
| T-F12-05 · LG-21 | `e2e/sign-in/layout.spec.ts` | pass |
| T-F12-06 · Step 1 test 7 | `e2e/sign-in/lockout.spec.ts` | pass |
| T-F12-07 · LG-22 | `e2e/sign-in/sign-out.spec.ts` | pass |
| T-F12-08 | `e2e/budget.spec.ts`: `/` ≤ 235 KB | pass: 226,586 B, no warning |
| T-F12-09 · LG-23 | `auth.setup.ts`, `storage-state.spec.ts`, every T-F7 to T-F11 spec signed in | pass |
| T-F12-10 | `budget.spec.ts` (both tests, including "no built file contains the mock's operator id"), `control-room/prod.spec.ts` (T-F7-07), `control-room-budget` T-F8-02 and T-F8-03 | pass |

**End-to-end screenshot:** `apps/web/test-results/sign-in-sign-out-T-F12-07--1a6fc-and-Back-lands-on-login-too-sign-in/test-finished-1.png`, from step 6's run. The test signs in to `/#/settings`, signs out, then goes Back, and the shot is the Sign in card: AVEL's mark, Email focused, Password, and the Sign in button. I checked it by eye. T-F8-03's shot, now a pass, is `control-room-budget-budget-4410e-sible-within-the-first-load-signed-in/test-finished-1.png`. `test-results/` is git-ignored; CI's artifacts carry the shots (F6).

## What changed

a3: only this report. The ticket's files, all from a1 and a2 and unchanged since:

| File | Why | Attempt |
| --- | --- | --- |
| `apps/web/src/auth/index.ts` | `safeNext(raw, origin)`: login.md section 2's five rules, exactly | a1 |
| `apps/web/src/auth/api.ts` | The only caller of `/api/auth/*` (section 1). `getSession` forwards only the cookie and rebuilds `{ session: { id, userId, expiresAt }, user: { id, email, name } }` from named fields, with no `token` and no `ipAddress`. Signed out it returns `null`, and any other answer throws. `signIn` and `signOut` read the status only, plus `X-Retry-After` on a 429. Each call has a 10 s timeout | a1 |
| `apps/web/src/auth/origin.ts` | `appOrigin()`: the request's origin on the server and `window.location.origin` in the browser, for `safeNext` | a1 |
| `apps/web/src/routes/__root.tsx` | The guard. One server function, `readRoot`, reads the theme cookie and the session; a failed read is `null`. `beforeLoad` sends a signed-out request on any path but `/login` to `/login?next=…` (on the server that's a 307, so the shell is never drawn). Signed in on `/login`, it sends you to `safeNext(next)` | a1 |
| `apps/web/src/routes/login.tsx` | `/login`: `ssr: true`, `validateSearch` through `safeNext`, the title `Sign in · AVEL`, and `login.css` linked in the head | a1 |
| `apps/web/src/auth/LoginScreen.tsx` | Section 3's screen, copy and states: empty field, busy, one request at a time, 401, 429 with and without `X-Retry-After`, and other errors. The export's equivalents of `mh`, `Button` and `StatusGlyph` are named in comments | a1 |
| `apps/web/src/auth/login.css` | The export's stylesheets and tokens, then the card. At 760px and narrower: 44px fields and a 44px button | a1 |
| `apps/web/src/auth/AccountSection.tsx` | Section 4: `Signed in as {email}` and Sign out. A 200 goes to `/login` with replace; anything else shows the error copy | a1 |
| `apps/web/control-room/src/pages/settings/SettingsPage.jsx` | Its Account section is now `AccountSection` | a1 |
| `apps/web/control-room/SOURCE.md` | Logs the SettingsPage change, and adds the B7 line: from T-F14 on, each ticket logs its changes to the export in `changes/<ticket id>.md` | a1 |
| `apps/web/src/routeTree.gen.ts` | Regenerated by the router plugin for `/login` | a1 |
| `apps/web/vite.config.ts` | `mockApi()` gains `configurePreviewServer`, which shares one `serveMock` handler with `configureServer`. It still runs only under `AVEL_API=mock` and still loads the mock by dynamic import, so nothing of it reaches `dist/` | a2 |
| this report | Part 7 | a3 |

`git diff main...HEAD --name-only` holds only the files above, this ticket's locked tests, Fenn's report and `locks.md`.

## Contract to files

| Requirement | Where |
| --- | --- |
| login.md §0 and §1: one fetch module, only the named fields, nothing in storage or a URL but `next` | `auth/api.ts` |
| §2: the server-side guard, `safeNext`, a failed read is signed out | `__root.tsx`, `auth/index.ts`, `routes/login.tsx` |
| §3: markup, copy, states, 44px at ≤760px | `LoginScreen.tsx`, `login.css` |
| §4: sign-out in Settings | `AccountSection.tsx`, `SettingsPage.jsx` |
| Nov 21 amendment: the preview serves the mock only under `AVEL_API=mock` | `vite.config.ts` |
| CR-W29 decision 6, second amendment: `/` ≤ 235 KB, warning over 225 KB | 226,586 B; budget.spec and T-F8-03 pass |
| Step 1 plan item 5 and test 7: lockout | `lockout.spec` passes |
| E15 to E17 | No money and no password outside the form; text only; `/login` at 112.2 KB (a1's figure; its code is unchanged); axe WCAG 2.2 AA passes on `/login` and Settings |

## Deviations

1. **No separate starting-state run.** a3 has no code change, so Part 7's first full run is the starting state. I didn't run the suite once more first.
2. **No lesson line in `.agents/memory/fantem.md`.** As in a2: this task doc's territory says never change `.agents/**`, and the full-diff rule makes any other file a P1. The lesson ("when a budget figure changes, grep every spec for a copy of the old one") is already in OSA's memory.

## Limitations

- **The `/` figure comes from a scratch copy of budget.spec,** in the session scratchpad, outside the repo. It's the same file with absolute import paths and one added `console.log(total)`, run with its own Playwright config against a fresh build and preview. Both its tests passed. No repo file changed for it.
- **I didn't check by hand that a preview without `AVEL_API=mock` serves no `/api`** (as in a2). It follows from the code: `serveMock` returns before registering anything unless `AVEL_API=mock`.
- a1's limitations still hold:
  - The sidebar's own export Sign out is outside this ticket's territory.
  - Every navigation makes one `readRoot` call.
  - The origin comes from the Host header.
  - `reason=expired` is drawn but not tested here; LG-06 is T-F14's.

## Messages received

1. **OSA, relaying Zero (Nov 21):** "a3 reruns Part 7 on a2's commits (1e4a285) after Fenn's F2 (eb22e6f, T-F8-03 to 235 KB) and the relock 4d60ad7; main (#91) is merged in at edddf73; no code change is expected; if anything other than that fails, stop and report it."
   - Followed. It narrows the task doc and doesn't widen it.
   - I reran Part 7 at `edddf73` and changed no code.
   - Nothing failed, so there was nothing to stop for.
