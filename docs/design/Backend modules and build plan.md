# Backend modules and build plan

Nov 2, 2026 · @javaris

The build order with every accepted change request applied (CR-1 to CR-13; CR-14 is still proposed). Then a plan for building the factory with its own roster, how a dispatch moves through the modules, and a map of the 19 backend modules. The map is drawn from the design doc (Main: Modules, Build order), DATABASE.md, the Port inventory and `claude/Roster.md`. Where those docs leave something open, it's marked **proposed** and collected in CR-15 at the end.

## 1. Build order

| Step | What | Done when (short) | Changed by |
| --- | --- | --- | --- |
| 0 | **Sync:** one migration for the CR schema changes, the contract enums, the docs, the ERD and OpenAPI regenerated | The migration applies and reverses; the 35 `db` tests pass; the project-kind tests pass; the ERD drift check passes | CR-12, CR-13 |
| 1 | **Scaffold:** server shell, middleware, idempotency, Better Auth, step-up, CLI login, activity log, jobs, events, factory repo loader, webhook, sample route, minimal approval page, CI | The 14 tests in `docs/design/Step 0 and Step 1 plan.md` | CR-1 (no secrets), CR-6 (claims); auth decisions (Nov 5, section 8) |
| 2 | **Rooms:** gVisor rooms, the model proxy, the egress proxy, the package cache, the mission repo over HTTP with per-attempt git credentials, the credentials reaper, the upload parser, image builds. The host stays undecided. | The isolation suite passes in CI; a push outside the attempt's branch is refused; a killed attempt's token is revoked; an image build reaches only the package proxy | CR-3 |
| 3 | **Gate v4 parity:** `decide()`, producers, receipts, the rules registry, `avel check` v1 | Fixture missions give receipts identical to avel-server's | — |
| 4 | **Runner, harness, delivery, and secrets:** the Claude harness (first adapter), the host tool server, Gate 3 in a check room, KMS secrets, repo connections, the delivery worker, PR delivery | A hand-made task doc runs in a room and opens a PR from that exact commit; the main service can't decrypt a write token | CR-1, CR-5 |
| 5 | **Events and the CLI:** live and trace streams, `avel watch`, `doctor`, `link` with git hooks. The CLI and its TUI are built in their own repo, `avel-cli` (TypeScript + OpenTUI, decided Nov 4; CR-15 item 4) | A reconnect resumes with no gaps; a consumer never acts twice; a linked commit lands only on `operator/<mission>` | CR-14 (if accepted); CR-17 (proposed: agent access to the CLI) |
| 6 | **Plan, roster, packages** | Every validator refusal has a test; a roster change doesn't touch running missions | CR-7 to CR-9 (new work kinds and roles) |
| 7 | **Gate 0 with Canon:** per-kind briefing | Your internal project onboards end to end to an approved plan | CR-4, CR-13 |
| 8 | **Render, Gate 1, budgets** | Byte-identical renders; Gate 1's refusal list; `capped` and `budget_parked` | CR-10 (task doc) |
| 9a | **Tests pipeline, integrator, Gate 2** | Fail-first, flake check, scenario locking | — |
| 9b | **Scheduler, retry ladder, Gate 3** | A fixture plan runs to Gate 4 with no human action | CR-6 |
| 9c | **Gate 4, fixes, rework, `decide()` v5, refresh** | The v5 fixture table | — |
| 10 | **Receipts and margin:** metrics split by project kind | A fixture receipt shows cost by cache type and contribution margin | CR-13 |
| 11 | **The web app** | UI guard tests and interaction tests | CR-7 |
| 12 | **Skills, knowledge, rules, templates:** template delivery to `templates/<slug>` | A skill reaches a room only after its PR merges; client isolation for rules and knowledge | CR-13 |
| 13 | **Dry run on our own code** | An internal mission reaches a verified receipt and a PR | CR-13 |
| 14 | **First real mission** | Its measured numbers replace the estimates | — |

**The critical path:** 0 → 1 → 2 → 4 → 8 → 9a → 9b. The factory can't run work on its own until 9b. Step 3 needs only Step 1, and Steps 5, 6 and 7 can be built in parallel once their inputs exist (Step 5 needs 1; Step 6 needs 1; Step 7 needs 2 for the proxy and 6 for plans).

## 2. Building the factory with its own roster

The roster can't run *inside* the factory until the factory exists. So it moves in three phases, from you running the agents by hand to the factory building itself.

### Phase 1: the roster by hand (Steps 0 to 4)
You run the agents yourself in Claude Code, each one as a subagent (`.claude/agents/<name>.md` in `avel-factory`) with its role prompt from the roster. You stand in for the scheduler and the integrator. The factory's rules still apply:

1. **Axis slices the contract for the step.** The contract package already exists. Axis writes a short step contract: the routes, DTOs, errors and events this step implements, quoted from `packages/contract`, and the tables it touches from DATABASE.md. Brennan checks the slice against the design docs before anything else starts.
2. **Rigg writes the done-when tests first,** against real Postgres. They must fail. You commit them as a tests commit, and they're locked.
3. **Locking by hand:** a small CI check fails any build commit that changes a locked test path. That check is an early version of Gate 3's territory rule, and it carries into `avel check` later.
4. **The builder builds:** Soap, Iyo or Atlas, by work kind (see the module map). The builder works from a generated task doc with its activation built in (section 3), started with `/dispatch` or `scripts/dispatch.sh`. Nothing is pasted.
5. **Review:** Axis (`review-backend`), Brennan (`review-spec`, against the docs; this is your drift check), Zane where there's a security trigger, Leah where there's a performance trigger. Findings cite evidence.
6. **You integrate:** merge only when every locked test passes and every finding is routed.

**Where the work is logged:** in agent-dispatch's layout, `docs/agent-dispatch/sprint-NN/` in the repo, one sprint per build step: DISPATCH.md, the task docs, completion reports, red-team findings and the sprint assessment, from agent-dispatch's templates. The factory's extras (contract slice, findings, escalations, dependency requests, locks, decisions, cost) sit in the same folder, from `docs/agent-dispatch/avel/templates/` (the "Factory records" doc). Each file has the fields of the table it becomes, so Phase 1's records can later be imported as fixtures and replay data.

**What this buys:** the role prompts, the task doc format and the review rules are tested on real work before the factory depends on them. The subagent files become the roster's agent configs in the factory repo.

**Cost:** Phase 1 runs on your own Claude Code usage, outside the factory's meter. Record it by hand per step (Claude Code's `/cost`), so later steps have something to compare against.

### Phase 2: single dispatches in rooms (Steps 4 to 9a)
From Step 4, a hand-made task doc runs in a room under its caps. Use it to build the later steps' modules one dispatch at a time: the minimal renderer (CR-16) generates the task doc, the factory runs it in a room, Gate 3 judges it, and you merge. From Step 2 every model call goes through the proxy, so the cost is metered. From Step 8, budgets and the $4 cap apply.

### Phase 3: the factory builds itself (after 9b and Step 7)
Once Canon and the scheduler run, Steps 10, 11 and 12 can each be onboarded as an **internal** mission (CR-13) whose repo is `avel-factory`, delivered as a PR you review and merge. Step 11, the web app, is the natural first one: it gives the frontend team its first real work. Step 13's dry run can be one of these missions.

**Rules for self-building (proposed):**
- The factory running the mission is a pinned, deployed build. The mission changes the repo, never the running instance. A change goes live only when you merge its PR and deploy.
- Changes to the trust core (`gate`, `metering`, `integrator`, `compute`, auth and step-up) always count as security triggers: Zane reviews and Breach attacks, every time.
- You read every trust-core PR line by line before merging. Gate 5 shows the work passed its tests, not that the tests were the right ones.

### Who builds what in the factory backend
- **Soap** (`api`, `data`): routes, DTO mappers, schema and queries. Most modules have some.
- **Iyo** (`services`, `ai`): workers, the scheduler, the integrator, the model proxy, the harness, Canon.
- **Atlas** (`infra`, `docs`): rooms, gVisor, proxies, CI, AGENTS.md, generated docs.
- **Rigg:** tests on every backend module, plus load tests on the event stream and the jobs queue.
- **Breach:** attacks auth, idempotency and step-up (Step 1), room isolation (Step 2), the host tool server's tokens (Step 4) and the git endpoint (Step 5).
- **Axis, Brennan, Zane, Leah:** review, as above.
- **The frontend team** (Nemi, Zero, Fantem, Leon, Ghost, Fenn) has two jobs: the minimal approval page in Step 1, and the web app in Step 11.

## 3. Dispatch, end to end

Dispatch comes from **agent-dispatch** (`robertohluna/agent-dispatch`, MIT): DISPATCH.md, one task doc per agent with its activation prompt, chains and execution traces, territories, completion reports, the retry protocol, converge, and Gates 0–5. The factory keeps its documents and vocabulary with one change: **code generates them** from the approved plan, so you never write or paste a prompt. Your concept doc (`claude/Dispatch concept.md`) is the reference for how a dispatch runs; this section maps it onto the modules and the build.

### The dispatch package (what the factory generates)
For each mission, the renderer (`factory`, Step 8) produces agent-dispatch's files, byte-identical on every render and hashed:

| File | agent-dispatch template | Stored as |
| --- | --- | --- |
| `codebase-analysis.md` | playbook Phase 1 | `codebase_analysis` |
| `DISPATCH.md`: goals, conventions, traces, territory map, waves, merge order, success criteria | `templates/dispatch.md` | `mission_docs` |
| One task doc per dispatch, **activation built in** (its last section is the activation prompt; see CR-16 contract, Activation) | `templates/agent.md` plus `templates/activation.md` | `task_docs` |
| The completion report template for each dispatch | `templates/completion.md` plus the CR-10 sections | filled in as `completion_reports` |

**Starting an agent never takes a paste:**
- **In a room:** the runner mounts the package read-only and starts the agent on its own task doc. Nothing is typed.
- **On your machine:** `/dispatch sprint-01/agent-soap-platform` in Claude Code, or `scripts/dispatch.sh sprint-01` to make every agent's worktree and start each one in its own WezTerm tab (through `scripts/agent.sh`; see Roster setup and sessions, WezTerm layout). Any other tool takes the same one line: "Read <task doc> in full and follow it exactly."

**Where the package goes** (new, CR-16): inside the room (above), as a **zip download**, or **into the repo** under `docs/agent-dispatch/`. Work you or a local agent does from the zip or the repo comes back the way your own commits already do: pushed to `operator/<mission>`, landed by the integrator through Gate 2, and shown on the receipt as operator work.

**Dropped from agent-dispatch** (Oct 31 decision): the intensity protocol and the mesh-mode keywords. Waves aren't waited for (a module starts when its own dependencies land), and LEAD's merging is the integrator's job.

### How a dispatch runs (from the concept doc)
- **The chain:** mission → module run → dispatch → attempt → integration commit. Mission-level reviews are dispatches with no module run.
- **Who starts it:** code, never a model. The scheduler starts it when its module's dependencies have landed, the budget covers it, and one of the 6 slots is free. You step in only through a logged override (`origin = 'override'`).
- **States:** `pending` → `ready` → `starting` → `running` → `reporting` → `succeeded` or `failed`. Side states: `waiting_dependency`, `blocked_on_you`, `parked` (with `parked_from`) and `cancelled`. Every change writes its event (`dispatch.ready`, `dispatch.started`, `dispatch.parked`, `attempt.started`, `attempt.ended`) in the same transaction.
- **Attempts:**
  - kinds: `initial`, `retry_1` to `retry_3`, `fix`, `rework`, `resume`, `infra_restart`;
  - outcomes: `passed`, `failed`, `capped`, `budget_parked`, `killed`, `crashed`, `infra_lost`;
  - caps: $4 and 60 minutes each;
  - the ladder applies before landing and rework after; `infra_lost`, `resume` and `infra_restart` are free.
- **Room and credentials:** one fresh room per attempt. The attempt pushes only `mission/<id>/<module>/<role>-a<n>`. Its tokens last the cap plus 10 minutes, and the reaper revokes them when the attempt ends.
- **Host tool server:** reports, findings (reviewers only), dependency requests (at most 3 new packages per dispatch), escalations, progress notes, `kb-search`.
- **Gate 3,** per role, in a fresh check room.

### Its life, module by module

| # | What happens | Module | Built in |
| --- | --- | --- | --- |
| 1 | Finalize writes the plan; the outbox row triggers the render | `onboarding` → `plan` | 6, 7 |
| 2 | The dispatch package is rendered and hashed; Gate 1 checks it's complete and fits the budgets | `factory` | 8 (a minimal renderer earlier; see CR-16) |
| 3 | A dispatch becomes `ready` once its tests are locked and its dependencies have landed | `factory`, `integrator` (locks) | 9a, 9b |
| 4 | The scheduler claims it, reserves its expected cost, and starts it if a slot is free | `factory`, `metering` | 8, 9b |
| 5 | `startDispatch`: a fresh room, the package mounted, credentials minted, identity and task-doc hash frozen | `runner`, `compute` | 2, 4 |
| 6 | The agent works: model calls through the proxy (metered and capped), tools through the host tool server, traces and events streamed | `harness`, `metering`, `events` | 2, 4, 5 |
| 7 | It files its completion report; the room is destroyed and its credentials revoked | `runner`, `compute` | 4 |
| 8 | Gate 3 judges it by role in a fresh check room | `runner`, `gate` | 4 (hand-written lock manifest), 9b |
| 9 | **Passed:** an integration commit, Gate 2, landed. **Failed:** the next ladder step. **Parked:** a proposal to you. | `integrator`, `factory` | 9a, 9b |
| 10 | Review findings: a fix attempt before landing, rework after | `factory` | 9c |
| 11 | Overrides: start, retry, park or cancel by hand, with a reason | `factory`, `audit` | 9b |

**Routes:** `GET /api/missions/{missionId}/dispatches`, `GET /api/dispatches/{dispatchId}`, `POST /api/dispatches/{dispatchId}/overrides`, plus CR-16's package download. Starting, retrying and integrating are never routes.

### Dispatch while building the factory
- **Phase 1 (Steps 0–4):** each build step is an agent-dispatch sprint in `docs/agent-dispatch/sprint-NN/` in `avel-factory`. The package is generated, not hand-written: until Step 8's renderer exists, a minimal renderer (CR-16) fills the same templates from the step's plan. You approve the plan (Gate 0), then `scripts/dispatch.sh sprint-NN` starts the agents. You still stand in for the scheduler, the integrator and Gate 3.
- **Phase 2 (Step 4 on):** rooms run the generated task docs; Gate 3 judges them.
- **Phase 3 (after 9b):** all of it runs as code.

## 4. Module map

19 modules, in one service (`packages/server`). Other packages: `contract` and `db`, plus the web app in `apps/web` and `packages/contract-mock` (Frontend Map v0.6). The CLI client is its own repo, `avel-cli` (CR-15 item 4). **Proposed layout:** one folder per module, `packages/server/src/modules/<name>/`, each with an `index.ts` as its only public entry. An import rule refuses reaching into another module's internals, and another refuses writing a table the module doesn't own.

Table owners below are **proposed**: DATABASE.md says each table has exactly one owning module, but it doesn't list them (CR-15).

### Foundation (Steps 1 and 5)

| Module | Owns (tables) | Built in | Port | Builder | Tests | Review |
| --- | --- | --- | --- | --- | --- | --- |
| `contract` (server side): shell, middleware, errors, idempotency, auth, step-up, rate limits, the jobs runtime | Better Auth's tables, `cli_sessions`, `step_up_grants`, `idempotency_keys`, `webhook_deliveries`, `jobs` (also the factory repo loader, which owns no table) | 1 | Pure libraries as-is; errors, middleware, DB core and auth with changes | Soap; Iyo for the jobs runtime | Rigg; Breach | Axis, Zane, Brennan |
| `events` | `events`, `consumer_cursors`, `agent_traces` | 1 (writes), 5 (streams) | New | Iyo | Rigg (resume, load) | Axis, Leah |
| `audit` | `activity_log`, `overrides` | 1 | Activity log with changes | Soap | Rigg | Axis |
| `cli` (server side: device login and operator events; the client is the `avel-cli` repo) | none | 1 (login), 5 | Auth's device login with changes | Ghost (proposed, CR-15) | Rigg | Axis, Zane |

### Intake and planning (Steps 6 and 7)

| Module | Owns | Built in | Port | Builder | Tests | Review |
| --- | --- | --- | --- | --- | --- | --- |
| `onboarding` (Canon, Gate 0) | `clients`, `onboarding_sessions`, `messages`, `uploads`, `facts`, `questions`, `topic_coverage`, `checkpoints`, `checkpoint_facts`, `rubric_results`, `context_refs`, `usage_log` | 1 (`clients`), 7 | Clients, Drive, document parsing and the citation check with changes; the Canon loop as reference | Iyo (Canon), Soap (tables, routes) | Rigg | Axis, Brennan, Zane (uploads) |
| `packages` | `packages` | 6 | New | Soap | Rigg | Axis |
| `plan` | `plans`, `codebase_analysis`, `plan_modules`, `plan_module_deps`, `requirements`, `scenarios`, `scenario_modules`, `checks`, `module_checks`, `quality_targets` | 6 | Plan checks and repo read with changes | Soap | Rigg | Axis, Brennan |
| `roster` | none (it lives in the factory repo) | 6 | Roles as reference (no work grades itself) | Soap | Rigg | Brennan |

### Running the work (Steps 2, 4, 8 and 9)

| Module | Owns | Built in | Port | Builder | Tests | Review |
| --- | --- | --- | --- | --- | --- | --- |
| `factory` (render, Gate 1, scheduler, ladder, rework, proposals) | `missions` (proposed), `module_runs`, `dispatches`, `task_docs`, `mission_docs`, `outbox`, `findings` (proposed), `proposals`, `notes` | 8, 9b, 9c | Runner orchestration and the brief renderer as reference; hashing as-is | Iyo; Soap for the routes | Rigg | Axis, Brennan, Leah |
| `integrator` | `integration_commits`, `test_locks`, `locked_scripts`, `dependency_requests`, `quarantines`; moves `missions.branch_head` (an exception in DATABASE.md) | 9a | Integration planner with changes | Iyo | Rigg | Axis, Zane, Leah |
| `runner` | `attempts`, `skill_loads`, `completion_reports` (in the dispatch concept; missing from DATABASE.md, CR-15) | 4, 9b | Budget, the check runner and room primitives with changes | Iyo | Rigg | Axis, Zane |
| `harness` | none | 4 | Harness interface and the SDK harness with changes; the adapter interface is new (CR-5) | Iyo | Rigg (fake harness) | Axis, Zane |
| `compute` (rooms, proxies, git credentials) | `rooms`, `credentials` | 2 | Agent rooms, worktrees and room primitives with changes | Atlas | Rigg; Breach (isolation) | Axis, Zane |
| `metering` (model proxy, reservations, prices, your minutes) | `budget_reservations`, `price_table`, `human_time`, `payments`; writes `reserved_micros` and `spent_micros` (an exception in DATABASE.md) | 2 (proxy), 8, 10 | Token usage and prices with changes (split cache writes) | Iyo (proxy), Soap (tables) | Rigg (parallel overspend) | Axis, Zane |

### Judging and shipping (Steps 3, 4, 9c and 10)

| Module | Owns | Built in | Port | Builder | Tests | Review |
| --- | --- | --- | --- | --- | --- | --- |
| `gate` | `gate_evaluations`, `gate_runs`, `receipts`, `pass_approvals` | 3, 9c | `decide()` v4, producers, receipt and the gate unit suite with changes | Soap | Rigg (parity suite) | Axis, Brennan, Zane |
| `delivery` (a separate worker process) | `deliveries`, `repo_connections`, `secrets` (proposed) | 4 | Guards, export, the GitHub writer and the webhook signature check with changes | Iyo | Rigg; Breach (token scope) | Axis, Zane |

### Library (Steps 3 and 12)

| Module | Owns | Built in | Port | Builder | Tests | Review |
| --- | --- | --- | --- | --- | --- | --- |
| `rules` | `rules`, `rules_versions`, `rules_version_rules` | 3 (`avel check` v1), 12 | New | Soap | Rigg | Axis, Brennan |
| `knowledge` (also the factory repo routes: versions, changes, merges) | `factory_versions`, `skills`, `kb_entries`, `kb_releases`, `kb_release_entries`, `templates`, `closeout_items` | 1 (`factory_versions` and the merge webhook), 12 | The skills system with changes | Soap | Rigg | Axis, Zane (client isolation) |
| `evals` | `agent_configs`, `eval_tasks`, `eval_runs`, `eval_results` | Later | New | — | — | — |

### How the modules depend on each other

- **Everything** depends on `contract` and `events`. A state change, its event and its follow-up job are written in one transaction.
- `onboarding` → `plan` (finalize writes the plan) → `factory` (render).
- `factory` → `runner` → `harness` and `compute`; `runner` → `metering` (reservations), and every model call goes through the proxy.
- `factory` → `integrator` (a finished module) → `gate` (Gate 2 results, then Gate 5).
- `gate` → `delivery` (the released receipt).
- `rules` and `knowledge` feed `factory` (task docs) and `gate` (`avel check`).
- `audit` is written by every module that takes an override or a write from you.

## 5. CR-15: module owners and slots (proposed)

- **What:**
  1. Add an owner column to every table in DATABASE.md, using the proposed owners above, and a test that a module writes only tables it owns (plus the two listed exceptions).
  2. Settle the owners the docs leave open:
     - `missions` → `factory`, since the mission's state moves through the whole lifecycle;
     - `findings` → `factory`, which routes them;
     - `secrets` → `delivery` (alternative: its own small module);
     - `factory_versions` and the factory repo routes (`/api/factory/versions`, `/changes`, `/merges`) → `knowledge`, where DATABASE.md's Library domain already puts the table. This matches Frontend Map v0.6. The loader that reads `factory.yaml` at a commit is a `platform` utility with no table;
     - `jobs` → `platform`;
     - `clients` → `onboarding` and `repo_connections` → `delivery`, as the Port inventory says ("Clients and connections → onboarding, delivery"). They're inside the 19, not outside. The web's front-end-only `clients` module is fine as a screen that reads from both.
  3. Name the server side of `contract` in the docs. The Port inventory puts the shell, middleware and auth under `contract`, which is easy to confuse with the `packages/contract` package. Proposed name: `platform`.
  4. Give the CLI a roster slot, in its own repo (**decided Nov 4**): the CLI and its TUI (`avel watch`, `avel doctor`, `avel link`, device login) live in a separate repo, `avel-cli`, built in TypeScript with OpenTUI. Ghost builds it, Rigg tests it, Axis reviews it, with Zane for credentials. The server's `cli` module (device login, operator events) stays in `packages/server`.
     - **The contract:** `avel-cli` builds from a vendored copy of `packages/contract`, synced by a `contract:sync` script, with a test that fails while the copy and the factory's differ (the pattern avel-web uses with avel-server). It uses the same typed oRPC client as the web app.
     - **Its rules:** its own CI, the same locked-test check (`scripts/check_locks.py`) and a territory check. A contract change lands in avel-factory first, then syncs.
     - **Phase 1 input:** until Step 5's stream exists, `avel watch` reads the factory's Phase 1 event log (`docs/agent-dispatch/records/events.jsonl`, same event shape and `seq`), so the TUI can be built and used now. See `docs/agent-dispatch/avel/operator-tools.md`, "Handoff to avel-cli".
     - **Why a separate repo:** the TUI ships on its own schedule, and a client that works only through the contract proves the contract is enough.
  5. Adopt the folder-per-module layout and the two import rules above.
  6. **DATABASE.md is behind the dispatch concept.** Your concept doc lists `completion_reports` as a table and `parked_from` on dispatches; DATABASE.md has neither. If the repo's schema has them (likely), DATABASE.md is stale: add both to it, with `completion_reports` owned by `runner`. If the repo doesn't, they're missing from the schema.
  7. Progress notes (`POST /api/agent/progress-notes`) have no table. Proposed: store them as `agent_traces` rows with a new kind, `progress`, unless the repo already does something else.
  8. **Backend answer to the front end's CR-W10 (event names):** keep the entity names (`mission.created`, `pass.approved`, `usage.recorded`) and add an owner to each event in the contract instead: one exhaustive map from event kind to owning module, exported from `packages/contract`. A new event kind won't compile until it has an owner, which gives the web the same split, checked by the compiler.
     - **Why not rename:** event kinds are stored for good in an append-only log and replayed for 30 days. Module owners are still being settled here, so a name tied to a module would mean renaming stored events whenever ownership moves.
     - **If you'd rather rename,** do it in Step 0, before any event is written.
- **Why:** "each table has one owning module" is an architecture rule, but nothing lists the owners, so neither code nor a test can check it.
- **Touches:** DATABASE.md (Ownership, plus `completion_reports` and the `agent_traces.kind` CHECK), the design doc Main (Modules), `claude/Roster.md` (the CLI slot), and the repo layout of `packages/server`. Schema: a new `completion_reports` table if the repo doesn't already have one, and one new `agent_traces` kind.

## 6. CR-16: the dispatch package (proposed)

- **What:**
  1. **One renderer, three destinations.** The renderer writes the agent-dispatch package (`codebase-analysis.md`, `DISPATCH.md`, one task doc per dispatch with its activation built in, the completion templates). The same bytes and hashes go to:
     - **the room:** mounted read-only at a fixed path, outside the clone, the way skills are mounted at `/avel/skills`; the runner starts the agent on its task doc;
     - **a zip:** a new route, `GET /api/missions/{missionId}/dispatch-package`, so you can run the agents yourself (Claude Code, Codex, Cursor) with `/dispatch` or `scripts/dispatch.sh`;
     - **the repo:** under `docs/agent-dispatch/<mission-slug>/`, landed on the mission branch by the integrator like any other change.
  2. **Work done outside the rooms** goes through `operator/<mission>`, lands through Gate 2, and shows on the receipt as operator work. That's the path your own commits already take, so the trust rules don't change.
  3. **A minimal renderer comes early (Step 0)** so Phase 1 is generated, not hand-written. It's a script that fills the same templates from a short plan file per build step. Step 8 hardens it into the real renderer: byte-identical output, the golden tests, Gate 1.
  4. **The repo ships its kit:** `docs/agent-dispatch/` (the framework, vendored with its MIT licence and the commit it came from, plus `avel/` for the factory's changes), `.claude/commands/dispatch.md`, and `scripts/dispatch.sh`.
- **Why:** you said dispatch should be generated from the factory into the project repo or a zip, so you never paste prompts. The design already has code rendering the task docs with the activation built in, but it never says where the files go beyond the database and the room.
- **Decision for you: client repos.** Should a client mission's delivered PR include `docs/agent-dispatch/<mission>/`?
  - **Recommended: no.** Strip it from client deliveries by default (the receipt is the proof), offer it as the zip, and keep it in the repo for internal and template missions.
  - **Alternative:** keep it in the client's repo too, if you want clients to see the plan.
- **Touches:**
  - design doc Main: Dispatch (where the package goes), API routes (three new routes, 102 in total; see the CR-16 contract), delivery (what's stripped), build order (the Step 0 renderer);
  - Sandbox doc: the mount path in the room;
  - contract: the new route;
  - no new tables (`mission_docs` and `task_docs` already hold it).

## 7. Conflicts between your dispatch concept and the docs

Your concept doc says the docs win and to flag conflicts. Here they are:

| Concept doc says | The docs say | Which wins |
| --- | --- | --- |
| Roles: `build`, `test-unit`, `test-e2e`, `review-spec`, `review-security`, `red-team` | CR-7 to CR-9 (accepted Nov 2) add `ui-contract`, `api-contract`, `review-frontend`, `review-backend` and `review-a11y-perf` | The change requests (later decisions). The concept doc's role list needs those five. |
| `completion_reports` table, `dispatches.parked_from` | Not in DATABASE.md | Probably the repo. DATABASE.md looks stale (CR-15 item 6). |
| Retries 2 and 3 start from "the module's build base commit" | The design says "the module's start commit" | Likely the same commit under two names. Worth confirming against After Canon. |
| Gate 3 for a build: `avel check` and the locked tests pass | The design also checks that the completion report exists, the verification commands give the expected output, and only owned files changed | The design: it adds checks and contradicts nothing, so the concept doc is a short version. |
| At most 3 new packages per dispatch; tokens last the cap plus 10 minutes | Not in the docs I have | Probably from After Canon or the contract. Fine to keep. |

## 8. Auth decisions (Nov 5)

Step 1 starts with authentication and builds inwards. Nothing here is built yet; this section prepares the step.

**Decided:**
- **One operator.** AVEL has a single human user: you. There are no orgs, teams or roles for people. Sign-up is off: the seed script creates your account (and AVEL's internal client, CR-13). Every activity row, override and approval still records the operator's user id, so adding a second person later is a migration, not a redesign.
- **A password, for now.** Sign-in is email and password, and step-up is your password again. Step-up guards secrets, repo connections and CLI login approval, and never approvals of work. A grant is single-use, for one action on one target, bound to the session, lasts 5 minutes and is written to `step_up_grants`.
  - **The password never goes in the repo,** a doc, a task doc or a test fixture. The seed reads it from an environment variable on the host (`AVEL_OPERATOR_PASSWORD`), and tests use their own throwaway value.
  - **Its strength is a config value:** Better Auth's minimum length (8 by default) applies unless it's changed on purpose. Lockout (10 failures in 15 minutes) and the sign-in rate limit (5 a minute) back it up.
- **Passkeys later.** Deferred, not dropped: Better Auth's passkey table stays in the schema, unused in Step 1. Moving step-up, then sign-in, to passkeys is a later change request.

**Proposed, following from those:**
- **Identities, all defined in Step 1:** operator (web session or CLI session), agent (attempt token, CR-17) and runner. Agent and runner resolve to "refused" until Steps 2 and 4 issue their tokens, so the policy layer exists before any module does.
- **Policy from day one:** every route carries a policy tag, untagged routes refuse non-operators, and a contract test fails on an untagged route (CR-17).

**The order inside Step 1, outside in:**
1. The contract's base error map, including `STEP_UP_REQUIRED` (CR-W6), `AGENT_NOT_PERMITTED` and `AGENT_SCOPE`; the DB core.
2. The `platform` shell: Hono and the oRPC implementer, request IDs, errors, idempotency, rate limits on the named routes.
3. Identity: the operator seed, password sign-in with lockout, sessions, password step-up, CLI device login (`cli_sessions`, approved at `/cli/approve/$userCode` with step-up).
4. Policy: route tags, the default deny, the untagged-route test.
5. Audit and events: every operator write and override goes to `activity_log` with its event, in one transaction.
6. Outwards: jobs, the factory repo loader, the webhook, the sample route, the minimal approval page.

**Breach's Step 1 attacks:** session fixation, cookie theft across origins, replaying an idempotency key with a different body, brute-forcing the password past the lockout and rate limit, reusing or extending a step-up grant, a step-up grant from one session used in another, racing two approvals of the same device code, brute-forcing a user code, and signing up a second operator after bootstrap.

**Inputs now in `docs/design/`** (added Nov 5): DATABASE.md, the API and data reference, the Step 0 and Step 1 plan, Jobs and workers, Canon onboarding v0.5 and the Sandbox doc. Still not in the repo: `packages/contract` and the `db` schema (code), the design doc Main, the Port inventory, `claude/Change requests.md`, `claude/Roster.md` and the After Canon tab.

**Aligned on Nov 5** (every doc in `docs/design/` now says the same thing):
- **Auth:** one operator; email and password for sign-in and step-up; passkeys later. Changed in the Step 1 plan, the API reference, Canon's rule 9, Frontend Map v0.6 and CR-17. The design library's step-up dialog already asks for a password.
- **Better Auth's table names:** `auth_sessions`, `auth_accounts`, `auth_verifications` and `auth_passkeys`, as the Step 1 plan says the existing schema has them (the adapter maps the names). DATABASE.md now uses them too.
- **`device_logins`** is now in DATABASE.md (Plumbing), owned by `cli`: a CLI login waiting for approval, before its `cli_sessions` row exists.
- **CR-17's attempt token is a `credentials` row** (kind `dispatch`, hashed, `revoked_at`), so CR-17 needs no new table. CR-17 now says so.
- **Reps:** removed by CR-18 (accepted Nov 5, below).
- **The Canon doc (Oct 30) predates the current roster:** it says there is no Atlas and routes unit tests to Nemi. Roster setup and sessions (Nov 4) wins; the Canon doc carries a note saying so.

**Still open:** Step 0 comes first. Its migration and contract release are Step 1's inputs, and CR-18 (accepted) adds to both.

**Touches:** the design doc Main (auth), DATABASE.md (`device_logins`, Better Auth's table names), the contract (error codes, CR-18) and Frontend Map v0.6 (sign-in and step-up).

## 9. CR-18: one operator in the contract (accepted Nov 5)

- **What:** AVEL has one human user, you, and nobody else ever signs in or is paid through it. The schema and contract still carry a second kind of person, the sales rep. Remove it, and make "only the operator" explicit in the contract:
  1. **Drop reps.** Remove `clients.rep_id`, `missions.rep_id` and `missions.rep_pct` from the schema, and the matching fields from the client and mission DTOs and the create and update inputs. Remove the `users ||--o{ clients : "reps"` edge from DATABASE.md's ERD.
  2. **No people routes.** The contract has no sign-up, invite, user list or role routes. Better Auth's sign-up route is turned off on the server, and a test proves it (Step 1 test 7).
  3. **Keep the `user_id` columns.** `overrides.user_id`, `pass_approvals.user_id`, `proposals.resolved_by`, `deliveries.released_by`, `activity_log.user_id` and the rest stay. They always point at you, cost nothing, and keep the record honest about who acted if that ever changes.
  4. **Who acted is still typed.** `activity_log.actor_kind` keeps `'user'|'agent'|'system'`. "Operator" means the one user; agents and the runner are never users (CR-17).
- **Why:** a field nobody can fill is a bug waiting to happen. A rep link to `users` would need a second account, which the one-operator rule forbids.
- **When:** Step 0's migration and contract release, before any client row exists. Step 1's sample route (`toClientDto`) is built without rep fields.
- **If reps come back:** add them as client contacts or a small `reps` table with no sign-in, never as users.
- **Touches:** DATABASE.md (clients, missions, the ERD, the FK table), the contract (client and mission DTOs and inputs), the Step 0 and Step 1 plan (the Step 0 schema table), the API and data reference (generated from the contract, so it follows).

