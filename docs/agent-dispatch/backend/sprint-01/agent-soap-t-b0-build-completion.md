status: done
ticket: T-B0

# T-B0 build: completion report (Soap)

Stopped with `needs-cr` on the lead's stop rule: `@effect/language-service` 0.87.5 can't run against TypeScript 7.0.2. Everything else in the ticket is built and green. I did not pin an older TypeScript.

```
$ pnpm --filter @avel/server exec effect-language-service --help
ERROR TypeScriptFoundIsNot5Or6: @effect/language-service supports TypeScript 5.x and 6.x;
for TypeScript 7.x and forward use @effect/tsgo ...
```

The change request needs one of: a different package for Writing Effect rule 9 (`@effect/tsgo`, the error's own suggestion, which is a new dependency and so Javaris's approval under E5), or a TypeScript 5 or 6 side-by-side for the language service. The package is installed and pinned at 0.87.5 as the list says; nothing in the repo runs it yet.

## Decision
Stop text above kept as the record. OSA's session messaged after the stop (Javaris chose option A):

> T-B0 merges as built.
> @effect/language-service 0.87.5 stays installed and pinned, but nothing runs it, since your locked test expects that version.
> Replacing it with @effect/tsgo, so that Writing Effect rule 9 gets an automatic check, is a CR that Axis will write for next cycle. It's not part of this ticket.

## Messages received
1. From OSA's session, after the stop: Javaris chose option A for the `needs-cr`. I changed the status to `done`, added the Decision section above, and committed only this report. It narrows nothing and adds no files, so I accepted it.

`AVEL_ROOT_OVERRIDE` was set in my shell, not sent as a message; see Deviations.

## Pre-flight
Node 24.22.2, pnpm 10.33.2, `AVEL_ROOT_OVERRIDE` unset for the runs.

| Command | Result |
| --- | --- |
| `pnpm build` | passes |
| `pnpm typecheck` | passes (now includes repo-checks and server) |
| `pnpm lint` | passes (biome, 168 files) |
| `pnpm test` | passes: 27 files, 861 tests |
| `pnpm install --frozen-lockfile` | passes |
| `pnpm build && pnpm typecheck && pnpm lint && pnpm test` | passes |
| `pnpm --filter @avel/repo-checks test` | passes: 4 files, 12 tests (all 12 locked tests) |
| `pnpm --filter @avel/db exec drizzle-kit check` | "Everything's fine" |
| `pnpm --filter @avel/docs generate && git diff --exit-code docs/generated` | clean |
| `pnpm why esbuild` | one version, 0.28.2; the lockfile holds no esbuild below 0.25 |

## What changed
- `tools/repo-checks/package.json`, `tsconfig.json`, `vitest.config.ts`: the new package (`check-locks`, `typecheck`, `test`).
- `tools/repo-checks/src/check-locks.ts`: the lock check. Finds the ticket's build doc and its first-added locks.md line, reads the Territory with render.py's glob rules, checks each non-merge commit after the lock sha (a locks.md-only commit passes only if it keeps every existing line), runs `render.py --verify`, and lists every offending file.
- `.github/workflows/locks.yml`: runs it on `pull_request`, full history, head sha checked out.
- `.github/CODEOWNERS`: `*` plus the C4 paths and rule files, all `@Avel-org/operator`.
- `packages/server/package.json`, `tsconfig.json`, `vitest.config.ts`: final manifests as the notes specify.
- `apps/web/package.json`: final, as the notes specify.
- `pnpm-workspace.yaml`: the esbuild override. `pnpm-lock.yaml`: the one lockfile change.

## Contract to files
- T-B0-01 to 06: `check-locks.ts`, `package.json`, `locks.yml`.
- T-B0-07: `CODEOWNERS`.
- T-B0-08, 09: the two manifests.
- T-B0-10: the override and lockfile.
- T-B0-11: `locks.yml`.

## Deviations
- The shell had `AVEL_ROOT_OVERRIDE` set (to another session's scratch checkout). It makes render.py write there instead of into the tests' scratch repos, so the locked tests fail with it set. I unset it for my runs. One stray `render.py` run of mine wrote there before I noticed; its git status stayed clean (identical output). CI doesn't set it.
- The lock sha is read per commit from `git log` on locks.md; the workflow checks out the PR head sha rather than the merge commit so main's commits aren't counted as the builder's.
- I did not edit `docs/design/Outside sources and what we took.md`: no locked test needs it (C3). E5's licence and size statements are in the ticket's notes.
- CODEOWNERS writes the space in `Build rules.md` as `Build\ rules.md`; the `*` line covers it for the locked test's parser too.

## Limitations
- `locks.yml` and CODEOWNERS can't run until the repo exists on GitHub; the `@Avel-org/operator` team is Javaris's to create.
- A merge commit's own changes aren't checked, and the language service has never run (see the stop).
