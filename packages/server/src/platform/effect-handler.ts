import { type ErrorBody, errorMap, errorStatus } from "@avel/contract";
import { ORPCError } from "@orpc/server";
import { Cause, Effect, Layer, Logger, type ManagedRuntime, Option } from "effect";
import { Caller, type CallerIdentity, ClientIp, RequestIdempotencyKey } from "./auth/services.ts";
import { errorTable, type MappedError } from "./errors.ts";
import { Ids } from "./ids.ts";
import { jsonLogger } from "./logger.ts";
import { RequestId } from "./request-id.ts";

/** What the app hands each request's procedures through oRPC's context. */
export interface RequestScope {
  readonly requestId: string;
  readonly layer: Layer.Layer<Ids>;
  readonly logLine: (line: string) => void;
  /** The socket peer's address, as `ClientIp`. */
  readonly clientIp: string;
  /** The Idempotency-Key header, as `RequestIdempotencyKey`. */
  readonly idempotencyKey: string | null;
  /** Looks up the request's caller from its session cookie; run only when a procedure runs. */
  readonly caller: Effect.Effect<Option.Option<CallerIdentity>>;
}

/**
 * The services a program may use: the request's ID, its client IP and Idempotency-Key, and the
 * Ids service. `Caller` is there only with a live session, so it's read with `serviceOption`.
 */
type Services = RequestId | Ids | ClientIp | RequestIdempotencyKey;

const isRequestScope = (value: unknown): value is RequestScope =>
  typeof value === "object" &&
  value !== null &&
  "requestId" in value &&
  "layer" in value &&
  "caller" in value;

/** The contract's 500: the catalog's message, never the defect's. */
const internalError = () =>
  new ORPCError("INTERNAL_SERVER_ERROR", { message: errorMap.INTERNAL_SERVER_ERROR.message });

/** Gives the request's logger (annotated with its ID) and services to a program. */
function provideRequest<A, E, R>(program: Effect.Effect<A, E, R>, scope: RequestScope) {
  return program.pipe(
    Effect.provideService(RequestId, scope.requestId),
    Effect.provideService(ClientIp, scope.clientIp),
    Effect.provideService(RequestIdempotencyKey, scope.idempotencyKey),
    Effect.provide(Layer.merge(scope.layer, Logger.layer([jsonLogger(scope.logLine)]))),
    Effect.annotateLogs({ requestId: scope.requestId }),
  );
}

/** Runs the program with `Caller` when the request has a live session. */
const withCaller = <A, E, R>(program: Effect.Effect<A, E, R>, scope: RequestScope) =>
  Effect.gen(function* () {
    const caller = yield* scope.caller;
    return yield* Option.isSome(caller)
      ? program.pipe(Effect.provideService(Caller, caller.value))
      : program;
  });

/** The request's ID: a valid incoming one is kept; otherwise a new UUIDv7 from `Ids`. */
export function resolveRequestId(layer: Layer.Layer<Ids>, incoming: string | null) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (incoming !== null && uuid.test(incoming)) return Promise.resolve(incoming);
  return Effect.runPromise(
    Effect.gen(function* () {
      const ids = yield* Ids;
      return yield* ids.uuidv7;
    }).pipe(Effect.provide(layer)),
  );
}

/**
 * The one adapter between oRPC 1.16.2 and Effect (CR-30). A procedure is
 * `os.route.handler(effectHandler(({ input }) => program))`. It runs the program tied to the
 * request, so an abort interrupts it and runs its finalizers, and turns the result into oRPC's:
 * success is the output, a tagged failure is the `ORPCError` its table row names, and a defect
 * is logged and answered as a 500 that never shows it. A failure whose tag has no row in
 * `errorTable` doesn't compile.
 */
export function effectHandler<E extends MappedError>(
  program: (options: { input: unknown }) => Effect.Effect<unknown, E, Services>,
) {
  return async (options: {
    input: unknown;
    context: unknown;
    signal?: AbortSignal;
    // biome-ignore lint/suspicious/noExplicitAny: oRPC validates the output against the route's DTO; the adapter can't name that type for every route.
  }): Promise<any> => {
    const scope = options.context;
    if (!isRequestScope(scope)) throw internalError();
    const guarded = Effect.catchCause(
      withCaller(program({ input: options.input }), scope),
      (cause) =>
        Effect.gen(function* () {
          const failure = Cause.findErrorOption(cause);
          if (Option.isSome(failure)) {
            const code = errorTable[failure.value._tag];
            return yield* Effect.fail(
              new ORPCError(code, {
                status: errorStatus[code],
                message: failure.value.message,
                data: failure.value.details,
              }),
            );
          }
          yield* Effect.logError("unhandled defect", Cause.pretty(cause));
          return yield* Effect.fail(internalError());
        }),
    );
    const exit = await Effect.runPromiseExit(provideRequest(guarded, scope), {
      signal: options.signal,
    });
    if (exit._tag === "Success") return exit.value;
    throw Cause.squash(exit.cause);
  };
}

/**
 * Runs a route outside the contract (Better Auth's /api/auth/*) on the app's runtime, with the
 * request's logger and services. A defect is logged and answered as the contract's 500, which
 * never shows it.
 */
export function runEdge<R>(
  runtime: ManagedRuntime.ManagedRuntime<R, never>,
  program: Effect.Effect<Response, never, R | Services>,
  scope: RequestScope,
): Promise<Response> {
  const guarded = Effect.catchCause(program, (cause) =>
    Effect.gen(function* () {
      yield* Effect.logError("unhandled defect", Cause.pretty(cause));
      return Response.json(
        {
          code: "INTERNAL_SERVER_ERROR",
          message: errorMap.INTERNAL_SERVER_ERROR.message,
          requestId: scope.requestId,
        } satisfies ErrorBody,
        { status: errorMap.INTERNAL_SERVER_ERROR.status },
      );
    }),
  );
  return runtime.runPromise(provideRequest(guarded, scope));
}
