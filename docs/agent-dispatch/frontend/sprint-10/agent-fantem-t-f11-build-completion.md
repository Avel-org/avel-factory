status: done
ticket: T-F11

## Pre-flight
- `pnpm build`: passed
- `pnpm typecheck`: passed
- `pnpm lint`: passed (biome: 213 files, 2 warnings, no fixes)
- `pnpm --filter @avel/repo-checks test`: 8 files, 34 tests passed
- `pnpm --filter @avel/web exec playwright test`: 201 passed (9.2m)
- Budget line locally: `budget warning: 225164 B gzipped (over 204800)`

## What changed
- `.github/workflows/ci.yml`: new job `e2e`, named "web e2e (Playwright)".

## Contract to files
- T-F11-01: checkout, pnpm setup, node 22 with pnpm cache, install --frozen-lockfile, build, playwright install --with-deps chromium, playwright test. No services.
- T-F11-02: runs on the existing triggers; timeout 30; no retries, continue-on-error or `|| true`.
- T-F11-03: upload-artifact@v4 of `apps/web/test-results` under `if: always()`, after the tests.
- T-F11-04: the `ci` job is untouched.

## Deviations
None. The budget figure CI measures is NOT yet known: I can't push, so the job hasn't run on GitHub. Locally it is 225,164 B gzipped (OSA quoted 225,165 B). The first CI run's "budget warning" line from the "web e2e (Playwright)" job must be copied into the PR text as a number in bytes. If CI reports over 220 KB (225,280 B), per CR-W29 decision 6 that is needs-cr.

## Limitations
- Making "web e2e (Playwright)" a required check is a branch-protection setting. Javaris sets it on GitHub (H4).
- The job hasn't run on GitHub; a port or browser-dependency difference there is possible.

## Messages received
- OSA, relaying Zero: give CI's "/" budget figure as a number in bytes from the new job's "budget warning" line, in the report and the PR text. Followed in part: the local figure (225,164 B) is given, and the CI figure is flagged as still owed because I can't push. It doesn't widen the ticket.
