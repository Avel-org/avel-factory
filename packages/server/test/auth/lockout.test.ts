/**
 * T-B9-03: the 11th failed sign-in within 15 minutes is locked out even with the right password,
 * and it unlocks after 15 minutes. Time is a TestClock (F4). The rate limit (5 a minute) is kept
 * clear by spacing the failures a minute apart, in batches of five.
 */
import { describe, expect, it } from "vitest";
import { testDatabase } from "../db/support/database.ts";
import {
  authApp,
  newPassword,
  OPERATOR_EMAIL,
  seed,
  sessionCookie,
  signIn,
  testClock,
} from "./support.ts";

const database = testDatabase("b9lockout");
const other = testDatabase("b9lockoutb");
const MINUTE = 60_000;

describe("T-B9-03 · lockout", () => {
  it("10 failures in 15 minutes lock the account for 15 minutes, right password or not", async () => {
    const d = await database();
    const password = newPassword();
    await seed(d.url, password);
    const clock = await testClock();
    const app = authApp({ databaseUrl: d.url, clock: clock.clock });
    const c = await d.client();

    // Ten failures in two batches of five, a minute apart: each is 401, none is rate limited.
    for (let i = 1; i <= 10; i++) {
      const res = await signIn(app, OPERATOR_EMAIL, `${password}-wrong-${i}`);
      expect(res.status, `failure ${i}`).toBe(401);
      if (i === 5) await clock.advance(MINUTE + 1_000);
    }
    await clock.advance(MINUTE + 1_000);

    // The 11th, with the right password, is locked out: 429, X-Retry-After, no session.
    const locked = await signIn(app, OPERATOR_EMAIL, password);
    expect(locked.status).toBe(429);
    const retry = Number(locked.headers.get("x-retry-after"));
    expect(Number.isInteger(retry)).toBe(true);
    expect(retry).toBeGreaterThan(60);
    expect(retry).toBeLessThanOrEqual(15 * 60);
    expect(((await locked.json()) as { code: string }).code).toBe("TOO_MANY_ATTEMPTS");
    expect(sessionCookie(locked)).toBeUndefined();
    expect(
      ((await c.query("select count(*)::int as n from auth_sessions")).rows[0] as { n: number }).n,
    ).toBe(0);

    // Still locked 10 minutes on.
    await clock.advance(10 * MINUTE);
    expect((await signIn(app, OPERATOR_EMAIL, password)).status).toBe(429);

    // 15 minutes after the 10th failure it is open again: the right password signs in.
    await clock.advance(6 * MINUTE);
    const open = await signIn(app, OPERATOR_EMAIL, password);
    expect(open.status).toBe(200);
    expect(sessionCookie(open)).toBeDefined();
  });

  it("failures older than 15 minutes don't count: 5, 16 minutes, 5 more, then the right password signs in", async () => {
    const d = await other();
    const password = newPassword();
    await seed(d.url, password);
    const clock = await testClock();
    const app = authApp({ databaseUrl: d.url, clock: clock.clock });

    for (let i = 1; i <= 5; i++) {
      expect((await signIn(app, OPERATOR_EMAIL, `${password}-x${i}`)).status).toBe(401);
    }
    await clock.advance(16 * MINUTE);
    for (let i = 1; i <= 5; i++) {
      expect((await signIn(app, OPERATOR_EMAIL, `${password}-y${i}`)).status).toBe(401);
    }
    await clock.advance(MINUTE + 1_000);
    const res = await signIn(app, OPERATOR_EMAIL, password);
    expect(res.status).toBe(200);
  });
});
