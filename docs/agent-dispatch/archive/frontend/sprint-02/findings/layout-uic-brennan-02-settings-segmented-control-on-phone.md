status: open
severity: P2
owner: Zero (shell-layout.md sections 3, 5 and 9), then Fantem (SegmentedControl, kit.css) and Leon (Settings)

# layout-uic-brennan-02: on Settings, DL's header-only `.lib-seg` rules turn Theme and Depth into unlabelled 26px icon pills under 760px

## What the contract says
- `shell-layout.md:137`: Settings' groups are `SegmentedControl`s `Theme` and `Depth` "as in DL's `_me`".
- `shell-layout.md:83`: `SegmentedControl` is DL's `Nme` (`.lib-seg`).
- `shell-layout.md:8`: values are "DL's final cascade (the last DL rule for that element at that width)".
- S14 (`shell-layout.md:168`) moves Theme and Depth off the header, onto Settings only.

## What DL's final cascade gives a `.lib-seg` on a page
DL only ever draws `Nme` in the header (`_me`), so its `.lib-seg` rules are written for the header:

| DL v1.9 line | Rule | Effect on Settings under 760px |
| --- | --- | --- |
| 1509 | `.lib-seg-btn { height: 26px; … }` | 26px pills |
| 1514 | `@media (max-width: 760px) { .lib-seg-label, … { display: none; } .lib-seg-btn { padding: 0 8px; } }` | `Light`, `Night`, `Flat` and `Glass` disappear, leaving four bare icons |
| 2479 | `.lib-topbar .lib-seg { display: none; }` (Mobile chrome) | doesn't match on Settings, so the control shows |
| 2488 to 2489 | `.lib-display-pop .lib-seg-label { display: inline !important; }`, `.lib-display-pop .lib-seg-btn { height: 36px; padding: 0 12px; }` | DL's own phone presentation of these two controls: labels back, 36px tall. S14 removed the pop, and section 5 doesn't say Settings takes its rules |
| 2836 | `@media (pointer: coarse) { .lib-seg-btn { height: 40px; min-width: 44px; } }` | 40px only on a coarse pointer. Playwright at 390 without touch stays at 26px |

DL's Display pop also draws a visible `<span>Theme</span>` and `<span>Depth</span>` above each control (`_me`: `"Theme",l,…,"Depth",u`). Section 5 doesn't say whether Settings has visible group labels or only the radiogroup's `aria-label`.

## Why it makes the build or its checks wrong
- **The builder has two DL-faithful readings,** and they draw different pages: the bare `.lib-seg` cascade (icon-only, 26px, no visible label), or the Display pop's (labels, 36px, `Theme` and `Depth` spans). Zero's system review has nothing to judge the result against.
- **The bare reading fails the sprint's own target check.** Leah's LEAH-02 checks "Settings' radio groups … 44px targets under 900px" (`agent-leah-shell-review-a11y-perf.md:66`). A DL-faithful 26px pill at 390 would be a finding against work that followed this contract.
- **Int's brief** asks for a professional product (S15). Four unlabelled icons as the only content of Settings on a phone works against that, and the radios' names would come only from `title`.

## What fixing it means
In section 5 (Settings' groups), say:
- what Settings draws for each group: a visible label (DL's pop uses a `span` with `Theme` and `Depth`) or the `aria-label` alone;
- which DL rules `SegmentedControl` takes on Settings at 760px and under. DL's own phone answer is the Display pop's: labels kept, 36px. If the 44px target applies, say so as a departure (S-numbered or †), since DL's coarse rule is 40px;
- and add the phone case to a scenario: SH-11 (the label shown under 760px, `kit.css` read as text) or SH-22 (Settings at 390).
