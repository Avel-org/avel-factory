---
doc: agent-soap-t-b0-build
ticket: T-B0
lane: backend
sprint: sprint-01
agent: soap
seat: builder
kind: build
role: build
rigor: standard
model: sonnet
branch: t/B0-setup-deps
checkout: branch
after: [agent-rigg-t-b0-test-unit]
depends_on: []
report: docs/agent-dispatch/backend/sprint-01/agent-soap-t-b0-build-completion.md
---


# T-B0 · build · Soap: Setup: CODEOWNERS, the CI lock check, and every scaffold dependency installed once

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-01 · Step 1 |
| Ticket | T-B0 · rigor standard |
| Dispatch | build · Soap (builder) · model sonnet |
| Works on | `t/B0-setup-deps` |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Soap** (`.claude/agents/soap.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You build this ticket until its locked acceptance tests pass, changing only the files in Part 5.

## 2. Context: read these first, in order

1. `.claude/agents/soap.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/backend/sprint-01/codebase-analysis.md`: the codebase in short
5. `docs/design/Step 0 and Step 1 plan.md`: Step 1 item 1, middleware items 2.1, 2.3 and 2.9, and tests 1 and 3
6. `docs/design/CR-30 Effect in the server, durable jobs and spans.md`: spike 1 (section 6) and its pass and fail rules
7. `docs/design/Build rules.md`: C4 (full-rigor areas), E5 (dependencies), H6 (the lock check)
8. `docs/design/Build rules.md`: H6 (what the lock check enforces), C4 (the full-rigor areas CODEOWNERS covers), E5 (what each new package must state), G7
9. `scripts/render.py`: the build task doc's Part 5 Territory list and the locks.md line format (- T-Bn: <paths> @ <sha>) the lock check parses; branch names t/<id>-<slug>; report paths
10. `scripts/agents/roster.json`: the lanes, their ticket prefixes and the never lists
11. `docs/agent-dispatch/avel/example-plan.toml`: render it into a scratch repo for test fixtures
12. `docs/design/Backend modules and build plan.md`: the module names behind the C4 paths in CODEOWNERS
13. `.github/workflows/ci.yml`: the pnpm and Node setup the new workflow copies
14. `tools/docs/package.json`: the pattern for a tools/ package: scripts, strip-types, tsconfig
15. `docs/design/Build roster and environment.md`: the GitHub section: CODEOWNERS with 'require review from code owners'
16. `tools/repo-checks/test/**`: the locked acceptance tests: they define done
17. `docs/agent-dispatch/backend/sprint-01/agent-soap-t-b0-build.md`: this document: follow it exactly

## 3. Domain

**Goal:** Every dependency the scaffolds need is installed in one lockfile change, and a PR whose builder leaves the ticket's files or edits a locked test fails CI.

**Refs:**
- Build rules H6, E5, B7, C4, G7 and section P
- Step 0 and Step 1 plan, Step 1 test 1

**Notes from the lead:**
- Dependencies, Javaris approves these in this ticket list (E5). Exact versions, each published on or before Nov 2, 2026. Backend, all MIT: hono 4.13.16 (1.3 MB unpacked; the HTTP server and router AGENTS.md fixes; nothing in the repo serves HTTP) · @hono/node-server 2.1.5 (138 KB; runs Hono on Node for the dev server) · effect 4.1.1 (56.5 MB unpacked with sources and maps, no dependencies; CR-30) · dev: @effect/vitest 4.1.1 (345 KB; TestClock and layers in Vitest, Writing Effect rule 8) · dev: @effect/language-service 0.87.5 (19.9 MB; Writing Effect rule 9). Already in the lockfile, so not new: @orpc/server 1.16.2, @orpc/openapi 1.16.2, zod 4.6.7, @avel/contract (workspace:*)
- Frontend list, from Zero (Nov 16), for a new apps/web/package.json: name @avel/web, private, type module, exact pins, and the scripts and sideEffects in the next note. dependencies: @avel/contract workspace:* · @tanstack/react-start 1.169.4 (MIT, 103 KB) · @tanstack/react-router 1.170.46 (MIT, 1 MB; the version react-start pins) · react 19.3.1 and react-dom 19.3.1 (MIT, 174 KB and 7.9 MB) · @orpc/client 1.16.2 and @orpc/openapi-client 1.16.2 (MIT, 138 KB and 47 KB; AGE EXCEPTION: published Nov 6, kept to match oRPC 1.16.2, already in the lockfile) · clsx 2.1.1 (MIT, 8 KB) · tailwind-merge 3.7.0 (MIT, 1 MB). devDependencies: @avel/contract-mock workspace:* · vite 8.3.8 (MIT, 2.3 MB; AGE EXCEPTION: published Nov 11, but it's the copy vitest 5.1.0 already locks; the fallback 8.3.5 adds a second vite) · @vitejs/plugin-react 6.1.2 (MIT, 45 KB) · tailwindcss 4.3.3 and @tailwindcss/vite 4.3.3 (MIT, 755 KB and 13 KB) · @types/react 19.3.0 and @types/react-dom 19.3.0 (MIT) · @playwright/test 1.64.1 (Apache-2.0; browsers install separately) · @axe-core/playwright 4.14.0 (MPL-2.0, dev only, never shipped). Javaris approves both exceptions and the MPL-2.0 licence by name
- apps/web/package.json is final after this ticket (T-F1 can't touch it): the dependencies above, "sideEffects": ["**/*.css"], and exactly these scripts, from Zero: dev (vite dev), preview (vite preview), test (vitest run), e2e (playwright test). No build or typecheck script on purpose: with no vite.config.ts, tsconfig.json or src yet, root pnpm build and pnpm typecheck would fail; they arrive in the next cycle's dependency ticket. Javaris approved the roster.json exception that lets the backend lane write this one file (Nov 16), and the three age and licence exceptions named above
- The override: add to pnpm-workspace.yaml `overrides: { "@esbuild-kit/core-utils>esbuild": "0.25.12" }`, which lifts drizzle-kit's esbuild 0.18.20 (GHSA-67mh-4wv8-2f99) to the 0.25.12 already in the lockfile. drizzle-kit check and the docs generate must still pass
- packages/server/package.json is final after this ticket (T-B1 can't touch it): name @avel/server, private, type module, the dependencies above plus @avel/contract, @orpc/server, @orpc/openapi and zod; scripts typecheck (tsc -p tsconfig.json --noEmit), test (vitest run --passWithNoTests) and dev (node --experimental-strip-types src/main.ts). No build script: the server runs from source. tsconfig.json and vitest.config.ts are final too, and vitest.config.ts is the tsconfig's input until T-B1 adds src
- CODEOWNERS: every path is owned by @Avel-org/operator (Javaris makes that team with himself in it, with write access). It covers the C4 areas as paths: packages/server/src/platform/{auth,db,jobs}/** and packages/server/src/modules/{events,integrator,runner,harness,compute,metering,gate,delivery}/**; and the rule files: .github/**, scripts/agents/**, scripts/render.py, scripts/dispatch.sh, scripts/agent.sh, .agents/**, .claude/**, docs/design/Build rules.md
- The lock check (tools/repo-checks, run by .github/workflows/locks.yml on pull_request with full history): a PR from t/<B|F><n>-<slug> finds ticket T-<B|F><n>'s rendered build task doc and its locks.md line. The builder's commits are the commits after the lock line's SHA; each file they touch must match a Territory glob in the build doc's Part 5 (or be the build's own report), and none may be a locked path. It also runs python3 scripts/render.py --verify on the ticket's sprint. A branch not named t/* passes with a note. Glob matching follows render.py's glob_regex
- Branch protection and the required checks are GitHub settings Javaris turns on when the repo exists (H1, H7); they're not in this ticket
- If @effect/language-service can't run against TypeScript 7, stop with needs-cr. Don't pin an older TypeScript

## 4. Tasks

### T-B0-01: make it true: lock check: a builder commit inside the build doc's Territory passes

- **Verify:** its locked test passes: `pnpm install --frozen-lockfile`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`, `pnpm --filter @avel/repo-checks test`, `pnpm --filter @avel/db exec drizzle-kit check`, `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated`, `pnpm why esbuild`

### T-B0-02: make it true: lock check: a builder commit touching a file outside the Territory fails and names the file

- **Verify:** its locked test passes: `pnpm install --frozen-lockfile`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`, `pnpm --filter @avel/repo-checks test`, `pnpm --filter @avel/db exec drizzle-kit check`, `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated`, `pnpm why esbuild`

### T-B0-03: make it true: lock check: a builder commit touching a path in the ticket's locks.md line fails, even when the path also matches the Territory

- **Verify:** its locked test passes: `pnpm install --frozen-lockfile`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`, `pnpm --filter @avel/repo-checks test`, `pnpm --filter @avel/db exec drizzle-kit check`, `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated`, `pnpm why esbuild`

### T-B0-04: make it true: lock check: commits at or before the lock SHA (the checker's tests) aren't held to the builder's Territory

- **Verify:** its locked test passes: `pnpm install --frozen-lockfile`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`, `pnpm --filter @avel/repo-checks test`, `pnpm --filter @avel/db exec drizzle-kit check`, `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated`, `pnpm why esbuild`

### T-B0-05: make it true: lock check: a t/* branch with no rendered build doc or no locks.md line fails with a reason

- **Verify:** its locked test passes: `pnpm install --frozen-lockfile`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`, `pnpm --filter @avel/repo-checks test`, `pnpm --filter @avel/db exec drizzle-kit check`, `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated`, `pnpm why esbuild`

### T-B0-06: make it true: lock check: a branch not named t/* passes and says it isn't a ticket PR

- **Verify:** its locked test passes: `pnpm install --frozen-lockfile`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`, `pnpm --filter @avel/repo-checks test`, `pnpm --filter @avel/db exec drizzle-kit check`, `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated`, `pnpm why esbuild`

### T-B0-07: make it true: CODEOWNERS: every C4 area path and every rule file listed in the ticket is owned by @Avel-org/operator

- **Verify:** its locked test passes: `pnpm install --frozen-lockfile`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`, `pnpm --filter @avel/repo-checks test`, `pnpm --filter @avel/db exec drizzle-kit check`, `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated`, `pnpm why esbuild`

### T-B0-08: make it true: dependencies: packages/server/package.json and apps/web/package.json pin the approved packages at exact versions (no ^ or ~)

- **Verify:** its locked test passes: `pnpm install --frozen-lockfile`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`, `pnpm --filter @avel/repo-checks test`, `pnpm --filter @avel/db exec drizzle-kit check`, `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated`, `pnpm why esbuild`

### T-B0-09: make it true: dependencies: apps/web/package.json has exactly the scripts dev, preview, test and e2e, no build or typecheck script, and sideEffects ["**/*.css"]

- **Verify:** its locked test passes: `pnpm install --frozen-lockfile`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`, `pnpm --filter @avel/repo-checks test`, `pnpm --filter @avel/db exec drizzle-kit check`, `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated`, `pnpm why esbuild`

### T-B0-10: make it true: dependencies: pnpm-lock.yaml holds no esbuild below 0.25

- **Verify:** its locked test passes: `pnpm install --frozen-lockfile`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`, `pnpm --filter @avel/repo-checks test`, `pnpm --filter @avel/db exec drizzle-kit check`, `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated`, `pnpm why esbuild`

### T-B0-11: make it true: workflow: .github/workflows/locks.yml runs the lock check on pull_request with fetch-depth 0

- **Verify:** its locked test passes: `pnpm install --frozen-lockfile`, `pnpm build && pnpm typecheck && pnpm lint && pnpm test`, `pnpm --filter @avel/repo-checks test`, `pnpm --filter @avel/db exec drizzle-kit check`, `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated`, `pnpm why esbuild`

## 5. Territory

**You may change** (and create):
- `.github/CODEOWNERS`
- `.github/workflows/locks.yml`
- `tools/repo-checks/src/**`
- `tools/repo-checks/package.json`
- `tools/repo-checks/tsconfig.json`
- `tools/repo-checks/vitest.config.ts`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `packages/server/package.json`
- `packages/server/tsconfig.json`
- `packages/server/vitest.config.ts`
- `apps/web/package.json`
- `docs/design/Outside sources and what we took.md`
- `docs/agent-dispatch/backend/sprint-01/agent-soap-t-b0-build-completion.md` (your report)

**Locked: never change** (A3, F2):
- `tools/repo-checks/test/**`

**Never change, whatever the task says:**
- `packages/contract/**`
- `packages/contract-mock/**`
- `packages/db/**`
- `packages/server/src/**`
- `.github/workflows/ci.yml`
- `.github/workflows/docs.yml`
- `apps/web/*/**`
- `apps/web/.*`
- `apps/web/*.{ts,tsx,js,mjs,cjs,css,html,md,yaml,yml,toml}`
- `apps/web/{tsconfig,components,biome}.json`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

**Owned by other tickets in this sprint** (stay out; the other lane never shares a file with yours):

| Ticket | Kind | Paths |
| --- | --- | --- |
| T-B1 | builds | `packages/server/src/**` |
| T-B1 | tests | `packages/server/test/**` |

## 6. Execution protocol: build

1. Confirm where you are (`/dispatch` checks the branch or the detached checkout).
2. Start your own Postgres: `export DATABASE_URL=$(scripts/pg-local.sh start)` (D5).
3. Run `pnpm test` once before you change anything, so you know the starting state.
4. Read the locked tests before any code. They're the definition of done.
5. Work task by task. After each, run its verify command and commit a small checkpoint (H2, with `Refs: T-B0`).
6. Build the simplest thing that passes (B9, C3). No dead or speculative code, no new dependency, no database mocks (E5, E8, E10).
7. If a locked test looks wrong, stop with `test-dispute`. If a doc is wrong or missing something, stop with `needs-cr` (E3, F2).
8. When every task passes, run all of Part 7's commands, then write and commit your report.

## 7. Completion

**Verification** (run every one, in order, and paste the results into your report):

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm install --frozen-lockfile
pnpm build && pnpm typecheck && pnpm lint && pnpm test
pnpm --filter @avel/repo-checks test
pnpm --filter @avel/db exec drizzle-kit check
pnpm --filter @avel/docs generate && git diff --exit-code docs/generated
pnpm why esbuild
```

**Your report:** `docs/agent-dispatch/backend/sprint-01/agent-soap-t-b0-build-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
ticket: T-B0
```

Then these sections:
- Pre-flight: each verification command and its result
- What changed: every file, and why
- Contract to files: which requirement each change serves
- Deviations: anything done differently from this document, and why
- Limitations: what isn't covered, or couldn't be checked

## Activation prompt

> You are Soap, the backend builder on the AVEL build team (`.claude/agents/soap.md`). Your lead is Axis. Your task is ticket T-B0, "Setup: CODEOWNERS, the CI lock check, and every scaffold dependency installed once": the build dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-01/agent-soap-t-b0-build.md`. Read it in full, then its Context in order, before you change anything. Work on branch `t/B0-setup-deps`. Make the locked tests pass, changing only the files in Part 5. Never edit a locked test. Run the verification after each task. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-01/agent-soap-t-b0-build-completion.md`, committed to the branch. Don't push.
