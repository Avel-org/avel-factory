# ZERO: w0-kit review-frontend, completion report

verdict: PASS

## Summary
Attempt a4 reviews Fantem's w0-kit a4 (code 2efe1a1 and fff7a3e, report 82d4c2b, base b1932d9). It covers D11 as a `kit.css` rule, R7's `loadReasonDialog` and D15, and all three meet UI contract section 4 (revision 11). I measured D11 in Chromium:
- the server's desk HTML under 900px is D11's grid, with Reject on the left;
- the desk row is pixel-identical to the base's at 900px and 1280px;
- the phone layout is unchanged.

Two findings are open, both P2, and neither is a defect in the kit, so neither blocks the merge:
- **03:** R7's split can't hold while the static export stays. The kit did what R7 says to do in that case (export kept, stop and report), and INT needs to decide.
- **04:** UC-31 is red on its own timing. It reads the confirm button during DL's dialog open animation.

## Pre-flight
- Part 2 files, all read (none missing):
  - `.claude/agents/zero.md`
  - `codebase-analysis.md`
  - `docs/ui-contracts/decisions-approval-page.md` (revision 11 at this commit): sections 0 and 4 in full, and section 5's "Styles and loading" and phone width
  - `CR-W2 Pending decisions.md`: skimmed; nothing in it touches D11, D15 or R7 beyond 2.1's `factory_change` row having no facts
  - `decisions.md`: skimmed for Revisions 10 and 11
  - Frontend Map v0.6: skimmed
  - the design library: its `.pd-actions` rules, including the phone grid `display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); … gap: 10px;` with the `order` swap, and `av-dialog-in`
  - `Step 0 and Step 1 plan.md`: skimmed
  - this task doc
  - The Read first files `API and data reference.md` and `CR-16 Dispatch package contract.md` exist; I skimmed them, and neither touches this diff.
- Branch: `frontend/sprint-01/agent-zero-w0-kit-review-frontend-a4`, at start commit 82d4c2b (`AVEL_BASE` = b1932d9).
- Main is at b5684fb, which carries contract revision 12. I judged against revision 11, the contract at this commit, as Part 6 says.
- Part 7 commands: all available, after `pnpm install --frozen-lockfile --prefer-offline` (the new worktree had no `node_modules`).

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZERO-01 | DONE | this report's commit |
| ZERO-02 | DONE | this report's commit |
| ZERO-03 | DONE | this report's commit |

## Findings
- `docs/agent-dispatch/frontend/sprint-01/findings/w0-kit-zero-03-r7-split-fails-with-static-export.md`: P2. R7's split condition can't hold while `kit/index.ts` keeps the static `ReasonDialog` export: with the page on `loadReasonDialog`, the dialog moves into `/`'s first load.
- `docs/agent-dispatch/frontend/sprint-01/findings/w0-kit-zero-04-uc31-reads-confirm-during-dialog-animation.md`: P2. UC-31 reads the dialog's confirm button during DL's `av-dialog-in` scale, so it measures 43.5 to 43.9px, not 44px.
- Earlier findings 01 and 02 are still `fixed (56a079b)`, and a4 doesn't touch them.

## Contract to files
The diff is `git diff b1932d9..82d4c2b`: `DecisionTag.tsx` (+33 −24), `index.ts` (+10), `kit.css` (+30), and Fantem's own report.

**ZERO-01 (the kit against section 4):**
- `vitest run test/kit`: 3 files, 74 tests, all passed.
- The grep for `@orpc`, `@tanstack/react-router` and six-digit hex colours under `apps/web/src/kit` lists nothing.
- a4 adds:
  - no props, copy or `data-ui` names;
  - one class, `av-dt-pair`, the name D11 gives it;
  - one export, `loadReasonDialog`, the name R7 gives it.

**ZERO-02 (K1 and R5, still held):**
- The only px literal a4's `kit.css` adds is `gap: 10px` (twice), which is DL's `.pd-actions` gap. The other `px` matches the grep lists are comments.
- No new breakpoint: the desk rule sits in K1's existing `@media (max-width: 899px)` block.
- K1's 44px still holds: every button in the measurements below is 44px under 900px.

**ZERO-03 (D11, R7, D15):**
- **D11, both layouts** (`DecisionTag.tsx:197` phone and `:213` desk): Approve and Reject share one `div.av-dt-pair` only when both are drawn, and a single button is drawn bare. The inline grid is gone (`grep gridTemplateColumns` lists nothing).
- **D11, the CSS** (`kit.css:915-922` and `:981-994`):
  - `[data-layout="phone"]` always gets the grid, with DL's values `minmax(0, 1fr) minmax(0, 1.4fr)` and a 10px gap.
  - `[data-layout="desk"]` gets `display: contents` at 900px and over.
  - Under 899px, `[data-layout="desk"]` gets the same grid at `flex: 1 1 100%`, and `grid-column` places the first child (Approve) right and the last (Reject) left. DL swaps them with `order`. The placement is the same, and it adds no new value.
- **D11, the DOM order:** desk is Approve then Reject, and phone is Reject then Approve. Both match the contract.
- **D11, measured.** I ran a scratch Playwright script against `vite dev` with `AVEL_API=mock`. The no-JS rows are the server HTML. The base rows come from a scratch copy of b1932d9 measured the same way.

  | Width | Commit | `.av-dt-pair` | Buttons (x, w, h) |
  | --- | --- | --- | --- |
  | 390, no JS | HEAD | grid 131.66px / 184.33px, gap 10px | Reject 32, 131.66, 44; Approve 173.66, 184.33, 44 (ratio 1.40) |
  | 899, no JS | HEAD | grid, gap 10px | Reject left, Approve right, 44 tall |
  | 900, no JS and hydrated | HEAD | `contents` | Approve 52, 77, 32; Reject 137, 75, 32 |
  | 900 | base | (no pair; flex row with an 8px gap) | Approve 52, 77, 32; Reject 137, 75, 32 |
  | 1280, hydrated | HEAD | `contents` | Approve 67.19, 77, 32; Reject 152.19, 75, 32 |
  | 1280 | base | | identical |
  | 390, hydrated (phone) | HEAD | grid 130px / 182px, gap 10px | identical to base |

  So the desk row is unchanged at 900px and over. Under 900px the server's desk HTML is D11 before hydration, which was decisions-zero-01's failure.
- **R7** (`index.ts:25-29`): `loadReasonDialog(): Promise<{ ReasonDialog: typeof ReasonDialog }>` is `import("./ReasonDialog")`, and the static export stays at `:19`, as R7 says.
  - The split doesn't hold once the page uses it. I measured it on a scratch copy: the dialog's chunk drops from 1.53 to 0.07 kB gzip, and `routes-*.js` grows from 15.83 to 16.73 kB.
  - R7 says to stop and report in this case, and Fantem did. That's finding 03, for INT.
- **D15** (`DecisionTag.tsx:320`): the `dl.av-dt-facts` is drawn only when `evidence || consequence`. Its contents and classes are byte-for-byte the old ones, so a card with a fact is unchanged. UC-08 D15 passes in the locked suite.

## Deviations
- ZERO-03's check expects only `apps/web/src/kit` files in the stat. The stat also lists `agent-fantem-w0-kit-build-completion.md`, the builder's own report, which is in its territory. Every code file the diff changes is under `apps/web/src/kit`.
- I installed dependencies in the worktree (`pnpm install --frozen-lockfile`) to run the checks. Nothing tracked changed.
- I built and ran dev servers on scratch copies under the session scratchpad, for R7's measurement and the base comparison. Nothing tracked changed.

## Limitations
- UC-31 is red until finding 04's override (the test's timing).
- R7's split is unresolved until INT decides (finding 03). On this commit the page still deep-imports, so the split holds as shipped.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT:**
  - Choose R7's resolution (finding 03: (a) the page keeps the deep import, (b) a chunking rule in Nemi's `vite.config.ts`, or (c) drop the static export under a UC-09 override).
  - Decide on an override for Fenn's UC-31 (finding 04).
- **Leon:** don't switch `DecisionsScreen.tsx` to `loadReasonDialog` until INT decides (finding 03).
- **Fenn:** if INT gives the override, UC-31 reads the confirm button after the dialog's animations finish, or under `reducedMotion: "reduce"` (finding 04).
- **Zero (contract):** write INT's R7 choice into section 4 R7 and section 5's "Styles and loading".

## Files changed
```
docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-kit-review-frontend-completion.md
docs/agent-dispatch/frontend/sprint-01/findings/w0-kit-zero-03-r7-split-fails-with-static-export.md
docs/agent-dispatch/frontend/sprint-01/findings/w0-kit-zero-04-uc31-reads-confirm-during-dialog-animation.md
```
`git diff --name-only main...HEAD` also lists the builder's commits, which this session is checked out on:
```
apps/web/src/kit/DecisionTag.tsx
apps/web/src/kit/index.ts
apps/web/src/kit/kit.css
docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build-completion.md
```

## Verification
```
$ pnpm --filter "@avel/web..." build
packages/contract build: Done
apps/web build: dist/client/assets/ReasonDialog-Br5xqR0N.js            3.50 kB │ gzip:   1.53 kB
apps/web build: dist/client/assets/routes-C8xPsqGx.js                 46.50 kB │ gzip:  15.83 kB
apps/web build: dist/client/assets/index-mQT-vRPr.js                 493.90 kB │ gzip: 154.71 kB
apps/web build: ✓ built in 1.55s
apps/web build: dist/server/server.js                                      261.21 kB │ gzip: 63.19 kB
apps/web build: Done

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done

$ pnpm lint
> biome check .
Checked 213 files in 532ms. No fixes applied.

$ pnpm --filter @avel/web test
 Test Files  14 passed (14)
      Tests  196 passed (196)

$ pnpm --filter @avel/web exec vitest run test/kit
 Test Files  3 passed (3)
      Tests  74 passed (74)

$ ! grep -rn '@orpc\|@tanstack/react-router\|#[0-9a-fA-F]\{6\}' apps/web/src/kit   # no line listed
$ ! grep -n 'gridTemplateColumns' apps/web/src/kit/DecisionTag.tsx                # no line listed

$ git diff b1932d9..HEAD -- apps/web/src/kit/kit.css | grep '^+' | grep -nE '[0-9]+px'
3:+   phone (.pd[data-phone] .pd-actions): two columns, Reject left, Approve right, 10px apart. With
4:+   layout="desk" it adds no box at 900px and over, so the row is DL's desk row; under 900px it's
9:+  gap: 10px;
15:+     so under 900px the desk row's .av-dt-pair is D11's grid, across the row's full width. Its DOM
20:+    gap: 10px;

$ (apps/web) pnpm exec playwright test            # not a Part 7 command; run for D11 and UC-31
  4 passed, 1 skipped (desk UC-31, phone only), 1 failed:
  ✘ [phone] UC-31 … the confirm button is at least 44px tall; Expected: >= 44, Received: 43.868408203125

$ git diff --name-only main...HEAD   # before this report's commit; see Files changed
apps/web/src/kit/DecisionTag.tsx
apps/web/src/kit/index.ts
apps/web/src/kit/kit.css
docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build-completion.md
```
