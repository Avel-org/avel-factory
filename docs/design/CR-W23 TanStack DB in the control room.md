# CR-W23: TanStack DB in the control room (proposed)

Nov 13, 2026 · @javaris · for the frontend session · touches `apps/web` only

Proposed, not yet accepted. No change to the contract, the server, the CLI or the database.

## In short

- **What:** add TanStack DB to `apps/web` as the control room's client store. Collections hold the contract's DTOs, screens read them through live queries, and the one event stream (route 63) writes into them.
- **Why:** the control room's hard parts are applying one event stream to every screen, dropping stale data (`asOfSeq`, `rowVersion`), and showing a decision at once while undoing it on a 409. TanStack DB does those three things as a library, instead of hand-written cache code on every screen.
- **What stays:** TanStack Start, Router and Query, the oRPC TanStack Query client, the contract's Zod schemas, React 19 and Tailwind. TanStack DB sits on top of TanStack Query; it doesn't replace it.

## The versions (pin exactly)

| Package | Version | Why this one |
| --- | --- | --- |
| `@tanstack/db` | `1.0.0-rc.1.5` | The current release (Nov 11, 2026) of 1.0 RC1; listed explicitly so the collection adapter's peer resolves to the same copy |
| `@tanstack/react-db` | `1.0.0-rc.1.5` | React bindings (`useLiveQuery`); re-exports `@tanstack/db` |
| `@tanstack/query-db-collection` | `1.5.2` | The adapter that fills a collection from TanStack Query. Its 1.x number is ahead of DB's because a 1.0 was published by mistake before the RC; it's built for DB 1.0 (peer `@tanstack/db ^1.0.0-rc.0`) |
| `@tanstack/query-core` | `5.107.1` | A peer of the adapter; the same version `@tanstack/react-query` 5.107.1 already uses |

```sh
pnpm --filter @avel/web add -E @tanstack/db@1.0.0-rc.1.5 @tanstack/react-db@1.0.0-rc.1.5 @tanstack/query-db-collection@1.5.2 @tanstack/query-core@5.107.1
```

**Not these:** `@tanstack/db@rc` (an older tag, `1.0.0-rc.1`), any caret range on a release candidate, or the 0.x line.

**About the release candidate:** TanStack released 1.0.0-rc.1 on Oct 29, 2026 and calls the API production-ready and stable. No date is set for the final 1.0. Upgrading to it is one PR that bumps the four pins together.

## Checked on Nov 13, 2026

- The four pins install with the web's own versions (`@tanstack/react-query` 5.107.1, React 19.3.1, Zod 4.6.7) with no peer warnings.
- A sample typechecks under strict TypeScript: a query collection of pending decisions, keyed by `ref`, with a schema, and a live query filtered by mission.
- It typechecks with **`zod/mini`** schemas too, the contract's flavour, because a collection takes any Standard Schema. The contract's DTO schemas can be used as collection schemas as they are.

## How it fits the control room

1. **Collections hold DTOs, keyed by their IDs.** Start with two: pending decisions (route 52, keyed by `ref`) and mission rows (route 19, keyed by `id`). Each is a `queryCollectionOptions` collection whose `queryFn` calls the oRPC client, with the contract's DTO schema as its `schema`.
2. **The event stream writes into them.** The single route-63 subscription's `EventHandlers` call the collection's direct writes (`writeUpsert`, `writeDelete`, `writeBatch`) or `refetch` when an event carries only a ref. Every screen showing that row updates, with no polling.
3. **Stale data is dropped in one place.** A handler writes only if the event is newer than the row it holds (`asOfSeq` or `rowVersion`), so a late event can't overwrite a newer row.
4. **Screens read with live queries.** `useLiveQuery` filters, sorts and joins collections, such as "this mission's decisions" or "returned decisions first", and re-renders only what changed.
5. **Decisions are optimistic actions.** `createOptimisticAction`: `onMutate` marks the card as sent at once; `mutationFn` calls `approveCallFor(item, tap)`. On 409 `STALE_VERSION`, the optimistic change rolls back and the card shows `details.current` as "this changed, review again". `mutationFn` must wait until the server's change is back in the collection (through the event or a refetch) before it resolves.

**Rules that don't change:** collections hold DTOs, never anything else; agent, client and Canon text still renders as plain text; no money appears (the DTOs carry none); approvals still never ask for a password.

## The trial: the Decisions screen first

It uses the event stream, stale data and the 409 together. It's done when:

1. The list renders from the decisions collection, all 10 kinds, from `contract-mock` with `world: true`.
2. A `<owner>.decision.*` event updates or removes its card without a refetch of the list.
3. An event older than the card's `asOfSeq` is ignored.
4. Approving shows the card as sent at once. A mocked 409 `STALE_VERSION` rolls it back and shows the current version.
5. A returned decision (CR-W15, `previous`) sorts first.

If the trial passes, the mission list moves next, then each screen as it's built. If it fails, the screen stays on TanStack Query alone, and the failure goes into this CR.

## Not in this CR

- **Persistence and offline:** not needed for a one-operator control room.
- **Sync adapters (Electric, Neon Realtime, Convex):** the factory's own event stream is the sync.
- **XState and Effect on the frontend:** separate, later decisions.

## Decisions

1. Accept TanStack DB for `apps/web`, behind the Decisions trial.
2. Pin the four versions above, and upgrade to the final 1.0 in one PR when it ships.
