status: open
severity: P3
owner: Ghost (data core, UI contract section 3), Leon (the module), Fenn (locked tests), Zero (contract revision); INT decides

# Size study 01: TanStack Query replaced by router loaders (candidate 1)

**Measurement, not a defect.** Baseline = 080ca45 plus `"sideEffects": ["**/*.css"]`, `/`'s first load 174.35 kB gzip (vite's figure, entry 157.31 + route chunk 17.04).

## Saving
| | baseline | this option | change |
| --- | --- | --- | --- |
| first load of `/`, vite gzip | 174.35 kB | **161.90 kB** (entry 147.67 + routes 14.23) | **-12.45 kB** |
| first load, zlib gzip | 172.68 | 160.38 | -12.30 |
| first load, brotli 11 | 149.37 | 138.71 | **-10.66** |
| inline SSR payload in the HTML | 5.54 kB raw (2.17 gz) | 3.05 kB raw (1.25 gz) | -2.49 raw. This is HTML, not JS, so it isn't in the budget |

Gone from the bundle (sourcemap attribution, each gzipped alone): `@tanstack/query-core` 10.0, `@tanstack/react-query` 1.1, `@tanstack/router-ssr-query-core` 0.4 plus the react glue 0.2, `@orpc/tanstack-query` 1.3. About 13 kB alone; the hand-written replacement costs about 0.6 kB, so the net is 12.45.

Does not depend on S1-6. It overlaps option 3 on `@orpc/tanstack-query` (1.3 kB): together they save 1.1 kB less than the sum.

## Level: A
A production build served with the contract mock (my harness: `dist/server/server.js` plus statics plus the mock on `/api`), Chromium at 390x844:
- the server's HTML holds the 4 rows (`<article data-ui="DecisionTag">` x 4);
- the page hydrates with no console error or warning;
- approve with a reason works: dialog opens, the row shows "Approved by you at HH:MM.", the list drops to 3 rows.

Not run: stale (UC-30), rate-limit, signed-out and the first-load error panel. The code paths are the screen's own and unchanged, but I didn't exercise them.

## What I built (scratch, 12 files, +114 -123; `usePending.ts` is new, 66 lines)
- `router.tsx`: context `{ api }`; `setupRouterSsrQueryIntegration` and `createQueryClient` removed.
- `routes/index.tsx`: `loader: ({ context }) => loadDecisionsScreen(context.api)`.
- `modules/decisions/api.ts`: `loadFirstPage(api)` (try/catch, returns `{ page, error, at }`, serialized into the SSR payload by Start), `fetchPage`, `decide`.
- `modules/decisions/usePending.ts`: `useLoaderData({ from: "/" })` plus local state for `pages`, `error`, `updatedAt`; `refetch()`, `fetchNextPage()`, a 3-try retry on `network`/`server`.
- `DecisionsScreen.tsx`: `useSuspenseInfiniteQuery` -> `usePending()` (throws the error when no data, so `FirstLoadBoundary` still works); `useMutation` -> a plain call; `invalidateQueries` -> the existing `refreshList()`.
- `data/client.ts`: `Api = { client }`, `useApi()` reads `useRouter().options.context.api`; `data/query.ts` deleted.
- `package.json`: `@tanstack/react-query`, `@tanstack/react-router-ssr-query`, `@orpc/tanstack-query` removed.

## Cost
- **Territories:** Ghost (`data/client.ts`, `data/index.ts`, `data/query.ts`, `router.tsx`, `data/pending-decisions.ts`'s `InfiniteData` type), Leon (`api.ts`, `index.ts`, `screens.ts`, `DecisionsScreen.tsx`, `routes/index.tsx`), Nemi (`routes/__root.tsx` context type, `package.json`).
- **Contract and FM lines that change:** UI contract section 3 (`createQueryClient`, `bindApi`/`apiFor`/`useApi`, `getRouter()`'s Query wiring) and section 5 ("The component reads the same options with `useSuspenseInfiniteQuery`"); FM Data layer and FM's React rules ("One query options factory", "No data in effects": loaders now feed state).
- **Locked tests:** 4 screen files fail to load (`contract-version.test.tsx`, `deciding.test.tsx`, `errors.test.tsx`, `list.test.tsx`: 37 of 190 tests) because their helpers build a `QueryClient`. The edits are in `test/setup/render.tsx`, `test/setup/stubs/data/{client,query}.ts` and `test/modules/decisions/helpers.tsx` (w0-data and decisions locks), so it needs a lock override on both. The 153 other tests pass.
  ```
  $ pnpm exec vitest run   # in the scratch copy
  Test Files  4 failed | 10 passed (14)
  Tests  153 passed (153)
  ```
- **What the page loses, and the cost to rebuild by hand:**
  | Lost | By hand |
  | --- | --- |
  | `staleTime` 30s, refetch on focus, refetch on reconnect | Not rebuilt in the scratch copy. About 25 lines (`visibilitychange` and `online` listeners calling `refetch`), plus a timestamp check |
  | Retry 3x on network/server with backoff | Rebuilt in `usePending` (10 lines) |
  | Infinite paging with `select` | Rebuilt (`pages` state plus `selectPendingPages`) |
  | Mutation state (`isPending`, `mutateAsync`) | The screen already holds its own `Outcome`; a bare call was enough |
  | The query cache as 5.4's error source (`query.error`, `isRefetchError`, `isFetchNextPageError`) | Rebuilt as two booleans; about 10 lines |
  | Deduping and sharing one fetch across components | Not needed on one screen; needed from W2 |
  | Cache across navigations, `invalidateQueries` by key | Not rebuilt. Router loader cache (`staleTime`, `router.invalidate()`) covers navigation; per-key invalidation does not exist |
- **A convention it breaks:** codebase-analysis "Screens never call fetch and never keep server data in state" (FM, Layers) and the FM rule "No data in effects": `usePending` keeps pages in component state, which is exactly what the rule keeps out.
- New dependencies: none.

## Risk
- **W2 to W5:** the FM plans live updates into a cache (events stream -> `setQueryData`, "Stream updates as transitions", "Fast data outside React state"). Without Query that cache is also hand-built. This is the main reason not to do it: it saves 12.5 kB now and is rebuilt, bigger, at W4.
- SSR/hydration: worked (above). Streaming/Suspense: the loader awaits; no deferred data.
- Upgrade: TanStack Router loader and `useLoaderData` types are stable; the hand state is ours to maintain.

## Commands (scratch worktree, baseline + this diff)
```
$ pnpm exec vite build
dist/client/assets/routes-DOX7-z6G.js    40.94 kB │ gzip:  14.23 kB
dist/client/assets/index-AOLUsImq.js    468.42 kB │ gzip: 147.67 kB
$ node bench.mjs <web> 4413 --flow      # my harness: serve + measure + Chromium flow
FIRST LOAD  raw 509.37 kB  gzip 160.38 kB  brotli 138.71 kB
FIRST LOAD (vite gzip, summed over the chunks above): 161.90 kB
{ "rowsAfterLoad": 4, "approvedShown": true, "rowsAfterApprove": 3, "problems": [] }
```

## Recommendation: don't
12.45 kB for a data-core rewrite, 37 locked tests and a lock override, and a rebuilt cache at W4. The 150 kB budget is reachable without it (see the report).
