# ZANE: w0-app review-security, completion report

verdict: PASS

## Summary
ZANE-01 is done. Every dependency the w0-app diff adds (6234b9b) is pinned exactly, is on UI contract section 6's list or is one of the five extras INT accepted, and has an acceptable licence. I found no install scripts in the resolved tree that need accounting for, and no findings. The Part 7 build, typecheck and test commands fail here for the reasons INT accepted; lint also fails here because my checkout doesn't have INT's `biome.json` change from main.

## Pre-flight
- Part 2 files: `.claude/agents/zane.md`, `codebase-analysis.md`, `decisions-approval-page.md` (section 6 in full), `decisions.md` (including INT's 2026-11-07 answers on Nemi's report) and Nemi's completion report: read. The rest of the Part 2 list I only skimmed. None is missing.
- Branch `frontend/sprint-01/agent-zane-w0-app-review-security-a1`, checked out at 23ef100; base 4eee066.
- Part 7 commands: all available.
- The lockfile isn't committed (escalation 01), so I resolved the tree myself. I ran `npm install --package-lock-only --ignore-scripts` in a scratch directory on `apps/web`'s external dependencies (237 packages). I read licences, `hasInstallScript` and `deprecated` from that lock, and each direct dependency's licence, scripts and deprecation from `npm view`. Resolution is by npm, not pnpm, so a transitive version could differ slightly from what pnpm picks. The result isn't sensitive to that.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZANE-01 | DONE | this report |

### ZANE-01 result
- **Pinned:** all 22 external entries in `apps/web/package.json` are exact; the diff has no `^` or `~`. `@avel/contract` is `workspace:*`, and `@avel/contract-mock` is `link:../../packages/contract-mock`.
- **Versions that must match:** `@orpc/client`, `@orpc/openapi-client` and `@orpc/tanstack-query` are 1.16.2, and `zod` is 4.6.7, the same as `packages/contract/package.json`'s `@orpc/contract` and `zod`. `vitest` 5.1.0 matches the root.
- **On section 6's list:** `@orpc/*`, `@tanstack/react-start`, `react-router` and `react-query`, `react`, `react-dom`, `zod`, `lucide-react`, `tailwindcss`, `@tailwindcss/vite`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom` and `@playwright/test`.
- **Outside section 6, accepted by INT (decisions.md, 2026-11-07), and checked here:**
  - `vite` 8.3.6: MIT, needed (the build tool, and a peer of react-start), current.
  - `@types/react` and `@types/react-dom` 19.3.0: MIT, types only, no runtime.
  - `@testing-library/dom` 10.4.2: MIT, a required peer of `@testing-library/react`.
  - `@tanstack/react-router-ssr-query` 1.167.3: MIT, from the TanStack org (maintainer tannerlinsley), needed for `setupRouterSsrQueryIntegration`.
  - The `dev` script is `vite dev` only, with nothing hidden.
- **Install scripts:** none on any direct dependency (`scripts.postinstall`, `install` and `preinstall` are empty in `npm view` for all 22). The only package in the resolved tree with `hasInstallScript` is `fsevents` 2.3.3 (optional, macOS only, MIT), which a normal transitive dependency of the file watcher. pnpm 10 doesn't run dependency build scripts unless allowed, and nothing in the diff allows any.
- **Licences:** 195 packages MIT, 9 ISC, 8 Apache-2.0 (`@playwright/test` and its core, dev only), 4 BSD-3-Clause, 2 BSD-2-Clause, plus 0BSD, Unlicense, BlueOak-1.0.0, Python-2.0 (`argparse`) and MIT-OR-CC0 (`type-fest`). None is GPL or AGPL, and none is unlicensed. Two worth noting, neither a finding:
  - MPL-2.0: `lightningcss` 1.33.0 and its 11 platform binaries, pulled in by Tailwind's Vite plugin. It's build-time only and file-level copyleft, we don't modify it, and it isn't shipped in the app bundle.
  - CC-BY-4.0: `caniuse-lite` data, a build-time browserslist dependency.
- **Deprecated:** none in the resolved tree.
- **Mock never in production (UC section 8):** I haven't rebuilt it; I rely on Nemi's recorded check (nothing found for `__mock`, `contract-mock` or `MOCK_OPERATOR_ID`'s value in `dist/`). That is Zane's w0-data task to verify on the real mock.

## Findings
none

## Contract to files
- UI contract section 6, the dependency list: `apps/web/package.json`.
- Task ZANE-01's verify command, reviewed in full.

## Deviations
- I couldn't run the lockfile-based review against `pnpm-lock.yaml`, because it isn't committed. I used an npm resolution in the scratchpad instead (Pre-flight).
- I ran `pnpm install` in my worktree, which rewrote `pnpm-lock.yaml`. I reverted it with `git checkout` and committed nothing but this report.

## Limitations
- The transitive licence and script scan is from an npm resolution, not pnpm's.
- I read each package's published metadata, not its tarball contents.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- INT: at merge, switch `@avel/contract-mock` to `workspace:*` after Ghost lands, and regenerate the lockfile. When you regenerate it, check that `pnpm.onlyBuiltDependencies` doesn't allow anything new.

## Files changed
```
apps/web/.gitignore
apps/web/package.json
apps/web/src/routes/__root.tsx
apps/web/src/styles/app.css
apps/web/src/styles/fonts.css
apps/web/src/styles/fonts/ibm-plex-mono-400.woff2
apps/web/src/styles/fonts/ibm-plex-mono-500.woff2
apps/web/src/styles/fonts/inter-variable.woff2
apps/web/src/styles/tokens.css
apps/web/tsconfig.json
apps/web/vite.config.ts
docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-app-build-completion.md
```
Those are Nemi's changes under review; the only path I add is this report, in Part 5's territory.

## Verification
At 23ef100, after `pnpm install`:

```
$ pnpm --filter "@avel/web..." build
apps/web build: Failed        (ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL, exit 1)
$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
apps/web typecheck: Failed    (exit 1)
$ pnpm lint
× Some errors were emitted while running checks.   (exit 1)
$ pnpm --filter @avel/web test
ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  vitest run      (exit 1)
$ git diff --name-only main...HEAD
(the 12 paths above; Nemi's, all in Nemi's territory plus its report)
```
- Build, typecheck and test are red because Ghost's `router.tsx` and `packages/contract-mock` aren't merged. INT accepted that.
- Lint is red on this branch because the root `biome.json` fix is on main and isn't in this checkout. INT says it is green with it. I haven't confirmed that.
- I only tailed the output. The full text isn't pasted.
