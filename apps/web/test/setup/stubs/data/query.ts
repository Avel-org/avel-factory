// A plain stand-in for src/data/query.ts (vitest.config.ts): the render helper needs a
// QueryClient even before the data core exists. It has none of the page's defaults.

import { QueryClient } from "@tanstack/react-query";

export function createQueryClient(_opts?: { retryDelay?: number }): QueryClient {
  return new QueryClient();
}
