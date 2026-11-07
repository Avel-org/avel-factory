# FENN: decisions test-e2e, completion report

verdict: DONE

## Summary
`apps/web/playwright.config.ts` and UC-29 to UC-31 are written and committed as one tests commit (7fcb967). Each of the six runs (3 tests x phone and desk) fails on an assertion, 3 runs in a row. The tests have only been run against a stand-in server, never against the real page, so their selectors are unchecked until the build exists (see Limitations).

## Pre-flight
- Part 2 files: all read (fenn.md, codebase-analysis.md, the UI contract in full, CR-W2, decisions.md, FM v0.6 by grep for the testing and phone parts, the DL by grep for the touch rule, the plan by grep, this task doc). None missing.
- Branch `frontend/sprint-01/agent-fenn-decisions-test-e2e-a1`, start commit f470e0b.
- Part 7 commands: all available. `pnpm install --frozen-lockfile` was run first (no code change).

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| FENN-01 | DONE | 7fcb967 |

## Tests
All in `apps/web/e2e/decisions.spec.ts`, each run in the `phone` (390x844) and `desk` (1280x800) projects. Every one currently fails at the same line: `expect(response.status(), "POST /__mock/reset re-seeds fixtures.step1").toBe(204)`, `Expected: 204, Received: 403` (`e2e/fixtures.ts:9`).
- UC-29: "/ is server-rendered with its rows, and approving a proposal with a reason removes it". Checks the SSR HTML (page root, 4 `DecisionTag`s, `4 things need you.`, no `WidgetState`), then approve with a reason, the `Approved by you at HH:MM.` line, 4 rows to 3, and the lead `3 things need you.`. Fails first on the reset assertion.
- UC-30: "a version bumped while the page is open gives the stale state, and Review then approve works". Opens the dialog, bumps through `POST /__mock/bump/{id}`, confirms, expects `Version n+1 arrived while you were reading.`, a `Copy …` chip, then Review, `Binds to Version n+1`, and approving to 201. Fails first on the reset assertion.
- UC-31: "on a phone the actions are D11's two-column grid, 44px tall, and the reason input is 16px". Skipped on desk after its fixture runs. On phone: grid container with 2 columns and a 10px gap, Reject left of Approve, widths 1 : 1.4, buttons at least 44px tall, then the dialog textarea at 16px inside 390px, with no horizontal overflow, and the confirm button at least 44px. Fails first on the reset assertion.

Run output (identical in runs 1, 2 and 3):
```
Running 6 tests using 1 worker
  ✘  1 [phone] › UC-29 …   ✘  2 [phone] › UC-30 …   ✘  3 [phone] › UC-31 …
  ✘  4 [desk]  › UC-29 …   ✘  5 [desk]  › UC-30 …   ✘  6 [desk]  › UC-31 …
    Error: POST /__mock/reset re-seeds fixtures.step1
    Expected: 204
    Received: 403
```

## Lock
Tests commit: 7fcb967.
`- decisions-e2e · 7fcb967 · apps/web/e2e/**, apps/web/playwright.config.ts`

## Contract to files
- Section 7, UC-29 to UC-31: `apps/web/e2e/decisions.spec.ts`.
- Reset before each test (`workers: 1`): `apps/web/e2e/fixtures.ts` (an auto fixture).
- 390x844 and 1280x800 projects, the dev server with `AVEL_API=mock`, `workers: 1`: `apps/web/playwright.config.ts`.
- Test stand-in server: `apps/web/e2e/unbuilt-server.mjs`.

## Deviations
- **Stand-in server while the app is unbuilt.** The real dev server can't start (`src/router.tsx` and `packages/contract-mock` don't exist), and a server that won't start fails on setup, not on an assertion. So `playwright.config.ts` starts `e2e/unbuilt-server.mjs` (answers 403 to everything) until both exist, then switches to `vite dev` with `AVEL_API=mock`. Same idea as the stubs in `vitest.config.ts`. It answers 403, not 404, because Playwright treats 404 as "server down". Once the build lands, the stand-in is never started. It is a file inside my locked paths and needs no removal.
- **Selectors are inferred from the UI contract**, because no page or kit exists. The ones I rely on are: `ul[aria-label="Waiting for you"]` with `li` rows, `data-ui="DecisionsPage"` and `"DecisionTag"`, the dialog as `role="dialog"` with a `textbox`, the Approve and Reject button names (the row's own labels, `{rejectLabel}…`), `Review version {n}`, and `Copy …` for the request ID chip.
- UC-31 on desk is skipped in the test body, so it shows as a failure on desk until the reset passes, then as skipped.
- `retries: 0`; results go to `node_modules/.playwright-results` so no untracked files appear.

## Limitations
- The test bodies after the reset step have not run against a real page. Wrong selectors would show as failures when Leon's build lands, and the fix would be a retry of this dispatch (the paths are locked).
- UC-29's "SSR HTML" check reads the first response with `request.get("/")` and looks for `data-ui` markers. If Fantem's `DecisionTag` doesn't render `data-ui="DecisionTag"` on the server, it fails.
- UC-31 finds the actions container as the nearest common ancestor of Approve and Reject. If the kit nests the buttons deeper than the grid, the 2-column check fails.
- `pnpm --filter "@avel/web..." build` and `typecheck` fail now (no `src/router.tsx`), and `pnpm --filter @avel/web test` fails 85/85 (w0-data's locked tests, failing first). Neither is mine; `tsc` reports no errors in `e2e/` or `playwright.config.ts`.

## Parked chains
None.

## P0 discoveries
None.

## Issues for other agents
- Ghost: `vite.config.ts`'s mock middleware (already in main) is what UC-29 to UC-31 use: `POST /__mock/reset` must answer 204 and `POST /__mock/bump/{id}` 200 `{ version }`.
- Leon, Fantem: UC-29 to UC-31 depend on the `data-ui` names, list semantics and accessible names above.
- INT: the playwright browsers (chromium-1248 in `~/.cache/ms-playwright`) must be installed wherever the e2e runs.

## Files changed
```
apps/web/e2e/decisions.spec.ts
apps/web/e2e/fixtures.ts
apps/web/e2e/unbuilt-server.mjs
apps/web/playwright.config.ts
docs/agent-dispatch/frontend/sprint-01/agent-fenn-decisions-test-e2e-completion.md
```

## Verification
```
$ pnpm --filter @avel/web exec playwright test      (3 runs: 6 failed, assertion above)
$ pnpm --filter "@avel/web..." build
  vite: Could not resolve entry for router entry: router in apps/web/src   -> Failed (expected: Ghost's router.tsx isn't built)
$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
  same error from vite.resolveConfig                                        -> Failed (expected)
$ pnpm lint
  Checked 160 files in 89ms. No fixes applied.                              -> clean
$ pnpm --filter @avel/web test
  Test Files 7 failed (7); Tests 85 failed (85)                             -> w0-data's locked tests, failing first
$ git diff --name-only main...HEAD
  the five paths above, all in Part 5
```
