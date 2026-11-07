import {
  CONTRACT_VERSION_HEADER,
  contract,
  IDEMPOTENCY_KEY_HEADER,
  REQUEST_ID_HEADER,
} from "@avel/contract";
import { type Client, type ClientOptions, createORPCClient } from "@orpc/client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { BUILT_CONTRACT_VERSION, noteContractVersion } from "./contract-version";
import { decodeErrorBody, NetworkError } from "./errors";

/**
 * The oRPC client over `@avel/contract` (UI contract section 3; FM, Data layer): typed from the
 * contract only, through `OpenAPILink`, with one fetch wrapper that sets every header.
 */

export interface ApiOptions {
  /**
   * The fetch the wrapper calls; `globalThis.fetch` by default. The wrapper always calls it
   * with a `Request`, so a fetch that takes only a `Request` (the contract mock's) fits too.
   */
  fetch?: (request: Request, init?: RequestInit) => Promise<Response>;
  /** The link's URL: the page's origin in the browser by default, and required on the server. */
  baseUrl?: string;
  /** The version responses are compared with: `BUILT_CONTRACT_VERSION` by default. */
  contractVersion?: string;
  /** The `X-Request-Id` for every request; a new UUID per request when absent. */
  requestId?: string;
}

/** The client context a call passes: a write's `Idempotency-Key` (`newIdempotencyKey()`). */
export interface ApiContext {
  idempotencyKey?: string;
}

/** A procedure's optional schema: its input or output type, or `unknown` when it has none. */
type SchemaInput<S> = [NonNullable<S>] extends [never]
  ? unknown
  : NonNullable<S> extends z.ZodType
    ? z.input<NonNullable<S>>
    : unknown;
type SchemaOutput<S> = [NonNullable<S>] extends [never]
  ? unknown
  : NonNullable<S> extends z.ZodType
    ? z.output<NonNullable<S>>
    : unknown;

/**
 * The client's type, read from the contract's route definitions: each procedure becomes a
 * `Client` taking its input schema's input and returning its output schema's output.
 * (`@orpc/contract`'s `ContractRouterClient` does the same, but `@avel/web` doesn't depend on
 * `@orpc/contract` directly.)
 */
type ContractClient<T> = {
  [K in keyof T]: T[K] extends { "~orpc": { inputSchema?: infer I; outputSchema?: infer O } }
    ? Client<ApiContext, SchemaInput<I>, SchemaOutput<O>, Error>
    : ContractClient<T[K]>;
};

export type ApiClient = ContractClient<typeof contract>;

type LinkFetch = (
  request: Request,
  init: { redirect?: RequestRedirect },
  options: ClientOptions<ApiContext>,
) => Promise<Response>;

const isBrowser = (): boolean => typeof window !== "undefined";

/**
 * The fetch wrapper: the only place the client sets headers. Every request gets
 * `X-Request-Id`; a write gets `Idempotency-Key` from the call's context. A rejected fetch
 * becomes a `NetworkError` with the ID sent, and a response without `X-Request-Id` gets the
 * sent one, so every response the link reads carries an ID. In the browser only, each
 * response's `X-Contract-Version` is checked against `contractVersion`.
 */
function wrapFetch(opts: ApiOptions): LinkFetch {
  const expected = opts.contractVersion ?? BUILT_CONTRACT_VERSION;
  return async (request, init, options) => {
    const requestId = opts.requestId ?? crypto.randomUUID();
    request.headers.set(REQUEST_ID_HEADER, requestId);
    const key = options.context.idempotencyKey;
    if (request.method !== "GET" && request.method !== "HEAD" && key !== undefined) {
      request.headers.set(IDEMPOTENCY_KEY_HEADER, key);
    }

    let response: Response;
    try {
      response = await (opts.fetch ?? globalThis.fetch)(request, init);
    } catch (cause) {
      throw new NetworkError(requestId, cause);
    }

    if (isBrowser()) noteContractVersion(response.headers.get(CONTRACT_VERSION_HEADER), expected);

    if (response.headers.has(REQUEST_ID_HEADER)) return response;
    const headers = new Headers(response.headers);
    headers.set(REQUEST_ID_HEADER, requestId);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

function linkUrl(opts: ApiOptions): string {
  if (opts.baseUrl !== undefined) return opts.baseUrl;
  if (isBrowser()) return window.location.origin;
  throw new Error("createApiClient needs a baseUrl on the server");
}

/** `createORPCClient` with `OpenAPILink` over `@avel/contract`. */
export function createApiClient(opts: ApiOptions = {}): ApiClient {
  const link = new OpenAPILink<ApiContext>(contract, {
    url: linkUrl(opts),
    fetch: wrapFetch(opts),
    customErrorResponseBodyDecoder: decodeErrorBody,
  });
  return createORPCClient<ApiClient>(link);
}

function createUtils(client: ApiClient) {
  return createTanstackQueryUtils(client);
}

export interface Api {
  client: ApiClient;
  /** oRPC's TanStack Query utils: `queryOptions`, `infiniteOptions`, `mutationOptions`, `key`. */
  orpc: ReturnType<typeof createUtils>;
}

/** A client and its TanStack Query utils. */
export function createApi(opts: ApiOptions = {}): Api {
  const client = createApiClient(opts);
  return { client, orpc: createUtils(client) };
}

/** Each `QueryClient`'s own `Api` (finding 24): there's no module-level client. */
const apis = new WeakMap<QueryClient, Api>();

/** Pairs one `Api` with one `QueryClient`. */
export function bindApi(queryClient: QueryClient, api: Api): void {
  apis.set(queryClient, api);
}

/** The `Api` bound to this `QueryClient`. A loader calls `apiFor(context.queryClient)`. */
export function apiFor(queryClient: QueryClient): Api {
  const api = apis.get(queryClient);
  if (api === undefined) throw new Error("No Api is bound to this QueryClient: call bindApi");
  return api;
}

/** The `Api` bound to the `QueryClient` this component is under. */
export function useApi(): Api {
  return apiFor(useQueryClient());
}
