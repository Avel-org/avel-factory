/**
 * Harness for T-B14's acceptance tests. It names the seams the build must provide (listed in the
 * report for the lead to confirm before the lock):
 *
 *   src/platform/router.ts  makeRouter({ databaseUrl }): the router that composes the health router
 *                             and routes 8 to 11 (src/onboarding/clients/), with the Db,
 *                             Idempotency and audit services built from that database. A test
 *                             passes it to createApp({ router, auth }); app.ts is not changed.
 *                           The routes read Caller and the Idempotency-Key header as T-B9 left them.
 *
 * What the tests assume about the wire (contract, API routes.md):
 *   POST /api/clients  201 ClientDto; GET /api/clients  200 { items, nextCursor };
 *   GET and PATCH /api/clients/{clientId}  200 ClientDto; errors are ErrorBody with requestId.
 *   An activity row for a write has actor_kind 'user', user_id the operator, a non-empty action
 *   that differs between create and edit, and a target that names the client's id.
 *
 * No time passes inside these tests, so they need no TestClock: ids, timestamps and keys come
 * from the server's own services; only unique throwaway values are made here.
 */
import { randomUUID } from "node:crypto";
import { ClientDto, ErrorBody } from "@avel/contract";
import pg from "pg";
import { expect } from "vitest";
import { createApp } from "../../src/platform/app.ts";
import { makeRouter } from "../../src/platform/router.ts";
import {
  OPERATOR_EMAIL,
  ORIGIN,
  operatorPassword,
  SECRET,
  sessionCookie,
  signIn,
} from "../auth/support.ts";

export const UNKNOWN_CLIENT = "0193a000-0000-7000-8000-000000000b14";

export type App = ReturnType<typeof createApp>;

/** The real app: Better Auth over this database, and routes 8 to 11 through `makeRouter`. */
export function clientsApp(databaseUrl: string): App {
  return createApp({
    router: makeRouter({ databaseUrl }),
    auth: { databaseUrl, secret: SECRET, baseUrl: ORIGIN, secureCookies: false },
  });
}

/** Seeds the operator (once per database) and signs in; returns the session cookie pair. */
export async function operatorCookie(app: App, databaseUrl: string): Promise<string> {
  const password = await operatorPassword(databaseUrl);
  const res = await signIn(app, OPERATOR_EMAIL, password);
  const cookie = sessionCookie(res);
  if (cookie === undefined) throw new Error(`sign-in gave no session cookie (${res.status})`);
  return cookie;
}

export interface Sent {
  readonly cookie?: string | undefined;
  readonly body?: unknown;
  readonly key?: string | undefined;
  readonly requestId?: string;
}

export const newKey = () => `key-${randomUUID()}`;

export function send(app: App, method: "GET" | "POST" | "PATCH", path: string, sent: Sent = {}) {
  const headers: Record<string, string> = {
    origin: ORIGIN,
    ...(sent.body === undefined ? {} : { "content-type": "application/json" }),
    ...(sent.cookie ? { cookie: sent.cookie } : {}),
    ...(sent.key ? { "idempotency-key": sent.key } : {}),
    ...(sent.requestId ? { "x-request-id": sent.requestId } : {}),
  };
  return app.fetch(
    new Request(`${ORIGIN}${path}`, {
      method,
      headers,
      ...(sent.body === undefined ? {} : { body: JSON.stringify(sent.body) }),
    }),
    { address: "203.0.113.20" },
  );
}

/** POST /api/clients with a fresh Idempotency-Key unless one is given; expects 201 and a ClientDto. */
export async function createClient(
  app: App,
  cookie: string,
  body: { name: string; kind?: "client" | "internal"; contacts?: unknown },
  key = newKey(),
) {
  const res = await send(app, "POST", "/api/clients", {
    cookie,
    key,
    body: { kind: "client", ...body },
  });
  expect(res.status).toBe(201);
  return ClientDto.parse(await res.json());
}

/** An error response is the contract's ErrorBody, its requestId equal to X-Request-Id. */
export async function expectError(res: Response, status: number, code: string) {
  expect(res.status).toBe(status);
  const body = ErrorBody.parse(await res.json());
  expect(body.code).toBe(code);
  expect(body.requestId).toBe(res.headers.get("x-request-id"));
  expect(body.requestId.length).toBeGreaterThan(0);
  return body;
}

export async function sql<T extends pg.QueryResultRow = pg.QueryResultRow>(
  url: string,
  text: string,
  values: unknown[] = [],
): Promise<T[]> {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    return (await c.query<T>(text, values)).rows;
  } finally {
    await c.end();
  }
}

export const operatorId = async (url: string) =>
  (await sql<{ id: string }>(url, "select id from users where email = $1", [OPERATOR_EMAIL]))[0]
    ?.id as string;

export const activityFor = (url: string, clientId: string) =>
  sql<{ actor_kind: string; user_id: string | null; action: string; target: string }>(
    url,
    "select actor_kind, user_id, action, target from activity_log where target like '%' || $1 || '%' order by created_at, id",
    [clientId],
  );
