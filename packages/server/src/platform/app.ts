import {
  CONTRACT_VERSION,
  CONTRACT_VERSION_HEADER,
  type ErrorBody,
  errorMap,
  REQUEST_ID_HEADER,
} from "@avel/contract";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import type { ORPCError, Router } from "@orpc/server";
import type { Layer } from "effect";
import { Hono } from "hono";
import { type RequestScope, resolveRequestId } from "./effect-handler.ts";
import { healthRouter } from "./health.ts";
import { type Ids, IdsLive } from "./ids.ts";
import { stdoutLogLine } from "./logger.ts";

export interface AppOptions {
  /** The procedures to serve; defaults to route 6 alone. */
  // biome-ignore lint/suspicious/noExplicitAny: a partial router has no single contract type; oRPC matches by path.
  router?: Router<any, RequestScope>;
  /** The services every request's program may use; defaults to the live ones. */
  layer?: Layer.Layer<Ids>;
  /** Where the JSON logger writes each line; defaults to stdout. */
  logLine?: (line: string) => void;
}

const toErrorBody = (error: ORPCError<string, unknown>, requestId: string): ErrorBody => ({
  code: error.code,
  message: error.message,
  ...(error.data === undefined ? {} : { details: error.data as ErrorBody["details"] }),
  requestId,
});

/** The server: X-Request-Id and X-Contract-Version on every response, errors as ErrorBody. */
export function createApp(options: AppOptions = {}) {
  const router = options.router ?? healthRouter;
  const layer = options.layer ?? IdsLive;
  const logLine = options.logLine ?? stdoutLogLine;

  const app = new Hono();
  app.all("/api/*", async (c) => {
    const requestId = await resolveRequestId(layer, c.req.header(REQUEST_ID_HEADER) ?? null);
    const scope: RequestScope = { requestId, layer, logLine };
    // A handler per request, so its error encoder writes this request's ID.
    const handler = new OpenAPIHandler(router, {
      customErrorResponseBodyEncoder: (error) => toErrorBody(error, requestId),
    });
    const result = await handler.handle(c.req.raw, { context: scope });
    const response = result.matched
      ? result.response
      : Response.json(
          {
            code: "NOT_FOUND",
            message: errorMap.NOT_FOUND.message,
            requestId,
          } satisfies ErrorBody,
          { status: errorMap.NOT_FOUND.status },
        );
    const headers = new Headers(response.headers);
    headers.set(REQUEST_ID_HEADER, requestId);
    headers.set(CONTRACT_VERSION_HEADER, CONTRACT_VERSION);
    return new Response(response.body, { status: response.status, headers });
  });
  return { fetch: async (request: Request) => app.fetch(request) };
}
