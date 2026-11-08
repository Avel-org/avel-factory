# ZANE: w0-split review-security, completion report

verdict: PASS

## Summary
Reviewed w0-split a2 (Nemi): three new dev dependencies and the server-function stub. All are exact-pinned, on section 6's list, dev only, MIT, with no install scripts; the stub is client-environment only and the guard fails the build. One P3 note.

## Pre-flight
All Part 2 files read (the design docs skimmed for relevance). Branch frontend/sprint-01/agent-zane-w0-split-review-security-a1, base b1932d9, HEAD 0d5626e. All Part 7 commands available.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZANE-01 | DONE | see branch head |

Checks:
- Pinned exact: @rolldown/plugin-babel 0.3.0, @babel/core 7.29.13, babel-plugin-react-compiler 1.0.0 (package.json diff, no ^ or ~); lockfile matches.
- On section 6's list ("for the build (revision 10)"), in devDependencies only. Transitives added: artichokie 0.4.5 (MIT, by sapphi-red, a Vite/Rolldown maintainer) and picomatch (already in the tree).
- Install scripts: `pnpm view` shows none of the four declares install/postinstall/preinstall. pnpm ignores build scripts by default (only esbuild is listed as ignored, as before).
- Licences: all MIT. Maintainers: Rolldown/Vue team, Babel team, Meta (fb/react-bot). No deprecation flags.
- Optional peer wiring: @vitejs/plugin-react now lists plugin-babel and the compiler as optional deps; the lockfile resolves all to the same pinned versions.
- Stub: `applyToEnvironment` = client only; `pnpm build` succeeded; dist/client contains no seroval or STUBBED text (grep empty); dist/server still carries seroval (server build untouched).
- Guard: a temp `src/zz-guard.ts` containing createServerFn failed the build with the guard's message; I removed it, tree clean.
- Compiler scope: `babel({ include: [webSourceFiles] })` is limited to apps/web/src, so node_modules isn't compiled.

## Findings
- docs/agent-dispatch/frontend/sprint-01/findings/w0-split-zane-01.md — P3 — guard scans only apps/web/src

## Contract to files
UI contract section 6 (dependencies, stub, guard, alarm): apps/web/package.json, apps/web/vite.config.ts, pnpm-lock.yaml.

## Deviations
Alarm: contract says it fails if any of the three stubs wasn't used; the implementation fails if none is used or a real client-rpc module/seroval leaks (the comment explains that only createClientRpc.js loads). Not a security concern.
I exercised the guard by creating and removing a temp file in apps/web/src, to prove it fires; nothing was left behind.

## Limitations
I did not run the app in a browser.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- `pnpm --filter @avel/web test` fails 6 kit tests (UC-08 DecisionTag, UC-09 loadReasonDialog). The kit (Fantem) isn't in this diff, so I don't attribute them to w0-split. Zero/INT should check them.

## Files changed
docs/agent-dispatch/frontend/sprint-01/agent-zane-w0-split-review-security-completion.md
docs/agent-dispatch/frontend/sprint-01/findings/w0-split-zane-01.md
(`git diff --name-only main...HEAD` also lists the builder's earlier commits on this review-base branch.)

## Verification
- `pnpm --filter "@avel/web..." build`: succeeded (server build, client no seroval).
- `pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck`: Done, no errors.
- `pnpm lint`: Checked 213 files, no fixes needed.
- `pnpm --filter @avel/web test`: exit 1, 6 failures, all in test/kit (UC-08, UC-09), outside this diff.
