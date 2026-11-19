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
}

const SIGN_IN = "POST /api/auth/sign-in/email";

/**
 * The only endpoints Better Auth serves: the three the web reads (login.md section 1). Any other
 * /api/auth/* path, change-password and verify-password included, never reaches it.
 */
const SERVED = new Set([SIGN_IN, "GET /api/auth/get-session", "POST /api/auth/sign-out"]);

const endpointOf = (request: Request) => `${request.method} ${new URL(request.url).pathname}`;

/** The pool's timeouts, as DbLive's defaults. */
const CONNECT_TIMEOUT_MS = 5_000;
const STATEMENT_TIMEOUT_MS = 30_000;

function betterAuthFor(options: AuthOptions, clock: Clock.Clock, logLine: (line: string) => void) {
  const log = (level: string, message: string) =>
    logLine(
      JSON.stringify({
        level,
        time: new Date(clock.currentTimeMillisUnsafe()).toISOString(),
        message,
      }),
    );
  const pool = new pg.Pool({
    connectionString: options.databaseUrl,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
    statement_timeout: STATEMENT_TIMEOUT_MS,
  }).on("error", (error: Error & { code?: string }) =>
    log("Error", `idle database client error ${error.code ?? ""}`.trim()),
  );
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
    const response = yield* intoBetterAuth(() => auth.handler(request));
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
  const auth = betterAuthFor(options, clock ?? Clock.Clock.defaultValue(), logLine);
  const runtime = ManagedRuntime.make(
    Layer.mergeAll(
      RateLimitLive,
      LockoutLive,
      clock === undefined ? Layer.empty : Layer.succeed(Clock.Clock)(clock),
    ),
  );
  return {
    runtime,
    serves: (request: Request) => SERVED.has(endpointOf(request)),
    handle: (request: Request) =>
      endpointOf(request) === SIGN_IN
        ? signIn(auth, request)
        : intoBetterAuth(() => auth.handler(request)),
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
