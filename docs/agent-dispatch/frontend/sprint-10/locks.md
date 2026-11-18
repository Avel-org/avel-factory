# Locks: frontend/sprint-10

The lead adds one line per ticket once the checker's tests are committed and reviewed, copied
from the tests report. The build starts once its line is here (Build rules B2, B3, H6).

One line per ticket: the test paths separated by commas, then @ and the tip of the tests dispatch's
branch after the checker's report commit. Run check-locks on the branch before the build starts.
If a locked test changes after a test-dispute (F2), the checker commits the fix and the lead adds a
second line for the ticket ending (F2 relock), at the new tip. Lines are only ever added.

<!-- - T-B1: packages/server/test/health.test.ts, packages/server/test/errors.test.ts @ abc1234 -->
<!-- - T-B1: packages/server/test/health.test.ts, packages/server/test/errors.test.ts @ def5678 (F2 relock) -->
- T-F11: tools/repo-checks/test/web-e2e-ci.test.ts @ 77962b124a30dbd02aeb32026e077fa8325b7349
