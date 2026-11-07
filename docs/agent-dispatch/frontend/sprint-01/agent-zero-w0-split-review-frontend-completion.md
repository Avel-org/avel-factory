# ZERO: w0-split review-frontend, completion report

verdict: PASS

## Summary
Nemi's w0-split a1 (merged on main as b97076e; commits 1a71be5 and 2b4284e, report 7a37113) adds one field to `apps/web/package.json`: `"sideEffects": ["**/*.css"]`, at lines 6 to 8. It names CSS files only. No dependency or script changed, and no code path outside that file changed. That is what UI contract sections 5 ("The route split") and 6 ask for. The build still emits the app CSS with the tokens. On a scratch copy carrying Leon's a1 page, the field turns the route chunk from a 0.07 kB re-export into a 17.06 kB gzip chunk. No findings.

## Pre-flight
- Part 2 files, all read:
  1. `.claude/agents/zero.md`: read (Learned: none yet)
  2. `docs/agent-dispatch/frontend/sprint-01/codebase-analysis.md`: read
  3. `docs/ui-contracts/decisions-approval-page.md`: read: sections 0, 5 (with "The route split"), 6 and 8 in full; I skimmed the rest
  4. `docs/design/CR-W2 Pending decisions.md`: read (skimmed; it doesn't touch a package.json field)
  5. `docs/agent-dispatch/frontend/sprint-01/decisions.md`: read, with "Revision 9" and "INT's answers on revision 9" in full
  6. `docs/design/AVEL Web App — Frontend Map v0.6.md`: read: "What every module looks like" (lines 105 to 117) and the performance table and "How" (lines 280 to 292, with line 285)
  7. `docs/design/AVEL Enclosure Grid · Design library v1.1.html`: present. It's not relevant here: the diff carries no tokens, components or values
  8. `docs/design/Step 0 and Step 1 plan.md`: read (skimmed; it doesn't touch this task)
  9. Contract sections 5 and 6: read as above
  10. This task doc: read in full
- The zero.md Read-first files `API and data reference.md` and `CR-16 Dispatch package contract.md` are present.
- Branch: `frontend/sprint-01/agent-zero-w0-split-review-frontend-a1`. Start commit: b97076e, which is main and is the w0-split merge itself.
- **The diff under review:** `AVEL_BASE` is b97076e, the same as HEAD, so the default diff is empty. INT's message names the diff to review: `git diff b97076e^1 b97076e`. I reviewed that diff, which is commits a9c5cf9..7a37113.
- Part 7 commands: all available.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZERO-01 | DONE | this report's commit |

ZERO-01, checked point by point (diff b97076e^1..b97076e):
- **One sideEffects field:** `apps/web/package.json:6-8`, `"sideEffects": [ "**/*.css" ]`. 1a71be5 adds it on one line. 2b4284e only spreads it over three lines in Biome's format, with the same value. This is the only hunk in the file (+3, -0).
- **CSS files only:** the array has one entry, `**/*.css`. I checked that nothing in `@avel/web` needs a non-CSS file kept for its side effects. `grep -rnE "^\s*import\s+['\"]" apps/web/src` lists nothing: there are no bare imports. Every stylesheet comes in as `?url` and is used by value: `routes/__root.tsx:6` `import appCss from "../styles/app.css?url"`, and `kit/index.ts:6` `kitStylesheetHref`.
- **No dependency or script change:** `git diff b97076e^1 b97076e -- apps/web/package.json` has no hunk in `scripts`, `dependencies` or `devDependencies`. `pnpm-lock.yaml` isn't in the diff.
- **Nothing outside apps/web/package.json:** `git diff b97076e^1 b97076e --stat` gives `apps/web/package.json | 3 +` and Nemi's own completion report. The report is in his territory.
- **Builds, with the app CSS still emitted:** see Verification. `dist/client/assets/app-CCOL2GSK.css` (6.94 kB gzip) carries `--av-floor:var(--color-app-page)`, and `dist/server/assets/router-Dvq-asiP.js` still references `app-CCOL2GSK.css`. On main the field changes no client output. A full build of b97076e^1 (in a scratch worktree) and of b97076e give byte-identical client lines: `index-SlPnXw7v.js` 155.40 kB gzip, the figure INT gave.
- **The split holds (contract section 5, "What keeps it split"):** main has no `routes/index.tsx` yet, so I measured on a scratch worktree at b97076e^1. It carried Leon's a1 `modules/decisions/**` and `routes/index.tsx` from c3effb3. I built it once without the field and once with b97076e's package.json (`pnpm --filter "@avel/web..." build`, exit 0 both times):
  ```
  without: routes-B1H5H0oz.js    0.07 kB │ gzip:   0.08 kB
           index-CVN3Goxv.js   552.35 kB │ gzip: 173.55 kB
  with:    routes-A3z4ypgw.js   50.30 kB │ gzip:  17.06 kB
           index-HyNrNmjJ.js   502.30 kB │ gzip: 157.31 kB
  ```
  The entry figure matches revision 9's 157.3 kB. The route chunk is 17.06 kB, not revision 9's 20.0 kB, because main's kit and CSS have changed since Leon's a1 base. The scratch worktree was removed afterwards.

## Findings
none

## Contract to files
- Section 6, "`package.json` declares `"sideEffects": ["**/*.css"]`": `apps/web/package.json:6-8`.
- Section 5, "The route split" / "What keeps it split": `apps/web/package.json:6-8`. Checked by the scratch measurement above. `vite.config.ts` is unchanged, as section 5 says it should be.
- ZERO-01's Verify and Expected: see Tasks and Verification.

## Deviations
- **The diff:** I reviewed `b97076e^1..b97076e`, at INT's instruction, instead of `$AVEL_BASE..HEAD`, which is empty because the work was merged before this review started.
- **ZERO-01's verify command:** `pnpm --filter @avel/web build` alone, in a worktree with no `packages/contract/dist`, printed a misleading client line: `index-BXe4PpTh.js` 127.47 kB gzip. The client bundle had left `@avel/contract/errors` and `@avel/contract/routes/decisions` unresolved, and then the server build failed (`Rolldown failed to resolve import "@avel/contract/errors"`, exit 1). The pipe into `grep` hid the exit code. I took my figures from Part 7's `pnpm --filter "@avel/web..." build` instead, which builds the contract first. Issues for other agents has the plan fix.
- **Extra checks:** the before-and-after build of main and the scratch split measurement. ZERO-01 doesn't ask for either, but section 5's "What keeps it split" can't be seen on main without them.

## Limitations
- **The dev-server CSS check** (Nemi's limitation) isn't run here either. I made no request to localhost. Why it can't break: `sideEffects` only steers production tree-shaking, and the dev server doesn't tree-shake. Also, both stylesheets are `?url` imports used by value, not bare imports, so even a build can't drop them. That second point is shown above: the CSS is emitted and referenced.
- **The split can't be seen on main** until Leon's decisions module is merged. My split figures come from Leon's a1 on a scratch copy, not from his a2.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT / plan (ZERO-01's verify):** use `pnpm --filter "@avel/web..." build` rather than `--filter @avel/web`, and don't pipe it straight into `grep`. In a fresh worktree the narrow filter builds against a missing `packages/contract/dist`: it prints a client size about 28 kB too low, then fails, and the grep hides the failure.
- **Zero (next contract revision; my own text, for Brennan's next spec review):** section 6's sideEffects bullet says CSS files "run for their effect on import (`__root.tsx`'s token and base sheets)". In fact `__root.tsx` links `app.css?url`, and no stylesheet is imported for its effect. The field is still right: it keeps any future bare CSS import safe. Only the parenthesis is wrong. It's a wording fix, with no change to the work.
- **Leah (decisions a11y-perf a2):** measured on Leon's a1 with this field, the route chunk is 17.06 kB gzip and the entry 157.31 kB. Section 8 counts both, about 174.4 kB, so `/` is over 160 kB until S1-6's cut lands. Re-measure on Leon's a2.
- **Nemi:** none. The locks.md path note in his report is INT's to answer.

## Files changed
```
docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-split-review-frontend-completion.md
```

## Verification
`pnpm --filter "@avel/web..." build`: exit 0
```
packages/contract build: Done
apps/web build: dist/client/assets/ibm-plex-mono-400-DMJ8VG8y.woff2   14.70 kB
apps/web build: dist/client/assets/ibm-plex-mono-500-DSY6xOcd.woff2   14.88 kB
apps/web build: dist/client/assets/inter-variable-Dx4kXJAl.woff2      48.25 kB
apps/web build: dist/client/assets/app-CCOL2GSK.css                   31.88 kB │ gzip:   6.94 kB
apps/web build: dist/client/assets/index-SlPnXw7v.js                 496.83 kB │ gzip: 155.40 kB
apps/web build: dist/server/assets/empty-plugin-adapters-BsRz-CQL.js         0.26 kB │ gzip:  0.17 kB
apps/web build: dist/server/assets/start-CX3T2L7y.js                         0.27 kB │ gzip:  0.19 kB
apps/web build: dist/server/assets/_tanstack-start-manifest_v--3USIxGf.js    0.40 kB │ gzip:  0.29 kB
apps/web build: dist/server/assets/router-Dvq-asiP.js                       27.35 kB │ gzip:  9.27 kB
apps/web build: dist/server/server.js                                      261.19 kB │ gzip: 63.19 kB
apps/web build: Done
```

`pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck`: exit 0
```
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done
```

`pnpm lint`: exit 0
```
> biome check .
Checked 198 files in 183ms. No fixes applied.
```

`pnpm --filter @avel/web test`: exit 1, the same result as Nemi's run on main. These are the locked decisions tests, waiting on Leon's unmerged module. They're not caused by this diff: vitest doesn't read `sideEffects`.
```
 Test Files  4 failed | 10 passed (14)
      Tests  37 failed | 153 passed (190)
FAIL files: test/modules/decisions/{contract-version,deciding,errors,list}.test.tsx (UC-11 to UC-28)
AssertionError: apps/web/src/modules/decisions/screens.ts should export the screen as DecisionsScreen: expected undefined to be defined
```

`git diff --name-only main...HEAD`: exit 0. Before this report's commit it listed nothing. After the commit it lists only this report, a Part 5 path.

ZERO-01's verify, on the diff under review:
```
$ git diff b97076e^1 b97076e --stat
 apps/web/package.json                              |   3 +
 .../agent-nemi-w0-split-build-completion.md        | 105 +++++++++++++++++++++
 2 files changed, 108 insertions(+)
```
