# AVEL roster

Nov 1–2, 2026 · @javaris

Who fills every slot in the factory. Accepted in CR-7 to CR-11 (`claude/Change requests.md`); it goes into the factory repo as the roster file in Step 0. Each mission pins the roster it was approved with at 0.3. A visual explainer of this roster is published as the "AVEL Agent Roster" artifact.

## Rules every slot follows
- **Code assigns agents, never a model.** Canon labels each module's work kind; code looks up the agent for (dispatch role, work kind).
- **No work grades itself.** Leads and reviewers never build. Test writers never build. Builders never write the tests that grade their module.
- **Contracts come first.** Nemi's design system, Zero's UI contract and Axis's API contract are locked before the builds that use them. Additive changes need the lead and Brennan; breaking changes come to you.
- **Every finding cites evidence,** and it's fixed only when a regression check passes.
- **Every agent is a setup:** a vendor and model, role skills, a prompt and an effort level. Claude first; Codex and local models later (CR-5).

## Parallel work
An agent is a setup, not a worker with one desk: one agent can staff several dispatches at once, each in its own room. What limits parallel work:
1. **Slots:** up to 6 dispatches at once, set in `factory.yaml` and bounded by room capacity. Ready work beyond that waits, ordered by dependency depth, then module ref.
2. **Dependencies:** a module starts as soon as every module it depends on has landed.
3. **Locks:** a build waits for its locked tests and its locked contract.
4. **Territories:** modules running at the same time never share files (Gate 1).
5. **Integration is serial:** one integration commit is tested at a time per mission.

Contract-first adds parallelism: Ghost builds against Axis's locked contract with the API stubbed, so it doesn't wait for Soap.

## Models (decided Nov 2)

| Tier | Agents |
| --- | --- |
| Opus, high effort | The builders: Nemi's module builds, Fantem, Leon, Ghost, Soap, Iyo, Atlas |
| Opus | Canon's breakdown drafts, Brennan, Zero, Axis (a contract or spec mistake costs every module built on it) |
| Sonnet | Canon's interview, Nemi's onboarding work, Leah, Zane, Fenn, Rigg, Breach |

- A typical builder attempt is about $2 on Opus (Cost control), inside the $4 attempt cap (CR-11).
- **Later: open-weight coding models** (for example DeepSeek or Kimi) through the CR-5 adapter, hosted or self-hosted. An agent switches only when the live numbers show it matching or beating its current model on the same work: first-attempt pass rate, findings per module, and cost.
- Revisit every tier once real missions are metered.

## Factory agents

| Agent | Job |
| --- | --- |
| Canon | Gate 0 onboarding: interviews you, drafts checkpoints 0.1 to 0.4 |
| Nemi | The design library, and each project's design system. Runs at onboarding (0.4) and builds the design system as the first module of each mission. |
| Atlas | Maintenance. Builds `maintenance`, `infra` and `docs` modules, and between missions opens Upkeep proposals for delivered client repos. |

Parked: Clerk, Herald, the Librarian, Quoter (see Parked ideas in the change requests).

## Frontend

| Agent | Slot |
| --- | --- |
| Zero | FE lead: `ui-contract`, `review-frontend` |
| Fantem | Builds `frontend-components` (shared components) |
| Leon | Builds `frontend` (pages, screens, route-local components) |
| Ghost | Builds `frontend-data` (API client, fetching, caching, state) |

## Backend

| Agent | Slot |
| --- | --- |
| Axis | BE lead: `api-contract`, `review-backend` (including Atlas's `maintenance` and `infra` modules) |
| Soap | Builds `api` and `data` |
| Iyo | Builds `services` and `ai` |

## Reviewers

| Agent | Slot |
| --- | --- |
| Brennan | `review-spec` on every module; checks Zero's and Axis's contracts; rules on test disputes |
| Zane | `review-security` (OWASP ASVS); dependencies in audits |
| Leah | `review-a11y-perf`: accessibility, and performance across frontend and backend. Budgets: WCAG 2.2 AA and Google's "good" Core Web Vitals, per package. |

## Testing

| Agent | Slot |
| --- | --- |
| Fenn | `test-unit` and `test-e2e` on frontend modules; component snapshots; the exploratory pass at Gate 4. Chromium gates every module; Firefox and WebKit at Gate 4; phone, tablet and desktop sizes. |
| Rigg | `test-unit` on backend modules; integration, load and pinning tests; the tests-and-coverage audit area |
| Breach | `red-team`: attacks the running app, once per mission at Gate 4 and on modules with a security trigger |

## Slot map

**Builders by work kind**

| Work kind | Agent |
| --- | --- |
| `design-system` | Nemi |
| `frontend-components` | Fantem |
| `frontend` | Leon |
| `frontend-data` | Ghost |
| `api`, `data` | Soap |
| `services`, `ai` | Iyo |
| `maintenance`, `infra`, `docs` | Atlas |
| `audit` (Diagnostic) | By area: spec → Brennan, security and dependencies → Zane, accessibility and performance → Leah, tests and coverage → Rigg |

**Dispatch roles**

| Role | Agent |
| --- | --- |
| `ui-contract`, `review-frontend` | Zero |
| `api-contract`, `review-backend` | Axis |
| `test-unit` | Fenn on frontend work kinds; Rigg on backend work kinds |
| `test-e2e` | Fenn |
| `review-spec` | Brennan |
| `review-security` | Zane |
| `review-a11y-perf` | Leah |
| `red-team` | Breach |

## Disputes

| Findings from | Ruled on by |
| --- | --- |
| Brennan | Zane |
| Zane | Brennan |
| Zero, Axis, Leah | Brennan |
| Breach | Zane |
| Locked tests | Brennan (acceptance-test changes need you) |
