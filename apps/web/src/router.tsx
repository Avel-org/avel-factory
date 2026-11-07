import { REQUEST_ID_HEADER } from "@avel/contract/errors";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { type ApiOptions, bindApi, createApi } from "./data/client";
import { createQueryClient } from "./data/query";
import { routeTree } from "./routeTree.gen";

/**
 * The client options for this router's Api (UI contract section 3, `getRouter()`).
 * - On the server: the incoming request's origin, over HTTP, and its `X-Request-Id` when it
 *   has one (FM line 141). Cookies aren't forwarded until W5 brings sessions. The request is
 *   read with TanStack Start's `getRequest()`, inside `.server(…)`, so it stays out of the
 *   client bundle.
 * - In the browser: same origin, and a new `X-Request-Id` per request.
 */
const apiOptions = createIsomorphicFn()
  .server((): ApiOptions => {
    const request = getRequest();
    const requestId = request.headers.get(REQUEST_ID_HEADER);
    return {
      baseUrl: new URL(request.url).origin,
      ...(requestId ? { requestId } : {}),
    };
  })
  .client((): ApiOptions => ({}));

/**
 * Called per request on the server and once in the browser: a new `QueryClient` with its own
 * `Api`, `{ queryClient }` as the router context, and Router and Query wired together by
 * `setupRouterSsrQueryIntegration`, which provides the `QueryClient` to the app.
 */
export function getRouter() {
  const queryClient = createQueryClient();
  bindApi(queryClient, createApi(apiOptions()));
  const router = createRouter({
    routeTree,
    context: { queryClient },
  });
  setupRouterSsrQueryIntegration({ router, queryClient });
  return router;
}
