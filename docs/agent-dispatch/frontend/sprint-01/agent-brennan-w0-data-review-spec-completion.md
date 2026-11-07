# BRENNAN: w0-data review-spec, completion report

verdict: PASS

## Summary
I reviewed Ghost's w0-data work at 3183bc1, after the fast-forward INT asked for. That covers the contract mock (`packages/contract-mock`) and the data core (`apps/web/src/data`, `apps/web/src/lib`, `apps/web/src/router.tsx`). I checked it against CR-W2 and UI contract sections 1 to 3, and nothing drifts in behaviour:
- **Route 52:** the mock's rows are CR-W2's, field for field.
- **Route 54:** its checks run in CR-W2's order, with m1's error data.
- **The interim schema:** `PendingDecisionRow` matches CR-W2 sections 2.1 to 2.3.

There's one P3 finding, and it's about the docs. Narrowing the client to `{ decisions }` (D58) isn't recorded in the UI contract or the frontend `decisions.md` yet, and neither is the 160 kB budget.

## Pre-flight
- **Part 2 files:** each was read.
  - `.claude/agents/brennan.md`
  - `codebase-analysis.md`
  - `docs/ui-contracts/decisions-approval-page.md`: sections 0 to 3 in full, the rest skimmed
  - `CR-W2 Pending decisions.md`: in full
  - `decisions.md` (frontend sprint-01)
  - the Frontend Map v0.6: skimmed for the Data layer
  - the design library: read for `avAgo` (`jr`)
  - `Step 0 and Step 1 plan.md`: skimmed
  - this task doc

  None is missing.
- **brennan.md's Read first list:** these weren't read in full. I skimmed them only where this review touches them, and the task doc's Part 2 list governs.
  - `Backend modules and build plan.md`
  - `Roster setup and sessions.md`
  - `API and data reference.md`
  - `DATABASE.md`
- **Also read:** m1's contract at this commit:
  - `packages/contract/src/routes/decisions.ts`
  - `routes/route.ts`
  - `errors.ts`
  - `dto/decisions.ts`
  - `dto/common.ts`
  - `package.json`

  I also read backend D58.
- **Branch:** `frontend/sprint-01/agent-brennan-w0-data-review-spec-a1`.
  - It started at 71e0c61, Ghost's first report.
  - INT held the review, then told me to fast-forward to 3183bc1 (Ghost's head, on merge 087c9ca). `git merge --ff-only 3183bc1` succeeded.
  - The review is of `main...3183bc1`.
- **Part 7 commands:** all are available once `node_modules` is installed (Deviations).

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| BRENNAN-01 | DONE | c259abc (finding 01); this report |

## Findings
- `docs/agent-dispatch/frontend/sprint-01/findings/w0-data-brennan-01-client-over-decisions-group.md`: P3. The client is built over `{ decisions }`, and no doc says so yet.

## Contract to files
Each check below has its evidence: a line in the diff, and my probe's output where there is one. The probe was a scratch script against `createMock` and `PendingDecisionRow`, and isn't committed. Its output is in Verification.

**1. The route 52 row against CR-W2 2.1 to 2.3** (`packages/contract-mock/src/rows.ts:137-168`, `apps/web/src/data/pending-decisions.ts`)
- **Both members (2.1):** `kind`, `ref`, `title`, `createdAt`, `missionId` and `clientName`.
  - `missionId` is a `Uuid` on a proposal and `z.null()` on a factory PR.
  - `clientName` is nullable on a proposal and `z.null()` on a factory PR.
- **`proposal` (2.2):**

  | Field | Schema |
  | --- | --- |
  | `proposalId` | `Uuid` |
  | `proposalKind` | `z.enum(ProposalKind)` |
  | `subjectKey` | string |
  | `moduleRunId` | `Uuid.nullable()` |
  | `version` | `int().min(1)` |
  | `evidence` | string |
  | `approve`, `reject` | optional `DecisionChoice {choice,label,consequence}` |
  | `expiresAt` | `IsoTime` |
  | `costImpact` | optional `{ micros: int, estimated: boolean }` |

- **`factory_change` (2.3):**

  | Field | Schema |
  | --- | --- |
  | `changeId` | `/^[1-9][0-9]*$/` |
  | `prNumber` | int |
  | `headSha` | 40 hex |
  | `url` | URL |

- **`ref`:** `proposal:<id>` and `factory_change:<digits>` (CR-W2 section 1).
- **The rows the mock sends** carry exactly these keys. They never carry `costImpact`, `options`, `dispatchId`, `rowVersion` or the resolution columns. Probe:
  ```
  52 keys proposal: kind,ref,title,createdAt,missionId,clientName,proposalId,proposalKind,subjectKey,moduleRunId,version,evidence,approve,reject,expiresAt
  52 keys factory: kind,ref,title,createdAt,missionId,clientName,changeId,prNumber,headSha,url
  ```
- **`ProposalOptions` (CR-W2 3.2):** `rows.ts:80-93`. That's at least 2 choices, each `choice` unique, and exactly one `approve` and one `reject`. A row whose options don't parse is listed with `approve` and `reject` absent (INT 8.3): see `proposal:…003 -choices` in the probe.

**2. Route 52's listing** (`mock.ts` `listPending`)
- **What it lists:** open proposals with `expiresAt > now`, plus every factory PR.
- **Order:** oldest first, by `createdAt` and then `ref` (CR-W2 6.7).
- **Paging:**
  - `limit` must be 1 to 100, and the mock never clamps: `limit=0` gives 400.
  - The cursor is opaque.
  - `fixtures.many` pages as 100, then 50, then `nextCursor` null, in order.
- **After a decision and an expiry,** both proposals leave the list.

**3. The fixtures** (`fixtures.ts`)
- `step1` matches section 2:
  - two decidable proposals, with different `clientName`s, one of them `budget_increase`;
  - one proposal whose options don't parse;
  - one factory PR.
- `many` has 150 decidable proposals.
- Every row parses with `PendingDecisionRow`: the probe printed `[true, true, true, true]`.

**4. Route 54's order** (`mock.ts:182-217` and `decide`, lines 76-106)
- **Before CR-W2's checks:**
  - a pending `failNext` comes first;
  - then a missing `Idempotency-Key`, which gives `BAD_REQUEST`, `{field:"Idempotency-Key", issues:[…"required"]}` (S1-1, S1-3);
  - then the idempotency replay, or `IDEMPOTENCY_KEY_REUSED`.
- **Then checks 1 to 5:**
  1. The schema, through the OpenAPI handler: `{field, issues}`.
  2. `NOT_FOUND`.
  3. `INVALID_TRANSITION` with `{allowed: []}`, through m1's schema and with no `state` (the UI contract allows this).
  4. `STALE_VERSION` with `{field:"version", currentVersion}`, which is m1's `StaleVersionDetails`.
  5. `BAD_REQUEST` with `{field:"choice"}`.
- **On success:** 201 with `ProposalDto`, from m1's `route()` `successStatus` 201.
- **The probe sets up each pair of checks that could both fire,** and the earlier check wins every time: 1 over 2, 2 over 4, 3 over 4, and 4 over 5.
- **On success the row resolves** as CR-W2 section 5 writes it: `state`, `choice`, `choiceReason`, `resolvedBy = MOCK_OPERATOR_ID`, `resolvedAt` and `rowVersion + 1`.

**5. The error body:** every error is m1's `ErrorBody`.
- `toErrorBody` writes the validator's issues: `field` is the path joined with `.`, and the message is the first issue's.
- Unmatched `/api/*` paths answer `NOT_FOUND`.
- Every response carries `X-Request-Id` and `X-Contract-Version`.

**6. The data core against section 3:**
- **`client.ts`:**
  - the fetch wrapper sets `X-Request-Id` on every request, and `Idempotency-Key` on a write from the call's context;
  - a rejected fetch becomes `NetworkError(requestId)`;
  - a response without an ID gets the ID it sent;
  - the version check runs in the browser only;
  - `bindApi`, `apiFor` and `useApi` keep each `Api` in a `WeakMap`.
- **`errors.ts`:**
  - `decodeErrorBody` does `ErrorBody.safeParse`, then `ApiError`;
  - `toUiError` follows section 3's order;
  - `stale` is keyed on `STALE_VERSION` alone.
- **`query.ts`:** `staleTime` is 30s, queries refetch on focus and on reconnect, they retry fewer than 3 times and only on `network` or `server`, and mutations never retry.
- **`pending-decisions.ts`:** `parsePendingPage` and `selectPendingPages` work as section 3 describes.
- **`lib/time.ts`:** `formatAgo` is the design library's `jr` word for word, and `formatClock` gives `HH:MM`.
- **`router.tsx`:** `getRouter` uses `createIsomorphicFn().server(getRequest)`, takes the origin and `X-Request-Id`, and forwards no cookie.
- **Ghost's deviations 1 to 12** are in places where section 3 is silent. None of them changes a name, a check order, an error code or a field from CR-W2 or the UI contract.

**7. The new commit, 3183bc1:**
- Nothing under `apps/web/src` imports the root `@avel/contract` (`grep` exits 1).
- The link is built over `{ decisions }`. This is finding 01, about the docs only.

## Deviations
- **I installed `node_modules`.** The fresh worktree had none, and `pnpm install --frozen-lockfile` fails with `ERR_PNPM_OUTDATED_LOCKFILE` on contract-mock's new dependencies (escalation 01: INT regenerates the lockfile at merge). I ran `pnpm install --no-frozen-lockfile`, then `git checkout -- pnpm-lock.yaml`, so this branch doesn't change the lockfile.
- **I ran BRENNAN-01's Verify as `pnpm --filter @avel/web exec vitest run test/data`.**
  - The task doc's form, `pnpm --filter @avel/web test -- test/data`, passes `--` through to Vitest. Vitest then drops the filter and runs all 13 files: 105 failed and 85 passed.
  - The direct form runs only the 7 data files: 85 of 85 pass.
- **I cleared Vitest's cache once** (`vitest --clearCache`) before the tests, as Ghost's report advises.

## Limitations
- **The SSR forwarding of `X-Request-Id` isn't observed end to end.** No loader exists until Leon's route lands, so I judged it from the code at `router.tsx` against section 3. It's Zane's and UC-29's to see run.
- **The bundle budget isn't judged here.** That's Leah's. Vite reports `index-BDSlPvoT.js` at 155.40 kB gzip, and Ghost measured 153,654 bytes. Either way it's under the 160 kB INT gave.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Zero or INT:** finding 01 needs two entries in `decisions.md` and one change in the next UI contract revision:
  - the `{ decisions }` client over D58's subpaths;
  - the 160 kB sprint-01 budget, which isn't in `decisions.md` at this commit;
  - section 3's line 196 wording.
- **INT:** the task docs' Verify `pnpm --filter @avel/web test -- test/data` doesn't filter (Deviations). `pnpm --filter @avel/web exec vitest run test/data` does.
- **Fenn and INT:** the locked `vitest.config.ts` aliases only the root `@avel/contract`. So the web's tests now need `packages/contract` built first, as Ghost reported. Extending the alias needs a lock exception.

## Files changed
`git diff --name-only main...HEAD` lists Ghost's reviewed work, which is on this branch because INT told me to fast-forward to it:
```
apps/web/src/data/client.ts
apps/web/src/data/contract-version.ts
apps/web/src/data/errors.ts
apps/web/src/data/idempotency.ts
apps/web/src/data/index.ts
apps/web/src/data/pending-decisions.ts
apps/web/src/data/query.ts
apps/web/src/lib/time.ts
apps/web/src/router.tsx
docs/agent-dispatch/frontend/sprint-01/agent-ghost-w0-data-build-completion.md
packages/contract-mock/package.json
packages/contract-mock/src/fixtures.ts
packages/contract-mock/src/index.ts
packages/contract-mock/src/mock.ts
packages/contract-mock/src/rows.ts
packages/contract-mock/tsconfig.json
```
Mine, all Part 5 paths (`git diff --name-only 3183bc1..HEAD`):
```
docs/agent-dispatch/frontend/sprint-01/agent-brennan-w0-data-review-spec-completion.md
docs/agent-dispatch/frontend/sprint-01/findings/w0-data-brennan-01-client-over-decisions-group.md
```

## Verification
```
$ pnpm --filter "@avel/web..." build
packages/contract build: Done
apps/web build: dist/client/assets/index-BDSlPvoT.js                 496.83 kB │ gzip: 155.40 kB
apps/web build: ✓ built in 310ms
apps/web build: dist/server/server.js                                      261.19 kB │ gzip: 63.18 kB
apps/web build: Done
EXIT=0

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done
EXIT=0

$ pnpm lint
Checked 183 files in 116ms. No fixes applied.
EXIT=0

$ pnpm --filter @avel/web test
 Test Files  6 failed | 7 passed (13)
      Tests  105 failed | 85 passed (190)
EXIT=1
# The failures by file. All of them are the locked kit and decisions tests, whose builds
# haven't landed, as INT expects. None is in test/data.
     29 test/kit/decision-tag.test.tsx
     22 test/kit/error-panel.test.tsx
     17 test/kit/reason-dialog.test.tsx
      7 test/modules/decisions/deciding.test.tsx
     16 test/modules/decisions/errors.test.tsx
     14 test/modules/decisions/list.test.tsx

$ pnpm --filter @avel/web exec vitest run test/data      # BRENNAN-01's Verify
 Test Files  7 passed (7)
      Tests  85 passed (85)
EXIT=0

$ git diff --name-only main...HEAD   # see Files changed: Ghost's reviewed paths plus my two Part 5 paths

$ grep -rn 'from "@avel/contract"' apps/web/src; echo $?
1

# Probe (scratch script against createMock and PendingDecisionRow, not committed)
52 kinds/refs: proposal:…001 +choices, proposal:…002 +choices, proposal:…003 -choices, factory_change:142 -choices
52 parse: [ true, true, true, true ] next null
no key         400 BAD_REQUEST {"field":"Idempotency-Key","issues":[{"field":"Idempotency-Key","message":"required"}]}
1 vs 2         400 BAD_REQUEST {"field":"version","issues":[{"field":"version","message":"Too small: expected number to be >=1"}]}
2 vs 4         404 NOT_FOUND ""
4 vs 5         409 STALE_VERSION {"field":"version","currentVersion":2}
5              400 BAD_REQUEST {"field":"choice"}
ok             201 ok state=resolved ""
replay         201 ok state=resolved ""
reused         409 IDEMPOTENCY_KEY_REUSED ""
3 vs 4 (resolved, stale) 422 INVALID_TRANSITION {"allowed":[]}
3 expired      422 INVALID_TRANSITION {"allowed":[]}
52 after: proposal:…003, factory_change:142
limit 0: 400
many: 100 50 null ordered true
```
