import { REQUEST_ID_HEADER } from "@avel/contract/errors";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { type ApiOptions, bindApi, createApi } from "./data/client";
import { createQueryClient } from "./data/query";
import { routeTree } from "./routeTree.gen";

/**
 * The incoming `X-Request-Id` is forwarded only if it's a UUID or matches this (revision 9;
 * Zane's w0-data 03). A UUID is 36 hex digits and hyphens, so it always matches. Anything else
 * (empty, over 64 characters, control characters, several values joined by `, `) isn't
 * forwarded, and the fetch wrapper makes a new ID, so a forged or oversized value never reaches
 * a log or a response.
 */
const FORWARDABLE_REQUEST_ID = /^[A-Za-z0-9-]{1,64}$/;

/**
 * The client options for this router's Api (UI contract section 3, `getRouter()`).
 * - On the server: the incoming request's origin, over HTTP, and its `X-Request-Id` when it
 *   has one that passes `FORWARDABLE_REQUEST_ID` (FM line 141). Cookies aren't forwarded until
 *   W5 brings sessions. The request is read with TanStack Start's `getRequest()`, inside
 *   `.server(…)`, so it stays out of the client bundle.
 * - In the browser: same origin, and a new `X-Request-Id` per request.
 */
const apiOptions = createIsomorphicFn()
  .server((): ApiOptions => {
    const request = getRequest();
    const requestId = request.headers.get(REQUEST_ID_HEADER);
    return {
      baseUrl: new URL(request.url).origin,
      ...(requestId !== null && FORWARDABLE_REQUEST_ID.test(requestId) ? { requestId } : {}),
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
