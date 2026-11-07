# GHOST: w0-data build, completion report

verdict: DONE

## Summary
GHOST-01 (the contract mock, `@avel/contract-mock`) and GHOST-02 (the data core, `lib/time.ts` and `router.tsx`) are built and committed. All 85 locked tests pass (UC-01 to UC-07), and all five Part 7 commands exit 0. Both stop-and-report checks hold: the link's decoder hook, and the server request accessor (`getRequest()`). Two things are open for others. The client chunk is 163.7 kB gzipped before any screen exists, against Leah's 150 kB budget (Issues). And reviewers who ran these tests before this build need to clear Vitest's module cache once (Issues).

## Pre-flight
- **Part 2 files, all read:**
  1. `.claude/agents/ghost.md`, plus its Read first list: `packages/contract/**`, API and data reference, CR-17 (skimmed: CLI only) and Frontend Map v0.6;
  2. `codebase-analysis.md`;
  3. the UI contract (all of it, revision 5);
  4. CR-W2 (all of it);
  5. `decisions.md`;
  6. Frontend Map v0.6: In short, Modules, Layers, Rendering and SSR, Data layer, Security, Testing, Contract conventions, Folder layout and Territories in full; the rest skimmed;
  7. design library v1.1: only `avAgo` (`jr`) and `avTime` (`$f`), the two functions the data core ports;
  8. Step 0 and Step 1 plan: Step 1;
  9. to 12. UI contract sections 1 to 3, CR-W2 sections 1 to 6, `packages/contract/src/routes/decisions.ts` and `errors.ts` (also `base.ts`, `routes/route.ts`, `dto/decisions.ts`, `dto/common.ts` and `value-lists.ts`);
  13. FM's Data layer and Rendering and SSR;
  14. this task doc.

  I also read `locks.md`, escalations 01 and 02, Fenn's w0-data report, Nemi's w0-app report, the locked tests and `test/setup/**`, and `apps/web`'s config. Nothing was missing.
- **Branch:** `frontend/sprint-01/agent-ghost-w0-data-build-a1`, started at f470e0b.
- **Part 7 commands:** all available after `pnpm install`.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| GHOST-01 | DONE | dc051eb, and b769c5a (subpath imports: Deviation 9) |
| GHOST-02 | DONE | 14506b4 |

## Contract to files

**GHOST-01: `packages/contract-mock`**
- `package.json` and `tsconfig.json`. `exports` is the TypeScript source (`./src/index.ts`), so the tests and `vite.config.ts` load it without a build step. The `imports` map gives `#fixtures`, `#mock` and `#rows` (Deviation 9).
- **Dependencies added** (resolved in the local, uncommitted `pnpm-lock.yaml`):

  | Package | Specifier | Resolved |
  | --- | --- | --- |
  | `@avel/contract` | `workspace:*` | `link:../contract` |
  | `@orpc/openapi` | `1.16.2` | 1.16.2 |
  | `@orpc/server` | `1.16.2` | 1.16.2 |
  | `zod` | `4.6.7` | 4.6.7 |

  These are the contract's oRPC version (`@orpc/contract` 1.16.2) and its zod.
- `src/mock.ts` holds `createMock` with section 2's exact surface: `fetch`, `seed`, `bumpVersion`, `resolve`, `expire`, `remove`, `failNext` (written raw, with `times`, a new call replacing a pending one), `injectRawItem` (route 52's next response only), `requests()` and `reset()`. It also exports `MOCK_OPERATOR_ID`, `RecordedRequest` and `Mock`.
  - **Routes 52 to 54** go through `implement(contract)` and oRPC's `OpenAPIHandler` from `@orpc/openapi/fetch`. So paths, `PageQuery`, `DecideProposalInput`, the success statuses (route 54 answers 201 from m1's `route()`) and the typed errors are the contract's. A wrong shape is a type error.
  - **Every error is m1's `ErrorBody`.** The handler's `customErrorResponseBodyEncoder` writes it, so oRPC's error JSON never reaches the wire.
    - An input-validation error becomes `BAD_REQUEST` with `details: { field, issues: [{ field, message }] }`. Each issue's path is joined with `.`, the issues keep the validator's order, `field` is the first issue's field, and `message` is the first issue's message.
    - Any other `/api/*` path answers `NOT_FOUND`.
  - **Both headers on every response:** `X-Request-Id` (the request's, or a new UUID) and `X-Contract-Version`.
  - **Route 54:**
    - A missing key gives 400 `{ field: "Idempotency-Key", issues: [{ field: "Idempotency-Key", message: "required" }] }`, with `message` `"required"`.
    - The same key with the same path and body replays the first status and body. The same key with a different path or body gives `IDEMPOTENCY_KEY_REUSED`.
    - Then CR-W2's checks, in order: 1 is the schema only (the handler merges path over body, so the path's `proposalId` wins, S1-5); 2 `NOT_FOUND`; 3 `INVALID_TRANSITION` `{ allowed: [] }` when not open or `expiresAt ≤ now`; 4 `STALE_VERSION` `{ field: "version", currentVersion }`; 5 `BAD_REQUEST` `{ field: "choice" }`.
    - Success sets `state: "resolved"`, `choice`, `choiceReason`, `resolvedBy: MOCK_OPERATOR_ID`, `resolvedAt` (now) and `rowVersion + 1`, and answers 201 with `ProposalDto`.
  - **Route 52:**
    - It lists open proposals with `expiresAt > now`, plus every factory PR, oldest first by `createdAt` and then `ref`.
    - `limit` is 1 to 100 through `PageQuery`, and 50 when absent (provisional, finding 25). `nextCursor` is opaque (an encoded `(createdAt, ref)`).
  - **Route 53** returns `ProposalDto` for any seeded proposal.
  - **Every request is recorded before any check,** failed ones included: `route`, `method`, `path`, `requestId` (the request's header, or null), `idempotencyKey`, and `body` as received.
- `src/rows.ts` holds `SeedRow`, the stored row, `ProposalOptions` with Step 1's rule (at least 2 choices, unique `choice`, exactly one `approve` and one `reject`), and CR-W2's row. `approve` and `reject` are left out when `options` doesn't parse, and `costImpact` is never sent.
- `src/fixtures.ts`:
  - `empty`;
  - `step1`: two decidable proposals for two clients, one of them `budget_increase`; one proposal whose `options` has a single choice; and factory PR #142;
  - `many`: 150 decidable proposals.

  Times are relative to when the module loads, so the rows are open at the real clock.
- **The dev-only paths:** `POST /__mock/bump/{proposalId}` and `POST /__mock/reset` are served by Nemi's `avel:contract-mock` plugin in `vite.config.ts`, which calls this mock's `bumpVersion`, and `reset` then `seed(fixtures.step1)` (Deviation 8). I booted the dev server with `AVEL_API=mock`, and it starts cleanly (Verification, extra checks).
- **Done when:** UC-01 to UC-03 pass (5, 8 and 18 tests).

**GHOST-02: `apps/web/src/data`, `lib` and `router.tsx`**
- **`data/client.ts`:** `ApiOptions`, `ApiContext` (`{ idempotencyKey?: string }`), `createApiClient`, `createApi` (`{ client, orpc }` with `createTanstackQueryUtils`), `bindApi`, `apiFor` and `useApi` (a `WeakMap`, with no module-level client).
  - The link's `url` is `baseUrl`. By default it's `window.location.origin` in the browser, and the call throws on the server when `baseUrl` is missing.
  - `customErrorResponseBodyDecoder` is `decodeErrorBody`.
  - **The fetch wrapper** sets `X-Request-Id` (`requestId`, or a new UUID per request). On a non-GET request it sets `Idempotency-Key` from `options.context.idempotencyKey`. It then calls `opts.fetch ?? globalThis.fetch`:
    - a rejection becomes `NetworkError(requestId, cause)`;
    - a response without `X-Request-Id` is returned with the sent ID in that header;
    - in the browser only, `X-Contract-Version` is reported to the mismatch store.
- **`data/contract-version.ts`:** `BUILT_CONTRACT_VERSION` (`__AVEL_CONTRACT_VERSION__`), and `useContractMismatch()` over a module store (`useSyncExternalStore`). An absent or equal header changes nothing, and the first mismatch is kept until reload.
- **`data/idempotency.ts`:** `newIdempotencyKey()` is `crypto.randomUUID()`.
- **`data/errors.ts`:**
  - `ApiError` extends `ORPCError`: `code` is `body.code`, `status` the HTTP status, `message` `body.message`, and `data` is `{ details, requestId }`.
  - `NetworkError` extends `TypeError`, with `requestId` and `cause`.
  - `decodeErrorBody` returns an `ApiError` when `ErrorBody.safeParse` succeeds, else null.
  - `toUiError` takes section 3's four branches in order, and section 3's table. `stale` is keyed on `STALE_VERSION` alone. `UiError` is a discriminated union carrying `code` and `requestId` on every member.
- **`data/query.ts`:** `createQueryClient({ retryDelay? })`:
  - queries: `staleTime` 30s, refetch on focus and on reconnect, and up to 3 retries, only when `toUiError(e).kind` is `network` or `server`. `retryDelay` is TanStack's default unless given.
  - mutations: `retry: false`.
- **`data/pending-decisions.ts`:** `PendingDecisionRow` (a discriminated union on `kind`), `DecisionChoice` and `CostImpact`, transcribed from CR-W2 2.1 to 2.3, plus `parsePendingPage` (one page) and `selectPendingPages` (rows in page order, `unreadable` summed, the last page's `nextCursor`). It was committed with GHOST-01, because UC-01 checks the mock against it.
- **`data/index.ts`:** the data core's named exports (Deviation 2).
- **`lib/time.ts`:** `formatAgo` is DL's `avAgo` (`jr`) line for line. `formatClock` gives local `HH:MM`.
- **`router.tsx`:** `getRouter()` makes a new `createQueryClient()`, binds a new `createApi(...)`, passes `{ queryClient }` as context, and calls `setupRouterSsrQueryIntegration({ router, queryClient })`.
  - The server's options come from `createIsomorphicFn().server(...)`, using **TanStack Start's `getRequest()` from `@tanstack/react-start/server`** (the accessor this task asked me to name). They are `{ baseUrl: new URL(request.url).origin, requestId: request.headers.get("X-Request-Id") }`, with `requestId` only when the request has one.
  - The browser's options are `{}`.
  - Cookies aren't forwarded (W5).
- **Done when:** UC-01 and UC-04 to UC-07 pass (32, 7, 13 and 5 tests). That includes UC-04's round trips: `STALE_VERSION` through `createApiClient` comes out as `stale` with the mock's `requestId`, never `conflict`, and `IDEMPOTENCY_KEY_REUSED` comes out as `idempotencyConflict`.

**The two confirmations the notes ask for (both hold):**
1. **`@orpc/openapi-client` 1.16.2 is installed.** In `dist/shared/openapi-client.DgkI_tTF.mjs`, `decode()` (lines 185 to 216) calls `this.customErrorResponseBodyDecoder?.(deserialized, response)` at line 205, before `fillORPCErrorJsonStatus` and `createORPCErrorFromJson`, and throws what it returns at line 207. UC-04's round trips exercise it.
2. **`getRouter()` reaches the incoming request on the server** through `getRequest()` inside `createIsomorphicFn().server()`.
   - The built server's `fetch` handler, called in-process with and without an `X-Request-Id` (no network), renders the shell both times. The status is 404 only because Leon's `/` route doesn't exist yet. A `getRequest()` outside a request context would throw in `getRouter()` and answer 500.
   - The client bundle has no `getRequest` or `start-server-core`.

## Deviations
1. **`ApiOptions.fetch` is `(request: Request, init?: RequestInit) => Promise<Response>`, not `typeof fetch`.** Section 3 types it `typeof fetch`, but section 2 fixes `Mock.fetch(request: Request)` and says it "can be passed as createApiClient's `fetch`". Under `strict` those two don't fit together: `pnpm typecheck` failed on `test/setup/app.ts:39` and `test/data/errors.test.ts:300`. The wrapper only ever calls `fetch` with a `Request`, and `globalThis.fetch` still fits the wider type. So this keeps section 2's promise without changing a locked test.
2. **`apps/web/src/data/index.ts` is added.** Section 3 doesn't list it, but the codebase rule is that a module imports the data core only through its `index.ts` (codebase-analysis Conventions; FM, What every module looks like). Without it, Leon has nothing to import. It holds named exports only. `lib/time.ts` stays a direct import, because the rule names the kit, the data core and modules, not `lib`.
3. **Where section 3 is silent, `UiError`'s values can be null:**
   - In `stale`, `field: string | null` and `currentVersion: number | string | null`, for a `STALE_VERSION` whose `details` aren't m1's shape (for example a `failNext` with other data). The kind stays `stale`, keyed on the code.
   - In `rateLimited`, `retryAfterMs: number | null`, for a 429 without `details.retryAfterMs`. A non-`ErrorBody` 429 has no details.
4. **A 4xx that section 3's table doesn't name** (405, 410, 413, …) maps to `badRequest`, with `field` when `details.field` is a string. So it's never retried, as FM says ("never on 4xx"). Section 3 needed a total mapping and names no fallback.
5. **Route 52 with a cursor it can't decode** answers `BAD_REQUEST` with `{ field: "cursor", issues: [{ field: "cursor", message: "invalid cursor" }] }`, the `issues` shape S1-3 gives `limit`. The message `invalid cursor` is mine, and the page never shows it.
6. **Mock control details that section 2 leaves open:**
   - `resolve` sets `choice` to the `approve` choice (or `"approve"` when `options` doesn't parse), and `choiceReason` to `"Decided elsewhere."`, because `proposals_resolved_ck` needs all four resolution fields together.
   - `bumpVersion` and `expire` also raise `rowVersion` and set `updatedAt`, because the row changed.
   - All four controls throw on an id the store doesn't have, so `POST /__mock/bump/<unknown>` reaches the dev server's error handler instead of inventing a version.
   - `reset()` empties the store, failures, injected items, recorded requests and keys. Re-seeding `fixtures.step1` is the dev plugin's job (section 2).
7. **Route 54's order before CR-W2's checks:** a pending `failNext` comes first ("before any check"), then the missing key, then the idempotency replay or reuse, then checks 1 to 5. Every handler answer, errors included, is stored for its key, so a replay returns the first response whatever it was. Section 2 says "replays the first response" without exceptions.
8. **The dev-only paths aren't in `mock.fetch`.** Nemi's committed `vite.config.ts` plugin already serves `/__mock/bump/{proposalId}` and `/__mock/reset` by calling `bumpVersion`, `reset` and `seed(fixtures.step1)`, and `mock.fetch` answers `NOT_FOUND` for anything outside `/api/*`. Serving them in both places would be two copies of one rule, and `vite.config.ts` isn't mine. GHOST-01's "dev-only bump and reset paths" are covered by those methods.
9. **Subpath imports in the mock** (b769c5a). The first dev-server boot failed with `ERR_MODULE_NOT_FOUND .../contract-mock/src/fixtures.js`. `vite.config.ts` imports `@avel/contract-mock` natively, so Node's type stripping loads the `.ts` source, and Node doesn't map `./x.js` to `x.ts`. The mock now imports its own files through `package.json` `imports` (`#fixtures`, `#mock`, `#rows`), which Node, TypeScript and Vite all resolve to the `.ts` files. Node loads it, and the dev server now boots.
10. **`ApiClient` is typed by a small mapped type over `typeof contract`**, not `ContractRouterClient`. That type is in `@orpc/contract`, which isn't a direct dependency of `@avel/web` (and `package.json` is Nemi's). The mapped type gives each procedure its schema's `z.input` and `z.output`, with `Error` as the error type. The locked tests typecheck against it, including `response.items` and the `{ context: { idempotencyKey } }` options. If INT adds `@orpc/contract` to `@avel/web`, swapping in `ContractRouterClient<typeof contract, ApiContext>` is a one-line change.
11. **Smaller choices:**
    - `formatClock` returns `—` (DL's no-value mark) for a string that isn't a time, instead of `NaN:NaN`.
    - `Idempotency-Key` is set only on a non-GET request and only when the context carries one. A write without one goes out without it, and the server answers 400.
    - Any rejection of `fetch` becomes `NetworkError`, an abort included, as section 3 says.
12. **`decisions.md` isn't updated.** ghost.md says to record decisions there, but it's outside this task's territory. The decisions above are recorded here.

## Limitations
- **The SSR loader forwarding `X-Request-Id` isn't observed end to end.** No loader calls the API until Leon's route exists, and this session's permissions denied both a temporary log line with a running server and `curl` to the dev server. What is checked:
  - the code path (the server branch reads `getRequest().headers`);
  - the in-process render with the header;
  - UC-05 (the `requestId` option is sent on every request).

  UC-29 and Zane's review will see it with a real loader.
- **The client chunk is 163.7 kB gzipped** (530 kB raw), with only the shell and no screens. `OpenAPILink` is built over the whole `@avel/contract` (section 3), so every route's Zod schemas ship to the browser (for example 28 `/api/missions` paths are in the chunk). Issues, Leah and Zero.
- **Fixtures are timed from module load.** A dev server left running more than 7 days sees `step1` and `many` expire, because `/__mock/reset` re-seeds the same objects. Restarting the dev server fixes it.
- **The dev server needs `packages/contract` built,** because its `exports` point at `dist`, and its native import of the mock needs Node with type stripping on by default (22.18 or later). This machine runs Node 24.22.2, while the root `engines` says `>=22.12.0` (Issues, INT).
- **Route 53** is served but isn't called by the page in sprint-01 (section 2).

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Fenn and INT: Vitest 5's file-system module cache keeps the stubs.**
  - **What happens:** `fsModuleCache` (on by default, in `node_modules/.vitest-cache`) caches each test file's transform with its resolved imports. A worktree that ran the tests before `src/data/*` existed keeps resolving them to `test/setup/stubs/**` after the real files land, and the tests fail on the stubs.
  - **What I saw:** UC-01 failed against a correct schema until I ran `pnpm exec vitest --clearCache` in `apps/web`.
  - **The impact:** a fresh worktree is unaffected. Anyone who ran the w0-data tests before this build should run `pnpm --filter @avel/web exec vitest --clearCache` once. A lasting fix belongs in the locked `vitest.config.ts` (for example `fsModuleCache: false`, or a cache key that includes whether each subject exists). That's Fenn's file, and it needs a lock exception.
- **INT:**
  - Regenerate `pnpm-lock.yaml` at merge (escalation 01). The mock's dependencies are in the table above.
  - After this merges, `apps/web/package.json`'s `@avel/contract-mock` can move from `link:` to `workspace:*` (Nemi's Deviation 1).
  - The dev server's native import of the mock needs type stripping on by default (Node 22.18 or later), above the root `engines` floor of 22.12.
- **Leah and Zero:** the client chunk is 163.7 kB gzipped before any screen exists, against the page's 150 kB budget. Most of it is the whole contract's schemas plus Zod. Shrinking it means building the link over the routes the web calls (for example a `{ decisions }` sub-router) instead of all of `@avel/contract`, which differs from section 3's "over `@avel/contract`" and is Zero's call.
- **Leon:**
  - Import from `../../data` (`data/index.ts`), and from `../../lib/time` for `formatAgo` and `formatClock`.
  - Route 54's call is `api.client.decisions.decide(input, { context: { idempotencyKey } })`, or `orpc.decisions.decide.mutationOptions(...)` with the key in `context`.
  - `selectPendingPages` takes `InfiniteData<PendingPage>`.
  - `apiFor(context.queryClient)` in the loader; `useApi()` in the screen.
  - `stale.currentVersion` and `rateLimited.retryAfterMs` can be null (Deviation 3).
- **Zane:**
  - The wrapper is the only place headers are set (`data/client.ts`, `wrapFetch`).
  - The SSR branch forwards only `X-Request-Id` and the origin.
  - The production build's `dist` has no `__mock`, no `contract-mock` and no `0193a000-0000-7000-8000-000000000001`.
  - Nothing under `apps/web/src` imports `@avel/contract-mock`.
- **Brennan and Zero:** Deviations 1, 3, 4, 5 and 10 are places where section 3 was silent or didn't fit together, and each is a candidate for the next UI contract revision.

## Files changed
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
packages/contract-mock/package.json
packages/contract-mock/src/fixtures.ts
packages/contract-mock/src/index.ts
packages/contract-mock/src/mock.ts
packages/contract-mock/src/rows.ts
packages/contract-mock/tsconfig.json
docs/agent-dispatch/frontend/sprint-01/agent-ghost-w0-data-build-completion.md
```
`pnpm-lock.yaml` is changed locally and not committed (escalation 01).

## Verification
Run at 14506b4, in this worktree, after `pnpm install`.

```bash
pnpm --filter "@avel/web..." build
```
```
apps/web build: vite v8.3.6 building client environment for production...
apps/web build: ✓ 351 modules transformed.
apps/web build: dist/client/assets/ibm-plex-mono-400-DMJ8VG8y.woff2   14.70 kB
apps/web build: dist/client/assets/ibm-plex-mono-500-DSY6xOcd.woff2   14.88 kB
apps/web build: dist/client/assets/inter-variable-Dx4kXJAl.woff2      48.25 kB
apps/web build: (!) Some chunks are larger than 500 kB after minification. Consider: …
apps/web build: ✓ built in 278ms
apps/web build: vite v8.3.6 building ssr environment for production...
apps/web build: ✓ 175 modules transformed.
apps/web build: ✓ built in 174ms
apps/web build: Done
exit 0
```
(Rolldown's `"use client"` directive warnings from `@tanstack/react-query` are left out.)

```bash
pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
```
```
Scope: 3 of 6 workspace projects
packages/contract typecheck$ tsc -p tsconfig.json --noEmit
packages/contract typecheck: Done
apps/web typecheck$ node -e "import('vite').then((vite) => vite.resolveConfig({}, 'build'))" && tsc -p tsconfig.json
packages/contract-mock typecheck$ tsc -p tsconfig.json --noEmit
packages/contract-mock typecheck: Done
apps/web typecheck: Done
exit 0
```

```bash
pnpm lint
```
```
> biome check .
Checked 171 files in 82ms. No fixes applied.
exit 0
```

```bash
pnpm --filter @avel/web test
```
```
 Test Files  7 passed (7)
      Tests  85 passed (85)
exit 0
```

```bash
git diff --name-only main...HEAD   # only paths from Part 5
```
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
packages/contract-mock/package.json
packages/contract-mock/src/fixtures.ts
packages/contract-mock/src/index.ts
packages/contract-mock/src/mock.ts
packages/contract-mock/src/rows.ts
packages/contract-mock/tsconfig.json
```
Every path is in Part 5, and this report is added by the last commit.

**Per-task verifies:**
- **GHOST-01:** `pnpm --filter @avel/contract-mock typecheck && pnpm --filter @avel/web test -- test/data`. At dc051eb, the typecheck was clean and UC-01 to UC-03 passed 30 of 30; the 55 failures left were GHOST-02's subjects.
- **GHOST-02:** `pnpm --filter @avel/web typecheck && pnpm --filter @avel/web test -- test/data` was clean, with 85 of 85 passing.

**Extra checks:**
- **The mock under plain Node** (what the dev server's config does): `node -e "import('@avel/contract-mock')…"` with `fixtures.step1` gives route 52 `200`, `X-Contract-Version` `0.0.0`, and 4 items.
- **The dev server:** `AVEL_API=mock pnpm exec vite dev --port 5391` prints `VITE v8.3.6 ready in 442 ms` and runs until the 25s timeout, with no error. Before b769c5a it exited with `ERR_MODULE_NOT_FOUND` (Deviation 9).
- **The built server, in process:** `dist/server/server.js`'s `fetch` on `http://avel.test/`, with `X-Request-Id: probe-req-1` and without one, rendered `<!DOCTYPE html><html lang="en" data-theme="light">…` both times, with status 404 (no `/` route yet) and no error.
- **The production build's output:** `grep -rlE '__mock|0193a000-0000-7000-8000-000000000001|contract-mock' apps/web/dist` finds nothing, and `grep -rl "getRequest\|start-server-core" apps/web/dist/client` finds nothing.
- **The client chunk:** `index-CvPT97vD.js` is 530,073 bytes raw and 163,704 bytes gzipped.
