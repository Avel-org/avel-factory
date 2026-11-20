status: test-dispute
ticket: T-B15

# T-B15 · build · Soap: completion report

The webhook and the loader are built. 9 of T-B15's 10 locked tests pass. The tenth, T-B15-03's first test, fails on one assertion only: the `system.alert.raised` payload's shape. The locked test and the contract disagree about that shape, and no payload can satisfy both. Everything else in that test passes: the row has `merged_by_app` false, there's one alert, and the loader refuses the SHA.

## The dispute (F2, L1)

- **The test:** `packages/server/test/factory-repo/webhook.test.ts:131` expects `raised[0].payload` toMatchObject `{ kind: "unexpected_factory_merge", sha }` at the payload's top level. `support.ts`'s header and Rigg's tests report ("Alert payload: `{ kind: "unexpected_factory_merge", sha, ... }`") say the same.
- **The contract:** `packages/contract/src/dto/events-and-traces.ts:273` types the payload as `"system.alert.raised": z.object({ alert: AlertDto })`. `AlertDto` (`dto/health.ts:32`) is `{ key, kind, severity, missionId, plain, since }`, and has no `sha` field. Its `key` is `<kind>:<subject id>`, so it can carry the SHA.
- **Why I stopped instead of passing it:** a payload of `{ kind, sha }` at the top level means writing an event the contract doesn't describe. Adding those fields next to `alert` would pass the test, but the event would carry fields outside the contract that zod strips on read. Both would be changing the design to fit a test (E3, F2; AGENTS.md, "Where the truth is": the contract wins).
- **What the code writes now** (the contract's shape, compile-checked with `satisfies EventOf<"system.alert.raised">["payload"]`):
  `{ alert: { key: "unexpected_factory_merge:<sha>", kind: "unexpected_factory_merge", severity: "stopped", missionId: null, plain: "A factory change was merged without the factory's App, so finalize is frozen", since: <Clock now> } }`
- **Options for Rigg and Axis:**
  1. Rigg changes the assertion to the contract's shape, e.g. `toMatchObject({ alert: { kind: "unexpected_factory_merge", key: \`unexpected_factory_merge:${sha}\` } })`, then Axis relocks it (F2 relock). This build passes that unchanged.
  2. Or the payload gets a `sha` field through a contract CR (I3). The webhook would then add that field.
- The failing output: `AssertionError: expected { alert: { …(6) } } to match object { …(2) }`. The received payload is the one above.

## Pre-flight (Part 7, in order, against this worktree's own Postgres from `scripts/pg-local.sh`)

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm test` | exit 1: 1 failed, 1002 passed, 1 skipped (67 files, 66 pass). The one failure is T-B15-03's alert payload (above) |
| `pnpm --filter @avel/server test` | exit 1: 1 failed, 74 passed, 1 skipped (27 files). Same single failure |
| `pnpm --filter @avel/server typecheck` | exit 0 |
| `pnpm --filter @avel/server check:effect` | exit 0: 0 errors, 9 warnings, 2 messages, all in files outside this ticket (none in `src/`) |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | exit 1, at `pnpm test`, the same single failure |

- **Before any change** (the D3 baseline), only T-B15's 10 tests failed (65 passed, 1 skipped). The packages had to be built first.
- **Per task:**

| Task | Test | Result |
| --- | --- | --- |
| T-B15-01 | bad or missing signature is 401 and writes nothing | pass |
| T-B15-02 | App merge adds a row with `merged_by_app` true; loader reads factory.yaml | pass |
| T-B15-03 | another repo or branch is acknowledged and ignored | pass |
| T-B15-03 | someone else's merge: row with `merged_by_app` false, one alert, loader refuses | **fail on the payload-shape assertion only** (test-dispute) |
| T-B15-04 | unmerged branch, push and ping have no effect; loader refuses | pass |
| T-B15-05 | replayed delivery: no second row or event | pass |
| T-B15-06 | the 61st delivery in a minute is 429 with the contract's body; the next minute is open | pass |
| T-B15-07 | no factory.yaml at the root is `FactoryYamlMissing` naming the SHA | pass |
| T-B15-08 | a mirror missing the SHA is fetched once, a mirror that has it isn't fetched | pass |
| T-B15-08 | a hanging fetch ends at its `TestClock` timeout as `FactoryFetchTimeout` | pass, 5 runs out of 5. No `sleep 600` process was left behind |

## What changed

- **`packages/server/src/knowledge/factory-versions.ts`** (new). The knowledge module owns `factory_versions` (E12):
  - `FactoryVersions.record` inserts a merge.
  - `FactoryVersions.isSelectable(sha)` is true only for a row with `merged_by_app` true.
  - `isCommitSha` accepts a full 40- or 64-hex SHA.
- **`packages/server/src/knowledge/index.ts`** (new): the module's public entry.
- **`packages/server/src/platform/webhooks/github.ts`** (new): `makeGithubWebhook`, which serves `POST /api/webhooks/github`. It runs through `runEdge` on its own runtime (`RateLimitLive`, `DbLive` at the given URL, and the app's clock). In order:
  1. **Rate limit:** T-B8's `webhook` limit (60 a minute), keyed by the socket peer (`ClientIp`). Over it, the answer is 429 with the contract's body through `errorTable`.
  2. **Signature:** the raw body is read once. `X-Hub-Signature-256` must be `sha256=<64 hex>`, an HMAC-SHA256 under the secret, compared with `timingSafeEqual`. Otherwise it's 401 `UNAUTHORIZED` as an `ErrorBody`, and nothing is written. The secret is held as `Redacted` and never logged.
  3. **Decide:** a pure function, plain TypeScript (Writing Effect rule 10). It looks only at a `pull_request` event with action `closed`, `merged` true, a full `merge_commit_sha`, the factory repo (case-insensitive) and base `main`, parsed with zod. `merged_by_app` is `merged_by.login === appLogin`. Anything else is acknowledged and ignored.
  4. **Apply:** one `Db.withTransaction`. It inserts the `webhook_deliveries` row with `on conflict do nothing`; a replay finds the row already there and does nothing more. A merge adds the `factory_versions` row, with `approved_by` set to the one operator's `users.id`. A merge the App didn't make also appends `system.alert.raised` and ends with `commitWithEvents`.
  5. **Answer:** 204, with `X-Request-Id` and `X-Contract-Version` set by the app.
  - A signed delivery without `X-GitHub-Event` or `X-GitHub-Delivery` is 400 `BAD_REQUEST`.
  - A database rule broken by a write is that rule's contract code through `errorTable`.
  - No operator in `users` is a defect (500). The transaction rolls back, so GitHub's retry can succeed after the seed has run.
- **`packages/server/src/platform/webhooks/index.ts`** (new): the webhook's entry.
- **`packages/server/src/platform/app.ts`:** a `webhook?: WebhookOptions` option (`databaseUrl`, `secret`, `repo`, `appLogin`). With it, the app serves the webhook outside the contract, next to Better Auth, keeping both headers on every response.
- **`packages/server/src/platform/factory-repo/index.ts`** (new): `makeFactoryRepo({ databaseUrl, mirrorPath, git?, fetchTimeoutMs? })` returns `{ readFactoryYaml(sha), close() }`.
  - **Refusal:** any SHA that isn't a full commit SHA with a `factory_versions` row whose `merged_by_app` is true is `FactoryShaRefused`. The check goes through the knowledge module.
  - **Missing commit:** `git cat-file -e <sha>^{commit}` checks the mirror. A miss runs one `git fetch --quiet origin`, bounded on the Clock (`Effect.timeoutOrElse`, default 30 s). The child is killed on interruption, and a timeout is `FactoryFetchTimeout`. A fetch that fails, or ends without the commit, is `FactoryFetchFailed`.
  - **The file:** `git cat-file blob <sha>:factory.yaml` gives its text. A non-zero exit is `FactoryYamlMissing`.
  - Every error carries `sha`, and its message names it.
  - Git always runs as a child process with an explicit `--git-dir` and `GIT_TERMINAL_PROMPT=0`. No git library.
  - factory.yaml isn't parsed (E8).

## Contract to files

| Requirement | Where |
| --- | --- |
| Item 1: the webhook outside the contract, with both headers | `platform/app.ts`, `platform/webhooks/github.ts` |
| Signature over the raw body, constant-time; 401, nothing written | `webhooks/github.ts` (`isSignedBy`, `unsigned`) |
| Rate limit, 60 a minute, 429 with the contract's body | `webhooks/github.ts` (`limiter.check("webhook", …)`, `failed`) |
| Dedupe on X-GitHub-Delivery, in the same transaction | `webhooks/github.ts` (`apply`) |
| Merge by the App: a row with `merged_by_app` true | `webhooks/github.ts` (`decideDelivery`), `knowledge/factory-versions.ts` (`record`) |
| Merge by anyone else: `merged_by_app` false and `system.alert.raised` in the same transaction | `webhooks/github.ts` (`apply`, `unexpectedMerge`) |
| Other events, repos and branches ignored | `webhooks/github.ts` (`decideDelivery`) |
| Item 11: the loader reads factory.yaml by SHA, only for App merges | `platform/factory-repo/index.ts`, `knowledge/factory-versions.ts` (`isSelectable`) |
| Mirror fetched only when the SHA is missing, with a timeout (Writing Effect rule 5) | `factory-repo/index.ts` (`hasCommit`, `fetch`) |
| Table owners (E12) | `factory_versions` written and read only in `knowledge/`; `webhook_deliveries`, `events` and the `users` read stay in platform |

## Deviations

- **I kept building after the dispute.** Part 6 says to stop with `test-dispute` when a locked test looks wrong. I found the dispute after reading the tests and before writing code. It touches one assertion, which nothing else depends on, so I built the rest of the ticket in the same approach. The code writes the contract's payload, not the test's, so nothing was guessed. A fresh attempt only needs the dispute settled.
- **`FactoryFetchFailed`** is a fourth tagged error beyond the three in `support.ts`'s seam. A fetch that exits non-zero, or ends without the commit, is an outside failure a caller can handle (Writing Effect rule 3), and none of the three fits it. No test reaches it.
- **Two kinds of timer:**
  - The fetch (the only network call) times out on the Clock, as the seam asks.
  - The two local reads in the mirror (`cat-file`) are stopped by the child process's own 10-second timer instead. On the Clock they would be killed early by T-B15-08's `TestClock.adjust` steps: 5 simulated seconds every event-loop turn, which is faster than a `git` process starts.
- **400 `BAD_REQUEST`** for a signed delivery that lacks `X-GitHub-Event` or `X-GitHub-Delivery`. GitHub always sends both, and without them there's nothing to deduplicate on. No test covers it.

## Limitations

- **Config isn't read anywhere yet:**
  - `GITHUB_WEBHOOK_SECRET`, the repo, the App login and the mirror path arrive as options (`createApp({ webhook })`, `makeFactoryRepo`), as the seam defines.
  - Reading them from Config, with the secret as `Redacted` from the start, belongs where the server is assembled: `main.ts` and `server.ts`, which are T-B16's and outside this Territory.
  - The webhook wraps the secret in `Redacted` as soon as it receives it.
  - The webhook isn't mounted in `main.ts`.
- **Nothing keeps the mirror up to date** other than the on-demand fetch, and nothing creates it. Making the first mirror clone is deployment work that no Step 1 test asks for.
- **The webhook's pool has no `close`.** It lives as long as the app, like Better Auth's pool does.
- **No test covers** an unknown operator (no `users` row), a duplicate merge SHA from another delivery (409 `ALREADY_EXISTS` through `errorTable`), `FactoryFetchFailed`, or a 400 for missing headers.
- **No run against GitHub.** The manual check of `avel/factory`'s branch protection (Step 1 plan, risks) isn't part of this ticket.
- The 9 `check:effect` warnings are in test files that existed before this ticket.

## Messages received

None. I tried to tell OSA about the dispute (CR-37) as soon as I found it. `SendMessage` to `OSA` answered "No agent named 'OSA' is reachable", and `ListAgents` showed only three other builder sessions (T-B13, T-B14 and T-F10). I'm allowed to message only OSA, so I sent nothing to them. This report is the record.
