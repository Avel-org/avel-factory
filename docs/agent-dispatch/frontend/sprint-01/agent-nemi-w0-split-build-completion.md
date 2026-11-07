# NEMI: w0-split build, completion report

verdict: DONE

## Summary
`apps/web/package.json` now has `"sideEffects": ["**/*.css"]` right after `"type"`, and nothing else in the file changed. The build, typecheck and lint pass. The web's tests give the same result as on main: 153 pass, and the same 37 fail, all of them locked decisions tests waiting on Leon's unmerged module. On main `/` has no screen yet, so the client chunks didn't change (same hashes). I didn't check the dev server in a browser, because requests to localhost are denied in this session (Limitations).

## Pre-flight
- Part 2 files, all read:
  1. `.claude/agents/nemi.md`: read (Learned: none yet)
  2. `docs/agent-dispatch/frontend/sprint-01/codebase-analysis.md`: read
  3. `docs/ui-contracts/decisions-approval-page.md`: read, with sections 5 ("The route split") and 6 in full
  4. `docs/design/CR-W2 Pending decisions.md`: read (skimmed; it doesn't touch this task)
  5. `docs/agent-dispatch/frontend/sprint-01/decisions.md`: read, with 2026-11-07 "Revision 9" in full
  6. `docs/design/AVEL Web App — Frontend Map v0.6.md`: read, with lines 113 to 114 and 285
  7. `docs/design/AVEL Enclosure Grid · Design library v1.1.html`: present (skimmed; there are no tokens in this task)
  8. `docs/design/Step 0 and Step 1 plan.md`: read (skimmed; it doesn't touch this task)
  9. to 12.: read as above
- `locks.md`: it isn't at the repo root. The sprint's copy is `docs/agent-dispatch/frontend/sprint-01/locks.md`, which I read. None of its paths was touched.
- Branch: `frontend/sprint-01/agent-nemi-w0-split-build-a1`. Start commit: `9b25f09`.
- Part 7 commands: all available, after a `pnpm install --frozen-lockfile` in the fresh worktree, which had no `node_modules`. The lockfile didn't change.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| NEMI-01 | DONE | 1a71be5, 2b4284e (Biome's formatting of the same field) |

## Contract to files
- UI contract section 6, "`package.json` declares `"sideEffects": ["**/*.css"]`", and section 5, "What keeps it split": `apps/web/package.json`, lines 6 to 8.
- NEMI-01's Required:
  - **Build, typecheck and tests pass as before:** build and typecheck exit 0. Tests: before and after my change, the same 37 failing test names (diffed) in `test/modules/decisions/{list,errors,deciding,contract-version}.test.tsx`, and 153 passing. Every printed error is `screens.ts should export the screen as DecisionsScreen: expected undefined to be defined`, because Leon's decisions module isn't on main.
  - **tokens.css and base.css still load:** `__root.tsx` links `styles/app.css?url` (app.css `@import`s tokens.css and base.css), not a bare side-effect import. The built CSS has the same hash as before (`app-CCOL2GSK.css`, 6.94 kB gzip). It still carries the tokens (`--av-floor:var(--color-app-page)`, 218 distinct `--av-*` names), and `dist/server/assets/router-*.js` still references it. Dev server: see Limitations.

## Deviations
- **package.json formatting:** the task gives the field as `"sideEffects": ["**/*.css"]` on one line. `pnpm lint` (Biome) rejected that and wants the array spread over lines 6 to 8. The value is the same. So NEMI-01's `grep -n '"sideEffects"'` shows `6:  "sideEffects": [` rather than the whole field. It's still one sideEffects line.
- **"Tests pass as before":** they don't all pass, either before or after. I took "as before" to mean the same result as main, and checked it by diffing the failing test names.

## Limitations
- **Dev-server CSS check not run.** I started `vite dev` on port 5391 (it reported ready), but this session's permissions denied `curl` to localhost, and I didn't try to get around the denial. I stopped the server. Reasoning: `sideEffects` only steers tree-shaking in the production bundler, and the dev server doesn't tree-shake. The sheet also arrives through a `?url` link, not a side-effect import, so the field can't drop it in dev either. Even so, someone with localhost access should confirm it: `/` serves a `<link>` to `app.css` and the page has the `--av-*` tokens.
- **The split isn't visible on main:** there's no `src/routes/index.tsx` yet, so the client output is still one entry (`index-SlPnXw7v.js`, 155.40 kB gzip) plus the CSS, the same hashes as before the change. Zero's 0.07 kB to 20.0 kB route-chunk figure can only be reproduced once Leon's decisions is merged.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Zero (w0-split review):** the split can't be measured on main until Leon's decisions is merged. Re-measure the route chunk then.
- **INT / plan:** `locks.md` lives at `docs/agent-dispatch/frontend/sprint-01/locks.md`, not at the repo root that the agent file and task doc suggest.
- **INT / plan:** NEMI-01's verify chains `pnpm --filter @avel/web test` with `&&`, so it can't exit 0 on main while the locked decisions tests wait on Leon.

## Files changed
```
apps/web/package.json
docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-split-build-completion.md
```

## Verification
`pnpm --filter "@avel/web..." build`: exit 0
```
apps/web build: dist/client/assets/app-CCOL2GSK.css                   31.88 kB │ gzip:   6.94 kB
apps/web build: dist/client/assets/index-SlPnXw7v.js                 496.83 kB │ gzip: 155.40 kB
apps/web build: dist/server/assets/empty-plugin-adapters-BsRz-CQL.js         0.26 kB │ gzip:  0.17 kB
apps/web build: dist/server/assets/start-CX3T2L7y.js                         0.27 kB │ gzip:  0.19 kB
apps/web build: dist/server/assets/_tanstack-start-manifest_v-C7ip3UeK.js    0.39 kB │ gzip:  0.29 kB
apps/web build: dist/server/assets/router-Dvq-asiP.js                       27.35 kB │ gzip:  9.27 kB
apps/web build: dist/server/server.js                                      261.19 kB │ gzip: 63.18 kB
apps/web build: ✓ built in 581ms
apps/web build: Done
```
Before the change, the client lines were identical: `app-CCOL2GSK.css` 6.94 kB and `index-SlPnXw7v.js` 155.40 kB gzip.

`pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck`: exit 0
```
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done
```

`pnpm lint`: exit 0
```
> biome check .
Checked 198 files in 757ms. No fixes applied.
```
(The first run, on 1a71be5, failed on the one-line array's format. Fixed in 2b4284e.)

`pnpm --filter @avel/web test`: exit 1, the same as main at 9b25f09
```
      1  FAIL  |web| test/modules/decisions/contract-version.test.tsx
      7  FAIL  |web| test/modules/decisions/deciding.test.tsx
     16  FAIL  |web| test/modules/decisions/errors.test.tsx
     13  FAIL  |web| test/modules/decisions/list.test.tsx
 Test Files  4 failed | 10 passed (14)
      Tests  37 failed | 153 passed (190)
AssertionError: apps/web/src/modules/decisions/screens.ts should export the screen as DecisionsScreen: expected undefined to be defined
```
The failing test names, diffed against a run with main's package.json: identical.

`git diff --name-only main...HEAD` (before this report's commit): exit 0
```
apps/web/package.json
```

NEMI-01's verify, part by part: typecheck 0; test 1 (as on main, above); build grep shows the two client lines above; `grep -n '"sideEffects"'` gives `6:  "sideEffects": [`; `git diff <merge-base> --stat` gives `apps/web/package.json | 3 +++`, 1 file changed.
