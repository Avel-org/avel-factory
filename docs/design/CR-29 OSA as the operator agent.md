# CR-29: OSA as the operator agent (proposed)

Nov 13, 2026 · @javaris · builds on CR-14 (CLI conventions) and CR-17 (agent access), both proposed

Proposed, not yet accepted. Decisions 1 to 3 and 5 below were made on Nov 13; decision 4 (the spend cap) is open. (CR-28 is held for the learning layer, still to be drafted.)

## In short

- **What:** OSA, MIOSA's open-source Optimal System Agent, becomes your operator agent. It runs in your terminal and drives the factory's day-to-day work through the `avel` CLI: watching missions, relaying clients, preparing every decision, chasing follow-ups.
- **The line it never crosses:** OSA prepares decisions; only you take them. A receipt says you approved the plan and you released the commit, and that has to stay true.
- **Why:** it puts the factory's legwork on an agent without touching the factory's core. The scheduler, integrator, gates, rooms and receipts are unchanged. OSA sits outside, where you sit.
- **What it adds:**
  - a fourth kind of caller, `assistant`, on CR-17's route tagging;
  - decision briefs shown on each pending decision;
  - a task bridge from the control room to the terminal;
  - a shared focus between the two screens;
  - a few agent-friendly CLI commands.
- **Not in scope:** OSA inside rooms as a harness. That stays a separate spike, recorded as a CR-22 addendum if it passes.

## 1. The `assistant` caller

- **Its own login.** OSA signs in with `avel login --as assistant`. That's the same device login as the CLI (routes 1 to 3), approved by you in the web app with a password step-up. Its session is stored as a CLI session with `principal_kind = assistant`. It never uses your session, matching CR-14's rule that no agent holds an operator session.
- **Route tagging (CR-17).** Every route is tagged with who may call it. `assistant` is a fourth caller after operator, agent and runner. An untagged route refuses it with `AGENT_NOT_PERMITTED`.
- **What it may and may not do:**

| `assistant` may | `assistant` may not, and gets `AGENT_NOT_PERMITTED` |
| --- | --- |
| Read every operator read route (missions, decisions, receipts, findings, traces, events) | Approve or ask for changes on a checkpoint (40, 41); answer a question (44) |
| Create a mission (20), upload files (36), relay client messages to Canon (34 with `source: relayed`) | Finalize (28), approve a pass (29), release (30), accept a finding (60), override (51, 57) |
| Write decision briefs (section 2), notes (68), time entries (65, 66) | Decide a proposal (54), merge a factory PR (73), send a follow-up (121) |
| Draft follow-ups and template drafts (112) | Any credential action: secrets (45), repo connections (13, 14, 17), CLI login approval (2) |
| Raise and update assistant tasks (section 3) | Cancel a mission (25), pause or resume (23, 24) |

- **The activity log** records `actor_kind = assistant` on everything it does, so you can always tell what OSA did from what you did.
- **The kill switch:** `avel assistant pause` (or a button in Settings) revokes the assistant's session at once. Resuming needs a fresh login.

## 2. Decision briefs

Every pending decision can carry one brief from OSA. You read it, then approve in one tap.

- **What a brief holds:**
  - `ref`, plus the version it was written against: the proposal version, receipt hash, head SHA or draft hash;
  - `summary`: what happened, in plain words;
  - `evidence[]`: lines with links;
  - `recommendation`: a choice or option ID, or "ask the client";
  - `confidence`: high, medium or low;
  - `risk`: what goes wrong if the recommendation is wrong;
  - `reasonDraft`: a reason you can keep or edit, for kinds that need one.
- **Bound to the version.** A brief written against version 4 shows "written for an earlier version" once the item becomes version 5, and OSA rewrites it.
- **Where you see it:** `PendingDecisionDto` gains `brief: DecisionBriefDto | null`. The control room shows it as "Prepared by OSA" above the choices. Your choice and reason still go through the kind's own approve route.
- **Learning from you.** When you decide, the server records whether you followed the recommendation, plus your reason. That's OSA's acceptance rate per decision kind, the quality radar (CR-28) pointed at OSA itself.

## 3. The task bridge: control room to terminal

You can hand OSA work from the control room, including from your phone, without the browser ever touching your terminal.

- **How it works:**
  1. Press "Ask OSA" on any page (a mission, a module, a finding, a decision), or type a request. The control room creates an assistant task with the page you're on as its subject.
  2. OSA is subscribed to the event stream. It picks the task up from `cli.assistant_task.created`, works it in your terminal, and updates it: `queued`, `working`, `done` or `failed`, with a result and links.
  3. The control room shows the task's progress and result where you asked.
- **Why through the server** and not straight from the browser to OSA's local port: it works from your phone, it's logged, it survives a closed laptop, and the browser never needs to reach a local process. Browsers restrict pages that talk to localhost, and an embedded web terminal is a remote shell, which we don't want.
- **The reverse direction:** `avel open <ref>` opens that page in the control room, and every OSA message that needs you carries a link to `/decisions/<ref>`.

## 4. Shared focus

The two screens follow each other instead of showing the same thing.

- **What it is:** one focus per operator: the mission, the module or the decision you're looking at.
- **How it moves:** opening a page in the control room sets it. Running `avel focus M3`, or OSA starting a task, sets it from the terminal.
- **What follows it:** the terminal's `avel` commands default to the focused item, so `avel tail` shows that module's agent steps. The control room can switch to what OSA is working on with "Follow OSA", which is off by default (decision 3).
- **The terminal-attached view.** While a CLI or assistant session is live, `StatusDto` reports `terminal: { attached, lastSeenAt }`. The control room then hides its raw live feeds (agent steps, the event ticker), since the terminal shows those, and gives the space to decisions, the gate strip and proof.

## 5. CLI additions (on top of CR-14)

| Command | What it does |
| --- | --- |
| `avel next` | What needs you, ranked as route 52 ranks it, with OSA's recommendation if there is one |
| `avel brief <ref>` | Everything about one decision: the item, its evidence, the brief and its history |
| `avel brief write <ref>` | Writes or rewrites a brief (assistant) |
| `avel tasks` / `avel task <id> done` | The assistant's task queue |
| `avel focus <ref>` | Sets the shared focus |
| `avel open <ref>` | Opens it in the control room |
| `avel tail` | Agent steps for the focused module or attempt (route 64 with `view=steps`) |
| `avel assistant pause` | The kill switch |
| `avel mcp` | **Unparked:** an MCP server for OSA, with one typed tool per read route and per assistant write. No decision tools exist in it at all |

CR-14 already gives every command `--json`, exit codes and retry-safe writes. OSA always passes `--json`, so the decision not to switch to JSON automatically when piped still stands.

## 6. Contract and schema changes

- **New routes (6):**
  - `PUT /api/decision-briefs/{ref}` (assistant)
  - `POST /api/assistant/tasks` (operator)
  - `GET /api/assistant/tasks?state=` (both)
  - `PATCH /api/assistant/tasks/{taskId}` (assistant: state and result)
  - `PUT /api/operator/focus` (both)
  - `GET /api/operator/focus` (both)
- **Changed:** `PendingDecisionDto` gains `brief`; `StatusDto` gains `terminal`; `cli_sessions` gains `principal_kind` (`operator`, `assistant`); `ActivityLogActorKind` gains `assistant` if it's missing.
- **New tables (3):**
  - `decision_briefs`, with the bound version, superseded once a newer version exists, and never deleted;
  - `assistant_tasks`: subject, request, state, result, timestamps;
  - `operator_focus`: one row per operator.
  All three are owned by the `cli` module.
- **New events (5):** `cli.brief.prepared`, `cli.assistant_task.created`, `cli.assistant_task.changed`, `cli.focus.changed` and `cli.assistant.paused`.
- **Error code:** `AGENT_NOT_PERMITTED` (CR-17's), now also returned to `assistant` callers.
- **Version:** contract 1.1.0 (additions only).

## 7. What OSA costs, and its own model spend

- **OSA itself is free:** it's open source under Apache 2.0 and runs on your machine. You pay only for the model it calls.
- **OSA's model use is your business cost, not client work,** so it never touches mission budgets.
- **Where the model comes from, cheapest first:**
  1. **Your existing Claude or ChatGPT plan:** nothing extra. Plan providers rate-limit third-party tools and change the rules without notice, so keep a paid fallback.
  2. **MIOSA AI on your Developer plan** ($20 a month, which includes $20 of credit, shared with sandbox time). DeepSeek V4.1 Flash costs $0.60 per million input tokens and $2.40 per million output tokens; Kimi K2.6, MIOSA's default and the `optimal` alias, costs $1.90 and $8.00. Kimi K2.7 Code and GLM-5.3 are also listed.
  3. **An API key** (Anthropic, OpenAI, OpenRouter), at list prices.
- **Decided (Nov 13, decision 5):** OSA uses MIOSA AI as its provider: **DeepSeek V4.1 Flash for everyday work** (triage, digests, summaries, tasks) and **Kimi K2.6 for decision briefs**.
- **Estimate** (Nov 13, assumptions, to be replaced by real usage after a month): about 120 briefs, 3,000 events triaged and 100 tasks a month is roughly 16 million input and 1.3 million output tokens.

| Model setup | About a month |
| --- | --- |
| All DeepSeek V4.1 Flash | $13 |
| **Flash for everyday work, Kimi K2.6 for briefs (chosen)** | **$25 to $29** |
| All Kimi K2.6 | $41 |

- **How to keep it there:**
  - Cap it at the provider: a monthly limit on OSA's own key or credit.
  - OSA posts a daily spend line in the morning brief.
  - The $20 plan credit also pays for mission sandboxes, so OSA plus rooms will go past it; the extra bills at the same rates.

## 8. Rollout

1. **Read only.** `avel next`, `avel brief`, digests and the morning brief. Rehearse now against the contract mock and its sample world, before the server exists.
2. **Prepare.** Briefs, drafted answers for Canon, follow-up drafts and the task bridge.
3. **Routine writes.** Notes, uploads, time entries, client relays and new missions.

Decisions never move to OSA at any stage.

## Appendix A: OSA's skill file (`~/.osa/skills/avel/SKILL.md`)

```markdown
# AVEL operator assistant

You help Javaris run AVEL, a one-person software factory. You prepare; he decides.

## Never
- Approve, reject, answer, finalize, release, accept, override, merge, cancel, pause or send.
  If a command would do one of these, stop and write a brief instead.
- Touch secrets, repo connections or logins.
- Send anything to a client. Draft it as a follow-up for his approval.
- Guess. If the evidence doesn't support a recommendation, say "ask Javaris" or "ask the client".

## Always
- Use `avel ... --json` or the `avel` MCP tools. Never scrape human output.
- Bind every brief to the version you read. Rewrite it when the version changes.
- Write plain language: no IDs, hashes or gate numbers in summaries. Put those in evidence.
- Link every message that needs him to `/decisions/<ref>`.
- Log what you did with a note on the mission.

## Models
- Everyday work (triage, digests, summaries, tasks): deepseek-v4.1-flash.
- Decision briefs: kimi-k2.6.

## When to wake him
- Now (stopped): a release or pass waiting more than 2 hours in working hours, an alert of
  severity stopped, a deadline at risk, a budget at 95%, a client message that changes scope.
- Digest (heads up): everything else, batched at 9:00, 13:00 and 17:00 Central.
- Quiet hours 22:00 to 7:00: only isolation failures and dead jobs.

## Glossary
Mission, module, dispatch, attempt, room, gate 0 to 5, receipt (verified, pass, fail),
proposal, Canon, roster: see AVEL's docs. A ref is <kind>:<id>.
```

## Appendix B: event playbooks

| Event | OSA does |
| --- | --- |
| `<owner>.decision.opened` | Writes a brief; wakes you if the kind is release or pass approval, otherwise adds it to the digest |
| `<owner>.decision.returned` | Rewrites the brief and says what changed since your last decision |
| `metering.budget.warned` | Explains what's eating the budget and recommends raising it or parking the part |
| `factory.module.changed` (parked) | Reads the attempts and findings, explains why it stopped, and proposes the next step as a brief |
| `gate.receipt.issued` | Checks the proof files against the receipt (`?verify=1`), then briefs the release |
| `onboarding.question.changed` | Drafts your answer from what the client said, with sources; you send it |
| `onboarding.message.created` (relayed) | Checks the relay is attributed to the right person |
| `missions.mission.changed` (deadline at risk) | Says how late it will be and what would recover it |
| `system.alert.raised` | Wakes you only for severity stopped; otherwise adds it to the digest |
| `cli.assistant_task.created` | Picks up the task, works it, and reports back on the task |

## Appendix C: the control room and the terminal, each with its own job

| Job | Control room | Terminal (you and OSA) |
| --- | --- | --- |
| **Deciding** | Where you sign: every approval, bound to the version you saw | Shows what's waiting (`avel next`) and links to it; you can also sign here, OSA can't |
| **Seeing the state** | The picture: gate strips, the onboarding journey, the plan graph, the pipeline | Text summaries on request |
| **Proof** | Receipts with the browser checking the hashes, previews, diffs, screenshots | `avel receipt --verify` for scripts |
| **What's happening now** | Hidden while a terminal is attached | The live flow: agent steps, logs, the event stream, OSA's own work |
| **Talking** | Canon's interview with you (voice, the question deck) | OSA: ask anything, hand it work |
| **Doing** | One-off actions, and from your phone | Bulk and scripted work, local repo work, `avel check`, building AVEL itself |
| **Away from the desk** | Phone: decisions, alerts, "Ask OSA" | Nothing. OSA keeps working and reports to the control room |

## Touches

- **Docs:**
  - CR-14 (unparks `avel mcp`, adds the commands in section 5);
  - CR-17 (adds the `assistant` caller);
  - Design Main (Live view, the CLI commands table, the `cli` module);
  - the Frontend Map ("Prepared by OSA", "Ask OSA", Follow OSA, the terminal-attached view);
  - Backend modules and build plan (the `cli` module's new tables).
- **Contract:** 6 routes, 2 DTO fields, 5 events, version 1.1.0.
- **Database:** 3 tables, 1 column, 1 value.
- **Build order:** Step 5 (Events and the CLI) for the CLI, MCP and bridge; Step 11 for the control room's parts. Stage 1 of the rollout can start now against the mock.

## Decisions

1. **Signing from the CLI:** decided Nov 13. Both the control room and the CLI (CR-14's `avel approve`) for you; never for OSA. The route tags enforce it.
2. **Wake-up rules and quiet hours:** decided Nov 13, as written in Appendix A.
3. **"Follow OSA" in the control room:** decided Nov 13. Off by default.
4. **OSA's monthly model spend cap:** open. Recommended: $30 a month, revisited after the first month of real usage.
5. **OSA's models:** decided Nov 13. MIOSA AI as the provider; DeepSeek V4.1 Flash for everyday work, Kimi K2.6 for decision briefs.
