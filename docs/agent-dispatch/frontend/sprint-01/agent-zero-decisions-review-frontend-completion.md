# ZERO: decisions review-frontend, completion report

verdict: PASS

Attempt a2 (2026-11-07). ZERO-02 only, as INT's message scoped it: Leon's decisions build a3 (LEON-06, report ec24538), on review base `review-base/leon-decisions-a3` = `db4cc8b` (main `3b4a7c0` plus `ec24538`). ZERO-01 was a1's. ZERO-03 is the next attempt's.

## Summary
Leon's a3 sets `data-hydrated` in a React commit after every tag has its final layout. There's no timer, and it's absent from the server's HTML. My own probe, at 390x844 with a fresh context for each load, saw no change to any rect, order, layout or DOM after the marker in 10 of 10 phone loads and 3 of 3 desk loads. The same probe run on main's old marker failed 10 of 10, so it does catch the bug. The locked e2e suite gave 10 of 10 runs of "5 passed", and only the module changed. On Deviation 1 (the layout effect), my ruling is to accept it for sprint-01. Revision 15's marker sentence already allows it, so the sentence needs no change (see Deviations, "Ruling").

## Pre-flight
- Part 2 files, all read: `.claude/agents/zero.md`, `codebase-analysis.md`, the UI contract (revision 15; section 5 in full, and section 7's e2e paragraph and UC-32), CR-W2, sprint `decisions.md` ("Revision 9" marker entry, and "2026-11-07: The hydration marker waits for the final layout" and its revision 15 entries), Frontend Map v0.6, the design library v1.1, the Step 0 and Step 1 plan, `decisions-fenn-01` (including INT's ruling), and this task doc. zero.md's Read first list: also `API and data reference.md` and `CR-16`. The design files and the plan I skimmed for what touches the marker, since a3 changes nothing they define. None is missing.
- Branch `frontend/sprint-01/agent-zero-decisions-review-frontend-a2`, start commit `db4cc8b`. `AVEL_BASE=3b4a7c0`.
- Setup: `pnpm install --frozen-lockfile` (no tracked change). Every Part 7 command is available.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZERO-01 | Not in a2 (attempt a1's) | none |
| ZERO-02 | DONE: PASS, no findings | this report |
| ZERO-03 | Not in a2 (attempt a3's, on Leon's a4) | none |

## Findings
none

## Contract to files
The diff, `git diff main...ec24538`, touches only `apps/web/src/modules/decisions/screens/DecisionsScreen.tsx` (+42 −7) and Leon's report.

| ZERO-02 item (section 5, the hydration marker, revision 15) | Where | Evidence |
| --- | --- | --- |
| Set once every tag has its final layout | `DecisionsScreen.tsx:191-196` (`useSettledOnClient`), `:375-376` (`useIsPhone` and the signal read in the same render of `DecisionsList`), `:212,218` (root state and attribute) | My probe: 10/10 phone loads with 0 snapshot changes and 0 DOM mutations after the marker. The marker's own snapshot already reads `phone`, with Reject then Approve at y=464 |
| Set in a React commit, never on a timer | `:193-195`: a `useLayoutEffect` sets root state, so the marker lands in the next synchronous commit | `grep setTimeout\|requestAnimationFrame\|setInterval` in the screen: only `:567,580`, the pre-existing 5.3 countdown and 5.2 delays, outside the diff |
| Absent from the server's HTML | `:212` `useState(false)` | Server HTML of `/` (dev, mock): `DecisionsPage 1, data-hydrated 0, tags desk 4, tags phone 0` |
| No hydration mismatch | the hydration render keeps `false` (state starts false; `useHydrated`'s server snapshot is false) | 0 hydration, mismatch or page-error console messages over 13 probe loads |
| Loading and first-load error states also get the marker | `:199-202` `Settled`, `:243,252` | read: neither fallback draws a `DecisionTag`, so its client commit is final; the marker is only ever set |
| Desk unchanged | same | 3/3 desk loads with no change after the marker; desk e2e passes |
| Only the module changed | `git diff --name-only main...HEAD` | the screen file, plus Leon's report |
| No fetch in the module (verify carried from ZERO-01) | `apps/web/src/modules/decisions` | the grep lists nothing (exit 1) |

**The probe** (my own, scratchpad `zprobe.mjs`, not in the repo):
- Chromium at 390x844 with `isMobile` and `hasTouch`, a fresh context for each load, `POST /__mock/reset` before each load, against `AVEL_API=mock vite dev` on port 4231.
- An init script snapshots every `DecisionTag`'s `data-layout` and rect, and every button's text and rect. It takes one on every MutationObserver callback (on the whole document: attributes, childList, characterData) and on every rAF.
- The snapshot taken in the MutationObserver callback that first sees `data-hydrated` is the marker snapshot. Every later snapshot, for 3 s, is compared against it, and every DOM mutation after it is counted.

Leon's a3, phone:
```
load 1: first t=29 marker t=1347; changes after marker=0; mutations after marker=0; OK; warnings=none   (cold transform)
load 2: first t=27 marker t=397; changes after marker=0; mutations after marker=0; OK; warnings=none
  first : 0:desk:[195,269]:Approve@48,443,70x21|Reject…@118,443,69x21 ; ...
  marker: 0:phone:[178,348]:Reject…@34,464,130x44|Approve@174,464,182x44 ; 1:phone:[538,368]:Reject…@34,844,130x44|Approve@174,844,182x44 ; 2:phone:[918,279]: ; 3:phone:[1209,213]:@209,1314,24x24
load 3: ... marker t=416; changes after marker=0; mutations after marker=0; OK
load 4: ... marker t=425; 0; 0; OK
load 5: ... marker t=442; 0; 0; OK
load 6: ... marker t=404; 0; 0; OK
load 7: ... marker t=451; 0; 0; OK
load 8: ... marker t=383; 0; 0; OK
load 9: ... marker t=374; 0; 0; OK
load 10: ... marker t=382; 0; 0; OK
10/10 phone loads with no rect, order or layout change after the marker
```
Desk: markers at 345, 391 and 365 ms, with 0 changes and 0 mutations after each: `3/3 desk loads with no rect, order or layout change after the marker`.

**The negative control.** The same probe ran on main `3b4a7c0`'s old marker (the root's `useHydrated()` at `:187`, revision 9), in a detached scratch worktree on port 4232. I removed it afterwards.
```
load 2: marker t=384; changes after marker=209; mutations after marker=30; MOVED
  marker: 0:desk:[178,308]:Approve@174,426,184x44|Reject…@32,426,132x44 ; ...
  after t=412 (mo): 0:phone:[178,348]:Reject…@34,464,130x44|Approve@174,464,182x44 ; ...
0/10 phone loads with no rect, order or layout change after the marker
```
Under the old marker, the switch from desk to phone came 25 to 38 ms after it in every load. That's decisions-fenn-01's window, and a3 closes it.

## Deviations
- **Scope:** ZERO-02 only, on INT's message. ZERO-01 and ZERO-03 aren't this attempt's.
- **Ruling on Leon's Deviation 1** (the marker reaches the root through a `useLayoutEffect` that sets root state, not through the root's own `useSyncExternalStore` read): **accepted for sprint-01.**
  - Revision 9's "`useSyncExternalStore` and no `useEffect`" was dropped in revision 15. Section 5 now says the marker is "set in a React commit, never after a timer", and that "How the page meets this rule is the page's choice" (contract lines 417-418; decisions.md, revision 15's "The hydration marker waits for the final layout"). A layout effect runs inside the commit, and the state it sets lands in a synchronous commit before paint. So it's within the rule.
  - It's also the right design. React hydrates the list's own Suspense boundary in a later pass than the root, so the root can't know when that boundary has taken the browser's values. Only the content can. React 19.3 doesn't warn about `useLayoutEffect` during SSR, and it doesn't run there. 0 console warnings, as above.
  - **For revision 15's marker sentence:** no wording change is needed, since the sentence already leaves the mechanism to the page. I recommend one line in decisions.md: "a3's mechanism: the content reads the client signal in the same render as its layout inputs, and a layout effect in that commit sets the root's state. Accepted by Zero, decisions review-frontend a2." That records it without making it a rule.
  - **For Leon's a4 (ZERO-03):** with `layout="desk"` everywhere and no `useIsPhone`, the mechanism still holds as it is. The comment at `DecisionsScreen.tsx:373-374` that names `phone` will need rewording then.

## Limitations
- The probe ran on the dev server, as Leon's and Fenn's did, not on a production build. The marker's ordering is React's commit order, which is the same in both, but the timings (about 350 to 450 ms) are dev timings.
- The desk-to-phone switch still happens before the marker, as INT's option (c) allows. The 0.13 CLS (cls-study-leah-01) stays open for option (a): revision 15, D16, UC-32, and Leon's a4.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT:** a3 can merge. That closes decisions-fenn-01 bar point 2. Fenn's decisions-test-e2e a6 (FENN-04) then closes the finding. The decisions.md line in Deviations is your call; my territory doesn't cover decisions.md.
- **Leon (a4):** reword the comment at `DecisionsScreen.tsx:373-374` when `useIsPhone` goes. Keep `useSettledOnClient` in `DecisionsList`.
- **Operator:** seven detached scratch worktrees from other sessions are still registered (`git worktree list`: Brennan's zod-mini a1 `wt-base` and `wt-joint`, and Leah's cls-study a1 `wt-avg`, `wt-main`, `wt-nemi`, `wt-old` and `wt-phone`). I left them alone.

## Files changed
```
apps/web/src/modules/decisions/screens/DecisionsScreen.tsx                         (Leon's a3, in the review base)
docs/agent-dispatch/frontend/sprint-01/agent-leon-decisions-build-completion.md    (Leon's a3, in the review base)
docs/agent-dispatch/frontend/sprint-01/agent-zero-decisions-review-frontend-completion.md   (this report, the last commit)
```

## Verification
ZERO-02's verify:
```
$ pnpm --filter @avel/web test
 Test Files  14 passed (14)
      Tests  197 passed (197)
$ for i in $(seq 1 10); do pnpm --filter @avel/web exec playwright test 2>&1 | grep -E 'passed|failed|flaky'; done
  5 passed (15.1s)
  5 passed (14.0s)
  5 passed (14.8s)
  5 passed (13.9s)
  5 passed (14.9s)
  5 passed (13.7s)
  5 passed (14.5s)
  5 passed (14.1s)
  5 passed (13.5s)
  5 passed (14.1s)
```
Part 7:
```
$ pnpm --filter "@avel/web..." build
apps/web build: dist/server/server.js                                      261.21 kB │ gzip: 63.20 kB
apps/web build: ✓ built in 146ms
apps/web build: Done
exit 0
$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
packages/contract-mock typecheck: Done
apps/web typecheck: Done
exit 0
$ pnpm lint
Checked 213 files in 116ms. No fixes applied.
exit 0
$ pnpm --filter @avel/web test
 Test Files  14 passed (14)
      Tests  197 passed (197)
exit 0
$ git diff --name-only main...HEAD      # before this report's commit; both are Leon's, in the review base
apps/web/src/modules/decisions/screens/DecisionsScreen.tsx
docs/agent-dispatch/frontend/sprint-01/agent-leon-decisions-build-completion.md
$ grep -rnE '(^|[^[:alnum:]_])fetch[[:space:]]*\(' apps/web/src/modules/decisions
(no output; exit 1)
```
