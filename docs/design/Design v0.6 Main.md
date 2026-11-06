# AVEL Software Factory — Map v0.6

Oct 30, 2026 · @javaris

**Design frozen at v0.6 on Nov 1, 2026.** Changes from here go through build-step findings.

This maps the whole software factory: its modules and how data moves between them. Nothing here is built. **Ported** means the code exists in avel-server @ b680edc and moves over. **New** means it's specced here. Onboarding is detailed in its own doc, [Canon Onboarding — Software Factory Map](https://claude.ai/artifact/HBrmhrcNcpDoLLhwW2F4Q2), now at v0.5 and realigned with the decisions below. This doc picks up where onboarding hands off.

**In short**

1. A mission enters through Canon's onboarding (**Gate 0**) and leaves as a verified delivery with a receipt. The operator (you) approves twice: the plan, and the release. A result labelled pass needs a third, the pass approval.
2. In between, everything runs as code or agents. Code renders the mission's **DISPATCH.md** **and one task doc per dispatch**. The task doc has the activation built in. A model never picks agents or work.
3. Each module starts as soon as its own dependencies have landed, with up to 6 dispatches running at once. Each attempt is capped at 60 minutes and $4, each module at $15 and each mission at $150.
4. One ladder per module before it lands; rework after. Failures before landing follow agent-dispatch's **retry protocol** (focused fix, rethink, fresh approach), and are then **parked** as a proposal to you. A failure after landing goes to rework: at most 2 tries from the current branch head.
5. You can watch everything live in your terminal (`avel watch`) or the web app. Both show one event stream.

**Decisions log**

| Date | Decision |
| --- | --- |
| Oct 30 | Keep the stack: Hono, ts-rest (replaced by oRPC on Nov 1), Drizzle and Postgres on the server, TanStack Start on the web |
| Oct 30 | Best-of-N retries use a second AI vendor (still to be chosen) |
| Oct 30 | The 8 agents without territories are parked until you confirm them |
| Oct 30 | First real mission type is on hold |
| Oct 31 | No map-driven development and no Atlas map. The `map` module and `map_elements` table are removed. |
| Oct 31 | Onboarding is Canon's, and you are the only interviewee (see the onboarding doc) |
| Oct 31 | Dispatch model A: code sends every packet, and each agent plans its own steps inside its packet |
| Oct 31 | Default dispatch cap: 60 minutes and 500,000 weighted tokens (input ×1, cache write ×1.25 or ×2, cache read ×0.1, output ×5). Superseded Nov 1: the attempt cap is $4, priced from the price table. |
| Oct 31 | No AI-consent step in the factory |
| Oct 31 | Tests first by non-builders (they must fail, then they're locked). Brennan rules on test disputes. The integrator merges one module at a time and owns shared files. Contract changes mid-mission go to you as a proposal. Code routes findings, and each finding must cite an ID and evidence. |
| Oct 31 | Adopt agent-dispatch vocabulary: operator, DISPATCH.md, task doc with the activation built in, territory, wave, chain, completion report, retry protocol 1–3 then parked, converge, Gates 0–5. AVEL keeps mission, package, receipt, verified and the R→S→CK chain. The intensity protocol and mesh mode are dropped. |
| Oct 31 | One dispatch per module. An agent role can staff several dispatches at once. A module starts as soon as its own dependencies have landed. Concurrency cap: 6. |
| Oct 31 | Roster is modelled on a software engineering team, adding DATA, INFRA and SERVICES. The name-to-role mapping is proposed and awaiting your confirmation. |
| Oct 31 | Gates: overrides are logged (superseded Nov 1: only Gates 3 and 4 can be overridden). Gate 5 can't be forced to verified. Findings are fixed only by a passing regression check. Brennan rules on locked-test disputes, and acceptance-test changes need you. Quarantined tests cap the result at pass. Each package has a minimum set of gate kinds, plus `audit` for Diagnostic. Diagnostic reports stay outside the client's repo. phase1-close means the frozen M0 contract, and alignment is a black-box contract check. |
| Oct 31 | New modules: `rules` (registry plus `avel check`) and `knowledge` (live, five layers, cut to three on Nov 1, you approve every entry). CLI: installed from npm, linked per project with `avel link`. `avel check` runs on your commits by default, and you can turn it off. Any stack goes through the readiness check. Playbook styles are deferred, and there is no Atlas. |
| Oct 31 | The UI starts fresh. No avel-web code or design system is ported; its lessons are kept as rules (see Port inventory). |
| Oct 31 | Agents work in Docker rooms for now, one room per dispatch, behind the compute interface. When the factory moves to the cloud, boat is the first provider and MIOSA's Developer plan the alternative. |
| Oct 31 | Modules land as integration commits: each is tested in its final merged form before the mission branch moves, so the mission branch is always green. |
| Oct 31 | Sign-in is email and password, with no GitHub sign-in. You're the only user for now. Roles and developers' own agents come later. |
| Oct 31 | Client records stay. Gate 0 takes uploads, stored with the ported Drive storage. Repo access uses fine-grained GitHub tokens (revised Nov 1: one repo connection per client, with tokens limited to that client's repos): Avel-org by default, or the client's own account. |
| Oct 31 | Computer-use agents working inside client businesses are a later phase. Nothing is built for them now. |
| Oct 31 | Rooms are hardened after the sandbox review (graded C+): a dedicated Linux host, never your laptop; gVisor; no model key inside a room; egress only through a proxy; git over HTTP with per-room credentials; an isolation test suite that blocks the build. |
| Oct 31 | Integration stays serial. Batching is dropped. |
| Oct 31 | The second vendor is built last. Until it's chosen, Retry 3 runs a fresh approach on the same vendor. |
| Oct 31 | Skills port from avel-server. Rules are checks, skills are how, knowledge is what. Skills load through the Agent SDK from outside the client repo; skill\_read stays only for the second vendor. A 14-skill starter library, roles first. |
| Oct 31 | A new evals module. No change to skills, prompts, models, tools or knowledge selection reaches a real mission without beating the baseline and your approval. (Superseded Nov 1: evals are off; see the interim rule.) |
| Nov 1 | A pass (an accepted finding, or an override at Gate 3 or 4) needs a separate pass approval with a reason before release, and is labelled pass. Gate 5 can't be overridden. Delivery ships the exact verified commit; refreshing onto a newer client main re-runs Gates 2, 4 and 5. |
| Nov 1 | Dollar budgets at the model proxy: $15 per module and $150 per mission. (The $200 a month first proposed for evals is superseded: the eval budget is set when evals are switched on.) |
| Nov 1 | Skills come from your uploads, skills you write, and drafts from a new second factory agent, the Librarian. Every skill and knowledge release needs your approval before use (the eval requirement is superseded by the interim rule below). Revised Nov 1, round 4: the Librarian is deferred to v2 and won't draft skills. |
| Nov 1 | Durable execution: Postgres jobs with leases, a transactional outbox, events numbered in commit order, one retry ladder per module before it lands, and rework after (see State machines in After Canon). |
| Nov 1 | Evals are designed but off for now. Until they run, a change to how agents work reaches missions only as a factory-repo PR you approve, every attempt is labelled with its factory commit, live results are tracked per factory change, and rollback is one revert. This replaces the eval requirement in the Oct 31 and Nov 1 rows above. |
| Nov 1 | Cuts accepted: the knowledge base has 3 layers (global, stack, client); all 19 modules ship as packages in one service; no per-entry ablation; the Librarian drafts only on request or from findings with a passing regression test, and never capability skills; Retry 3 is a single attempt; new rules are tested on synthetic fixtures instead of a past-mission corpus. (The Librarian is deferred to v2.) |
| Nov 1 | Routes consolidated to about 70, with one actions route per object. Step-up (your password again) guards the actions listed under API routes (narrowed in round 4 to credential actions only). The nav item formerly called Inbox is Decisions. The actions routes were replaced on Nov 1 by noun sub-resources (see API routes). |
| Nov 1 | Second review round fixed: lease fencing, budget reservation before each attempt and a Gate 1 budget check, rework after a module has landed, refresh re-running Gates 2, 4 and 5, operator commits landing through `operator/<mission>`, and an event catalog (see After Canon). |
| Nov 1 | Factory as code: a private avel/factory repo holds factory.yaml (roles and models, budgets and caps, the retry ladder, gate config, room limits, packages, skill selection and the runtime versions), skills, knowledge releases, rule packs, agent configs and prompts. Every change is a PR you approve (no password since round 4). Each mission pins its factory commit at finalize, and rollback is reverting the PR. |
| Nov 1 | Model-graded scorers instead of evals for now: a cheap model scores every finished module and mission against written rubrics. Advisory only; they never gate. $30 a month. Deferred to v2 in round 4. |
| Nov 1 | The Librarian observes every closed mission and opens PRs against the factory repo, at most 5 open at once. It never merges. Deferred to v2 in round 4. |
| Nov 1 | A Factory MCP server lets your local Claude Code read the factory and draft missions, notes and proposals. No approvals, releases, overrides, secrets or merges go through it. Deferred to v2 in round 4. |
| Nov 1 | Third review round fixed: a branch per attempt; Gate 3 in a fresh check room; flaky tests judged only on tests that were green on the base commit; Gate 5 has no override (accept, rework or cancel); any override at Gate 3 or 4 caps the verdict at pass; a short step-up list (release, pass approval, overrides, secrets, credentials, factory merges, budget raises) with single-use grants, while routine approvals are one click in the web app or an interactive y/N in the CLI; 12-hour CLI sessions that refuse any approval without an interactive terminal; one repo connection per client, with the secrets key in a KMS off the host; every model call (Canon and scorers included) through the proxy, with per-request reservations and no output clamping; the Librarian runs as a metered dispatch on $20 a month; rules have a scope; packages live in factory.yaml. Round 4 replaces the step-up list, the interactive-terminal rule and the Librarian budget. |
| Nov 1 | Round 4, then frozen at v0.6. Real prices: a typical attempt costs about $1 on Sonnet 5.5 and $2 on Opus 5.5, so each attempt is capped at $4 and the $15 module and $150 mission budgets stay. Approvals never ask for a password; it's kept only for credentials (secrets, repo connections, CLI logins). The Librarian, the Factory MCP server and the scorers are deferred to v2; the Librarian's v2 job is knowledge base management, project templates and rules, not skills. Project templates are new: you write them in v1, and Canon offers one at 0.3. No drift alert. A module's review findings before it lands go to a fix attempt from its own last commit. Each cross-module scenario is locked with the last of its modules. Integrity at Gate 5 offers only rework or cancel. The pass approval is its own record, so a hashed receipt never changes. Client write tokens are decrypted only in a separate delivery worker, runner images are built inside gVisor, and the repo is read at 0.1 for existing apps. |
| Nov 1 | API layer: oRPC replaces ts-rest; noun routes; DTOs; one error contract; rate limits. Recorded before build step 1 (post-freeze change, approved). Also cursor paging, X-Request-Id and a contract version header on every response, and the event and trace streams on oRPC's event iterator. |
| Nov 1 | Database integrity rules, ERD, and stack set (no Pino). Post-freeze, approved. The database design moves to its own file, docs/DATABASE.md in avel-server (canonical; the onboarding tables are folded in). It sets no deletes of business records, RESTRICT on every foreign key, state-conditional CHECKs, exactly-one-parent CHECKs, partial unique indexes, money in micro-dollars and UUIDv7 keys. The stack is Node, Hono, oRPC, Zod 4, Drizzle and Postgres, Better Auth, TanStack Start, our own JSON logger, Vitest, and pnpm with Turborepo. |

## At a glance

&#91;embedded content: factory map · core modules (rules, knowledge, contract and audit not drawn), Gates 0–5\]

Your scope enters through Canon's onboarding and becomes a plan. The factory sends each module's task doc to its agent as soon as the module's dependencies have landed, and failures loop back through the retry ladder. The gate judges the whole mission, and nothing ships until you release it. Every module writes to one event stream, which is what your terminal and the web view display. The contract and audit modules sit under everything and aren't drawn.

The detailed map of what happens after Canon (phases, waves, integration, reviews, state machines and a worked example) is in the next tab: After Canon

## Command Center vs factory

The Command Center was a cockpit: you flew every step by hand. The factory is a production line. You approve what goes in and what comes out, and code runs everything in between.

|  | Command Center (built) | Software factory (specced) |
| --- | --- | --- |
| **Who starts work** | You create and start each dispatch by hand | Finalize renders every dispatch, Gate 1 checks they're complete, and code starts each module when its dependencies have landed |
| **Intake** | Canon drafts a brief, and you write the plan | Canon's Gate 0 (checkpoints 0.1–0.4). Finalize is the plan approval. |
| **Who picks the agent** | You, per dispatch | Code: work kind → builder, plus dispatch roles (tests, e2e, reviews) from the roster |
| **What an agent receives** | The four-part brief (Scope, Read, Method, Done when) | A task doc in agent-dispatch's format, with the activation built in, plus the mission's DISPATCH.md. Frozen and hashed at start. |
| **Parallel work** | Whatever you start | One dispatch per module. A role can staff several at once. Up to 6 run at once. |
| **When things fail** | You notice and decide | Retry protocol 1–3, each attempt in a fresh room, then parked and proposed to you |
| **Testing** | Checks at the gate | Tests written first by non-builders, locked, then a test of each integration commit (Gate 2) before it lands |
| **Merging** | — | Integration commits on a mission branch: each module is tested in its final merged form before it lands |
| **Gate** | `decide()` v4, receipt in activity\_log | Gates 1–5. `decide()` v5 (adds `audit`; the e2e scenarios run under `acceptance`) at Gate 5, with receipts in their own table. |
| **Visibility** | The web app | One event stream feeding `avel watch` and the web view |
| **Manual routes** | The only way to work | Logged overrides, counted on the receipt |

## Modules

There are 19 modules: 6 ported and 13 new (including `rules`, `knowledge` and `evals`). They ship as packages inside one service, not as separate deployables. The new ones do three jobs: turn your scope into work (`onboarding`, `plan`, `roster`, `packages`), run it without you (`factory`, `integrator`, `compute`), and show and measure it (`events`, `cli`, `metering`). `evals` is designed but not running yet (see Agent evaluation).

| Module | Status | What it owns |
| --- | --- | --- |
| `contract` | Ported + extended | One shared package of schemas and enums. The web app imports it. |
| `onboarding` | New (replaces `intake`) | Canon's Gate 0: interview, extractor, checkpoints 0.1–0.4, finalize. Uploads are parsed in a sandboxed subprocess with no network and no secrets. |
| `packages` | New | The catalog read from `factory.yaml` (prices, deadlines, check sets and rubric profiles) and the deadline clock |
| `plan` | New | Plans, modules, requirements, scenarios, checks and the codebase analysis. Read-only once approved, versioned when a re-entry creates a new plan. |
| `roster` | New | Agents, roles, and the map from work kind and dispatch role to agent, versioned in the factory repo. *Pending your revision.* |
| `factory` | New | Rendering DISPATCH.md and the task docs, Gate 1, the scheduler, the retry protocol, rework, parking and converge proposals |
| `integrator` | New | The mission branch, integration commits and the integration room, shared files and dependency requests, Gate 2 |
| `runner` | Ported + extended | `startDispatch`, rooms, frozen identity and task-doc hash, caps, Gate 3 (agent completion) in a fresh check room |
| `harness` | Ported + new backend | Claude via the Agent SDK (ported) and the second vendor (new). Room and report tools move to the host tool server. |
| `compute` | New | Where a dispatch runs: one Docker room per dispatch under gVisor on a dedicated host, plus the Gate 3 check rooms, the integration room and the egress proxy. Cloud later: boat first, MIOSA as the alternative |
| `gate` | Ported, redesigned as v5 | `decide()` v5 (the e2e scenarios run under the `acceptance` kind), the Docker check runner, receipts (Gate 5) |
| `delivery` | Ported | Zip, PR or push, run as a separate delivery-worker process: the only process that can decrypt write tokens to client repos. Each client's repo connection also has a read-only token, which lets onboarding read the repo from 0.1 and the factory mirror it into the mission repo. |
| `events` | New | One append-only event stream, served live over SSE, plus the unnumbered trace log |
| `cli` | New | `avel watch`, `approve`, `pause`, `override`, `why`, `check` |
| `metering` | New | The model proxy (the only holder of the model key and the meter of record, emitting usage.recorded), your minutes, tokens and dollars per attempt against the $4 attempt cap, budget reservations, calibration, revenue per oversight hour |
| `audit` | Ported + extended | The activity log, plus the override log |
| `rules` | New | The versioned rules registry (AVEL baseline, the client's own lint and config, approved learned rules, each with a scope) and `avel check`, which runs the same version everywhere |
| `knowledge` | New | The skill library (ported from avel-server) and the live knowledge base: three layers of entries, entries and project templates you write (the Librarian joins in v2), your approvals, selection into task docs, and effectiveness tracking |
| `evals` | New | Deferred, not running yet. For now: agent configs, their hashes and live tracking per factory change. Later: the eval sets, eval runs against the baseline, and reports for your approval |

Standing context (build commands, conventions) lives in each target repo's AGENTS.md / CLAUDE.md. It's referenced, not copied into packets.

## Data flow: one mission, start to finish

Every step writes an event, so the terminal and the web app always show the same state. The gates are agent-dispatch's, numbered 0 to 5.

1. **Gate 0, onboarding** (`onboarding`). Canon interviews you, and you approve checkpoints 0.1–0.4. Finalize writes the plan, pins the mission's factory commit and roster, and writes an outbox row, all in one transaction. *Your approval #1.*
2. **Render** (`factory`). From the plan, code renders the mission's DISPATCH.md and one task doc per dispatch: build, tests, e2e, reviews. Each is hashed. Rendering twice does nothing.
3. **Gate 1, pre-dispatch** (`factory`). Every section of DISPATCH.md and every task doc must be filled and make sense (territories, IDs, cycles, migrations), and the budget check in Cost control must pass, for each module and for the mission. A failure sends the mission back to planning.
4. **Schedule** (`factory.tick()`). Each tick starts every module whose tests are locked and whose dependencies have landed, up to 6 dispatches at once. Gate 1 has already refused overlapping territories.
5. **Run** (`runner`, `harness`, `compute`). Tests are written first and locked, then the build runs in its own room under its caps, pushing only to its own attempt branch. Messages and tool calls go to the trace log, and every state change goes to `events`.
6. **Gate 3, agent completion** (`runner`). In a fresh check room with no agent and no network, each dispatch is judged by its role. A build: the completion report exists, the rules check and the locked tests pass, the verification commands give the expected output, and only owned files changed. A test or e2e writer: the new tests compile and fail on the start commit. A reviewer: the report matches its schema and every finding's citation resolves.
7. **Integration commit and Gate 2** (`integrator`). Each finished module becomes an integration commit, tested in the integration room. The mission branch moves to it only if it's green: the pinning tests of an existing app, every landed module's locked tests and the incoming module's must pass, plus every acceptance scenario whose modules have all landed or are landing. A scenario that spans modules is locked with the last of them to land. That unlocks its dependents.
8. **Failure** (`factory`). Before a module lands, it walks its one retry ladder, each attempt in a fresh room on a new attempt branch: Retry 1 focused fix from the last checkpoint commit, then Retry 2 rethink and Retry 3 fresh approach from the module's start commit. Retry 3 is one attempt, on the second vendor once one is chosen. After that the module is parked and proposed to you. A Gate 4 review finding before it lands sends it to a fix attempt instead, from its own last attempt commit: at most 2 rounds, separate from the ladder. After it lands, a confirmed finding or a Gate 5 failure sends it to rework: at most 2 tries from the current branch head (see State machines in After Canon).
9. **Gate 4, merge readiness.** Every module has landed and every Brennan and Zane finding is routed.
10. **Gate 5, sprint close** (`gate`). `decide()` runs on the mission branch, and the receipt is hashed. A verified result moves on. A pass (from an accepted finding or an override at Gate 3 or 4) moves on only after your pass approval: a separate record tied to the receipt hash, which emits pass.approved. The hashed receipt never changes.
11. **Release and delivery** (`delivery`). You release it (*approval #2*), and the exact commit Gate 5 decided ships as a PR, push or zip.
12. **Measure** (`metering`). The receipt shows the human/AI split. Revenue per oversight hour updates on cash, and estimates are re-calibrated.

## Dispatch

Dispatch follows agent-dispatch, with one change: **code** renders the documents its ORCHESTRATOR used to write by hand. Every agent starts from its own task doc, and the mission's DISPATCH.md gives everyone the whole picture. The agent decides only *how* to do its own tasks, inside its own territory and tests.

**DISPATCH.md** (one per mission) holds goals, conventions with build, test and lint commands, execution traces for fix work, the territory map, waves (computed from dependencies), merge order and success criteria.

**The task doc** (one per dispatch, activation built in) follows agent-dispatch's 7 parts:

1. Identity: agent, module, branch, room, cap.
2. Reading list, in order, with a reason for each file. AGENTS.md / CLAUDE.md comes first.
3. Role and cross-agent context: what it depends on, and who depends on it.
4. Tasks: IDs, current state, required change, key details, reference pattern, and the R and S IDs each one serves.
5. Territory: the files it owns, and the do-not-touch paths, each with its owner.
6. Execution protocol: verification commands with expected output, run after each task. Commit format and escalation rules.
7. Completion: fill in the completion report, including P0 discoveries, issues for others, dependency requests and escalations.

The task doc's source for each section is mapped in the onboarding doc's appendix. Agent-dispatch's intensity protocol and mesh-mode keywords are not used. Sub-agents are allowed only where a task doc permits them, inside the same cap.

**The scheduler (`tick()`)** is a job on the leased job queue (see State machines, jobs and events in After Canon): it runs every few seconds and after every relevant event, survives a restart, and is safe to run twice. On each tick it:

1. Moves ready dispatches to starting under a lease, using `FOR UPDATE SKIP LOCKED`.
2. Treats a module as ready when its tests are locked and every module it depends on has landed. A module with no dependencies is ready as soon as the mission is rendered. It doesn't wait for a whole wave.
3. Orders ready work by dependency depth, then module ref, so the same plan always runs the same way.
4. Reserves each attempt's expected cost against the module and mission budgets first (see Cost control), and parks the dispatch if the budget can't cover it.
5. Starts up to 6 at once through `startDispatch`, counting slots as defined in After Canon, and never more rooms than the host can fit. Gate 1 has already refused any overlapping territories.
6. Queues Gate 5 once every module has landed and Gate 4 passes.

**The retry protocol** (agent-dispatch's three tiers, adapted). One ladder per module covers every failure before the module lands. Every attempt runs in a fresh room and pushes to its own attempt branch (`mission/<id>/<module>/<role>-a<n>`), so no push ever needs force. Rework after a module lands is separate (see State machines in After Canon).

| Step | Trigger | Starts from | What runs |
| --- | --- | --- | --- |
| Initial | Dispatch starts | The module's start commit | One attempt on the worker tier |
| Retry 1: focused fix | Fails, or hits the cap | The last checkpoint commit | Same model, with just the error output |
| Retry 2: rethink | Retry 1 fails | The module's start commit | Same model, with both errors and the surrounding code. It must try a different approach. |
| Retry 3: fresh approach | Retry 2 fails | The module's start commit | One attempt on the second vendor once it's chosen (until then, the same vendor), given every error |
| Parked | Retry 3 fails, an Escalate-when rule fires, or the budget can't cover the next step | — | Nothing runs. You get a proposal. A converge pass (at most 3) is drafted by Canon and approved by you. |

**Overrides.** Starting, retrying, parking or cancelling a dispatch by hand goes through the dispatch's overrides route; overriding Gate 3 or 4 goes through the mission's overrides route. Each one needs a reason, is logged, and is counted on the receipt. Any override at Gate 3 or 4 caps the verdict at pass.

## Cost control

A dispatch gets expensive mainly by running long, because an agent re-sends its whole conversation on every turn. Cost grows with turns times context size. The other drivers are big tool outputs, output-heavy work (output costs about 5× input), failure loops, cache misses and compaction.

| Lever | How the factory applies it |
| --- | --- |
| Small modules | Canon splits anything too big for one dispatch before any code is written |
| No exploring | The task doc's reading list names the files, so agents don't wander the repo |
| Stable cached prefix | Standing context and the task doc come first and never change mid-run. Long dispatches use the 1-hour cache. |
| Short tool output | The check runner returns a failure summary of at most about 2,000 tokens. Install logs never enter context. |
| Model routing | Workers on the cheaper tier with low thinking effort. The lead tier only for Canon's breakdown and Brennan. |
| Hard stops | The per-attempt cap (60 minutes, $4, 200 turns), the module ($15) and mission ($150) budgets, reserved before each attempt starts, and a warning at 80% of each in the live view |
| Cheap retries | Retry 1 resumes from the last checkpoint commit with just the error output, never the full transcript. Retry 3 is a single attempt. |
| Batch for non-urgent work | One-shot grading (for evals, once they run) goes through the Batch API at 50% off, which stacks with caching. Agent loops can't, because each turn waits on the last |
| Backstop | Workspace spend limits on the API account |
| Calibrate | Logged cost per dispatch by work kind proposes new caps as a factory PR once real data exists |

**Budgets in dollars, enforced at the model proxy.** Every attempt is capped at $4, every module has a $15 budget, and every mission has $150. The module budget covers every dispatch of that module: tests, e2e, build, the whole retry ladder, fix attempts and rework. The mission budget covers all its module budgets plus Canon's onboarding and the mission-level reviews. The caps live in `factory.yaml`, and prices come from `price_table`, which the proxy reads. The model proxy is the only holder of the model key and the meter of record for every caller: agents in rooms, and Canon, which calls it with a service token. It counts input before sending and counts streamed usage as it arrives. Usage is split into input, output, cache reads, and cache writes at 5 minutes and at 1 hour, because each is priced differently.

**Seed prices**, per million tokens, from Claude's pricing page (checked Nov 1, 2026). They only seed `price_table`; the proxy always reads the table.

| Model | Input | Output | 5-minute cache write | 1-hour cache write | Cache read |
| --- | --- | --- | --- | --- | --- |
| Opus 5.5 | $4 | $20 | $5 | $8 | $0.20 |
| Sonnet 5.5 | $2 | $10 | $2.50 | $4 | $0.10 |
| Haiku 5.5 (prompts up to 100k tokens) | $0.10 | $0.50 | $0.125 | $0.20 | $0.01 |

**What a typical attempt costs.** An attempt of about 40 turns, with about 60,000 tokens of context on each, reads about 2.4 million tokens from cache, writes about 150,000 to cache, and outputs about 40,000. That's about $1.00 on Sonnet 5.5 (cache reads $0.24, cache writes about $0.38, output $0.40) and about $2.00 on Opus 5.5. A module with 4 to 6 dispatches (tests, e2e, build, reviews) costs about $5 to $10 including one retry, so $4 per attempt, $15 per module and $150 per mission leave room.

**Reserve before spending.** Before an attempt starts, the scheduler reserves its expected cost against both budgets: the median of past attempts for that role, $1.50 until there's history. Reservations are rows in `budget_reservations`, tied to the mission and, for module work, the module. Canon's onboarding reserves the same way, by session. The unused part is released when the attempt or session ends, including when it's lost to an infrastructure failure, and the reaper releases any left behind. If the module or mission can't cover the reservation, the dispatch parks instead of starting. The hard ceiling is enforced per request: before sending a request, the proxy atomically reserves its `max_tokens` at its price against the attempt cap and both budgets, so parallel sub-agents can't overspend together. Output is never clamped mid-request. There are two different outcomes. An attempt that reaches its $4 cap ends as `capped`, which counts as a ladder failure. A request the module or mission budget can't cover is refused, and the attempt ends as `budget_parked`: the dispatch parks, and no ladder step is used.

**One budget check, at 0.3 and at Gate 1.** For each module, its dispatch estimates times 1.5 (for retries and rework) must be at most its $15 budget. For the mission, the module estimates times 1.5, plus the mission-level reviews, plus what Canon has actually spent so far, must be at most $150. Checkpoint 0.3 runs this check before you finalize, and Gate 1 runs it again on the rendered dispatches. If it fails, you cut scope or raise a budget. **A budget increase** is a proposal that names which budget (a module's or the mission's) and the amount. You can raise one from 0.3, from Gate 1, or mid-mission when a budget runs out (or leave the work parked). A raise needs no password and is printed on the receipt. The 60-minute clock stops while a dispatch waits on a dependency. Calibration proposes new caps as a factory PR: the 90th percentile of the last 20 completed dispatches per work kind, counting capped runs as at least their cap. Evals aren't running yet; when they start, they get their own monthly budget and never take a mission's slot.

## Live view: terminal and web, in sync

Everything you'd want to see is live in one place: gates, modules, findings, new rules, knowledge proposals and agent tasks. The terminal and the web view are both clients of one event stream (`GET /api/events/stream`, server-sent events through oRPC's event iterator, resumable from `Last-Event-ID`; see State machines, jobs and events in After Canon) and one API. Anything you do in one shows up in the other on the next event.

**Setup:**

1. `npm i -g avel`, then `avel login`. The CLI shows a one-time code, you approve it in the web app (with step-up), and the CLI receives a 12-hour session.
2. `avel doctor` checks git, your GitHub tokens and their expiry dates, Docker, your keys and the server, and names exactly what's missing.
3. `avel link` inside a project folder connects it to its mission, clones the mission repo through the factory's git endpoint with your CLI session (pushes are allowed only to `operator/<mission>`), and installs the git hooks. After that, a plain `avel watch` knows where you are.

**The watch screen:**

```text
gts-landing · Landing page · Gate 2 running · 4/8 landed · 6/6 slots busy
G0 ✓  G1 ✓  G2 ▶ 4/8  G3 ▶  G4 ·  G5 ·
M2 Leon   build   ▶ 31m  212k tok  $1.10/$4 attempt  $4.80/$15 module   tests 6/9   rules ✓
M5 Dunn   build   ✓ landed               tests 7/7
M6 Iyo    retry 1 ▶ 12m  "SMTP stub timeout"
FINDINGS  F-31 Zane  security  M5 R7  → rework
NEEDS YOU P-3: contract change on QuoteRequest  → avel open P-3
```

Factory PRs waiting on you (knowledge entries, rules, project templates) show up in `avel decisions`.

**Commands:**

| Command | What it does |
| --- | --- |
| `avel login` / `logout` | Approve this machine from the web app with a one-time code (step-up); stores a 12-hour session |
| `avel doctor` | Checks git, Docker and gVisor, the proxies, your GitHub tokens and their expiry, and the server |
| `avel link` | Connects a folder to its mission, clones the mission repo through the factory, and installs the git hooks |
| `avel watch [--follow <module>] [--panes]` | The live screen, one module's feed, or one WezTerm or tmux pane per running dispatch |
| `avel why <mission>` | What stands between the mission and verified |
| `avel decisions` | Everything waiting on you |
| `avel approve <id>` / `reject <id>` | Answer a checkpoint, plan, proposal, finding or release, with a reason. No password. |
| `avel pause` / `resume` / `cancel <mission>` | Mission controls |
| `avel override <dispatch or gate> --reason` | A logged override, with a reason |
| `avel findings`, `avel rules`, `avel kb`, `avel skills` | List and review |
| `avel eval run` / `report` | Later, once evals run: start an eval run or read its report |
| `avel open <id>` | Open anything in the web app |

Anything waiting for you also triggers a desktop notification. Your minutes are counted from CLI and web activity with a 5-minute idle cutoff. Your commits go to your branch `operator/<mission>` and land through an `operator` integration commit like any module's, so a commit made with `--no-verify` still has to pass Gate 2 before it reaches the mission branch. Hand-entered time is shown as such on the receipt.

**Your own work feeds the factory.** When you work in VS Code or WezTerm:

- The git hooks send each of your commits to the factory: the files it touched, the module they belong to, and a check against the locked tests.
- `avel check` runs on your commits automatically. That's a setting, on by default.
- The CLI sends a small activity signal, so your hands-on minutes are counted with idle time cut out.
- Your changes show up on the receipt as operator work and count toward revenue per oversight hour. If you edit a locked test, it goes through the same test-change path as anyone else's (see the gate system in After Canon), and it's listed on the receipt.

**Live metrics:**

| Area | What's tracked |
| --- | --- |
| Progress | Modules by state, the gate strip, critical path left against the deadline, slots in use (x/6) |
| Quality | Checks passed and failed, tests that failed first, quarantined tests, rule violations, findings by kind and route, retries by tier, parked modules |
| Cost | Tokens and dollars per attempt against its $4 cap, module and mission spend against their budgets, burn rate, cache hit rate, model mix |
| Time | Wall-clock time per dispatch, queue wait, your minutes, projected revenue per oversight hour |
| Knowledge | Entries used per dispatch, proposals waiting, first-attempt pass rate per knowledge release |
| Health | Provider errors, rate-limit headroom, check-runner queue |

Alerts are kept few on purpose: 80% of an attempt, module or mission budget; Retry 3 reached; a module parked; something needs you; the deadline at risk; a dispatch with no progress event for 10 minutes; a provider outage; a failed nightly isolation run; a dead job; and a merge to `avel/factory` made by anyone but the factory's GitHub App. There's no drift alert: you compare results across factory changes yourself.

## Factory as code

How the factory itself works lives in a private repo, `avel/factory`, not in the database or in code constants.

- `factory.yaml` covers roles and models (dated model snapshot IDs), the SDK and harness versions and room image digests, budgets and caps ($4 per attempt, $15 per module, $150 per mission), the retry ladder, gate config, room limits, the packages (prices, deadlines, check sets and rubric profiles), and which skills each role and stack gets (stack skills by version range).
- The repo also holds the skills, knowledge releases, rule packs, agent configs, prompts and the project templates (in templates/).

Every change is a PR that needs your approval. In v1 you open them; the Librarian joins in v2. `main` is branch-protected: no direct pushes, and merges are made only by the factory's GitHub App after you approve (no password). The webhook checks who merged. A merge by anyone else, including an admin bypassing branch protection, raises an alert, and finalize is frozen until that commit is reverted, so no mission can pin it. The service can load any merged commit by SHA from cached checkouts, so missions on different commits run side by side. Canon's onboarding reads the newest commit when its session starts and keeps it, and finalize (approval #1) pins that same commit as the mission's `factory_commit`, so 0.3 and Gate 1 use the same budgets and prices. The roster lives in the factory repo too, so the mission's roster version is read from that commit and the two can't diverge. That commit is the mission's config hash: it's printed on the receipt and labels every attempt. A merged change affects only missions finalized after it, and rolling one back means reverting its PR. A running mission keeps its commit; to move it onto a fixed commit, you accept a re-pin proposal, which takes effect from its next attempt. Every merged commit is listed in `factory_versions`.

## Knowledge base

The knowledge base is live and grows with every mission. Its job is to give every agent better context, starting with excellent worked examples. It's organised in three layers, from general to specific:

| Layer | What it holds |
| --- | --- |
| Global | Patterns for architecture, testing, security and UX; delivery lessons; decision records; domain checklists (service shops, e-commerce, SaaS, AI agents inside companies), tagged by domain. Works for any stack. |
| Stack | Per language or framework: conventions, commands, worked code examples, runner setup |
| Client | Per client: their codebase analysis, conventions, past decisions, glossary |

A mission's own decisions, contracts and findings aren't knowledge-base entries. They reach its agents through DISPATCH.md and the task docs.

**Kinds of entry:** worked example, pattern (when to use it, and the trade-offs), before/after correction pair, decision record, lesson, checklist, domain fact. Rules aren't entries; they live only in the rules registry. Every entry has a scope, tags, a status (proposed, approved or retired), where it came from, the missions that back it, and a version.

**How it stays live:**

- **Proposals come from you, never from agents inside a mission.** Closeout lists each finding fixed with a passing regression test, and code adds lesson candidates to that list (a module that only passed at Retry 2, a parked module). You write up the ones worth keeping as factory PRs. In v2 the Librarian drafts them (see Deferred to v2).
- **You decide.** You approve, edit or reject from the CLI or web. Nothing promotes itself. Approving an entry merges its PR; entries merged together form the next knowledge release, which reaches only missions finalized after the merge. Each mission pins the release in its factory commit.
- **Code selects entries for each task doc,** by work kind, stack, domain tag and client, within a fixed token budget and in a fixed order: the global security checklists for the work kind always come first, then the client layer, then stack, then the rest of global, each by specificity and then entry ID. Whatever doesn't fit is cut from the bottom, and the selector's version is part of the agent config. The selection is deterministic, and the knowledge release is recorded on the receipt. Agents also get a read-only search for one-off lookups, scoped to the mission's client, its stack and global entries. Every search and its results are logged in the attempt's trace.
- **Every agent benefits.** Canon gets domain checklists and typical breakdowns. Reviewers get checklists. Builders get examples and patterns.
- **It tracks itself, roughly.** Each entry records how often it's selected and how the modules it was selected into did: first-attempt pass rate and findings. That's a signal, not proof, because entries aren't tested one at a time. Entries that are never selected, or keep showing up beside failures, are flagged for you to review.

## Project templates

A project template is a starter for one package type, for example a landing page or a service shop's booking app. Each template holds:

- a scaffold repo at a pinned commit, with M0's foundation already done;
- a plan template: the usual modules, contracts and acceptance scenarios;
- its default rules.

Templates live in the factory repo under `templates/` and change through PRs like everything else. In v1 you write them; in v2 the Librarian proposes updates from closed missions of that package type. At 0.3, Canon offers a template that matches the mission's package, and you choose whether to use it. A plan built from a template records `template_slug` and `template_version`, and still goes through 0.3 and Gate 1 as normal.

## Skills

Skills teach agents *how* to do a kind of work, loaded only when the work needs them. The system already exists in avel-server (`docs/SKILLS.md`, the `skill` contract, content hashes, tiers) and is ported with three changes: a clear split with rules and knowledge, the Agent SDK's built-in skill loading, and bundled library docs.

**Where guidance lives:**

| Kind | What it holds | How the agent gets it | Example |
| --- | --- | --- | --- |
| Rule | Anything that can be checked | `avel check` enforces it | "Every admin route calls `requireOwner`" |
| Skill | *How* to do something | The agent sees each skill's description and loads the full text when its work needs it | Writing a reversible Drizzle migration |
| Knowledge | *What* and *which*: examples, conventions, decisions, domain facts | Code selects entries into the task doc | A client's naming conventions; a worked booking form |

All three come from you and reach missions the same way: a factory-repo PR you approve, then the results of missions finalized on that commit show whether it helped (evals will measure it before use, once they run). Agents inside a mission never write any of them.

**Layers and types (kept from avel-server):**

- **Role** skills belong to a role and are hashed with the agent's identity (`agent_version_sha256`).
- **Stack** and **domain** skills come with a mission. `factory.yaml` maps each role and stack, with a version range, to its skills (for example `tailwind@3` and `tailwind@4`), and code makes the selection. The selected set is part of the task-doc hash and is hashed as `skills_sha256` on the completion report.
- A **knowledge** skill is text. A **capability** skill lets the agent use a tool that's already in the room's pinned image (a headless browser, a seeded test database). It can never add a tool: adding one means a new image digest, changed by a PR to `factory.yaml`. Capability skills come only from you.
- Skills come from two places: skills you upload (imported and pinned by hash) and skills you write in the library. Every skill stays a draft until you merge its PR to the factory repo, and its author is recorded. Agents working on missions never write or edit skills, and the Librarian won't either when it arrives in v2. Only you retire a skill.

**Delivery.** The factory mounts each dispatch's approved skills read-only at /avel/skills, outside the client's repo, and loads only those, by name, through the SDK's plugin option with settingSources set to none. Role skills load the same way and are hashed into the agent's identity; stack and domain skills are hashed as skills\_sha256. The runner, not the agent, stamps both hashes, and it logs every skill the agent actually opened in each attempt. The client repo's own `.claude/` folder is never auto-loaded, which closes a prompt-injection path; their `CLAUDE.md` still reaches the agent through the task doc's reading list. The ported `skill_read` tool stays only for the second vendor.

**Library docs ride inside skills.** Rooms can't browse the web, so each stack skill bundles pinned reference docs and scripts for its version range. A mission on a version no skill covers is flagged by the stack readiness check at 0.4. A skill update applies only to missions finalized after it merges.

**Starter library (14 skills, roles first):**

| Layer | Skills |
| --- | --- |
| Role | Working a task doc and filling in the completion report; fail-first tests tagged with scenario IDs; Playwright scenarios with stable selectors; requirement-by-requirement review citing file and line; security review against OWASP ASVS Level 1 |
| Stack | TanStack Start; Hono with oRPC (was ts-rest); reversible Drizzle migrations; Better Auth; Tailwind v4 |
| Domain | Service shops (quotes, booking); landing pages (forms, SEO, analytics) |
| Capability | Headless browser (e2e); seeded test database (tests) |

## Agent evaluation

**Not running yet.** Evals are designed below but switched off for now. Until they run, a change to how agents work (a skill, a prompt or task-doc change, a model or effort setting, a tool, or the knowledge selection) reaches real missions only as a PR to the factory repo that you approve. That includes the runtime: the SDK and harness versions, room image digests and dated model snapshot IDs are pinned in `factory.yaml`, so an upgrade changes the factory commit too. Every attempt is labelled with its factory commit, live results are labelled by factory change for you to compare, and a change is rolled back in one step by reverting its PR. Missions already running keep their commit unless you accept a re-pin proposal.

When evals run, every such change must pass the promotion rule below (improve, or stay as good) on a fixed eval set before it reaches a real mission. The `evals` module owns this.

**One hash per agent setup.** An agent config is the model snapshot, effort, SDK and harness versions, the task-doc renderer and knowledge-selector versions, `agent_version_sha256`, `skills_sha256`, the rules and knowledge releases, the tool set, the cap and turn limit, the retry-protocol version, and the room and check-runner image digests. Its hash labels every result. Graders carry their own version, separate from the config, so the yardstick never moves with the thing being measured.

**Eval sets:**

| Set | What each task holds | To start | When it runs |
| --- | --- | --- | --- |
| Dispatch tasks | One module: a fixture repo at a start commit, a task doc, locked tests, and hidden acceptance tests | 60 decision tasks (re-sized before evals are switched on) | Nightly for changed parts; the full set before any promotion |
| Role tasks | Tests: does each test fail first for the right reason, and how many seeded bugs does it catch. Reviews: seeded bugs at known lines. E2e: scenarios against a seeded app | 10 per role | Before promoting a role skill or reviewer change |
| Full missions | The GTS Diesel landing page reference mission and one internal app, end to end | 2 | Weekly, and before any model change |
| Holdout | 15 separate dispatch tasks plus 2 role tasks per role, rotated every quarter, shown only as pass or fail | 15 + 2 per role | Every promotion, as a smoke check outside the decision |

Tasks come from synthetic fixture repos, AVEL's own repos, and replays of real dispatches (the repo frozen at the start commit, with its task doc and locked tests). Client code joins the replay set only with that client's permission. A replay task is left out of any run that tests a skill or entry drawn from its own mission.

**Graders the agent can't see.** Every eval task carries hidden acceptance tests that the agent never sees or runs. Pass or fail comes from those, plus the locked tests, Gate 3, `avel check`, the contract check and territory. Seeded bugs score test writers and reviewers, and a diff-size check flags changes far larger than the reference solution. A model-graded rubric (readability, naming) can appear in the report but never decides a promotion, the same rule as no inference in the gate.

**What's measured:** first-attempt pass rate; pass rate within the retry protocol; tokens and cost; wall time; findings per module by severity; escalations and territory violations; seeded bugs caught by tests; seeded bugs found and false findings by reviewers.

**Promotion rule:**

1. Each run names its primary metric in advance (usually first-attempt pass rate), the change it's trying to make, and whether it aims to improve or only to stay as good (for a cheaper model or an upgrade).
2. It's staged: a targeted run on the tasks the change touches comes first, and only a candidate that holds up there gets the full run.
3. Baseline and candidate run in the same window, so provider drift hits both. Cached baseline results are never reused. With 3 repeats, a full run on the 60 dispatch tasks is 360 capped runs (60 tasks × 3 repeats × 2 configs).
4. The decision uses the mean per-task difference, with a 95% bootstrap interval over tasks. To improve, the interval's lower bound must be above zero on the primary metric. To stay as good (non-inferiority), the lower bound must be above −5 points. Either way, no secondary metric (cost, findings) may be worse by more than its margin: 5 points, or 10% for cost.
5. These sizes are a starting point, not a commitment. 3 repeats on 60 tasks gives an interval of roughly ±10 points, too wide for a −5-point non-inferiority test, so the task count and repeats are re-sized from real variance before evals are switched on.
6. Safety metrics have zero tolerance: any rise in territory violations, locked-test edits or isolation failures fails the run.
7. The holdout is a smoke check outside the decision. It must not fail outright, and it's never used to choose.
8. You approve the report (`avel eval report`) and merge the candidate's factory PR, and it becomes the new baseline.

**Live work.** Every real attempt records its factory commit and config hash, so first-attempt pass rate, rework and cost can be compared across factory changes. There's no automatic drift alert: you look at the numbers yourself and roll back by reverting a PR.

**Cost.** Eval runs will use the same rooms and caps as real work, go through the model proxy, run overnight and never take a mission's slot. Their budget is set when evals are switched on. It has to cover the weekly full missions (up to $150 each) and a promotion's 360 runs, so it won't be the $200 a month first proposed. Nightly runs cover only what changed. A full promotion run is scheduled, never automatic. One-shot grading uses the Batch API.

## Any stack

The agents' roles are language-free. All stack knowledge lives in swappable pieces: the stack layer of the knowledge base, the rules, and a check-runner image built per repo. Two mechanisms make any stack workable:

- **A stack readiness check at 0.4.** Code detects the toolchain (using the repo's dev-container config if it has one), finds the build, test and lint commands, and builds the runner image inside gVisor, with egress only through the package proxy (an isolation-suite case). It reports *ready*, *partial* (with the reason) or *not ready*, and you decide whether to go ahead.
- **Contracts checked on the running app,** so alignment works in any language (see the gate system).
- **A language with no rule pack** still gets the generic security checks (secret scan, dependency audit, generic Semgrep rules), but its verdict is capped at pass with the reason "no language security pack". The readiness check warns about this at 0.4, so you can decline the mission.

As you add resources for the stacks you use most, they move from "works" to "polished".

## Tech stack

The stack is set around oRPC. Mostly it's what avel-server already uses, set up the way oRPC expects.

| Layer | Choice | Why |
| --- | --- | --- |
| Runtime | Node LTS | The Agent SDK and the Docker and gVisor tooling are safest on Node. |
| HTTP server | Hono | Hosts oRPC, plus the routes that aren't in the contract: Better Auth, the GitHub webhook (it needs the raw body), the git endpoint for `avel link`, and the model proxy. |
| API contract | oRPC (`@orpc/contract`, `server`, `openapi`, `client`, `tanstack-query`) | One contract gives the server, a typed client and the OpenAPI docs, so none of them can drift. |
| Validation | Zod 4 | Supported fully by oRPC; the legacy Zod 3 schemas port over. |
| Database | Postgres and Drizzle, with reversible migrations | The Drizzle schema is the source of truth for tables from step 1 (see `docs/DATABASE.md`). |
| Auth | Better Auth: email and password, the passkey plugin, the Drizzle adapter, TanStack Start cookies | Already in avel-server; reconfigured from GitHub sign-in. |
| Web | TanStack Start, Router and Query; Tailwind v4; shadcn/ui | Start handles pages and server rendering only. All data goes through oRPC. |
| Rate limits | In memory, behind our own small wrapper | One service, so counters can live in memory. oRPC's rate-limit package is experimental, so if we use it, it sits behind the wrapper. |
| Logging | Our own structured JSON logger, with the request ID on every line | Small enough to own. No logging library. |
| Tests | Vitest, with procedures called in-process | No HTTP server needed to test a route. |
| Monorepo | pnpm workspaces and Turborepo; packages `contract`, `db`, `server`, `web`, `cli` | One repo; the contract is shared by server, web and CLI. |
| Tracing | OpenTelemetry, later | oRPC has instrumentation for it when we need it. |

**Not used, on purpose:**

- **Redis.** We're one service on one host. Postgres runs the jobs, rate limits live in memory, and the event stream runs inside the service.
- **tRPC.** It has no OpenAPI.
- **TanStack Start server functions for data.** Keeping data in one API means the CLI uses exactly what the web app uses.
- **drizzle-zod for API schemas.** It would leak table shapes into the API. API shapes are written as DTOs in the contract.
- **Pino.** Our own logger is enough.

## API routes

The factory needs 99 routes on 80 paths in 18 groups (cut from 109 on Nov 1), all defined once in the `contract` package with oRPC (`@orpc/contract`). The server implements the contract with `implement(contract)` and serves it in REST form through oRPC's OpenAPIHandler, mounted in Hono under `/api`. The web app (through oRPC's TanStack Query utilities) and the CLI call it with the typed oRPC client, so a change to the contract shows up as a type error in all three. The OpenAPI document is generated from the contract, and its docs page is served behind sign-in. Most routes read state. The work itself (starting dispatches, integrating, running gates) is started by code from events, never by a route.

**How the API is shaped:**

- **Nouns, not actions.** Paths are lowercase plural nouns with named parameters (`/missions/{missionId}/findings`), never `:id`. Something you decide (an approval, a decision, a release, an override, an acceptance) is a resource you create with POST under the object it acts on. A plain field edit is a PATCH, PUT only replaces a whole thing (the roster, a secret), and DELETE removes or revokes.
- **DTOs.** No route returns a Drizzle row. Each object has a written output schema in the contract and one mapper on the server (`toMissionDto`, `toFindingDto`), so internal columns (hashes, ciphertext, lease fields) never leave the server and the tables can change without breaking the API. Inputs and outputs are both validated against the contract's Zod 4 schemas. drizzle-zod isn't used for API schemas.
- **One error contract.** Every error has the same body, `{ code, message, details?, requestId }`, declared per procedure as typed oRPC errors, so callers handle them by `code`. Status codes: 400 bad input; 401 not signed in; 403 wrong role or token kind; 404 not found; 409 someone else changed it first (a stale `If-Match` version) or an idempotency key reused with a different body; 422 the move isn't allowed from the current state; 429 rate limited.
- **Rate limits** on sign-in (on top of the lockout), the agent routes (per dispatch token), GitHub webhooks and CLI device login. The counters live in memory because it's one service; a restart resets them, which is acceptable.
- **Lists** page by cursor (`?cursor=&limit=`, at most 100). Every response carries `X-Request-Id`, the same ID as `requestId` in an error body and in the logs, and `X-Contract-Version`, the contract package's version.
- **Streams** use oRPC's event iterator over server-sent events and resume from `Last-Event-ID`: the event's `seq`, or the trace ID for traces.

**Four callers, four kinds of credential:**

- **You:** web sign-in, or a 12-hour CLI session from `avel login`.
- **Agents:** a per-dispatch token, reachable only from inside a room through the host tool server.
- **Factory services:** Canon calls the model proxy with a service token. It holds no model key.
- **Outside services:** GitHub webhooks, checked by signature and deduplicated on `X-GitHub-Delivery`.

**Rules for every write route:**

- Every approval, decision, release, override and acceptance carries the version it applies to (`If-Match` with the checkpoint, plan, proposal, receipt or PR version), so you never approve something you didn't see; a stale version gets 409. Overrides, decisions, acceptances and pass approvals also take a written reason. Approvals and releases are one click.
- **Step-up (the one list; other sections point here).** Your password again is needed only for credential actions: writing a secret, creating or rotating a repo connection, and approving a CLI device login. A step-up grant is single-use, bound to one action on one target, and lasts 5 minutes.
- **Approvals never ask for a password.** That covers checkpoints, plan finalize, release, the pass approval, proposal choices (budget raises and re-pins included), accepting a finding, test changes, overrides and factory merges. They're one click in the web app, and the CLI can approve too. The remaining risk: a local agent that uses your CLI session could approve something, so CLI sessions last 12 hours and Claude Code should run with Bash permission prompts on.
- Every write carries an `Idempotency-Key`, kept in `idempotency_keys` for 24 hours with the caller and a hash of the body. The same caller, key and body returns the first response; the same key with a different body is refused. A response that carries a secret or token is never stored: a token-minting route (`POST /api/cli/sessions`) answers a replayed key with 409 and never returns the token again.
- Every write is logged to `audit` and emits an event. Writes you make count your minutes; agent and webhook writes don't.

| Group | Routes | Caller |
| --- | --- | --- |
| Auth | `/api/auth/*` (Better Auth: email and password, an optional passkey, lockout after 10 failed attempts for 15 minutes, your session, and step-up grants); `POST /api/cli/device-logins` (starts a login with a device code and a short user code); `POST /api/cli/device-logins/{userCode}/approvals` (you approve it in the web app; step-up); `POST /api/cli/sessions` (the CLI polls with its device code and gets its session once approved; never replayable); `GET /api/cli/sessions`, `DELETE /api/cli/sessions/{sessionId}`. CLI sessions are stored hashed, last 12 hours, and carry the operator scope. | You |
| Health | `GET /api/health`; `GET /api/doctor` (database, Docker and gVisor, proxies, token expiry dates, the last isolation run) | You, CLI |
| Clients and repos | `GET/POST /api/clients`, `GET/PATCH /api/clients/{clientId}`; `GET/POST /api/repo-connections` (one per client, with a read token and a write token limited to that client's repos; creating steps up); `PATCH /api/repo-connections/{connectionId}` (edit its `repos[]`; step-up); `DELETE /api/repo-connections/{connectionId}` (revokes both tokens; the record stays for history); `POST /api/repo-connections/{connectionId}/verifications` (checks both tokens and their scopes); `POST /api/repo-connections/{connectionId}/rotations` (replaces the read or the write token without changing the connection; step-up). Delivery checks that the mission's client matches the connection's, and that the target repo is in its list. | You |
| Packages | `GET /api/packages` (a paged list; read-only: packages are defined in `factory.yaml` and change through a factory PR) | You |
| Missions | `GET/POST /api/missions` (a new mission starts as a draft with a client); `GET/PATCH /api/missions/{missionId}` (state, gate strip, onboarding progress and checkpoints, why, deliveries; PATCH links a repo connection); `POST /api/missions/{missionId}/pauses` and `DELETE /api/missions/{missionId}/pauses/{pauseId}` (pause, and resume, which pops the pause stack); `POST /api/missions/{missionId}/cancellations`; `POST /api/missions/{missionId}/context-runs` (read the context again after it was blocked); `POST /api/missions/{missionId}/readiness-waivers` (proceed on a partial readiness result, with a reason); `POST /api/missions/{missionId}/finalizations` (approval #1, with the plan version); `POST /api/missions/{missionId}/pass-approvals` (the receipt hash and a reason); `POST /api/missions/{missionId}/releases` (approval #2, with the receipt hash and, for a pass, the pass approval ID); `POST /api/missions/{missionId}/refreshes`; `POST /api/missions/{missionId}/budget-increases` (opens a budget-increase proposal that names the module or mission budget and the amount, from 0.3, Gate 1 or mid-mission); `GET/POST /api/missions/{missionId}/messages` (Canon chat history from the onboarding messages table, and your turn with Canon; replies stream on the trace stream) | You |
| Gate 0 | `GET/POST /api/missions/{missionId}/uploads`, `DELETE /api/uploads/{uploadId}` (refused once an approved fact cites the upload); `PATCH /api/checkpoints/{checkpointId}/sections/{sectionKey}`; `POST /api/checkpoints/{checkpointId}/drafts` (generate); `POST /api/checkpoints/{checkpointId}/approvals`; `POST /api/checkpoints/{checkpointId}/change-requests`; `POST /api/checkpoints/{checkpointId}/reopenings`; `PATCH /api/facts/{factId}` (confirm or reject); `POST /api/questions/{questionId}/answers`; `PUT /api/missions/{missionId}/secrets/{secretName}` (write-only; step-up). Accepting a checkpoint finding uses the findings routes. | You |
| Plan and roster | `GET /api/missions/{missionId}/plan` (`?version=`); `GET /api/roster`, `PUT /api/roster` (replaces the whole roster as a new version, filed as a factory-repo PR; running missions keep theirs). The roster lists the agents; their usage is in `/api/metrics`. | You |
| Dispatches | `GET /api/missions/{missionId}/dispatches` (with DISPATCH.md); `GET /api/dispatches/{dispatchId}` (task doc versions, attempts, room); `POST /api/dispatches/{dispatchId}/overrides` (start, retry, park or cancel by hand, with a reason) | You |
| Decisions | `GET /api/pending-decisions` (everything waiting on you, shown as Decisions in the nav: proposals of every kind, including dependency requests, quarantines, test changes, suppressions, Gate 5 findings, budget increases and re-pins, plus open factory PRs); `GET /api/proposals/{proposalId}`; `POST /api/proposals/{proposalId}/decisions` (choose an option with a reason) | You |
| Gates and findings | `GET /api/missions/{missionId}/gates` (every gate evaluation and integration commit); `GET /api/integration-commits/{integrationCommitId}` (results and log); `POST /api/missions/{missionId}/overrides` (Gates 3 and 4 only, and either caps the verdict at pass; any Gate 1 or Gate 2 override is refused, and Gate 5 has none: its proposals take accept, rework or cancel, and an integrity failure only rework or cancel); `GET /api/missions/{missionId}/findings`; `PATCH /api/findings/{findingId}` (confirm or dismiss, with a reason); `POST /api/findings/{findingId}/acceptances` (accept with a reason; caps the verdict at pass, and is refused for an integrity failure at Gate 5) | You |
| Receipts and delivery | `GET /api/receipts/{receiptId}` (`?verify=1` rechecks the hash); `GET /api/deliveries/{deliveryId}/archive` (the zip) | You, clients later |
| Events and traces | `GET /api/events/stream?missionId=` (server-sent events through oRPC's event iterator; resumes from `Last-Event-ID`, the event's sequence number, replaying up to 30 days, so there's no separate catch-up page); `GET /api/traces/stream` with `?attemptId=` or `?sessionId=` (agent and Canon traces: messages, tool calls and chat deltas; resumes from `Last-Event-ID`, the trace ID) | Web, CLI |
| Your work | `POST /api/operator/events` (commits from the git hook, CLI activity heartbeats, hand-entered time); `PATCH /api/time-entries/{timeEntryId}` (confirm or edit); `GET/POST /api/notes` (your notes on a mission, from the web or CLI); `/git/missions/{missionId}.git` (git over HTTP for `avel link`, with your CLI session; pushes only to `operator/<mission>`) | CLI, you |
| Metering | `GET /api/metrics` (`?missionId=` or by package, and by factory commit); `POST /api/payments` | You |
| Factory repo | `GET /api/factory/versions` (merged commits, which missions are on each, and knowledge releases); `GET /api/factory/changes` (open PRs); `POST /api/factory/changes/{changeId}/merges` (approve and merge); `DELETE /api/factory/changes/{changeId}` (close without merging) | You |
| Library | `GET/POST /api/library/{kind}` and `GET/PATCH /api/library/{kind}/{itemId}`, written out per kind: skills (create, or upload a skill folder; each records its source: upload, written or import), knowledge entries, rules and project templates; `GET /api/rules/{rulesVersion}/bundle` (what `avel check` runs); `GET /api/missions/{missionId}/closeout-items` (confirmed findings and lesson candidates to write up). Creating or changing any of these opens a factory PR; approving, retiring or promoting one is merging that PR. | You |
| Evals (later) | `GET /api/eval/configs` (live results per config). Run and report routes come back with the evals module. | You |
| Audit | `GET /api/activity` (overrides included). Rooms have no routes: a dispatch shows its room, cancelling a dispatch kills its room, and `/api/doctor` reports room health. | You |
| Agent (host tool server only) | `POST /api/agent/reports` (completion report); `POST /api/agent/findings` (reviewers only); `POST /api/agent/dependency-requests`; `POST /api/agent/escalations` (test disputes, test changes, suppressions, contract changes); `POST /api/agent/progress-notes`; `GET /api/agent/kb-entries?query=` (the kb-search tool: read-only, scoped to the mission's client, its stack and global entries; logged in the trace) | Agents |
| Webhooks | `POST /api/webhooks/github` (PR merged or closed, factory-repo PRs included; deduplicated on `X-GitHub-Delivery`; a factory merge by anyone but the factory's GitHub App is ignored and raises an alert) | GitHub |

**How agents reach the factory.** Rooms have no way out except their proxies, so agents never call these routes over HTTP. Their control-plane tools (reports, findings, dependency requests, escalations, progress and the knowledge search) run as an MCP server on the host, while file and command tools stay in the room. The server is reached through the room's proxy with the dispatch token, checks every call against that token's dispatch and role (only reviewers file findings), and calls the `/api/agent/*` routes. The second vendor's harness uses the same server.

**Deliberately not routes:** starting a dispatch, retrying, integrating, merging and running a gate. The scheduler and integrator do those from events, so the only way for a person to trigger one is a logged override. The model proxy and egress proxy are separate services on the host, not app routes.

**From avel-server:** health, skills, and clients port. The GitHub webhook's signature check ports with changes. The findings, agent and webhook routes are reference only, rewritten for the new schema. The legacy repo connection is keyed by engagement and is re-keyed to the client. Intake, Canon fetch modes, engagements, presets, playbooks, manual dispatch create and start, and the gate-job routes stay behind.

## Data model

The database design lives in `docs/DATABASE.md` in avel-server, and that file is canonical. It holds the spine, the ERD, every table with its required and optional fields, and the integrity rules: foreign-key actions, CHECKs, indexes and types. The onboarding doc's tables (sessions, messages, facts, checkpoints, plans, plan modules, requirements, scenarios, checks) are folded into it, so it wins wherever they differ. From build step 1, the Drizzle schema in the `db` package is the source of truth, and the file's diagrams are generated from it in CI.

**The spine:** client → mission → plan (one row per version) → plan module → module run → dispatch → attempt → integration commit; then, at the mission level, gate run → receipt → (pass approval) → release approval → delivery. Gate evaluations are a ledger beside the spine, one row per gate result. Nothing on it is ever deleted: ending something is a state change, and every foreign key refuses deletes. Paused and blocked are holds (open `mission_pauses` rows), not mission states.

The gate reads dispatches only through `gate_dispatch_view`: status, agent roles, result commit and report status. That narrow interface stays, while \`decide()\` itself is redesigned as v5 (see the gate system in the After Canon tab).

## Measurement and receipts

The core metric is revenue per hour of human oversight, by package. The floor is $150 an hour (a 50% margin at a $75 loaded cost), and the target is $250–500.

**Contribution margin sits beside it.** Revenue per oversight hour leaves AI and compute costs out, so on its own it could be improved by buying more retries. Every receipt and the package dashboard also show contribution margin: cash collected, minus AI cost, compute, and your minutes at the $75 loaded rate.

```latex
\text{revenue per oversight hour} = \frac{\text{cash collected for the mission}}{\text{human minutes on the mission} / 60}
```

| Measure | How it's captured |
| --- | --- |
| Your onboarding time | Metered from Canon's first screen to finalize |
| Approvals, reviews, proposals, overrides | A timer from when the screen or `avel` command opens until the decision, with idle time cut out |
| Hand fixes | Your commits on your operator branch create a time entry for you to confirm |
| Client calls | Logged by hand against the mission |
| Tokens and cost | Per attempt from the model proxy, the meter of record, priced from the versioned price table |
| Deadline clock | Starts at plan approval, and pauses while the mission waits on you or the client |

Every receipt prints the split: your minutes by activity, AI tokens and cost by vendor, the agents involved and the number of overrides. That's the Builder.ai lesson made routine: the receipt never lets the AI look bigger than it was.

The dashboard shows one row per package: missions, median human minutes, median AI cost, revenue per oversight hour and on-time rate. Until real missions run, every figure is labelled *estimated*.

## Build order

This is the single build order; the Port inventory follows it. It starts with the foundation that everything runs on (durable jobs and events, then the hardened host), then the gate, because everything else is judged by it. Each step ends with a test that proves it works, and no step depends on a later one. Durations stay blank until the first mission is measured.

1. **Scaffold.** Same stack in one monorepo (the server, the web app and the shared `contract` package), with all 19 modules as packages in one service. CI, AGENTS.md / CLAUDE.md, email-and-password sign-in with an optional passkey and lockout, single-use step-up grants for credential actions, 12-hour CLI sessions, envelope encryption for secrets with the key in AWS KMS, the `idempotency_keys` store (new code), the jobs table with leases and lease epochs, the outbox and commit-ordered events, the `avel/factory` repo with branch protection and a first `factory.yaml` loaded by commit SHA, and a minimal approval page (what's waiting, with approve and reject) so every later step can be approved before the full web app exists. *Done when* CI is green on an empty app; the contract package builds and the OpenAPI document is generated from it; one sample route shows the DTO mapper (no internal column in its output), a typed error in the shared error body with its X-Request-Id, an idempotent replay, and a 429 from its rate limit; a job whose worker is killed is picked up within a minute and does its work once; a write from a worker holding an old lease epoch is refused; a step-up grant used twice or for another target is refused; a secret round-trips through KMS and is stored only as ciphertext; a token route replayed with the same key returns 409 without the token; and a change to `factory.yaml` has no effect on a mission until its PR is merged and a new mission is finalized on it.
2. **Host and rooms.** The dedicated host, gVisor rooms, the model proxy (key and meter), the egress proxy, the offline package cache, the mission repo over HTTP with per-attempt git credentials (read the mission's branches, push only the attempt's own branch), the credentials table with expiry and reaper revocation, the delivery-worker process (the only one that can decrypt write tokens), a sandboxed parser for uploads, and runner-image builds inside gVisor. *Done when* the isolation suite passes from inside a room in CI and on the host; a push to any branch but the attempt's own is refused; a token left from a killed attempt is revoked after a host restart; a runner-image build can reach nothing but the package proxy; and the main service can't decrypt a write token.
3. **Gate v4 parity.** `decide()`, producers and receipts, `gate_dispatch_view` stubbed with fixtures, and the rules registry with `avel check` v1. *Done when* fixture missions give receipts identical to avel-server's, judge coverage included.
4. **Runner, harness and delivery.** The Claude harness with its control-plane tools on the host tool server, one dispatch in a room under its caps, Gate 3 in a fresh check room, delivery of the exact verified commit as a PR. Until step 8 adds budgets, agents run under the API workspace spend limit only, and until 9a, Gate 3 uses a hand-written lock manifest. *Done when* a hand-made task doc runs in its room under its caps and opens a PR from that exact commit on a test repo; the isolation suite's host tool server cases pass (a room calling as another dispatch or another role is refused); and delivery refuses a connection whose client or repo doesn't match the mission.
5. **Events and the CLI.** The live stream and the trace stream, `avel watch`, `avel doctor`, `avel link` cloning through the factory's git endpoint, and its git hooks pushing to `operator/<mission>`. *Done when* a run streams live, a reconnect resumes with no missing sequence numbers, two copies of one event consumer never both act on an event, and a commit pushed from a linked folder lands only on `operator/<mission>`.
6. **Plan, roster and packages.** *Done when* every validator refusal listed in the onboarding doc's appendix has a test that fails to save with that reason, and a roster change creates a new version that running missions ignore.
7. **Gate 0 with Canon.** Built to the onboarding doc's spec, with Canon calling the model proxy with a service token. *Done when* the GTS Diesel reference mission onboards end to end to an approved plan, and the onboarding doc's guard tests pass.
8. **Render, Gate 1 and budgets.** DISPATCH.md and task docs from the plan, the price table, budget reservations, the $4 attempt cap, and the proxy's per-request reservations. *Done when* the same plan renders byte-identical documents twice; Gate 1 refuses each failure in its test list (a territory gap or overlap, an unresolved ID, a dependency cycle, a migration conflict, an empty section, and a module or the mission over budget by the check in Cost control); a reservation the budget can't cover is refused (the scheduler parking the dispatch is tested in 9b); parallel requests can't overspend a budget; an attempt that reaches $4 ends as `capped`, and one refused by a budget as `budget_parked`; and the reservations of a lost attempt and of an ended Canon session are released.
9. **Tests, integration and the ladder,** in three parts, each with its own done-when:
   - **9a. Tests pipeline, integrator and Gate 2.** Test dispatches on their own attempt branches, fail-first checks, a 3-run flakiness check at lock time, locks (test files, fixtures, test config, and the test scripts in `package.json` by value), `tests`, `module`, `dependency` and `operator` integration commits, and flaky-test classification with quarantine proposals. *Done when* a test that always passes is rejected; a test that flips across 3 runs at lock time goes back to its writer; a dependency commit that changes only dependencies and the lockfile lands; an operator commit with a failing test is rejected at Gate 2; a test that's red on the base commit opens a quarantine proposal without blaming the incoming module, while the incoming module's own failing locked test is recorded as its failure (the ladder itself is tested in 9b); and a scenario spanning two modules is locked with the later one and runs only once both have landed.
   - **9b. Scheduler, retry ladder and Gate 3.** Leases and slots, budget parking, one ladder per module on one vendor, attempt branches with git read access for retries, and the check room judging each role. *Done when* a fixture plan runs to Gate 4 with no human action; it survives a worker killed mid-run; forced failures walk the ladder to parked; a dispatch the budget can't cover parks before it starts; Retry 1 starts from the previous attempt's checkpoint commit; and a locked test edited by a builder fails Gate 3.
   - **9c. Gate 4, fixes, rework, `decide()` v5 and refresh.** Finding routing, fix attempts before a module lands, rework from the branch head after it lands, the mission-review rework limit, Gate 5 proposals, pass approvals, refresh. *Done when* an unlanded module's review finding goes to a fix attempt from its own last attempt commit; a contract change after modules have landed sends the landed modules that touch it through rework and the mission branch stays green; an integrity failure at Gate 5 offers only rework or cancel; a pass approval leaves the hashed receipt unchanged; a refresh onto a moved client main re-runs Gates 2, 4 and 5 and asks for a new release approval; and `decide()` v5 gives the expected verdict on every fixture in its table (e2e is not a gate kind of its own: the scenarios run under `acceptance`), caps the verdict at pass after any override at Gate 3 or 4, and refuses any override of Gates 1, 2 or 5.
10. **Receipts and margin.** The receipt's cost split by cache type, budget-increase proposals, contribution margin. *Done when* a fixture receipt shows minutes and cost by cache type and contribution margin, a module that passes $15 parks, and a raise names the module or mission budget and its amount and is printed on the receipt.
11. **The web app.** A fresh UI: Decisions, Live, Missions, the Gate 0 chat, receipts, the library. *Done when* every UI rule's guard test passes and the operator flow is covered by interaction tests.
12. **Skills, knowledge, rules and templates.** Skills, knowledge releases, scoped rule packs and project templates in the factory repo; skill selection from `factory.yaml`; closeout's list of findings and lesson candidates; the CI rule test; the agents' knowledge search. *Done when* an uploaded skill reaches a room, read-only, only after its PR is merged; the runner logs which skills were opened; a rule PR whose rule doesn't fire on the finding's commit and pass on the fixed commit fails CI; a client rule never runs on another client's mission; a knowledge search never returns another client's entries; and Canon offers a matching template at 0.3.
13. **Dry run on our own code.** *Done when* an internal mission reaches a verified receipt and a PR.
14. **First real mission.** *Done when* its measured numbers replace the estimates.

**Later:** the second vendor, added once retry data shows Retry 3 needs it; evals (eval sets, runs, reports and the promotion rule), switched on once there are enough replayable dispatches to fill the dispatch set; and the v2 features (the Librarian, the Factory MCP server and the scorers; see Deferred to v2). Until then, the interim rule in Agent evaluation applies.

## Deferred to v2

Three features are designed but not built in v1. The decisions below stay, so v2 starts from them. What v1 already provides for them: the `mission.closed` event, the factory repo and its `templates/` folder, and closeout's list of findings and lesson candidates.

**The Librarian**, a second factory agent that keeps the library. Its job is knowledge base management (drafting correction pairs and lessons, removing duplicates, retiring stale entries, cutting releases), project templates (proposing updates from closed missions of that package type), and rules. It doesn't draft skills.

- **Trigger:** the `mission.closed` event, or a request from you.
- **Runs** as a dispatch with the role `librarian` in its own room: no network, its own dispatch token, metered at the model proxy, capped at $4 a run, with a $20 monthly budget in `factory.yaml` and a monthly spend ledger that resets on the 1st.
- **Reads** through read-only host tools: the closed mission's findings, receipts and integration results, diffs at named commits, and the library index.
- **Writes** only through `factory.open_pr`, which the host refuses for any path outside `kb/`, `templates/` and `rules/`, so it can never touch `factory.yaml`, images, budgets or skills. Its branches are `librarian/*`, and branch protection stops it merging. At most 5 PRs are open at once; when it hits a limit it stops and reports.
- **Rule PRs** are tested by CI: each rule must fire on the finding's commit and pass on the fixed commit.
- **Client material is untrusted.** Code tags anything drawn from a client's code or findings with that client. A PR draws on one client only; its client text is scanned for hidden Unicode, instruction-like text and URLs, and shown in fenced quotes with its provenance; and it goes only into that client's layer or template. A global entry needs a rewrite with every client's text removed, approved by you. PRs are listed by time, never ranked by the Librarian.

**The Factory MCP server**, so your local Claude Code can work with the factory.

- **Read:** mission status, why, findings, receipts, the event tail and spend.
- **Limited writes:** notes, proposals that land in Decisions, and a mission drafted from a brief, which becomes a draft onboarding session whose brief is stored as an `operator_brief` source, never as facts you said. You still go through 0.1–0.4.
- **Boundary:** the server refuses approvals, releases, overrides, secrets and merges for MCP tokens, whatever the client asks. Agent-written and client-derived text comes back labelled untrusted, with control characters and hidden Unicode stripped. Tokens are revocable, minting one needs step-up, every write carries an idempotency key, and every call is audited. `avel mcp` is a stdio wrapper.

**Advisory scorers.** A cheap model scores finished modules and missions against written rubrics: spec coverage, test quality, clarity, how precise the findings were, and how well the task doc was followed. Scores never gate. The grader is versioned separately from the factory commit it judges. Agreement with you is measured against your Gate 4 finding decisions. Budget: $30 a month in `factory.yaml`.

## Open questions

- [ ] **Roster:** your revision of which agent fills each role.
- [ ] **First real mission:** a Verified diagnostic, a single-agent fix, or GTS Diesel's landing page?
- [ ] **Second vendor** for Retry 3: which one?
- [x] **Repo shape:** a monorepo with the server, the web app and the shared contract package, by default. Change it if you'd rather keep the server alone.
- [ ] **Deadline clock:** start at plan approval (as drafted), or when the client pays?
- [x] **KMS provider:** AWS KMS by default (one key, envelope encryption). Change it if you'd rather use another.

## Sources

- [Canon Onboarding — Software Factory Map v0.5](https://claude.ai/artifact/HBrmhrcNcpDoLLhwW2F4Q2): the rubric, the build spec and the research behind them
- [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing): the seed prices (checked Nov 1, 2026), and the Batch API at 50% off input and output
- [Claude Code costs](https://code.claude.com/docs/en/costs): per-developer averages, and workspace spend limits
- [Effective harnesses for long-running agents](https://anthropic.com/engineering/effective-harnesses-for-long-running-agents): feature lists, checkpoints and the startup smoke test
