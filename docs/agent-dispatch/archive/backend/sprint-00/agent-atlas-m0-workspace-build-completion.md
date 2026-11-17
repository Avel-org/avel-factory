# ATLAS: m0-workspace build, completion report

verdict: PARTIAL

## Summary
The root workspace (ATLAS-01), `scripts/pg-local.sh` (ATLAS-02) and the main CI workflow (ATLAS-03) are built and committed. Every Part 7 command exits 0 on the empty workspace, and ATLAS-01's and ATLAS-02's verify commands pass. ATLAS-03's verify command, `pnpm dlx @action-validator/cli .github/workflows/ci.yml`, was denied by this session's permission check, so the workflow is checked only by parsing it and running its steps locally. That one unrun verify is why the verdict is PARTIAL, not DONE.

## Pre-flight
- **Branch:** `backend/sprint-00/agent-atlas-m0-workspace-build-a1`, started at `ffc6914` (main).
- **Part 2 files:**
  1. `.claude/agents/atlas.md`: read. Its own Read first list was read too: the Sandbox doc, Backend modules and build plan (sections 1, 10 and the Step 0 lines), the Step 0 and Step 1 plan (in full) and Roster setup and sessions (team rules, sessions, settings.json).
  2. `codebase-analysis.md`: read.
  3. `contract.md`: read for section 1 (what the packages export) and the layout. The route, list and table detail isn't workspace input.
  4. `decisions.md`: read in full. D12 (the package names) and D13 (the `tools/docs` layout) touch this work.
  5. `Step 0 and Step 1 plan.md`: read in full. Step 0 item 1 and Step 1 item 14 are covered below.
  6. to 13. `AVEL Database Map.html`, `Schema vs DATABASE.md.md`, `Change requests CR-1 to 13.md`, `CR-16 Dispatch package contract.md`, `API routes.md`, `DATABASE.md`, `API and data reference.md` and `Canon onboarding v0.5.md`: all present. I searched them for anything that affects the workspace (Node, Postgres version, extensions, tooling). The map uses its own `uuid_generate_v7()` (64 uses) and no extension, so no Postgres extension is needed in the image. None of them pins a Postgres version.
  14. `Backend modules and build plan.md`: read (see item 1).
  15. and 16. Step 0 item 1, Step 1 item 14 and contract.md's packages: read.
  17. This task doc: read in full.
- **`locks.md`:** not in the repo yet. No tests are locked in this sprint so far, so this dispatch has no locked path to avoid.
- **Part 7 commands:** `pnpm` 10.33.2, Node v24.22.2, Docker 29.4.0. All available.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ATLAS-01 | DONE | 4ece1fb |
| ATLAS-02 | DONE | c45795e |
| ATLAS-03 | DONE, but its verify (action-validator) wasn't run: see Deviations | ad1fdc0 |

## Contract to files
- **Step 0 item 1, the pnpm workspace:**
  - `pnpm-workspace.yaml`: `packages/*` and `tools/*`.
  - `package.json`: private root, `packageManager: pnpm@10.33.2`, `engines.node >=22.12.0`, exact dev dependency versions (`typescript` 7.0.2, `@biomejs/biome` 2.6.5, `vitest` 5.1.0, `@types/node` 22.20.5).
  - `pnpm-lock.yaml`.
  - `.npmrc`: `engine-strict=true`.
- **Step 0 item 1, TypeScript:**
  - `tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax`, `isolatedModules`, NodeNext modules, ES2023, declarations and source maps. Packages extend it, for example `"extends": "../../tsconfig.base.json"`.
  - `tsconfig.json`: the root's own typecheck, which covers `vitest.workspace.ts`.
- **Step 0 item 1, Biome:** `biome.json` uses the recommended preset, 2-space indent and a line width of 100. It follows `.gitignore` and skips `node_modules`, `dist`, `docs`, `scripts` and `.claude`.
- **Step 0 item 1, Vitest:** `vitest.workspace.ts` makes each folder under `packages/` and `tools/` a project, and a package's own `vitest.config.ts` is used when it has one.
- **Step 0 item 1, `scripts/pg-local.sh`:** `start`, `url` and `stop`.
- **Step 0 item 1 and Step 1 item 14, CI with a Postgres service:** `.github/workflows/ci.yml`. The ERD drift check, the OpenAPI generation and the review script belong to m3 (`docs.yml`), not here.
- **The root scripts, across packages:**
  - `build`: `pnpm -r --if-present run build`.
  - `typecheck`: `tsc -p tsconfig.json`, then `pnpm -r --if-present run typecheck`.
  - `lint`: `biome check .` over the whole repo.
  - `test`: one Vitest run over every project.
- **Checked with a throwaway package as well as the empty workspace:** I built one in the scratchpad, outside the repo, with a `src/`, a `test/` and a `tools/docs` test.
  - `build` emitted `dist/`, and `typecheck`, `lint` and `test` passed (2 test files).
  - A strict-mode error (an implicit `any`, and `noUncheckedIndexedAccess`) failed `pnpm typecheck`.
- **pg-local behavior, each checked:**
  - stdout is only the URL, so `export DATABASE_URL=$(scripts/pg-local.sh start)` works.
  - Host `psql` connects to that URL (PostgreSQL 17.11).
  - `stop` twice exits 0, and `url` while stopped exits 1 and says to run `start`.
  - Three concurrent `start`s share one container (flock).
  - A leftover stopped container with the same name is replaced.
  - `PG_LOCAL_PORT` fixes the port.
- **CI, checked locally:** `pnpm install --frozen-lockfile`, then build, typecheck, lint and test, all with `DATABASE_URL` from `pg-local.sh`. Every step exited 0.

## Deviations
- **ATLAS-03's verify command wasn't run.** This session's permission check denied `pnpm dlx @action-validator/cli .github/workflows/ci.yml`, which downloads and runs a package. I didn't try to get around that. Instead:
  - the workflow parses as YAML (`python3 -I` with `yaml.safe_load`), with the expected triggers, service, `DATABASE_URL` and the eight steps;
  - Biome 2.6 also checks the file;
  - its install, build, typecheck, lint and test steps pass locally against `pg-local.sh`'s Postgres.

  **For the operator or Axis's review:** run the validator.
- **Vitest config is in `vitest.workspace.ts`, but loaded with `--config`.** Vitest 4 removed the `vitest.workspace.ts` file convention, so the current release (5.1.0) doesn't find that file on its own. The territory names that file and no `vitest.config.ts`, so it's a normal Vitest config with `test.projects`, and `pnpm test` passes `--config vitest.workspace.ts`. A bare `pnpm exec vitest` at the root doesn't pick it up, but per-package runs (`pnpm --filter <pkg> test`) are unaffected.
- **Projects are listed, not globbed.** Vitest refuses a `projects` glob that matches nothing (`No projects were found`), and the workspace starts empty. So the config lists the existing folders under `packages/` and `tools/` instead.
- **No Turborepo.** Design v0.6 Main (Nov 1 row) says "pnpm with Turborepo", but this task names `pnpm` scripts that run across packages, and `turbo.json` isn't in the territory. I used `pnpm -r`. Adding Turborepo later changes only the root scripts.
- **Versions no doc gives, chosen by me:**
  - **Postgres 17** (`postgres:17-alpine`), the same image locally and in CI. The map needs no extension.
  - **Node 22 in CI,** from Factory records ("Node 22"), with `engines >=22.12.0`, which vitest 5 requires.
  - **TypeScript 7.0.2,** the current release.
  - **pnpm 10.33.2,** the version installed here.
- **`noPropertyAccessFromIndexSignature` is off.** It conflicts with Biome's recommended `useLiteralKeys`: tsc demands `process.env["X"]` and Biome demands `process.env.X`, so no code could pass both.

## Limitations
- **The validator:** ATLAS-03 isn't checked by action-validator (see Deviations).
- **The action versions are tags, not commit SHAs:** `actions/checkout@v4`, `pnpm/action-setup@v4` and `actions/setup-node@v4`. Looking up SHAs needs network fetches, which this session's settings deny. Pin them by SHA if the factory wants that.
- **`pg-local.sh`'s start lock needs `flock`,** which Linux and CI have. Without it (macOS), two simultaneous starts fall back to retrying for 10 seconds.
- **`pg-local.sh` needs Docker running.** If it isn't, the script says so and exits 1.
- **The database is throwaway, as asked:** the data is on a tmpfs and goes with `stop`.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT (`.gitignore`, no territory):**
  - **The problem:** `.gitignore` doesn't ignore `node_modules/`, `dist/` or `*.tsbuildinfo`. After `pnpm install`, `git status` shows `node_modules/` as untracked, and any agent that runs `git add .` or `git add -A` commits it.
  - **What I did:** I added files by name.
  - **What fixing it means:** add `node_modules/` and `dist/` to `.gitignore` before m1, m2 and m3 start. Biome already skips both.
- **Axis (`packages/contract`), Soap (`packages/db`), Atlas m3 (`tools/docs`):**
  - **Configs:** extend `../../tsconfig.base.json`, and set `outDir` and `rootDir` yourselves. The root's `pnpm build` and `pnpm typecheck` run each package's own `build` and `typecheck` scripts.
  - **Tests:** the root's `pnpm test` runs every package's tests in one Vitest run. A package that needs its own setup (for example db's `globalSetup` for migrations) adds a `vitest.config.ts` in its folder.
- **Rigg and Soap (db tests):**
  - **`DATABASE_URL`:** in CI it's `postgres://avel:avel@127.0.0.1:5432/avel`. Locally, use `export DATABASE_URL=$(scripts/pg-local.sh start)`.
  - **Each worktree gets its own container,** named `avel-pg-<worktree folder>`, on a free port, so parallel dispatches don't share a database.
- **Atlas m3 (`docs.yml`):** `ci.yml` doesn't run the drift check or OpenAPI generation (Step 1 item 14's extras), so `docs.yml` has to.

## Files changed
```
.github/workflows/ci.yml
.npmrc
biome.json
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
scripts/pg-local.sh
tsconfig.base.json
tsconfig.json
vitest.workspace.ts
```
Plus this report. All are Part 5 paths.

## Verification
```
$ pnpm build
> avel-factory@ build
> pnpm -r --if-present run build
No projects matched the filters in "/home/jt0629/projects/avel-wt/backend-sprint-00-agent-atlas-m0-workspace-build-a1"
[exit 0]

$ pnpm typecheck
> avel-factory@ typecheck
> tsc -p tsconfig.json && pnpm -r --if-present run typecheck
No projects matched the filters in "/home/jt0629/projects/avel-wt/backend-sprint-00-agent-atlas-m0-workspace-build-a1"
[exit 0]

$ pnpm lint
> avel-factory@ lint
> biome check .
Checked 7 files in 3ms. No fixes applied.
[exit 0]

$ pnpm test
> avel-factory@ test
> vitest run --config vitest.workspace.ts --passWithNoTests
 RUN  v5.1.0 /home/jt0629/projects/avel-wt/backend-sprint-00-agent-atlas-m0-workspace-build-a1
No test files found, exiting with code 0
[exit 0]

$ git diff --name-only main...HEAD
.github/workflows/ci.yml
.npmrc
biome.json
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
scripts/pg-local.sh
tsconfig.base.json
tsconfig.json
vitest.workspace.ts
```

The task verify commands:
```
$ pnpm install && pnpm build && pnpm typecheck && pnpm lint && pnpm test      # ATLAS-01
... (as above)
chain exit 0

$ scripts/pg-local.sh start && scripts/pg-local.sh url && scripts/pg-local.sh start && scripts/pg-local.sh stop      # ATLAS-02
pg-local: starting avel-pg-backend-sprint-00-agent-atlas-m0-workspace-build-a1 (postgres:17-alpine)
postgres://avel:avel@127.0.0.1:60294/avel
postgres://avel:avel@127.0.0.1:60294/avel
postgres://avel:avel@127.0.0.1:60294/avel
pg-local: removing avel-pg-backend-sprint-00-agent-atlas-m0-workspace-build-a1
verify exit 0

$ pnpm dlx @action-validator/cli .github/workflows/ci.yml      # ATLAS-03
not run: denied by this session's permission check (see Deviations)

$ python3 -I -c '<yaml.safe_load of ci.yml, print its shape>'      # ATLAS-03, the stand-in
on: {'push': {'branches': ['main']}, 'pull_request': None}
services: ['postgres'] postgres:17-alpine
env: {'DATABASE_URL': 'postgres://avel:avel@127.0.0.1:5432/avel'}
steps: ['actions/checkout@v4', 'pnpm/action-setup@v4', 'actions/setup-node@v4', 'pnpm install --frozen-lockfile', 'pnpm build', 'pnpm typecheck', 'pnpm lint', 'pnpm test']
parse exit 0

$ DATABASE_URL=$(scripts/pg-local.sh start) pnpm install --frozen-lockfile && pnpm build && pnpm typecheck && pnpm lint && pnpm test      # CI's steps, locally
ci-local exit 0
```
