# Codebase analysis: backend/sprint-06

<!-- Rendered from plan.toml [analysis]. Never edit this file. -->

## Stack

Node 22.12+, pnpm 10 workspace, TypeScript 7.0.2 (erasableSyntaxOnly), Biome, Vitest 5; Hono 4.13.16, oRPC 1.16.2, Zod 4, Effect 4.1.1 inside packages/server; Drizzle 0.45.4 and node-postgres 8.23.1; Postgres 17; Better Auth 1.7.16

## Layout

packages/contract (1.0.0: 119 routes), packages/db (schema, migrations 0000 to 0004), packages/server (src/platform: app, router, effect-handler, errors, ids, logger, idempotency, rate-limit, auth, webhooks, factory-repo, db, jobs; src/onboarding/clients, src/audit, src/knowledge; src/server.ts and src/main.ts). New module folders this sprint: src/compute, src/metering, src/factory, src/events

## Conventions

- AGENTS.md is the rulebook: Architecture rules (durable work, model calls, rooms), API rules and Writing Effect rules 1 to 10
- One folder per module under packages/server/src, with index.ts as its only public entry; another module's internals are never imported (E12). A table is written only by its owner (packages/db/src/owners.ts)
- Db.withTransaction gives a program Tx and maps database violations to tagged errors; Db.commitWithEvents is the only way to commit queued events, and takes seq last
- Jobs (T-B17) and consumers (T-B18) from packages/server/src/platform/jobs: enqueue in Tx with a key, a pure decide and an apply, consumers move their cursor by compare-and-swap
- Route modules follow onboarding/clients: one mapper per DTO, outputs validated by the contract, writes through the idempotency store, and an activity row and event in the write's transaction
- Time from Clock, IDs from Ids, timings as Schedules driven by TestClock in tests; no wall-clock sleeps (F4). Fakes only for what's outside the process (the model vendor), as layers (E10)
- Source files use only erasable TypeScript syntax (no parameter properties or enums): Node runs src/main.ts with type stripping

## Notes

- Review (G5): one review, no round 2. Only a P0 or P1 sends a PR back; every P2 goes to a later ticket or the backlog, named in the PR text
- Backlog, not this cycle: T-B18's review findings rigg-02 and zero-02, and rigg-05's Jobs and workers.md half, wait for CR-49 (decision 7); rigg-03's CI job that runs the server suite 5 times under extra CPU load is kit work (.github), for OSA's list. t-b20-rigg-02 (P3): done-when.test.ts doesn't check the ticket cell, and its skip pattern misses it.effect.skip and it.effect.only. rigg-01, rigg-03's two tests, rigg-04, rigg-05's code half and zero-01 are T-B27
- T-B27, T-B21, T-B22 and T-B26 are full rigor (C4: claims and the reaper, tokens, the proxy and money, events and seq): Rigg reviews (on the model the kit sets, #96), Zero gives the security-checklist review (G7), and Javaris merges. T-B24 and T-B25 are standard and merge on Javaris's standing approval (CR-45)
- Lock from a detached worktree, then fast-forward the t/* branch; merge main into a ticket branch before its build starts
- No ticket changes packages/contract, packages/db, package.json or the lockfile

## Commands

```sh
pnpm build  # build
pnpm typecheck  # typecheck
pnpm lint  # lint
pnpm test  # test
```
