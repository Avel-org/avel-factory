# backend/sprint-05: sprint assessment (Build rules M5)

Written by OSA on Nov 21, 2026, from the kit's attempt log (`.git/avel/attempts.jsonl`), the reports and `main`'s history.

**Step 1 is closed.** T-B20 (#89, `0907c5f`) was its last ticket. Javaris closed the step on Nov 21, answering OSA's batch ("Approve"). `docs/steps/step-1-done.md` traces each of Step 1's tests to its locked test, or to the CR that moved it out (CR-31, CR-43). Axis signed it (C5).

## What merged

| Ticket | PR | What |
| --- | --- | --- |
| T-B17 | #76 (`23c5f85`) | The hand-built jobs engine under T-B13's relocked tests, with CR-44's partition key |
| T-B19 | #75 (`ee9bde9`) | Platform follow-ups: the P2s from T-B14, T-B15 and T-B16's reviews |
| T-B18 | #88 (`b7fac15`) | Event consumers: claimed, resumable, compare-and-swap cursors (full rigor; Zero's G7 review) |
| T-B20 | #89 (`0907c5f`) | Step 1's done-when tests and report (full rigor; Zero's G7 review, Axis's C5 sign-off) |

Plan PRs: #70 (plan and render), #73 and #77 (amendments), #80 and #81 (T-B18 notes).

## Attempts

| Dispatch | Attempts |
| --- | --- |
| T-B17 tests, review | 1 each, done |
| T-B17 build | 2: a1 test-dispute, a2 done |
| T-B18 tests | 4: a1 done, a2 and a3 no report (crashes), a4 blocked (5 of 10 proof runs failed on T-B18-07) |
| T-B18 build | 3: a1 and a2 test-dispute, a3 done (after the test fix 058f5d3 and the relock 38b80c1) |
| T-B18 review | 2: a1 no report (crash), a2 done, verdict pass |
| T-B19 tests, build, review | 1 each, done |
| T-B20 tests, build, review | 1 each, done, verdict pass |

- **First-attempt rate:** 9 of 12 dispatches finished on their first attempt.
- **T-B18 was the hard one.** The test fix showed that T-B18-07's failures were the test's own race: both workers could claim the job. They weren't an engine bug.
- **Its 3 crashes predate CR-46.** They left no report, and now they would resume as the same attempt (B2).
- **K2:** T-B18's tests and build ran 4 and 3 times. That was before K2 was enforced (CR-46 B6).

## Review findings carried forward

- **Into sprint-06's T-B27:**
  - t-b18-rigg-01, -03 and -04;
  - t-b18-zero-01;
  - t-b18-rigg-05, its code half;
  - t-b20-rigg-01, row 5's proof into the check;
  - t-b20-rigg-03, T-B8-02 under load.
- **Waiting for CR-49:** t-b18-rigg-02 and t-b18-zero-02, plus t-b18-rigg-05's doc half.
- **Backlog:** t-b20-rigg-02.

## What isn't measured yet

**Cost per merged PR (K3, O) isn't recorded.** Sessions run on a Claude plan, where `limits.json`'s dollar caps are recorded but not enforced. Measuring it from the session transcripts is on OSA's list (Javaris, Nov 21).
