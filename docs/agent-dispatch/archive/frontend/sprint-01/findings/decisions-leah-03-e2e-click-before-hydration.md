status: closed (a2)
severity: P2
owner: INT to route (Leon / Fenn)

# e2e UC-29, UC-30, UC-31: 5 of 6 fail; the dialog never opens after the click

**Evidence.**
```
$ pnpm --filter @avel/web exec playwright test
5 failed: [phone] UC-29, UC-30, UC-31; [desk] UC-29, UC-30   (1 skipped)
Error: locator.fill: waiting for getByRole('dialog').getByRole('textbox')    (decisions.spec.ts:62)
Expected visible: getByRole('dialog').getByText('Approve this decision?')    (decisions.spec.ts:36)
```
Done by hand, the flow works: in a probe of the same dev server, the SSR rows are visible at about 60 ms and the first button is hydrated at about 500 ms; a click after hydration opens the dialog (`dialogs 1`). The spec clicks Approve as soon as `rows` has 4 items (spec lines 29 to 33), which is the SSR HTML, so the click can land before hydration and is lost. **That cause is my inference; I didn't prove it** (I couldn't alter the locked test to add a wait). UC-31 is also expected to fail on 44px/16px until finding 02 is fixed.

This is a real performance point too: on a phone, the page is visible and not interactive for the hydration time of a 552 kB single chunk (finding 01); a lost first tap is what a user sees.

**Fix means:** INT/Fenn decide whether the locked specs wait for hydration; smaller JS (finding 01) shortens the window. Re-run after Leon a2.

## a2 re-check: closed
`data-hydrated` marker in place; `playwright test`: UC-29, UC-30 pass on phone and desk, UC-31 fails only at its grid assertion (finding 05), not a lost click.
