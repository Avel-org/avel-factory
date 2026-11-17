# CR-28: The learning layer: lessons, proof and the quality radar (proposed)

Nov 14, 2026 · @javaris · lands with the skills step (Step 12), after Step 10's receipts · the web side is CR-W24

Proposed, not yet accepted. You chose this layer on Nov 13 ("memory that learns" and "quality radar"). It adds no model to the control path: every number and every verdict is computed by code.

- **What:** make the factory's learning a record you can audit, like a receipt. Each **lesson** is tracked from the mission that taught it, to the factory change it became, to a measured verdict. The **quality radar** shows how each agent, role, skill and model performs over time.
- **Why:** the design already labels every attempt with its factory commit and says results are compared by factory change. Closeout already collects lesson candidates (`closeout_items`). Nothing ties a lesson to its change and its effect, so there's no proof the factory improves.
- **Builds on:** `closeout_items`, `findings`, `attempts` (`factory_commit`, `agent_config_hash`, `outcome`), `module_runs` (`ladder_step`, `fix_rounds`, `rework_tries`, `review_rounds`, `budget_micros`, `spent_micros`), `gate_evaluations`, `overrides`, `checkpoints`, `human_time`, `skill_loads`, `factory_versions`, `skills`, `rules`, `kb_entries`, `agent_configs`, `eval_runs` and `eval_results`.
- **Depends on:**
  - CR-24's **finding signatures**: needed to tell when the same problem comes back. This CR takes that part of CR-24 as a prerequisite.
  - CR-25's **lesson-to-PR draft route**: `POST /api/closeout-items/{itemId}/drafts`.
  - CR-29's `decision_briefs`, only for OSA's acceptance rate.

## 1. A lesson's life

| State | Meaning | Set by |
| --- | --- | --- |
| `observed` | Raised from a closeout item or a repeated finding | You, at closeout |
| `written` | Drafted as a factory-repo PR: a rule, skill, knowledge entry, prompt or config change | The draft route |
| `merged` | The PR merged; the lesson has a factory commit | The webhook (the merge) |
| `measuring` | Missions finalized on that commit or later are running | Code |
| `helped`, `no_effect`, `regressed`, `confounded` | The verdict, once enough work has run | Code, by the rule in section 3 |
| `retired` | The change was reverted or the lesson dropped | You |

Lessons never merge themselves. Every change is still a factory-repo PR you approve, as the design says.

## 2. New records

| Table | Columns | Rules |
| --- | --- | --- |
| `lessons` | `closeout_item_id?` → `closeout_items`, `origin_mission_id` → `missions`, `title`, `summary` (plain text), `target_kind` (`rule`, `skill`, `knowledge`, `prompt`, `config`), `scope` (`work_kind?`, `role?`, `stack?`, `client_id?`), `finding_signature?`, `pr_number?`, `factory_commit?` → `factory_versions`, `state` | A lesson in `merged` or later has a `factory_commit`; never deleted, `retired` instead |
| `lesson_verdicts` | `lesson_id` → `lessons`, `verdict`, `metric`, `before` and `after` (count and value), `window`, `metrics_version`, `snapshot_sha256`, `eval_run_id?` → `eval_runs`, `decided_at` | Immutable. A new verdict is a new row; the latest one wins |
| `learning_snapshots` | `period` (a week), `factory_commit`, `work_kind`, `role`, `stack`, `metrics` (jsonb), `metrics_version`, `sha256` | Immutable. Written by a nightly job; the charts read only these |
| `findings.signature` | From CR-24 | Indexed |

Client memory needs no new table: it's the existing `client` layer of `kb_entries`, released in `kb_releases` and pinned per mission through `agent_configs.kb_release`. The Learning screen reads it.

## 3. The metrics and the verdict rule

**The metrics** are defined once in code (`METRICS_VERSION` 1), the same way gate checks are:

| Metric | Computed from |
| --- | --- |
| First-try pass rate | Module runs that landed with `ladder_step` 0, out of those that landed |
| Attempts per landed module | `attempts` ÷ landed `module_runs` |
| Blocking findings per module | Confirmed findings routed to rework, ÷ module runs |
| Repeat findings | Findings whose signature matches a lesson merged before the finding's attempt commit |
| Your corrections per mission | Overrides + checkpoint change requests + rejected decisions |
| **Guard:** Gate 5 verified rate | Receipts with verdict `verified`, out of all receipts |
| **Guard:** reviewer findings per module | Confirmed findings with source `review`, ÷ module runs |
| Your minutes per mission | Confirmed `human_time` |
| AI cost against its cap | `spent_micros` ÷ `budget_micros`, as a percent. Never dollars on the web (CR-W20) |
| OSA brief acceptance | Accepted ÷ shown `decision_briefs` (CR-29) |

**The verdict rule** is code, with thresholds in `factory.yaml`:
1. Compare work in the lesson's scope (same work kind, role and stack) from missions finalized **before** its commit against missions finalized **on or after** it.
2. Below the minimum count on either side (default: 5 module runs), the lesson stays `measuring`.
3. **`confounded`** if anything else changed in the same scope during the window: another lesson's commit, a model snapshot, or an agent config change (read from `agent_configs` and `factory_versions`). A confounded lesson can't be credited, and its verdict names what else changed.
4. Otherwise, `helped` if the lesson's metric improves past the threshold **and neither guard measure (Gate 5 verified rate, reviewer findings) worsens past its own threshold**. If the metric improves but a guard worsens, the verdict is `regressed` and names the guard, so a rise in first-try passes from easier tests can't count as a win.
5. `regressed` if the lesson's metric worsens past the threshold, and `no_effect` otherwise.
6. Until evals run, a verdict says "associated with" in its plain text. **Once evals are on, every merged lesson gets a targeted eval run proposed automatically**, within the monthly eval budget (CR-W16). Only an eval confirms a cause: the verdict then links `eval_run_id` and says "confirmed by eval".
7. Each verdict stores `snapshot_sha256`, the hash of the snapshot rows it used, so anyone can recompute it.

## 4. Routes (numbered when accepted)

| Route | What it does |
| --- | --- |
| `GET /api/learning/curve?metric=&workKind=&role=&stack=&from=` | Points per week, with the merged factory changes as markers |
| `GET /api/lessons?state=&targetKind=` | The lessons ledger |
| `GET /api/lessons/{lessonId}` | One lesson: evidence, PR, before and after, its verdicts |
| `POST /api/closeout-items/{itemId}/lessons` | Raise a lesson from a closeout item (idempotent) |
| `PATCH /api/lessons/{lessonId}` | Retire a lesson, with a reason, bound to `rowVersion` |
| `GET /api/learning/radar?groupBy=agent\|role\|skill\|model` | The quality radar, with trends and drift flags |
| `GET /api/missions/{missionId}/learning` | The lessons this mission raised, and the lessons its factory commit carried |

None needs a step-up. No output carries money, and lesson and evidence text is plain text, never HTML.

**Events:** `learning.lesson.changed`, `learning.verdict.recorded`, `learning.snapshot.recorded`. A drift alert is a `system.alert` with its own key.

## 5. What doesn't change

- The receipt and its hash. "Lessons applied" is read from the receipt's factory commit, not stored in it.
- How skills, rules and knowledge reach agents.
- The rule that no model picks agents or work, and that agents never write skills, rules or knowledge.

## Tests ("done when")

- A lesson can't reach `merged` without a factory commit, and can't be deleted.
- A verdict with fewer than the minimum module runs on either side isn't recorded; the lesson stays `measuring`.
- Recomputing a verdict from its snapshot rows gives the same `snapshot_sha256` and the same verdict.
- A finding with the signature of a merged lesson counts as a repeat; one from before the merge doesn't.
- Two lessons in the same scope merged inside one window both get `confounded`, naming each other.
- A lesson whose first-try pass rate improves while the Gate 5 verified rate falls past its threshold gets `regressed`, naming the guard.
- With evals on, merging a lesson proposes one targeted eval run, and only a verdict linked to a finished run says "confirmed by eval".
- No learning output schema has a money field other than AI cost as a percent (the existing no-money test covers the new DTOs).
- Reverting a lesson's PR leaves the lesson `retired` with its verdicts kept.

## Touches

- **Design Main:** Measurement and receipts, Skills, Knowledge, Agent evaluation; a `learning` part of the `evals` module (or a 21st module, your call).
- **DATABASE.md:** the three tables and `findings.signature`.
- **Contract:** seven routes, their DTOs and three event kinds.
- **The web:** CR-W24.

## Your decisions

- [ ] Accept CR-28.
- [ ] Take CR-24's finding signatures as part of this CR.
- [ ] `learning` inside `evals`, or its own module.
- [ ] Default thresholds: at least 5 module runs a side; "helped" at a 10-point improvement in first-try pass rate; a guard fails at a 5-point drop in the Gate 5 verified rate or a 25% rise in reviewer findings per module.
