# FENN: decisions test-unit, completion report

verdict: PARTIAL

## Summary
FENN-01 is written and committed in one tests commit (dcd0468): UC-11 to UC-28 as 37 screen tests in `apps/web/test/modules/decisions/`. All 37 fail on an assertion, with the same failures three runs in a row. PARTIAL only because the Part 7 build and typecheck can't pass until Ghost's `src/router.tsx` and `packages/contract-mock` exist (as INT expected for w0-app); lint is green.

## Pre-flight
- Part 2 files: all read: fenn.md, codebase-analysis.md, the UI contract (sections 1 to 8 in full), CR-W2, decisions.md, Frontend Map v0.6 (Testing and the module layout), Step 0 and Step 1 plan (skimmed for item 13 and test 14), this task doc. The design library HTML was not read in full: I read only the source of `ErrorPanel` (`AV_ERROR_COPY`), `WidgetState`, `DecisionTag`, the Decisions screen's empty card and lead, and the approved and rejected lines, for exact copy and `data-ui`/`data-state` attributes.
- Branch `frontend/sprint-01/agent-fenn-decisions-test-unit-a2`, started at f470e0b. This is the retry of a1 (BLOCKED, w0-data not merged). The locked `test/setup/**` and `vitest.config.ts` (033a4ae) are used and unchanged.
- Part 7 commands: all runnable. Build and typecheck fail (see Verification).

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| FENN-01 | DONE | dcd0468 |

## Tests
All 37 tests fail on an assertion. Failure line, by group:
- **A.** `AssertionError: apps/web/src/modules/decisions/screens.ts should export the screen as DecisionsScreen: expected undefined to be defined` (33 tests).
- **B.** `AssertionError: fixtures.step1 should hold four rows: expected [] to have a length of 4 but got +0` (UC-12 first test).
- **C.** `AssertionError: fixtures.many should hold 150 rows: expected [] to have a length of 150 but got +0` (UC-26, three tests).

| ID | File and test (starts with the ID) | Failure |
| --- | --- | --- |
| UC-11 | list.test.tsx: `UC-11 fixtures.empty shows the empty card and the lead…` | A |
| UC-12 | list.test.tsx: `UC-12 draws four rows in server order, each as its kind…` | B |
| UC-12 | list.test.tsx: `UC-12 a single row says 'thing needs you'` | A |
| UC-13 | deciding.test.tsx: `UC-13 the dialog carries 5.2's copy, confirming sends one request…` (exactly one route 54 request, path, body, key, `Approving…`, approved line with `formatClock(resolvedAt)`, row leaves, lead says 1) | A |
| UC-13 | deciding.test.tsx: `UC-13 a reason under three characters can't be confirmed…` | A |
| UC-14 | deciding.test.tsx: `UC-14 the dialog carries DL's reject copy…` (`Rejecting…`, rejected line) | A |
| UC-15 | errors.test.tsx: `UC-15 a bumped version shows the stale state…` (one route 54 request, request ID chip, Review, then deciding gets 201 with version n+1) | A |
| UC-16 | errors.test.tsx: `UC-16 after the 409 the proposal is resolved elsewhere…` (`role="status"`) | A |
| UC-17 | errors.test.tsx: five `it.each` cases, `UC-17 $name shows its reason and the request ID, and Refresh list refetches` (resolve; resolve + failNext resolved; expire + failNext expired; remove; failNext alone, row back in `seen`) | A (x5) |
| UC-18 | errors.test.tsx: `UC-18 the buttons are disabled with 'Retry in 3s'…` (fake clock, countdown, nothing re-sent) | A |
| UC-19 | deciding.test.tsx: `UC-19 $name shows "Couldn't reach the server."…` for a network failure and a 500 (request ID; Retry sends the same key, path and body) | A (x2) |
| UC-20 | deciding.test.tsx: `UC-20 once: re-sent with the same key after 500ms, then approved` | A |
| UC-20 | deciding.test.tsx: `UC-20 running out: three re-sends 500ms, 1s and 2s apart…` (the fourth request's ID, no fifth) | A |
| UC-21 | errors.test.tsx: `UC-21 the dialog reopens with the reason, the error and the request ID…` (new key on confirm) | A |
| UC-22 | errors.test.tsx: five `it.each` cases: 400 other, 403, IDEMPOTENCY_KEY_REUSED, CONFLICT, UNPROCESSABLE_CONTENT (title, body, action or none, request ID, never stale) | A (x5) |
| UC-23 | errors.test.tsx: `UC-23 a 401 on route 54…` and `UC-23 a 401 on route 52's first load…` | A (x2) |
| UC-24 | list.test.tsx: `UC-24 an injected raw item shows the alert band…` | A |
| UC-25 | list.test.tsx: `UC-25 with navigator.onLine false…` | A |
| UC-26 | list.test.tsx: `UC-26 fixtures.many pages 50, 100, 150…`, `UC-26 a failing Load more…`, `UC-26 the unreadable count is summed over the loaded pages` | C (x3) |
| UC-27 | list.test.tsx: `UC-27 with nothing loaded yet…` (WidgetState loading), `…a first load failing four times…`, `…a 403 on the first load…`, `…a refetch failing four times with rows on screen…` | A (x4) |
| UC-28 | list.test.tsx: `UC-28 a mock on another contract version shows the staleVersion banner…`, `UC-28 the same version shows no banner` | A (x2) |

## Lock
Tests commit: `dcd0468`.

Line for `locks.md`:
`- decisions · dcd0468 · apps/web/test/modules/decisions/**`

## Contract to files
- UC-11, UC-12, UC-24 to UC-28: `apps/web/test/modules/decisions/list.test.tsx`.
- UC-13, UC-14, UC-19, UC-20: `apps/web/test/modules/decisions/deciding.test.tsx`.
- UC-15 to UC-18, UC-21 to UC-23: `apps/web/test/modules/decisions/errors.test.tsx`.
- Shared render and query helpers: `apps/web/test/modules/decisions/helpers.tsx`.
- Task requirements: each test carries its UC ID; UC-15 asserts exactly one route 54 request; UC-19 and UC-22 assert the request ID chip (`Copy {requestId}`, the ID `mock.requests()` recorded).

## Deviations
- **The screen's export name is assumed.** The contract names `screens.ts` and `screens/DecisionsScreen.tsx` but not the export. The tests read `DecisionsScreen` (no props) from `src/modules/decisions/screens.ts`, found with `import.meta.glob` so a missing file is an assertion failure, not an import error. If Leon exports another name, the one line in `helpers.tsx` changes (a new tests commit before the lock, or an escalation after it).
- **The task doc's verify form doesn't filter.** `pnpm --filter @avel/web test -- test/modules/decisions` ran all 10 test files (122 tests, all failing). I ran my files with `pnpm --filter @avel/web exec vitest run test/modules/decisions` three times instead (output below).
- **Own render helper.** `test/setup/render.tsx` (locked) can't hold a response back, and "Approving…" within 100ms can only be asserted if route 54's answer is held. `helpers.tsx` builds the client as `renderWithApp` does, with a fetch that records on the mock at once and releases the answer on the test's signal.
- **No deviation from the territory.** I ran `pnpm install --frozen-lockfile --offline` to get `node_modules` in this worktree; nothing it wrote is committed.

## Limitations
- The tests could not run against a real page, mock or kit, so selectors were chosen from the contract and the design library's source and are unproven: the reason dialog is found by `role="dialog"` and its field by `role="textbox"`; rows by `<ul aria-label="Waiting for you">`; row state by the library's `data-ui="DecisionTag"` `data-state`; `WidgetState` by `data-state` (`loading`, `staleVersion`); `ErrorPanel` by `data-code`. If a builder's DOM differs for a good reason, the fix is a tests change, which the lock would block: Zero should tell INT before locking if any of these look wrong.
- UC-18 and UC-20 fake `setTimeout`, `clearTimeout`, `setInterval` and `clearInterval` only. They depend on the page using those (not `requestAnimationFrame` or `Date`) for its countdown and re-sends.
- UC-12 derives expected rows from `fixtures.step1` itself (order, labels, version), so it works with whatever titles Ghost's fixture has, but needs the fixture to hold four rows (one factory PR, one unreadable-options proposal).
- UC-13's approved time is checked against `formatClock(resolvedAt)` where `resolvedAt` is read from route 53 after the decision (the page's own response isn't visible to the test).
- Matchmedia is stubbed to a desk (not max-width 899px). Phone layout isn't covered here (UC-08 and UC-31 do it).
- The unit "Loading" test (UC-27) holds route 52's answer and asserts `WidgetState` loading at once; it relies on the screen drawing it while suspended.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Leon:** export `DecisionsScreen` from `src/modules/decisions/screens.ts` (no props). The page needs no router context: the tests render it inside a `QueryClientProvider` only, with an `Api` bound by `bindApi`. It must draw `WidgetState` loading itself while route 52 is pending (UC-27).
- **Ghost:** `fixtures.step1` needs four rows including one factory PR and one proposal whose `options` don't parse; `fixtures.many` needs 150 decidable proposals.
- **Zero / INT:** see Limitations, first bullet, before locking.

## Files changed
```
apps/web/test/modules/decisions/deciding.test.tsx
apps/web/test/modules/decisions/errors.test.tsx
apps/web/test/modules/decisions/helpers.tsx
apps/web/test/modules/decisions/list.test.tsx
docs/agent-dispatch/frontend/sprint-01/agent-fenn-decisions-test-unit-completion.md
```
(The report is added in the final commit; before it, `git diff --name-only main...HEAD` lists the first four.)

## Verification
Fail-first, three runs (`pnpm --filter @avel/web exec vitest run test/modules/decisions`):
```
run 1:  Test Files  3 failed (3)   Tests  37 failed (37)
run 2:  Test Files  3 failed (3)   Tests  37 failed (37)
run 3:  Test Files  3 failed (3)   Tests  37 failed (37)
```
The list of failing tests and their assertion messages is identical in the three runs (diffed). Every message is one of A, B or C above; none is an import, syntax or setup error.

```
$ pnpm --filter "@avel/web..." build
apps/web build: Failed   (vite.config.ts can't resolve '@avel/contract-mock'; no src/router.tsx)
```
```
$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
apps/web typecheck: Failed   (same two causes: '@avel/contract-mock' not found, router entry not found)
```
`tsc -p apps/web/tsconfig.json` on its own reports errors in my files only for the unbuilt modules (`@avel/contract-mock`, `src/data/client`, `src/data/query`, `src/lib/time`) and the implicit-any they cause; the locked w0-data tests have the same.
```
$ pnpm lint
Checked 160 files in 99ms. No fixes applied.
```
```
$ pnpm --filter @avel/web test
Test Files  10 failed (10)
Tests  122 failed (122)     (85 locked w0-data tests + 37 mine, all failing first)
```
```
$ git diff --name-only main...HEAD
apps/web/test/modules/decisions/deciding.test.tsx
apps/web/test/modules/decisions/errors.test.tsx
apps/web/test/modules/decisions/helpers.tsx
apps/web/test/modules/decisions/list.test.tsx
docs/agent-dispatch/frontend/sprint-01/agent-fenn-decisions-test-unit-completion.md
```
All paths are in Part 5.
