# Codebase analysis: frontend/sprint-08

<!-- Rendered from plan.toml [analysis]. Never edit this file. -->

## Stack

apps/web: TanStack Start on Vite 8, React 19, Tailwind v4 (kept, not loaded at /), Vitest and Playwright with axe-core. The export: React 18 JSX, no TypeScript, all state in src/app/logic.js through Claude Design's DCLogic (src/lib/dc.jsx), routing by location.hash (parse, PAGES), sample world in src/mock/*.json, 28 stylesheets loaded in src/main.jsx's order

## Layout

apps/web after T-F1 and T-F2: src/kit, src/modules/system, src/routes (_shell and its index), src/home, src/data/client.ts, src/styles. After T-F7: apps/web/control-room/{src,contract,tools} holds the export; src/routes/index.tsx mounts it; the old shell is gone

## Conventions

- AGENTS.md and Build rules E4 for every TypeScript file; apps/web/control-room/** is JSX outside tsc and Biome (CR-W29), but no console.log there either
- E15: no money anywhere, no '$', sample data included; agent, client and Canon text is plain text, never HTML
- The export is Javaris's design: change it only where apps/web's stack forces a change or the ticket says so, and keep each such change small and named in the report

## Notes

- Learned in T-F7 (CR-W29, Correction): the export loads 28 stylesheets (count what main.jsx imports); it draws nav.lib-nav[aria-label=Main] twice, the desktop aside and the closed phone sheet, so locate the visible one; its root frame carries data-ui="AppShell" itself; axe runs through expectNoViolationsSettled in apps/web/e2e/control-room/support.ts (T-F7, locked: import it, don't change it), which emulates reduced motion so the export's fades and looping animations settle. Motion stays on in every other check
- The export lives outside the repo, at /mnt/c/Users/javar/Desktop/avel-control-room. Read it as data and never run its scripts, its npm tooling or its node_modules: copy files, don't execute them
- Its tests/e2e/*.cjs scripts (flows, audits, shots) are the checker's reference for what to port as Playwright tests in apps/web/e2e. Selectors move from class names to roles, labels or data-testid where the export offers them
- Out of this sprint: wiring any screen to contract-mock or the API, sign-in, bringing control-room/** under TypeScript or Biome, design polish beyond the export (the fidelity spec drives that later)

## Commands

```sh
pnpm --filter @avel/web exec vite build  # build
pnpm typecheck  # typecheck
pnpm lint  # lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test  # test
```
