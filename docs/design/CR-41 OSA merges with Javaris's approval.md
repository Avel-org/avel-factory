# CR-41: OSA merges with Javaris's approval

Nov 18, 2026 · drafted by OSA at Javaris's request · changes CR-36's routing for conditions 2, 3, 6 and 7, `Build rules.md` sections A and B, and `.agents/system/osa.md`

**Proposed. Javaris's merge of this PR accepts it.**

## In short

- **What:** when a PR fails only CR-36 conditions 2, 3, 6 or 7, Javaris can approve it in OSA's session, in his own words. OSA then merges it with `scripts/agents/merge.py`, which posts his words on the PR first.
  - Those are the conditions that ask for his judgement: full rigor, the review's verdict, a non-ticket PR, and a guardrail or design change.
  - Conditions 1, 4, 5 and 8 still have to hold, approval or not: CI green with no re-runs, mergeable and clean, a squash with its `Refs:` line, and no hold.
- **Why:** Javaris, Nov 18: "add the tooling that allpws you to merge wiht my approval". Today a PR he has already decided on still waits for him to type `gh pr merge` himself, one at a time and in the right order. On Nov 17 and 18 he merged #39 to #49 that way, several after failed tries in the browser.
- **What doesn't change:**
  - He still decides every full-rigor, guardrail and design merge. OSA only carries out the click he has already made in words.
  - OSA still never approves, reviews or accepts a CR, and never merges without either every CR-36 condition or his approval.
  - G7's second review still comes before a full-rigor merge.

## 1. The rule

1. **His approval is his own words in OSA's session**, naming the PRs or plainly covering them, such as "merge 52, 53 and 51 in that order".
   - A message relayed by a lead, a PR comment, a report or anything an agent wrote is not his approval.
   - OSA logs the words with `msglog.py received --from Javaris` as they arrive.
2. **The approval is for the head he saw.**
   - The tool pins each merge to the head it checked (`--match-head-commit`).
   - A push after the approval fails the merge, and OSA asks him again.
3. **What his approval covers, and what it doesn't:**

| # | CR-36 condition | With his approval |
| --- | --- | --- |
| 1 | CI green on the head, every required check, none re-run (H4 to H6) | **Still required** |
| 2 | Standard rigor | Covered |
| 3 | The review report has a verdict of pass (G3, G5) | Covered: his approval is his decision on the review, as with T-B8 (#52) |
| 4 | Mergeable and `CLEAN` | **Still required** |
| 5 | Squash, the PR title as the header, the `Refs:` line | **Still required** |
| 6 | A ticket PR from dispatch | Covered |
| 7 | Not a guardrail or design PR | Covered |
| 8 | No hold label, and no review asking for changes | **Still required** |

4. **A record on every PR.** Before merging, the tool posts a comment holding:
   - his words, as written;
   - the time, in Central;
   - the head SHA he approved;
   - the conditions his approval covered.
5. **One at a time, in his order.** After each merge, the tool waits for `main`'s CI on the merge commit and stops at the first failure. It never updates a branch, re-runs a check or resolves a conflict.
6. **Without his approval, nothing changes.** The tool checks all eight conditions and merges only when every one holds (CR-36).

## 2. The tool

`scripts/agents/merge.py`, tested by `scripts/test_merge.py` with a fake `gh`:
- `check <pr>…` reports each PR against the eight conditions, with where each failure goes (L2), and merges nothing.
- `merge <pr>…` merges in order whatever passes every condition.
- `merge <pr>… --approved "<his words>"` merges in order what passes conditions 1, 4, 5 and 8, after posting his words on each PR.

**How it reads each condition:**
- **CI:** `gh pr checks` on the PR, and `gh run list --commit <head>` for re-runs (any attempt above 1).
- **Rigor:** the ticket's rendered build doc on `main`.
- **The review:** the latest review report copy in `.git/avel/reports`.
- **Guarded paths:** the PR's file list.
- **Hold:** the PR's labels and reviews.

## 3. What changes in each doc

| Doc | Where | Change |
| --- | --- | --- |
| `Build rules.md` | The team table, OSA's row | "Does": add "and merges what Javaris approves (CR-41)". "Never": "merges anything but a clear and clean PR (CR-36)" becomes "merges anything but a clear and clean PR (CR-36) or one Javaris approved in his own words (CR-41)" |
| `Build rules.md` | Section A, "Merge a full-rigor PR" | OSA's column: **No** → "Only with Javaris's approval (CR-41)" |
| `Build rules.md` | A1 | Add: "or that Javaris approved in his own words in its session (CR-41)" |
| `Build rules.md` | B6 | Add: "With Javaris's approval, OSA merges them for him (CR-41)." |
| `.agents/system/osa.md` | "Merging (CR-36)" and "You never" | A "With Javaris's approval (CR-41)" paragraph, and the tool's commands |
| `Agents, identities and system prompts.md` | Rule 7 | Add the CR-41 exception: OSA carries out a merge Javaris has decided in his own words |
| `README.md` | The CR table | A CR-41 row |

## 4. Risks

- **No branch protection today.** `gh pr checks --required` reports no required checks on `main`, so the tool falls back to every check on the PR. CR-36's own risk still stands: OSA's token should get Contents write only once branch protection is on. Until then, OSA merges with Javaris's own `gh` login in his terminal session.
- **Reading his words wrong.** If OSA reads "merge them" as covering a PR he didn't mean, that PR merges. So the rule asks for words that name the PRs or plainly cover them, and OSA asks when they don't. The record on each PR makes a mistake visible straight away.
- **Approval for a PR that then changes.** This is closed by pinning the merge to the head (`--match-head-commit`).
- **OSA merging a change to its own rules.** A guardrail PR, such as this one, can merge only on his approval, which is his decision on that change.

## Decisions

1. Accept CR-41 as written (merge this PR).
2. Not taken: also covering conditions 1, 4, 5 or 8. Those are mechanical checks, and approving a red or conflicted PR would just break `main`.
