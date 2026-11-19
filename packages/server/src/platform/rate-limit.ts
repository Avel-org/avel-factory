import { errorMap } from "@avel/contract";
import { Clock, Config, Context, Effect, Layer } from "effect";
import { TooManyRequests } from "./errors.ts";

const WINDOW_MS = 60_000;

/** The plan's default calls a minute per name (Step 0 and Step 1 plan, Rate limits). */
const defaults = {
  "sign-in-email": 5,
  "sign-in-ip": 5,
  "device-login": 5,
  webhook: 60,
} as const;

export type RateLimitName = keyof typeof defaults;

/** The setting for a name's limit, e.g. RATE_LIMIT_DEVICE_LOGIN_PER_MINUTE. */
const settingFor = (name: RateLimitName) =>
  `RATE_LIMIT_${name.toUpperCase().replaceAll("-", "_")}_PER_MINUTE`;

/**
 * The in-memory rate limiter (Step 1 item 2.4): a fixed one-minute window per (name, key), on the
 * Clock's minute, so only the current minute's counts are held.
 */
export class RateLimit extends Context.Service<
  RateLimit,
  {
    /** Counts one call; past the name's limit in this window it is `TooManyRequests`. */
    readonly check: (name: RateLimitName, key: string) => Effect.Effect<void, TooManyRequests>;
  }
>()("avel/RateLimit") {}

export const RateLimitLive = Layer.effect(
  RateLimit,
  Effect.gen(function* () {
    const limitFor = (name: RateLimitName) =>
      Config.Int(settingFor(name)).pipe(Config.withDefault(defaults[name]));
    // A setting that isn't an integer is a defect at boot, not an error a caller handles.
    const limits = yield* Config.all({
      "sign-in-email": limitFor("sign-in-email"),
      "sign-in-ip": limitFor("sign-in-ip"),
      "device-login": limitFor("device-login"),
      webhook: limitFor("webhook"),
    }).pipe(Effect.orDie);
    let window = -1;
    let counts = new Map<string, number>();

    const check = (name: RateLimitName, key: string) =>
      Effect.gen(function* () {
        const now = yield* Clock.currentTimeMillis;
        const calls = yield* Effect.sync(() => {
          const current = Math.floor(now / WINDOW_MS);
          if (current !== window) {
            window = current;
            counts = new Map();
          }
          const id = `${name}\u0000${key}`;
          const n = (counts.get(id) ?? 0) + 1;
          counts.set(id, n);
          return n;
        });
        if (calls > limits[name]) {
          return yield* new TooManyRequests({
            message: errorMap.TOO_MANY_REQUESTS.message,
            details: { retryAfterMs: WINDOW_MS - (now % WINDOW_MS) },
          });
        }
      });

    return { check };
  }),
);
