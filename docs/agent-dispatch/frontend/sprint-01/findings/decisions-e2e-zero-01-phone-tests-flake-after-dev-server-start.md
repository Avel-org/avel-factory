status: open
severity: P2
title: The locked end-to-end suite failed 4 of 14 runs on main. Each failure is a phone test, one of the first three after Playwright starts the dev server. It fails waiting for the hydration marker or for the reason dialog's confirm button.
found by: Zero, in the main checkout while checking decisions-zero-01 for INT (not a review session)
under test: main at 9bc22af (3 runs) and 5e1faa8 (11 runs). `git diff 9bc22af 5e1faa8 -- apps packages pnpm-lock.yaml` is empty, so all 14 runs are on the same code. e2e locked at d6994d7 (locks.md, decisions-e2e)
for: Fenn (decisions-test-e2e, the flake attempt; INT's decision). If the cause is in the app rather than the tests, Fenn reports it and the fix goes to that module's owner.

## Where
- `apps/web/e2e/decisions.spec.ts:34`: UC-29 waits for `[data-ui="DecisionsPage"][data-hydrated="true"]`.
- `apps/web/e2e/decisions.spec.ts:73`: UC-30 clicks the dialog's confirm button.
- `apps/web/e2e/decisions.spec.ts:162`: UC-31 expects the dialog's confirm button to be enabled.
- `apps/web/playwright.config.ts`: `reuseExistingServer: false`, `retries: 0`, `workers: 1`. Every run starts a new `vite dev` server, and the phone project runs first.

## What it breaks
UI contract section 7 (UC-29 to UC-31) and the e2e verify in plan.toml: "UC-29 to UC-31 pass on both projects, three runs in a row". A locked gate that is sometimes red can't tell a regression from noise.

## Evidence
Each run is `pnpm --filter @avel/web exec playwright test` in the main checkout, and so starts its own dev server.

**At 9bc22af, 3 runs: 2 failed, both on UC-29 [phone]**, the first test in the run:
```
✘  1 [phone] › e2e/decisions.spec.ts:10:1 › UC-29: ... (6.7s)
   Error: expect(locator).toBeVisible() failed
   Error: element(s) not found
     > 34 |   await expect(page.locator('[data-ui="DecisionsPage"][data-hydrated="true"]')).toBeVisible();
1 failed, 1 skipped, 4 passed
```
UC-31 [phone] passed in all three runs.

**At 5e1faa8, 11 runs: 2 failed, each on a different phone test:**
```
run 4 of 5:  ✘  2 [phone] › e2e/decisions.spec.ts:49:1 › UC-30: ... (30.0s)
             Error: locator.click: Test timeout of 30000ms exceeded.
                 at e2e/decisions.spec.ts:73:82
run 6 of 6:  ✘  3 [phone] › e2e/decisions.spec.ts:93:1 › UC-31: ... (6.3s)
             Error: expect(locator).toBeEnabled() failed
             Locator: getByRole('dialog').getByRole('button', { name: 'Approve', exact: true })
             Error: element(s) not found
               > 162 |   await expect(confirm).toBeEnabled();
```
In the UC-31 failure, Playwright's error context shows the page's accessibility tree with no dialog: the banner, "4 things need you." and the four rows. So the dialog, which line 160 had just filled, was gone by line 162.

The run 6 log, with `DEBUG=pw:webserver`, has no Vite "optimized dependencies changed, reloading" line. The server was ready in 403 ms and logged nothing between `(ssr) connected` and its shutdown. So a Vite dependency re-optimisation reload isn't the obvious cause, though I haven't ruled it out.

**What the failures share:** all four are in the phone project (`isMobile`, `hasTouch`). Each is a test that opens or waits for the page on a dev server started seconds before. Desk never failed in 14 runs. What I can't tell from here is the cause: the dev server's first loads of `/` and of the lazy `ReasonDialog` chunk, a reload, or the page closing the dialog.

## What fixing it means
Fenn finds the cause and fixes it in the tests or the Playwright config, within `apps/web/e2e/**` and `apps/web/playwright.config.ts` (an override of the decisions-e2e lock, INT's decision). It's done when **10 runs in a row on main are green**, each starting its own dev server as the config does now (UC-31 desk skipped as before), with:
- `retries` still 0;
- every assertion and bar unchanged: the hydration wait, 44px and 16px;
- no fixed sleep and no `reducedMotion`.

If the cause is in the app (for example the page closes the dialog or loses the click after the hydration marker is set), that's not Fenn's to change. Fenn stops, reports it under Deviations with the evidence, and it becomes a finding for the module that owns it.
