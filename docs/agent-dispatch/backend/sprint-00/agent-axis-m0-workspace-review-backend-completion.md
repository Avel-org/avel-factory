# AXIS: m0-workspace review-backend, completion report

verdict: PASS

## Summary
Atlas's m0 diff does what Step 0 item 1 and the plan's `[commands]` ask:
- `pnpm install`, `build`, `typecheck`, `lint` and `test` all exit 0. Each one also fails when it should, which I checked with a probe package in a scratch copy.
- `ci.yml` runs those same four commands against a Postgres 17 service, through `DATABASE_URL`.
- All 11 changed paths are in Atlas's territory.

I wrote two findings, neither a defect in Atlas's code, and both are routed to INT:
- `.gitignore` doesn't ignore `node_modules/`. The file is outside every territory.
- ATLAS-03's validator still hasn't been run. The permission check denies it in agent sessions.

## Pre-flight
- **Part 2 files:** all read.
  1. `.claude/agents/axis.md`: read. Its Read first list was read too: Backend modules and build plan (in full), API and data reference, DATABASE.md, CR-16, CR-17, and the Step 0 and Step 1 plan (in full).
  2. `codebase-analysis.md`: read.
  3. `contract.md`: read for section 1 (the packages the workspace must hold) and its layout. The routes, lists and tables aren't workspace input.
  4. `decisions.md`: read in full. D12 (the package names `@avel/contract`, `@avel/db` and `@avel/docs`) and D13 (`tools/docs`, `docs/generated`) touch the workspace. Both fit `pnpm-workspace.yaml`'s `packages/*` and `tools/*`.
  5. `Step 0 and Step 1 plan.md`: read in full. Step 0 item 1 and Step 1 item 14 are covered below.
  6. to 13. `AVEL Database Map.html`, `Schema vs DATABASE.md.md`, `Change requests CR-1 to 13.md`, `CR-16 Dispatch package contract.md`, `API routes.md`, `DATABASE.md`, `API and data reference.md` and `Canon onboarding v0.5.md`: all present. I searched them for anything that binds the workspace: tooling, Node or Postgres versions, extensions, CI. The only hits were:
     - DATABASE.md:608, where the ERD drift check runs in CI (m3's job, not m0's);
     - `Schema vs DATABASE.md.md`:9, `pnpm --filter @avel/db erd` (m2 and m3).

     Nothing pins a Postgres version or needs an extension.
  14. `Backend modules and build plan.md`: read in full.
  15. Step 0 item 1: read.
  16. This task doc: read in full.
- **`locks.md`:** not in the repo. No tests are locked yet, so there's no locked path to check.
- **Branch:** `backend/sprint-00/agent-axis-m0-workspace-review-backend-a1`, starting at `0b66283`. That's the review base, main at `7625b7a` merged with Atlas's `c33c667`. `AVEL_BASE` = `7625b7a`.
- **Part 7 commands:** `pnpm` 10.33.2, Node v24.22.2 and Docker 29.4.0, all available. `pnpm dlx @action-validator/cli` was **denied** by this session's permission check (see Deviations).

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| AXIS-01 | DONE | 1e5d0ce (findings), this report's commit |

**How AXIS-01 was checked.** I read the whole diff, `7625b7a..0b66283` (11 files, 1442 lines), before anything else. Then I checked each claim below.

1. **Every command in `[commands]` works.** I ran the verify chain, `pnpm install && pnpm build && pnpm typecheck && pnpm lint && pnpm test`, and it exited 0. CI's install form, `pnpm install --frozen-lockfile`, also exits 0, so the lockfile matches `package.json`.

   **An empty workspace passing proves little,** so I also exported the commit to a scratch directory (`git archive`) and added a probe package, `packages/probe`. It had a `tsconfig.json` extending `../../tsconfig.base.json`, a `src/` and a `test/`. Results:
   - **All four commands pass.** `dist/` is emitted. Biome checks 11 files and skips `dist/`. Vitest runs 1 test file.
   - **A strict-mode error fails `pnpm typecheck`** (exit 1) **and `pnpm build`** (exit 2). The errors planted were `TS2322` from `noUncheckedIndexedAccess` and `TS7006`, an implicit `any`.
   - **A failed assertion fails `pnpm test`** (exit 1, "Tests 1 failed").
   - **`any`, `debugger` and `==` fail `pnpm lint`** (exit 1, `noExplicitAny`, `noDebugger` and `noDoubleEquals`).
2. **CI runs against Postgres.** I read `.github/workflows/ci.yml:1-57` and parsed it with `python3 -I` and `yaml.safe_load`. It has:
   - a `postgres:17-alpine` service, with user, password and database `avel`, port `5432:5432` and a `pg_isready` health check;
   - the job-level `DATABASE_URL=postgres://avel:avel@127.0.0.1:5432/avel`;
   - the steps `install --frozen-lockfile`, then build, typecheck, lint and test, the same four commands as local.

   The image and credentials match `scripts/pg-local.sh:21` and `:23`. I also ran CI's steps locally with `DATABASE_URL` from `pg-local.sh start` (exit 0), and connected `psql` to that URL (PostgreSQL 17.11, musl, the image CI uses). It can't be shown to *validate* or run green on GitHub from here: finding 02.
3. **`scripts/pg-local.sh` (ATLAS-02).** Its verify, `start && url && start && stop`, exited 0 and printed the same `postgres://` URL three times. Afterwards `url` exits 1 with "isn't running: scripts/pg-local.sh start".
4. **Nothing outside the territory changed.** `git diff --name-only 7625b7a..0b66283` lists exactly the 10 paths of Atlas's Part 5, plus its completion report, which Part 5 also lists. The merge commit's second parent, `c33c667`, and HEAD differ only by the rendered dispatch docs already on main.

## Findings
- `docs/agent-dispatch/backend/sprint-00/findings/m0-workspace-axis-01-gitignore-node-modules.md`: **P2**. `.gitignore` doesn't ignore `node_modules/`, `dist/` or `*.tsbuildinfo`, now that the workspace installs and builds. Routed to INT and the plan, not Atlas.
- `docs/agent-dispatch/backend/sprint-00/findings/m0-workspace-axis-02-ci-workflow-not-validated.md`: **P3**. ATLAS-03's verify, the action-validator check of `ci.yml`, has never been run. INT runs one command.

## Contract to files
- **Step 0 item 1, "pnpm workspace"** is covered by:
  - `pnpm-workspace.yaml:1-3` (`packages/*`, `tools/*`, which fit D12 and D13);
  - `package.json` (private root, `packageManager`, `engines`, exact dev dependency versions, the four scripts);
  - `pnpm-lock.yaml`;
  - `.npmrc`.
- **Step 0 item 1, "TypeScript"** is covered by:
  - `tsconfig.base.json` (`strict` and `noUncheckedIndexedAccess`, both shown to bite);
  - `tsconfig.json` (the root typecheck of `vitest.workspace.ts`).
- **Step 0 item 1, "Biome"** is covered by `biome.json` (the recommended preset, shown to bite).
- **Step 0 item 1, "Vitest"** is covered by `vitest.workspace.ts` (one project per folder under `packages/` and `tools/`) and `package.json`'s `test` script.
- **Step 0 item 1, "`scripts/pg-local.sh`"** is covered by `scripts/pg-local.sh` (`start`, `url` and `stop`).
- **Step 0 item 1, "CI with a Postgres service"** is covered by `.github/workflows/ci.yml`.
- **The plan's `[commands]`** (build, typecheck, lint and test) are covered by `package.json`'s `scripts` and `ci.yml`'s last four steps.
- **Step 1 item 14** (CI also runs the ERD drift check, the OpenAPI generation and the review script) **isn't m0's.** The drift check and the OpenAPI generation go to m3's `docs.yml`, and nothing in sprint-00 builds a "review script". See Issues.

## Deviations
- **The validator wasn't run.** `pnpm dlx @action-validator/cli .github/workflows/ci.yml` was denied ("Code from External"). I didn't work around it. I parsed the workflow and ran its steps locally instead (finding 02).
- **The probe package went in a scratch copy, not the repo.** I don't edit code, and the probe exists only to show the gates fail. Its files are in this session's scratchpad, under `.../scratchpad/ws/packages/probe/`, and not in the repo.
- **`git diff --name-only main...HEAD` lists Atlas's files.** This branch starts at a review-base merge of Atlas's branch, which isn't on main yet, so Part 7's check can't show only Part 5 paths. I added `git diff --name-only 0b66283..HEAD`, which shows only my two findings and this report.
- **I accept Atlas's deviations:**
  - **Turborepo.** Step 0 item 1 and codebase-analysis say "pnpm workspace", and `turbo.json` wasn't in the territory, so `pnpm -r` meets the task.
  - **`vitest.workspace.ts` loaded with `--config`.** The file name came from my plan's territory, which uses a name current Vitest no longer finds on its own. The `--config` flag works, and per-package runs are unaffected.
  - **Projects listed, not globbed.**
  - **`noPropertyAccessFromIndexSignature` off,** because it conflicts with Biome's `useLiteralKeys`.
  - **The versions,** none of which a source in `docs/design/` pins.

## Limitations
- **CI hasn't run on GitHub, and no validator has checked it** (finding 02). `actions/*@v4` are tags, not SHAs.
- **`concurrency.cancel-in-progress: true` also applies to pushes to main** (`ci.yml:14-16`). Two quick merges cancel the first one's run, so that commit never gets a result. It's fine for now; it's worth making PR-only if main's history needs a result on every commit.
- **Root `engines` is `>=22.12.0`, but vitest 5.1.0 declares `^22.12.0 || ^24.0.0 || >=26.0.0`.** On Node 23 or 25, `engine-strict` fails the install on vitest's range, not the root's. That's a clear failure, but the root's range is wider than it should be. It has no effect on CI (Node 22) or here (Node 24).
- **`pnpm test` passes `--passWithNoTests`.** A package whose tests aren't discovered (a wrong file suffix, say) passes silently. The locked-test dispatches should check their test counts in their reports.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT:**
  - add `node_modules/`, `dist/` and `*.tsbuildinfo` to `.gitignore` before m1, m2 or m3 is dispatched (finding 01);
  - run the action-validator on `ci.yml` (finding 02);
  - set each finding's `status:` once it's handled, since the merge board counts both as open until then.
- **INT / Axis (the plan), not a finding against m0:** Build plan section 2, item 3, says "a small CI check fails any build commit that changes a locked test path". `scripts/check_locks.py` exists and the merge board runs it, but `ci.yml` doesn't, and no sprint-00 dispatch owns adding it. Step 1 item 14's "contract review script" also has no owner or file yet. Either should be a task in a later dispatch, for example alongside m3's `docs.yml`.
- **Rigg, Soap and Atlas (m1 to m3):**
  - extend `../../tsconfig.base.json` and set `outDir` and `rootDir`;
  - give each package its own `build`, `typecheck` and `test` scripts, since the root runs them with `--if-present`;
  - add files by name until finding 01 is fixed;
  - use `export DATABASE_URL=$(scripts/pg-local.sh start)` locally (CI sets it).

## Files changed
`git diff --name-only 0b66283..HEAD`, this session's own changes:
```
docs/agent-dispatch/backend/sprint-00/agent-axis-m0-workspace-review-backend-completion.md
docs/agent-dispatch/backend/sprint-00/findings/m0-workspace-axis-01-gitignore-node-modules.md
docs/agent-dispatch/backend/sprint-00/findings/m0-workspace-axis-02-ci-workflow-not-validated.md
```
All three are Part 5 paths. `main...HEAD` also lists Atlas's 11 files, which come from the review-base merge (see Verification).

## Verification
```
$ pnpm install && pnpm build && pnpm typecheck && pnpm lint && pnpm test      # AXIS-01
Lockfile is up to date, resolution step is skipped
Packages: +41
Done in 627ms using pnpm v10.33.2
... (build, typecheck, lint and test as below)
chain exit 0

$ pnpm build
> avel-factory@ build
> pnpm -r --if-present run build
No projects matched the filters in "/home/jt0629/projects/avel-wt/backend-sprint-00-agent-axis-m0-workspace-review-backend-a1"
[exit 0]

$ pnpm typecheck
> avel-factory@ typecheck
> tsc -p tsconfig.json && pnpm -r --if-present run typecheck
No projects matched the filters in "/home/jt0629/projects/avel-wt/backend-sprint-00-agent-axis-m0-workspace-review-backend-a1"
[exit 0]

$ pnpm lint
> avel-factory@ lint
> biome check .
Checked 7 files in 3ms. No fixes applied.
[exit 0]

$ pnpm test
> avel-factory@ test
> vitest run --config vitest.workspace.ts --passWithNoTests
 RUN  v5.1.0 /home/jt0629/projects/avel-wt/backend-sprint-00-agent-axis-m0-workspace-review-backend-a1
No test files found, exiting with code 0
[exit 0]

$ git diff --name-only main...HEAD      # before this report's commit; includes the review-base merge of Atlas's branch
.github/workflows/ci.yml
.npmrc
biome.json
docs/agent-dispatch/backend/sprint-00/agent-atlas-m0-workspace-build-completion.md
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
scripts/pg-local.sh
tsconfig.base.json
tsconfig.json
vitest.workspace.ts
(plus, after my commits, the two findings and this report)

$ git diff --name-only 0b66283..HEAD      # this session only
(the three paths in "Files changed")
```

Supporting checks:
```
$ pnpm install --frozen-lockfile
Done in 572ms using pnpm v10.33.2      [exit 0]

$ scripts/pg-local.sh start && scripts/pg-local.sh url && scripts/pg-local.sh start && scripts/pg-local.sh stop
pg-local: starting avel-pg-backend-sprint-00-agent-axis-m0-workspace-review-backend-a1 (postgres:17-alpine)
postgres://avel:avel@127.0.0.1:52253/avel
postgres://avel:avel@127.0.0.1:52253/avel
postgres://avel:avel@127.0.0.1:52253/avel
pg-local: removing avel-pg-backend-sprint-00-agent-axis-m0-workspace-review-backend-a1
verify exit 0
$ scripts/pg-local.sh url
pg-local: avel-pg-...-a1 isn't running: scripts/pg-local.sh start      [exit 1]

$ psql "$(scripts/pg-local.sh start)" -Atc 'select version()'
PostgreSQL 17.11 on x86_64-pc-linux-musl, compiled by gcc (Alpine 15.2.0) 15.2.0, 64-bit

$ DATABASE_URL=$(scripts/pg-local.sh start) sh -c 'pnpm install --frozen-lockfile && pnpm build && pnpm typecheck && pnpm lint && pnpm test'      # CI's steps
ci-local exit 0

$ (scratch copy with packages/probe) pnpm build; pnpm typecheck; pnpm lint; pnpm test
build exit 0 / typecheck exit 0 / lint exit 0 ("Checked 11 files") / test exit 0 ("Test Files 1 passed (1)")
planted type errors:   typecheck exit 1 (TS2322, TS7006), build exit 2
planted failed assert: test exit 1 ("Tests 1 failed (1)")
planted any/debugger/==: lint exit 1 (noExplicitAny, noDebugger, noDoubleEquals)

$ pnpm dlx @action-validator/cli .github/workflows/ci.yml
denied by the permission check ("Code from External")      # finding 02
```
