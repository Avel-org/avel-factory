# ZERO: w0-kit review-frontend, completion report

verdict: PASS

## Summary
Attempt a3 reviews Fantem's w0-kit a3: K1 (phone touch sizes) and R5 (the dialog's `aria-describedby`), code d3ec9a4 and report 6ceb167, merged on main as a9c5cf9. Both meet UI contract section 4 (revision 9). Every new value is a DL token, the rules apply only below 900px, the tap areas grow without making any row taller, and `aria-describedby` is there only with a description. I measured all of this myself in Chromium on the real kit components. No findings. My a1 findings 01 and 02 are still fixed (56a079b).

## Pre-flight
- Part 2 files, all read (none missing):
  - `.claude/agents/zero.md`
  - `codebase-analysis.md`
  - `docs/ui-contracts/decisions-approval-page.md`: sections 0, 4 and 8 in full, and 5's phone width (`max-width: 899px`, line 413)
  - `CR-W2 Pending decisions.md`: skimmed; nothing in it touches K1 or R5
  - `decisions.md`: Revision 9, and INT's answers on revision 9, in full
  - Frontend Map v0.6: skimmed
  - the design library:
    - the tokens: `--av-touch-min: 44px` (line 494) and `--av-phone-body: 16px` (line 434);
    - the `[data-density="phone"]` blocks (lines 455 and 508);
    - its own mobile touch rules (lines 2429 to 2440 and 2786 to 2797);
    - `.av-icon-close` (line 657)
  - `Step 0 and Step 1 plan.md`: skimmed
  - this task doc
- Branch: `frontend/sprint-01/agent-zero-w0-kit-review-frontend-a3`, at start commit b97076e (`AVEL_BASE` = b97076e).
- Part 7 commands: all available.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZERO-01 | DONE | this report's commit |
| ZERO-02 | DONE | this report's commit |

## Findings
none

## Contract to files
The diff under review is `git diff a9c5cf9^1 a9c5cf9`: `apps/web/src/kit/Dialog.tsx` (+8 −2), `apps/web/src/kit/kit.css` (+36), and Fantem's own report.

**ZERO-01 (the kit as a whole, against section 4):**
- **Verify:** `vitest run test/kit` passes: 3 files, 68 tests. The grep for `@orpc`, `@tanstack/react-router` and six-digit hex colours under `apps/web/src/kit` lists nothing.
- **What a3 changes:** no props, copy or `data-ui` names. The one new attribute, `aria-describedby`, is what R5 asks for.
- **Earlier findings:** w0-kit-zero-01 and 02 are `fixed (56a079b)`, and the a3 diff doesn't touch that code.

**ZERO-02 (K1 and R5):**
- **K1, DL's tokens only** (`kit.css:940-970`):
  - the declarations use `var(--av-touch-min)` and `var(--av-phone-body)`, both in `apps/web/src/styles/tokens.css` (lines 488 and 428) with DL's values;
  - the only px literal in a declaration is the `899px` breakpoint, which is section 5's phone width. The other px matches in ZERO-02's grep are in comments;
  - `50%`, `-50%` and `100%` only centre the hit area. They're not colours, sizes, radii or durations, so section 0's value rule allows them.
- **K1, every Button at least 44px:** `[data-ui="Button"][data-variant]` has specificity (0,2,0), the same as the link variant's `min-height: 24px` rule (`kit.css:316-319`), and it comes later in the file, so it wins. Every Button sets `data-variant` (`Button.tsx:38,58`), D9's anchor included. Measured at 390px: Approve, Reject, `Open on GitHub`, `Review new version`, `Refresh list`, Retry (WidgetState and ErrorPanel), and the dialog's Cancel and confirm are all 44px tall. Before, they were 28 to 38px.
- **K1, tap areas without taller rows:** `.av-hash-copy::after` and `.av-icon-close::after` (`kit.css:949-964`). At 390px and 899px, a tap 21px from the centre hits the button 4 of 4 times for:
  - the copy button in DecisionTag `seen` (countdown), `stale` and `notAllowed`, in WidgetState `error` and in ErrorPanel;
  - the dialog's Close and its request-ID copy button.

  Before a3, each scored 0 of 4. The drawn sizes stay 24x24 and 32x32. Close's area clears `.av-dialog`'s `overflow: hidden`, with 6px to spare on each side.
- **K1, no taps taken from other controls:** I sampled every Button's box on a grid. The number of points that land outside the Button is the same with the old and new `kit.css` (390px: 2, 2, 4, 2, 2, 2, 2, 3, 2, 2, 2 on the page, and 4, 4 in the dialog). Those points are the rounded corners. So no `::after` covers a Button, including the countdown chip under D11's phone grid.
- **K1, phone width only:** at 900px and 1280px, every element's box under `#root` and the dialog is identical with the old and new `kit.css` (`layout identical: true`, page and dialog), and every hit test scores 0 of 4 again.
- **K1/R6, textarea:** `font-size` is 16px at 390px and 899px, and 14px at 900px and over.
- **R5** (`Dialog.tsx:84,103,112-114`):
  - with a description, `aria-describedby` points at the `<p>` that reads "Say why, for the record.";
  - with none, there's no attribute and no `<p>`;
  - ReasonDialog passes `description` only when it's given (`ReasonDialog.tsx:66`).
- **Territory:** besides the two kit files, only Fantem's own completion report changed (his to write).

**How I measured.** In a scratch directory (thrown away), I bundled the real `DecisionTag`, `WidgetState`, `ErrorPanel` and `ReasonDialog` with esbuild. The page loaded the built `app.css` and either `kit.css` or the `a9c5cf9^1` `kit.css`. I ran Playwright Chromium 1.65 at 390, 899, 900 and 1280px wide, 2400px tall so every target is in view, and tested hits with `document.elementFromPoint`.

## Deviations
- **The diff range:** `git merge-base main HEAD` is HEAD (b97076e), because a9c5cf9 is already merged on main, so the default diff is empty. As INT said, I reviewed `git diff a9c5cf9^1 a9c5cf9` and ran ZERO-02's verify on that range. On the default range, ZERO-02's verify prints an empty stat and no px lines.
- **ZERO-02's "only apps/web/src/kit files changed":** the merge also carries Fantem's completion report, the report his task requires. No code outside `apps/web/src/kit/**` changed.
- **This report replaces my a2 report at the same path.** The a2 version stays in history (e4df28f).

## Limitations
- On main, no page links `kitStylesheetHref` yet (Leon's decisions module isn't merged), so I measured the components in a harness, not on `/`. Leah's a11y-perf a2 re-review measures the real page.
- As Fantem's report says, the copy button's hit area reaches 10px past the chip. Nothing in the kit is that close today (measured above). A later screen that puts a control right beside a chip should be checked for overlap.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT:** `pnpm --filter @avel/web test` exits 1: 37 tests in 4 files fail, all under `test/modules/decisions/**` ("apps/web/src/modules/decisions/screens.ts should export the screen…"), until Leon's module is merged. `test/data` and `test/kit` pass: 10 files, 153 tests.
- **Leah (a11y-perf a2):** K1 and R5 hold on the components at 390px and 899px. The checks to repeat on `/` are the ±21px hit test and the before-and-after layout comparison at 900px.

## Files changed
```
$ git diff --name-only main...HEAD
docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-kit-review-frontend-completion.md
```

## Verification
```
$ pnpm --filter "@avel/web..." build
packages/contract build$ tsc -p tsconfig.json
apps/web build$ vite build
apps/web build: dist/client/assets/app-CCOL2GSK.css                   31.88 kB │ gzip:   6.94 kB
apps/web build: dist/client/assets/index-SlPnXw7v.js                 496.83 kB │ gzip: 155.40 kB
apps/web build: ✓ built in 885ms
apps/web build: dist/server/assets/empty-plugin-adapters-BsRz-CQL.js         0.26 kB │ gzip:  0.17 kB
apps/web build: dist/server/assets/start-CX3T2L7y.js                         0.27 kB │ gzip:  0.19 kB
apps/web build: dist/server/assets/_tanstack-start-manifest_v-CcSTAuoK.js    0.40 kB │ gzip:  0.29 kB
apps/web build: dist/server/assets/router-Dvq-asiP.js                       27.35 kB │ gzip:  9.27 kB
apps/web build: dist/server/server.js                                      261.19 kB │ gzip: 63.18 kB
apps/web build: ✓ built in 636ms
exit=0

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
Scope: 3 of 6 workspace projects
packages/contract typecheck$ tsc -p tsconfig.json --noEmit
packages/contract typecheck: Done
packages/contract-mock typecheck$ tsc -p tsconfig.json --noEmit
packages/contract-mock typecheck: Done
apps/web typecheck$ node -e "import('vite').then((vite) => vite.resolveConfig({}, 'build'))" && tsc -p tsconfig.json
apps/web typecheck: Done
exit=0

$ pnpm lint
> biome check .

Checked 198 files in 195ms. No fixes applied.
exit=0

$ pnpm --filter @avel/web test   (summary; failures grouped)
 Test Files  4 failed | 10 passed (14)
      Tests  37 failed | 153 passed (190)
 failing files: test/modules/decisions/{contract-version,deciding,errors,list}.test.tsx
 cause: "apps/web/src/modules/decisions/screens.ts should export the screen as DecisionsScreen" (Leon not merged)
exit=1

$ pnpm --filter @avel/web exec vitest run test/data test/kit
 Test Files  10 passed (10)
      Tests  153 passed (153)
exit=0

$ (ZERO-01) pnpm --filter @avel/web exec vitest run test/kit && ! grep -rn '@orpc\|@tanstack/react-router\|#[0-9a-fA-F]\{6\}' apps/web/src/kit
 Test Files  3 passed (3)
      Tests  68 passed (68)
(grep lists nothing) exit=0

$ (ZERO-02, on a9c5cf9^1..a9c5cf9) git diff ... -- apps/web/src/kit/kit.css | grep '^+' | grep -nE '[0-9]+px'
6:+   only: --av-touch-min (44px) and --av-phone-body (16px). At 900px and over nothing changes. ---- */
7:+@media (max-width: 899px) {
8:+  /* Every Button (an anchor in the Button's look, D9's link, included) is at least 44px tall.
15:+     area, centred on each and at least 44px square, takes the tap, so no row or chip gets taller. */
33:+  /* R6: the reason field is 16px, so iOS doesn't zoom on focus. */
(lines 6, 8, 15, 33 are comments; line 7 is the 899px breakpoint)
$ git diff a9c5cf9^1 a9c5cf9 --stat
 apps/web/src/kit/Dialog.tsx                        |  10 +-
 apps/web/src/kit/kit.css                           |  36 +++
 .../agent-fantem-w0-kit-build-completion.md        | 248 ++++++++++-----------
 3 files changed, 159 insertions(+), 135 deletions(-)

$ git diff --name-only main...HEAD
docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-kit-review-frontend-completion.md
```
