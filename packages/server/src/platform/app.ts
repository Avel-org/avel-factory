import {
  CONTRACT_VERSION,
  CONTRACT_VERSION_HEADER,
  type ErrorBody,
  errorMap,
  IDEMPOTENCY_KEY_HEADER,
  REQUEST_ID_HEADER,
} from "@avel/contract";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import type { ORPCError, Router } from "@orpc/server";
import { type Clock, Effect, type Layer } from "effect";
import { Hono } from "hono";
import { type AuthOptions, makeWebAuth } from "./auth/index.ts";
import { type RequestScope, resolveRequestId, runEdge } from "./effect-handler.ts";
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
  /** The time the sign-in lockout and rate limits read; defaults to the live clock. */
  clock?: Clock.Clock;
  /** Better Auth at /api/auth/*, and each request's Caller from its session; without it, neither. */
  auth?: AuthOptions;
}

/**
 * Where a request came from: `{ address }`, or @hono/node-server's `env`, whose `incoming` is the
 * Node request. Only the socket's address is read, never a header a client can set.
 */
export interface Peer {
  readonly address?: string;
  readonly incoming?: { readonly socket: { readonly remoteAddress?: string | undefined } };
}

const UNKNOWN_PEER = "unknown";

const peerAddress = (peer: Peer | undefined) =>
  peer?.address ?? peer?.incoming?.socket.remoteAddress ?? UNKNOWN_PEER;

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
  const auth =
    options.auth === undefined ? undefined : makeWebAuth(options.auth, options.clock, logLine);

  const serveContract = async (request: Request, scope: RequestScope) => {
    // A handler per request, so its error encoder writes this request's ID.
    const handler = new OpenAPIHandler(router, {
      customErrorResponseBodyEncoder: (error) => toErrorBody(error, scope.requestId),
    });
    const result = await handler.handle(request, { context: scope });
    return result.matched
      ? result.response
      : Response.json(
          {
            code: "NOT_FOUND",
            message: errorMap.NOT_FOUND.message,
            requestId: scope.requestId,
          } satisfies ErrorBody,
          { status: errorMap.NOT_FOUND.status },
        );
  };

  const app = new Hono<{ Bindings: { clientIp: string } }>();
  app.all("/api/*", async (c) => {
    const request = c.req.raw;
    const requestId = await resolveRequestId(layer, c.req.header(REQUEST_ID_HEADER) ?? null);
    const scope: RequestScope = {
      requestId,
      layer,
      logLine,
      clientIp: c.env.clientIp,
      idempotencyKey: c.req.header(IDEMPOTENCY_KEY_HEADER) ?? null,
      caller: auth === undefined ? Effect.succeedNone : auth.caller(request.headers),
    };
    const response =
      auth !== undefined && c.req.path.startsWith("/api/auth/")
        ? await runEdge(auth.runtime, auth.handle(request), scope)
        : await serveContract(request, scope);
    const headers = new Headers(response.headers);
    headers.set(REQUEST_ID_HEADER, requestId);
    headers.set(CONTRACT_VERSION_HEADER, CONTRACT_VERSION);
    return new Response(response.body, { status: response.status, headers });
  });
  return {
    fetch: async (request: Request, peer?: Peer) =>
      app.fetch(request, { clientIp: peerAddress(peer) }),
  };
}
