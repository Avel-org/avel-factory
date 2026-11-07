status: open
severity: P3
module: w0-data
reviewer: Brennan (agent-brennan-w0-data-review-spec, a1), at 3183bc1

# The client is built over `{ decisions }`, and no doc says so yet

## What the diff does
- `apps/web/src/data/client.ts:23` defines `const webContract = { decisions };`, from `@avel/contract/routes/decisions`.
- `apps/web/src/data/client.ts:68`: `export type ApiClient = ContractClient<typeof webContract>;`
- `apps/web/src/data/client.ts:123`: `new OpenAPILink<ApiContext>(webContract, { … })`.

## What the docs say
- UI contract `docs/ui-contracts/decisions-approval-page.md:196`, section 3, `createApiClient`: "`createORPCClient` with `OpenAPILink` over `@avel/contract` (FM, Data layer)".
- `docs/agent-dispatch/frontend/sprint-01/decisions.md` at this commit has no entry for narrowing the client, and none for the 160 kB first-load budget. Its only budget line is 114: "Leah reviews the page on a phone, with the 150 KB budget."
- Backend D58 (`docs/agent-dispatch/backend/sprint-00/decisions.md:329`) adds the subpath exports "so the web imports only the route groups a page uses", but that's the backend's log. It doesn't change the UI contract.

## Why it's only P3
The change keeps to the spirit of section 3. The link is still typed and built from the contract's own route definitions, and routes 52 to 54 keep their contract paths, schemas and error map. INT asked for it ("Ghost is changing the client to import only the decisions route group"). It's also measured: the client chunk dropped from 163.7 to 153.7 kB gzip by Ghost's count (Vite reports 155.40 kB for `index-BDSlPvoT.js`). And the 85 locked w0-data tests pass. The gap is in the record, not in the behaviour. The next module that calls another route group needs a written rule to add its group to `webContract`, and Leah's review needs the 160 kB budget in writing.

Command:
```
$ grep -rn 'from "@avel/contract"' apps/web/src
(no output: nothing under apps/web/src imports the root export)
$ pnpm --filter @avel/web exec vitest run test/data
 Test Files  7 passed (7)
      Tests  85 passed (85)
```

## What fixing it means
No code change. Zero (or INT) records in `docs/agent-dispatch/frontend/sprint-01/decisions.md`:
1. that the web's client is built over the route groups the web calls, from `@avel/contract`'s subpaths (D58), with `webContract = { decisions }` for sprint-01;
2. the 160 kB first-load budget for sprint-01.

The next UI contract revision then changes section 3's wording to match, for example "over the contract's route groups the web calls (`{ decisions }` in sprint-01; D58)".
