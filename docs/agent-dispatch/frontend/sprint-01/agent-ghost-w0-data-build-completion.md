# GHOST: w0-data build, completion report

verdict: PARTIAL

## Summary
Attempt a2. GHOST-04 (getRouter() forwards the incoming `X-Request-Id` only if it matches `^[A-Za-z0-9-]{1,64}$`) and GHOST-05 (`UiError.stale.message`) are done and committed. **GHOST-03 (zod/mini) is BLOCKED:** Axis's S1-6 isn't merged on main. `git grep -nE "from ['\"]zod['\"]" packages/contract/src` lists 23 files, and the task's notes say to stop and report in that case, so I didn't start it. GHOST-01 and GHOST-02 were merged in a1 (db023bf) and weren't redone.

## Pre-flight
- **Branch:** `frontend/sprint-01/agent-ghost-w0-data-build-a2`, start commit 5230729 (= main at the start).
- **S1-6 check, before anything else:** `git grep -nE "from ['\"]zod['\"]" packages/contract/src` (also on `main`) lists 23 files (`errors.ts`, `completion-report.ts` and all 21 `dto/*.ts`). S1-6 isn't merged, so GHOST-04 and GHOST-05 went first (the task's notes), and GHOST-03 is blocked.
- **Part 2 files, all read:**
  1. `.claude/agents/ghost.md`: read
  2. `codebase-analysis.md`: read
  3. `docs/ui-contracts/decisions-approval-page.md`: read. Sections 0 to 3, 5.3, 7 and 8 in full; the rest skimmed
  4. `docs/design/CR-W2 Pending decisions.md`: read, sections 1 to 8
  5. `decisions.md`: read. Revision 6 onward and "after S1-6" in full; the rest skimmed
  6. Frontend Map v0.6: read. Layers, Rendering and SSR, and Data layer in full
  7. The design library v1.1 HTML: skimmed. Nothing in GHOST-03 to 05 draws UI
  8. The Step 0 and Step 1 plan: skimmed (item 13)
  9. UI contract sections 1 to 3: read in full
  10. CR-W2 sections 1 to 6: read in full
  11. `packages/contract/src/routes/decisions.ts`: read
  12. `packages/contract/src/errors.ts`: read
  13. FM's Data layer and Rendering and SSR: read
  14. This task doc: read in full
- **Part 7 commands:** all available after `pnpm install` and `pnpm --filter @avel/contract build`. The lockfile wasn't changed and isn't committed.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| GHOST-01 | DONE (in a1, merged; not redone in a2) | db023bf (a1 merge) |
| GHOST-02 | DONE (in a1, merged; not redone in a2) | db023bf (a1 merge) |
| GHOST-03 | BLOCKED: S1-6 isn't merged on main (the notes' stop-and-report) | none |
| GHOST-04 | DONE | 1f6c6a8 |
| GHOST-05 | DONE | f245139 |

## Contract to files
- **GHOST-04, UI contract section 3, "On the server" (Zane's w0-data 03).** `apps/web/src/router.tsx`:
  - `FORWARDABLE_REQUEST_ID = /^[A-Za-z0-9-]{1,64}$/`.
  - `apiOptions`' `.server(…)` passes `requestId` only when the header is present and matches. Otherwise it passes none, and the fetch wrapper makes a new UUID.
  - A UUID is hex digits and hyphens, 36 characters, so "a UUID or matches the pattern" reduces to the pattern alone. The comment says so.
  - The request accessor is unchanged: TanStack Start's `getRequest()` from `@tanstack/react-start/server`, inside `createIsomorphicFn().server(…)`.
  - The regex isn't in the client bundle: `grep -l 'A-Za-z0-9-' apps/web/dist/client/assets/*.js` lists nothing.
- **How I exercised a forged value** (a throwaway Vitest probe in my session's scratchpad, not committed):
  - The probe calls the real `getRouter()`. Start's `getRequest`, `createIsomorphicFn`, the router and the SSR integration are aliased to stubs, so the `.server` branch runs on a `Request` I build. `createApi` is mocked to record the `ApiOptions` it gets.
  - **Forwarded unchanged:** a UUID, 64 × `a`, and `req-ABC-123`.
  - **Gives `{ baseUrl }` with no `requestId`:** no header, `""`, 65 × `a`, `abc\tdef` (a control character), `abc def`, `abc_def`, `<script>`, and two `X-Request-Id` headers (Headers joins them as `a, b`).
  - A value with CR/LF can't be built at all: `new Headers(...)` throws.
  - The probe passed 4 of 4. Run against the old condition (`requestId ? …`), 2 of 4 failed (the forged-values test and the joined-headers test), so it does catch the change.
- **GHOST-05, UI contract section 3's `UiError` table, `stale`'s `message`.** `apps/web/src/data/errors.ts`:
  - `UiError`'s `stale` member gains `message: string`.
  - `byStatus` takes a `bodyMessage`. The `ApiError` branch passes the `ErrorBody`'s message, and the other-`ORPCError` branch passes `""`. That branch can't reach `stale`, because its `code` is null, but the value is set as the table says.
  - `ApiError` gains `readonly bodyMessage: string` (Deviation 1).
  - Nothing else in `UiError` changes.
  - **Probed** (same scratch setup): `decodeErrorBody` of a `STALE_VERSION` body, then `toUiError`, gives `message` equal to the body's; a `STALE_VERSION` with no details gives `currentVersion: null` and keeps `message`; `message: ""` stays `""`.
- **Locked tests:** the w0-data tests pass 85 of 85, unchanged. `test/modules/decisions` gives the same 37 failures before and after my change (diffed by test name). Every one is `screens.ts should export the screen as DecisionsScreen`, because Leon's module isn't on main.
- **Dependencies added:** none.

## Deviations
1. **`ApiError.bodyMessage` (a field section 3 doesn't list).** `ORPCError`'s constructor replaces an empty message with a fallback (`@orpc/client` `fallbackORPCErrorMessage`: `message || COMMON_ORPC_ERROR_DEFS[code]?.message || code`). So for a body with `message: ""`, `ApiError.message` is `"STALE_VERSION"`, not the body's message. To make `UiError.stale.message` the `ErrorBody`'s message exactly, as the table says, `ApiError` keeps the body's message as sent in a read-only `bodyMessage`. `code`, `status`, `message` and `data` are unchanged. My probe caught this. Zero or Brennan may want section 3's `ApiError` line to name the field.
2. **GHOST-03 not done** (blocked; see Limitations). The task doc says to stop and report.

## Limitations
- **GHOST-03 is open:**
  - `data/pending-decisions.ts` is still classic `zod`, and `client.ts`'s type import too, as section 3 allows "until then".
  - The first load is unchanged: the client entry `index-ByP-vyWz.js` is 155.43 kB gzip, the only JS file the build emits for `/` on main + my diff.
  - GHOST-03's before-and-after measurement isn't done.
  - It needs a new attempt (a3) once Axis's S1-6 is merged.
- **`conflict`, `forbidden` and `unprocessable`** still read `ApiError.message`. For an `ErrorBody` whose `message` is `""`, they show oRPC's fallback (`"Conflict"`, `"Forbidden"`, …, or the code), not `""`. I didn't change it: GHOST-05 says nothing else in `UiError` changes. That's for Zero to decide.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **INT:** GHOST-03 waits on S1-6. When Axis's S1-6 is merged, dispatch w0-data a3 for GHOST-03 alone. GHOST-04 and GHOST-05 are on this branch and can merge first.
- **Leon (decisions a2):** once this merges, `UiError.stale.message` is there for 5.3's null-version row. It's always a string: the `ErrorBody`'s message, or `""`.
- **Zane (w0-data a2 security check):** a1's `requestId ? …` truthiness check is replaced by the pattern check, at the header read in `router.tsx`. The forged values I tried are listed under Contract to files.
- **Zero / Brennan:** Deviation 1 (`ApiError.bodyMessage`), and the empty-message fallback on the other message-carrying kinds (Limitations).

## Files changed
```
apps/web/src/data/errors.ts
apps/web/src/router.tsx
docs/agent-dispatch/frontend/sprint-01/agent-ghost-w0-data-build-completion.md
```

## Verification
The first three commands were run after `pnpm install` and `pnpm --filter @avel/contract build`, with `set -o pipefail`.

```
$ pnpm --filter "@avel/web..." build
Scope: 3 of 6 workspace projects
packages/contract build$ tsc -p tsconfig.json
packages/contract build: Done
apps/web build$ vite build
apps/web build: vite v8.3.6 building client environment for production...
apps/web build: ✓ 310 modules transformed.
apps/web build: dist/client/assets/ibm-plex-mono-400-DMJ8VG8y.woff2   14.70 kB
apps/web build: dist/client/assets/ibm-plex-mono-500-DSY6xOcd.woff2   14.88 kB
apps/web build: dist/client/assets/inter-variable-Dx4kXJAl.woff2      48.25 kB
apps/web build: dist/client/assets/app-CCOL2GSK.css                   31.88 kB │ gzip:   6.94 kB
apps/web build: dist/client/assets/index-ByP-vyWz.js                 496.90 kB │ gzip: 155.43 kB
apps/web build: ✓ built in 326ms
apps/web build: vite v8.3.6 building ssr environment for production...
apps/web build: ✓ 134 modules transformed.
apps/web build: dist/server/assets/empty-plugin-adapters-BsRz-CQL.js         0.26 kB │ gzip:  0.17 kB
apps/web build: dist/server/assets/start-CX3T2L7y.js                         0.27 kB │ gzip:  0.19 kB
apps/web build: dist/server/assets/_tanstack-start-manifest_v-CxuuV8RZ.js    0.39 kB │ gzip:  0.29 kB
apps/web build: dist/server/assets/router-BWWX3jah.js                       28.28 kB │ gzip:  9.65 kB
apps/web build: dist/server/server.js                                      261.19 kB │ gzip: 63.19 kB
apps/web build: ✓ built in 142ms
apps/web build: Done
exit=0
```

```
$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
Scope: 3 of 6 workspace projects
packages/contract typecheck$ tsc -p tsconfig.json --noEmit
packages/contract typecheck: Done
packages/contract-mock typecheck$ tsc -p tsconfig.json --noEmit
packages/contract-mock typecheck: Done
apps/web typecheck$ node -e "import('vite').then((vite) => vite.resolveConfig({}, 'build'))" && tsc -p tsconfig.json
apps/web typecheck: Done
exit=0
```

```
$ pnpm lint
> biome check .
Checked 198 files in 143ms. No fixes applied.
exit=0
```

Exit 1, the same as main: every failure is in `test/modules/decisions`, because Leon's module isn't merged (`screens.ts should export the screen as DecisionsScreen: expected undefined to be defined`). Every other test file passes: data 85, kit 68.

```
$ pnpm --filter @avel/web test
 ❯ |web| test/modules/decisions/list.test.tsx (13 tests | 13 failed)
 ❯ |web| test/modules/decisions/errors.test.tsx (16 tests | 16 failed)
 ❯ |web| test/modules/decisions/deciding.test.tsx (7 tests | 7 failed)
 ❯ |web| test/modules/decisions/contract-version.test.tsx (1 test | 1 failed)
 Test Files  4 failed | 10 passed (14)
      Tests  37 failed | 153 passed (190)
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @avel/web@0.0.0 test: `vitest run`
exit=1
```

```
$ git diff --name-only main...HEAD   # before the report commit
apps/web/src/data/errors.ts
apps/web/src/router.tsx
```

The task verifies:

```
$ pnpm --filter @avel/web exec vitest run test/data       # GHOST-04, GHOST-05
 Test Files  7 passed (7)
      Tests  85 passed (85)
$ grep -n 'A-Za-z0-9-' apps/web/src/router.tsx             # GHOST-04
17:const FORWARDABLE_REQUEST_ID = /^[A-Za-z0-9-]{1,64}$/;
$ pnpm --filter @avel/web exec vitest run test/modules/decisions   # GHOST-05: before and after
 Test Files  4 failed (4)
      Tests  37 failed (37)          # the same 37 test names before and after (diffed)
```

Zane's production-build check: `grep -c '__mock\|0193a000-0000-7000-8000-000000000001' apps/web/dist/client/assets/*.js` gives `0`.
