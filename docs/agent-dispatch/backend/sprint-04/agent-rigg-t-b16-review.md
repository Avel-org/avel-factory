---
doc: agent-rigg-t-b16-review
ticket: T-B16
lane: backend
sprint: sprint-04
agent: rigg
seat: checker
kind: review
role: review
rigor: full
model: opus
branch: t/B16-sign-in-in-production
checkout: detached
after: [agent-soap-t-b16-build]
depends_on: [T-B14]
report: docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b16-review-completion.md
---


# T-B16 · review · Rigg: Sign-in in the real server: main.ts mounts Better Auth from Config, with its resources scoped and its failures value-free

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-04 · Step 1 |
| Ticket | T-B16 · rigor full |
| Dispatch | review · Rigg (checker) · model opus |
| Works on | a detached checkout of `t/B16-sign-in-in-production`'s head |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Rigg** (`.claude/agents/rigg.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You review the builder's work on this ticket, from the diff and this document only (G1). You change no code.

## 2. Context: read these first, in order

1. `.claude/agents/rigg.md`: who you are, and your always and never
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
16. `docs/agent-dispatch/backend/sprint-04/agent-soap-t-b16-build-completion.md`: the builder's completion report
17. `docs/review/security-checklist.md`: full rigor: work through it item by item
18. `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b16-review.md`: this document: follow it exactly

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

### T-B16-01: check: startServer with a seeded operator answers POST /api/auth/sign-in/email with a session cookie that is Secure for an https origin, and GET /api/auth/get-session then names the operator

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B16-02: check: startServer without AVEL_AUTH_SECRET, or with one shorter than 32 characters, fails to start, and its error names the variable and never contains the value given

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B16-03: check: the 6th sign-in in a minute from one socket address is 429, counted from the socket's address with any X-Forwarded-For ignored

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B16-04: check: a database failure inside sign-in (auth_sessions renamed in the test) answers 500 with the contract's body and the request's requestId, and neither stderr nor any log line contains the query's params or a session token (t-b9-rigg-03, t-b9-axis-06)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B16-05: check: a wrong password is still a 401 response and still counts toward the lockout: the 11th failure in 15 minutes is locked (a regression check on the error path change)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B16-06: check: close() leaves no open Better Auth database client: pg_stat_activity shows none from its pool afterwards (t-b9-rigg-02)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B16-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).
- Full rigor: every item of `docs/review/security-checklist.md`, marked checked, failed or not reached.

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b16-review-completion.md`
- `docs/agent-dispatch/backend/sprint-04/findings/t-b16-rigg-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `packages/server/src/platform/auth/**`
- `packages/server/src/main.ts`
- `packages/server/src/server.ts`

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

## 6. Execution protocol: review

1. You're on a detached checkout of the builder's result. Get the diff: `git diff $(git merge-base main HEAD)...HEAD`.
2. Read the builder's report, then the diff, then the locked tests. You don't see the builder's session (G1).
3. Run Part 7's commands yourself. A red command is a finding.
4. Write each finding to its own file under `findings/`: severity (P0 to P3, G3), evidence (a file and line, a failing command, or a rule ID), what you expected, and the check that would catch it.
5. List what you checked and what you couldn't reach. Leave everything uncommitted.

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

**Your report:** `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b16-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
verdict: pass | changes | block
ticket: T-B16
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Rigg, the backend checker on the AVEL build team (`.claude/agents/rigg.md`). Your lead is Axis. Your task is ticket T-B16, "Sign-in in the real server: main.ts mounts Better Auth from Config, with its resources scoped and its failures value-free": the review dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b16-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-04/agent-rigg-t-b16-review-completion.md`, left uncommitted. Don't push.
