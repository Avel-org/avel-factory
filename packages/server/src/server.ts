/**
 * The real server (Step 1 items 1, 5 and 11): T-B14's router, Better Auth at /api/auth/*, and the
 * GitHub webhook at /api/webhooks/github, from the configuration, served over HTTP by
 * @hono/node-server. Its resources (the router's and the webhook's Db pool, Better Auth's pool,
 * the sign-in guard's runtime, the listening socket) live in one scope, closed by `close()` or by
 * a failed startup (Writing Effect rule 6).
 */
import { createAdaptorServer, type ServerType } from "@hono/node-server";
import {
  Cause,
  type Clock,
  Config,
  ConfigProvider,
  Data,
  Effect,
  Exit,
  Layer,
  Option,
  Redacted,
  Scope,
} from "effect";
import { createApp } from "./platform/app.ts";
import { DbLive } from "./platform/db/db.ts";
import { IdempotencyLive } from "./platform/idempotency.ts";
import { makeRouter } from "./platform/router.ts";

/** Better Auth signs the session cookie with it; shorter is refused at startup. */
const MIN_SECRET_LENGTH = 32;
const DEFAULT_PORT = 3000;

/** The seams createApp has: the lockout and rate limits read `clock`; log lines go to `logLine`. */
export interface ServerDeps {
  readonly clock?: Clock.Clock;
  readonly logLine?: (line: string) => void;
}

export interface ServerHandle {
  /** The port it listens on: PORT, or a free one when PORT is 0. */
  readonly port: number;
  /** Stops listening, then releases every pool and runtime the server opened. */
  close(): Promise<void>;
}

/** A setting that stops startup. Its message names the variable, never its value. */
class InvalidSetting extends Data.TaggedError("InvalidSetting")<{ readonly message: string }> {}

/** The server's settings; DATABASE_URL and AVEL_AUTH_SECRET stay redacted until they're used. */
const settings = Effect.gen(function* () {
  const databaseUrl = yield* Config.Redacted("DATABASE_URL");
  const port = yield* Config.Int("PORT").pipe(Config.withDefault(DEFAULT_PORT));
  const secret = yield* Config.Redacted("AVEL_AUTH_SECRET");
  if (Redacted.value(secret).length < MIN_SECRET_LENGTH) {
    return yield* new InvalidSetting({
      message: `AVEL_AUTH_SECRET must be at least ${MIN_SECRET_LENGTH} characters`,
    });
  }
  const webOrigin = yield* Config.URL("AVEL_WEB_ORIGIN");
  // Better Auth's pool takes DbLive's settings; unset, it keeps DbLive's defaults.
  const connectTimeoutMs = yield* Config.option(Config.Int("DATABASE_CONNECT_TIMEOUT_MS"));
  const statementTimeoutMs = yield* Config.option(Config.Int("DATABASE_STATEMENT_TIMEOUT_MS"));
  return {
    databaseUrl,
    port,
    secret,
    webOrigin,
    timeouts: {
      ...Option.match(connectTimeoutMs, {
        onNone: () => ({}),
        onSome: (ms) => ({ connectTimeoutMs: ms }),
      }),
      ...Option.match(statementTimeoutMs, {
        onNone: () => ({}),
        onSome: (ms) => ({ statementTimeoutMs: ms }),
      }),
    },
  };
});

/** The webhook's settings: all of them, or none (then the server has no webhook). */
const WEBHOOK_SETTINGS = "GITHUB_WEBHOOK_SECRET, FACTORY_REPO and FACTORY_APP_LOGIN";

/** A webhook setting that is set and not empty; its message names the variable, never a value. */
const required = <A>(name: string, value: Option.Option<A>, text: (value: A) => string) =>
  Option.isSome(value) && text(value.value) !== ""
    ? Effect.succeed(value.value)
    : Effect.fail(
        new InvalidSetting({
          message: `${name} is missing or empty: the GitHub webhook needs ${WEBHOOK_SETTINGS}`,
        }),
      );

/**
 * The GitHub webhook's settings: GITHUB_WEBHOOK_SECRET (redacted), FACTORY_REPO ("owner/name")
 * and FACTORY_APP_LOGIN (the factory App's login). With none of them set there is no webhook;
 * with any of them set, each must be set and not empty.
 */
const webhookSettings = Effect.gen(function* () {
  const secret = yield* Config.option(Config.Redacted("GITHUB_WEBHOOK_SECRET"));
  const repo = yield* Config.option(Config.String("FACTORY_REPO"));
  const appLogin = yield* Config.option(Config.String("FACTORY_APP_LOGIN"));
  if (Option.isNone(secret) && Option.isNone(repo) && Option.isNone(appLogin)) return undefined;
  return {
    secret: yield* required("GITHUB_WEBHOOK_SECRET", secret, Redacted.value),
    repo: yield* required("FACTORY_REPO", repo, String),
    appLogin: yield* required("FACTORY_APP_LOGIN", appLogin, String),
  };
});

type Fetch = ReturnType<typeof createApp>["fetch"];

/** Listens on the port for the scope; the socket's peer reaches the app as its client IP. */
const listen = (fetch: Fetch, port: number) =>
  Effect.acquireRelease(
    Effect.callback<ServerType, Error>((resume) => {
      const server = createAdaptorServer({ fetch });
      const onError = (error: Error) => resume(Effect.fail(error));
      server.once("error", onError);
      server.listen(port, () => {
        server.off("error", onError);
        resume(Effect.succeed(server));
      });
    }),
    (server) =>
      Effect.callback<void>((resume) => {
        server.close(() => resume(Effect.void));
      }),
  );

const portOf = (server: ServerType) => {
  const address = server.address();
  return typeof address === "object" && address !== null ? address.port : 0;
};

/**
 * The app, with its resources released when the scope closes: the router's and the webhook's
 * Db, built once from the env's DATABASE_URL and pool timeouts, and Better Auth's pool and
 * runtime.
 */
const serve = (deps: ServerDeps) =>
  Effect.gen(function* () {
    const config = yield* settings;
    const webhook = yield* webhookSettings;
    const databaseUrl = Redacted.value(config.databaseUrl);
    const services = yield* Layer.build(IdempotencyLive.pipe(Layer.provideMerge(DbLive)));
    const { app } = yield* Effect.acquireRelease(
      Effect.sync(() => {
        const held = { release: Effect.void };
        const app = createApp({
          router: makeRouter({ services }),
          ...(webhook === undefined ? {} : { webhook: { db: services, ...webhook } }),
          ...(deps.clock === undefined ? {} : { clock: deps.clock }),
          ...(deps.logLine === undefined ? {} : { logLine: deps.logLine }),
          auth: {
            databaseUrl,
            secret: Redacted.value(config.secret),
            baseUrl: config.webOrigin.origin,
            // Secure everywhere but an origin served over plain http.
            secureCookies: config.webOrigin.protocol !== "http:",
            ...config.timeouts,
            onRelease: (release) => {
              held.release = release;
            },
          },
        });
        return { app, release: held.release };
      }),
      ({ release }) => release,
    );
    const server = yield* listen(app.fetch, config.port);
    return portOf(server);
  });

/** Why startup failed: a setting's or the socket's message, or only a defect's name. */
const reasonOf = (cause: Cause.Cause<unknown>) => {
  const failure = Cause.findErrorOption(cause);
  if (Option.isSome(failure)) {
    return failure.value instanceof Error ? failure.value.message : String(failure.value);
  }
  const defect = Cause.squash(cause);
  return defect instanceof Error ? defect.name : typeof defect;
};

/**
 * Starts the server from `env` (process.env's shape): DATABASE_URL, PORT (0 for a free port),
 * AVEL_AUTH_SECRET (at least 32 characters), AVEL_WEB_ORIGIN, optionally
 * DATABASE_CONNECT_TIMEOUT_MS and DATABASE_STATEMENT_TIMEOUT_MS, and the webhook's
 * GITHUB_WEBHOOK_SECRET, FACTORY_REPO and FACTORY_APP_LOGIN (all or none). It rejects, with
 * everything it opened released, when a setting is missing or invalid, the database can't be
 * reached, or the port can't be had.
 */
export async function startServer(
  env: Record<string, string | undefined>,
  deps: ServerDeps = {},
): Promise<ServerHandle> {
  const scope = Scope.makeUnsafe();
  const exit = await Effect.runPromiseExit(
    serve(deps).pipe(
      Scope.provide(scope),
      Effect.provideService(ConfigProvider.ConfigProvider, ConfigProvider.fromEnvRecord(env)),
    ),
  );
  if (Exit.isFailure(exit)) {
    await Effect.runPromise(Scope.close(scope, exit));
    throw new Error(`the server didn't start: ${reasonOf(exit.cause)}`);
  }
  return {
    port: exit.value,
    close: () => Effect.runPromise(Scope.close(scope, Exit.void)),
  };
}
