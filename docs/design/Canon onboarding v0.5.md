# Canon Onboarding — Software Factory Map v0.5

Oct 30, 2026 · @javaris

> **Nov 5 note:** this doc predates the current roster. Where it says there is no Atlas, or routes unit and integration tests to Nemi, Roster setup and sessions (Nov 4) wins: Atlas builds infra, and Rigg writes backend tests (Nemi builds the design system). Everything else stands.

This maps Canon's onboarding, which is Gate 0 of the factory. Nothing in it is built. **v0.4** realigns it with the Oct 31 factory decisions and agent-dispatch's vocabulary, after an independent review graded v0.3 a B− for being out of date (its rubric was graded A−). v0.5 (Nov 1) aligns it with the second review round, and a later Nov 1 pass aligns it with the third: the budget check at 0.3, per-client tokens, one findings schema, and every model call through the proxy. The final Nov 1 pass, before the design freeze at v0.6, reads the repo at 0.1, chunks large uploads, starts document facts as proposed, offers project templates at 0.3, and drops passwords from approvals. The build detail for agents is in the appendix.

**In short**

1. Canon interviews the **operator** (you) and nobody else. Client words and uploads come through you.
2. Onboarding is **Gate 0**, with four checkpoints you approve: **0.1 Brief, 0.2 Breakdown, 0.3 Mission and roster, 0.4 Context.** Finalize is the plan approval.
3. Onboarding produces everything the factory renders: the mission's **DISPATCH.md** and **one task doc per dispatch (several per module: build, tests, e2e, reviews)**, with the activation built in.
4. Canon proposes only modules, dependencies and work kinds. Code assigns agents, computes waves and renders every document.
5. Diagnostic and Upkeep requests take a fast path. Any later change (a converge pass or a contract change) reopens only the modules it affects.

**Decisions log**

| Date | Decision |
| --- | --- |
| Oct 31 | You are the only interviewee. No client signs or approves, and there's no AI-consent step of any kind. |
| Oct 31 | Onboarding is Gate 0, with checkpoints 0.1–0.4, and you approve each one. Gate 1 (pre-dispatch) checks that DISPATCH.md and every task doc are complete before any work starts. |
| Oct 31 | Canon proposes each module's work kind, and code maps it to an agent. A model never picks agents or work. |
| Oct 31 | One dispatch per module. A module starts as soon as all its own dependencies have landed (a module with none starts when the mission is rendered), with up to 6 dispatches running at once. |
| Oct 31 | Repo timing: Canon asks at Discovery whether a repo exists. For an existing app, the repo is read at 0.1 with the read-only token, and its code index is available to Canon at 0.2 and 0.3. 0.4 pins the commit, runs the readiness check and builds the runner image, and sets write paths. |
| Oct 31 | Fast paths: Upkeep (0.1 and 0.2 merged, reusing the last approved context) and Diagnostic (0.1 and 0.2 merged, with fixed audit modules). |
| Oct 31 | Dispatch cap: 60 minutes and 500,000 *weighted* tokens. Weights follow price: input ×1, cache write ×1.25 (5-minute) or ×2 (1-hour), cache read ×0.1, output ×5. |
| Oct 31 | Tests are written first, by non-builders. Brennan rules on test disputes, and any change to an acceptance test needs your approval. Disputes over a reviewer's finding go to the other reviewer (Zane on Brennan's, Brennan on Zane's). You can accept a finding with a written reason. (Updated Nov 1.) |
| Oct 31 | Agent-dispatch's vocabulary is adopted. AVEL keeps mission, package, receipt, verified, and the R→S→CK chain. |
| Pending | The roster: you're revising which agent fills which role. |
| Oct 31 | The roster is pinned at 0.3, and changes apply only to new plans. Without designs, the visual baseline is approved at release (there's no third approval). Every Upkeep request re-runs 0.4 against the client's current code. Onboarding time targets (measured, not enforced): Diagnostic ≤20 min, Upkeep ≤10, Landing page ≤45, Stabilize and Feature ≤60. Feature pricing: on hold. |
| Oct 31 | Any stack: a stack readiness check runs at 0.4, and contracts are checked on the running app (black-box). A live knowledge base with three layers (global, stack, client; cut from five on Nov 1) feeds Canon, the reviewers and the builders. Playbook styles are deferred. Map-driven development may return later as a playbook. There is no Atlas. |

## At a glance

&#91;embedded content: Gate 0 onboarding · 6 stages, checkpoints 0.1–0.4\]

Canon interviews you, breaks the work into modules and gathers context. You approve checkpoints 0.1 to 0.4, which together are Gate 0. Finalize is the plan approval. After finalize, the factory runs Gates 1 to 5:

- **Gate 1:** pre-dispatch completeness.
- **Gate 2:** the integration-commit test. A finished module's commit is applied to the current mission branch head as one integration commit and tested in an integration room. The branch moves only if green.
- **Gate 3:** agent completion.
- **Gate 4:** merge readiness.
- **Gate 5:** sprint close, where `decide()` and the receipt live.

## Open questions

- [ ] **Roster (blocker):** you're revising which agent fills each role. The work-kind and dispatch-role lists below are ready for it. Until it's confirmed, no mission can pass 0.3, because 0.3 needs a confirmed agent for every work kind and dispatch role. That also blocks the factory's Gate 0 build step (Step 7, Gate 0 with Canon).
- [ ] **Client summary:** should you send the client an unsigned scope and no-gos summary to protect the fixed price? On hold.
- [ ] **Packages:** confirm prices and the 10-day deadline for the Feature package.
- [ ] **IQ report:** please share it so the bug-to-rule mapping can be checked against it.

## What changes from the Command Center

In the Command Center, Canon's job ended at a brief and you did the rest by hand. In the factory, Canon's onboarding produces everything the factory needs to start without you: modules, the mission type, the roster and the context. Your approval of that output is the first of the two human approvals.

| Area | Command Center (built) | Software factory onboarding (specced) |
| --- | --- | --- |
| **What Canon hands off** | A brief: summary, R, AC, M, CK | Everything the factory renders: the mission's **DISPATCH.md** contents and **one task doc per dispatch** |
| **Modules** | M1… with the paths each one reads | Each also has a work kind, dependencies, EARS requirements, scenarios by level, checks, context refs, and a territory (set at 0.4) |
| **Plan** | Written by hand, then checked by code | Built from the approved breakdown. Finalize is the plan approval. |
| **Agents** | You pick one per dispatch | Canon labels each module's work kind. Code maps work kinds and dispatch roles to agents. |
| **Order** | You start each dispatch | Canon gives only dependencies. Code computes waves and starts each module when its own dependencies are green. |
| **Mission type** | Not linked to packages | Package fit by rubric, and the package decides which checks apply. Diagnostic and Upkeep take fast paths. |
| **Who writes the record** | Canon drafts the brief | The model talks and the backend writes. Every fact carries its source. |
| **Changes later** | Edit by hand | Re-entry mode: a converge pass or a contract change reopens only the affected modules and re-checks package fit and price |
| **Testing** | Checks at the gate | Scenarios by level, routed to Nemi (unit and integration) or Fenn (e2e). They're written first, must fail, and are locked. |
| **Progress** | — | Computed on the server, stopping at 95% until you approve |

## Stages in detail

Gate 0 has six stages and four checkpoints, and you approve every checkpoint. Each checkpoint is a document the product generates with fixed sections, written by a tough editor, not a cheerleader. At each one you can approve, edit, rewrite one section, or go back to the chat. A checkpoint unlocks only the next stage. Reopening one makes a later checkpoint stale only if that later one cites a fact that changed.

1. **Locked opener.** It loads without calling the model and is stored as message 0.
2. **Discovery.** Canon asks you one question per reply, at most 12. It pushes back on vague answers and keeps your exact words, tagged *relayed* when you're quoting the client. It asks only *whether* a repo, docs and designs exist.
   - → **Checkpoint 0.1, Brief.** Sections: problem, users, outcome and success measure, scope, no-gos, deadline, constraints, risks, acceptance examples, open questions, and a *provisional* package.
3. **Breakdown.** Canon proposes modules. For each one it gives a work kind, dependencies, EARS requirements, scenarios tagged by level (unit, integration or e2e) and an estimate. It proposes no waves, agents or paths: code computes waves from the dependencies.
   - Build packages: M0 is the walking skeleton and sets the contracts.
   - Stabilize and fixes: each gap becomes a **chain** with an execution trace (entry point, root cause, fix site, verification).
   - At most 5 clarify questions. Code checks run as Canon proposes, and Brennan reviews.
   - → **Checkpoint 0.2, Breakdown.** Sections: module table, dependency graph with computed waves, requirement coverage, scenarios by level, risks and no-gos.
4. **Mission and roster.** Canon recommends the final package. Code maps each work kind to its builder and adds the dispatch roles (tests, e2e, reviews, red team) per module. You confirm.
   - If the package changes, 0.2 is re-checked under the new package's rubric.
   - → **Checkpoint 0.3, Mission and roster.** Sections: package and why, project template (if one matches), deadline clock, check set, agent per dispatch, critical path at 6 concurrent, estimated minutes and dollars, and the budget check. If a project template matches the package, Canon offers it here and you choose. Templates are written by you in the factory repo under `templates/`: a scaffold repo at a pinned commit with M0's foundation done, a plan template (the usual modules, contracts and acceptance scenarios) and default rules. A template-based plan still goes through 0.3 and Gate 1 as normal. The budget check is defined once, in Cost control in the factory doc's main tab. In short: each module's dispatch estimates × 1.5 must fit its $15 budget, and the mission total (module estimates × 1.5, plus the mission reviews, plus Canon's actual spend so far) must fit the $150 mission budget. If it doesn't, 0.3 can't be approved. You cut scope in 0.2, or raise the module or mission budget through a budget-increase proposal, which is one click with no password. Gate 1 runs the same check again after render.
5. **Context.** For an existing app, the repo was connected read-only and read at 0.1, so Canon has had its code index since 0.2. Here it's pinned to a commit. Code writes the **codebase analysis**: stack, conventions, and the build, test and lint commands. Code also runs the stack readiness check (ready, partial or not ready, with reasons) and builds the check-runner image. The image build runs the client's own setup steps, so it runs inside gVisor with egress only through the package proxy. You decide whether to go ahead on partial. Canon proposes each module's territory from the real tree, and code checks overlaps. Canon then asks for docs module by module. Any module the repo changes reopens only its own part of 0.2.
   - → **Checkpoint 0.4, Context.** Sections: codebase analysis, territory map, sources by module, what's missing and why, and standing context found or to be generated.
6. **Finalize.** Re-checks 0.1–0.4. Then one transaction writes the plan as approved and an outbox row. The factory renders DISPATCH.md and the task docs, and **Gate 1** checks they're complete before any work starts.

**Fast paths**

- **Upkeep request:** 0.1 and 0.2 merge into one checkpoint. There's one module, and it reuses the context pack from the client's last approved mission. The first Upkeep request for a client runs the full Gate 0 once. Every Upkeep request still runs 0.4 again, re-reading the client's current code at a new pinned commit.
- **Diagnostic:** 0.1 and 0.2 merge. Modules come from a fixed audit template, one per area: spec and UX, security, tests and coverage, accessibility and performance, dependencies. They're read-only and have no test-writer roles. Instead of scenarios, each audit requirement has an evidence rule: every gap cites a file and line, or a command and its output. Each audit report is AVEL's own deliverable, stored outside the client's repo and never written into it. Discovery for a Diagnostic needs only Problem, Outcome, Scope, Existing assets and Acceptance to be Clear.

**Re-entry mode.** A converge pass (at most 3, each one approved by you) or an approved contract change starts a new plan version. Only the affected modules go back through 0.2 to 0.4. The old plan is marked `superseded`. Package fit and price are re-checked on every revision, and if the price changes, the new plan needs your approval.

## The breakdown rubric

A breakdown is ready when every **code** check that applies to its package passes, and every **judge** finding is either fixed or accepted by you with a reason. Code checks block. Judge findings come from Brennan. A number the model made up never counts as a code check.

**Interview coverage (Discovery).** The server marks each topic Clear, Partial or Missing. Canon asks next about the topic with the highest impact × uncertainty.

| Topic | Clear means |
| --- | --- |
| Problem | One specific story: who hits it, and what they do today |
| Outcome | A success measure someone can check |
| Scope and no-gos | What's in, and what's explicitly out |
| Deadline | The package deadline or the client's date |
| Core flows | Places, the actions on each, and where each action leads |
| Data and integrations | Entities, third parties, and who owns each credential |
| Quality targets | Numbers for speed, accessibility and security level |
| Edge cases | What happens with bad input or a service that's down |
| Existing assets | Whether a repo, docs, designs and brand exist |
| Acceptance | How you'll judge the result, as examples |

**Whole breakdown**

| # | Check | Type |
| --- | --- | --- |
| B1 | Every requirement maps to a module, and every module to a requirement | Code |
| B2 | M0 is a walking skeleton through every layer, with one e2e scenario, and it sets the contracts | Code + judge |
| B3 | Modules after M0 are vertical slices a user can see | Judge |
| B4 | Dependencies have no cycles. Waves are *computed* as depth in the dependency graph, and Canon never sets them. | Code |
| B5 | No-gos are listed | Code |
| B6 | Each risk is either patched or declared out of scope | Judge |
| B7 | The critical path (the longest dependency chain, run at up to 6 at once) fits the package deadline. Advisory until calibrated. | Code |
| B8 | Any two modules without a dependency path between them have no overlapping write paths. Checked at 0.4. | Code |
| B9 | Every 0.1 acceptance example maps to a scenario tagged for acceptance | Code |
| B10 | Every quality target has a number and a check | Code |
| B11 | Each end-to-end acceptance journey belongs to one module, and that module depends on every module the journey goes through | Code |

**Each module**

| # | Check | Type |
| --- | --- | --- |
| M1 | It has one confirmed work kind (0.2) and one territory (0.4) | Code |
| M2 | Its goal is one sentence about something a user can see | Judge |
| M3 | Each requirement fits an EARS pattern: one of the five (*shall*, *When*, *While*, *Where*, *If… then*) or a combination of them, with one behaviour each, and has an ID | Code lint + judge |
| M4 | Each requirement has scenarios for the happy path and at least one failure, each tagged by level | Code count + judge |
| M5 | Each scenario has one executable check | Code |
| M6 | It depends only on modules it lists (checked at 0.2). Whether its tests run on their own is checked at Gate 3, once tests exist. | Code |
| M7 | Its estimated minutes and weighted tokens fit one dispatch's cap. Advisory until calibrated. Canon's 1–10 score is shown but never checked. | Code |
| M8 | Every context reference resolves | Code |
| M9 | No blocking questions remain open | Code |
| M10 | It states an Escalate-when rule | Code |
| M11 | If it changes existing behaviour, it pins today's behaviour with tests before the change | Code |
| M12 | If it triggers Zane, it sets an ASVS level (L1 by default, L2 for payments or personal data) and a data classification | Code |
| M13 | Fix work only: each chain has an execution trace (entry point, root cause, fix site, verification) | Code + judge |

**Calibration (B7, M7).** These two checks show as advisory until 10 missions of that work kind have been measured. After that, code sets the estimates from the median measured minutes and weighted tokens, and both checks block.

**Which checks apply, by package**

- **Diagnostic.** Fast path. Fixed audit modules, read-only. Requirements describe what the audit checks. No walking skeleton, territories or B3, M2 or M11.
- **Landing page.** Every check, including the walking skeleton and the visual check.
- **Stabilize.** Modules are chains with traces (M13). Pinning tests (M11). A smoke test of the existing app replaces the walking skeleton. No B3 or M2.
- **Feature.** Every check, with a smoke test of the existing app instead of the walking skeleton.
- **Upkeep.** Fast path. One module, which is a chain if it's a fix or a slice if it's a feature.
- **Every package:** M12 applies whenever it's triggered.

**Question protocol**

- One question per reply, either 2–5 options with **Recommended: X, because…** at the top, or an answer of 5 words or fewer.
- Caps: 12 in Discovery, 5 at clarify, 2 at stage 4, and at most 3 context requests per module.
- Vague answers get a reframe. Every answer is written into its checkpoint as a Q → A line, so nothing is asked twice.

## Mission type and roster

Canon proposes the package twice. The provisional one at 0.1 picks which rubric checks apply. The final one, after the breakdown, is the one you confirm at 0.3. The roster is never chosen by a model: Canon proposes each module's **work kind** and code does the rest.

**Mission type (package fit).** Canon checks the packages in order and recommends the first that fits. Prices are still to be confirmed.

- **Verified diagnostic:** an existing app where you want a gap list and a receipt, with no changes. Not when the client expects fixes.
- **Launch-ready landing page:** no existing app; one marketing page with a form or call to action. Not when it needs log-in, payments or more than one flow.
- **Stabilize:** an existing app with known critical gaps, or gaps from a diagnostic. Not when the gaps need new features.
- **Feature shipped:** one scoped feature in an existing app, inside the 10-day deadline. Not for more than one feature.
- **Upkeep:** ongoing requests, one at a time.
- **Custom quote:** nothing above fits, or the critical-path check (B7) fails.

**Two kinds of assignment.** Each module has exactly one **builder**, chosen by its work kind. Code then adds **dispatch roles** to the module: tests, e2e, reviews. Which named agent fills each role comes from the roster, and *the roster is pending your revision*. The plan stores `work_kind` and a `roster_version`, and the agents are pinned at 0.3. A mission runs with the roster it was approved with, and roster changes apply only to new plans.

| Work kind (Canon proposes, you confirm at 0.2) | What it covers |
| --- | --- |
| `data` | Models, migrations, queries |
| `infra` | CI, builds, Docker, deploy targets |
| `design-system` | Tokens, shared components, brand |
| `frontend` | Pages, flows, client state |
| `api` | Endpoints, server logic |
| `services` | Integrations, workers, external APIs |
| `ai` | LLM features, prompts, agent tooling, evaluations |
| `maintenance` | Chains on existing code: traces, pinning tests, refactors |
| `docs` | READMEs, CHANGELOG, user docs |
| `audit` | Diagnostic areas (read-only) |

| Dispatch role (code adds per module) | Added when |
| --- | --- |
| `test-unit` (unit and integration tests) | The module has unit- or integration-level scenarios |
| `test-e2e` (fixtures, stubs, browser scenarios) | The module has e2e-level scenarios |
| `review-spec` | Always |
| `review-security` | Log-in, payments, personal data, secrets, or client data leaving the app |
| `red-team` | Decided in your roster revision |

If any work kind or dispatch role has no confirmed agent, Gate 0.3 can't pass. The validator names the gap.

## Context intake

Canon asks you for context module by module, naming the module that needs it ("Leon needs the checkout screens for M3"). Nothing is collected just in case. Once the repo is read, code writes the codebase analysis (stack, conventions, build, test and lint commands), which becomes DISPATCH.md's conventions section. Everything comes from you: your words, your uploads and the repo you connect. Uploads are stored with the ported Drive storage, and each has an ID. Allowed types are PDF, DOCX, Markdown, plain text and images. Each upload has a parse status: pending, parsed, failed or unsupported. Uploads are limited to 50 MB and 300 pages, and large ones are read in chunks.

| Source | Asked for when | How it's held | Rule |
| --- | --- | --- | --- |
| Repo | The project has existing code | Fine-grained token for the repo owner, read-only, pinned to a commit SHA | Agents never get repo credentials. Each dispatch runs in its own room with its own clone, and can push only its own branch. |
| Write territories | After the repo is read | Canon proposes paths from the real tree, and code checks overlaps (B8) | Paths are written into each module's packet |
| Product docs | A module's requirements came from a doc | Upload, tagged to modules | Quotes link back to the doc and section |
| Design files | A module has UI | Upload or link, tagged to screens | A UI module without designs gets a Brennan finding, not a block |
| Brand assets | Fantem or Leon is on the roster | Upload | — |
| Copy and content | Pages show real content | Upload | Placeholder copy only if it's listed as a no-go |
| API docs and third-party accounts | Any integration | Doc upload, plus the account owner's name | **Secrets are never pasted in chat.** They're stored encrypted by the server's secrets interface, which is write-only from the UI and CLI. Only their names are recorded. |
| Test accounts and data | A module has a browser scenario | Fixture request to Fenn | Never real customer data |
| Deploy target | Delivery is by push or PR | Repo policy | Only the delivery step holds the push credential |
| Standing context | Every repo | AGENTS.md / CLAUDE.md | If it's missing, the integrator generates it from the codebase analysis. It's a shared file, so agents never edit it. |

## End-to-end testing built into the breakdown

Every module leaves Gate 0 with its scenarios already written, so "done" means the code passes them, not that an agent says it's finished.

1. **Scenarios by level.** Each one is Given/When/Then with example data, tagged `unit`, `integration` or `e2e`. Code routes unit and integration scenarios to the `test-unit` role (Nemi) and e2e scenarios to `test-e2e` (Fenn).
2. **Fail first, then lock.** A test counts only if it carries one scenario ID, fails with an assertion (not a syntax or import error), and fails the same way 3 runs in a row. Tests that pin existing behaviour must pass instead. Accepted tests are hashed (`locked_hash`), and builders can't change them. Brennan rules on disputes.
3. **The feature list lives in the database.** Only check-runner results can set `passes`. Agents can't reach it.
4. **Dependency checks, not whole waves.** When a module merges, code runs its scenarios plus those of every module it depends on. A module starts only when its own dependencies are green. For build packages, M0's scenario must pass first.
5. **A smoke test runs before each dispatch.**
6. **Flaky tests.** A test that fails then passes on the same commit is quarantined and doesn't count as a pass. A fix task goes to whoever wrote it: Nemi for unit and integration, Fenn for e2e. A quarantined **acceptance** scenario blocks `decide()`. Only verified ships.
7. **Third parties are stubbed.** The check runner uses an image built for the repo's stack. Packages come only from an offline cache filled from the mission's lockfile. Live sandbox runs are opt-in.
8. **Visual checks.** For a landing page with designs, screenshots at fixed viewports are compared with the approved design. Without designs, the visual check is advisory during the build. The preview you approve at release becomes the baseline for later Upkeep work, so there's no extra approval mid-mission. Accessibility (axe) and performance (Lighthouse) stay code checks.
9. **Builders never write the tests that grade their own module.**
10. **The gate change.** Adding an `e2e` check kind moves `decide()` to version 5. The gate's acceptance kind re-runs every acceptance-tagged scenario.

## Data flow: the model talks, the backend writes

Canon has no tool that writes to the mission record. After each turn, a separate extractor saves facts, and each fact has a source and a status. Checkpoint documents show confirmed facts as plain text and proposed facts flagged.

| Source | Example | Starts as |
| --- | --- | --- |
| `said` | Your exact words, with the message id | Confirmed |
| `relayed` | The client's words as you passed them on | Confirmed, shown as relayed |
| `uploaded` | An upload (upload\_id), plus page or section | **Proposed**, with the source quote shown. Approving the checkpoint confirms it. Text flagged by the hidden-text and Unicode scan stays proposed and is highlighted. |
| `repo` | A path at the pinned commit | Confirmed |
| `inferred` | A module, work kind, EARS rewrite, package or territory proposed by Canon | **Proposed** until you confirm or reject it |

- **The extractor is a model too, so code checks it.** A `said` or `relayed` fact must cite a `message_id` and a `[start, end]` span, and the quote must match the stored message text at that span exactly. If it doesn't, it's downgraded to `inferred`. Uploaded facts get the same check: the quote must match the upload's parsed text verbatim. Both use the citation check ported with changes from `src/lib/canon/citations.ts`: its quote matcher is kept, and the message and span checks are new.
- **Bulk confirm.** Approving a checkpoint confirms every proposed fact it shows, in one action.
- **Progress is computed on the server.** The opener isn't counted. On the full path, the four checkpoint stages are 24% of the bar each. On the Diagnostic and Upkeep fast paths, there are three stages (0.1+0.2, 0.3 and 0.4), at 32% each. Within one, progress is the share of its exit checks that pass, capped at 95% of that segment until you approve. Finalize is the last 4% and fills when its transaction commits. The response includes the journey, the unlock flags, pending questions and missing items, and the frontend only displays them.
- **One list of stages and sections** lives in the contract package. Saving, the prompt tracker and the display all import it.
- **Your time is metered from the first screen.** Answering, reviewing and approving are logged to the mission as human minutes.

## Usage control

Every model call onboarding makes (Canon, the extractor, breakdown drafts, Brennan and checkpoint documents) goes through the factory's model proxy with a service token. The proxy is the only holder of the model key and the meter of record, and the calls count toward the mission's $150 budget. Usage also has fixed limits per call, session, hour and day, so it stays low and predictable. Every limit is a config value, and every call is logged with its tokens and cost.

| Limit | Default |
| --- | --- |
| Model per role | Canon interviews on the worker tier. Breakdown drafts and Brennan run on the lead tier. |
| Max output per call | Canon 400, extractor 600, breakdown draft 8,000, Brennan 2,000, checkpoint document 3,000 tokens |
| Max input per call | 32,000 tokens. The system prompt, rubric and approved documents are a fixed prefix, so they cache. A larger upload is split into chunks of 32,000 tokens or less, and Canon reads it chunk by chunk; each chunk counts as an extractor call. Uploads are limited to 50 MB and 300 pages, and anything larger is refused at upload. |
| Questions | 12 in Discovery, 5 in clarify, 2 at stage 4, and at most 3 context requests per module |
| Calls per session | Canon 60, extractor 60, breakdown 9 (3 per 0.2 version, at most 3 versions), Brennan 12, checkpoint documents 12. That's 153 at most. |
| Rate | 1 call in flight per session. 40 calls per hour (20 turns) and 160 per day per session, which is more than 153, so one onboarding can finish in a day. 600 per day across all sessions. |
| Settings | Fixed sampling settings and versioned prompts |

**Worst case for one onboarding** (a ceiling, not an expectation):

- Output: at most 192,000 tokens (60 × 400 + 60 × 600 + 9 × 8,000 + 12 × 2,000 + 12 × 3,000).
- Input: at most 153 × 32,000 ≈ 4.9 million tokens, mostly the cached prefix.

Real usage gets measured on the first missions.

When a limit is hit, Canon stops and the checkpoint shows what's missing. It never retries in a loop.

## Appendix: for the agents that build this

Everything below is build detail. You don't need to read it to approve the design.

## Build spec (for the agents that build onboarding)

This section is written for the agents that will build onboarding. Every name in it is meant to become a schema, enum or test. Status: specced, not built.

**Tables** (Drizzle and Postgres, in the shared contract package)

```ts
// Enums: one file in the contract package
Stage        = 'opener'|'discovery'|'breakdown'|'mission_roster'|'context'|'finalize'|'finalized'
Checkpoint   = '0.1'|'0.2'|'0.3'|'0.4'|'0.1+0.2' /* Upkeep and Diagnostic fast paths */
Topic        = 'problem'|'outcome'|'scope'|'deadline'|'core_flows'|'data_integrations'
             | 'quality_targets'|'edge_cases'|'existing_assets'|'acceptance'
FactKind     = Topic|'nogo'|'risk'|'module'|'requirement'|'scenario'|'work_kind'
             | 'package'|'territory'|'constraint'|'context_ref'|'trace'
WorkKind     = 'data'|'infra'|'design-system'|'frontend'|'api'|'services'|'ai'|'maintenance'|'docs'|'audit'
DispatchRole = 'build'|'test-unit'|'test-e2e'|'review-spec'|'review-security'|'red-team'
EarsPattern  = 'ubiquitous'|'event'|'state'|'optional'|'unwanted'|'complex' /* complex = a combination */
Level        = 'unit'|'integration'|'e2e'
Package      = 'diagnostic'|'landing_page'|'stabilize'|'feature'|'upkeep'|'custom'

// Session tables (the interview)
onboarding_sessions { id, mission_id, stage: Stage, status: 'active'|'paused'|'context_blocked'|'finalized', pause_reason?,
  package_provisional?, package_final?, prompt_version, plan_version, last_activity_at, finalized_at? }
messages     { id, session_id, seq /* 0 = opener */, role: 'opener'|'canon'|'operator', text,
  prompt_version, tokens_in, tokens_out, tokens_cache_write_5m, tokens_cache_write_1h, tokens_cache_read, created_at }
  // Canon chat history is served from here (a GET route in the factory's API routes), not from traces
facts        { id, session_id, kind: FactKind, value: jsonb, source: 'said'|'relayed'|'uploaded'|'repo'|'inferred',
  status: 'confirmed'|'proposed'|'rejected', message_id?, span?: [start, end], upload_id?,
  repo_ref?: { commit, path }, supersedes_fact_id?, scan_flagged: bool /* hidden-text or Unicode scan; stays proposed */ }
  // uploaded facts start 'proposed' with the source quote shown; approving the checkpoint confirms them
uploads      { id, mission_id, session_id?, blob_key /* ported Drive storage */, name,
  mime /* PDF, DOCX, Markdown, plain text, image */, size,
  parse_status: 'pending'|'parsed'|'failed'|'unsupported', at }  // same table as the factory's data model; delete refused once approved facts cite it
topic_coverage { session_id, topic: Topic, state: 'clear'|'partial'|'missing' }
questions    { id, session_id, stage: Stage, text, options?: jsonb, recommended?, answer?, answered_at?,
  blocking: bool, module_ref? }
quality_targets { id, plan_id, module_ref?, metric /* e.g. LCP_ms, axe_violations */, threshold, check_ref }
checkpoints  { id, session_id, checkpoint: Checkpoint, version, sections: jsonb, cited_fact_ids: uuid[],
  state: 'draft'|'approved'|'stale', stale_module_refs: text[], approved_at? }
rubric_results { checkpoint_id, check_id /* B1..B11, M1..M13 */, applies: bool,
  result: 'pass'|'fail'|'finding'|'advisory', detail }
// findings: ONE schema, defined once in the factory doc's data model (Main tab) and imported from the contract package.
// Onboarding writes source 'checkpoint' with checkpoint_id and no reviewed_commit. Shown here for reference:
findings     { id, checkpoint_id?, mission_id, source: 'checkpoint'|'review'|'gate', source_role, check_id?, target_ref,
  evidence: jsonb, kind: 'requirement'|'security'|'scope'|'advisory', route: 'rework'|'proposal'|'receipt' /* set by code */,
  state: 'open'|'triage'|'confirmed'|'dismissed'|'fixed'|'accepted', reviewed_commit?, fixed_by_check?, reason? }
  // code confirms a finding whose citation resolves; triage is only for citations that don't resolve or have no evidence
context_refs { id, session_id, module_ref, kind: 'doc'|'design'|'repo_path'|'fixture'|'secret_name', target, upload_id?, reason, read_order, resolved: bool, error? }
usage_log    { session_id, call_kind: 'canon'|'extractor'|'breakdown'|'brennan'|'checkpoint_doc', model,
  tokens_in, tokens_out, tokens_cache_write_5m, tokens_cache_write_1h, tokens_cache_read, weighted_tokens, cost_usd /* priced by the model proxy */, ok: bool, error?, at }
  // every call goes through the model proxy with a service token; the proxy is the meter of record

// Output tables (written at finalize and read by the factory)
plans        { id, mission_id, session_id, version, package: Package, package_version, roster_version,
  brief_snapshot: jsonb /* goals, users, no-gos, constraints, risks: source of DISPATCH.md goals */,
  state: 'approved'|'superseded', supersedes_plan_id?, template_slug?, template_version?, price, approved_at }
codebase_analysis { plan_id, repo_commit?, stack: jsonb, conventions: text, build_cmd, test_cmd, lint_cmd,
  standing_context: 'found'|'generated' }
plan_modules { id, plan_id, ref /* M0.. */, goal, work_kind: WorkKind, depends_on: text[], wave /* computed depth */,
  write_paths: text[], read_refs: uuid[], forbidden_paths: { path, owner_ref }[] /* computed */, constraints: text[],
  requirement_refs: text[], scenario_refs: text[], check_refs: text[], escalate_when: text[],
  reference_refs: text[] /* existing code that shows the pattern */, security_triggers: text[],
  asvs_level?: 'L1'|'L2'|'L3', data_classification?: 'public'|'internal'|'personal'|'payment',
  trace?: { entry, root_cause, fix_site, verification } /* chains */, est_minutes, est_weighted_tokens, est_usd /* feeds the budget check at 0.3 and Gate 1 */,
  est_source: 'canon'|'calibrated', provisional: bool }
requirements { id, plan_id, ref /* R1.. */, module_ref, ears_pattern: EarsPattern, text, fact_id }
scenarios    { id, plan_id, ref /* S1.. */, requirement_ref, level: Level, given, when, then,
  kind: 'happy'|'failure'|'pinning'|'smoke', acceptance: bool, check_ref, locked_hash?,
  failed_first_at?, passes: bool /* check runner only */, quarantined: bool }
checks       { id, plan_id, ref /* CK1.. */, kind: 'file_exists'|'test'|'typecheck'|'command'|'e2e', spec: jsonb }
outbox       { id, kind: 'render_dispatch', plan_id, state, created_at }  /* unique (kind, plan_id) */
```

**What Gate 1 checks, and where each part comes from.** Gate 1 uses agent-dispatch's pre-dispatch checklist. Code renders DISPATCH.md and every task doc from the tables above, and nothing starts until every section is filled.

| DISPATCH.md section (one per mission) | Source |
| --- | --- |
| Goals | 0.1 problem, outcome and scope |
| Conventions and build, test and lint commands | `codebase_analysis` |
| Execution traces (fix work) | `plan_modules.trace` |
| Territory map, with every path owned by one module | `plan_modules.write_paths` |
| Waves | computed from `depends_on` |
| Merge order | code: one module at a time, in the order they finish (dependencies permitting), each as a tested integration commit |
| Success criteria | acceptance scenarios (B9) and quality targets (B10) |
| Room setup | code (runner) |

| Task doc section (one per dispatch, with the activation built in) | Source |
| --- | --- |
| Identity: agent, module, branch, room, cap | roster (at render) + code |
| Agent config hash, and the skills and knowledge entries selected for this dispatch | code (at render) |
| Role, with cross-agent context | `goal`, plus the modules it depends on and those that depend on it (computed) |
| Reading list, in order, with a reason for each | `context_refs` (`read_order`, `reason`), with AGENTS.md / CLAUDE.md first |
| Files owned | `write_paths` |
| Tasks: IDs, current state, required change, key details, reference pattern | requirements and scenarios. Current state comes from the trace or the repo, the reference pattern from `codebase_analysis`, key details from `constraints`. |
| Do-not-touch paths, each with its owner | `forbidden_paths` (path and owner) |
| Verification commands with expected output | `check_refs` plus the build, test and lint commands |
| Commit strategy | fixed template: `type: Mn-task — description` |
| Completion | the completion report template: tasks, parked tasks, P0 discoveries, issues for others, dependency requests, escalations |

**The task doc by dispatch role.** Every role gets the same 7 parts, filled differently. "None (read-only)" counts as a filled section at Gate 1.

- **build** (the builder). *Owns:* the module's territory. *Tasks:* its requirements. *Verification:* its locked tests, plus build, test and lint.
- **test-unit** (Nemi). *Owns:* `tests/Mn/`. *Tasks:* one failing test per unit or integration scenario. *Verification:* the fail-first check.
- **test-e2e** (Fenn). *Owns:* `e2e/Mn/` and `fixtures/Mn/`. *Tasks:* one failing browser scenario per e2e scenario, plus its stubs. *Verification:* the fail-first check.
- **review-spec, review-security, red-team.** *Owns:* none (read-only). *Tasks:* review against the requirements, the ASVS level, or attack paths. *Verification:* each finding cites an ID and evidence.
- **audit** (Diagnostic). *Owns:* nothing in the client's repo. Its report is AVEL's deliverable, stored outside that repo. *Tasks:* its audit area. *Verification:* the evidence rule.

Because each module has its own test folders, Nemi's and Fenn's dispatches never overlap and can run in parallel.

**Kept from agent-dispatch's template, and what changed:**

- Every task is P1, so Gate 3's "all P1 chains complete" applies.
- The **Wave organization** section shows the computed wave and what runs alongside.
- The **Escalation** section comes from `escalate_when`.
- The template's in-session "Retry 1–3, then PARK" block is replaced by: *work until your locked tests pass, and run verification after each task. If you're stuck, stop and write the completion report. Don't start a new approach on your own.* Code runs the retry protocol, so retries never pile up inside one 60-minute cap.
- The style blocks (intensity protocol, mesh-mode keywords, optimal-path appendix) aren't rendered. The execution protocol section carries the method.

**Stage state machine**

| From | Event | To | Guard (code) |
| --- | --- | --- | --- |
| opener | session created | discovery | Message 0 is written in the same transaction |
| discovery | 0.1 approved | breakdown | No topic missing; problem, outcome and scope clear |
| discovery | 0.1+0.2 approved (fast path) | mission\_roster | Package is `upkeep` with one module and an earlier approved context pack, or package is `diagnostic` with template audit modules |
| breakdown | 0.2 approved | mission\_roster | Every applicable code check passes, and every finding is fixed or accepted with a reason |
| mission\_roster | Final package differs from provisional | breakdown | 0.2 is re-checked under the new package. If anything fails, it goes `stale`. |
| mission\_roster | 0.3 approved | context | Every work kind and dispatch role has a confirmed agent in the current `roster_version`, and the budget check passes: each module's `est_usd` × 1.5 fits its $15 budget, and the mission total fits the mission budget (see Cost control in the factory doc) |
| context | The repo changes a provisional module | breakdown (that module only) | Its ref goes into `stale_module_refs` |
| context | 0.4 approved | finalize | Every ref resolves, B8 passes, and `codebase_analysis` is complete |
| finalize | finalize called | finalized | All checkpoints are approved and not stale. One transaction writes the plan, the output tables and the outbox row. |
| finalized | Converge pass or approved contract change | breakdown (affected modules only) | A new plan version is created and the old one becomes `superseded`. Package fit and price are re-checked, and a price change needs your approval. |
| any | You reopen a checkpoint | its stage | Later checkpoints that cite a changed fact go `stale` |
| any | Provider error or 60-second timeout | same stage | One retry after 30 seconds, then the session pauses (`provider_error`) |
| any | Extractor failure | same stage | The turn is kept and extraction runs again once. If it still fails, the stage can't exit until you re-run it. |
| context | GitHub read fails, or an upload can't be parsed | context (blocked) | The reason is stored, and Canon asks again |
| any | A usage limit is hit | same stage, paused | `limit:<name>`, and nothing retries |
| any | 72 hours with no activity | paused | Nothing expires. Opening the session resumes it. |

**Rules the build must test**

1. A new session's history is never empty, and message 0 is the opener.
2. Stage, checkpoint, work-kind and role enums are imported from one contract file.
3. Every turn logs its `prompt_version`, and it equals the stored one.
4. A `said` or `relayed` fact without an exact span match is saved as `inferred`.
5. Generating a checkpoint is refused unless the one before it is approved and not stale.
6. Calling finalize twice produces exactly one outbox row and one plan.
7. Rubric inputs come from typed facts, never from regex over chat.
8. Every usage limit stops cleanly with a reason, and nothing retries in a loop.
9. Only the operator role can approve. No approval asks for a password: checkpoint approvals, finalize and budget raises are one click in the web app, or a command in the CLI. Password re-entry is kept only for credential actions: writing secrets, creating or rotating repo connections, and approving a CLI device login (see the API routes section of the factory doc).
10. Gate 1 refuses to start any dispatch if a single section of DISPATCH.md or any task doc is empty.
11. Code sets every finding's route, and confirms a finding whose cited ID exists and has evidence. A finding whose cited ID doesn't exist, or that has no evidence, goes to triage for you to decide. It never becomes advisory silently.
12. Deleting an upload is refused once an approved checkpoint cites a fact from it. `DELETE /api/uploads/:id` returns a conflict naming those checkpoints; reopen them first.
13. 0.3 can't be approved, and Gate 1 refuses the plan, when the budget check fails.

Evaluations aren't running yet. Until they run, any change to Canon's prompt, skills, knowledge, model or runtime goes live only as a PR to the factory repo that you merge. Each change is labeled with its factory commit and agent config hash, and rollback is reverting the PR.

## The IQ onboarding bugs, turned into rules for Canon

| IQ bug | Rule for Canon | How it's enforced |
| --- | --- | --- |
| The opener disappears for new users | The server writes the opener as message 0, and the client never replaces history with an empty list | Test: a new mission's history is never empty |
| The section tracker never moves past the first section | One shared list of stages and sections in the contract | Typecheck, plus a test that walks every stage with realistic data |
| The onboarding prompt in the database is never used | One prompt source with a version number. Each turn logs which prompt version it used. | Test: the logged version equals the stored version |
| Guessed facts look the same as confirmed ones | Every fact has a source and a status (above) | Gate documents refuse to show unconfirmed facts as plain text |
| The offer was generated before the checkpoint was approved | Every checkpoint checks the ones before it, on the server, before generating anything | Test: generating 0.3 before 0.2 is approved is refused |
| The build fails 7 times on a draft avatar | Finalize checks preconditions once and stops on the first failure. A failure is never retried in a loop. | Finalize is one transaction, and the ladder never retries a failed precondition |
| "Leads" got counted as an ad budget | Package fit and roster use structured fields, never substring matches on free text | Rubric inputs are typed and come from the extractor, not from regex over chat |
| The frontend ignores the server's progress | The client only displays the server's journey | The contract types the journey, and there's no client-side progress code |

## Sources

- [Effective harnesses for long-running agents](https://anthropic.com/engineering/effective-harnesses-for-long-running-agents) — Anthropic: initializer agent, a JSON feature list whose `passes` field agents were told to be the only thing they change, browser end-to-end testing, startup smoke test
- [GitHub Spec Kit: clarify command](https://www.mintlify.com/github/spec-kit/commands/clarify) — up to 5 questions, a list of ambiguity categories, Q → A written into the spec
- [Spec Kit tasks template](https://tessl.io/registry/tessl-labs/spec-kit/0.6.4/files/skills/speckit-01-specify/templates/tasks-template.md) — tasks grouped by story, \[P\] only when different files and no dependencies, an independent test per story
- [Kiro Feature Specs](https://kiro.dev/docs/specs/feature-specs/) — requirements, design and tasks, with EARS acceptance criteria
- [EARS overview (RE'18)](https://sites.google.com/vierhauser.net/ears2018/overview-of-ears) — Mavin's five patterns
- [Task Master task structure](https://docs.task-master.dev/capabilities/task-structure.md) — complexity scored 1–10, recommended subtasks, an expansion prompt per task
- [The BMAD Method explained](https://codemyspec.com/blog/bmad-method-explained) — analyst → PM → architect planning, story files that each carry their own context
- [Shape Up, chapter 6: Write the Pitch](https://basecamp.com/shapeup/1.5-chapter-06) — problem, appetite, solution, rabbit holes, no-gos
- [User Story (INVEST)](https://www.martinfowler.com/bliki/UserStory.html) — Martin Fowler on Bill Wake's criteria
- [Walking Skeleton](https://packtpub.com/en-au/product/agile-technical-practices-distilled-9781838980849/chapter/chapter-17-21/section/the-walking-skeleton-ch21lvl1sec89) — Cockburn's definition
- [Thin Vertical Slice](https://llm-coding.github.io/Semantic-Anchors/anchor/thin-vertical-slice)
- [Specification by Example, 10 years later](https://gojko.net/2020/03/17/sbe-10-years.html) — Gojko Adzic's survey: Given/When/Then is used by 71%
- [Definition of Ready (GitLab handbook)](https://handbook.gitlab.com/handbook/customer-experience/professional-services-engineering/professional-services-delivery-methodology/definition-of-ready/)
- [Playwright best practices](https://playwright.dev/docs/best-practices)
- [ISO/IEC 25010:2023 product quality model](https://quality.arc42.org/standards/iso-25010) — nine quality characteristics, used for the quality-targets topic and B10
- [OWASP ASVS](https://quality.arc42.org/standards/owasp-asvs) — verification levels L1–L3, each including the one below it, used for M12
- [Characterization test](https://www.infoq.com/news/2007/03/characterization-testing) — Feathers' tests that record what existing code actually does, used for M11
