status: done
ticket: T-B15

# T-B15 · build · Soap: completion report (attempt 2)

All 10 of T-B15's locked tests pass, and so does every Part 7 command.

- **Attempt 1** built the webhook and the loader (commits `3c5d7df` and `207ab44`). It stopped as `test-dispute` on one assertion: T-B15-03's `system.alert.raised` payload shape.
- **The ruling** went for the contract. Rigg changed the assertion to `{ alert: { kind, key: "unexpected_factory_merge:<sha>" } }` (`fd37493`). Axis added the F2 relock line at `fd37493` (`90f3d52`).
- **This attempt** needed no code change. Attempt 1's code already writes the contract's payload, so the relocked test passes on it as it is. This report is the only file this attempt changes.

## Pre-flight (Part 7, in order, against this worktree's own Postgres from `scripts/pg-local.sh`)

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm test` | exit 0: 67 files passed, 1003 tests passed, 1 skipped |
| `pnpm --filter @avel/server test` | exit 0: 27 files passed, 75 tests passed, 1 skipped |
| `pnpm --filter @avel/server typecheck` | exit 0 |
| `pnpm --filter @avel/server check:effect` | exit 0: 0 errors, 9 warnings, 2 messages. All are in test files, none in `src/`: `test/db/errors.test.ts`, `test/platform-hardening/idempotency.test.ts`, `test/platform-hardening/rate-limit.test.ts`, and Rigg's locked `test/factory-repo/loader.test.ts` |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | exit 0: the same 1003 passed, 1 skipped |

- **Before any change** (the D3 baseline at `90f3d52`), `pnpm build` and `pnpm test` were green: 67 of 67 files passed.
- **Stability:** I ran `test/factory-repo` 5 more times on its own, and all 10 tests passed each time. The hanging fetch's `sleep 600` child was always killed, and none was left running.
- **The branch and main:** `main` has no commits that the branch lacks, and the branch merges cleanly with `origin/main`.

| Task | Test | Result |
| --- | --- | --- |
| T-B15-01 | A bad or missing signature is 401 with an ErrorBody and requestId, and writes nothing | pass |
| T-B15-02 | A merge by the App adds a row with `merged_by_app` true, and the loader reads factory.yaml at that SHA | pass |
| T-B15-03 | A merge by anyone else adds a row with `merged_by_app` false and one `system.alert.raised` (the contract's payload); the loader refuses the SHA | pass (relocked at `fd37493`) |
| T-B15-03 | A merge on another repo or another branch is acknowledged and ignored | pass |
| T-B15-04 | An unmerged branch, a push and a ping have no effect; the loader refuses the SHA | pass |
| T-B15-05 | A replayed delivery is acknowledged and ignored: no second row, no second event | pass |
| T-B15-06 | The 61st delivery in a minute is 429 with the contract's body and requestId; the next minute is open | pass |
| T-B15-07 | A merged SHA with no factory.yaml at the root is `FactoryYamlMissing` naming the SHA | pass |
| T-B15-08 | A mirror missing the SHA is fetched once; a mirror that has it isn't fetched | pass |
| T-B15-08 | A hanging fetch ends at its `TestClock` timeout as `FactoryFetchTimeout` | pass |

## What changed

This attempt changed only this report. These files came from attempt 1 (`3c5d7df`, `207ab44`), all inside Part 5's Territory, and this attempt left them as they were.

- **`packages/server/src/knowledge/factory-versions.ts`** (new). The knowledge module owns `factory_versions` (E12):
  - `FactoryVersions.record` inserts a merge.
  - `FactoryVersions.isSelectable(sha)` is true only for a row with `merged_by_app` true.
  - `isCommitSha` accepts a full 40- or 64-character hex SHA.
- **`packages/server/src/knowledge/index.ts`** (new): the module's only public entry.
- **`packages/server/src/platform/webhooks/github.ts`** (new): `makeGithubWebhook` serves `POST /api/webhooks/github` through `runEdge`. Its runtime holds `RateLimitLive`, `DbLive` at the given URL, and the app's clock. In order:
  1. **Rate limit:** T-B8's `webhook` limit (60 a minute), keyed by the socket peer. Past it, the answer is 429 with the contract's body through `errorTable`.
  2. **Signature:** the raw body is read once. `X-Hub-Signature-256` must be `sha256=<64 hex>`, an HMAC-SHA256 under the secret, compared with `timingSafeEqual`. Anything else is 401 `UNAUTHORIZED` as an ErrorBody, and nothing is written. The secret is held as `Redacted` and never logged.
  3. **Decide:** `decideDelivery` is plain TypeScript (Writing Effect rule 10). It acts only on a `pull_request` event with action `closed`, `merged` true, a full `merge_commit_sha`, the factory repo (compared case-insensitively) and base `main`, parsed with zod. `merged_by_app` is `merged_by.login === appLogin`. Every other delivery is acknowledged and ignored.
  4. **Apply:** everything happens in one `Db.withTransaction`:
     - It inserts the `webhook_deliveries` row with `on conflict do nothing`. A replayed delivery finds its row and does nothing more.
     - A merge adds the `factory_versions` row, with `approved_by` set to the one operator's `users.id`.
     - A merge by anyone but the App also appends `system.alert.raised` and ends with `commitWithEvents`. The payload is `{ alert: AlertDto }`: key `unexpected_factory_merge:<sha>`, kind `unexpected_factory_merge`, severity `stopped`, and `since` from the Clock. It's compile-checked with `satisfies EventOf<"system.alert.raised">["payload"]`.
  5. **Answer:** 204. The app adds `X-Request-Id` and `X-Contract-Version`.
- **`packages/server/src/platform/webhooks/index.ts`** (new): the webhook's entry.
- **`packages/server/src/platform/app.ts`:** a `webhook?: WebhookOptions` option (`databaseUrl`, `secret`, `repo`, `appLogin`). With it, the webhook is served outside the contract, next to Better Auth, with both headers on every response.
- **`packages/server/src/platform/factory-repo/index.ts`** (new): `makeFactoryRepo({ databaseUrl, mirrorPath, git?, fetchTimeoutMs? })` returns `{ readFactoryYaml(sha), close() }`.
  - **Refusal:** a SHA that isn't a full commit SHA, or has no `merged_by_app` true row, is `FactoryShaRefused`.
  - **Missing commit:** `git cat-file -e <sha>^{commit}` checks the mirror. A miss runs one `git fetch --quiet origin`, bounded on the Clock with `Effect.timeoutOrElse` (30 s by default). The child process is killed on interruption, and a timeout is `FactoryFetchTimeout`.
  - **The file:** `git cat-file blob <sha>:factory.yaml` returns the text. A missing file is `FactoryYamlMissing`.
  - Every error carries `sha`, and its message names it.
  - Git always runs as a child process, with `--git-dir` and `GIT_TERMINAL_PROMPT=0`. No git library is used.
  - factory.yaml isn't parsed (E8).
- **`docs/agent-dispatch/backend/sprint-04/agent-soap-t-b15-build-completion.md`:** this report. It replaces attempt 1's `test-dispute` report.

## Contract to files

| Requirement | Where |
| --- | --- |
| Item 1: the webhook outside the contract, with both headers | `platform/app.ts`, `platform/webhooks/github.ts` |
| Signature over the raw body, compared in constant time; otherwise 401 and nothing written (T-B15-01) | `webhooks/github.ts` (`isSignedBy`, `unsigned`) |
| Rate limit of 60 a minute; past it, 429 with the contract's body (T-B15-06) | `webhooks/github.ts` (`limiter.check("webhook", …)`, `failed`) |
| Dedupe on X-GitHub-Delivery, in the same transaction (T-B15-05) | `webhooks/github.ts` (`apply`) |
| Merge by the App: a row with `merged_by_app` true (T-B15-02) | `webhooks/github.ts` (`decideDelivery`), `knowledge/factory-versions.ts` (`record`) |
| Merge by anyone else: `merged_by_app` false and `system.alert.raised` in the same transaction (T-B15-03) | `webhooks/github.ts` (`apply`, `unexpectedMerge`) |
| Other events, repos and branches ignored (T-B15-03, 04) | `webhooks/github.ts` (`decideDelivery`) |
| Item 11: the loader reads factory.yaml by SHA, only for App merges (T-B15-02, 03, 04, 07) | `platform/factory-repo/index.ts`, `knowledge/factory-versions.ts` (`isSelectable`) |
| Mirror fetched only when the SHA is missing, with a timeout (T-B15-08; Writing Effect rule 5) | `factory-repo/index.ts` (`hasCommit`, `fetch`) |
| Table owners (E12) | `factory_versions` is written and read only in `knowledge/`; `webhook_deliveries`, `events` and the `users` read stay in platform |

## Deviations

- **No code change in this attempt.** The relocked test passes on attempt 1's code, so following B9 and C3, nothing was rebuilt.
- **Carried over from attempt 1** (none of these is covered by a test):
  - **`FactoryFetchFailed`** is a fourth tagged error, beyond the three that `support.ts` names. It covers a fetch that exits non-zero or ends without the commit, which is an outside failure a caller can handle (Writing Effect rule 3).
  - **Two kinds of timer:**
    - The fetch, the only network call, times out on the Clock, as the seam asks.
    - The two local `cat-file` reads use the child process's own 10-second timer instead. On the Clock, T-B15-08's 5-second `TestClock.adjust` steps would kill them before `git` could start.
  - **400 `BAD_REQUEST`** answers a signed delivery that lacks `X-GitHub-Event` or `X-GitHub-Delivery`. GitHub always sends both, and without the delivery ID there's nothing to deduplicate on.
- **`support.ts`'s header comment** still describes the alert payload as `{ kind, sha }`. The assertion that F2 changed is the one that counts, and the file is locked, so I left it alone. Rigg may want to update the comment.

## Limitations

- **Config isn't read anywhere yet:**
  - `GITHUB_WEBHOOK_SECRET`, the repo, the App's login and the mirror path arrive as options (`createApp({ webhook })` and `makeFactoryRepo`), as the seam defines.
  - Reading them from Config belongs where the server is assembled: `main.ts` and `server.ts`. Those are T-B16's files and outside this Territory.
  - The webhook isn't mounted in `main.ts` yet.
- **The mirror:** nothing creates it, and nothing keeps it up to date apart from the on-demand fetch. Making the first mirror is deployment work that no Step 1 test asks for.
- **The webhook's database pool** lives as long as the app and has no `close`, like Better Auth's pool.
- **No test covers:**
  - an unknown operator (no `users` row), which is a defect and returns 500;
  - a merge SHA that arrives a second time under another delivery ID (409 `ALREADY_EXISTS` through `errorTable`);
  - `FactoryFetchFailed`;
  - the 400 for missing headers.
- **No run against GitHub.** The manual check of `avel/factory`'s branch protection (Step 1 plan, risks) isn't part of this ticket.

## Messages received

None. No instruction from OSA arrived during this attempt.
