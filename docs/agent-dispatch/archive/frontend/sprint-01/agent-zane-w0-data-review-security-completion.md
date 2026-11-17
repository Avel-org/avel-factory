# ZANE: w0-data review-security, completion report

verdict: PASS (attempt a3; no new findings. Findings 01 and 02 stay as filed; 03 stays resolved)

## Summary
Reviewed Ghost's a3 (2ae0473, GHOST-03: `zod/mini` in `data/pending-decisions.ts` and the type import in `data/client.ts`). Validation is kept rule for rule (same four regexes, `z.int().check(z.minimum(1))`, nullable/optional wrappers). Key, request-ID and mock handling are untouched. The mock and `/__mock` stay out of the build.

## Pre-flight
- Part 2: all files exist and were read (a1/a2 reading carried; zane.md's Read first docs exist). Branch `frontend/sprint-01/agent-zane-w0-data-review-security-a3`, start 5165653.
- Part 7 commands: all available. `pnpm install --frozen-lockfile` passes; `@avel/contract` built first.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZANE-01 | DONE (re-checked on a3: no src change touches keys or logging; dist has no mock) | this report |
| ZANE-02 | DONE (router.tsx:17 regex, unchanged since a2 and still the only forwarding path) | this report |

## Findings
none new. Open from earlier attempts: w0-data-zane-01-lockfile-stale (P2; `--frozen-lockfile` passes now), w0-data-zane-02-ssr-baseurl-from-host (P2, W5).

## Contract to files
- UI contract sections 3 and 8: apps/web/src/data/client.ts (wrapFetch), apps/web/src/data/idempotency.ts, apps/web/src/router.tsx.

## Deviations
none

## Limitations
- `pnpm --filter @avel/web test`: 1 failed, 196 passed. The failure is test/kit/reason-dialog.test.tsx UC-09 (R7), the kit's locked test; the kit isn't in this diff and the data tests are not involved. It is Fantem's/INT's to settle at the joint landing.
- The zod/mini change was reviewed for validation parity by reading the diff, not by a differential test.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- INT: the UC-09 R7 kit failure above. Finding 02 stays open for W5.

## Files changed
Mine: this report. `git diff --name-only main...HEAD` also lists the review base's S1-6 paths (packages/contract, biome.json, tools/docs) and Ghost's apps/web/src/data files, which this branch carries.

## Verification
- `pnpm --filter "@avel/web..." build` -> built, exit 0
- `grep -rlE '__mock|0193a000-0000-7000-8000-000000000001|contract-mock' apps/web/dist apps/web/.output` -> no file (rc 2: .output absent); `grep -rl '@avel/contract-mock' apps/web/src` -> none
- `grep -n 'A-Za-z0-9-' apps/web/src/router.tsx` -> `17:const FORWARDABLE_REQUEST_ID = /^[A-Za-z0-9-]{1,64}$/;`
- `pnpm --filter @avel/web exec vitest run test/data` -> 7 files, 85 tests passed
- `pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck` -> both Done
- `pnpm lint` -> Checked 213 files, no fixes
- `pnpm --filter @avel/web test` -> 1 failed (kit UC-09 R7), 196 passed
- no `console.` in apps/web/src
