import { QueryClient } from "@tanstack/react-query";
import { toUiError } from "./errors";

/**
 * The page's `QueryClient` (UI contract section 3). Queries use FM's "reconnecting or down"
 * freshness, because sprint-01 has no stream: `staleTime` 30s, refetch on focus and on
 * reconnect, and up to 3 retries on `network` and `server` only. Mutations are never retried
 * automatically.
 */

const MAX_RETRIES = 3;

function isRetryable(error: unknown): boolean {
  const { kind } = toUiError(error);
  return kind === "network" || kind === "server";
}

/** `retryDelay` (ms) replaces TanStack's default; screen tests pass 0, the page never does. */
export function createQueryClient(opts: { retryDelay?: number } = {}): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: (failureCount, error) => failureCount < MAX_RETRIES && isRetryable(error),
        ...(opts.retryDelay === undefined ? {} : { retryDelay: opts.retryDelay }),
      },
      mutations: {
        retry: false,
      },
    },
  });
}
