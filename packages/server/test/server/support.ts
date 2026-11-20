/**
 * Harness for T-B16's acceptance tests. It names the seam the build must provide (listed in the
 * report for the lead to confirm before the lock):
 *
 *   src/server.ts   startServer(env, deps?) -> Promise<ServerHandle>
 *                     env: the configuration as a plain record of variable names to values, as
 *                       process.env holds them: DATABASE_URL, PORT ("0" asks for a free port),
 *                       AVEL_AUTH_SECRET, AVEL_WEB_ORIGIN. The pool timeouts are optional.
 *                     deps: { clock?: Clock.Clock; logLine?: (line: string) => void }, the same
 *                       seams createApp has: the lockout and rate limits read `clock`, and every
 *                       log line goes to `logLine`.
 *                     ServerHandle: { port: number; close(): Promise<void> }. close() stops
 *                       listening and releases Better Auth's pool and runtime.
 *                     A missing or short AVEL_AUTH_SECRET rejects, and the message names the
 *                       variable, never its value.
 *
 * The server is reached over real HTTP on 127.0.0.1, so the peer address is the socket's.
 */
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import type { Clock } from "effect";

export const ORIGIN = "https://avel.test";
export const OPERATOR_EMAIL = "operator@avel.test";
export const newSecret = () => `secret-${randomBytes(24).toString("hex")}`;

export interface ServerHandle {
  readonly port: number;
  close(): Promise<void>;
}
export interface Deps {
  readonly clock?: Clock.Clock;
  readonly logLine?: (line: string) => void;
}

/** Loaded when called, so a missing src/server.ts fails the test that needs it. */
export async function loadStartServer(): Promise<
  (env: Record<string, string | undefined>, deps?: Deps) => Promise<ServerHandle>
> {
  const modulePath = fileURLToPath(new URL("../../src/server.ts", import.meta.url));
  const loaded = (await import(/* @vite-ignore */ modulePath)) as {
    startServer: (env: Record<string, string | undefined>, deps?: Deps) => Promise<ServerHandle>;
  };
  return loaded.startServer;
}

export const envFor = (databaseUrl: string, extra: Record<string, string | undefined> = {}) => ({
  DATABASE_URL: databaseUrl,
  PORT: "0",
  AVEL_AUTH_SECRET: newSecret(),
  AVEL_WEB_ORIGIN: ORIGIN,
  ...extra,
});

export interface Started {
  readonly handle: ServerHandle;
  readonly url: string;
}

export async function start(
  env: Record<string, string | undefined>,
  deps?: Deps,
): Promise<Started> {
  const startServer = await loadStartServer();
  const handle = await startServer(env, deps);
  return { handle, url: `http://127.0.0.1:${handle.port}` };
}

export function post(
  server: Started,
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return fetch(`${server.url}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN, ...headers },
    body: JSON.stringify(body),
  });
}

export const signIn = (
  server: Started,
  email: string,
  password: string,
  headers: Record<string, string> = {},
) => post(server, "/api/auth/sign-in/email", { email, password }, headers);

export function sessionCookieLine(res: Response): string {
  return res.headers.getSetCookie().find((l) => l.startsWith("better-auth.session_token=")) ?? "";
}

export const cookiePair = (res: Response): string | undefined =>
  /^(better-auth\.session_token=[^;]+)/.exec(sessionCookieLine(res))?.[1];
