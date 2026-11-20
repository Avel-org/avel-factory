import { createHash } from "node:crypto";
import { ErrorBody, errorMap, errorStatus } from "@avel/contract";
import { Cause, Effect, Exit, Option } from "effect";
import * as z from "zod/mini";
import { type CallerIdentity, RequestIdempotencyKey } from "../../platform/auth/index.ts";
import {
  BadRequest,
  type ErrorTag,
  errorTable,
  type MappedError,
} from "../../platform/errors.ts";
import { Idempotency } from "../../platform/idempotency.ts";

/** A refused write's stored answer: the error body without the first request's ID. */
const StoredFailure = z.omit(ErrorBody, { requestId: true });

const sha256 = (input: unknown) => createHash("sha256").update(JSON.stringify(input)).digest("hex");

/** The tag whose row in the error table names this code. */
const tagOf = (code: string) =>
  (Object.keys(errorTable) as ErrorTag[]).find((tag) => errorTable[tag] === code);

/** The first request's answer again: its output, or its failure under the same code. */
const replay = (status: number, response: unknown) =>
  Effect.gen(function* () {
    if (status < 400) return response;
    const stored = StoredFailure.parse(response);
    const tag = tagOf(stored.code);
    if (tag === undefined) return yield* Effect.die(new Error("a stored answer with no error tag"));
    const failure: MappedError = {
      _tag: tag,
      message: stored.message,
      ...(stored.details === undefined ? {} : { details: stored.details }),
    };
    return yield* Effect.fail(failure);
  });

/**
 * Runs a write under the request's Idempotency-Key, stored per (operator, key) by T-B8's store
 * (AGENTS.md, API rules: writes). A write without the header is refused (400). The same key and
 * body answer the first request's output or tagged failure; another body, or a repeat while
 * the first still runs, is 409. A write that dies with a defect gives its key up, so a retry
 * runs again. The input is hashed as the contract parsed it.
 */
export const idempotentWrite = <A, E extends MappedError, R>(
  caller: CallerIdentity,
  route: string,
  input: unknown,
  status: number,
  write: Effect.Effect<A, E, R>,
) =>
  Effect.gen(function* () {
    const key = yield* RequestIdempotencyKey;
    if (key === null) return yield* new BadRequest({ message: errorMap.BAD_REQUEST.message });
    const store = yield* Idempotency;
    const begun = yield* store.begin(caller.userId, key, route, sha256(input));
    if (begun._tag === "Replay") return yield* replay(begun.status, begun.response);

    const exit = yield* Effect.exit(write);
    if (Exit.isSuccess(exit)) {
      yield* store.complete(caller.userId, key, status, exit.value, { sensitive: false });
      return exit.value;
    }
    // A tagged failure is the first answer too. A defect stores nothing and gives the key up,
    // because the write's transaction rolled back; an interruption stores nothing.
    const failure = Cause.findErrorOption(exit.cause);
    if (Option.isNone(failure) && Cause.hasDies(exit.cause)) {
      yield* store.release(caller.userId, key);
    }
    if (Option.isSome(failure)) {
      const code = errorTable[failure.value._tag];
      yield* store.complete(
        caller.userId,
        key,
        errorStatus[code],
        {
          code,
          message: failure.value.message,
          ...(failure.value.details === undefined ? {} : { details: failure.value.details }),
        },
        { sensitive: false },
      );
    }
    return yield* Effect.failCause(exit.cause);
  });
