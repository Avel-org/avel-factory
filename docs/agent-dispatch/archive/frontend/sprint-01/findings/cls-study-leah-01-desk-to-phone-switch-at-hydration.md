status: routed (sprint-02, option (a) with the app shell: D16, UC-32, throttled measure; 0.13 stays open)
severity: P1
owner: INT to decide; Leon (`useIsPhone`, `DecisionsScreen.tsx:134-140`) and Fantem (kit.css `[data-layout="phone"]` rules)

# CLS on `/` at 390x844 is 0.13 on main, and the cause is the desk-to-phone layout switch at hydration; fonts and D11 are not the cause

**INT's guess is not confirmed.** d8bc228 (D11 as an inline grid) and main (D11 in `kit.css`) shift by the same amount:

| Commit | Server | Fonts | Runs 1/2/3 | Shift (time) |
| --- | --- | --- | --- | --- |
| d8bc228 | prod | normal | 0.1309 / 0.1309 / 0.1309 | one, 98-109 ms |
| d8bc228 | prod | woff2 aborted | 0.1281 x3 | one, 98-119 ms |
| d8bc228 | dev | normal | 0.1309 x3 | one, 378-479 ms |
| main | prod | normal | 0.1317 / 0.1320 / 0.1320 | one, 92-108 ms |
| main | prod | woff2 aborted | 0.1291 x3 | one, 84-140 ms |
| main | dev | normal | 0.1320 x3 | one, 379-516 ms |

(Dev with fonts aborted never hydrates in my harness on either commit: see the report, Limitations.) Every one of these shifts has `hadRecentInput: true` although no input was sent (Chromium's touch emulation). I summed all entries, as decisions-leah-07 did. A standard CLS that drops flagged entries reads 0 here.

**What shifts** (main, prod, normal, run 1; `LayoutShift.sources`, previous -> current rect):
- `article` "Budget increase" `[13,496,364,294] -> [13,536,364,308]`
- `dl.av-dt-facts` `[32,286,326,117] -> [34,312,322,129]`
- `div.av-dt-foot` `[32,413,326,57] -> [34,451,322,57]`
- `button` Reject `[159,415,214,74] -> [34,464,130,44]`; Approve `[32,426,132,44] -> [159,453,212,74]`

**Why.** `DecisionsScreen.tsx:134-140`: `useIsPhone()` is `useSyncExternalStore(..., () => matchMedia(PHONE_QUERY).matches, () => false)`. The server snapshot is `false`, so the server HTML is `layout="desk"` (`DecisionTag.tsx:254` `data-layout`). After hydration it is `true` and the whole card becomes `layout="phone"`. I compared every element's rect and computed style in the first card, server HTML (JS off) against hydrated (main, prod, `scripts/ssrdiff.mjs` in my scratchpad):
- `.av-dt-body` height 308 -> 348 and padding `14px 16px` -> `14px 18px`;
- `.av-dt-head` height 22 -> 48: the row wraps, so the title, the "Binds to" line and the facts move down 26 px;
- `.av-dt-facts` grid `88px 224px` -> `322px` (one column), 117 -> 129 px high;
- section `.dec-sec` height 1084 -> 1288.

D11 (revision 10) moved only the buttons' grid into `kit.css` under `@media (max-width: 899px)`. The other `[data-layout="phone"]` rules (`kit.css:758, 769, 876, 883, 886`) still apply only after JavaScript picks `phone`.

**When it counts: a race with first paint.** The shift is counted only if the desk layout is painted before hydration commits.
- Unthrottled, fonts normal: FCP 48-64 ms, hydration 78-87 ms: desk painted, shift counted (0.132).
- Unthrottled, fonts delayed 1.2 s: FCP 140-160 ms (the font fetch holds it), hydration 66-80 ms: the desk layout is never painted. CLS 0.0008 on main. Section 6's measure passes by luck.
- Same, CPU throttled 4x (CDP, a closer match to a phone): FCP 228-272 ms, hydration 290-330 ms. Main, fonts delayed: 0.1296 (0.1288 hydration + 0.0008 swap). Fonts normal: 0.132.

So on a phone this is 0.13 whatever the fonts do, six times the 0.02 budget (FM v0.6, line 281).

**Fix means:** the server's HTML must already be the phone layout on a phone. Either the `[data-layout="phone"]` rules also apply to the desk layout under `@media (max-width: 899px)` (D11's approach, extended to the body padding, head wrap, facts grid and button size), or the layout comes from CSS alone. That is a change to UI contract section 4 (D11 and the layout rules) and to Fantem's kit.css. Re-measure with the 4x throttle; target under 0.02.
