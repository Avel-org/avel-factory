# AVEL factory docs: start here

Nov 14, 2026 · @javaris · replaces "Docs index and alignment" (Nov 4, updated Nov 12)

These are the design docs for the AVEL software factory (`avel-factory`). This page says what each doc is, which one wins when two disagree, and where the frozen docs are out of date. The frozen design docs are verbatim copies; nothing in them was edited.

## Where things stand (Nov 13)

- **Contract 1.0.0** is decided and built: 119 routes, 87 event kinds named `<module>.<object>.<verb>`, one pending-decisions union of 10 kinds. Every verdict is in `Contract response to CR-W1 to W22.md`; every route is in `API routes.md`.
- **The database:** 96 tables, migrations 0000 to 0003, 553 rules with one test each (652 `db` tests in all). `DATABASE.md` here matches the schema; the drift check passes.
- **Step 0 is done. Step 1 (the server) is next.** Per CR-30 (accepted Nov 13), it's written in Effect 4, starts with spike 1 (folded into the first cycle's T-B1, Nov 16), and tests DBOS before the jobs engine. Per CR-31, it has no sample route and no approval page.
- **The repo is new.** The code comes from the 1.0.0 source export (`packages/contract`, `packages/contract-mock`, `packages/db`, `tools/docs`). The old `Avel-org/avel-factory` main is the 0.0.0 contract and isn't a source.

## Reading order

1. This page.
2. `Change requests CR-1 to 13.md`, then the CRs below. Read the CRs before the design, because they change it.
3. `Design v0.6 Main.md`.
4. `DATABASE.md` for the reasoning and every table.
5. `Step 0 and Step 1 plan.md`, `Jobs and workers.md` and `CR-30 Effect in the server, durable jobs and spans.md` for the first build steps.
6. `Backend modules and build plan.md` for where each table and module lives, and `Port inventory.md` for what moves from avel-server.
7. `Canon onboarding v0.5.md` when you reach Steps 6–7, and `Sandbox - Docker now, boat or MIOSA next.md` for Step 2.
8. `Build rules.md` and `Agents, identities and system prompts.md` before your first ticket. `Roster.md`, `Factory records.md` and `AVEL agent system.md` when you run dispatches or set up sessions.

## Which doc wins

1. **What exists in code.** Tables, columns and CHECKs: the Drizzle schema in `packages/db`. Routes, DTOs, enums, error codes and event kinds: the contract in `packages/contract`. `docs/generated/erd.md` and `openapi.json` follow them.
2. **Accepted change requests** override every design doc. Within them, the later decision wins.
3. **The frozen design docs (v0.6):** Design Main for the factory, Canon for Gate 0, DATABASE.md over the Canon doc's appendix tables.
4. **The plans** (the Step 0 and Step 1 plan, Jobs and workers, the Port inventory, the backend build plan) say how to build. They follow 1 to 3.
5. **Proposed changes aren't in force.**

If code and a doc disagree on something this page doesn't cover, don't pick one. Raise a change request: what, why, and which doc and table it touches.

## The docs

| Doc | What it is | Status |
| --- | --- | --- |
| `Design v0.6 Main.md` | The factory design: decisions log, modules, data flow, dispatch, cost control, live view, factory as code, knowledge, skills, evals, stack, API routes, build order | Frozen v0.6 (the project names it "Design v0.1") |
| `Canon onboarding v0.5.md` | Gate 0 in detail: stages, checkpoints 0.1–0.4, the rubric, the build spec | Frozen v0.5 (the project names it "v0.1") |
| `Sandbox - Docker now, boat or MIOSA next.md` | Rooms, isolation, the compute interface, cloud options | Frozen |
| `DATABASE.md` | The data model's reasoning and every table, link, CHECK, unique index and delete rule | Current; checked against the schema |
| `API routes.md` | All 119 routes, numbered, with what's withdrawn and proposed | Current |
| `API and data reference.md` | The API reference's overview: conventions and 8 review questions | Its counts (99 routes) are stale |
| `Schema vs DATABASE.md.md` | Nov 4 differences between DATABASE.md and the schema | Superseded by the drift check |
| `AVEL Database Map.html` | The Nov 1 database map that CR-19 rebuilt the schema from | Reference |
| `Project overview.md` | The project in one page: flow, terms, backend, stack, repo, build order, CRs | Nov 12 |
| `Step 0 and Step 1 plan.md` | Step 0 (contract and schema) and Step 1 (the scaffold), with their tests | Current: the CR-30 and CR-31 notes and the real docs commands |
| `Jobs and workers.md` | Jobs, claims, the reaper and event consumers | Current (event names follow CR-W10) |
| `Port inventory.md` | What moves from avel-server, and in which step | Current (CR-30 changes the clock, ids and logger to "with changes") |
| `Backend modules and build plan.md` | Build order, the module map with table owners, CR-15 | Current; `pipeline` is to be added as the 20th module |
| `Roster.md` | The agents inside missions: who fills each work kind and dispatch role | Accepted (CR-7 to CR-11) |
| `Roster setup and sessions.md` | Sessions and worktrees for building the factory itself | Superseded in part by `AVEL agent system.md` |
| `AVEL agent system.md` | Version 2 of how the factory itself is built: the principles, research and five numbers | Current (Nov 9); its team, review team and example timing are replaced by `Build rules.md` |
| `Build rules.md` | Version 3: the team that builds AVEL (Javaris, OSA, two leads, a builder and a checker each), the cycle, tickets, sessions, build, test, review, git, docs, security, cost and escalation rules | Current (Nov 15); with `docs/review/security-checklist.md` |
| `Build roster and environment.md` | The build team tab by tab in WezTerm (`tools/wezterm/avel.lua`), the outside accounts and services, and every key by step (`.env.example`) | Current (Nov 15) |
| `Agents, identities and system prompts.md` | The three layers every agent gets (identity, system prompt, dispatch), who gets which, and how they fit the dispatch system. The files: `.claude/agents/` (Soap, Rigg, Fantem, Fenn, Zane), `.agents/system/` (OSA, Axis, Zero), `.claude/commands/dispatch.md` | Current (Nov 15) |
| `Outside sources and what we took.md` | Every outside repo, library, spec and service we studied: what we took, its role, what we refused, and its CR | Current (Nov 14); update it in the same PR as any new outside source |
| `Factory records.md` | Task docs, completion reports, findings, escalations, `/dispatch` | Current |
| `Dispatch concept.md` | Your dispatch concept note | Reference |
| `Computer agents and MIOSA plan.md` | Agents on MIOSA sandboxes and desktops | Reference (Nov 5); CR-22 has the current proposal |
| `AVEL Web App — Frontend Map v0.6.md`, `AVEL Shell Layout brief v1.9.md`, `AVEL Enclosure Grid · Design library v1.9.html` | The frontend's map, shell brief and design library | The frontend session's docs; event names follow CR-W10 |
| `docs/ui-contracts/` | UI contracts: shell layout, login, decisions approval page, kit v1.9 | The frontend session's docs |
| `docs/ui-reference/control-room-prototype.html` | Javaris's standalone control-room prototype (added Nov 17): what `apps/web` recreates. A bundler page: the app is the JSON string in `<script type="__bundler/template">`, its sidebar is `const NAV`. Read it as data; don't run it in a dispatch | The target `apps/web` is checked against; the UI contracts and CRs win on details |
| `docs/ui-reference/control-room-handoff/` | The control-room prototype's handoff (added Nov 16): tokens, screens, components, port order, bottleneck audit, its CR notes. The `tools/…` scripts it names belong to the prototype and aren't in this repo | Reference for `apps/web`; the UI contracts and CRs win |
| `docs/ui-reference/control-room-design-fidelity.md` | The control room's design fidelity spec (added Nov 17): every design pass the prototype made, the rules on every screen, tokens, and measured values per shell piece, control and screen at 1440 and 360, light and night; the motion catalogue and the audits. Javaris: the source for every design-polish ticket | The target for design polish in `apps/web`; the UI contracts and CRs win |
| `docs/review/security-checklist.md`, `docs/quarantine.md` | The second review on full-rigor PRs (G7); quarantined tests, empty to start (F5) | Current |
| `docs/agent-dispatch/` | The vendored dispatch kit, AVEL's notes on it (`avel/`), and each lane's sprints | The v3 kit (Nov 16): `avel/dispatch-kit.md`'s banner, `avel/example-plan.toml` |
| `docs/agent-dispatch/archive/` | The old repo's sprint records (backend sprints 00 and 01, frontend sprints 01 and 02, Nov 4 to 9). The docs that cite `docs/agent-dispatch/<lane>/sprint-0N/…` for those sprints mean this folder | Record; never edited. New sprints restart at `sprint-01` in `backend/` and `frontend/` |
| `docs/generated/` | `erd.md` and `openapi.json` | Generated from code; never edited by hand |
| `docs/study/` | Study guides for the build team, one per system (the first: `Upload system.md`) | Follow their CRs; the CR wins if they disagree |

## Change requests

| CR | What | Status |
| --- | --- | --- |
| CR-1 to CR-13 | Secrets to Step 4, Cost domain, host undecided, model-agnostic, claims not leases, teams, sharper task doc, project kinds | Accepted Nov 2 (`Change requests CR-1 to 13.md`) |
| CR-14 | CLI conventions | Proposed |
| CR-15 | Module owners for every table | Proposed (in the backend build plan); item 8 superseded by CR-W10 |
| CR-16 | The dispatch package (routes 100 to 102) | Accepted Nov 6, in the contract |
| CR-17 | Agent access to the CLI | Proposed |
| CR-18 | Rep columns removed | Accepted Nov 5 |
| CR-19 | Schema rebuilt from the database map | Accepted |
| CR-20 | The mission name | Built in contract 1.0.0 |
| CR-21 | Shell-first M0, with a time budget | Proposed Nov 9 (in the Nov 9 change package, not in this folder) |
| CR-22 | Rooms on MIOSA, with checks inside the room | Proposed |
| CR-23 | Canon's complete build kit | Proposed |
| CR-24 to CR-26 | Schema batch; inbox, public receipt and previews; Retro | Proposed Nov 9 (in the change package, not in this folder) |
| CR-27 | The event catalog | Covered by CR-W1 and CR-W10 |
| CR-28 | The learning layer: lessons, proof and the quality radar | Proposed Nov 14 (skills step); the web side is CR-W24 |
| CR-29 | OSA as the operator agent | Decisions 1–3 and 5 made; decision 4 (the spend cap) open |
| CR-30 | Effect 4 in the server, the DBOS test, spans | Accepted Nov 13: Effect behind spike 1, the DBOS test; spans declined (stay "later"). Check 8 (a crash between a side effect and its save) added Nov 14. Nov 17: Effect adopted on spike 1's checks 1, 3 and 4 (T-B1); checks 2 and 5 due next cycle |
| CR-31 | Step 1 without the sample route and the approval page | Accepted Nov 13 |
| CR-32 | The skill library follows the Agent Skills spec | Accepted Nov 14: `allowed-tools` refused, `avel-` metadata keys (skills step) |
| CR-33 | Running several missions at once: shared slots, held-back rooms, proxy turns, cross-mission ranking | Accepted Nov 14 with every recommendation; nothing in Step 1 |
| CR-34 | One upload inbox: upload anywhere, filed to a client, mission, module, the Library or the repo; files kept by hash and listed on the receipt | Proposed Nov 15, revision 2 (22 gaps fixed); nothing in Step 1. Study guide: `docs/study/Upload system.md` |
| CR-35 | The context layer: the factory's memory across missions, packaged into each task doc at render and hashed; Postgres first, OptimalEngine on trial (spike 3) | Proposed Nov 15; nothing in Steps 1 to 7 |
| CR-36 | OSA may merge clear and clean PRs: CI green, standard rigor, no P0 or P1, no conflicts, squash with `Refs:`; not guardrail, contract, schema or lockfile PRs | Accepted Nov 16, with conditions 7 and 8 (`CR-36 OSA may merge clear and clean PRs.md`) |
| CR-37 | OSA and agents message each other, and messages can carry relayed instructions, logged outside git and listed in the report; interactive sessions get a turn limit | Accepted Nov 16 (`CR-37 OSA and agents message each other.md`); the turn-limit hook and `agent.sh` follow in a lead PR after the scaffold |
| CR-38 | A contract error code for defects (500) | Accepted Nov 17, Zero signed off (I3) (`CR-38 A contract error code for defects.md`); built in backend sprint-02 as T-B6 |
| CR-39 | Effect's language service on TypeScript 7: `@effect/tsgo` replaces `@effect/language-service`, run in the editor and CI | Accepted Nov 17, decisions 1 and 2 (`CR-39 Effect's language service on TypeScript 7.md`); built next cycle as backend T-B2 |
| CR-41 | OSA merges a PR Javaris approves in his own words in its session, with `scripts/agents/merge.py`; CI green, mergeable, `Refs:` and no hold still required; his words posted on the PR | Proposed Nov 18 (`CR-41 OSA merges with Javaris's approval.md`) |
| CR-W1 to CR-W22 | The web's contract changes | Decided Nov 12 and built in contract 1.0.0 |
| CR-W23 | TanStack DB in the control room | Proposed (frontend) |
| CR-W24 | The Learning screens | Proposed (frontend); reads CR-28 |
| CR-W29 | The control room comes from the design export: Javaris's control room JSX runs at `/` in apps/web with its sample world; the old shell goes; T-F5 dropped, T-F6, T-F3 and T-F4 withdrawn; temporary exceptions to E2, E4, E14 and E16 | Accepted Nov 17 (`CR-W29 The control room from the design export.md`); built in frontend sprints 07 to 10 as T-F7 to T-F10; the setup.css question is open |

## Known drift in the frozen docs

| Where | What it says | What wins |
| --- | --- | --- |
| Design Main, build order | No Step 0; KMS in Step 1; a sample route in Step 1 | Step 0 first (CR-12); KMS, secrets and repo connections in Step 4 (CR-1); no sample route or approval page (CR-31) |
| Design Main, stack | Plain TypeScript server internals | Effect 4 inside `packages/server`; Hono, oRPC 1.16.2, Zod, Drizzle and node-postgres stay (CR-30) |
| Design Main, Step 2; `compute`; decisions log | "The dedicated host" | Host undecided; isolation suite in CI (CR-3) |
| Design Main and plans | Leases, lease epochs | Claims, claim numbers (CR-6) |
| Design Main, model routing | Workers on the cheaper tier | Builders on Opus (CR-11, `Roster.md`) |
| Design Main, modules | 19 modules | 20: `pipeline` owns leads and follow-ups (CR-W17) |
| Design Main, API routes | 99 routes; `If-Match` versions; metrics and payments routes | 119 routes; versions in the body; metrics and payments withdrawn (no money in the control room, CR-W20) |
| Design Main, decisions | Proposals plus factory PRs | One list of 10 decision kinds (CR-W2) |
| Design Main, events | Entity event names (`mission.created`) | `<module>.<object>.<verb>`, 87 kinds (CR-W1, CR-W10) |
| Design Main, retry protocol | Retries start from "the module's start commit" | Test writers at `tests_base_commit`; builds and retries 2 and 3 at `build_base_commit` (schema) |
| Design Main, live view | "No progress for 10 minutes" | Stands: `StatusDto.stallAfterMs` is 600000 |
| Canon doc | Unit and integration tests to Nemi; 10 work kinds, 6 roles; 500,000-token cap | Fenn and Rigg; the CR-7 to CR-9 kinds and roles; the $4 attempt cap |
| Canon doc, interview | A text box; one kind of mission | Streaming replies and a question deck (CR-W19); Q-0.1a and Q-0.1b open every interview (CR-W22) |
| Sandbox doc | A dedicated host; one token per dispatch; the orchestrator moves the branch | Host undecided (CR-3); credentials per attempt; the integrator moves the branch |
| Port inventory | Clock, ids and logger "as-is" | "With changes": they become Effect services (CR-30) |
| Project instructions (not in this folder) | 99 routes; 35 tests; KMS and a sample route in Step 1; leases; `pnpm --filter @avel/db erd` and a contract review script | 119 routes; 652 `db` tests; KMS in Step 4; no sample route (CR-31); claims; `pnpm --filter @avel/docs generate` and `drift` (see `AGENTS.md`) |

## Decisions waiting on you

- CR-14, CR-15, CR-17, CR-21 to CR-23 (CR-24 to CR-26 are in the change package).
- CR-29 decision 4: the OSA spend cap.
- CR-30 decisions 4 and 5: where spans go once they're on; moving to oRPC 2 when it's stable.
- CR-W21: whether a passing proof check is required before Release (not required in 1.0.0).
- CR-W23 (frontend).
- CR-28 and CR-W24: the learning layer and its screens (CR-28 takes CR-24's finding signatures with it).
- CR-34: one upload inbox (11 decisions).
- CR-35: the context layer (8 decisions).
- The internal project for the live run, the host provider (Step 2), pricing for local models, the first real mission (Step 14).

## Retired files

Older docs name these. They belonged to the old repo's control room (the INT seat, crew sessions that stayed open, messages between sessions) and aren't in this repo. Nothing is waiting on them.

| File | Replaced by |
| --- | --- |
| `.claude/agents/int.md` | OSA (`.agents/system/osa.md`), and your own shell in the Ops tab |
| `scripts/tell.sh`, `scripts/watch.sh`, `scripts/events.py`, `scripts/dashboard.py`, `scripts/control-room.sh`, `scripts/worktrees.sh` | `tools/wezterm/avel.lua` (seats, switcher, badges), `scripts/hooks/session.py`, completion reports routed by OSA (L2) |
| `scripts/merge.sh`, `scripts/merge_board.py` | `scripts/dispatch.sh --status`; the lead squash-merges with `Refs: <ticket>` (H1 to H3) |
| `scripts/check_locks.py` | The lock check in CI (H6), still to write in T-B0; it reads the rendered task doc and `locks.md` |
| `scripts/doctor.sh` | OSA's "before planning" check (section M): `main` green, Postgres up |
| `scripts/lib/prices.json` | `price_table` in the database, from Step 2 (the model proxy) |

CR-37 (accepted Nov 16) brings back messages between sessions, but not `tell.sh`, `watch.sh` or `messages.md`: OSA and the agents use Claude Code's own session messaging, every message is logged in `<git common dir>/avel/messages/` outside git history, and each completion report lists the instructions it received. Nothing about messages is committed.

CR-17 (proposed) still names `check_locks.py`, `doctor.sh` and `events.py` in its allowlist. If it's accepted, that list is rewritten to the files above.

## Not in this folder

- **The After Canon tab** (state machines, jobs and events, gates, the retry ladder, rooms, release). The contract and schema stand in for it.
- **The Nov 9 change package** (CR-21, CR-24 to CR-26, and its build rules). Where its build rules and `Build rules.md` (Nov 15) overlap, `Build rules.md` wins. A rule found only in the package is added to `Build rules.md` through a PR.
- **`Agent operating procedures.md`**, superseded by `AVEL agent system.md`; it stays in the project as the sprint 00–01 evidence.
