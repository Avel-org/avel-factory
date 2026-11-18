status: done
ticket: T-F9

## Pre-flight

E2E passed locally (CI doesn't run e2e until T-F11). Command: `pnpm --filter @avel/web exec playwright test` run from the repo root, 201 passed (9.0 min), including the budget specs, which hold the 220 KB gzipped limit. I did not record a separate byte figure; the change removes one attribute, so no JavaScript size changes.

| Command | Result |
| --- | --- |
| `pnpm --filter @avel/web exec vite build` | passed |
| `pnpm typecheck` | passed, after `pnpm --filter @avel/db build` (this fresh worktree had no dist; the first run failed on `@avel/db` not found) |
| `pnpm lint` | passed, 2 warnings (innerText in a locked test) |
| `pnpm --filter @avel/web exec vitest run` | 6 files, 30 tests passed |
| `pnpm --filter @avel/web exec playwright test` | before the fix: 197 passed, 4 failed (roster axe, 2 views x 2 themes); after: 201 passed |

Setup: I ran `pnpm --filter @avel/contract build` (gitignored dist) because `vite.config.ts` could not resolve `@avel/contract`. `scripts/pg-local.sh` does not exist in this worktree, and no test needs a database.

## What changed

- `apps/web/control-room/src/pages/roster/AgentParts.jsx`: the agent card link drops its `aria-label` ("name, kind, status"). That label did not contain the card's visible text, so axe flagged `label-content-name-mismatch` (WCAG 2.5.3). The name now comes from the visible content.
- `apps/web/control-room/SOURCE.md`: a line for that file under "Changed for apps/web". Its listed SHA-256 is unchanged.

## Contract to files

T-F9-02 (axe, no violation on every route, light and night, 1280 and 390): AgentParts.jsx. T-F9-01 and T-F9-03 already passed and needed no change.

## Deviations

None.

## Limitations

- The budget figure is "the budget spec passed", not a measured number.
- Verified in the dev server only, plus a production build that compiled.

## Messages received

- OSA, relaying Zero (CR-37): fix the roster card links' accessible names, note it in SOURCE.md, change nothing else, and say in the report that e2e passed locally, with the command and the budget figure. Followed; it narrows the task doc. The budget is stated above, with the limit that no separate figure was measured.
