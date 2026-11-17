# The AVEL Agent System

*How AVEL uses a small team of AI agents to build software fast, safely and cheaply, and why it works this way.*

Version 2 · November 9, 2026 · Javaris (AVEL, avelco.dev)

---

## How to read this guide

This guide explains how AVEL organises AI coding agents into a working team. Each section starts with its main point in **bold**, then explains it. Key words appear in *italics* the first time and are defined in the **Terms** section at the end.

You can read it top to bottom, or jump to:

1. [Why this system exists](#1-why-this-system-exists)
2. [Five principles](#2-five-principles)
3. [The team](#3-the-team)
4. [The cycle: how work moves](#4-the-cycle-how-work-moves)
5. [Tickets: the unit of work](#5-tickets-the-unit-of-work)
6. [Sessions: how an agent runs](#6-sessions-how-an-agent-runs)
7. [Review: how work is checked](#7-review-how-work-is-checked)
8. [The operator: the human's job](#8-the-operator-the-humans-job)
9. [Code quality and speed](#9-code-quality-and-speed)
10. [Scaling up](#10-scaling-up)
11. [Measuring the system](#11-measuring-the-system)
12. [The full improvement checklist](#12-the-full-improvement-checklist)
13. [Terms](#13-terms)
14. [Sources](#14-sources)

---

## 1. Why this system exists

**The first version of AVEL's agent system produced more paperwork than code, so it was rebuilt around a few simple rules.**

AVEL's first week of building ran the factory's full process by hand, with 16 agents in "auto mode". Here is what the repository showed afterwards:

| What we measured | Result |
| --- | --- |
| Commits on the main branch | 399 |
| Commits that changed code | 59 (15%) |
| Commits that only changed agent records (messages, locks, events) | 194 (49%) |
| Spec documents for four screens | 131 KB |
| Review rounds on one example page | 5 to 6 |
| Agent sessions | 110, about $253 at API prices |
| Backend server built | None yet |

Six problems caused this:

1. **Specs became the product.** Every screen got a long contract, many review rounds and locked tests before any code.
2. **Review had no stop rule.** Each small change triggered another full review, so one page was polished all day.
3. **The operator was the bottleneck.** Agents worked alone, but every review, merge and question waited for one person.
4. **The order was upside down.** A polished example page came before the layout and sign-in it lives inside.
5. **Bookkeeping outweighed the work.** Half of all commits were records.
6. **Too many lanes ran at once.** More agents meant more messages and merges, not more finished code.

> **Lesson:** adding agents does not add speed. Clear tasks, automatic checks and fewer human handoffs add speed.

---

## 2. Five principles

**Research from Anthropic and Cognition, plus AVEL's own experience, points to five principles.**

1. **One writer per area.** Agents can *think* in parallel (plan, search, review), but only one agent should *write* to a given set of files at a time. Parallel writers make conflicting hidden choices about style, edge cases and patterns (Cognition, 2026).
2. **Lead splits, builders execute, lead combines.** A lead agent breaks work into tasks, builder agents do them, and the lead puts the results together. Cognition calls this "map-reduce-and-manage" and prefers it to swarms of agents negotiating with each other.
3. **Memory lives in files, not in chat.** An agent forgets everything between sessions. Progress must be written to files it reads at the start of each session: a task list, a progress file, the git history (Anthropic, 2025).
4. **Code is the gate, not people.** Automated checks (build, types, lint, tests, size budgets) decide whether work is acceptable. People decide what to build and whether to ship.
5. **Spend tokens where they pay.** Multi-agent systems used about 15 times more tokens than ordinary chats in Anthropic's research system. Use multiple agents for work that benefits from parallel thinking, and a single agent for everything else.

---

## 3. The team

**Five roles, each with one clear job and a clear list of things it does not do.**

| Role | Who | Does | Does not |
| --- | --- | --- | --- |
| **Operator** | Javaris (a person) | Approves each lane's plan, reads the daily digest, answers escalations, releases work | Approve every merge or pass messages between agents |
| **Backend lead** | Axis | Writes backend tickets, assigns them, merges green work, answers the builder's questions | Write most of the code |
| **Frontend lead** | Zero | The same, for the web app | Write most of the code |
| **Builders** (one per lane) | Backend and frontend builders | Take one ticket per session, write its tests and code, open a pull request | Review their own work |
| **Review team** | Brennan (spec and code), Zane (security only) | One review pass per pull request, at the end of a batch | Block work over small issues |

Two more rules for the team:

- **Model by role.** Leads, hard tickets and security reviews run on the strongest model (Opus). Builders, test writers and re-reviews run on a faster, cheaper model (Sonnet). Anthropic found a lead Opus agent with Sonnet helpers beat a single Opus agent by 90.2% on its research tasks.
- **Helper agents only read.** A builder may start small helper agents to search code or documents. Helpers never change files.

---

## 4. The cycle: how work moves

**Work moves in short, batched cycles instead of reacting to every change.**

"Auto mode" reacted to everything: every edit triggered a new review, and every review waited for the operator. A *cycle* batches the work into five steps:

```
  PLAN  →  BUILD  →  CHECK  →  REVIEW  →  MERGE
 30 min    parallel   automatic  one batch   lead merges
 (operator  sessions  (CI)       per cycle   green work
  approves)
```

1. **Plan (about 30 minutes).** Each lead writes 3 to 6 tickets for the next 2 to 4 hours. The operator approves both lists at once.
2. **Build.** A small script starts each ticket as a fresh, non-interactive agent session with a turn and cost limit. Each session ends by opening a pull request.
3. **Check.** Continuous integration (CI) runs the build, type checks, lint, tests, end-to-end tests and size budgets on every pull request.
4. **Review.** The review team takes all of the cycle's pull requests in one batch.
5. **Merge.** The lead merges anything that is green and has no blocking finding. The operator gets one digest per cycle.

**GitHub is the board.** Tickets are issues, work is pull requests, reports are pull request descriptions, and GitHub Actions runs the checks. This replaced about 3,000 lines of custom coordination scripts.

**Example timing (Step 1 of the backend plus the web shell and sign-in):**

| Wave | Backend lane | Frontend lane |
| --- | --- | --- |
| 1 (all in parallel) | Server shell · encryption for secrets · rate limits and idempotency · sign-in setup | Shell layout · sign-in page against a mock · data client and size check |
| 2 | Wire the middleware and a sample route · mount sign-in | Auth guard; switch sign-in to the real server |
| 3 | The step's "done when" tests | One end-to-end test: sign in and land in the shell |

That is 12 tickets, three waves deep, at about one hour per wave: roughly one working day instead of a week.

---

## 5. Tickets: the unit of work

**A ticket is small enough for one session and clear enough that the agent never has to guess.**

Every ticket uses the same template:

```markdown
## T-B1: Server shell

Lane: backend · Lead: Axis · Model: Sonnet · Depends on: none

### Goal (one sentence a user could see)
The server starts and answers GET /api/health with the contract's shape.

### Files you may change
packages/server/src/app.ts, packages/server/src/platform/**

### Files you must not change
packages/contract/**, packages/db/**

### Acceptance tests (must pass)
- health returns 200 with X-Request-Id and X-Contract-Version
- an unknown route returns the contract's error body

### Done when
CI is green and the acceptance tests pass. Nothing else.
```

Rules for tickets:

- **Size:** about 60 minutes of agent work. If it is bigger, the lead splits it.
- **Files listed:** two tickets running at the same time never share files.
- **Done is defined by tests:** when the tests pass, the ticket is finished. Extra polish is not scheduled.
- **No long specs:** a ticket plus the shared API contract is enough for internal screens.

---

## 6. Sessions: how an agent runs

**One ticket per session, started fresh, with hard limits.**

- **Headless and capped.** Each session runs non-interactively (`claude -p`) with a limit on turns and cost, the same idea as the factory's $4 and 60-minute cap per attempt.
- **No resuming.** When a session ends, it leaves a report. If the ticket isn't done, the next attempt starts fresh from that report, not by reopening the old conversation.
- **Startup routine.** Every session begins the same way: confirm the folder, read the progress file and task list, read the git log, run the tests. Only then does it start work.
- **Agents may tick, not rewrite.** An agent can mark a task as passing in the task list, but it can't edit or delete tasks. Anthropic stores its task list as JSON because models tend to rewrite Markdown.
- **Short context files.** Each package has one AGENTS.md of a page or less: how to build, test and lint, and the rules for that package.
- **Avoid over-ambition.** Anthropic lists trying to do too much in one session as a main failure mode. Small tickets prevent it.

---

## 7. Review: how work is checked

**Review is one clean pass with a stop rule, so it catches real problems without endless polishing.**

1. **The reviewer sees only the change.** It gets the diff and the ticket, not the builder's conversation. Cognition found this avoids shared blind spots and keeps the reviewer's context short.
2. **The builder filters the findings.** The builder checks each finding against the ticket and fixes what is in scope. Without this step, Cognition found review loops tend to run forever or drift out of scope.
3. **Severity decides what blocks:**

   | Severity | Meaning | Blocks the merge? |
   | --- | --- | --- |
   | P0 | Broken, unsafe or loses data | Yes |
   | P1 | Wrong behaviour or a missed requirement | Yes |
   | P2 | Should be better | Only in round 1 |
   | P3 | A nice-to-have | Never; goes to the backlog |

4. **At most two rounds.** After round 2, only a P0 or P1 can block.
5. **Batched, not continuous.** Review happens once per cycle. End-to-end tests run in CI, not as a separate agent review after every edit.
6. **Evidence attached.** Every UI review includes screenshots and a short video recorded by the end-to-end tests, so a decision takes seconds.
7. **Full rigor only where it matters.** Auth, secrets, the integrator, the gates and anything touching money get a written spec, locked tests and a security review. Everything else gets one ticket and one review.

---

## 8. The operator: the human's job

**The operator approves plans and releases, not individual steps.**

- **Approve plans, not merges.** The operator approves each cycle's ticket list. After that, leads merge green work on their own.
- **One queue.** Everything that needs the operator (escalations, budget questions, releases) lands in one prioritised queue, cleared in batches with keyboard shortcuts.
- **A daily digest.** What merged, what is blocked, and what needs a decision.
- **Reasons become rules.** When the operator makes a decision, they give a reason. Reasons that repeat become rules or skills, added through a reviewed pull request. Over time, agents get closer on the first try.

> The goal is fewer corrections per change, not more agents.

---

## 9. Code quality and speed

**Constrain the agents with good structure, then let automatic checks enforce it.**

- **Abstractions plus strict lint rules.** Clear patterns (a data layer, one way to write an API route, one way to handle errors) and lint rules that ban going around them leave agents fewer wrong choices.
- **Boundaries in code.** Import rules stop modules reaching into each other. Each database table has one owning module.
- **Budgets in CI.** Each web route has a size budget (fail over 150 KB of JavaScript, warn over 130 KB). Test time is tracked. A new dependency needs approval.
- **Example: the bundle fix.** The web app's data layer cost 40.6 KB because it shipped the full API schemas. Building the client from a minified copy of the contract brings it to about 14 KB, with every route still available.

---

## 10. Scaling up

**Scale by adding separate areas of work, not by adding writers to the same area.**

- **Add a lane only when the queue is empty.** The operator's attention is the limit. More agents than the operator can review only creates a backlog.
- **Split by file ownership.** Parallel work is safe when tickets own different files. The number of useful builders equals the number of independent areas.
- **Use the contract between lanes.** The frontend builds against a mock of the API contract while the backend implements the same contract, with tests on both sides. Questions about the API are answered by the contract, not by messages.
- **Records write themselves.** The pull request description is the report, and git and CI are the log. Agents don't commit message files.
- **Prepared environments.** Dependencies installed, database running and CI green before a cycle starts. Later, cloud sandboxes (such as MIOSA) can run each session off the laptop.
- **Build the thin slice first.** For a demo, build one thin path through the whole system (sign in, create a mission, run one agent, check it, show a receipt), then thicken each part.

---

## 11. Measuring the system

**Five numbers, checked every cycle, show whether the system is working.**

| Number | What it shows | Target |
| --- | --- | --- |
| Share of commits that change code | How much effort goes into real work | Over 60% (was 15%) |
| Time from ticket to merge | Speed | Under one day |
| Cost per merged pull request | Efficiency | Falling over time |
| Blocking findings per pull request | Ticket clarity | Falling over time; if high, fix the tickets |
| Corrections per change | Whether agents are learning the operator's judgment | Falling over time |

---

## 12. The full improvement checklist

Every change adopted for version 2, grouped by area. Tick each one as it is put in place.

### Team structure
- [ ] 1. One writer per area of files; parallel only across areas that don't touch.
- [ ] 2. Lead splits, builders execute, lead combines; builders file a structured report.
- [ ] 3. Model by role: Opus for leads and hard tickets, Sonnet for builders, test writers and re-reviews.
- [ ] 4. Helper agents only read.

### Sessions
- [ ] 5. One ticket per session, headless, capped; no resuming.
- [ ] 6. Memory in files: task list (JSON), progress file, git log; agents may only tick tasks.
- [ ] 7. Tickets sized to one session; done means the tests pass.
- [ ] 8. One short AGENTS.md per package; no long specs.

### Review
- [ ] 9. The reviewer sees only the diff and the ticket.
- [ ] 10. The builder filters findings against the ticket.
- [ ] 11. P0 and P1 block, at most 2 rounds, P3 to the backlog.
- [ ] 12. Review in batches; end-to-end tests in CI.
- [ ] 13. Screenshots and video attached to UI reviews.

### The operator
- [ ] 14. The operator approves plans, not merges; leads merge green work.
- [ ] 15. One queue and a daily digest, cleared in batches.
- [ ] 16. Decision reasons become rules through reviewed pull requests.

### Code quality and speed
- [ ] 17. Abstractions plus strict lint rules.
- [ ] 18. Budgets in CI: bundle size, test time, new dependencies.
- [ ] 19. Minified contract for the web client.

### Process and scale
- [ ] 20. Records write themselves (pull request descriptions, git, CI).
- [ ] 21. GitHub as the board (issues, pull requests, Actions).
- [ ] 22. Work in progress limited by what the operator can review.
- [ ] 23. Two speeds: full rigor only for auth, secrets, the integrator, the gates and money.
- [ ] 24. A thin slice through the whole system first.
- [ ] 25. A prepared environment before each cycle.
- [ ] 26. Track the five numbers every cycle.

---

## 13. Terms

| Term | Meaning |
| --- | --- |
| **Acceptance test** | A test that proves a ticket's goal is met; when it passes, the ticket is done |
| **Agent** | An AI model working in a loop: it reads, uses tools, changes files and reports back |
| **AGENTS.md** | A short file in each package telling agents how to build, test and follow its rules |
| **Auto mode** | Letting agents run and react to every change on their own; replaced here by cycles |
| **Backlog** | A list of low-priority findings and ideas saved for later |
| **Batch** | A group of items handled together, such as all of a cycle's reviews at once |
| **Builder** | An agent that writes the tests and code for one ticket |
| **CI (continuous integration)** | Automatic checks (build, types, lint, tests) that run on every pull request |
| **Context** | Everything an agent can see at once: its instructions, files read and conversation so far |
| **Context window** | The limit on how much an agent can see at once |
| **Contract** | The shared definition of every API route, which both frontend and backend follow |
| **Cycle** | One round of plan, build, check, review and merge, about 2 to 4 hours |
| **Diff** | The exact lines a change adds and removes |
| **Digest** | A short summary for the operator of what merged, what is blocked and what needs a decision |
| **End-to-end (E2E) test** | A test that uses the app like a person would, through the browser |
| **Escalation** | A question an agent can't answer within its ticket, sent up to its lead or the operator |
| **Finding** | A problem a reviewer reports, with a severity and evidence |
| **Green** | All automatic checks pass |
| **Headless** | Running an agent without an interactive window, started by a script (`claude -p`) |
| **Lane** | One area of work with its own lead and builder, such as backend or frontend |
| **Lead** | An agent that plans tickets for a lane, answers questions and merges green work |
| **Lint** | Automatic rules that check code style and ban risky patterns |
| **Merge** | Adding a finished change to the main branch |
| **Mock** | A fake version of the server that follows the contract, used before the real one exists |
| **Model tier** | The size of model used: a strong model (Opus) or a faster, cheaper one (Sonnet) |
| **Operator** | The one person who runs the factory, approves plans and releases work |
| **Over-ambition** | An agent trying to do too much in one session and running out of context |
| **P0 to P3** | Severity levels for findings, from broken (P0) to nice-to-have (P3) |
| **Progress file** | A file where agents record what's done, so the next session can pick up |
| **Pull request (PR)** | A proposed change, with its description and checks, waiting to be merged |
| **Queue** | The single list where everything needing the operator waits, in priority order |
| **Review team** | The agents that check pull requests: Brennan for spec and code, Zane for security |
| **Session** | One run of an agent from start to finish, on one ticket |
| **Severity** | How serious a finding is (P0 to P3) |
| **Size budget** | The most JavaScript a web route may ship, checked in CI |
| **Thin slice (walking skeleton)** | The simplest working path through the whole system, built before any part is polished |
| **Ticket** | One small, clearly defined task for one session |
| **Token** | A small piece of text a model reads or writes; cost is counted in tokens |
| **Two speeds** | Full rigor for risky areas, a lighter process for everything else |
| **Wave** | A group of tickets with no dependencies on each other, run at the same time |
| **Worktree** | A separate working folder of the same git repository, so agents don't edit each other's files |

---

## 14. Sources

- Cognition, *Multi-Agents: What's Actually Working* (April 2026): https://cognition.com/blog/multi-agents-working
- Cognition, *Don't Build Multi-Agents* (June 2025): https://cognition.ai/blog/dont-build-multi-agents
- Anthropic, *How we built our multi-agent research system*: https://www.anthropic.com/engineering/multi-agent-research-system
- Anthropic, *Effective harnesses for long-running agents* (November 2025): https://anthropic.com/engineering/effective-harnesses-for-long-running-agents
- LowCode Agency, *Claude Code agentic workflows* (headless mode): https://www.lowcode.agency/blog/claude-code-agentic-workflows
- AVEL repository `Avel-org/avel-factory`, main branch, measured November 8–9, 2026.
