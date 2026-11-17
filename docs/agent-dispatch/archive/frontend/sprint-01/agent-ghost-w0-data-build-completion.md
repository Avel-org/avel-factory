# GHOST: w0-data build, completion report

verdict: DONE

## Summary
Attempt a3: GHOST-03 is done. `data/pending-decisions.ts` is written in `zod/mini`, and `client.ts`'s type import comes from `zod/mini` (`SchemaInput`/`SchemaOutput` constrain on `z.ZodMiniType`). Nothing under `apps/web/src` imports `"zod"` or `"zod/v4"`. On d6eacae (main plus Axis's S1-6 a1), typecheck and lint are clean, and all 196 web unit tests pass. `/`'s first load went from **166.48 kB to 150.35 kB** gzip (−16.13 kB). That's **0.35 kB over the 150 kB budget**, which applies once S1-6's two halves and w0-split a2 are merged (section 8). GHOST-01, 02, 04 and 05 were merged earlier and weren't redone.

## Pre-flight
- **Branch:** `frontend/sprint-01/agent-ghost-w0-data-build-a3`. Its start commit is **d6eacae**, as INT said: main (ab520cd) with Axis's `backend/sprint-01/agent-axis-zod-mini-api-contract-a1` (719a41f) merged. It isn't main.
- **S1-6 check:** `git grep -nE "from ['\"]zod['\"]" packages/contract/src` lists nothing on d6eacae, so I started GHOST-03.
- **Part 2 files:** all present. I used the a2 reading and reread these for GHOST-03:
  - `.claude/agents/ghost.md` (Learned: none)
  - UI contract section 1, section 3's "Which zod the web may import", and section 8
  - `decisions.md`'s S1-6 entries and revision 9/10 entries
  - Axis's a1 report: P0 discoveries and Issues for other agents (719a41f)
  - `packages/contract/src/dto/common.ts` and `value-lists.ts` (`ProposalKind`), on mini
  - CR-W2 sections 2.1 to 2.3 (the row the schema transcribes)

  Files 7 and 8 (the design library and the Step plan) were skimmed. GHOST-03 draws no UI.
- **Part 7 commands:** all available after `pnpm install --frozen-lockfile` and `pnpm --filter @avel/contract build`, since the contract's subpath exports point at `dist`. The lockfile wasn't changed.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| GHOST-01 | DONE (a1, merged; not redone) | db023bf (a1 merge) |
| GHOST-02 | DONE (a1, merged; not redone) | db023bf (a1 merge) |
| GHOST-03 | DONE | c5bd194 |
| GHOST-04 | DONE (a2, merged; not redone) | e0af395 (a2 merge) |
| GHOST-05 | DONE (a2, merged; not redone) | e0af395 (a2 merge) |

## Contract to files
- **UI contract section 3, "Which zod the web may import": `apps/web/src/data/pending-decisions.ts`**
  - `import * as z from "zod/mini"`, the same import style as the contract.
  - The same fields, rewritten in mini forms:
    - `.regex(r)` → `.check(z.regex(r))` (both `ref`s, `changeId`, `headSha`)
    - `.nullable()` → `z.nullable(x)` (`clientName`, and `moduleRunId`, which was the load-time crash on `Uuid.nullable`)
    - `.optional()` → `z.optional(x)` (`approve`, `reject`, `costImpact`)
    - `z.int().min(1)` → `z.int().check(z.minimum(1))` (`version`)
  - `z.literal`, `z.null`, `z.enum(ProposalKind)`, `z.url()`, `z.object`, `z.discriminatedUnion` and `safeParse` are the same calls in mini.
  - No `z.config` of its own (INT, Axis).
- **Same parse results and issue paths, checked against the classic schema.** I ran a throwaway Vitest probe in the worktree with a scratch config, then deleted it; it wasn't committed.
  - It compares a3's `PendingDecisionRow` with a1's classic one. That was the file at d6eacae, with `Uuid` and `IsoTime` rebuilt in classic zod with the same arguments.
  - It runs 26 inputs, including:
    - a valid proposal (with an extra key) and a valid factory_change
    - `version` 0, 1.5 and `"1"`
    - bad refs, a non-v7 UUID, an offsetless date, an unknown `proposalKind`
    - bad `headSha`, `url` and `changeId`; a factory_change with a `missionId`
    - a malformed `approve` and `costImpact`
    - `null`, `3`, `{}`, an unknown `kind`, and a row with several errors at once
  - For each input it compares `success`, and either `data` or every issue's `code`, `path` and `message`. All 26 are identical: 5 parse, with the same data and the extra key stripped, and 21 fail.
- **`apps/web/src/data/client.ts`:** `import type * as z from "zod/mini"`. `SchemaInput`/`SchemaOutput` constrain on `z.ZodMiniType`, which fixes the 14 `unknown`-output errors in `modules/decisions` and `test/data/contract-version.test.ts`.
- **`decodeErrorBody`:** it still uses `ErrorBody` from `@avel/contract/errors` (mini since S1-6). No change was needed.
- **No classic zod in the client bundle:** main's client assets contain classic `ZodString` as well as core's `$ZodString`. a3's contain only `ZodMiniString` and `$ZodString`.
- **`/`'s first load** (section 8): every JS file that the server's HTML for `/` loads or preloads, using Vite's gzip figures. I read the list from the HTML that the built `dist/server/server.js` renders for `GET /`, using a scratch script outside the repo. Main was built from `git archive main` (ab520cd) in my scratchpad.

  | Build | `index` | `compiler-runtime` | `routes` | **first load** | lazy `ReasonDialog` |
  | --- | --- | --- | --- | --- | --- |
  | main ab520cd | 143.87 | 3.41 | 19.20 | **166.48 kB** | 2.60 |
  | a3 c5bd194 (on d6eacae) | 127.74 | 3.41 | 19.20 | **150.35 kB** | 2.60 |

  The saving is **16.13 kB**, all in the entry chunk. That's about what Axis predicted (~16.2 kB: the spike's 17.25 minus the locale).
- **Dependencies added:** none. `zod` 4.6.7 is already in `@avel/web`'s dependencies.
- **`packages/contract-mock`:** unchanged. Its `rows.ts` still uses classic zod (outside section 3's rule) and still typechecks.

## Deviations
1. **The start commit isn't main.** The task doc says to measure main's build first. I did (ab520cd), but I built on d6eacae as INT directed. So `git diff --name-only main...HEAD` lists Axis's S1-6 files too. My commit touches only `apps/web/src/data/{client,pending-decisions}.ts` (`git diff --name-only d6eacae..HEAD`).

## Limitations
- **150.35 kB is 0.35 kB over FM's 150 kB.** Section 8 makes 150 kB the budget once both S1-6 halves and w0-split a2 are merged, and calls anything over it a finding. Leah's study projected 147.8 kB. Cutting further is outside GHOST-03's scope. (zlib −9 on the same three files gives 148.60 kB, but section 8 and the earlier reports use Vite's figure.)
- **Not checked on Axis's latest head (07cc98b, the locale moved to the root entry).** INT said to work on d6eacae. My scratch check of a3 on top of 07cc98b was denied by the sandbox, so I didn't run it.
  - **Expected on 07cc98b:** the web imports only subpaths, so in the browser the row schema's issue messages would have no English locale. Parse results and paths are unchanged, and the page never shows these messages: a bad row is only counted in `unreadable`.
  - The entry chunk should get a little smaller, because the locale leaves it.
  - In tests, the mock imports `@avel/contract` (the root), so the locale is still set in the test process.
  - The joint landing should rerun the 196 tests and the size on Axis's head.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT:**
  - c5bd194 lands together with Axis's S1-6 (one merge). It fixes Axis's P0: no more `Uuid.nullable` load crash, and none of the 15 type errors.
  - `/` is at 150.35 kB on d6eacae, 0.35 kB over the 150 kB that section 8 sets once all three are merged. Rerun on Axis's head (07cc98b) at the joint landing.
- **Leah:** your re-review number on d6eacae is 166.48 → 150.35 kB (Vite gzip, three files).
- **Zero and Zane:** section 8's grep lists nothing (below).

## Files changed
`git diff --name-only main...HEAD` (includes the base's S1-6 merge, Deviation 1):
```text
apps/web/src/data/client.ts
apps/web/src/data/pending-decisions.ts
biome.json
docs/agent-dispatch/backend/sprint-01/agent-axis-zod-mini-api-contract-completion.md
packages/contract/** (23 files, Axis's S1-6)
tools/docs/src/openapi.ts
```
Mine (`git diff --name-only d6eacae..HEAD`, plus this report):
```text
apps/web/src/data/client.ts
apps/web/src/data/pending-decisions.ts
docs/agent-dispatch/frontend/sprint-01/agent-ghost-w0-data-build-completion.md
```

## Verification
GHOST-03's verify:
```text
$ ! grep -rnE "from ['\"]zod(/v4)?['\"]" apps/web/src && echo "grep: none"
grep: none
$ pnpm --filter "@avel/web..." typecheck
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done
$ pnpm --filter @avel/web exec vitest run test/data
 Test Files  7 passed (7)
      Tests  85 passed (85)
$ pnpm --filter "@avel/web..." build 2>&1 | grep -E 'client/assets/.*js'
apps/web build: dist/client/assets/ReasonDialog-UES3l-Ab.js            5.49 kB │ gzip:   2.60 kB
apps/web build: dist/client/assets/compiler-runtime-CUb8v2iE.js        9.07 kB │ gzip:   3.41 kB
apps/web build: dist/client/assets/routes-FLB__n5v.js                 54.14 kB │ gzip:  19.20 kB
apps/web build: dist/client/assets/index-Czh40b8Z.js                 401.13 kB │ gzip: 127.74 kB
```
Main's build (ab520cd, for the baseline):
```text
apps/web build: dist/client/assets/ReasonDialog-CYioizXw.js            5.49 kB │ gzip:   2.60 kB
apps/web build: dist/client/assets/compiler-runtime-CUb8v2iE.js        9.07 kB │ gzip:   3.41 kB
apps/web build: dist/client/assets/routes-DUdz7dab.js                 54.14 kB │ gzip:  19.20 kB
apps/web build: dist/client/assets/index-CYZABb1C.js                 461.83 kB │ gzip: 143.87 kB
```
The scripts in `/` from the rendered HTML: a3 `/assets/index-Czh40b8Z.js`, `/assets/compiler-runtime-CUb8v2iE.js`, `/assets/routes-FLB__n5v.js` (status 200); main has the same three with its own hashes.

Part 7:
```text
$ pnpm --filter "@avel/web..." build
(exit 0; client assets as above)
$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
packages/contract-mock typecheck$ tsc -p tsconfig.json --noEmit
packages/contract-mock typecheck: Done
apps/web typecheck$ node -e "import('vite').then((vite) => vite.resolveConfig({}, 'build'))" && tsc -p tsconfig.json
apps/web typecheck: Done
(exit 0)
$ pnpm lint
> biome check .
Checked 213 files in 145ms. No fixes applied.
(exit 0)
$ pnpm --filter @avel/web test
 Test Files  14 passed (14)
      Tests  196 passed (196)
(exit 0)
$ git diff --name-only main...HEAD
(as in Files changed; outside Part 5 only the base's S1-6 paths, Deviation 1)
$ python3 scripts/check_locks.py
(no output, exit 0)
```
