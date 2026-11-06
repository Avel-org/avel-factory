<!-- Seeded from "docs/design/Roster setup and sessions.md" (Nov 4, 2026), section "Teams". Keep the two in step; matches claude/Roster.md. -->

# AVEL roster

`avel-factory` is one repo with two teams. Each team has its own lead, builders, tests and sprint folder. The reviewers are shared. The agent setups live in `.claude/agents/<name>.md` (model, tools and role), and each one matches `claude/Roster.md`.

## Backend team: `docs/agent-dispatch/backend/`

| Agent | Role in this team | Model | Territory (default) |
| --- | --- | --- | --- |
| **Axis** (lead) | `api-contract`, `review-backend` | Opus | `packages/contract/**` |
| Soap | builds `api`, `data` | Opus | `packages/db/**`; the routes and mappers in `packages/server/src/modules/<module>/**` |
| Iyo | builds `services`, `ai` | Opus | workers, scheduler, integrator, proxy, harness, Canon in `packages/server/src/modules/<module>/**` |
| Atlas | builds `infra`, `maintenance`, `docs` | Opus | CI, Docker and rooms, `scripts/**`, `AGENTS.md`, generated docs |
| Ghost | builds the CLI and TUI | Opus | the `avel-cli` repo (its own repo since Nov 4: CR-15 item 4) |
| Rigg | `test-unit`: unit, integration, load, pinning | Sonnet | `packages/{server,db}/test/**`, `avel-cli`'s `test/**` and test config |

## Frontend team: `docs/agent-dispatch/frontend/`

| Agent | Role in this team | Model | Territory (default) |
| --- | --- | --- | --- |
| **Zero** (lead) | `ui-contract`, `review-frontend` | Opus | the UI contracts, `docs/ui-contracts/**` |
| Nemi | builds `design-system` | Opus | `apps/web/src/styles/**`, the app config (`apps/web/{package.json,vite.config.ts,tsconfig.json}`) |
| Fantem | builds `frontend-components` | Opus | `apps/web/src/kit/**` |
| Leon | builds `frontend` | Opus | one module per dispatch, `apps/web/src/modules/<name>/**` (except `events`), and its route files in `apps/web/src/routes/**` |
| Ghost | builds `frontend-data` | Opus | `apps/web/src/data/**`, `apps/web/src/lib/**`, the live core `apps/web/src/modules/events/**`, and `packages/contract-mock/**` |
| Fenn | `test-unit`, `test-e2e` | Sonnet | `apps/web/test/**`, `apps/web/e2e/**` and test config |

## Shared reviewers (both teams)

| Agent | Role | Model | Rules on disputes over |
| --- | --- | --- | --- |
| Brennan | `review-spec` on every module; checks Axis's and Zero's contracts | Opus | locked tests; Zane's, Zero's, Axis's and Leah's findings |
| Zane | `review-security`; new dependencies | Sonnet | Brennan's and Breach's findings |
| Leah | `review-a11y-perf`: frontend accessibility and Web Vitals; backend latency and N+1 queries | Sonnet | — |
| Breach | `red-team` on the running app | Sonnet | — |

## Rules between the teams
1. **One contract.** `packages/contract` belongs to the backend team (Axis). The frontend imports it from the workspace, so a contract change type-checks on both sides at once. A frontend change to the API is an escalation filed in `frontend/sprint-NN/escalations/` and answered by Axis and Brennan (additive) or you (breaking). The web never edits the contract.
2. **One UI contract owner.** Zero's UI contracts belong to the frontend team. The backend reads them but never edits them.
3. **Territories never cross.** Backend sprints never touch `apps/web/**` or `packages/contract-mock/**`; frontend sprints never touch `packages/{server,db,contract}/**` or the `avel-cli` repo. Web tests live only under `apps/web/test/**` and `apps/web/e2e/**`, never inside module folders, so builders can't edit locked tests. Gate 1's territory check, and the hand-run version of it in Phase 1, refuse an overlap.
4. **Ghost works for both teams,** with a different territory and a different task doc in each.
5. **Reviewers are never the builder.** No agent reviews or tests its own module, in either team.
6. **Cross-team dependencies** are written in each team's DISPATCH.md: for example, "frontend sprint 03 needs contract v0.7 from backend sprint 02". A dependent module doesn't start until the other team's work has landed on `main`.
