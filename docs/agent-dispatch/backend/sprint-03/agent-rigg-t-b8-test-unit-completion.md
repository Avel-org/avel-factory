status: done
ticket: T-B8

F2 fix of T-B8-02 only, after Soap's test-dispute (the plan's boot check, `show lc_messages` when DbLive is built, can't pass against a Postgres that never answers). Axis ruled the test at fault. `pool-timeouts.test.ts` changed in T-B8-02 only; T-B8-03 and every other file are byte-identical.

## Pre-flight

Postgres from `scripts/pg-local.sh start`. The worktree had no `node_modules`; I ran `pnpm install --frozen-lockfile` (no tracked file changed).

| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 (2 existing warnings in apps/web e2e) |
| `pnpm test` | exit 0: 55 files, 971 tests passed |
| `pnpm --filter @avel/server test` | exit 0: 17 files, 54 tests passed |
| `pnpm --filter @avel/server typecheck` | exit 0 |
| `pnpm --filter @avel/server check:effect` | exit 0: 0 errors, 6 warnings and 2 messages, all in test files (as in Soap's report) |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | each part exit 0 above |

The new T-B8-02 passed 3 runs in a row on the build.

## Failing first

On the start commit's source (`git checkout 01066e4 -- packages/server/src`, then restored), `vitest run test/platform-hardening/pool-timeouts.test.ts -t T-B8-02`:

```
 × T-B8-02 · Postgres that stops answering after the layer is built > withTransaction fails as a defect within the connect timeout, and an interruption ends it 5238ms
AssertionError: withTransaction hung past the guard: expected 'hung' not to be 'hung'   (pool-timeouts.test.ts:122)
```

The layer builds (boot check absent there), the acquire hangs, and the guard reports "hung" (B2).

## What changed

- `packages/server/test/platform-hardening/pool-timeouts.test.ts`: the black hole is replaced by `proxy(target)`, a TCP proxy in front of the test's real Postgres (from `testDatabase`).
  - Pass-through forwards both ways. `hang()` destroys every socket it proxied (waiting on their `close` events and a few `setImmediate` turns, no wall-clock sleep), then accepts new connections and never answers.
  - Each subtest builds DbLive through the proxy in pass-through (the boot check passes), switches to hang inside the program, then runs `withTransaction`.
  - Subtest 1 (connect timeout 400): dies as a defect within the guard.
  - Subtest 2 (20000): the fiber is interrupted while the connect is pending and it ends within the guard.
  - Both assert `hungConnections() >= 1`: a new connection reached the proxy after the switch, so the failure came from a pending connect, not a pool client killed by `hang`.
  - Subtest 1 also asserts the layer built (`Exit.isSuccess`), so a boot failure can't pass as the defect.
- This report.

## Contract to files

| Requirement (Axis's ruling, points 1 to 7) | Where |
| --- | --- |
| 1: T-B8-02 only | `pool-timeouts.test.ts` diff touches nothing from `openTransactions` down |
| 2: TCP proxy with pass-through and hang, switching destroys proxied sockets | `proxy()` |
| 3: build in pass-through, hang, run | both subtests |
| 4: at least one new connection after the switch | `hungConnections()` assertions |
| 5: fails on the start commit with "hung" | Failing first |
| 6: no locks.md | untouched |
| 7: no sleeps | event waits and `setImmediate` turns only |

## Deviations

- The ruling doesn't say how to be sure the pool dropped the idle boot client before `withTransaction` runs. `hang()` waits for the destroyed sockets' `close` and 20 `setImmediate` turns. The `hungConnections` assertion would catch a run where the dead client was reused.
- The 400 ms subtest logs two `idle database client error` lines from the pool's listener when the proxied sockets are destroyed. That's expected and the process stays up.

## Limitations

- The pool tests use real sockets and the real clock with a 4 s guard (as before).
- The "dead idle client not reused" wait is by event-loop turns; I didn't see it flake in 3 runs on the build and 1 on the start commit.

## Lock line

None by instruction: Axis relocks after review (F2). `locks.md` is untouched.

## Messages received

1. OSA, relaying Axis: the F2 fix of T-B8-02, seven points. Followed (see Contract to files).
2. OSA: the ruling crossed with my `blocked`; carry on, no lock line, commit the test and report with status done. Followed.
