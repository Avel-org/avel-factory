status: done
ticket: T-B15

# T-B15 tests: completion report (Rigg)

Start commit: `b20bf58`. Branch `t/B15-factory-repo-webhook`. Not pushed.

## Pre-flight
- `pnpm build`, `pnpm typecheck`, `pnpm lint`: exit 0 (lint: 2 existing warnings, none in my files).
- `pnpm test`: 65 files pass; my 2 files fail, 10 tests, as intended. 993 pass, 1 existing skip (T-B8-02 quarantine).
- `pnpm --filter @avel/server typecheck`: pass. `check:effect`: 0 errors (9 existing warnings).
- `pnpm --filter @avel/server test`: same result as `pnpm test` for the server (only the 10 new tests fail).
- Last line of the list (build && typecheck && lint && test) fails only on `pnpm test`, for the 10 tests.

## Failing first
All 10 fail on the start commit (no code from me outside `test/factory-repo/`). Reasons:
- Webhook tests (01 to 06): `POST /api/webhooks/github` isn't mounted, so it is 404: `missing: expected 404 to be 401` (01); `expected false to be true` on the 2xx check (02 to 05, and the ignored-repo test); `delivery 1: expected false to be true` (06).
- Loader tests (07, 08 a and b): `Cannot find module '.../src/platform/factory-repo/index.ts'`.

```
 FAIL  test/factory-repo/loader.test.ts > T-B15-07 · no factory.yaml > a merged SHA with no factory.yaml at the repo root is a typed error naming the SHA
 FAIL  test/factory-repo/loader.test.ts > T-B15-08 · the mirror fetch > a fetch that hangs ends within its timeout (TestClock) as a typed error
 FAIL  test/factory-repo/loader.test.ts > T-B15-08 · the mirror fetch > a mirror missing the SHA is fetched once; a mirror with it is not fetched
 FAIL  test/factory-repo/webhook.test.ts > T-B15-01 · signature > a bad or missing X-Hub-Signature-256 is 401 with an ErrorBody and requestId, and writes nothing
 FAIL  test/factory-repo/webhook.test.ts > T-B15-02 · merge by the App > adds one factory_versions row with merged_by_app true, and the loader reads factory.yaml at that SHA
 FAIL  test/factory-repo/webhook.test.ts > T-B15-03 · merge by anyone else > a merge on another repo, or on another branch of this one, is acknowledged and ignored
 FAIL  test/factory-repo/webhook.test.ts > T-B15-03 · merge by anyone else > adds a row with merged_by_app false and one system.alert.raised, and the loader refuses that SHA
 FAIL  test/factory-repo/webhook.test.ts > T-B15-04 · unmerged branch > a commit on an unmerged branch has no effect, and the loader refuses its SHA
 FAIL  test/factory-repo/webhook.test.ts > T-B15-05 · replay > a replayed X-GitHub-Delivery is acknowledged and ignored: no second row, no second event
 FAIL  test/factory-repo/webhook.test.ts > T-B15-06 · rate limit > the 61st delivery in a minute is 429 with the contract's body and a requestId; the next minute is open
AssertionError: delivery 1: expected false to be true // Object.is equality
AssertionError: expected false to be true // Object.is equality
AssertionError: missing: expected 404 to be 401 // Object.is equality
Error: Cannot find module 'file://packages/server/src/platform/factory-repo/index.ts' imported from packages/server/test/factory-repo/support.ts
[18:23:34.653] ERROR (#1): Error: Cannot find module 'file://packages/server/src/platform/factory-repo/index.ts' imported from packages/server/test/factory-repo/support.ts
```

## What changed
- `packages/server/test/factory-repo/support.ts`: harness; names the seams (below); local bare origin and mirror, a `git` wrapper that counts fetches or hangs one, payload builder, signing with a throwaway secret.
- `packages/server/test/factory-repo/webhook.test.ts`: T-B15-01 to 06 (plus one extra test: other repo or other branch is ignored).
- `packages/server/test/factory-repo/loader.test.ts`: T-B15-07, 08 (fetch once, and hang ended by TestClock).

## Contract to files
- 01: webhook.test.ts "T-B15-01" (401 UNAUTHORIZED ErrorBody with requestId for missing, wrong, unprefixed, garbage and tampered signatures; no rows in factory_versions, events, webhook_deliveries).
- 02: "T-B15-02" (row fields, approved_by = operator, no alert, loader reads factory.yaml).
- 03: "T-B15-03" (merged_by_app false, one system.alert.raised with kind unexpected_factory_merge, loader refuses with FactoryShaRefused).
- 04: "T-B15-04" (closed-unmerged, push to a feature branch, ping: no row; loader refuses).
- 05: "T-B15-05" (same delivery id twice: one row, one event, one delivery row).
- 06: "T-B15-06" (61st is 429 TOO_MANY_REQUESTS, details.retryAfterMs 60000, requestId; open next minute via TestClock).
- 07: loader.test.ts "T-B15-07" (FactoryYamlMissing, message names the SHA; a factory.yml at the root doesn't count).
- 08: loader.test.ts "T-B15-08" (zero fetches when the SHA is present, one when missing, no second; hung fetch ends as FactoryFetchTimeout under TestClock).

## Seams the build must provide (for Axis to confirm before the lock)
- `createApp({ webhook: { databaseUrl, secret, repo, appLogin } })` mounting the route; same `clock` drives the "webhook" limit, keyed by socket peer. The brief says secret, repo and App identity come "from Config"; createApp's existing pattern (`auth`) is options, so I used options. If Soap reads Config instead, that is a test-dispute to settle before the lock.
- Handled, replayed and ignored deliveries answer any 2xx. Bad signature is 401 UNAUTHORIZED.
- Payload: GitHub pull_request "closed" with pull_request.merged, merge_commit_sha, number, title, merged_at, merged_by.login, base.ref "main", repository.full_name. summary = title, merged_at from the payload, approved_by = the one users row.
- Alert payload: `{ kind: "unexpected_factory_merge", sha, ... }` (kind from AlertKind in the contract).
- `src/platform/factory-repo/index.ts`: `makeFactoryRepo({ databaseUrl, mirrorPath, git?, fetchTimeoutMs? })` -> `{ readFactoryYaml(sha): Effect<string, E>, close() }`; error tags FactoryShaRefused, FactoryYamlMissing, FactoryFetchTimeout, each with `sha`; message names the SHA. `git` is an executable path; fetch runs as `git ... fetch`.

## Deviations
- E13's four: a webhook has no rowVersion and no DTO (it is outside the contract), so the stale-rowVersion test doesn't exist; happy path, error body with requestId and replay are covered by 02, 01/06 and 05.
- One extra test (other repo and non-main base ignored), beyond the eight tasks, because the notes name it.
- The hang test yields with `setTimeout(0)` between TestClock adjustments to let the child process start; that is no wall-clock wait for time to pass.

## Limitations
- No implementation exists, so I couldn't watch any of these pass; the happy-path assertions are checked against the seams only by reading.
- I don't check that the killed git child process is gone after the timeout, nor that the rate limit counts only valid deliveries (the brief doesn't say).
- Signature compare is constant-time by rule, not something a black-box test can show; the review should read the code.
- Whether an ignored event writes a webhook_deliveries row is unspecified, so it isn't asserted.

## Lock line
- T-B15: packages/server/test/factory-repo/support.ts, packages/server/test/factory-repo/webhook.test.ts, packages/server/test/factory-repo/loader.test.ts @ <branch tip>

## Messages received
None.
