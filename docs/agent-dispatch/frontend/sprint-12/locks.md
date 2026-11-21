# Locks: frontend/sprint-12

The lead adds one line per ticket once the checker's tests are committed and reviewed, copied
from the tests report. The build starts once its line is here (Build rules B2, B3, H6).

One line per ticket: the test paths separated by commas, then @ and the tip of the tests dispatch's
branch after the checker's report commit. Run check-locks on the branch before the build starts.
If a locked test changes after a test-dispute (F2), the checker commits the fix and the lead adds a
second line for the ticket ending (F2 relock), at the new tip. Lines are only ever added.

<!-- - T-B1: packages/server/test/health.test.ts, packages/server/test/errors.test.ts @ abc1234 -->
<!-- - T-B1: packages/server/test/health.test.ts, packages/server/test/errors.test.ts @ def5678 (F2 relock) -->
- T-F22: packages/contract-mock/test/mission-routes.test.ts, packages/contract-mock/test/mission-world.test.ts @ e9af24891c1643a15a9e05910ad0cb05c94ca1b9
- T-F12: apps/web/e2e/budget.spec.ts, apps/web/e2e/sign-in/guard.spec.ts, apps/web/e2e/sign-in/helpers.ts, apps/web/e2e/sign-in/layout.spec.ts, apps/web/e2e/sign-in/lockout.spec.ts, apps/web/e2e/sign-in/sign-out.spec.ts, apps/web/e2e/sign-in/storage-state.spec.ts, apps/web/e2e/sign-in/submit.spec.ts, apps/web/e2e/support/auth.setup.ts, apps/web/playwright.config.ts, apps/web/test/sign-in/api.test.ts, apps/web/test/sign-in/safe-next.test.ts @ 44950e9dae17cd3f77986ea5af758631647c96ba
- T-F12: apps/web/e2e/budget.spec.ts, apps/web/e2e/sign-in/guard.spec.ts, apps/web/e2e/sign-in/helpers.ts, apps/web/e2e/sign-in/layout.spec.ts, apps/web/e2e/sign-in/lockout.spec.ts, apps/web/e2e/sign-in/sign-out.spec.ts, apps/web/e2e/sign-in/storage-state.spec.ts, apps/web/e2e/sign-in/submit.spec.ts, apps/web/e2e/support/auth.setup.ts, apps/web/playwright.config.ts, apps/web/test/sign-in/api.test.ts, apps/web/test/sign-in/safe-next.test.ts, apps/web/e2e/control-room/prod.spec.ts, apps/web/e2e/control-room-budget/budget.spec.ts, apps/web/e2e/control-room-budget/preview.ts, apps/web/e2e/support/preview-auth.ts @ 76fdaf151d6956cd308e48f657fc93245969bd4d (F2 relock)
- T-F12: apps/web/e2e/budget.spec.ts, apps/web/e2e/sign-in/guard.spec.ts, apps/web/e2e/sign-in/helpers.ts, apps/web/e2e/sign-in/layout.spec.ts, apps/web/e2e/sign-in/lockout.spec.ts, apps/web/e2e/sign-in/sign-out.spec.ts, apps/web/e2e/sign-in/storage-state.spec.ts, apps/web/e2e/sign-in/submit.spec.ts, apps/web/e2e/support/auth.setup.ts, apps/web/playwright.config.ts, apps/web/test/sign-in/api.test.ts, apps/web/test/sign-in/safe-next.test.ts, apps/web/e2e/control-room/prod.spec.ts, apps/web/e2e/control-room-budget/budget.spec.ts, apps/web/e2e/control-room-budget/preview.ts, apps/web/e2e/support/preview-auth.ts @ eb22e6f2df0cf51fd50a34a224ce73e8b77f33c2 (F2 relock)
