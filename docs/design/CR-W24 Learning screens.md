# CR-W24: The Learning screens (proposed)

Nov 14, 2026 · @javaris · for the frontend session · reads CR-28's routes

Proposed, not yet accepted. Build against `contract-mock` behind a flag until CR-28's routes are in the contract.

- **What:** a Learning section in the control room (the nav slot CR-W23 reserved), plus small additions to six existing screens, so the factory's lessons and improvements are visible and provable.
- **The rule for every screen:** the proof is a chain you can click through. Each number opens the missions and findings behind it; each lesson shows what it was, what it became and what happened after. Regressions show as plainly as wins.

## The Learning section

| Screen | What it shows | Reads |
| --- | --- | --- |
| **Learning curve** | One line per metric by week: first-try pass rate, attempts per module, blocking findings, repeat findings, your corrections, your minutes, AI cost as % of cap, and the two guards (Gate 5 verified rate, reviewer findings), always shown beside first-try pass rate. Every merged factory change is a marker on the line; hovering shows the PR and its lessons | `GET /api/learning/curve` |
| **Lessons** | A ledger: title, scope, target (rule, skill, knowledge, prompt, config), state (observed → written → merged → measuring → verdict), the verdict badge (helped, no effect, regressed, confounded, measuring) and its sample size | `GET /api/lessons` |
| **Lesson** | The story: the evidence that started it, the PR, before and after on the same work kind, role and stack, the guard measures beside the main one, what else changed if the verdict is confounded, every verdict with its snapshot hash, "associated with" or "confirmed by eval", and its eval run if any | `GET /api/lessons/{lessonId}` |
| **Agents** | The quality radar per agent, role, skill or model: pass rate, retries, findings, cost against cap, trend arrows, drift flags, OSA's brief acceptance | `GET /api/learning/radar` |
| **Changes** | Each factory change with its measured effect and, for skills, its results against the baseline | `GET /api/factory/versions`, route 115 |
| **Client memory** | What the factory remembers about each client: entries, citations, versions, which version each mission used | The `kb-entries` routes |

## Additions to existing screens

| Screen | Addition |
| --- | --- |
| Mission closeout and receipt | "What we learned" (lessons raised) and "Lessons applied" (lessons in its factory commit), from `GET /api/missions/{missionId}/learning`. The receipt itself doesn't change |
| Module page | A chip on an attempt that loaded a skill or rule born from a lesson: "from lesson L-12" |
| Findings | A "repeat" badge when the finding's signature matches a merged lesson |
| Library | Each skill and rule shows its origin lesson and its latest verdict |
| Home | A small "learning this week" card: lessons merged, verdicts recorded, the biggest change in first-try pass rate |
| Closeout | "Raise a lesson" on a closeout item (`POST /api/closeout-items/{itemId}/lessons`) |

## States and live updates

- Every region handles loading, empty, error and ready. "Measuring" and "not enough data" are their own states, never a blank or a zero.
- Live updates come from `learning.lesson.changed`, `learning.verdict.recorded` and `learning.snapshot.recorded` on the one event stream. No polling.
- With TanStack DB (CR-W23), lessons are a collection keyed by ID and the ledger and the lesson page are live queries.

## Rules that don't bend

- No money: cost is a percent of its cap.
- Lesson, evidence and finding text is plain text, never HTML.
- No password step-up anywhere in this section.
- Charts label their sample size, and a verdict says "associated with" until an eval confirms it.

## Done when

- The curve shows a factory-change marker and a before/after difference from `contract-mock` data.
- A lesson page shows a `regressed` verdict as plainly as a `helped` one.
- A lesson with too little data shows "measuring" with its counts.
- A `confounded` lesson names the other changes in its window, and a `regressed` verdict caused by a guard names the guard.
- No `$` amount renders in the section (the existing check covers it).
