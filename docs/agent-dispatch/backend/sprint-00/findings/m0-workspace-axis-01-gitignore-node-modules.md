status: fixed
severity: P2
module: m0-workspace
reviewer: axis (review-backend)
route to: INT (`.gitignore` is in no dispatch's territory), and Axis's plan.toml

# `.gitignore` doesn't ignore `node_modules/`, `dist/` or `*.tsbuildinfo`, now that the workspace installs and builds

## What's wrong
After m0, `pnpm install` creates `node_modules/` at the root, and each package's `pnpm build` will create `dist/`. `.gitignore` ignores neither, so both show as untracked. Any later builder (m1, m2 or m3) that commits with `git add -A` or `git add .` commits them.

This is **not a defect in Atlas's diff.** `.gitignore` isn't in m0's territory (`plan.toml:78`, the m0 `territory` list, which I wrote), so Atlas couldn't fix it, and Atlas reported it (completion report, "Issues for other agents", INT). It's a gap in the workspace that Step 0 item 1 asks for, and in the plan.

## Evidence
- `.gitignore:1-5`, the whole file at the result commit:
  ```
  # Windows download metadata
  *:Zone.Identifier

  # Python bytecode
  __pycache__/
  ```
- After the task's verify command (`pnpm install && ...`) in this worktree:
  ```
  $ git status --short
  ?? node_modules/
  ```
- `biome.json:9` excludes `!**/node_modules` and `!**/dist` by hand, which covers `pnpm lint` only. `biome.json:6` (`useIgnoreFile: true`) would cover both once `.gitignore` lists them.
- Breaks: Step 0 and Step 1 plan, Step 0 "What gets built" item 1 (the workspace). A workspace whose install output can be committed by a routine `git add` isn't done.

## What fixing it means
Before m1, m2 or m3 is dispatched, add these to `.gitignore`, in a commit by INT (or by a dispatch whose territory names `.gitignore`):
```
node_modules/
dist/
*.tsbuildinfo
```
Done when `pnpm install && pnpm build` on a clean checkout leaves `git status --short` empty. For later sprints, the workspace dispatch's territory in `plan.toml` should include `.gitignore`.

## Resolution (INT, 2026-11-06)
Fixed on main: node_modules/, dist/ and *.tsbuildinfo added to .gitignore after the m0 merge, in this commit.
