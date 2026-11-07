# BRENNAN: w0-app review-spec, completion report

verdict: PASS

## Summary
Nemi's w0-app diff (4eee066..5c1d8c9) matches UI contract section 6 as it stands on main, which includes INT's base.css line from bc4aafa. It also matches the design library and INT's 2026-11-07 decisions. The package name, the dependency pins, tokens.css, base.css, the fonts, the root shell and vite.config.ts all check out. Some I checked by command and some by rendering a stubbed build. Build, typecheck and test are red only because Ghost's `src/router.tsx` and `packages/contract-mock` haven't landed yet; INT accepted that state for this merge. Lint is red only because this branch's base predates INT's biome.json change on main. No findings.

## Pre-flight
- Part 2 files, all read: `.claude/agents/brennan.md`, `codebase-analysis.md`, `docs/ui-contracts/decisions-approval-page.md` (sections 0 to 3 and 6 to 8 in full, the rest skimmed), `CR-W2 Pending decisions.md` (skimmed: nothing in section 6 depends on it), `decisions.md`, `Frontend Map v0.6`, `Design library v1.1.html` (its style block: the token section, Base element defaults, @font-face), `Step 0 and Step 1 plan.md`, and this task doc.
- The role file's Read first list is all present: Backend modules and build plan, Roster setup and sessions, API and data reference, DATABASE. I skimmed them. None of them touches w0-app.
- Branch `frontend/sprint-01/agent-brennan-w0-app-review-spec-a1`, start commit `5c1d8c9` (Nemi's result), base `4eee066`.
- Part 7 commands: all available once `pnpm install` had run. Nothing was installed in the worktree, so I ran `pnpm install --no-frozen-lockfile` and then restored `pnpm-lock.yaml` with `git checkout`; the lockfile isn't committed.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| BRENNAN-01 | DONE | this report's commit |

## Findings
none

## Contract to files
Section 6, item by item:

| Section 6 item | Files | Evidence |
| --- | --- | --- |
| Package `@avel/web` at `apps/web`, TanStack Start, React, Vite | `apps/web/package.json:2`, `vite.config.ts:108` | `tanstackStart()` plugin; a stubbed build succeeds (see Verification, extra checks) |
| `@avel/contract` workspace | `package.json:14` | `workspace:*` |
| `@avel/contract-mock` as a dev dependency | `package.json:28` | `link:../../packages/contract-mock`. INT accepted `link:` until Ghost merges, then `workspace:*` (decisions.md on main, 2026-11-07 "INT's answers on Nemi's w0-app report") |
| `@orpc/*` at the contract's `@orpc/contract` pin | `package.json:15-17` | All three at 1.16.2; `packages/contract/package.json` pins `@orpc/contract` 1.16.2 |
| `@tanstack/react-start`, `react-router`, `react-query`; `react`, `react-dom`; `lucide-react` | `package.json:18-24` | present, pinned exactly |
| `zod` at the contract's version | `package.json:25` | 4.6.7 = contract's 4.6.7 |
| Tailwind v4 and its Vite plugin | `package.json:30,37` | `tailwindcss` 4.3.5, `@tailwindcss/vite` 4.3.5 |
| Tests: `vitest` (the workspace's), Testing Library react and user-event, jsdom, Playwright | `package.json:29,32-33,36,39` | `vitest` 5.1.0 = root `package.json`'s 5.1.0 |
| Nothing else | `package.json:20,31,34-35,38` | Five extras: `vite`, `@types/react`, `@types/react-dom`, `@testing-library/dom` and `@tanstack/react-router-ssr-query`, plus the `dev` script. INT accepted all of these (decisions.md on main, 2026-11-07); Zane checks them |
| tokens.css: every custom property in DL's token section, same value, same selectors, 533 pairs | `src/styles/tokens.css:11-587` | The task's check: `533 library tokens, 0 missing []`. My per-selector check: all 538 (selector, name, value) triples in DL are present under identical selectors. With comments stripped and whitespace normalised, the copied section is identical to DL's |
| `--av-stall-after: 8m` as it is | `tokens.css` | present (built CSS has `--av-stall-after:8m`) |
| The Tailwind `@theme` mapping | `tokens.css:589-731` | FM line 423 ("styles/tokens.css Enclosure Grid @theme"). It adds no values: 128 names, each `--x: var(--x)`, and every name is a token DL declares. The `initial` resets carry out DL's own comment at `tokens.css:13` |
| base.css: DL's Base element defaults, word for word, after tokens.css | `src/styles/base.css:6-26`, `app.css:3-6` | Byte-identical to DL's block, from `/* Base element defaults` to the `AVEL field anatomy` comment (script: `base.css verbatim: True`). `app.css` imports it after `tokens.css` |
| Shell: `data-theme` from the `avel-theme` cookie, `light` or `night`, default `light`, on the server before first paint | `src/routes/__root.tsx:15-36,56-60` | SSR of a stubbed build: no cookie gives `data-theme="light"`; `avel-theme=night` gives `night`; `light` gives `light`; `bogus` gives `light`; `x=1; avel-theme=night` gives `night` |
| Loads Inter Variable and IBM Plex Mono | `fonts.css`, `fonts/*.woff2`, `__root.tsx:43-50` | The three files' SHA-256 equal DL's embedded base64 data (Inter 48256 B, Mono 400 14708 B, Mono 500 14888 B). The @font-face descriptors match DL's. Inter is preloaded; the built CSS and assets carry all three |
| Route context `{ queryClient: QueryClient }` via `createRootRouteWithContext`; no provider; no auth guard | `__root.tsx:11-13,35` | no provider, no `beforeLoad` |
| `__AVEL_CONTRACT_VERSION__` from `packages/contract/package.json` via `fs` at config time | `vite.config.ts:10-21,102-104` | `readFileSync` |
| `AVEL_API=mock`: an `apply: "serve"` plugin, one `createMock({ contractVersion })`, seeded `fixtures.step1`, serving `/api/*` and `/__mock/*` as middleware | `vite.config.ts:54-98,106` | One instance per server. `/__mock/reset` POST resets, re-seeds `step1` and answers 204. `/__mock/bump/{id}` POST answers 200 `{ version }` (section 2). The only `@avel/contract-mock` import in the diff is here (`grep` of the diff) |
| Route tree to `src/routeTree.gen.ts`, git-ignored, generated before typecheck and build | `.gitignore:2`, `package.json:10` | In the stubbed copy, the `typecheck` script's `resolveConfig` step wrote `src/routeTree.gen.ts` before `tsc` ran |
| Mock out of production builds (section 3) | `vite.config.ts:58,106` | Stubbed production build: `grep` for `__mock` and `contract-mock` over `dist/server/server.js` and `dist/client/assets/*.js` finds nothing |

## Deviations
- **I judged against main's section 6, not the worktree's copy.** The UI contract at this branch's base (4eee066) has no base.css line. Main's bc4aafa adds it ("Brennan's w0-app review-spec checks them against this line", decisions.md on main, 2026-11-07), and Nemi's 5c1d8c9 implements it. I took INT's two decision entries on main as the contract's current state: that one and "INT's answers on Nemi's w0-app report". They are decisions, not descriptions of the work.
- **I verified runtime behaviour in a scratch copy.** A copy of HEAD with main's `biome.json`, a stub `src/router.tsx` and a stub `routes/index.tsx` lives under my session scratchpad, outside the repo. I used it because the real build can't run until Ghost lands. Nothing in the repo was changed.

## Limitations
- I couldn't run the dev server with `AVEL_API=mock`: `packages/contract-mock` doesn't exist yet. I reviewed the middleware by reading it; Ghost's and Fenn's UC-29 and UC-30 exercise it.
- The shell was checked with a stub router, not Ghost's `getRouter()`.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Zero (contract owner), Leah (perf):** FM line 289 asks for fonts "preloaded, with a size-matched fallback". Section 6 only asks that the shell load both families. As built, Inter is preloaded and Plex Mono isn't, and there's no size-matched fallback (DL has no metrics for one, and the value rule forbids inventing them). It isn't drift from the contract. If it's wanted, the contract has to say so first.
- **INT:** after merging, `pnpm-lock.yaml` needs regenerating as agreed. Lint goes green once this branch carries main's `biome.json` (verified: `Checked 136 files … No fixes applied.`, 0 errors).

## Files changed
`git diff --name-only main...HEAD` lists Nemi's 13 files (below, under Verification) plus this report. My commit adds only `docs/agent-dispatch/frontend/sprint-01/agent-brennan-w0-app-review-spec-completion.md`.

## Verification

BRENNAN-01's check:
```
$ python3 -I -c "…(the task doc's command)…"
533 library tokens, 0 missing []
exit=0
```

```
$ pnpm --filter "@avel/web..." build
packages/contract build: Done
apps/web build$ vite build
apps/web build: vite.config.ts (60:52) [UNRESOLVED_IMPORT] Could not resolve '@avel/contract-mock' in vite.config.ts
apps/web build: error during build:
apps/web build: Error: Could not resolve entry for router entry: router in …/apps/web/src
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @avel/web@0.0.0 build: `vite build`
exit 1   (expected: Ghost's src/router.tsx and packages/contract-mock; INT, 2026-11-07)
```

```
$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
No projects matched the filters "@avel/contract-mock"
packages/contract typecheck: Done
apps/web typecheck: Error: Could not resolve entry for router entry: router in …/apps/web/src
exit 1   (same cause)
```

```
$ pnpm lint
apps/web/src/styles/tokens.css … i Enable `tailwindDirectives` in the css parser options …
Found 3 errors.
exit 1   (this branch's biome.json predates main's 2cab1f4)
```
The same lint run on a copy of HEAD with main's `biome.json`:
```
Checked 136 files in 70ms. No fixes applied.
```

```
$ pnpm --filter @avel/web test
Startup Error: Could not resolve entry for router entry: router in …/apps/web/src
exit 1   (same cause; Fenn's vitest.config.ts and tests aren't merged yet)
```

```
$ git diff --name-only main...HEAD
apps/web/.gitignore
apps/web/package.json
apps/web/src/routes/__root.tsx
apps/web/src/styles/app.css
apps/web/src/styles/base.css
apps/web/src/styles/fonts.css
apps/web/src/styles/fonts/ibm-plex-mono-400.woff2
apps/web/src/styles/fonts/ibm-plex-mono-500.woff2
apps/web/src/styles/fonts/inter-variable.woff2
apps/web/src/styles/tokens.css
apps/web/tsconfig.json
apps/web/vite.config.ts
docs/agent-dispatch/frontend/sprint-01/agent-nemi-w0-app-build-completion.md
(+ this report, after my commit)
```

Extra checks, in the scratch copy with a stub `router.tsx` (outside the repo):
```
$ pnpm run typecheck     # after resolveConfig: src/routeTree.gen.ts exists
vite.config.ts(60,53): error TS2307: Cannot find module '@avel/contract-mock' …   (the only error)
$ pnpm run build
✓ built in 136ms
$ node ssr.mjs dist/server/server.js
null 200 <html lang="en" data-theme="light"> preload:yes css:yes
"avel-theme=night" 200 <html lang="en" data-theme="night"> preload:yes css:yes
"avel-theme=light" 200 <html lang="en" data-theme="light"> preload:yes css:yes
"avel-theme=bogus" 200 <html lang="en" data-theme="light"> preload:yes css:yes
"x=1; avel-theme=night" 200 <html lang="en" data-theme="night"> preload:yes css:yes
$ grep -c '__mock\|contract-mock' dist/server/server.js dist/client/assets/*.js | grep -v ':0'
(nothing)
base.css verbatim: True
font sha256: inter 3100e775e8616cd2 = DL; mono-400 08949f728dc52d52 = DL; mono-500 01d285447409c8a5 = DL
per-selector token triples: DL 538, missing [] ; @theme names not in DL: []
```
