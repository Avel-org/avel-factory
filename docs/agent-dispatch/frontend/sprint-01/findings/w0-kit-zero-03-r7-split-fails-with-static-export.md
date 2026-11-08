status: fixed (50728f8; contract revision 13, option (c); checked in agent-zero-w0-kit-review-frontend a6, see its completion report)
severity: P2
title: R7's split condition can't hold while `kit/index.ts` keeps the static `ReasonDialog` export: with the page on `loadReasonDialog`, the dialog moves into `/`'s first load
reviewer: Zero (review-frontend), agent-zero-w0-kit-review-frontend (a4)
under review: 82d4c2b (base b1932d9)
for: INT (a contract decision on R7), then Zero (the contract) and Leon or Nemi, depending on the choice. **Not a defect in the kit:** Fantem did what R7 says to do in this case (export kept, stop and report). It doesn't block the w0-kit merge.

## Where
- `apps/web/src/kit/index.ts:19`: the kept static `export { ReasonDialog, … } from "./ReasonDialog"` (R7: "`index.ts` keeps its named `ReasonDialog` export, which the locked tests use").
- `apps/web/src/kit/index.ts:25-29`: `loadReasonDialog()` is `import("./ReasonDialog")`, matching R7's signature.
- `apps/web/src/modules/decisions/screens/DecisionsScreen.tsx:104-106` (Leon's, unchanged here): the page still deep-imports `../../../kit/ReasonDialog`, so the split holds on this commit.

## What it breaks
UI contract section 4, R7, "The build must still split": with the page loading the dialog through `loadReasonDialog` and nothing in `src` using the static export, `ReasonDialog` and `Dialog` are meant to be in a chunk of their own, outside `/`'s first load. They aren't. Section 5 ("Styles and loading") then tells Leon to use `loadReasonDialog`, which would regress the first load.

## Evidence
On this commit, as is, `pnpm --filter "@avel/web..." build` (client):
```
dist/client/assets/ReasonDialog-Br5xqR0N.js            3.50 kB │ gzip:   1.53 kB
dist/client/assets/routes-C8xPsqGx.js                 46.50 kB │ gzip:  15.83 kB
```
On a scratch copy of this commit (`git archive HEAD`), with only `DecisionsScreen.tsx` changed to call the kit's `loadReasonDialog` (imported from `../../../kit`) instead of the deep import, `vite build` (client):
```
dist/client/assets/ReasonDialog-DDAwrNK9.js            0.05 kB │ gzip:   0.07 kB
dist/client/assets/routes-DncHviNR.js                 49.59 kB │ gzip:  16.73 kB
```
The dialog's own chunk is reduced to a re-export stub, and `/`'s route chunk grows by 0.90 kB gzip. That matches Fantem's report (Deviations 2).

## What fixing it means
INT picks one, and Zero writes it into section 4 R7 and section 5:
- (a) Section 5 keeps the page's one deep dynamic import of `kit/ReasonDialog`, and R7 stays an export the page doesn't use (or R7 is withdrawn);
- (b) a `vite.config.ts` chunking rule (Nemi's territory) pins `src/kit/ReasonDialog.tsx` and `src/kit/Dialog.tsx` to their own chunk, measured before it's adopted;
- (c) the static `ReasonDialog` export leaves `kit/index.ts`, which means Fenn changes the locked UC-09 (R7) identity check under an override.

Until then, Leon shouldn't switch `DecisionsScreen.tsx` to `loadReasonDialog`.

## Closed (a6)
Fantem's w0-kit a5 (50728f8) drops the static `ReasonDialog` value export. `apps/web/src/kit/index.ts:19` is now `export type { ReasonDialogProps } from "./ReasonDialog";`. I built a scratch copy of 1ed1a93 with the page on `loadReasonDialog`. `ReasonDialog-*.js` holds the whole dialog (5491 B raw, 2573 B gzip -9, the same as main's except for chunk hashes), `/`'s route chunk has no `av-dialog` code, and the start manifest preloads only `routes-*.js` for `/`. The route chunk's 16 B raw / 8 B gzip growth is the subject of w0-kit-zero-05.
