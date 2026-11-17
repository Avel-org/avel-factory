# LEON: decisions build, completion report

verdict: DONE

Attempt a3 (2026-11-07; INT's option (c) of decisions-fenn-01): only the sixth task, LEON-06. The earlier report on main (a2) still covers LEON-01 to LEON-04.

## Summary
`data-hydrated="true"` is now set on the `DecisionsPage` root only after every `DecisionTag` has its client layout. It comes from a layout effect in the commit where `DecisionsList` first renders with the browser's values, and the marker follows in the next commit. The probe over 10 fresh phone loads shows the phone layout already in place when the marker appears, with no change to any rect, order or layout after it. The locked e2e suite passed 10 runs in a row (5 passed, 1 skipped each). The desk-to-phone switch and its 0.13 CLS remain, as the task doc says: they're for option (a).

## Pre-flight
- Part 2 files, all read: `.claude/agents/leon.md`; `codebase-analysis.md`; `docs/ui-contracts/decisions-approval-page.md` (section 5 in full, including the hydration marker, "Styles and loading", the layout and 5.1, and the section 7 e2e paragraph); `docs/design/CR-W2 Pending decisions.md`; `decisions.md` (Revision 7, Revision 9, the e2e flake entry and "The hydration marker waits for the final layout"); Frontend Map v0.6; the design library v1.1; the Step 0 and Step 1 plan; Leah's a2 review report and findings decisions-leah-01 to 04; decisions-fenn-01; this task doc. I skimmed the design files and the Step 0 and Step 1 plan for what touches the marker, since a3 changes nothing they define. None is missing.
- Branch `frontend/sprint-01/agent-leon-decisions-build-a3`, start commit `1dca02d`.
- Part 7 commands: all available. The worktree first needed `pnpm install --frozen-lockfile`. `typecheck` failed until `pnpm --filter "@avel/web..." build` had built `@avel/contract`. After that every command passed.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| LEON-01 | DONE (a1/a2, on main; not in a3) | see a2's report |
| LEON-02 | DONE (a2, on main; not in a3) | see a2's report |
| LEON-03 | DONE (a2, on main; not in a3) | see a2's report |
| LEON-04 | DONE (a2, on main), now refined by LEON-06 | see a2's report |
| LEON-05 | Not in a3: the task doc moves it to the attempt after a3 | none |
| LEON-06 | DONE | f62362a |

## Contract to files
| Item | Files | Result |
| --- | --- | --- |
| LEON-06: the marker is set only in a commit after every `DecisionTag` has its client layout, tied to React's commit with no timer | `apps/web/src/modules/decisions/screens/DecisionsScreen.tsx` (`useSettledOnClient`, `Settled`, `DecisionsList`, `DecisionsScreen`) | Probe: 10/10 phone loads with no change after the marker |
| Section 5, the hydration marker: absent from the server's HTML and the hydration render, so hydration doesn't mismatch | same | Server HTML of `/`: `data-ui="DecisionsPage"` present, `data-hydrated` absent. No hydration or mismatch console message and no page errors over 13 probe loads |
| Desk unchanged | same | Probe: 3/3 desk loads with no change after the marker; e2e desk tests pass |
| Bar point 4 (preparation for Fenn's a6): the locked suite stays green | none changed | 10/10 runs with 5 passed and 1 skipped, none failed or flaky |

**How it works.** `DecisionsList` sits in its own `Suspense` boundary, and React hydrates that boundary in a later pass than the page root. So the root's `useSyncExternalStore` used to flip, and set the marker, before the list's `useIsPhone()` flipped to phone. Now:
- the root keeps the marker in `useState(false)`, so it's absent on the server and in the hydration render;
- `DecisionsList` reads `useHydrated()` (the same `useSyncExternalStore`, server snapshot `false`) in the same component and render as `useIsPhone()`. The render where it's first `true` is the one whose tags carry the browser's layout;
- in that render's commit, a `useLayoutEffect` calls the root's setter, so the marker lands in the next, synchronous commit, before paint;
- when no list is drawn (the loading fallback and the first-load error fallback, both rendered on the client), a tiny `Settled` component sends the same signal. Neither contains a `DecisionTag`;
- the marker is never unset.

## Deviations
1. **The marker is no longer the root's own `useSyncExternalStore` read.** Section 5 (revision 9) says it's read with `useSyncExternalStore` and no `useEffect`. The signal is still that same `useSyncExternalStore` read, now in the content (`DecisionsList` or `Settled`). But it reaches the root through a `useLayoutEffect` that sets root state. I didn't use `useEffect`. Why: the root alone can't know when a Suspense boundary hydrated in a later pass has taken the browser's values. The task doc asks for it to be tied to React's commit, and a layout effect runs in exactly that commit. Revision 15's wording ("once every tag has its final layout") should name this mechanism. **For Zero.**

## Limitations
- The desk-to-phone switch still happens, only now before the marker. The 0.13 CLS on `/` (cls-study-leah-01) stays open for option (a), as the task doc says.
- The probe samples once per animation frame. In every phone load the snapshot taken when the marker appeared already held the phone layout (the switch and the marker land before the same paint), and nothing changed in any frame after it. The probe doesn't see the server's desk HTML being replaced inside that one task, which is by design.
- LEON-05 (the kit's `loadReasonDialog`, `UiError.stale.message`) isn't in a3. The deep import of `kit/ReasonDialog` stays as built.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Fenn (decisions-test-e2e a6):** FENN-04 can run again; no test change should be needed. My 10 runs on this branch were all green.
- **Zero:** Deviation 1, for revision 15's marker sentence.
- **Operator:** another session's dev server from `/home/jt0629/projects/avel-factory/apps/web` (pid 31249, `vite dev --port 4199`, running 1h40m) was holding port 4199. I left it running and used port 4211 for the probe. It doesn't conflict with the e2e port 4173.

## Files changed
```
apps/web/src/modules/decisions/screens/DecisionsScreen.tsx
docs/agent-dispatch/frontend/sprint-01/agent-leon-decisions-build-completion.md
```

## Verification

LEON-06's verify:
```
$ pnpm --filter @avel/web typecheck        # exit 0
$ pnpm --filter @avel/web test
 Test Files  14 passed (14)
      Tests  197 passed (197)
$ for i in $(seq 1 10); do pnpm --filter @avel/web exec playwright test 2>&1 | grep -E 'passed|failed|flaky|skipped'; done
  1 skipped
  5 passed (15.3s)
  1 skipped
  5 passed (15.5s)
  1 skipped
  5 passed (14.4s)
  1 skipped
  5 passed (14.6s)
  1 skipped
  5 passed (14.6s)
  1 skipped
  5 passed (14.3s)
  1 skipped
  5 passed (12.8s)
  1 skipped
  5 passed (14.7s)
  1 skipped
  5 passed (15.1s)
  1 skipped
  5 passed (14.7s)
$ git diff "$(git merge-base main HEAD)"..HEAD --stat     # before the report commit
 .../modules/decisions/screens/DecisionsScreen.tsx  | 49 ++++++++++++++++++----
 1 file changed, 42 insertions(+), 7 deletions(-)
```

The probe (scratchpad `probe.mjs`, not in the repo) ran on `AVEL_API=mock vite dev` at port 4211, Chromium, 390x844 with isMobile and hasTouch, each load in a fresh context. It runs a rAF poll of every tag's `data-layout` and each button's text, order and rect, plus a MutationObserver on `data-hydrated`. `t` is ms of page time. Load 2, in full:
```
t=34  hyd=0  0:desk:Approve@174,426,184x44|Reject…@32,426,132x44 ; 1:desk:Approve@174,726,184x44|Reject…@32,726,132x44 ; 2:desk: ; 3:desk:@207,1112,24x24
t=378 marker 0:phone:Reject…@34,464,130x44|Approve@174,464,182x44 ; 1:phone:Reject…@34,844,130x44|Approve@174,844,182x44 ; 2:phone: ; 3:phone:@209,1314,24x24
t=385 hyd=1  (identical to the marker's snapshot; no further change to t=4000)
```
Summary of all 10 loads:
```
load 1: marker t=1412 ms; changes after marker=0; OK; hydration warnings=none   (first load after the dev server started: cold transform)
load 2: marker t=378 ms; changes after marker=0; OK; hydration warnings=none
load 3: marker t=417 ms; changes after marker=0; OK; hydration warnings=none
load 4: marker t=435 ms; changes after marker=0; OK; hydration warnings=none
load 5: marker t=365 ms; changes after marker=0; OK; hydration warnings=none
load 6: marker t=369 ms; changes after marker=0; OK; hydration warnings=none
load 7: marker t=448 ms; changes after marker=0; OK; hydration warnings=none
load 8: marker t=360 ms; changes after marker=0; OK; hydration warnings=none
load 9: marker t=359 ms; changes after marker=0; OK; hydration warnings=none
load 10: marker t=343 ms; changes after marker=0; OK; hydration warnings=none
10/10 phone loads with no rect, order or layout change after the marker
```
In every load the marker's own snapshot already reads `phone` with Reject then Approve at y=464. Before the fix (Fenn's a5) the marker's snapshot read `desk` at y=426 and the switch came 15 to 30 ms later. Desk, 3 loads: markers at 369, 377 and 376 ms, no change after; `3/3 desk loads with no rect, order or layout change after the marker`. Server HTML of `/`: `DecisionsPage true | data-hydrated false`.

Part 7:
```
$ pnpm --filter "@avel/web..." build
apps/web build: dist/server/assets/routes-CUMjJ7cY.js                       49.74 kB │ gzip: 14.09 kB
apps/web build: dist/server/server.js                                      261.21 kB │ gzip: 63.20 kB
apps/web build: ✓ built in 140ms
apps/web build: Done
exit 0
$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
packages/contract-mock typecheck: Done
apps/web typecheck: Done
$ pnpm lint
Checked 213 files in 112ms. No fixes applied.
$ pnpm --filter @avel/web test
 Test Files  14 passed (14)
      Tests  197 passed (197)
$ git diff --name-only main...HEAD
apps/web/src/modules/decisions/screens/DecisionsScreen.tsx
docs/agent-dispatch/frontend/sprint-01/agent-leon-decisions-build-completion.md   (this report, the last commit)
```
