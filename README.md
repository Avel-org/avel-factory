# avel-factory

The engine behind AVEL (avelco.dev, Austin, TX), a one-person software agency that ships client software through a factory. Javaris runs the business and makes the calls; AI agents do the building inside a controlled, tested process. The engine turns a client's request into delivered, verified software: onboarding, planning, agents at work, testing everything they produce, and shipping the exact commit that passed, with a hashed receipt.

## Status (Nov 13, 2026)

| Part | State |
| --- | --- |
| `packages/contract` | Contract 1.0.0: 119 routes, 87 event kinds, 10 decision kinds, the error catalog |
| `packages/contract-mock` | The contract served with mock data, so the web works before the server |
| `packages/db` | Drizzle schema, migrations 0000 to 0003, 652 tests against real Postgres |
| `tools/docs` | Generates `docs/generated/` and checks `DATABASE.md` against the schema |
| `packages/server` | Not started. Step 1 is next: written in Effect 4, starting with spike 1 (CR-30), with no sample route or approval page (CR-31) |
| `apps/web` | Built by the frontend session against `contract-mock` |

Step 0 of the 14-step build order is done. Step 1 is the server scaffold.

## Layout

```
packages/contract        the oRPC contract: routes, DTOs, enums, errors, events
packages/contract-mock   the contract with mock data
packages/db              the Drizzle schema, migrations and their tests
packages/server          the server (Step 1 onward)
apps/web                 the control room (frontend session)
tools/docs               generated docs and the DATABASE.md drift check
docs/design              design docs, change requests and plans; start at docs/design/README.md
docs/generated           erd.md and openapi.json, generated, never edited by hand
docs/ui-contracts        the web's UI contracts
docs/agent-dispatch      the vendored dispatch kit
scripts/pg-local.sh      a throwaway local Postgres for tests
```

## Getting started

Needs Node 22.12 or later, pnpm 10 (pinned in `package.json`) and Docker.

```sh
pnpm install
export DATABASE_URL=$(scripts/pg-local.sh start)
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

`scripts/pg-local.sh stop` removes the database. CI runs the same four commands against a Postgres service (`.github/workflows/ci.yml`), plus the drift check and a fresh generate of `docs/generated` (`docs.yml`).

## Seeding this repo

The repo is new. It's assembled from two exports:

1. **The code:** `avel-contract-1.0.0-source.zip` (`packages/contract`, `packages/contract-mock`, `packages/db`, `tools/docs`, the root configs).
2. **The docs and setup files:** this bundle (`README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/`, `scripts/pg-local.sh`, `.github/workflows/`, `.gitignore`, `.npmrc`, `tsconfig.json`).

Unzip both at the root, run `pnpm install` once, and commit the generated `pnpm-lock.yaml` with the first commit, because CI installs with `--frozen-lockfile`. The old `Avel-org/avel-factory` main has the 0.0.0 contract and isn't a source.

## Working here

Agents and people follow `AGENTS.md`. The design is frozen at v0.6; anything that changes it goes through a change request first. `docs/design/README.md` says which doc wins.
