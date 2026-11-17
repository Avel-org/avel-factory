# BRENNAN: shell-uic review-spec, completion report

verdict: FAIL

## Summary
I reviewed `docs/ui-contracts/app-shell.md` revision 1 and the approval page contract's revision 15, as at 04fac4b, against the Frontend Map v0.6, the design library's bundled source, and the approval page contract. The verdict is FAIL, on one P1, five P2s and one P3.
- **The P1:** the contract takes `main`'s padding and `ScreenHeader`'s values from DL's v1.6 layer, but two later DL layers ("Mobile chrome" and "v1.7.1") override them. So what the contract specifies isn't what DL draws.
- **The P2s:**
  - S7's reason misreads DL's planned entries;
  - the stub route files aren't recorded as a departure from FM's ownership, and the files aren't named;
  - section 6's conditional cut spans two territories;
  - D16's check has no scenario ID;
  - sections 4 and 5 have no scenarios.

Most of the contract checks out against DL and FM:
- the nav's labels, order and `what` lines; the aria labels; the badge label; the tab icons; the breakpoints; `--rail-w`; the brand mark; the sheet's attributes;
- the font values (finding 04 of cls-study);
- the deferral waves.

## Pre-flight
- **Part 2 files, all read:**
  1. `.claude/agents/brennan.md`
  2. `codebase-analysis.md`
  3. `app-shell.md`
  4. `decisions-approval-page.md`
  5. sprint-02 `decisions.md`
  6. Frontend Map v0.6
  7. The design library v1.1 HTML (its CSS block, lines 9 to 2816, and the bundled script's rail, top bar, tab bar, sheet, `mw` and `pm`)
  8. `app-shell.md`, whole
  9. Revision 15, by `git diff 8317120 3b4a7c0 -- docs/ui-contracts/decisions-approval-page.md`, and the header lines after it (`git diff 3b4a7c0 04fac4b`)
  10. Sprint-02 `decisions.md`
  11. Sprint-01 `decisions.md`: "Revision 15", "Sprint-01 closes with option (c)" and "Further cuts"
  12. `cls-study-leah-01`
  13. `cls-study-leah-04`
  14. This task doc
- **The Read first design docs** I didn't need: `Backend modules and build plan.md`, `Roster setup and sessions.md`, `API and data reference.md` and `DATABASE.md` exist. This review touches no backend route, table or roster rule, so I didn't open them beyond confirming they're present.
- **The branch:** `frontend/sprint-02/agent-brennan-shell-uic-review-spec-a1`. It starts at 04fac4b (`AVEL_BASE`), which is also `HEAD` at the start: the work is two files on main, not a diff.
- **The Part 7 commands:** all available, after `pnpm install --frozen-lockfile`, since the worktree had no `node_modules`. The install changed no tracked file.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| BRENNAN-01 | DONE (findings 01, 02; part of 07) | 8491d98 |
| BRENNAN-02 | DONE (findings 03, 04) | 8491d98 |
| BRENNAN-03 | DONE (findings 04, 05, 06; part of 07) | 8491d98 |

**BRENNAN-01's verify:**

```text
$ grep -o 'mw=\[{area:"Decide"' 'docs/design/AVEL Enclosure Grid · Design library v1.1.html' && grep -c 'lib-tabbar\|lib-sheet\|lib-nav-badge' 'docs/design/AVEL Enclosure Grid · Design library v1.1.html'
mw=[{area:"Decide"
14
```

**What I checked against DL, and found to be DL's:**
- **The nav:** the `mw` areas, labels, order and `what` strings in section 3's table and the onboarding stub; `Onboarding with Canon` (`pm`, id `canon`); the icons `inbox` and `wallet` (`pm`).
- **The tab bar:** `nav "Main"`; Decisions `inbox` and Project `list-checks`, icons at size 20; More with `menu`.
- **The top bar:** `Open navigation` with `aria-expanded` and a size-18 `menu` icon; `nav "Breadcrumb"`, with `aria-current` and `data-last` on the last crumb.
- **The sheet:** `role="dialog"`, `aria-modal="true"`, `aria-label="Navigation"`, and `inert` while it's closed; `Close navigation` with `x`; scrim and sheet at `display: none` from 1024px, except in focus mode.
- **The rail:** `nav "Screens"`; the badge's `aria-label` `{n} waiting`; the brand mark's SVG; `Control room v1.8` (S1).
- **Skip link and main:** `Skip to content` focusing `main#main`, with `tabIndex -1`.
- **Layout values:** `--rail-w: 264px`; `max-width: 1023px` and `max-width: 760px`; `.lib-nav-item` at 34px and `.lib-icon-btn` at 36px; the tab bar's `repeat(4, 1fr)` (S8); focus mode's selectors (S2); `.lib-nav-indicator` measured in a layout effect (S3).
- **Icons:** `inbox`, `wallet`, `circle`, `list-checks` and `x` are in `Icon.tsx`; `menu` is new.

**BRENNAN-02's verify:** `grep -n '^| `/' 'docs/design/AVEL Web App — Frontend Map v0.6.md' | head -40` lists FM:159 to FM:186. Section 3's eleven routes are all in it, and `/library/skills` is an instance of `/library/$kind`. Each "Comes with" wave matches the owning module's wave in FM's build order:
- `missions` and `events`: W2;
- `onboarding`: W4;
- `metering`, `clients`, `knowledge`, `roster`, `audit` and `system`: W5.

Section 0's waves all exist in FM:452 to FM:457: W1, W2, W4, W5 and W6, plus "never". The auth shell is in FM's W0 (FM:451). The contract moves it to W5 and W6, with a reason sprint-01 already took (the approval page contract, section 0). I don't count that as a finding.

**BRENNAN-03's verify:** `grep -c '^| SH-' docs/ui-contracts/app-shell.md` gives `16`. Finding 06 traces each row to its section.

On revision 15 with the shell:
- **D16 and `layout="desk"`:** consistent with section 1. The shell's 760px and 1023px breakpoints and the page's 899px apply independently, and section 1 says so.
- **The marker rule:** consistent with the shell's own marker (section 2) and SH-24.
- **UC-32:** unchanged by the shell.

The gaps are D16's untested check (05) and SH-24's element list (07, item 5).

## Findings
- `docs/agent-dispatch/frontend/sprint-02/findings/shell-uic-brennan-01-v16-values-overridden-by-later-dl-layers.md`: P1. The v1.6 values the contract takes are overridden by DL's later layers, so `main`'s padding and the screen header aren't what DL draws.
- `docs/agent-dispatch/frontend/sprint-02/findings/shell-uic-brennan-02-s7-misreads-dl-planned-entries.md`: P2. S7 misstates DL's planned entries (a dot and `planned`, not the `circle` fallback). DL's `Preview` area and `.lib-route` aren't listed.
- `docs/agent-dispatch/frontend/sprint-02/findings/shell-uic-brennan-03-stub-route-files-ownership-and-names.md`: P2. The stub routes are route files for screens other modules own, with no departure recorded, no handover rule and no file names. `missions.tsx` would nest `/missions/new`.
- `docs/agent-dispatch/frontend/sprint-02/findings/shell-uic-brennan-04-budget-cut-spans-two-territories.md`: P2. Section 6's thin-link cut has these problems:
  - it spans `data/**` and `modules/decisions/**`, and possibly `system`;
  - it doesn't name FM's data-layer departure;
  - its −7.7 kB is from the pre-set-A baseline;
  - it has no "still over" rule;
  - who reports `/`'s first load is inconsistent.
- `docs/agent-dispatch/frontend/sprint-02/findings/shell-uic-brennan-05-d16-check-has-no-scenario.md`: P2. D16's check has no scenario ID. UC-32 passes without D16.
- `docs/agent-dispatch/frontend/sprint-02/findings/shell-uic-brennan-06-sections-4-and-5-have-no-scenarios.md`: P2. SH-01 to SH-24 leave sections 4 and 5, and some lines of sections 1 and 2, without a scenario.
- `docs/agent-dispatch/frontend/sprint-02/findings/shell-uic-brennan-07-small-contradictions-and-gaps.md`: P3. Five small gaps:
  - `/`'s head "unchanged" against the title rule;
  - "a builder Leon names";
  - the onboarding stub's icon;
  - focus mode's 120px padding;
  - SH-24 comparing elements that aren't drawn.

## Contract to files
| Item | Checked in | Result |
| --- | --- | --- |
| Section 0, scope and deferrals | FM Build order (FM:451-457), DL's rail script | Waves exist. Missing: DL's `Preview` area (02) |
| Section 1, frame, widths, focus mode, K1 | DL CSS lines 1402-1413, 2104, 2141-2148, 2518-2531, 2543-2560, 2726 | Breakpoints and `--rail-w` match. `main`'s top padding is v1.6, not DL's last (01). Focus mode's bottom padding (07) |
| Section 2, `AppShell` | DL script: rail `T`/`w`/`$`, the top bar, the tab bar, the app frame | Matches, apart from S7's reason (02) |
| Section 2, `ScreenHeader` | DL CSS lines 1642-1645, 2000-2012, 2545-2560 | v1.6 values superseded (01) |
| Section 2, S1 to S8 | DL script and CSS | S1, S2, S3, S4, S5, S6 and S8 hold. S7's reason is wrong (02) |
| Section 3, routes, nav, stubs | FM Routes (FM:159-186), FM Territories (FM:437, 447), DL `mw`/`pm` | Labels and waves match. Ownership and file names (03). Title (07) |
| Section 4, page on the shell | The approval page contract §5, `apps/web/src/routes/index.tsx`, `modules/decisions/decisions.css` | Consistent. Builder wording (07). No scenarios (06) |
| Section 5, fonts | cls-study-leah-04 | Values match (107.50, 90.12, 22.44, 0.00; mono unchanged). No scenario (06) |
| Section 6, budget and CLS | Sprint-01 decisions "Further cuts", size-study-leah-03, FM:30, 192, 447 | Cut ambiguous (04) |
| Section 7, SH-01 to SH-24 | The trace in finding 06 | 16 rows. Gaps in 05, 06 and 07 |
| Revision 15 (D16, `layout="desk"`, marker, UC-32, 4x measure) | `git diff 8317120 3b4a7c0` | Consistent with the shell. D16's check is untested (05) |

## Deviations
- **The dependency install:** I ran `pnpm install --frozen-lockfile` before Part 7's commands, because the worktree had no `node_modules`. No tracked file changed.
- **No Read first design docs beyond presence:** I didn't read the four backend and data design docs beyond confirming they exist, because nothing in this review touches them.

## Limitations
- **What I didn't render:** I read DL's CSS and script as text. I didn't render the library in a browser, so "what DL draws" in finding 01 rests on cascade order within its single `<style>` block, not on a computed-style probe.
- **What Liberation would give:** I didn't re-measure the font values. Section 5 matches cls-study-leah-04 as written. Leah's own caveat stands: she measured with Arial and Courier New, not Liberation.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Zero:** a revision 2 of `app-shell.md` answering findings 01 to 07. Finding 05 touches the approval page contract's section 7 (or app-shell section 7).
- **INT:**
  - finding 04 needs the budget call `decisions.md:40` leaves open: what follows if the thin link isn't enough, and whether sprint-02 can close over budget;
  - finding 01: whether the shell follows DL's v1.7.1 header values, which also changes how `/`'s header looks;
  - nothing in sprint-02 should be dispatched until a review of revision 2 is merged, as the contract itself says.
- **Fenn:** findings 05 and 06 add scenarios to his two dispatches once Zero assigns IDs.

## Files changed
```text
$ git diff --name-only main...HEAD
docs/agent-dispatch/frontend/sprint-02/agent-brennan-shell-uic-review-spec-completion.md
docs/agent-dispatch/frontend/sprint-02/findings/shell-uic-brennan-01-v16-values-overridden-by-later-dl-layers.md
docs/agent-dispatch/frontend/sprint-02/findings/shell-uic-brennan-02-s7-misreads-dl-planned-entries.md
docs/agent-dispatch/frontend/sprint-02/findings/shell-uic-brennan-03-stub-route-files-ownership-and-names.md
docs/agent-dispatch/frontend/sprint-02/findings/shell-uic-brennan-04-budget-cut-spans-two-territories.md
docs/agent-dispatch/frontend/sprint-02/findings/shell-uic-brennan-05-d16-check-has-no-scenario.md
docs/agent-dispatch/frontend/sprint-02/findings/shell-uic-brennan-06-sections-4-and-5-have-no-scenarios.md
docs/agent-dispatch/frontend/sprint-02/findings/shell-uic-brennan-07-small-contradictions-and-gaps.md
```
(The completion report is in the final commit. These are all Part 5 paths.)

## Verification
```text
$ pnpm --filter "@avel/web..." build
… apps/web build: dist/client/assets/routes-Bo_I7YFT.js   54.45 kB │ gzip:  19.29 kB
apps/web build: dist/client/assets/index-BQpWqmO7.js     398.01 kB │ gzip: 126.69 kB
apps/web build: ✓ built in 1.36s
… apps/web build: dist/server/server.js                  261.21 kB │ gzip: 63.20 kB
apps/web build: ✓ built in 143ms
(exit 0)

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
packages/contract-mock typecheck: Done
apps/web typecheck: Done
(exit 0)

$ pnpm lint
> biome check .
Checked 213 files in 132ms. No fixes applied.
(exit 0)

$ pnpm --filter @avel/web test
 Test Files  14 passed (14)
      Tests  197 passed (197)
(exit 0)

$ git diff --name-only main...HEAD   # only paths from Part 5
(the eight paths under "Files changed", all in Part 5)
```
