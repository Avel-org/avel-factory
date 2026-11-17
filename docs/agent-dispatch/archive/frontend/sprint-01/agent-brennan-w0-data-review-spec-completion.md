# BRENNAN: w0-data review-spec, completion report

verdict: PASS

## Summary
This is attempt a2. I reviewed Ghost's w0-data a2 (feafd95, PARTIAL) on INT's review base `review-base/w0-data-a2` (41af1d8 = main a00fa14 + feafd95). It has two tasks:
- **GHOST-04 (1f6c6a8):** `getRouter()` forwards the incoming `X-Request-Id` only when it matches `^[A-Za-z0-9-]{1,64}$`.
- **GHOST-05 (f245139):** `UiError.stale.message` is the `ErrorBody`'s message, or `""`.

Both meet UI contract section 3 (revision 9) and INT's 2026-11-07 entry, "INT's answers on revision 9, and Ghost's w0-data a2 scope", word for word. GHOST-03 (`zod/mini`) is blocked on S1-6 and isn't in this attempt. One P3 is about the contract's wording, not the build: section 3's `ApiError.message = body.message` doesn't hold for an empty message, which is why Ghost added `bodyMessage`.

## Pre-flight
- **Part 2 files:** all read, none missing.
  - `.claude/agents/brennan.md`
  - `codebase-analysis.md`
  - `docs/ui-contracts/decisions-approval-page.md`: sections 0 to 3 in full (revision 10), and the 5.3 rows that read `stale`
  - `CR-W2 Pending decisions.md`: in full
  - frontend `decisions.md`: from "w0-data merged" to the end in full, with the earlier entries skimmed
  - the Frontend Map v0.6, the design library v1.1 and the Step 0 and Step 1 plan: present, and skimmed for what touches the data core (nothing in this diff touches the library)
  - this task doc
- **The role's Read first files:** present (`Backend modules and build plan.md`, `Roster setup and sessions.md`, `API and data reference.md`, `DATABASE.md`). This diff adds no route, DTO or column, so I only checked that they exist.
- **Branch:** `frontend/sprint-01/agent-brennan-w0-data-review-spec-a2`, starting at 41af1d8. `AVEL_BASE` is a00fa14.
- **Part 7 commands:** all available once `pnpm install --frozen-lockfile` had run. The worktree had no `node_modules`.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| BRENNAN-01 | DONE | this report's commit (finding 02 is in the same commit) |

**The diff** (`git diff main...feafd95`): `apps/web/src/data/errors.ts`, `apps/web/src/router.tsx` and Ghost's report. Nothing else moved.

**GHOST-04, `router.tsx:17, 33`.** The contract (section 3, "On the server") says: forward the ID "only if it's a UUID or matches `^[A-Za-z0-9-]{1,64}$`. Otherwise it passes no `requestId`, and the wrapper makes a new one."
- The regex is the contract's, character for character. A UUID (36 hex digits and hyphens, in either case) always matches, so one test covers both arms.
- `null`, `""`, more than 64 characters, and a comma-joined multi-value header all fail it, and then no `requestId` key is set. The wrapper then makes a new ID, as `client.ts` does unchanged.
- The check sits where the header is read, inside `.server(…)`, as INT's entry asks. So the locked UC-05 tests, which pass `requestId` to `createApiClient` directly, are untouched.
- The browser path (`.client`) is unchanged.

**GHOST-05, `errors.ts:15-19, 28, 57-63, 88-110, 152, 157`.** The contract (section 3, `UiError` table) gives `stale` this field: "`message: string` (the `ErrorBody`'s `message`, or `""` when the body isn't an `ErrorBody`)".
- **`ApiError` path:** `message` is `e.bodyMessage`, the body's message as sent.
- **Plain `ORPCError` path:** `message` is `""`. There, 409 maps to `conflict`, never `stale`, as before. So `""` on that path is defensive and can't be reached through `byStatus`'s `STALE_VERSION` check, because `code` is null.
- The field is required and typed `string`, so it's never undefined. That's INT's "the field is always a string".
- **Why `bodyMessage` and not `e.message`:** oRPC's constructor turns an empty message into a fallback (finding 02 has the evidence). Reading `e.message` would put `"STALE_VERSION"` where the contract wants `""`.
- `stale` is still keyed on `STALE_VERSION` alone. No other kind changed.

**The rest of BRENNAN-01's title** (route 52's rows, route 54's check order, the interim schema). My a1 review passed these at 3183bc1. None of their files has changed since: `git diff --stat 3183bc1 HEAD -- packages/contract-mock apps/web/src/data/pending-decisions.ts apps/web/src/data/client.ts packages/contract` prints nothing. So a1's result stands. `pending-decisions.ts:5` and `client.ts:11` still import classic `zod`. Section 3 allows that "until then" (S1-6), and GHOST-03 is blocked on it.

**Not Ghost's:** the decisions module doesn't read `UiError.stale.message` yet (`grep` finds no `message` read on `stale` in `modules/decisions`). Per Decisions, Revision 10, that switch is Leon's a3.

## Findings
- `docs/agent-dispatch/frontend/sprint-01/findings/w0-data-brennan-02-apierror-message-fallback.md`: **P3** (Zero, contract wording). Section 3 says `ApiError.message` = `body.message`, but oRPC swaps an empty message for a fallback. The contract doesn't record `ApiError.bodyMessage`. It also doesn't say whether `forbidden`, `conflict` and `unprocessable` should carry the body's message as sent or oRPC's fallback.

## Contract to files
- Section 3, `getRouter()` "On the server", the forwarded-ID check (revision 9; Zane's w0-data 03): `apps/web/src/router.tsx:10-17, 27-36`
- Section 3, `UiError.stale.message` (revision 9): `apps/web/src/data/errors.ts:15-19, 28, 57-63, 88-110, 149-157`
- Section 3, the `ApiError` line: `errors.ts:11-30` (see finding 02)
- Sections 1 and 2, and BRENNAN-01's route 52, route 54 and schema checks: unchanged since a1 (3183bc1), at `packages/contract-mock/**` and `apps/web/src/data/pending-decisions.ts`
- UC-04 and UC-05 (locked): pass inside `test/data`, 85 of 85

## Deviations
- **Scope:** I reviewed GHOST-04 and GHOST-05 only, the diff `main...feafd95`, as INT's message directed. GHOST-03 isn't in this attempt.
- **Base:** my start commit, 41af1d8, already contains Ghost's commits. So `git diff --name-only main...HEAD` lists Ghost's three files as well as mine. Part 7's "only paths from Part 5" holds for my own commit, which adds only the report and finding 02.
- **Finding number:** finding 02 continues a1's numbering (01 is a1's).
- **This report:** it replaces a1's report at the same path, which is this dispatch's only report path.

## Limitations
- **One unexplained test failure.** The first `pnpm --filter @avel/web exec vitest run test/data` in this session exited 1. I'd kept only the tail of its output, which shows `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL` and no failing test name. Four reruns in a row passed 85 of 85, and the full `@avel/web` suite passed 190 of 190.
- **Likely cause, unconfirmed:** a cold first run right after `pnpm install`. I have no evidence, so this isn't a finding. If Fenn or INT see it again, keep the full output.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Zero:** finding 02, wording for section 3's `ApiError`, and the `message` source for `forbidden`, `conflict` and `unprocessable`. It's for the next revision and doesn't block this merge.
- **Leon (a3):** `UiError.stale.message` is ready to use for 5.3's null-version row. On an empty server message it's `""`, not oRPC's fallback, so 5.3's `conflict` body would draw empty in that case. Zero's answer to finding 02 should settle it.
- **INT:** a flaky first `test/data` run (see Limitations), for awareness only.

## Files changed
`git diff --name-only main...HEAD`, after my commit:
```
apps/web/src/data/errors.ts                                                   (Ghost's, from the review base)
apps/web/src/router.tsx                                                       (Ghost's, from the review base)
docs/agent-dispatch/frontend/sprint-01/agent-ghost-w0-data-build-completion.md (Ghost's, from the review base)
docs/agent-dispatch/frontend/sprint-01/agent-brennan-w0-data-review-spec-completion.md (mine)
docs/agent-dispatch/frontend/sprint-01/findings/w0-data-brennan-02-apierror-message-fallback.md (mine)
```

## Verification
```
$ pnpm --filter @avel/web exec vitest run test/data      # task verify; run 1 exited 1 (Limitations), runs 2 to 5:
 Test Files  7 passed (7)
      Tests  85 passed (85)

$ pnpm --filter "@avel/web..." build
apps/web build: dist/server/assets/router-BZYHJa7P.js                       34.52 kB │ gzip: 11.60 kB
apps/web build: dist/server/assets/routes-C213wK2f.js                       48.57 kB │ gzip: 13.80 kB
apps/web build: dist/server/server.js                                      261.21 kB │ gzip: 63.20 kB
apps/web build: ✓ built in 259ms
apps/web build: Done

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done

$ pnpm lint
> biome check .
Checked 205 files in 184ms. No fixes applied.

$ pnpm --filter @avel/web test
 Test Files  14 passed (14)
      Tests  190 passed (190)

$ git diff --name-only main...HEAD
(see Files changed: Ghost's three from the review base, and my two)

$ cd apps/web && node --input-type=module -e '<new ORPCError(code,{message:""}).message>'   # finding 02
"STALE_VERSION"
"Conflict"
```
