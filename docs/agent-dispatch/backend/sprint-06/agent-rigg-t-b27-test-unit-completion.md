status: done
ticket: T-B27

# T-B27 · tests · Rigg: completion report

Start commit: `1a5a15a` (main, #94). Branch: `t/B27-jobs-engine-follow-ups`. No product code changed.

## Pre-flight

| Command | Result |
| --- | --- |
| `pnpm build` | passes (cached) |
| `pnpm typecheck` | passes, 8 of 8 tasks |
| `pnpm lint` | passes: 6 warnings, all in `apps/web` (not mine) |
| `pnpm --filter @avel/server typecheck` | passes |
| `pnpm --filter @avel/server check:effect` | 0 errors (14 warnings, in `src`, not mine) |
| `pnpm test` / `pnpm --filter @avel/server test` | **6 failed, 144 passed (66 files, 5 failed)**: the 6 failures are exactly the five behaviour tests below (T-B27-04 is two tests: the new one, and the T-B20 row-set test that now includes row 5). Nothing else fails. Both commands run the same suite; I ran the server one 6 times (once plain, 5 under load) and got the same 6 every time. |

The last verification line (`pnpm build && pnpm typecheck && pnpm lint && pnpm test`) is the same four commands above; `pnpm test` is red only on the five behaviours that aren't built yet, as it must be before the build.

## Failing first

Run on the start commit's source (`src/` untouched), in a fresh database:

```
 × T-B27-01  returns within 30 s though the handler never does; its write rolls back; a new copy acts once
   AssertionError: stop never returned: a handler that never returns hangs a deploy: expected false to be true
 × T-B27-02  leaves no claim the copy doesn't hold: a new copy acts on the first event within 10 s
   AssertionError: the new copy waited for a claim's expiry: the stopped copy left a claim it didn't know it held: expected 31000 to be less than or equal to 10000
 × T-B27-03  logs no dead line, leaves the job as the other copy has it, and the other copy goes on
   AssertionError: a logged a death that didn't happen: expected [ Array(1) ] to deeply equal []
     received: "consumer late is dead after 5 failures on event 1; it acts on nothing more"
 × T-B27-04  T-B27-04 · row 5 stays in Step 1, restated by CR-43 on sign-in, with T-B9-04 and T-B16-03 in its cells
   AssertionError: row 5 still says it moved: expected 'moved to step 5 with route 1 and the …' not to contain 'moved'
 × (T-B20-01) each of tests 1 to 7 and 10 to 13, still in Step 1, names real test files and test IDs and a locking ticket
   AssertionError: row 5 names no test ID: expected 0 to be greater than 0
 × T-B27-05  after three lost claims, each taken again, the live fibers are no more than after the first
   AssertionError: live fibers grew from 3 to 6: finished check-in fibers are still held: expected 6 to be less than or equal to 3
 ✓ T-B27-G01 (guard) passes on the start commit, as expected
```

Each behaviour test fails for its own reason, not for a setup error. I also checked each can pass, on a scratch worktree (detached at `1a5a15a`, with `node_modules` and `dist` copied; since removed):

- A prototype of the three engine changes (a bounded stop, claim plus `held` uninterruptible, `fail` reporting dead only when its update changed the row) turned T-B27-01, -02 and -03 green, and all of `test/consumers` stayed green.
- Adding `own.delete(claim.beat)` to the check-in's lost handler turned T-B27-05 green.
- Rewriting row 5 of `docs/steps/step-1-done.md` as the task's note describes turned all 6 tests in `done-when.test.ts` green.

These prototypes are my proof that the tests are satisfiable. They're not a design, and none is in the branch.

**Guard T-B27-G01: passes on the start commit (a guard, CR-42).** In the scratch worktree I deleted engine.ts's line `eq(consumerCursors.claimNo, claim.claimNo),` from the cursor's swap and ran it:

```
 ❯ test/jobs-follow-ups/g01-late-hold-with-a-waiting-second-copy.test.ts (1 test | 1 failed)
 Error: AssertionError: a moved the cursor: expected 1 to be +0 // Object.is equality
```

With the line back, it passes.

## What changed

| File | Why |
| --- | --- |
| `packages/server/test/jobs-follow-ups/01-stop-is-bounded.test.ts` (new) | T-B27-01. A handler that never returns; stop runs on its own fiber while TestClock moves; stop must return within 30 s of the last check-in (asserts `movedMs ≤ 30 000`), the handler's write is rolled back, the cursor stays, and a new copy acts on the event once within 10 s. |
| `.../02-stop-during-first-claim.test.ts` (new) | T-B27-02. See Deviations: the moment is made, not raced for. A deferred constraint trigger (made by the test in its own database) makes the claim's COMMIT wait on an advisory lock the test holds; stop is called while it waits; then the lock goes. A new copy must act on the first event within 10 s. |
| `.../03-late-fifth-failure.test.ts` (new) | T-B27-03. The job starts with `attempts = 4`; a trigger refuses copy a's check-ins so its claim expires while its handler runs; b takes over and waits on its own Deferred; a's handler fails (5th failure). Asserts no log line says dead (a captured `Logger`), the job is `claimed` at attempts 4 on b's claim number, then b finishes, goes on to a second event, and no dead line ever appears. |
| `.../05-lost-check-ins-leave-no-fibers.test.ts` (new) | T-B27-05. See Deviations: counts the process's live fibers (`v8.queryObjects` after a forced gc) after the first claim and after three lost-and-retaken claims; they must not grow. |
| `.../g01-late-hold-with-a-waiting-second-copy.test.ts` (new) | T-B27-G01 as the task describes: a and b both wait on Deferreds; a's late hold is released first; a's write isn't saved and the cursor doesn't move; then b is released and only b's write and one move stay. |
| `packages/server/test/step-1/done-when.test.ts` | T-B27-04. Test 5 comes out of `MOVED`; the in-Step-1 rows are now 1 to 7 and 10 to 13; a new test, "T-B27-04 · row 5 stays in Step 1...", requires row 5 not to say "moved", to name CR-43, to list both files (`packages/server/test/auth/rate-limit.test.ts`, `packages/server/test/server/rate-limit.test.ts`) and both IDs (`T-B9-04`, `T-B16-03`), and to name both tickets (T-B9 and T-B16) in its ticket cell. The generic row check then verifies the files and IDs exist. The header comment is updated. |
| `packages/server/test/platform-hardening/pool-timeouts.test.ts` | Timing fix for T-B8-02, assertions unchanged. See below. |
| `packages/server/test/follow-ups/05-close-releases-pools.test.ts` | Timing fix for T-B19-05, assertions unchanged. See below. |
| `packages/server/test/jobs/retries.test.ts` | Timing fix for T-B13-06, assertions unchanged. See below. |
| this report | |

### The timing fixes

All three keep their assertions. No wall-clock sleep was added (F4).

- **T-B8-02 (t-b18-rigg-03).** On the start commit it failed on 3 of 12 runs of the file alone with 4 CPU burners beside it ("no new connection reached the proxy": expected 0 to be >= 1), and on 1 of 5 full-suite runs. The failing run took 200 to 300 ms, so the failure was not a pending connect. I printed the cause: `read ECONNRESET`. The proxy's `hang()` ended the Postgres-side sockets as well as the client-side ones; closing the Postgres side destroyed the client-side socket locally, so `hang()` saw its `close` before the pool's own socket had noticed anything. The pool then reused its dead idle client, and the query hit a reset instead of a hung connect. The test waited 20 event-loop turns for this, which is a count, not a fact. Now `hang()` ends only the proxied client sockets and waits for each to close, and a graceful close completes only once the pool's socket has ended too, which is when the pool has dropped the dead client. Result: 0 failures in 30 runs of the file under the same 4 burners.
- **T-B19-05.** It passed 6 of 6 alone and 5 of 5 under load for me, so I couldn't reproduce its flake. The only assertion that waits on a fixed time is `vi.waitFor(count settles, { timeout: 1_000 })`; it now has `timeout: 8_000` (below pg's 10 s default idle timeout, which is what that wait guards against), so the connection count is waited on, not read within a second. The `close()` takes less than 2 s assertion is unchanged: it measures the behaviour the title names, and I saw it at about 1 s under load. See Limitations.
- **T-B13-06.** It didn't fail for me in the full-suite runs either (it passed on both, with and without my change), so this fix rests on reading the code. The 603 000 ms gap comes from `until`/`advance` in `test/jobs/support.ts`: the TestClock moves on after 4 round trips, while the engine's claim reads `Clock` and then does real I/O, so under load the handler's `Clock` read can be several steps late. Now each try is waited for on committed state (the failure saved: job `queued` with its `attempts`), time jumps to about 3 s before the job's `run_after` (read from `jobs.get`), and then moves in 1 s steps with the consumers' stronger `until` (it waits until no statement is in flight), until the next try has started. The final assertions (the gaps, `dead`, `attempts`, `lastError`) are unchanged. The first version of this fix used the strong settle for the whole 15 simulated minutes; it passed but ran over vitest's 60 s timeout, so it's now stepped as above (about 8 to 10 s under load).

### The load proof

4 CPU burners (`node -e "for(;;){}"`, one per core, started and killed by a script in my scratchpad, nothing in the repo), with `pnpm --filter @avel/server exec vitest run --reporter=verbose` beside them, 5 runs in a row. Load average 8.1 before run 1 and 12.0 after run 5 (4 cores). In every run T-B8-02, T-B19-05 and T-B13-06 passed:

| Run | Load avg after (1 min) | T-B13-06 | T-B8-02 | T-B19-05 |
| --- | --- | --- | --- | --- |
| 1 | 12.33 | pass 9951 ms | pass 1255 ms | pass 1276 ms |
| 2 | 11.96 | pass 8320 ms | pass 1299 ms | pass 842 ms |
| 3 | 11.13 | pass 9221 ms | pass 1210 ms | pass 1234 ms |
| 4 | 12.44 | pass 8159 ms | pass 1270 ms | pass 1191 ms |
| 5 | 11.98 | pass 9514 ms | pass 1342 ms | pass 1148 ms |

Every run showed the same 6 failures (the behaviour tests above) and nothing else: `Tests 6 failed | 144 passed (150)`. An earlier set of 5 runs, before the T-B8-02 fix was complete, had one T-B8-02 failure in run 1; the fix above came from that.

## Contract to files

| Requirement | File |
| --- | --- |
| T-B27-01 (rigg-04 item 1) | `jobs-follow-ups/01-stop-is-bounded.test.ts` |
| T-B27-02 (rigg-04 item 2, zero-01) | `jobs-follow-ups/02-stop-during-first-claim.test.ts` |
| T-B27-03 (rigg-04 item 3) | `jobs-follow-ups/03-late-fifth-failure.test.ts` |
| T-B27-04 (t-b20-rigg-01) | `step-1/done-when.test.ts` |
| T-B27-05 (rigg-04 item 4) | `jobs-follow-ups/05-lost-check-ins-leave-no-fibers.test.ts` |
| T-B27-G01 (rigg-01) | `jobs-follow-ups/g01-late-hold-with-a-waiting-second-copy.test.ts` |
| Timing fixes (rigg-03, T-B13-06) | `platform-hardening/pool-timeouts.test.ts`, `follow-ups/05-close-releases-pools.test.ts`, `jobs/retries.test.ts` |
| Load proof | the table above |

## Deviations

- **T-B27-02 uses a test-made trigger.** I couldn't stop the copy "right after its first claim commits" by racing: the window between the commit and `held = claim` has no database call, so a poll can't land in it. The test makes the window: a deferred constraint trigger and an advisory lock, both created in the test's own database and dropped at the end (never a migration, no file outside the test). My first version (a row lock on the claim statement, so the stop landed *before* the commit) passed on the start commit: an interrupted claim statement rolls back cleanly. So this test targets the commit in flight, which is the window the task names. A build that makes the claim and `held` uninterruptible, or makes the claim never happen, passes.
- **T-B27-05 reads the engine through the process, not through the engine.** The task allowed "whatever the engine exposes to tests", and the engine exposes nothing of `own`. The test counts live fibers with `v8.queryObjects` (after `--expose-gc` set at runtime, with a forced collection). On the start commit the count grows by exactly 3 for 3 lost claims (3 to 6, in 2 of 2 runs). It doesn't depend on `own` being a `Set`, so a builder can restructure freely. A build must not keep a finished check-in fiber anywhere.
- **T-B27-03 sets the job's `attempts` to 4 with SQL**, instead of making four real failures: four failures with their backoffs (10 s, 30 s, 2 min, 10 min) are 12 simulated minutes of stepping, too slow under the 60 s test timeout. The engine reads `attempts` as the failures at claim, as T-B18 built it, so the starting state is the one four failures leave. The test also names the consumer's job by its documented key (`consumer:<name>`, jobs.ts's doc comment).
- **Rigg's lesson line not added.** The task asks for none, and `.agents/**` is outside my territory here, so I didn't append to `.agents/memory/rigg.md`.

## Limitations

- **T-B19-05's flake isn't reproduced.** I fixed the wait on the connection count (the only fixed-time wait I could find) but kept the `close() < 2 s` assertion, as the task says assertions are unchanged. If that bound is what flaked, it's a measure of the machine's speed and could flake again; I saw close take about 1 s under 4 burners. If it recurs, the lead should decide whether 2 s stays.
- **T-B13-06's fix is untested against the original failure** (603 000 ms), which I couldn't reproduce: the old version passed on both full-suite runs I did with burners. The 5 load runs above are the proof that the new version holds.
- T-B27-03 and -02 use triggers in the test's own database; a builder who changes the `jobs` table's columns (`claimed_by`, `claim_expires_at`, `claim_no`, `state`) would break them, which the lead should keep in mind.
- T-B27-05 uses `v8.queryObjects`, which Node marks experimental (an `ExperimentalWarning` is printed). It's available in the Node 22.12+ the stack names, and worked on the Node 24 here; I didn't run Node 22.
- A bound on how many runs one worker holds (t-b18-rigg-02) and a database defect inside act (t-b18-zero-02) are not tested, as the task says.
- `jobs.ts`'s comments (rigg-05) and row 5's text are the builder's; the tests cover row 5 only.

## Lock line

- T-B27: packages/server/test/jobs-follow-ups/01-stop-is-bounded.test.ts, packages/server/test/jobs-follow-ups/02-stop-during-first-claim.test.ts, packages/server/test/jobs-follow-ups/03-late-fifth-failure.test.ts, packages/server/test/jobs-follow-ups/05-lost-check-ins-leave-no-fibers.test.ts, packages/server/test/jobs-follow-ups/g01-late-hold-with-a-waiting-second-copy.test.ts, packages/server/test/step-1/done-when.test.ts, packages/server/test/platform-hardening/pool-timeouts.test.ts, packages/server/test/follow-ups/05-close-releases-pools.test.ts, packages/server/test/jobs/retries.test.ts @ <branch tip>

## Messages received

None.
