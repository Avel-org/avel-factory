status: closed (INT's decisions, contract revision 10)
severity: P3
owner: Nemi (`apps/web/vite.config.ts`); upstream TanStack Start for the proper fix; INT decides

# Size study 04: seroval, the SSR payload, and Start's server-function RPC (candidate 4)

**Measurement, not a defect.** Baseline `/` first load 174.35 kB gzip.

## What the 9 kB is
Sourcemap attribution of the baseline (gzip alone): `seroval/dist/index.js` **7.9** (24.1 raw; the whole library, one file) + `seroval-plugins/web.js` 0.7, plus `@tanstack/start-client-core` `client-rpc/serverFnFetcher.js` 1.2 and `client-rpc/frame-decoder.js` 1.1.

**Why the client carries all of it.** `start-client-core`'s `client/hydrateStart.js` always pushes `ServerFunctionSerializationAdapter` into the router's adapters, and that file imports `createClientRpc` -> `serverFnFetcher` -> `seroval`'s `fromCrossJSON` and `toJSONAsync`, plus the framed-stream decoder. That is the client half of `createServerFn`. This page has no server function. The `$R[...]` bootstrap that the server writes into the HTML is plain JavaScript, and the stubbed build hydrated with no seroval in the client bundle, so for this page hydration doesn't need the library.

Which plugins: TanStack's own (`makeSerovalPlugin`, the `RawStream` codec and plugins, `ShallowErrorPlugin`, about 1.5 kB together) and `seroval-plugins/web` (0.7: `Request`, `Response`, `Headers`, `ReadableStream`, `URL`, `URLSearchParams`, `FormData`, `Blob`, `File`, `Event` and others). The 7.9 is seroval's own parser, serializer and deserializer, not a plugin.

## Saving
Scratch experiment: a Vite plugin (client environment only) resolves `client-rpc/serverFnFetcher.js`, `createClientRpc.js` and `frame-decoder.js` (imported from inside `start-client-core`) to three-line stubs that throw if called.

| | first load, vite gzip | brotli 11 | change |
| --- | --- | --- | --- |
| baseline | 174.35 kB | 149.37 | |
| with the stub | 146.28 + 17.04 = **163.32** | 140.47 | **-11.03 gzip, -8.90 brotli** |

After the stub, a fresh attribution lists no `seroval` and no `seroval-plugins` in the client bundle: the whole 8.6 kB leaves, plus the 2.3 kB of RPC code, less a little glue. Independent of S1-6 and of options 1 and 3 (in the combined build of options 1, 3 and 4 the three saved 30.03 against a sum of 31.17; the 1.14 overlap is `@orpc/tanstack-query`, shared by options 1 and 3, so none of it is this option's).

## Level: A for the stubbed build
Production build + mock + Chromium at 390x844: 4 rows in the HTML, hydrates with no console output, approve with a reason works. Full Vitest: **190/190** pass. Real implementation is **C**: this is a stub of Start's internals. A supported route would be a Start option (`start-plugin-core` 1.171.55's schema has `serverFns: { base }` and I found no switch), or a build plugin like mine, or a Start fix (the adapter should be added by the server-function transform only when a server function exists).

## The SSR payload (what `/`'s HTML carries)
```
HTML 16.35 kB raw, 4.43 kB gzip; 3 inline scripts, 5.54 kB raw / 2.17 kB gzip
```
The big inline `<script data-tsr-stream-part>` (5,407 chars) holds, in `$R` form: the manifest (`preloads`, the two asset URLs), the match list (`__root__`, `/`, their ids and statuses, `u` timestamps), and `dehydratedData`: the dehydrated query (`dehydratedAt`, `state`, `queryKey`, `queryHash`, `pages` -> 4 rows of about 1 kB raw each). The rows are the page's real data, duplicated once in HTML markup and once here: that is the cost of hydrating without a second request (UI contract section 5). Only option 1 shrinks it (3.05 kB raw, the query wrapper is gone). Start's knobs are per-route `ssr: false | 'data-only' | true`; none prunes plugins or the manifest. The payload is HTML, not JavaScript, so section 8 doesn't count it; I report it for the first-paint cost (+2.2 kB gzip on the document).

## Cost
- Nemi: `apps/web/vite.config.ts` (a ~20-line plugin, as in the scratch diff below) and a guard: the plugin must fail the build if `createServerFn` appears anywhere under `apps/web/src`, so a later server function never meets a stub silently.
- UI contract section 6 (a line on the plugin); no FM line; no locked test (190/190).
- No new dependency.

## Risk
- **Start upgrades:** it matches three file paths inside `@tanstack/start-client-core`. A new Start version that renames them makes the plugin a no-op (the size comes back, nothing breaks), so a CI check on the size is the alarm. A Start version that makes those modules load something else the stub lacks could break hydration; that shows in the e2e.
- **W2 to W5:** anything that adds `createServerFn` (for instance session cookies at W5) needs the stub off. The guard turns that into a decision, not a surprise. The FM plans oRPC to the backend and no server functions.
- Streaming of `Promise`/`ReadableStream` loader values uses the `$R` machinery and the router's plugins, not `fromCrossJSON`; I didn't test deferred loader data.

## Scratch diff in short (`vite.config.ts`)
```ts
function stubServerFnRpc(): Plugin {
  const stubs = {
    "client-rpc/serverFnFetcher.js": "export const serverFnFetcher = () => { throw … }; export const trackPostProcessPromise = () => {};",
    "client-rpc/createClientRpc.js": "export const createClientRpc = () => () => { throw … };",
    "client-rpc/frame-decoder.js": "export const FRAME_HEADER_SIZE = 9; /* …the other constants as 0 */",
  };
  return { name: "scratch:stub-serverfn-rpc", enforce: "pre",
    resolveId(id, importer) {
      if (this.environment.name !== "client" || !importer?.includes("start-client-core")) return null;
      const hit = Object.keys(stubs).find((k) => id.endsWith(k));
      return hit ? `\0stub:${hit}` : null; },
    load(id) { return id.startsWith("\0stub:") ? stubs[id.slice(6)] : null; } };
}
// plugins: [ stubServerFnRpc(), tailwindcss(), tanstackStart(), react() ]
```

## Commands (scratch)
```
$ pnpm exec vite build
dist/client/assets/routes-24c9l_g6.js   50.25 kB │ gzip:  17.04 kB
dist/client/assets/index-C5R1wGFE.js   469.68 kB │ gzip: 146.28 kB
FIRST LOAD  raw 519.94 kB  gzip 161.71 kB  brotli 140.47 kB
FIRST LOAD (vite gzip, summed over the chunks above): 163.32 kB
{ "rowsAfterLoad": 4, "approvedShown": true, "rowsAfterApprove": 3, "problems": [] }
$ pnpm exec vite build --sourcemap && FILES="seroval|start-client-core" node attr.mjs …
(no seroval line; start-client-core: hydrateStart.js 0.2, ServerFunctionSerializationAdapter.js 0.2, constants.js 0.1)
$ pnpm exec vitest run
Test Files  14 passed (14)   Tests  190 passed (190)
```

## Recommendation: do now
11 kB for one plugin, no locked test, no data-core change; the largest real saving in the study. Ask TanStack upstream for the conditional adapter so the plugin can go.
