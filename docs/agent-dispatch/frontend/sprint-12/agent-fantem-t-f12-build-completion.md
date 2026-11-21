status: test-dispute
ticket: T-F12

# T-F12 · build · Fantem: completion report

Branch `t/F12-sign-in`, from the lock commit `085febc`. Not pushed.

**In short:** sign-in, the server-side guard and sign-out are built. Every T-F12 spec on the dev server passes (25 of 25), and both unit files pass. So does every earlier spec (T-F7 to T-F11) that runs on the dev server, now signed in through the setup project. **Five tests can't pass, and the fix is outside this ticket's files:** the locked `e2e/budget.spec.ts` (T-F12-08), and four T-F7 and T-F8 specs that use the same production preview. `vite preview` serves no `/api`, so the guard correctly counts every visitor there as signed out and sends `/` to `/login`. Fenn's tests report raised this as a risk before the lock (its Limitations). Zero needs to rule; the options are in **The dispute** below.

**`/`'s budget, measured: 226,589 B gzipped (221.3 KB).** The limit is 235 KB (240,640 B) and the warning is at 225 KB (230,400 B), so it's under both. `budget.spec` itself can't reach Decisions on its preview (see the dispute), so this was measured with budget.spec's own method on the same production build, served with the mock on `/api` and signed in (how: Limitations). `/login` loads 114,919 B (112.2 KB), under E16's 150 KB.

## The dispute (T-F12-08, and four specs outside the ticket)

| Test | Owner | Why it fails |
| --- | --- | --- |
| `e2e/budget.spec.ts` › the JavaScript / loads … (T-F12-08, locked here) | T-F12 / T-F8 | `vite preview` with `AVEL_API=""`: `/` redirects to `/login`, so `nav.lib-nav` never shows |
| `e2e/control-room/prod.spec.ts` › no dock and no viewport preview … | T-F7-07 | same: its own `vite preview`, no `/api` |
| `e2e/control-room/prod.spec.ts` › the OSA flag shows OSA … | T-F7-07 | same |
| `e2e/control-room-budget/budget.spec.ts` › T-F8-02 | T-F8 | same (`preview.ts`) |
| `e2e/control-room-budget/budget.spec.ts` › T-F8-03 | T-F8 | same |

`budget.spec`'s second test (no built file holds the mock's operator id) passes.

**Why it can't be fixed in this ticket:** the brief and login.md section 2 say a failed session read counts as signed out, and nothing serves `/api` in a production preview. Making `/` render there would mean letting a failed read through, which is the opposite of the rule. Making the preview answer `/api` needs `apps/web/vite.config.ts` and the preview specs, none of which are in Part 5.

**Options for Zero:**
1. **(Recommended) Serve the mock in preview too.** `vite.config.ts`'s `mockApi()` gains a `configurePreviewServer` hook with the same middleware, still only under `AVEL_API=mock` and still a dynamic import, so nothing reaches `dist/`. The three preview starters (`budget.spec.ts`, `control-room-budget/preview.ts`, `control-room/prod.spec.ts`) pass `AVEL_API: "mock"` and sign in on the preview's own mock before `goto` (its sessions are its own, so the setup project's cookie isn't one it knows). I ran exactly this flow from a scratch harness: `/` boots to Decisions and measures 221.3 KB. It needs `vite.config.ts` in the territory (T-F15, sprint-13, owns it next) and Fenn's F2 change to `budget.spec.ts`, plus the two older specs.
2. Hold these five as known failures until T-F15 (e2e on the production build) changes how the preview runs. That's Javaris's call (F5, H5), because CI would be red.

I didn't touch any of these files.

## Pre-flight

Postgres: `scripts/pg-local.sh start` (its own container, D5).

**Starting state** (the lock commit, before any change):
| Command | Result |
| --- | --- |
| `pnpm build` | pass |
| `vitest run` | 2 files fail (`test/sign-in/*`: no `@/auth`), 8 files and 47 tests pass |
| `playwright test` | 304 passed, 24 failed (every new sign-in spec), 1 skipped (T-F7-05, quarantined), 15.9 min |

**Part 7, at the report's head** (the code hasn't changed since the full runs):
| # | Command | Result |
| --- | --- | --- |
| 1 | `pnpm build` | pass |
| 2 | `pnpm typecheck` | pass |
| 3 | `pnpm lint` | pass: 323 files, no errors, 6 warnings (the same 6 as Fenn's baseline, all in files this ticket doesn't touch) |
| 4 | `vitest run && playwright test` | vitest: 10 files, 81 tests pass. Playwright run 2: **323 passed, 5 failed (the same five), 1 skipped**, 14.1 min |
| 5 | `vitest run` | 10 files, 81 tests pass |
| 6 | `playwright test` | run 1: **323 passed, 5 failed (the dispute's five), 1 skipped**, 14.1 min |
| 7 | `vite build` | pass |
| 8 | `pnpm typecheck` | pass |
| 9 | `pnpm lint` | pass, 6 warnings (as above) |

Also: `tsc -p apps/web/tsconfig.json --noEmit` passes. apps/web has no typecheck script, so `pnpm typecheck` doesn't cover it; I ran this myself.

**Per task:**
| Task | Test | Result |
| --- | --- | --- |
| T-F12-01 · LG-03 | `test/sign-in/safe-next.test.ts` | pass |
| T-F12-02 | `test/sign-in/api.test.ts` | pass |
| T-F12-03 · LG-02, LG-04 | `e2e/sign-in/submit.spec.ts` (7) | pass |
| T-F12-04 · LG-20 | `e2e/sign-in/guard.spec.ts` (5) | pass |
| T-F12-05 · LG-21 | `e2e/sign-in/layout.spec.ts` (9) | pass |
| T-F12-06 · Step 1 test 7 | `e2e/sign-in/lockout.spec.ts` | pass |
| T-F12-07 · LG-22 | `e2e/sign-in/sign-out.spec.ts` | pass |
| T-F12-08 | `e2e/budget.spec.ts` | **fails: the dispute.** Measured 221.3 KB by its method (above) |
| T-F12-09 · LG-23 | `auth.setup.ts`, `storage-state.spec.ts`; every T-F7 to T-F11 spec on the dev server, signed in | pass |

**End-to-end screenshot:** `apps/web/test-results/sign-in-sign-out-T-F12-07--1a6fc-and-Back-lands-on-login-too-sign-in/test-finished-1.png`: Sign in, after signing in to `/#/settings`, signing out and going Back. Every LG spec attaches its own named shots (`guard-*`, `login-390-*`, `login-1280-*`, `submit-*`, `lockout-11th`, `sign-out-*`, `storage-state-signed-in`) and records a video. `test-results/` is git-ignored, so CI's artifacts carry them (F6). I also checked by eye: `/login` at 1280 night with the 401 alert (the export's night card, stopped glyph and copy), at 390 light (full-width 44px button, no sideways scroll), and Settings with "Signed in as operator@avel.test" and Sign out.

## What changed

| File | Why |
| --- | --- |
| `apps/web/src/auth/index.ts` | `safeNext(raw, origin)`, login.md section 2's five rules exactly. It returns the parsed URL's pathname, search and hash, or `/` |
| `apps/web/src/auth/api.ts` | The only caller of `/api/auth/*` (section 1). `getSession({ cookie?, origin? })` sends the cookie header and nothing else, with `redirect: "manual"`. It rebuilds `{ session: { id, userId, expiresAt }, user: { id, email, name } }` from named fields (no `token`, no `ipAddress`), returns `null` signed out, and throws on any other answer. `signIn` and `signOut` read the status only, plus `X-Retry-After` on a 429. Each call times out after 10 s (security checklist: every outside call has a timeout) |
| `apps/web/src/auth/origin.ts` | `appOrigin()`, a `createIsomorphicFn`: the request's origin on the server, `window.location.origin` in the browser, for `safeNext`. Kept out of `index.ts` so the unit test imports plain code |
| `apps/web/src/routes/__root.tsx` | The guard. One server function, `readRoot`, reads the theme cookie (as before) and the session (forwarding the request's cookie to get-session at the request's origin; a failure is `null`). One server function, so one round trip per navigation. `beforeLoad`: signed out on anything but `/login` throws `redirect` to `/login` with `next` = path, search and hash, left out for `/`. On the server that's a 307, so the shell is never drawn. Signed in on `/login`, it redirects to `safeNext(next)` with replace. `{ theme, session }` is the root route's context |
| `apps/web/src/routes/login.tsx` | `/login`: `ssr: true`; `validateSearch` keeps `next` only through `safeNext` and `reason` only as `expired`; the title is `Sign in · AVEL`; it links `login.css` in the head, so the server's HTML is styled |
| `apps/web/src/auth/LoginScreen.tsx` | Section 3's screen: the brand (the rail head's mark and AVEL, as text), the `h1`, the expired notice (`role="status"`, only with `reason=expired`), the `method="post" noValidate` form, Email and Password with their `type` and `autoComplete`, the alert (`role="alert"`, stopped glyph), the primary Button. States: empty field (no request; the first empty field is focused and `aria-invalid`), busy (`Signing in…`, one request at a time), 401 (Password cleared and focused, `aria-invalid` on both), 429 with and without `X-Retry-After` (local `HH:MM`), and anything else or a rejected fetch. `mh`, `Button` and `StatusGlyph` are the export's equivalents, named in comments: its tokens, `av-btn` with `data-variant`/`data-busy`, and `logic.js`'s `glyph("stopped")` |
| `apps/web/src/auth/login.css` | The export's 28 stylesheets, `@import`ed in `main.jsx`'s order (its tokens, fonts, fields, Button and focus rules), then the card: page background, `--av-float`, `--av-glass-blur-float`, `--av-radius-dialog`, `--av-shadow-faceplate`, `padding: 20px 24px 0`, `gap: 16px`, and the footer band. At 760px and narrower: 44px fields (the export's phone `--f-h` is 48px, so it's set to 44px here) and a full-width 44px button |
| `apps/web/src/auth/AccountSection.tsx` | Section 4: Settings' Account section in the export's markup: `Signed in as {email}` from the root context, and a secondary `Sign out` (`Signing out…` while busy). A 200 goes to `/login` with replace; anything else shows `Couldn't sign out. Try again.` |
| `apps/web/control-room/src/pages/settings/SettingsPage.jsx` | Its Account section is `<AccountSection icon={ic?.logout16} />`, replacing the fixed "Javaris / Operator" row and the sample world's `signOut` |
| `apps/web/control-room/SOURCE.md` | Logs the SettingsPage change, and adds the lead's line under "Changed for apps/web": from T-F14 on, each ticket logs its changes in `apps/web/control-room/changes/<ticket id>.md` (B7) |
| `apps/web/src/routeTree.gen.ts` | Regenerated by the router plugin for `/login` |
| this report | Part 7 |

Commits: `ac7a924` (T-F12-01), `bea5a45` (T-F12-02), `1dd1af8` (T-F12-03 to 06, 09), `33afc82` (T-F12-07), each with `Refs: T-F12`, then this report.

## Contract to files

| Requirement | Where |
| --- | --- |
| login.md §0: fetch from one module; nothing in storage or a URL but `next` | `auth/api.ts` only; no `localStorage` or `sessionStorage` anywhere; `storage-state.spec` checks that the saved origins hold no localStorage |
| §1: only the named fields; the cookie forwarded at the request's origin | `auth/api.ts` `toSession`, `__root.tsx` `readRoot` |
| §2: the guard in `beforeLoad`, the server redirect, `next` left out for `/`, signed in on `/login` goes to next, a failed read is signed out | `__root.tsx` |
| §2: `safeNext`, used by `validateSearch`, the signed-in redirect and after sign-in | `auth/index.ts`; `routes/login.tsx`, `__root.tsx`, `LoginScreen.tsx` |
| §3: markup, copy, states, title, 44px at ≤760px, no sign-up, forgot-password or remember-me | `LoginScreen.tsx`, `login.css`, `routes/login.tsx` |
| §4: Account section, `Signed in as`, Sign out, `/login` with replace, error copy | `AccountSection.tsx`, `SettingsPage.jsx` |
| CR-W29 E14, decision 6 (second amendment) | `/` measured at 221.3 KB, under 235 KB; the guard adds a server-function stub to `/`'s first load |
| CR-W30 A | Built against `contract-mock`'s sign-in, get-session and sign-out as served |
| Step 1 plan item 5 and test 7 | `lockout.spec` passes: the 11th attempt shows Too many attempts even with the right password |
| E15 | No money; no password anywhere but the sign-in form; every string is rendered as text (no `innerHTML`; `hygiene.test` passes) |
| E16 | `/login` 112.2 KB |
| E17 | axe WCAG 2.2 AA passes on `/login` in every LG spec that runs it (light and night, 390 and 1280, the alert, the lockout), and on Settings in `sign-out.spec` |

## Deviations

1. **Sign-in navigates to `next` itself (a push), not by `router.invalidate()` with replace.** TanStack always follows a redirect thrown in `beforeLoad` with `replace` (`router-core` `followRedirect`). If sign-in invalidated the router, the guard's redirect from `/login` would land on `next` by replacing the `/login` entry. Sign-out then replaces that entry with `/login` (the lead's note), leaving no entry behind it, so LG-22's Back went to `about:blank` and the locked test failed. So, on a 200, `LoginScreen` calls `router.navigate({ href: safeNext(next) })`. `beforeLoad` runs on every navigation, so that navigation reads the new session into the root context, which is what the invalidate was for. If the read gives `null`, the guard sends the page back to `/login` and the screen shows section 3's last row. This departs from login.md section 3's "with replace" for sign-in. Sign-out keeps the lead's replace.
2. **The Sign in button is `disabled` until the page hydrates.** It's drawn on the server, and a click before hydration would post the form natively (`method="post"`), which reloads `/login` and loses the click. The submit specs and the lockout spec click right after the heading shows, and failed that way. Disabled, it can't post, and Playwright waits for it. After hydration it's an ordinary button, and it's `aria-disabled` only while busy. The only thing that changes at hydration is the button's disabled look; nothing moves.
3. **The footer band's padding is even (12px 24px) at 760px and narrower,** so the full-width button spans the form exactly, as `layout.spec` measures it. On desk it's login.md's `12px 16px 12px 24px`.
4. **Fields follow the export's field rules** (`taste.css`: on a phone a 999px radius and 20px side padding), at login.md's 44px height. The export's rule for fields is more specific than the card's, and these are the export's tokens (the lead's note: the fidelity spec's tokens).
5. **A session read from a request whose path starts with `/api/` is `null` without a fetch.** Where nothing serves `/api` (the preview, or the bare dev server), the app renders that path itself, so get-session would ask itself again, without end. `redirect: "manual"` stops the same loop through `/login`.

## Limitations

- **The five preview tests fail** (the dispute). CI will be red on them until Zero rules.
- **The budget figure is my own measurement, not budget.spec's run:** a scratch harness, outside the repo (`/tmp`), served `dist/` with contract-mock on `/api`, as the dev server's middleware does, then signed in and summed every script response plus inline scripts, gzipped, as budget.spec does. It changed no repo file. I didn't measure main the same way; going by T-F8's "117 B under 220 KB" (225,163 B), the guard and `/login` add about 1.4 KB to `/`.
- **The sidebar's account menu still has the export's own "Sign out"** (`Sidebar.jsx`, `logic.js`'s `signOut`, which only shows "later"). Those files aren't in this ticket's territory (`logic.js` is T-F14's); this ticket's sign-out is Settings' Account section.
- **Every client-side navigation, including the export's hash route changes, calls `readRoot` once** (a server-function POST, then get-session). The theme read already did this before. There's no client cache, by design: the server's answer decides.
- **The request's origin comes from its Host header**, as login.md section 1 says (as `router.tsx` sets `baseUrl`). A forged Host would make the server send that request's own cookie to another host. The real server's deployment should pin the origin; that's beyond the mock.
- **The expired notice (`reason=expired`) is drawn but not tested here.** LG-06, the 401 that sends you there, is T-F14's.
- `/missions?x=1` signed in shows TanStack's default not-found page: the control room has no such path (its routes are hash routes). LG-20 only needs it to be past the guard.
- Screenshots and videos are in the git-ignored `test-results/`.

## Messages received

None. No instruction reached this session. When I looked for OSA to report the dispute early, `ListAgents` showed no other session running; I message OSA when I stop (below).
