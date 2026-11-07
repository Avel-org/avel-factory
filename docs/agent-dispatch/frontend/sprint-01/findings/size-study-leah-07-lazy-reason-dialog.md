status: open
severity: P3
owner: Leon (`DecisionsScreen.tsx`, decisions a2, already planned)

# Size study 07a: the lazy `ReasonDialog`, measured (candidate 7, from the attribution)

**Measurement, not a defect.** Baseline `/` first load 174.35 kB gzip. My a1 report (`decisions-leah-01`) estimated this at "about 1.7 kB". This replaces the estimate.

## Saving
| | first load, vite gzip | brotli 11 | change |
| --- | --- | --- | --- |
| baseline | 174.35 kB | 149.37 | |
| `ReasonDialog` (and `Dialog`) behind `React.lazy` | 157.39 + 16.23 = **173.62** | 148.73 | **-0.73 gzip, -0.64 brotli** |

The lazy chunk is `ReasonDialog-*.js`, 3.42 kB raw, 1.50 kB gzip, loaded after a tap, so it is not part of the first load (section 8). The first-load saving is half of the chunk's size: the route chunk drops 0.81 (17.04 -> 16.23) and the entry grows 0.08, because a separate chunk loses the compression the dialog shared with the rest. The other 0.77 kB of the chunk's 1.50 is bytes that now compress less well on their own; I didn't break it down further.

## Level: A
Production build + mock + Chromium at 390x844: 4 rows in the HTML, hydrates cleanly, tapping Approve opens the dialog (so the chunk loaded), and approve with a reason works. I did not record the request for the chunk.

## What I built (scratch)
```tsx
const ReasonDialog = lazy(() =>
  import("../../../kit/ReasonDialog").then((m) => ({ default: m.ReasonDialog })),
);
// …
{dialog && copy ? (<Suspense fallback={null}><ReasonDialog open … /></Suspense>) : null}
```
`ReasonDialog` is imported from its own file and dropped from the `../../../kit` import. I did not try the import through the kit's `index.ts`; a static re-export there may keep it in the entry. The e2e's `getByRole("dialog")` waits for it; on a slow link the dialog appears one request after the tap, so Leon's planned prefetch (on pointer-down, idle or the row's first paint) matters for INP.

## Cost and risk
Leon only; no contract line (section 5 "Styles and loading" already asks for it), no locked test. The kit's `index.ts` must not import the dialog in a way that drags it into the entry (Fantem's file; Zero's review of the kit). Risk: the tap-to-dialog delay on a phone; hydration is unaffected (the dialog mounts after a click).

## Recommendation: do now (it is already planned)
Small, but free and already scheduled. Don't count on 1.7 kB.
