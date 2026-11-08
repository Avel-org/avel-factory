status: open
severity: P2
owner: Fantem (apps/web/src/kit/DecisionTag.tsx) and Zero (contract section 4, a new D-change). Not Leon's code: his factory row props are section 5.1's, word for word.

# The Factory PR card draws two rules with an empty gap before "Open on GitHub"

**Seen by INT** in a screenshot; measured here.

**Evidence.** Chromium at 390x844 on the dev server (`AVEL_API=mock`), d480f0e, after `data-hydrated`. These are the elements in the `factoryPr` card that have a top border:
```
{"tag":"DL","cls":"av-dt-facts","children":0,"padTop":"10px","y":1347,"h":11}
{"tag":"DIV","cls":"av-dt-foot","children":1,"padTop":"12px","y":1368,"h":57}
link "Open on GitHub" y=1381 h=44
```
- The facts list has no children, but it's still 11px tall: its 1px `border-top` plus `padding-top: 10px`.
- 10px below it, the footer draws its own `border-top`. So the card shows two hairlines with nothing between them.

**Why.**
- `apps/web/src/kit/DecisionTag.tsx:315`: `<dl className="av-dt-facts">` is always drawn. Its `dt`/`dd` pairs show only for `evidence` and `consequence`.
- `apps/web/src/kit/kit.css:866-875` gives `.av-dt-facts` `border-top: 1px solid var(--av-hairline)` and `padding-top: 10px`. Lines 916-919 give `.av-dt-foot` (`DecisionTag.tsx:348`) its own `border-top`.
- DL's `n$` draws the `dl` unconditionally as well, so the kit is faithful. But every one of DL's specimens has evidence. Section 5.1 gives a `factory_change` row no `evidence` and no `consequence` (CR-W2 2.1: the row has neither), so this page is the first to draw an empty list.
- `apps/web/src/modules/decisions/decisions.ts:79-88` (`factoryChangeTagProps`) passes exactly 5.1's props. Nothing in the module can avoid the empty list.

**Fixing it means:** `DecisionTag` draws the facts list only when it has `evidence` or `consequence` (a section 4 change from DL, written as a new D-row). Then the factory PR card shows one rule, the footer's, above "Open on GitHub". No module change is needed.
