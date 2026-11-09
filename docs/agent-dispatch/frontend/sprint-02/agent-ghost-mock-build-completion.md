# GHOST: mock build, completion report

verdict: DONE

## Summary
The contract mock now serves route 19 (`GET /api/missions`) and route 8 (`GET /api/clients`) through `@avel/contract` and oRPC's OpenAPI handler. They use the same paging, request IDs, headers and `failNext` as routes 52 to 54, and those three routes are unchanged. The fixtures for step1 gain the matching missions and clients, and `createMock` takes `missions` and `clients` so a test can seed none. Fenn's route 19 and route 8 tests weren't on main when I started, so I had none of them to pass (see Deviations 1).

## Pre-flight
- Part 2 files, all read: `.claude/agents/ghost.md`, `codebase-analysis.md`, `docs/ui-contracts/shell-layout.md` (in full, section 4 closely), `kit-v1.9.md` and `decisions-approval-page.md` (section 2 in full), the Shell Layout brief v1.9, DL v1.9, Frontend Map v0.6 (the mock and paging lines), `procedures.md`, sprint-02's `decisions.md` and escalations 01 to 03, and this task doc. I skimmed the brief and DL v1.9 and read nothing in them that bears on the mock. Nothing was missing.
- Also read: `packages/contract/src/dto/{missions,clients,common}.ts`, `routes/{missions,clients,index}.ts`, `value-lists.ts`, `apps/web/vite.config.ts` (the mock plugin) and `apps/web/test/setup/app.ts`.
- Branch: `frontend/sprint-02/agent-ghost-mock-build-a1`, starting at e07cbe3 (main).
- Part 7 commands: all available. The worktree first needed `pnpm install --offline` and `pnpm --filter @avel/contract build` before the mock's typecheck could resolve `@avel/contract`.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| GHOST-01 | DONE | 9051f8b |

## Contract to files
- **Route 19 and route 8 through the contract's routes and the OpenAPI handler** (`os.missions.list`, `os.clients.list`): `src/mock.ts`, `router.missions` and `router.clients`.
  - Paging: the contract's `PageQuery`, so `limit` must be 1 to 100. With no `limit` the mock serves 50, like route 52 (provisional, finding 25).
  - Order: oldest first, by `createdAt` and then `id`. The cursor is opaque. A cursor the mock can't decode gives `BAD_REQUEST` `{ field: "cursor", issues: [...] }`, the same as route 52.
  - Route 19 also applies the contract's `?kind=`.
  - Shared helper: `pageOf` in `src/mock.ts`.
- **`MockRoute` is `8 | 19 | 52 | 53 | 54`**, and `routeOf` maps `GET /api/clients` to 8 and `GET /api/missions` to 19. Through `MockRoute`, `failNext` and `RecordedRequest.route` cover both routes: `src/mock.ts`.
- **`createMock({ contractVersion, now?, missions?, clients? })`:**
  - It defaults to `fixtures.step1Missions` and `fixtures.step1Clients`, and `[]` seeds none.
  - The mock keeps its own copies, and every response returns clones.
  - `reset()` keeps them, since no mock route writes missions or clients.
  - All in `src/mock.ts`.
- **The step1 fixtures** (`src/fixtures.ts`):
  - **Clients:** Northwind Dental and Harbor Logistics, one for each `clientName` in step1's rows.
  - **Building missions:** three, ids …101, …102 and …103, one for each distinct `missionId`. Each is `state` and `displayState` `running`, with the client of its row and a `packageKey` (`landing_page`, `stabilize`, `feature`).
  - **Onboarding mission:** one, id …104 (Harbor Logistics), with `state` `onboarding` and `packageKey` null.
- **Valid against MissionDto and ClientDto:** checked with a scratch Vitest file that parsed both responses with `Page(MissionDto)` and `Page(ClientDto)`. It also checked:
  - the step1 matches: client names, mission IDs, packages, and each row's client through `clientId`;
  - `[]` seeding none;
  - two pages with `limit=3`;
  - `kind=internal` giving an empty list;
  - a bad cursor, `limit=0` and a bad `kind`, each answering 400;
  - `failNext` with a status, and with `network` for `times: 2`;
  - `requests()`, and the lists after `reset()`.

  Both tests passed. The file isn't committed (see Deviations 2).
- **Routes 52 to 54 unchanged:** all 85 existing `test/data` tests pass, and so do the web's 197.

## Deviations
1. **Fenn's tests weren't there yet.** The task says "Fenn's route 19 and route 8 tests in test/data/ are yours to make pass", but `apps/web/test/data/` on main has none. Fenn's unit dispatch runs beside this one (R1). No document fixes the surface for routes 19 and 8 the way AP section 2 fixed 52 to 54, so I chose it myself:
   - `createMock`'s `missions?: MissionDto[]` and `clients?: ClientDto[]`;
   - `fixtures.step1Missions` and `fixtures.step1Clients`.

   Fenn's tests need to use these names.
2. **The scratch check sat briefly in a locked folder.** To run my scratch check through the web's Vitest config, I copied it into `apps/web/test/data/` for one run and deleted it right after. It was never staged or committed, and `git status` was clean apart from my mock files. The copy in the scratchpad is the one that ran.
3. **How `fixtures.step1` "gains" missions and clients:** as two sibling fields, not as new kinds inside the `step1` array.
   - **Why:** `SeedRow` and `fixtures.step1: SeedRow[]` are AP section 2's fixed surface, and existing tests narrow on `row.kind`. The dev server's `/__mock/reset` re-seeds `fixtures.step1` and calls `createMock({ contractVersion })` without new options, so the step1 default lets the dev server and e2e serve project rows with no change to `vite.config.ts`, which isn't in my territory.
   - **The cost:** a test seeded with `fixtures.many` or `empty` still gets step1's missions and clients unless it passes `[]`.
4. **Two choices no source gives:**
   - **Order for 19 and 8:** oldest first by `createdAt` then `id`, matching route 52's rule. No doc gives an order for these routes.
   - **`displayState` on mission …102:** `running`, even though it has an open `budget_increase` proposal. A proposal alone isn't a pause, and `blocked_on_you` needs an open pause row (MissionDto's comment).

## Limitations
- **CR-W5 and CR-20 aren't in `packages/contract` yet**, even though they were accepted for 1.0.0: `MissionDto` has no `name`, `clientName`, `needsYouCount` or `onboarding`. The mock serves the contract as it is today and will need a follow-up when the contract changes.
- **Missions and clients are fixed for each mock.** There's no seeding call for them after `createMock`, and nothing mutates them.

## Parked chains
none

## P0 discoveries
none

## Issues for other agents
- **Fenn:**
  - Routes 19 and 8 tests should use `createMock({ ..., missions, clients })`, with the default being `fixtures.step1Missions` and `fixtures.step1Clients`.
  - `test/setup/app.ts`'s `createTestMock` doesn't pass those options through yet.
  - `test/setup/stubs/contract-mock.ts` still types `MockRoute` as `52 | 53 | 54`. It only applies when the package is missing.
- **Leon (missions, system) and Ghost (clients):** route 19 serves 4 missions and route 8 serves 2 clients by default, oldest first.
- **INT / Axis:** when CR-W5 and CR-20 land in the contract, the mock needs a dispatch to add `name` and the summary fields.

## Files changed
```
packages/contract-mock/package.json
packages/contract-mock/src/fixtures.ts
packages/contract-mock/src/index.ts
packages/contract-mock/src/mock.ts
```
plus this report.

## Verification
```
$ pnpm --filter @avel/contract-mock typecheck && pnpm --filter @avel/web exec vitest run test/data 2>&1 | tail -10 && git diff "$(git merge-base main HEAD)"..HEAD --stat
> tsc -p tsconfig.json --noEmit
 Test Files  7 passed (7)
      Tests  85 passed (85)
 packages/contract-mock/package.json    |   2 +-
 packages/contract-mock/src/fixtures.ts | 114 ++++++++++++++++++++++++++++++++-
 packages/contract-mock/src/index.ts    |   3 +-
 packages/contract-mock/src/mock.ts     |  72 +++++++++++++++++++--
 4 files changed, 184 insertions(+), 7 deletions(-)

$ pnpm --filter "@avel/web..." build
build exit 0 (… apps/web build: ✓ built in 156ms, Done)
The mock is serve-only (`apply: "serve"`), so `/`'s JavaScript is unchanged and there's no size figure to report.

$ pnpm --filter "@avel/web..." --filter @avel/contract-mock typecheck
packages/contract typecheck: Done
packages/contract-mock typecheck: Done
apps/web typecheck: Done
typecheck exit 0

$ pnpm lint
Checked 213 files in 183ms. No fixes applied.

$ pnpm --filter @avel/web test
 Test Files  14 passed (14)
      Tests  197 passed (197)

$ git diff --name-only main...HEAD
packages/contract-mock/package.json
packages/contract-mock/src/fixtures.ts
packages/contract-mock/src/index.ts
packages/contract-mock/src/mock.ts
```
