# CR-50: Cheaper sessions and a stronger kit

Nov 21, 2026 · drafted by OSA at Javaris's request · changes `Build rules.md` sections B, D, G and H, CR-36's merge conditions, `scripts/render.py`, `scripts/agents/merge.py`, `scripts/agents/kit.py`, `scripts/hooks/push_guard.py`, `tools/repo-checks/src/check-locks.ts` and `.github/`

**Proposed, not accepted.** Javaris accepts, changes or declines each decision. Code lands only after acceptance, with its doc edits (I2).

## Where this comes from

Javaris approved four cost improvements on Nov 21 ("I agree with the 4 improvements"):

- Two are already in (#96): cost per merged ticket from the transcripts, and full-rigor reviews on Sonnet.
- Fewer retries is partly in, through CR-46 and #91. Its effect shows in the digests.
- This CR carries the two that need design: decisions 1 and 2.

The rest comes from the same day's independent reviews (the kit and the pitch), where the fixes were too big for a small PR: decisions 3 to 6.

**The measured baseline** (`scripts/agents/cost.py`, list API prices, every attempt to Nov 21):

| What | Measured |
| --- | --- |
| All attempts | 143 attempts, $170.99 |
| Merged tickets | 26; median $3.71, mean $5.41, every attempt counted |
| Where the money goes | Cache writes 40%, cache reads 31%, output 28% |
| By model | Opus 76% ($130), Sonnet 24% ($41) |
| Retries | 54 attempts beyond the first, across 89 dispatches |

## Decisions

### 1. Smaller session start-up

- **What:**
  1. `cost.py` adds the cost of each session's first model calls, the context it loads before doing any work. Measured over one sprint.
  2. Then trim what every session loads, in this order:
     - a task doc's repeated standing sections (the stop statuses, the message rules and the report format), which the identity file already carries;
     - the Context list, so it names only what the ticket reads;
     - AGENTS.md (107 lines) and the identity files, where they say the same thing twice.
  3. The goal is a measured drop in cache-write cost per session, with the same done rate.
- **Why:** 40% of spend is 1-hour cache writes, mostly a session loading its context. A typical build task doc is about 16 KB (T-B27's).
- **Touches:** render.py's task-doc template (a new renderer version, so old packages keep theirs), AGENTS.md, `.claude/agents/*.md`, and `cost.py`.
- **Risk:** a session that misses a rule it used to read. The rules stay in one place each, the identity file; nothing is deleted outright.

### 2. Fewer sessions per ticket, without losing independence

- **What:** keep the three roles, because tests-first, locked tests and an independent review are the safety. But batch the sessions:
  - **One tests session per chain:** the checker writes the tests for every ticket of a chain (CR-45 decision 5) in one session. The lead locks each ticket as before.
  - **One review session per cycle per lane,** the batch AGENTS.md already describes, which no kit code enforces today. It runs on every PR that is ready.
  - Builds stay one per ticket, because their Territory and lock are per ticket.
- **Why:** each session pays its own start-up. A six-ticket sprint today is 18 sessions. Batched, it's 6 builds, about 2 tests sessions and about 2 review sessions.
- **Touches:**
  - Build rules B2 to B5 and D1;
  - render.py: a chain-level tests doc and a cycle-level review doc;
  - `agent.sh`, `lane.sh`;
  - check-locks.ts, which must accept one tests commit covering several tickets' paths.
- **Not proposed:** one session per feature that writes its own tests and builds them. That would end the independence the locked tests exist for.
- **Risk:** a bigger session hits its limit (CR-46 B1: 360 minutes, 400 turns) on a long chain. So a chain longer than 3 tickets splits.

### 3. A real standing approval, pinned to what was reviewed

- **What:**
  - `merge.py --standing`. It waives only condition 2 (rigor), and only for a ticket PR whose review passed with no P0 or P1, plus the G7 second review for full rigor. It never waives 3 (the review) or 7 (guardrails).
  - The review report records the commit it reviewed. `merge.py` refuses a PR whose head moved since, except by a clean merge of main.
  - Review reports and findings are posted to the PR as a comment when the session ends, so they don't live only in `.git/avel` on one laptop.
- **Why:** today a CR-45 standing merge runs through `--approved`, which also waives the review and guardrail conditions. The classifier rightly refused that for T-B18. And nothing ties a verdict to the commit that was reviewed.
- **Touches:** CR-36's conditions, CR-45 decision 3, `merge.py`, `agent.sh`'s finish step, and Build rules B6 and G7.

### 4. One identity per agent

- **What:** separate GitHub accounts, or one GitHub App with per-agent commit identities, for the leads, the builders and the checkers. Commits and pushes carry who made them.
- **Why:**
  - All recent commits share one identity. So "the lead wrote the lock line" (D6) and "the lead's fix" (CR-45 decision 4) can't be checked.
  - CODEOWNERS can't require a review from someone other than the author.
  - CR-46 B3's pushes use the machine's sign-in.
- **Touches:** Build roster (keys), `.github/CODEOWNERS`, branch protection, check-locks.ts (an author check on lock commits), and the push guard.
- **Needs:** Javaris to create the accounts or the App. Their tokens live outside the repo, in each seat's key file.

### 5. No dispatch writes a lock line

- **What:** the push guard, which already runs on every Bash call in a dispatch, also refuses an Edit, Write or commit of a sprint's `locks.md` from a dispatched session. `render.py`'s lock state checks that a lock line's commit is on the ticket's branch and that its paths are the ticket's test paths.
- **Why:** check-locks skips a commit that touches only `locks.md`, so a builder could write its own relock line and unfreeze its tests. A malformed or stale lock line can also start a build that only fails in CI.
- **Touches:** `push_guard.py` (or a new hook beside it), `render.py`'s `lock_state`, Build rules D6 and H6.
- **Size:** small. It could go in a kit PR right after acceptance.

### 6. MIOSA for the build team's sessions

- **What:** a MIOSA mode for `agent.sh`:
  - one `avel-build` sandbox per dispatch, started from the `avel-factory-image` snapshot;
  - `--always-on` (MIOSA pauses a session that is only waiting on the model, as tested Nov 20);
  - the branch cloned from GitHub and pushed back (CR-46 B3).

  The laptop runs only the control room, OSA and the leads.
- **Why:** it removes the 7 GB ceiling and the single-laptop failure. Tested Nov 20: a sandbox from the image ran the full suite in 49 s, against 92 to 98 s on the laptop.
- **Open before building:**
  - The start from the image took over 3 minutes and wasn't timed. It must be measured.
  - Where the model key comes from: MIOSA secrets, or its Claude connection (an "agent connection", off in `avel-build` today).
  - The cost per sandbox hour.
- **Touches:** `agent.sh`, `lane.sh`, the Build roster, the MIOSA plan, and the B7 limits (no longer memory-bound).

## What Javaris decides

1. Decision 1: accept the measure-then-trim plan.
2. Decision 2: accept batched tests and review sessions, keeping the three roles.
3. Decision 3: accept `--standing`, the reviewed-commit pin and reviews posted to the PR.
4. Decision 4: accept per-agent identities, and choose accounts or a GitHub App.
5. Decision 5: accept the lock-line guard.
6. Decision 6: accept MIOSA mode, after the three open points are measured.

OSA's recommendation:
- **Accept 1, 3 and 5 now.** They're cheap, measurable, and close real gaps.
- **Accept 2** after one sprint on the new kit gives a clean baseline.
- **4 and 6** each need a setup step from Javaris, so they come when he's ready.
