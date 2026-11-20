/**
 * T-B9-04: the 6th sign-in attempt in a minute for one email is 429, and so is the 6th from one
 * IP (T-B8's limiter, names sign-in-email and sign-in-ip). The IP is the socket's peer, never a
 * client-set X-Forwarded-For (T-B8 G7 P2). Time is a TestClock.
 */
import { describe, expect, it } from "vitest";
import { testDatabase } from "../db/support/database.ts";
import {
  authApp,
  OPERATOR_EMAIL,
  operatorPassword,
  sessionCookie,
  signIn,
  testClock,
} from "./support.ts";

const database = testDatabase("b9rate");
const MINUTE = 60_000;

async function setup() {
  const d = await database();
  const password = await operatorPassword(d.url);
  return { d, password };
}

const retryAfter = (res: Response) => Number(res.headers.get("x-retry-after"));

describe("T-B9-04 · sign-in rate limit", () => {
  it("the 6th attempt in a minute for one email is 429, even from a new IP and with the right password", async () => {
    const { d, password } = await setup();
    const clock = await testClock();
    const app = authApp({ databaseUrl: d.url, clock: clock.clock });

    // Five wrong attempts, each from its own IP: 401 (and well short of the lockout).
    for (let i = 1; i <= 5; i++) {
      const res = await signIn(app, OPERATOR_EMAIL, `${password}-no${i}`, {
        peer: `198.51.100.${i}`,
      });
      expect(res.status, `attempt ${i}`).toBe(401);
    }
    const sixth = await signIn(app, OPERATOR_EMAIL, password, { peer: "198.51.100.99" });
    expect(sixth.status).toBe(429);
    expect(((await sixth.json()) as { code: string }).code).toBe("TOO_MANY_REQUESTS");
    expect(retryAfter(sixth)).toBeGreaterThan(0);
    expect(retryAfter(sixth)).toBeLessThanOrEqual(60);
    expect(sessionCookie(sixth)).toBeUndefined();

    // The next minute it is open again.
    await clock.advance(MINUTE);
    const open = await signIn(app, OPERATOR_EMAIL, password, { peer: "198.51.100.99" });
    expect(open.status).toBe(200);
  });

  it("the 6th attempt from one IP is 429 whatever the email, and a forged X-Forwarded-For doesn't dodge it", async () => {
    const { d, password } = await setup();
    const clock = await testClock();
    const app = authApp({ databaseUrl: d.url, clock: clock.clock });
    const peer = "192.0.2.50";

    // Five attempts for five different emails, each claiming another address in X-Forwarded-For.
    for (let i = 1; i <= 5; i++) {
      const res = await signIn(app, `nobody${i}@avel.test`, password, {
        peer,
        headers: { "x-forwarded-for": `10.9.8.${i}`, "x-real-ip": `10.9.7.${i}` },
      });
      expect(res.status, `attempt ${i}`).toBe(401);
    }
    const sixth = await signIn(app, OPERATOR_EMAIL, password, {
      peer,
      headers: { "x-forwarded-for": "10.9.8.200" },
    });
    expect(sixth.status).toBe(429);
    expect(retryAfter(sixth)).toBeGreaterThan(0);
    expect(retryAfter(sixth)).toBeLessThanOrEqual(60);

    // Another peer is a separate window.
    const elsewhere = await signIn(app, OPERATOR_EMAIL, password, { peer: "192.0.2.51" });
    expect(elsewhere.status).toBe(200);
  });
});
