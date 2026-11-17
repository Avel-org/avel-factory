import { Clock, Context, Effect, Layer, Random } from "effect";

/** IDs come from here, never from `crypto.randomUUID()` (Writing Effect rule 4). */
export class Ids extends Context.Service<Ids, { readonly uuidv7: Effect.Effect<string> }>()(
  "avel/Ids",
) {}

const hex = (value: number, width: number) => value.toString(16).padStart(width, "0");

/** A UUIDv7 (RFC 9562): 48 bits of Unix milliseconds, then random bits with version and variant. */
const uuidv7 = Effect.gen(function* () {
  const millis = yield* Clock.currentTimeMillis;
  const randA = yield* Random.nextIntBetween(0, 0x1000);
  const randB = yield* Random.nextIntBetween(0, 0x4000);
  const randC = yield* Random.nextIntBetween(0, 0x10000);
  const randD = yield* Random.nextIntBetween(0, 0x100000000);
  const time = hex(millis, 12);
  return [
    time.slice(0, 8),
    time.slice(8),
    hex(0x7000 | randA, 4),
    hex(0x8000 | randB, 4),
    hex(randC, 4) + hex(randD, 8),
  ].join("-");
});

export const IdsLive = Layer.succeed(Ids)({ uuidv7 });
