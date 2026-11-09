# Frontend sprint-02: The shell layout from the design library v1.9: rounded canvas, sidebar with groups, projects and collapse, header, tab bar; All projects, Progress, Clients and Settings; the approval page and kit on v1.9

Step 1 · lead ZERO · rendered by `scripts/render.py` from `plan.toml`.

## Goals

- Every screen sits in v1.9's shell: the rounded canvas and 264px sidebar at 1024px and wider (64px collapsed, remembered), the sheet below, the phone tab bar at 760px and narrower, focus mode (shell-layout.md sections 1 to 3)
- The nav is built from the routes that exist, in the brief's groups, with the projects from route 19 and their waiting counts from route 52 (section 4)
- All projects, Progress, Clients and Settings are real pages: ScreenHeader, content, and an empty state (section 5)
- The kit, the approval page and the styles follow v1.9 (kit-v1.9.md)

## Done when

1. SH-01 to SH-14 pass (unit, no SH-08), and SH-20 to SH-25 pass on the phone, 900 and desk projects.
2. UC-29 to UC-32 pass on the shell, and the locked tests pass.
3. Nothing moves at hydration (SH-24), and layout shift is under 0.02 by shell-layout.md section 8.
4. / passes procedures rule 7's size check, and axe finds nothing on any built route at 1280 and 390.

## Sources

- `docs/ui-contracts/shell-layout.md`
- `docs/ui-contracts/kit-v1.9.md`
- `docs/ui-contracts/decisions-approval-page.md`
- `docs/design/AVEL Shell Layout brief v1.9.md`
- `docs/design/AVEL Enclosure Grid · Design library v1.9.html`
- `docs/design/AVEL Web App — Frontend Map v0.6.md`
- `docs/agent-dispatch/avel/procedures.md`
- `docs/agent-dispatch/frontend/sprint-02/decisions.md`

## Dispatches

| Task doc | Agent | Role | Module | Starts |
| --- | --- | --- | --- | --- |
| [`agent-brennan-layout-uic-review-spec`](agent-brennan-layout-uic-review-spec.md) | BRENNAN | review-spec | layout-uic | at once |
| [`agent-fenn-shell-test-unit`](agent-fenn-shell-test-unit.md) | FENN | test-unit | shell | first; after `agent-brennan-layout-uic-review-spec` is merged into main |
| [`agent-fenn-shell-test-e2e`](agent-fenn-shell-test-e2e.md) | FENN | test-e2e | shell | first; after `agent-brennan-layout-uic-review-spec` is merged into main |
| [`agent-ghost-mock-build`](agent-ghost-mock-build.md) | GHOST | build | mock | at once (no test dispatch in this module); after `agent-brennan-layout-uic-review-spec` is merged into main |
| [`agent-fantem-shell-kit-build`](agent-fantem-shell-kit-build.md) | FANTEM | build | shell-kit | at once (no test dispatch in this module); after `agent-fenn-shell-test-unit`, `agent-fenn-shell-test-e2e` is merged into main |
| [`agent-nemi-shell-styles-build`](agent-nemi-shell-styles-build.md) | NEMI | build | shell-styles | at once (no test dispatch in this module); after `agent-fenn-shell-test-unit` is merged into main |
| [`agent-zero-shell-kit-review-frontend`](agent-zero-shell-kit-review-frontend.md) | ZERO | review-frontend | shell-kit | once `agent-fantem-shell-kit-build` has its completion report, checked out at its result commit |
| [`agent-leon-missions-build`](agent-leon-missions-build.md) | LEON | build | missions | at once (no test dispatch in this module); after `agent-fantem-shell-kit-build`, `agent-ghost-mock-build` is merged into main |
| [`agent-ghost-clients-build`](agent-ghost-clients-build.md) | GHOST | build | clients | at once (no test dispatch in this module); after `agent-fantem-shell-kit-build`, `agent-ghost-mock-build` is merged into main |
| [`agent-zero-missions-review-frontend`](agent-zero-missions-review-frontend.md) | ZERO | review-frontend | missions | once `agent-leon-missions-build` has its completion report, checked out at its result commit |
| [`agent-zero-clients-review-frontend`](agent-zero-clients-review-frontend.md) | ZERO | review-frontend | clients | once `agent-ghost-clients-build` has its completion report, checked out at its result commit |
| [`agent-leon-system-build`](agent-leon-system-build.md) | LEON | build | system | at once (no test dispatch in this module); after `agent-leon-missions-build`, `agent-ghost-clients-build`, `agent-nemi-shell-styles-build` is merged into main |
| [`agent-ghost-decisions-build`](agent-ghost-decisions-build.md) | GHOST | build | decisions | at once (no test dispatch in this module); after `agent-fantem-shell-kit-build`, `agent-ghost-clients-build` is merged into main |
| [`agent-zero-system-review-frontend`](agent-zero-system-review-frontend.md) | ZERO | review-frontend | system | once `agent-leon-system-build` has its completion report, checked out at its result commit |
| [`agent-zero-decisions-review-frontend`](agent-zero-decisions-review-frontend.md) | ZERO | review-frontend | decisions | once `agent-ghost-decisions-build` has its completion report, checked out at its result commit |
| [`agent-leah-shell-review-a11y-perf`](agent-leah-shell-review-a11y-perf.md) | LEAH | review-a11y-perf | shell | at once; after `agent-leon-system-build`, `agent-ghost-decisions-build` is merged into main |

## Territory map

| Paths | Owner |
| --- | --- |
| `apps/web/test/**` | FENN (test-unit) |
| `apps/web/e2e/**` | FENN (test-e2e) |
| `apps/web/playwright.config.ts` | FENN (test-e2e) |
| `packages/contract-mock/**` | GHOST (build) |
| `apps/web/src/kit/**` | FANTEM (build) |
| `apps/web/src/styles/**` | NEMI (build) |
| `apps/web/src/modules/missions/**` | LEON (build) |
| `apps/web/src/modules/clients/**` | GHOST (build) |
| `apps/web/src/modules/system/**` | LEON (build) |
| `apps/web/src/routes/**` | LEON (build) |
| `apps/web/src/modules/decisions/**` | GHOST (build) |
| `docs/agent-dispatch/frontend/sprint-02/findings/layout-uic-brennan-*.md` | BRENNAN (findings) |
| `docs/agent-dispatch/frontend/sprint-02/findings/shell-kit-zero-*.md` | ZERO (findings) |
| `docs/agent-dispatch/frontend/sprint-02/findings/missions-zero-*.md` | ZERO (findings) |
| `docs/agent-dispatch/frontend/sprint-02/findings/clients-zero-*.md` | ZERO (findings) |
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
3. `agent-ghost-mock-build`
4. `agent-fantem-shell-kit-build`
5. `agent-nemi-shell-styles-build`
6. `agent-leon-missions-build`
7. `agent-ghost-clients-build`
8. `agent-leon-system-build`
9. `agent-ghost-decisions-build`

## Closing the sprint

Every module merged, every finding decided, `SPRINT-ASSESSMENT.md` written (`docs/agent-dispatch/templates/sprint-assessment.md`), and every worktree removed.
