# Codebase analysis: backend/sprint-05

<!-- Rendered from plan.toml [analysis]. Never edit this file. -->

## Stack

Node 22.12+, pnpm 10 workspace, TypeScript 7.0.2 (erasableSyntaxOnly from #68), Biome, Vitest 5; Hono 4.13.16, oRPC 1.16.2, Zod 4, Effect 4.1.1 inside packages/server; Drizzle 0.45.4 and node-postgres 8.23.1; Postgres 17; Better Auth 1.7.16

## Layout

packages/contract, packages/db (schema, migrations 0000 to 0003, the done-when db suite), packages/server (src/platform: app, router, effect-handler, errors, ids, logger, idempotency, rate-limit, auth, webhooks, factory-repo, db; src/onboarding, src/audit, src/knowledge; src/server.ts and src/main.ts from T-B16)

## Conventions

- AGENTS.md is the rulebook: Architecture rules (durable work, the database enforces its rules), API rules and Writing Effect rules 1 to 10
- Db.withTransaction gives a program Tx and maps database violations to tagged errors; Events.append needs Tx, and Db.commitWithEvents takes seq under the advisory lock as the last statement
- packages/server/src/platform/errors.ts holds the one table from a tagged error to a contract code
- Time comes from Clock, timings are Schedules, and tests drive them with TestClock; no wall-clock sleeps (F4)
- Tests run against real Postgres from scripts/pg-local.sh; test/db/support/database.ts makes a migrated database per file
- Source files use only erasable TypeScript syntax (no parameter properties or enums): Node runs src/main.ts with type stripping (#68)

## Notes

- Review (G5): one review, no round 2. Only a P0 or P1 sends a PR back. Every P2 goes to a later ticket or the backlog, named in the PR text
- All four tickets are full rigor (C4: jobs, claims, the reaper and events; sign-in and the webhook's signature). Javaris merges, and Zero's second review follows the security checklist (G7)
- Lock from a detached worktree, then fast-forward the t/* branch; merge main into a ticket branch before its build starts

## Commands

```sh
pnpm build  # build
pnpm typecheck  # typecheck
pnpm lint  # lint
pnpm test  # test
```
