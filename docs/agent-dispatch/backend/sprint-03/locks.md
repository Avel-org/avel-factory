# Locks: backend/sprint-03

The lead adds one line per ticket once the checker's tests are committed and reviewed, copied
from the tests report. The build starts once its line is here (Build rules B2, B3, H6).

One line per ticket: the test paths separated by commas, then @ and the tip of the tests dispatch's
branch after the checker's report commit. Run check-locks on the branch before the build starts.
If a locked test changes after a test-dispute (F2), the checker commits the fix and the lead adds a
second line for the ticket ending (F2 relock), at the new tip. Lines are only ever added.

<!-- - T-B1: packages/server/test/health.test.ts, packages/server/test/errors.test.ts @ abc1234 -->
<!-- - T-B1: packages/server/test/health.test.ts, packages/server/test/errors.test.ts @ def5678 (F2 relock) -->
- T-B8: packages/server/test/platform-hardening/support.ts, packages/server/test/platform-hardening/defect-log.test.ts, packages/server/test/platform-hardening/pool-timeouts.test.ts, packages/server/test/platform-hardening/backend-death.test.ts, packages/server/test/platform-hardening/lc-messages.test.ts, packages/server/test/platform-hardening/idempotency.test.ts, packages/server/test/platform-hardening/rate-limit.test.ts @ 3b5761192419e80761795caf1ac24b677721a369
- T-B8: packages/server/test/platform-hardening/support.ts, packages/server/test/platform-hardening/defect-log.test.ts, packages/server/test/platform-hardening/pool-timeouts.test.ts, packages/server/test/platform-hardening/backend-death.test.ts, packages/server/test/platform-hardening/lc-messages.test.ts, packages/server/test/platform-hardening/idempotency.test.ts, packages/server/test/platform-hardening/rate-limit.test.ts @ 7734ab39471fd6c08582d23b5547a1ac448fc120 (F2 relock)
