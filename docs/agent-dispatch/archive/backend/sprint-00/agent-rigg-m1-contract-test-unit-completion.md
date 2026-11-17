# RIGG: m1-contract test-unit, completion report

verdict: DONE

## Summary
Done-when 5, 6 and 7 are written as 44 Vitest tests under `packages/contract/test/`. With no contract on main, 42 fail with assertions and 2 fixture self-checks pass (named as pinning existing behaviour), the same on 3 runs. Not covered: the OpenAPI half of 5 (m3) and rep-field checks (not in my done-when).

## Pre-flight
- Part 2 files: all read (the DB map HTML only for its value-list CHECKs, via contract.md Appendix A; Canon, Frontend Map and Schema vs DATABASE.md skimmed or not opened beyond what contract.md quotes).
- Branch `backend/sprint-00/agent-rigg-m1-contract-test-unit-a1`, start commit 6186c57.
- `pnpm build`, `typecheck`, `lint`, `test`: all available.

## Tasks
| Task | Status | Commit |
| --- | --- | --- |
| RIGG-01 | DONE | 6a61fb2 |

## Tests
All in `packages/contract/test/`. Every name starts "done-when N:". Each fails first with `AssertionError`: "packages/contract/src/index.ts does not exist yet" unless noted.
- **5**, `routes.test.ts`: package is `@avel/contract` (fails: package.json missing); `pnpm --filter @avel/contract build` exits 0 (fails: "No projects matched the filters"); the contract defines exactly 102 routes, each once; every route has an explicit method and path; the pairs equal the snapshot (`fixtures/expected-routes.ts`: API routes.md's 99, Library per kind, plus CR-16's 3); CR-16's 3 are in; nothing outside the contract (auth, webhook, git); Library per-kind paths. Pins existing behaviour (passes): the expected list is 99 + 3, no repeats.
- **6**, `value-lists.test.ts`: each of the 104 CHECKed columns (map's 99 from `fixtures/map-value-lists.ts`, section 3's changes applied, 5 new lists) has an exported list with exactly its values; 21 named lists by name (section 3 plus `AttemptOutcome`, `FindingState`); `DispatchState` holds `parked` (D8); `FactKind` = `Topic` + 11; the added role, work-kind, level and commit-kind values; `claimed` in, `leased` in no list (CR-6); no list holds a value twice; no two lists have the same values (D18). Pins existing behaviour (passes): 99 + 5 = 104 expected lists.
- **7**, `event-owners.test.ts`: the owner map has exactly the 12 kinds; each owner is as in section 5; type tests compile fixtures with tsc against the contract's real types: the map is exactly `Record<EventKind, Module>` (same keys, no index signature); three expected compile errors: a map missing `mission.closed` (TS2741), an owner for a non-kind (TS2353), an unknown `EventKind` (TS2322).
- Helpers: `helpers/contract.ts`.

## Lock
Tests commit: 6a61fb2.

`- m1-contract · 6a61fb2 · packages/contract/test/**`

## Contract to files
- E3, D4 (102 routes), done-when 5: `routes.test.ts`, `fixtures/expected-routes.ts`.
- E1, D18, done-when 6: `value-lists.test.ts`, `fixtures/map-value-lists.ts`.
- E5, O1, done-when 7: `event-owners.test.ts`.

## Deviations
- The tests were first written without Axis's export names (contract.md leaves them open), so lists are matched by value, the route list by `~orpc.route`, and the owner map by shape. Names used: `EventKind` (type) and the section 3 and example list names. INT offered Axis's names (`valueLists`, `eventOwners`, `contract`, `Module`); I did not adopt them, since the tests are locked and name-agnostic. Not run against Axis's branch.
- I validated the tests against a throwaway stub contract (42 of 44 passed before a stub package.json). The stub was never committed and INT removed it.
- The type fixtures are generated inside the test into a temp dir, not committed `.ts` files, so no committed file has a deliberate type error.

## Limitations
- Not run against a real contract; assumes entry `packages/contract/src/index.ts` and that route procedures expose `~orpc.route` with an explicit method.
- The build test needs `packages/contract/package.json` with a `build` script.
- `pnpm typecheck` at the root does not cover my test files; I checked them with a scratch tsconfig (clean).
- Done-when 7 pins exactly 12 kinds; a later step adding kinds must unlock it.

## Parked chains
None.

## P0 discoveries
None.

## Issues for other agents
- Axis: the entry, `Record<EventKind, Module>` and the value-list names above; a package named `@avel/contract` with a `build` script.
- INT: the sandbox denied my `rm` of stub files; INT cleaned them.

## Files changed
```
packages/contract/test/event-owners.test.ts
packages/contract/test/fixtures/expected-routes.ts
packages/contract/test/fixtures/map-value-lists.ts
packages/contract/test/helpers/contract.ts
packages/contract/test/routes.test.ts
packages/contract/test/value-lists.test.ts
```
(plus this report)

## Verification
- `pnpm build`: "No projects matched the filters", exit 0.
- `pnpm typecheck`: exit 0.
- `pnpm lint`: "Checked 13 files, No fixes applied", exit 0.
- `pnpm test`: Test Files 3 failed (3); Tests 42 failed | 2 passed (44); exit 1 (expected: fail first). Three runs: identical failure set.
- `git diff --name-only main...HEAD`: the six test paths above.
