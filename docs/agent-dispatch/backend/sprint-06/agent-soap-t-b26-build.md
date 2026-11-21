---
doc: agent-soap-t-b26-build
ticket: T-B26
lane: backend
sprint: sprint-06
agent: soap
seat: builder
kind: build
role: build
rigor: full
model: opus
branch: t/B26-live-streams
checkout: branch
after: [agent-rigg-t-b26-test-unit]
depends_on: [T-B25]
report: docs/agent-dispatch/backend/sprint-06/agent-soap-t-b26-build-completion.md
---


# T-B26 · build · Soap: The live streams: the event stream (63) and the trace stream (64) that resume from Last-Event-ID, and an attempt's steps (109)

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-06 · Step 2 |
| Ticket | T-B26 · rigor full |
| Dispatch | build · Soap (builder) · model opus |
| Works on | `t/B26-live-streams` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Soap** (`.claude/agents/soap.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/soap.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/backend/sprint-06/codebase-analysis.md`: the codebase in short
5. `docs/design/Backend modules and build plan.md`: section 1 (the build order and the critical path) and section 4 (compute, metering, events and factory: what each owns)
6. `docs/design/Design v0.6 Main.md`: Build order steps 2, 5, 7 and 8; Cost control (budgets, reserve before spending); API routes (four callers, the proxies are services on the host)
7. `docs/design/Sandbox - Docker now, boat or MIOSA next.md`: the trust boundaries: no model key in a room, one token per dispatch revoked on every exit, git over HTTP pushing only its own branch
8. `docs/design/DATABASE.md`: credentials, budget_reservations, price_table, attempts, missions, proposals, events and agent_traces; Ownership
9. `docs/design/API routes.md`: routes 19 to 21, 52, 53, 63, 64, 104 and 109, and the rules on every write
10. `docs/design/Build rules.md`: B7, B8, C4, E3, E5, E7, E8, E9, E10, E12, E13, F4, G5, G7, H6, I3
11. `packages/contract/src/routes/events.ts`: routes 63 and 64: their inputs and eventIterator outputs
12. `packages/contract/src/dto/events-and-traces.ts`: EventDto (a union over every kind with its payload schema), EventStreamInput, AgentTraceDto and TraceStreamInput
13. `packages/contract/src/dto/dispatches.ts`: AgentStepDto: view=steps and route 109
14. `packages/server/src/platform/db/events.ts`: how events are written and their seq taken at commit; read only
15. `packages/db/src/schema/events.ts`: events (seq, mission_id, kind, payload, at) and agent_traces (trace_seq, attempt_id, session_id, kind, body), partitioned by week
16. `docs/design/Jobs and workers.md`: consumers read events in seq order; the stream is a reader in the same order
17. `packages/server/test/streams/**`: the locked acceptance tests: they define done
18. `docs/agent-dispatch/backend/sprint-06/agent-soap-t-b26-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** The control room's live feed shows each committed event as it happens, for all missions or one, and a reconnect picks up exactly where it left off with no event missing or repeated; an attempt's and a Canon session's traces stream and page the same way.

**Refs:**
- Design v0.6 Main, Build order step 5: a run streams live, and a reconnect resumes with no missing sequence numbers
- API routes.md: route 63 (GET /api/events/stream, ?missionId=, Last-Event-ID is the seq, replaying up to 30 days), route 64 (GET /api/traces/stream, ?attemptId= or ?sessionId=, view=steps, Last-Event-ID is the trace ID) and route 109 (GET /api/attempts/{attemptId}/steps?after=)
- Design v0.6 Main, API routes: streams use oRPC's event iterator over server-sent events; no Redis, the event stream runs inside the service
- Step 1 test 11: seq order equals commit order, with no gap a reader can miss

**Merged before this starts:** T-B25

**Notes from the lead:**
- The events module owns events and agent_traces; the streams live in packages/server/src/events/. They only read
- Route 63: oRPC's event iterator. It replays committed events after Last-Event-ID (the seq; none means the stream starts at now, as the contract says), then follows new ones, each with its seq as the SSE id, in seq order, filtered by ?missionId= when given. Replay reaches back at most 30 days (Clock). Each event goes out as EventDto, validated against the contract; one whose stored payload doesn't parse is logged once with no values and skipped, never sent malformed
- Following new events: read after the last sent seq on a Schedule (TestClock in tests), through the router's Db, so no new service joins startServer and no connection is held between reads. Seq is taken last before commit under the advisory lock, so reading after the last seq misses nothing (test 11). Keep-alive comments on the SSE stream follow oRPC's own option
- Closing the stream (the client goes away) ends its reads at once; a stream holds no pool client while it waits (Writing Effect rule 6)
- Route 64 streams an attempt's or a session's traces after Last-Event-ID (the trace ID), as AgentTraceDto, or as AgentStepDto with view=steps. Route 109 pages an attempt's steps oldest first after ?after=. Both share the step mapper
- The stream carries no money beyond AI cost against its cap, and agent, client and Canon text as plain text (AGENTS.md)
- Without a session, each route is 401 with the contract's body and requestId; route 64 with neither or both of attemptId and sessionId, and route 109 for an unknown attempt, answer the contract's error

## 4. Tasks

### T-B26-01: make it true: route 63 opened with no Last-Event-ID sends each event committed after it opened, once, in seq order, each valid against EventDto and carrying its seq as its id

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B26-02: make it true: route 63 reconnected with Last-Event-ID n sends every committed event after n and none at or before it, while 20 writer transactions commit, some rolled back: no committed seq is missing or repeated across the two connections (Step 5's done-when, test 11)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B26-03: make it true: route 63 with ?missionId= sends only that mission's events; a replay doesn't reach past 30 days (TestClock)

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B26-04: make it true: an event whose stored payload doesn't parse is skipped and logged once with no values, and the events after it still arrive

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B26-05: make it true: closing route 63's connection ends its reads: no pool client stays checked out for it in pg_stat_activity

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B26-06: make it true: route 64 streams an attempt's traces after Last-Event-ID as AgentTraceDto, and as AgentStepDto with view=steps; a session's traces stream the same way; neither or both ids is the contract's error

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B26-07: make it true: route 109 pages an attempt's steps oldest first after ?after=, valid against the contract; an unknown attempt answers the contract's error with requestId

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

### T-B26-08: make it true: routes 63, 64 and 109 without a session are 401 with the contract's body and requestId

- **Verify:** its locked test passes: `pnpm --filter @avel/server test`, `pnpm --filter @avel/server typecheck`, `pnpm --filter @avel/server check:effect`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## 5. Territory

**You may change** (and create):
- `packages/server/src/events/**`
- `packages/server/src/platform/router.ts`
- `packages/server/src/platform/errors.ts`
- `docs/agent-dispatch/backend/sprint-06/agent-soap-t-b26-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `packages/server/test/streams/**`

**Never change, whatever the task says:**
- `packages/server/package.json`
- `pnpm-lock.yaml`
- `packages/server/src/platform/db/**`
- `packages/server/src/platform/jobs/**`
- `packages/server/src/server.ts`
- `packages/server/src/platform/app.ts`
- `packages/server/src/factory/**`
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
| T-B21 | builds | `packages/server/src/compute/credentials/**`, `packages/server/src/server.ts` |
| T-B21 | tests | `packages/server/test/credentials/**` |
| T-B22 | builds | `packages/server/src/metering/**`, `docs/design/DATABASE.md`, `packages/db/src/owners.ts` |
| T-B22 | tests | `packages/server/test/metering/**` |
| T-B24 | builds | `packages/server/src/factory/decisions/**`, `packages/server/src/platform/status/**`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` |
| T-B24 | tests | `packages/server/test/decisions/**`, `packages/server/test/status/**` |
| T-B25 | builds | `packages/server/src/factory/missions/**`, `packages/contract/src/routes/missions.ts`, `packages/contract/src/version.ts`, `packages/contract/package.json`, `docs/generated/openapi.json`, `packages/server/src/platform/router.ts`, `packages/server/src/platform/errors.ts` |
| T-B25 | tests | `packages/server/test/missions/**`, `packages/contract/test/cr-w32.test.ts` |
| T-B27 | builds | `packages/server/src/platform/jobs/**`, `docs/steps/step-1-done.md` |
| T-B27 | tests | `packages/server/test/jobs-follow-ups/**`, `packages/server/test/platform-hardening/pool-timeouts.test.ts`, `packages/server/test/follow-ups/05-close-releases-pools.test.ts`, `packages/server/test/jobs/retries.test.ts`, `packages/server/test/step-1/done-when.test.ts` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-B26`).
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

**Your report:** `docs/agent-dispatch/backend/sprint-06/agent-soap-t-b26-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope | stuck
ticket: T-B26
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Soap, the backend builder on the AVEL build team (`.claude/agents/soap.md`). Your lead is Axis. Your task is ticket T-B26, "The live streams: the event stream (63) and the trace stream (64) that resume from Last-Event-ID, and an attempt's steps (109)": the build dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-06/agent-soap-t-b26-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/B26-live-streams`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency, out-of-scope or stuck. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-06/agent-soap-t-b26-build-completion.md`, committed to the branch. Once it says done, push the branch (`git push -u origin t/B26-live-streams`) and open its PR with `gh pr create`, the report as its description. Push nothing else, and never merge.
