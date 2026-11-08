status: fixed
severity: P2
title: pnpm-lock.yaml is not updated for packages/contract-mock's dependencies

Evidence: `pnpm install --frozen-lockfile` at 3183bc1 fails: `ERR_PNPM_OUTDATED_LOCKFILE ... not up to date with packages/contract-mock/package.json; 4 dependencies were added: @avel/contract@workspace:*, @orpc/openapi@1.16.2, @orpc/server@1.16.2, zod@4.6.7`. `git diff 20d2915..HEAD -- pnpm-lock.yaml` is empty. A plain `pnpm install` adds 15 lines to the lockfile.
Dependency review: the four are the contract's own pins (same exact versions), so none is new to the tree. Needs no further vetting.
Fix: INT or Ghost regenerates and commits pnpm-lock.yaml (outside Zane's territory). Until then CI, where frozen-lockfile is the default, fails.
