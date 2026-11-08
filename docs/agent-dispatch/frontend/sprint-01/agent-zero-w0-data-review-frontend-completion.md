# ZERO: w0-data review-frontend, completion report

verdict: PASS

## Summary
Attempt a2. INT scoped this attempt to Ghost's a2 diff (`git diff main...feafd95`): GHOST-04 (1f6c6a8, the forwarded `X-Request-Id` is checked first) and GHOST-05 (f245139, `UiError.stale.message`). Both match UI contract section 3, revision 10, and decisions.md ("INT's answers on revision 9, and Ghost's w0-data a2 scope"). I have no findings. The locked tests pass (85 of 85 in `test/data`, 190 of 190 in the whole suite), and the build, typecheck and lint pass too. **ZERO-02 (the move to zod/mini) is BLOCKED.** Ghost's GHOST-03 is blocked on Axis's S1-6 and isn't in this attempt, so `apps/web/src` still imports classic `zod`, as section 3 allows until S1-6 lands.

## Pre-flight
- **Part 2 files:** all read, none missing:
  1. `.claude/agents/zero.md`: read (Learned: none yet).
  2. `codebase-analysis.md`: read.
  3. `docs/ui-contracts/decisions-approval-page.md`, revision 10: sections 0 to 3 read in full.
  4. `CR-W2 Pending decisions.md`: sections 1 and 2 (the row) read. Route 54's rules come through UI contract section 2, which quotes them. Nothing in this diff touches them.
  5. sprint `decisions.md`: read the stale and request-ID entries, Revision 7 deviation 3, Revision 9, "INT's answers on revision 9, and Ghost's w0-data a2 scope", and Revision 10.
  6. Frontend Map v0.6: present. I checked line 141 (the SSR client forwards the request ID), which is the line this diff touches.
  7. Design library v1.1: present. This diff draws no UI, so nothing in it applies.
  8. `Step 0 and Step 1 plan.md`: present, item 13. Nothing in this diff touches it.
  9. and 10. As in 3 and 4.
  11. This task doc: read in full.
- **Branch:** `frontend/sprint-01/agent-zero-w0-data-review-frontend-a2`. Its start commit is 41af1d8, `review-base/w0-data-a2`: main (a00fa14) with Ghost's a2 (feafd95) merged, as INT set it up. `git diff main..HEAD` is the same as `git diff main...feafd95`: errors.ts, router.tsx and Ghost's report.
- **Part 7 commands:** all available, after `pnpm install --frozen-lockfile` and `pnpm --filter @avel/contract build`. Neither left anything in the tree: `git status --short` was empty afterwards.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZERO-01 | DONE. I reviewed the a2 diff (GHOST-04 and GHOST-05) as INT scoped it. a1's surface passed in my a1 review (23db88d), and a2 changes nothing else | this report's commit |
| ZERO-02 | BLOCKED: GHOST-03 (zod/mini) is blocked on S1-6 and isn't in this attempt (INT). There's no move to review | none |

**ZERO-01, what I checked:**
- **GHOST-04, `apps/web/src/router.tsx:17,33`.** `FORWARDABLE_REQUEST_ID = /^[A-Za-z0-9-]{1,64}$/`. The `.server(…)` branch passes `requestId` only when the header is non-null and matches. Otherwise it passes only `baseUrl`, and the fetch wrapper makes a new ID. That is section 3's "On the server": "passes it only if it's a UUID or matches `^[A-Za-z0-9-]{1,64}$`".
  - A UUID always matches the pattern, so checking the pattern alone is enough. My probe checked a lowercase and an uppercase UUID: both `true`.
  - Rejected, as expected: 65 characters, `""`, `"a, b"` (how `Headers` joins two values), `a_b`, a tab, and a full-width character. 64 characters is accepted.
  - The check sits where the header is read, so the locked UC-05 tests are unchanged (decisions.md, INT's a2 scope).
  - The pattern isn't in the client bundle: `grep -l 'A-Za-z0-9-' apps/web/dist/client/assets/*.js` found nothing (exit 1).
  - The comment on `apiOptions` now says the ID must pass the check. The accessor (`getRequest()` inside `.server(…)`) is unchanged.
- **GHOST-05, `apps/web/src/data/errors.ts:57-63,109,152,157`.** `UiError`'s `stale` member gains `message: string`.
  - The `ApiError` branch passes the `ErrorBody`'s message, and the other-`ORPCError` branch passes `""`. That is section 3's table: "the `ErrorBody`'s `message`, or `""` when the body isn't an `ErrorBody`".
  - The other-`ORPCError` branch can't reach `stale` (it has `code: null`, and `stale` is keyed on `STALE_VERSION` alone). Passing `""` there is still right.
  - No other `UiError` member changes.
  - Probe results (scratch Vitest over the real `errors.ts`, not committed):
    ```
    U1 {"code":"STALE_VERSION",…,"kind":"stale","field":"version","currentVersion":3,"message":"changed"}
    U2 {"code":"STALE_VERSION",…,"kind":"stale","field":null,"currentVersion":null,"message":""} apiMessage= STALE_VERSION
    U3 {"code":null,…,"kind":"conflict","message":"Conflict"}
    ```
- **Ghost's deviation 1, `ApiError.bodyMessage` (`errors.ts:15-19,28`).** Accepted.
  - U2 confirms why it's needed: `ORPCError` replaces an empty message with a fallback, so `ApiError.message` is `"STALE_VERSION"` when the body's is `""`. Without `bodyMessage`, `stale.message` couldn't be "the `ErrorBody`'s message" exactly.
  - It adds to section 3's `ApiError` line and changes no field the line names. That's a contract gap of mine, not a break (Issues for other agents).
- **Nothing derived on the client, nothing outside the territory.** The diff changes only `apps/web/src/data/errors.ts`, `apps/web/src/router.tsx` (both Ghost's) and Ghost's report.

## Findings
none

## Contract to files
- Section 3, `getRouter()`, "On the server", "The forwarded ID is checked first": `apps/web/src/router.tsx`.
- Section 3, `UiError` table, `stale`'s `message`: `apps/web/src/data/errors.ts`.
- Section 3, "Which zod the web may import": not covered in this attempt (ZERO-02 BLOCKED).
- ZERO-01 Verify (`vitest run test/data`): 85 of 85 pass.

## Deviations
1. **The scope is INT's, not the task doc's alone.** INT's message: review GHOST-04 and GHOST-05 on `review-base/w0-data-a2`. GHOST-03 isn't in this attempt. So ZERO-01 covers the a2 diff, and ZERO-02 is BLOCKED rather than reviewed.
2. **ZERO-02's Verify fails, as expected while GHOST-03 is blocked.** The grep lists `apps/web/src/data/client.ts:11` (`import type { z } from "zod"`) and `apps/web/src/data/pending-decisions.ts:5` (`import { z } from "zod"`). Section 3 allows both "until then" (until S1-6 lands), so this isn't a finding. The diff's `--stat` also lists `router.tsx` and Ghost's report, not only `apps/web/src/data`, because the task doc's expectation was written for GHOST-03.

## Limitations
- ZERO-02 needs a new attempt once Axis's S1-6 is merged and Ghost's a3 (GHOST-03) has a completion report.
- My checks of GHOST-04 drove the regex directly, plus the client-bundle grep. They didn't run `getRouter()`'s `.server` branch end to end. Ghost's report describes a probe that did, and no locked test covers it.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Zero (me), contract follow-ups for the next revision:**
  - Section 3's `ApiError` line should name `bodyMessage` (Ghost's deviation 1).
  - Section 3 should say which message `conflict`, `forbidden` and `unprocessable` carry. Today they read `ApiError.message`, so an `ErrorBody` with `message: ""` shows oRPC's fallback (`"Conflict"`, …), as Ghost's Limitations note. The table doesn't decide this either way, so it isn't a finding against Ghost.
- **Leon (decisions a3):** `UiError.stale.message` is ready for 5.3's null-version row (decisions.md, Revision 10: "The switch is Leon's a3").
- **INT:** this branch can merge, and so can Ghost's a2. GHOST-03 and my ZERO-02 wait for S1-6.

## Files changed
```
docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-data-review-frontend-completion.md
```
(The diff from main also lists the review base's merged `apps/web/src/data/errors.ts`, `apps/web/src/router.tsx` and Ghost's report. Those are Ghost's a2, merged into the base by INT, not mine.)

## Verification
```
$ pnpm --filter @avel/web exec vitest run test/data
 Tests  85 passed (85)

$ grep -rnE "from ['\"]zod(/v4)?['\"]" apps/web/src
apps/web/src/data/client.ts:11:import type { z } from "zod";
apps/web/src/data/pending-decisions.ts:5:import { z } from "zod";
exit=0      (expected while GHOST-03 is blocked; Deviations 2)

$ pnpm --filter "@avel/web..." build
exit=0
apps/web build: dist/server/server.js   261.21 kB │ gzip: 63.20 kB
apps/web build: ✓ built in 351ms

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
exit=0
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done

$ pnpm lint
exit=0
Checked 205 files in 466ms. No fixes applied.

$ pnpm --filter @avel/web test
exit=0
 Test Files  14 passed (14)
      Tests  190 passed (190)

$ git diff --name-only main...HEAD
apps/web/src/data/errors.ts                      (Ghost's a2, in the review base)
apps/web/src/router.tsx                          (Ghost's a2, in the review base)
docs/agent-dispatch/frontend/sprint-01/agent-ghost-w0-data-build-completion.md   (Ghost's a2, in the review base)
docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-data-review-frontend-completion.md   (mine)
```
