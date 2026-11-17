# Codebase analysis: backend sprint-01

Rendered by `scripts/render.py` from `plan.toml` (`[analysis]` and `[commands]`).

## Stack

A TypeScript monorepo on pnpm workspaces (pnpm 10). Biome 2.6.5 for lint and format, Vitest for tests, Drizzle on Postgres, and oRPC 1.16.2 contract definitions with Zod 4.6.7 schemas. Step 0 is merged: packages/contract (102 routes, value lists, DTOs, the error map, the event-owner map), packages/db (the schema and migrations), tools/docs (the ERD, the OpenAPI document and the DATABASE.md drift check). The web (apps/web, frontend territory) imports @avel/contract through its subpath exports (D58).

## Layout

- packages/contract/src: value-lists.ts (no zod), dto/*.ts (the DTOs and inputs), errors.ts (the error map and ErrorBody), routes/*.ts (oRPC route definitions over base.ts), events.ts, completion-report.ts; built with tsc into dist/
- packages/contract/test: the 44 locked done-when tests (5, 6, 7) and their helpers and fixtures
- tools/docs/src/openapi.ts: the OpenAPI generator (oRPC's OpenAPIGenerator with @orpc/zod's zod 4 converter); output in docs/generated/openapi.json
- biome.json: the root lint config

## Conventions

- Schemas in packages/contract/src import zod as `import * as z from "zod/mini"`; zod/v4/core only where a type or class must cover classic and mini alike
- zod/mini has no chained modifiers: x.nullable() is z.nullable(x), x.optional() is z.optional(x), x.array() is z.array(x), S.extend(shape) is z.extend(S, shape), S.pick(mask) is z.pick(S, mask); checks go through .check(...): z.minLength, z.minimum, z.maximum, z.trim, z.regex, z.refine
- Every name, field, comment and export stays where it is: the move changes how a schema is built, never what it is
- Package names are @avel/contract and @avel/docs; @avel/contract's package.json doesn't change (no version bump, S1-6; packaging rule, S1-2 and D58)

## Commands

- **build:** `pnpm build`
- **lint:** `pnpm lint`
- **test:** `pnpm test`
- **typecheck:** `pnpm typecheck`

## Notes

- decisions.md S1-6 is this module's contract, including the spike's results (2026-11-07). S1-3 (the BAD_REQUEST details) and S1-2 (the version rule) are the other entries it leans on.
