# BRENNAN: zod-mini review-spec, completion report

verdict: PASS

## Summary
I reviewed Axis's S1-6 at a36d3c8 (AXIS-01 to 03 plus 07cc98b, the locale in the root entry), against base cbb0b19. It does what S1-6 says, and nothing outside it:
- no classic zod is left in `packages/contract/src`;
- all 1,011 reachable schemas have the same zod definition tree and give byte-identical results, English messages included, on 39 probe inputs;
- the OpenAPI document is byte for byte main's;
- `package.json` is untouched;
- Biome bans `zod` and `zod/v4` in `packages/contract/**`.

The verify chain prints ZOD-MINI-OK on the joint base (`review-base/s1-6-joint`, 5165653). On this commit alone, `pnpm typecheck` fails in `apps/web`, which is the "lands together" condition S1-6 already records. One P3 finding is my ruling on Axis's open bundling point. It doesn't block.

## Pre-flight
- **Part 2 files**, all read, none missing:
  - `.claude/agents/brennan.md`
  - `docs/agent-dispatch/backend/sprint-01/codebase-analysis.md`
  - `docs/agent-dispatch/backend/sprint-01/decisions.md` (S1-2, S1-3, S1-6 with its amendment, and S1-8 read in full)
  - `docs/design/Step 0 and Step 1 plan.md`
  - `docs/agent-dispatch/backend/sprint-00/contract.md`
  - `docs/agent-dispatch/backend/sprint-00/decisions.md` (D58)
  - this task doc
- **Role Read-first design docs:** all present (`Backend modules and build plan.md`, `AVEL Web App — Frontend Map v0.6.md`, `Roster setup and sessions.md`, `API and data reference.md`, `DATABASE.md`). I skimmed them for what touches S1-6; none is affected by a construction-only change.
- **Branch:** `backend/sprint-01/agent-brennan-zod-mini-review-spec-a2`, starting at a36d3c8. `AVEL_BASE` = cbb0b19 (= `git merge-base main HEAD`). a1 was lost in a terminal freeze, per INT.
- **Part 7 commands:** all available (pnpm 10.33.2, Node 24.22.2).

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| BRENNAN-01 | DONE (PASS on the joint base; on a36d3c8 alone the chain stops at `pnpm typecheck` in `apps/web`, as S1-6 "The landing (INT)" says it will) | this report's commit |

## Findings
- `docs/agent-dispatch/backend/sprint-01/findings/zod-mini-brennan-01-root-locale-dropped-by-bundlers.md`, **P3**: the root entry's English locale is a side effect in a package that declares `sideEffects: false`, so any bundled consumer loses S1-3's messages. My ruling on Axis's open point: set `"sideEffects": ["./dist/index.js"]`, a packaging-only change with no bump under D58. Also, the Step 1 server's error mapper shouldn't depend on the side effect.

## Contract to files
| Item (task doc, S1-6) | Checked how | Result |
| --- | --- | --- |
| No classic zod import in `packages/contract/src` | `grep -rnE "from ['\"]zod(/v4)?['\"]" packages/contract/src` printed nothing. The imports are `"zod/mini"` ×24 and `"zod/v4/core"` ×1 (`dto/common.ts`, type-only, for `Page<T>`) | pass |
| No schema changed in meaning (`.min`, `.trim`, nullable/optional, refine, enums) | (a) I read the diff line by line: every change is one of S1-6's listed rewrites, or one of the amendment's `.extract`/`.exclude`/`.loose` forms. (b) **Def-tree parity:** main's contract (cbb0b19, built in the scratchpad) and HEAD's `dist/index.js`, walked over every export and every route's input, output and error-data schema. That's 1,011 schemas with the same keys on both sides. Their normalized `_zod.def` trees (types, every check's def, shapes, entries, refine fn source) are equal once two kinds of noise are taken out: an empty `checks: []` present only on the 4 classic `.extract`/`.exclude` enums (`EscalationKind`, `UpdateFindingInput.state`, `UpdateFactInput.status`, `UpdateTimeEntryInput.state`, and the 5 routes and DTOs that embed them), and zod's internal `z.json()` getter source (`string(params)` vs `string()`, params undefined). (c) **Runtime parity:** 39 probe inputs through `~standard.validate` on all 1,011 schemas, covering undefined, null, blank and padded strings, bounds 0/1/100/101, coerced `limit`, the enum members, the refine pairs and loose extra keys. `cmp` on the two 7.16 MB result files: identical, issues and messages included (with the root imported). (d) RIGG-02's type snapshot passes (61/61). | pass |
| The OpenAPI document byte for byte main's | `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated/openapi.json` exits 0 | pass |
| `package.json` and its version untouched (S1-2: no bump; S1-6) | `git diff --exit-code cbb0b19 HEAD -- packages/contract/package.json` exits 0 | pass |
| Biome bans classic zod in `packages/contract/**` | `biome.json` overrides `style/noRestrictedImports` `paths` `zod` and `zod/v4` (`biome.json:36-55`). Probe: a scratch copy of `biome.json` with files under `packages/contract/src` importing `zod`, `zod/v4`, `zod/mini` and `zod/v4/core`, and `packages/server/src` importing `zod`. Result: `Found 2 errors`, at `p1.ts:1:20` (`zod`) and `p2.ts:1:20` (`zod/v4`) only. The server's classic zod is allowed (S1-6 "Consumers"). | pass |
| Territory: only `packages/contract/src`, `tools/docs/src/openapi.ts`, `biome.json` (plus Axis's report and the S1-6 amendment in decisions.md) | `git diff --name-only cbb0b19 HEAD`, filtered for any other path: nothing. No `apps/web/**`, `packages/contract-mock/**` or locked path (`locks.md`: zod-mini · 6a49f45 · `packages/contract/test/...`) is touched: `git diff --stat cbb0b19 HEAD -- packages/contract/test` is empty. | pass |
| `openapi.ts`: the `$ZodType` check only | `tools/docs/src/openapi.ts:7,25,27`: the import, the record type and the `instanceof`, nothing else | pass |
| S1-3: route 54's bad-input issues unchanged | RIGG-03's locked fixture passes (in the 61), and the probes in (c) match | pass |
| S1-8: `Placeholder` aliases stay one object | The OpenAPI bytes are unchanged, so `MetricsDto` refs are as on main. `Placeholder` itself isn't in the diff. | pass |
| Done-when: build, typecheck, lint; 44 + new tests; OpenAPI unchanged | On the joint base: all pass, `ZOD-MINI-OK`. On HEAD alone, typecheck fails in `apps/web` only (see Limitations). | pass (joint) |

**Judgement calls INT asked for:**
- **Deviation 1, the locale in the root entry (07cc98b, `src/index.ts:11-22`):** accepted. It restores classic's default exactly where the Node consumers load it (my probe 1). An explicit `z.config` still wins (the `if` guard). The subpaths stay free of it, and no `package.json` change is needed. The bundling caveat is finding 01.
- **Deviation 2, the enum forms:**
  - `.extract` → `z.enum([...] as const satisfies readonly List[])` (`dto/agent.ts:73-78`, `dto/gates.ts`, `dto/your-work.ts`);
  - `.exclude` → `z.enum(FactStatus.filter(...))` (`dto/gate0.ts`);
  - `.loose()` → `z.looseObject` (`dto/events-and-traces.ts`).

  All accepted. The entries match main's (def-tree parity), the order matches (OpenAPI bytes), and so do the runtime results (probes). The only internal difference is the absent empty `checks` array, which no consumer can observe. The literal lists in `.extract`'s place are compile-checked against the value lists by `satisfies`, but they no longer follow a rename in the list automatically. That's a maintenance note, not a finding: a rename is a breaking change under S1-2 and gets reviewed anyway.
- **Axis's open point (`sideEffects` and bundling):** reproduced, and the fix checked. My ruling is in finding 01.

## Deviations
- The task's Verify chain was run in two places. On a36d3c8 it stops at `pnpm typecheck` (apps/web: `src/data/pending-decisions.ts(40,21): Property 'nullable' does not exist on type 'ZodMiniUUID'`, and the errors that follow from it). That's the known solo-landing break (S1-6 "The landing (INT)"), so I also ran the full chain on `review-base/s1-6-joint` (5165653: main 9ca0ae1 + a36d3c8 + Ghost's w0-data a3 2ae0473), in a detached scratch worktree that I've since removed. INT's message names that pairing.
- I added the def-tree and runtime-probe parity checks, which the task doc doesn't list, because "no schema changed in meaning" needs more than the OpenAPI bytes (trim and refine aren't in JSON Schema). Scripts and outputs are in my session scratchpad, not the repo.

## Limitations
- On a36d3c8 alone, `pnpm typecheck` and `pnpm test` fail in `apps/web`. This is expected and recorded in decisions.md S1-6; the module must not merge without Ghost's w0-data a3.
- The runtime parity covers 39 probe inputs per schema, not an exhaustive fuzz. Together with the def-tree equality, I treat it as conclusive for construction-only changes.
- I didn't measure the web bundle size: Leah owns that on the frontend side (S1-6, "The size done-when moves to the joint landing").

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT:**
  - Merge a36d3c8 only together with Ghost's w0-data a3 (2ae0473). The joint base passes `ZOD-MINI-OK`.
  - `review-base/s1-6-joint` sits on main 9ca0ae1, but main is now ed3fd2b. On the joint, `pnpm test` has 1 failure, `test/kit/reason-dialog.test.tsx` "UC-09 (R7) the kit index has no ReasonDialog value". That failure is pre-S1-6: at 9ca0ae1, `apps/web/src/kit/index.ts:19` still exports `ReasonDialog`. The joint changes only `apps/web/src/data/{client,pending-decisions}.ts` in `apps/web`, and Fantem's R7 fix is on main at ed3fd2b. Rebuild the joint on ed3fd2b before the merge check.
  - Finding 01: decide the `sideEffects` packaging fix.
- **Axis (Step 1 server):** finding 01, second bullet. The error mapper shouldn't rely on the root import's side effect for S1-3's English messages.
- **Zero:** a web page that shows zod's issue text from subpath-only imports gets `"Invalid input"` (S1-6 amendment, "The rule for consumers"; I confirmed it in finding 01, evidence 1).

## Files changed
`git diff --name-only main...HEAD` (merge-base cbb0b19). Axis's reviewed files are listed first; mine are the last two:
```
biome.json
docs/agent-dispatch/backend/sprint-01/agent-axis-zod-mini-api-contract-completion.md
docs/agent-dispatch/backend/sprint-01/agent-brennan-zod-mini-review-spec-completion.md
docs/agent-dispatch/backend/sprint-01/decisions.md
docs/agent-dispatch/backend/sprint-01/findings/zod-mini-brennan-01-root-locale-dropped-by-bundlers.md
packages/contract/src/** (24 files)
tools/docs/src/openapi.ts
```
My commit adds only:
- `docs/agent-dispatch/backend/sprint-01/agent-brennan-zod-mini-review-spec-completion.md`
- `docs/agent-dispatch/backend/sprint-01/findings/zod-mini-brennan-01-root-locale-dropped-by-bundlers.md`

## Verification
On a36d3c8 plus this report (this branch):
```
$ pnpm build
packages/contract build: Done
packages/db build: Done
apps/web build: Done
(exit 0)

$ pnpm typecheck
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
packages/db typecheck: Done
tools/docs typecheck: Done
apps/web typecheck: src/data/pending-decisions.ts(40,21): error TS2339: Property 'nullable' does not exist on type 'ZodMiniUUID'.
apps/web typecheck: (12 follow-on errors in src/modules/decisions/** and test/data/contract-version.test.ts)
apps/web typecheck: Failed
(exit 1: the expected solo-landing break, S1-6 "The landing (INT)")

$ pnpm lint
Checked 213 files in 129ms. No fixes applied.
(exit 0)

$ pnpm test
Test Files  7 failed | 26 passed (33)
     Tests  5 failed | 820 passed (825)
(exit 1)
- All failures are in |web|:
  - 4 decisions suites fail to load: "TypeError: Uuid.nullable is not a function" (the solo break).
  - The other 2 failing files are kit tests that the diff doesn't touch: decision-tag D11 ×4 and reason-dialog R7 ×1.
- @avel/contract: 61 passed (61).

$ pnpm --filter @avel/contract test
Test Files  6 passed (6)
     Tests  61 passed (61)

$ pnpm --filter @avel/docs generate && git diff --exit-code docs/generated/openapi.json
(exit 0: byte-identical)

$ ! grep -rnE "from ['\"]zod(/v4)?['\"]" packages/contract/src
(nothing printed, exit 0)

$ git diff --exit-code cbb0b19 HEAD -- packages/contract/package.json
(exit 0)

$ git diff --name-only main...HEAD
(see Files changed)
```
On `review-base/s1-6-joint` (5165653), the task's full Verify chain:
```
$ pnpm build && pnpm typecheck && pnpm lint && pnpm --filter @avel/contract test && pnpm --filter @avel/docs generate && git diff --exit-code docs/generated/openapi.json && ! grep -rnE "from ['\"]zod(/v4)?['\"]" packages/contract/src && git diff --exit-code a36d3c8 HEAD -- packages/contract/package.json && echo ZOD-MINI-OK
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
packages/db typecheck: Done
tools/docs typecheck: Done
apps/web typecheck: Done
      Tests  61 passed (61)
ZOD-MINI-OK

$ pnpm test
Test Files  1 failed | 32 passed (33)
     Tests  1 failed | 870 passed (871)
FAIL |web| test/kit/reason-dialog.test.tsx > UC-09 (R7) the kit index has no ReasonDialog value
(pre-S1-6, on main 9ca0ae1; fixed on main at ed3fd2b)
```
