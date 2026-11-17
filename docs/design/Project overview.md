# AVEL software factory: project overview

Nov 12, 2026 · @javaris

AVEL (avelco.dev, Austin, TX) is a one-person software agency that ships client software through a factory: Javaris runs the business and makes the calls, and AI agents do the building inside a controlled, tested process. This project builds the engine that runs that factory. The design is frozen at v0.6; the repo is at Step 1 of a 14-step build order.

## What the factory has to get right

- **Trust.** Every delivery comes with a hashed receipt that proves what was built, how it was tested, what it cost, and which commit the client received.
- **Margin.** Every agent run is metered and capped, so a fixed-price job stays profitable: $4 and 60 minutes per attempt, $15 per module, $150 per mission. Money is stored in micro-dollars.
- **One operator.** The factory only asks you for decisions. You approve twice per mission (the plan and the release), plus any proposal it opens.

## How a mission flows

1. **A client brings a project.** It becomes a **mission**.
2. **Gate 0, onboarding with Canon.** Canon interviews you, reads the client's uploads and repo, and drafts the plan through four checkpoints you approve: 0.1 brief, 0.2 breakdown, 0.3 mission and roster, 0.4 context. Finalizing is approval #1.
3. **The plan splits the work into modules.** M0 is the walking skeleton and locks the shared contracts. Code works out the order from each module's dependencies.
4. **Agents build each module in its own room.** Test writers go first; their tests must fail, then get locked. A builder makes them pass, and reviewers check the result. One piece of work is a **dispatch**; each try is an **attempt**.
5. **Work lands through serial integration commits,** one at a time, so the mission branch is always green.
6. **Gates 1 to 5 check it.** Gate 5 issues a hashed **receipt** with a verdict: verified, pass or fail.
7. **You release the exact commit the receipt names** (approval #2). It's delivered as a PR, a push or a zip.

When the factory needs you mid-mission, it opens a **proposal**: a parked module, a budget increase, a contract change and so on.

## Words used everywhere

| Term | Meaning |
| --- | --- |
| Mission | One client project, from onboarding to delivery |
| Module | One planned piece of the work, with its requirements, scenarios and checks |
| Dispatch | One role's job on a module: tests, build, review, or a mission-level review |
| Attempt | One try at a dispatch, in a fresh room, metered and capped |
| Room | The sandbox an attempt runs in: no model key, push access to its own branch only |
| Integration commit | How finished work lands on the mission branch, one at a time |
| Gate | A checkpoint the work must pass, 0 to 5 |
| Receipt | Gate 5's hashed record of what shipped; never changed once issued |
| Proposal | A decision the factory needs from you |
| Canon | The onboarding agent |
| Roster | Which agent fills each work kind and dispatch role |

## The backend in one page

- **One service with internal packages,** not microservices: 20 modules (`pipeline` is new with CR-W17, pending its design change), and each table has one owning module.
- **The data spine:** client, mission, plan, plan module, module run, dispatch, attempt, integration commit, gate evaluation, receipt, delivery. Every important row sits on that chain. Six branches hang off it: Canon, plan detail, judgment, cost, library and plumbing.
- **The database enforces the rules:** nothing is deleted (endings are state changes), plans are frozen once approved, stale writes get 409, and constraints carry the state rules. 96 tables and 553 rules, each with its own test.
- **Durable work:** Postgres jobs with 30-second claims and a reaper; a state change, its event and its follow-up job commit in one transaction; events get a strictly increasing `seq`.
- **Money:** every model call goes through the host model proxy, which reserves the maximum cost before sending and is the meter of record.
- **The API:** 119 routes in an oRPC contract, version 1.0.0. Every write needs an idempotency key, errors share one body, and password re-entry is only for credential actions. Events are 87 typed kinds named `<module>.<object>.<verb>`, and everything waiting on you is one list of 10 decision kinds.

The full walkthrough is in the doc "AVEL Backend System Explained".

## The stack (checked against the repo, Nov 12)

| Layer | What | In the repo today |
| --- | --- | --- |
| Runtime | Node 22.12 or later, pnpm and Turborepo | Yes |
| API | Hono with oRPC (`implement(contract)` under `/api`), Zod 4.6.7, oRPC 1.16.2 | The contract, yes; the server isn't started |
| Database | Postgres with Drizzle 0.45 and `pg` | Yes |
| Auth | Better Auth: email and password, passkeys later | Not yet (server) |
| Tests | Vitest against a real local Postgres; Playwright for the web | Yes |
| Web | TanStack Start, Router and Query, the oRPC TanStack Query client, React 19 with the React Compiler, Tailwind 4, Vite | Yes |
| Lint and format | Biome | Yes |
| Logging | Our own small JSON logger with request IDs; no Pino, no Redis | Not yet (server) |
| Rooms | Docker with gVisor now; MIOSA proposed (CR-22) | Not yet (Step 2) |

## The repo today

- **`packages/contract`:** version 1.0.0 on branch `feat/contract-cr-w1-w22`, not on main yet: 119 routes, the DTOs, value lists, the error catalog, the event catalog, the plain-text templates and 163 tests. Main still has the 102-route 0.0.0.
- **`packages/contract-mock`:** the same contract served with mock data, so the web works before the server exists. With `world: true` it serves the control room's sample world (Fleet portal, Spring launch site, Booking fix, Field app, Parts catalogue, Control room).
- **`packages/db`:** the Drizzle schema (rebuilt by CR-19 with every accepted change applied), migrations 0000 to 0003 with down files, and 652 tests: one per database rule (553), plus the migration, map, value-list and trigger tests.
- **`apps/web`:** the shell route only so far. UI contracts written for the shell layout, login, the decisions approval page and the design kit v1.9. Its Decisions module still reads the Step 1 row, so 39 of its 197 tests fail on contract 1.0.0 until it moves to the new union.
- **Generated docs:** `docs/generated/erd.md` and `openapi.json` (version 1.0.0, 119 operations) follow the code; the DATABASE.md drift check passes.
- **Not started:** `packages/server`.
- **History:** 399 commits from Nov 4 to Nov 8. About 59 were code, about 194 were records and 77 were merges. The build rules in the change package stop that from happening again.

## Build order and where we are

| Step | What | Status |
| --- | --- | --- |
| 0 | Contract and schema from the docs | Done |
| 1 | Scaffold: server shell, middleware, idempotency, Better Auth, step-up, CLI login, jobs, events, sample route | In progress (backend sprint 1, frontend sprint 2); contract 1.0.0 decided |
| 2 | Rooms, the model proxy, the egress proxy, git credentials | Next |
| 3 | Gate parity: `decide()`, receipts, rules, `avel check` | |
| 4 | Runner, harness, delivery and secrets | |
| 5 | Events and the CLI | |
| 6 | Plan, roster, packages | |
| 7 | Gate 0 with Canon | |
| 8 | Render, Gate 1, budgets | |
| 9a to 9c | Tests pipeline and integrator; scheduler and retry ladder; Gate 4, fixes and rework | |
| 10 | Receipts and margin | |
| 11 | The web app | |
| 12 | Skills, knowledge, rules, templates | |
| 13 | Dry run on our own code | |
| 14 | First real mission | |

## Where the truth lives

1. **The code:** the Drizzle schema in `packages/db` and the contract in `packages/contract`. Generated docs (`docs/generated/erd.md`, `openapi.json`) follow them.
2. **Accepted change requests,** which override the design docs.
3. **The frozen design docs (v0.6):** Design Main, Canon Onboarding, the Sandbox doc, DATABASE.md.
4. **The plans:** the Step 0/1 plan, Jobs and workers, the Port inventory, the backend build plan.

**The repo's `docs/design/` is newer than this project's copies.** The project's DATABASE.md and "Overview.md" (the API reference overview) are the Nov 1 versions, and the project's docs index stops at CR-16. Sync the project from the repo, not the other way round.

## Change requests

| CR | What | Status |
| --- | --- | --- |
| CR-1 to CR-13 | Secrets to Step 4, Cost domain, host undecided, model-agnostic, claims, teams, sharper task doc, project kinds and others | Accepted Nov 2 |
| CR-14 | CLI conventions | Proposed |
| CR-15 | Module owners for every table | Proposed (its item 8, entity event names, is superseded by CR-W10) |
| CR-16 | The dispatch package (routes 100 to 102) | Accepted Nov 6 |
| CR-17 | Agent access to the CLI | Proposed |
| CR-18 | Rep columns removed | Accepted Nov 5 |
| CR-19 | Schema rebuilt from the database map | Accepted |
| CR-20 | The mission name | Built in contract 1.0.0 |
| CR-W1 to CR-W22 | The web's contract changes: event catalog and names, decisions union, plain text, mission summaries and status, Canon streaming, proof files, module runs, template authoring, pipeline, client or template | Decided Nov 12 and built in contract 1.0.0 (see "Contract response to CR-W1 to W22"); on the branch, not on main |
| CR-21 | Shell-first M0, with a time budget | Proposed Nov 9 |
| CR-22 | Rooms on MIOSA, with checks inside the room | Proposed Nov 9 |
| CR-23 | Canon build kit and the contract map | Proposed Nov 9 |
| CR-24 | Schema batch: provider IDs, finding signatures, price row, notifications, backup GitHub check | Proposed Nov 9 |
| CR-25 | Inbox, public receipt, previews, lessons to rules (margin withdrawn by CR-W20; mission to template covered by CR-W21) | Proposed Nov 9 |
| CR-26 | Retro, the reverse-engineering agent | Proposed Nov 9 |
| CR-27 | The event catalog | Covered by CR-W1 and CR-W10 (87 kinds); no separate CR needed |

## How the factory itself is built

You are the operator. OSA runs the cycle for you: it prepares, you decide, and it may merge only clear and clean PRs (CR-36). Axis leads backend and Zero leads frontend, each with a builder and a checker: Soap and Rigg, Fantem and Fenn. Zane is an optional security reviewer for full-rigor PRs. The checker writes each ticket's acceptance tests first, and they must fail on `main`; the builder makes them pass; the checker reviews. Work runs in cycles of plan, tests, build, check, review and merge, one dispatch per fresh session, with at most two review rounds and only P0 and P1 findings blocking. Full-rigor PRs get three reviews and you merge them. The rules are `Build rules.md` (version 3, which replaces the team in `AVEL agent system.md`), with `Agents, identities and system prompts.md` and `Build roster and environment.md`.

## What's next

1. Push `feat/contract-cr-w1-w22` and merge it with the web's Decisions migration, so main's tests stay green.
2. Apply the design changes contract 1.0.0 needs: `pipeline` as a module, CR-W10's event names in the Frontend Map, the 10 decision kinds in Design Main, Q-0.1a and Q-0.1b in the Canon doc.
3. Decide on CR-21 to CR-26 (the checklist is in the change package).
4. Update the project instructions (leases are claims now, KMS moved to Step 4, 119 routes, 652 db tests).
5. Finish Step 1, then Step 2 (rooms), with the room host and MIOSA's open questions settled.

## Related docs

- **AVEL Backend System Explained:** the backend walkthrough, weak spots and the Orchestrator study.
- **AVEL change package, Nov 9:** CR-21 to CR-26, the build rules and your decisions.
- **Shell page data map:** each shell page's routes, fields, states and gaps.
- **`claude/API routes.md`:** all 119 routes of contract 1.0.0, numbered, with what's withdrawn and what's proposed.
- **`claude/Contract response to CR-W1 to W22.md`:** every web CR's verdict, the conflicts, the migration and what the web must change.
- **DATABASE.md in the repo** (`docs/design/DATABASE.md`): the data model's reasoning and every table.
