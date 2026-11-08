import type { QueryClient } from "@tanstack/react-query";
import { type Api, apiFor, selectPendingPages } from "../../data";

/**
 * The decisions module's query options and mutation (UI contract section 5; FM, Data layer).
 * Each is built from an `Api`: the loader passes `apiFor(context.queryClient)`, and the screen
 * uses `useApi()`. Screens never call fetch and never keep server data in state.
 */

/** Route 52's page size. The page always sends it (section 2: the mock's default is provisional). */
export const PENDING_PAGE_LIMIT = 50;

/**
 * Route 52 as an infinite query, paged by the API's cursor. `select` is the data core's
 * `selectPendingPages`, which runs `parsePendingPage` on every loaded page: rows in the
 * server's order, `unreadable` summed over the pages, and the last page's `nextCursor`.
 */
export function pendingDecisionsOptions(api: Api) {
  return api.orpc.decisions.listPending.infiniteOptions({
    input: (cursor: string | undefined) =>
      cursor === undefined ? { limit: PENDING_PAGE_LIMIT } : { limit: PENDING_PAGE_LIMIT, cursor },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    select: selectPendingPages,
  });
}

/** The key every route 52 page sits under: what a decision invalidates. */
export function pendingDecisionsKey(api: Api) {
  return api.orpc.decisions.listPending.key();
}

/** The loader's prefetch (section 5, Route): the same options the screen reads. */
export function ensurePendingDecisions(queryClient: QueryClient) {
  return queryClient.ensureInfiniteQueryData(pendingDecisionsOptions(apiFor(queryClient)));
}

/** Route 54's input: m1's `DecideProposalInput`. On the wire `proposalId` is only in the path. */
export interface DecideInput {
  proposalId: string;
  version: number;
  choice: string;
  reason: string;
}

/** One send of route 54: the input and the `Idempotency-Key` of the intent it belongs to. */
export interface DecideVariables {
  input: DecideInput;
  idempotencyKey: string;
}

/**
 * Route 54. The key travels in the call's client context, where the data core's fetch wrapper
 * sets it as `Idempotency-Key` (section 3). A retry of the same intent passes the same
 * variables, so the same body goes out with the same key.
 */
export function decideMutationOptions(api: Api) {
  return {
    mutationKey: api.orpc.decisions.decide.mutationKey(),
    mutationFn: ({ input, idempotencyKey }: DecideVariables) =>
      api.client.decisions.decide(input, { context: { idempotencyKey } }),
  };
}
