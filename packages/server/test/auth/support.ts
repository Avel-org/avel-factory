/**
 * Harness for T-B9's acceptance tests. It names the seams the build must provide (listed in the
 * report for the lead to confirm before the lock):
 *
 *   src/platform/auth.ts   Caller: an Effect service { userId, sessionId } (the operator's users.id
 *                            and the auth_sessions.id). A procedure reads it with
 *                            `Effect.serviceOption(Caller)`: None without a valid session cookie.
 *                          ClientIp: a service holding a string, the socket peer's address (or the
 *                            first trusted proxy's), never a client-set X-Forwarded-For.
 *                          RequestIdempotencyKey: a service holding `string | null`, the request's
 *                            Idempotency-Key header.
 *                          All three are provided by effectHandler, so Services in
 *                          effect-handler.ts includes ClientIp and RequestIdempotencyKey.
 *   src/platform/app.ts    createApp({ router?, layer?, logLine?, clock?, auth? }) -> { fetch }
 *                            clock: a `Clock.Clock` (default: the live one). The lockout and the
 *                              sign-in rate limit (RateLimitLive) read time from it, so a test that
 *                              passes a TestClock moves them without sleeping (F4).
 *                            auth: { databaseUrl, secret, baseUrl, secureCookies }. With it, the app
 *                              mounts Better Auth at /api/auth/* outside the contract (email and
 *                              password only, sign-up off), builds the rate limiter and the
 *                              lockout once (not per request), and resolves Caller per request
 *                              from the web session cookie. Without it, no /api/auth/*, no Caller.
 *                          fetch(request, peer?: { address: string }): the peer is the socket's
 *                            remote address; main.ts passes the real one.
 *   src/seed.ts            seedOperator({ databaseUrl, email, password }): Promise<void>. Creates the
 *                            one operator (users + a credential auth_accounts row, password hashed)
 *                            and AVEL's internal client (clients.kind 'internal'); a second run with
 *                            the same email changes nothing; it never creates a second user (it
 *                            may reject when the email differs).
 *
 * Wire (docs/ui-contracts/login.md section 1): POST /api/auth/sign-in/email { email, password };
 * 200 { user: { id, email, name } } and Set-Cookie `better-auth.session_token`; 401 with
 * code INVALID_EMAIL_OR_PASSWORD; 429 with X-Retry-After (seconds) and code TOO_MANY_ATTEMPTS for
 * the lockout, TOO_MANY_REQUESTS for the rate limit; GET /api/auth/get-session.
 */
import { randomBytes } from "node:crypto";
import { contract } from "@avel/contract";
import { implement } from "@orpc/server";
import { type Clock, Effect, Scope } from "effect";
import { TestClock } from "effect/testing";
import { createApp } from "../../src/platform/app.ts";
import { effectHandler } from "../../src/platform/effect-handler.ts";
import { seedOperator } from "../../src/seed.ts";

export const ORIGIN = "http://avel.test";
export const OPERATOR_EMAIL = "operator@avel.test";
/** A throwaway: made fresh on every run, never a value in the repo (E6). */
export const newPassword = () => `pw-${randomBytes(12).toString("hex")}`;

const MINUTE = 60_000;
/** On a whole minute, so the limiter's window and the test's minutes agree. */
export const T0 = Math.floor(Date.UTC(2026, 10, 18, 12, 0, 0) / MINUTE) * MINUTE;

export interface Handle {
  readonly clock: TestClock.TestClock;
  readonly advance: (ms: number) => Promise<void>;
}

/** A TestClock at T0 whose time the app reads, moved by `advance`. */
export async function testClock(): Promise<Handle> {
  const clock = (await Effect.runPromise(
    Effect.gen(function* () {
      const scope = yield* Scope.make();
      const made = yield* TestClock.make().pipe(Scope.provide(scope));
      yield* made.setTime(T0);
      return made;
    }),
  )) as TestClock.TestClock;
  return { clock, advance: (ms) => Effect.runPromise(clock.adjust(ms)) };
}

export const SECRET = "test-secret-not-a-real-one-0123456789abcdef";

export interface AuthAppOptions {
  readonly databaseUrl: string;
  readonly clock?: Clock.Clock;
  readonly secureCookies?: boolean;
  readonly program?: Parameters<typeof effectHandler>[0];
}

/** An app with Better Auth, whose route 6 runs `program` (default: succeeds with `{}`). */
export function authApp(options: AuthAppOptions) {
  const os = implement(contract);
  const router = {
    health: {
      health: os.health.health.handler(
        effectHandler(options.program ?? (() => Effect.succeed({}))),
      ),
    },
  };
  const app = createApp({
    router,
    ...(options.clock ? { clock: options.clock } : {}),
    auth: {
      databaseUrl: options.databaseUrl,
      secret: SECRET,
      baseUrl: ORIGIN,
      secureCookies: options.secureCookies ?? false,
    },
  });
  return app;
}

type App = ReturnType<typeof createApp>;

export interface CallOptions {
  readonly peer?: string;
  readonly headers?: Record<string, string>;
  readonly cookie?: string;
}

export function call(
  app: App,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  options: CallOptions = {},
) {
  const headers: Record<string, string> = {
    origin: ORIGIN,
    ...(body === undefined ? {} : { "content-type": "application/json" }),
    ...(options.cookie ? { cookie: options.cookie } : {}),
    ...options.headers,
  };
  return app.fetch(
    new Request(`${ORIGIN}${path}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    { address: options.peer ?? "203.0.113.10" },
  );
}

export const signIn = (app: App, email: string, password: string, options?: CallOptions) =>
  call(app, "POST", "/api/auth/sign-in/email", { email, password }, options);

/** The `name=value` pair of the session cookie in a response, or undefined. */
export function sessionCookie(res: Response): string | undefined {
  for (const line of res.headers.getSetCookie()) {
    const m = /^(better-auth\.session_token=[^;]*)/.exec(line);
    if (m && m[1] !== "better-auth.session_token=") return m[1];
  }
  return undefined;
}

export function setCookieLine(res: Response): string {
  return res.headers.getSetCookie().find((l) => l.startsWith("better-auth.session_token=")) ?? "";
}

export const seed = (databaseUrl: string, password: string, email = OPERATOR_EMAIL) =>
  seedOperator({ databaseUrl, email, password });

const seededPasswords = new Map<string, string>();

/** Seeds this database once with a throwaway password and returns it; later calls return the same one. */
export async function operatorPassword(databaseUrl: string): Promise<string> {
  const known = seededPasswords.get(databaseUrl);
  if (known) return known;
  const password = newPassword();
  await seed(databaseUrl, password);
  seededPasswords.set(databaseUrl, password);
  return password;
}
