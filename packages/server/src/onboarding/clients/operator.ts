import { errorMap } from "@avel/contract";
import { Effect, Option } from "effect";
import { Caller, type CallerIdentity } from "../../platform/auth/index.ts";
import { effectHandler } from "../../platform/effect-handler.ts";
import { type MappedError, Unauthorized } from "../../platform/errors.ts";

/** The services `effectHandler` gives a program. */
type Services = Effect.Services<ReturnType<Parameters<typeof effectHandler>[0]>>;

/**
 * A route only the operator may call (`caller: "operator"` in the contract). With no live
 * session it fails `Unauthorized` (401) and the program never runs; otherwise the program runs
 * through `effectHandler` with the Caller.
 */
export const operatorHandler =
  <I, E extends MappedError>(
    program: (input: I, caller: CallerIdentity) => Effect.Effect<unknown, E, Services>,
  ) =>
  (options: { input: I; context: unknown; signal?: AbortSignal }) =>
    effectHandler(() =>
      Effect.gen(function* () {
        const caller = yield* Effect.serviceOption(Caller);
        if (Option.isNone(caller)) {
          return yield* new Unauthorized({ message: errorMap.UNAUTHORIZED.message });
        }
        return yield* program(options.input, caller.value);
      }),
    )(options);
