status: done
ticket: T-B17

# T-B17 tests: completion report (Rigg)

Start commit: `e49870a` (main). Branch `t/B17-jobs-engine`. Own Postgres from `scripts/pg-local.sh`. `pnpm build` was needed first in a fresh worktree (`@avel/db` has no entry until built).

## Pre-flight

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 1: only `test/jobs/*` errors, all from `Cannot find module '../../src/platform/jobs/index.ts'` (TS2307) and the implicit-any errors that follow. Expected: the engine isn't built |
| `pnpm lint` | exit 0 (280 files) |
| `pnpm test` | exit 1: 7 files failed, 74 passed. The failures are the 6 `test/jobs` files and `@avel/repo-checks` `effect-check.test.ts` T-B2-04 (it runs `check:effect` on the server, which fails on the same missing module) |
| `pnpm --filter @avel/server test` | covered by `pnpm test` above: the 6 jobs files fail, all other server files pass |
| `pnpm --filter @avel/db test` | exit 0: 10 files, 652 tests |
| `pnpm --filter @avel/server typecheck` | same errors as `pnpm typecheck` (it is the failing package) |
| `pnpm --filter @avel/server check:effect` | exit 1: the same missing module |
| `pnpm --filter @avel/docs drift` | exit 0, no drift |
| `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated` | exit 0 |
| `git diff --exit-code main -- packages/server/package.json pnpm-lock.yaml` | exit 0 |
| last line (`build && typecheck && lint && test`) | stops at typecheck, for the reason above |

## Failing first

Run on the start commit's source (no `platform/jobs`, no `partition_key`).

Behaviour tests:

- **T-B17-01 (T-B13-01 to T-B13-10)**: `claims`, `consumers`, `recovery`, `retries`, `rollback` all fail at load, so no test in them runs:
  `Error: Cannot find module '../../src/platform/jobs/index.ts' imported from .../test/jobs/<file>.test.ts`
  That is the right reason: `platform/jobs` doesn't exist on main. Copied unchanged from `330b6ec` (`git checkout 330b6ec -- packages/server/test/jobs packages/server/test/platform-hardening/pool-timeouts.test.ts`); no assertion was edited.
- **T-B17-02** (partition-index.test.ts, behaviour): fails with
  `error: column "partition_key" of relation "jobs" does not exist` at the insert (`test/jobs/partition-index.test.ts:26`).
- **T-B17-03** (partition-index.test.ts, behaviour): fails with
  `Error: Cannot find module '/src/platform/jobs/index.ts'`. The engine and harness are loaded by dynamic import inside this test, so T-B17-02 runs and fails by itself on its own reason (a static import would have failed both at load).

Guard test:

- **T-B17-G01** (`pool-timeouts.test.ts`, T-B8-02, from `330b6ec`): **passes** on the start commit (2 tests passed, file run alone). It is the un-skipped version with the proxy wait and the 1000 ms connect timeout. It's a guard (CR-42), so passing now is allowed. The full parallel run (`pnpm test`) also passed it: it isn't among the failures. The quarantine row (#61) in `docs/quarantine.md` is for the build to remove (outside my territory).

## What changed

- `packages/server/test/jobs/{claims,consumers,recovery,retries,rollback}.test.ts`, `support.ts`: copied unchanged from `330b6ec`. T-B17-01.
- `packages/server/test/platform-hardening/pool-timeouts.test.ts`: from `330b6ec` (`it.skip` removed). T-B17-G01.
- `packages/server/test/jobs/partition-index.test.ts`: new. T-B17-02 and T-B17-03.
  - T-B17-02: raw SQL. Two jobs in mission-a: the first `update ... state='claimed'` works, the second fails with `23505` on `jobs_one_claimed_per_partition_uq` and stays queued; one job in mission-b and two with no partition all claim (4 claimed); when the holder is done, the second one in mission-a claims.
  - T-B17-03: 8 workers over 5 jobs in partition A and 1 in B, gated. Checks that A and B each run one at a time, that after 10 s of TestClock polling only 2 jobs have run, that the run exits Success (no defect), and that after release all 6 jobs end `done` with `attempts 1`, `claim_no 1`, `last_error null` (a refused claim is a skip: no attempt, no claim number). No wall-clock sleeps.
- This report.

## Contract to files

- Step 1 tests 10 and 11, CR-30 checks 1 to 8 (T-B13-01 to 10): the copied files. CR-44 (index refuses; claim treats refusal as skip): `partition-index.test.ts`. #61 guard: `pool-timeouts.test.ts`.

## Deviations

- T-B17-03 loads `platform/jobs` and `support.ts` through a dynamic `import()` inside the test, not a top-level import, so T-B17-02 fails for its own reason (B2). Same assertions either way.
- The routes' E13 four don't apply: this ticket adds no route.

## Limitations

- The T-B13 tests fail at load, so I can't show each of them failing at its own assertion; they will each do so only once the module exists.
- `pnpm typecheck` stays red until the engine exists, because the locked tests import it. The typecheck of `partition-index.test.ts` (implicit-any on handler parameters) clears once `jobs/index.ts` exists.
- T-B17-03 can't see a swallowed Postgres error that the worker logs and survives; it catches one through the final state (`attempts`, `claim_no`, `last_error`, every job done) and the exit.
- I didn't run `pnpm --filter @avel/server test` separately; `pnpm test` runs it.

## Lock line

- T-B17: packages/server/test/jobs/claims.test.ts, packages/server/test/jobs/consumers.test.ts, packages/server/test/jobs/recovery.test.ts, packages/server/test/jobs/retries.test.ts, packages/server/test/jobs/rollback.test.ts, packages/server/test/jobs/support.ts, packages/server/test/jobs/partition-index.test.ts, packages/server/test/platform-hardening/pool-timeouts.test.ts @ <branch tip>

## Messages received

None.
