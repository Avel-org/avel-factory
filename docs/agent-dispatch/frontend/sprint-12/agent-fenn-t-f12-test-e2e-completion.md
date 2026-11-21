status: done
ticket: T-F12

# T-F12 · tests · Fenn: completion report

Start commit: `45000c9` (`t/F12-sign-in`). Two things need Zero's eye before the lock: **T-F12-08 can't fail first**, and **the module surface the unit tests import is my reading** (see Deviations).

## Tests a3 (F2, Nov 21): T-F8-03's limit

Answers build a2's test-dispute at `692f243`, on Zero's ruling (Messages received).

- **Change:** `apps/web/e2e/control-room-budget/budget.spec.ts`: `LIMIT` is `235 * 1024` (was `220 * 1024`), and the comment on line 7 names CR-W29 decision 6's second amendment (235 KB, replaces 220 KB), the same figure `e2e/budget.spec.ts` holds. Nothing else; no import from budget.spec.ts. `LIMIT` is used only by T-F8-03's two assertions (lines 126 and 133), so no other page's limit moved.
- **Failing first:** not required. It's a relaxing fix (the old figure was superseded); the test failed at `692f243` on 225,434 B against 225,280 B, per build a2's report.
- **Result on the branch at `692f243` plus this change:** `playwright test --project=setup --project=signed-in e2e/control-room-budget`: 3 passed (setup, T-F8-02, T-F8-03). I did not remeasure the T-F8-03 byte total: the test prints it only on failure, so the figure is build a2's, 225,434 B (the code is unchanged), now 15,206 B under 240,640 B. `/` by e2e/budget.spec's method: 226,587 B (a2's figure).
- I did not rerun the full Part 7 suite: only this one spec file changed, in a2's own run it was the sole failure.

**Relock line (F2 relock, naming every path of the line at 5ecc3b9):**
`- T-F12: apps/web/e2e/budget.spec.ts, apps/web/e2e/sign-in/guard.spec.ts, apps/web/e2e/sign-in/helpers.ts, apps/web/e2e/sign-in/layout.spec.ts, apps/web/e2e/sign-in/lockout.spec.ts, apps/web/e2e/sign-in/sign-out.spec.ts, apps/web/e2e/sign-in/storage-state.spec.ts, apps/web/e2e/sign-in/submit.spec.ts, apps/web/e2e/support/auth.setup.ts, apps/web/playwright.config.ts, apps/web/test/sign-in/api.test.ts, apps/web/test/sign-in/safe-next.test.ts, apps/web/e2e/control-room/prod.spec.ts, apps/web/e2e/control-room-budget/budget.spec.ts, apps/web/e2e/control-room-budget/preview.ts, apps/web/e2e/support/preview-auth.ts @ <branch tip after this commit>`

**Messages received (a3):** OSA, relaying Zero's ruling: set `LIMIT` to 235 KB, change the line-7 comment, change nothing else, run the file, report the figure, add the relock line. Followed in full.

---

## Pre-flight
| Command | Result |
| --- | --- |
| `pnpm build` | pass (needed first: `@avel/contract` has no `dist` on a fresh checkout, so vitest and the dev server fail until it's built) |
| `pnpm typecheck` | pass (apps/web has no typecheck script, so its tests aren't type-checked by it) |
| `pnpm lint` | pass, 6 warnings, all in existing files |
| Start state, `vitest run` | 8 files, 47 tests pass |
| Start state, `playwright test` | 303 passed, 1 skipped (the existing quarantined T-F7-05 test), 12.8 min |
| `vite build` | pass |
| Final `vitest run` | 2 files fail (the new unit files, no module), 8 files and 47 tests pass |
| Final `playwright test` (full) | 26 failed, 302 passed, 1 skipped. 24 failures are the new sign-in specs. The other 2 were `prod.spec.ts`, caused by my first lockout port colliding with its preview port (`PREVIEW_PORT + 1`). Fixed (lockout is now `MOCK_PORT + 4`); `prod.spec.ts` re-run alone: 3 passed. I did not repeat the 16-minute full run after that one-line fix. |

## Failing first
Run on the start commit's product code (the working tree is `45000c9` plus only the test files). Playwright, `--project=setup --project=sign-in --project=lockout`: 1 passed (setup), 24 failed. Typical reasons:
```
✘ [sign-in] guard.spec.ts › the server answers / with a redirect to /login …   (/ answers 200, not a redirect)
✘ [sign-in] guard.spec.ts › opening / and /missions?x=1 lands on Sign in …
    Error: expect(locator).toBeVisible() failed
    - waiting for getByRole('heading', { name: 'Sign in', level: 1 })
✘ [sign-in] layout.spec.ts › LG-21 390/1280 × light/night (8 tests) and the 44px test   (no /login page)
✘ [sign-in] sign-out.spec.ts › LG-22 …              (no /login, no Account email line)
✘ [sign-in] storage-state.spec.ts › setup saved a cookie … and this project starts signed out   (/ draws the shell, not Sign in)
✘ [sign-in] submit.spec.ts › 7 tests               (beforeEach: /login has no Sign in heading)
✘ [lockout] lockout.spec.ts › the 11th failed sign-in …   (no /login)
```
Vitest:
```
FAIL test/sign-in/api.test.ts        Error: Cannot find package '@/auth/api' imported from …/api.test.ts
FAIL test/sign-in/safe-next.test.ts  Error: Cannot find package '@/auth' imported from …/safe-next.test.ts
Test Files  2 failed | 8 passed (10)
```
**Passes on the start commit (and why):**
- `setup` (auth.setup.ts): it signs in on the mock's wire, which already exists. It is infrastructure, not a behaviour. The behaviour (LG-23) is proven by `storage-state.spec.ts`, which fails.
- **T-F12-08, budget.spec.ts: passes on the start commit.** The brief says only LIMIT, WARN and their comment change, and raising a ceiling can't make a test fail. This is a B2 gap I can't close inside the brief. It does record the new figures; the build can't pass with the old ones. Zero: decide whether this is acceptable (a lead's waiver) or whether the budget spec should also assert something the guard adds.

## What changed
- `apps/web/test/sign-in/safe-next.test.ts` (T-F12-01): LG-03, `safeNext(raw, origin)`.
- `apps/web/test/sign-in/api.test.ts` (T-F12-02): `auth/api.ts` against the mock's raw shapes in process (`createMock` with a fixed `now`): only section 1's fields, cookie forwarded, status-only sign-in and sign-out, 401, 429 with 900 s, 500, rejected fetch.
- `apps/web/e2e/sign-in/submit.spec.ts` (T-F12-03): LG-02 and LG-04 in the browser.
- `apps/web/e2e/sign-in/guard.spec.ts` (T-F12-04): LG-20.
- `apps/web/e2e/sign-in/layout.spec.ts` (T-F12-05): LG-21.
- `apps/web/e2e/sign-in/lockout.spec.ts` (T-F12-06): 10 wrong passwords, then the right one on the 11th gets Too many attempts. It runs on its own dev server.
- `apps/web/e2e/sign-in/sign-out.spec.ts` (T-F12-07): LG-22.
- `apps/web/e2e/sign-in/storage-state.spec.ts` (T-F12-09): LG-23.
- `apps/web/e2e/sign-in/helpers.ts`: copy, locators, fill and submit (not a spec).
- `apps/web/e2e/support/auth.setup.ts`: signs in once through the mock, saves `test-results/.auth/operator.json` (git ignores `test-results/`).
- `apps/web/playwright.config.ts`: projects `setup`, `signed-in` (every existing spec, with the stored state), `sign-in` (LG specs, no state), `lockout` (its own dev server on `MOCK_PORT + 4`).
- `apps/web/e2e/budget.spec.ts`: LIMIT 235 KB, WARN 225 KB, and their comment. Nothing else.

## Contract to files
| Requirement | File |
| --- | --- |
| LG-03 | test/sign-in/safe-next.test.ts |
| login.md §1, brennan-03 | test/sign-in/api.test.ts |
| LG-02, LG-04 | e2e/sign-in/submit.spec.ts |
| LG-05 (server guard), LG-20, no cookie or "token" in HTML | e2e/sign-in/guard.spec.ts |
| LG-21, E17 on /login | e2e/sign-in/layout.spec.ts (axe also in submit, lockout and sign-out) |
| Step 1 test 7 | e2e/sign-in/lockout.spec.ts |
| LG-22 | e2e/sign-in/sign-out.spec.ts |
| LG-23 | auth.setup.ts, playwright.config.ts, storage-state.spec.ts |
| CR-W29 decision 6, second amendment | e2e/budget.spec.ts |
| Rules: no password on approvals, no money, plain text | not touched by this screen; the existing T-F10 specs still run signed in |

## Deviations
1. **LG-02 and LG-04 are browser tests, not jsdom unit tests.** `apps/web` has no jsdom or testing library and `package.json` is locked. They use `page.route` for the wire and `page.clock.setFixedTime` (13:55 UTC plus 600 s gives 14:05, timezone UTC) for the fixed now. Nothing waits on the wall clock; "busy" holds the response on a promise.
2. **The unit tests import names the brief doesn't give.** I chose: `safeNext(raw, origin)` from `@/auth` (`apps/web/src/auth/index.ts`, as login.md puts it in system's index.ts); and from `@/auth/api`: `getSession({ cookie?, origin? })` → `{ session: { id, userId, expiresAt }, user: { id, email, name } } | null`, `signIn(email, password)` → `{ status, retryAfterSeconds }`, `signOut()` → `{ status }`. If Zero wants other names, that's a change before the lock, not after.
3. **UI copy and shape assumed from login.md section 3:** labels `Email` and `Password`, button `Sign in` / `Signing in…`, `role="alert"`, `Sign in · AVEL`, `Signed in as {email}`, 24-hour `HH:MM`. Sign-in lands via `/#/settings` for LG-22.
4. **The lockout project** is an extra dev server; the mock's lockout is per email and the whole suite shares the operator, so locking it on the main server would break every other sign-in for 15 minutes.
5. **budget.spec.ts titles** still say "220 KB": the brief limits the change to LIMIT, WARN and the comment, so I left them. The warning text still says "over 200 KB" for the same reason.

## Limitations
- **Risk for the build: budget.spec runs `vite preview` with `AVEL_API=""`.** The preview has no `/api`, so a guard that treats a failed session read as signed out will send `/` to `/login`, and the budget test (and `prod.spec.ts`) could not reach the Decisions home. The brief says the mock isn't in production builds and the budget spec's measure stays T-F8's. Fantem may hit this; it may need a Zero ruling (a test-dispute or CR), not a quiet loosening.
- LG-06 (a contract 401 mid-session) is T-F14's and isn't tested here.
- "No page's HTML holds the session cookie" is checked on the `/missions?x=1` page, the server's answer for `/`, and the live page content, not on every route.
- The mock's cookie is `HttpOnly`; the tests only read it through the browser context.
- The Account section's `Signed in as` text is asserted exactly; the export's current SettingsPage still shows a fixed "Javaris / Operator" row.
- Videos and screenshots follow the config's `on` settings; each LG spec also attaches named screenshots.

## Lock line
- T-F12: apps/web/test/sign-in/safe-next.test.ts, apps/web/test/sign-in/api.test.ts, apps/web/e2e/sign-in/helpers.ts, apps/web/e2e/sign-in/submit.spec.ts, apps/web/e2e/sign-in/guard.spec.ts, apps/web/e2e/sign-in/layout.spec.ts, apps/web/e2e/sign-in/lockout.spec.ts, apps/web/e2e/sign-in/sign-out.spec.ts, apps/web/e2e/sign-in/storage-state.spec.ts, apps/web/e2e/support/auth.setup.ts, apps/web/playwright.config.ts, apps/web/e2e/budget.spec.ts @ <branch tip>

## Messages received
None.

---

# Tests a2 (F2, Nov 21): the production-preview starters (T-F12-10)

status: done
ticket: T-F12

## Pre-flight (a2)
| Command | Result |
| --- | --- |
| `pnpm build`, `pnpm typecheck` | pass |
| `pnpm lint` | pass, 6 warnings, all in existing files |
| `vitest run` | 10 files, 81 tests pass |
| `playwright test` (full) | **5 failed, 323 passed, 1 skipped** (the quarantined T-F7-05), 26.4 min; the 5 are exactly the preview specs below |
| `vite build` | pass |

## Failing first (a2)
On the branch (build a1's commits, no preview hook), all five fail in `signInOnPreview`, before their first goto, because `vite preview` has no /api: sign-in answers 200 with the /login HTML page, not the mock's JSON:

    Error: sign-in's body is the mock's JSON, not a page (got: <!DOCTYPE html><html lang="en" data-th…)
    - e2e/budget.spec.ts:115 T-F8-01 (the / budget)
    - e2e/control-room/prod.spec.ts:82 and :102 (T-F7-07)
    - e2e/control-room-budget/budget.spec.ts:47 (T-F8-02) and :101 (T-F8-03)

(First run, with the weaker status-only check, they failed at `/` showing /login: `[data-ui="DecisionHero"]`/nav not found. I tightened the helper so the reason is named.)

## What changed (a2)
- `apps/web/e2e/support/preview-auth.ts` (new): `PREVIEW_ENV` (`AVEL_API=mock`) and `signInOnPreview(ctx, origin)`, which posts the mock operator's sign-in and asserts a 200 JSON answer and the session cookie.
- `apps/web/e2e/budget.spec.ts`, `control-room/prod.spec.ts`, `control-room-budget/preview.ts`: start vite preview with `PREVIEW_ENV`.
- `budget.spec.ts`, `prod.spec.ts` (both tests), `control-room-budget/budget.spec.ts` (T-F8-02, T-F8-03): sign in on the preview before the first goto (`page.request`; budget.spec also signs the `request` fixture in, since it reads `/`'s HTML with it). Every assertion is unchanged. budget.spec's second test (no built file holds the operator id) is untouched.

## Contract to files (a2)
T-F12-10: all of the above. The `/`-figure in budget.spec stays LIMIT 235 KB / WARN 225 KB; the figure itself is measured once the build adds the hook.

## Deviations / Limitations (a2)
- No new spec for "a preview without AVEL_API=mock serves no /api": it would need a third build and preview (minutes each); the helper's assertions and the existing no-leak test cover the mock side.
- T-F12-10 is satisfied by the five modified specs failing first, not by a new spec.

## Lock line (a2, F2 relock; Zero fills in the tip after the report commit)
- T-F12: apps/web/e2e/budget.spec.ts, apps/web/e2e/control-room/prod.spec.ts, apps/web/e2e/control-room-budget/budget.spec.ts, apps/web/e2e/control-room-budget/preview.ts, apps/web/e2e/support/preview-auth.ts @ <branch tip> (F2 relock)

## Messages received (a2)
None.
