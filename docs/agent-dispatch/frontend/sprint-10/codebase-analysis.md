# Codebase analysis: frontend/sprint-10

<!-- Rendered from plan.toml [analysis]. Never edit this file. -->

## Stack

GitHub Actions on ubuntu-24.04, pnpm 10 via pnpm/action-setup, Node 22 via actions/setup-node. apps/web's Playwright 1.64 with axe-core: playwright.config.ts starts two vite dev servers itself (contract-mock and bare), runs one worker, and records a screenshot and a video per test into apps/web/test-results; the budget specs build for production and start vite preview themselves

## Layout

.github/workflows/ci.yml (the CI job), locks.yml and docs.yml (untouched). tools/repo-checks/test/workflow.test.ts already checks locks.yml as text; the new test sits beside it

## Conventions

- AGENTS.md and Build rules E4; workflow files have no linter, so the tests read them as text, as workflow.test.ts does
- F3: no retries to get a green (H5), so the job sets no Playwright retries and the config isn't changed

## Notes

- The e2e suite needs no Postgres: apps/web runs against contract-mock
- The suite runs about 10 to 15 minutes today (T-F9's every-screen check is about 8.5 on its own)

## Commands

```sh
pnpm build  # build
pnpm typecheck  # typecheck
pnpm lint  # lint
pnpm --filter @avel/repo-checks test && pnpm --filter @avel/web exec playwright test  # test
```
