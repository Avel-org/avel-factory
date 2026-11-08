status: fixed (d6994d7)
severity: P2
title: UC-31 is still red, but on its own timing: it reads the dialog's confirm button during DL's `av-dialog-in` scale, so it measures 43.5 to 43.9px instead of the button's 44px
reviewer: Zero (review-frontend), agent-zero-w0-kit-review-frontend (a4)
under review: 82d4c2b (base b1932d9)
for: INT (an override for Fenn's locked e2e test), then Fenn (`apps/web/e2e/decisions.spec.ts`). **Not a defect in the kit:** K1's 44px holds once the dialog has opened. It doesn't block the w0-kit merge, but UC-31 stays red until it's fixed.

## Where
- `apps/web/e2e/decisions.spec.ts:155-162` (locked): reads `confirmBox.height` straight after the dialog appears, and expects `>= 44`.
- `apps/web/src/kit/kit.css:42-48`: the dialog's `animation: av-dialog-in var(--av-d-sheet) var(--av-ease) both`, from `transform: translateY(8px) scale(0.985)`. That's DL's own animation (the DL source has `av-dialog-in var(--av-d-sheet) var(--av-ease) both`), so the kit shouldn't change it.
- K1 (`kit.css`, `@media (max-width: 899px)`: `[data-ui="Button"][data-variant] { min-height: var(--av-touch-min); }`) gives the confirm button 44px of layout height. `boundingBox()` includes the transform, so it reads less while the scale runs.

## Evidence
`pnpm exec playwright test` in `apps/web` on this commit: 4 passed, 1 skipped, 1 failed:
```
✘ [phone] UC-31 … Error: the confirm button is at least 44px tall
  Expected: >= 44
  Received:    43.868408203125
  > 162 |   ).toBeGreaterThanOrEqual(44);
```
UC-31's D11 assertions, at lines 112-137, now pass. That was decisions-zero-01's failure.

A scratch Playwright script against `vite dev` with `AVEL_API=mock`, at 390x844 (phone, touch). It opens the reason dialog from the first card's Approve button, then reads the confirm button's box:
```
dialog confirm, reducedMotion=no-preference: at open 43.4969482421875, after 500ms 44
dialog confirm, reducedMotion=reduce: at open 44, after 500ms 44
```

## What fixing it means
Under INT's override, Fenn makes UC-31 read the confirm button once the dialog has settled. For example, wait for the dialog's animations to finish (`dialog.evaluate(el => Promise.all(el.getAnimations().map(a => a.finished)))`), or run UC-31 with `reducedMotion: "reduce"`. Either way the 44px assertion stays as it is. No kit change.

## Closed
INT set this to fixed by Fenn's decisions-e2e a4 (d6994d7, merged at 1c2213d): UC-31 now reads the dialog's sizes once its open animation has finished (contract revision 13). I didn't rerun UC-31 in agent-zero-w0-kit-review-frontend a6.
