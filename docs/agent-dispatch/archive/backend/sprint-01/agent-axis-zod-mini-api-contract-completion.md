# AXIS: zod-mini api-contract, completion report

verdict: PARTIAL

## Summary
AXIS-01 to AXIS-03 are done and pass their own checks:
- `packages/contract/src` is on `zod/mini` (and `zod/v4/core`, for one type).
- The contract builds, and 61/61 contract tests pass: the 44 locked, plus Rigg's 17.
- `docs/generated/openapi.json` comes out byte for byte the same.
- Biome bans `"zod"` and `"zod/v4"` in `packages/contract/**`.

The verdict is PARTIAL because Part 7's `pnpm typecheck` and `pnpm test` fail in `apps/web`. The web on main builds its own row schemas from the contract's schemas, using classic methods: `apps/web/src/data/pending-decisions.ts:40` calls `Uuid.nullable()`, and `client.ts` constrains on classic `z.ZodType`. So **this branch can't merge to main on its own.** It has to land together with Ghost's w0-data a3, as S1-6 ("Lands together") already requires. Backend can't touch `apps/web`.

**Revision (INT on 719a41f): the locale move, 07cc98b.** INT confirmed the joint landing, on `review-base/s1-6` (d6eacae). INT asked whether the web can skip the English locale (about 1.1 kB gzip). **Yes, and without a new subpath.**
- **The move:** the default now lives only in the root entry `src/index.ts` (`@avel/contract`). `dto/common.ts`, `errors.ts` and `completion-report.ts` no longer set it.
- **Who imports what:** the web imports only subpaths, on this base and on d6eacae: `errors`, `routes/decisions`, `dto/common`, `dto/decisions`, `value-lists`. Its dev-server mock loads on the Node side.
- **Why RIGG-03 stays green with no test change:** the locked tests load `src/index.ts` (`test/helpers/contract.ts`, `ENTRY`).
- **No `package.json` change:** a `locale-en` subpath would need a new `exports` entry. The root needs none.
- **The S1-6 amendment** (the locale, Deviation 2's forms, the memoizer "no", the landing) is in `decisions.md`, at INT's request.
- **One open point for INT: bundling the root.** With `sideEffects: false`, a bundler drops `index.ts`'s own statement when only its re-exports are used. Rolldown did that on a root-only probe. Node without a bundler isn't affected: the server as planned, the mock, tools/docs and the tests. A bundled server or CLI would lose the messages unless `package.json` says `"sideEffects": ["./dist/index.js"]` (packaging-only, no bump, D58; I haven't tested it) or the consumer calls `z.config` itself.
- **Checks after the move:**
  - contract 61/61;
  - `OPENAPI-UNCHANGED`;
  - lint exits 0;
  - in node, the root gives `"Invalid input: expected string, received undefined"` and `dist/dto/decisions.js` alone gives `"Invalid input"`;
  - a rolldown bundle of the web's subpath imports holds no locale strings (`Invalid input: expected` ×0, against ×2 in a bundle that loads the locale).

## Pre-flight
- **Part 2 files, all read:**
  1. `.claude/agents/axis.md`
  2. `codebase-analysis.md`
  3. sprint-01 `decisions.md` (S1-1 to S1-8 in full)
  4. `docs/design/Step 0 and Step 1 plan.md`
  5. sprint-00 `contract.md` (skimmed: nothing in it touches zod's API, only Page and Placeholder, section 4 items 6 and 7)
  6. sprint-00 `decisions.md` (D23, D30, D58 for this module)
  7. S1-6 and S1-8, again
  8. `packages/contract/src/dto/common.ts`
  9. `tools/docs/src/openapi.ts`
  10. `docs/generated/openapi.json`
  11. this task doc

  None is missing.
- **Branch:** `backend/sprint-01/agent-axis-zod-mini-api-contract-a1`, started at `cbb0b19` (main then; it includes Rigg's lock line `zod-mini · 6a49f45`). INT confirmed the merge and the lock in the session. Main has since moved to `b5684fb` (frontend commits). This branch isn't rebased.
- **Part 7 commands:** `pnpm build`, `pnpm typecheck`, `pnpm lint` and `pnpm test` are all available and were all run. `pnpm install --frozen-lockfile --offline` was needed first: the worktree had no `node_modules`.
- **Baseline at cbb0b19** (a scratch detached worktree, since removed):
  - `pnpm typecheck`: exit 0.
  - `pnpm test`: 6 failed / 861 passed. The six are RIGG-01 (expected: classic imports) and 5 web kit tests, UC-08 ×4 and UC-09 ×1, which are frontend and not about zod.
  - The OpenAPI document generates unchanged.
  - The contract has 1 failed / 60 passed.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| AXIS-01 | DONE | 2bb36d4, 07cc98b (the locale moved to the root entry) |
| AXIS-02 | DONE | 45b0a84 |
| AXIS-03 | DONE | 90942dc |

### AXIS-01: the rewrite
- **The import:** every one of the 23 schema files now has `import * as z from "zod/mini"` (codebase-analysis, Conventions). `dto/common.ts` also has `import type * as core from "zod/v4/core"`.
- **How:** a babel-AST codemod, kept in my session scratchpad and not committed. It refused any `.min`/`.max` receiver it couldn't classify as a length or a number, and tsc then confirmed every one: a `z.minLength` on a number schema doesn't typecheck. Biome formatted the result, which reflows some lines. No name, export, comment or order changed.
- **The calls rewritten (335), as counted by the AST:**

  | Classic | zod/mini | Count |
  | --- | --- | --- |
  | `.nullable()` | `z.nullable(x)` | 167 |
  | `.min(n)` | `.check(z.minLength(n))` on strings and arrays, `.check(z.minimum(n))` on numbers | 79 |
  | `.optional()` | `z.optional(x)` | 50 |
  | `.extend(s)` | `z.extend(S, s)` | 15 |
  | `.trim()` | `.check(z.trim())` | 11 |
  | `.int()` | `.check(z.int())` | 3 |
  | `.refine(f, p)` | `.check(z.refine(f, p))` | 2 |
  | `.pick(m)` | `z.pick(S, m)` | 2 |
  | `.max(100)` | `.check(z.maximum(100))` | 1 |

  - Consecutive checks share one `.check(...)`, in the same order (for example `.check(z.trim(), z.minLength(1))`). zod/mini appends them to the same `checks` list as classic's chain.
  - Four calls S1-6 doesn't count, with their mini forms, are under Deviations.
- **S1-6's other counts:**
  - "`.array` 49" are all already `z.array(...)`, unchanged.
  - "`.int` 54" is 51 top-level `z.int()`, unchanged, plus the 3 chained ones.
  - "`.meta` 1" is oRPC's `base.meta(...)` in `routes/route.ts`, not zod (see Deviations).
- **`Page<T>`** is now `<T extends core.$ZodType>`, so classic schemas can still be paged (S1-6, Consumers).
- **One schema object per shared schema (S1-8):** `Placeholder`, `MetricsDto` and `PendingDecisionDto` are still the same object. The byte-identical OpenAPI document shows it: every Placeholder field still points at `MetricsDto`.
- **The English locale:** a guarded default in the root entry `src/index.ts` (07cc98b; at first in the three root schema modules, see Deviations 1). Without it, every issue message turns into "Invalid input".
- **`package.json`:** not changed.

### AXIS-02: openapi.ts
`import { z } from "zod"` is now `import * as core from "zod/v4/core"`. The `instanceof` check is now `core.$ZodType`, and so is the `Record` value type on the line above it, which named `z.ZodType` and can't keep it once the import goes. Nothing else changed.

### AXIS-03: biome.json
One `overrides` entry for `packages/contract/**`: `style/noRestrictedImports` at level `error`, with `paths` banning `"zod"` and `"zod/v4"`. Each message points at `zod/mini` (and `zod/v4/core`).

The planted check, run once and then removed. I appended this to `packages/contract/src/dto/health.ts`:
```ts
import { z as classic } from "zod";
import * as v4 from "zod/v4";
export const Planted = [classic.string(), v4.string()];
```
```text
$ pnpm lint   # exit 1
packages/contract/src/dto/health.ts:25:30 lint/style/noRestrictedImports ━━━━━━━━━━━━━━━━━━━━━━━━━━━
  × Classic zod is banned in packages/contract (decisions.md S1-6): import * as z from "zod/mini" (or zod/v4/core for types and classes shared with classic).
packages/contract/src/dto/health.ts:26:21 lint/style/noRestrictedImports ━━━━━━━━━━━━━━━━━━━━━━━━━━━
  × Classic zod is banned in packages/contract (decisions.md S1-6): import * as z from "zod/mini" (or zod/v4/core for types and classes shared with classic).
Found 3 errors.
```
- The third error is `organizeImports`, for imports placed after code.
- To show that no other rule changed, I planted a `debugger;` in the same file: `lint/suspicious/noDebugger` still fires under the override.
- Both plants were removed, and `pnpm lint` exits 0 again.

## Contract to files
| Item | Files |
| --- | --- |
| S1-6 "What changes": every schema on zod/mini | `packages/contract/src/{completion-report,errors}.ts`, all 21 `packages/contract/src/dto/*.ts` |
| S1-6 "The `Page<T>` constraint becomes `$ZodType`" | `packages/contract/src/dto/common.ts` |
| S1-6 spike check 2: the OpenAPI document is unchanged | `tools/docs/src/openapi.ts` |
| S1-6 "Lint: noRestrictedImports bans zod" | `biome.json` |
| S1-6 "What doesn't change": S1-3's details and messages | the locale default in `src/index.ts` (root entry only) |
| S1-8: shared schemas stay one object | unchanged aliases in `dto/metering.ts` and `dto/decisions.ts`; byte-identical `openapi.json` |
| RIGG-01, RIGG-02, RIGG-03 | all of the above; 17/17 pass |
| The 44 locked tests | 44/44 pass |

## Deviations
1. **The English locale: a change the task doc doesn't list, needed to keep S1-3 and pass RIGG-03.**
   - **The cause:** classic `zod` registers English as the default locale on its first schema (`zod/v4/classic/schemas.js:9-13`, `_ensureDefaultLocale`: only if `globalConfig.localeError` isn't set). `zod/mini` never does.
   - **What I saw:** with the whole contract on mini, RIGG-03 failed on 7 cases. Every message became `"Invalid input"` instead of, for example, `"Invalid input: expected string, received undefined"`.
   - **Why it matters on the wire:** S1-3 makes `ErrorBody.message` and `issues[].message` these messages.
   - **The spike's check 5 didn't catch this.** Its half-moved contract still imported classic zod, and that set the locale for the whole process.
   - **The fix:** `if (!z.core.globalConfig.localeError) z.config(z.locales.en());`, the same rule classic follows, so an explicit `z.config()` locale still wins.
     - **At 2bb36d4:** the guard was in `dto/common.ts`, `errors.ts` and `completion-report.ts`, so every subpath set it.
     - **Since 07cc98b (INT):** it's in `src/index.ts` only, so the web, which uses subpaths only, doesn't pay for it. Code that wants S1-3's messages imports the root entry once (see the Revision in the Summary).
   - **Its cost:** about 1.1 kB gzip. Rolldown (Vite 8, the web's bundler), minified: 5,240 B without it and 6,335 B with it, on a small mini schema. esbuild doesn't tree-shake `z.locales` and pulls in every locale (80 kB). That matters only if someone bundles the contract with esbuild.
   - **Recorded** in sprint-01 `decisions.md` as an S1-6 amendment, at INT's request. That file is outside Part 5; INT asked for it in so many words.
2. **`.extract` (3), `.exclude` (1) and `.loose` (1) aren't in S1-6's list.** zod/mini has none of them as methods. The forms I used keep the types (RIGG-02) and the OpenAPI output (byte-identical):
   - `.extract([...])` became `z.enum([...] as const satisfies readonly List[])`, in `dto/agent.ts` (`EscalationKind`), `dto/gates.ts` and `dto/your-work.ts`. The same values in the same order, and tsc still checks that each one is in the value list. Biome then made `ProposalKind` an inline `type` import in `agent.ts`. The runtime "Key not found" throw is now a compile error.
   - `.exclude(["proposed"])` became `z.enum(FactStatus.filter((v): v is Exclude<FactStatus, "proposed"> => v !== "proposed"))`, in `dto/gate0.ts`. It's still derived from `FactStatus`, in order: `["confirmed", "rejected"]`.
   - `.loose()` became `z.looseObject(shape)`, in `dto/events-and-traces.ts` (`MissionCreatedPayload`). It's the same `catchall: unknown()` as classic's `.loose()`.
3. **The task's `.meta` call isn't zod.** The only `.meta(` in `packages/contract/src` is oRPC's `base.meta({ write, stepUp, caller, routeNo })` in `routes/route.ts:25`. That's route metadata, not a zod schema's, so it's unchanged. The byte-identical document shows nothing it carried was lost.
4. **openapi.ts:** besides the check and its import, the `Record<…, { schema: z.ZodType … }>` annotation on the same function is now `core.$ZodType`. It named the removed import.
5. **Part 7's typecheck and test aren't green**, because of `apps/web`. See Issues for other agents and P0 discoveries.

## Limitations
- **The size number isn't mine.** It's the spike's: `index-*.js` went from **173.53 kB to 156.28 kB** gzip (17.25 kB) with both packages on mini. Since 07cc98b the locale isn't in the web's bundle, so the spike's figure stands. Leah measures the real number at the joint landing.
- **The memoizer:** classic also sets a default parse memoizer (`_ensureDefaultMemoizer`), and mini doesn't. It only changes the outcome for cyclic JavaScript object graphs passed to a recursive schema (`z.json()`). JSON from the wire can't be cyclic, so it isn't added (INT: no).
- **Rigg's done-when 5 build test (5 s timeout) is flaky.** It failed once, in my first contract run (5,817 ms), and passed in the three runs after. I didn't change it: it's locked.

## Parked chains
none

## P0 discoveries
- **Merging this branch to main alone breaks the web.** It fails at type level and at runtime:
  - **Runtime:** `apps/web/src/data/pending-decisions.ts:40` runs `moduleRunId: Uuid.nullable()` at module load. On mini, `Uuid.nullable` is `undefined`: `node -e "…(await import('./dist/dto/common.js')).Uuid.nullable"` prints `undefined`. The web tests fail with `TypeError: Uuid.nullable is not a function` while loading. That's 5 files: `test/data/pending-decisions.test.ts`, and `test/modules/decisions/{contract-version,deciding,errors,list}.test.tsx`.
  - **Types:** `pnpm typecheck` gives 15 errors in `apps/web`: `pending-decisions.ts(40,21)`, `modules/decisions/api.ts` ×3, `DecisionsScreen.tsx` ×9 and `test/data/contract-version.test.ts` ×2.
    - The first is the missing `.nullable`.
    - The rest come from `client.ts:47,52`, whose `NonNullable<S> extends z.ZodType` (classic) is false for mini schemas, so the outputs become `unknown`.
  - S1-6's spike notes for Ghost already name both fixes.
- **What fixes it:** INT sequences the two halves into one landing. Ghost's w0-data a3 is built on top of this branch (or this branch's commits), and both merge together. Or main takes a merge commit containing both, with no CI run in between. Merging this branch first and Ghost's after, as INT's message has it, leaves main red in between.

## Issues for other agents
- **INT:**
  - the merge sequencing: answered, a joint landing on `review-base/s1-6`;
  - the S1-6 amendment: recorded in `decisions.md`;
  - the memoizer: answered, no;
  - **open:** whether to add `"sideEffects": ["./dist/index.js"]` before anything bundles the root entry (Revision, in the Summary).
- **Zero and Ghost (frontend, through INT):**
  - `pending-decisions.ts` needs mini forms for every chained call on contract schemas. Line 40's `Uuid.nullable()` is the first; then `z.int().min(1)`, `z.string().nullable()` and the rest.
  - `client.ts`'s `SchemaInput`/`SchemaOutput` should constrain on `$ZodType` (from `zod/v4/core`) or `z.ZodMiniType`.
  - The web's subpath imports don't set the English locale (07cc98b), so the web's own zod messages are mini's plain `"Invalid input"`. A field error the web shows from its own parse needs its own text, or `z.config(z.locales.en())` in the web if you want English and accept about 1.1 kB. Messages that come from the server in `ErrorBody` are unaffected.
  - The 5 UC-08/UC-09 kit failures are pre-existing at cbb0b19, and not caused by this branch.
- **Brennan (review-spec):**
  - Deviation 1 is the one judgement call: the locale lives in the root entry, with the bundling point open.
  - The `satisfies`/`filter` enum forms are Deviation 2.
  - The codemod isn't committed. The diff is the evidence, and `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated/openapi.json` reproduces check 2.
- **Leah:** the locale isn't in the web's bundle (07cc98b), so the spike's 17.25 kB should hold.

## Files changed
```text
$ git diff --name-only main...HEAD
biome.json
docs/agent-dispatch/backend/sprint-01/agent-axis-zod-mini-api-contract-completion.md
docs/agent-dispatch/backend/sprint-01/decisions.md
packages/contract/src/completion-report.ts
packages/contract/src/dto/agent.ts
packages/contract/src/dto/audit.ts
packages/contract/src/dto/auth.ts
packages/contract/src/dto/clients.ts
packages/contract/src/dto/common.ts
packages/contract/src/dto/decisions.ts
packages/contract/src/dto/dispatch-package.ts
packages/contract/src/dto/dispatches.ts
packages/contract/src/dto/evals.ts
packages/contract/src/dto/events-and-traces.ts
packages/contract/src/dto/factory.ts
packages/contract/src/dto/gate0.ts
packages/contract/src/dto/gates.ts
packages/contract/src/dto/health.ts
packages/contract/src/dto/library.ts
packages/contract/src/dto/metering.ts
packages/contract/src/dto/missions.ts
packages/contract/src/dto/packages.ts
packages/contract/src/dto/plan.ts
packages/contract/src/dto/receipts.ts
packages/contract/src/dto/your-work.ts
packages/contract/src/errors.ts
packages/contract/src/index.ts
tools/docs/src/openapi.ts
```
Every path is inside Part 5, except `decisions.md`, which INT asked for. No `packages/contract/test/**` path or `locks.md` path is touched.

## Verification
The task checks:
```text
$ pnpm --filter @avel/contract build && pnpm --filter @avel/contract test
 Test Files  6 passed (6)
      Tests  61 passed (61)          # 44 locked + RIGG-01..03 (17); three runs, all 61/61

$ pnpm --filter @avel/docs generate && git diff --exit-code docs/generated/openapi.json && echo OPENAPI-UNCHANGED
wrote erd.md and openapi.json to …/docs/generated
OPENAPI-UNCHANGED
```

Part 7:
```text
$ pnpm build
…
apps/web build: ✓ built in 413ms
apps/web build: Done
exit=0

$ pnpm typecheck
apps/web typecheck: src/data/pending-decisions.ts(40,21): error TS2339: Property 'nullable' does not exist on type 'ZodMiniUUID'.
apps/web typecheck: src/modules/decisions/api.ts(23,33): error TS18046: 'page' is of type 'unknown'.
… (15 errors, all in apps/web; listed under P0 discoveries)
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @avel/web@0.0.0 typecheck
exit=1
# Run one by one, the root tsc and @avel/{contract,docs,db,contract-mock} typecheck all exit 0. Only @avel/web fails.
# Baseline at cbb0b19: exit 0.

$ pnpm lint
> biome check .
Checked 213 files in 734ms. No fixes applied.
exit=0

$ pnpm test
 ❯ |web| test/kit/decision-tag.test.tsx (31 tests | 4 failed)        # pre-existing at cbb0b19
 ❯ |web| test/kit/reason-dialog.test.tsx (18 tests | 1 failed)       # pre-existing at cbb0b19
 ❯ |web| test/data/pending-decisions.test.ts (0 test)                 # TypeError: Uuid.nullable is not a function
 ❯ |web| test/modules/decisions/contract-version.test.tsx (0 test)    # same, at load
 ❯ |web| test/modules/decisions/deciding.test.tsx (0 test)            # same
 ❯ |web| test/modules/decisions/errors.test.tsx (0 test)              # same
 ❯ |web| test/modules/decisions/list.test.tsx (0 test)                # same
 Test Files  7 failed | 26 passed (33)
      Tests  5 failed | 820 passed (825)
exit=1
# Baseline at cbb0b19: 3 files / 6 tests failed (RIGG-01 + the same 5 UC-08/UC-09).
# Here: RIGG-01 passes; all 7 failing files are |web|, so every test outside apps/web passes. 867 tests at base and 825 here: the 42 missing are the 5 web files that can't load.

$ git diff --name-only main...HEAD   # above, all inside Part 5
```
