status: fixed (Leon a3, 3789364; FENN-04 met: 10 green runs in Zero's review a2 on Leon's a3, plus 3 on main 8386bb5 in Fenn's a7)
severity: P1
title: data-hydrated is set 15 to 30 ms before the list switches from the server's desk layout to the phone layout. A tap in that window opens Reject instead of Approve, and the same switch is the 0.13 layout shift on `/`.
found by: Fenn, decisions-test-e2e a5 (report 73e235e on frontend/sprint-01/agent-fenn-decisions-test-e2e-a5, verdict BLOCKED). Filed by Zero for INT, since Fenn writes only the report.
same cause as: cls-study-leah-01 (Leah's cls-study a2, report 726b606 on frontend/sprint-01/agent-leah-cls-study-review-a11y-perf-a2)
under test: main at c36ebc3; e2e locked at d6994d7
for: Leon (decisions build a3: the marker), then Fenn (decisions-test-e2e a6: FENN-04 again). INT's ruling is at the end.

## Where
- `apps/web/src/modules/decisions/screens/DecisionsScreen.tsx:172-178,193`: `useHydrated()` (a `useSyncExternalStore` with server snapshot `false`) sets `data-hydrated` on the page root.
- `DecisionsScreen.tsx:135-141,341`: `useIsPhone()` in `DecisionsList`, also server snapshot `false`, so the server draws `layout="desk"` and the client switches to `phone` in a later commit. `DecisionsList` sits in its own `Suspense` (:221).
- `apps/web/src/kit/DecisionTag.tsx:125,149-163,192-220`: `layout` is a prop that changes the DOM, not only the CSS. Phone draws `Button size="lg" block`, the `.av-dt-actions-phone` wrapper and the DOM order Reject then Approve. Desk draws `size="md"`, `.av-dt-row` and the order Approve then Reject.
- `apps/web/src/kit/kit.css:758,769,876,883,886`: the `[data-layout="phone"]` rules for body padding, head wrap and the one-column facts grid. Only D11's `.av-dt-pair` (kit.css:981-994) also applies to the desk HTML under 900px.

## What it breaks
- **UI contract section 5, the hydration marker (revision 9):** the marker means a click is no longer lost. Here it's set before the final layout, so a click can land on the wrong button. That's the e2e failures at `decisions.spec.ts:34`, `:73` and `:162` (decisions-e2e-zero-01).
- **Section 8, layout shift on `/` under 0.02** (FM v0.6 line 281): the switch is 0.13 at 390x844 (cls-study-leah-01).

## Evidence
**Fenn (e2e a5)**, phone project, rAF poll of the buttons' rects (`t` in ms of page time), failing run g5, UC-31:
```
t=40   hyd=0  Approve@174,426,184 | Reject…@32,426,132     (server's desk layout)
t=447  data-hydrated attr set (MutationObserver)
t=463  hyd=1  Approve@174,426,184 | Reject…@32,426,132     (marker set, layout unchanged)
t=479  hyd=1  Reject…@34,464,130  | Approve@174,464,182    (second commit: order and y 426 -> 464)
```
- Passing runs show the same sequence (g1: marker at t=388, switch at t=413). The only difference is whether the click falls in the window.
- A MutationObserver logged `removed a[Button]` 15 to 30 ms after the marker in every run.
- In the failing runs the open dialog is "Reject this decision?" with a Reject button, though the test clicked Approve. No reload, no page errors.
- Rate: 2 of 8 plain runs.

**Leah (cls-study a2)**, main, prod, normal fonts, 390x844: CLS 0.1317 / 0.1320 / 0.1320, one shift at 92-108 ms.
- The shift's sources are the first card's `dl.av-dt-facts`, `div.av-dt-foot`, both buttons (Reject `[159,415,214,74] -> [34,464,130,44]`), and the second article.
- Server HTML against hydrated: `.av-dt-body` padding 16 -> 18 px, `.av-dt-head` 22 -> 48 px (it wraps), and the facts grid goes from two columns to one.
- With fonts delayed, the measure in section 6 reads 0.0008, only because first paint comes after hydration. At 4x CPU throttle it's 0.1296 (cls-study-leah-05).

## What fixing it means
The bar:
1. **No layout switch after hydration:** the HTML the server sends on a phone is already the phone layout. Hydration and every commit after it change no tag's layout, button order or size.
2. **`data-hydrated` only once the final layout is drawn:** after the marker, nothing on the page re-lays out except in answer to the user, the data, or a real change of viewport.
3. **Leah's CLS bar:** under 0.02 on `/` at 390x844, three runs each, prod build, at 4x CPU throttle with fonts normal and with fonts delayed 1.2 s, summing every `layout-shift` entry (flagged ones included), with FCP and hydration time recorded (cls-study-leah-01, -05).
4. **Fenn's FENN-04 re-run:** the locked e2e suite, unchanged, green 10 runs in a row on main, each starting its own dev server.
5. **Nothing else changes:** at 900px and over nothing changes, and every locked unit test passes.

**Territory.** Point 2 is Leon's (`DecisionsScreen.tsx`). Point 1 isn't reachable from Leon's territory alone. The server can't know the viewport, so the phone look has to come from CSS on the HTML the server sends. But the phone look is in `kit.css`'s `[data-layout="phone"]` rules and in `DecisionTag`'s DOM, which are Fantem's and section 4's. `decisions.css` doesn't style kit parts (its header, and section 5, "Styles and loading").

## Ruling (INT, 2026-11-07)
Option (c) first, then (a).
- **Now, option (c):** Leon's decisions build a3 does only the marker, bar point 2. `data-hydrated` is set only once every tag has its final layout, so an early tap can't land on the wrong button. Then Fenn's decisions-test-e2e a6 runs FENN-04 again (bar point 4: the locked suite, unchanged, 10 runs green). This finding closes when both are merged.
- **The 0.13 layout shift (bar points 1 and 3) stays open as cls-study-leah-01.** It isn't this finding's to close, because the switch still happens, only before the marker. It's for option (a): UI contract revision 15 (section 4: the kit draws the phone look from CSS under 900px on the server's desk HTML, as D11 does for the buttons; section 5: no client layout switch), then Fantem's w0-kit a6, Leon's next attempt, Fenn again, and Leah's re-measure at 4x CPU throttle (cls-study-leah-05).
