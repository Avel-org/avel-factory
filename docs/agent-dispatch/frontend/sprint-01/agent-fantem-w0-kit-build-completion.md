# FANTEM: w0-kit build, completion report

verdict: PARTIAL

## Summary
Attempt a4 does FANTEM-05 and FANTEM-06, on main at b1932d9 as INT asked. Fenn's D11 tests (88f3d4a) and D15 tests (faed68f) are merged and locked, so I tested on main itself, not on a scratch merge.
- **D11:** done. It's now kit.css's `.av-dt-pair` rule.
- **R7 `loadReasonDialog`:** exported, and its locked test passes.
- **D15:** done.
- **Tests:** all 6 kit tests that failed first now pass, and the whole unit suite is green (196/196). Lint is clean.

Two things are not done, and each needs INT's decision:
- **The R7 split doesn't hold.** With the page loading the dialog through `loadReasonDialog`, the static re-export puts `ReasonDialog` in `/`'s route chunk. The section 4 rule for this case is to stop and report, so I did.
- **UC-31 still fails, but later than before.** Its D11 grid assertions now pass. It then fails on the dialog's confirm button, which reads 43.87 to 44.00px. The test reads the button's box while DL's 240ms `av-dialog-in` scale animation is still running.

## Pre-flight
- **Part 2 files, all read:**
  - `.claude/agents/fantem.md`
  - `codebase-analysis.md`
  - UI contract revision 11: sections 0 and 4 in full, section 5 skimmed
  - `CR-W2 Pending decisions.md`: skimmed; nothing in it touches D11, D15 or R7
  - `decisions.md`: "Revision 10" and "Revision 11" in full
  - Frontend Map v0.6 and `Step 0 and Step 1 plan.md`: skimmed
  - the design library: `.pd-actions` and `.pd[data-phone] .pd-actions` (lines 1692, 1693 and 2406), and the `--av-d-sheet` token
  - `findings/decisions-brennan-01.md` and `findings/decisions-zero-02-factory-pr-card-empty-facts-rule.md`
  - `findings/decisions-zero-01-uc31-phone-grid-fails-before-hydration.md`, which I read for context
  - this task doc
- **Locks:** `locks.md` is at `docs/agent-dispatch/frontend/sprint-01/locks.md`. The w0-kit lock is at faed68f, and nothing under any locked path was touched.
- **Branch:** `frontend/sprint-01/agent-fantem-w0-kit-build-a4`, starting at b1932d9 (main).
- **Part 7 commands:** all available. The worktree first needed `pnpm install --frozen-lockfile`. `@avel/web`'s typecheck only passes after the `@avel/web...` build has built `@avel/contract`.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| FANTEM-01 | DONE (a1, merged) | e47b8a5, 56a079b |
| FANTEM-02 | DONE (a1, merged) | 14befc1 |
| FANTEM-03 | DONE (a2, merged) | 4f0cf1c |
| FANTEM-04 | DONE (a3, merged) | d3ec9a4 |
| FANTEM-05 | BLOCKED: D11 and the R7 export are done; R7's split is stop-and-report (Deviations 2); UC-31 is red on the dialog's animation (Deviations 3) | 2efe1a1 |
| FANTEM-06 | DONE | fff7a3e |

## Contract to files
- **D11 (section 4, revision 10):**
  - `apps/web/src/kit/DecisionTag.tsx`: Approve and Reject share `<div className="av-dt-pair">` in both layouts. Each layout keeps its own DOM order: desk is Approve then Reject, phone is Reject then Approve. There's no inline grid style.
  - `apps/web/src/kit/kit.css`, outside any media block:
    - `[data-layout="phone"] .av-dt-pair { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); gap: 10px }`. These are DL's `.pd[data-phone] .pd-actions` values.
    - `[data-layout="desk"] .av-dt-pair { display: contents }`, so at 900px and over the buttons are the row's own flex items, as before.
  - `kit.css`, inside the K1 `@media (max-width: 899px)` block:
    - the desk pair gets the same grid, plus `flex: 1 1 100%` so it spans the row;
    - `> :first-child` (Approve) is placed at column 2 and `> :last-child` (Reject) at column 1, both on row 1, so Reject is on the left.
  - The single-button case (only one label) is drawn without the container, as before.
  - Locked tests: UC-08 phone and desk (D11), and the two UC-08 kit.css tests (D11).
- **R7:** `apps/web/src/kit/index.ts` exports `loadReasonDialog(): Promise<{ ReasonDialog: typeof ReasonDialog }>` as `() => import("./ReasonDialog")`, beside the kept static `ReasonDialog` export. Locked test: UC-09 (R7).
- **D15:** `apps/web/src/kit/DecisionTag.tsx:319-321`: `{evidence || consequence ? <dl className="av-dt-facts">…</dl> : null}`. kit.css doesn't change for it. Locked tests: the three UC-08 (D15) tests.
- **Header comment:** `DecisionTag.tsx`'s header now says D1 to D15.

## Measurements
All measured at a4 (fff7a3e) on the dev server with `AVEL_API=mock`, in Chromium.

**1. D11 at 390x844 (`isMobile`, `hasTouch`): the server's HTML with JavaScript off, i.e. before hydration.**
- The tags are `layout="desk"`. `.av-dt-pair` computes `display: grid`, `131.656px 184.328px` (two columns), with a `10px` gap.
- Reject is at x=32, 131.7 x 44. Approve is at x=174, 184.3 x 44. That's Reject on the left, a ratio of 1.40, and both 44px tall.

**2. D11 at 390x844, hydrated (`layout="phone"`).**
- `.av-dt-pair` is `grid`, `130px 182px`, with a `10px` gap.
- Reject is at x=34, 130 x 44. Approve is at x=174, 182 x 44.

**3. Desk at 900x800 and 1280x800, hydrated: nothing changes.**
- I took each card's box and each button's box at a4 and at main (b1932d9's kit), and diffed the two outputs.
- Every proposal card and button is identical. At 1280, Approve is at 67,373, 77x32, and Reject is at 152,373, 75x32, in both trees.
- The desk `.av-dt-pair` computes `display: contents`.
- The only difference is the Factory PR card. It's 192 → 171px tall (21px: the empty 11px strip and the 10px gap under it), and `Open on GitHub` moves up 21px. That's D15's intended change.

**4. D15, the Factory PR card at 390x844, both before and after hydration.**
- `.av-dt-facts` count: 0.
- Elements in the card with a top border:
  - before hydration: `SPAN` (no class, 22px tall, in the head row, y=1049), then `DIV.av-dt-foot` (padTop 12px, y=1145, h=57). `Open on GitHub` is at y=1158.
  - after hydration: `SPAN` (y=1251, h=22), then `DIV.av-dt-foot` (padTop 12px, y=1347, h=57). `Open on GitHub` is at y=1360.
- The `SPAN` is a 22px-tall element in the card's head row that has a border on all four sides, so I read it as one of the head's chips, not a horizontal rule. So the only rule above `Open on GitHub` is `.av-dt-foot`'s.
- A proposal card (`parked`) still has 1 `.av-dt-facts`.
- Before this change (Zero's decisions-zero-02 at d480f0e), the card drew `DL.av-dt-facts` (children 0, h 11) and then `.av-dt-foot`.

**5. The R7 split.** These are `pnpm --filter @avel/web build` client chunks (gzip).

| | `ReasonDialog-*.js` | `routes-*.js` (/'s screen) | `jsx-runtime-*.js` | `index-*.js` |
| --- | --- | --- | --- | --- |
| main, Leon's deep import (as merged) | 3.50 kB / **1.53 kB** | 46.50 / 15.83 | 8.91 / 3.39 | 493.90 / 154.71 |
| scratch: Leon's import switched to the kit's `loadReasonDialog` | 0.05 kB / **0.07 kB** | 49.59 / **16.73** | 12.58 / 4.41 | 490.09 / 153.81 |

- With the switch, `ReasonDialog-*.js` is only `export{t as ReasonDialog}from"./routes-DncHviNR.js";`. The dialog's code is inside `routes-*.js`.
- The scratch edit was two lines in `DecisionsScreen.tsx`: import `loadReasonDialog as loadKitReasonDialog` from `../../../kit`, and `loadKitReasonDialog().then(` in place of `import("../../../kit/ReasonDialog").then(`.
- I reverted it with `git checkout`, and it was never committed. `git status` was clean afterwards.

**6. The dialog's confirm button: why UC-31 still fails.**
- I opened the dialog and read the button straight away, at the same point UC-31 reads it:
  - `getBoundingClientRect().height` is `43.936`;
  - `offsetHeight` is `44`;
  - the `.av-dialog` transform is `matrix(0.998545, 0, 0, 0.998545, 0, 0.775796)`, with `av-dialog-in` running.
- After `document.getAnimations()` finish, the box is `44` and the transform is `matrix(1, 0, 0, 1, 0, 0)`.
- Three reruns of UC-31 read 43.996, 43.907 and 43.868.

## Deviations
1. **Shown on main, not on a scratch merge.** INT's message at the start of this session told me to: both of Fenn's test commits and Leon's a2 are already merged, so main is the merge. The only scratch change was R7's import switch in item 5 above, which was thrown away.
2. **R7: stop and report (UI contract section 4, R7; this task doc's R7 note).**
   - **What happens:** with the page loading the dialog through `loadReasonDialog`, the bundler puts `ReasonDialog` and `Dialog` into `routes-*.js`, `/`'s first-load screen chunk (+0.90 kB gzip there). Its own chunk is left as a 0.07 kB re-export stub.
   - **Why:** `kit/index.ts`'s static `export { ReasonDialog } from "./ReasonDialog"` makes the module statically reachable from the route's import of the kit index. So the dynamic import can't move it out.
   - **What I did and didn't do:** I kept the export, as R7 says, and didn't attempt a workaround in the kit. Any static export of the same `ReasonDialog`, which UC-09 (R7) checks by identity, keeps the module in the index's graph.
   - **On main as merged, the split holds:** Leon's deep import gives `ReasonDialog` its own 1.53 kB chunk. So nothing regresses unless Leon switches the import. **Leon's a3 should not switch to `loadReasonDialog`** until INT decides.
   - **Options I can see, for INT:**
     - (a) Leon keeps the deep import, and R7 stays an export the page doesn't use;
     - (b) a chunking rule in Nemi's `vite.config.ts` that pins `src/kit/ReasonDialog.tsx` and `src/kit/Dialog.tsx` to their own chunk (unmeasured);
     - (c) the kit's static `ReasonDialog` export moves off `index.ts`. That needs a locked-test change, since UC-09 imports it from the index.
3. **UC-31 isn't green; the cause is the locked test's timing, not the kit's size.**
   - **What changed:** at a4, UC-31's D11 assertions all pass: `display: grid`, 2 columns, a 10px gap, Reject left, the 1.4 ratio, and both buttons at least 44px. That was the failure in decisions-zero-01.
   - **What fails now:** the test then opens the dialog and reads the confirm button's `boundingBox()` straight away. That happens during DL's `av-dialog-in` (`translateY(8px) scale(0.985)` → none, over `--av-d-sheet` 240ms).
   - **The numbers:** the button lays out at 44px (`offsetHeight` 44, from K1's `min-height: var(--av-touch-min)`), but its transformed box is about 43.9px. Measurement 6 has the detail.
   - **What I didn't do:** I didn't change DL's animation, which would break section 0's value rule. Making the button taller than the token would be a new value. I didn't edit the locked test.
   - **The likely fix (Fenn, under the override):** wait for the dialog's animations before measuring, e.g. `await dialog.evaluate((d) => Promise.all(d.getAnimations({ subtree: true }).map((a) => a.finished)))`. The other option is to read the layout height rather than the transformed box. The decision is INT's.

## Limitations
- In the desk DOM at phone width, the link in the row (`Open on GitHub`, only on cards that also have both buttons) wraps under the pair with the row's 8px gap. The phone layout uses a 10px gap there. The page draws no row with both a link and the pair today, so I didn't measure it. After hydration the page switches to `layout="phone"` anyway.
- `flex: 1 1 100%` on the desk pair under 900px isn't a value from DL or a token. It's a layout keyword that makes the pair span its flex row, as the phone column's stretch does. INT or Zero may want it named under section 0.
- R7's split: see Deviations 2.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT:**
  - R7's split fails with the static export (Deviations 2). Choose (a), (b) or (c).
  - UC-31's dialog timing (Deviations 3). It needs Fenn's e2e override to go green.
- **Leon:** don't switch `DecisionsScreen.tsx` to `loadReasonDialog` until INT decides on R7. It would put the dialog back into `/`'s first load (+0.90 kB gzip).
- **Fenn:** UC-31 (`e2e/decisions.spec.ts:155-162`) measures the confirm button during the dialog's 240ms open animation (Deviations 3). This is only if INT gives you the override.
- **Zero:** section 4's D11 could name the desk pair's `flex: 1 1 100%` under 900px (Limitations). Decisions-zero-01 (the grid) and decisions-brennan-01 / decisions-zero-02 (D15) are fixed by fff7a3e.

## Files changed
```
apps/web/src/kit/DecisionTag.tsx
apps/web/src/kit/index.ts
apps/web/src/kit/kit.css
docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build-completion.md
```

## Verification
Run at fff7a3e, before this report was committed. The outputs are filtered to their result lines.

```
$ pnpm --filter "@avel/web..." build
packages/contract build$ tsc -p tsconfig.json
packages/contract build: Done
apps/web build$ vite build
apps/web build: dist/client/assets/decisions-BpPPU4Jm.css              1.54 kB │ gzip:   0.54 kB
apps/web build: dist/client/assets/kit-CzInvUmc.css                   17.70 kB │ gzip:   3.81 kB
apps/web build: dist/client/assets/app-CCOL2GSK.css                   31.88 kB │ gzip:   6.94 kB
apps/web build: dist/client/assets/ReasonDialog-Br5xqR0N.js            3.50 kB │ gzip:   1.53 kB
apps/web build: dist/client/assets/jsx-runtime-Wy9s6hX0.js             8.91 kB │ gzip:   3.39 kB
apps/web build: dist/client/assets/routes-C8xPsqGx.js                 46.50 kB │ gzip:  15.83 kB
apps/web build: dist/client/assets/index-mQT-vRPr.js                 493.90 kB │ gzip: 154.71 kB
apps/web build: ✓ built in 1.10s
apps/web build: ✓ built in 359ms
apps/web build: Done

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done

$ pnpm lint
Checked 213 files in 405ms. No fixes applied.

$ pnpm --filter @avel/web test
 Test Files  14 passed (14)
      Tests  196 passed (196)

$ git diff --name-only main...HEAD
apps/web/src/kit/DecisionTag.tsx
apps/web/src/kit/index.ts
apps/web/src/kit/kit.css
```

The task verifies for FANTEM-05 and FANTEM-06:

```
$ pnpm --filter @avel/web exec vitest run test/kit
 Test Files  3 passed (3)
      Tests  74 passed (74)
   (on main before a4: 6 failed | 68 passed: UC-08 D11 x4, UC-08 D15 x1, UC-09 R7 x1)

$ grep -n 'av-dt-pair' apps/web/src/kit/kit.css apps/web/src/kit/DecisionTag.tsx
apps/web/src/kit/DecisionTag.tsx:196:          // right. The grid is kit.css's .av-dt-pair rule.
apps/web/src/kit/DecisionTag.tsx:197:          <div className="av-dt-pair">
apps/web/src/kit/DecisionTag.tsx:213:          <div className="av-dt-pair">
apps/web/src/kit/kit.css:911:/* D11: Approve and Reject share .av-dt-pair. ...
apps/web/src/kit/kit.css:915:[data-layout="phone"] .av-dt-pair {
apps/web/src/kit/kit.css:920:[data-layout="desk"] .av-dt-pair {
apps/web/src/kit/kit.css:979:     so under 900px the desk row's .av-dt-pair is D11's grid, ...
apps/web/src/kit/kit.css:981:  [data-layout="desk"] .av-dt-pair {
apps/web/src/kit/kit.css:987:  [data-layout="desk"] .av-dt-pair > :first-child {
apps/web/src/kit/kit.css:991:  [data-layout="desk"] .av-dt-pair > :last-child {

$ ! grep -n 'gridTemplateColumns' apps/web/src/kit/DecisionTag.tsx
(no output; exit 0)

$ grep -n 'loadReasonDialog' apps/web/src/kit/index.ts
25:export function loadReasonDialog(): Promise<{

$ grep -n -B2 'av-dt-facts' apps/web/src/kit/DecisionTag.tsx
319-        {/* D15: the facts list, with its top rule, only when there's a fact to list. */}
320-        {evidence || consequence ? (
321:          <dl className="av-dt-facts">
```

The end-to-end suite, on main with a4 (`AVEL_E2E_PORT=4391 pnpm exec playwright test`, in apps/web):

```
  ✓  1 [phone] UC-29: / is server-rendered with its rows, and approving a proposal with a reason removes it
  ✓  2 [phone] UC-30: a version bumped while the page is open gives the stale state, and Review then approve works
  ✘  3 [phone] UC-31: on a phone the actions are D11's two-column grid, 44px tall, and the reason input is 16px
  ✓  4 [desk] UC-29 ...
  ✓  5 [desk] UC-30 ...
  -  6 [desk] UC-31 ... (skipped: phone only)
    Expected: >= 44
    Received:    43.956787109375      (e2e/decisions.spec.ts:162, the dialog's confirm button)
  1 failed
  1 skipped
  4 passed
```
