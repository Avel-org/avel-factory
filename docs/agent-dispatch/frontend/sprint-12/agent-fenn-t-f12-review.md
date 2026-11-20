---
doc: agent-fenn-t-f12-review
ticket: T-F12
lane: frontend
sprint: sprint-12
agent: fenn
seat: checker
kind: review
role: review
rigor: full
model: opus
branch: t/F12-sign-in
checkout: detached
after: [agent-fantem-t-f12-build]
depends_on: [T-F10]
report: docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f12-review-completion.md
---


# T-F12 · review · Fenn: Sign-in, the session guard and sign-out

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-12 · Step 1 |
| Ticket | T-F12 · rigor full |
| Dispatch | review · Fenn (checker) · model opus |
| Works on | a detached checkout of `t/F12-sign-in`'s head |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You review the builder's work on this ticket, from the diff and this document only (G1). You change no code.

## 2. Context: read these first, in order

1. `.claude/agents/fenn.md`: who you are, and your always and never
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
15. `apps/web/test/sign-in/**`: the locked acceptance tests: they define done
16. `apps/web/e2e/sign-in/**`: the locked acceptance tests: they define done
17. `apps/web/e2e/support/auth.setup.ts`: the locked acceptance tests: they define done
18. `apps/web/playwright.config.ts`: the locked acceptance tests: they define done
19. `apps/web/e2e/budget.spec.ts`: the locked acceptance tests: they define done
20. `docs/agent-dispatch/frontend/sprint-12/agent-fantem-t-f12-build-completion.md`: the builder's completion report
21. `docs/review/security-checklist.md`: full rigor: work through it item by item
22. `docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f12-review.md`: this document: follow it exactly

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

## 4. Tasks

### T-F12-01: check: unit: LG-03, safeNext keeps /missions?x=1#a and #/settings-style hashes, and turns every hostile or oversized next into /

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F12-02: check: unit: auth/api.ts returns only login.md section 1's fields from the mock's raw get-session (no token, no ipAddress), and reads sign-in and sign-out for their status only

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F12-03: check: unit: LG-02 and LG-04, the submit states and copy (empty field, busy, one request, 401 with Password cleared and focused, 429 with and without X-Retry-After at a fixed now, a 500 and a rejected fetch)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F12-04: check: e2e: LG-20, signed out, the server answers / and /missions?x=1 with a redirect to /login with the right next, and no control-room element renders. Signing in lands on next, a reload stays signed in, and no page's HTML holds the session cookie's value or a "token" key

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F12-05: check: e2e: LG-21, at 390 and 1280, light and night, a wrong password's alert, then the right one. At 390 the fields and the button are 44px tall with no sideways scroll. /login passes the WCAG 2.2 AA check (E17)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F12-06: check: e2e: the 11th failed sign-in within 15 minutes is refused with the Too many attempts copy, even with the right password (Step 1 test 7, against the mock)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F12-07: check: e2e: LG-22, Sign out from Settings lands on /login, and Back lands there too

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F12-08: check: e2e: budget.spec holds / to 235 KB gzipped and warns over 225 KB (CR-W29 decision 6, second amendment). Only LIMIT, WARN and their comment change; what it measures stays T-F8's

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F12-09: check: e2e: LG-23, a setup project signs in once and saves storageState, and every existing spec (T-F7 to T-F11) runs signed in and unchanged. The LG specs start signed out

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F12-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).
- Full rigor: every item of `docs/review/security-checklist.md`, marked checked, failed or not reached.

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f12-review-completion.md`
- `docs/agent-dispatch/frontend/sprint-12/findings/t-f12-fenn-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `apps/web/src/auth/**`
- `apps/web/src/routes/__root.tsx`
- `apps/web/src/routes/login.tsx`
- `apps/web/src/routeTree.gen.ts`
- `apps/web/control-room/src/pages/settings/SettingsPage.jsx`
- `apps/web/control-room/SOURCE.md`

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
| T-F14 | builds | `apps/web/src/data/**`, `apps/web/control-room/src/lib/api.js`, `apps/web/control-room/src/lib/stream.js`, `apps/web/control-room/src/sources/**`, `apps/web/control-room/src/app/logic.js`, `apps/web/control-room/src/app/canon.js`, `apps/web/control-room/src/app/operations.js`, `apps/web/control-room/src/app/decisions.js`, `apps/web/control-room/changes/T-F14.md` |
| T-F14 | tests | `apps/web/test/data/**`, `apps/web/test/sources/**`, `apps/web/e2e/sources/**` |
| T-F22 | builds | `packages/contract-mock/src/**` |
| T-F22 | tests | `packages/contract-mock/test/mission-world.test.ts`, `packages/contract-mock/test/mission-routes.test.ts` |

## 6. Execution protocol: review

1. You're on a detached checkout of the builder's result. Get the diff: `git diff $(git merge-base main HEAD)...HEAD`.
2. Read the builder's report, then the diff, then the locked tests. You don't see the builder's session (G1).
3. Run Part 7's commands yourself. A red command is a finding.
4. Write each finding to its own file under `findings/`: severity (P0 to P3, G3), evidence (a file and line, a failing command, or a rule ID), what you expected, and the check that would catch it.
5. List what you checked and what you couldn't reach. Leave everything uncommitted.

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

**Your report:** `docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f12-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
verdict: pass | changes | block
ticket: T-F12
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F12, "Sign-in, the session guard and sign-out": the review dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f12-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-12/agent-fenn-t-f12-review-completion.md`, left uncommitted. Don't push.
