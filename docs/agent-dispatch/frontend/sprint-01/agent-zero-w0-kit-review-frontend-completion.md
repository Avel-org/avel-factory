# ZERO: w0-kit review-frontend, completion report

verdict: PASS

## Summary
Attempt a6 reviews Fantem's w0-kit a5 (1ed1a93, base 9ca0ae1): R7 under revision 13. `kit/index.ts` exports no `ReasonDialog` value, only `export type { ReasonDialogProps }` and `loadReasonDialog`. The locked kit tests pass (75/75). On my own scratch build with the page on `loadReasonDialog`, the dialog gets its own full chunk, outside `/`'s first load. `/`'s route chunk grows by 16 B raw / 8 B gzip. That growth is the loader R7 itself requires, not a kit defect. I've filed it as a P3 against R7's wording (w0-kit-zero-05) for INT to rule on. It doesn't block the merge.

## Pre-flight
- **Part 2 files, all read and none missing:**
  - `.claude/agents/zero.md`
  - `codebase-analysis.md`
  - `docs/ui-contracts/decisions-approval-page.md`, revision 13: sections 0, 4, 7 and 8 in full, the rest by heading
  - `CR-W2 Pending decisions.md`, skimmed: nothing in it touches R7
  - `decisions.md`: "Revision 10" to "Revision 13" in full
  - `Frontend Map v0.6.md`, skimmed for "What every module looks like" (named exports, a light `index.ts`)
  - the design library, checked for the components the kit ports; a5 changes no DL value
  - `Step 0 and Step 1 plan.md`, skimmed
  - this task doc
- **Read-first files:** `API and data reference.md` and `CR-16 Dispatch package contract.md` are both present.
- **Earlier findings read:** w0-kit-brennan-01 and w0-kit-zero-01 to 04.
- **Branch:** `frontend/sprint-01/agent-zero-w0-kit-review-frontend-a6`, started at 1ed1a93 (Fantem's a5 result). `AVEL_BASE` is 9ca0ae1, which is the same as `git merge-base main HEAD` and main's tip.
- **Locks:** `locks.md` has w0-kit at 00bf715 (`apps/web/test/kit/**`). The diff doesn't touch it.
- **Part 7 commands:** all available. The worktree first needed `pnpm install --frozen-lockfile`.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZERO-01 | DONE (re-run on a5: the kit's tests pass; the grep lists nothing) | f3d3355 |
| ZERO-02 | DONE (re-run on a5: kit.css isn't in the diff, so no px literal is added) | f3d3355 |
| ZERO-03 | DONE (re-run on a5: no `gridTemplateColumns`; DecisionTag.tsx and kit.css aren't in the diff) | f3d3355 |
| ZERO-04 | DONE: R7 meets revision 13, and the split holds. The route chunk is +8 B gzip (w0-kit-zero-05, P3, wording) | f3d3355 |

ZERO-01 to 03 were reviewed in full in a1 to a4. a5 changes only `kit/index.ts`, so their checks still hold and their results don't change.

## Findings
- `docs/agent-dispatch/frontend/sprint-01/findings/w0-kit-zero-05-r7-route-chunk-grows-by-the-loader-itself.md`. P3, open. R7 says "`/`'s route chunk doesn't grow", but the loader R7 requires adds 16 B raw / 8 B gzip once the page calls it. INT rules on it; no kit change.
- `docs/agent-dispatch/frontend/sprint-01/findings/w0-kit-zero-03-r7-split-fails-with-static-export.md`. P2, now **fixed (50728f8)**. I added a "Closed (a6)" section with the evidence.

## Contract to files
- **R7, revision 13, "`index.ts` exports no `ReasonDialog` value… may keep `export type { ReasonDialogProps }`":** met. `apps/web/src/kit/index.ts:19` is `export type { ReasonDialogProps } from "./ReasonDialog";`. `grep -n ReasonDialog apps/web/src/kit/index.ts` lists only line 19, the comment (23-25) and the loader (27-29).
- **R7, "`loadReasonDialog(): Promise<{ ReasonDialog: typeof ReasonDialog }>`… `() => import("./ReasonDialog")`":** met. `index.ts:27-29` keeps the same name and return type. 08055c2 changes a function declaration into the arrow R7 spells out. The behaviour is the same, and the typecheck and every importer pass. I read "loadReasonDialog unchanged" (ZERO-04) as unchanged in contract and behaviour, which holds.
- **R7, "the build must split":**
  - **The dialog has a chunk of its own:** met. On the scratch copy, `ReasonDialog-*.js` is 5491 B raw / 2573 B gzip -9 and holds the whole dialog. `grep -c av-dialog` finds it once there and not at all in routes or index. It's the same as main's chunk except for chunk hashes.
  - **It's outside the first load:** met. The start manifest's `"/"` entry preloads only `/assets/routes-D_vi4f9U.js`, `__root__` preloads `index-*` and `compiler-runtime-*`, and nothing in the manifest names `ReasonDialog`.
  - **"The route chunk doesn't grow":** missed by 16 B raw / 8 B gzip, which is the loader itself (w0-kit-zero-05).
- **UC-09 (R7), locked at 00bf715:** passes, as part of `vitest run test/kit` (3 files, 75 tests).
- **FM, light `index.ts` and named exports:** the index still exports names only.
- **Nothing in `apps/web/src` imports a `ReasonDialog` value from the index.** `DecisionsScreen.tsx:34` takes `type ReasonDialogProps` only, and `@avel/web`'s typecheck passes.

### My scratch build (ZERO-04)
- **The copies:** three `git archive` copies in this session's scratchpad: main 9ca0ae1, HEAD 1ed1a93, and HEAD with the page on the loader. Each ran `pnpm install --frozen-lockfile --offline`, then `pnpm --filter "@avel/web..." build`.
- **The page edit,** in the third copy only (`DecisionsScreen.tsx`):
  ```
  34a35
  >   loadReasonDialog as loadKitReasonDialog,
  105c106
  <   reasonDialogModule ??= import("../../../kit/ReasonDialog").then(
  ---
  >   reasonDialogModule ??= loadKitReasonDialog().then(
  ```

| Client chunk: raw B / `gzip -9c` B (Vite's gzip kB) | main | HEAD as committed | HEAD, page on `loadReasonDialog` |
| --- | --- | --- | --- |
| `ReasonDialog-*.js` | 5491 / 2573 (2.60) | 5491 / 2573 | 5491 / 2573 (2.60) |
| `routes-*.js` | 54146 / 18921 (19.20) | 54146 / 18921, identical to main's (`cmp`) | 54162 / 18929 (19.21) |
| `index-*.js` | 461834 / 142042 (143.88) | the same | 461834 / 142040 (143.88) |
| `compiler-runtime-*.js` | 9078 / 3460 (3.41) | the same | 9078 / 3460 |

These numbers match the ones Fantem reported for a5.

## Deviations
- **ZERO-01 to 03 were re-run, not re-reviewed line by line.** a5's diff touches only `kit/index.ts`, and those reviews were done on a1 to a4.
- **I changed finding w0-kit-zero-03's status to fixed.** It's my own finding file, inside Part 5's `w0-kit-zero-*.md`, and this diff is its fix.
- **The scratch copies stay in this session's scratchpad.** They're outside the repository and not committed.

## Limitations
- I didn't run UC-31 (Playwright). The kit's dialog is unchanged in a5, and w0-kit-zero-04's fix is Fenn's locked e2e change (d6994d7, already on main). I haven't checked w0-kit-zero-04 in this session, so its status stays as it was.
- The split is shown only on a scratch copy. The page still deep-imports `kit/ReasonDialog` until Leon's a3.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT:**
  - Rule on w0-kit-zero-05: accept +8 B gzip as meeting R7's intent and have R7 reworded (my recommendation), or hold the letter, which would be Leon's page to shape.
  - w0-kit a5 can merge.
- **Leon (a3):** once a5 merges, import `loadReasonDialog` from `"../../../kit"`. The comment at `DecisionsScreen.tsx:100-101`, "a dynamic import of the index would land in the same chunk…", no longer describes the reason for the deep import, so it needs rewriting.
- **Zero (contract):** INT ruled on w0-kit-zero-05 after this report: accept the 8 bytes (option (a)), and reword R7 in revision 14. The finding records the ruling. The contract edit is mine, in the main checkout.

## Files changed
At my last check (before this report's commit), `git diff --name-only main...HEAD` lists Fantem's two a5 files plus my two findings. This report adds itself:
```
apps/web/src/kit/index.ts                                                                  (Fantem, a5: under review)
docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build-completion.md             (Fantem, a5: under review)
docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-kit-review-frontend-completion.md     (mine)
docs/agent-dispatch/frontend/sprint-01/findings/w0-kit-zero-03-r7-split-fails-with-static-export.md   (mine)
docs/agent-dispatch/frontend/sprint-01/findings/w0-kit-zero-05-r7-route-chunk-grows-by-the-loader-itself.md   (mine)
```
My commits change only Part 5 paths.

## Verification
The task verifies, run at 1ed1a93:
```
$ pnpm --filter @avel/web exec vitest run test/kit
 Test Files  3 passed (3)
      Tests  75 passed (75)

$ ! grep -rn '@orpc\|@tanstack/react-router\|#[0-9a-fA-F]\{6\}' apps/web/src/kit
(no output; exit 0)

$ ! grep -n 'gridTemplateColumns' apps/web/src/kit/DecisionTag.tsx
(no output; exit 0)

$ git diff "$(git merge-base main HEAD)"..HEAD -- apps/web/src/kit/kit.css | grep '^+' | grep -nE '[0-9]+px'
(no output: kit.css isn't in the diff)

$ grep -n 'ReasonDialog' apps/web/src/kit/index.ts
19:export type { ReasonDialogProps } from "./ReasonDialog";
23: * index's only way to the dialog (revision 13): the index exports no ReasonDialog value, only its
24: * props type, so ReasonDialog and Dialog build into a chunk of their own, outside `/`'s first load.
25: * It's R7's `() => import("./ReasonDialog")` as written: the arrow minifies smaller than a function.
27:export const loadReasonDialog = (): Promise<{
28:  ReasonDialog: typeof import("./ReasonDialog").ReasonDialog;
29:}> => import("./ReasonDialog");

$ git diff "$(git merge-base main HEAD)"..HEAD --stat     (the builder's diff, before my commits)
 apps/web/src/kit/index.ts                          |  14 +-
 .../agent-fantem-w0-kit-build-completion.md        | 251 ++++++---------------
 2 files changed, 77 insertions(+), 188 deletions(-)
```

Part 7, run in this worktree:
```
$ pnpm --filter "@avel/web..." build          # exit 0
packages/contract build: Done
apps/web build: dist/client/assets/ReasonDialog-BLJYVQce.js            5.49 kB │ gzip:   2.60 kB
apps/web build: dist/client/assets/compiler-runtime-CUb8v2iE.js        9.07 kB │ gzip:   3.41 kB
apps/web build: dist/client/assets/routes-rEFXJ-4c.js                 54.14 kB │ gzip:  19.20 kB
apps/web build: dist/client/assets/index-BNrD8qk7.js                 461.83 kB │ gzip: 143.88 kB
apps/web build: ✓ built in 1.24s
apps/web build: ✓ built in 145ms
apps/web build: Done

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck   # exit 0
Scope: 3 of 6 workspace projects
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done

$ pnpm lint                                    # exit 0
Checked 213 files in 151ms. No fixes applied.

$ pnpm --filter @avel/web test                 # exit 0
 Test Files  14 passed (14)
      Tests  197 passed (197)

$ git diff --name-only main...HEAD             # before my commits
apps/web/src/kit/index.ts
docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build-completion.md
```
