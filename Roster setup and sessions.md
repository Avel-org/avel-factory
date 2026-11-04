# Roster setup and sessions

Nov 4, 2026 · @javaris

One repo (`avel-factory`), two teams, each with its own roster setup. Web territories follow AVEL Web App — Frontend Map v0.6 (Nov 4), section "Territories for Gate 1". In the repo: `docs/agent-dispatch/avel/roster.md`, `docs/agent-dispatch/avel/sessions.md`, the agent files in `.claude/agents/` and `.claude/settings.json`. Matches `claude/Roster.md`.

## Teams (`avel/roster.md`)

`avel-factory` is one repo with two teams. Each team has its own lead, builders, tests and sprint folder. The reviewers are shared. The agent setups live in `.claude/agents/<name>.md` (model, tools and role), and each one matches `claude/Roster.md`.

### Backend team: `docs/agent-dispatch/backend/`

| Agent | Role in this team | Model | Territory (default) |
| --- | --- | --- | --- |
| **Axis** (lead) | `api-contract`, `review-backend` | Opus | `packages/contract/**` |
| Soap | builds `api`, `data` | Opus | `packages/db/**`; the routes and mappers in `packages/server/src/modules/<module>/**` |
| Iyo | builds `services`, `ai` | Opus | workers, scheduler, integrator, proxy, harness, Canon in `packages/server/src/modules/<module>/**` |
| Atlas | builds `infra`, `maintenance`, `docs` | Opus | CI, Docker and rooms, `scripts/**`, `AGENTS.md`, generated docs |
| Ghost | builds `packages/cli` | Opus | `packages/cli/**` |
| Rigg | `test-unit`: unit, integration, load, pinning | Sonnet | `packages/{server,db,cli}/test/**` and test config |

### Frontend team: `docs/agent-dispatch/frontend/`

| Agent | Role in this team | Model | Territory (default) |
| --- | --- | --- | --- |
| **Zero** (lead) | `ui-contract`, `review-frontend` | Opus | the UI contracts, `docs/ui-contracts/**` |
| Nemi | builds `design-system` | Opus | `apps/web/src/styles/**`, the app config (`apps/web/{package.json,vite.config.ts,tsconfig.json}`) |
| Fantem | builds `frontend-components` | Opus | `apps/web/src/kit/**` |
| Leon | builds `frontend` | Opus | one module per dispatch, `apps/web/src/modules/<name>/**` (except `events`), and its route files in `apps/web/src/routes/**` |
| Ghost | builds `frontend-data` | Opus | `apps/web/src/data/**`, `apps/web/src/lib/**`, the live core `apps/web/src/modules/events/**`, and `packages/contract-mock/**` |
| Fenn | `test-unit`, `test-e2e` | Sonnet | `apps/web/test/**`, `apps/web/e2e/**` and test config |

### Shared reviewers (both teams)

| Agent | Role | Model | Rules on disputes over |
| --- | --- | --- | --- |
| Brennan | `review-spec` on every module; checks Axis's and Zero's contracts | Opus | locked tests; Zane's, Zero's, Axis's and Leah's findings |
| Zane | `review-security`; new dependencies | Sonnet | Brennan's and Breach's findings |
| Leah | `review-a11y-perf`: frontend accessibility and Web Vitals; backend latency and N+1 queries | Sonnet | — |
| Breach | `red-team` on the running app | Sonnet | — |

### Rules between the teams
1. **One contract.** `packages/contract` belongs to the backend team (Axis). The frontend imports it from the workspace, so a contract change type-checks on both sides at once. A frontend change to the API is an escalation filed in `frontend/sprint-NN/escalations/` and answered by Axis and Brennan (additive) or you (breaking). The web never edits the contract.
2. **One UI contract owner.** Zero's UI contracts belong to the frontend team. The backend reads them but never edits them.
3. **Territories never cross.** Backend sprints never touch `apps/web/**` or `packages/contract-mock/**`; frontend sprints never touch `packages/{server,db,contract,cli}/**`. Web tests live only under `apps/web/test/**` and `apps/web/e2e/**`, never inside module folders, so builders can't edit locked tests. Gate 1's territory check, and the hand-run version of it in Phase 1, refuse an overlap.
4. **Ghost works for both teams,** with a different territory and a different task doc in each.
5. **Reviewers are never the builder.** No agent reviews or tests its own module, in either team.
6. **Cross-team dependencies** are written in each team's DISPATCH.md: for example, "frontend sprint 03 needs contract v0.7 from backend sprint 02". A dependent module doesn't start until the other team's work has landed on `main`.

## Sessions (`avel/sessions.md`)

While the factory is built by hand, each Claude Code session stands in for one thing the factory will do itself. Keep them separate for the same reasons the factory does: fresh context per attempt, no agent grading its own work, and one writer per branch.

### The four kinds of session

| Session | Where it runs | How many | What it does | What it never does |
| --- | --- | --- | --- | --- |
| **Lead** (one per team) | The main checkout, on `main` | 1 backend (Axis), 1 frontend (Zero) | Plans the sprint with you, writes the contract slice or UI contract, runs the renderer to produce the dispatch package | Builds a module, reviews its own contract |
| **Agent** (one per dispatch) | Its own worktree, on its attempt branch | One per running dispatch, up to 6 at once across both teams | Works one task doc: tests, a build, or a review | Takes a second dispatch, pushes, edits outside its territory |
| **Review** | Its own worktree, checked out at the builder's result commit | One per reviewer per module | Writes the review report and findings | Edits code |
| **Integration** (you, or your own session) | The main checkout | 1 | Merges in dependency order, runs the full tests after each merge, records decisions | Merges without green tests |

### Opening an agent session
1. **Generate first, never paste:** the lead session renders the package into `docs/agent-dispatch/<team>/sprint-NN/`, and you approve it (Gate 0, then the Gate 1 checklist).
2. **Start the wave:** `scripts/dispatch.sh <team>/sprint-NN`. Each dispatch gets its worktree and branch, and Claude Code starts in it with the agent's model and `/dispatch <team>/sprint-NN/<task doc>`.
   - For one agent by hand: `cd` into its worktree, then `claude --model <model> "/dispatch <team>/sprint-NN/<task doc>"`.
3. **In order:** test writers first (Rigg, Fenn). Lock their tests (`locks.md`), then start the builder. Reviewers start once the builder's report is in.
4. **One session is one attempt.** A retry is a new session in a fresh worktree, started from the right commit for its ladder step, given only the error output, never the old transcript. Don't continue a failed session.

### Good practices
- **Fresh context, always.** No `/clear` and no reusing a session for different work. If an attempt runs long, the agent finishes its current chain, commits a checkpoint and reports, and the next attempt resumes from that commit.
- **The task doc is the whole briefing.** If you find yourself typing extra instructions into an agent session, the task doc is missing something: fix the plan, re-render, and start a new attempt. Your corrections then end up in the record.
- **Reviews in their own sessions.** Never ask a builder's session to review its own work, and don't run a reviewer as a subagent of the builder's session: the builder would decide what the reviewer sees.
- **Subagents only where the task doc allows them,** inside the same cap.
- **Permissions on.** Keep Claude Code's permission prompts on for Bash. The repo's `.claude/settings.json` allows the build, test and lint commands and local git commits, and denies `git push`, force operations and network fetches. Never run agent sessions with permission checks skipped.
- **Keep your own credentials out.** Once the factory and `avel login` exist, don't sign in to the CLI inside agent worktrees: an agent could use your session to approve something. Your CLI session belongs to the integration session only.
- **Record as you go.** At the end of each session, write its `/cost` to `cost.md`. Every decision goes in `decisions.md`, and every finding is a file.
- **Six at a time.** Match the factory's limit: at most 6 agent sessions across both teams. More sessions means more merge conflicts and more of your attention.
- **Close cleanly.** After a module lands, remove its worktree (`git worktree remove`). Keep the branch until the sprint closes.

### A typical backend sprint (one build step)
1. **Lead session (Axis):** `contract.md` for the step, then Brennan reviews it in a review session. The renderer writes the package.
2. **Agent session (Rigg):** the done-when tests, which must fail. You lock them.
3. **Agent sessions (Soap, Iyo or Atlas),** one per module, in parallel where territories and dependencies allow.
4. **Review sessions:** Axis and Brennan on every module; Zane, Leah and Breach where a trigger applies.
5. **Integration session:** findings decided, modules merged one at a time with the full tests after each, the step closed with `SPRINT-ASSESSMENT.md`.

The frontend runs the same way: Zero leads, Fenn writes the tests, and Nemi, Fantem, Leon and Ghost build.

## Agent files (`.claude/agents/`)

| File | Model | Tools | Description |
| --- | --- | --- | --- |
| `atlas.md` | opus | Read, Write, Edit, Glob, Grep, Bash | Backend builder for infra, maintenance and docs work: rooms, gVisor, proxies, CI, AGENTS.md, generated docs. |
| `axis.md` | opus | Read, Write, Edit, Glob, Grep, Bash | Backend lead. Writes the API contract slice for each step and reviews every backend module against it. Never builds. |
| `breach.md` | sonnet | Read, Write, Glob, Grep, Bash | Red team: attacks the running app, frontend and backend. |
| `brennan.md` | opus | Read, Write, Glob, Grep, Bash | Spec reviewer on every module: checks the work, and the contracts, against the requirements and the design docs. |
| `fantem.md` | opus | Read, Write, Edit, Glob, Grep, Bash | Frontend builder for shared components, built to the UI contract with the design tokens. |
| `fenn.md` | sonnet | Read, Write, Edit, Glob, Grep, Bash | Frontend test writer: unit and component tests, browser end-to-end tests, visual snapshots, the exploratory pass. |
| `ghost.md` | opus | Read, Write, Edit, Glob, Grep, Bash | Builds typed API clients and data layers: the web data core, live core and contract mock (frontend team) and packages/cli (backend team). |
| `iyo.md` | opus | Read, Write, Edit, Glob, Grep, Bash | Backend builder for services and ai work: jobs and workers, the scheduler, integrator, model proxy, harness, Canon. |
| `leah.md` | sonnet | Read, Write, Glob, Grep, Bash | Accessibility and performance reviewer, frontend and backend. |
| `leon.md` | opus | Read, Write, Edit, Glob, Grep, Bash | Frontend builder for one module at a time: its screens, forms, compositions, query options, event handlers and decision kinds, plus its route files. |
| `nemi.md` | opus | Read, Write, Edit, Glob, Grep, Bash | Design system builder: tokens, CSS variables, motion, from the design library; owns the web app config. |
| `rigg.md` | sonnet | Read, Write, Edit, Glob, Grep, Bash | Backend test writer: unit, integration, load and pinning tests against real Postgres. Never builds application code. |
| `soap.md` | opus | Read, Write, Edit, Glob, Grep, Bash | Backend builder for api and data work: routes, DTO mappers, schema, migrations, queries. |
| `zane.md` | sonnet | Read, Write, Glob, Grep, Bash | Security reviewer against OWASP ASVS, plus dependencies. |
| `zero.md` | opus | Read, Write, Edit, Glob, Grep, Bash | Frontend lead. Writes the UI contract for each feature and reviews every frontend module against it. Never builds. |

Reviewers have no Edit tool, and write only their review reports and findings. Builders and test writers are held to their territories by the lock check and, from Step 4, by Gate 3.

## `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm install:*)",
      "Bash(pnpm build:*)",
      "Bash(pnpm test:*)",
      "Bash(pnpm typecheck:*)",
      "Bash(pnpm lint:*)",
      "Bash(pnpm --filter:*)",
      "Bash(pnpm exec vitest:*)",
      "Bash(scripts/pg-local.sh:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git show:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git branch --show-current)"
    ],
    "deny": [
      "Bash(git push:*)",
      "Bash(git reset --hard:*)",
      "Bash(git clean:*)",
      "Bash(git rebase:*)",
      "Bash(rm -rf:*)",
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Bash(npm publish:*)",
      "Bash(pnpm publish:*)",
      "Bash(avel:*)"
    ]
  }
}
```

It denies `avel` in every session in the repo, so no agent can use your CLI session. Run `avel` yourself, or allow it in your own `.claude/settings.local.json`, which isn't committed.
