/**
 * T-B16-03: the 6th sign-in in a minute from one socket address is 429, counted from the socket's
 * address with any X-Forwarded-For ignored. The emails differ, so the per-email limit isn't what
 * answers; the time is a TestClock (F4).
 */
import { afterAll, describe, expect, it } from "vitest";
import { testClock } from "../auth/support.ts";
import { testDatabase } from "../db/support/database.ts";
import { envFor, type Started, signIn, start } from "./support.ts";

const database = testDatabase("b16rate");
const running: Started[] = [];
afterAll(async () => {
  await Promise.all(running.map((s) => s.handle.close().catch(() => undefined)));
});

describe("T-B16-03 · rate limit by socket address", () => {
  it("the 6th sign-in in a minute is 429 TOO_MANY_REQUESTS, whatever X-Forwarded-For says", async () => {
    const d = await database();
    const clock = await testClock();
    const server = await start(envFor(d.url), { clock: clock.clock });
    running.push(server);

    for (let i = 1; i <= 5; i++) {
      const res = await signIn(server, `nobody${i}@avel.test`, "wrong-password-1", {
        "x-forwarded-for": `198.51.100.${i}`,
      });
      expect(res.status, `attempt ${i}`).toBe(401);
    }
    const sixth = await signIn(server, "nobody6@avel.test", "wrong-password-1", {
      "x-forwarded-for": "198.51.100.200",
    });
    expect(sixth.status).toBe(429);
    const body = (await sixth.json()) as { code: string; requestId: string };
    expect(body.code).toBe("TOO_MANY_REQUESTS");
    expect(body.requestId).toBe(sixth.headers.get("x-request-id"));
    expect(Number(sixth.headers.get("x-retry-after"))).toBeGreaterThan(0);

    // A minute on, the window is open again.
    await clock.advance(61_000);
    const again = await signIn(server, "nobody7@avel.test", "wrong-password-1");
    expect(again.status).toBe(401);
  });
});
