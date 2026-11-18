status: done
ticket: T-B7

# T-B7 · tests · Rigg: completion report

## Pre-flight
Run on the start commit 8326a7b plus my one new test file, with my own Postgres (`scripts/pg-local.sh start`).
- `pnpm build`: exit 0
- `pnpm typecheck`: exit 0
- `pnpm lint`: exit 0 (2 existing warnings in apps/web, none in my file)
- `pnpm test`: exit 1, as required: 931 passed, 6 failed. The 6 are the new T-B7 tests; every other file passes (41 of 42).
- `pnpm --filter @avel/repo-checks test`: the same 6 fail; T-B5's `locks-merges.test.ts` and the rest pass unchanged.
- `pnpm build && pnpm typecheck && pnpm lint && pnpm test`: stops at `pnpm test` for the same 6 failures.

## Failing first
All 6 fail on the start commit, each on the check's current behaviour (`tools/repo-checks/src/check-locks.ts` as T-B5 left it):

| Task | Test | Why it fails now |
| --- | --- | --- |
| T-B7-01 | T-F7-shaped history passes | exit 1: `agent-rigg-t-b2-test-unit-completion.md: outside the Territory ... (commit ...)` for the checker commit and for the report-only commit |
| T-B7-02 | report-only commit passes, with and without relock | exit 1: the same "outside the Territory" line for the tests report |
| T-B7-03 | checker commit with an extra file | names `packages/db/src/schema.ts` (right), but also names the tests report, which should be exempt |
| T-B7-04 | another report still fails | names the review report (right), but also names the tests report from the same commit |
| T-B7-05 | locked test after the relock + tests report | names `packages/server/test/shell.test.ts` (right), but also names the tests report, and the checker's fix commit |
| T-B7-06 | clean merge of a side branch | `expected +0 to be 1`: the check passes, because `--first-parent` never sees the side commit |

Sample output (T-B7-02):
```
lock check failed:
  docs/agent-dispatch/backend/sprint-01/agent-rigg-t-b2-test-unit-completion.md: outside the Territory of docs/agent-dispatch/backend/sprint-01/agent-soap-t-b2-build.md (commit e3ae981)
```
Sample output (T-B7-06): `AssertionError: expected +0 to be 1 // Object.is equality`

Because T-B3 to T-B5 already name an out-of-Territory file today, tests 03 to 05 also assert that the tests report is NOT named. That is the part that fails first, and the part the build has to add.

## What changed
- `tools/repo-checks/test/locks-tests-report.test.ts` (new): six tests, one per task, in a scratch repo built with the T-B0 helpers (read only). The tests report path is `<sprint>/agent-rigg-t-b2-test-unit-completion.md`, the `report:` of the fixture's tests doc, which the build doc's `after:` names.
- This report.

## Contract to files
- T-B7-01, 02: the tests report is exempt after the first lock sha, with or without a relock.
- T-B7-03: a checker commit before a relock may change the locked paths and the tests report only.
- T-B7-04, 05: the exemption is exactly that one path; builder commits stay held to the Territory and the lock.
- T-B7-06: every commit in lock..HEAD not on the base branch is checked; a merge of main still passes.

## Deviations
None. The checks assert the locked test and the tests report are not in the output where that is the intended result, so the tests can't pass by luck.

## Limitations
- The base-ref logic (`origin/$GITHUB_BASE_REF`, falling back to a local `main`) is only exercised through the fallback, because scratch repos have no `origin`. The "base ref can't be found, fail and say so" case isn't tested: the task doc lists no behaviour for it.
- The reviewer, not CI, checks who changed the tests report's history (F2).
- Didn't reference PR #30's shas; the fixture is modelled on its commit order.

## Lock line
`- T-B7: tools/repo-checks/test/locks-tests-report.test.ts @ <branch tip>`

## Messages received
None.
