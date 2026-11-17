# BRENNAN: layout-uic review-spec, completion report

verdict: FAIL

## Summary
I reviewed `shell-layout.md` revision 2 and `kit-v1.9.md` revision 1, as at c190c62, against Int's brief, the design library v1.9's bundled source, the Frontend Map v0.6 and the contract package. The verdict is FAIL on two P2s, because this is round 1 (procedures rule 2). There's no P0 and no P1.

Both P2s are on the Settings page, and both come from S14 moving Theme and Depth there:
- the CLI sessions empty state has no route, no mock, no kit icon and no defined test;
- DL's header-only `.lib-seg` rules make the Theme and Depth controls unlabelled 26px icons under 760px.

Everything else checks out against DL v1.9: the frame, sidebar, header, tab bar, nav table, `kit-v1.9.md`'s component and token changes, AP's D8 departures, and the SH trace. The fix is a small revision to section 5. Round 2 would check only those two.

## Pre-flight
- **Part 2 files, all read, none missing:**
  1. `.claude/agents/brennan.md`
  2. `codebase-analysis.md`
  3. `shell-layout.md`, whole (also item 11)
  4. `kit-v1.9.md`, whole (also item 12)
  5. `decisions-approval-page.md`: §0's sources, plus the sections `kit-v1.9.md` amends
  6. `AVEL Shell Layout brief v1.9.md` (also item 13)
  7. The design library v1.9 HTML: the style block (lines 9 to 2889) and the bundled script's `QV`, `_me`, `Nme`, `jme`, `AU`, `ea`, the `.lib-app` render, `Dw`, `wm`, `YOe`, `te` and `ve`
  8. Frontend Map v0.6: the modules, layers, SSR and routes sections
  9. `procedures.md` (also item 16)
  10. sprint-02 `decisions.md`, including "Shell layout from v1.9" (also item 14)
  15. escalations 01 to 03
  17. this task doc
- **Branch:** `frontend/sprint-02/agent-brennan-layout-uic-review-spec-a1`, starting at c190c62. `AVEL_BASE` = c190c62 = HEAD, so the diff from base was empty. The work under review is the two contracts as committed in b106262 and 71ee466.
- **Part 7 commands:** all available once the worktree's `node_modules` was installed with `pnpm install --frozen-lockfile`. No tracked file changed.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| BRENNAN-01 | DONE | efa9ff4 (findings 01, 02) |
| BRENNAN-02 | DONE | none (no finding; P3s below) |
| BRENNAN-03 | DONE | efa9ff4 (finding 01's SH-11 part) |

### BRENNAN-01: design against DL v1.9
`grep -c 'lib-rail-head\|lib-tabbar\|lib-seg\|lib-rail-tip' '…v1.9.html'` → `22`. `wc -c`: `shell-layout.md` 14,749 (under 15 KB), `kit-v1.9.md` 5,849.

Checked against v1.9's source:
- **Frame:**
  - the breakpoints: `max-width: 1023px` and `min-width: 1024px` for the aside and sheet, `760px` for the tab bar;
  - `--rail-w` 264px and 64px (`:root`, `html[data-rail="collapsed"]`);
  - the 240ms grid transition, with reduced motion;
  - focus mode (`html[data-focus]`: the sheet at 1024px and wider, the menu button back under 760px);
  - `main`'s bottom padding through `.lib-app[data-tabbar]`;
  - the sheet: `role="dialog"`, `aria-modal`, `aria-label="Navigation"`, `inert` while closed;
  - the canvas tokens `--canvas-inset: 8px` and `--radius-dialog` ("the app canvas", S1);
  - `scroll-padding-top: 76px` (DL's `html`).
- **Sidebar (`QV`):**
  - the brand mark at 32px (v1.6 layer), and `lib-brand-sub` dropped (S3);
  - the toggle's labels, `aria-expanded` and `⌘B`;
  - in the sheet, `.lib-rail-close` (`Close navigation`) instead of the toggle;
  - tooltips from `[data-tip]` rects, only while collapsed;
  - badges `{n} waiting` and `{n} for you`;
  - `aria-current="page"` on route rows;
  - children as `.lib-nav-child` on the `.lib-nav-children::before` tree line;
  - the indicator's 260ms transform (S4).
- **Header (`_me`):** `Open navigation`, `nav "Breadcrumb"`, `aria-current` on the last crumb, and the progress bar `aria-hidden`. The right side goes (S14).
- **Tab bar (`jme`):** Decisions `inbox`, Project `list-checks`, Release `package-check`, More `menu`, with `repeat(4,1fr)` changed by S8.
- **`Nme`:** a radiogroup, radios with `aria-checked`, and no call on the current option.
- **`AU`:**
  - depth defaults to `glass`;
  - the theme follows the OS preference (S12 departs);
  - the view-transition reveal, or `.lib-theme-fade`, with nothing under reduced motion.
- **`ea`:** `.scr-head` with the eyebrow, the `h1` and the lead. The spec button goes (S11).
- **Nav table against `Dw`, `wm` and `YOe`:**
  - the groups, labels and order match;
  - "Gates and integration" is DL's label;
  - DL's icons are `inbox`, `list-checks`, `message-circle`, `wallet` and `book-open`, and the rest come under S5.
- **Progress's empty state:** `No parts yet` and `Parts appear here once the plan is approved.`, with `list-checks`, as DL has it.

Every departure is S1 to S15, or †, apart from the P3s below. Findings 01 and 02.

### BRENNAN-02: v1.9's changes
The style diff has `229` changed lines (78 removed, 151 added), with the output files in my scratchpad instead of `/tmp`. Read against `kit-v1.9.md` sections 1 and 3:
- **Tokens:** `--color-text-subtle` `#8f9098` → `#9e9fa7`, `--av-d-exit`, `--av-ease-in`, and `--av-d-exit: 0ms` under reduced motion. All listed.
- **Hover gates:** `a:hover` (base.css), `.av-icon-close`, and the `textarea:hover` input rule (kit.css's ReasonDialog textarea). All listed. The other gated rules are library or screen classes the built work doesn't have.
- **Dialog exit:** `.av-scrim[data-closing]`, `av-fade-out`, `av-dialog-out`, `--av-ease-in`. Listed.
- **Components:**
  - `te` (Button): `busy`, `aria-busy`, `aria-disabled`, `cursor: progress`, no `onClick` while busy, and `reasonPlacement`;
  - `ve` (DecisionTag): `Review the new version first`, and `notAllowedReason||"Your role can't approve this"`;
  - ReasonDialog: `Write a reason first` as a tip, and `ReasonField`;
  - `data-ui="DialogClose"`, which is new in v1.9 (v1.1's two hits are Radix's internal name).

  All match `kit-v1.9.md` section 1.
- **D8:** DL v1.9 leaves Reject on when `stale`, and draws a disabled Approve when `notAllowed`. `kit-v1.9.md` keeps AP's departures, each with route 54's reason, as INT confirmed.
- **Not listed:**
  - v1.9's `.pd` container queries (`@container pd` at 480px and 380px);
  - `.av-spin`'s keyframes;
  - the `.dec-snack` changes.

  None of them changes the built page: the built DecisionTag lays out by D16's 899px query, and no snackbar is built. So these are P3s (below), not findings.

### BRENNAN-03: buildable and testable
The SH grep counts `19` IDs: SH-01 to SH-07, SH-09 to SH-14 and SH-20 to SH-25, with no SH-08. Traced:

| Section | Scenarios |
| --- | --- |
| 1 Frame | SH-03, SH-05, SH-06, SH-14, SH-20, SH-21, SH-22 |
| 2 Sidebar, header, tab bar | SH-01, SH-02, SH-04, SH-11 (the header), SH-22 |
| 3 Kit | SH-06, SH-07 |
| 4 Nav model, cookies, crumbs, titles | SH-10, SH-04, SH-20, SH-23 |
| 5 Pages | SH-11. Settings' "empty and with rows" is undefined (finding 01) |
| 6 Routes | SH-10, SH-20 |
| 8 Budget | rule 7's CI check, SH-24 |
| kit-v1.9 §1, §2, §3, D16 | SH-09, SH-12, SH-13, SH-25 |

- **The nav from `staticData`:** buildable.
- **Route files:** section 6 names each file, and says `system` writes the files for `missions` and `clients`.
- **The plan's order:** missions and clients come after the kit and the mock, system after missions, clients and Nemi, and decisions merges after system. That matches section 6.
- **The DTOs the stand-ins rely on exist:**
  - `MissionDto.clientId`, `packageKey` and `state`;
  - `ProposalDto.missionId`;
  - `Package` includes `landing_page`.
- **The earlier app-shell findings 01 to 07** carry over as decisions.md says:
  - the final cascade is §0's rule;
  - S3 and S5 cover the old S7;
  - §6 covers the route files;
  - rule 7 replaces the budget cut;
  - SH-25 is D16's check;
  - SH-12 to SH-14 cover the page on the shell, the styles and the marker;
  - `/`'s title is set, Ghost is named, and `data-tabbar` and SH-24's drawn elements are in.

## Findings
- `docs/agent-dispatch/frontend/sprint-02/findings/layout-uic-brennan-01-settings-cli-sessions-row-has-no-source.md`: P2. Settings' CLI sessions empty state has no data, no icon in the kit, and no defined test.
- `docs/agent-dispatch/frontend/sprint-02/findings/layout-uic-brennan-02-settings-segmented-control-on-phone.md`: P2. On Settings, DL's header-only `.lib-seg` rules make Theme and Depth unlabelled 26px icon pills under 760px.

## Contract to files
- **BRENNAN-01:** `shell-layout.md` §0 to §5 and §7 against the DL v1.9 HTML. Findings 01 and 02.
- **BRENNAN-02:** `kit-v1.9.md` §1 and §3 against the v1.1 to v1.9 style diff, and the `te`, `ve`, ReasonDialog and Dialog sources. No finding.
- **BRENNAN-03:** `shell-layout.md` §4, §6 and §9, `kit-v1.9.md` §4, `plan.toml`'s `after` lists, and `packages/contract/src/dto/{missions,decisions}.ts`. Finding 01, for SH-11.

## Deviations
- **P3s aren't in `backlog.md`.** The task doc's notes send P3s there, but Part 5 doesn't list that file, so writing it would cross my territory. They're listed under "Issues for other agents" for INT or Zero to copy over.
- **Scratch files:** BRENNAN-02's verify writes `/tmp/v11.css`. I wrote the same output to my session scratchpad. The command and the count are otherwise unchanged.
- **Dependencies:** I ran `pnpm install --frozen-lockfile` because the worktree had no `node_modules`. No tracked file changed.

## Limitations
- I compared component sources by reading the functions `kit-v1.9.md` names, plus targeted string counts. I didn't run a full semantic diff of every v1.1 kit function (`ly`, `y8`, `Ze`, `dt`, `ne`) against v1.9's. So "unchanged apart from dev-only checks" for WidgetState, Tag, HashChip, StatusGlyph and ErrorPanel is taken from the contract and spot-checked only. The style diff shows no CSS change for them.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT / Zero:** revise `shell-layout.md` section 5 (and §3 and §9 as needed) for findings 01 and 02. Round 2 checks only those.
- **INT / Zero: P3s for `backlog.md`.** None of them blocks.
  1. `kit-v1.9.md` doesn't record v1.9's `.pd` container queries (DL v1.9 CSS, the "v1.9 Container queries" block: `.pd-body` single column, `.pd-top` wrap and `.pd-project`'s own line at 480px; `.pd-actions` in one column at 380px). It should say they change nothing on the built tag because D16's 899px query already draws the phone layout, or adopt them (layout-uic-brennan review a1).
  2. `kit-v1.9.md`'s Button row names `.av-spin` but not its `@keyframes av-spin` and reduced-motion rule (DL v1.9, "Busy spinner") (a1).
  3. All projects' lead `Every project, with its client and state.`† promises a state the content (a link per row) doesn't show, and "every" while closed and cancelled projects are left out (`shell-layout.md:132`, `:102`) (a1).
  4. The project-page crumbs `[All projects, {project}, {page}]` (`shell-layout.md:122`) and the tabs as links with `href` (`:74`) depart from DL's `.lib-app` crumbs (one crumb per screen) and `jme`'s buttons, with no S-number (a1).
  5. Sprint-03 hrefs: Library `/library/skills` and Client knowledge `/library/client` (`shell-layout.md:97`) differ from FM's `/library/$kind` and DL's `/library/client/$clientId`. Section 4's derivation (href from the route path, with `staticData.nav` carrying no href) can't produce them from param routes. Settle this in sprint-03's contract (a1).
  6. Section 1's `scroll-padding-top: 76px` line has a stray space before the comma (`shell-layout.md:28`) (a1).

## Files changed
```text
$ git diff --name-only main...HEAD
docs/agent-dispatch/frontend/sprint-02/agent-brennan-layout-uic-review-spec-completion.md
docs/agent-dispatch/frontend/sprint-02/findings/layout-uic-brennan-01-settings-cli-sessions-row-has-no-source.md
docs/agent-dispatch/frontend/sprint-02/findings/layout-uic-brennan-02-settings-segmented-control-on-phone.md
```

## Verification
```text
$ pnpm --filter "@avel/web..." build
…
apps/web build: dist/server/server.js                                      261.21 kB │ gzip: 63.20 kB
apps/web build: ✓ built in 152ms
apps/web build: Done
(exit 0)

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
packages/contract-mock typecheck: Done
apps/web typecheck: Done
(exit 0)

$ pnpm lint
> biome check .
Checked 213 files in 136ms. No fixes applied.
(exit 0)

$ pnpm --filter @avel/web test
 Test Files  14 passed (14)
      Tests  197 passed (197)
(exit 0)

$ git diff --name-only main...HEAD   # only paths from Part 5
(the three paths above, all in Part 5)
```
