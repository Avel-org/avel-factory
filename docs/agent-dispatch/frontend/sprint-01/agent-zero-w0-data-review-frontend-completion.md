# ZERO: w0-data review-frontend, completion report

verdict: PASS

## Summary
I reviewed Ghost's w0-data a3 (c5bd194 and its report 2ae0473) on the S1-6 joint review base 5165653 (main 9ca0ae1, plus Axis's S1-6 a36d3c8, plus Ghost's a3). The diff meets UI contract section 3, "Which zod the web may import". `apps/web/src` has no classic zod import. `pending-decisions.ts` is a1's schema field for field. Over a 44-case corpus it gives the same success or failure, the same parsed data and the same issue codes and paths as a1's classic schema. `client.ts`'s types still resolve to the contract's real input and output types. No export, `UiError` member or mock surface changed. I have no findings.

## Pre-flight
- Part 2 files, all read: `.claude/agents/zero.md`, `codebase-analysis.md`, `docs/ui-contracts/decisions-approval-page.md` (revision 13; sections 1 to 3 in full, plus section 8), `CR-W2 Pending decisions.md` (sections 1 to 3: the row), `decisions.md` (the S1-6 entries, revisions 9 to 13, and line 630 on a3), Frontend Map v0.6, design library v1.1, `Step 0 and Step 1 plan.md`, and this task doc. My Read first files `API and data reference.md` and `CR-16 Dispatch package contract.md` are present and skimmed. None is missing.
- Branch `frontend/sprint-01/agent-zero-w0-data-review-frontend-a3`, start commit 5165653, `AVEL_BASE` 9ca0ae1.
- Part 7 commands: all available. `node_modules` was absent at start, so I ran `pnpm install --frozen-lockfile --prefer-offline` first. The tests can't resolve `@avel/contract/*` until it's built (its exports point at `dist/`), so the build ran before the tests.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZERO-01 | DONE | this report's commit |
| ZERO-02 | DONE | this report's commit |

**ZERO-01: what I checked.**
- **The diff under review** is Ghost's. c5bd194 changes only `apps/web/src/data/client.ts` (6 lines) and `apps/web/src/data/pending-decisions.ts` (22 lines). 2ae0473 changes only his report. The other 28 files in `git diff 9ca0ae1..HEAD` come from the merge of Axis's S1-6 (75f894d): backend territory, and Axis's own reviews cover them.
- **Every export as section 3 names it:** each file under `apps/web/src/data`, `apps/web/src/lib` and `apps/web/src/router.tsx` has the same `export` lines at HEAD as at 9ca0ae1 (I compared the sorted `^export` lines file by file, and all 9 are the same). So `UiError` and its 13 members, `toUiError`, `ApiError`, `NetworkError`, `decodeErrorBody`, `createApiClient`, `createApi`, `bindApi`, `apiFor`, `useApi`, `createQueryClient`, `parsePendingPage`, `selectPendingPages` and the rest are as merged and reviewed in a1 and a2.
- **The mock's surface (section 2):** `git diff --stat 9ca0ae1 HEAD -- packages/contract-mock apps/web/test` is empty. Nothing in the mock changed.
- **No field derived on the client:** the diff only rewrites schema method calls (`.regex` to `.check(z.regex)`, `.nullable()` to `z.nullable()`, `.optional()` to `z.optional()`, `.min(1)` to `.check(z.minimum(1))`). It adds no field, transform or default.
- **Territory:** only paths under `apps/web/src/data/**`, Ghost's. Nothing under `apps/web/src` imports `@avel/contract-mock` or the root `@avel/contract`.
- **Verify:** `vitest run test/data` passes, 7 files and 85 tests (see Verification).

**ZERO-02: what I checked.**
- **No classic zod:** the grep check lists nothing. The only zod imports in `apps/web/src` are `pending-decisions.ts:5` `import * as z from "zod/mini"` and `client.ts:11` `import type * as z from "zod/mini"`.
- **The built client bundle:** `index-*.js` names only zod core's `$Zod*` classes and `ZodMini*`. It has no `superRefine` (a classic-only method; 0 hits). So no classic zod reaches the first load.
- **Field for field:** `ProposalRow` has 16 keys and `FactoryChangeRow` has 10, in the same order as a1, each with the same type, nullability, optionality, regex and minimum. `DecisionChoice` and `CostImpact` didn't change. It's still `z.discriminatedUnion("kind", [ProposalRow, FactoryChangeRow])`. `IsoTime` and `Uuid` still come from `@avel/contract/dto/common`, with the same definitions as before S1-6 (`z.iso.datetime({ offset: true })`, `z.uuid({ version: "v7" })`).
- **The same parse results:** I ran a differential check in my scratchpad (not committed). It runs a1's schema, taken from `main:apps/web/src/data/pending-decisions.ts` on classic zod 4.6.7, against HEAD's module, over 44 inputs. They cover a valid row of each kind, unknown keys (stripped), a missing `approve` or `reject`, `costImpact` (valid, float, null), versions 0, 1.5, `"2"` and 2^53, bad refs, a UUID v4, an upper-case UUID, an offset-less or date-only time, a missing or wrong discriminant, `changeId` `0` and `042`, a 39-character, non-hex or upper-case SHA, bad URLs, null, an array, a string and `{}`. I compared `{ success, data }` or `{ success, issues: [{ code, path }] }`:
  ```
  $ (cd apps/web && node <scratchpad>/diff/run.mts)
  cases=44 same=44 diff=0
  a3 parsePendingPage over the corpus: rows 9 unreadable 35
  a1 successes 9
  ```
- **`client.ts`'s types aren't `unknown`:** `SchemaInput` and `SchemaOutput` now constrain on `z.ZodMiniType`. If the contract's schemas didn't extend it, both would fall silently to `unknown`. A scratch type probe shows they don't:
  - `tsc` passes on these four assertions: `listPending`'s input isn't `unknown`, `decide`'s output isn't `unknown`, `o.resolvedAt` is `string | null`, and `i.version` is `number`.
  - The negative control, `o.nopeField`, fails with TS2339, and the error lists `ProposalDto`'s fields.
- **Verify:** the ZERO-02 command exits 0. It lists no zod line and passes 85 of 85 tests. Its `--stat` lists 31 files, though, not only `apps/web/src/data`: see Deviations 1.

## Findings
none

## Contract to files
- Section 1, "The data core holds CR-W2's row as a Zod schema (in `zod/mini` from Ghost's w0-data a2)": `apps/web/src/data/pending-decisions.ts`.
- Section 3, "Which zod the web may import":
  - The bullet on `pending-decisions.ts`: `apps/web/src/data/pending-decisions.ts`.
  - The bullet on `client.ts`'s type import: `apps/web/src/data/client.ts:11`, and `client.ts:44-54` (`SchemaInput` and `SchemaOutput`).
  - The bullet on `decodeErrorBody`: `apps/web/src/data/errors.ts`, unchanged. It still imports `ErrorBody` from `@avel/contract/errors`, which is now `zod/mini` in Axis's diff (`packages/contract/src/errors.ts`).
- Section 3's export table and the `UiError` table: unchanged files under `apps/web/src/data/**`, `apps/web/src/lib/**` and `apps/web/src/router.tsx`.
- Section 2: `packages/contract-mock/**`, unchanged.
- Section 8, Zero's grep check: done (see ZERO-02).
- UC-01 to UC-07: Fenn's locked tests, `apps/web/test/data/**` (lock 033a4ae), 85 of 85 passing.

## Deviations
1. **ZERO-02's expected line says "only files under apps/web/src/data changed".** On this review base, `git diff "$(git merge-base main HEAD)"..HEAD --stat` also lists Axis's 28 backend files and the two reports. That's because INT built the base as main plus Axis's S1-6 plus Ghost's a3 (decisions.md line 630; commits 75f894d and 5165653). I applied the check to Ghost's own commits (`git show --stat c5bd194 2ae0473`). They touch only `apps/web/src/data/{client,pending-decisions}.ts` and his report. I treated this as the review base's shape, not a defect in the work.
2. **The task is labelled "Attempt a2", but this is a3.** Decisions line 630 says this review applies as written to the a3 diff.

## Limitations
- **The differential check** covers 44 hand-picked inputs, not a property-based search. The issue messages weren't compared on their own. Running both schemas in one process shares classic zod's English locale, so messages would match anyway. The page never shows a row's issue messages: an unparsed row is only counted in `unreadable` (section 1).
- **Bundle size isn't my check** (section 8 makes it Leah's). For reference, my build of this base gives `index` 126.69 + `compiler-runtime` 3.41 + `routes` 19.20 = 149.30 kB gzip. Ghost reported 150.35 kB on d6eacae, before Axis's locale move (07cc98b).

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Fantem and INT:** `pnpm --filter @avel/web test` fails one test outside this diff. It's `test/kit/reason-dialog.test.tsx`, "UC-09 (R7) the kit index has no ReasonDialog value", because `apps/web/src/kit/index.ts:19` still exports `ReasonDialog`. This is the w0-kit lock at 00bf715 (Fenn's R7, revision 13) waiting on Fantem's kit fix. The diff doesn't touch `apps/web/src/kit` or `apps/web/test/kit` (`git diff --stat 9ca0ae1 HEAD -- apps/web/src/kit apps/web/test/kit` is empty), so the failure is already on main at 9ca0ae1.
- **Leah:** on 5165653 (with Axis's 07cc98b), `/`'s first load measures 149.30 kB gzip by Vite's figures (126.69 + 3.41 + 19.20), under the 150 kB of section 8. Ghost's 150.35 kB was measured on d6eacae. The number to hold is yours.
- **INT:** nothing in this review blocks the joint landing of S1-6's two halves.

## Files changed
```
$ git diff --name-only main...HEAD
```
On this review base, the three-dot diff also lists the merged review-base files: Axis's S1-6 and Ghost's a3 (see Deviations 1). The only file I wrote is:
- `docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-data-review-frontend-completion.md`

## Verification
```
$ pnpm --filter "@avel/web..." build
... (contract builds, then apps/web)
apps/web build: dist/client/assets/ReasonDialog-B6-vu8UL.js            5.49 kB │ gzip:   2.60 kB
apps/web build: dist/client/assets/compiler-runtime-CUb8v2iE.js        9.07 kB │ gzip:   3.41 kB
apps/web build: dist/client/assets/routes-DMegCeWW.js                 54.14 kB │ gzip:  19.20 kB
apps/web build: dist/client/assets/index-BXKYhDpi.js                 398.01 kB │ gzip: 126.69 kB
apps/web build: ✓ built in 2.53s
apps/web build: dist/server/server.js                                      261.21 kB │ gzip: 63.20 kB
apps/web build: Done
exit 0

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done
exit 0

$ pnpm lint
> biome check .
Checked 213 files in 193ms. No fixes applied.
exit 0

$ pnpm --filter @avel/web test
 × UC-09 (R7) the kit index has no ReasonDialog value: loadReasonDialog is its only way to the dialog
 FAIL  |web| test/kit/reason-dialog.test.tsx > UC-09 ReasonDialog > UC-09 (R7) ...
AssertionError: the kit index has no ReasonDialog export: expected true to be false
 Test Files  1 failed | 13 passed (14)
      Tests  1 failed | 196 passed (197)
exit 1   (the failure is w0-kit's and already on main; see Issues for other agents)

$ pnpm --filter @avel/web exec vitest run test/data          # ZERO-01
 Test Files  7 passed (7)
      Tests  85 passed (85)

$ ! grep -rnE "from ['\"]zod(/v4)?['\"]" apps/web/src && pnpm --filter @avel/web exec vitest run test/data && git diff "$(git merge-base main HEAD)"..HEAD --stat   # ZERO-02
(no grep line)
 Test Files  7 passed (7)
      Tests  85 passed (85)
 apps/web/src/data/client.ts                        |   6 +-
 apps/web/src/data/pending-decisions.ts             |  22 +-
 ... (Axis's backend files from the review base)
 31 files changed, 777 insertions(+), 474 deletions(-)
exit 0

$ git diff --name-only main...HEAD
(the review base's files, plus this report: see Files changed)
```
