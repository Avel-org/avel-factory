// An inert stand-in for src/data/client.ts, used only while it doesn't exist (vitest.config.ts).
// Every call on the client rejects, so a test fails on its assertion about the outcome.

import type { QueryClient } from "@tanstack/react-query";

export interface ApiOptions {
  fetch?: typeof fetch;
  baseUrl?: string;
  contractVersion?: string;
  requestId?: string;
}

// biome-ignore lint/suspicious/noExplicitAny: a deep stand-in for the typed oRPC client
export type StubClient = any;
export interface Api {
  client: StubClient;
  orpc: StubClient;
}

function unbuilt(): StubClient {
  const handler: ProxyHandler<() => void> = {
    get: () => new Proxy(() => {}, handler),
    apply: () => Promise.reject(new Error("stub: src/data/client.ts isn't built yet")),
  };
  return new Proxy(() => {}, handler);
}

export function createApiClient(_opts?: ApiOptions): StubClient {
  return unbuilt();
}

export function createApi(_opts?: ApiOptions): Api {
  return { client: unbuilt(), orpc: unbuilt() };
}

export function bindApi(_queryClient: QueryClient, _api: Api): void {}

export function apiFor(_queryClient: QueryClient): Api {
  throw new Error("stub: src/data/client.ts isn't built yet");
}

export function useApi(): Api {
  throw new Error("stub: src/data/client.ts isn't built yet");
}
