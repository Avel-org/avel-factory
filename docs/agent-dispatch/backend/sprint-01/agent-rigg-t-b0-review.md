---
doc: agent-rigg-t-b0-review
ticket: T-B0
lane: backend
sprint: sprint-01
agent: rigg
seat: checker
kind: review
role: review
rigor: standard
model: sonnet
branch: t/B0-setup-deps
checkout: detached
after: [agent-soap-t-b0-build]
depends_on: []
report: docs/agent-dispatch/backend/sprint-01/agent-rigg-t-b0-review-completion.md
---


# T-B0 · review · Rigg: Setup: CODEOWNERS, the CI lock check, and every scaffold dependency installed once

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | backend · lead Axis |
| Sprint | sprint-01 · Step 1 |
| Ticket | T-B0 · rigor standard |
| Dispatch | review · Rigg (checker) · model sonnet |
| Works on | a detached checkout of `t/B0-setup-deps`'s head |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Rigg** (`.claude/agents/rigg.md`). Lead: Axis. Builder: Soap. Checker: Rigg.

You review the builder's work on this ticket, from the diff and this document only (G1). You change no code.

## 2. Context: read these first, in order

1. `.claude/agents/rigg.md`: who you are, and your always and never
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
17. `docs/agent-dispatch/backend/sprint-01/agent-soap-t-b0-build-completion.md`: the builder's completion report
18. `docs/agent-dispatch/backend/sprint-01/agent-rigg-t-b0-review.md`: this document: follow it exactly

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

### T-B0-01: check: lock check: a builder commit inside the build doc's Territory passes

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B0-02: check: lock check: a builder commit touching a file outside the Territory fails and names the file

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B0-03: check: lock check: a builder commit touching a path in the ticket's locks.md line fails, even when the path also matches the Territory

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B0-04: check: lock check: commits at or before the lock SHA (the checker's tests) aren't held to the builder's Territory

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B0-05: check: lock check: a t/* branch with no rendered build doc or no locks.md line fails with a reason

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B0-06: check: lock check: a branch not named t/* passes and says it isn't a ticket PR

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B0-07: check: CODEOWNERS: every C4 area path and every rule file listed in the ticket is owned by @Avel-org/operator

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B0-08: check: dependencies: packages/server/package.json and apps/web/package.json pin the approved packages at exact versions (no ^ or ~)

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B0-09: check: dependencies: apps/web/package.json has exactly the scripts dev, preview, test and e2e, no build or typecheck script, and sideEffects ["**/*.css"]

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B0-10: check: dependencies: pnpm-lock.yaml holds no esbuild below 0.25

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B0-11: check: workflow: .github/workflows/locks.yml runs the lock check on pull_request with fetch-depth 0

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-B0-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/backend/sprint-01/agent-rigg-t-b0-review-completion.md`
- `docs/agent-dispatch/backend/sprint-01/findings/t-b0-rigg-NN.md`, one per finding

**The build's territory**, for checking the diff:
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

## 6. Execution protocol: review

1. You're on a detached checkout of the builder's result. Get the diff: `git diff $(git merge-base main HEAD)...HEAD`.
2. Read the builder's report, then the diff, then the locked tests. You don't see the builder's session (G1).
3. Run Part 7's commands yourself. A red command is a finding.
4. Write each finding to its own file under `findings/`: severity (P0 to P3, G3), evidence (a file and line, a failing command, or a rule ID), what you expected, and the check that would catch it.
5. List what you checked and what you couldn't reach. Leave everything uncommitted.

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

**Your report:** `docs/agent-dispatch/backend/sprint-01/agent-rigg-t-b0-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
verdict: pass | changes | block
ticket: T-B0
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why

## Activation prompt

> You are Rigg, the backend checker on the AVEL build team (`.claude/agents/rigg.md`). Your lead is Axis. Your task is ticket T-B0, "Setup: CODEOWNERS, the CI lock check, and every scaffold dependency installed once": the review dispatch. Your whole briefing is `docs/agent-dispatch/backend/sprint-01/agent-rigg-t-b0-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/backend/sprint-01/agent-rigg-t-b0-review-completion.md`, left uncommitted. Don't push.
