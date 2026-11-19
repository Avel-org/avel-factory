status: done
ticket: T-F10

# T-F10 tests: completion report (Fenn)

## Pre-flight
Run on the ticket's start commit a7aeade plus my test files. `pnpm --filter @avel/contract --filter @avel/contract-mock build` was run first, as CI does.
- `vite build`: exit 0.
- `pnpm typecheck`: exit 1, `tools/docs: Cannot find module '@avel/db'`. @avel/db isn't built in this fresh worktree and I touched nothing outside the test paths. Not caused by these tests; `packages/*` and the web typecheck passed.
- `pnpm lint`: exit 0, 6 warnings (`innerText` in specs, deliberate: I read the visible text).
- `vitest run && playwright test`: vitest fails (3 tests), so playwright is skipped by `&&`. Both were then run alone:
- `vitest run`: 3 failed, 44 passed (the new tests only fail).
- `playwright test`: 9 failed, 294 passed (13.2 min). Every failure is a new test. The existing suite, including budget.spec, passes; I did not copy a byte figure from it (no build change).
- `vite build` and `pnpm lint` again: exit 0.

## Failing first (start commit)
Vitest:
- `T-F10-01` `apps/web has the check:contract script`: expected "node control-room/tools/check-contract.mjs", got undefined.
- `T-F10-01` `pnpm run check:contract ... exits 0`: no such script.
- `T-F10-02` `onboarding.json has no '$' amount ...`: offender `onboarding.json.<mission>.checkpoints[2].package.price`.

Playwright (9):
- `T-F10-04` x6 (trail, Canon, Library; each "sample world holds the payload" and "renders as literal text"): `no sample-world string for <sink> holds <b>, <script> and ](javascript:`.
- `T-F10-05` x2: `#/drive` and `#/drive/states` show text naming OSA with the flag absent.
- `T-F10-03` x1: canon with `?osa=1&sim=every` fails the axe check (see Deviations).

## What changed
- `apps/web/test/control-room-rules/contract-check.test.ts`: T-F10-01. Script present; `pnpm run check:contract` exits 0; contract-index.json routes and event kinds equal packages/contract's (both comparisons already pass, so no needs-cr).
- `apps/web/test/control-room-rules/no-money-in-mock.test.ts`: T-F10-02. Per file in `control-room/src/mock/`: no `$<digit>`/USD string, no price/margin/invoice/payment key.
- `apps/web/e2e/control-room-rules/no-money.spec.ts`: T-F10-03. Every route in the registry (reused from `e2e/control-room-screens/routes.ts`), with `?osa=1&sim=every` and `?osa=0`: no `$` outside code/pre/kbd, no `$<digit>`/USD anywhere, axe WCAG 2.2 AA, no page errors, screenshot.
- `apps/web/e2e/control-room-rules/untrusted-text.spec.ts`: T-F10-04. The sample world must hold a string with `<b>`, `<script>` and `](javascript:` in an agent trail step (operations.json moduleRuns), a Canon message (onboarding.json) and a Library entry (library.json). The test finds it, opens its page, and checks the literal characters show, the markup is escaped, no script element, no `javascript:` link, no `<b>` element, no `__xss`, no dialog, axe.
- `apps/web/e2e/control-room-rules/osa-flag.spec.ts`: T-F10-05. Flag absent: no `[data-ui="OsaBar"]`, no `OSA` text or aria-label on any registry route. `?osa=1`: the bar shows with "Ask OSA" on four routes.

## Contract to files
T-F10-01 → contract-check.test.ts; 02 → no-money-in-mock.test.ts; 03 → no-money.spec.ts; 04 → untrusted-text.spec.ts; 05 → osa-flag.spec.ts. Video and screenshot come from playwright.config (`on`).

## Deviations
- T-F10-03's `$` assertions already pass on the start commit: the ported pages show no money. It fails at start only because axe flags the canon page when `?osa=1&sim=every` is on. I kept it because E17 requires axe in every e2e test and it is a real regression guard. The `$` rule is guarded, not newly driven.
- T-F10-04 can't fail from the renderer at start (it already renders text). It fails because the sample world holds no such string. The builder must add payload strings to the sample world in the three places above. To check my selectors I temporarily put a payload in those three files: all 6 passed. I reverted it (`git checkout`).
- Vitest imports `@avel/contract` from `dist`, so `pnpm build` must run first (CI does).

## Limitations
- I did not prove 04 fails against an unsafe renderer.
- Loading, empty and error states aren't part of these five tasks; not covered here.
- Playwright's existing suite is slow (screens.spec ~7.8 min).

## Lock line
- T-F10: apps/web/test/control-room-rules/contract-check.test.ts, apps/web/test/control-room-rules/no-money-in-mock.test.ts, apps/web/e2e/control-room-rules/no-money.spec.ts, apps/web/e2e/control-room-rules/untrusted-text.spec.ts, apps/web/e2e/control-room-rules/osa-flag.spec.ts @ <branch tip>

## Messages received
None.
