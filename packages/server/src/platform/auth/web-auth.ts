import { authAccounts, authSessions, authVerifications, users } from "@avel/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { Clock, Effect, Layer, ManagedRuntime, Option } from "effect";
import pg from "pg";
import { RateLimit, RateLimitLive } from "../rate-limit.ts";
import { RequestId } from "../request-id.ts";
import { Lockout, LockoutLive } from "./lockout.ts";
import { type CallerIdentity, ClientIp } from "./services.ts";

/** Better Auth's settings for one app (createApp's `auth`). */
export interface AuthOptions {
  readonly databaseUrl: string;
  /** Signs the session cookie; at least 32 characters. */
  readonly secret: string;
  /** The origin the web app is served from, e.g. https://avel.example. */
  readonly baseUrl: string;
  /** Marks the session cookie Secure; on everywhere but tests over plain http. */
  readonly secureCookies: boolean;
  /** How long a connect to Better Auth's pool may take; DbLive's default, 5 s. */
  readonly connectTimeoutMs?: number;
  /** How long a statement may run on Better Auth's pool; DbLive's default, 30 s. */
  readonly statementTimeoutMs?: number;
  /**
   * Given, once, the release of Better Auth's pool and the sign-in guard's runtime; whoever owns
   * the app runs it on shutdown (Writing Effect rule 6). Without it, both live as long as the
   * process.
   */
  readonly onRelease?: (release: Effect.Effect<void>) => void;
}

const SIGN_IN = "POST /api/auth/sign-in/email";

/**
 * The only endpoints Better Auth serves: the three the web reads (login.md section 1). Any other
 * /api/auth/* path, change-password and verify-password included, never reaches it.
 */
const SERVED = new Set([SIGN_IN, "GET /api/auth/get-session", "POST /api/auth/sign-out"]);

const endpointOf = (request: Request) => `${request.method} ${new URL(request.url).pathname}`;

/** The pool's default timeouts, DbLive's. */
const CONNECT_TIMEOUT_MS = 5_000;
const STATEMENT_TIMEOUT_MS = 30_000;
/** How long past the statement timeout node-postgres waits before it gives up, as DbLive's. */
const QUERY_TIMEOUT_MARGIN_MS = 5_000;

const logWith =
  (clock: Clock.Clock, logLine: (line: string) => void) => (level: string, message: string) =>
    logLine(
      JSON.stringify({
        level,
        time: new Date(clock.currentTimeMillisUnsafe()).toISOString(),
        message,
      }),
    );

function poolFor(options: AuthOptions, log: (level: string, message: string) => void) {
  const statementTimeoutMs = options.statementTimeoutMs ?? STATEMENT_TIMEOUT_MS;
  const onIdleClientError = (error: Error & { code?: string }) =>
    log("Error", `idle database client error ${error.code ?? ""}`.trim());
  const pool = new pg.Pool({
    connectionString: options.databaseUrl,
    connectionTimeoutMillis: options.connectTimeoutMs ?? CONNECT_TIMEOUT_MS,
    statement_timeout: statementTimeoutMs,
    query_timeout: statementTimeoutMs + QUERY_TIMEOUT_MARGIN_MS,
  }).on("error", onIdleClientError);
  const end = Effect.promise(() => pool.end().finally(() => pool.off("error", onIdleClientError)));
  return { pool, end };
}

function betterAuthFor(
  options: AuthOptions,
  pool: pg.Pool,
  log: (level: string, message: string) => void,
) {
  return betterAuth({
    appName: "AVEL",
    baseURL: options.baseUrl,
    secret: options.secret,
    // The schema's users and auth_* tables, under Better Auth's model names; ids are the schema's
    // uuid_generate_v7() default.
    database: drizzleAdapter(drizzle(pool), {
      provider: "pg",
      schema: {
        user: users,
        session: authSessions,
        account: authAccounts,
        verification: authVerifications,
      },
    }),
    emailAndPassword: { enabled: true, disableSignUp: true },
    // Sign-in is guarded by the server's own rate limiter and lockout, on the Clock.
    rateLimit: { enabled: false },
    telemetry: { enabled: false },
    // The message only: Better Auth's extra arguments can carry request values.
    logger: { level: "error", log: (level, message) => log(level, message) },
    // An error inside an endpoint is rethrown, unlogged: better-call still answers its own API
    // errors (the 401 the lockout counts), and anything else reaches intoBetterAuth instead of
    // better-call's empty 500 and console.error, which print the failed query's params
    // (t-b9-rigg-03, t-b9-axis-06).
    onAPIError: { throw: true },
    advanced: {
      database: { generateId: false },
      // No __Secure- prefix: the cookie keeps the name the web reads (login.md section 1).
      useSecureCookies: false,
      defaultCookieAttributes: { secure: options.secureCookies, httpOnly: true, sameSite: "lax" },
      // Better Auth would read X-Forwarded-For, which a client can set.
      ipAddress: { disableIpTracking: true },
    },
  });
}

type BetterAuth = ReturnType<typeof betterAuthFor>;

/** The Postgres code in an error's cause chain, if one is there. */
const pgCodeIn = (error: unknown): string | undefined => {
  const seen = new Set<unknown>();
  for (let at = error; at instanceof Error && !seen.has(at); at = at.cause) {
    if (at instanceof pg.DatabaseError) return at.code;
    seen.add(at);
  }
  return undefined;
};

/**
 * A call into Better Auth. A rejection becomes a defect with only the error's name and the
 * Postgres code in its cause chain: its message and its cause can carry a bound value, such as
 * the session token in a failed query's params (t-b9-axis-01), the same rule as DbLive's.
 */
const intoBetterAuth = <A>(call: () => Promise<A>) =>
  Effect.promise(call).pipe(
    Effect.catchDefect((defect) => {
      const name = defect instanceof Error ? defect.name : typeof defect;
      const code = pgCodeIn(defect);
      return Effect.die(
        new Error(
          `Better Auth failed: ${name}${code === undefined ? "" : ` (database error ${code})`}`,
        ),
      );
    }),
  );

/**
 * An answer from Better Auth's handler. Its own 4xx answers come back as they are; a 5xx (such
 * as get-session's after a database error, which it catches itself) is a defect with only the
 * status, so runEdge answers the contract's 500 with the request's ID, as for sign-in.
 */
const answerOf = (auth: BetterAuth, request: Request) =>
  Effect.gen(function* () {
    const response = yield* intoBetterAuth(() => auth.handler(request));
    if (response.status >= 500) {
      return yield* Effect.die(new Error(`Better Auth answered ${response.status}`));
    }
    return response;
  });

/** The email a sign-in names, read as Better Auth reads it (JSON or a form) and lower-cased. */
const emailOf = (request: Request) =>
  Effect.promise(async () => {
    const type = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
    const body: unknown = await (type === "application/x-www-form-urlencoded"
      ? request.formData().then(Object.fromEntries)
      : request.json()
    ).catch(() => undefined);
    const email = typeof body === "object" && body !== null && "email" in body ? body.email : null;
    return typeof email === "string" ? email.toLowerCase() : undefined;
  });

/** A refused sign-in: 429 with the wait in X-Retry-After, in seconds (login.md section 1). */
const refused = (code: string, message: string, retryAfterMs: number) =>
  Effect.gen(function* () {
    const requestId = yield* RequestId;
    return Response.json(
      { code, message, requestId },
      { status: 429, headers: { "X-Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
    );
  });

/**
 * Sign-in through the rate limits (5 a minute per email and per IP) and the lockout. A refused
 * attempt never reaches Better Auth; a 401 from it counts as a failure.
 */
const signIn = (auth: BetterAuth, request: Request) =>
  Effect.gen(function* () {
    const email = yield* emailOf(request.clone());
    const ip = yield* ClientIp;
    const limiter = yield* RateLimit;
    const lockout = yield* Lockout;
    const guard = Effect.gen(function* () {
      if (email !== undefined) yield* limiter.check("sign-in-email", email);
      yield* limiter.check("sign-in-ip", ip);
      if (email !== undefined) yield* lockout.check(email);
    });
    const refusal = yield* guard.pipe(
      Effect.as(undefined),
      Effect.catchTags({
        TooManyRequests: (error) =>
          refused("TOO_MANY_REQUESTS", error.message, error.details.retryAfterMs),
        Locked: (error) => refused("TOO_MANY_ATTEMPTS", "Too many attempts", error.retryAfterMs),
      }),
    );
    if (refusal !== undefined) return refusal;
    const response = yield* answerOf(auth, request);
    if (response.status === 401 && email !== undefined) yield* lockout.recordFailure(email);
    return response;
  });

/** Better Auth at /api/auth/*, with the services its sign-in guard uses. */
export interface WebAuth {
  /** The sign-in guard's rate limiter and lockout, built once per app. */
  readonly runtime: ManagedRuntime.ManagedRuntime<RateLimit | Lockout, never>;
  /** Whether a request is one of the endpoints Better Auth serves. */
  readonly serves: (request: Request) => boolean;
  /** Answers a request `serves` accepts. */
  readonly handle: (
    request: Request,
  ) => Effect.Effect<Response, never, RateLimit | Lockout | RequestId | ClientIp>;
  /** The caller a request's web session cookie names, if that session is live. */
  readonly caller: (headers: Headers) => Effect.Effect<Option.Option<CallerIdentity>>;
}

export function makeWebAuth(
  options: AuthOptions,
  clock: Clock.Clock | undefined,
  logLine: (line: string) => void,
): WebAuth {
  const log = logWith(clock ?? Clock.Clock.defaultValue(), logLine);
  const { pool, end } = poolFor(options, log);
  const auth = betterAuthFor(options, pool, log);
  const runtime = ManagedRuntime.make(
    Layer.mergeAll(
      RateLimitLive,
      LockoutLive,
      clock === undefined ? Layer.empty : Layer.succeed(Clock.Clock)(clock),
    ),
  );
  options.onRelease?.(Effect.andThen(runtime.disposeEffect, end));
  return {
    runtime,
    serves: (request: Request) => SERVED.has(endpointOf(request)),
    handle: (request: Request) =>
      endpointOf(request) === SIGN_IN ? signIn(auth, request) : answerOf(auth, request),
    caller: (headers: Headers) =>
      intoBetterAuth(() => auth.api.getSession({ headers, query: { disableRefresh: true } })).pipe(
        Effect.map((found) =>
          found === null
            ? Option.none<CallerIdentity>()
            : Option.some({ userId: found.session.userId, sessionId: found.session.id }),
        ),
      ),
  };
}
