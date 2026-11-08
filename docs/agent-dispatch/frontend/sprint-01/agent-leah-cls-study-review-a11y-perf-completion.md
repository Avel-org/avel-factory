# LEAH: cls-study review-a11y-perf, completion report

verdict: PASS

## Summary
Both tasks are done. CLS on `/` at 390x844 is 0.13 on main and on d8bc228 alike, so INT's guess (the old inline D11 grid) is **not confirmed**. The cause is the desk-to-phone layout switch at hydration (`useIsPhone`'s server snapshot is `false`), not the fonts. The font swap alone is 0.0008 (prod) to 0.006 (dev); Nemi's formula fallbacks raise it to 0.0185 / 0.0412; the same rules with one average-width method (107.50%) bring it to 0.0001 / 0.0000. I recommend: change the formula, keep the fallbacks, and fix the 0.13 elsewhere (finding 01).

## Pre-flight
- Part 2: all read (`.claude/agents/leah.md`, `codebase-analysis.md`, the UI contract in full for sections 4 D11/K1, 5's marker, 6, 8, `CR-W2` / FM v0.6 performance budgets (lines 280-305), `decisions.md` Revisions 11, 13, 14, Step 0/1 plan and the design library skimmed (nothing touches this study), `decisions-leah-07`, Nemi's report via `git show 708acc6:...`). None missing.
- Branch `frontend/sprint-01/agent-leah-cls-study-review-a11y-perf-a2`, start commit 9bc22af (main).
- Part 7 commands: all available.
- Cases: main 9bc22af, d8bc228, main + ac820a7 (cherry-picked), and that plus the sans overrides changed. Four scratch worktrees under my scratchpad, removed at the end.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| LEAH-01 | DONE | this report's commit |
| LEAH-02 | DONE | this report's commit |

## Method
Section 6's measure: Chromium 390x844, `isMobile` + `hasTouch`, a `layout-shift` observer from `addInitScript`, summed over 3 s after `[data-ui="DecisionsPage"][data-hydrated="true"]`, one warm-up load then three recorded runs, a new context per run. Each shift is recorded with its time and `sources` (node, previous and current rect). Faces from CDP `CSS.getPlatformFontsForNode` on `h3.av-dt-title` (sans) and the commit-chip value span (mono). Fonts: normal; all `woff2` aborted; each `woff2` held 1.2 s with `page.route`. Dev: Vite dev, `AVEL_API=mock`. Prod: `dist/server/server.js` plus `dist/client` statics with the contract mock on `/api`, served by a throwaway Node server (a first-load figure was not needed here). A scratch `FONTCONFIG_FILE` exposes Windows `arial.ttf` and `cour.ttf` to Chromium, for every run; nothing on the system changed. I also ran a 4x CPU throttle (CDP `Emulation.setCPUThrottlingRate`) on prod with fonts delayed, because of finding 05. All CLS sums include entries flagged `hadRecentInput`, which Chromium sets on the hydration shift under touch emulation although no input was sent (`*` below); without them the normal-font rows would read 0.

## LEAH-01: CLS table (three runs each, identical across runs unless shown)
| Commit | Server | Fonts | CLS | Shifts (time) |
| --- | --- | --- | --- | --- |
| main | prod | normal | 0.1317 / 0.1320 / 0.1320 | 1 x 0.132* at 92-108 ms |
| main | prod | aborted | 0.1291 x3 | 1 x 0.1291* at 84-140 ms |
| main | prod | delayed | 0.0008 x3 | swap at 1225-1243 ms |
| main | dev | normal | 0.1320 x3 | 0.132* at 379-516 ms |
| main | dev | aborted | not measured: never hydrated, see Limitations | |
| main | dev | delayed | 0.1380 x3 | swap 0.0060 at ~1.23 s; 0.1320 at 1527-1559 ms (hydration) |
| d8bc228 | prod | normal | 0.1309 x3 | 0.1309* at 97-109 ms |
| d8bc228 | prod | aborted | 0.1281 x3 | 0.1281* at 98-119 ms |
| d8bc228 | prod | delayed | 0.0008 x3 | swap at 1230-1252 ms |
| d8bc228 | dev | normal | 0.1309 x3 | 0.1309* at 378-479 ms |
| d8bc228 | dev | aborted | not measured (as main) | |
| d8bc228 | dev | delayed | 0.1369 x3 | swap 0.0059; 0.1309 at ~1.54 s |
| main | prod, CPU 4x | normal | 0.132 x3 | 0.132* at 349-363 ms |
| main | prod, CPU 4x | delayed | 0.1296 x3 | 0.1288* at 365-393 ms; swap 0.0008 |

Sources of the 0.13 (main, prod): the first `DecisionTag`'s `dl.av-dt-facts`, `div.av-dt-foot` and both buttons, the second article, `h3.av-dt-title` (moves down 26 px); full list in finding 01. Comparing every element's rect and style in the first card, server HTML (JS off) against hydrated: padding 16 -> 18 px, the head row wraps (22 -> 48 px), the facts grid goes from two columns to one. That is the `layout` prop switching `desk` -> `phone`.

INT's guess: **not confirmed.** d8bc228 and main differ by 0.001 (0.1309 vs 0.1320 on prod, normal fonts). Moving D11 to `kit.css` did not remove the shift, because D11 covers only the buttons.

## LEAH-02: the fallbacks (swap shift only; the 0.132 hydration shift sits on top of every normal-font and every 4x row)
| Version | prod, delayed | prod, 4x, delayed (swap) | dev, delayed (swap) | Faces before the swap |
| --- | --- | --- | --- | --- |
| main | 0.0008 x3 | 0.0008 x3 | 0.0060 x3 | DejaVu Sans, DejaVu Sans Mono (system) |
| main + ac820a7 (138.27%) | **0.0185 x3** | 0.0185 x3 | **0.0412 x3** | Arial, Courier New (the `local()` source) |
| main + one method (107.50%) | **0.0001 x3** | 0.0001 x3 | **0.0000 x3** | Arial, Courier New |

Fonts normal: 0.132 on all three versions, prod and dev (no swap; the hydration shift).

The one-method values: v3 weighted a-to-z-and-space average on both files, from glyph advances read through Chromium at 2048 px: Inter 972.28, Arial 904.46 (Arial's stored v3 value is 904, so the method checks). `size-adjust` 107.50%; `ascent-override` 1984/2048 / 1.07498 = 90.12%; `descent-override` 494/2048 / 1.07498 = 22.44%; `line-gap-override` 0.00%. The mono rule needed no change: its pair already uses the advance of `0` for both files.

**Recommendation for section 6: change the formula to one method for both files and keep the fallbacks** (finding 04). They take the swap shift to about 0 where the local faces exist. They don't bring `/` under 0.02: the hydration shift (finding 01) does, and that is the fix to build. Section 6's measure should also add the 4x throttle (finding 05).

## Findings
- `docs/agent-dispatch/frontend/sprint-01/findings/cls-study-leah-01-desk-to-phone-switch-at-hydration.md`: P1, the 0.13 is the desk-to-phone layout switch at hydration; INT's D11 guess not confirmed
- `docs/agent-dispatch/frontend/sprint-01/findings/cls-study-leah-02-font-swap-is-small-without-fallbacks.md`: P3, the swap alone is 0.0008 (prod) to 0.006 (dev)
- `docs/agent-dispatch/frontend/sprint-01/findings/cls-study-leah-03-nemi-formula-fallbacks-raise-the-swap-shift.md`: P2, the formula's fallbacks raise the swap shift to 0.0185 / 0.0412 (v4/v3 mix, 138.27%)
- `docs/agent-dispatch/frontend/sprint-01/findings/cls-study-leah-04-one-method-fallbacks-and-recommendation.md`: P2, one method (107.50%) takes it to about 0; recommendation
- `docs/agent-dispatch/frontend/sprint-01/findings/cls-study-leah-05-measure-passes-by-race.md`: P2, section 6's measure can pass while a phone shifts 0.13 (first paint held past hydration)

## Contract to files
- Section 6 "The size-matched fallbacks" and "The measure": findings 02 to 05.
- Section 8 (CLS under 0.02) and FM v0.6 line 281: finding 01.
- Section 4 D11 and INT's guess: finding 01 and the LEAH-01 table.

## Deviations
1. I summed every layout-shift entry, including `hadRecentInput` ones (the flag is set on the hydration shift under touch emulation with no input). The task's method doesn't say; decisions-leah-07 and Nemi did the same. Each run also stores the sum without flagged entries.
2. I added a 4x CPU throttle series and FCP / hydration times. Not asked; it explains why delayed fonts hide the shift (finding 05).
3. Fonts-aborted on the dev server was not measured (Limitations).
4. Prod was served by my own Node server, since the size study's harness is in another session's scratchpad.

## Limitations
- **Dev, fonts aborted:** both commits never reached `data-hydrated="true"` (60 s timeout) in my harness with `**/*.woff2` aborted. I didn't find out why; prod aborted works. Those two cells are empty.
- **Liberation Sans and Liberation Mono are not installed** here. The fallbacks were measured with Windows Arial and Courier New through the fontconfig trick; Liberation's `xAvgCharWidth` is unchecked. Only regular weights were exposed, so bold is synthesized (same in both versions).
- Machines with neither Arial nor Liberation (Android) skip the fallback and get the main rows.
- Prod is a Node server on one machine, no compression, no network. The 4x throttle is an approximation of a phone, not a device.
- `hadRecentInput` flagged on the hydration shift is a Chromium touch-emulation effect I observed but did not root-cause.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT:** (1) Don't merge ac820a7 as it is (finding 03). (2) Decide the formula change (finding 04); Nemi then edits three sans values. (3) The 0.13 on `/` needs a build task: make the server HTML the phone layout on a phone, by extending the `@media (max-width: 899px)` approach D11 used to the other `[data-layout="phone"]` rules (finding 01). Owner Fantem (kit.css), with Leon's `useIsPhone`; a section 4 change for Zero. (4) Section 6's measure and section 8's check: add the 4x throttle and record FCP and hydration (finding 05).
- **Zero:** section 6's formula text and the Held paragraph; decisions-leah-07's "aborted: 0" is superseded by finding 02.
- **Nemi:** nothing until INT decides.

## Files changed
```
docs/agent-dispatch/frontend/sprint-01/agent-leah-cls-study-review-a11y-perf-completion.md
docs/agent-dispatch/frontend/sprint-01/findings/cls-study-leah-01-desk-to-phone-switch-at-hydration.md
docs/agent-dispatch/frontend/sprint-01/findings/cls-study-leah-02-font-swap-is-small-without-fallbacks.md
docs/agent-dispatch/frontend/sprint-01/findings/cls-study-leah-03-nemi-formula-fallbacks-raise-the-swap-shift.md
docs/agent-dispatch/frontend/sprint-01/findings/cls-study-leah-04-one-method-fallbacks-and-recommendation.md
docs/agent-dispatch/frontend/sprint-01/findings/cls-study-leah-05-measure-passes-by-race.md
```
(`git diff --name-only main...HEAD` is empty before the commit; these are the paths the commit adds, all from Part 5.)

## Verification
```
$ pnpm --filter "@avel/web..." build
apps/web build: dist/server/server.js   261.21 kB │ gzip: 63.19 kB
apps/web build: ✓ built in 163ms
apps/web build: Done
exit 0

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
packages/contract-mock typecheck: Done
apps/web typecheck: Done

$ pnpm lint
> biome check .
Checked 213 files in 167ms. No fixes applied.

$ pnpm --filter @avel/web test
 Test Files  14 passed (14)
      Tests  197 passed (197)

$ git diff --name-only main...HEAD   # run before the commit
(empty; the commit adds only the six paths under Files changed)
```
