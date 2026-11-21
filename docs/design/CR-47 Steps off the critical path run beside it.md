# CR-47: Steps off the critical path run beside it

Nov 21, 2026 · drafted by Axis for Javaris · **accepted Nov 21 by Javaris, via OSA** ("approve 1 to 3 with your recommendations"). He approved its effect for backend sprint-06 earlier the same day (decision 1: chain B beside Step 2). This CR makes that the rule, so it isn't asked again each sprint. No contract or schema change.

- **What:** E9 follows the build plan's dependencies instead of a single file of steps.
  - **Today:** "E9. Step order is the build order. Step 1 runs in the order `AGENTS.md` gives: spike 1 first, the DBOS test (spike 2) before the jobs engine. No ticket from a later step starts until the current step closes."
  - **Proposed:** "E9. The critical path runs in order; other steps run beside it once their inputs exist.
    1. The critical path (`Backend modules and build plan.md`, section 1: 0 → 1 → 2 → 4 → 8 → 9a → 9b) runs one step at a time. No critical-path ticket starts until the step before it closes.
    2. Steps 3, 5, 6 and 7 are off the path. Each may start once the steps section 1 names as its inputs have closed: Step 3 needs 1, Step 5 needs 1, Step 6 needs 1, and Step 7 needs 2 and 6. A ticket from one of them names its step, and the sprint's plan says which inputs it uses. A ticket whose code uses none of its step's unclosed inputs may start sooner if the plan says so. For example, sprint-06's T-B25 saves and reads mission drafts, Step 7's first rows, without the model proxy or plans. Section 1 names no inputs for Steps 10 to 14, so they follow 9b in order.
    3. A part of a later critical-path step may be brought into the current one only when the current step's work can't be right without it (for example Step 8's per-request reservation inside Step 2's model proxy, so no request is ever metered without its ceiling). The plan names it, and Javaris approves it with the plan.
    4. Step 1 runs in the order `AGENTS.md` gives."
- **Why:**
  - **The design already says it.** Section 1: "Step 3 needs only Step 1, and Steps 5, 6 and 7 can be built in parallel once their inputs exist." E9 as written is stricter than the plan it implements, so every sprint that uses section 1's parallelism needs a one-off ruling.
  - **The first mission needs it.** The frontend's first-mission screens read routes from Steps 5 and 7 (status, Decisions, missions, live streams). Under today's E9 they wait for Step 4 to close, months of the critical path, while the screens run on the mock.
  - **Two builders per lane** (CR-45 decision 5) only pay off when two chains exist that share no file. Off-path steps are where the second chain comes from.
  - **The critical path stays strict.** Rule 1 keeps the order that matters for safety: rooms before the runner, budgets before the scheduler.
- **Not changed:** B1 (Javaris approves each sprint's plan), B8, C4 and C5 (each step's done-when tests). A step still closes only when its done-when tests pass. An off-path step's tickets don't close it early.

## Touches

| Doc | Change |
| --- | --- |
| `Build rules.md`, E9 | Replaced with the text above |
| `AGENTS.md`, How to work | "Follow the 14-step build order, one step at a time." becomes "Follow the build order: the critical path one step at a time, other steps beside it once their inputs exist (Build rules E9)." |
| `scripts/render.py` | None needed. Its plans already name a step per sprint. A ticket's own step goes in its `refs`, as sprint-06 does |

**Owner:** Javaris (the Build rules). **Where it lands:** with this CR: `Build rules.md` E9 and `AGENTS.md` are edited in the same PR.

## If it's rejected

E9 stays as written, and each sprint that runs an off-path step asks Javaris for a one-off exception, as sprint-06's decision 1 did.
