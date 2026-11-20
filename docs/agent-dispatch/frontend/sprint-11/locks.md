# Locks: frontend/sprint-11

The lead adds one line per ticket once the checker's tests are committed and reviewed, copied
from the tests report. The build starts once its line is here (Build rules B2, B3, H6).

One line per ticket: the test paths separated by commas, then @ and the tip of the tests dispatch's
branch after the checker's report commit. Run check-locks on the branch before the build starts.
If a locked test changes after a test-dispute (F2), the checker commits the fix and the lead adds a
second line for the ticket ending (F2 relock), at the new tip. Lines are only ever added.

<!-- - T-B1: packages/server/test/health.test.ts, packages/server/test/errors.test.ts @ abc1234 -->
<!-- - T-B1: packages/server/test/health.test.ts, packages/server/test/errors.test.ts @ def5678 (F2 relock) -->

- T-F10: apps/web/test/control-room-rules/contract-check.test.ts, apps/web/test/control-room-rules/no-money-in-mock.test.ts, apps/web/e2e/control-room-rules/no-money.spec.ts, apps/web/e2e/control-room-rules/untrusted-text.spec.ts, apps/web/e2e/control-room-rules/osa-flag.spec.ts @ e92879d
