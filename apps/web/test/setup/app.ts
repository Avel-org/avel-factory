import { createMock, type SeedRow } from "@avel/contract-mock";
import { expect } from "vitest";
import { type ApiOptions, createApi } from "../../src/data/client";

// The mock-backed client helper (UI contract section 3, "One data path for each environment").
// One mock per test, and a client whose fetch is that mock. The web's tests never reach a server.

declare const __AVEL_CONTRACT_VERSION__: string;

/** The version the tests are built with: what the mock sends unless a test says otherwise. */
export const CONTRACT_VERSION: string = __AVEL_CONTRACT_VERSION__;
export const ORIGIN = "http://avel.test";

export type TestMock = ReturnType<typeof createMock>;

export function createTestMock(
  rows: SeedRow[] = [],
  opts: { contractVersion?: string; now?: () => Date } = {},
): TestMock {
  const mock = createMock({
    contractVersion: opts.contractVersion ?? CONTRACT_VERSION,
    ...(opts.now ? { now: opts.now } : {}),
  });
  mock.seed(rows);
  return mock;
}

export interface TestApi {
  mock: TestMock;
  api: ReturnType<typeof createApi>;
}

/** A mock, seeded, and an Api that fetches from it. `api` options override the defaults. */
export function createTestApi(
  rows: SeedRow[] = [],
  opts: { mock?: TestMock; api?: ApiOptions; contractVersion?: string } = {},
): TestApi {
  const mock = opts.mock ?? createTestMock(rows, { contractVersion: opts.contractVersion });
  const api = createApi({ fetch: mock.fetch, baseUrl: ORIGIN, ...opts.api });
  return { mock, api };
}

/** A request the mock can serve: an absolute URL on the test origin. */
export function request(
  method: string,
  path: string,
  init: { headers?: Record<string, string>; body?: unknown } = {},
): Request {
  const headers = new Headers(init.headers);
  const hasBody = init.body !== undefined;
  if (hasBody && !headers.has("content-type")) headers.set("content-type", "application/json");
  return new Request(`${ORIGIN}${path}`, {
    method,
    headers,
    ...(hasBody ? { body: JSON.stringify(init.body) } : {}),
  });
}

export const DECIDE_PATH = (proposalId: string): string => `/api/proposals/${proposalId}/decisions`;

/** Route 54 as the web sends it: the body without `proposalId`, and a key. */
export function decide(
  mock: TestMock,
  proposalId: string,
  body: unknown,
  headers: Record<string, string> = { "Idempotency-Key": crypto.randomUUID() },
): Promise<Response> {
  return mock.fetch(request("POST", DECIDE_PATH(proposalId), { headers, body }));
}

export async function json(response: Response): Promise<unknown> {
  return response.json();
}

type Settled<T> = { ok: true; value: T } | { ok: false; error: unknown };

export async function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  try {
    return { ok: true, value: await promise };
  } catch (error) {
    return { ok: false, error };
  }
}

export function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

/** Awaits a call that should succeed. If it rejects, the test fails on this assertion. */
export async function expectOk<T>(promise: Promise<T>): Promise<T> {
  const result = await settle(promise);
  expect(result.ok, result.ok ? "" : `the call rejected: ${describeError(result.error)}`).toBe(
    true,
  );
  return (result as { ok: true; value: T }).value;
}

/** Awaits a call that should reject, and returns what it threw. */
export async function expectRejected(promise: Promise<unknown>): Promise<unknown> {
  const result = await settle(promise);
  expect(result.ok, "the call should have been rejected").toBe(false);
  return (result as { ok: false; error: unknown }).error;
}
