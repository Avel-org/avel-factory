# NEMI: w0-fonts build, completion report

verdict: PARTIAL

## Summary
NEMI-01 is written and committed (bedd8f0). `__root.tsx` now preloads IBM Plex Mono 500 beside Inter Variable, in the same link form. There's no Mono 400 preload, no fallback metrics, and nothing else in the file changed. The verify's two greps give `2` and `ibm-plex-mono-500.woff2` only. Its typecheck and build steps fail on this tree, and on main, for the reason w0-app already reported: Ghost's `src/router.tsx` isn't merged yet. So the "both in the built SSR HTML of /" half of Required is **not verified**.

## Pre-flight
- **Part 2 files**, all read (the sections named in items 9 to 11 in full):
  - `.claude/agents/nemi.md`
  - `codebase-analysis.md`
  - `docs/ui-contracts/decisions-approval-page.md`, section 6's `__root.tsx` bullets
  - `docs/design/CR-W2 Pending decisions.md`, skimmed: nothing about fonts
  - `decisions.md`, 2026-11-07 "Fonts" and "w0-fonts"
  - Frontend Map v0.6, line 289
  - the design library v1.1: Plex Mono for machine text; `HashChip` `fontWeight: 500`
  - `Step 0 and Step 1 plan.md`, skimmed: nothing about fonts
  - this task doc
- **Branch:** `frontend/sprint-01/agent-nemi-w0-fonts-build-a1`, started at `7904002` (main).
- **Part 7 commands:** all could be run. Build, typecheck and test fail on a missing dependency (see Limitations). The typecheck filter `@avel/contract-mock` matches no project, because that package doesn't exist yet.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| NEMI-01 | DONE in code. The SSR HTML check wasn't run (Limitations 1) | bedd8f0 |

## Contract to files
- **UI contract section 6, the preload of the first paint's font files (Inter Variable and IBM Plex Mono 500, no Mono 400):** `apps/web/src/routes/__root.tsx`.
  - A new `?url` import of `../styles/fonts/ibm-plex-mono-500.woff2`, named `ibmPlexMono500`.
  - A second `links` entry, right after Inter's: `rel: "preload"`, `as: "font"`, `type: "font/woff2"`, `crossOrigin: "anonymous"`.
- **FM line 289, "preloaded":** the same file. The size-matched fallback is left out on purpose (decisions.md, "Fonts").

## Deviations
- **I didn't check the built SSR HTML of `/`.** The build can't run without Ghost's `src/router.tsx`.
  - I tried a stand-in router in a scratchpad copy of `apps/web`, outside the worktree. The tool permission was denied, so I stopped there.
  - I didn't try any other workaround, and I didn't put stand-ins at Ghost's paths in the worktree, because that's outside my territory.

## Limitations
1. **Build, typecheck and test are red on this tree, as they are on main.** All three stop at `Could not resolve entry for router entry: router in apps/web/src`, until Ghost's w0-data merges (w0-app report, Limitations 1).
   - My change adds nothing that could break the build: an asset import of the same kind as Inter's, which the w0-app build already showed works.
   - Even so, the check that both preloads reach the SSR HTML of `/` is still open. Zero's review, or a re-run after w0-data merges, should do it: `grep -o 'rel="preload"[^>]*' .output/...` on the server's HTML for `/`, or `curl` against `vite preview`.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Zero (w0-fonts review):** the SSR HTML check (Limitations 1) can only run once Ghost's `router.tsx` is on main.
- **Leah:** two font preloads now, Inter Variable and IBM Plex Mono 500.

## Files changed
```
apps/web/src/routes/__root.tsx
docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-fonts-build-completion.md
```

## Verification
The task verify (NEMI-01):
```
$ pnpm --filter @avel/web typecheck && pnpm --filter @avel/web build
apps/web typecheck: Error: Could not resolve entry for router entry: router in .../apps/web/src
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @avel/web@0.0.0 typecheck   (exit 1)
$ grep -c 'rel: "preload"' apps/web/src/routes/__root.tsx
2
$ grep -o 'ibm-plex-mono-[0-9]*.woff2' apps/web/src/routes/__root.tsx
ibm-plex-mono-500.woff2
```
Part 7:
```
$ pnpm --filter "@avel/web..." build
apps/web build: Error: Could not resolve entry for router entry: router in .../apps/web/src
apps/web build: Failed
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @avel/web@0.0.0 build: `vite build`
exit 1

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
No projects matched the filters "@avel/contract-mock" in ".../frontend-sprint-01-agent-nemi-w0-fonts-build-a1"
apps/web typecheck: Error: Could not resolve entry for router entry: router in .../apps/web/src
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @avel/web@0.0.0 typecheck
exit 1

$ pnpm lint
Checked 136 files in 114ms. No fixes applied.
exit 0

$ pnpm --filter @avel/web test
Startup Error: Could not resolve entry for router entry: router in .../apps/web/src
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @avel/web@0.0.0 test: `vitest run`
exit 1

$ git diff --name-only main...HEAD
apps/web/src/routes/__root.tsx
(plus this report, committed last)
```
