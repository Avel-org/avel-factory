status: fixed (D15, 193a66f)
severity: P3
owner: Fantem (kit/DecisionTag.tsx)

# Factory PR card draws two rules with an empty gap before "Open on GitHub"

INT's screenshot, reproduced at 390x844 (dev, mock). The card's border-bearing elements, from `getComputedStyle`:
```
DL.av-dt-facts  border-top 1px  y1347 h11     <- empty
DIV.av-dt-foot  border-top 1px  y1368 h57     (holds the 44px "Open on GitHub")
```
Cause: `kit/DecisionTag.tsx:315` renders `<dl className="av-dt-facts">` unconditionally. `factoryChangeTagProps` (`decisions.ts:79-88`) passes no evidence or consequence, so the `dl` is empty but still has `border-top` and `padding-top: 10px` (`kit.css:866-875`): an 11px strip between two hairlines. The page's props are right; the kit is at fault.

**Fix means:** render the `dl` only when evidence or consequence is present.
