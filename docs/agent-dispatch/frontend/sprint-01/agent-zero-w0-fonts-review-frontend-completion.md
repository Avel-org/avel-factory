# ZERO: w0-fonts review-frontend, completion report

verdict: PASS

## Summary
Nemi's w0-fonts diff (bedd8f0, report 9e9f51b) does what UI contract section 6 asks and nothing else. It adds one preload for IBM Plex Mono 500, in the same link form as Inter's. There's no Mono 400 preload, no fallback metrics, and nothing else in `__root.tsx` changed. The worktree build is red, but that comes from main (Ghost's `src/router.tsx` isn't merged), not from this diff. A scratchpad build with a stub router shows both preloads in the SSR HTML of `/`, and their URLs are the same ones the `@font-face` rules load. No findings.

## Pre-flight
- **Part 2 files, all read:**
  - `.claude/agents/zero.md`
  - `codebase-analysis.md`
  - `docs/ui-contracts/decisions-approval-page.md`: sections 0, 6 (the `__root.tsx` bullets in full) and 8
  - `docs/design/CR-W2 Pending decisions.md`: skimmed, nothing about fonts
  - `decisions.md`: 2026-11-07 "Fonts" and "w0-fonts" in full
  - Frontend Map v0.6: line 289 and the performance budgets around it
  - design library v1.1: the three `@font-face` rules (lines 11 to 15), `--av-font-mono` (line 402), and `font: 500 … var(--av-font-mono)` uses
  - `Step 0 and Step 1 plan.md`: skimmed, nothing about fonts
  - this task doc
- **Zero's Read first list:** `API and data reference.md` and `CR-16 Dispatch package contract.md` exist. Neither bears on one head link, so I only skimmed them.
- **Branch:** `frontend/sprint-01/agent-zero-w0-fonts-review-frontend-a1`, at 9e9f51b. `AVEL_BASE` = 7904002.
- **Part 7 commands:** all available after `pnpm install --frozen-lockfile`, because the worktree had no `node_modules`. Build, typecheck and test fail on the missing router entry, which is on main too. See Verification.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZERO-01 | DONE: PASS, no findings | this report |

## Findings
none

## Contract to files
Each check in ZERO-01, against `apps/web/src/routes/__root.tsx` at 9e9f51b:
- **One added preload for IBM Plex Mono 500:**
  - line 7 imports `../styles/fonts/ibm-plex-mono-500.woff2?url`, which exists (`apps/web/src/styles/fonts/`);
  - lines 51 to 57 add the link, right after Inter's;
  - `git diff --stat` shows 8 insertions and 0 deletions in this file.
- **In Inter's link form:** lines 51 to 57 have the same keys and values as Inter's at lines 44 to 50 (`rel: "preload"`, `as: "font"`, `type: "font/woff2"`, `crossOrigin: "anonymous"`). Only `href` differs.
- **No Mono 400 preload:** the diff doesn't import `ibm-plex-mono-400`. The rendered HTML (below) has exactly two font preloads.
- **No fallback metrics:** the diff has no `size-adjust`, `ascent-override` or `@font-face` change. `fonts.css` isn't in the diff. This follows section 6 and Decisions, "Fonts".
- **Nothing else in `__root.tsx` changed:** the diff has only the two hunks above.
- **Nothing outside the territory:** `git diff --name-only main...HEAD` lists `apps/web/src/routes/__root.tsx` and Nemi's completion report. Those are exactly the two paths in Nemi's Part 5. Neither path is in `locks.md`.
- **The preloads reach the SSR HTML of `/`, and they aren't wasted:** I checked this in a scratchpad copy outside the worktree, with a stub `src/router.tsx` and a stub `index.tsx`. Neither stub was written in the worktree. I ran `vite build`, then rendered `/` with `dist/server/server.js`:
  ```
  200
  <link rel="stylesheet" href="/assets/app-C8r0pGhX.css" data-precedence="default"/>
  ...
  <link rel="preload" href="/assets/inter-variable-Dx4kXJAl.woff2" as="font" type="font/woff2" crossorigin="anonymous"/>
  <link rel="preload" href="/assets/ibm-plex-mono-500-DSY6xOcd.woff2" as="font" type="font/woff2" crossorigin="anonymous"/>
  $ grep -o 'url([^)]*woff2)' dist/client/assets/*.css
  url(/assets/inter-variable-Dx4kXJAl.woff2)
  url(/assets/ibm-plex-mono-400-DMJ8VG8y.woff2)
  url(/assets/ibm-plex-mono-500-DSY6xOcd.woff2)
  ```
  The preload's href is the same hashed URL the `@font-face` rule loads, so the file downloads only once.
- **Types:** in the same copy, `tsc -p tsconfig.json` reports one error, `vite.config.ts(60,53)`: `@avel/contract-mock` isn't found, which is Ghost's pending package. `__root.tsx` has no errors.

## Deviations
- I ran `pnpm install --frozen-lockfile` in the worktree, because it had no `node_modules`. This writes only ignored files: `git status` stays clean.
- The task's Expected says "builds", and the worktree build doesn't. I still give PASS, because the failure is on main as well (`Could not resolve entry for router entry: router`), which INT accepted (decisions.md, 2026-11-07, "Merge order"). The diff itself builds in the scratchpad copy with a stub router.

## Limitations
- The SSR check ran on a stub router and a stub index route, not on Ghost's and Leon's real ones. The head links come from the root route alone, so the result should hold once those land. A re-run after w0-data merges would confirm it.
- Whether the Mono 500 preload is actually used on first paint depends on the HashChip being visible on `/`. That's for Leah's review to measure.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Leah:** `/` now has two font preloads, and they match the `@font-face` URLs. In the rendered `<head>`, the stylesheet link comes before both preloads. That's how React 19 orders a `precedence` stylesheet, and it's not from this diff. Note it if it matters for your measurement.

## Files changed
```
apps/web/src/routes/__root.tsx                                                 (Nemi, under review)
docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-fonts-build-completion.md (Nemi, under review)
docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-fonts-review-frontend-completion.md (this report)
```

## Verification
```
$ pnpm --filter @avel/web build && git diff "$(git merge-base main HEAD)"..HEAD --stat   # ZERO-01's verify
apps/web build: Error: Could not resolve entry for router entry: router in .../apps/web/src
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @avel/web@0.0.0 build: `vite build`      (exit 1; on main too)
$ git diff 7904002..9e9f51b --stat
 apps/web/src/routes/__root.tsx                     |  8 ++
 .../agent-nemi-w0-fonts-build-completion.md        | 96 ++++++++++++++++++++++
 2 files changed, 104 insertions(+)

$ pnpm --filter "@avel/web..." build
packages/contract build$ tsc -p tsconfig.json   (ok)
apps/web build: Error: Could not resolve entry for router entry: router in .../apps/web/src
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @avel/web@0.0.0 build: `vite build`
exit 1

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
No projects matched the filters "@avel/contract-mock" in ".../frontend-sprint-01-agent-zero-w0-fonts-review-frontend-a1"
apps/web typecheck: Error: Could not resolve entry for router entry: router in .../apps/web/src
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @avel/web@0.0.0 typecheck
exit 1

$ pnpm lint
> biome check .
Checked 136 files in 73ms. No fixes applied.
exit 0

$ pnpm --filter @avel/web test
Startup Error: Could not resolve entry for router entry: router in .../apps/web/src
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @avel/web@0.0.0 test: `vitest run`
exit 1

$ git diff --name-only main...HEAD
apps/web/src/routes/__root.tsx
docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-fonts-build-completion.md
(plus this report, committed last)
```
