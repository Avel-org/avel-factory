# AGENTS.md

How to work in `avel-factory`. Read this first, then `docs/design/README.md`, which says which doc wins.

## What AVEL does

Clients bring projects. Each one is a **mission**. Canon, the onboarding agent, interviews the operator (Javaris) and reads the client's uploads and repo, then drafts a plan through four checkpoints (0.1 to 0.4) that the operator approves. The plan splits the work into **modules**. Agents build each module in a sandboxed **room**: test writers first, then a builder, then reviewers. One piece of work is a **dispatch**; each try at it is an **attempt**. Work lands on the mission branch through serial **integration commits**, so the branch is always green. It passes **gates 0 to 5**. Gate 5 issues a hashed **receipt** with a verdict: verified, pass or fail. The operator releases the exact commit the receipt names, delivered as a PR, a push or a zip. When the factory needs the operator, it opens a decision.

## Where the truth is

1. **The code:** the schema in `packages/db` and the contract in `packages/contract` (1.0.0: 119 routes, 87 event kinds, 10 decision kinds). `docs/generated/` follows them.
2. **Accepted change requests** in `docs/design/` override the design docs; the later one wins.
3. **The frozen design (v0.6):** `Design v0.6 Main.md`, `Canon onboarding v0.5.md`, the Sandbox doc, `DATABASE.md`.
4. **The plans:** `Step 0 and Step 1 plan.md`, `Jobs and workers.md`, `Port inventory.md`, `Backend modules and build plan.md`.

The design is frozen. Implement it as written. If code shows a doc is wrong or missing something, stop and write a change request: what, why, and which doc and table it touches. Never change the design silently, and never let code and docs drift apart.

## Stack (fixed)

- Node 22.12+, a pnpm 10 workspace (`apps/*`, `packages/*`, `tools/*`), TypeScript, Biome.
- Hono, with oRPC 1.16.2 (`implement(contract)` served through OpenAPIHandler under `/api`).
- **Effect 4 for the server's internals** (CR-30): services and layers, typed errors, resources, schedules, fibers and streams. Not Effect Schema, not `effect/sql`, not Effect's HTTP server, not Effect workflows.
- Zod 4 (`zod/mini` in the contract), the only schema library.
- Drizzle 0.45 with node-postgres, Postgres 17.
- Better Auth: email and password for the one operator (sign-up off), the Drizzle adapter. Passkeys come later; their table exists. The operator's password is never in the repo.
- Vitest against a real local Postgres (`scripts/pg-local.sh`), with `@effect/vitest` in the server.
- Our own small JSON logger with request IDs, plugged in as Effect's logger. No Pino, no Redis.

## Architecture rules

- **One service with internal packages,** not microservices. 20 modules; each table has one owning module (exceptions in `DATABASE.md`).
- **Hono routes outside the contract:** `/api/auth/*` (Better Auth), `POST /api/webhooks/github` (raw-body signature, deduplicated on `X-GitHub-Delivery`) and `/git/missions/{missionId}.git`. Everything else goes through the contract.
- **Durable work:**
  - Postgres `jobs` with **claims** (`claim_no`, `claim_expires_at`) and a reaper. Handlers are idempotent: a pure `decide`, then an `apply`.
  - A state change, its event and any follow-up job commit in one transaction.
  - Event `seq` comes from an advisory lock taken as the last statement before commit.
  - Consumers are claimed jobs that move their cursor by compare-and-swap.
  - DBOS may replace the hand-built engine only if it passes CR-30 spike 2.
- **The mission branch** moves only through the integrator, by git compare-and-swap plus a compare-and-swap on `missions.branch_head`.
- **Model calls:** every call goes through the host model proxy, the meter of record. It reserves each request's maximum cost first; if it can't, the attempt ends `budget_parked`. The attempt's $4 cap ends it `capped`. Budgets: $15 per module, $150 per mission, priced from `price_table`. Money is in micro-dollars.
- **Rooms:** one hardened Docker/gVisor room per attempt (Step 2). No model key and no repo write token inside. Push credentials cover only the attempt's own branch. Gate 3 runs in a fresh check room.
- **Secrets** (Step 4, CR-1): envelope-encrypted with a KMS key. Only the delivery worker decrypts client write tokens.

## API rules

- **DTOs:** never return a Drizzle row. One mapper per object (`toMissionDto`); outputs are validated.
- **Errors:** every error is `{ code, message, details?, requestId }` from the contract's catalog. Send `X-Request-Id` and `X-Contract-Version` on every response.
- **Writes:** require `Idempotency-Key`, stored per (principal, key) for 24 hours; never store a response that carries a secret or token (a replayed token route gets 409). Check `rowVersion` (or the bound hash); stale is 409. A move the state machine doesn't allow is 422 with the allowed moves.
- **Step-up (password again)** only for credential actions: writing secrets, creating, editing or rotating repo connections, approving a CLI login. Grants are single-use and last 5 minutes. **Approvals never ask.**
- **Rate limits,** in memory: sign-in, the agent API per dispatch token, webhooks, CLI login.
- **The database enforces its rules.** Map constraint violations to 409 or 422; never make a duplicated CHECK the only guard in code. Nothing a receipt depends on is deleted; removing something is a state change.
- **No money on web-facing routes or events,** except AI cost against its cap.
- **Agent, client and Canon text is untrusted:** returned as plain text, never HTML.

## Writing Effect (CR-30)

1. `Effect.gen` with `yield*`; no long pipe chains.
2. Programs run in two places only: the `effectHandler` adapter and worker entry points. Lint refuses `runPromise` and `runSync` elsewhere.
3. Every failure a caller can handle is a tagged error, mapped to a contract code in one table checked at compile time. Anything else is a defect: 500 with the request ID, logged, never shown.
4. Time from `Clock`, IDs from `Ids` (UUIDv7), randomness from `Random`.
5. Every external call (model proxy, GitHub, room host, git) has a timeout.
6. Every resource with a lifetime (room, cost reservation, pool client, stream) uses `acquireRelease` in a scope.
7. `Semaphore` limits never replace a database rule.
8. Tests: `@effect/vitest` with `TestClock`, real Postgres, fakes provided as layers.
9. Effect's language service runs in the editor and CI.
10. `decide` functions stay plain TypeScript.

`Events.append` needs the `Tx` service, so it can't run outside a transaction; `Db.commitWithEvents` is the only way to commit queued events.

## How to work

- Follow the 14-step build order, one step at a time. A step is done only when its "done when" tests pass against real Postgres.
- **Start every step by stating which docs and tables it touches and the test plan,** then build.
- **Step 1 runs in this order:** spike 1 (Effect at the edge) → the server shell, middleware, database errors, idempotency and the `Db` service (items 1 to 4) → tests 10 and 11 against a small `Jobs` interface → spike 2 (DBOS) → the jobs engine that won → the rest of Step 1 (auth, step-up, CLI login, activity log, events, the factory repo loader, CI). No sample route and no approval page (CR-31); spans aren't part of Step 1.
- Port from avel-server only what `Port inventory.md` says, in its stated form (CR-30 moves the clock, ids and logger to "with changes").
- Keep generated artifacts in sync: `pnpm --filter @avel/docs generate` rewrites `docs/generated/erd.md` and `openapi.json`, and `pnpm --filter @avel/docs drift` checks `DATABASE.md` against the schema. CI fails on either.
- **Don't commit or push unless the operator asks.**
- No secrets in code, fixtures, logs or docs.

## Commands

```sh
pnpm install
export DATABASE_URL=$(scripts/pg-local.sh start)
pnpm build && pnpm typecheck && pnpm lint && pnpm test
pnpm --filter @avel/docs drift
pnpm --filter @avel/docs generate
scripts/pg-local.sh stop
```

## The team that builds the factory

`docs/design/Build rules.md` (version 3, Nov 15) is how work moves here. Read it before your first ticket. In short:
- **Javaris** approves the cycle's tickets, full-rigor merges and step closes. **OSA** runs the cycle for him and never decides.
- **Axis** leads backend and **Zero** leads frontend. Each lead has a **builder** and a **checker**.
- **The checker writes the acceptance tests first;** they must fail on `main`, and the builder can't change them.
- **Sessions:** one dispatch per session (a ticket is three: tests, build, review), each in a fresh worktree with its own database, under its limits.
- **Review:** one batch per cycle, at most two rounds, and only P0 and P1 block.
- **Identities, system prompts and dispatch:** `docs/design/Agents, identities and system prompts.md`. Builders and checkers get their work only from a rendered task doc through `/dispatch`, never from a pasted prompt.
- **Tabs, accounts and keys:** `docs/design/Build roster and environment.md`. Keys never go in the repo; `.env.example` lists the server's.
- **Stop instead of guessing:** end with `blocked`, `needs-cr`, `test-dispute`, `needs-dependency` or `out-of-scope`.
