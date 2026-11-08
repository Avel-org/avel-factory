status: open
severity: P2
owner: Zero (the approval page contract section 7, or app-shell.md section 7), then Fenn

# shell-uic-brennan-05: D16's check has no scenario ID, so the rule revision 15 depends on has no locked test

## What revision 15 says
`decisions-approval-page.md:378`, D16: "**The check:** at 390px, a desk tag and a phone tag with the same props draw the article, its head, title, facts list, footer, and each button and link at the same rect, within 1px. At 900px and over, nothing changes."

## What tests it
Nothing with an ID.
- **UC-32** (`decisions-approval-page.md:628`) compares the page's server HTML against the hydrated page. Since revision 15, both are `layout="desk"`. It shows that nothing moves at hydration, not that the desk tag draws the phone layout. If D16 were left out entirely, UC-32 would still pass: desk before and desk after.
- **UC-31** checks D11's grid and the 44px targets only.
- **SH-01 to SH-24** (`app-shell.md:256-279`) don't mention D16.
- **The plan:** Fantem checks D16 "on a scratch page in your scratchpad, not in the repo" (`agent-fantem-shell-kit-build.md:76`), and Zero re-runs it in review (ZERO-01).

```text
$ grep -n 'D16' docs/ui-contracts/decisions-approval-page.md | cut -c1-60
289:| `DecisionTag` | `DecisionTag` | below | `compact`, `hide
378:| D16 | **On a phone, the desk layout draws the phone layou
762:| cls-study-leah-01: the 0.13 is the desk-to-phone switch
764:| decisions-fenn-01: `data-hydrated` is set before the pho
$ grep -n '^| UC-3[0-9]\|^| SH-' docs/ui-contracts/*.md | grep -c 'D16'
0
```

D16 is what removes cls-study-leah-01's 0.13 shift. Leah's CLS measure on `/` would show a regression only at the end of a sprint, and then as a number, not a cause. `codebase-analysis.md:35` says "The contracts' scenario IDs … name every test".

## Fixing it means
- **A scenario ID for D16's check,** in Fenn's end-to-end territory. It can be a new UC-33 or an SH number. Over `fixtures.step1`'s rows, at 390 and at 900 (and over): a desk tag and a phone tag with the same props, each element's rect within 1px at 390, and the desk tag unchanged at 900.
- **Say where the two tags are drawn.** The page draws only desk, so the test needs a page or harness that draws both. Name it, inside Fenn's territory.
