# FANTEM: w0-kit build, completion report

verdict: PARTIAL

## Summary
Attempt a5 did only FANTEM-07. `kit/index.ts` no longer exports a `ReasonDialog` value. It keeps the type `export type { ReasonDialogProps }`, and `loadReasonDialog` is its only way to the dialog. Fenn's locked R7 tests pass unchanged (75/75 kit tests, 197/197 for the web).

On the scratch copy with the page on `loadReasonDialog`, the split holds. `ReasonDialog`'s chunk holds the whole dialog and Dialog (2.60 kB gzip), byte-identical to main's. No dialog code is in `/`'s route chunk. But that route chunk is **16 bytes raw and 8 bytes gzip bigger than main's**: Vite shows 19.21 kB against 19.20 kB. That misses the letter of "no bigger than main's", and the kit can't close the gap (Deviations 1). That one criterion is why the verdict is PARTIAL rather than DONE. INT decides whether 8 bytes counts as "doesn't grow".

## Pre-flight
- Part 2 files, all read: `.claude/agents/fantem.md`; `codebase-analysis.md`; `docs/ui-contracts/decisions-approval-page.md` (revision 13; sections 0, 4 and 5 in full); `CR-W2 Pending decisions.md` (skimmed: nothing in it touches R7); `decisions.md` ("Revision 13" in full, the rest by heading); `Frontend Map v0.6.md` ("What every module looks like": named exports, light `index.ts`); the design library (ReasonDialog `Go`, for reference only: no DL value changes in a5); `decisions-brennan-01.md`; `decisions-zero-02-…md`; `w0-kit-zero-03-…md`; and this task doc. None missing.
- Branch `frontend/sprint-01/agent-fantem-w0-kit-build-a5`, start commit `9ca0ae1` (main). `locks.md`'s w0-kit line is at `00bf715` (Fenn's R7 tests), as the a5 note requires.
- Part 7 commands: all available. The fresh worktree first needed `pnpm install --frozen-lockfile`. The lockfile is unchanged.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| FANTEM-01 | DONE (a1, merged) | |
| FANTEM-02 | DONE (a1, merged) | |
| FANTEM-03 | DONE (a2, merged) | |
| FANTEM-04 | DONE (a3, merged) | |
| FANTEM-05 | DONE (a4, merged) | |
| FANTEM-06 | DONE (a4, merged) | |
| FANTEM-07 | PARTIAL: built and tested; the route chunk is +8 B gzip on the scratch copy (Deviations 1) | 50728f8, 08055c2 |

## Contract to files
- Section 4, R7, revision 13 ("`index.ts` exports no `ReasonDialog` value… may keep `export type { ReasonDialogProps }`"): `apps/web/src/kit/index.ts:19` is now `export type { ReasonDialogProps } from "./ReasonDialog";`. 50728f8.
- R7, "`() => import("./ReasonDialog")`": `apps/web/src/kit/index.ts:27-29`, now written as that arrow (08055c2). It keeps the same return type, `Promise<{ ReasonDialog: typeof import("./ReasonDialog").ReasonDialog }>`.
- UC-09 (R7), locked: "loadReasonDialog resolves to a module with a ReasonDialog component" and "the kit index has no ReasonDialog value" both pass. So does every other UC-09 test, now that they get the component through `await loadReasonDialog()`.
- "Nothing in `apps/web/src` imports ReasonDialog from the kit index": checked. The only importers of the index are `modules/decisions/screens/DecisionsScreen.tsx` (which takes `type ReasonDialogProps` only, still exported), `modules/decisions/decisions.ts` (types only) and `modules/decisions/screens.ts` (`kitStylesheetHref`). The page's lazy load is still its deep `import("../../../kit/ReasonDialog")`. That's Leon's to switch in a3.

### The split, measured (FANTEM-07's scratch copy)
Method:
- Two `git archive` copies, under this session's scratchpad: `main` (9ca0ae1) and this branch's HEAD.
- Each copy uses this worktree's `node_modules` (pnpm's links are relative).
- In the HEAD copy only, `DecisionsScreen.tsx` changes its loader's `import("../../../kit/ReasonDialog")` to the kit's `loadReasonDialog`, imported from `"../../../kit"` as `loadKitReasonDialog`. The page's memoised promise, `lazy`, prefetch and retry stay as they are.
- `pnpm --filter "@avel/web..." build` in each copy. Exact bytes come from `wc -c`, and gzip from `gzip -9c | wc -c`.

| Client chunk | main (deep import, static export) | HEAD copy, page on `loadReasonDialog` |
| --- | --- | --- |
| `ReasonDialog-*.js` | 5.49 kB, gzip 2.60 kB (5491 B raw, 2573 B gzip -9) | 5.49 kB, gzip 2.60 kB (5491 B raw, 2573 B gzip -9): the whole dialog, Dialog's focus code, `aria-describedby`, the `av-dialog` classes. Not a stub |
| `routes-*.js` (`/`'s route chunk) | 54.14 kB, gzip 19.20 kB (54146 B, 18921 B) | 54.16 kB, gzip 19.21 kB (54162 B, 18929 B): **+16 B raw, +8 B gzip** |
| `index-*.js` (entry) | 461.83 kB, gzip 143.88 kB | 461.83 kB, gzip 143.87 kB |

Compare a4 with the static export (w0-kit-zero-03): there, the dialog's chunk was a 0.07 kB stub and the route chunk grew by 0.90 kB gzip. Revision 13's fix works: the dialog stays out of `/`'s first load.

**Where the 16 bytes are.** I diffed the two route chunks with the chunk hashes normalised. The only code change is one function: the kit's loader, `var Dt=()=>g(()=>import(\`./ReasonDialog-….js\`),__vite__mapDeps([0,1,2]))`. The page's own loader calls it, where main inlines the `import()`. Every other line differs only by minifier renaming.

On this branch as committed, where the page is unchanged, `/`'s route chunk is byte-identical to main's: the same file, `routes-rEFXJ-4c.js`.

## Deviations
1. **`/`'s route chunk is 8 bytes gzip bigger than main's on the scratch copy (16 bytes raw).** The task requires it to be "no bigger than main's". The extra bytes are the kit's `loadReasonDialog` itself:
   - main inlines `import()` in the page;
   - with the page going through the kit, the build keeps one extra function that wraps that `import()`. Rolldown doesn't inline it.

   No form of an exported loader costs zero bytes, so the kit can't remove this. To shrink it, I wrote the loader as R7's own `() => import("./ReasonDialog")` arrow instead of a `function` declaration (08055c2). On the scratch copy that cut the growth from +26 B to +16 B raw. Both versions showed 19.21 kB gzip in Vite's table. I didn't try any page-side shape: that's Leon's module. **INT decides** whether +8 B gzip meets section 4's "`/`'s route chunk doesn't grow", or whether the budget line takes it.
2. **08055c2 changes `loadReasonDialog` from a function declaration to an arrow,** a step beyond "drop the export". It keeps the same name, signature and behaviour, and the locked tests still pass. It's the contract's own wording for R7, and it's the smaller of the two in the build.
3. **The scratch copies weren't deleted:** the session's sandbox denied the `rm -rf`. They sit in this session's scratchpad, outside the repository, and are never committed. Nothing from them is on the branch.

## Limitations
- The split is shown on a scratch copy only. The page still deep-imports `kit/ReasonDialog` until Leon's a3.
- I didn't run UC-31 (Playwright) for a5: the task doesn't ask for it, and the page doesn't change on this branch.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT:** Deviations 1. Rule on whether +8 B gzip on `/`'s route chunk meets R7's "doesn't grow". Leon's a3 can start after this merges: the index has no `ReasonDialog` value, and `loadReasonDialog` is ready.
- **Leon (a3):** import `loadReasonDialog` from `"../../../kit"` and keep your memoised promise and retry around it. With that shape, the dialog's chunk is the full 2.60 kB gzip, measured above. Your comment at `DecisionsScreen.tsx:100-101` no longer holds once the index has no static `ReasonDialog` export.
- **Zero:** section 4 R7's `() => import("./ReasonDialog")` is now the literal form in `index.ts`.

## Files changed
```
apps/web/src/kit/index.ts
docs/agent-dispatch/frontend/sprint-01/agent-fantem-w0-kit-build-completion.md
```

## Verification
FANTEM-07's own check:
```
$ pnpm --filter @avel/web typecheck && pnpm --filter @avel/web exec vitest run test/kit && ! grep -nE '^export \{[^}]*\bReasonDialog\b' apps/web/src/kit/index.ts && grep -n 'loadReasonDialog' apps/web/src/kit/index.ts
> node -e "import('vite').then((vite) => vite.resolveConfig({}, 'build'))" && tsc -p tsconfig.json
 Test Files  3 passed (3)
      Tests  75 passed (75)
27:export const loadReasonDialog = (): Promise<{
```

Part 7:
```
$ pnpm --filter "@avel/web..." build          # exit 0
packages/contract build: Done
apps/web build: dist/client/assets/ReasonDialog-BLJYVQce.js            5.49 kB │ gzip:   2.60 kB
apps/web build: dist/client/assets/routes-rEFXJ-4c.js                 54.14 kB │ gzip:  19.20 kB
apps/web build: dist/client/assets/index-BNrD8qk7.js                 461.83 kB │ gzip: 143.88 kB
apps/web build: ✓ built in 3.16s
apps/web build: ✓ built in 452ms
apps/web build: Done

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck   # exit 0
Scope: 3 of 6 workspace projects
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done

$ pnpm lint                                    # exit 0
> biome check .
Checked 213 files in 331ms. No fixes applied.

$ pnpm --filter @avel/web test                 # exit 0
 Test Files  14 passed (14)
      Tests  197 passed (197)

$ git diff --name-only main...HEAD
apps/web/src/kit/index.ts
```
(The report itself is added in the last commit.)
