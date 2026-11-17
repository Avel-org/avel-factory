import { errorStatus } from "@avel/contract";
import { ORPCError } from "@orpc/server";
import { Cause, Effect, Layer, Logger, Option } from "effect";
import { errorTable, type MappedError } from "./errors.ts";
import { Ids } from "./ids.ts";
import { jsonLogger } from "./logger.ts";
import { RequestId } from "./request-id.ts";

/** What the app hands each request's procedures through oRPC's context. */
export interface RequestScope {
  readonly requestId: string;
  readonly layer: Layer.Layer<Ids>;
  readonly logLine: (line: string) => void;
}

/** The services a program may use: the request's ID and the Ids service. */
type Services = RequestId | Ids;

const isRequestScope = (value: unknown): value is RequestScope =>
  typeof value === "object" && value !== null && "requestId" in value && "layer" in value;

/** Gives the request's logger (annotated with its ID) and services to a program. */
function provideRequest<E>(program: Effect.Effect<unknown, E, Services>, scope: RequestScope) {
  return program.pipe(
    Effect.provideService(RequestId, scope.requestId),
    Effect.provide(Layer.merge(scope.layer, Logger.layer([jsonLogger(scope.logLine)]))),
    Effect.annotateLogs({ requestId: scope.requestId }),
  );
}

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
    if (!isRequestScope(options.context)) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Internal server error" });
    }
    const guarded = Effect.catchCause(program({ input: options.input }), (cause) =>
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
        return yield* Effect.fail(
          new ORPCError("INTERNAL_SERVER_ERROR", { message: "Internal server error" }),
        );
      }),
    );
    const exit = await Effect.runPromiseExit(provideRequest(guarded, options.context), {
      signal: options.signal,
    });
    if (exit._tag === "Success") return exit.value;
    throw Cause.squash(exit.cause);
  };
}
