status: needs-cr
ticket: T-F8

# T-F8 build report (Fantem)

I stopped before changing any code. The plan's stop rule applies: the first load can't reach 150 KB by moving imports behind dynamic imports and moving each page's values out. `logic.js` is the cause.

## Pre-flight

Only the baseline build was run: `pnpm install --frozen-lockfile`, `pnpm -r --filter "./packages/*" run build`, then `vite build`. It succeeds and reproduces T-F7's number. The other Part 7 commands were not run, because there is no change to verify.

## First load today (gzipped, from the production build)

| Chunk | gzip |
| --- | --- |
| `index` (React, React DOM, TanStack: the framework) | 111.8 KB |
| `main` (the control room's code) | 227.9 KB |
| `world` (sample world JSON) | 9.0 KB |
| `icons` | 6.5 KB |
| `routes` | 0.3 KB |
| Total | about 355.5 KB (354,051 B measured in T-F7) |

The framework chunk is already 111.8 KB of the 150 KB limit. That leaves about 38 KB for everything else.

## What / needs at the least, by module

These are estimates: each file minified with esbuild and gzipped on its own. Decisions-page values are included, since Decisions stays in the first load.

| Module | gzip |
| --- | --- |
| `app/logic.js` (one 5,400-line class that holds every page's vals) | about 46.8 KB |
| `shell/*` (sidebar, topbar, masthead, palette) | about 7.7 KB |
| `pages/decisions/DecisionsPage.jsx` | about 4.5 KB |
| `app/decisions.js`, `palette.js`, `audience.js`, `relay.js` | about 7.9 KB |
| `kit/*` and `lib/*` that shell and Decisions use | up to about 19 KB |
| Decisions' mocks: pending-decisions, osa, contract-mock-decisions, evidence-details | about 11.8 KB |
| `world` and `icons` | 15.5 KB |
| Framework (`index`) and `routes` | 112.1 KB |
| **Floor, even with every page, values module and mock moved out** | **about 205 to 215 KB** |

`logic.js` alone (46.8 KB) is larger than the room left after the framework (about 38 KB). Moving the six values modules and their mocks behind dynamic imports saves roughly 130 KB. That brings `/` to about 210 KB, still 60 KB over.

## What is needed

The work is to split `logic.js`'s own per-page code into per-page modules: the vals computed for knowledge, ops, canon, uploads, crew, history, roster and templates pages, plus the shared state it reads. That is "restructuring logic.js beyond moving imports behind dynamic imports", which the task doc says to stop for.

Even after that split, the floor is still over 150 KB unless more is deferred. Candidates for a CR to decide:
- Defer the Decisions mocks (`osa.json`, `contract-mock-decisions.json`: about 6 KB) until `?sim=every` or the OSA flag is on.
- Load `world.json` in slices.
- Move the command palette and sheets (about 3 KB) out of the first load.

Even with all three, the budget is tight: about 205 KB minus about 9 KB, which is still far over. A realistic CR options list:
1. Raise the limit for `/` (CR-W29 decision 6 and E16).
2. Fund a real split of `logic.js` into per-page logic classes, with its own test plan.

## What changed

Nothing in code. The only change is this report.

## Contract to files

- T-F8-01 (150 KB): not met, blocked as above.
- T-F8-02 (a script per page): not started. It depends on the same split.
- T-F8-03 (phone, slow 4G): not started, for the same reason.

## Deviations

I did not follow the task doc's chains. The stop rule applied before the first change.

## Limitations

The numbers above are per-file esbuild estimates, not a measured build of the restructure. They are accurate enough for the decision (the gap is 55 KB or more). The node binary was not on PATH, so I used `~/.nvm/versions/node/v24.22.2/bin`. The worktree had no `node_modules`, so I ran `pnpm install --frozen-lockfile`; no dependency or lockfile changed.

## Messages received

- OSA, relaying Zero: don't prefetch other pages' chunks after load; name every changed export file in SOURCE.md; if lazy imports plus per-page values can't reach 150 KB, stop with `needs-cr` and give the first-load breakdown by module. Followed. The first two weren't reached, and the third is this report.
