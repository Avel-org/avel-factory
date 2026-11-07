# UI contract: the approval page (frontend sprint-01, Step 1)

Zero, 2026-11-06. Status: **draft, for Brennan's review** (`agent-brennan-approvals-uic-review-spec`). Nothing is built against it until that review is merged.

This is the one document the sprint's builders and test writer work from:
- Nemi: the app and tokens.
- Ghost: the data core and the contract mock.
- Fantem: the kit.
- Leon: the `decisions` module.
- Fenn: the tests.

Each scenario has an ID (`UC-NN`), and a test carries it in its name.

## 0. Scope and sources

**What it is:** Step 1 item 13's minimal approval page at `/`. It lists what's waiting (route 52), and approves or rejects a proposal with a reason (route 54). It runs on the contract mock (`packages/contract-mock`) until backend Step 1 lands the routes.

**Sources**, quoted by short name:

| Short name | Where |
| --- | --- |
| CR-W2 | `docs/design/CR-W2 Pending decisions.md` (accepted Nov 6; D37) |
| FM | `docs/design/AVEL Web App — Frontend Map v0.6.md` |
| DL | `docs/design/AVEL Enclosure Grid · Design library v1.1.html`: the components `DecisionTag`, `ReasonDialog`, `ErrorPanel`, `WidgetState`, `HashChip`, `avAgo`; the Decisions screen; the token stylesheet |
| m1 | `packages/contract` at e36737f (backend sprint-00 m1): routes 52 to 54, `DecideProposalInput`, `ProposalDto`, the error map, `Page`, `PageQuery` |
| Plan | `docs/design/Step 0 and Step 1 plan.md`: item 13 and test 14 |
| Decisions | `docs/agent-dispatch/frontend/sprint-01/decisions.md` |

**Not in sprint-01.** Each is recorded in Decisions, 2026-11-06, "The UI contract":
- `/decisions/$ref`. It needs route 53's `ProposalViewDto` (CR-W2 section 4), which isn't in m1. It arrives with the Step 1 contract.
- The live stream, the event registry and the shared clock (W2). The page refetches instead.
- `/login` and the auth guard (W5, `system`).
- Showing cost: CR-W2 never sends `costImpact` in Step 1.
- The 6-second Undo hold, the J/K/A keys, the "new" pulse, and the per-kind decision registries (W1).

## 1. The data: route 52 until the Step 1 contract lands

In m1, route 52 returns `Page(Placeholder)` (D30). The Step 1 slice makes it CR-W2's union (CR-W2 section 8, item 5). Until then:

- **The data core holds CR-W2's row as a Zod schema:** `apps/web/src/data/pending-decisions.ts`, transcribed from CR-W2 sections 2.1 to 2.3, field for field. That gives `PendingDecisionRow`, `DecisionChoice` and `CostImpact`. It is the only copy on the web side. The mock's tests check the mock's rows against it.
- **Each item route 52 returns** is parsed with it in the route's query `select`.
  - Rows that parse are listed.
  - A row that doesn't parse is counted in `unreadable` and not drawn. The page shows the unreadable band (UC-08).
  - A row that doesn't parse is a contract bug, not something a user can fix.
- **When the Step 1 contract exports `PendingDecisionDto`,** a later dispatch deletes the local schema and imports the contract's. The field names are CR-W2's, so nothing else changes.
- **Route 54's input is m1's `DecideProposalInput`,** unchanged by CR-W2: `{ proposalId, version, choice, reason }`. Its output (`ProposalDto` in m1, `ProposalViewDto` in Step 1) is read only for a 2xx. The page reads no field from it.
- **The page never reads `options`** and never derives a title, evidence or consequence (FM line 134).

## 2. The contract mock (Ghost, `packages/contract-mock`, package `@avel/contract-mock`)

**It implements m1's routes 52, 53 and 54 through `@avel/contract`** (oRPC's OpenAPI handler on the contract), so paths, statuses and the error body are the contract's (FM, In short, item 3). Any other `/api/*` path answers `NOT_FOUND`.

**Its public surface.** Fenn's tests are written against these names before the mock exists, so they're fixed:

```ts
export function createMock(opts?: { now?: () => Date }): Mock;

export interface Mock {
  /** Serves /api/* like the server. A request whose failure is set to network rejects with a TypeError. */
  fetch(request: Request): Promise<Response>;
  /** Replaces the store with these rows. */
  seed(rows: SeedRow[]): void;
  /** Another tab or agent changed the proposal: version + 1. Returns the new version. */
  bumpVersion(proposalId: string): number;
  /** Decided elsewhere: state 'resolved'. */
  resolve(proposalId: string): void;
  /** Expired: expiresAt moves into the past. */
  expire(proposalId: string): void;
  /** The next request to that route fails once, before any check. */
  failNext(route: 52 | 53 | 54, failure: { code: string; status: number; data?: unknown } | { network: true }): void;
  /** Route 52's next response carries this item as it is, after the store's rows (for UC-18). */
  injectRawItem(item: Record<string, unknown>): void;
  /** Every request the mock received, oldest first. */
  requests(): RecordedRequest[];
  reset(): void;
}

export interface RecordedRequest {
  route: 52 | 53 | 54 | null;
  method: string;
  path: string;
  idempotencyKey: string | null;
  body: unknown;
}

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

- **A development-only path:** `POST /__mock/bump/{proposalId}` runs `bumpVersion` and answers 200 `{ "version": n }`. It's served only by the dev server under `AVEL_API=mock` (UC-22) and is never a contract route.
- **`fixtures.step1`** has:
  - two decidable proposals, with different `clientName`s, one of them `budget_increase`;
  - one proposal whose `options` doesn't parse;
  - one factory PR.
- **`fixtures.many`** has 150 decidable proposals.

**Route 52** (CR-W2 sections 2 and 6.7):
- It lists open proposals with `expiresAt > now` and every factory PR.
- Order: oldest first, by `createdAt` and then `ref` (CR-W2, answer 7).
- `limit` defaults to 50 and is at most 100 (D23). `nextCursor` is opaque.
- **Each item is the CR-W2 row:**
  - `ref` is `proposal:<id>` or `factory_change:<prNumber>`.
  - `approve` and `reject` are built from the `ProposalOptions` entries whose `effect` is `approve` and `reject`.
  - `approve` and `reject` are absent when `options` doesn't parse (CR-W2 3.2).
  - `costImpact` is never sent (CR-W2 2.2).
- **The `ProposalOptions` rule:** at least 2 choices, and exactly one `approve` and one `reject`.

**Route 54** (CR-W2 section 5):
- **No `Idempotency-Key` header:** `BAD_REQUEST`, `{ field: "Idempotency-Key" }`.
- **The idempotency rules:**
  - The same key with the same body replays the first response.
  - The same key with a different body gets `IDEMPOTENCY_KEY_REUSED`.
- **Then the checks, in CR-W2's order:**
  1. `BAD_REQUEST` (schema, or the path and body `proposalId` differ).
  2. `NOT_FOUND`.
  3. `INVALID_TRANSITION`, with `{ allowed: [] }`. m1's error data has no `state` field; CR-W2's `state` arrives with Step 1, and the page works with or without it.
  4. `STALE_VERSION`, with `{ field: "version", currentVersion }`.
  5. `BAD_REQUEST`, with `{ field: "choice" }`.
- **On success:** the proposal resolves (`choice`, `choiceReason`, `resolvedAt`, `rowVersion + 1`), and the response is m1's `ProposalDto` with status 200. Route 54 isn't a create: CR-W2 section 5 and D26.
- **Route 53** returns m1's `ProposalDto` for any seeded proposal. The page doesn't call it in sprint-01. It's there so the mock matches the contract.

## 3. The data core (Ghost, `apps/web/src/data/**`, `apps/web/src/lib/**`, `apps/web/src/router.tsx`)

| Export | From | What |
| --- | --- | --- |
| `createApiClient(opts?: { fetch?: typeof fetch; baseUrl?: string })` | `data/client.ts` | `createORPCClient` with `OpenAPILink` over `@avel/contract` (FM, Data layer) |
| | | **Every request:** sends `X-Request-Id` (a new UUID) |
| | | **On a write:** sends `Idempotency-Key` from the call's client context (`{ context: { idempotencyKey } }`) |
| | | **In development and tests:** `fetch` is the mock's `fetch` |
| `orpc` | `data/client.ts` | `createTanstackQueryUtils` over the default client |
| `newIdempotencyKey(): string` | `data/idempotency.ts` | `crypto.randomUUID()`, made once per user intent (FM 206) |
| `toUiError(e: unknown): UiError` | `data/errors.ts` | the only error mapper (FM, Errors by code), below |
| `createQueryClient(): QueryClient` | `data/query.ts` | **Queries:** `staleTime` 30s (the "reconnecting or down" row of FM's freshness table, because sprint-01 has no stream); refetch on focus and on reconnect; retry up to 3 times, only on `network` and `server` |
| | | **Mutations:** never retried automatically |
| `PendingDecisionRow`, `DecisionChoice`, `CostImpact` | `data/pending-decisions.ts` | Zod schemas, CR-W2 sections 2.1 to 2.3 (section 1 above) |
| `parsePendingPage(page): { rows: PendingDecisionRow[]; unreadable: number; nextCursor: string \| null }` | `data/pending-decisions.ts` | Route 52's `select` |
| `formatAgo(ms: number): string` | `lib/time.ts` | DL's `avAgo`, word for word: under 60s gives `Ns`, under 60m gives `Nm`, otherwise `Nh Mm`, and null gives `—` |
| `getRouter()` | `router.tsx` | A new `QueryClient` per request; Router and Query wired with `setupRouterSsrQueryIntegration` (FM, Rendering and SSR) |

**`UiError`.** Every member carries `code: string | null` and `requestId: string | null`. The request ID comes from the error body, or else from the `X-Request-Id` that was sent.

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
| `conflict` | 409, any other code (`CONFLICT`, `ALREADY_EXISTS`, …) | |
| `unprocessable` | 422, any other code | `message` |
| `server` | 5xx | `status` |
| `network` | the fetch rejected | |

`stale` is keyed on the code `STALE_VERSION` alone, never on the status 409 (Decisions, 2026-11-06).

## 4. The kit (Fantem, `apps/web/src/kit/**`)

These are DL's components, ported with their `data-ui` names, tokens and copy. They take plain props, and know nothing about oRPC or routes (FM, Layers). **Never invent a value:** every colour, size, radius and duration is a `--av-*` token from `apps/web/src/styles`.

| Component | `data-ui` | Props (exact) | From DL, with these changes |
| --- | --- | --- | --- |
| `Button` | `Button` | DL's (`variant`, `size`, `block`, `disabled`, `icon`, `iconRight`, `onClick`, `children`) | none |
| `Tag` | `Tag` | DL's (`tone`, `size`, `icon`, `title`, `children`) | none |
| `Icon` | (svg) | `name`, `size` | per-icon imports from `lucide-react`, stroke 1.75 (DL) |
| `StatusGlyph` | `StatusGlyph` | DL's (`status`, `size`) | none |
| `HashChip` | `HashChip` | DL's (`value`, `kind`, `length`, `prefix`, `strike`, `copy`) | none |
| `ReasonDialog` | `ReasonDialog` | DL's (`open`, `onClose`, `onConfirm(reason)`, `title`, `description`, `confirmLabel`, `destructive`, `placeholder`, `minLength` = 3) **plus `error?: string`** | **`error`** shows under the textarea with `role="alert"` and keeps the dialog open |
| | | | **`onConfirm`** no longer closes the dialog itself: the caller closes it |
| `ErrorPanel` | `ErrorPanel` | DL's (`code`, `title`, `body`, `actionLabel`, `onAction`, `requestId`, `compact`) | The request ID is shown and can be copied (FM, Errors by code) |
| `WidgetState` | `WidgetState` | DL's (`state`: `loading`, `empty`, `error` or `staleVersion`; `title`, `message`, `icon`, `actionLabel`, `onAction`, `lastGoodAge`, `children`) | none |
| `DecisionTag` | `DecisionTag` | below | below |

**`DecisionTag`** (DL `DecisionTag`, its "Decision tag" specimen states):

```ts
type DecisionTagProps = {
  layout: "desk" | "phone";
  variant: DecisionVariant;          // DL's AV_DECISION_VARIANTS keys; unknown → "Decision", circle
  idLabel?: string;                  // a HashChip kind "id"; absent → no chip
  title: string;
  clientName?: string | null;        // shown after the kind label; null or absent → nothing
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
  link?: { label: string; href: string };   // opens in a new tab, rel="noopener noreferrer"
  actionsDisabledReason?: string;    // both buttons disabled, this text beside them
  inlineError?: React.ReactNode;     // a band above the actions
  onApprove?: () => void;
  onReject?: () => void;
  onReview?: () => void;
  onRefresh?: () => void;            // shown as "Refresh list" in the notAllowed state when given
};
```

**What changes from DL's `DecisionTag`** (Decisions, 2026-11-06):
1. **Approve and Reject both call back without asking for a reason.** The inline reject textarea goes. The page opens `ReasonDialog` for both choices: route 54 requires a reason either way (CR-W2 section 5).
2. **`binds.kind: "version"`** shows `Binds to {label}` as plain text, for example `Binds to Version 4`, not as a SHA chip. When the state is `stale`, it's struck through. `kind: "sha"` is DL's `HashChip` with `prefix` = `label`.
3. **When `approveLabel` and `rejectLabel` are both absent,** the actions row shows only `link`, if there is one.
4. **The `rejecting` state:**
   - the Reject button reads `Rejecting…`;
   - both buttons are disabled;
   - DL's `approving` state keeps its `Approving…`.
5. **Approved line:** `Approved by you at {approvedAt}. Logged with {binds.label}.` (DL: "Logged with" plus the binding).
6. **Rejected line:** DL's `Rejected. Reason sent to the agents and logged.`
7. **The state tag stays DL's:**
   - "Needs you" for `seen`, `approving` and `rejecting`;
   - "Approved", "Rejected" and "Changed" (stale) for those states;
   - "Locked" for `notAllowed`.
8. **The punch is DL's:**
   - the hole fills in 160ms;
   - the stamp lands with `--av-d-punch`;
   - under `prefers-reduced-motion`, the tokens set both to 0.

## 5. The page (Leon, `apps/web/src/modules/decisions/**`, `apps/web/src/routes/index.tsx`)

**Route:** `/`, with `ssr: true` (FM, Rendering). The loader runs `ensureInfiniteQueryData` on route 52's `infiniteOptions` (`limit` 50). The component reads the same options with `useSuspenseInfiniteQuery`.

**The module** has `api.ts` (route 52's query options and route 54's mutation), `decisions.ts` (the proposal and factory PR renderers), `screens/DecisionsScreen.tsx`, `index.ts` (light: named exports only) and `screens.ts`. `index.tsx` imports only `screens.ts` (FM, What every module looks like).

**Layout** (DL Decisions screen):
- the root is `data-ui="DecisionsPage"`;
- the eyebrow is `Home`, and the `h1` is `Decisions`;
- the lead line is `{n} thing needs you.` or `{n} things need you.`, or `Nothing needs you right now.` when there are no rows;
- `h2` reads `Waiting for you` with the count;
- then a `<ul aria-label="Waiting for you">`, with one `<li>` per row.

**Phone** is `max-width: 899px` (DL's Decisions screen). On a phone, tags use `layout="phone"` and the buttons fill the width. On a desk, `layout="desk"`.

**The count** is the number of rows drawn. While `nextCursor` isn't null, `+` follows it, and a `Load more` button (`Button`, secondary) sits under the list.

### 5.1 How each row is drawn

| Row | `DecisionTag` props |
| --- | --- |
| **`proposal` with `approve` and `reject`** (decidable) | `variant` from `proposalKind`: parked→`parked`, contract_change→`contract`, quarantine→`quarantine`, budget_increase→`budget`, test_change→`testChange`, gate5→`finding`, repin→`repin`; the other six → the generic `Decision` |
| | `idLabel` absent; `title`; `clientName`; `age` = `Waiting {formatAgo(now − createdAt)}`; `binds = { kind: "version", label: "Version {version}", value: String(version) }` |
| | `evidence`; `consequence` = `approve.consequence`; `approveLabel` = `approve.label`; `rejectLabel` = `reject.label` |
| **`proposal` without `approve` or `reject`** (CR-W2 3.2) | as above, without the labels; `state: "notAllowed"`; `notAllowedReason`: `This decision's options can't be read, so it can't be decided here.` |
| **`factory_change`** (read-only, CR-W2 2.3) | `variant: "factoryPr"`; `idLabel: "#{prNumber}"`; `title`; `age`; `binds = { kind: "sha", label: "Commit", value: headSha }` |
| | `link = { label: "Open on GitHub", href: url }`; no labels; `state: "seen"` |

- **`now`** is the time of the latest successful route 52 fetch. The age doesn't tick on its own in sprint-01, because there's no shared clock yet (W2).
- **No row shows cost.** `costImpact` is absent in Step 1. If it ever arrives, sprint-01 ignores it: `CostImpact` belongs to `metering`, which isn't built yet.

### 5.2 Deciding

1. **Tap Approve or Reject.** `ReasonDialog` opens:

   | | Approve | Reject |
   | --- | --- | --- |
   | `title` | `Approve this decision?` when the label is `Approve`, else `{label}?` | `Reject this decision?` when the label is `Reject`, else `{label}?` |
   | `description` | `{title}. {approve.consequence} Your reason goes on the record.` | `{title}. {reject.consequence} Your reason goes on the record and is shown to whoever picks it up next.` (DL) |
   | `confirmLabel` | the label | the label |
   | `destructive` | false | false |

   `minLength` is 3 (DL's default; the contract accepts 1 or more, so this is stricter, never looser).
2. **Confirm.** The page:
   - closes the dialog;
   - makes a new key with `newIdempotencyKey()`;
   - sets the row to `approving` or `rejecting` within 100ms (FM 207);
   - sends route 54 with `{ proposalId, version: row.version, choice: approve.choice | reject.choice, reason: trimmed }` and the key.

   **The body comes from the row as it was drawn,** never from a refetch (FM 205).
3. **2xx:**
   - the row goes to `approved` (punch, with `approvedAt` as the local `HH:MM`) or `rejected`;
   - after `--av-d-punch`, route 52 is invalidated, and the row leaves when the refetch lands. CR-W2 6: a decided proposal is gone from route 52.
4. **Retry** (on `network`, `server` or `inProgress`) re-sends **the same body with the same key.** A new key is made only for a new confirm.
5. **Offline** (`navigator.onLine` is false): every Approve and Reject has `actionsDisabledReason: "You're offline."`. Nothing is queued (FM 208).

### 5.3 Errors on route 54, by `UiError.kind`

The request ID is shown on every error (`ErrorPanel` or the inline band).

| `kind` | What the row does |
| --- | --- |
| `stale` | `state: "stale"`; binding struck; `staleNote: "Version {currentVersion} arrived while you were reading."`; `staleAction: "Review version {currentVersion}"` (DL's specimen copy); both buttons disabled |
| | **Review** refetches route 52, and the row comes back with the new version in `seen`. **Nothing is re-sent, ever** (FM, In short, item 5) |
| | If the row is gone after the refetch, the list shows the status line `That decision was settled elsewhere.` (`role="status"`) |
| `notAllowedNow` | `state: "notAllowed"`; `notAllowedReason`: `This decision was already made.` (`state` resolved), `This decision expired.` (`state` expired), or `This can't be decided now.` (no `state`); `onRefresh` refetches route 52 |
| `notFound` | as `notAllowedNow`, with `This decision no longer exists.` |
| `badRequest` with `field: "reason"` | The dialog stays open (or reopens) with the reason kept, and `error`: `The server didn't accept this reason. Write a few more words.` |
| `badRequest`, other | `inlineError`: `ErrorPanel` compact, code 400, DL's copy |
| `signedOut` | A page-level `ErrorPanel` code 401 with DL's title and body, and no action. There's no `/login` in sprint-01 |
| `forbidden` | `inlineError`: `ErrorPanel` compact, code 403, title `Not allowed`, body = `message` |
| `rateLimited` | Back to `seen`; `actionsDisabledReason: "Retry in {s}s"` (DL 429 copy), counting down each second from `retryAfterMs`. At 0 the buttons come back. Nothing is re-sent automatically |
| `idempotencyConflict` | `inlineError`: `ErrorPanel` compact, code 400, DL's 400 copy (FM: "a bug report, not a user message") |
| `inProgress` | Stay `approving` or `rejecting`; re-send with the same key after 500ms, 1s and 2s; then as `network` |
| `conflict`, `unprocessable` | `inlineError`: `ErrorPanel` compact with the code's DL title (409 or 422) and the server's message. **Never the stale state** |
| `network`, `server` | Back to `seen`; `inlineError`: `Couldn't reach the server.` with a `Retry` button (step 4: same key, same body) |

### 5.4 The list's own states (route 52)

| State | Shown |
| --- | --- |
| Loading (client navigation only; SSR renders with data) | `WidgetState` `loading` |
| Empty: no rows and `nextCursor` is null | DL's empty card: `StatusGlyph` done, **`Nothing needs you.`** then `A decision appears here the moment the factory needs one.` |
| Error with no data | `ErrorPanel` by `UiError.kind`: 401 as in 5.3; `network` and `server` with `Couldn't reach the server.` and `Retry` |
| Error with data on screen (a refetch failed) | The rows stay, under `WidgetState` `error` with `lastGoodAge` (DL: `Stale, last good value {age} old`) and `Retry` |
| Some rows unreadable (`unreadable > 0`) | Above the list, `role="alert"`: `{n} decision(s) couldn't be shown. Reload, and if it repeats, send the request ID.` with the request ID |
| `Load more` fails | The rows stay, and the button reads `Retry loading more` |

## 6. Tokens and the app (Nemi)

- **The package is `@avel/web`** at `apps/web`, on TanStack Start with React and Vite (FM, Rendering).
- **The dependencies** this sprint needs, and nothing else:
  - `@avel/contract` and `@avel/contract-mock` (workspace);
  - `@orpc/client`, `@orpc/openapi-client` and `@orpc/tanstack-query`, at the exact version `@avel/contract` pins for `@orpc/contract` (FM: one exact 1.x across contract, server, web and CLI);
  - `@tanstack/react-start`, `@tanstack/react-router` and `@tanstack/react-query`;
  - `react` and `react-dom`;
  - `zod`, at the contract's exact version;
  - `lucide-react`;
  - Tailwind CSS v4 and its Vite plugin;
  - for tests: `vitest` (the workspace's version), `@testing-library/react`, `@testing-library/user-event`, `jsdom` and `@playwright/test`.
- **`apps/web/src/styles/tokens.css`** carries DL's token stylesheet: every custom property between DL's `Theme-independent AVEL tokens` and `Base element defaults` comments, with the same value under the same selectors. Light and Night, the glass depth and the reduced-motion block are all included.
  - The check in Nemi's task (533 declarations) compares the name and value pairs.
  - `--av-stall-after: 8m` is copied as it is. FM's follow-up changes it in DL's source, not here.
- **`apps/web/src/routes/__root.tsx`** is the shell:
  - `<html>` gets `data-theme` from the `avel-theme` cookie (`light` or `night`, default `light`), read on the server before first paint (FM, Rendering).
  - It loads Inter Variable and IBM Plex Mono (FM, v0.5).
  - It wraps the app in the router's `QueryClient`.
  - No auth guard in sprint-01.
- **`vite.config.ts`:**
  - In development, `AVEL_API=mock` serves `/api/*` from `@avel/contract-mock` (`createMock()` seeded with `fixtures.step1`).
  - The route tree is generated to `src/routeTree.gen.ts`, which is git-ignored by `apps/web/.gitignore` and generated before `typecheck` and `build`.

## 7. Scenarios (Fenn's test IDs)

Unit and screen tests (Vitest, on the mock):

| ID | Scenario |
| --- | --- |
| UC-01 | `fixtures.step1`'s rows parse with `PendingDecisionRow`. A row missing `ref` fails to parse. The unparseable-options proposal parses, without `approve` and `reject` |
| UC-02 | Route 52 on the mock: order (`createdAt`, then `ref`), `limit` capped at 100, and `nextCursor` paging through `fixtures.many` with no row repeated or lost |
| UC-03 | Route 54 on the mock: each check in CR-W2 section 5's order gives its code and `details`; no key gives 400; the same key and body replays; the same key with a different body gives `IDEMPOTENCY_KEY_REUSED` |
| UC-04 | `toUiError`: one case per row of section 3's table, including `STALE_VERSION` → `stale` with `currentVersion`, and `CONFLICT` → `conflict` (not `stale`) |
| UC-05 | The client sends `X-Request-Id` on every request, and `Idempotency-Key` from the context on route 54 |
| UC-06 | `formatAgo` matches DL's `avAgo` at 0s, 59s, 60s, 59m and 61m, and on null |
| UC-07 | `DecisionTag`, one test per state: seen, approving, rejecting, approved (stamp present), rejected, stale (struck binding, the note, the action), notAllowed (the reason, no buttons); actions absent when there are no labels; `link` attributes |
| UC-08 | `ReasonDialog`: confirm is disabled under 3 trimmed characters; `error` shows and keeps the dialog open; Cmd/Ctrl+Enter confirms |
| UC-09 | Page on `fixtures.empty`: the empty card's text |
| UC-10 | Page on `fixtures.step1`: four rows in server order; the decidable rows show title, client name, `Waiting …`, `Binds to Version N`, evidence and consequence, with Approve and Reject; the unreadable-options row is Locked with its reason; the factory PR row has `#N`, its commit chip and `Open on GitHub` to `url`, and no buttons |
| UC-11 | **Approve:** the dialog opens with the section 5.2 copy; confirming sends exactly `{ proposalId, version, choice: approve.choice, reason }` with one key; `Approving…` shows; after 2xx the row leaves the list |
| UC-12 | **Reject:** the same, with `reject.choice` |
| UC-13 | **Stale:** `bumpVersion` before confirming → the stale state with `Version {n+1} arrived…`; **no second request to route 54**; Review refetches, the row shows `Version {n+1}`, and deciding it then succeeds |
| UC-14 | **422 and 404:** `resolve`, `expire` or a removed row → Locked with section 5.3's reason; Refresh list removes it |
| UC-15 | **429:** `failNext(54, 429, { retryAfterMs: 3000 })` → the buttons are disabled with `Retry in 3s`, counting down, then enabled; no request is re-sent automatically |
| UC-16 | **Network and 5xx:** the error band and Retry; the retry's `Idempotency-Key` and body equal the first attempt's |
| UC-17 | **`IDEMPOTENCY_IN_PROGRESS`** → re-sent with the same key, and succeeds |
| UC-18 | **Unreadable row:** `injectRawItem({ kind: "proposal" })` (a row that breaks CR-W2) → the alert band with the count; the other rows still show |
| UC-19 | **Offline:** with `navigator.onLine` false, the buttons are disabled with `You're offline.` |
| UC-20 | **Paging:** `fixtures.many` → 50 rows and `50+`; Load more → 100 and `100+`; then 150 and `150`, with the button gone |

End to end (Playwright, `AVEL_API=mock`, phone 390×844 and desk 1280×800):

| ID | Flow |
| --- | --- |
| UC-21 | Open `/`: the SSR HTML already holds the rows, so no loading state on first paint; approve the first decidable proposal with a reason; the punch; the row leaves; the lead line counts one fewer |
| UC-22 | Stale: the mock bumps the version (through a dev-only `POST /__mock/bump/{proposalId}`, which `AVEL_API=mock` serves) → the stale state → Review → approve |
| UC-23 | Phone: the buttons fill the width and are at least 44px tall (DL v1.8 touch rule); the reason dialog is usable at 390px with the on-screen keyboard's 16px input rule |

## 8. What reviewers check

- **Zero (`review-frontend`):** each module against sections 1 to 6 of this contract: names, props, copy, states and tokens. Nothing invented, and nothing outside its territory.
- **Brennan (`review-spec`):** this contract against CR-W2, FM and DL, then each module against this contract.
- **Zane:** new dependencies (section 6) and how keys and request IDs are handled.
- **Leah:** the page's accessibility on a phone (UC-23, focus, labels) and that the bundle stays light.
