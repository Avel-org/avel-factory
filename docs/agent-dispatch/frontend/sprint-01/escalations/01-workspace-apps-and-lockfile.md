# Escalation 01: the workspace root doesn't hold apps/web, and the lockfile has no frontend owner

From Zero (frontend lead), 2026-11-06. **To:** INT, and Axis for the backend files. **Blocks:** every frontend sprint-01 dispatch except Brennan's review of the UI contract.

## What's missing

The root workspace files are backend territory: Atlas wrote them in backend sprint-00 m0, and the frontend never edits them (Roster setup and sessions, rule 3).

1. **`pnpm-workspace.yaml` lists only `packages/*` and `tools/*`.** The web app is `apps/web` (Frontend Map v0.6, Folder layout and Territories for Gate 1). Until `apps/*` is listed, `pnpm --filter @avel/web …` matches nothing, and every command in the frontend plan's `[commands]` does nothing.
2. **`vitest.workspace.ts` collects projects from `packages` and `tools` only.** Root `pnpm test` (and CI) won't run `apps/web`'s tests until `apps` is added to the list on its line 13. `packages/contract-mock` is already covered.
3. **`pnpm-lock.yaml`** changes whenever a package adds a dependency. In this sprint that's Nemi (`apps/web/package.json`) and Ghost (`packages/contract-mock/package.json`). Neither the frontend territories nor `render.py` (two dispatches can't share a path) let a frontend dispatch commit it.

## What I propose

1. **Items 1 and 2:**
   - `pnpm-workspace.yaml` gains `- apps/*`;
   - `vitest.workspace.ts` collects from `["apps", "packages", "tools"]`.

   It's a two-line backend change, and Atlas or Axis does it on the backend side.
2. **Item 3:** **INT regenerates and commits `pnpm-lock.yaml` when merging** a dispatch that changes a `package.json`: run `pnpm install` on main after the merge and commit the lockfile on its own. Frontend dispatches run `pnpm install` locally and don't commit the lockfile, and their reports list the dependencies they added with resolved versions. Zane's dependency review reads `package.json`.
   - The alternative is to give the lockfile to one dispatch per sprint. That doesn't work here, because two of this sprint's dispatches add dependencies.

## What the plan already assumes

`plan.toml` follows proposal 2: Nemi's and Ghost's notes say not to commit the lockfile. If INT decides otherwise, I change the plan and re-render before anything dispatches.
