status: done
ticket: T-F8

# T-F8 build report (Fantem), attempt 2

## Pre-flight

| Command | Result |
| --- | --- |
| `pnpm --filter @avel/web exec vite build` | passes |
| `pnpm typecheck` | passes |
| `pnpm lint` | passes (2 warnings, both in locked tests) |
| `pnpm --filter @avel/web exec vitest run` | 30 of 30 pass |
| `pnpm --filter @avel/web exec playwright test` | 12 of 12 pass, including the budget, a-script-per-page and slow-4G phone tests |

`/` fetches 223,928 B gzipped (limit 225,280 B). It is over the 200 KB warning, which only warns. The margin is 1.3 KB. The end-to-end screenshots are the test attachments `budget-decisions`, `budget-pages-library` and `budget-phone-slow4g` in `apps/web/test-results`.

## What changed

- `ControlRoomView.jsx`: every page's view loads on demand, except Decisions'. A preloaded view renders with no skeleton flash. The error panel, tab bar, OSA bar, screen spec, live strip, command palette, upload layer and dev dock also load on demand. The page content sits in a Suspense with PageSkeleton.
- `logic.js`: a small registry at the top of the file loads the knowledge, operations, history, crew and palette modules and the OSA and every-kind mocks when first needed. The class is not restructured. A route change waits up to 150 ms for its page's code, so the title and the page change together.
- `operations.js`: OPS_PAGES is imported from `logic.js`.
- `DecisionsPage.jsx`: the empty-state art loads when the queue is empty.
- `TabBar.jsx`: the thinking orb loads when Canon's tab shows it.
- `SOURCE.md`: a line for each changed export file.

## Contract to files

- T-F8-01 (220 KB): all of the above, measured by `e2e/budget.spec.ts`.
- T-F8-02 (a script per page): the on-demand views and values modules.
- T-F8-03 (phone, slow 4G): the TabBar's orb stays out of the first load.
- T-F8-04: the 220 KB and 200 KB limits were already in the locked specs at 032319c. I changed no test.

## Deviations

- I added no new files under `control-room/src`. The locked T-F7-02 test requires every file there to be listed with its hash, so the registry and the lazy views live inside `logic.js` and `ControlRoomView.jsx`.
- Canon and uploads stay in the first load. The Decisions queue reads Canon's checkpoints, and the upload tray, Drive badge and re-render line show on every page. Deferring them would change what Decisions shows.

## Limitations

- The 1.3 KB margin is thin, and any addition to the first load needs a matching cut.
- I did not review the dev-only dock (`SimDock`, `ViewportPreview`) beyond its lazy load.

## Messages received

- OSA, relaying Zero: start from the a1 breakdown, move every other page's view, values and mocks behind dynamic imports, leave Decisions' in place, don't restructure the `logic.js` class, load nothing for another page by networkidle, name each changed export file in SOURCE.md, and stop with needs-cr if 220 KB isn't reachable. Followed. 220 KB was reached, so no stop.
