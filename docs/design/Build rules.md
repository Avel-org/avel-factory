# Build rules: the team that builds AVEL, and how it works

Nov 15, 2026 · @javaris · version 3 of the team in `AVEL agent system.md`

This replaces that guide's team (section 3), its review team (section 7, items 1 and 3 stay) and its example timing (section 4). The guide's principles, its research and its five numbers still stand. Rules are numbered (A1, B2 and so on) so a review finding, a report or a decision can cite one.

**How agents are set up:** each builder and checker has an identity file (`.claude/agents/<name>.md`), OSA and the leads have system prompts (`.agents/system/`), and work reaches the builders and checkers only through dispatch: a ticket in a sprint's `plan.toml`, rendered into task docs (`Agents, identities and system prompts.md`).

**Where the code rules are:** `AGENTS.md` (Architecture rules, API rules, Writing Effect) holds the rules for the code itself. This doc says who does what, and how work moves from a ticket to `main`. When the two disagree, stop and raise it with your lead; don't pick one.

## The team

| Role | Who | Model | Does | Never |
| --- | --- | --- | --- | --- |
| **Operator** | Javaris | — | Approves each cycle's ticket lists, full-rigor merges, step closes, change requests and new dependencies. Answers escalations. | — |
| **Operator agent** | OSA | MIOSA AI: DeepSeek V4.1 Flash for everyday work, Kimi K2.6 for briefs (CR-29) | Runs the cycle for Javaris: files the approved tickets, starts and watches sessions, keeps the board, writes digests and decision briefs, merges clear and clean PRs (CR-36), relays instructions to running sessions (CR-37) | Approves, merges anything but a clear and clean PR (CR-36), writes product code or tests, changes rules, or decides anything (CR-29: OSA prepares, Javaris decides) |
| **Backend lead** | Axis | Opus | Plans backend tickets, answers the backend builder and checker, merges green backend work, drafts change requests | Writes most of the code, or reviews its own tickets |
| **Backend builder** | Soap | Sonnet; Opus on full-rigor tickets | Builds one backend ticket per session to pass its acceptance tests | Edits the acceptance tests, or reviews |
| **Backend checker** | Rigg | Sonnet; Opus for full-rigor reviews | Writes each ticket's acceptance tests first, then reviews the builder's pull request | Writes product code |
| **Frontend lead** | Zero | Opus | The same as Axis, for the web app | The same |
| **Frontend builder** | Fantem | Sonnet; Opus on full-rigor tickets | Builds one frontend ticket per session | Edits the acceptance tests, or reviews |
| **Frontend checker** | Fenn | Sonnet | Writes the frontend acceptance tests and end-to-end tests first, then reviews | Writes product code |

Each lead's two helpers are a **builder** and a **checker**, so no work grades itself: the checker's tests decide the builder's ticket, and the checker reviews what the builder made. It's the factory's own rule (tests first, by someone who doesn't build) applied to building the factory. The four helpers carry `Roster.md` names by default. Rename them if you like: the names don't change the rules, but each name must match its identity file and the renderer's role table.

## A. Who may do what

| Action | Operator | OSA | Leads | Builders | Checkers |
| --- | --- | --- | --- | --- | --- |
| Approve a cycle's ticket list | **Yes** | Prepares it | Write it | — | — |
| File tickets and start sessions | — | **Yes**, only approved tickets | — | — | — |
| Write product code | Yes | **No** | Small fixes only (A4) | **Yes**, inside the ticket's files | **No** |
| Write acceptance and end-to-end tests | Yes | **No** | — | **No** | **Yes** |
| Review a pull request | Yes | **No** | Full-rigor second review | **No** | **Yes**, their own lane |
| Merge to `main` | Yes | **Yes**, only when every CR-36 condition holds | **Yes**: green, reviewed, not full-rigor | **No** | **No** |
| Merge a full-rigor PR | **Yes** | **No** | Recommends | — | — |
| Change `packages/contract` or `packages/db` | Approves | **No** | Axis only, through a `contract` or `schema` ticket (I3) | Axis's builder, inside such a ticket | — |
| Add a dependency | **Approves** | — | Requests | — | — |
| Write or accept a change request | **Accepts** | Briefs it | **Write it** | Flag the need | Flag the need |
| Close a build step | **Yes** | Prepares the report | Recommend | — | — |
| Push to any remote | **Only when Javaris says** | No | No | No | No |

- **A1.** Javaris decides; OSA prepares. OSA merges only a PR that meets every CR-36 condition, by squash merge, and has no other write access to `main`. It still has no approve button anywhere, and its session can't use one (CR-29).
- **A2.** A lead never reviews or merges a ticket it built itself.
- **A3.** A builder never changes a file outside its ticket's "may change" list, and never edits a test its checker wrote. CI checks both (H6).
- **A4.** A lead may push a fix of 10 lines or fewer straight to an open PR (a typo, a missed import) and says so in the PR. Anything bigger is a ticket.

## B. The cycle

```
PLAN → TESTS → BUILD → CHECK → REVIEW → MERGE
```

- **B1. Plan (about 30 minutes).** Each lead writes 3 to 6 tickets for the next 2 to 4 hours. OSA puts both lists into one decision, and Javaris approves them together. Nothing starts before that.
- **B2. Tests.** For each ticket, the checker's **tests dispatch** writes its acceptance tests on the ticket's branch. They must run and **fail** on the current `main`. A test that passes before any code is written goes back to the checker. The tests are then locked (H6).
- **B3. Build.** Once the tests are locked in `locks.md`, OSA starts the builder's **build dispatch** on the same branch. The session ends with its completion report, which becomes the pull request's description.
- **B4. Check.** CI runs on every PR (H4).
- **B5. Review.** The checker's **review dispatch** reviews each PR on a detached checkout, once per cycle (section G).
- **B6. Merge.** The lead merges what's green and has no blocking finding. OSA may merge a PR instead of the lead when every CR-36 condition holds. Full-rigor PRs wait for Javaris (G7).
- **B7. Work in progress:**
  - At most 4 sessions run at once: one builder and one checker per lane.
  - A checker can write tests for the next ticket while the builder works on the current one, because they touch different files.
  - Two tickets running at the same time never share a file.
- **B8. A new cycle doesn't start** until the last one's PRs are merged, sent back, or re-planned.
- **B9. The thin slice comes first.** Every step builds the simplest path that works end to end before any part is polished.

## C. Tickets

- **C1. A ticket is one module of the sprint's plan.** The lead writes it into `docs/agent-dispatch/<lane>/sprint-NN/plan.toml` (a sprint is one cycle). `scripts/render.py` turns it into three task docs, each in agent-dispatch's seven parts with its activation prompt last:
  - `agent-<checker>-<ticket>-test-unit.md` (or `-test-e2e`): the acceptance tests;
  - `agent-<builder>-<ticket>-build.md`: the build;
  - `agent-<checker>-<ticket>-review.md`: the review.

  The rendered task docs are the ticket. Once the repo exists, OSA mirrors each ticket as a GitHub issue that links them. Every ticket carries what this summary shows; the fields come from `plan.toml`:

```markdown
## T-B12: Error mapper for database errors

Lane: backend · Lead: Axis · Builder: <name> · Checker: <name> · Rigor: standard | full
Step: 1 · Depends on: T-B11 · Refs: Step 0 and Step 1 plan, test 6

### Goal (one sentence a person would notice)
A database rule broken by a write comes back as the contract's 409 or 422, never a 500.

### Files the builder may change
packages/server/src/platform/db/**

### Files the builder must not change
packages/contract/**, packages/db/**, every acceptance test below

### Acceptance tests (written first by the checker, must fail on main)
packages/server/test/db-errors.test.ts:
- a unique violation is 409
- a CHECK violation is 422
- a stale rowVersion is 409

### Done when
CI is green and the acceptance tests pass. Nothing else.
```

- **C2. Size:** about 120 minutes of agent work. If it's bigger, the lead splits it. Javaris (Nov 17): plan fewer, bigger tickets that fill a session, not a stream of small PRs.
- **C3. Done means the tests pass.** Polish that no test asks for isn't scheduled.
- **C4. Full rigor** goes on any ticket touching:
  - sign-in, step-up or sessions;
  - secrets, KMS or tokens;
  - the jobs engine, claims or the reaper;
  - events and `seq`;
  - the integrator or the mission branch;
  - the gates or receipts;
  - money (budgets, reservations, the proxy);
  - rooms and their isolation.

  Everything else is standard.
- **C5. A step's "done when" tests** are tickets of their own, written by the checker and owned by the lead.
- **C6. Ticket IDs:** `T-B<n>` for backend and `T-F<n>` for frontend, never reused.

## D. Sessions

- **D1. One dispatch per session, started fresh.**
  - `scripts/agent.sh` opens it in a new worktree with the agent's identity, `claude --agent <name>`, and `/dispatch <lane>/sprint-NN/<task doc>` as the first message.
  - In the building tabs, the lane loop does this in the agent's own pane. OSA may run it headless (`claude -p`) when nobody is watching.
  - Nothing is pasted in by hand. OSA may message a running session under CR-37, logged, and only within the ticket. If the plan is missing something a message can't fix inside the ticket, the lead fixes the plan and re-renders.
  - No resuming: a session that stops leaves its completion report, and the next attempt starts fresh from that report.
- **D2. Limits:**

  | Session | Turns | Time | Cost |
  | --- | --- | --- | --- |
  | Builder or checker | 150 | 120 minutes | $4 ($8 on Opus) |
  | Lead (planning or full-rigor review) | 60 | 45 minutes | $6 |
  | The whole build, per day | — | — | $75 |

  These are starting values, set in `scripts/agents/limits.json`. A builder's or checker's interactive session is capped by turns as well as time (CR-37): `scripts/agent.sh` sets the limit, and `scripts/hooks/turns.py` warns in the last 5 turns, then allows only the report, its commit and a message to OSA for 5 grace turns, then refuses everything. The lead row isn't enforced by the hook yet: how to cap a lead's long-running seat is Javaris's decision (lead kit PR, Nov 17). When the day's limit is reached, OSA starts nothing new and tells Javaris.
- **D3. The startup routine,** every session, in order:
  1. Confirm the folder and branch.
  2. Read the task doc in full, then its Context in order: the identity file, `AGENTS.md`, this doc, the codebase analysis and the reading list.
  3. Read `git log -20`.
  4. Start the session's own Postgres (D5).
  5. Run the tests, and only then start work.
- **D4. One worktree per attempt, one branch per ticket.** The branch is `t/<ticket-id>-<slug>`, for example `t/B12-db-errors`. The tests and the build dispatches commit to it in turn, each from a fresh worktree. A review dispatch runs on a detached checkout of the PR's head.
- **D5. One database per worktree.** `scripts/pg-local.sh start` already runs one Postgres container per checkout, on a free port, so two sessions' tests never collide. The dev server's port comes from the worktree too.
- **D6. Memory lives in files.**
  - The sprint folder is the task list: `scripts/dispatch.sh <lane>/sprint-NN --status` shows what's done, running, ready and waiting.
  - The completion report is the record, and the PR description copies it.
  - Agents never edit a task doc, and never commit `locks.md`, messages or status files. The lead writes the lock line.
- **D7. Permissions:**
  - On your laptop, sessions run with the repo's `.claude/settings.json` allowlist: pnpm, git inside the worktree, and the package registry.
  - Permissions are skipped only inside a sandbox (a container, or a MIOSA room under CR-22), never on the laptop.
- **D8. Helpers only read.** A session may start small helper agents to search code or docs. Helpers never change files, and they count against the session's cost limit.

## E. Build rules

### For both lanes

- **E1. Every rule in `AGENTS.md` applies.** A checker's finding cites the section it breaks (for example "AGENTS.md, API rules: DTOs").
- **E2. The contract is the meeting point.**
  - The backend implements it.
  - The frontend builds against `contract-mock`, which is generated from the same contract.
  - A question about an API is answered by the contract, not by a message.
- **E3. The design is frozen.** If the code shows a doc is wrong or missing something, the builder stops and reports `needs-cr` (L2). Nobody changes the design to fit the code.
- **E4. TypeScript is strict:**
  - no `any`, no `@ts-ignore` or `@ts-expect-error` without a linked issue, no non-null `!` on data from outside;
  - Biome passes with no warnings;
  - no `console.log`: the logger only.
- **E5. No new dependency** without Javaris's approval in the ticket list. Every new package names its licence, its size and why the existing ones don't do the job. The lockfile changes only in that ticket.
- **E6. No secrets anywhere:** not in code, fixtures, logs, test names, PR text or screenshots. Test credentials are generated in the test. `.env*` files are ignored, and CI scans for secrets (H4).
- **E7. Docs move with the code.**
  - A change that makes a doc out of date updates it in the same PR.
  - Generated docs come only from `pnpm --filter @avel/docs generate`.
  - The frozen v0.6 docs are never edited.
- **E8. No dead or speculative code.** Nothing is built "for later", and nothing is left commented out. If a ticket doesn't need it, it isn't in the PR.

### Backend (Axis's lane)

- **E9. Step order is the build order.** Step 1 runs in the order `AGENTS.md` gives: spike 1 first, the DBOS test (spike 2) before the jobs engine. No ticket from a later step starts until the current step closes.
- **E10. Real Postgres, always.** No database mocks or in-memory substitutes. Fakes are only for things outside the process (the model vendor, GitHub, the room host), provided as Effect layers.
- **E11. The database enforces its rules,** and code maps the violations (AGENTS.md). A ticket that wants a new CHECK or table is a `schema` ticket with a CR (I3).
- **E12. Each table is written only by its owning module** (`Backend modules and build plan.md`). Importing another module's internals is a lint error.
- **E13. Every route gets four tests:**
  - the happy path, with its DTO checked against the contract;
  - the error body with its `requestId`;
  - the idempotent replay, for writes;
  - the stale `rowVersion`, where the route takes one.

### Frontend (Zero's lane)

- **E14. The handoff sets the order.** The port to `apps/web` follows `handoff/README.md`'s order, and the shell and sign-in come before any page they hold.
- **E15. The control room's standing rules:**
  - No money, except AI run cost against its cap (CR-W20 §3).
  - Agent, client and Canon text renders as plain text, never HTML.
  - Approvals ask for no password; only credential actions do.
- **E16. Budgets in CI:** at most 150 KB of JavaScript per route (a warning over 130 KB), and the data layer built from the minified contract.
- **E17. Accessibility:** every page passes an automated WCAG 2.2 AA check in its end-to-end test.
- **E18. TanStack DB** is used only if CR-W23 is accepted, at the versions CR-W23 pins.

## F. Tests

- **F1. Acceptance tests come first,** written by the checker, and must fail on `main` before the build starts (B2).
- **F2. Locked means locked.** After B2, the builder can't change those test files. If a test seems wrong, the builder reports `test-dispute`, the checker answers, and the lead decides. A disputed test is changed only by the checker, in its own commit. If the test was already locked, the lead then adds a second line for the ticket in `locks.md`, at the branch tip after the checker's commit, ending `(F2 relock)`; lines are only ever added, never edited. The lock check honours the relock once T-B5 (backend sprint-02) teaches it to; until then an F2 change after a lock means rebuilding the unpushed branch with the lock at the new tip, as T-B0's was.
- **F3. No skipped or focused tests on `main`:** no `.skip`, `.only` or `todo` without a linked issue. CI refuses them.
- **F4. Time and randomness are controlled:** `TestClock` and the `Clock`, `Ids` and `Random` services. A test never sleeps on the wall clock.
- **F5. A flaky test is a bug.** Two different results on the same commit get an issue, and the test is quarantined only by its lead with Javaris's OK, listed in `docs/quarantine.md`. A quarantine lasts until the end of the step.
- **F6. The frontend's end-to-end tests** run in CI with Playwright and record a screenshot and a short video, attached to the PR.

## G. Review

- **G1. The checker sees only the diff and the ticket,** not the builder's session.
- **G2. Every finding cites evidence:** a file and line, a failing command, or a rule ID (this doc or `AGENTS.md`).
- **G3. Severity decides what blocks:**

  | Severity | Meaning | Blocks |
  | --- | --- | --- |
  | P0 | Broken, unsafe, or loses data | Yes |
  | P1 | Wrong behaviour, a missed requirement, or a broken rule | Yes |
  | P2 | Should be better | Only in round 1 |
  | P3 | Nice to have | Never; goes to the backlog |

- **G4. The builder filters the findings.** It fixes what's in scope and answers the rest with a reason.
- **G5. At most two rounds.** After round 2, only a P0 or P1 blocks.
- **G6. Review in batches,** once per cycle.
- **G7. Full rigor gets three reviews:**
  1. the lane's checker (on Opus);
  2. the other lane's lead, as a security and design pass using `docs/review/security-checklist.md`;
  3. Javaris, who merges it.

  OSA attaches a brief: what changed, what the tests prove, and what each reviewer said.

## H. Git, pull requests and merging

- **H1. `main` is protected.** Changes arrive only by PR, squash-merged, with linear history. Nobody pushes to it directly.
- **H2. Commits follow the AVEL Commit Convention v1** (v1.1 if you accept it).
  - The PR title is the squash commit's header, for example `feat(server/events): add the commit-ordered event seq`.
  - Trailers include `Refs:` for the ticket and any CR. Only a ticket's own commits name it in `Refs:`; a plan, CR or docs commit names tickets in its text instead. The kit counts a ticket as merged when its build report is on `main`, never from a `Refs:` line.
- **H3. One ticket, one PR.** The PR description is the report:
  - what changed;
  - how it was checked;
  - the acceptance tests, and that they failed first;
  - anything found that the ticket didn't cover.
- **H4. Required checks:**
  - build, typecheck, lint, test (real Postgres);
  - the docs drift check, and a clean `generate` (no diff);
  - commitlint on the PR title;
  - the contract's OpenAPI diff;
  - the secret scan;
  - for the web: the bundle budget, accessibility and end-to-end tests.
- **H5. A red check blocks.** Nobody merges red, retries CI to get a green, or marks a check optional.
- **H6. Lock checks:** CI fails a PR if the builder's commits touch a file outside the build task doc's Territory, or any file listed in `locks.md`. The lists are read from the rendered task doc and `locks.md`, never from the issue. CI also fails a PR whose task docs differ from what `render.py` renders from the plan.
- **H7. Pushing to any remote** happens only when Javaris says so (the standing rule). Until the repo exists, OSA keeps the board in local files and Javaris gets each checkpoint as a zip.

## I. Docs and change requests

- **I1. Which doc wins** is set by `docs/design/README.md`.
- **I2. A change request is the only way the design changes.** The lead drafts it (what, why, which docs and tables), OSA briefs it, and Javaris accepts or rejects it. The code follows once it's accepted.
- **I3. Contract and schema tickets:**
  - Only Axis's lane edits `packages/contract` or `packages/db`, in a ticket labelled `contract` or `schema` that names an accepted CR.
  - A contract change also needs Zero's sign-off, because the frontend builds against it.
  - The frontend asks for changes with a CR-W.
- **I4. Decisions are written down.** When Javaris decides with a reason, the reason goes into the CR or this doc. A reason that repeats becomes a rule here, through a reviewed PR.

## J. Security

- **J1. Agents never hold production credentials:** no client tokens, no real KMS key, and never the factory's own model key.
  - Local work uses a test KMS key.
  - Sessions reach the model through the build team's own login or its avel-build key (`Build roster and environment.md`).
- **J2. Agents run as a non-root user.**
- **J3. Untrusted input stays untrusted.** Text from a client, Canon or an agent is never run, rendered as HTML, or pasted into a prompt as an instruction.
- **J4. A suspected secret leak stops the cycle.** OSA pauses every session, and Javaris rotates the secret before work resumes.

## K. Cost

- **K1. Every session runs under the D2 limits.** A session that hits its limit ends, and its report says how far it got.
- **K2. A ticket that ends without passing twice** isn't started a third time as it is. The lead splits it, rewrites it, or escalates it (L3).
- **K3. OSA records each session's cost** against its ticket. The digest shows cost per merged PR.
- **K4. OSA's own model spend is a business cost,** capped at the provider (CR-29 §7). Its monthly limit is still CR-29 decision 4.

## L. Escalations and stopping

- **L1. Stop instead of guessing.** A session that can't finish inside its ticket ends with one of these report statuses:
  - `blocked` (waiting on another ticket);
  - `needs-cr` (a doc is wrong or missing something);
  - `test-dispute`;
  - `needs-dependency`;
  - `out-of-scope` (it found work the ticket doesn't cover).
- **L2. Who answers:**
  - The lead answers `blocked`, `test-dispute` and `out-of-scope` within the cycle.
  - `needs-cr` and `needs-dependency` go to Javaris as a decision, with OSA's brief.
  - The agent also messages OSA at once with its status (CR-37); the completion report is still the official record.
- **L3. The same failure twice ends the loop.** The lead re-plans it or escalates it; nobody retries it a third time.
- **L4. When Javaris is needed** (OSA's wake rules, CR-29):
  - **now:** a leak, a full-rigor merge waiting more than 2 working hours, the day's cost limit, or a step-close;
  - **otherwise:** the digest at 9:00, 13:00 and 17:00 Central.
  - **Quiet hours** are 22:00 to 7:00.

## M. What OSA does in each cycle

1. **Before planning:** checks the environment is ready (D3's commands pass on a clean worktree, CI is green on `main`), and lists what's left in the current step.
2. **Plan:** runs `scripts/render.py --check` on both sprints, then puts both leads' ticket lists into one decision, with a brief: the size of each, the files each touches, any overlap, and the expected cost.
3. **After approval:**
   - renders both sprints and commits the folders;
   - runs `scripts/dispatch.sh` for each lane: tests first, each build once its tests are locked, each review once the build's report is in;
   - mirrors the tickets as issues, once the repo exists.
4. **During the cycle:**
   - watches each session against its limits;
   - routes each report status to the right person (L2);
   - never answers a question meant for a lead or for Javaris;
   - relays instructions from Javaris or a lead to a running session, logged in `<git common dir>/avel/messages/` (CR-37), and never originates one;
   - merges each PR that meets every CR-36 condition, one at a time, and routes the rest (L2).
5. **After the cycle:** writes the digest (what merged, with OSA's merges listed apart from the leads', what's blocked, what needs a decision, cost per merged PR) and records the cycle in each sprint's `SPRINT-ASSESSMENT.md`.

## N. Done

| Level | Done when | Who says so |
| --- | --- | --- |
| Ticket | Its acceptance tests pass, CI is green, the review has no blocking finding, and it's merged | The lead, or OSA under CR-36 (Javaris for full rigor) |
| Cycle | Every ticket is merged, sent back or re-planned, and the digest is out | OSA reports; the leads confirm |
| Step | Every "done when" test of the step passes against real Postgres on `main`. The docs it touches are updated, generated artifacts are in sync, and the step report is written. | Javaris closes it |

## O. What we measure

The five numbers from `AVEL agent system.md` §11, in every digest:
- the share of commits that change code (target over 60%);
- the time from ticket to merge (under a day);
- the cost per merged PR (falling);
- the blocking findings per PR (falling; if it's high, fix the tickets);
- the corrections per change (falling).

Plus one more for this team: **tests that failed first**, as a share of acceptance tests (target 100%).

## The first cycle (a draft for Axis and Zero to replace)

| Lane | Tickets |
| --- | --- |
| Setup (before cycle 1, Axis's lane) | T-B0: the files and checks this doc relies on (section P) |
| Backend (Step 1) | T-B1 spike 1: Effect at the edge, the adapter and its error table · T-B2 server shell: health, `X-Request-Id`, `X-Contract-Version`, the contract's error body · T-B3 the `Db` service (`withTransaction`, `Tx`, `commitWithEvents`) and database errors to 409 and 422 (test 6) · T-B4 idempotency (test 4) |
| Frontend | The first tickets in `handoff/README.md`'s port order: the shell layout and sign-in against `contract-mock` |

- **Rigor:** T-B3 is full rigor, because it carries events and `seq` (C4). The others are standard.
- **Spike 1 comes first** because it decides CR-30's Effect question. If it fails, T-B2 to T-B4 are re-planned before they start.

## P. What has to exist before the first cycle

| File or setting | What it's for | Rule |
| --- | --- | --- |
| `.claude/settings.json` | The laptop allowlist for sessions | D7 |
| `tools/wezterm/avel.lua` | The build team's WezTerm tabs (written Nov 15) | `Build roster and environment.md` |
| `.claude/agents/{soap,rigg,fantem,fenn}.md` (and `zane.md` if he's added) | The identities (written Nov 15) | D1 |
| `.agents/system/{osa,axis,zero}.md` | The system prompts for OSA and the leads (written Nov 15) | M, section A |
| `.claude/commands/dispatch.md` | `/dispatch <task doc>`: read it in full and follow its activation (written Nov 15) | D1 |
| `scripts/render.py`, `scripts/dispatch.sh`, `scripts/agent.sh`, `scripts/test_render.py` | The dispatch kit: render a sprint's plan, start what's ready, open one dispatch, and its tests. The seats come from `scripts/agents/roster.json` (written Nov 16) | C1, D1, D4 |
| `docs/agent-dispatch/<lane>/sprint-01/plan.toml` | The first cycle's tickets; `docs/agent-dispatch/avel/example-plan.toml` is a worked example | C1 |
| `scripts/agents/lane.sh` | The loop each builder and checker pane runs: opens its agent's next ready task doc through `agent.sh` (written Nov 16) | D1, D4 |
| `scripts/agents/limits.json` | Session counts, turn and time limits (enforced by `agent.sh`), and the dollar limits (recorded; enforced only on API billing) (written Nov 16) | D2, B7 |
| `scripts/pg-local.sh` | One Postgres per checkout, so sessions' tests never collide (already does this) | D5 |
| `docs/quarantine.md` | Quarantined tests, empty to start | F5 |
| `docs/review/security-checklist.md` | The second review on full-rigor PRs | G7 (written Nov 15) |
| The lock check in CI | Builders can't touch files outside the ticket, or the checker's tests | H6 |
| Branch protection on `main`, with the required checks | No direct pushes, no red merges | H1, H4, H5 |
| `.github/CODEOWNERS` | Full-rigor paths (C4) owned by Javaris, with "require review from code owners" on, so only he can merge them | G7 |
| `.env.example` | The server's variables by step, with no values (written Nov 15) | E6 |
