status: open
severity: P2
owner: Zero (app-shell.md section 3), then Leon

# shell-uic-brennan-03: the stub routes are route files for screens other modules own, and the contract doesn't name the files or say who takes them over

## What the contract says
- `app-shell.md:199`: "Each row but Decisions has a route file under `_shell` (`ssr: true`, no loader) rendering `system`'s `PlannedScreen`."
- `app-shell.md:214`: the focus-mode stub is "`/missions/$missionId/onboarding`".
- `app-shell.md:196`: "Library's `href`: FM's route is `/library/$kind`. The nav opens its first kind, `skills`."

## What FM says
- **Territories for Gate 1** (FM:437): "Routes | `apps/web/src/routes/**` | Leon, one route file per screen the dispatch owns."
- **The alignment table** (FM:44 to 65) gives each of these routes to another module:

  | Route | Module that owns it |
  | --- | --- |
  | `/missions` | `missions` |
  | `/missions/new` and `…/onboarding` | `onboarding` |
  | `/live` | `events` |
  | `/business` | `metering` |
  | `/clients` | `clients` |
  | `/library/…` and `/factory` | `knowledge` |
  | `/roster` | `roster` |
  | `/activity` | `audit` |

  Only `/settings` (and `/login`) are `system`'s.

Leon's dispatch is the `system` module plus `routes/**` (`agent-leon-system-build.md`, Part 5). It writes ten route files for screens that `system` doesn't own, and they render a `system` screen. That may be the right call for a complete nav, but it's a departure from FM's ownership, and the contract doesn't record it as one. It also doesn't say what happens when W2's `missions` or W5's `audit` dispatch arrives: does it replace the route file and stop importing `PlannedScreen`?

## The file names are left open, and one choice breaks the nesting
Section 3 gives URLs, not files. With TanStack Router's file routes:
- If `/missions` is `routes/_shell/missions.tsx`, it becomes the parent of `_shell/missions/new.tsx` and `_shell/missions/$missionId/onboarding.tsx`. Its `PlannedScreen` has no `<Outlet />`, so `/missions/new` would draw "All projects" while the crumb (from the deepest match, `app-shell.md:172-173`) says "New project". The list has to be `missions/index.tsx` (or `missions.index.tsx`).
- FM's `/missions/$missionId` is a layout route (L2, "Mission layout", FM:164). The stub sits under it with no layout file. That works now, but it's worth saying so W2 knows to add one.
- `/library/skills` can be a literal file or FM's `/library/$kind` with `skills` as the param. The contract implies FM's route but doesn't say. If it's `$kind`, every kind (`/library/rules`, `/library/foo`) draws the Library stub.

SH-11 (`app-shell.md:268`) would catch the nesting mistake after the build, but the builder shouldn't have to guess.

## Fixing it means
- **In section 3:** record the stubs as a departure from FM's ownership, with the reason (a complete nav from day one). Add the rule that the owning module's dispatch replaces its stub route file in its wave and drops the `PlannedScreen` import.
- **Name each stub's file:**
  - `_shell/missions/index.tsx`, `_shell/missions/new.tsx` and `_shell/missions/$missionId/onboarding.tsx`, with no `$missionId` layout yet;
  - `_shell/library/$kind.tsx`, and what an unknown kind draws;
  - the rest, one file each.
