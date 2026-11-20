# Codebase analysis: frontend/sprint-14

<!-- Rendered from plan.toml [analysis]. Never edit this file. -->

## Stack

As sprint-12. The client is src/data/client.ts over @avel/contract/minified (T-F14); the export reaches it only through control-room/src/lib/api.js; each screen group reads one source in control-room/src/sources/

## Layout

apps/web/control-room/src/sources/{decisions,missions,canon,plan,build,release}.js (T-F14), the pages under control-room/src/pages, each ticket's log in control-room/changes/<ticket id>.md

## Conventions

- AGENTS.md; CR-W29 E4; no new dependency; screens never call fetch or the client: their source does
- E15: no money except AI cost against its cap; agent, client and Canon text renders as plain text; approvals never ask for a password
- A screen ticket switches its own source to the API and changes only that source, its own pages and its changes file. If logic.js, operations.js or another source needs a change, stop with out-of-scope and say what

## Notes

- The sample world stays for every source this sprint doesn't switch, and for the export's own review switches (?sim=every, ?osa=1)
- Run only your ticket's specs while you work; CI runs the whole suite

## Commands

```sh
pnpm build  # build
pnpm typecheck  # typecheck
pnpm lint  # lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test  # test
```
