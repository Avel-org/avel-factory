# CR-45: Fewer PRs and shorter waits

Nov 20, 2026 · drafted by OSA at Javaris's request · changes `Build rules.md` sections B, F, G and H, CR-36's conditions, `.github/workflows/ci.yml`, `tools/repo-checks/src/check-locks.ts` and `scripts/agents/merge.py`

**Accepted, all six decisions** (Javaris, Nov 20, to OSA: "i approve all"). Merging this PR accepts it.
Until decision 3's `--standing` lands in `merge.py`, OSA merges under it with `--approved`, quoting these words.

## In short

- **The problem:** the build is 77 PRs in, and Step 1 of 14 is barely done. On Nov 19 and 20, PRs #65 to #77 were 13 PRs. Six of them shipped a ticket: T-B14, T-B15, T-B16, T-F10, T-B17 and T-B19. The other seven were plumbing:
  - a hotfix (#68);
  - a guard fix (#69);
  - the sprint-05 plan (#70);
  - `.env.example` (#72);
  - two plan amendments (#73, #77);
  - a flake fix (#74).

  Each PR costs about 15 minutes of CI. Each merge then waits for `main`'s CI, and for Javaris.
- **The decisions** take out the waiting and keep the safety:
  - tests first;
  - locked tests;
  - a review on every ticket;
  - nothing red on `main`.

Javaris, Nov 20: "its too long becuae we have 80 near prs and barely started with the build".

## Where the time goes (Nov 19 to 20, measured)

| Cost | Size | Where it came from |
| --- | --- | --- |
| Playwright on every PR | about 15 of CI's 15 to 18 minutes | `ci.yml` runs the `e2e` job on every pull request. It ran on all 9 backend PRs, and none of them touched `apps/web` |
| `main`'s CI after each merge | about 15 minutes per merge | `merge.py` waits for `main` to go green before the next merge. Three of those runs were cancelled by the next merge anyway (`6762a09`, `7b7eb39`, `43a5333`) |
| One PR per ticket, tickets chained | about 30 minutes per link, before the next ticket can start | T-B16 waited for T-B14, T-B18 for T-B17, and T-B20 for T-B18 |
| A small gap needs its own PR | 1 PR, 1 re-render and 1 rebuild each | T-B17's stale count in `done-when-2.count.test.ts` (#73): the lock check refuses any commit outside the Territory, and a relock can't add a file. The same happened with T-B18's added behaviour (#77) |
| Waiting for Javaris | minutes to hours, per merge | Every ticket PR. Full rigor needs him by rule (G7, CR-41), standard rigor in practice |

## Decisions

### 1. CI by path

- **What:** in `ci.yml`, the `e2e` job runs only when the PR changes one of these:
  - `apps/web/**`
  - `packages/contract/**`
  - `packages/contract-mock/**`
  - `pnpm-lock.yaml`
  - `.github/workflows/**`

  A small `changes` job decides, using `dorny/paths-filter` or a `git diff` step. On `main`, push runs keep the full suite. The skipped job still reports a success, so H4's required checks don't hang.
- **Why:** about 15 minutes saved on every backend PR. A backend change can't break the web's end-to-end tests unless it changes the contract or the mock, and both are in the list.
- **Touches:** `ci.yml`; Build rules H4, which says the web's checks run when the web, the contract or the mock change.

### 2. One PR per sprint, per lane

- **What:** each sprint has an integration branch, `s/<lane>-sprint-NN`, cut from `main`.
  - Ticket branches are cut from it and merge back into it once their review passes. These are fast, local merges, and the lock check runs on each.
  - When the last ticket is in, one PR takes the sprint branch to `main`, with CI and the sprint's reports.
  - A ticket that depends on another starts from the sprint branch as soon as that ticket has merged into it. There's no wait for `main`.
- **Why:** it takes the 30-minute merge links out of the chain inside a sprint. It also turns 4 to 6 PRs into 1.
- **Risk:** a bad ticket blocks the sprint's PR. Mitigations:
  - the ticket can be reverted on the sprint branch;
  - a ticket that must ship alone can still go straight to `main` as today.
- **Touches:**
  - Build rules B3 to B6 and B8;
  - `scripts/agent.sh`, which cuts ticket branches from the sprint branch;
  - `render.py`, so `depends_on` counts as met once the ticket has merged into the sprint branch;
  - `merge.py`, so it can merge a ticket into the sprint branch;
  - `locks.yml`.

### 3. A standing merge approval

- **What:** OSA merges a ticket's PR (or, with decision 2, the sprint's PR) without asking, when all of these hold:
  - the review's verdict is pass;
  - no finding is P0 or P1;
  - CI is green with no re-runs;
  - the PR is clean against `main`.

  This covers full rigor too: Javaris's standing approval is posted on the PR, with the review's summary. A **hold** label, or a word from Javaris, stops it. Design and guardrail PRs keep CR-41: Javaris approves each one.
- **Why:** waiting for Javaris was the longest stop in each chain. He gave this approval for T-B18 and T-B20 on Nov 20 ("yes i appprove").
- **Touches:** CR-36 conditions 2 and 3; CR-41; Build rules B6 and G7; `merge.py`, which gains `--standing`.

### 4. The lead fixes small gaps on the ticket branch

- **What:** the lead may make one commit on a ticket branch that changes a file outside its Territory. The commit is marked `Lead-fix: <finding or dispute id>` in its message, and the lock check accepts it. It applies when:
  - a test or doc outside every Territory is stale only because of the ticket's accepted change (T-B17's count);
  - a locked test needs a ruled fix (F2).

  The PR lists every lead fix. A test-dispute fix still needs the ruling first.
- **Why:** #73 cost a PR, a re-render and a rebuild for a three-line test change Javaris had already ruled on.
- **Touches:** Build rules F2 and H6; `check-locks.ts`, which accepts a commit whose message carries `Lead-fix:` and whose author is the lead's or OSA's identity.

### 5. Bigger sprints, with two builders when territories don't meet

- **What:** B7 allows two builders per lane, four sessions at most in all, when the running tickets share no file and don't depend on each other. `render.py`'s overlap check already proves the first condition. Sprints plan 3 to 6 tickets.
- **Why:** on Nov 19, T-B13, T-B14 and T-B15 built side by side with no conflicts. T-B17 and T-B19 did the same on Nov 20.
- **Limit:** four sessions fit in WSL's 8 GB cap without the memory trouble of Nov 19. A session that needs Playwright counts as two.
- **Touches:** Build rules B7; `scripts/agents/limits.json` (`per_lane.builder` = 2).

### 6. Don't wait for `main`'s CI between merges

- **What:** `merge.py` merges a list of PRs back to back, and waits for `main`'s CI only after the last one. If `main` goes red, nothing else merges until it's green: the next merge refuses, and so does any later run.
- **Why:** about 15 minutes per merge after the first. The runs in between were usually cancelled by the next merge anyway.
- **Touches:** `merge.py`; Build rules H5, which still holds: nobody merges red, and a red `main` stops the queue.

## What doesn't change

- **Tests come first, and they're locked** (B2, H6).
- **Every ticket is reviewed,** and only a P0 or P1 sends it back (G3, G5).
- **Every check must be green, with no re-runs** (H5).
- **Javaris approves** plans, CRs, design and guardrail PRs, and every ruling.

## Order of work, if accepted

1. **Decisions 1 and 6:** CI and merge tool only, in one kit PR. This is the fastest win and can land first.
2. **Decisions 3 and 5:** rules, `merge.py` and `limits.json`.
3. **Decisions 2 and 4:** the kit and the lock check. Each gets its own tests in `test_merge.py`, `test_render.py` and `tools/repo-checks`.
