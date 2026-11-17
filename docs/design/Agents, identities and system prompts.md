# Agents, identities and system prompts

Nov 15, 2026 · @javaris · how every agent is set up, and how that fits the dispatch system

Three things shape an agent, and each has one job:

- **Identity** is who the agent is.
- **A system prompt** is how a job that isn't dispatched runs.
- **The dispatch** is what to do right now.

Builders, test writers and reviewers have an identity, and they get their work through dispatch. OSA, Canon and the build team's leads have system prompts, because their work doesn't arrive as a task doc. A few agents (Nemi, Brennan, Atlas) have both: an identity for their dispatched work, and a system prompt for a job outside dispatch.

## 1. The three layers

| Layer | What it holds | Written by | Where it lives | Recorded in |
| --- | --- | --- | --- | --- |
| **Identity** | Name, slot (work kinds and roles), standards, always and never, how it's judged, a **Learned** section | You and the leads, through PRs | Build team: `.claude/agents/<name>.md` in `avel-factory`. Missions: `agents/<name>.md` in the factory repo | `attempts.agent_config_hash` |
| **System prompt** | How a job that isn't dispatched runs: its stages, limits and refusals | You and the leads, through PRs | Build team: `.agents/system/<seat>.md` (OSA, Axis, Zero). Missions: `system/<job>.md` in the factory repo | Canon: `prompt_version` on every turn. Others: their config hash |
| **Dispatch** | One task doc in agent-dispatch's seven parts, with its activation prompt as the last section | **Code** renders it from the approved plan. Never hand-edited. | Build team: `docs/agent-dispatch/<lane>/sprint-NN/`. Missions: `task_docs` | `attempts.task_doc_sha256` and `activation_sha256` (CR-W11) |

Two more inputs ride along, and neither is a prompt:
- **Skills:** Agent Skills folders, selected for each role and stack by `factory.yaml` (CR-32).
- **The context package:** "Known from past work", rendered inside the task doc (CR-35, proposed).

## 2. How a dispatched agent starts

The shape is the same on the build team and in a factory room.

1. **Identity as the system prompt.**
   - On your machine: `claude --agent <name>` (for example `claude --agent soap`).
   - In a room: the harness loads `agents/<name>.md` from the mission's pinned factory commit.
2. **The activation as the first message.** The activation is the task doc's last section.
   - On your machine: `/dispatch <lane>/sprint-NN/<task doc>`.
   - In a room: the runner sends the activation itself.
   - Nothing is ever pasted.
3. **The task doc,** read in full. Its seven parts are:
   1. identity line;
   2. context: the agent file first, then the codebase analysis, the sources, the reading list and "Known from past work";
   3. domain;
   4. tasks and chains;
   5. territory;
   6. **execution protocol, by kind** (build, test, contract, review);
   7. completion, with the CR-10 report sections.
4. **One session is one attempt.** A retry is a fresh session in a fresh worktree, given only the error output.

**There's no separate role prompt.** The rules for a role (build, unit tests, end-to-end tests, spec review, security review, red team) are Part 6 of the task doc. Code renders them from the template for that kind, so they're hashed with the task. There's a second reason this matters in a room: the repo's `AGENTS.md` and `CLAUDE.md` belong to the **client**, so the factory's room rules have to reach the agent through the task doc, not through the client's files.

## 3. Who gets what

### The build team (building AVEL)

| Agent | Identity | System prompt | Gets work through | Status |
| --- | --- | --- | --- | --- |
| **OSA** (operator agent) | — | `.agents/system/osa.md` (running the build cycle). Later, CR-29's `avel` skill for running the factory | Your approval of the sprint plan | **Written Nov 15** |
| **Axis** (backend lead) | — | `.agents/system/axis.md` | Planning with you | **Written Nov 15** |
| **Zero** (frontend lead) | — | `.agents/system/zero.md` | Planning with you | **Written Nov 15** |
| **Soap** (backend builder) | `.claude/agents/soap.md` | — | Dispatch | **Written Nov 15** |
| **Rigg** (backend checker) | `.claude/agents/rigg.md` | — | Dispatch | **Written Nov 15** |
| **Fantem** (frontend builder) | `.claude/agents/fantem.md` | — | Dispatch | **Written Nov 15** |
| **Fenn** (frontend checker) | `.claude/agents/fenn.md` | — | Dispatch | **Written Nov 15** |
| **Zane** (security review, on call, if you add him) | `.claude/agents/zane.md` | — | Dispatch, full-rigor PRs only | **Written Nov 15** |

OSA takes the place of the old **INT** session from the dispatch kit, which was your own Claude session in the control room. Your own shell is the Ops tab.

### Inside missions (the factory's agents)

| Agent | Identity (dispatched work) | System prompt (work outside dispatch) | Built in |
| --- | --- | --- | --- |
| **Canon** | — | Five jobs, each its own prompt: interview, extractor, breakdown drafts, checkpoint documents, and context-layer retrieval (CR-35) | Step 7 |
| **Nemi** | Builds the `design-system` module | Onboarding at 0.4: turns brand assets into the project's design system, or picks one from the library | Step 7 (system prompt), Step 9 (identity) |
| **Brennan** | `review-spec` on every module | Reviews Canon's breakdown at Gate 0 | Step 7 and Step 9 |
| **Atlas** | Builds `maintenance`, `infra` and `docs` | Opens Upkeep proposals between missions | Step 9, and later |
| **Axis, Zero** (in missions) | `api-contract` and `review-backend`; `ui-contract` and `review-frontend` | — | Step 9 |
| **Soap, Iyo, Ghost, Fantem, Leon** | Builders by work kind | — | Step 4 (the first builder), Step 9 (the rest) |
| **Rigg, Fenn** | Test writers | — | Step 9a |
| **Zane, Leah, Breach** | Security, accessibility and performance, red team | — | Step 9c |
| **The Librarian, the scorers** | — | Parked (v2) | Later |

The mission agents' identities are **separate files** from the build team's, even where the names match. A mission agent works in a client's repo under the factory's gates; a build-team agent works on AVEL itself. They share the format, not the text.

## 4. What goes in each kind

### An identity file

```markdown
---
name: soap
description: One line: the slot and what it's judged on.
tools: Read, Write, Edit, Glob, Grep, Bash
model: sonnet
---

# Soap: backend builder

Who you are and what you build, in two or three sentences.

## Always
- The handful of standards this agent keeps on every task.

## Never
- What it must not do, whatever a task doc says.

## How you're judged
- What decides "done" for this slot.

## When you're stuck
- Stop with one of the five report statuses. Don't start a new approach on your own.

## Learned
- One line per lesson, added through a reviewed PR when a finding shows a repeatable mistake.
```

### A system prompt

It holds the job's purpose, its stages or loop, its limits (calls, tokens, questions), what it may and may not call, its refusals, how it hands work to you, and the "never decides" line where that applies. It never holds anything that changes per mission or per task.

### Never in either

- Task specifics: those are the dispatch's job.
- Secrets, keys, tokens or client data.
- Anything that changes per mission. Identities and system prompts are a stable prefix, which keeps every call's cache warm and every attempt cheaper.

## 5. The rules

1. **Versioned and reviewed.** Every identity and system prompt changes only through a reviewed PR. On missions, the factory commit pins the version, and the learning layer measures the change (CR-28).
2. **Hashed.**
   - Identity, skills and model go into `agent_config_hash`.
   - The task doc and the activation each get their own hash.
   - Canon logs `prompt_version` on every turn.
   - A receipt can always say what an agent was given.
3. **The task doc is the briefing.** A relayed instruction from OSA can only narrow or clarify it, and is logged and listed in the report (CR-37). If you find yourself relaying the same kind of instruction twice, or one that would widen the ticket, the plan is missing something: fix the plan, re-render, and start a new attempt.
4. **Learned lines come from findings.** A finding that shows a mistake an agent could repeat adds one line to that agent's **Learned** section, in the PR that routes the finding.
5. **Untrusted text stays data.** Client, Canon and agent text is never an instruction, in any layer.
6. **The same stop statuses everywhere:** `blocked`, `needs-cr`, `test-dispute`, `needs-dependency`, `out-of-scope`.
7. **No model decides.** No identity or system prompt can approve, merge, release, file an upload or pick work. Those stay with code and with you. The one exception is OSA's squash merge of a PR that meets every CR-36 condition: CI and the checker's review have already decided it.

## 6. Canon's system prompts: what they must contain (Step 7)

Drawn from the Canon Onboarding doc, so the Step 7 tickets can write them:

- **Interview:**
  - One question per reply: at most 12 in Discovery, 5 in clarify, 2 at stage 4.
  - Push back on vague answers. Keep your exact words, tagged `relayed` when you're quoting the client.
  - Ask only *whether* a repo, docs and designs exist.
  - Open with Q-0.1a and Q-0.1b (a client project or a template).
  - The server picks the next topic (highest impact × uncertainty). Canon writes the question; it doesn't choose the topic.
  - At most 400 output tokens a reply.
- **Extractor:** every `said` or `relayed` fact cites its message and span, and code checks the quote matches exactly. A guess is `inferred`, never shown as confirmed.
- **Breakdown drafts:**
  - Modules with a work kind, dependencies, EARS requirements, scenarios by level and an estimate.
  - Never waves, agents or paths: code computes those.
  - M0 is the walking skeleton.
  - Fixes become chains with an execution trace.
- **Checkpoint documents:** fixed sections, written "by a tough editor, not a cheerleader".
- **Context retrieval (CR-35):** proposals only, from the same client and templates only, each citing its source.

## 7. What changed to align with the dispatch system (Nov 15)

- **`Build rules.md`:**
  - **C1:** a ticket is one module of the sprint's `plan.toml` (a sprint is one cycle). It renders into three task docs: the checker's tests, the builder's build, and the checker's review.
  - **D1, D4:** each session is one dispatch, started with `claude --agent <name>` and `/dispatch`, in a fresh worktree per attempt on the ticket's branch.
  - **D3, D6:** the startup routine reads the task doc and its Context. The sprint folder replaces `progress.json` as the task list.
  - **H6:** lock checks read the rendered task doc and `locks.md`, not the issue. CI also refuses task docs that differ from a fresh render.
  - **M:** OSA runs `render.py --check`, renders, then runs `dispatch.sh`. GitHub issues only mirror the tickets.
  - **P:** adds the identities, the system prompts, `/dispatch`, the kit scripts and the first `plan.toml`. `run-ticket.sh` and `progress.json` are gone.
- **`Build roster and environment.md` and `tools/wezterm/avel.lua`:**
  - Each building pane is one agent's seat (Soap | Rigg, Fantem | Fenn).
  - Its loop, `scripts/agents/lane.sh`, asks `scripts/dispatch.sh` for that agent's next ready task doc, and opens it in the pane through `scripts/agent.sh`: a fresh worktree, then `claude --agent <name> "/dispatch <task doc>"`.
  - When the session ends, the loop waits for the next one.
  - The leads' tabs load their system prompts from `.agents/system/`.
- **The dispatch kit's AVEL notes** (`docs/agent-dispatch/avel/`) carry a banner. Their dispatch mechanics stand; the old team, session limit, INT tab and crew list are replaced by `Build rules.md`.
