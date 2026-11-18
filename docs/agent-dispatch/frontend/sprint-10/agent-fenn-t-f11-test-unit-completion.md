status: done
ticket: T-F11

# T-F11 · tests · Fenn: completion report

## Pre-flight
| Command | Result |
| --- | --- |
| `pnpm build` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 after `biome check --write` on my test file; 2 warnings remain, both in existing `apps/web/e2e` code (`innerText`), not mine |
| `pnpm --filter @avel/repo-checks test && pnpm --filter @avel/web exec playwright test` | repo-checks **fails** (4 failed, 30 passed), so the `&&` stops before Playwright. This is the expected red state |
| `pnpm --filter @avel/repo-checks test` | 4 failed (my new tests), 30 passed |
| `pnpm build` | exit 0 |
| `pnpm --filter @avel/web exec playwright test` | 201 passed (12.2 min), exit 0. The spec printed `budget warning: 225165 B gzipped (over 204800)`; this is the local figure, and CI's figure is the one that counts |

## Failing first
Run on the start commit (`ci.yml` has only the `ci` job):
```
FAIL T-F11-01 AssertionError: ci.yml needs one job named "web e2e (Playwright)": expected [] to have a length of 1 but got +0
FAIL T-F11-02 AssertionError: ci.yml needs one job named "web e2e (Playwright)": expected [] to have a length of 1 but got +0
FAIL T-F11-03 AssertionError: ci.yml needs one job named "web e2e (Playwright)": expected [] to have a length of 1 but got +0
FAIL T-F11-04 AssertionError: expected 1 to be greater than or equal to 2   (jobs().size: the new job must sit beside ci)
Tests  4 failed (4)
```
To check the tests can pass, I temporarily appended a job to `ci.yml` that follows the lead's notes. All 4 passed. I then reverted it with `git checkout`, so no workflow change is committed.

## What changed
- `tools/repo-checks/test/web-e2e-ci.test.ts` (new): reads `ci.yml` as text, comments dropped, and splits it into jobs.
- `docs/agent-dispatch/frontend/sprint-10/agent-fenn-t-f11-test-unit-completion.md`: this report.

## Contract to files
- T-F11-01: a job named "web e2e (Playwright)" with checkout, pnpm/action-setup, setup-node 22 with the pnpm cache, and no services. Its steps run in this order: `pnpm install --frozen-lockfile`, `pnpm build`, `playwright install --with-deps chromium`, `playwright test`.
- T-F11-02: `on` has `pull_request` and `push` with `branches: [main]`. The job has no job-level `if:`, has `timeout-minutes: 30`, and contains no `continue-on-error`, no `||` and no `retries`/`--retries`.
- T-F11-03: an `actions/upload-artifact` step with `if: always()` and `path: apps/web/test-results`, placed after the test step.
- T-F11-04: the `ci` job's name, timeout 20, Postgres service, `DATABASE_URL` and run steps are exactly as today (install, build, typecheck, check:effect, lint, test), with no Playwright in it. The new job must be a separate job.

## Deviations
- T-F11-04 passes on every assertion about the `ci` job today. It fails on the start commit only through its "a second job exists beside ci" assertion. An unchanged job can't fail on its own, so this is by design.
- I didn't start Postgres (the doc's step 2). These tests read a text file and the e2e suite uses contract-mock.
- Playwright e2e specs weren't written: the ticket's four tasks are all unit tests of `ci.yml`, in the repo-checks path the territory names.

## Limitations
- The text parser assumes the current style: two-space job keys, `- ` steps at six spaces, and `run:` on one line. A step written in another form (for example a multi-line `run: |`) won't match.
- The upload step's `name:` and the artifact `retention-days` aren't pinned.
- Whether the job is a required check is branch protection, which **Javaris sets on GitHub** (H4). Nothing here can enforce it.
- The CI budget figure isn't known yet. Locally it is 225,165 B gzipped. If CI measures over 220 KB (225,280 B), the build stops with `needs-cr` (CR-W29 decision 6). The builder copies CI's number into the report and PR text.

## Lock line
- T-F11: tools/repo-checks/test/web-e2e-ci.test.ts @ <branch tip, lead fills in after the report commit>

## Messages received
None.
