---
doc: agent-soap-t-b19-build
ticket: T-B19
lane: backend
sprint: sprint-05
agent: soap
seat: builder
kind: build
role: build
rigor: full
model: opus
branch: t/B19-platform-follow-ups
checkout: branch
after: [agent-rigg-t-b19-test-unit]
depends_on: [T-B15, T-B16]
report: docs/agent-dispatch/backend/sprint-05/agent-soap-t-b19-build-completion.md
---


# T-B19 · build · Soap: Platform follow-ups: the P2s from T-B14, T-B15 and T-B16's reviews, with the webhook mounted in the running server

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-05 · Step 1 |
| Ticket | T-B19 · rigor full |
| Dispatch | build · Soap (builder) · model opus |
| Works on | `t/B19-platform-follow-ups` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Soap** (`.claude/agents/soap.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/soap.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/backend/sprint-05/codebase-analysis.md`: the codebase in short
5. `docs/design/Step 0 and Step 1 plan.md`: Step 1 items 1, 5, 8, 9, 10, 11; tests 1 to 13 and what CR-31 and CR-43 removed or moved
6. `docs/design/CR-30 Effect in the server, durable jobs and spans.md`: section 3 option A (the hand-built engine) and section 6 (spike 2's verdict: build A)
7. `docs/design/CR-44 A partition key on jobs.md`: accepted Nov 19: the partition_key column, its partial unique index, and the docs it touches
8. `docs/design/CR-43 Step 1 without the CLI.md`: tests 2, 4 and 13 on the clients routes; step-up and CLI login leave Step 1
9. `docs/design/Jobs and workers.md`: claims, check-ins, the reaper, the backoff, one live job per key, consumers and their cursors
10. `docs/design/Build rules.md`: C4, C5, E3, E5, E7, E8, E10, E12, F2, F4, G5, G7, H6, I3
11. `packages/server/src/server.ts`: T-B16's startServer: one Scope, acquireRelease around the app and the socket; where the router's pool and the webhook's settings join it
12. `packages/server/src/platform/router.ts`: T-B14's router builds its own DbLive and runtime (router.ts:23-28), which close() never releases, and reads its timeouts from process.env
13. `packages/server/src/platform/auth/web-auth.ts`: onAPIError throw and intoBetterAuth: sign-in already answers the contract's 500; get-session doesn't
14. `packages/server/src/platform/webhooks/github.ts`: T-B15's webhook: the raw body read at :223 before the signature, decideDelivery, and the apply transaction
15. `packages/server/src/platform/idempotency.ts`: T-B8's store: what complete and release do, and why a defect between commit and complete leaves the key in_progress
16. `packages/server/src/onboarding/clients`: operator.ts's 401 and the 400s answered outside the error table; route 9's create (after #68's erasable-syntax fix)
17. `docs/design/Design v0.6 Main.md`: Factory as code: merges only by the App; anything else raises an alert and freezes finalize
18. `packages/server/test/follow-ups/**`: the locked acceptance tests: they define done
19. `docs/agent-dispatch/backend/sprint-05/agent-soap-t-b19-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** The running server serves the GitHub webhook from its Config and refuses an oversized or unsigned body before buffering it, every sign-in and client error answers the contract's body, a failed write never holds its idempotency key for a day, and shutdown releases every pool at once.

**Refs:**
- t-b14-rigg-01 (P2): the 401 and 400 on the clients routes are answered outside errors.ts's table (Writing Effect rule 3)
- t-b14-rigg-02 (P2): a defect leaves the Idempotency-Key in_progress for 24 hours
- t-b14-rigg-03 (P2): route 9 has no code guard against kind internal; it relies on the seed's row
- t-b15-rigg-01 (P2): the webhook buffers an unsigned body of any size before it checks the signature
- t-b15-rigg-02 (P2): a direct push to the factory's main (an admin bypass) raises no alert, and a merged PR whose payload doesn't parse is dropped with no alert
- t-b15-rigg-03 (P2): no ticket reads the webhook's and loader's settings from Config or mounts the webhook in the running server; the secret is a plain string and an empty one isn't refused
- t-b16-rigg-02 (P2): a database failure in GET /api/auth/get-session answers Better Auth's own 500, not the contract's body with requestId
- t-b16-rigg-03 (P2): close() leaves the router's DbLive pool and runtime open, so SIGTERM after a clients request takes 10 s
- Design v0.6 Main, Factory as code (a merge by anyone but the App raises an alert, including an admin bypass)

**Merged before this starts:** T-B15, T-B16

**Notes from the lead:**
- Start from a main with T-B15 (#66), T-B16 and #68 merged; merge main into the branch before the build starts. #68's packages/server/test/entry/start.test.ts must keep passing and is read only
- t-b16-rigg-03: the router's database layer joins startServer's Scope. Build it once in server.ts from the env given to startServer (timeouts included, not process.env) and pass it to the router, so close() releases it with the rest and SIGTERM after a clients request exits promptly
- t-b15-rigg-03: startServer reads GITHUB_WEBHOOK_SECRET as Config.Redacted, refuses an empty or missing one at startup with a message naming the variable and never the value, reads the factory repo, the App's login and the mirror's path from Config, and mounts the webhook in the running server. The webhook's database access goes through the same scoped layer. List every variable by name in the build report; Javaris adds them to .env.example
- t-b15-rigg-01: the webhook refuses a body over a fixed limit before buffering it (Content-Length first, then a capped read), with 413 and the contract's body, before any signature work or database call. Pick the limit from GitHub's documented payload cap and say which in the report
- t-b15-rigg-02: a signed push to the factory repo's main that isn't the App's merge commit raises system.alert.raised in the same transaction as its delivery row, and its SHA is never selectable. A signed pull_request closed-and-merged payload that doesn't parse raises an alert instead of being dropped. Other events and repos stay acknowledged and ignored
- t-b16-rigg-02: a database failure inside get-session (and any other served Better Auth endpoint) answers the contract's 500 with the request's requestId, value-free, like sign-in. Better Auth's own 4xx answers still come back as responses
- t-b14-rigg-01: the clients routes' 401 and 400 come from tagged errors through errors.ts's table, so the body and status come from one place (Writing Effect rule 3). The answers on the wire don't change
- t-b14-rigg-02: a write that dies with a defect after taking its Idempotency-Key releases it (or marks it failed) so a retry with the same key and body runs again instead of getting 409 IDEMPOTENCY_IN_PROGRESS for 24 hours. The key's normal replay and reuse rules don't change
- t-b14-rigg-03: route 9 refuses kind internal in code, with 422 and the contract's body, whether or not the seed's internal client exists

## 4. Tasks

### T-B19-01: make it true: startServer mounts POST /api/webhooks/github: a signed delivery reaches it and adds its factory_versions row; startServer without GITHUB_WEBHOOK_SECRET, or with an empty one, fails to start, naming the variable and never a value (t-b15-rigg-03)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm --filter @avel/server exec vitest run test/entry/start.test.ts`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B19-02: make it true: a webhook body over the limit is 413 with the contract's body and requestId, and nothing is written; a body sent without Content-Length is cut off at the limit (t-b15-rigg-01)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm --filter @avel/server exec vitest run test/entry/start.test.ts`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B19-03: make it true: a signed push to the factory repo's main that isn't the App's merge raises exactly one system.alert.raised and leaves its SHA unselectable; a merged pull_request payload that doesn't parse raises an alert (t-b15-rigg-02)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm --filter @avel/server exec vitest run test/entry/start.test.ts`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B19-04: make it true: a database failure inside GET /api/auth/get-session answers 500 with the contract's body and the request's requestId, and no log line or stderr holds the query's params or a token (t-b16-rigg-02)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm --filter @avel/server exec vitest run test/entry/start.test.ts`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B19-05: make it true: after a clients request, close() leaves no open database client from the server's pools in pg_stat_activity, and returns within 2 s (t-b16-rigg-03)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm --filter @avel/server exec vitest run test/entry/start.test.ts`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B19-06: make it true: a client write that dies with a defect after taking its key can be retried with the same key and body and runs (no 409 IDEMPOTENCY_IN_PROGRESS); a replay of a completed write still returns the first response (t-b14-rigg-02)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm --filter @avel/server exec vitest run test/entry/start.test.ts`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B19-07: make it true: route 9 with kind internal is 422 with the contract's body, on a database where the seed's internal client doesn't exist (t-b14-rigg-03)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm --filter @avel/server exec vitest run test/entry/start.test.ts`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B19-08: make it true: the clients routes' 401 without a session and 400 on a missing Idempotency-Key answer the same status and body as before, from errors.ts's table (t-b14-rigg-01; a test that maps each tag through the table)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm --filter @avel/server exec vitest run test/entry/start.test.ts`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## 5. Territory

**You may change** (and create):
- `packages/server/src/server.ts`
- `packages/server/src/main.ts`
- `packages/server/src/platform/router.ts`
- `packages/server/src/platform/app.ts`
- `packages/server/src/platform/errors.ts`
- `packages/server/src/platform/idempotency.ts`
- `packages/server/src/platform/auth/**`
- `packages/server/src/platform/webhooks/**`
- `packages/server/src/platform/factory-repo/**`
- `packages/server/src/knowledge/**`
- `packages/server/src/onboarding/**`
- `docs/agent-dispatch/backend/sprint-05/agent-soap-t-b19-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `packages/server/test/follow-ups/**`

**Never change, whatever the task says:**
- `packages/server/package.json`
- `pnpm-lock.yaml`
- `packages/server/src/platform/jobs/**`
- `packages/server/src/platform/db/**`
- `packages/server/src/platform/effect-handler.ts`
- `packages/server/src/platform/rate-limit.ts`
- `packages/server/src/audit/**`
- `packages/server/test/entry/start.test.ts`
- `packages/db/**`
- `packages/contract/**`
- `apps/web/*/**`
- `apps/web/.*`
- `apps/web/*.{ts,tsx,js,mjs,cjs,css,html,md,yaml,yml,toml}`
- `apps/web/{tsconfig,components,biome}.json`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

**Owned by other tickets in this sprint** (stay out; the other lane never shares a file with yours):

| Ticket | Kind | Paths |
| --- | --- | --- |
| T-B17 | builds | `packages/server/src/platform/jobs/**`, `packages/db/src/**`, `packages/db/drizzle/**`, `packages/db/test/helpers/changes.ts`, `docs/generated/erd.md`, `docs/design/DATABASE.md`, `docs/design/Jobs and workers.md`, `docs/design/CR-30 Effect in the server, durable jobs and spans.md`, `docs/quarantine.md` |
| T-B17 | tests | `packages/server/test/jobs/**`, `packages/server/test/platform-hardening/pool-timeouts.test.ts` |
| T-B18 | builds | `packages/server/src/platform/jobs/**` |
| T-B18 | tests | `packages/server/test/consumers/**` |
| T-B20 | builds | `docs/steps/step-1-done.md`, `packages/server/src/**` |
| T-B20 | tests | `packages/server/test/step-1/**` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-B19`).
6. Build the simplest thing that passes (B9, C3). No dead or speculative code, no new dependency, no database mocks (E5, E8, E10).
7. If a locked test looks wrong, stop with `test-dispute`. If a doc is wrong or missing something, stop with `needs-cr` (E3, F2).
8. When every task passes, run all of Part 7's commands, then write and commit your report.

## 7. Completion

**Verification** (run every one, in order, and paste the results into your report):

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm --filter @avel/server test
pnpm --filter @avel/server typecheck
pnpm --filter @avel/server check:effect
pnpm --filter @avel/server exec vitest run test/entry/start.test.ts
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

**Your report:** `docs/agent-dispatch/backend/sprint-05/agent-soap-t-b19-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B19
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Soap, the backend builder on the AVEL build team (`.claude/agents/soap.md`). Your lead is Axis. Your task is ticket T-B19, "Platform follow-ups: the P2s from T-B14, T-B15 and T-B16's reviews, with the webhook mounted in the running server": the build dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-05/agent-soap-t-b19-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/B19-platform-follow-ups`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-05/agent-soap-t-b19-build-completion.md`, committed to the branch. Don't push.
