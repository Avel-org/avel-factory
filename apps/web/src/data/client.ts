import { decisions } from "@avel/contract/routes/decisions";
import { type Client, type ClientContext, createORPCClient } from "@orpc/client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";

type Infer<S, K extends "input" | "output"> = S extends {
  "~standard": { types?: infer T };
}
  ? T extends Record<K, infer V>
    ? V
    : unknown
  : unknown;

/**
 * The client's shape, read off the contract: a procedure takes its input schema's input and
 * answers its output schema's output. (@orpc/contract's own ContractRouterClient is the same
 * shape, but @orpc/contract isn't a dependency of the web.)
 */
/** Route 52 is all the page reads; each page widens this to the routes it uses. */
const contract = { decisions };

type ClientOf<T> = T extends { "~orpc": { inputSchema?: infer I; outputSchema?: infer O } }
  ? Client<ClientContext, Infer<I, "input">, Infer<O, "output">, Error>
  : { [K in keyof T]: ClientOf<T[K]> };

export type ApiClient = ClientOf<typeof contract>;

export interface ClientOptions {
  baseUrl: string;
  /** Tests pass the mock's fetch here. */
  fetch?: (request: Request) => Promise<Response>;
}

/** The oRPC client over @avel/contract, speaking the contract's REST paths. */
export function createClient({ baseUrl, fetch }: ClientOptions): ApiClient {
  const link = new OpenAPILink(contract, {
    url: baseUrl, // the contract's paths already start with /api
    ...(fetch ? { fetch: (request) => fetch(request) } : {}),
  });
  return createORPCClient(link);
}
