status: open
severity: P3
owner: Zero (UI contract section 4, D-rules), then Fantem (apps/web/src/kit/DecisionTag.tsx). Not Leon's: his diff draws the row exactly as 5.1 says.

# decisions-brennan-01: a factory PR card draws an empty facts block, so two rules with a gap before "Open on GitHub"

## What INT saw
On `/`, the Factory PR card draws two hairlines with an empty gap between them, then `Open on GitHub`.

## Evidence
- `apps/web/src/modules/decisions/decisions.ts:79-88` (`factoryChangeTagProps`) gives a `factory_change` row no `evidence` and no `consequence`. That's correct: UI contract 5.1's `factory_change` row lists neither, and CR-W2 2.3's member has neither.
- `apps/web/src/kit/DecisionTag.tsx:315-328` always renders `<dl className="av-dt-facts">`, even when both its children are null.
- `apps/web/src/kit/kit.css:866-873`: `.av-dt-facts` has `padding-top: 10px; border-top: 1px solid var(--av-hairline)`. That's the first rule, with 10px of empty space under it.
- `apps/web/src/kit/DecisionTag.tsx:237-242` and `:348`: the link goes into `.av-dt-footer` inside `.av-dt-foot`, and `kit.css:916-918` gives `.av-dt-foot` its own `border-top` and `padding-top: 12px`. That's the second rule, then `Open on GitHub`.
- The design library's DecisionTag does the same: its `createElement("dl",{style:{…paddingTop:10,borderTop:"1px solid var(--av-hairline)"…}}, c.evidence ? … : null, …, c.consequence ? … : null)` always draws the `dl`. DL's specimens always pass evidence, so the empty case never shows there.
- Why it shows only now: under a1, nothing linked `kit.css` (`git grep -n kitStylesheetHref 080ca45 -- apps/web/src` finds only `kit/index.ts`), so neither rule was drawn. a2 links it from `/`'s head (section 5, "Linked from the first paint"), as it should.

## What fixing it means
- **Zero:** add a D-rule to section 4: `DecisionTag` draws the facts `dl` only when it has at least one fact (evidence, cost or consequence).
- **Fantem:** wrap `DecisionTag.tsx:315-328` in that condition.
- Done when a `factory_change` row's tag has no `.av-dt-facts` element, and a proposal row's tag still has one. That needs a kit test from Fenn, since the kit tests are locked.
