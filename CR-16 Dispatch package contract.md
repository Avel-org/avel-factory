# CR-16: dispatch package contract (proposed)

Nov 3, 2026 · @javaris

The contract change behind the web's Dispatch tab. It fills in the route that CR-16 (in `claude/Backend modules and build plan.md`, section 6) left as a one-liner. Nothing here is built until you accept it.

## What the package is
The agent-dispatch file set for one mission's plan version, rendered by `factory` (Step 8), byte-identical on every render:

| Path | Kind | From |
| --- | --- | --- |
| `codebase-analysis.md` | `codebase_analysis` | `codebase_analysis` |
| `DISPATCH.md` | `dispatch_md` | `mission_docs` |
| `agent-<agent>-<module>-<role>.md`, one per dispatch | `task_doc` | `task_docs` (the latest version) |
| `DISPATCH-PROMPTS.md`: every activation prompt, archived | `prompts_archive` | rendered from the task docs |
| `agent-<agent>-<module>-<role>-completion.md`, one per finished dispatch | `completion_report` | `completion_reports` |

- **Paths** are relative to `docs/agent-dispatch/<mission-slug>/`, the same folder the package is written to in the repo.
- **What's never in it:** secret values, tokens or credentials. A task doc can name a secret (`context_refs` kind `secret_name`) but never carries its value.

## Routes (3 new; 102 in total)

### `GET /api/missions/{missionId}/dispatch-package`
The package's manifest, without file bodies.

```ts
DispatchPackageDto = {
  missionId: string;
  planVersion: number;
  factoryCommit: string;
  renderedAt: string;            // ISO time
  gate1PassedAt: string | null;  // the line "every section passed the pre-dispatch check"
  location: {                    // where it's written in the repo; null if it isn't written there
    repo: string;                // e.g. "avel-org/gts-landing"
    branch: string;              // e.g. "mission/landing"
    path: string;                // e.g. "docs/agent-dispatch/landing"
  } | null;
  packageSha256: string;         // hash of the sorted (path, sha256) list; changes whenever any file changes
  files: Array<{
    path: string;
    kind: 'codebase_analysis' | 'dispatch_md' | 'task_doc' | 'prompts_archive' | 'completion_report';
    dispatchId: string | null;   // set for task_doc and completion_report
    version: number | null;      // the task doc version
    sha256: string;
    bytes: number;
  }>;
}
```

- **Query:** `?planVersion=` (defaults to the mission's current plan).
- **File bodies** come from the next route. Task doc versions and attempts also stay on `GET /api/dispatches/{dispatchId}`, and DISPATCH.md on `GET /api/missions/{missionId}/dispatches`, unchanged.

### `GET /api/missions/{missionId}/dispatch-package/files?path=`
One file's body as `text/markdown`, with its `sha256` as the `ETag`. It takes the same `?planVersion=`. A separate route keeps every route to one response type.

### `GET /api/missions/{missionId}/dispatch-package/archive`
The zip, as `application/zip`, shaped like the existing `GET /api/deliveries/{deliveryId}/archive`.

- **Same query as above.** `ETag` is `packageSha256`.
- **Deterministic:** entries sorted by path, fixed timestamps and modes, no extra fields. The same package always gives a byte-identical zip, so it can be hashed and cached.
- **Root:** files sit under `docs/agent-dispatch/<mission-slug>/`, so unzipping at the repo root puts them where `/dispatch` and `scripts/dispatch.sh` look.

## Errors (shared error body)
| Status | Code | When |
| --- | --- | --- |
| 404 | `MISSION_NOT_FOUND` | No such mission |
| 404 | `DISPATCH_PACKAGE_NOT_RENDERED` | The mission hasn't been rendered yet; `details: { missionState }` |
| 404 | `DISPATCH_PACKAGE_FILE_NOT_FOUND` | the files route's `?path=` names a file that isn't in the package |
| 404 | `PLAN_VERSION_NOT_FOUND` | `?planVersion=` doesn't exist |

All three are reads: no `Idempotency-Key`, no step-up, operator session only (web or CLI). Agents never call them; a room gets its package mounted.

## Who builds it: `factory`, not the delivery worker
The web session suggested the delivery worker. I'd keep it in `factory`, in the main service:
- **The worker is separate for one reason:** it's the only process that can decrypt client write tokens. The package holds no secrets and is built from rows `factory` already owns (`mission_docs`, `task_docs`), so routing it through the worker adds a hop and weakens nothing.
- **What's shared:** the deterministic zip writer from the ported export code (Port inventory: "export zip, tree and order") becomes a small shared library that both use. Delivery's client zips keep running in the worker.

## Live updates
The package changes when a task doc is re-rendered or a completion report lands, so the web refetches the manifest when either event arrives (or when `packageSha256` changes). Use the catalog's existing render and report events; if it has none for a task-doc re-render, add `task_doc.rendered`. The name follows the entity-name rule in CR-15 item 8.

## Writing it to the repo
When the plan is rendered, `factory` asks the integrator to land the package on the mission branch as one integration commit that changes only `docs/agent-dispatch/<mission-slug>/**`. Gate 2 still runs on it.

**Proposed:** a new integration-commit kind, `dispatch_docs`, so it isn't mistaken for module work. That touches the `integration_commits.kind` CHECK.

**Client delivery:** strip the folder from client deliveries unless you decide otherwise (the open decision in CR-16).

**Open, from the web (Frontend Map v0.6, CR-W11):** the web asks for an operator confirm before this commit lands: a confirm route and a `dispatch_package_commit` decision kind owned by `integrator`. Accepting it adds one route (103 in total) and makes the landing wait on that decision instead of happening automatically.

## Activation: one shape for the renderer and the web
The web renders each task doc in agent-dispatch's seven parts with its **activation prompt as the last section**, plus `DISPATCH-PROMPTS.md`. That matches agent-dispatch's file inventory more closely than my first kit, which put the activation at the top and had no prompts archive. **Proposed:** adopt the web's shape.
- The runner sends the activation prompt as the agent's first message, and the agent then reads its task doc.
- `/dispatch` and `scripts/dispatch.sh` do the same on your machine.
- The kit's template is updated to match.

## Tests (added to Step 8's done-when)
- The same plan gives the same manifest, file bytes and zip bytes on two renders.
- A re-render of one task doc changes that file's `sha256` and `packageSha256`, and nothing else.
- No file in any package contains a value from `secrets` (checked by scanning against seeded secrets).
- An unrendered mission returns 404 `DISPATCH_PACKAGE_NOT_RENDERED`.
- Unzipping the archive at a repo root gives exactly the manifest's paths.

## Touches
- **contract:** 3 routes, `DispatchPackageDto`, 3 error codes, possibly the `task_doc.rendered` event;
- **DATABASE.md:** `integration_commits.kind` gains `dispatch_docs`; no new tables;
- **design doc Main:** API routes (102), Dispatch, delivery (stripping the folder);
- **the web's Frontend Map:** the Dispatch tab's data source.
