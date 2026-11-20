/**
 * T-B16-05: a wrong password is still a 401 response, and still counts toward the lockout: the
 * 11th failure in 15 minutes is locked (a regression check on the error path change).
 */
import { afterAll, describe, expect, it } from "vitest";
import { newPassword, seed, testClock } from "../auth/support.ts";
import { testDatabase } from "../db/support/database.ts";
import { cookiePair, envFor, OPERATOR_EMAIL, type Started, signIn, start } from "./support.ts";

const database = testDatabase("b16lockout");
const running: Started[] = [];
afterAll(async () => {
  await Promise.all(running.map((s) => s.handle.close().catch(() => undefined)));
});
const MINUTE = 60_000;

describe("T-B16-05 · lockout through the real server", () => {
  it("ten wrong passwords are 401 responses; the 11th, with the right one, is 429 TOO_MANY_ATTEMPTS", async () => {
    const d = await database();
    const password = newPassword();
    await seed(d.url, password);
    const clock = await testClock();
    const server = await start(envFor(d.url), { clock: clock.clock });
    running.push(server);

    for (let i = 1; i <= 10; i++) {
      const res = await signIn(server, OPERATOR_EMAIL, `${password}-wrong-${i}`);
      expect(res.status, `failure ${i}`).toBe(401);
      const body = (await res.json()) as { code?: string };
      expect(body.code).toBe("INVALID_EMAIL_OR_PASSWORD");
      expect(cookiePair(res)).toBeUndefined();
      if (i === 5) await clock.advance(MINUTE + 1_000);
    }
    await clock.advance(MINUTE + 1_000);

    const locked = await signIn(server, OPERATOR_EMAIL, password);
    expect(locked.status).toBe(429);
    expect(((await locked.json()) as { code: string }).code).toBe("TOO_MANY_ATTEMPTS");
    expect(Number(locked.headers.get("x-retry-after"))).toBeGreaterThan(0);
    expect(cookiePair(locked)).toBeUndefined();
  });
});
