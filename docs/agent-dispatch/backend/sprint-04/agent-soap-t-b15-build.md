---
doc: agent-soap-t-b15-build
ticket: T-B15
lane: backend
sprint: sprint-04
agent: soap
seat: builder
kind: build
role: build
rigor: full
model: opus
branch: t/B15-factory-repo-webhook
checkout: branch
after: [agent-rigg-t-b15-test-unit]
depends_on: [T-B9]
report: docs/agent-dispatch/backend/sprint-04/agent-soap-t-b15-build-completion.md
---


# T-B15 · build · Soap: The factory repo loader and the GitHub webhook: factory.yaml by commit, merges as factory versions, alerts on a merge the App didn't make

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-04 · Step 1 |
| Ticket | T-B15 · rigor full |
| Dispatch | build · Soap (builder) · model opus |
| Works on | `t/B15-factory-repo-webhook` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Soap** (`.claude/agents/soap.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/soap.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/backend/sprint-04/codebase-analysis.md`: the codebase in short
5. `docs/design/Step 0 and Step 1 plan.md`: Step 1 items 1 (the webhook), 8 (activity log), 9 (jobs), 10 (events), 11 (the factory repo); the rate limits (webhook); tests 2, 4, 10, 11, 12, 13
6. `docs/design/CR-43 Step 1 without the CLI.md`: accepted Nov 18: tests 2, 4 and 13 on the clients routes; step-up and CLI login leave Step 1
7. `docs/design/CR-30 Effect in the server, durable jobs and spans.md`: section 3 (hand-built or DBOS) and section 6 (spike 2's eight checks, its pass and fail rules)
8. `docs/design/Jobs and workers.md`: the jobs design the tests hold either engine to: claims, the reaper, retries, one live job per key, consumers
9. `docs/design/Backend modules and build plan.md`: section 4: onboarding owns clients, audit owns activity_log, knowledge owns factory_versions, platform owns jobs and webhook_deliveries; the loader is a platform utility with no table
10. `docs/design/Build rules.md`: C4 (full rigor), E5 (dependencies), E8 (nothing built for later), E10 (real Postgres), E12 (table owners), E13 (four tests per route), F2, H6
11. `docs/design/Design v0.6 Main.md`: Factory as code: what factory.yaml holds, merges only by the factory's GitHub App, the webhook checks who merged, a merge by anyone else raises an alert and freezes finalize, every merged commit listed in factory_versions
12. `packages/db/src/schema/knowledge.ts`: factory_versions: sha, merged_at, approved_by, merged_by_app, summary, pr_number
13. `packages/db/src/schema/platform.ts`: webhook_deliveries: one row per X-GitHub-Delivery
14. `packages/contract/src/events.ts`: system.alert.raised, written by platform
15. `packages/server/src/platform/app.ts`: where POST /api/webhooks/github mounts, outside the contract, keeping X-Request-Id and X-Contract-Version
16. `packages/server/src/platform/rate-limit.ts`: T-B8's limiter: the webhook name, 60 a minute; read only
17. `packages/server/test/factory-repo/**`: the locked acceptance tests: they define done
18. `docs/agent-dispatch/backend/sprint-04/agent-soap-t-b15-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** A factory-repo PR merged by the factory's GitHub App shows up as a selectable factory version, a merge by anyone else raises an alert and can't be pinned, and the service reads factory.yaml at any merged commit the App made.

**Refs:**
- Step 0 and Step 1 plan, Step 1 items 1 (the webhook) and 11 (the factory repo), test 12; the rate limits section (webhook, 60 a minute)
- Design v0.6 Main, Factory as code
- AGENTS.md, Architecture rules (the webhook: raw-body signature, deduplicated on X-GitHub-Delivery)
- Build rules E8 (factory.yaml is parsed by the first step that reads a section of it)

**Merged before this starts:** T-B9

**Notes from the lead:**
- The webhook (item 1): POST /api/webhooks/github, outside the contract, in app.ts. It checks X-Hub-Signature-256 over the raw body with a constant-time compare against GITHUB_WEBHOOK_SECRET from Config (Redacted; never logged). A bad or missing signature is 401 and writes nothing. It's rate-limited at 60 a minute through T-B8's webhook limit, and deduplicated on X-GitHub-Delivery through webhook_deliveries, in the same transaction as what the delivery does
- A merged pull request on the factory repo's main (the repo and the factory App's identity from Config) adds one factory_versions row, with merged_by_app true only when the App made the merge. A merge by anyone else is stored with merged_by_app false and raises system.alert.raised in the same transaction. Other events and other repos are acknowledged and ignored. approved_by is the operator's user id (one operator)
- The loader (item 11), a platform utility with no table, in platform/factory-repo/: reads factory.yaml at a given SHA from a local mirror of the factory repo (its path from Config), fetching the mirror with a timeout when the SHA is missing (Writing Effect rule 5). It answers only for a SHA that has a factory_versions row with merged_by_app true; any other SHA is refused. Git runs as a child process with a timeout; no git library
- factory.yaml isn't parsed here: the loader returns the file's text at a merged SHA. Its shape isn't written down yet, and each section is parsed by the step that first reads it (Step 6 packages, Step 8 budgets; B9, E8). No new dependency. If something in Step 1 needs a section read, stop with needs-cr
- Tests use a local bare repo and recorded webhook payloads, signed in the test with a throwaway secret. No test calls GitHub (Step 1 plan, risks; E10)

## 4. Tasks

### T-B15-01: make it true: a delivery with a bad or missing X-Hub-Signature-256 is 401 and writes nothing

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B15-02: make it true: a signed merge of a factory-repo PR by the factory App adds one factory_versions row with merged_by_app true, and the loader reads factory.yaml at that SHA (test 12)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B15-03: make it true: a merge by anyone else adds a row with merged_by_app false and one system.alert.raised event in the same transaction, and the loader refuses that SHA (test 12)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B15-04: make it true: a commit on an unmerged branch has no effect: no factory_versions row, and the loader refuses its SHA (test 12)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B15-05: make it true: a replayed X-GitHub-Delivery is acknowledged and ignored: no second row and no second event (test 12)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B15-06: make it true: the 61st delivery in a minute is 429 with the contract's body and a requestId

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B15-07: make it true: a merged SHA with no factory.yaml at the repo root is refused with a typed error naming the SHA

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B15-08: make it true: a mirror missing the SHA is fetched once, and a fetch that hangs ends within its timeout (TestClock) as a typed error

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## 5. Territory

**You may change** (and create):
- `packages/server/src/platform/webhooks/**`
- `packages/server/src/platform/factory-repo/**`
- `packages/server/src/knowledge/**`
- `packages/server/src/platform/app.ts`
- `docs/agent-dispatch/backend/sprint-04/agent-soap-t-b15-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `packages/server/test/factory-repo/**`

**Never change, whatever the task says:**
- `packages/server/package.json`
- `pnpm-lock.yaml`
- `packages/server/src/platform/effect-handler.ts`
- `packages/server/src/platform/db/**`
- `packages/server/src/platform/rate-limit.ts`
- `packages/server/src/platform/auth/**`
- `packages/server/src/main.ts`
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
| T-B13 | builds | `packages/server/src/platform/jobs/**`, `packages/server/package.json`, `pnpm-lock.yaml`, `docs/quarantine.md` |
| T-B13 | tests | `packages/server/test/jobs/**`, `packages/server/test/platform-hardening/pool-timeouts.test.ts` |
| T-B14 | builds | `packages/server/src/onboarding/**`, `packages/server/src/audit/**`, `packages/server/src/platform/router.ts`, `packages/server/src/main.ts` |
| T-B14 | tests | `packages/server/test/clients/**` |
| T-B16 | builds | `packages/server/src/platform/auth/**`, `packages/server/src/main.ts`, `packages/server/src/server.ts` |
| T-B16 | tests | `packages/server/test/server/**` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-B15`).
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
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

**Your report:** `docs/agent-dispatch/backend/sprint-04/agent-soap-t-b15-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B15
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Soap, the backend builder on the AVEL build team (`.claude/agents/soap.md`). Your lead is Axis. Your task is ticket T-B15, "The factory repo loader and the GitHub webhook: factory.yaml by commit, merges as factory versions, alerts on a merge the App didn't make": the build dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-04/agent-soap-t-b15-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/B15-factory-repo-webhook`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-04/agent-soap-t-b15-build-completion.md`, committed to the branch. Don't push.
