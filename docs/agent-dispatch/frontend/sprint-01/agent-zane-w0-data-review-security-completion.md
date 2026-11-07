# ZANE: w0-data review-security, completion report

verdict: PASS (attempt a2; finding 03 resolved. Findings 01 and 02 from a1 are unchanged and not re-reviewed here)

## Summary
Reviewed Ghost's a2 at feafd95 (`git diff main...HEAD`: router.tsx, data/errors.ts, Ghost's report). GHOST-04 closes my finding 03: the forwarded X-Request-Id is checked against `^[A-Za-z0-9-]{1,64}$` and an invalid one is dropped, so the wrapper makes a new UUID. GHOST-05 (`UiError.stale.message`) adds no security issue. No new findings.

## Pre-flight
- Part 2: all files read (a1 reading carried; docs listed in zane.md exist). Branch `frontend/sprint-01/agent-zane-w0-data-review-security-a2`, started at feafd95.
- Part 7 commands: all available. `pnpm install --frozen-lockfile` now passes. `@avel/contract` had to be built first (`pnpm --filter @avel/contract build`) or the data tests can't resolve `@avel/contract/errors`.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZANE-01 | DONE in a1 (unchanged: no key logged, mock absent from dist); re-checked grep on dist now | this report |
| ZANE-02 | DONE | this report |

## ZANE-02 notes
- router.tsx:17 holds the regex. router.tsx:33 forwards only when `requestId !== null && regex.test(requestId)`. Otherwise `requestId` is left out, and client.ts:88 uses `crypto.randomUUID()`. The invalid value is never echoed.
- JS `$` without the `m` flag matches only at the true end, so a trailing newline fails. Node check: "" false, 65 chars false, "a\nb" false, "abc, def" false, "ab\n" false, "é" false, a UUID true.
- GHOST-05: `ApiError.bodyMessage` holds the server's ErrorBody message, and `stale.message` is "" for non-ErrorBody errors. The message is server text that screens render as text. I found no logging and no HTML sink in the diff.
- Not covered: GHOST-03 (zod/mini) is blocked on S1-6 and isn't in this attempt. Whether a locked test covers the forwarding is Fenn's/Zero's to say. The data tests pass but I didn't find a case for it in test/data.

## Findings
- none new. Finding 03 (`findings/w0-data-zane-03-forwarded-request-id-unvalidated.md`, P3) is now `status: resolved`. Findings 01 (P2, lockfile; `--frozen-lockfile` passes now) and 02 (P2, SSR baseUrl from Host; W5) remain as filed in a1.

## Contract to files
- UI contract section 3 `getRouter()` and section 8 (request IDs): apps/web/src/router.tsx, apps/web/src/data/client.ts.

## Deviations
- Marked finding 03 resolved in its file (my territory). Nothing else.

## Limitations
- 37 tests in `pnpm --filter @avel/web test` fail, all in test/modules/decisions. Leon's module isn't built, so they are expected. The 85 test/data tests pass.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- INT: finding 02 stays open for W5. Check that Leon's decisions module is reviewed for key reuse (5.2) when it lands.
- Fenn: no locked test exercises the forwarded-ID check that I could find; consider one.

## Files changed
```
docs/agent-dispatch/frontend/sprint-01/findings/w0-data-zane-03-forwarded-request-id-unvalidated.md
docs/agent-dispatch/frontend/sprint-01/agent-zane-w0-data-review-security-completion.md
```
(`git diff --name-only main...HEAD` also lists Ghost's files, which this branch carries.)

## Verification
- `grep -n 'A-Za-z0-9-' apps/web/src/router.tsx` -> `17:const FORWARDABLE_REQUEST_ID = /^[A-Za-z0-9-]{1,64}$/;`
- `pnpm --filter @avel/web exec vitest run test/data` -> Test Files 7 passed, Tests 85 passed
- `pnpm --filter "@avel/web..." build` -> built, Done
- `pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck` -> both Done
- `pnpm lint` -> Checked 198 files, no fixes applied
- `pnpm --filter @avel/web test` -> 37 failed (all test/modules/decisions, not built yet), 153 passed
- `grep -rlE '__mock|0193a000-0000-7000-8000-000000000001|contract-mock' apps/web/dist apps/web/.output` -> no file listed (rc=2 only because .output doesn't exist)
