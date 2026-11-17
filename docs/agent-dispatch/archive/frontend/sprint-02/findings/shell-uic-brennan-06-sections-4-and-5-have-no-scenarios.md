status: open
severity: P2
owner: Zero (app-shell.md section 7), then Fenn

# shell-uic-brennan-06: SH-01 to SH-24 leave sections 4 and 5, and some testable lines of sections 1 and 2, without a scenario

## The trace
`grep -c '^| SH-' docs/ui-contracts/app-shell.md` → `16` (SH-01 to SH-11 and SH-20 to SH-24). Traced to the sections they test:

| Section | Covered by | Not covered |
| --- | --- | --- |
| 1, Layout | SH-06 (the breakpoints as CSS text), SH-20 to SH-24 | `main`'s padding (line 60, and line 57's 120px under 760px); the sheet closed in the server's HTML (line 66: SH-03 checks only after mount) |
| 2, `AppShell` | SH-01 to SH-05 | The hydration marker absent from the server's HTML and the hydration render (line 128). SH-24 only uses it. The crumb's `nav "Breadcrumb"` with `aria-current` (line 121). The chrome reset's scope (line 129) |
| 2, `ScreenHeader` | SH-07 | One column under `max-width: 760px` (line 135). SH-06 reads `kit.css` only for the shell's rules |
| 3 | SH-08 to SH-11, SH-20 | (covered) |
| 4, the page on the shell | none by ID | No deep import past `kit/index.ts` (line 224). The header is `ScreenHeader` (eyebrow `Home`, `h1` `Decisions`, the lead), and `.dec-head`/`.dec-*` are gone (line 225). `.dec-page` has no padding (line 226). `decisionsScreenStylesheets` without `kitStylesheetHref` (line 227) |
| 5, Fonts | none | The sans rule's four values and the unchanged mono rule (lines 232-235): a text test like SH-06 would lock them |
| 6 | Leah's measure, by her review (lines 241-248) | (a review, not a test, by design) |

The plan also doesn't give section 4 an ID: Fenn's unit dispatch is "the approval page's header change (app-shell.md SH-01 to SH-11)", and none of SH-01 to SH-11 is about the page. `codebase-analysis.md:35`: "The contracts' scenario IDs … name every test."

## Why it matters
- Section 4 is Ghost's whole build, and R7's deep import is a rule sprint-01 broke and accepted only for sprint-01. Without a locked test, nothing stops it coming back.
- Section 5's values were argued over three studies, and a text check costs nothing.

## Fixing it means
- **New scenario IDs:**
  - section 4: no import past `kit/index.ts` in `modules/decisions`; the header through `ScreenHeader`; the stylesheet list;
  - section 5: `font-fallbacks.css` read as text, with the four sans values, the mono rule and the stacks;
  - section 2: the marker absent from `renderToString` and present after hydration.
- **Extend existing rows:** add `main`'s padding and the `ScreenHeader` 760px rule to SH-06's `kit.css` text check.
- Or say per line that it's a review check, not a test.
