status: open
severity: P1
owner: Zero (app-shell.md sections 1 and 2), then Fantem (kit.css) and Ghost (the page's header)

# shell-uic-brennan-01: the contract takes the v1.6 layer's values, but DL's later layers override them, so the main padding and the screen header aren't what DL draws

## What the contract says
- `app-shell.md:60`: "`main`'s padding is DL's: `32px clamp(16px, 4vw, 52px) 160px` (`.lib-main`, with the v1.6 layer's top)."
- `app-shell.md:136`: "Values: DL's `.scr-eyebrow`, `.scr-title` and `.scr-lead`. Where the v1.6 layer overrides library.css, the v1.6 value is the one (the lead is `16.5px`/`25px`)."
- `app-shell.md:75` (K1 on the shell) and S6 (`app-shell.md:153`) say DL's own sizes hold above the touch rule, with no mention of DL's own phone sizes.

## What DL draws
The design library has one `<style>` block (lines 9 to 2816). In it, two layers come **after** the v1.6 layout layer (line 1975) and override it:

| Rule | v1.6 (what the contract takes) | Later DL layer (what DL draws) |
| --- | --- | --- |
| `.lib-main` top padding | `32px` (line 2012) | `24px`, "v1.7.1: tighter headers" (line 2543); `16px` under `max-width: 760px` (line 2557) |
| `.scr-lead` | `16.5px`/`25px !important`, `margin-top: 4px` (line 2003) | `16px`/`24px !important`, `margin-top: 2px !important` (line 2547); `15px`/`22px !important` under 760px (line 2559) |
| `.scr-title` | base `clamp(26px, 3vw, 32px)` (line 1644) | `clamp(24px, 2.6vw, 28px)` (line 2545); `24px` under 760px (line 2558) |
| `.scr-head` row gap | `6px` (line 2000) | `4px` (line 2546) |
| `.scr-eyebrow` | `13px` (line 1643) | `12.5px` under 760px (line 2560) |
| `.lib-icon-btn` | `36px` | `44px` under 760px, "Mobile chrome" (line 2433) |

Equal specificity and `!important` on both sides, so the later rule wins. The `.scr-lead` 16.5px/25px that line 136 names is never what DL renders.

```text
$ D='docs/design/AVEL Enclosure Grid · Design library v1.1.html'
$ grep -n '<style\|</style>' "$D"
9:<style>
2816:</style>
$ grep -n '^\.lib-main \|\.scr-lead {\|v1.7.1\|Mobile chrome' "$D"
1405:.lib-main { outline: none; padding: 28px clamp(16px, 4vw, 52px) 160px; min-width: 0; }
2003:.scr-lead { grid-area: lead; margin-top: 4px !important; max-width: 78ch; font-size: 16.5px !important; line-height: 25px !important; }
2012:.lib-main { padding-top: 32px; }
2429:/* ==== Mobile chrome: room for the content, 44px targets, no desk-only furniture ============================== */
2542:/* ==== v1.7.1: tighter headers, content-sized inbox, quieter chrome =========================================== */
2543:.lib-main { padding-top: 24px; }
2547:.scr-lead { font-size: 16px !important; line-height: 24px !important; margin-top: 2px !important; }
2559:  .scr-lead { font-size: 15px !important; line-height: 22px !important; }
```

## Why it matters
Section 0's value rule allows "DL's own literal for that element". 32px and 16.5px are DL literals, but they aren't what DL draws: DL's own later layers replaced them. A build to the contract passes Zero's "every value has DL's source" check and still doesn't match the design library. It applies to every screen, because every screen uses `main` and `ScreenHeader` from sprint-02. The approval page changes header values in this sprint anyway (section 4), so this is the time to get them right.

## Fixing it means
- In sections 1 and 2, take DL's final cascade: the v1.6 layer, then "Mobile chrome" and "v1.7.1", as DL loads them. That means `main` at `24px` top (16px under 760px), and `ScreenHeader` with v1.7.1's title, lead, row gap and the under-760px values.
- Replace line 136's rule with "the last DL rule for the element wins".
- Or keep the v1.6 values as a numbered change (S9) with a reason.
- If the menu button's 44px under 760px is DL's own, say so in K1.
