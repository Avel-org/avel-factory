# CR-23: Canon requires a complete build kit (proposed)

Nov 9, 2026 · @javaris

Proposed, not yet accepted.

- **What:** before a build mission can finalize, Canon must hold every document a production full-stack app needs: frontend, backend, database, specs, and worked examples of the conventions. Templates supply the defaults; the client supplies only what differs.
- **Why:**
  - Agents build what the docs say. Gaps at intake become guesses in code and findings at review.
  - The research points both ways. Spec Kit and Kiro require a spec, design and tasks before building. An ETH Zurich study found auto-generated context files lowered agent success and raised cost over 20%, while hand-written ones helped a little. So the kit must be complete, but each task doc carries only the slices it needs (CR-10 already does this).
- **Builds on what exists:** the schema already has a readiness result at 0.4 (`rubric_results` by `check_id`) and `readiness_waivers` (your decision to go ahead on a partial result, with a reason). Each kit item becomes one readiness check. **No new table.**
- **Touches:**
  - Canon doc: checkpoint 0.4 sections, the rubric, the context stage, the build spec.
  - Design doc Main: Gate 1's preconditions; templates.
  - Contract: the readiness check IDs (defined in code, like the other check IDs).
  - Tables: none new. `codebase_analysis.standing_context = 'generated'` gets a review rule. `plan_modules.reference_paths` becomes required for build work kinds.

## The kit (one readiness check per item)

| Area | Item | Default source |
| --- | --- | --- |
| Product | Brief, users, core flows, no-gos, acceptance examples | Checkpoint 0.1 (exists) |
| Specs | EARS requirements, scenarios by level | Checkpoint 0.2 (exists) |
| Frontend | Screen list and flows | Canon draft |
| | Design tokens or design system | Template, or the client's (`design_systems`) |
| | States per screen: loading, empty, error, ready | Canon draft (Zero's UI contract checks it, CR-9) |
| | Accessibility and performance targets | `factory.yaml` package defaults |
| Backend | API contract | Canon draft, then Axis's contract |
| | Auth model and roles | Canon draft |
| | Error catalog | Template |
| | Integrations and background jobs | Canon draft |
| Database | Schema with constraints and delete rules | Canon draft |
| | Migrations and seed data | Template |
| Production | Environments and deploy target | Client |
| | Security, logging and monitoring | Template |
| Conventions | One worked example per layer: a route end to end (DTO mapper, typed error, test), a component with its states and test, a migration with its test | Template |
| | Lint, format and architecture rules that enforce them | Template |

Each item is satisfied by a `context_refs` row (an upload, a design or a repo path) or by the template at its pinned commit.

## The rules

1. **Checkpoint 0.4 can't be approved while a required kit check fails,** unless a `readiness_waivers` row covers it. The waiver's reason is printed on the receipt.
2. **Which items are required depends on the package.** Feature and Custom need all of them. Stabilize and Upkeep need only the items for the code they touch. Diagnostic and Landing page get short lists in `factory.yaml`.
3. **Worked examples are code, not prose.** Each build module's `reference_paths` must point at one, and Gate 1 refuses a build dispatch whose reference path doesn't exist at the pinned commit.
4. **Generated standing context needs your review.** If `codebase_analysis.standing_context` is `generated`, it stays short (commands, structure, non-obvious rules) and is shown at 0.4 for you to approve.
5. **Task docs stay small.** The kit is mission-level. Each task doc carries only the slices its module needs, as CR-10 already says.

## Tests ("done when")

- Approving 0.4 with a failing required kit check and no waiver returns 422 naming the failing checks.
- A waived kit check appears on the receipt with its reason.
- Gate 1 refuses a build dispatch whose `reference_paths` doesn't exist at the pinned commit.
- A template mission starts with its template's kit checks already passing.

## Your decisions

- [ ] Accept CR-23.
- [ ] Confirm the per-package required lists.
- [ ] Is a waiver allowed on Feature missions, or only on Custom?
