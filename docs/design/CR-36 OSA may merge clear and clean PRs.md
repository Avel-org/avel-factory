# CR-36: OSA may merge clear and clean PRs (accepted)

Nov 16, 2026 · drafted by Axis for @javaris · changes `Build rules.md` v3 sections A, B and M, and CR-29's "OSA never merges"

**Accepted Nov 16 by the operator.**

## In short

- **What:** OSA may squash-merge a PR to `main` when every condition in section 1 holds. Any PR that fails even one condition stays with a lead or with Javaris, as today.
- **Why:** Javaris: "i dont want bottlenecks if the merge is clear and clean osa can do it." Today a green, reviewed, standard PR waits for a lead to get to it (B6). The merge decision has already been made by CI (H4, H5) and the checker's review (G3), so a second session adds a wait but no judgement.
- **What doesn't change:** full rigor stays with Javaris (C4, G7, CODEOWNERS). The leads keep their merge rights. OSA still never approves, reviews, accepts a CR, closes a step or pushes anything but the merge itself.

## 1. The conditions: every one must hold

| # | Condition | How OSA checks it |
| --- | --- | --- |
| 1 | **CI is green** on the PR's head: every required check (H4), including the lock check (H6). No check was re-run to get a green (H5). | `gh pr checks`: all pass, and each check has exactly one run on that head SHA |
| 2 | **Standard rigor.** The ticket isn't full rigor and the PR touches no CODEOWNERS path. | The task doc's `rigor: standard`, and GitHub reports no code-owner review is required |
| 3 | **No open P0 or P1** from the checker's review dispatch, and the review's report has a verdict. Round-2 rules apply (G5). | The review dispatch's completion report: status `done`, no P0 or P1 open |
| 4 | **No conflicts, up to date with `main`.** | `gh pr view --json mergeable,mergeStateStatus`: `MERGEABLE` and `CLEAN` |
| 5 | **A squash merge with the PR title as the header and a `Refs:` line** for the ticket and any CR (H1 to H3). | OSA writes the message from the PR title and the ticket ID; commitlint already passed on the title (H4) |
| 6 | **A ticket PR from dispatch:** a `t/<id>-<slug>` branch whose task docs `render.py --verify` accepts. | The lock check (H6) already does this |
| 7 | **Not a guardrail or design PR:** no `contract` or `schema` label (I3 needs Zero's sign-off and an accepted CR); no change to `pnpm-lock.yaml` (E5); no change to `.github/**`, `.claude/**`, `.agents/**`, `scripts/agents/**`, the kit scripts, `docs/design/**` or `AGENTS.md`. An agent's lines in `.agents/memory/<agent>.md` don't count (CR-46 B4). | The PR's file list |
| 8 | **Nobody has asked to hold it:** no "hold" label, and no open review comment from a lead or Javaris. | `gh pr view` |

If any condition fails, OSA doesn't merge. It routes the PR: to the lane's lead (conditions 1, 3, 4, 6 and 8) or to Javaris as a decision (2, 7). It never tries to make a condition pass, for example by updating the branch, re-running CI or resolving a conflict.

**Why condition 7 is wider than Javaris's list.** OSA would otherwise be able to merge a change to the rules it runs under (its own system prompt, the lock check, CODEOWNERS), or a new dependency, which E5 reserves for Javaris. Those PRs are rare and cheap to hand to a lead. Javaris may drop any part of condition 7 when he accepts this.

**One ticket at a time.** As for the leads (B6), OSA merges one PR, waits for `main`'s CI to go green, then takes the next.

## 2. What changes in each doc

| Doc | Where | Change |
| --- | --- | --- |
| `Build rules.md` | The team table, OSA's row | "Does": add "merges clear and clean PRs (CR-36)". "Never": "Approves, merges, …" becomes "Approves, merges anything but a clear and clean PR (CR-36), …" |
| `Build rules.md` | Section A, the "Merge to `main`" row | OSA's column: **No** → "**Yes**, only when every CR-36 condition holds" |
| `Build rules.md` | Section A, "Merge a full-rigor PR" | Unchanged: OSA **No** |
| `Build rules.md` | A1 | "OSA has no merge rights, no write access to `main`" becomes: "OSA merges only a PR that meets every CR-36 condition, by squash merge, and has no other write access to `main`. It still has no approve button anywhere." |
| `Build rules.md` | B6 | Add: "OSA may merge a PR instead of the lead when every CR-36 condition holds." |
| `Build rules.md` | M, step 4 | Add: "merges each PR that meets every CR-36 condition, one at a time, and routes the rest (L2)." Step 5's digest lists what OSA merged, separately from what the leads merged. |
| `Build rules.md` | N, the Ticket row | "Who says so": "The lead, or OSA under CR-36 (Javaris for full rigor)" |
| `.agents/system/osa.md` | "You never" | "Approve, merge, release, …" becomes "Approve, release, …", plus a new section "Merging (CR-36)" listing section 1's conditions and the routing rule |
| `.agents/system/axis.md`, `zero.md` | "During the cycle" | Add: OSA may merge clear and clean PRs (CR-36); the lead merges what OSA routes to it |
| `Agents, identities and system prompts.md` | Rule 7, "No model decides" | Add: "except OSA's squash merge of a PR that meets every CR-36 condition: CI and the checker's review have already decided it" |
| `Build roster and environment.md` | Tab 1's row ("Never: pushes, merges") and the OSA GitHub token row | OSA's token today has **no Contents write**, so it can't merge (A1). It needs Contents write and Pull requests write. Branch protection then makes merging the only way that token reaches `main`: required checks, linear history, code-owner review on full-rigor paths, and no direct pushes for anyone. |
| CR-29 | The "OSA never …" lines, section 1 (route 73) | **No change.** CR-29 is about the factory product's `assistant` caller merging a factory PR on a mission (route 73). This CR is only about building AVEL itself. |
| `README.md` | The CR table | A CR-36 row: Proposed |

## 3. Risks

- **The checks are only as good as CI.** A weak test lets a bad PR through without anyone looking. That's already true for a lead's merge under B6, and G3 and the reviewer still stand between the build and `main`.
- **A stronger OSA token.** Contents write is a bigger key than "issues only". Branch protection is what makes it safe: without it, the token could push to `main`. **Don't turn on OSA merging until branch protection is on** (H1); until the repo exists, there is nothing to merge anyway (H7).
- **OSA reading a report wrong.** OSA reads condition 3 from a file it doesn't write. If the review report is missing or doesn't parse, the condition fails and the PR goes to the lead.

## Decisions

1. **Accepted Nov 16:** CR-36 as written, with conditions 7 and 8.
2. Not taken: condition 7 narrowed to the original list.
3. **Accepted Nov 16:** OSA's GitHub token gets Contents write and Pull requests write once branch protection is on.
