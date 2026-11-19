# Codebase analysis: backend/sprint-04

<!-- Rendered from plan.toml [analysis]. Never edit this file. -->

## Stack

Node 22.12+, pnpm 10 workspace, TypeScript 7.0.2, Biome, Vitest 5; Hono 4.13.16, oRPC 1.16.2, Zod 4, Effect 4.1.1 inside packages/server; Drizzle 0.45.4 and node-postgres 8.23.1; Postgres 17

## Layout

packages/contract, packages/db (schema and migrations), packages/server (src/platform: app, effect-handler, errors, ids, logger, request-id, idempotency and rate-limit from T-B8, auth and the caller from T-B9; src/platform/db: db, tx, events, errors)

## Conventions

- AGENTS.md is the rulebook: Architecture rules (durable work), API rules (DTOs, errors, writes, rate limits) and Writing Effect rules 1 to 10
- packages/server/src/platform/errors.ts holds the one table from a tagged error to a contract code; a tag with no row doesn't compile through effectHandler (T-B1)
- Db.withTransaction gives a program Tx and maps database violations to tagged errors (T-B3, T-B4); Events.append needs Tx, and Db.commitWithEvents takes seq under the advisory lock as the last statement
- T-B8's Idempotency store and RateLimit service; T-B9's Caller, client IP and Idempotency-Key header in the request scope
- Tests run against real Postgres from scripts/pg-local.sh; test/db/support/database.ts makes a migrated database per file (T-B3)

## Notes

- One builder at a time (B7): T-B13, then T-B14, then T-B15. Rigg writes the next ticket's tests while Soap builds. The sprint starts once sprint-03's last PR is merged (B8)
- T-B13 and T-B15 are full rigor (C4: the jobs engine and claims; a webhook signature that decides which factory commits can be pinned): Javaris merges, and Zero's second review follows the security checklist (G7). T-B14 is standard
- Review (Build rules G5, Javaris Nov 18): one review, no round 2. Only a P0 or P1 sends the PR back, and the checker then confirms only those fixes. Every P2 goes to a later ticket or the backlog, named in the PR text

## Commands

```sh
pnpm build  # build
pnpm typecheck  # typecheck
pnpm lint  # lint
pnpm test  # test
```
