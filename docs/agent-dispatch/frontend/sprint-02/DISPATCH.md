# Frontend sprint-02: The app shell: rail, sheet, tab bar, screen header and focus mode, with every L1 screen in the nav, and the approval page on it

Step 1 · lead ZERO · rendered by `scripts/render.py` from `plan.toml`.

## Goals

- Every screen sits in DL's shell: the rail at 1024px and over, the navigation sheet below, the phone tab bar at 760px and under, the screen header, and focus mode (app-shell.md sections 1 and 2)
- The nav is complete from day one: each entry in app-shell.md section 3 is a real route, with a stub screen until its wave, and Decisions carries the waiting badge in the server's HTML
- The approval page on the shell, with its revision 15: no layout switch at hydration (D16, layout=desk), the dialog through loadReasonDialog, ScreenHeader (app-shell.md section 4)
- The size-matched font fallbacks, by one method for both files (app-shell.md section 5)

## Done when

1. At 1280, 900 and 390 the shell draws as app-shell.md section 1 gives it, and the sheet, the tab bar, focus mode and the skip link behave as SH-03 to SH-05 and SH-20 to SH-23 check.
2. The nav, tabs, badge, crumb, document title and stub screens are section 3's, on the contract mock (SH-08 to SH-11).
3. Nothing in the shell or on / moves at hydration (SH-24, UC-32), and layout shift is under 0.02 by app-shell.md section 6's cases.
4. UC-29 to UC-31 still pass on the shell, and /'s first load is at or under 150 kB gzip of JavaScript (app-shell.md section 6).
5. Every locked test passes, and axe finds nothing on any route at 1280 and 390.

## Sources

- `docs/ui-contracts/app-shell.md`
- `docs/ui-contracts/decisions-approval-page.md`
- `docs/agent-dispatch/frontend/sprint-02/decisions.md`
- `docs/design/AVEL Web App — Frontend Map v0.6.md`
- `docs/design/AVEL Enclosure Grid · Design library v1.1.html`

## Dispatches

| Task doc | Agent | Role | Module | Starts |
| --- | --- | --- | --- | --- |
| [`agent-brennan-shell-uic-review-spec`](agent-brennan-shell-uic-review-spec.md) | BRENNAN | review-spec | shell-uic | at once |
| [`agent-fenn-shell-test-unit`](agent-fenn-shell-test-unit.md) | FENN | test-unit | shell | first; after `agent-brennan-shell-uic-review-spec` is merged into main |
| [`agent-fenn-shell-test-e2e`](agent-fenn-shell-test-e2e.md) | FENN | test-e2e | shell | first; after `agent-brennan-shell-uic-review-spec` is merged into main |
| [`agent-nemi-shell-fonts-build`](agent-nemi-shell-fonts-build.md) | NEMI | build | shell-fonts | at once (no test dispatch in this module); after `agent-brennan-shell-uic-review-spec` is merged into main |
| [`agent-fantem-shell-kit-build`](agent-fantem-shell-kit-build.md) | FANTEM | build | shell-kit | at once (no test dispatch in this module); after `agent-fenn-shell-test-unit`, `agent-fenn-shell-test-e2e` is merged into main |
| [`agent-leon-system-build`](agent-leon-system-build.md) | LEON | build | system | at once (no test dispatch in this module); after `agent-fantem-shell-kit-build`, `agent-fenn-shell-test-unit`, `agent-fenn-shell-test-e2e` is merged into main |
| [`agent-ghost-decisions-build`](agent-ghost-decisions-build.md) | GHOST | build | decisions | at once (no test dispatch in this module); after `agent-fantem-shell-kit-build`, `agent-fenn-shell-test-unit`, `agent-fenn-shell-test-e2e` is merged into main |
| [`agent-zero-shell-kit-review-frontend`](agent-zero-shell-kit-review-frontend.md) | ZERO | review-frontend | shell-kit | once `agent-fantem-shell-kit-build` has its completion report, checked out at its result commit |
| [`agent-zero-system-review-frontend`](agent-zero-system-review-frontend.md) | ZERO | review-frontend | system | once `agent-leon-system-build` has its completion report, checked out at its result commit |
| [`agent-zero-decisions-review-frontend`](agent-zero-decisions-review-frontend.md) | ZERO | review-frontend | decisions | once `agent-ghost-decisions-build` has its completion report, checked out at its result commit |
| [`agent-leah-shell-review-a11y-perf`](agent-leah-shell-review-a11y-perf.md) | LEAH | review-a11y-perf | shell | at once; after `agent-nemi-shell-fonts-build`, `agent-fantem-shell-kit-build`, `agent-leon-system-build`, `agent-ghost-decisions-build` is merged into main |

## Territory map

| Paths | Owner |
| --- | --- |
| `apps/web/test/**` | FENN (test-unit) |
| `apps/web/e2e/**` | FENN (test-e2e) |
| `apps/web/playwright.config.ts` | FENN (test-e2e) |
| `apps/web/src/styles/**` | NEMI (build) |
| `apps/web/src/kit/**` | FANTEM (build) |
| `apps/web/src/modules/system/**` | LEON (build) |
| `apps/web/src/routes/**` | LEON (build) |
| `apps/web/src/modules/decisions/**` | GHOST (build) |
| `docs/agent-dispatch/frontend/sprint-02/findings/shell-uic-brennan-*.md` | BRENNAN (findings) |
| `docs/agent-dispatch/frontend/sprint-02/findings/shell-kit-zero-*.md` | ZERO (findings) |
| `docs/agent-dispatch/frontend/sprint-02/findings/system-zero-*.md` | ZERO (findings) |
| `docs/agent-dispatch/frontend/sprint-02/findings/decisions-zero-*.md` | ZERO (findings) |
| `docs/agent-dispatch/frontend/sprint-02/findings/shell-leah-*.md` | LEAH (findings) |

## Order

Nothing waits for a wave: each dispatch starts when its own rule above is met (the factory's scheduler rule). `scripts/dispatch.sh frontend/sprint-02` starts everything that's ready, up to the 6 slots, and says what the rest are waiting for.

1. Contracts and test writers start first. Brennan reviews each contract.
2. The operator locks each module's tests in `locks.md` once they're merged (`scripts/check_locks.py`).
3. Builders start once their module's tests are locked.
4. Reviewers start once the build has its report, checked out at the build's result commit.
5. The operator merges one module at a time, in the order below, with the full tests after each (the merge board, `p` in INT, shows what's READY).

## Merge order

1. `agent-fenn-shell-test-unit`
2. `agent-fenn-shell-test-e2e`
3. `agent-nemi-shell-fonts-build`
4. `agent-fantem-shell-kit-build`
5. `agent-leon-system-build`
6. `agent-ghost-decisions-build`

## Closing the sprint

Every module merged, every finding decided, `SPRINT-ASSESSMENT.md` written (`docs/agent-dispatch/templates/sprint-assessment.md`), and every worktree removed.
