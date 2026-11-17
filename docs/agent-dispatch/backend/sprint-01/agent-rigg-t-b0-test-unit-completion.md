status: done
ticket: T-B0

# T-B0 tests: completion report (Rigg)

## Messages received
None. I acted only on the task doc and the `/dispatch` command.

## Pre-flight
Run on the start commit plus my new tests (node 24.22.2 from nvm; pnpm 10.33.2; `scripts/pg-local.sh` Postgres).

| Command | Result |
| --- | --- |
| `pnpm build` | passes |
| `pnpm typecheck` | passes (repo-checks has no tsconfig yet, so my files aren't typechecked: Soap's `tsconfig.json` will include `test`) |
| `pnpm lint` | passes (biome, 159 files) |
| `pnpm test` | **fails as intended**: 11 failed (all mine) / 849 passed |
| `pnpm install --frozen-lockfile` | passes |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | fails only at `pnpm test`, the 11 new tests |
| `pnpm --filter @avel/repo-checks test` | "No projects matched the filters", exit 0: the package doesn't exist yet. Soap's job |
| `pnpm --filter @avel/db exec drizzle-kit check` | "Everything's fine" |
| `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated` | clean |
| `pnpm why esbuild` | prints 0.28.2 only (it follows the root's dependents); the lockfile still holds 0.18.20 (drizzle-kit), which test 10 catches |

## Failing first
On the start commit (no `tools/repo-checks` package, no CODEOWNERS, no locks workflow, no server or web manifest), all 11 fail:

```
 × CODEOWNERS > every C4 area path and every rule file is owned by @Avel-org/operator
     ENOENT: open '.github/CODEOWNERS'
 × dependencies > the server and web manifests pin the approved packages at exact versions
     ENOENT: open 'packages/server/package.json'
 × dependencies > apps/web has exactly the scripts dev, preview, test and e2e, and sideEffects for css
     ENOENT: open 'apps/web/package.json'
 × dependencies > pnpm-lock.yaml holds no esbuild below 0.25
     expected [ '0.18.20' ] to deeply equal []
 × workflow > locks.yml runs the lock check on pull_request with fetch-depth 0
     ENOENT: open '.github/workflows/locks.yml'
 × lock check > a builder commit inside the build doc's Territory passes
     expected 'No projects matched the filters in ...' to contain 'lock check passed'
 × lock check > a builder commit touching a file outside the Territory fails and names the file
     expected +0 to be 1
 × lock check > a builder commit touching a locked path fails, even when the path also matches the Territory
     expected +0 to be 1
 × lock check > commits at or before the lock sha aren't held to the builder's Territory
     expected 'No projects matched the filters in ...' to contain 'lock check passed'
 × lock check > a t/* branch with no rendered build doc or no locks.md line fails with a reason
     expected +0 to be 1
 × lock check > a branch not named t/* passes and says it isn't a ticket PR
     expected 'No projects matched the filters in ...' to contain 'not a ticket PR'
```

## What changed
All in `tools/repo-checks/test/`:
- `helpers.ts`: builds scratch git repos (render.py, roster.json and the example plan, rendered and committed), runs the check as `pnpm --filter @avel/repo-checks run check-locks`. **Its header comment is the locked CLI interface Soap builds to.**
- `locks.test.ts`: T-B0-01 to 06.
- `codeowners.test.ts`: T-B0-07 (a small gitignore-style matcher, last match wins).
- `dependencies.test.ts`: T-B0-08, 09, 10.
- `workflow.test.ts`: T-B0-11.
- This report.

## Contract to files
| Task | Test |
| --- | --- |
| 01 inside Territory passes | locks.test.ts, first test |
| 02 outside file fails and is named | locks.test.ts, second |
| 03 locked path fails even inside Territory | locks.test.ts, third (a glob-matched locked path, and the locked test itself) |
| 04 commits at or before lock sha exempt | locks.test.ts, fourth |
| 05 no build doc / no lock line | locks.test.ts, fifth (two cases, one behaviour) |
| 06 non-t/* branch | locks.test.ts, sixth |
| 07 CODEOWNERS | codeowners.test.ts |
| 08 exact pins | dependencies.test.ts, first |
| 09 web scripts and sideEffects | dependencies.test.ts, second |
| 10 no esbuild below 0.25 | dependencies.test.ts, third |
| 11 locks.yml | workflow.test.ts |

## Deviations
- **The lock check's interface wasn't specified**, so I fixed one in `helpers.ts` (script name `check-locks`, env `AVEL_REPO_ROOT` and `GITHUB_HEAD_REF`, output strings "lock check passed" and "not a ticket PR", exit 1 on failure). Axis should read that header before locking; if it's wrong, it's a change to my tests before the lock, not a dispute later.
- **The lead's lock commit.** Build rules say the lead writes `locks.md` after the tests, so that commit lands after the lock SHA. I assumed a commit changing only the sprint's `locks.md` isn't a builder commit. Stated in the interface header. Without that, no builder commit could ever pass.
- **CODEOWNERS** is checked by sample files, not by the ticket's brace shorthand: CODEOWNERS has no `{a,b}` syntax, so each path must be spelled out.
- **Lock line SHA.** A report can't hold its own commit's SHA, so the lock line below uses the tests commit (`b410331`), and my report is a second commit that touches only the report.
- `node` wasn't on PATH; I used the nvm node 24.22.2. Engines says >=22.12, so this is fine.
- No Postgres or `TestClock` is used: nothing in T-B0 touches a database or time.

## Limitations
- The lock check's passing cases (1 and 4) and `render.py --verify` can't be proven against a real implementation until Soap builds; the fixture itself was verified (render, commit, `--verify` passes in a scratch repo).
- `@effect/language-service` against TypeScript 7 isn't tested here; the ticket says to stop with needs-cr if it can't run (Soap's check).
- The lock-check's merge-commit handling (a PR head that merged main) and `locks.md` read from the PR tree, not from main (anyone changing it is a rule-file change CODEOWNERS covers), aren't tested.
- The dependency test checks the approved list as a subset (extra dependencies aren't rejected), and doesn't check the server's scripts, tsconfig or vitest config, or the pnpm override in `pnpm-workspace.yaml` (only its effect on the lockfile).
- Locked CODEOWNERS, workflow and lockfile tests read the real repo, so they will also guard later tickets.

## Lock line
`- T-B0: tools/repo-checks/test/** @ b4103317bea595a30a125681655c6e74477da517`
