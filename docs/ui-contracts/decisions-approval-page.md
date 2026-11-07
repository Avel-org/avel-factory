# UI contract: the approval page (frontend sprint-01, Step 1)

Zero, 2026-11-06. Status: **revision 5, for Brennan's re-review** (`agent-brennan-approvals-uic-review-spec`, a5). Revision 1 (a138cd6) failed review a1 with 14 findings. Revision 2 (ad6d8bf) failed a2: 12 of them closed, and 04, 12 and the new 15 to 21 were open. Revision 3 (c836c29) failed a3 (report 44a3e08): 16 is open (narrowed), and 22 to 25 are new. Revision 4 also folds in Axis's S1-3 (Decisions, "Axis's S1-3"): errors are decoded at the link, and `BAD_REQUEST` details carry `issues`. It then takes in Axis's S1-5 (D48): path parameters win, and check 1 is the schema check only. Revision 4 (f323450) failed a4 (report 033ff65) on three P3s, 26 to 28, which revision 5 answers and changes nothing else. Appendix A lists where each finding is answered. Nothing is built against this contract until a review of it is merged.

This is the one document the sprint's builders and test writer work from:
- Nemi: the app and tokens.
- Ghost: the data core and the contract mock.
- Fantem: the kit.
- Leon: the `decisions` module.
- Fenn: the tests.

Each scenario has an ID (`UC-NN`, section 7), and a test carries it in its name. **Copy marked † is not the design library's.** It's written here, and each string is listed in Decisions, 2026-11-06, "Revision 2", "Revision 3" and "Revision 4".

## 0. Scope and sources

**What it is:** Step 1 item 13's minimal approval page at `/`. It lists what's waiting (route 52), and approves or rejects a proposal with a reason (route 54). It runs on the contract mock (`packages/contract-mock`) until backend Step 1 lands the routes.

**Sources**, quoted by short name:

| Short name | Where |
| --- | --- |
| CR-W2 | `docs/design/CR-W2 Pending decisions.md` (accepted Nov 6; D37) |
| FM | `docs/design/AVEL Web App — Frontend Map v0.6.md` |
| DL | `docs/design/AVEL Enclosure Grid · Design library v1.1.html` |
| | **Components:** `DecisionTag` (`function n$`), `ReasonDialog` (`Go`), `ErrorPanel` (`y8`, copy `AV_ERROR_COPY` = `v8`), `WidgetState` (`ly`), `Icon` (`te`), `Tag` (`Ze`), `HashChip` (`dt`), `StatusGlyph` (`ne`), `Button` (`ee`), `avAgo` (`jr`) |
| | **The Decisions screen:** the card `eD`, its `.pd` CSS, the screen `Mme` |
| | **The token stylesheet** |
| m1 | `packages/contract` at e36737f (backend sprint-00 m1): routes 52 to 54, `route()`, `DecideProposalInput`, `ProposalDto`, the error map, `PageQuery`, `Page`, `REQUEST_ID_HEADER`, `CONTRACT_VERSION_HEADER`, `IDEMPOTENCY_KEY_HEADER` |
| Plan | `docs/design/Step 0 and Step 1 plan.md`: item 13 and test 14 |
| Decisions | `docs/agent-dispatch/frontend/sprint-01/decisions.md` |

**Not in sprint-01.** Each is recorded in Decisions, 2026-11-06, "The UI contract":
- `/decisions/$ref`. It needs route 53's `ProposalViewDto` (CR-W2 section 4), which isn't in m1. It arrives with the Step 1 contract.
- The live stream, the event registry and the shared clock (W2). The page refetches instead.
- `/login` and the auth guard (W5, `system`).
- Showing cost: CR-W2 never sends `costImpact` in Step 1.
- A server-sent waiting count. The count is the client's count of what it has drawn until CR-W5 sends one (section 5; Decisions).
- The 6-second Undo hold, the J/K/A keys, the "new" pulse, the per-kind decision registries (W1), and the global app banner (section 5.5 puts sprint-01's one banner on the page).
- Parts of DL's Decisions screen (`Mme`) that section 5 lists under "Not drawn": the desk inbox with its detail pane, the lead's mission-health sentence, "Just decided", the project filter, "New project" and the projects section.

**The value rule.** Every colour, size, radius and duration is a `--av-*` token from `apps/web/src/styles`, **or the literal DL's own source uses for that same element** (for example the hole fill's `160ms`, or `.pd-actions`' `10px` gap). Nothing else, and never a value DL doesn't have.

## 1. The data: route 52 until the Step 1 contract lands

In m1, route 52 returns `Page(Placeholder)` (D30). The Step 1 slice makes it CR-W2's union (CR-W2 section 8, item 5). Until then:

- **The data core holds CR-W2's row as a Zod schema:** `apps/web/src/data/pending-decisions.ts`, transcribed from CR-W2 sections 2.1 to 2.3, field for field. That gives `PendingDecisionRow`, `DecisionChoice` and `CostImpact`. It is the only copy on the web side. The mock's tests check the mock's rows against it.
- **Each item route 52 returns** is parsed with it, one page at a time (`parsePendingPage`), inside the route's infinite query `select` (`selectPendingPages`), which joins the loaded pages (section 3).
  - Rows that parse are listed.
  - A row that doesn't parse is counted in `unreadable` and not drawn. The page shows the unreadable band (UC-24).
- **When the Step 1 contract exports `PendingDecisionDto`,** a later dispatch deletes the local schema and imports the contract's.
- **Route 54's input is m1's `DecideProposalInput`,** unchanged by CR-W2: `{ proposalId, version, choice, reason }`.
  - **On the wire,** `proposalId` is only in the path. m1's route uses oRPC's default `compact` input structure, and `OpenAPILink` 1.16.2 removes every path parameter from the body. So the web sends `POST /api/proposals/{proposalId}/decisions` with the body `{ version, choice, reason }` (finding 22).
- **Route 54's output** is m1's `ProposalDto` (`ProposalViewDto` in Step 1). The page reads **one field from it: `resolvedAt`**, for the approved line (section 4, change 5; FM line 134: the logged time is the server's).
- **The page never reads `options`** and never derives a title, evidence or consequence (FM line 134).

## 2. The contract mock (Ghost, `packages/contract-mock`, package `@avel/contract-mock`)

**It implements m1's routes 52, 53 and 54 through `@avel/contract`** (oRPC's OpenAPI handler on the contract), so paths, input validation, success statuses and the error body are the contract's (FM, In short, item 3).
- **Success statuses:** route 52 and 53 answer 200, and route 54 (a POST) answers **201**: m1's `route()` sets `successStatus` 201 on every POST (D26).
- **Other paths:** any other `/api/*` path answers `NOT_FOUND`.
- **Every response** carries `X-Request-Id`, echoing the request's or a new UUID, and `X-Contract-Version: <contractVersion>` (m1's `REQUEST_ID_HEADER`, `CONTRACT_VERSION_HEADER`).
- **Every error is m1's `ErrorBody`:** `{ code, message, details?, requestId }`, with the code's HTTP status. That covers the mock's own errors and `failNext`'s, and it's the same body the server's error mapper writes (Plan, Step 1 item 2.9).
  - The mock converts the OpenAPI handler's errors into it, so oRPC's own error JSON (`{ defined, code, status, message, data }`) never reaches the wire.
  - **An input-validation failure** (route 54's check 1, or `PageQuery`) is `BAD_REQUEST` with `details: { field, issues: [{ field, message }] }` (Axis, S1-3):
    - `issues` lists every failing path, in the validator's order. Each `field` is the issue's path joined with `.`, for example `"version"` or `"limit"`, and each `message` is the validator's message as it is.
    - `details.field` is the first issue's `field`, and `ErrorBody.message` is the first issue's `message`.
    - Path, query and body fields share one namespace (S1-3).

**Its public surface.** Fenn's tests are written against these names before the mock exists, so they're fixed:

```ts
export function createMock(opts: { contractVersion: string; now?: () => Date }): Mock;

export interface Mock {
  /**
   * Serves /api/* like the server. When a network failure is set, it rejects with a TypeError
   * instead. Extra arguments are ignored, so it can be passed as createApiClient's `fetch`.
   */
  fetch(request: Request): Promise<Response>;
  /** Replaces the store with these rows. */
  seed(rows: SeedRow[]): void;
  /** Another tab or agent changed the proposal: version + 1. Returns the new version. */
  bumpVersion(proposalId: string): number;
  /** Decided elsewhere: state 'resolved', with choice, resolvedBy and resolvedAt set. */
  resolve(proposalId: string): void;
  /** Expired: expiresAt moves into the past. */
  expire(proposalId: string): void;
  /** Deleted: the row is no longer in the store (route 54 then answers NOT_FOUND). */
  remove(proposalId: string): void;
  /**
   * The next `times` requests to that route (default 1) fail, before any check. Each call
   * replaces any failure still pending for that route. An error failure is written raw, past
   * the contract's error schemas, as ErrorBody: status, then
   * { code, message: message ?? code, details: data, requestId }, with the usual headers.
   * Use it for what m1's schemas can't express (for example Step 1's INVALID_TRANSITION.state).
   */
  failNext(
    route: 52 | 53 | 54,
    failure: { status: number; code: string; data?: unknown; message?: string } | { network: true },
    opts?: { times?: number },
  ): void;
  /** Route 52's next response carries this item as it is, after the store's rows (UC-24). */
  injectRawItem(item: Record<string, unknown>): void;
  /**
   * Every request the mock received, oldest first: also those failNext failed, a network
   * failure included, each with its requestId, idempotencyKey and body.
   */
  requests(): RecordedRequest[];
  reset(): void;
}

export interface RecordedRequest {
  route: 52 | 53 | 54 | null;
  method: string;
  path: string;
  requestId: string | null;
  idempotencyKey: string | null;
  body: unknown;                     // the JSON body as received, before the handler; null when there's none
}

export const MOCK_OPERATOR_ID = "0193a000-0000-7000-8000-000000000001"; // a fixed UUIDv7

export type SeedRow =
  | {
      kind: "proposal";
      id: string;                    // UUIDv7
      missionId: string;
      clientName: string | null;
      proposalKind: ProposalKind;    // from @avel/contract
      subjectKey: string;
      title: string;
      evidence: string;
      version: number;
      options: unknown;              // stored raw, like proposals.options (CR-W2 3.2)
      createdAt: string;
      expiresAt: string;
      state?: "open" | "resolved" | "expired";   // default "open"
      moduleRunId?: string | null;
    }
  | {
      kind: "factory_change";
      prNumber: number;
      title: string;
      headSha: string;               // 40 hex
      url: string;
      createdAt: string;
    };

export const fixtures: { empty: SeedRow[]; step1: SeedRow[]; many: SeedRow[] };
```

**Fixtures:**
- **`fixtures.step1`** has:
  - two decidable proposals, with different `clientName`s, one of them `budget_increase`;
  - one proposal whose `options` doesn't parse;
  - one factory PR.
- **`fixtures.many`** has 150 decidable proposals.

**Development-only paths**, for the end-to-end tests:
- `POST /__mock/bump/{proposalId}` runs `bumpVersion` and answers 200 `{ "version": n }` (UC-30).
- `POST /__mock/reset` runs `reset` and seeds `fixtures.step1` again, and answers 204. Each end-to-end test starts with it, because one mock instance serves every test (section 6).
- They're served only by the dev server under `AVEL_API=mock`. They're never contract routes, and never in a production build (section 6).

**Route 52** (CR-W2 sections 2 and 6.7):
- **What it lists:** open proposals with `expiresAt > now`, and every factory PR.
- **Order:** oldest first, by `createdAt` and then `ref`.
- **Paging:** `limit` must be 1 to 100. m1's `PageQuery` refuses anything else with `BAD_REQUEST`; there's no clamping (D23). `nextCursor` is opaque.
  - **With no `limit`, the mock serves 50.** This is **provisional**: m1's `PageQuery` has no default, and no source gives one (finding 25; Decisions, "Revision 4"). Axis confirms or changes it in the Step 1 slice. The page always sends `limit` 50 (section 5), and no scenario relies on the default.
- **Each item is the CR-W2 row:**
  - `ref` is `proposal:<id>` or `factory_change:<prNumber>`;
  - `approve` and `reject` are built from the `ProposalOptions` entries whose `effect` is `approve` and `reject`, and are absent when `options` doesn't parse (CR-W2 3.2);
  - `costImpact` is never sent.
- **The `ProposalOptions` rule:** at least 2 choices, and exactly one `approve` and one `reject`.

**Route 54** (CR-W2 section 5):
- **No `Idempotency-Key` header:** `BAD_REQUEST`, `details: { field: "Idempotency-Key", issues: [{ field: "Idempotency-Key", message: "required" }] }`, and `message` `"required"` (Axis, S1-1 and S1-3).
- **The idempotency rules:**
  - The same key with the same path and body replays the first response, status and body.
  - The same key with a different path or body gets `IDEMPOTENCY_KEY_REUSED`.
- **The body the web sends is `{ version, choice, reason }`;** `proposalId` comes from the path (section 1). **The path wins** (Axis, S1-5; D48): oRPC's OpenAPI handler merges `{ ...body, ...params }`, and a `proposalId` in the body is ignored, never compared or refused. The mock does the same and doesn't read the raw body.
- **Then the checks, in CR-W2's order:**
  1. `BAD_REQUEST`, `{ field, issues }`: the schema check only, with the failing paths as above (CR-W2 section 5 as edited by D48).
  2. `NOT_FOUND`.
  3. `INVALID_TRANSITION`, `{ allowed: [] }` through m1's schema, with no `state` (UC-17 uses `failNext` for Step 1's `state`).
  4. `STALE_VERSION`, `{ field: "version", currentVersion }`.
  5. `BAD_REQUEST`, `{ field: "choice" }`.
- **On success**, the proposal resolves as CR-W2 section 5 writes it: `state: "resolved"`, `choice`, `choiceReason` (the reason), `resolvedBy: MOCK_OPERATOR_ID`, `resolvedAt` (now), and `rowVersion + 1`. The answer is **201** with m1's `ProposalDto`.

**Route 53** returns m1's `ProposalDto` for any seeded proposal. The page doesn't call it in sprint-01; it's there so the mock matches the contract.

## 3. The data core (Ghost, `apps/web/src/data/**`, `apps/web/src/lib/**`, `apps/web/src/router.tsx`)

| Export | From | What |
| --- | --- | --- |
| `createApiClient(opts?: ApiOptions)`, with `ApiOptions = { fetch?: typeof fetch; baseUrl?: string; contractVersion?: string; requestId?: string }` | `data/client.ts` | `createORPCClient` with `OpenAPILink` over `@avel/contract` (FM, Data layer). The link's `url` is `baseUrl`: by default `window.location.origin` in the browser, and required on the server. Its `fetch` is the wrapper below, and its `customErrorResponseBodyDecoder` is `decodeErrorBody` ("Reading an error") |
| | | **The fetch wrapper** is the only place the client sets headers. On every request it sets `X-Request-Id` to `requestId` when given, else to a new UUID. On a write it sets `Idempotency-Key` from the call's client context (`{ context: { idempotencyKey } }`; the link passes the context to `fetch`). Then it calls `opts.fetch ?? globalThis.fetch` |
| | | **If that fetch rejects,** the wrapper throws `NetworkError` carrying the ID it sent. **If a response has no `X-Request-Id`,** the wrapper returns it with the sent ID in that header. So every response the link reads carries a request ID (finding 23) |
| | | **The contract check, in the browser only:** the wrapper compares each response's `X-Contract-Version` with `contractVersion` (default `BUILT_CONTRACT_VERSION`). When the header is present and differs, it sets the mismatch store. When it's absent, nothing happens. On the server the check is skipped: the store is a module store, which the server would share across requests |
| `createApi(opts?: ApiOptions): Api` | `data/client.ts` | `Api = { client, orpc }`: `createApiClient(opts)`, and `createTanstackQueryUtils` over it |
| `bindApi(queryClient: QueryClient, api: Api): void`; `apiFor(queryClient: QueryClient): Api`; `useApi(): Api` | `data/client.ts` | Pairs one `Api` with one `QueryClient` (a `WeakMap`). `apiFor` throws when none is bound. `useApi()` is `apiFor(useQueryClient())`. A loader reaches the API with `apiFor(context.queryClient)`, so the router context stays `{ queryClient }`. There's no module-level client: each `QueryClient` has its own `Api` (finding 24) |
| `BUILT_CONTRACT_VERSION` | `data/contract-version.ts` | The `@avel/contract` version this web was built with: the build-time constant `__AVEL_CONTRACT_VERSION__`. Nemi's `vite.config.ts` and Fenn's `vitest.config.ts` define it from `packages/contract/package.json`'s `version`, until `@avel/contract` exports a version itself (escalation 02) |
| `useContractMismatch(): { serverVersion: string } \| null` | `data/contract-version.ts` | Reads the mismatch store (`useSyncExternalStore`). Null until the first mismatch, then fixed until reload |
| `newIdempotencyKey(): string` | `data/idempotency.ts` | `crypto.randomUUID()`, made once per user intent (FM 206) |
| `toUiError(e: unknown): UiError` | `data/errors.ts` | The only error mapper (FM, Errors by code), below |
| `decodeErrorBody`, `ApiError`, `NetworkError` | `data/errors.ts` | Below, "Reading an error" |
| `createQueryClient(opts?: { retryDelay?: number }): QueryClient` | `data/query.ts` | **Queries:** `staleTime` 30s (FM's freshness table, "reconnecting or down", because sprint-01 has no stream); refetch on focus and on reconnect; retry up to 3 times, only on `network` and `server` |
| | | **The retry delay:** TanStack's default unless `retryDelay` is given (in ms). Screen tests pass `0`; the page never does |
| | | **Mutations:** never retried automatically |
| `PendingDecisionRow`, `DecisionChoice`, `CostImpact` | `data/pending-decisions.ts` | Zod schemas, CR-W2 sections 2.1 to 2.3 (section 1 above) |
| `parsePendingPage(page): { rows: PendingDecisionRow[]; unreadable: number; nextCursor: string \| null }` | `data/pending-decisions.ts` | Parses **one** route 52 page |
| `selectPendingPages(data: InfiniteData<Page>): { rows: PendingDecisionRow[]; unreadable: number; nextCursor: string \| null }` | `data/pending-decisions.ts` | Route 52's infinite query `select` (TanStack Query passes it every loaded page). It runs `parsePendingPage` on each of `data.pages`: `rows` are concatenated in page order (the server's order), `unreadable` is summed over the loaded pages, and `nextCursor` is the last page's |
| `formatAgo(ms: number \| null): string` | `lib/time.ts` | DL's `avAgo`, word for word: null or not finite gives `—`; under 60s gives `Ns`; under 60m gives `Nm`; otherwise `Nh Mm` |
| `formatClock(iso: string): string` | `lib/time.ts` | Local `HH:MM`, zero-padded, as DL's approved stamp shows it (`14:06`) |
| `getRouter()` | `router.tsx` | Called per request on the server and once in the browser. It makes a new `QueryClient` (`createQueryClient()`) and a new `Api` bound to it (`bindApi`), passes `{ queryClient }` as the router context, and wires Router and Query with `setupRouterSsrQueryIntegration`, which provides the `QueryClient` to the app (FM, Rendering and SSR) |
| | | **In the browser:** `createApi()`: same origin, a new `X-Request-Id` per request |
| | | **On the server:** `createApi({ baseUrl: <the incoming request's origin>, requestId: <its X-Request-Id, when it has one> })`. The loader's client forwards the incoming request ID (FM line 141). The incoming request is read with TanStack Start's server request accessor, inside `createIsomorphicFn().server(…)`, so it stays out of the client bundle. If `getRouter()` can't reach the incoming request, Ghost stops and reports under Deviations |
| | | **Cookies aren't forwarded** in sprint-01: there are no sessions until W5 (Decisions, "Revision 4"). W5 adds the cookie beside the request ID |

**One data path for each environment** (finding 24):
- **Unit and screen tests (Vitest):** one mock per test. The test makes `createApi({ fetch: mock.fetch, baseUrl: "http://avel.test" })` and binds it to its `QueryClient` with `bindApi`.
- **Development and end to end (`AVEL_API=mock`):** **one mock instance**, held by the dev server (section 6). The browser's client fetches `/api/*` on its own origin. The SSR loader's client fetches the same origin over HTTP (`baseUrl` = the incoming request's origin). Both reach that one instance, so a decision, a bump or a reset is seen by the first paint and the hydrated page alike.
- **A production build has no mock.** Nothing under `apps/web/src` imports `@avel/contract-mock`: only the dev server's plugin in `vite.config.ts` and the tests do. Sprint-01 has no API server, so the production build is built and checked (section 8, Zane), not served against an API.

**Reading an error.** The wire body is m1's `ErrorBody`, not oRPC's error JSON (Axis, S1-3). Left alone, oRPC's client guesses the code from the status, so a 409 `STALE_VERSION` would arrive as `CONFLICT`. So the body is decoded **once, at the link** (Decisions, "Revision 4"; it replaces revision 3's reading of `e.data.body` in `toUiError`):
- **`decodeErrorBody(body: unknown, response: { status: number }): ApiError | null`** is the link's `customErrorResponseBodyDecoder`.
  - `@orpc/openapi-client` 1.16.2 calls it with the deserialized body and the response before its own error decoding, and throws what it returns (`dist/shared/openapi-client.DgkI_tTF.mjs`, `#decodeResponse`). If the installed version differs, Ghost stops and reports under Deviations.
  - If `ErrorBody.safeParse(body)` succeeds (`ErrorBody` from `@avel/contract`), it returns `new ApiError(body, response.status)`. Otherwise it returns null, and oRPC throws its own `ORPCError`, with a code guessed from the status and `e.data = { status, headers, body }`.
  - When the Step 1 contract exports `parseErrorBody(status, body)` (S1-3), it replaces the `safeParse` here, and nothing else changes.
- **`ApiError`** extends `ORPCError`: `code` = `body.code`, `status` = the HTTP status, `message` = `body.message`, and `data = { details: body.details, requestId: body.requestId }`.
- **`NetworkError`** extends `TypeError`, with `requestId: string` (the ID sent) and `cause` (what `fetch` threw). Only the fetch wrapper throws it.

`toUiError(e)` works in this order:
1. **`ApiError`:** `code`, `details` and `requestId` come from `e.code` and `e.data`, the status is `e.status`, and the kind comes from the table below.
2. **Any other `ORPCError`** (the body isn't an `ErrorBody`): the kind comes from `e.status` alone, and `code` is null. `requestId` is `e.data.headers["x-request-id"]`: the server's echo, or the ID sent, which the wrapper puts there when there's no echo. 409 maps to `conflict` here, never `stale`.
3. **`NetworkError`:** `network`, with `requestId` = `e.requestId`.
4. **Anything else** (the link couldn't read or decode the response body at all): `network`, with `requestId` null. This is the one error with no request ID, because nothing that carries the ID reaches the mapper (Decisions, "Revision 4").

**`UiError`.** Every member carries `code: string | null` and `requestId: string | null`, read as above.

| `kind` | When | Extra fields |
| --- | --- | --- |
| `stale` | 409 `STALE_VERSION` | `field`, `currentVersion` |
| `notAllowedNow` | 422 `INVALID_TRANSITION` | `state?: 'resolved' \| 'expired'` (when `details.state` is sent) |
| `notFound` | 404 (any code) | |
| `badRequest` | 400 | `field?: string` (from `details.field`) |
| `signedOut` | 401 | |
| `forbidden` | 403 (any code) | `message` |
| `rateLimited` | 429 | `retryAfterMs` (from `details.retryAfterMs`) |
| `idempotencyConflict` | 409 `IDEMPOTENCY_KEY_REUSED` | |
| `inProgress` | 409 `IDEMPOTENCY_IN_PROGRESS` | |
| `conflict` | 409, any other code (`CONFLICT`, `ALREADY_EXISTS`, …) | `message` |
| `unprocessable` | 422, any other code | `message` |
| `server` | 5xx | `status` |
| `network` | the fetch rejected | |

`stale` is keyed on the code `STALE_VERSION` alone, never on the status 409 (Decisions, 2026-11-06).

## 4. The kit (Fantem, `apps/web/src/kit/**`)

These are DL's components, ported with their `data-ui` names, values and copy. They take plain props and know nothing about oRPC or routes (FM, Layers).
- **Each table row lists the subset of DL's props** the kit ports. The props left out are named, so they come back with a later screen.
- **"Changes"** are the only differences from DL.

| Component | `data-ui` | Props ported | Left out of DL's | Changes |
| --- | --- | --- | --- | --- |
| `Button` | `Button` (with a reason: `ButtonWithReason`) | `variant`, `size`, `block`, `disabled`, `disabledReason`, `icon`, `iconRight`, `onClick`, `children` | `holdToConfirm`, `onConfirm`, `pressed`, `type`, `title`, `ariaLabel`, `style` | none |
| `Tag` | `Tag` | `tone`, `size`, `icon`, `title`, `children` | `glyph`, `style` | none |
| `Icon` | `Icon` (DL: `data-ui="Icon"`, `data-icon={name}`) | `name`, `size` (16), `strokeWidth` (1.75), `title` (gives `role="img"`) | `style` | Per-icon imports from `lucide-react` instead of DL's registry |
| `StatusGlyph` | `StatusGlyph` | `status`, `size` | `onColor` | none |
| `HashChip` | `HashChip` | `value`, `kind`, `length`, `prefix`, `strike`, `copy` | `verified`, `href`, `title` | none. DL's copy button is kept: `aria-label` `Copy {value}` |
| `ReasonDialog` | `ReasonDialog` | `open`, `onClose`, `onConfirm(reason)`, `title`, `description`, `confirmLabel`, `destructive`, `placeholder`, `minLength` (3) | none | R1 to R4, below |
| `ErrorPanel` | `ErrorPanel` | `code`, `title`, `body`, `actionLabel`, `onAction`, `requestId`, `compact` | none | E1, below |
| `WidgetState` | `WidgetState` | `state` (`loading`, `empty`, `error` or `staleVersion`), `title`, `message`, `icon`, `actionLabel`, `onAction`, `lastGoodAge`, `children` | `needs`, `height`, `lines`, `compact`; the states `notConfigured` and `populated` | W1, below |
| `DecisionTag` | `DecisionTag` | below | `compact`, `hideActions`, `onOpen` and the "Open" link button | D1 to D14, below |

**The request ID, everywhere it's shown,** is DL's `ErrorPanel` chip: `HashChip` with `kind: "hash"`, `length: 12`, `prefix: "req"` and DL's copy button (`aria-label` `Copy {requestId}`), so the full ID is always one tap away (FM, Errors by code). Tests find it by that `aria-label`.

**`ReasonDialog`:**
- **R1. `error?: string`** shows under the textarea with `role="alert"`.
- **R2. `defaultReason?: string`.** On open, the text is set to `defaultReason ?? ""`. DL clears it to `""` on every open, so this replaces that. It lets the page reopen the dialog with the reason it sent (5.3, reason 400).
- **R3. `onConfirm` doesn't close the dialog.** DL's calls `onClose` after `onConfirm`. Here the caller closes it.
- **R4. `requestId?: string`** draws the request ID chip under `error` (finding 16).

**`ErrorPanel`:**
- **E1. No action unless `onAction` is given.** DL always draws its button. Here the button (`actionLabel ?? DL's action copy`) is drawn only when `onAction` is set.
- (Revision 2's E2 is withdrawn: DL already draws the request ID as a copyable `HashChip`, and that's kept.)
- **Callers always pass `body`.** DL's 403 and 404 bodies are specimen text for other screens, and the page never uses them (5.3, 5.4).

**`WidgetState`:**
- **W1. `requestId?: string`** draws the request ID chip under the `error` state's message.

**`DecisionTag`** (DL's `n$` and its specimen states, with the changes below):

```ts
type DecisionTagProps = {
  layout: "desk" | "phone";
  variant: DecisionVariant;          // DL's AV_DECISION_VARIANTS keys; unknown → "Decision", circle
  idLabel?: string;                  // a HashChip kind "id"; absent → no chip
  title: string;
  clientName?: string | null;
  age?: string;                      // "Waiting 6m"
  binds?: { label: string; value: string; kind: "version" | "sha" };
  evidence?: string;
  consequence?: string;
  state: "seen" | "approving" | "rejecting" | "approved" | "rejected" | "stale" | "notAllowed";
  staleNote?: string;
  staleAction?: string;
  notAllowedReason?: string;
  approvedAt?: string;               // "14:06"
  approveLabel?: string;             // absent → no Approve button
  rejectLabel?: string;              // absent → no Reject button
  link?: { label: string; href: string };
  actionsDisabledReason?: string;
  inlineError?: React.ReactNode;
  requestId?: string;                // the chip under the stale note, the Locked reason or the countdown
  onApprove?: () => void;
  onReject?: () => void;
  onReview?: () => void;
  onRefresh?: () => void;
};
```

| # | Change from DL's `DecisionTag` | Why |
| --- | --- | --- |
| D1 | **Flat props** instead of DL's `decision` object. `variant`, `title`, `binds`, `evidence`, `consequence`, `staleNote`, `staleAction`, `notAllowedReason` and `approvedAt` keep DL's meaning | Kit props are plain values (FM, Layers) |
| D2 | **`idLabel` is optional.** With no id the chip isn't drawn, and the `aria-label` is `{kind}: {title}` instead of `{kind} {id}: {title}` | A UUIDv7's leading characters are its timestamp, so a short form doesn't tell rows apart (Decisions) |
| D3 | **`clientName`** is drawn after the kind label, as DL's Decisions card (`eD`) draws the project. Null or absent draws nothing | CR-W2 2.1; INT |
| D4 | **Approve and Reject only call back.** DL's inline reject textarea goes, and the page opens `ReasonDialog` for both | Route 54 needs a reason for both (CR-W2 section 5) |
| D5 | **Approved line:** `Approved by you at {approvedAt}. Logged with {binds.label}.` DL has "Logged with" plus the SHA's first 7; here it's the binding's label. **Rejected line:** DL's, unchanged | A version, not a SHA, is bound |
| D6 | **`binds.kind: "version"`** draws `Binds to {label}` (for example `Binds to Version 4`) as text, struck through in `stale`. `kind: "sha"` is DL's `HashChip` with `prefix` = `label` | As D5 |
| D7 | **New state `rejecting`:** the Reject button reads `Rejecting…`†, and both buttons are disabled | The pair to DL's `approving` |
| D8 | **Buttons by state:** | Deciding a version you haven't reviewed is refused (409); a `notAllowed` decision gets 422 or 404 either way |
| | `seen`: both enabled | |
| | `approving` and `rejecting`: both disabled | |
| | `stale`: both disabled (DL disables only Approve) | |
| | `notAllowed`: **no buttons**, even with labels (DL disables Approve and leaves Reject) | |
| | `approved` and `rejected`: no buttons (DL) | |
| | With no labels: no buttons | |
| D9 | **The "Open" link button and `onOpen` go.** `link`, when given, is drawn instead: the same link-style `Button` with DL's `arrow-up-right` icon, opening `href` in a new tab with `rel="noopener noreferrer"` | There's no detail page in sprint-01; a factory PR opens on GitHub |
| D10 | **New props:** `actionsDisabledReason` disables both buttons; the Approve button carries it as DL's `Button` `disabledReason` (shown beside it, and `aria-describedby`). `inlineError` is drawn above the actions. `onRefresh` adds `Refresh list`† in `notAllowed` | 5.3's error states |
| D11 | **Phone actions:** DL's Decisions card on a phone, `.pd[data-phone] .pd-actions`: a two-column grid (`minmax(0, 1fr) minmax(0, 1.4fr)`, gap `10px`), Reject left and Approve right, both filling their column | DL's `DecisionTag` makes only Approve full width; the Decisions screen's card is the phone design |
| D12 | **Reduced motion:** the stamp uses `--av-d-punch`, which DL's reduced-motion block sets to 0. The hole fill keeps DL's `av-hole-fill 160ms var(--av-ease)` and is **not animated under `prefers-reduced-motion`**: it appears filled | DL's 160ms is a literal that its reduced-motion block doesn't cover |
| D13 | **`rejectLabel`** is new (DL's Reject is the fixed text `Reject…`). The button reads `{rejectLabel}…`, keeping DL's ellipsis because it opens a dialog; for `Reject` that's DL's `Reject…`. Absent → no Reject button. The Approve button reads `approveLabel` as DL's does | CR-W2 2.2 gives each row its own labels |
| D14 | **`requestId`** draws the request ID chip under the stale note (`stale`), the Locked reason (`notAllowed`), or the countdown (`actionsDisabledReason` from a 429) | FM: the request ID is always shown (finding 16) |

The state tag stays DL's:
- "Needs you" for `seen`, `approving` and `rejecting`;
- "Approved", "Rejected" and "Changed" (stale);
- "Locked" for `notAllowed`.

## 5. The page (Leon, `apps/web/src/modules/decisions/**`, `apps/web/src/routes/index.tsx`)

**Route:** `/`, `ssr: true` (FM, Rendering).
- The loader runs `ensureInfiniteQueryData` on route 52's `infiniteOptions` (`limit` 50, always sent), from `apiFor(context.queryClient)`.
- The component reads the same options with `useSuspenseInfiniteQuery`.

**The module** has `api.ts` (route 52's query options and route 54's mutation, each built from an `Api`: the loader passes `apiFor(context.queryClient)`, and the screen uses `useApi()`), `decisions.ts` (the proposal and factory PR renderers), `screens/DecisionsScreen.tsx`, `index.ts` (named exports only) and `screens.ts`, which exports `DecisionsScreen` (a named export, from `screens/DecisionsScreen.tsx`). `routes/index.tsx` imports only `screens.ts` (FM, What every module looks like).

**Layout**, from DL's Decisions screen (`Mme`):
- The root carries `data-ui="DecisionsPage"`†. DL's screen root has no `data-ui`; this one exists so tests and reviews can find the page.
- The eyebrow is `Home`, and the `h1` is `Decisions`.
- **The lead line:** DL's first sentence only: `{n} thing needs you.` or `{n} things need you.`, or `Nothing needs you right now.` when no row is drawn.
- **The heading:** `h2` `Waiting for you` (DL), then the count.
- **The list:** a `<ul aria-label="Waiting for you">` with one `<li>` per row.

**Not drawn from `Mme`** (Decisions, "Revision 3"): this is Step 1's minimal page, one list.
- **No desk inbox.** Both layouts are a flat list of `DecisionTag`s, with no detail pane and no `listbox`/`option` semantics. The detail pane belongs to `/decisions/$ref`, which waits for Step 1.
- **The lead is the count sentence only.** The mission-health sentence needs CR-W5.
- **Not drawn:** "Just decided", the project filter, "New project" and the projects section.

**The count** is the number of rows drawn, counted on the client, because route 52 sends no total until CR-W5 (Decisions). While `nextCursor` isn't null, `+` follows it, and a `Load more`† button (`Button`, secondary) sits under the list.

**Phone** is `max-width: 899px` (DL's Decisions screen). On a phone, tags use `layout="phone"`. On a desk, `layout="desk"`.

### 5.1 How each row is drawn

| Row | `DecisionTag` props |
| --- | --- |
| **`proposal` with `approve` and `reject`** | `variant` from `proposalKind`: parked→`parked`, contract_change→`contract`, quarantine→`quarantine`, budget_increase→`budget`, test_change→`testChange`, gate5→`finding`, repin→`repin`; the other six → the generic `Decision` |
| | no `idLabel`; `title`; `clientName`; `age` = `Waiting {formatAgo(now − createdAt)}` (DL `eD`) |
| | `binds = { kind: "version", label: "Version {version}"†, value: String(version) }` |
| | `evidence`; `consequence` = `approve.consequence`; `approveLabel` = `approve.label`; `rejectLabel` = `reject.label` |
| **`proposal` without `approve` or `reject`** | as above, without the labels; `state: "notAllowed"`; `notAllowedReason`: `This decision's options can't be read, so it can't be decided here.`† |
| **`factory_change`** | `variant: "factoryPr"`; `idLabel: "#{prNumber}"`; `title`; `age`; `binds = { kind: "sha", label: "Commit", value: headSha }` (DL's R-7 specimen labels a commit binding `Commit`) |
| | `link = { label: "Open on GitHub"†, href: url }`; no labels; `state: "seen"` |

- **`now`** is the time of the latest successful route 52 fetch. Ages don't tick on their own in sprint-01: there's no shared clock until W2.
- **No row shows cost** (`costImpact` is absent in Step 1).

### 5.2 Deciding

1. **Tap Approve or Reject.** `ReasonDialog` opens:

   | | Approve | Reject |
   | --- | --- | --- |
   | `title` | `Approve this decision?`† when the label is `Approve`, else `{label}?` | `Reject this decision?` (DL) when the label is `Reject`, else `{label}?` (DL) |
   | `description` | `{title}. {approve.consequence} Your reason goes on the record.`†, adapted from DL's reject copy | `{title}. {reject.consequence} Your reason goes on the record and is shown to whoever picks it up next.` (DL) |
   | `confirmLabel` | the label | the label |
   | `destructive` | false | false |

   `minLength` is 3 (DL's default; the contract accepts 1 or more, so this is stricter, never looser).
2. **Confirm.** The page:
   - closes the dialog;
   - makes a new key with `newIdempotencyKey()`;
   - sets the row to `approving` or `rejecting` within 100ms (FM 207);
   - calls route 54 with the input `{ proposalId, version: row.version, choice: approve.choice | reject.choice, reason }` (the reason trimmed) and the key. **On the wire** that's `POST /api/proposals/{proposalId}/decisions` with the body `{ version, choice, reason }` (section 1).

   **The body comes from the row as it was drawn,** never from a refetch (FM 205).
3. **2xx:**
   - `approve` gives `approved`, with the punch and `approvedAt = formatClock(response.resolvedAt)`;
   - `reject` gives `rejected`;
   - after `--av-d-punch`, route 52 is invalidated, and the row leaves when the refetch lands (CR-W2 6: a decided proposal is gone from route 52).
4. **Retry** re-sends **the same body with the same key.** It applies after `network`, `server` or `inProgress`. A new key is made only for a new confirm.
5. **Offline** (`navigator.onLine` is false): every row has `actionsDisabledReason: "You're offline."`†, and nothing is queued (FM 208).

### 5.3 Errors on route 54, by `UiError.kind`

Every error on the page shows its request ID chip (section 4). Where:
- an `ErrorPanel`'s `requestId`;
- `DecisionTag`'s `requestId` (D14) for `stale`, `notAllowedNow`, `notFound` and `rateLimited`;
- `ReasonDialog`'s `requestId` (R4) for a reason 400;
- the `network` and `server` band;
- `inProgress` ends as `network`.

The one exception is section 3's fourth branch (a response body the link can't read), which has no ID to show.

| `kind` | What the row does | Action |
| --- | --- | --- |
| `stale` | `state: "stale"`; binding struck; `staleNote: "Version {currentVersion} arrived while you were reading."`; `staleAction: "Review version {currentVersion}"` (DL's B-2 specimen copy) | **Review** refetches route 52, and the row comes back with the new version in `seen`. **Nothing is re-sent, ever** (FM, In short, item 5). If the row is gone after the refetch, the list shows `That decision was settled elsewhere.`† (`role="status"`) |
| `notAllowedNow` | `state: "notAllowed"`, with `notAllowedReason` set by `state`: | `onRefresh`: `Refresh list`† refetches route 52. A row the refetch still lists comes back from the server in `seen`, as `stale`'s does: the page keeps no state the server doesn't send |
| | `state` resolved: `This decision was already made.`† | |
| | `state` expired: `This decision expired.`† | |
| | no `state`: `This can't be decided now.`† | |
| `notFound` | as `notAllowedNow`, with `This decision no longer exists.`† | as above |
| `badRequest`, `field: "reason"` | The row goes back to `seen`, and the dialog reopens with `defaultReason` = the reason sent and `error: "The server didn't accept this reason. Write a few more words."`† | Confirm sends again with a **new** key (a new body is a new intent) |
| `badRequest`, other | `inlineError`: `ErrorPanel` compact, code 400, DL's 400 title and body | `Reload` (DL) reloads the page |
| `signedOut` | A page-level `ErrorPanel` code 401, DL's title and body (DL's 401 body is generic: "Your session ended…") | none: there's no `/login` in sprint-01 (E1) |
| `forbidden` | `inlineError`: `ErrorPanel` compact, code 403, title `Not allowed` (DL), `body` = `message` | none (E1) |
| `rateLimited` | Back to `seen`; `actionsDisabledReason: "Retry in {s}s"` (DL 429 copy), counting down each second from `retryAfterMs`; at 0 the buttons come back | Nothing is re-sent automatically |
| `idempotencyConflict` | `inlineError`: `ErrorPanel` compact, code 400, DL's 400 title and body (FM: "a bug report, not a user message") | `Reload` (DL) reloads the page |
| `inProgress` | Stay `approving` or `rejecting`; re-send with the same key after 500ms, 1s and 2s; then as `network`, with the last request's ID | — |
| `conflict` | `inlineError`: `ErrorPanel` compact, code 409, title `This couldn't be recorded.`†, body = `message`. **Never DL's 409 copy, and never the stale state** | `Refresh list`† refetches route 52 |
| `unprocessable` | `inlineError`: `ErrorPanel` compact, code 422, title `Not allowed now` (FM line 220), body = `message`. **Never DL's 422 copy** | `Refresh list`† |
| `network`, `server` | Back to `seen`; `inlineError`: `Couldn't reach the server.`† and the request ID chip | `Retry` (DL's `WidgetState` label): step 4 |

### 5.4 The list's own states (route 52)

| State | Shown | Action |
| --- | --- | --- |
| Loading (client navigation only; SSR renders with data) | `WidgetState` `loading` | — |
| Empty: no rows and `nextCursor` is null | DL's empty card: `StatusGlyph` done, **`Nothing needs you.`**, then `A decision appears here the moment the factory needs one.` | — |
| Error with no data | `signedOut`: as in 5.3 | |
| | `network` or `server`: DL's `WidgetState` `error` as it is: `Couldn't load`, then `The server did not answer. Nothing was changed.`, with the request ID chip (W1) | `Retry` (DL) refetches |
| | anything else: `ErrorPanel` with the status as `code`; the title is DL's for 400, 403 and 404, or 5.3's for 409 and 422; **`body` = the server's `message`**, never DL's specimen body | none |
| Error with data on screen (a refetch failed) | The rows stay, under `WidgetState` `error` with `lastGoodAge` (DL: `Stale, last good value {age} old`) and the failed request's ID as `requestId` (W1) | `Retry` refetches |
| Some rows unreadable (`unreadable > 0`) | Above the list, `role="alert"`: `{n} decision couldn't be shown. Reload the page; if it keeps happening, report it.`† (`decisions` when n > 1). No request ID: a successful page doesn't give one to the screen | — |
| `Load more` fails | The rows stay; the button reads `Retry loading more`†, with the failed request's ID chip (section 4) beside it | It loads the next page again |

### 5.5 The contract version banner

When `useContractMismatch()` isn't null, the page shows `WidgetState` `staleVersion` above the header, with:
- message `AVEL was updated. Reload to use the new version.`†;
- action `Reload` (DL), which reloads the page.

It's the page's because sprint-01 has one page. It moves to the shell with W2 (FM line 226).

## 6. Tokens and the app (Nemi)

- **The package is `@avel/web`** at `apps/web`, on TanStack Start with React and Vite (FM, Rendering).
- **The dependencies** this sprint needs, and nothing else:
  - `@avel/contract` (workspace);
  - `@avel/contract-mock` (workspace), as a **dev dependency**: only `vite.config.ts`'s dev server and the tests import it (section 3);
  - `@orpc/client`, `@orpc/openapi-client` and `@orpc/tanstack-query`, at the exact version `@avel/contract` pins for `@orpc/contract`;
  - `@tanstack/react-start`, `@tanstack/react-router` and `@tanstack/react-query`;
  - `react` and `react-dom`;
  - `zod`, at the contract's exact version;
  - `lucide-react`;
  - Tailwind CSS v4 and its Vite plugin;
  - for tests: `vitest` (the workspace's version), `@testing-library/react`, `@testing-library/user-event`, `jsdom` and `@playwright/test`.
- **`apps/web/src/styles/tokens.css`** carries DL's token stylesheet: every custom property between DL's `Theme-independent AVEL tokens` and `Base element defaults` comments, with the same value under the same selectors.
  - The check in Nemi's task compares 533 name and value pairs.
  - `--av-stall-after: 8m` is copied as it is (FM's follow-up changes DL's source).
- **`apps/web/src/styles/base.css`** carries DL's `Base element defaults` block word for word: every rule from that comment up to the `AVEL field anatomy` comment (`html` and `body` background `var(--av-floor)`, `body` ink `var(--av-ink)` and type, links, focus rings, selection, and form and code inheritance). It loads after `tokens.css` (INT, 2026-11-07; Decisions).
- **`apps/web/src/routes/__root.tsx`** is the shell:
  - `<html>` gets `data-theme` from the `avel-theme` cookie (`light` or `night`, default `light`), read on the server before first paint;
  - it loads Inter Variable and IBM Plex Mono;
  - it preloads the font files the first paint of `/` uses (FM line 289): Inter Variable, and IBM Plex Mono 500, the weight of DL's `HashChip` (the factory PR's commit chip and the request ID). Mono 400 isn't preloaded. **The size-matched fallback (FM line 289) isn't in sprint-01:** DL gives no fallback metrics, so no values exist to copy. Leah's review measures layout shift on `/` instead (Decisions, 2026-11-07, "Fonts");
  - its route context is `{ queryClient: QueryClient }` (`createRootRouteWithContext`). `getRouter()` fills it and provides the `QueryClient` (section 3), so the shell adds no provider of its own;
  - no auth guard.
- **`vite.config.ts`:**
  - It defines `__AVEL_CONTRACT_VERSION__` from `packages/contract/package.json`'s `version`, read with `fs` at config time (escalation 02).
  - In development, `AVEL_API=mock` adds a plugin with `apply: "serve"` that makes **one** `createMock({ contractVersion })`, seeds it with `fixtures.step1`, and serves `/api/*` and `/__mock/*` from it as dev-server middleware. The browser's requests and the SSR loader's requests both reach this instance (section 3). It's the only place `apps/web` imports `@avel/contract-mock` outside the tests.
  - The route tree is generated to `src/routeTree.gen.ts`, which is git-ignored and generated before `typecheck` and `build`.

## 7. Scenarios (Fenn's test IDs)

**Data core and mock** (`apps/web/test/data/`, Vitest):

| ID | Scenario |
| --- | --- |
| UC-01 | `fixtures.step1`'s rows parse with `PendingDecisionRow`. A row missing `ref` fails. The unparseable-options proposal parses, without `approve` and `reject` |
| UC-02 | Route 52: order (`createdAt`, then `ref`); `limit` 0 and 101 give `BAD_REQUEST`; `limit` 100 serves at most 100 items; `nextCursor` pages through `fixtures.many`, with no row repeated or lost |
| UC-03 | Route 54: each check in CR-W2 section 5's order gives its code and `details` as an `ErrorBody`. Check 1: a missing `version` gives `details.field` `"version"`, `issues[0].field` `"version"`, and `ErrorBody.message` equal to `issues[0].message`; a body with no `proposalId` passes check 1, and a body whose `proposalId` differs from the path's is ignored: the checks and the decision apply to the path's proposal (S1-5). No key gives 400 `{ field: "Idempotency-Key", issues: [{ field: "Idempotency-Key", message: "required" }] }`. The same key, path and body replays. The same key with a different body gives `IDEMPOTENCY_KEY_REUSED`. Success is **201**, with `state: "resolved"`, `choice`, `choiceReason`, `resolvedBy: MOCK_OPERATOR_ID`, `resolvedAt` and `rowVersion + 1` |
| UC-04 | `toUiError`: one case per row of section 3's table; `STALE_VERSION` gives `stale` with `currentVersion`; `CONFLICT` gives `conflict`, not `stale` |
| | **Each branch of "Reading an error", with its request ID:** an `ErrorBody` comes out as `ApiError` with `e.code` = the body's code, and `requestId` from the body; a non-`ErrorBody` 409 gives `conflict` with `code` null, and `requestId` from the response's `X-Request-Id`, or the ID sent when the response has none; `failNext(54, { network: true })` gives `network`, with `requestId` equal to the one `mock.requests()` recorded; any other thrown value gives `network` with `requestId` null |
| | **Round trip:** a mock `STALE_VERSION` through `createApiClient` (route 54 after `bumpVersion`) comes out of `toUiError` as `stale` with the mock's `requestId`, **not `conflict`**. The same for `IDEMPOTENCY_KEY_REUSED`, which gives `idempotencyConflict` |
| UC-05 | The client sends `X-Request-Id` on every request (`requestId` when given, else a new one each time), and `Idempotency-Key` from the context on route 54; the mock answers with both headers. Route 54 is recorded with the path `/api/proposals/{proposalId}/decisions` and the body `{ version, choice, reason }`. A request failed with `{ network: true }` is still recorded, with its `requestId`, key and body |
| UC-06 | `formatAgo` matches DL's `avAgo` at 0s, 59s, 60s, 59m, 61m, null and `Infinity`; `formatClock` gives local `HH:MM` |
| UC-07 | **Contract version:** a response whose `X-Contract-Version` differs sets `useContractMismatch()`; an equal one doesn't, and an absent one doesn't |

**Kit** (`apps/web/test/kit/`):

| ID | Scenario |
| --- | --- |
| UC-08 | `DecisionTag`, one test per state with D8's buttons (seen, approving, rejecting, approved with the stamp and D5's line, rejected, stale with the struck binding, note and action, notAllowed with labels and no buttons); the buttons read `approveLabel` and `{rejectLabel}…` (`Reject…` for `Reject`, D13); no buttons without labels; `link` (D9); no id chip and D2's `aria-label` without `idLabel`; `actionsDisabledReason` shown and both buttons disabled (D10); `requestId` gives `Copy {id}` (D14); phone layout (D11) |
| UC-09 | `ReasonDialog`: confirm disabled under 3 trimmed characters; `error` shows and the dialog stays open; `defaultReason` fills the text on open; Cmd/Ctrl+Enter confirms; `onConfirm` doesn't close it; `requestId` gives `Copy {id}` (R4) |
| UC-10 | `ErrorPanel`: no button without `onAction`; with it, `actionLabel` or DL's copy; `body` drawn as given; the request ID chip with `Copy {requestId}`. `WidgetState` `error` with `requestId` draws the chip too (W1) |

**The page** (`apps/web/test/modules/decisions/`, on the mock). Screen tests build the page's client with `createQueryClient({ retryDelay: 0 })`: the page's retry count, without the wait. "The request ID" means its chip, found by `Copy {requestId}`, with the ID `mock.requests()` recorded.

| ID | Scenario |
| --- | --- |
| UC-11 | `fixtures.empty`: the empty card and `Nothing needs you right now.` |
| UC-12 | `fixtures.step1`: four rows in server order (decidable ones full, the unreadable-options row Locked with its reason, the factory PR with `#N`, its commit chip, `Open on GitHub` to `url` and no buttons); the lead and count say 4 |
| UC-13 | **Approve:** the dialog has 5.2's copy; confirming records exactly one route 54 request, with the path `/api/proposals/{proposalId}/decisions`, the body `{ version, choice: approve.choice, reason }` and one key; `Approving…`; 201 → `Approved by you at {formatClock(resolvedAt)}`; the row then leaves the list |
| UC-14 | **Reject:** the same path, with the body `{ version, choice: reject.choice, reason }`, `Rejecting…` and the rejected line |
| UC-15 | **Stale:** `bumpVersion` before confirming → the stale state with `Version {n+1} arrived…` and the request ID; **exactly one request to route 54**; Review → `Version {n+1}`, and deciding it then gets 201 |
| UC-16 | **Stale, then gone:** after the 409, `resolve` the proposal; Review → the row is gone, and `That decision was settled elsewhere.` |
| UC-17 | **422 and 404:** `resolve` → `This can't be decided now.`; `resolve`, then `failNext(54, { status: 422, code: "INVALID_TRANSITION", data: { state: "resolved", allowed: [] } })` → `This decision was already made.`; `expire`, then the same with `"expired"` → `This decision expired.`; `remove` → `This decision no longer exists.`. Each case shows the request ID, and in each, Refresh list drops the row (the store was changed in every case). **Still listed:** `failNext` 422 alone, with the store left open → Refresh list brings the row back in `seen` |
| UC-18 | **429:** `failNext(54, { status: 429, code: "TOO_MANY_REQUESTS", data: { retryAfterMs: 3000 } })` → buttons disabled with `Retry in 3s` and the request ID, counting down to enabled; no request re-sent |
| UC-19 | **Network and 5xx:** `failNext(54, { network: true })`, and then `failNext(54, { status: 500, code: "INTERNAL", data: {} })` → `Couldn't reach the server.` with the request ID; Retry sends the same `Idempotency-Key`, path and body as the recorded failed request |
| UC-20 | **`IDEMPOTENCY_IN_PROGRESS`**, with fake timers: once → re-sent with the same key after 500ms, then 201. **Running out:** `failNext(54, { status: 409, code: "IDEMPOTENCY_IN_PROGRESS" }, { times: 4 })` → three re-sends with the same key, 500ms, 1s and 2s apart, the row `Approving…` throughout; then `Couldn't reach the server.` with the fourth request's ID, and no fifth request |
| UC-21 | **Reason 400:** `failNext(54, { status: 400, code: "BAD_REQUEST", data: { field: "reason" } })` → the dialog reopens with the reason, the error and the request ID; confirming sends a new key |
| UC-22 | **Panels:** 400 other, 403, `IDEMPOTENCY_KEY_REUSED`, `CONFLICT` and `UNPROCESSABLE_CONTENT` each show their compact `ErrorPanel` with 5.3's title, action (or none) and the request ID. `CONFLICT` is never the stale state |
| UC-23 | **401**, on each route: `failNext(54, { status: 401, code: "UNAUTHORIZED" })`, then confirming; and `failNext(52, { status: 401, code: "UNAUTHORIZED" })` on the first load, without prefetched data. Each → the page-level `Signed out` panel, with the request ID and no button |
| UC-24 | **Unreadable:** `injectRawItem({ kind: "proposal" })` → the alert band with `1 decision couldn't be shown…`; the other rows show |
| UC-25 | **Offline:** with `navigator.onLine` false, buttons disabled with `You're offline.` |
| UC-26 | **Paging:** `fixtures.many` → 50 rows and `50+`; Load more → 100 and `100+`; then 150 and `150`, and the button is gone. `failNext(52, { network: true }, { times: 4 })` on Load more → `Retry loading more` with the request ID, which then loads. **Across pages:** `injectRawItem({ kind: "proposal" })` before the first Load more → the band reads `1 decision couldn't be shown…` and still reads it after the next Load more (summed over loaded pages, section 3) |
| UC-27 | **List states:** rendered without prefetched data → `WidgetState` loading. `failNext(52, { network: true }, { times: 4 })` on the first load → exactly `Couldn't load` and `The server did not answer. Nothing was changed.`, the request ID, and Retry, which then loads. `failNext(52, { status: 403, code: "FORBIDDEN", message: "No." })` → `Not allowed` with body `No.`, the request ID and no button. A refetch failing 4 times with rows on screen → `Stale, last good value …`, the request ID and Retry |
| UC-28 | **Contract version:** a mock whose `contractVersion` differs from the client's → the `staleVersion` banner with `Reload` |

**End to end** (`apps/web/e2e/`, Playwright, `AVEL_API=mock`, phone 390×844 and desk 1280×800). Playwright starts the dev server, so every test talks to its one mock instance (section 3). Each test first calls `POST /__mock/reset`, and the tests run one at a time (`workers: 1`):

| ID | Flow |
| --- | --- |
| UC-29 | Open `/`: the SSR HTML already holds the rows, served by the dev server's mock, with no loading state on first paint; approve the first decidable proposal with a reason; the punch; the row leaves; the lead counts one fewer |
| UC-30 | Stale: with the page open, `POST /__mock/bump/{proposalId}` → approving gets the stale state (the page's mock is the bumped one) → Review → approve |
| UC-31 | Phone: the actions are D11's two-column grid, at least 44px tall (DL v1.8 touch rule); the reason dialog's input is 16px and usable at 390px |

## 8. What reviewers check

- **Zero (`review-frontend`):** each module against sections 1 to 6: names, props, copy (DL's or †), states and values. Nothing invented, and nothing outside its territory.
- **Brennan (`review-spec`):** this contract against CR-W2, FM, DL and m1, then each module against this contract.
- **Zane:** the new dependencies (section 6), how keys and request IDs are handled (section 3's fetch wrapper; the SSR client forwards only the request ID), and that `/__mock` and the mock stay out of production builds: nothing under `apps/web/src` imports `@avel/contract-mock`, and the build's output holds neither `__mock` nor `MOCK_OPERATOR_ID`'s value.
- **Leah:** the page's accessibility on a phone (UC-31, focus, labels), and that the first load of `/` is at most **160 kB gzip** of JavaScript, sprint-01's budget (Decisions, 2026-11-07). FM's 150 kB comes back when `@avel/contract` moves to `zod/mini`. Anything over 160 kB is a finding.

## Appendix A: Brennan's a1 findings and where each is answered

| Finding | Severity | Answered in |
| --- | --- | --- |
| 01 Route 54's status | P1 | Section 2: route 54 answers **201** (m1 `route()`, D26). The "isn't a create" claim is gone (INT) |
| 02 The reason dialog flow | P1 | R2 and R3, 5.2 step 2, 5.3 reason 400, UC-09, UC-21: option (b), the dialog closes on confirm and reopens with `defaultReason` |
| 03 ErrorPanel copy and actions | P1 | E1; 5.3's `conflict` and `unprocessable` titles (never DL's 409 or 422 copy); an Action column in 5.3 and 5.4 |
| 04 DecisionTag's unlisted changes | P1 | D1 to D14 (D8: buttons per state; D11: phone, from DL's `.pd[data-phone]`); UC-08 |
| 05 Scenario coverage | P1 | UC-16, UC-21 to UC-23, UC-26 and UC-27 added; request IDs asserted in UC-19 and UC-22; UCs renumbered (end to end is now UC-29 to UC-31) |
| 06 UC-02's limit cap | P2 | Section 2 route 52 and UC-02: over 100 gives `BAD_REQUEST`, with no clamping |
| 07 UC-14 and UC-15 against the mock | P2 | `failNext`'s single signature, written raw; `remove`; UC-17 and UC-18 written in that form, each with its expected reason |
| 08 The unreadable band's request ID | P2 | 5.4: dropped from the band and its copy |
| 09 `approvedAt` from the client's clock | P2 | Section 1 and 5.2 step 3: `formatClock(response.resolvedAt)` |
| 10 The hole fill isn't a token | P2 | The value rule (section 0) and D12 |
| 11 Unmarked copy and `data-ui` | P2 | † marks, and Decisions, "Revision 2", lists each one |
| 12 Kit props not exact | P3 | Section 4's "props ported / left out" columns; `Icon`'s `data-ui`; `formatAgo(ms: number \| null)` |
| 13 Route 54's mock, unsourced | P3 | Section 2: the missing key is provisional (Decisions; Axis to confirm); success adds `state` and `resolvedBy` (`MOCK_OPERATOR_ID`) (INT). Revision 4: Axis confirmed the missing key (S1-1) |
| 14 FM items not addressed | P3 | The count: section 0 and section 5, client-counted until CR-W5 (Decisions). `X-Contract-Version`: built (sections 3, 5.5 and 6, UC-07, UC-28), with escalation 02 for the version value (INT) |

**Review a2's findings (revision 3):**

| Finding | Severity | Answered in |
| --- | --- | --- |
| 04 `rejectLabel` | P2 | D13; UC-08 asserts `Reject…` |
| 12 Button's and StatusGlyph's props | P3 | Section 4's table: Button ports `disabledReason` (used by D10) and leaves out the other seven; StatusGlyph leaves out `onColor` |
| 15 Decoding the error body | P1 | Section 3, "Reading an error" (`e.data.body`, Decisions); section 2: every error is an `ErrorBody`, and check 1's `{ field }` is provisional; UC-03 and UC-04's round trip. Revision 4: decoded at the link instead, and check 1's details are S1-3's `{ field, issues }` |
| 16 Where the request ID goes | P2 | D14, R4, W1; 5.3's list of places; UC-15, UC-17, UC-18, UC-21 and UC-27 assert it |
| 17 ErrorPanel specimen copy | P2 | 5.4: no-data network errors use DL's `WidgetState` error copy; the other panels pass the server's `message` as `body`; section 4 says callers always pass `body` |
| 18 E2 is no change | P3 | E2 withdrawn; DL's chip is kept, and tests find it by `Copy {requestId}` |
| 19 Query retries and `failNext` | P2 | `failNext`'s `times`; `createQueryClient({ retryDelay })`; UC-26 and UC-27 use both |
| 20 The plan note's UC range | P3 | `plan.toml` `[analysis]` notes: UC-01 to UC-31, re-rendered |
| 21 `Mme`'s layout | P3 | Section 5, "Not drawn from `Mme`", and section 0 |

**Review a3's findings (revision 4):**

| Finding | Severity | Answered in |
| --- | --- | --- |
| 16 Where the request ID goes (narrowed) | P3 | UC-23 asserts it. 5.4: the refetch-failed band carries it (W1), and `Load more` shows the chip beside `Retry loading more`; UC-26 and UC-27 assert both, and UC-27's 403 too. 5.3 names its one exception, section 3's fourth branch |
| 22 Route 54's wire body | P2 | Section 1 and 5.2 step 2: the input is `{ proposalId, version, choice, reason }`, and the wire body is `{ version, choice, reason }`. Section 2: the path wins and a body `proposalId` is ignored (Axis, S1-5; D48), so check 1 is the schema check only. UC-03, UC-05, UC-13, UC-14 and UC-19; `plan.toml`'s done-when line |
| 23 The sent request ID | P2 | Section 3: the fetch wrapper carries it (`NetworkError.requestId`; a response with no echo gets the sent ID), and `toUiError`'s four branches say where each reads it. Section 2: `requests()` records failed requests too. UC-04 and UC-05 |
| 24 One data path for dev and SSR | P2 | Section 3: `createApi`, `bindApi`, `apiFor` and `useApi`; `getRouter()` per request, with the server's `baseUrl` and the forwarded request ID (FM line 141; cookies wait for W5); "One data path for each environment". Section 6: the dev server's one instance, and the mock as a dev dependency. Section 2: `POST /__mock/reset`. UC-29 and UC-30; section 8 (Zane) |
| 25 The default `limit` | P3 | Section 2: the mock's 50 is provisional (Decisions), and the page always sends `limit` |

**Folded in from Axis's S1-3** (Decisions, "Axis's S1-3" and "Revision 4"): section 2's `BAD_REQUEST` details `{ field, issues }` and the missing key's `"required"`; section 3's decoding at the link (`decodeErrorBody` as `customErrorResponseBodyDecoder`, `ApiError`); UC-03 and UC-04.

**Review a4's findings (revision 5):**

| Finding | Severity | Answered in |
| --- | --- | --- |
| 26 Route 52's infinite `select` | P3 | Sections 1 and 3: `parsePendingPage` parses one page; `selectPendingPages` joins the loaded pages (rows in page order, `unreadable` summed, the last page's `nextCursor`). UC-26 asserts the sum across pages |
| 27 Scenario gaps | P3 | UC-20: `IDEMPOTENCY_IN_PROGRESS` running out, with fake timers (5.3 names the last request's ID). UC-23: a 401 on route 54 and on route 52's first load |
| 28 UC-17's Refresh list | P3 | UC-17: the `failNext` cases `resolve` or `expire` first, so every case drops the row; a `failNext` alone shows the row back in `seen`. 5.3's `notAllowedNow` (and so `notFound`) says a row still listed comes back in `seen` |
