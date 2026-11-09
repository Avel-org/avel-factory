# Agent operating procedures

Approved by Int, 2026-11-08. These are the rules for running the roster in Claude Code until the factory runs itself. They copy the factory's own design (caps, the retry ladder, a green branch), so the habits carry over. Where this file and an older doc disagree, this file wins.

## Why

By 2026-11-08, `main` had 374 commits, and only 58 of them changed code in `apps/` or `packages/`. 73 were merges, and the rest were records, messages, reports and locks. The approval page's UI contract grew to 95 KB through five review rounds, the fourth of which failed on P3s alone, and that cost about a quarter of the spend before any page code existed. Reviews cost more than builds. Most of the 132 messages went through INT, and each one got its own commit. Finished dispatch tabs and worktrees stayed open until someone cleaned them up by hand.

## 1. Main stays green

- Nothing merges into `main` unless `pnpm build`, `typecheck`, `lint` and `test` pass on the merged tree. `scripts/merge.sh` runs all four and aborts the merge if one fails, so nothing is committed. Turn on branch protection with CI required on GitHub too.
- A PARTIAL build is never merged. It waits on its branch until its dependency lands.
- Fail-first tests reach `main` marked `test.fails(...)` (or in a `pending/` folder that CI skips) until their build lands. The merge that lands the build is the one that flips them. The lock hash covers the file either way.

## 2. Reviews have a stop rule

- Severity decides what blocks. P0 and P1 block. P2 blocks only in round 1. P3 never blocks: it goes into the sprint's `backlog.md`.
- An artifact gets at most 2 review rounds. After round 2, only a P0 or P1 can block. Everything else is merged and logged.
- A spec (a UI contract, an API slice) is reviewed once before the build. The build and its locked tests find the rest, and fixes go into the build's review.

## 3. Specs have a size budget

- Aim to keep one page's UI contract under 15 KB. Past that, split it by screen, or cut detail the tests already pin.
- Done means the done-when tests pass. Polish that no test or budget asks for isn't scheduled.

## 4. Sessions have caps (the same as the factory's)

- One session per attempt, capped at $4 or 60 minutes, whichever comes first. At the cap, the session commits what's done, writes its completion report (PARTIAL if unfinished) and ends. The next step is the retry ladder, never a resume. `scripts/hooks/session.py` enforces this: it tells the session at the cap, logs `session.over_cap`, and the dashboard shows the session under NEEDS YOU.
- No resume loops. A dispatch session that has been idle for 10 minutes is ended, not resumed. The dashboard flags it. A new attempt starts from the last report.
- The model goes by role (`scripts/agent.sh`):
  - **Opus:** builders on hard modules, the security review (Zane), and a contract's first spec review.
  - **Sonnet:** test writers (Fenn, Rigg), doc reviews (Leah), frontend kit work (Fantem), the red team (Breach), and every re-review (a review at attempt 2 or later).

## 5. Work-in-progress limit

- At most 3 dispatches run at once, until merges keep up. `scripts/agent.sh` refuses a fourth.
- Nothing new starts while a module is ready to merge and waiting on INT. `scripts/agent.sh` refuses until it's merged. `AVEL_FORCE=1` overrides, on Int's word only.
- Finish before starting: a module is merged and green before its sprint opens new work.

## 6. Bookkeeping stays out of the commit log

- Messages, events and session costs are appended to their files and committed once per merge, inside the merge commit (`scripts/merge.sh`), not one commit per message.
- When a module merges, every worktree from its attempts (builds, tests and reviews) is removed (`scripts/merge.sh`). A worktree with uncommitted changes is kept and named for Int to decide. The branches stay until the sprint closes, and then they're deleted.
- Agents answer each other directly (`scripts/tell.sh <agent>`) for questions inside their territory. INT gets only decisions, escalations and merge requests.

## 7. Performance budgets are CI checks, not review findings

- CI runs a size check per route. It fails above 150 KB of gzipped initial JavaScript on Decisions and Release, and warns above 130 KB. The Frontend Map already calls for a bundle-boundary build check.
- The framework floor (React 19 with TanStack Router, Query and Start) is about 100 KB, which leaves about 45 KB for all app code on a 150 KB route.
- The open fix for `/`'s load: build the client link from a minified contract (oRPC's `minifyContractRouter`: every route in about 14 KB, types from `import type`), and decide through a CR-W entry whether the client-side parse (`parsePendingPage`, `ErrorBody.safeParse`, about 31 KB of Zod) stays. The server already validates every output. Measured on 2026-11-08 (main at `61d37ca`): about 123 KB with the minified link and no client parse, and about 154 KB with the parse kept.
