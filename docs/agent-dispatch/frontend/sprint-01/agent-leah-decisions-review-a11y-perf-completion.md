# LEAH: decisions review-a11y-perf, completion report (a2)

verdict: FAIL

## Summary
Reviewed Leon's decisions a2 (d480f0e, on b97076e, which already has Fantem's w0-kit a3 and Nemi's w0-split). Findings 02 and 03 are closed; 01 (first load) and 04 (Mono 500) are still open; three new ones: UC-31's grid (05), the empty rule on the Factory PR card (06), CLS 0.13 from the font swap (07). The budget that held at my start commit is **160 kB** (Ghost's w0-data a2 and Axis's S1-6 not merged); the first load is 171.7 kB (`gzip -9`) / 173.94 kB (Vite's figures), over it.

## Pre-flight
All Part 2 files read (the UI contract's sections 4, 5, 8 and UC-31, decisions.md "Revision 9" included). Branch `frontend/sprint-01/agent-leah-decisions-review-a11y-perf-a2`, start commit d480f0e. All five Part 7 commands available.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| LEAH-01 | DONE (over budget; findings 01, 05) | this report's commit |
| LEAH-02 | DONE (findings 04, 07) | this report's commit |

## Findings
- findings/decisions-leah-01-first-load-over-budget.md, P1, open: 171.7 to 173.9 kB against 160
- findings/decisions-leah-02-page-unstyled-targets-and-input-below-minimum.md, P1, closed (a2)
- findings/decisions-leah-03-e2e-click-before-hydration.md, P2, closed (a2)
- findings/decisions-leah-04-mono-500-preload-unused-on-first-paint.md, P2, open: HashChip draws Mono 400, the preload is 500
- findings/decisions-leah-05-uc31-grid-is-flex.md, P2, open (known)
- findings/decisions-leah-06-factory-pr-card-empty-facts-rule.md, P3, open (Fantem)
- findings/decisions-leah-07-cls-font-swap.md, P2, open: CLS 0.13, the font swap is the cause

## Contract to files
- UC-31 / section 5 / K1 / R5: `routes/index.tsx:15-17`, `screens.ts:16-19`, `kit.css:943-970`; measured 44px link, 16px textarea, `aria-describedby`, focus into the textarea.
- Section 8 budget: build output, finding 01.
- Section 6 fonts, LEAH-02: `__root.tsx:45-56`; findings 04, 07.

## Deviations
- Measurements ran on the dev server (mock), not a production build; CLS especially (finding 07 says so). Probe scripts were temporary and deleted.
- INT's two screenshot checks: (1) **Factory PR card's two rules**: reproduced; it is the kit's empty `<dl class="av-dt-facts">` (`DecisionTag.tsx:315`), finding 06, Fantem's, not Leon's. (2) **Phone dialog centred, a1 had a bottom sheet**: not a regression and not a defect. The dialog is 358x332 at y=256, from the kit's `.av-scrim` (`kit.css:12-24`, `align-items: center`, DL's Dialog; its Sheet rules are deliberately left out, `kit.css:10`). a1's "bottom sheet" was the unstyled dialog in document flow before the sheets were linked (a1 finding 02). The contract names no bottom sheet. If INT wants a sheet on phones it is a new kit change, not a fix.

## Limitations
Hydration time on a real phone and brotli sizes not measured. Findings 05 and 06 concern kit CSS, outside my territory.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- INT: S1-6 then Ghost's w0-data a2 (about 156.7 kB) clears 160, not 150. Finding 07 needs a decision (size-matched fallbacks) before the CLS budget can hold.
- Fantem: findings 04, 05, 06 (all kit.css / DecisionTag / HashChip).
- Leon: none open on his territory.

## Files changed
```
$ git diff --name-only main...HEAD
apps/web/src/modules/decisions/{api.ts,decisions.css,decisions.ts,index.ts,screens.ts,screens/DecisionsScreen.tsx}
apps/web/src/routes/index.tsx
docs/agent-dispatch/frontend/sprint-01/agent-leon-decisions-build-completion.md   (Leon's, carried in)
```
Mine, added by this commit: this report and findings/decisions-leah-01 to 07.

## Verification
```
$ pnpm --filter "@avel/web..." build            # exit 0
index-DimhTn_r.js 154.68 kB gzip, jsx-runtime 3.39, routes 15.87, ReasonDialog 1.52 (lazy)
$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck   # Done
$ pnpm lint                                     # Checked 205 files, no fixes
$ pnpm --filter @avel/web test                  # 14 files, 190 tests passed
$ pnpm --filter @avel/web exec playwright test
  1 failed ([phone] UC-31: Expected "grid", Received "flex", decisions.spec.ts:125), 1 skipped, 4 passed
$ grep -n -A4 'rel: "preload"' apps/web/src/routes/__root.tsx   # two blocks: lines 45 (Inter) and 52 (Plex Mono 500)
```
