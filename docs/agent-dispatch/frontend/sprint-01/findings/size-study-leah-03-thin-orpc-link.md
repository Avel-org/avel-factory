status: open
severity: P3
owner: Ghost (`apps/web/src/data/client.ts`, `errors.ts`); Axis if the route table is generated (S1-7)

# Size study 03: a smaller oRPC client path (candidate 3)

**Measurement, not a defect.** Baseline `/` first load 174.35 kB gzip.

## What the 10 to 12 kB is (baseline sourcemap, each package gzipped alone)
| Package | gzip kB | Role on this page |
| --- | --- | --- |
| `@orpc/openapi-client` | 2.6 | `OpenAPILink`: builds the request from `~orpc.route`, reads the response |
| `@orpc/client` | 2.3 | `createORPCClient` proxy, `ORPCError`, link plumbing |
| `@orpc/standard-server` | 1.6 | request/response (de)serialization helpers |
| `@orpc/shared` | 1.5 | utilities |
| `@orpc/standard-server-fetch` | 1.5 | `Request`/`Response` adapters |
| `@orpc/tanstack-query` | 1.3 | `createTanstackQueryUtils` (overlaps option 1) |
| `@orpc/contract` | 0.8 | the contract builder, pulled in by the route definitions |
| `@avel/contract` | 1.8 | the three routes and their schemas (S1-6 and S1-7 work on this) |
| **Total** | **13.4** | |

## Saving
A thin link written for this page (`data/thin-link.ts`, 55 lines) replaces `createORPCClient` + `OpenAPILink` and the TanStack utils (`api.ts` builds its infinite-query options from `@tanstack/react-query` directly). Section 3's fetch wrapper and `decodeErrorBody` are kept as they are.

| Variant | first load, vite gzip | brotli 11 | change |
| --- | --- | --- | --- |
| V1: routes read from the contract (`~orpc.route`), a local `ORPCError` class | 149.62 + 17.04 = **166.66** | 142.88 | **-7.69 gzip, -6.49 brotli** |
| V1 with `ORPCError` still imported from `@orpc/client` (so the locked `errors.test.ts` keeps passing) | not built alone. Built on top of option 4: 137.65 + 17.04 = **154.69**, against 163.32 for option 4 alone (and 153.98 with the local class) | n/a | **-8.63 on top of option 4** (-9.34 with the local class) |
| V2: V1 plus a static route table (S1-7 by hand: method and path only, no contract runtime import) | 147.96 + 17.04 = **165.00** | 141.51 | -9.35 gzip, -7.86 brotli |

- Of V1's 7.69, 1.3 is `@orpc/tanstack-query`, which option 1 also removes. The pure client path is therefore about 6.4 (local class, alone).
- V2 over V1 is 1.66 kB on classic zod. **That depends on S1-6**: under `zod/mini` the contract's schemas cost almost nothing, so S1-7's measured 0.37 kB is the right number there. Count V2 as V1 plus 0.4.
- zod stays (26.2 kB): `ErrorBody` and the row schema still need it until S1-6.

## Level: A
Production build + mock + Chromium at 390x844: 4 rows in the HTML, hydrates, approve with a reason works, no console output. Full Vitest on V1 + `@orpc/client` kept for `ORPCError`: **190/190 pass** (no lock override). With the local class, `test/data/errors.test.ts` fails to load because it imports `ORPCError` from `@orpc/client`.

Not run: stale, rate limit, signed out, network failure and idempotency paths, i.e. what `data/client.ts`'s tests UC-02 to UC-05 exercise. The Vitest result is the evidence for those, on the mock's `fetch`.

## What the thin link does and doesn't (scratch)
Does: path params from the input (`{proposalId}`), query string for `GET`, JSON body for the rest, `accept: application/json`, `response.text()` then `JSON.parse`, `ok` -> value, otherwise `decodeErrorBody` -> `ApiError`, else `ORPCError` with `data = { status, headers, body }` (section 3, step 2).
Does not: arrays or nested objects in the query (oRPC's OpenAPI link uses bracket notation), multipart/`File`, `Date`/`BigInt` revival, SSE/event iterators, `AbortSignal`, retries, response validation. Route 52 sends `limit` and `cursor`; routes 53 and 54 send a path param and a JSON body.

## Cost
- Ghost: `data/client.ts`, `data/errors.ts` (a base class), a new `data/thin-link.ts`; `modules/decisions/api.ts` (Leon) loses `api.orpc.…` for `infiniteQueryOptions` and manual keys.
- UI contract section 3 (the `createORPCClient` + `OpenAPILink` sentence, `Api = { client, orpc }`), section 5 (`api.ts`'s use of `api.orpc`); FM Data layer says "oRPC client from the contract".
- Locked tests: none, if `ORPCError` stays an `@orpc/client` import. `data/client.test.ts` and the route tests ran unchanged.
- Dependencies: `@orpc/openapi-client` and `@orpc/tanstack-query` leave; `@orpc/client` stays for the error class.

## Risk
- **W4/W5:** the FM's events stream (SSE) and uploads are what oRPC's link does for free. The thin link would be extended or replaced then, so its saving is a sprint-01 saving only.
- Drift: a route table kept by hand (V2) can disagree with the contract. S1-7's build-time JSON plus a contract test is the safe way; it was judged not worth it for 0.37 kB under mini.
- Behaviour differences against oRPC in encoding edge cases (query arrays) would first show up as a 400 from the server.

## Commands (scratch)
```
$ pnpm exec vite build     # V1, local ORPCError
dist/client/assets/routes-AMP6cvaI.js   50.26 kB │ gzip:  17.04 kB   (zlib 16.95)
dist/client/assets/index-DqqYB_ek.js   477.61 kB │ gzip: 149.62 kB
FIRST LOAD (vite gzip, summed): 166.66 kB      zlib 165.00   brotli 142.88
{ "rowsAfterLoad": 4, "approvedShown": true, "rowsAfterApprove": 3, "problems": [] }
$ pnpm exec vite build     # V2
index-k_iVqOkd.js  472.58 kB │ gzip: 147.96 kB      FIRST LOAD 165.00 kB   brotli 141.51
$ pnpm exec vitest run     # V1 with ORPCError from @orpc/client, plus option 4's stub
Test Files  14 passed (14)   Tests  190 passed (190)
$ same thin link, on top of option 4's stub:   137.65 + 17.04 = 154.69 (local class: 153.98); option 4 alone: 163.32
```

## Recommendation: don't now; revisit if a W2 budget needs it
About 7 to 9 kB, level A, no lock override, but it is a second client path to keep and it is thrown away when W4 needs events. After S1-6 and option 4, the page is under 150 without it.
