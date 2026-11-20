import { errorMap, errorStatus } from "@avel/contract";
import { ORPCError } from "@orpc/server";
import { Effect, Option } from "effect";
import { Caller, type CallerIdentity } from "../../platform/auth/index.ts";
import { effectHandler } from "../../platform/effect-handler.ts";
import type { MappedError } from "../../platform/errors.ts";

/**
 * A request refused at the edge, before the route does anything, the way oRPC refuses input
 * its schema rejects: no live session (401), or a request the schema can't judge (400). The
 * error table has no row for either code, so these are answered here, with the contract's body.
 */
export class Refused {
  constructor(readonly code: "UNAUTHORIZED" | "BAD_REQUEST") {}
}

/** The services `effectHandler` gives a program. */
type Services = Effect.Services<ReturnType<Parameters<typeof effectHandler>[0]>>;

/**
 * A route only the operator may call (`caller: "operator"` in the contract). With no live
 * session it is 401 `UNAUTHORIZED` and the program never runs; otherwise the program runs
 * through `effectHandler` with the Caller, and may answer `Refused`.
 */
export const operatorHandler =
  <I, E extends MappedError>(
    program: (input: I, caller: CallerIdentity) => Effect.Effect<unknown, E, Services>,
  ) =>
  async (options: { input: I; context: unknown; signal?: AbortSignal }) => {
    const answer = await effectHandler(() =>
      Effect.gen(function* () {
        const caller = yield* Effect.serviceOption(Caller);
        if (Option.isNone(caller)) return new Refused("UNAUTHORIZED");
        return yield* program(options.input, caller.value);
      }),
    )(options);
    if (answer instanceof Refused) {
      throw new ORPCError(answer.code, {
        status: errorStatus[answer.code],
        message: errorMap[answer.code].message,
      });
    }
    return answer;
  };
