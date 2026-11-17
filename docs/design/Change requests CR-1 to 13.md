# Change requests

Nov 1–2, 2026 · @javaris

The design was frozen at v0.6. These are changes you've asked for, **all accepted on Nov 2** (CR-1 to CR-13). They're applied to the docs and the repo as Step 0 (see CR-12), so code and docs move together.

**Precedence:** where these change requests conflict with the design v0.6 docs, these win. Within this doc, the later decision wins.

## Decisions log (Nov 2)
- CR-1 to CR-13 are accepted. Your recommendations-by-default rule: where you said "go with your recommendations", the recommendation is the decision.
- **CR-6:** rename the schema too (`claim_no`, `claim_expires_at`, `'claimed'`).
- **Claims:** a claim lasts 30 seconds, workers check in about every 10 seconds, and a job is marked dead after 5 tries.
- **Step 1 scope:** the longer scope from the design doc and the Port inventory, minus secrets (CR-12).
- **The After Canon tab:** job kinds, the event catalog and the state machines are taken from the repo's contract and schema. Anything that conflicts with the After Canon tab later becomes a change request.
- **Model tiers:** builders on Opus (CR-11). Also on Opus: Canon's breakdown drafts, Brennan, Zero and Axis, since a contract or spec mistake costs every module built on it. Everyone else on Sonnet: Canon's interview, Nemi's onboarding work, Leah, Zane, Fenn, Rigg and Breach. Revisit with real numbers.
- **Browsers and screen sizes:** the CR-9 defaults are accepted.
- **Leah's budgets:** WCAG 2.2 AA and Google's "good" Core Web Vitals (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1), set per package in `factory.yaml`.
- **An accessibility miss below AA** is handled like any finding: it goes to a fix attempt; if you accept it with a reason instead, the verdict is capped at pass.
- **Zero's UI contract** shows in the live view only. No extra approval, so you still approve twice per mission.
- **CR-13, project kinds:** accepted. Internal and template missions keep the $150 mission budget and the same budget rules. Breach runs on template missions. The internal project for the live run is yours to supply (not a booking app).
- **Still open:** the internal project for the live run (you'll supply it), the host provider (Step 2), pricing local models (when the CR-5 adapter is built), the first real mission (Step 14).

## CR-1: Secrets move to Step 4
- **What:** Step 1 no longer builds KMS envelope encryption. Secrets, the write-only secrets route, client repo connections and the delivery worker land together in Step 4.
- **Why:** not needed yet. The Port inventory already puts the secrets interface in Step 4.
- **Effects:**
  - Step 1 drops "a secret round-trips through KMS".
  - Step 2's "the main service can't decrypt a write token" moves to Step 4.
  - Step-up for secret writes waits for Step 4.
  - Repo connections need both secrets on every row, so they wait for Step 4 too. PR and push delivery, and Canon reading a repo at 0.1, wait with them. Zip delivery is unaffected.
- **Touches:**
  - design doc Main: build order Steps 1, 2 and 4;
  - project instructions: the Step 1 list;
  - tables: none (`secrets` stays in the schema, unused until Step 4).

## CR-2: "Money" becomes "Cost"
- **What:** rename the Money domain to Cost.
- **Why:** it holds what work costs, not what's paid. Payments are revenue and already sit under "Missions and money in", which stays as it is.
- **Touches:**
  - the domain label in the `db` package, which regenerates the ERD;
  - DATABASE.md (spine branches and the "Money and time" section);
  - the design doc's references.

## CR-3: The host is undecided
- **What:** remove the dedicated-host specifics from Step 2. Step 2 covers rooms, proxies, git credentials, the credentials reaper, the upload parser and image builds. The isolation suite runs in CI until a host is chosen.
- **Why:** the host was never settled with you. Only the rooms were.
- **Touches:**
  - design doc Main: the Oct 31 "rooms are hardened" row and build Step 2;
  - Sandbox doc: the "Where the host comes from" section and the host open question.

## CR-4: Remove GTS Diesel
- **What:** Step 7 is done when a reference mission onboards end to end. GTS Diesel also leaves the eval sets and the open question about the first mission. Per CR-13, the reference mission is your first internal project.
- **Touches:** design doc Main: build Step 7, Agent evaluation (eval sets), Open questions.

## CR-5: Model-agnostic factory (Claude first, then Codex and local models)
- **What:** no part of the factory assumes one vendor. Claude ships first.
  - The harness is an interface with one adapter per vendor. The Claude Agent SDK adapter comes first.
  - The model proxy speaks each vendor's API, not only Anthropic's messages endpoint. It stays the only key holder and the meter of record for every vendor, local models included.
  - `factory.yaml` maps each role to a vendor and model.
  - "Second vendor for Retry 3" becomes "any configured vendor".
  - Skills load through the Claude Agent SDK for Claude. Other vendors use the `skill_read` tool, which is already kept for them.
  - Cache-write splits are recorded where a vendor reports them.
  - Local models get a configured price in `price_table`, so budgets and caps still apply. Open: $0 or a compute rate.
  - Candidates for the Codex and open-weight adapter: jcode (only if its swarm, memory, repo-config auto-loading, telemetry and subscription logins can be confirmed off) and the Agent Client Protocol.
- **Touches:**
  - design doc Main: decisions log, modules (`harness`, `metering`), Cost control, Tech stack, Retry protocol;
  - Sandbox doc: the model key row;
  - tables: `price_table` and `attempts` already carry `vendor`; `usage_log` has `model` but no `vendor` (add it).

## CR-6: Plain terms for leases
- **What:** "claim" instead of "lease", in the docs and the schema:

  | Old | New |
  | --- | --- |
  | lease | claim |
  | `leased` (job state) | `claimed` |
  | `lease_until` | `claim_expires_at` (claim expiry) |
  | renewing the lease | checking in |
  | `lease_epoch` | `claim_no` (claim number) |

  "Reaper" stays. The schema already uses `claimed_by`, so "claim" matches what's there.
- **Why:** plainer, and it reads the way the work actually happens: a worker claims a job, checks in while working, and a stale claim number can't save.
- **Decided:** rename the schema too:
  - `jobs.lease_epoch` → `claim_no`
  - `jobs.lease_until` → `claim_expires_at`
  - the `'leased'` state → `'claimed'`
  - `consumer_cursors.lease_epoch` → `claim_no`
  - the index and CHECK names `jobs_expired_leases_ix` → `jobs_expired_claims_ix`, `jobs_lease_ck` → `jobs_claim_ck`
- **Touches:**
  - design doc Main and After Canon (durable execution wording);
  - project instructions (the "Durable work" rules);
  - DATABASE.md (Plumbing);
  - `claude/Jobs and workers.md`.

## CR-7: The frontend team, contract-first
- **What:** the frontend works contract-first, like the API: design system, then UI contract, then builders.
  1. **Nemi** owns each project's design system (tokens, CSS variables, motion, the whole system), drawn from the factory's design library.
  2. **Zero** (formerly Axis) takes Nemi's design system and the plan, and writes a UI/UX contract per feature: flows, screens, states, the components and tokens each screen uses, and its accessibility requirements.
  3. **Fantem** and **Leon** build to Zero's contract. **Ghost** builds the data layer each screen needs.
  4. **Fenn**, **Leah** and **Zero** check the result.

- **The team:**

  | Agent | Kind | Covers |
  | --- | --- | --- |
  | Nemi | Factory agent (like Canon), plus builder for `design-system` | Keeps the factory's design library. Owns each internal and client project's design system. Builds the tokens into the repo. No longer a test writer. |
  | Zero | FE lead: new roles `ui-contract` and `review-frontend` | Writes the UI/UX contract before the build. Reviews every frontend module against it, Nemi's design-system module included. Never builds. |
  | Fantem | Builder, `frontend-components` | Shared UI components, built to Zero's contract with Nemi's tokens |
  | Leon | Builder, `frontend` | Pages and screens, routes, forms, and components local to one route |
  | Ghost | Builder, new work kind `frontend-data` | API client, data fetching and caching, state management |
  | Leah | Review only: new role `review-a11y-perf` | Accessibility and performance (details below) |
  | Fenn | `test-unit` and `test-e2e` on frontend modules | Unit and component tests, and browser end-to-end tests (QA automation); see CR-9 |

- **When Nemi runs:**
  - **At onboarding (0.4):** turns the client's brand assets into the project's design system, or picks up the one already in the library, and proposes it for you to approve with the checkpoint.
  - **As the first module of each mission:** builds the approved design system into the repo (tokens, CSS variables, motion). Every frontend module depends on it. Zero reviews it and Leah checks its contrast and motion.
  - Changes to the design library itself go through factory PRs you approve.
- **Territories.** Default paths, which Canon adapts to the real tree at 0.4:

  | Owner | Owns |
  | --- | --- |
  | Nemi | tokens, theme and CSS variables, motion (for example `src/styles/**` and the theme config) |
  | Fantem | the shared component library (for example `src/components/**`) |
  | Leon | routes and pages, plus components local to one route (for example `src/routes/**`, with route-local components in a private folder beside the route) |
  | Ghost | the API client, data hooks and stores (for example `src/data/**`) |

  - **Zero's contract decides shared or local.** Each component in the contract is tagged `shared` (Fantem) or `local` (Leon).
  - **Promotion.** When a second screen needs a local component, it doesn't move mid-module. It becomes `shared` through an additive contract change and is built by Fantem in a later module.
  - **Import boundaries are rules, checked by `avel check`:**
    - screens get data only through Ghost's data layer, never by calling the network directly;
    - shared components don't import the data layer;
    - nothing hard-codes a value that a token covers.
- **Contract changes.** Zero's UI contract is locked like tests, and builders can't edit it.
  - **Additive changes** go through without you when Zero and Brennan both accept them. Additive means a new optional state or variant, a new component, a new screen that doesn't change an existing flow, or a copy change.
  - **Breaking changes** go to you as a proposal. Breaking means removing or renaming a component, changing an existing flow, or changing the data a screen needs (which reaches Ghost's module).
  - A change that requires editing a locked acceptance test still needs you, as it does today.
- **Leah, accessibility and performance (review only):**
  - **Read-only, like the other reviewers.** It files findings; fixes go back to the builder through a fix attempt.
  - **Covers what automated tools miss:** keyboard paths and focus order, focus traps, whether labels, alt text and errors make sense when read aloud, contrast in every state (hover, disabled, error, dark mode), reduced motion, 200% zoom, and performance root causes (bundle size, render-blocking assets, images, request waterfalls in Ghost's data layer). axe and Lighthouse stay as code checks at the gate.
  - **Runs at four points:** Nemi's design system (token contrast and motion), Zero's UI contract (focus order, labels, states), after each `frontend-components` and `frontend` build (alongside Zero), and the accessibility and performance area of Diagnostic audits. On `frontend-data` modules it runs only when a performance trigger applies.
  - **Evidence rule:** accessibility findings cite the WCAG success criterion, the element's selector and the steps to reproduce. Performance findings cite the metric, its value against the budget, and the trace or bundle report. Each finding proposes the regression check that closes it (an axe rule, a keyboard test Fenn writes, or a bundle-size limit).
  - **Budgets (decided):** WCAG 2.2 AA and Google's "good" Core Web Vitals (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1), per package in `factory.yaml`. A miss below AA is handled like any finding: a fix attempt, or your acceptance with a reason, which caps the verdict at pass.
  - **Room tools:** axe, Lighthouse, a screen-reader tree through Playwright, and a bundle analyzer. Adding them is a room image change through a `factory.yaml` PR.
  - **Skills:** a WCAG 2.2 AA checklist, keyboard and screen-reader testing, Web Vitals, bundle analysis.
  - **Lab numbers:** rooms have no real users, so performance is measured in the lab, as the median of 3 runs.
- **The design library:**
  - A new folder in the factory repo, holding base design systems, motion presets and each client's design system.
  - Changed by PRs you approve, like skills and knowledge. Agents inside a mission never write to it.
  - Each mission pins it through its factory commit, so a mission's design system never changes under it.
  - Internal projects use the same library as client projects.
- **Effects:**
  - A frontend module waits for its locked tests and its locked UI contract before the build starts.
  - Zero's UI contract shows in the live view; it needs no approval from you (decided).
  - Canon splits a feature into data, components and screens modules only when it's big enough to need it. Territories can't overlap (checked by B8).
  - The roster maps (dispatch role, work kind) to an agent, not role alone. The design already describes it as "the map from work kind and dispatch role to agent".
  - No work grades itself. Zero writes contracts but never builds, and Zero's contract is checked by Brennan's spec review. Disputes over Zero's or Leah's findings go to Brennan.
  - Cost: more dispatches per feature. Reviewers and test writers run shorter than builders, so their real cost per dispatch is unknown until missions are metered. The budget check at 0.3 and Gate 1 catches any mission that doesn't fit, and calibration sets the real estimates per role.
  - New starter skills: component testing, accessibility, performance and the frontend data layer (for example TanStack Query).
  - No mobile work for now: no `mobile` work kind and no mobile engineer.
- **Touches:**
  - contract enums: `WorkKind` (add `frontend-components`, `frontend-data`); `DispatchRole` (add `ui-contract`, `review-frontend`, `review-a11y-perf`); the integration commit kinds (add one for UI contracts);
  - CHECKs: `plan_modules.work_kind`, `dispatches.role`, `eval_tasks.role`, `integration_commits.kind`;
  - schema: the design library index (a new table, or a kind on an existing library table) and a mission's pinned design system;
  - rules registry: the three import-boundary rules;
  - Canon doc: the work-kind and dispatch-role tables, the task doc by role, brand assets and the design system at 0.4;
  - design doc Main: `roster`, `knowledge` (the design library), Factory as code, the starter skill library, the scheduler's readiness rule.

## CR-8: The backend team, contract-first
- **What:** the backend mirrors the frontend. Axis writes the API contract per feature before the build; the builders implement it; Ghost builds the frontend data layer to the same contract.

  | Agent | Kind | Covers |
  | --- | --- | --- |
  | Axis | BE lead: new roles `api-contract` and `review-backend` | Writes the API contract per feature (endpoints, DTOs, errors, events) before the build. Reviews every backend module against it, Atlas's `maintenance` and `infra` modules included. Never builds. |
  | Soap | Builder, `api` and `data` | Endpoints, server logic, auth flows, schema, migrations, queries, seed data. Replaces Dunn. |
  | Iyo | Builder, `services` and `ai` | Third-party APIs, payments, email, webhooks, background workers, LLM features inside client apps |
  | Atlas | Factory agent, plus builder for `maintenance`, `infra` and `docs` | Inside a mission: fix chains (traces, pinning tests, refactors), CI, Docker, environments, deploy targets, the frontend build tooling, observability, READMEs, API docs, changelogs. Between missions: see below. |
  | Brennan | `review-spec` | Unchanged |
  | Zane | `review-security` | Unchanged; also owns dependencies in Diagnostic audits |
  | Leah | `review-a11y-perf`, widened | Performance everywhere: adds API latency, N+1 queries and load budgets to frontend performance and accessibility |

- **Atlas between missions:**
  - Watches delivered client repos for outdated dependencies, security advisories and broken CI.
  - Can't change anything there directly. It opens an Upkeep proposal; if you approve, that becomes a normal Upkeep mission through the fast path, with the usual gates and receipt.
  - Needs the client's read-only token, so this part waits for secrets and repo connections in Step 4 (CR-1).
- **The API contract** is locked like tests and Zero's UI contract. The same change rule applies: additive changes go through when Axis and Brennan both accept them; breaking changes come to you as a proposal. Brennan checks Axis's contracts.
- **Ghost doesn't wait for Soap.** Ghost builds the frontend data layer against Axis's locked contract, with the API stubbed, so the two build in parallel. The scenarios that need both run once both have landed (a scenario is locked with the last of its modules).
- **No separate auditor.** The Diagnostic audit areas go to the existing reviewers: spec to Brennan, security and dependencies to Zane, accessibility and performance to Leah, tests and coverage to Rigg (CR-9).
- **Red team** is in v1, as Breach on the testing team (CR-9).
- **Backend unit and integration tests, and load tests,** go to Rigg on the testing team (CR-9).
- **Why so few agents:** calibration is per work kind, not per agent, and skills are selected per dispatch, so merging agents loses no data and no skills. A seat can be split into its own agent later with a roster PR.
- **Naming note:** "Atlas" was also the name of the map the design removed on Oct 31 ("No map-driven development and no Atlas map"). The docs that mention the old Atlas map will say so explicitly, so the two aren't confused.
- **Touches:**
  - contract enums: `DispatchRole` (add `api-contract`, `review-backend`); the integration commit kinds (add one for API contracts);
  - CHECKs: `dispatches.role`, `eval_tasks.role`, `integration_commits.kind`;
  - Canon doc: the dispatch-role table, the task doc by role;
  - design doc Main: `roster`, the scheduler's readiness rule (a backend module waits for its locked API contract), the Upkeep package (proposals opened by Atlas).

## CR-9: The testing team
- **What:** three test agents, none of which ever builds.

  | Agent | Roles | Covers |
  | --- | --- | --- |
  | Fenn | `test-unit` and `test-e2e` on frontend modules | Unit and component tests, browser end-to-end tests, component visual snapshots, pinning tests for existing UI, and an exploratory pass once per mission |
  | Rigg | `test-unit` on backend modules | Unit and integration tests, load tests to Leah's budgets, pinning tests for existing backend behaviour, the tests-and-coverage area of Diagnostic audits |
  | Breach | `red-team` | Attacks on the running app, frontend and backend |

- **Fenn's additions:**
  - **Component visual snapshots:** every shared component in every state, in light and dark mode if the design system has both. This catches style breaks even when the client sent no designs.
  - **Exploratory pass:** once per mission at Gate 4, alongside Breach. Fenn clicks through the integrated app looking for broken flows, dead ends and confusing states, and files findings with screenshots.
  - If Fenn's first-attempt pass rate lags, a UI test agent can be split off with a roster PR.
- **Breach, the red team:**
  - **Frontend attacks:** XSS, CSRF, clickjacking, open redirects, secrets or keys leaked into the JavaScript bundle, auth flows that hide a button without blocking the action.
  - **Backend attacks:** injection, broken access control (reaching another user's data by changing an ID), auth and session bypass, SSRF, rate-limit bypass, spoofed webhooks.
  - **How it differs from Zane:** Zane reads the code against OWASP ASVS. Breach attacks the running app in a sealed room: the app, a browser and an HTTP client, third parties stubbed, no other network.
  - **When it runs:** once per mission at Gate 4 against the integrated app (a mission-level review), and per module only when a security trigger applies (login, payments, personal data, secrets). Always on template missions (CR-13).
  - **Evidence:** every finding cites the steps to reproduce and the request and response. It's fixed only when a regression test passes: Fenn writes the browser repro, Rigg writes the API repro.
  - **Disputes** over Breach's findings go to Zane.
- **New rule: every UI state gets a test.** Zero's contract lists each screen's states (loading, empty, error, ready and so on). A code check refuses a module where a listed state has no test.
- **Defaults (accepted),** set per package in `factory.yaml`:
  - **Browsers:** Chromium gates every module. Firefox and WebKit run at Gate 4, for the acceptance scenarios and Fenn's exploratory pass. A client that depends on Safari can make WebKit gate every module.
  - **Screen sizes:** phone 360 × 800, tablet 768 × 1024, desktop 1440 × 900. Each module's end-to-end tests run at phone and desktop; all three run at Gate 4 and for screenshot checks. 200% zoom stays with Leah.
  - **Screenshot stability:** fonts pinned in the room image and a small pixel tolerance.
- **Effects:**
  - The roster maps `test-unit` by work kind: Fenn on `design-system`, `frontend-components`, `frontend` and `frontend-data`; Rigg on `api`, `data`, `services`, `ai`, `maintenance` and `infra`.
  - Pinning tests on Stabilize and Upkeep work come from Fenn or Rigg, never from Atlas, which builds those modules.
  - Load tests need a home in the plan: a new scenario level, `load`.
  - Breach's room needs a browser, an HTTP client and attack tooling; adding them is a room image change through a `factory.yaml` PR.
- **Touches:**
  - contract enums: `Level` (add `load`); `red-team` is now used;
  - the module and mission dispatch rules: Breach and Fenn's exploratory pass as mission-level reviews at Gate 4;
  - a new code check: contract states without tests;
  - Canon doc: the dispatch-role table, the task doc by role, the scenario levels;
  - design doc Main: `roster`, Gate 4, the starter skill library (attack testing, load testing, visual snapshots).

## CR-10: A sharper task doc
- **What:** the task doc keeps agent-dispatch's 7 parts, with these changes. All of it is rendered by code from the plan, so the same plan still renders byte-identical documents.
  1. **Reading list, in a fixed order:** AGENTS.md / CLAUDE.md first, then the locked contracts for this module (Zero's UI contract, Axis's API contract, Nemi's design system), then the reference patterns, then the rest. Each entry has a path, an optional line range and a one-line reason. Anything the agent opens beyond the list is allowed but logged in the trace.
  2. **Contract excerpts inline.** The slices of each contract this module implements are copied into the task doc, hashed, next to their paths, so the builder works from the exact text it's graded against.
  3. **Each task gets:**
     - its ID, and the R and S IDs it serves;
     - current state and required change;
     - a **reference pattern**: an existing file (and line range) that shows how this codebase does this kind of thing;
     - **done means**: the locked tests and contract items that prove it;
     - **constraints as rules**: each one linked to an `avel check` rule ID where one exists;
     - **out of scope**: what not to touch or add, even if it looks helpful.
  4. **Verification loop after every task:** typecheck, lint, the affected locked tests, then `avel check`. Failure output is trimmed to about 2,000 tokens. Each green task ends with a checkpoint commit, which is where Retry 1 resumes from.
  5. **Stop rules:**
     - the same verification error three times in a row: stop and write the completion report;
     - a contract that looks wrong: escalate as a contract change, never work around it;
     - a needed dependency: file a dependency request, never install it.
  6. **New pre-flight section, before the completion report:**
     - run the full verification: build, typecheck, lint, every locked test, `avel check`;
     - review its own diff against a fixed checklist: every contract item implemented; no file outside the territory; no TODOs, placeholders or commented-out code; no value hard-coded that a token or config covers; no secrets or personal data in logs; no new dependency without a request; every UI state from the contract handled.
  7. **Completion report additions:** the pre-flight results; a map from each contract item to the files that implement it; deviations from the contract, with reasons; known limitations.
- **Why:** builders copy good examples far more reliably than they follow descriptions, and catching their own misses before reporting is cheaper than a fix attempt after review.
- **Trust:** pre-flight is a convenience, not evidence. Gate 3 re-runs every check independently in a fresh check room, as it does today.
- **Touches:**
  - Canon doc appendix: the task doc section table, the task doc by role, the completion report template;
  - design doc Main: Dispatch (the 7 parts), Cost control (short tool output, already there);
  - contract package: the completion report schema (`completion_reports.body`);
  - Gate 3: refuses a build report with no pre-flight section;
  - schema: reference patterns per task. `plan_modules.reference_paths` already exists per module; per-task patterns need a field on requirements, or a mapping from each task to a module reference path;
  - Step 8: the golden tests for the renderer cover the new sections.

## CR-11: Builders on Opus
- **What:** every builder runs on Opus at high effort: Nemi's module builds, Fantem, Leon, Ghost, Soap, Iyo and Atlas. Open-weight coding models (for example DeepSeek or Kimi) can replace a builder later through the CR-5 adapter, once the live numbers show them matching or beating Opus on that work kind. See the decisions log for the other agents' tiers.
- **Why:** builders produce what the client gets; quality there is worth the price.
- **Cost:** a typical builder attempt is about $2 on Opus (Cost control), inside the $4 attempt cap. Module estimates rise; the budget check at 0.3 and Gate 1 catches a mission that doesn't fit, and calibration sets the real numbers.
- **Measure:** first-attempt pass rate, findings per module and cost per work kind, by factory commit, to confirm Opus earns its price and to judge any later switch.
- **Touches:**
  - design doc Main: Cost control, the "Model routing" lever (today: workers on the cheaper tier with low effort, the lead tier only for Canon's breakdown and Brennan);
  - `factory.yaml`: roles and models;
  - `claude/Roster.md`.

## CR-12: Step 0, then a full Step 1
- **What:**
  - **Step 0 (new):** apply CR-1 to CR-13 to the repo and docs before Step 1: one migration for the schema changes, the contract enum changes, the doc updates, and the ERD and OpenAPI regenerated. Step 1 then starts with code and docs agreeing.
  - **Step 1** is the longer scope from the design doc and the Port inventory, minus secrets (CR-1). The full plan and test list are in `claude/Step 0 and Step 1 plan.md`.
- **Why:** jobs, events and claims are what every later step runs on, and the Port inventory already puts step-up, CLI login and the activity log in Step 1.
- **Touches:**
  - project instructions: the Step 1 list (replace it with the plan's list);
  - design doc Main: build order (add Step 0; Step 1 without secrets).

## CR-13: Project kinds: client, internal and template
- **What:** every mission has a **project kind**, chosen when the mission is created and frozen once onboarding starts. One enum, `ProjectKind`, defined in the contract package:

  | Kind | What it is | Delivered to |
  | --- | --- | --- |
  | `client` | Paid work for a client | The client's repo (PR or push), or a zip |
  | `internal` | AVEL's own software: internal tools, avelco.dev, your own products | An AVEL-owned repo, or a zip |
  | `template` | An internal project built to become a project template for one package | A factory-repo PR to `templates/<slug>`, which you approve |

- **Who owns internal work:** one client record for AVEL itself, marked `internal`. Internal and template missions belong to it, so everything keyed by client (repo connection, the client knowledge layer, the design system, client rules) works unchanged.
- **Database rules (so the database enforces them):**
  - `clients.kind`: `'client'` or `'internal'`, with a partial unique index allowing only one internal client.
  - `missions.kind` (`ProjectKind`) and `missions.client_kind`, with a composite foreign key `(client_id, client_kind)` → `clients (id, kind)` and a CHECK `(kind = 'client') = (client_kind = 'client')`. A client mission can't belong to AVEL, and an internal or template mission can't belong to a client.
  - `missions.kind` is frozen once `onboarding_started_at` is set (a freeze trigger, like the others in the schema).
  - `templates.source_mission_id` → `missions` (optional): the mission a template version came from.
- **How Canon briefs each kind:**

  | Area | `client` | `internal` | `template` |
  | --- | --- | --- | --- |
  | Opener (message 0) | Client opener | Internal opener | Template opener |
  | Who's speaking | You, sometimes relaying the client (`said`, `relayed`) | You only; `relayed` is refused | You only; `relayed` is refused |
  | Discovery topics | The 10 topics | The same 10; the deadline is optional | The 10, plus 4 template topics: target package, what varies per client (parameters), what stays fixed (the foundation), default rules |
  | 0.1 Brief | Adds the client, contacts and a provisional package and price | Adds purpose and owner (AVEL); no price | Adds the target package and the parameter list |
  | Package fit | By rubric; price from the package | Chosen for its check set and rubric only; price is 0 | The target package is required; its check set applies |
  | Deadline clock | Starts at plan approval | Optional | Optional |
  | Budget | $15 per module, $150 per mission | The same (decided) | The same (decided) |
  | Templates at 0.3 | Canon offers a matching template | Canon offers one too | Can start from the current version of the same template, making a new version |
  | Design system (Nemi) | The client's brand | AVEL's brand | A neutral base design system with swappable tokens |
  | Knowledge layer | Client layer for that client | Client layer for AVEL | Lessons go to the stack and global layers; never client text |
  | Red team (Breach) | On security triggers, plus once at Gate 4 | On security triggers, plus once at Gate 4 | Always, on every module and at Gate 4 (decided): a security bug in a template reaches every mission built from it |
  | Receipt and metrics | Revenue per oversight hour and contribution margin | Cost and your minutes only; left out of per-package revenue figures | Same as internal |
  | Client summary (open question) | Applies | Doesn't apply | Doesn't apply |

- **New rubric checks for templates:**
  - **T1:** every client-specific value is a declared parameter: name, brand, copy, colours, integrations.
  - **T2:** the M0 foundation is complete and runs from the scaffold.
  - **T3:** the plan template lists the usual modules, contracts and acceptance scenarios.
  - **T4:** the default rules are listed, and each passes on the scaffold.
  - **T5:** no client data or client-derived text anywhere in the template (a code scan).
- **Code checks:** a template mission must name its target package at 0.1; a `relayed` fact on an internal or template mission is refused; the checkpoint documents show the kind at the top.
- **Prompt:** one Canon prompt, versioned as today, with a section per kind, plus one opener per kind. Every turn still logs its `prompt_version`.
- **Contract:** `ProjectKind` enum; `kind` on the mission DTO and the create-mission input; `?kind=` on the missions list; `kind` on the client DTO; metrics split by kind; the `mission.created` event carries it.
- **The live test run:** your first internal project (you'll supply it) becomes the reference mission for Step 7 and the dry run for Step 13. Until those steps exist, it's the realistic test case each step is checked against.
- **Build order:** the schema and contract changes in Step 0; Canon's per-kind briefing in Step 7; template delivery into the factory repo in Step 12; the metrics split in Step 10.
- **Touches:**
  - DATABASE.md: `clients`, `missions`, `templates`;
  - contract: `ProjectKind`, the mission and client DTOs and routes, metrics;
  - Canon doc: openers, Discovery topics, the 0.1 sections, package fit, the rubric (T1 to T5), the stage state machine guards, the fact sources;
  - design doc Main: Project templates, Measurement and receipts, delivery, `knowledge` (layers), build order Steps 7 and 13; the roster's red-team rule.

## Parked ideas (not change requests yet)
- **More factory agents,** on hold at your request. Each must take recurring work off you or protect margin or trust, need judgment rather than code, produce only drafts and proposals, and be metered with its own budget.
  - **Clerk:** pre-reads the Decisions queue, summarizes evidence, recommends an option and groups related items. You still decide.
  - **Herald:** drafts client status updates and the plain-language delivery summary from the receipt. You send.
  - **The Librarian:** already designed for v2; could be brought forward to draft knowledge entries from closed missions.
  - **Quoter:** drafts custom-quote pricing from the plan and metered history, once real cost data exists.
- **Best of two for risky modules:** run two builder attempts in parallel on payments, auth or data-migration modules and keep the one that passes more tests with fewer findings. Doubles that module's cost.
- **Fine-tuning on your own work:** every verified mission yields a task doc, a diff that passed locked tests and a receipt, which is training data for an open-weight model on your stacks. Needs each client's permission for their code.
