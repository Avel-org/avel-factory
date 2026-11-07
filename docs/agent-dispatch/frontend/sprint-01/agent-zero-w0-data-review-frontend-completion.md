# ZERO: w0-data review-frontend, completion report

verdict: PASS

## Summary
I reviewed Ghost's w0-data at 3183bc1, as INT asked: the data core (`apps/web/src/data/**`, `apps/web/src/lib/time.ts`, `apps/web/src/router.tsx`) and `@avel/contract-mock`, against UI contract sections 1 to 3. Every export and `UiError` member is there as section 3 names it, and the mock's surface is section 2's word for word. The client derives no field, and nothing in the diff is outside Ghost's territory. The locked data tests pass (7 files, 85 tests), and the build, typecheck, lint and lock check are green. There are no findings. Ghost's 12 declared deviations each fill a gap in my contract, and none breaks it. I'll fold three of them into the contract (Issues for other agents).

## Pre-flight
- **Part 2 files:** all read, none missing:
  - `.claude/agents/zero.md`
  - `codebase-analysis.md`
  - `docs/ui-contracts/decisions-approval-page.md` (revision 5: sections 1 to 3 in full, sections 6 to 8 and Appendix A read too)
  - `CR-W2 Pending decisions.md` (the row, and route 54 in section 5)
  - sprint `decisions.md`, plus main's b268381 entry (the 160 kB budget)
  - Frontend Map v0.6
  - the design library v1.1, read only where this diff touches it: `avAgo` (`jr`) and the approved stamp `14:06`
  - `Step 0 and Step 1 plan.md`
- **Branch:** `frontend/sprint-01/agent-zero-w0-data-review-frontend-a1`.
  - It started at 71e0c61, Ghost's a1 report. INT then told me to hold.
  - On INT's "go", it was fast-forwarded with `git merge --ff-only 3183bc1`, Ghost's new head, which sits on merge 087c9ca of main with the contract subpaths (D58).
  - The reviewed base is `git merge-base main HEAD` = 20d2915. Ghost's commits: dc051eb, b769c5a, 14506b4, 71e0c61, 3183bc1.
- **Part 7 commands:** all available.
  - `pnpm install --frozen-lockfile` refuses, because `pnpm-lock.yaml` doesn't list `packages/contract-mock`'s dependencies yet. That's expected: INT regenerates the lockfile at merge (decisions, "INT's answers before dispatch").
  - So I installed with `--no-frozen-lockfile`, then ran `git checkout -- pnpm-lock.yaml`, so I changed no tracked file.
  - `packages/contract` was built first, as INT and decisions (b268381) say.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZERO-01 | DONE | this report's commit |

## Findings
none

## Contract to files
| Contract item | Files | What I checked |
| --- | --- | --- |
| §1 the CR-W2 row: `PendingDecisionRow`, `DecisionChoice`, `CostImpact` | `apps/web/src/data/pending-decisions.ts` | Field for field against CR-W2 §2.1 to 2.3, on both members:<br>- **Optional:** `approve` and `reject`, and `costImpact` `{ micros: int, estimated }`.<br>- **Proposal:** `missionId` is a UUID, never null; `version` is an int ≥ 1.<br>- **Factory PR:** `missionId` and `clientName` are null; `changeId` is digits; `headSha` is 40 hex; `url` is a URL.<br>- It's the only web copy of the schema. |
| §1 `parsePendingPage` and `selectPendingPages` | same | One page: rows that parse are kept, the rest are counted. Over all loaded pages: rows concatenated in page order, `unreadable` summed, the last page's `nextCursor`. Nothing derived. |
| §1 route 54's wire body `{ version, choice, reason }` | `client.ts` (OpenAPILink over m1's `decide`) | UC-05 passes. |
| §2 surface: `createMock`, `Mock`, `RecordedRequest`, `MOCK_OPERATOR_ID`, `SeedRow`, `fixtures` | `packages/contract-mock/src/{mock,rows,fixtures,index}.ts` | Every name, signature and comment matches §2. `MOCK_OPERATOR_ID` is `0193a000-0000-7000-8000-000000000001`. |
| §2 through the contract: statuses, `NOT_FOUND` for other paths, both headers on every response, every error an `ErrorBody` | `mock.ts:283-314`, `mock.ts:121-142` | OpenAPI handler over `implement(contract)`. `customErrorResponseBodyEncoder` writes `ErrorBody`, with S1-3's `{ field, issues }` for `ValidationError`. |
| §2 fixtures | `fixtures.ts` | `step1`: two decidable proposals with different `clientName`s, one of them `budget_increase`; one with unparseable `options`; one factory PR. `many`: 150 proposals. |
| §2 route 52: open and unexpired proposals plus PRs, sorted by (`createdAt`, `ref`), `PageQuery` limits, opaque cursor, default 50, `costImpact` never sent | `mock.ts:213-241`, `rows.ts:135-169` | UC-02 passes. |
| §2 route 54: missing key 400 `"required"`; replay and `IDEMPOTENCY_KEY_REUSED`; the path wins; checks 1 to 5 in order; 201 resolved | `mock.ts:250-279`, `mock.ts:355-390` | UC-03 passes. |
| §2 controls: `failNext` (before any check, `times`, a new call replaces a pending one, written raw, network → `TypeError`, still recorded), `injectRawItem`, `bumpVersion`, `resolve`, `expire`, `remove`, `reset` | `mock.ts:329-343`, `mock.ts:393-454` | |
| §2 dev-only `/__mock/*` paths | Nemi's `apps/web/vite.config.ts` (on main) calls the mock's methods | Served only by the `apply: "serve"` plugin (§6), so not in `mock.fetch`. That's Ghost's deviation 8, and I accept it. |
| §3 `createApiClient`, `createApi`, `bindApi`, `apiFor`, `useApi`, the fetch wrapper | `apps/web/src/data/client.ts` | The wrapper is the only place headers are set:<br>- `X-Request-Id` is the given ID, or a new one per request.<br>- The key comes from the context, on writes only.<br>- A rejected fetch becomes `NetworkError(requestId)`.<br>- A response with no `X-Request-Id` gets the sent ID.<br>- The version check runs in the browser only.<br><br>`customErrorResponseBodyDecoder: decodeErrorBody`. A `WeakMap` binds each `Api` to its `QueryClient`, so there's no module-level client. |
| §3 `BUILT_CONTRACT_VERSION`, `useContractMismatch` | `contract-version.ts` | Comes from `__AVEL_CONTRACT_VERSION__`. The first mismatch is kept until reload; an absent or equal header is ignored. The server snapshot is null. |
| §3 `newIdempotencyKey` | `idempotency.ts` | `crypto.randomUUID()` |
| §3 `toUiError`, `decodeErrorBody`, `ApiError`, `NetworkError`, the 13 `UiError` kinds | `errors.ts` | The four branches run in §3's order. `stale` is keyed on `STALE_VERSION` alone (`errors.ts:81`). A non-`ErrorBody` 409 gives `conflict` with `code` null. All 13 kinds are present, each with its extra fields. UC-04 passes. |
| §3 `createQueryClient` | `query.ts` | `staleTime` 30s, refetch on focus and reconnect, at most 3 retries and only for `network` or `server`, `retryDelay` only when it's passed, mutations `retry: false` |
| §3 `formatAgo`, `formatClock` | `lib/time.ts` | `formatAgo` is DL's `jr`, token for token (`Math.max(0, Math.round(ms/1000))`, then `s`, `m`, `h m`). `formatClock` gives local zero-padded `HH:MM`. UC-06 passes. |
| §3 `getRouter()` | `router.tsx` | A new `QueryClient` and a bound `Api`. Context is `{ queryClient }`. `setupRouterSsrQueryIntegration`. On the server, `createIsomorphicFn().server` with `getRequest()` gives the origin and the incoming `X-Request-Id`, and cookies aren't forwarded. In the browser, `{}`. |
| §3 "A production build has no mock" | — | `grep -rn contract-mock apps/web/src` finds nothing. The client bundle holds none of `__mock`, `MOCK_OPERATOR_ID`'s value, `contract-mock` or `getRequest` (Verification). |
| UC-01 to UC-07 | `apps/web/test/data/*` (Fenn, locked at 033a4ae) | 7 files, 85 tests, all passing |

## Deviations
- **I reviewed a different head than the task doc expected.** The task doc starts me at Ghost's result commit. INT moved that to 3183bc1 (the client narrowed to the `decisions` route group for the bundle budget, on D58's subpaths), and I fast-forwarded to it on INT's instruction.
  - The narrowing (`client.ts:23`, `const webContract = { decisions }`) is still an `OpenAPILink` over `@avel/contract`'s own route definitions, so section 3's rule holds. It was INT's call.
- **ZERO-01's verify command doesn't filter.** `pnpm --filter @avel/web test -- test/data` runs the whole suite: 13 files, 105 failures, all in the not-yet-built kit and decisions tests (output below). So I also ran `npx vitest run test/data` in `apps/web`, which runs the locked data tests only: 7 files, 85 passed.
  - The plan's verify line is mine to fix (Issues for other agents).
- **The full test suite isn't green:** 105 failures in `test/kit/**` and `test/modules/decisions/**`. INT expected them: those builds haven't landed. None is in `test/data`.

## Limitations
- **The client's first load is 155.40 kB gzip** in my build (`dist/client/assets/index-BDSlPvoT.js`). INT's message gave 153.7 kB, perhaps measured another way.
  - Both are under sprint-01's 160 kB (decisions, b268381). The page isn't built yet, so this is the shell plus the data core.
  - Leah enforces the budget, and I didn't judge it here.
- **I didn't run the dev server or the end-to-end flow.** The mock's dev-server path (UC-29 to UC-31) is Fenn's e2e and Leah's to exercise.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Zero (me), the next UI contract revision.** These are gaps Ghost found and declared, which I'm taking into the contract:
  1. **Section 3's `ApiOptions.fetch`:** `typeof fetch` contradicts section 2's promise that `mock.fetch(request: Request)` can be passed as `fetch`. Ghost's `(request: Request, init?: RequestInit) => Promise<Response>` is the right type (deviation 1).
  2. **The `UiError` table needs a fallback row** for a 4xx it doesn't name. Ghost's `badRequest` (never retried, FM "never on 4xx") is what I'll write (deviation 4).
  3. **The nullable extras:** `stale`'s `field` and `currentVersion`, and `rateLimited`'s `retryAfterMs`, are null when `details` don't carry them (deviation 3).
  4. **Two small mentions:** `apps/web/src/data/index.ts` as the data core's entry (deviation 2), and route 52's `invalid cursor` 400 (deviation 5).
- **Zero, `plan.toml`:** ZERO-01's verify `pnpm --filter @avel/web test -- test/data` runs every test file. It needs a form that filters, for example `pnpm --filter @avel/web exec vitest run test/data`. Then re-render.
- **INT:**
  - Regenerate `pnpm-lock.yaml` when merging w0-data (the frozen install refuses as it stands), and switch `@avel/contract-mock` from `link:` to `workspace:*` (decisions, "INT's answers on Nemi's w0-app report").
  - Ghost's deviation 12 notes that its decisions aren't in `decisions.md`, which is outside its territory. I'll record them there with the contract revision.
- **Zane (w0-data review-security):** I checked these, but they're yours to judge:
  - the build's client bundle has no `__mock`, no `MOCK_OPERATOR_ID` value and no `getRequest`;
  - `router.tsx` imports `getRequest` from `@tanstack/react-start/server` at the top level, and only `.server(…)` uses it.
- **Leah:** a 155.40 kB gzip first load before the page and the kit land, against 160 kB.

## Files changed
`git diff --name-only main...HEAD`: this branch is Ghost's 3183bc1 fast-forwarded (INT), so the list holds Ghost's files and my report. My commit adds only `docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-data-review-frontend-completion.md`.

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
docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-data-review-frontend-completion.md
packages/contract-mock/package.json
packages/contract-mock/src/fixtures.ts
packages/contract-mock/src/index.ts
packages/contract-mock/src/mock.ts
packages/contract-mock/src/rows.ts
packages/contract-mock/tsconfig.json
```

## Verification
```
$ pnpm --filter @avel/contract build
> tsc -p tsconfig.json                                  (exit 0)

$ pnpm --filter "@avel/web..." build                   (exit 0)
apps/web build: dist/client/assets/app-Dz30enHM.css      31.47 kB │ gzip:   6.77 kB
apps/web build: dist/client/assets/index-BDSlPvoT.js    496.83 kB │ gzip: 155.40 kB
apps/web build: dist/server/server.js                   261.19 kB │ gzip: 63.18 kB
apps/web build: Done
(only warnings: "use client" module-level directives in @tanstack/react-query)

$ grep -rl "getRequest\|__mock\|0193a000-0000-7000-8000-000000000001\|contract-mock" apps/web/dist/client
(no match)
$ grep -rn "contract-mock" apps/web/src
(no match)

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck   (exit 0)
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done

$ pnpm lint                                             (exit 0)
Checked 183 files in 108ms. No fixes applied.

$ pnpm --filter @avel/web test -- test/data            (exit 1: runs the whole suite, see Deviations)
$ pnpm --filter @avel/web test                         (exit 1)
 Test Files  6 failed | 7 passed (13)
      Tests  105 failed | 85 passed (190)
  failures by file: test/kit/decision-tag 29, test/kit/error-panel 22, test/kit/reason-dialog 17,
  test/modules/decisions/deciding 7, errors 16, list 14  (kit and decisions not built yet: expected, INT)

$ (apps/web) npx vitest run test/data                  (exit 0)
 Test Files  7 passed (7)
      Tests  85 passed (85)

$ python3 scripts/check_locks.py                       (exit 0)

$ git diff --name-only main...HEAD
(the list under Files changed)
```
