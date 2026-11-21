---
doc: agent-fantem-t-f12-build
ticket: T-F12
lane: frontend
sprint: sprint-12
agent: fantem
seat: builder
kind: build
role: build
rigor: full
model: opus
branch: t/F12-sign-in
checkout: branch
after: [agent-fenn-t-f12-test-e2e]
depends_on: [T-F10]
report: docs/agent-dispatch/frontend/sprint-12/agent-fantem-t-f12-build-completion.md
---


# T-F12 · build · Fantem: Sign-in, the session guard and sign-out

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-12 · Step 1 |
| Ticket | T-F12 · rigor full |
| Dispatch | build · Fantem (builder) · model opus |
| Works on | `t/F12-sign-in` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fantem** (`.claude/agents/fantem.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/fantem.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-12/codebase-analysis.md`: the codebase in short
5. `docs/ui-contracts/login.md`: the sign-in UI contract: the wire, the guard, /login, sign-out, the mock, the LG scenarios
6. `docs/design/CR-W29 The control room from the design export.md`: E14 (sign-in first), E16 and decision 6 (/'s budget), E4 (new code is TypeScript)
7. `docs/design/CR-W30 The web's auth wire and a minified contract.md`: A: the auth mock this ticket builds against
8. `docs/design/Step 0 and Step 1 plan.md`: item 5 (Better Auth: one operator, sign-up off, lockout), Rate limits, test 7
9. `docs/ui-contracts/login.md`: the screen, the wire, the guard and the copy (sections 0 to 4); its section 5 is the mock CR-W30 A builds
10. `apps/web/src/routes/__root.tsx`: the guard goes in its beforeLoad, beside the theme's createServerFn
11. `apps/web/src/routes/index.tsx`: / is client-only; the guard must decide before the control room loads
12. `apps/web/control-room/src/pages/settings/SettingsPage.jsx`: the Account section and Sign out go here
13. `apps/web/e2e/budget.spec.ts`: what / may load: 235 KB, warning over 225 KB, as this ticket's tests set it (CR-W29 decision 6, second amendment)
14. `docs/ui-reference/control-room-design-fidelity.md`: the export's tokens, type and focus rules the Sign in card uses
15. `apps/web/vite.config.ts`: mockApi() serves contract-mock on /api in the dev server only (configureServer); the Nov 21 amendment adds vite preview
16. `apps/web/test/sign-in/**`: the locked acceptance tests: they define done
17. `apps/web/e2e/sign-in/**`: the locked acceptance tests: they define done
18. `apps/web/e2e/support/auth.setup.ts`: the locked acceptance tests: they define done
19. `apps/web/playwright.config.ts`: the locked acceptance tests: they define done
20. `apps/web/e2e/budget.spec.ts`: the locked acceptance tests: they define done
21. `apps/web/e2e/control-room/prod.spec.ts`: the locked acceptance tests: they define done
22. `apps/web/e2e/control-room-budget/**`: the locked acceptance tests: they define done
23. `apps/web/e2e/support/preview-auth.ts`: the locked acceptance tests: they define done
24. `docs/agent-dispatch/frontend/sprint-12/agent-fantem-t-f12-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** Signed out, opening any page of the control room shows Sign in, never the shell. Signing in lands you on the page you asked for, a reload keeps you signed in, and Sign out in Settings ends it.

**Refs:**
- login.md sections 0 to 4 and 7
- CR-W29 E14
- CR-W30 A
- Step 0 and Step 1 plan, item 5 and test 7
- Javaris, Nov 17: fewer, bigger tickets

**Merged before this starts:** T-F10

**Notes from the lead:**
- The wire is login.md section 1, called with fetch from apps/web/src/auth/api.ts only. It returns only the named fields: never token, ipAddress or the password. Nothing goes in localStorage, sessionStorage or a URL except next
- The guard is server-side: __root's beforeLoad calls a createServerFn that forwards the request's cookie to GET /api/auth/get-session and returns { session } or null. Signed out on any path but /login, it redirects to /login?next=… (login.md section 2, safeNext exactly as written there, hash kept), so the shell is never drawn signed out. A failed session read counts as signed out. Signed in on /login, it redirects to next or /
- login.md's QueryClient becomes the router context: the session lives in __root's context, and sign-in calls router.invalidate() before navigating. The 401-from-a-contract-route path (login.md section 2, LG-06) is T-F14's, in the data layer; this ticket doesn't build it
- /login is its own TanStack route outside the control room, ssr: true, styled with the export's tokens (fidelity spec). login.md section 3 gives its markup, states and copy. Where it names mh, Button or StatusGlyph, use the export's own equivalents and name them in a comment
- Sign-out (login.md section 4) is an Account section in the export's SettingsPage.jsx: Signed in as {email}, and Sign out. On 200 it navigates to /login with replace. Log the change in SOURCE.md. Also add one line under its "Changed for apps/web" heading: from T-F14 on, each ticket logs its changes to the export in apps/web/control-room/changes/<ticket id>.md, so tickets that run in the same sprint never share SOURCE.md (B7)
- Budget: / may load at most 235 KB gzipped, with a warning over 225 KB (CR-W29 decision 6, second amendment). The guard should still add next to nothing to /'s first load (the server function's stub only). Copy budget.spec's figure into the report and the PR text as a number. If / goes over 235 KB, stop with needs-cr
- Review, full rigor (G7): Fenn's review, then the second review against docs/review/security-checklist.md, then Javaris merges. The reviewer also applies the full-diff rule: run `git diff main...HEAD --name-only`. Every file must be in this build's may-change list, this ticket's locked test files, this ticket's own dispatch reports in this sprint's folder, or locks.md. Anything else is a P1
- Size: about 60 minutes. If the build can't finish, report blocked with what's done. Don't cut a state or a rule
- Amended Nov 21 (F2; build a1's test-dispute; Javaris, to OSA: "go with your recommendations for both": Fantem's option 1). A production preview has no /api, so the guard rightly sends / to /login there, and five preview specs fail: budget.spec (T-F12-08), prod.spec's two T-F7-07 tests and control-room-budget's T-F8-02 and T-F8-03. Holding them red until T-F15 (option 2) is declined: CI stays green (H5). The fix: in apps/web/vite.config.ts, mockApi() gains a configurePreviewServer hook with the same /api middleware as configureServer (share one handler, don't copy it), still only when AVEL_API=mock and still through a dynamic import, so nothing of the mock reaches dist/ (budget.spec's second test keeps checking that). A preview without AVEL_API=mock still serves no /api. The guard is unchanged: a failed session read is still signed out
- Amended Nov 21 (CR-W33; Axis's G7 review of #102 raised t-f12-fenn-01 to P1). The guard's session read, and any later call the web server makes to /api while rendering, goes to AVEL_API_ORIGIN, a server-side setting, never to an origin built from the request's Host. Missing or not an absolute http(s) origin: the read fails, so the visitor is signed out, and the server logs it once with no values (fail closed). vite dev and vite preview run with it set to their own origin: the Playwright web servers and the preview starters pass it, and for a person's vite dev, mockApi() may default it to the origin Vite resolved, only when it's unset and AVEL_API=mock (the report says how). safeNext keeps the request's origin, which it only compares. Name the setting in the report, so Javaris adds it to .env.example (E6). Fenn's tests a4 adds the Host test and the env wiring in playwright.config.ts and e2e/support/preview-auth.ts, with assertions elsewhere unchanged; Zero relocks; Fantem's build a4 changes only what the fix needs, on top of a3's commits, and reruns Part 7
- Order (F2): Fenn's tests a2 changes the preview starters on the branch, with every assertion unchanged: budget.spec.ts, control-room-budget/preview.ts (and its budget.spec.ts if the sign-in step goes there) and control-room/prod.spec.ts start vite preview with AVEL_API=mock and sign in on the preview's own mock before their first goto (its sessions are its own, so the setup project's cookie doesn't count there). Any helper they share is apps/web/e2e/support/preview-auth.ts. The tests run red on the branch until the build adds the preview hook. Then Zero relocks (F2 relock), and Fantem's build a2 adds the hook on top of a1's commits, which stay. a2 doesn't redo a1's work: it reads a1's report (<git common dir>/avel/reports/frontend-sprint-12-agent-fantem-t-f12-build.a1.md, and the branch's own commits), adds the hook, and reruns Part 7. The PR text carries budget.spec's own / figure as a number

## 4. Tasks

### T-F12-01: make it true: unit: LG-03, safeNext keeps /missions?x=1#a and #/settings-style hashes, and turns every hostile or oversized next into /

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F12-02: make it true: unit: auth/api.ts returns only login.md section 1's fields from the mock's raw get-session (no token, no ipAddress), and reads sign-in and sign-out for their status only

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F12-03: make it true: unit: LG-02 and LG-04, the submit states and copy (empty field, busy, one request, 401 with Password cleared and focused, 429 with and without X-Retry-After at a fixed now, a 500 and a rejected fetch)

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F12-04: make it true: e2e: LG-20, signed out, the server answers / and /missions?x=1 with a redirect to /login with the right next, and no control-room element renders. Signing in lands on next, a reload stays signed in, and no page's HTML holds the session cookie's value or a "token" key

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F12-05: make it true: e2e: LG-21, at 390 and 1280, light and night, a wrong password's alert, then the right one. At 390 the fields and the button are 44px tall with no sideways scroll. /login passes the WCAG 2.2 AA check (E17)

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F12-06: make it true: e2e: the 11th failed sign-in within 15 minutes is refused with the Too many attempts copy, even with the right password (Step 1 test 7, against the mock)

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F12-07: make it true: e2e: LG-22, Sign out from Settings lands on /login, and Back lands there too

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F12-08: make it true: e2e: budget.spec holds / to 235 KB gzipped and warns over 225 KB (CR-W29 decision 6, second amendment). Only LIMIT, WARN and their comment change; what it measures stays T-F8's

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F12-09: make it true: e2e: LG-23, a setup project signs in once and saves storageState, and every existing spec (T-F7 to T-F11) runs signed in and unchanged. The LG specs start signed out

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F12-10: make it true: e2e (F2, Nov 21): the production-preview specs (budget.spec, control-room/prod.spec, control-room-budget) start vite preview with AVEL_API=mock and sign in on the preview's own mock before their first goto; what each asserts is unchanged, and no built file holds the mock's operator id

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

### T-F12-11: make it true: unit (CR-W33, Nov 21): the guard's session read goes to AVEL_API_ORIGIN; a request with Host: other.example makes no request to other.example and is still signed in only by the configured origin's answer; with AVEL_API_ORIGIN unset or not an absolute http(s) origin, the read fails and the visitor is signed out

- **Verify:** its locked test passes: `pnpm --filter @avel/web exec vitest run`, `pnpm --filter @avel/web exec playwright test`, `pnpm --filter @avel/web exec vite build`, `pnpm typecheck`, `pnpm lint`

## 5. Territory

**You may change** (and create):
- `apps/web/src/auth/**`
- `apps/web/src/routes/__root.tsx`
- `apps/web/src/routes/login.tsx`
- `apps/web/src/routeTree.gen.ts`
- `apps/web/control-room/src/pages/settings/SettingsPage.jsx`
- `apps/web/control-room/SOURCE.md`
- `apps/web/vite.config.ts`
- `docs/agent-dispatch/frontend/sprint-12/agent-fantem-t-f12-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `apps/web/test/sign-in/**`
- `apps/web/e2e/sign-in/**`
- `apps/web/e2e/support/auth.setup.ts`
- `apps/web/playwright.config.ts`
- `apps/web/e2e/budget.spec.ts`
- `apps/web/e2e/control-room/prod.spec.ts`
- `apps/web/e2e/control-room-budget/**`
- `apps/web/e2e/support/preview-auth.ts`

**Never change, whatever the task says:**
- `packages/**`
- `apps/web/package.json`
- `pnpm-lock.yaml`
- `apps/web/control-room/src/mock/**`
- `apps/web/control-room/contract/**`
- `apps/web/src/data/**`
- `packages/**`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

**Owned by other tickets in this sprint** (stay out; the other lane never shares a file with yours):

| Ticket | Kind | Paths |
| --- | --- | --- |
| T-F14 | builds | `apps/web/src/data/**`, `apps/web/control-room/src/lib/api.js`, `apps/web/control-room/src/lib/stream.js`, `apps/web/control-room/src/sources/**`, `apps/web/control-room/src/app/logic.js`, `apps/web/control-room/src/app/canon.js`, `apps/web/control-room/src/app/operations.js`, `apps/web/control-room/src/app/decisions.js`, `apps/web/control-room/src/app/crew.js`, `apps/web/control-room/changes/T-F14.md` |
| T-F14 | tests | `apps/web/test/data/**`, `apps/web/test/sources/**`, `apps/web/e2e/sources/**` |
| T-F22 | builds | `packages/contract-mock/src/**` |
| T-F22 | tests | `packages/contract-mock/test/mission-world.test.ts`, `packages/contract-mock/test/mission-routes.test.ts` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-F12`).
6. Build the simplest thing that passes (B9, C3). No dead or speculative code, no new dependency, no database mocks (E5, E8, E10).
7. If a locked test looks wrong, stop with `test-dispute`. If a doc is wrong or missing something, stop with `needs-cr` (E3, F2).
8. When every task passes, run all of Part 7's commands, then write and commit your report.

## 7. Completion

**Verification** (run every one, in order, and paste the results into your report):

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test
pnpm --filter @avel/web exec vitest run
pnpm --filter @avel/web exec playwright test
pnpm --filter @avel/web exec vite build
pnpm typecheck
pnpm lint
```

**Your report:** `docs/agent-dispatch/frontend/sprint-12/agent-fantem-t-f12-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
ticket: T-F12
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fantem, the frontend builder on the AVEL build team (`.claude/agents/fantem.md`). Your lead is Zero. Your task is ticket T-F12, "Sign-in, the session guard and sign-out": the build dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-12/agent-fantem-t-f12-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/F12-sign-in`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-12/agent-fantem-t-f12-build-completion.md`, committed to the branch. Once it says done, push the branch (`git push -u origin t/F12-sign-in`) and open its PR with `gh pr create`, the report as its description. Push nothing else, and never merge.
