status: done
ticket: T-B5

## Pre-flight
- `pnpm build`: pass
- `pnpm typecheck`: pass (after fixing one type error in my own change)
- `pnpm lint`: pass (2 existing warnings in apps/web, not mine)
- `pnpm test`: pass, 40 files, 920 tests. An earlier run had one failing test that I did not identify; the rerun was green.
- `pnpm --filter @avel/repo-checks test`: pass, 24 of 24 (7 locked T-B5 tests)
- `pnpm build && pnpm typecheck && pnpm lint && pnpm test`: each part passed on the final tree

## What changed
- `tools/repo-checks/src/check-locks.ts`:
  - `findBuildDoc` matches the doc whose front matter `branch:` equals `GITHUB_HEAD_REF`.
  - The range is `rev-list --first-parent`, so merges are checked. A merge is held to the files its result changed against every parent (`diff-tree -c`).
  - F2 relock lines are validated: `(F2 relock)` suffix, the first line's paths or more, the sha a descendant of the previous lock sha and an ancestor of HEAD, added in a locks.md-only commit. An invalid second line fails and names locks.md.
  - Commits up to a relock's sha are exempt from the locked-path check only. The Territory still applies to them.
  - Locked paths apply from the latest lock whose sha is an ancestor of the commit.
- This report.

## Contract to files
T-B5-01 to 03 are the first-parent walk with `-c`. T-B5-04 is `findBuildDoc`. T-B5-05 to 07 are the relock validation and the freeze.

## Deviations
None.

## Limitations
- `--first-parent` skips commits that arrive through a merge's second parent. An out-of-Territory change made on a side branch and merged in is not seen, because the check can't tell side commits from main's own without a main ref.
- CI can't tell who added a relock. The reviewer checks it follows a lead-decided test-dispute (F2).

## Messages received
- OSA, relaying Axis: put `~/.nvm/versions/node/v24.22.2/bin` first on PATH before pnpm. I did, since it narrows nothing in the ticket.
