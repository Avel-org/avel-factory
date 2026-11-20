# CR-30: Effect in the server, durable jobs and spans (accepted in part, Nov 13)

Nov 13, 2026 · @javaris · touches the stack in Design v0.6 Main, the Step 1 plan, Jobs and workers and the Port inventory

**Status, Nov 13, 2026:** decisions 1 and 2 accepted (Effect 4 for the server, gated by spike 1; the DBOS test before the jobs engine). Decision 3 declined: spans stay "later", as the design says, so section 4 is kept for when they're turned on. Decisions 4 and 5 are open. **Nov 14:** spike 2 and the Step 1 jobs test gain check 8, the crash between a side effect and its save. **Nov 16 (Javaris, I4):** spike 1 is folded into the first build cycle instead of a throwaway branch. Checks 1, 3 and 4 run in ticket T-B1 (backend sprint-01, the server shell) and land on `main` with it. Checks 2 and 5 need the `Db` service and run in next cycle's `Db` ticket. Each ticket's completion report gives pass or fail for every spike check it covers, with its evidence, and Javaris decides on Effect from those (decision 1). A failed check still stops the work with `needs-cr`. Nothing here changes the contract, the web or the CLI.

**Nov 17 (Javaris, I4): Effect is adopted for the server (decision 1).** Spike 1's checks 1, 3 and 4 passed in T-B1 (backend sprint-01, PR #9, `6d77608`) on Effect 4.1.1, oRPC 1.16.2 and Hono 4.13.16, with no beta package, fork or patch. His decision: "okay". Checks 2 (`withTransaction` and `commitWithEvents`) and 5 (the reaper under `TestClock`) are still due, in the next cycle's `Db` work. A failed check there still stops that ticket with `needs-cr` and comes back to him. **Same day:** check 5 moves out of the `Db` work, into the jobs and events tests written right before spike 2, so the reaper is proved once over whichever engine wins (E9; C4 counts the reaper as part of the jobs engine). Check 2 stays in the `Db` service ticket (backend sprint-02, T-B4).

## In short

- **What:** write `packages/server` in **Effect 4** from Step 1 on, while Hono, oRPC 1.16.2, the contract, Zod, Drizzle and node-postgres stay. Run one **spike** to test whether **DBOS** should replace the hand-built jobs engine, before Step 1 builds it. Spans (OpenTelemetry through Effect's tracer) were proposed for Step 1 and declined: they stay "later".
- **Why:** the factory's risk sits in the server's middle layer: transactions with their events, claims and the reaper, retries, cost reservations that must never leak, rooms that must always be torn down, streams that must stop when the reader leaves. Effect makes those rules part of the types, so a wrong program fails to compile instead of failing in a mission.
- **What stays exactly the same:** every rule in the design. The database is still the guard. The `decide` functions stay pure. A state change, its event and its follow-up job still commit together. `seq` still comes from the advisory lock taken last. The receipt and the meter of record are untouched.
- **What doesn't change:** routes, DTOs, events, error codes, tables (unless the DBOS spike passes and you accept it), the web and the CLI.

## 1. Why Effect, and why now

The server isn't written yet: `packages/server` doesn't exist. Changing how it's written costs nothing today and a rewrite after Step 1.

**What Effect is now:** Effect 4 is stable. Its release post is dated Sep 30, 2026, it promises long-term support, and 4.1 followed on Oct 20. Its core has no dependencies.

**What it gives AVEL, mapped to the design's own rules:**

| Design rule | Without Effect | With Effect |
| --- | --- | --- |
| A state change, its event and its job commit together | A convention every handler must follow | The event writer needs a `Tx` service, so calling it outside a transaction doesn't compile |
| Every error uses the contract's body | A mapper at the edge, plus discipline | Each module fails with tagged errors in its type; one table maps every tag to a contract code, and the compiler flags an unmapped tag |
| Cost is reserved before a model call and never leaks | try/finally in each caller | The reservation is a resource (`acquireRelease`): settled on success, released on failure or interruption |
| A room is torn down whatever happens | Cleanup code in each path | The room is a scoped resource; any exit, including a crash in the agent loop or a cancelled attempt, runs its finalizer |
| Claims last 30 s, check-ins every 10 s, the reaper every 10 s, backoff 10 s, 30 s, 2 min, 10 min, dead after 5 | Timers and counters | `Schedule`s with exactly those numbers, tested with a fake clock in milliseconds, not 40-second waits |
| A stream stops when the reader leaves | Manual abort wiring | Streams are interrupted with their consumer, and their finalizers run |
| No secrets in logs | Discipline | Config values marked `Redacted` print as `<redacted>` |

## 2. How Effect sits in the stack

**What the server uses from Effect, and what it doesn't:**

| Used | For |
| --- | --- |
| `Effect` and `Effect.gen` | Every program in `apply`, in handlers and in workers |
| Tagged errors, `Exit` and `Cause` | Typed failures, mapped once to contract codes; defects kept apart from failures |
| Services, `Layer`, `ManagedRuntime` | `Db`, `Clock`, `Ids`, `Logger`, `Config`, `ModelProxy`, `RoomHost`, `Git`, `GitHub`, later `Kms`; fakes swapped in for tests |
| `Scope` and `acquireRelease` | Pool clients, cost reservations, rooms, streams |
| `Clock`, `Schedule`, `Duration` | Claims, check-ins, the reaper, backoff, timeouts |
| Fibers and interruption | Workers, cancelled requests, shutdown |
| `Semaphore` | In-process limits only, never in place of a database rule |
| `Stream` | The event stream, the trace stream and Canon's stream (route 34) |
| `Config` with `Redacted` | Settings; secrets never print |
| `Logger` | Our own JSON logger, plugged in as Effect's logger |
| `Random` | Randomness tests can control |
| `Effect.withSpan` | Naming units of work now; `@effect/opentelemetry` exports them once spans are turned on (section 4, later) |
| `@effect/vitest`, `TestClock`, `@effect/language-service` | Tests and editor checks (development only) |

Note, Nov 17: on TypeScript 7 the language service is `@effect/tsgo`, not `@effect/language-service`, and it runs in CI as well as the editor (CR-39, accepted).

| Not used | What stays instead |
| --- | --- |
| Effect Schema | Zod 4, from the contract |
| `effect/sql`, `@effect/sql-pg`, Drizzle's Effect driver | Drizzle 0.45 and node-postgres, behind our `Db` service |
| Effect's HTTP server and `HttpApi`, `@effect/rpc` | Hono and oRPC 1.16.2 |
| `@orpc/effect` | Our `effectHandler` adapter, until oRPC 2 is stable |
| Effect workflows and cluster | The jobs engine (section 3) |
| Effect's AI packages | The host model proxy, the meter of record |

**The edge stays oRPC 1.16.2.** oRPC's Effect bridge, now called `@orpc/effect` (it was `@orpc/experimental-effect`), runs only on oRPC 2.0, which is still in beta. Moving the contract to a beta would reopen a frozen contract. Instead, the server has one small adapter of its own. When oRPC 2 is stable, swapping the adapter for `@orpc/effect` is a separate, later change request.

**The adapter, `effectHandler` (with `effectStream` for streams):** one file in `packages/server`. A procedure is written as `implement(contract).clients.create.handler(effectHandler(({ input }) => program))`. For each call it:
1. **Provides the request's services:** its request ID, the caller (a web session, a CLI session or, later, a dispatch token) and the idempotency key, so a program reads them with `yield*` and never from globals.
2. **Runs the program on the shared runtime, tied to the request:** when the client disconnects or the request times out, the program is interrupted and its finalizers run. An open transaction rolls back, a cost reservation is released and a stream stops.
3. **Names the call as a span** with the route and the IDs; nothing is exported until spans are turned on (section 4).
4. **Turns the result into oRPC's:**
   - success → the output, which oRPC still validates against the contract's DTO schema;
   - a tagged failure → the `ORPCError` with its code, status and details from `errors.ts`, through one mapping table;
   - a defect → 500 with the request ID; the cause is logged and never sent.
5. **Checks error types at compile time:** a program whose failures include a tag the procedure doesn't declare, or a tag with no row in the mapping table, doesn't compile.
6. **`effectStream`** turns an Effect `Stream` into the async iterator oRPC's event iterator expects, keeping `Last-Event-ID` resumes and stopping the stream when the reader leaves.

What it doesn't do: request IDs, rate limits, auth and idempotency stay middleware, in Step 1's order. The only other place a program runs is a worker's entry point.

**The contract stays Zod.** No Effect Schema in `packages/contract`. Inside the server, Zod stays the only schema library, so there aren't two ways to validate.

**The database stays Drizzle 0.45 and node-postgres.** Two Effect paths exist, and neither is ready for us:
- `effect/sql` (with `@effect/sql-pg`) is still marked unstable in Effect 4.
- Drizzle's Effect driver runs only on the Drizzle 1.0 release candidate.

So the server writes one `Db` service of its own:
- `Db.withTransaction(program)` takes a pool client as a scoped resource, runs `BEGIN`, provides the Drizzle transaction as the `Tx` service, and commits or rolls back.
- `Events.append` needs `Tx`. It only queues the event in the transaction.
- `Db.commitWithEvents` is the one way to commit when events are queued. It takes the advisory lock, assigns `seq` as the last statement, then commits. No handler takes the lock itself.
- Database errors are mapped once, as Step 1 already says: unique → 409, CHECK → 422, foreign key → 409 or 422, stale `rowVersion` → 409. They become tagged errors, never strings.

**Hono stays the outer server.** Better Auth (`/api/auth/*`), the GitHub webhook and the git endpoint stay plain Hono routes. Request ID, the logger, `X-Contract-Version`, rate limits, auth and idempotency stay in Step 1's order. Each request's ID and caller are provided to its Effect program as services.

**One runtime per process.** The server builds its layers once at boot: `Db`, `Clock`, `Ids`, `Logger`, `Config`, `ModelProxy`, `RoomHost`, `Git`, `GitHub`, and `Kms` from Step 4. Workers and request handlers share it. Shutdown interrupts every worker fiber and runs every finalizer.

**Our own logger stays ours.** It becomes the Effect logger: the same JSON lines, with the request ID on every line (and the span ID, once spans are on). Still no logging library.

**Where Effect is not used:**
- The `decide` half of every job handler stays a pure TypeScript function, tested with fixture tables, as Jobs and workers says. Only the `apply` half is an Effect.
- `packages/contract`, `packages/contract-mock`, `packages/db`, the web and the CLI are untouched.
- Client projects: Effect is for AVEL's own server only, never pushed onto a client's stack.

## 3. Durable jobs: hand-built in Effect, or DBOS

Step 1 item 9 builds the jobs engine: claims, `claim_no`, the reaper, retries, one live job per key. There are three ways to get it.

**A. Hand-built, written in Effect (the default).** Exactly the design in Jobs and workers: the same table, the same rules, the same numbers, with workers as fibers and the timings as `Schedule`s. Nothing changes in DATABASE.md but CR-44's partition key.

**B. DBOS Transact (spike first).** DBOS is an open-source (MIT) library for durable workflows that runs inside our process. It keeps its state in Postgres and needs no extra server. Several of its features match ours one for one:

| Our rule | DBOS feature |
| --- | --- |
| One live job per key (`jobs_one_live_key_uq`) | A deduplication ID on enqueue: one queued or running workflow per ID, freed when it finishes |
| The integrator handles one commit at a time per mission | A partitioned queue with `partitionConcurrency: 1`, keyed by mission |
| State change, event and job in one transaction | `enqueueInTransaction`: the enqueue is written in a transaction we own, so it commits or rolls back with our writes |
| Exactly-once database work | Datasource transactions: the step's checkpoint commits in the same transaction as our writes |

DBOS would replace the `jobs` table, `claim_no`, the reaper and the retry code with tables and code we don't maintain. It could only do that if it keeps every guarantee the design makes. The spike checks that (section 6). Its open questions:
- `enqueueInTransaction` needs a node-postgres client connected to DBOS's system database. Our database must also be that database, under its own schema, and the advisory-lock `seq` must still be the last statement.
- DBOS's docs promise that a step runs at least once, and that a finished step never runs again. They don't say what happens when a stalled process wakes up after its work was recovered elsewhere. Our `claim_no` fencing refuses that save today, and DBOS must do the same.
- In-flight work has to survive a deploy. DBOS ties recovery to the application version.
- The workflow body must be deterministic. That fits "decide, then apply", but it's a new rule for agents to learn.

**C. Effect's own workflows (rejected for now).** Effect has durable workflows (`effect/unstable/workflow` with its cluster engine on Postgres). They're still marked unstable, and open issues from the last few weeks report durability bugs. In one, a dropped Postgres connection while saving an activity becomes the workflow's stored final result. AVEL's receipts depend on its jobs, so this waits until Effect marks the module stable.

**Recommendation:** build A unless the spike shows B passing every Step 1 jobs and events test with less code to own. AVEL's jobs are short (render, a gate run, one integration commit). The long-running state lives in the mission's own tables and state machines, so DBOS's biggest strength, long workflows, matters less here than it would elsewhere.

## 4. Spans (OpenTelemetry): later

**Declined for Step 1 on Nov 13.** Spans stay "later", as the design says. What follows is how they'll work when they're turned on; the code still names its units of work with `Effect.withSpan`, which costs nothing while no exporter is installed.

The design already lists "Tracing: OpenTelemetry, later". When they're turned on, Effect gives spans almost for free: `Effect.withSpan` on each unit of work, exported through `@effect/opentelemetry`.

- **What gets a span:** each HTTP request, each job run (key and claim number), each attempt, each model-proxy call, each gate run, each integration commit, each room's life.
- **Attributes:** IDs only: `missionId`, `moduleRef`, `dispatchId`, `attemptId`, `jobKey`, `claimNo`, `requestId`. Never prompts, agent, client or Canon text, tokens, secrets or cost. Cost stays in `usage_log`, the meter of record.
- **The words:** the design's "trace log" (`traces`, agent messages and tool calls) is a different thing and keeps its name. These are **spans**.
- **Request IDs:** `X-Request-Id` and `requestId` stay what they are. Each log line also carries the span ID.
- **When spans are recorded:** whenever the factory server runs.
  - *Development* (building the factory on your machine): to a local viewer, such as Jaeger in Docker.
  - *Production* (the factory running real missions): every mission's requests, jobs, attempts, model-proxy calls, gates, integration commits and rooms, sent to the destination you pick (decision 4). Until you pick one, production spans are off.
  - *Tests:* off.
- **What spans don't cover:** what an agent does inside its room. Its messages and tool calls are the trace log, recorded during every mission as the design already says. The client's own software is never traced.
- **Versions:** pin `@effect/opentelemetry` and the OpenTelemetry SDK together; the Effect package caps the SDK version it accepts.

## 5. Rules for writing Effect in AVEL (goes into AGENTS.md)

Agents write Effect less reliably than plain async code, so the server gets a short, strict style:

1. `Effect.gen` with `yield*` everywhere. No long pipe chains.
2. Run a program in two places only: the `effectHandler` adapter and the worker entry points. A lint rule refuses `runPromise` and `runSync` anywhere else.
3. Every failure a caller can handle is a tagged error. Every tag is mapped to a contract code in one table, checked at compile time. Anything else is a defect: a 500 with the request ID, logged, never shown with its stack.
4. Time comes from `Clock`, IDs from `Ids` (UUIDv7) and randomness from `Random`, so tests control all three.
5. External calls (the model proxy, GitHub, the room host, git) each have a timeout.
6. Every resource with a lifetime (a room, a cost reservation, a pool client, a stream) is acquired with `acquireRelease` inside a scope.
7. In-process limits (`Semaphore`) never replace a database rule. The database stays the guard; Effect only keeps one process from overloading itself.
8. Tests use `@effect/vitest` with `TestClock`, against real Postgres, with fakes for rooms, GitHub and the model proxy provided as layers.
9. The editor and CI run Effect's language service, which catches the common mistakes.
10. The backend builder role gets an Effect 4 skill through `factory.yaml` (community skills for Effect v4 already exist, and the one we use is reviewed first). That's a factory-repo PR you approve, like any skill.

## 6. The spikes

**When to run them.** Spike 1 runs first, before any Step 1 code. Spike 2 (DBOS) runs **during Step 1, right before the jobs engine** (item 9). By then items 1 to 4 and the `Db` service exist. That gives the best test:
- Step 1's jobs and events tests (10 and 11) are written first, against a small `Jobs` interface (enqueue inside a transaction, claim and run, check in, finish, fail).
- Spike 2 runs those same tests over DBOS, on the real `Db` service and the real Postgres harness, instead of throwaway tests.
- Whichever engine wins is built under those tests, and the tests stay. Nothing is written twice.
- Running it any earlier would mean testing DBOS without our transaction rules. Running it after the jobs engine would mean building the engine twice.

**Spike 1: Effect at the edge.** On a throwaway branch, no commits to main.
1. One oRPC 1.16.2 route through `effectHandler`: a tagged error comes back as the contract's body with the request ID, and the compile fails when a tag has no mapping.
2. `Db.withTransaction` and `commitWithEvents`: a rolled-back program leaves no event; calling `Events.append` outside a transaction doesn't compile.
3. A cancelled request interrupts its program and runs its finalizers (a fake reservation is released).
4. The logger prints the same JSON lines as the ported logger, with the request ID.
5. One test runs the reaper with `TestClock`: an expired claim is back in the queue at 40 simulated seconds.

*Pass:* all five work on Effect 4.1, oRPC 1.16.2 and Drizzle 0.45 without patches. *Fail:* any of them needs a beta package or a fork. Then Effect is limited to inside modules, or dropped, and you decide.

**Spike 2: DBOS against the jobs design.** On a branch off the Step 1 work. Only the DBOS side is thrown away if it loses.
1. Step 1's jobs and events tests (10 and 11), rewritten over DBOS, all pass: a killed worker's job is picked up within a minute and does its work once; two workers never run the same job; a failing job ends dead after 5 tries; `seq` order equals commit order under concurrent transactions; a rollback leaves no event and no job; two copies of one consumer never both act on an event.
2. **The stalled-process case:** pause a process mid-step (SIGSTOP), let DBOS recover the work elsewhere, resume the first process. Its late save must be refused, as `claim_no` refuses it today.
3. One live job per key, through the deduplication ID: a second enqueue while the first runs is refused or returns the first; after it finishes, a new one starts.
4. The integrator queue partitioned by mission never runs two commits for one mission at once.
5. A deploy with work in flight: the new version finishes or safely resumes it.
6. The backoff can be exactly 10 s, 30 s, 2 min, 10 min, then dead.
7. DBOS's tables live in their own schema, are kept out of the Drizzle migrations, and never hold a business record a receipt depends on.
8. **A crash between the side effect and its save (added Nov 14):** kill the worker right after its side effect (for example, a push to the attempt branch) and before it saves the result. The retry must find the effect already done, record it, and not repeat it. This runs against the hand-built engine too, so it's part of Step 1's test 10 either way.

*Pass:* 1 to 8 all hold, and the DBOS version is clearly less code to own than A. *Fail:* any of 1, 2, 3, 5 or 8 fails. Then build A.

## 7. What this changes in the docs

| Doc | Change |
| --- | --- |
| Design v0.6 Main | Decisions log: a Nov 13 row for this CR. Tech stack: add "Server internals: Effect 4 (services, errors, resources, schedules, streams)", (Tracing stays "later"). "Not used" list: add Effect Schema in the contract, and `effect/sql` until stable |
| Step 0 and Step 1 plan | Step 1 is written in Effect. Items 9 and 10 depend on spike 2. The test helpers use `@effect/vitest` |
| Jobs and workers | An implementation note: workers are fibers; the settings are `Schedule`s. The semantics don't change. If DBOS is accepted, the doc is rewritten around it |
| Port inventory | The clock, ids, logger and test helpers move from "as-is" to "with changes" (they become Effect services). Everything else is unchanged |
| Project instructions | Stack: add Effect 4 for the server internals |
| AGENTS.md | Section 5's rules |
| DATABASE.md | No change, unless DBOS is accepted. Then `jobs` and its indexes, and the `claim_no` on `consumer_cursors`, are replaced by DBOS's schema, through a migration and its own change request |
| Backend modules and build plan | If DBOS is accepted: `platform` owns the DBOS schema |

## 8. Risks

- **The learning curve.** Effect is a different way to write TypeScript, for you and for the agents. Mitigated by section 5, the language service, the skill, and keeping `decide` functions plain.
- **Two runtimes at the edge.** oRPC runs promises and our handlers run Effects. The adapter is the only seam, and spike 1 tests it.
- **Version churn.** Effect 4.1 is new. Pin exact versions of `effect` and every `@effect/*` package together, and upgrade them as one PR.
- **DBOS is a new dependency in the most important path.** It goes in only if spike 2 passes, and it keeps its own schema so taking it out stays a migration, not a rewrite.

## Decisions

1. **Accepted Nov 13:** Effect 4 for `packages/server` from Step 1 on, once spike 1 passes.
2. **Accepted Nov 13:** run spike 2 (DBOS) during Step 1, right before item 9, with the pass and fail rules above.
3. **Declined Nov 13:** spans in Step 1. They stay "later".
4. **Open, not needed until spans are on:** where spans go in production.
5. **Open:** when oRPC 2 is stable, raise a change request to move the contract to it and use `@orpc/effect`.

## Sources

- [Effect blog: 4.0 stable and 4.1](https://effect.website/blog)
- [oRPC Effect integration](https://orpc-rkeh3g6cg-dinwwwh.vercel.app/docs/integrations/effect)
- [@orpc/effect needs oRPC 2.0 beta and Effect 4 (soonlane PR 98)](https://github.com/Mnigos/soonlane/pull/98)
- [Drizzle RC and Effect 4 stable (orcai PR 131)](https://github.com/LarsLrn/orcai/pull/131)
- [effect/sql still unstable in 4.0 (all-chat issue 2)](https://github.com/HoreKk/all-chat/issues/2)
- [Drizzle with Effect Postgres](https://orm.drizzle.team/docs/connect-effect-postgres)
- [Effect workflow durability issue 10200](https://github.com/Effect-TS/effect/issues/10200)
- [Effect workflow issue 10057](https://github.com/Effect-TS/effect/issues/10057)
- [OpenTelemetry version caps (wfgraph PR 332)](https://github.com/alandotcom/wfgraph/pull/332)
- [DBOS Transact on GitHub](https://github.com/dbos-inc/dbos-transact)
- [DBOS client: enqueueInTransaction](https://docs.dbos.dev/typescript/reference/client)
- [DBOS queues: deduplication and partitions](https://docs.dbos.dev/typescript/tutorials/queue-tutorial)
- [DBOS workflows: determinism and recovery](https://docs.dbos.dev/typescript/tutorials/workflow-tutorial)
- [DBOS transactions and datasources](https://docs.dbos.dev/typescript/tutorials/transaction-tutorial)
