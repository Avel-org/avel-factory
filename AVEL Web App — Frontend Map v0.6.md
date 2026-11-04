# AVEL Web App — Frontend Map v0.6

Nov 4, 2026 · @javaris

How the control room in `apps/web` is put together: its modules, layers, routes, data, live stream, state, performance, errors and tests. Built on the factory design (v0.6), the API reference, the Enclosure Grid design system and its v1.1 decisions, the backend plan (CR-15, CR-16) and Roster setup and sessions (Nov 4). Nothing here is built yet.

**v0.6 (Nov 4):** aligned with the backend plan and the roster.
- **Event kinds keep entity names** (`attempt.started`, `task_doc.rendered`), and the contract exports an exhaustive map from each kind to its owning module (CR-15 item 8). CR-W10 is reworded to match, and CR-W14's event is `message.stopped`.
- **Tests have their own territory:** `apps/web/test/**` and `apps/web/e2e/**`, owned by Fenn. No test files inside module folders.
- **Money:** any decision that changes spend shows its cost impact, as the design library does. The module-run screen no longer shows cost.
- **The contract mock is required** from W0, and Ghost builds it.
- **Territories name roster agents.**
- **Module ownership follows CR-15:** `clients` sits under `onboarding` and repo connections under `delivery`.
- **The route count notes** where it still differs from the backend's.

**v0.5 (Nov 4):** synced with the design library and the backend plan. Fonts are the library's (Inter Variable and IBM Plex Mono). Stall is 10 minutes everywhere, and the server sends the number. Web paths are fixed for Gate 1's territory check. The route count now comes from the contract instead of being written by hand. Docs cite each other by version and date.

**v0.4 (Nov 3):** React rules from Vercel's react-best-practices, adapted to this stack: each module gets a separate `screens.ts` so its public `index.ts` stays light and route code splitting holds; the React Compiler; stream updates as transitions; `<Activity>` for Map, Wall and sheets; `content-visibility`, deferred filters, per-icon imports and versioned storage keys. The same rules ship to the factory's frontend agents as the `react-tanstack-performance` skill.

**v0.3 (Nov 3):** a Latency section with principles and targets for the UI, the stream pipeline and Canon's chat; a Stop button on Canon's replies (CR-W14); the Dispatch screen and its confirm decision from CR-W11; CR-W11 to CR-W13 listed.

**v0.2 (Nov 2):** the front end is split into modules named after the backend's 19 modules (new Modules section); folders move from `features/` to `modules/`; money moves to Business only, per the Enclosure Grid v1.1 decisions; CR-W9 and CR-W10 added.

## In short

1. **Modules match the backend.** Every backend module with something to show has a front-end module of the same name, owning its screens, queries, event handlers and decision kinds. Decisions, missions and clients are front-end compositions on top.
2. **Five layers, one direction.** Routes → screens → kit components → data layer (oRPC + TanStack Query) → transport. A separate **live layer** feeds the data layer from one event stream. Screens never call `fetch`, and never hold server data in their own state.
3. **The contract is the only API.** Every read and write goes through the typed oRPC client generated from `packages/contract`. In development the same client talks to a **contract mock** that runs through the same handler, so errors, paging and streams behave exactly like the real server.
4. **The stream is the freshness.** Pages load a snapshot from a route, then one server-sent event stream keeps it current by patching or invalidating the cache. While the stream is healthy nothing polls; when it drops, queries fall back to normal refetching and every widget shows it's stale.
5. **Approve what you saw.** Every approval is built from the exact object on screen, carrying its version or hash. A 409 opens the stale state instead of approving something newer. Approvals are never queued offline.
6. **Phone first where it counts.** Decisions and Release render on the server, ship small bundles and answer a tap in under 100ms. Heavy live views load only when opened.

## Modules, aligned with the backend

The backend ships 19 modules as packages inside one service. The front end mirrors that: one module per backend module that has something to show, with the **same name**, so a change in `integrator` on the server has an obvious home in `integrator` on the web. Four front-end modules have no backend twin because they compose several: `decisions`, `missions`, `clients` and `system`. Two cores serve everyone: `kit` (Enclosure Grid components) and `data` (the oRPC client and query defaults).

### The alignment table

| Backend module | Front-end module | Contract route groups | Routes it owns | What it shows |
| --- | --- | --- | --- | --- |
| `contract` (server side: `platform`, CR-15 item 3) | none (shared) | all | — | The web imports `packages/contract` directly; `data` wraps it. Sign-in, session and health screens are in `system` |
| `onboarding` | `onboarding` | Gate 0; Missions (messages, finalizations, context runs, readiness waivers) | `/missions/new`, `…/onboarding` | Canon chat (with Stop on a reply), checkpoints 0.1–0.4, facts and their sources, questions, uploads, secrets (step-up), finalize. Owns the `clients` table (CR-15) |
| `packages` | `packages` | Packages | none (used inside onboarding and business) | Package catalog: price, deadline, check set |
| `plan` | `plan` | Plan and roster (plan) | `…/plan` | Plan versions, modules, requirements, scenarios, checks, codebase analysis |
| `roster` | `roster` | Plan and roster (roster) | `/roster` | Agents and roles; a roster change files a factory PR |
| `factory` | `factory` | Dispatches; Decisions (proposals) | `…/dispatch`, `…/modules/$moduleRef`, `…/dispatches/$dispatchId` | The dispatch package (CR-W11 / CR-16), module runs, DISPATCH.md, task docs, retry ladder, parked and converge proposals, dispatch overrides, the slot rack, the line |
| `integrator` | `integrator` | Gates and findings (integration commits) | `…/integration/$integrationCommitId` | The integration lane, Gate 2 results, the test matrix, quarantine proposals |
| `runner` | `runner` | Dispatches (attempts, room) | `…/attempts/$attemptId` | Attempts, rooms, Gate 3 completion, room terminals, attempt clocks, activity seismographs |
| `harness` | none | — | — | No screen of its own: what it does shows up in the runner's traces (vendor and model per attempt) |
| `compute` | none | Health (doctor) | — | Room health appears in `system` (doctor) and on runner rooms; rooms have no routes by design |
| `gate` | `gate` | Gates and findings; Receipts; Missions (pass approvals, overrides) | `…/gates`, `…/findings`, `…/receipts/$receiptId` | Gate strip, gate evaluations, findings, Gate 3–4 overrides, Gate 5 proposals, receipts, pass approvals |
| `delivery` | `delivery` | Missions (releases, refreshes); Receipts and delivery (archive) | `…/release` | Release, deliveries, refresh onto a new client main, zip download. Owns `repo_connections` (CR-15) |
| `events` | `events` | Events and traces | `/live` | The live layer itself: stream, event registry, live stores, clock, stream status, event river, factory Wall |
| `cli` | `cli` | Auth (CLI device logins and sessions); Your work (operator events) | `/cli/approve/$userCode` | CLI login approval (step-up), CLI sessions, operator commits from the git hook |
| `metering` | `metering` | Metering; Missions (budget increases); Your work (time entries) | `/business` | Business: margin, cost and time per client, package and factory commit; payments; your minutes and time entries; budget increases. The kit's `cost/` area lives here |
| `audit` | `audit` | Audit | `/activity` | The activity and override log |
| `rules` | `rules` | Library (rules, bundles) | `/library/rules…` | Rule packs and their scopes |
| `knowledge` | `knowledge` | Library (skills, knowledge entries, templates, closeout items); Factory repo | `/library/…`, `/factory` | Skills, knowledge entries and releases, project templates, closeout items, factory versions and open changes |
| `evals` | `evals` | Evals (later) | none yet | Deferred: shows an honest "Not running yet" state until evals switch on |
| — | `decisions` | Decisions (pending decisions) | `/`, `/decisions/$ref` | Home. Hosts the list; each owning module supplies the decision kinds below |
| — | `missions` | Missions (list, get, pauses, cancellations); Your work (notes) | `/missions`, `/missions/$missionId` layout | Mission list and strips, the mission layout and header, pause, resume, cancel, notes |
| — | `clients` | Clients and repos | `/clients…` | Clients (owned by `onboarding`) and repo connections (owned by `delivery`) on one screen, with step-up for credentials |
| — | `system` | Auth (sign-in, session); Health | `/login`, `/settings` | Sign-in, session, theme, doctor and health |

Ownership follows the backend's CR-15 item 2 (proposed):
- **The factory repo routes** (versions, changes, merges) belong to `knowledge`, next to the library they mostly change.
- **Clients** belong to `onboarding`, and **repo connections** to `delivery`. Both are inside the 19 modules.
- The web's `clients` module is a screen that reads from both.

### Decision kinds belong to the module that owns the work

Decisions is one list, but every kind is drawn and approved by the module that knows it. Each module registers its kinds (the decision tag body, its approve and reject helpers, its reason prompt), and `decisions` only lays them out. A new proposal kind is a type error until a module registers it.

| Decision kind | Owning module |
| --- | --- |
| Checkpoint 0.1–0.4, plan finalize, re-entry | `onboarding` |
| Parked module, converge pass, review limit, re-pin, dependency request, contract change | `factory` |
| Quarantine, dispatch package commit (CR-W11) | `integrator` |
| Test change, dispute, suppression, Gate 5 finding, pass approval | `gate` |
| Release | `delivery` |
| Budget increase | `metering` |
| Factory PR (knowledge entry, rule, skill, template, roster) | `knowledge`, or `rules` / `roster` for their own PRs |

**Money on decisions.** A decision whose approval changes spend shows its cost impact, because that is part of what you're approving: a budget increase, and also a contract change or re-pin that adds estimated work (for example "+$3.40, estimated"). The figure comes from the server in the decision's summary (CR-W2) and is drawn with `CostImpact`, the one money component `metering` exports for other modules. Decisions that don't change spend show no money.

### Event kinds belong to modules too

The event router is assembled from each module's handlers: `events` owns the connection and the registry, and each module declares what its own event kinds do (patch, invalidate, feed a live store, raise attention).

- **Names stay entity names** (`mission.created`, `attempt.started`, `task_doc.rendered`, `receipt.issued`), as the backend's CR-15 item 8 decided. Events are stored for good and replayed for 30 days, so a name tied to a module would have to change whenever ownership moves.
- **Ownership comes from the contract.** `packages/contract` exports an exhaustive map from each event kind to its owning module (CR-W10).
- **Each module handles exactly its own kinds.** The web builds its registry from that map, and the merged table must cover every kind in the contract's event union. A new kind is a type error until it has an owner and that module handles it.

### What every module looks like

```text
apps/web/src/modules/<name>/
  api.ts         query options and mutations for its contract groups
  events.ts      handlers for its event kinds (registered into events)
  decisions.ts   its decision kinds (registered into decisions)
  screens/       its screen components (exported through screens.ts)
  components/    module compositions built from the kit
  index.ts       its light public surface: query options, mutations, decision kinds, event handlers, types
  screens.ts     its screens, for files in src/routes only

apps/web/test/modules/<name>/   its tests, run against the contract mock (Fenn's territory)
```

Rules:
- A module imports the kit, the `data` core and other modules **only through their `index.ts`**. No reaching into another module's files. A lint boundary enforces it, the same way the backend keeps its modules apart inside one service.
- **`index.ts` stays light:** named exports only (never `export *`), and never screens or heavy components. Otherwise importing one query option from `gate` would pull its screens into the Decisions route and quietly break code splitting.
- **Screens come from `screens.ts`,** and only files in `src/routes` may import it. A route file sets the loader, search params and SSR mode, then renders the module's screen.
- **Registries are static:** `events` and `decisions` import each module's handlers and decision kinds by name, so the build can see exactly what's included.
- **Money components (`cost/`) are exported only by `metering`,** and the only one other modules may import is `CostImpact` for decision tags. That keeps money on Business, plus a decision's own cost, by construction.
- **No test files inside module folders.** A module's tests live in `apps/web/test/modules/<name>/` and run on their own against the contract mock with the simulator, so a backend module and its front-end twin can be built and checked together. Keeping them outside the module is what lets Fenn lock them and Gate 1 keep builders off them.

## Layers

| Layer | What it owns | Where it lives |
| --- | --- | --- |
| Routes | URLs, search-param state, loaders that prefetch, SSR mode per route, auth guard | `src/routes` (TanStack Router file routes) |
| Screens | One module per backend module (see Modules): its screens, queries, event handlers and decision kinds | `src/modules/<name>` |
| Kit | Enclosure Grid components with the six shared states and `data-ui` names; shadcn primitives underneath | `src/kit` |
| Data core | The oRPC client, query defaults, error mapping (each module keeps its own query options and mutations in its `api.ts`) | `src/data` |
| Live | The event stream connection, the event registry, live stores, the shared clock | `src/modules/events` |
| Transport | `OpenAPILink` to `/api`, headers (Idempotency-Key, request ID), contract version check | `src/data/client.ts` |
| Mock | The contract implemented with fixtures, plus the event simulator | `packages/contract-mock` |

Rules that hold across layers:
- A screen gets server data only through `useSuspenseQuery` / `useQuery` with options from the owning module's `api.ts`, or through a live store selector. Never `fetch`, never `useEffect` to load data.
- Kit components take plain props. They don't know about oRPC or routes, so Claude Design's prototypes and Storybook-style specimens can render them with the simulator.
- Progress, display state and the onboarding journey are **displayed, never computed** on the client (the IQ lesson). If a screen needs a number the server doesn't send, it gets a contract change request.

## Rendering and SSR

TanStack Start renders pages; it never serves data. Data comes from the Hono server's `/api` through oRPC, as the design doc sets.

- **One origin.** The Start app and the Hono API sit behind one reverse proxy on one domain (for example `app.avelco.dev` with `/api` routed to Hono). Better Auth's cookie then works for both, with no CORS, and the server should speak **HTTP/2** so several live streams don't hit the browser's 6-connection limit.
- **Per-request clients during SSR.** `getRouter()` creates a fresh `QueryClient` per request, and the oRPC client used by loaders on the server forwards the incoming request's cookie and request ID. In the browser it uses same-origin fetch with credentials.
- **Router and Query wired together** with `setupRouterSsrQueryIntegration`: loaders call `queryClient.ensureQueryData(...)` with the same options the component reads, so SSR data is dehydrated and streamed to the browser with no second fetch.
- **SSR mode per route** (TanStack Start's selective SSR):

| Routes | `ssr` | Why |
| --- | --- | --- |
| Decisions, Release, mission summary, business, library, clients | `true` | Fast, complete first paint, especially on the phone |
| Mission live (Map and Wall), traces, Canon chat | `'data-only'` | Loader data comes from the server, but the components measure layout and stream, so they render in the browser |
| Login | `true` | — |

- **No theme flash.** The root `shellComponent` reads the theme cookie (light or night) and writes it on `<html>` before first paint.
- **The live stream starts only in the browser,** after hydration. SSR pages show their freshness stamp from the snapshot time.

## Routes

The URL is the state for navigation: tabs, filters, the selected view and the followed module live in validated search params, so reload, back and shared links all work.

| Route | Screen | Level | Notes |
| --- | --- | --- | --- |
| `/` | Decisions (home) | L1 | Decision tags, mission strips, slot rack, the hero counts. No money except a decision's own cost impact |
| `/decisions/$ref` | One decision | L1 | A sheet over the list on desk; a full page on the phone. `ref` is `kind:id` (see CR-W2) |
| `/missions` | All missions | L1 | `?state=&client=&package=` |
| `/missions/new` | New mission | — | Pick or create a client, then start Canon |
| `/missions/$missionId` | Mission layout | L2 | Header, gate strip, tabs. Index redirects to `onboarding` before finalize, else `live` |
| `…/onboarding` | Canon interview and checkpoints | L2 | `?checkpoint=0.1…0.4`; chat beside the checkpoint document |
| `…/live` | Mission live | L2 | `?view=map\|wall&follow=M2&paused=1` |
| `…/plan` | Approved plan | L3 | `?version=` |
| `…/dispatch` | Dispatch package | L3 | DISPATCH.md, task docs, prompts, completion reports, commit state, agent package download (CR-W11 / CR-16) |
| `…/modules/$moduleRef` | Module run | L3 | Dispatches, retry ladder, attempts, findings. Cost per module is on Business |
| `…/dispatches/$dispatchId` | Dispatch | L3 | Task doc versions, attempts, room |
| `…/attempts/$attemptId` | Attempt trace | L4 | Full trace stream, virtualized |
| `…/gates` | Gates and integration | L3 | Gate evaluations and the integration lane |
| `…/integration/$integrationCommitId` | Integration commit | L4 | Results and log |
| `…/findings` | Findings | L3 | `?state=&kind=` |
| `…/release` | Release | L2 | Receipt, pass approval, release. Phone first |
| `…/receipts/$receiptId` | Receipt | L3 | `?verify=1` |
| `/live` | Factory live | L2 | Every running room across missions (Wall) and the event river |
| `/clients`, `/clients/$clientId` | Clients and repo connections | — | Credential actions use step-up |
| `/business` | Business | — | Margin, cost and time per client, package, module and factory commit; payments; budgets and burn. The only screen that shows spend |
| `/library/$kind`, `/library/$kind/$itemId` | Skills, knowledge, rules, templates | — | Changes open factory PRs |
| `/factory` | Factory versions and open changes | — | Open changes also appear in Decisions |
| `/roster` | Agent roster | — | |
| `/activity` | Audit log | — | Overrides included |
| `/settings` | Theme, CLI sessions, health and doctor | — | |
| `/cli/approve/$userCode` | Approve a CLI login | — | Step-up |
| `/login` | Sign in | — | Email and password, optional passkey |

The root route's `beforeLoad` reads the Better Auth session and redirects to `/login?next=` when signed out. Routes are code-split automatically, and links preload on intent.

## Data layer

**The client.** `createORPCClient` with `OpenAPILink` over the contract, typed from the contract only (never from the server's router), so the web calls the same REST routes as the CLI, fully typed. `createTanstackQueryUtils(client)` gives `orpc.<group>.<route>.queryOptions / infiniteOptions / mutationOptions / key()`. Query keys come from oRPC, so invalidation is typed: `queryClient.invalidateQueries({ queryKey: orpc.missions.key() })`.

**Query options live in the module that owns the resource** (`modules/missions/api.ts`, `modules/gate/api.ts`, …) and are used by both the loader (`ensureQueryData`) and the component (`useSuspenseQuery`). Lists use `infiniteOptions` with the API's cursor (`limit` at most 100).

**Freshness follows the stream.**

| Stream | Query defaults |
| --- | --- |
| Healthy | `staleTime: Infinity` for resources the stream covers; the event router keeps them current. No polling, no refetch on focus. |
| Reconnecting or down | `staleTime: 30s`, refetch on focus and reconnect; widgets show "Stale, Ns old". |
| Resumed | Missed events replay from `Last-Event-ID` (up to 30 days). If the gap is longer, invalidate everything. |

**Writes.**
- **Approve what you saw.** Each approval helper takes the DTO on screen and builds its input from it, including the version it binds (`rowVersion`, `version`, `receiptHash`, `headSha`). Types make it impossible to approve without the object you were shown.
- **Idempotency.** One `Idempotency-Key` per user intent, created on tap and reused if that same request is retried; set by the link from client context.
- **No optimistic server state for decisions.** The tap gives instant feedback ("Approving…" within 100ms); the punch plays on the 2xx; the stream event then removes the item. Small, safe edits (notes, time entries) may update optimistically.
- **Never offline.** Approvals, releases and overrides are disabled while offline or while the stream is down for more than a short grace period, and never queued for later.
- **Reasons first.** Overrides, rejections, acceptances and pass approvals open a reason sheet before the request is made.

**Errors by code** (one `toUiError` mapper; the request ID is always shown, copyable):

| Code | What the screen does |
| --- | --- |
| 400 | Field errors from `details` beside the inputs |
| 401 | Redirect to `/login?next=` |
| 403 | "Not allowed" with the reason; a step-up requirement opens the password dialog (CR-W6) |
| 404 | The not-found state, with a way back |
| 409 | The stale state: refetch the item, show what changed, offer "Review new version". An idempotency-key conflict is a bug report, not a user message |
| 422 | "Not allowed now" with the server's reason and the current state |
| 429 | Disable the action with a countdown from `Retry-After` (CR-W8) |
| Network / 5xx | Keep the last good value, mark it stale, retry with backoff |

Query retries only on network errors and 5xx, never on 4xx.

**Contract version check.** Every response carries `X-Contract-Version`. If it differs from the version the web was built with, a banner asks you to reload, so an old bundle never talks to a newer API.

## Live layer

The heart of the control room: one stream in, many components kept current.

```
GET /api/events/stream ──► connection (oRPC event iterator, lastEventId, retry)
                              │
                              ▼
                        event router (typed by kind)
            ┌──────────┬──────┴────────┬─────────────┐
            ▼          ▼               ▼             ▼
       patch cache  invalidate    live stores    attention
     (setQueryData) (exact keys)  (ring buffers) (badge, title,
                                                  notification)
            └──────────┴───────┬───────┴─────────────┘
                               ▼
                 components (selectors, rAF-batched)
```

- **One connection per tab** to the global event stream (all missions; the operator watches everything). Screens filter by mission client-side. Trace streams (`/api/traces/stream?attemptId=`) open only for terminals and traces on screen, and close when they leave the screen.
- **Resume.** The last `seq` is kept in memory and in session storage; reconnects send it as `lastEventId`. Sequence numbers aren't gapless (Postgres sequences skip on rollback), so the client trusts the server's replay instead of detecting gaps.
- **The event router** is a typed table, one entry per event kind, assembled from each module's handlers according to the contract's kind-to-owner map (CR-W10). Each entry declares its effects: patch a cached object (dispatch state, gate results), invalidate exact keys (a new proposal → the pending decisions list), push into a live store (terminal lines, activity ticks, test results), or raise attention (decision arrived → count in the tab title, badge, browser notification). It's exhaustive: a new event kind in the contract is a type error until its owning module handles it (CR-W1).
- **Coalescing (the 4 Hz rule).** Events land in a buffer and flush once per animation frame, inside `startTransition`, so a tap always beats a burst of events; counters and money flush at most every 250ms. The exception is an event that touches what you're acting on right now (the decision under your finger went stale), which applies immediately. React re-renders only components whose selected slice changed.
- **Live stores** hold fast, append-only, short-lived data that doesn't belong in the query cache: a ring buffer per attempt for terminal lines (thumbnail keeps 40 lines; L4 keeps the full stream, virtualized), activity ticks for the last 5 minutes per dispatch, test-matrix cells per integration commit, and the stream status. They use TanStack Store with selectors.
- **One shared clock.** A single 1-second ticker, paused when the tab is hidden, drives every "updated 4s ago", every attempt clock and every stall check (no progress event for 10 minutes, the same threshold as the factory alert). The number comes from the server as `stallAfterMs` on `GET /api/status` (CR-W5), so the screen and the alert can't drift; the design tokens only set how the stalled state looks. Components never run their own timers.
- **Pause and follow.** Pausing a live view freezes what you see and counts what arrives ("Paused, 14 new events") while the stream keeps running underneath. Follow pins one module or agent, like `avel watch --follow`.
- **Scrub back** through history needs a bounded history read (CR-W4); until then, the event river shows events since the page opened.
- **Background and battery.** Hidden tabs stop animating but keep the stream for a few minutes so badges stay right; after that the phone closes the stream and resumes from `lastEventId` when you return.
- **Simulator in development.** The contract mock's simulator emits the same events with realistic timing and scenario buttons (module lands, test fails, stall, disconnect, 409), the same scenarios Claude Design's prototypes use.

## State: where each kind lives

| Kind of state | Lives in | Example |
| --- | --- | --- |
| Server snapshots | TanStack Query cache, patched by events | Missions, decisions, receipts, findings |
| Live and fast | Live stores (TanStack Store) | Terminal lines, activity ticks, test cells, stream status |
| Navigation | URL search params, validated with Zod | `view=map`, `follow=M2`, `checkpoint=0.2`, filters |
| Session | Route context from Better Auth | Signed-in operator |
| Preferences | Cookie (read on the server) | Theme, density |
| Small conveniences | localStorage, wrapped in try/catch, with versioned keys (`avel:v1:wall-layout`) | Last Wall layout |
| Forms | TanStack Form, validated with the contract's input schemas | Canon answers, reasons, client edits, secrets |
| UI only | Component state | Sheet open, hover freeze on a decision |

Never: copying server data into a store, computing progress or display state on the client, or keeping secrets anywhere in the browser.

## Performance budgets

| Measure | Budget | Where |
| --- | --- | --- |
| First paint with content (LCP) | under 1.5s on a mid-range phone over 4G | Decisions, Release |
| Tap feedback | under 100ms | Approve, Release, every button |
| Interaction to next paint (INP) | under 200ms | All screens |
| Initial JavaScript | under 150 KB gzipped | Decisions and Release routes |
| Layout shift (CLS) | under 0.02 | All screens |
| Live rendering | 60fps with 6 rooms streaming | Mission live, Wall |

How:
- Automatic code splitting per route; the Map view, trace viewer, charts, diff viewer, markdown and the Canon document load only when opened.
- Long lists virtualized (TanStack Virtual): event river, traces, findings, test matrix, audit log.
- Live rendering through selectors and animation-frame batching; animations on transform and opacity only; Wall thumbnails render only while visible.
- Skeletons at the final size; tabular figures and fixed widths for changing numbers, so nothing jumps.
- Fonts self-hosted and subset (Inter Variable for UI, IBM Plex Mono for IDs, hashes and commands, as in the design library), preloaded, with a size-matched fallback.
- One call per screen where possible: Level 1 needs the mission strips' summary fields in the list response (CR-W5), never one request per mission.
- Checked in CI with Lighthouse at a phone profile on Decisions and Release.

## React rules

From Vercel's react-best-practices (69 rules after adapting it to this stack), the ones that change how `apps/web` is written. The full set ships as the factory skill `react-tanstack-performance` (below).

| Rule | What it means here |
| --- | --- |
| **React Compiler on** | `apps/web` builds with the React Compiler, which memoizes automatically. No `memo`, `useMemo` or `useCallback` by habit; only after a profile shows a cost, with a comment saying why |
| **No data in effects** | Server data comes only from a query (prefetched by the loader) or a live store. Effects never load data or derive state |
| **One query options factory** | Loader and component share the options from the owning module's `api.ts`, so SSR data is reused with no second request |
| **Parallel loaders** | Critical queries are awaited together; secondary ones are started and stream in behind Suspense |
| **Light module entries** | `index.ts` named exports only, screens in `screens.ts` (see Modules) |
| **Stream updates as transitions** | Batched per frame and applied in `startTransition`, so user input goes first |
| **Fast data outside React state** | Terminal lines, ticks and test cells live in ring buffers in live stores; components subscribe to the slice they draw |
| **`<Activity>` for switched views** | Map and Wall, and decision sheets, stay mounted while hidden: switching back is instant and keeps pan, zoom, scroll and state. A hidden Wall closes its room streams and resumes them when shown |
| **`content-visibility: auto`** | On long rows (audit log, findings, event river) as a cheap first step before virtualization |
| **`useDeferredValue` for filters and search** | Typing never waits for a long list to re-render |
| **Icons one by one** | A single local `icons.ts` imports only the lucide icons the app uses |
| **Theme from the cookie** | Set on the server in the root shell; never read from localStorage in an effect |
| **Small SSR payload** | Loaders prefetch only what the first paint shows; traces, history and large text load in the browser |

## Latency

One rule: **show something real within 100ms, and never let a slow step hold up a fast one.**

**Targets** (checked in CI and measured on the first missions):

| What | Target |
| --- | --- |
| Tap to visible feedback | under 100ms |
| Factory event committed to pixel on screen | under 250ms |
| Canon's first visible word after you send | under 1s typical, under 2s at worst |
| An agent's output line to its room thumbnail | under 500ms |
| Stop on a Canon reply to the reply ending on screen | under 300ms |

**In the UI**
1. **Answer the tap before the network.** Pressed state and "Approving…" show at once; only the result waits on the server.
2. **Data is already there when you navigate.** The stream keeps the cache current and links preload on hover or touch, so most screens open with no network wait.
3. **Stream the page, not just the data.** The server sends the frame and the critical data first; secondary panels fill in behind placeholders at their final size.
4. **Keep the main thread free.** Markdown, terminal colors and diffs are parsed in a Web Worker; long lists draw only what's visible; updates batch once per frame.
5. **Small code where it counts:** under 150 KB on Decisions and Release.

**In the stream pipeline** (no stage may hold events back)
6. **Every hop passes each event straight through:** model proxy → server → reverse proxy → browser. The reverse proxy turns off buffering and compression for streams (`X-Accel-Buffering: no` or the proxy's equivalent); one buffering hop adds seconds.
7. **Heartbeats every 15 seconds** keep connections from closing quietly; reconnects use a randomized backoff and resume from the last event ID, so nothing is lost or repeated.
8. **HTTP/2 on one domain** for the app and the API, so streams don't queue behind each other.
9. **Server-Timing headers** on API responses, so slow steps show up in the browser's tools and in tests.

**In Canon's chat**
10. **The metric is time to the first visible word.** Your message appears instantly (it's yours, so that's safe), and "Canon is replying" shows while the request is in flight, which is real activity.
11. **Subscribe before you send.** The web opens Canon's reply stream for the session first, then posts your message, so the first words are never missed.
12. **Keep the prompt's opening identical every turn.** System prompt, rubric and approved documents in the same order, with no timestamps, so the provider reuses it from cache. This is the biggest single cut in time to first word. (Backend: worth a test that the cached prefix is byte-identical across turns.)
13. **Short and fast by design.** Canon replies on the worker tier with a 400-token limit, and asks questions with 2–5 one-tap answers.
14. **The reply never waits on fact extraction.** The reply streams first; facts settle into the checkpoint as chips afterwards.
15. **Draw words in batches.** Text is appended once per frame as plain text while streaming, and formatted as markdown when the reply finishes, so it doesn't slow down as it grows.
16. **Resume, never restart.** A dropped connection picks up from the last chunk.
17. **Stop.** A Stop button on a reply in progress cancels the model call upstream (CR-W14). The partial reply stays, marked "Stopped", and the tokens already generated are metered as usual. This is an operator action and doesn't change the budget rule: the proxy still never cuts a reply off for budget reasons.

**For agent traces:** room thumbnails show the last few lines and update at most a few times a second; full detail streams only when a room is opened.

## The factory skill: react-tanstack-performance

The same rules reach the agents that build front ends, so client apps on this stack get them too.

- **What:** a stack skill of 69 rules: 53 from Vercel's react-best-practices (commit 1a2c79d, MIT) kept or lightly adapted, 8 rewritten from Next.js to TanStack Start, Router, Query and Vite, and 8 of AVEL's own (the React rules above). Next.js-only rules are left out on purpose. `NOTICE.md` lists every change and carries the MIT text.
- **Who gets it:** Leon (screens), Fantem (components), Ghost (data layer) and Leah (accessibility and performance review), mapped in `factory.yaml` to the `react@19` and `@tanstack/react-start@1` version ranges.
- **How it arrives:** like any skill: uploaded into the factory repo, pinned by its hash, and live only after you merge its PR. It reaches missions finalized after the merge, and its hash is part of each attempt's `skills_sha256`.

## Security in the browser

- Session in Better Auth's httpOnly cookie; nothing secret in localStorage or URLs.
- Secrets are write-only inputs: sent once, never shown again, never logged.
- Credential actions (secrets, repo connections, CLI login approval) open the step-up password dialog; approvals never do.
- Everything written by agents or derived from clients (traces, findings, uploads, task docs, checkpoint text) is untrusted: rendered as text, markdown sanitized, terminal output escaped. No raw HTML from the API, ever.
- A strict content security policy; no third-party scripts.

## Testing

All web tests live in Fenn's territory (`apps/web/test/**` and `apps/web/e2e/**`), are written before the build and locked, like the backend's.

| Test | What it proves |
| --- | --- |
| Event router unit tests | Every event kind produces its declared cache and store effects, and every kind in the contract's owner map has a handler in its owning module |
| Error mapper tests | Every error code renders its state |
| Screens against the contract mock (Vitest + Testing Library) | Each screen works on the mock, including empty, error, not configured and stale |
| End-to-end on the mock (Playwright) | The operator flow: approve, 409, 422, 429, release, override with reason, stream disconnect and resume, stall |
| End-to-end on the real API | The same flow once the server is up (build step 11) |
| Screenshot matrix | Every route × light and night × 1440, 1024 and 390, no sideways scroll at 390 |
| Design-system guard tests | Tokens only, contrast, `data-ui` names, six states, no decorative loops (see the design doc) |
| Accessibility (axe) | No violations on every route |
| Performance budgets | Lighthouse CI on Decisions and Release |
| Bundle boundaries | A build check that each route chunk holds only its own module code, the kit and the data core: no other module's screens, no heavy view the route doesn't show |
| Money boundary | A lint rule that only `metering` imports from `kit/cost` internals, and only `CostImpact` is imported elsewhere |
| Latency targets | Playwright on the mock: tap to feedback, event to pixel and Stop timed with the simulator; a pipeline test that sends a timed event through the reverse proxy config and fails if it arrives buffered |

## Contract conventions (from ski043/api-yt)

The repo at `ski043/api-yt` (commit 89f0191, Sep 15, 2026) is a small contract-first oRPC demo: two procedures, Next.js 16, Prisma and SQLite, oRPC 2.0.0-beta.35, and no front end beyond the starter page. It isn't a base for `apps/web` (different framework, no UI), but its contract conventions are good and match what `packages/contract` needs. Adopt these, and hand them to the backend session:

| Convention in api-yt | How AVEL uses it |
| --- | --- |
| `contract/base.ts`: one base contract with the typed error map (`oc.errors({...})`), which every route extends | One base with AVEL's codes: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT` (stale version, not "already exists"), `UNPROCESSABLE_CONTENT` (422, missing in api-yt), `TOO_MANY_REQUESTS`, plus `STEP_UP_REQUIRED` (CR-W6). Each carries typed `data` where the web needs it (`retryAfterMs`, the current version on a 409, the reason on a 422) |
| `contract/<group>.ts`, one file per route group, composed in `contract/index.ts` | Matches the Overview's `packages/contract/src/routes`; 18 group files |
| `schemas/<resource>.ts`: the DTO first, then inputs derived from it with `.pick()` / `.extend()` | Matches `packages/contract/src/dto`. Inputs derived from DTOs can't drift from them, and the web's forms validate with the same input schemas |
| OpenAPI metadata on every procedure: method, path, tags, summary, `successStatus: 201` on creates | Every route; the tags become the 18 groups in the API docs. The count lives in the contract (see Route count), never in a doc |
| `implement(contract).$context<AppContext>()`, with middleware that adds to the context (`requireAuth` → `user`) | The server's implementer; auth middleware reads the Better Auth session instead of an Authorization header |
| Rate limiting as composable middleware | Only on the routes the design names (sign-in, agent routes, webhooks, CLI login), not app-wide by IP |
| OpenAPI handler with smart coercion of path and query params, and a reference docs page | Same, with the docs page behind sign-in |

Not adopted:
- **Typing the client from the router** (`RouterClient<typeof router>`) and the server-side `createRouterClient` shortcut. Both import server code. The web types its client from the contract only, and a lint boundary stops `apps/web` importing `packages/server` or `packages/db`.
- **A second `/rpc` endpoint.** The web uses the same REST routes as the CLI and the API docs, so logs, request IDs and errors look the same everywhere. Money in micros and ISO times don't need the RPC format's richer types.
- **Next.js, Prisma and header-token auth,** which the factory design already replaced with TanStack Start, Drizzle and Better Auth.

**oRPC version: 1.x stable (decided Nov 3).** The contract, server, web and CLI pin the same exact 1.x version. api-yt's conventions carry over in v1 syntax: route metadata is written with `.route({ method, path, tags, summary, successStatus })` instead of v2's `.meta(openapi({...}))`, and the web uses the TanStack Query stream helpers under their v1 names (`experimental_streamedOptions`, `experimental_liveOptions`). Moving to v2 later is a planned migration once it's stable, mostly mechanical because the conventions are the same.

## Folder layout

```text
apps/web/
  src/
    routes/                 thin file routes: loader, search params, SSR mode, then a module screen
    modules/
      onboarding/ packages/ plan/ roster/ factory/ integrator/ runner/
      gate/ delivery/ events/ cli/ metering/ audit/ rules/ knowledge/ evals/
      decisions/ missions/ clients/ system/
    kit/                    Enclosure Grid components (data-ui), states, motion; cost/ exported via metering
    data/
      client.ts             oRPC client, OpenAPILink, headers, version check
      query.ts              QueryClient defaults (stream-aware)
      errors.ts             toUiError
    styles/tokens.css       Enclosure Grid @theme (light and Night v2)
    lib/                    money (micros → $, used by metering only), durations, time
  test/                     unit, component and screen tests, mirroring src/ (modules/<name>/, kit/, data/)
  e2e/                      Playwright flows, screenshot matrix, latency tests
packages/contract-mock/     contract implemented with fixtures + simulator
```

The live layer's core (connection, registry, stores, clock) lives in `modules/events`; each module's `events.ts` plugs into it.

**Territories for Gate 1.** These are the only web paths. The roster (Roster setup and sessions, Nov 4), task docs and Gate 1's territory check use these globs, and nothing under `packages/web`. Globs never overlap.

| Territory | Glob | Default owner |
| --- | --- | --- |
| One module | `apps/web/src/modules/<name>/**` (except `events`) | Leon, one module per dispatch, including its `api.ts`, `events.ts` and `decisions.ts` |
| Routes | `apps/web/src/routes/**` | Leon, one route file per screen the dispatch owns |
| Kit | `apps/web/src/kit/**` | Fantem |
| Tokens and styles | `apps/web/src/styles/**` | Nemi |
| Data core | `apps/web/src/data/**` | Ghost |
| Live core | `apps/web/src/modules/events/**` | Ghost |
| Helpers | `apps/web/src/lib/**` | Ghost |
| Contract mock | `packages/contract-mock/**` | Ghost. Required from W0: every screen test, end-to-end flow and latency test runs on it |
| Tests | `apps/web/test/**`, `apps/web/e2e/**` and the test config | Fenn. Locked before the builder starts |
| App config | `apps/web/{package.json,vite.config.ts,tsconfig.json}` | Nemi (it holds the theme and Tailwind setup) |

A dispatch's task doc can name a different builder for a module (for example Ghost on a data-heavy module), but its territory is still exactly one row of this table.

## Build order for the web

1. **W0 Scaffold.** Start app, tokens and kit basics, oRPC client, contract mock with simulator, auth shell, theme cookie.
2. **W1 Decisions and Release, phone first,** on the mock, including 409, 422 and the punch (`decisions`, `delivery`, `gate`, plus the decision kinds of `onboarding`, `factory` and `metering`).
3. **W2 Live layer** (`events`, `missions`). Stream, event registry, live stores, clock, stream status; mission strips and the slot rack update live.
4. **W3 Mission live** (`factory`, `integrator`, `runner`). The line, rooms, Map and Wall, L3 module and dispatch, L4 traces.
5. **W4 Canon onboarding** (`onboarding`, `plan`, `packages`). Chat, checkpoints, facts, uploads.
6. **W5 The rest** (`metering`, `knowledge`, `rules`, `roster`, `audit`, `clients`, `cli`, `system`). Business, library, factory versions, clients with step-up, activity, settings.
7. **W6 Real API.** Switch from the mock, run the full test list, meet the budgets.

## Contract change requests

Things the screens need that I couldn't confirm in the project docs (the DTO tab and the event catalog in After Canon aren't in this project). Each is "confirm it exists, or add it".

**CR-W1, W2, W5, W9 and W10 are written up together,** with full shapes, the starting event catalog and their checks, in "CR-W1 W2 W5 W9 W10 — What the first screens need" (Nov 3). That doc adds checkpoints, finalize, pass approval and release to the Decisions list, and a `GET /api/status` read for slots and alerts. Its CR-W10 section needs the v0.6 rewording below.

| ID | Request | Needed by |
| --- | --- | --- |
| CR-W1 | The event catalog exported from the contract as a Zod discriminated union with typed payloads per kind, so the event router is exhaustive | Live layer |
| CR-W2 | Pending decisions as a discriminated union that carries everything for one-tap approval: a stable `ref`, kind, target IDs, the version or hash to bind, a summary (title, evidence, cost impact in micros when the decision changes spend, consequence), and its approve and reject inputs | Decisions |
| CR-W3 | A trace stream for several attempts at once (or per mission), so the Wall doesn't open one connection per room; or a commitment to HTTP/2 end to end | Wall, Mission live |
| CR-W4 | A bounded event history read (`missionId`, `beforeSeq`, `limit`) for scrubbing and backfilling the event river, since the events page was cut; or confirm that replaying the stream from an older `seq` is the way to scrub | Event river, scrub |
| CR-W5 | Summary fields on the mission list for Level 1 strips (gate strip, needs-you count, running dispatches), plus a factory status read (slots busy of 6, alerts, `stallAfterMs`) for the hero counts and top bar. Spend and budget fields feed Business only (v1.1) | Decisions home, top bar, Business |
| CR-W6 | A distinct error code for "step-up required" and the documented way to get a grant from the Better Auth routes outside the contract | Clients, secrets, CLI approve |
| CR-W7 | `lastProgressAt` on dispatch and attempt DTOs, so stall states are right on first load before any event arrives | Mission live |
| CR-W8 | `Retry-After` (or `retryAfterMs` in `details`) on 429 | Every write |
| CR-W9 | A `plain` block on missions, modules, dispatches, decisions and receipts: a one-sentence summary, plain part and step names, Why and If-you-approve text for decisions, plain proof lines for receipts. The web shows it and never derives it (from the Enclosure Grid v1.1 decisions) | Every screen |
| CR-W10 | The event-kind-to-owner map from the backend's CR-15 item 8: an exhaustive map from each event kind to its owning backend module, exported from `packages/contract`. Kinds keep their entity names (`attempt.started`, `receipt.issued`), so nothing stored is ever renamed; each front-end module handles exactly the kinds the map gives it | Live layer, every module |
| CR-W11 | The dispatch package: the backend's three CR-16 read routes (manifest, file, archive), plus a confirm route, the `dispatch_package_commit` decision kind and three attempt fields. Written up in its own doc, "CR-W11 — Dispatch package route" (v3, all questions decided). The confirm route and decision kind aren't in the backend's CR-16 contract yet (Nov 3), which lands the package automatically | Dispatch screen, Decisions |
| CR-W12 | Evidence artifacts on the receipt (named in the CR-W11 doc; still to be written up) | Release |
| CR-W13 | Client knowledge routes (named in the CR-W11 doc; still to be written up) | Client knowledge |
| CR-W14 | Stop a Canon reply in progress: `POST /api/missions/{missionId}/messages/{messageId}/cancellations` with an `Idempotency-Key`. The server aborts the upstream model request through the proxy, keeps the partial reply with `state: 'stopped'`, meters the tokens generated, and emits `message.stopped` (owner: `onboarding`). `409` if the reply already finished; `404` for an unknown message | Canon chat |

## Route count

The number of routes is whatever `packages/contract` exports. A contract test snapshots the list of method and path pairs, so any change shows up in review, and docs say "the contract's routes" rather than a number.

Where the count stands today, if every request is accepted:

| Source | Routes |
| --- | --- |
| API reference (factory design v0.6), the contract today | 99 |
| CR-16 / CR-W11: package manifest, file, archive | +3 (the backend's 102) |
| CR-W11: commit confirm | +1 (not yet in the backend's CR-16) |
| CR-W5: `GET /api/status` | +1 |
| CR-W14: stop a Canon reply | +1 |
| CR-W12 and CR-W13 | not written up yet |
| **Total so far** | **105** |

The design doc keeps saying 99 until Step 0 applies the accepted change requests.

## The API review questions, from the front end

From the Overview's eight questions, what matters for the web:
- **Q4, version in the body:** keep it. The typed client checks it, which is what makes "approve what you saw" a type rule.
- **Q8, display state computed by the server:** keep it. The web never derives display state.
- **Q3, separate approval nouns:** keep them. Each decision kind gets its own typed input.
- **Q1, Q2, Q5–Q7:** no effect on the web either way.

## Design library follow-ups

The library (Enclosure Grid, file v1.1) is generated from the design source, so these are changes to make there, not in the built HTML:
- **Stall:** `--av-stall-after: 8m` and the copy "No progress for 8m" / "No output for 8m" become 10 minutes, and the token is renamed to something that sets only the stalled look (for example `--av-stall-style`), since the threshold comes from `stallAfterMs`.
- **Money on work screens:** the retry ladder's "$1.20 / $4" goes; work screens show time only, as the attempt clock already does.
- **One version label:** the file name says v1.1, the page title v1.8 and the footer v1.6. Pick one and cite it from the docs.

## Open questions

- [ ] One origin: confirm the Start app and Hono sit behind one proxy and one domain, over HTTP/2.
- [ ] Phone notifications for new decisions: start with the tab title and badge, or add web push now (needs a service worker and a push-subscription route in the contract)?
- [ ] Install the web app on the phone's home screen (PWA) in v1?
- [ ] CR-W11's confirm route and `dispatch_package_commit` decision: confirm the backend adds them to CR-16.
- [ ] The upstream react-best-practices says MIT in its README and metadata but ships no license file; the skill carries the standard MIT text in `NOTICE.md`. Worth a quick check before the skill's PR is merged.
- [x] Fonts: **Inter Variable and IBM Plex Mono**, as the design library uses (decided Nov 4).
- [x] Stall threshold: **10 minutes**, sent by the server (decided Nov 4).
- [x] oRPC version: **1.x stable**, the same exact version pinned across contract, server, web and CLI (decided Nov 3).
- [x] Event names: **entity names plus the contract's owner map**, per CR-15 item 8 (decided Nov 4).
- [x] Web tests: **their own territory** (`apps/web/test/**`, `apps/web/e2e/**`), owned by Fenn (decided Nov 4).
- [x] Money on decisions: **any decision that changes spend shows its cost impact** (decided Nov 4).
- [x] Contract mock: **required from W0**, built by Ghost (decided Nov 4).
- [x] Module ownership: factory repo routes in `knowledge`; clients in `onboarding`, repo connections in `delivery`, per CR-15 item 2 (pending CR-15's acceptance).
