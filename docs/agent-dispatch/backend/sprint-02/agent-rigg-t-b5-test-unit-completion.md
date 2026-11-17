status: done
ticket: T-B5

# T-B5 tests: completion report (Rigg)

## Pre-flight
Run on the start commit (5c135fe) plus my one new test file. No Postgres was needed: these tests drive the lock check against scratch git repos.

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 (after `biome format --write` on my file) |
| `pnpm test` | exit 1: 7 failed (all in `locks-merges.test.ts`), 923 passed. Expected: the tests are written before the build |
| `pnpm --filter @avel/repo-checks test` | exit 1: only the 7 new tests fail |
| the combined line | stops at `pnpm test` for the same reason |

## Failing first
`pnpm --filter @avel/repo-checks exec vitest run test/locks-merges.test.ts` on the start commit: 7 failed (7). The check is unchanged, so this is the start state.

1. T-B5-01, evil merge changes the locked test: `expected +0 to be 1`. The check skips merges (`--no-merges`) and passes.
2. T-B5-02, evil merge changes a file outside the Territory: `expected +0 to be 1`. Same cause.
3. T-B5-03, merge of main passes: the output is `lock check failed: ... outside the Territory` for main's own commit, because `rev-list lock..HEAD` includes main's commits.
4. T-B5-04, build doc by branch: `lock check failed: no T-B2 line in docs/agent-dispatch/backend/sprint-00/locks.md`. The first file with the ticket's name wins.
5. T-B5-05, relock passes: `packages/server/test/shell.test.ts: locked by T-B2 (commit 50369f8)`. The checker's fix is flagged and the relock line is ignored.
6. T-B5-06: `expected output not to contain '8f8ae4f'`. The checker's fix before the relock is named too.
7. T-B5-07: `expected output to contain 'locks.md'`. The fewer-paths relock is not recognised, so locks.md isn't named.

## What changed
- `tools/repo-checks/test/locks-merges.test.ts` (new): seven tests, one per task, using helpers.ts and scratch repos run through the real `check-locks` script (the T-B0 interface).
- This report.

## Contract to files
- T-B5-01/02: an evil merge, made with `merge --no-ff --no-commit` and then a changed file, must name the file.
- T-B5-03: a plain merge of main that brings in main's own commits (including a Territory-external file) passes.
- T-B5-04: a decoy doc with the same file name in `backend/sprint-00`, with a different `branch:`, must not be picked.
- T-B5-05: a relock is honoured when the line has the same paths or more, the commit is locks.md-only, and the sha descends from the first lock.
- T-B5-06: after the relock, a builder commit on the locked file fails and names the builder's commit but not the checker's. A builder commit outside the Territory before the relock still fails and names that file, not the locked test.
- T-B5-07: the relock line with fewer paths, the non-descendant sha (a sibling commit) and the mixed commit each fail and name locks.md.

## Deviations
None.

## Limitations
- T-B5-07's mixed-commit case (a relock plus another file in one commit) already names locks.md today, as "outside the Territory", because locks.md isn't in the Territory. That sub-case alone would pass on the start commit. The test as a whole still fails first, on the fewer-paths and non-descendant sub-cases. I didn't add a wording check for "relock": the doc fixes no message. The build should reject that commit as a relock, and the reviewer should check it does.
- T-B5-06 asserts that the output contains the builder commit's 7-character sha, which relies on T-B0's existing `(commit <sha7>)` message format.
- The T-B5-04 decoy sits in sprint-00, which sorts before sprint-01. A decoy that sorts after is already handled by first match, so I didn't add one.
- CI can't tell who added a relock line (F2). The reviewer checks that.
- The sprint-01 findings t-b0-rigg-02 and t-b0-rigg-03 aren't in the repo. I worked from the lead's notes in the task doc.

## Messages received
None.

## Lock line
`- T-B5: tools/repo-checks/test/locks-merges.test.ts @ <the commit that holds this report; the lead fills in the branch tip>`
