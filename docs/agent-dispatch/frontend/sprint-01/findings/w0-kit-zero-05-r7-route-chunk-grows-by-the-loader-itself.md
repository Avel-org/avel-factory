status: accepted (INT, option (a)); R7 reworded in contract revision 14 (pending, written in the main checkout)
severity: P3
title: R7 says "`/`'s route chunk doesn't grow", but the loader R7 requires adds 16 B raw / 8 B gzip to it once the page calls it. No kit change can remove that, so the wording needs INT's ruling.
reviewer: Zero (review-frontend), agent-zero-w0-kit-review-frontend (a6)
under review: 1ed1a93 (base 9ca0ae1)
for: INT (a ruling), then Zero (the R7 wording in the next contract revision). **Not a defect in the kit,** and it doesn't block the w0-kit merge.

## Where
- `apps/web/src/kit/index.ts:27-29`: `export const loadReasonDialog = (): Promise<…> => import("./ReasonDialog");` is R7's own `() => import("./ReasonDialog")`.
- UI contract section 4, R7, revision 13, third bullet: "with the page on `loadReasonDialog`, `ReasonDialog` and `Dialog` are in a chunk of their own, outside `/`'s first load, and `/`'s route chunk doesn't grow."

## What it breaks
Only the last clause of that bullet, read literally. The rest of it holds: the dialog has its own chunk, and that chunk isn't in `/`'s first load.

## Evidence
I made three scratch copies from `git archive` (main 9ca0ae1, HEAD 1ed1a93, and HEAD with the page switched to the kit's loader), ran `pnpm install --frozen-lockfile --offline` in each, then ran `pnpm --filter "@avel/web..." build`. The only edit is in the third copy, `DecisionsScreen.tsx`: it adds `loadReasonDialog as loadKitReasonDialog` to the kit import and changes `import("../../../kit/ReasonDialog").then(` to `loadKitReasonDialog().then(`. The page keeps its memoised promise, `lazy`, prefetch and retry as they were.

| Client chunk (raw / `gzip -9c \| wc -c`) | main | HEAD as committed | HEAD, page on `loadReasonDialog` |
| --- | --- | --- | --- |
| `ReasonDialog-*.js` | 5491 / 2573 | 5491 / 2573 | 5491 / 2573 (the same as main's except for chunk hashes) |
| `routes-*.js` (`/`'s route chunk) | 54146 / 18921 | 54146 / 18921 (`cmp`: identical) | **54162 / 18929** |
| `index-*.js` (entry) | 461834 / 142042 | the same | 461834 / 142040 |
| first load (entry + `compiler-runtime` + route), gzip -9 | 164423 | 164423 | 164429 (+6 B) |

Here's the loader in each route chunk:
```
main:      function Zt(){return Xt??=g(()=>import(`./ReasonDialog-BLJYVQce.js`).then(e=>({default:e.ReasonDialog})…
on loader: var Dt=()=>g(()=>import(`./ReasonDialog-BcW3KTee.js`),__vite__mapDeps([0,1,2])) … Dt().then(…)
```
The growth is the one extra function that wraps `import()` (`var Dt=()=>…` plus its call). Rolldown doesn't inline it across modules. Any exported loader costs those bytes, so the kit can't close the gap. In the third copy, the start manifest's `"/"` entry preloads only `/assets/routes-D_vi4f9U.js`, and nothing in it names `ReasonDialog`. `grep -c av-dialog` gives routes 0 and ReasonDialog 1.

## What fixing it means
INT makes one of these rulings:
- (a) **Accept** that +8 B gzip on the route chunk meets R7's intent. The next contract revision then rewords the clause, for example "`/`'s route chunk holds none of the dialog's code; it grows by at most the loader's own call (under 0.05 kB gzip)". The 160/150 kB budget in section 8 already covers the first load as a whole (+6 B here).
- (b) **Hold the letter.** Then the fix is in the page (Leon's), not the kit. For example, the page could call the kit's loader in a shape the minifier folds into its own. That needs measuring on Leon's a3, and it isn't guaranteed to reach zero.

My recommendation is (a). Either way, Fantem has no work to do.

## Ruling (INT, after the a6 report)
INT took option (a): the +8 B gzip is accepted as meeting R7's intent, and R7 is reworded in revision 14. The edit to `docs/ui-contracts/**` is outside this review session's territory (Part 5), so I'll make it in the main checkout. This finding closes once that revision is merged.
