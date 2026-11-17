# ZERO: w0-app review-frontend, completion report

verdict: PASS

## Summary
I reviewed Nemi's w0-app diff (4eee066..23ef100) against UI contract section 6, the design library and the Frontend Map, and wrote no findings:
- The dependencies are section 6's plus the five INT accepted.
- `tokens.css` is DL's token section byte for byte, plus a Tailwind mapping that adds no value.
- The fonts are DL's own bytes.
- The theme cookie is read on the server.
- Nothing is outside Nemi's territory.

`@avel/web`'s build, typecheck and test are red on this tree until Ghost's `router.tsx` and `@avel/contract-mock` land. INT accepted that (decisions.md on main, 2026-11-07), so I repeated Nemi's stand-in checks myself, in a scratch copy, and they pass.

## Pre-flight
- **Part 2 files:** all present and read.
  1. `.claude/agents/zero.md`: read.
  2. `codebase-analysis.md`: read.
  3. and 9. `docs/ui-contracts/decisions-approval-page.md` (revision 5): read; sections 0, 6 and 8 in full.
  4. `CR-W2 Pending decisions.md`: read; nothing in it touches the app config.
  5. `decisions.md`: read, this branch's copy and main's. Main adds "2026-11-07: INT's answers on Nemi's w0-app report (23ef100)".
  6. Frontend Map v0.6: read; Rendering and SSR (lines 140 to 151), State (266), Performance budgets (289), Checks (310) and Territories (445).
  7. and 10. Design library v1.1: the token section and the three `@font-face` rules, checked by script.
  8. `Step 0 and Step 1 plan.md`: read.
  11. This task doc: read.
- **Zero's other Read-first docs:** `API and data reference.md` and `CR-16 Dispatch package contract.md` are present.
- **Branch:** `frontend/sprint-01/agent-zero-w0-app-review-frontend-a1`, at 23ef100 (Nemi's result). `AVEL_BASE` is 4eee066.
- **Part 7 commands:** all available. The build, typecheck and test fail for the accepted reason, and lint fails only because this branch predates main's `biome.json` (Verification).
- **`locks.md`:** there's none for frontend sprint-01 yet.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| ZERO-01 | DONE: no findings | this report's commit |

## Findings
none

## Contract to files
Each section 6 item, what I checked, and the evidence.

- **The package is `@avel/web`, on TanStack Start, React and Vite:** `apps/web/package.json`.
- **Dependencies, "this sprint needs, and nothing else":** `apps/web/package.json:13-40`.
  - **Section 6's list is all there.**
    - `@orpc/client`, `@orpc/openapi-client` and `@orpc/tanstack-query` are 1.16.2, the version `packages/contract/package.json` pins for `@orpc/contract`.
    - `zod` is 4.6.7, the contract's version.
    - `vitest` is 5.1.0, the root `package.json`'s version.
    - `@avel/contract-mock` is a dev dependency, as section 6 requires.
  - **The five extras are the ones INT accepted:** `vite`, `@types/react`, `@types/react-dom`, `@testing-library/dom` and `@tanstack/react-router-ssr-query` (decisions.md on main, 2026-11-07). The `dev` script is accepted too. Zane checks the extras.
  - **`@avel/contract-mock` is `link:`, not `workspace:*`:** accepted until Ghost merges (same entry).
- **`tokens.css` against DL's token section.**
  - **The task's check:** it prints `533 library tokens, 0 missing []`.
  - **A byte-for-byte check,** because the task's check compares only name and value pairs:
    - I cut DL's text from the `Theme-independent AVEL tokens` comment to the `Base element defaults` comment, 577 lines.
    - I cut tokens.css from its copy of that comment to the Tailwind mapping.
    - `diff` prints nothing (IDENTICAL). So the selectors, their order, the reduced-motion rules, the `@keyframes` and `--av-stall-after: 8m` are all as DL has them.
  - **The Tailwind mapping:** `apps/web/src/styles/tokens.css:589-731`.
    - The `@theme` block clears families, radii, shadows and type sizes, as DL's first comment says to.
    - The `@theme reference` block has 128 declarations. Every one names a DL token and is `var(--itself)`.
    - I compiled `app.css` with Tailwind 4.3.5. It writes 0 self-referencing declarations, and `bg-app-page` reads `var(--color-app-page)`. `rounded-md`, `text-sm`, `shadow-md` and `font-serif` generate nothing.
  - **The four `biome-ignore-all` headers** (`tokens.css:1-4`) are comments only. Without them, Biome's formatter would rewrite DL's values.
- **Loads Inter Variable and IBM Plex Mono:** `fonts.css` and `fonts/*.woff2`.
  - DL has three `@font-face` rules. Each rule's descriptors match `fonts.css` exactly, and the SHA-256 of each base64-decoded font matches its `.woff2` file.
  - `__root.tsx:43-49` preloads Inter Variable (FM line 289).
- **`<html data-theme>` from the `avel-theme` cookie, read on the server before first paint:** `__root.tsx:24-37, 57-60`.
  - **On the server:** `createIsomorphicFn().server(() => getCookie(...))`, which matches FM line 151 and line 310.
  - **The built server, called in process** (with my stand-ins):

    | Cookie | `<html>` |
    | --- | --- |
    | none | `light` |
    | `avel-theme=night` | `night` |
    | `x=1; avel-theme=night` | `night` |
    | `avel-theme=dark` | `light` |
    | `avel-theme=light` | `light` |
    | `avel-theme=night2` | `light` |

  - **The client bundle** has no `getCookie` or h3 code.
- **The route context is `{ queryClient: QueryClient }`, with no provider and no auth guard:** `__root.tsx:11-13, 36-54`. Ghost's `getRouter()` fills it.
- **`vite.config.ts`:**
  - **`__AVEL_CONTRACT_VERSION__`** is read with `fs` from `packages/contract/package.json` (lines 10-21, 102-104). The loaded config shows `"0.0.0"`.
  - **The `avel:contract-mock` plugin** is added only under `AVEL_API=mock`, with `apply: "serve"`. It makes one `createMock({ contractVersion })` and seeds `fixtures.step1`. I drove its middleware with stub request and response objects:
    - `/api/*` reaches the mock with the method, the body and `X-Request-Id`, and the status, headers and every `Set-Cookie` come back;
    - `POST /__mock/reset` answers 204;
    - `POST /__mock/bump/p1` answers 200 `{"version":1}`;
    - `GET /__mock/reset` and `POST /__mock/other` answer 404;
    - an unknown bump goes to `next(error)`;
    - `/apiary` and `/` pass through.
  - **Kept out of production:** an `AVEL_API=mock` production build, grepped for `__mock`, `contract-mock` and `MOCK_OPERATOR_ID`'s value, finds nothing. Nothing under `apps/web/src` imports the mock.
  - **The route tree:** `src/routeTree.gen.ts` is generated by the typecheck script and by the build. `git check-ignore` confirms it's ignored (`apps/web/.gitignore:2`), along with `dist/` and `.output/`.
- **Territory:** every path in `git diff --name-only 4eee066..23ef100` is in Nemi's Part 5. None is in another territory or in a lock.

## Deviations
1. **Stand-in checks in a scratch copy.** The build can't pass on this tree until Ghost lands, which INT accepted, so I repeated Nemi's stand-in checks.
   - I copied `apps`, `packages` and `node_modules` to my session scratchpad. In that copy only, I added a minimal `src/router.tsx` and a stub `packages/contract-mock`.
   - Nothing at Ghost's paths in this worktree was created or changed.
2. **`pnpm install` rewrote `pnpm-lock.yaml` locally.** I restored it with `git checkout`, and it isn't committed (escalation 01).

## Limitations
1. **The dev middleware wasn't checked over HTTP.** Starting a listening dev server was denied in this session, as it was in Nemi's. I drove the middleware in process instead (Contract to files). Fenn's e2e tests (UC-29 to UC-31) cover it over HTTP.
2. **The stand-in results hold only for my stand-ins.** Ghost's real `getRouter()` and mock are reviewed in w0-data.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT, for a decision: a gap in my own contract, not in Nemi's work.**
  - **The gap:** DL's `Base element defaults` (the body background `--av-floor`, the colour `--av-ink`, the font size and line height) fall outside the token section that section 6 names. So no one in sprint-01 is given them (Nemi's Limitation 6).
  - **Why it matters:** without them, the Night theme draws on an unset page background.
  - **My proposal:** a short section 6 revision that gives them to Nemi in `apps/web/src/styles/**`, copied character for character, before Leon's page is reviewed. If you agree, I'll write the revision.
- **Nemi, your two questions:**
  1. **Base element defaults:** see the INT item above.
  2. **Tailwind's colour palette:** keep it as it is. DL's comment clears only families, radii, shadows and type sizes. The value rule still bars `bg-red-500` and its like, and every frontend review checks that.
- **INT, after Ghost merges:** switch `@avel/contract-mock` to `workspace:*` and regenerate the lockfile, as decided.
- **Ghost:**
  - The surface `vite.config.ts` uses is `createMock({ contractVersion })`, `fixtures.step1`, and `fetch`, `seed`, `reset` and `bumpVersion` on the mock.
  - The package needs a `types` export, or `tsc` fails on `vite.config.ts:60` with TS7016. That happened with my first stub.

## Files changed
```
docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-app-review-frontend-completion.md
```

## Verification
On this worktree at 23ef100, with no stand-ins. Output is trimmed to the lines that matter.

```
$ pnpm --filter "@avel/web..." build
packages/contract build: Done
apps/web build: Error: Could not resolve entry for router entry: router in .../apps/web/src
apps/web build: Failed
exit=1        (accepted: waits on Ghost's router.tsx)

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
No projects matched the filters "@avel/contract-mock"
packages/contract typecheck: Done
apps/web typecheck: Error: Could not resolve entry for router entry: router in .../apps/web/src
exit=1        (accepted: waits on Ghost)

$ pnpm lint
  i Enable `tailwindDirectives` in the css parser options ...
Checked 135 files in 65ms. No fixes applied.
Found 3 errors.
exit=1        (this branch predates main's biome.json change)

$ pnpm exec biome check --css-parse-tailwind-directives=true .     # main's biome.json setting
Checked 135 files in 68ms. No fixes applied.
exit=0

$ pnpm --filter @avel/web test
vite.config.ts (60:52) [UNRESOLVED_IMPORT] Could not resolve '@avel/contract-mock' in vite.config.ts
exit=1        (accepted: no tests yet, and waits on Ghost's mock)

$ git diff --name-only main...HEAD   # only paths from Part 5, after this commit
docs/agent-dispatch/frontend/sprint-01/agent-zero-w0-app-review-frontend-completion.md
```

Note: `git diff --name-only main...HEAD` also lists Nemi's 12 build paths, because main doesn't hold w0-app yet. This review commit adds only the path above. `git diff --name-only 23ef100..HEAD` shows that.

ZERO-01's verify command:

```
$ pnpm install && pnpm --filter @avel/web build && python3 -I -c "...token check..."
install exit=0; build exit=1 (accepted, as above); the token check run on its own:
533 library tokens, 0 missing []
exit=0
```

The stand-in checks, in a scratch copy with a minimal router and a stub mock (Deviation 1):

```
$ pnpm --filter "@avel/web..." build                 -> ✓ built, exit=0
$ pnpm --filter "@avel/web..." typecheck             -> packages/contract Done, apps/web Done, exit=0
$ AVEL_API=mock pnpm build; grep -rlE '__mock|0193a000-0000-7000-8000-000000000001|contract-mock' dist
mock-env build exit=0; grep exit=1 (none found)
$ diff <DL token section> <tokens.css copy>          -> IDENTICAL
```
