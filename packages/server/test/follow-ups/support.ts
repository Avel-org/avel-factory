/**
 * Harness for T-B19's acceptance tests. It names the seams the build must provide (listed in the
 * report for the lead to confirm before the lock):
 *
 *   src/server.ts  startServer(env, deps?) as T-B16 left it, plus four settings read from `env`
 *                    (Config, never process.env):
 *                    GITHUB_WEBHOOK_SECRET   required, non-empty, Config.Redacted
 *                    FACTORY_REPO            the factory repo, "owner/name"
 *                    FACTORY_APP_LOGIN       the factory App's login (merged_by.login)
 *                    FACTORY_MIRROR_PATH     the loader's mirror
 *                  The brief fixes only GITHUB_WEBHOOK_SECRET; the other three names are this
 *                  harness's assumption, so a build that names them differently needs the lock
 *                  line's harness changed first (one place: `webhookEnv` below).
 *                  With them, POST /api/webhooks/github is served in the running server.
 *   src/platform/app.ts  createApp({ webhook: { databaseUrl, secret, repo, appLogin } }) as T-B15
 *                  left it (the body limit and the alerts live in the webhook it builds).
 *   src/platform/errors.ts  errorTable gains rows for the 401 and the 400 the clients routes give.
 *
 * Wire facts: a request over the limit is 413 with the contract's ErrorBody (the catalog has no
 * generic 413 row; the test pins the status and the body's shape, not the code). The limit is
 * GitHub's documented 25 MiB payload cap, which the tests assume the build uses (it may pick any
 * limit between 1 MiB and 25 MiB).
 */
import { randomBytes } from "node:crypto";
import { ErrorBody } from "@avel/contract";
import pg from "pg";
import { expect } from "vitest";
import {
  APP_LOGIN,
  type deliver as deliverFn,
  HUMAN_LOGIN,
  REPO,
  sign,
  WEBHOOK_SECRET,
} from "../factory-repo/support.ts";
import { envFor, type Started, signIn, start } from "../server/support.ts";

export { APP_LOGIN, HUMAN_LOGIN, REPO, sign, WEBHOOK_SECRET };
export type Deliver = typeof deliverFn;

export const MiB = 1024 * 1024;
/** GitHub's documented cap on a webhook payload. */
export const GITHUB_PAYLOAD_CAP = 25 * MiB;

/** The webhook's settings, as startServer reads them from env. */
export const webhookEnv = (extra: Record<string, string | undefined> = {}) => ({
  GITHUB_WEBHOOK_SECRET: WEBHOOK_SECRET,
  FACTORY_REPO: REPO,
  FACTORY_APP_LOGIN: APP_LOGIN,
  FACTORY_MIRROR_PATH: "/nonexistent/mirror.git",
  ...extra,
});

export const serverEnv = (databaseUrl: string, extra: Record<string, string | undefined> = {}) =>
  envFor(databaseUrl, webhookEnv(extra));

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

/** Signs in over HTTP; returns the session cookie pair. */
export async function login(server: Started, email: string, password: string): Promise<string> {
  const res = await signIn(server, email, password);
  const pair = /^(better-auth\.session_token=[^;]+)/.exec(
    res.headers.getSetCookie().find((l) => l.startsWith("better-auth.session_token=")) ?? "",
  )?.[1];
  if (pair === undefined) throw new Error(`sign-in gave no session cookie (${res.status})`);
  return pair;
}

/** A signed GitHub delivery over real HTTP to a running server. */
export function deliverOverHttp(
  server: Started,
  payload: unknown,
  options: { event?: string; delivery?: string; secret?: string } = {},
) {
  const body = JSON.stringify(payload);
  return fetch(`${server.url}/api/webhooks/github`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-github-event": options.event ?? "pull_request",
      "x-github-delivery": options.delivery ?? `d-${randomBytes(6).toString("hex")}`,
      "x-hub-signature-256": sign(body, options.secret),
    },
    body,
  });
}

/** An error response is the contract's ErrorBody, its requestId equal to X-Request-Id. */
export async function expectErrorBody(res: Response, status: number, code?: string) {
  expect(res.status).toBe(status);
  const body = ErrorBody.parse(await res.json());
  if (code !== undefined) expect(body.code).toBe(code);
  expect(body.requestId).toBe(res.headers.get("x-request-id"));
  expect(body.requestId.length).toBeGreaterThan(0);
  expect(res.headers.get("x-contract-version")).toBeTruthy();
  return body;
}

/** Starts a server and always closes it, whatever the test finds. */
export async function withServer<T>(
  env: Record<string, string | undefined>,
  deps: Parameters<typeof start>[1],
  use: (server: Started) => Promise<T>,
): Promise<T> {
  const server = await start(env, deps);
  try {
    return await use(server);
  } finally {
    await server.handle.close().catch(() => undefined);
  }
}
