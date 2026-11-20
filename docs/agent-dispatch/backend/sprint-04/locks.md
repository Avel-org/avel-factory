# Locks: backend/sprint-04

The lead adds one line per ticket once the checker's tests are committed and reviewed, copied
from the tests report. The build starts once its line is here (Build rules B2, B3, H6).

One line per ticket: the test paths separated by commas, then @ and the tip of the tests dispatch's
branch after the checker's report commit. Run check-locks on the branch before the build starts.
If a locked test changes after a test-dispute (F2), the checker commits the fix and the lead adds a
second line for the ticket ending (F2 relock), at the new tip. Lines are only ever added.

<!-- - T-B1: packages/server/test/health.test.ts, packages/server/test/errors.test.ts @ abc1234 -->
<!-- - T-B1: packages/server/test/health.test.ts, packages/server/test/errors.test.ts @ def5678 (F2 relock) -->
- T-B14: packages/server/test/clients/support.ts, packages/server/test/clients/activity.test.ts, packages/server/test/clients/dto.test.ts, packages/server/test/clients/list.test.ts, packages/server/test/clients/not-found.test.ts, packages/server/test/clients/replay.test.ts, packages/server/test/clients/unauthenticated.test.ts, packages/server/test/clients/update.test.ts @ 54173c3778b607675ac15a6092bd95dc6fdde6e7
- T-B16: packages/server/test/server/support.ts, packages/server/test/server/sign-in.test.ts, packages/server/test/server/config.test.ts, packages/server/test/server/rate-limit.test.ts, packages/server/test/server/database-failure.test.ts, packages/server/test/server/lockout.test.ts, packages/server/test/server/close.test.ts @ 615199f14148551081a973209b279fd554f183b5
