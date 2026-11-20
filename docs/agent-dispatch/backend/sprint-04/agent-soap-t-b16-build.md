---
doc: agent-soap-t-b16-build
ticket: T-B16
lane: backend
sprint: sprint-04
agent: soap
seat: builder
kind: build
role: build
rigor: full
model: opus
branch: t/B16-sign-in-in-production
checkout: branch
after: [agent-rigg-t-b16-test-unit]
depends_on: [T-B14]
report: docs/agent-dispatch/backend/sprint-04/agent-soap-t-b16-build-completion.md
---


# T-B16 · build · Soap: Sign-in in the real server: main.ts mounts Better Auth from Config, with its resources scoped and its failures value-free

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-04 · Step 1 |
| Ticket | T-B16 · rigor full |
| Dispatch | build · Soap (builder) · model opus |
| Works on | `t/B16-sign-in-in-production` |
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
11. `packages/server/src/platform/auth/web-auth.ts`: T-B9's Better Auth: the three served endpoints, the sign-in guard, intoBetterAuth
12. `packages/server/src/main.ts`: the entry point: T-B14's router, and no auth yet
13. `packages/server/src/platform/db/db.ts`: how DbLive reads its timeouts from Config and scopes the pool; read only
14. `docs/design/Step 0 and Step 1 plan.md`: Step 1 item 5: the password comes from the host, never the repo
15. `packages/server/test/server/**`: the locked acceptance tests: they define done
16. `docs/agent-dispatch/backend/sprint-04/agent-soap-t-b16-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** The running server signs the operator in, and a database failure inside sign-in answers the contract's 500 without ever printing a token.

**Refs:**
- Step 0 and Step 1 plan, Step 1 item 5; T-B9's build report, Limitations (production doesn't mount auth yet)
- T-B9's findings routed here: t-b9-rigg-02 (Better Auth's pool and runtime are never released, and its timeouts are constants), t-b9-rigg-03 (a Better Auth database failure answers 500 with an empty body and no requestId), t-b9-axis-06 (that failure prints the query's params, the session token among them, to stderr)
- AGENTS.md, Writing Effect rules 5 and 6; Build rules E6

**Merged before this starts:** T-B14

**Notes from the lead:**
- src/server.ts: startServer(config) builds the app with T-B14's router and the auth options, serves it through @hono/node-server, and returns a handle whose close() stops the server and releases Better Auth's pool and runtime. main.ts reads the config and calls it. Tests start it on a free port; nothing listens on a fixed one
- Config: AVEL_AUTH_SECRET (Config.Redacted, at least 32 characters), AVEL_WEB_ORIGIN (the baseUrl), and Better Auth's pool timeouts with DbLive's defaults. Secure cookies are on unless AVEL_WEB_ORIGIN is plain http. A missing or short secret stops startup with a message that names the variable and never its value. List every new variable in the build report; .env.example is outside every agent's Territory, so Javaris adds them (and T-B9's AVEL_OPERATOR_EMAIL and AVEL_OPERATOR_PASSWORD)
- t-b9-rigg-02: Better Auth's pg pool and the ManagedRuntime get a lifetime (acquireRelease, or close() on the handle) and are released on shutdown and on a failed startup
- t-b9-rigg-03 and t-b9-axis-06: a non-API error inside one of Better Auth's endpoints must not be answered by better-call's own empty 500, and must not reach console.error. Let it reach intoBetterAuth (Better Auth's onAPIError with throw, or an onError that writes nothing and rethrows), so runEdge answers the contract's 500 with the requestId and logs only a value-free line. Better Auth's own 4xx answers (the 401 the lockout counts, the 404s) must still come back as responses
- The peer address reaches ClientIp from @hono/node-server's env.incoming (T-B9's app.ts already reads it); no X-Forwarded-For

## 4. Tasks

### T-B16-01: make it true: startServer with a seeded operator answers POST /api/auth/sign-in/email with a session cookie that is Secure for an https origin, and GET /api/auth/get-session then names the operator

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B16-02: make it true: startServer without AVEL_AUTH_SECRET, or with one shorter than 32 characters, fails to start, and its error names the variable and never contains the value given

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B16-03: make it true: the 6th sign-in in a minute from one socket address is 429, counted from the socket's address with any X-Forwarded-For ignored

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B16-04: make it true: a database failure inside sign-in (auth_sessions renamed in the test) answers 500 with the contract's body and the request's requestId, and neither stderr nor any log line contains the query's params or a session token (t-b9-rigg-03, t-b9-axis-06)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B16-05: make it true: a wrong password is still a 401 response and still counts toward the lockout: the 11th failure in 15 minutes is locked (a regression check on the error path change)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B16-06: make it true: close() leaves no open Better Auth database client: pg_stat_activity shows none from its pool afterwards (t-b9-rigg-02)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## 5. Territory

**You may change** (and create):
- `packages/server/src/platform/auth/**`
- `packages/server/src/main.ts`
- `packages/server/src/server.ts`
- `docs/agent-dispatch/backend/sprint-04/agent-soap-t-b16-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `packages/server/test/server/**`

**Never change, whatever the task says:**
- `packages/server/src/platform/app.ts`
- `packages/server/src/platform/effect-handler.ts`
- `packages/server/src/platform/db/**`
- `packages/server/src/platform/rate-limit.ts`
- `packages/server/package.json`
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
| T-B15 | builds | `packages/server/src/platform/webhooks/**`, `packages/server/src/platform/factory-repo/**`, `packages/server/src/knowledge/**`, `packages/server/src/platform/app.ts` |
| T-B15 | tests | `packages/server/test/factory-repo/**` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-B16`).
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

**Your report:** `docs/agent-dispatch/backend/sprint-04/agent-soap-t-b16-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B16
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Soap, the backend builder on the AVEL build team (`.claude/agents/soap.md`). Your lead is Axis. Your task is ticket T-B16, "Sign-in in the real server: main.ts mounts Better Auth from Config, with its resources scoped and its failures value-free": the build dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-04/agent-soap-t-b16-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/B16-sign-in-in-production`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-04/agent-soap-t-b16-build-completion.md`, committed to the branch. Don't push.
