# Outside sources and what we took

Nov 14, 2026 · @javaris

Every outside repo, library, spec and service we studied while designing the factory: what it is, what we took from it, the role it plays in AVEL, what we deliberately didn't take, and the change request that records the decision. If something here and a CR disagree, the CR wins.

**Status words:** **Adopted** (in the design now), **Testing** (a spike decides), **Proposed** (in a CR not yet accepted), **Later** (agreed, not scheduled), **Idea only** (we took a pattern, not the code), **Rejected** (looked at and turned down).

## At a glance

| Source | What it is | Status | Role in AVEL | Record |
| --- | --- | --- | --- | --- |
| Effect 4 | A TypeScript library for typed errors, services, resources and schedules | Adopted | How `packages/server` is written inside | CR-30 |
| `@orpc/effect` | oRPC's bridge to Effect | Rejected for now | Replaced by our own `effectHandler` adapter | CR-30 |
| DBOS Transact | Durable workflows and queues on Postgres | Testing | May replace the hand-built jobs engine | CR-30, spike 2 |
| Effect workflows and cluster | Effect's own durable workflows | Rejected for now | None | CR-30 |
| OpenTelemetry (`@effect/opentelemetry`) | Standard tracing | Later | Spans for requests, jobs, attempts | CR-30 |
| AgentRun (Parcha-ai) | A workflow DSL for the Pi coding agent | Idea only | The crash-between-effect-and-save test | CR-30, check 8 |
| Agent Skills spec | The open format for agent skills (`SKILL.md`) | Adopted | The format of every skill in the factory repo | CR-32 |
| `skills-ref` | The spec's reference validator | Adopted | Runs in the factory repo's CI | CR-32 |
| OSA (Optimal System Agent) | An open-source operator agent with a CLI and TUI | Proposed | Drives the CLI and prepares decision briefs | CR-29 |
| MIOSA | Cloud sandboxes, AI models and a memory engine | Proposed | Rooms (CR-22); OSA's models (CR-29) | CR-22, CR-29 |
| OptimalEngine (Miosa-osa) | A self-hosted memory and context engine: sources, claims, facts, hybrid retrieval | Testing (spike 3); also a candidate for OSA's memory | A possible engine for the context layer, as a derived index only | CR-35 |
| GBrain (garrytan) | A markdown-in-git memory for agents, indexed in Postgres, over CLI and MCP | Idea only (factory); the alternative for OSA's memory | None inside the factory | This page |
| TanStack DB | A reactive client store on top of TanStack Query | Proposed | The control room's data layer | CR-W23 |
| XState v5 | State machines for UI flows | Later | Possible for Canon's interview and decision cards | None yet |
| NestJS | A Node framework with modules and DI | Rejected | None | This page |
| Fastify, Elysia, Encore.ts | Other Node and TypeScript server frameworks | Rejected | None | This page |
| agent-dispatch | The vendored dispatch framework | Adopted (reference) | Task docs, completion reports, findings | `Factory records.md` |
| avel-server, avel-web | Our own earlier repos | Adopted in part | What ports, as-is or with changes | `Port inventory.md` |
| Research (Anthropic, Cognition, Spec Kit, Kiro, ETH Zurich) | Published studies on agent teams and context files | Idea only | How the team works; Canon's build kit | `AVEL agent system.md`, CR-23 |

## The details

### Effect 4 · Adopted (CR-30)
- **What it is:** a TypeScript library where a function's failures are part of its type, dependencies are passed in as services, and resources always clean up. Stable since Sep 30, 2026; 4.1 since Oct 20.
- **What we took:** services and layers, tagged errors, `Scope` and `acquireRelease`, `Schedule`, fibers, `Stream`, `Config` with `Redacted`, the `Logger` slot, `@effect/vitest` with `TestClock`, and the language service.
- **Its role:** the inside of `packages/server`. It turns the design's rules into types: an event can't be written outside a transaction, a cost reservation can't leak, a room is always torn down, every error maps to a contract code.
- **What we didn't take:** Effect Schema (Zod stays), `effect/sql` (still unstable; Drizzle stays), Effect's HTTP server and RPC (Hono and oRPC stay), Effect's AI packages (our model proxy stays).
- **Gate:** spike 1 must pass before any Step 1 code.
- **Source:** [effect.website/blog](https://effect.website/blog)

### `@orpc/effect` · Rejected for now (CR-30)
- **What it is:** oRPC's official bridge for writing procedures as Effect programs.
- **Why not:** it runs only on oRPC 2.0, still in beta. Our contract is frozen on oRPC 1.16.2.
- **What we did instead:** `effectHandler`, one small file of our own. When oRPC 2 is stable, a new CR can swap it in.
- **Source:** [oRPC Effect integration](https://orpc-rkeh3g6cg-dinwwwh.vercel.app/docs/integrations/effect)

### DBOS Transact · Testing (CR-30, spike 2)
- **What it is:** an MIT-licensed library for durable workflows and queues that keeps its state in Postgres and needs no extra server.
- **What it might replace:** the hand-built `jobs` table, claim numbers, the reaper and the retry code.
- **Why it fits:** a deduplication ID on enqueue matches "one live job per key"; a partitioned queue matches "one integration commit at a time per mission"; `enqueueInTransaction` matches "state change, event and job in one transaction".
- **What it must prove:** all of Step 1's jobs and events tests, the stalled-process case, a deploy with work in flight, the exact backoff, and check 8 (a crash between a side effect and its save). If any key check fails, we hand-build the engine.
- **When:** during Step 1, right before the jobs engine.
- **Sources:** [GitHub](https://github.com/dbos-inc/dbos-transact) · [client: enqueueInTransaction](https://docs.dbos.dev/typescript/reference/client) · [queues](https://docs.dbos.dev/typescript/tutorials/queue-tutorial)

### Effect workflows and cluster · Rejected for now (CR-30)
- **Why not:** still marked unstable, with open durability bugs. In one, a dropped Postgres connection becomes a workflow's stored final result. Receipts depend on our jobs, so this waits until Effect marks it stable.
- **Source:** [Effect issue 10200](https://github.com/Effect-TS/effect/issues/10200)

### OpenTelemetry · Later (CR-30)
- **What it is:** the standard for tracing; `@effect/opentelemetry` exports Effect's spans.
- **Its role when turned on:** a span for each request, job run, attempt, model-proxy call, gate run, integration commit and room, with IDs only. Never prompts, client text, secrets or cost.
- **Decided Nov 13:** not in Step 1. The code still names its units of work with `Effect.withSpan`, which costs nothing until an exporter is installed.

### AgentRun (Parcha-ai) · Idea only (CR-30, check 8)
- **What it is:** an open-source workflow DSL and extensions for the Pi coding agent, still in beta.
- **Why not the code:** it would duplicate our scheduler and gates; its decision step calls a model outside our proxy (breaking the meter of record); it has no cost limits; its code nodes run with the host's privileges; and it supports Pi, not Claude Code.
- **What we took:** the idea that an action already started may finish after a crash, so its outcome must be reconciled before a retry. It became check 8: kill a worker after its push but before its save; the retry must find the push done and not repeat it.
- **Source:** [github.com/Parcha-ai/agentrun](https://github.com/Parcha-ai/agentrun)

### Agent Skills spec and `skills-ref` · Adopted (CR-32)
- **What it is:** the open format for agent skills, first developed by Anthropic: a folder with a `SKILL.md` holding a name, a description and instructions, plus optional scripts, references and assets.
- **What we took:** the folder layout, the `name` rules (it must match the folder and the slug), `description`, `license`, and `metadata` for AVEL's own fields under `avel-` keys. `skills-ref validate` runs in the factory repo's CI.
- **What we refused:** `allowed-tools`. A skill can never add a tool or a permission; an imported skill that has it is taken in without it.
- **Why it matters:** one skill library that any skills-compatible agent can load, which CR-5 (one adapter per vendor) needs.
- **Source:** [agentskills.io](https://agentskills.io/specification.md)

### OSA, the Optimal System Agent · Proposed (CR-29)
- **What it is:** an open-source (Apache 2.0) agent in Elixir with a Rust TUI and a local HTTP API.
- **Its role:** the operator's agent. It drives the CLI, prepares decision briefs labeled "Prepared by OSA", and takes tasks from the control room through the server. The operator still decides every decision.
- **What we didn't do:** run OSA inside rooms. That would need a model key in the room, which the design forbids.
- **Source:** [osa.dev](https://osa.dev/)

### MIOSA · Proposed (CR-22, CR-29)
- **What it is:** a cloud platform with sandboxes (microVMs), AI models and a memory engine. The Developer plan is $20 a month.
- **Its roles:** rooms for internal and template missions (CR-22); the models OSA uses, DeepSeek V4.1 Flash for everyday work and Kimi K2.6 for briefs (CR-29).
- **What we didn't take:** its memory engine for client memory. CR-28 uses the existing client knowledge entries instead, so no outside store holds client facts.
- **Limit:** client missions stay off MIOSA until it publishes egress controls and a SOC 2.

### OptimalEngine (Miosa-osa) · Testing (CR-35, spike 3)
- **What it is:** a self-hosted "second brain and operating engine" from MIOSA's GitHub org, in Elixir/OTP, MIT licence.
  - Sources move through a lifecycle: source, signal, **claim** ("pending truth"), **fact** ("accepted truth", decided by review or policy), memory object, context package.
  - Retrieval mixes full-text, vector, graph and time ranking.
  - Context comes in token tiers (L0 to L3), with permission checks.
  - Interfaces: a CLI, a local HTTP API, MCP tools, and TypeScript and Python SDKs.
  - Storage: SQLite locally, with Postgres as its stated production target.
- **Update, Nov 15 (CR-35):** proposed as one of two engines for the context layer, on trial in spike 3. It may serve only as a **derived index** rebuilt from our Postgres, with its model calls through our proxy, so the objections below are the spike's pass conditions.
- **Why not as a store of truth:**
  - It would be a second store for client facts. CR-28 keeps them in the factory's own Postgres, so receipts, deletion and client isolation have one place to hold.
  - Its enrichment and embeddings would call models outside our model proxy, breaking the meter of record.
  - Rooms get only their task doc's reading list and have no network to query a memory service.
  - Its own README marks answer accuracy "not run", and production qualification still pending.
- **What we take as ideas:**
  - **Claim then fact** matches Canon's facts, which are proposed and then confirmed by you. It's a second witness for that design, not a change.
  - **Token tiers** suit CR-34's reading-list budget: a short tier of a long document on the list, and the full text available in the room.
  - **Fused retrieval** is a later option for the agents' `kb-search` tool and the context layer (CR-35), if Postgres full-text search stops being enough.
- **Where it could fit:** as **OSA's memory** of the business (clients, leads, your preferences and past reasons), outside the factory. It's from the same organization and in the same language as OSA. Its model calls are then OSA's business cost (CR-29 §7), not mission spend.
- **Source:** [github.com/Miosa-osa/OptimalEngine](https://github.com/Miosa-osa/OptimalEngine)

### GBrain (garrytan) · Idea only for the factory
- **What it is:** an open-source (MIT) memory system for agents. The memory is a markdown repo the operator owns, indexed in Postgres (PGLite locally, pgvector for semantic search), reachable by CLI, MCP and HTTP. It runs scheduled jobs that enrich and tidy the brain.
- **Why not inside the factory:** the same reasons as OptimalEngine. A second store for client facts; scheduled model calls outside the proxy; and nothing a room can reach.
- **Where it could fit:** the alternative for OSA's memory. Its plain markdown in git is easy to read, diff and back up, and it already works with Claude Code over MCP.
- **Source:** [github.com/garrytan/gbrain](https://github.com/garrytan/gbrain)

**The rule for both:** the factory stays the source of truth. If OSA keeps a memory, it holds your operator notes and links back to factory records, never copies of client secrets or anything a receipt depends on.

### TanStack DB · Proposed (CR-W23)
- **What it is:** a client-side store from the TanStack team: typed collections, live queries and optimistic writes that roll back on failure. 1.0 is a release candidate (`1.0.0-rc.1.5`).
- **Its role:** the control room's data. The one event stream writes into collections; screens read live queries; a decision shows as sent at once and undoes itself on a 409.
- **Pinned versions:** `@tanstack/db` and `@tanstack/react-db` `1.0.0-rc.1.5`, `@tanstack/query-db-collection` `1.5.2`, `@tanstack/query-core` `5.107.1`. Checked to install and typecheck with the web's versions.
- **Source:** [TanStack DB 1.0 RC1](https://tanstack.com/blog/tanstack-db-1.0-rc1-going-all-in-on-oracles)

### XState v5 · Later
- **What it is:** state machines for UI flows.
- **Possible role:** Canon's interview, the release flow and the decision cards, where impossible states should be impossible to show. Use v5, not the v6 beta.

### NestJS, Fastify, Elysia, Encore.ts · Rejected
- **NestJS:** its oRPC bridge is experimental and needs ESM setup; its guards duplicate Step 1's middleware; its usual queue (BullMQ) needs Redis, which the design bans; decorators are harder for agents to write and review. ([oRPC NestJS docs](https://orpc.unnoq.com/docs/openapi/nest/implement-contract))
- **Fastify:** mature, but like for like with Hono; nothing we need.
- **Elysia:** built for Bun; our stack is Node 22.
- **Encore.ts:** its own runtime fights the oRPC contract and the Postgres jobs design.
- **What we kept:** Hono. Sophistication goes into Effect, the jobs engine and, later, spans.

### agent-dispatch · Adopted as reference
- **What it is:** the vendored dispatch framework in `docs/agent-dispatch/`.
- **Its role:** the shape of task docs, completion reports, findings and escalations (`Factory records.md`). Its old sprint records were moved out into an archive.

### avel-server and avel-web · Adopted in part
- **What they are:** our own earlier Command Center repos.
- **Their role:** `Port inventory.md` says exactly what moves: the gate, the Docker rooms and check runner, delivery guards, the pure libraries and client records, each as-is, with changes, or as reference. No avel-web code moves; its lessons became rules for the new UI.

### Research we drew on · Idea only
- **Anthropic and Cognition** on multi-agent systems: one writer per area, a lead that splits and combines, memory in files, code as the gate. These shaped `AVEL agent system.md`.
- **Spec Kit, Kiro and an ETH Zurich study** on context files: complete specs help, but generated context files can hurt. This shaped CR-23 (Canon's build kit) and CR-10 (task docs carry only the slices they need).

## Keeping this page current

When a new outside source is studied, add a row and a section here in the same PR as its CR. A source with no CR is "Idea only" or "Rejected", and says why.
