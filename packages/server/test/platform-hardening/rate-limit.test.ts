/**
 * T-B8-08: the in-memory rate limiter: a fixed one-minute window per (name, key), time from the
 * Clock. Not applied to any route until T-B9 and T-B10.
 */
import { ErrorBody } from "@avel/contract";
import { it } from "@effect/vitest";
import { ConfigProvider, Effect, Layer } from "effect";
import { TestClock } from "effect/testing";
import { describe, expect } from "vitest";
import { errorTable } from "../../src/platform/errors.ts";
import { RateLimit, RateLimitLive } from "../../src/platform/rate-limit.ts";
import { appRunning, fixedIds, get } from "../support/harness.ts";

const MINUTE = 60_000;
/** On a whole minute, so a window that starts at the first call and one aligned to the clock agree. */
const T0 = Math.floor(Date.UTC(2026, 10, 18, 12, 0, 0) / MINUTE) * MINUTE;
const ID = "0193a000-0000-7000-8000-0000000008a8";

const limiter = RateLimitLive.pipe(
  Layer.provide(ConfigProvider.layer(ConfigProvider.fromEnvRecord({}))),
);

describe("T-B8-08 · rate limit", () => {
  it.effect(
    "the 6th call in a minute is TOO_MANY_REQUESTS; another key isn't affected; the next window passes",
    () =>
      Effect.gen(function* () {
        yield* TestClock.setTime(T0);
        const limits = yield* RateLimit;

        for (let i = 1; i <= 5; i++) yield* limits.check("device-login", "ip-1");
        yield* TestClock.adjust(10_000);
        const sixth = yield* Effect.flip(limits.check("device-login", "ip-1"));
        expect(sixth._tag).toBe("TooManyRequests");
        expect(errorTable[sixth._tag]).toBe("TOO_MANY_REQUESTS");
        expect(sixth.details).toEqual({ retryAfterMs: 50_000 });

        // Another key, and another limit name on the same key, are separate windows.
        yield* limits.check("device-login", "ip-2");
        yield* limits.check("sign-in-ip", "ip-1");

        // The webhook default is 60 a minute.
        for (let i = 1; i <= 60; i++) yield* limits.check("webhook", "github");
        const sixtyFirst = yield* Effect.flip(limits.check("webhook", "github"));
        expect(sixtyFirst._tag).toBe("TooManyRequests");

        // After the window, the first key passes again.
        yield* TestClock.adjust(50_000);
        yield* limits.check("device-login", "ip-1");
      }).pipe(Effect.provide(limiter)),
  );

  it.effect("reaches HTTP as 429 TOO_MANY_REQUESTS with retryAfterMs and the requestId", () =>
    Effect.gen(function* () {
      yield* TestClock.setTime(T0);
      const app = appRunning(
        () =>
          Effect.gen(function* () {
            const limits = yield* RateLimit;
            for (let i = 1; i <= 6; i++) yield* limits.check("device-login", "ip-http");
          }).pipe(Effect.provide(limiter), Effect.provide(TestClock.layer())),
        { layer: fixedIds(ID) },
      );
      const res = yield* Effect.promise(() => get(app, "/api/health"));
      expect(res.status).toBe(429);
      const body = ErrorBody.parse(yield* Effect.promise(() => res.json()));
      expect(body.code).toBe("TOO_MANY_REQUESTS");
      expect(body.requestId).toBe(ID);
      expect(typeof (body.details as { retryAfterMs: number }).retryAfterMs).toBe("number");
    }),
  );
});
