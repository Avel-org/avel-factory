# Codebase analysis: frontend/sprint-12

<!-- Rendered from plan.toml [analysis]. Never edit this file. -->

## Stack

TanStack Start 1.169 with TanStack Router 1.170, React 19.3, Vite. / renders the export on the client only (ssr: false); __root's beforeLoad already reads the theme cookie through createServerFn. Playwright 1.64 with axe-core; playwright.config.ts starts a vite dev server with AVEL_API=mock, whose /api middleware is contract-mock's fetch

## Layout

apps/web/src (TanStack routes, data/client.ts), apps/web/control-room (the export, plain JSX, SOURCE.md logs every change), apps/web/e2e and apps/web/test

## Conventions

- AGENTS.md; CR-W29 E4: new code is strict TypeScript and Biome-clean; the export's JSX changes only where a ticket says, each change logged in SOURCE.md
- No new dependency: there's no TanStack Query and no better-auth in apps/web. login.md's QueryClient parts read as the router context here (see the ticket's notes)

## Notes

- login.md was written for the pre-export shell (modules/system, _shell, QueryClient). This ticket's notes say how it maps onto the export; where they disagree with login.md, the notes win

## Commands

```sh
pnpm build  # build
pnpm typecheck  # typecheck
pnpm lint  # lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test  # test
```
