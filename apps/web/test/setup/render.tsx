import type { SeedRow } from "@avel/contract-mock";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderResult, render } from "@testing-library/react";
import type { ReactElement } from "react";
import { bindApi } from "../../src/data/client";
import { createQueryClient } from "../../src/data/query";
import { createTestApi, type TestApi, type TestMock } from "./app";

// The render helper (UI contract section 7, "The page"): a screen is drawn inside a QueryClient
// built as the page builds its own, with retries that don't wait, and an Api bound to that client
// whose fetch is a seeded mock. The kit's and the decisions tests reuse it.

export interface RenderedApp extends RenderResult, TestApi {
  queryClient: QueryClient;
  mock: TestMock;
}

export function renderWithApp(
  ui: ReactElement,
  opts: { rows?: SeedRow[]; mock?: TestMock; contractVersion?: string } = {},
): RenderedApp {
  const queryClient = createQueryClient({ retryDelay: 0 });
  const { mock, api } = createTestApi(opts.rows ?? [], {
    ...(opts.mock ? { mock: opts.mock } : {}),
    ...(opts.contractVersion ? { contractVersion: opts.contractVersion } : {}),
  });
  bindApi(queryClient, api);
  const result = render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  return { ...result, queryClient, mock, api };
}
