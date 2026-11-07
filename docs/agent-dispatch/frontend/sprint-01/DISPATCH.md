# Frontend sprint-01: The minimal approval page on the contract mock, with the thin W0 slice under it

Step 1 · lead ZERO · rendered by `scripts/render.py` from `plan.toml`.

## Goals

- apps/web: the TanStack Start app with the design library's tokens, the theme cookie shell and its dependencies (W0)
- The data core (oRPC client, Idempotency-Key and X-Request-Id, toUiError, query defaults) and the contract mock for routes 52 to 54 serving CR-W2's rows (W0)
- The kit pieces the page needs, ported from the design library: DecisionTag, ReasonDialog, ErrorPanel, WidgetState, Button, Tag, Icon, StatusGlyph, HashChip (W0)
- The decisions module at /: what's waiting, approve and reject with a reason bound to proposals.version, and every error and stale state (Step 1 item 13)

## Done when

1. The web app builds, typechecks and lints, and its token stylesheet carries every token in the design library's token section with the same value (533 declarations).
2. On the contract mock, a seeded open proposal shows on / as waiting, with its title, client name, age, evidence, consequence and 'Binds to Version N'; a factory PR shows read-only with its GitHub link; a proposal whose options don't parse shows Locked; an empty list shows 'Nothing needs you.' (UC-11, UC-12).
3. Approving or rejecting asks for a reason first, then sends route 54 for that proposalId (in the path) exactly the body { version as shown, the row's choice, reason } with one Idempotency-Key, which a retry reuses; the row leaves the list after the 201 (UC-13, UC-14, UC-19, UC-21).
4. A stale version opens the stale state with the current version and never re-sends; 'Review version N' shows the new version, which can then be decided (UC-15, UC-16, UC-30).
5. 422, 404, 429, 400, 401, 403, 409, network and 5xx, IDEMPOTENCY_KEY_REUSED and IDEMPOTENCY_IN_PROGRESS each show the state the UI contract gives, with the request ID; the list's loading, error, unreadable and paging states too (UC-17 to UC-27).
6. A response whose X-Contract-Version differs from the version the web was built with shows the reload banner (UC-07, UC-28).
7. The flow works end to end at 390px and 1280px on the mock, with SSR rows on first paint (UC-29 to UC-31).

## Sources

- `docs/ui-contracts/decisions-approval-page.md`
- `docs/design/CR-W2 Pending decisions.md`
- `docs/agent-dispatch/frontend/sprint-01/decisions.md`
- `docs/design/AVEL Web App — Frontend Map v0.6.md`
- `docs/design/AVEL Enclosure Grid · Design library v1.1.html`
- `docs/design/Step 0 and Step 1 plan.md`

## Dispatches

| Task doc | Agent | Role | Module | Starts |
| --- | --- | --- | --- | --- |
| [`agent-brennan-approvals-uic-review-spec`](agent-brennan-approvals-uic-review-spec.md) | BRENNAN | review-spec | approvals-uic | at once |
| [`agent-nemi-w0-app-build`](agent-nemi-w0-app-build.md) | NEMI | build | w0-app | at once (no test dispatch in this module); after `agent-brennan-approvals-uic-review-spec`, `backend/sprint-00/agent-axis-m1-contract-api-contract` is merged into main |
| [`agent-nemi-w0-fonts-build`](agent-nemi-w0-fonts-build.md) | NEMI | build | w0-fonts | at once (no test dispatch in this module); after `agent-nemi-w0-app-build` is merged into main |
| [`agent-zero-w0-fonts-review-frontend`](agent-zero-w0-fonts-review-frontend.md) | ZERO | review-frontend | w0-fonts | once `agent-nemi-w0-fonts-build` has its completion report, checked out at its result commit |
| [`agent-nemi-w0-split-build`](agent-nemi-w0-split-build.md) | NEMI | build | w0-split | at once (no test dispatch in this module); after `agent-nemi-w0-app-build` is merged into main |
| [`agent-zero-w0-split-review-frontend`](agent-zero-w0-split-review-frontend.md) | ZERO | review-frontend | w0-split | once `agent-nemi-w0-split-build` has its completion report, checked out at its result commit |
| [`agent-zero-w0-app-review-frontend`](agent-zero-w0-app-review-frontend.md) | ZERO | review-frontend | w0-app | once `agent-nemi-w0-app-build` has its completion report, checked out at its result commit |
| [`agent-zane-w0-app-review-security`](agent-zane-w0-app-review-security.md) | ZANE | review-security | w0-app | once `agent-nemi-w0-app-build` has its completion report, checked out at its result commit |
| [`agent-brennan-w0-app-review-spec`](agent-brennan-w0-app-review-spec.md) | BRENNAN | review-spec | w0-app | once `agent-nemi-w0-app-build` has its completion report, checked out at its result commit |
| [`agent-fenn-w0-data-test-unit`](agent-fenn-w0-data-test-unit.md) | FENN | test-unit | w0-data | first; after `agent-nemi-w0-app-build`, `backend/sprint-00/agent-axis-m1-contract-api-contract` is merged into main |
| [`agent-ghost-w0-data-build`](agent-ghost-w0-data-build.md) | GHOST | build | w0-data | once `agent-fenn-w0-data-test-unit` is merged and listed in `locks.md`; after `agent-nemi-w0-app-build`, `backend/sprint-00/agent-axis-m1-contract-api-contract` is merged into main |
| [`agent-zero-w0-data-review-frontend`](agent-zero-w0-data-review-frontend.md) | ZERO | review-frontend | w0-data | once `agent-ghost-w0-data-build` has its completion report, checked out at its result commit |
| [`agent-brennan-w0-data-review-spec`](agent-brennan-w0-data-review-spec.md) | BRENNAN | review-spec | w0-data | once `agent-ghost-w0-data-build` has its completion report, checked out at its result commit |
| [`agent-zane-w0-data-review-security`](agent-zane-w0-data-review-security.md) | ZANE | review-security | w0-data | once `agent-ghost-w0-data-build` has its completion report, checked out at its result commit |
| [`agent-fenn-w0-kit-test-unit`](agent-fenn-w0-kit-test-unit.md) | FENN | test-unit | w0-kit | first; after `agent-fenn-w0-data-test-unit` is merged into main |
| [`agent-fantem-w0-kit-build`](agent-fantem-w0-kit-build.md) | FANTEM | build | w0-kit | once `agent-fenn-w0-kit-test-unit` is merged and listed in `locks.md`; after `agent-nemi-w0-app-build` is merged into main |
| [`agent-zero-w0-kit-review-frontend`](agent-zero-w0-kit-review-frontend.md) | ZERO | review-frontend | w0-kit | once `agent-fantem-w0-kit-build` has its completion report, checked out at its result commit |
| [`agent-brennan-w0-kit-review-spec`](agent-brennan-w0-kit-review-spec.md) | BRENNAN | review-spec | w0-kit | once `agent-fantem-w0-kit-build` has its completion report, checked out at its result commit |
| [`agent-fenn-decisions-test-unit`](agent-fenn-decisions-test-unit.md) | FENN | test-unit | decisions | first; after `agent-fenn-w0-data-test-unit` is merged into main |
| [`agent-fenn-decisions-test-e2e`](agent-fenn-decisions-test-e2e.md) | FENN | test-e2e | decisions | first; after `agent-fenn-w0-data-test-unit` is merged into main |
| [`agent-leon-decisions-build`](agent-leon-decisions-build.md) | LEON | build | decisions | once `agent-fenn-decisions-test-unit`, `agent-fenn-decisions-test-e2e` is merged and listed in `locks.md`; after `agent-ghost-w0-data-build`, `agent-fantem-w0-kit-build` is merged into main |
| [`agent-zero-decisions-review-frontend`](agent-zero-decisions-review-frontend.md) | ZERO | review-frontend | decisions | once `agent-leon-decisions-build` has its completion report, checked out at its result commit |
| [`agent-brennan-decisions-review-spec`](agent-brennan-decisions-review-spec.md) | BRENNAN | review-spec | decisions | once `agent-leon-decisions-build` has its completion report, checked out at its result commit |
| [`agent-leah-decisions-review-a11y-perf`](agent-leah-decisions-review-a11y-perf.md) | LEAH | review-a11y-perf | decisions | once `agent-leon-decisions-build` has its completion report, checked out at its result commit; after `agent-nemi-w0-fonts-build` is merged into main |

## Territory map

| Paths | Owner |
| --- | --- |
| `apps/web/{vite.config.ts,tsconfig.json,.gitignore}` | NEMI (build) |
| `apps/web/src/styles/**` | NEMI (build) |
| `apps/web/src/routes/__root.tsx` | NEMI (build) |
| `apps/web/package.json` | NEMI (build) |
| `apps/web/vitest.config.ts` | FENN (test-unit) |
| `apps/web/test/setup/**` | FENN (test-unit) |
| `apps/web/test/data/**` | FENN (test-unit) |
| `apps/web/src/data/**` | GHOST (build) |
| `apps/web/src/lib/**` | GHOST (build) |
| `apps/web/src/router.tsx` | GHOST (build) |
| `packages/contract-mock/**` | GHOST (build) |
| `apps/web/test/kit/**` | FENN (test-unit) |
| `apps/web/src/kit/**` | FANTEM (build) |
| `apps/web/test/modules/decisions/**` | FENN (test-unit) |
| `apps/web/e2e/**` | FENN (test-e2e) |
| `apps/web/playwright.config.ts` | FENN (test-e2e) |
| `apps/web/src/modules/decisions/**` | LEON (build) |
| `apps/web/src/routes/index.tsx` | LEON (build) |
| `docs/agent-dispatch/frontend/sprint-01/findings/approvals-uic-brennan-*.md` | BRENNAN (findings) |
| `docs/agent-dispatch/frontend/sprint-01/findings/w0-fonts-zero-*.md` | ZERO (findings) |
| `docs/agent-dispatch/frontend/sprint-01/findings/w0-split-zero-*.md` | ZERO (findings) |
| `docs/agent-dispatch/frontend/sprint-01/findings/w0-app-zero-*.md` | ZERO (findings) |
| `docs/agent-dispatch/frontend/sprint-01/findings/w0-app-zane-*.md` | ZANE (findings) |
| `docs/agent-dispatch/frontend/sprint-01/findings/w0-app-brennan-*.md` | BRENNAN (findings) |
| `docs/agent-dispatch/frontend/sprint-01/findings/w0-data-zero-*.md` | ZERO (findings) |
| `docs/agent-dispatch/frontend/sprint-01/findings/w0-data-brennan-*.md` | BRENNAN (findings) |
| `docs/agent-dispatch/frontend/sprint-01/findings/w0-data-zane-*.md` | ZANE (findings) |
| `docs/agent-dispatch/frontend/sprint-01/findings/w0-kit-zero-*.md` | ZERO (findings) |
| `docs/agent-dispatch/frontend/sprint-01/findings/w0-kit-brennan-*.md` | BRENNAN (findings) |
| `docs/agent-dispatch/frontend/sprint-01/findings/decisions-zero-*.md` | ZERO (findings) |
| `docs/agent-dispatch/frontend/sprint-01/findings/decisions-brennan-*.md` | BRENNAN (findings) |
| `docs/agent-dispatch/frontend/sprint-01/findings/decisions-leah-*.md` | LEAH (findings) |

## Order

Nothing waits for a wave: each dispatch starts when its own rule above is met (the factory's scheduler rule). `scripts/dispatch.sh frontend/sprint-01` starts everything that's ready, up to the 6 slots, and says what the rest are waiting for.

1. Contracts and test writers start first. Brennan reviews each contract.
2. The operator locks each module's tests in `locks.md` once they're merged (`scripts/check_locks.py`).
3. Builders start once their module's tests are locked.
4. Reviewers start once the build has its report, checked out at the build's result commit.
5. The operator merges one module at a time, in the order below, with the full tests after each (the merge board, `p` in INT, shows what's READY).

## Merge order

1. `agent-nemi-w0-app-build`
2. `agent-fenn-w0-data-test-unit`
3. `agent-fenn-w0-kit-test-unit`
4. `agent-fenn-decisions-test-unit`
5. `agent-fenn-decisions-test-e2e`
6. `agent-nemi-w0-fonts-build`
7. `agent-nemi-w0-split-build`
8. `agent-ghost-w0-data-build`
9. `agent-fantem-w0-kit-build`
10. `agent-leon-decisions-build`

## Closing the sprint

Every module merged, every finding decided, `SPRINT-ASSESSMENT.md` written (`docs/agent-dispatch/templates/sprint-assessment.md`), and every worktree removed.
