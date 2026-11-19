/**
 * T-B9-02: sign-up is refused, and no route or a second seed run creates a second user
 * (users count stays 1). Breach: signing up a second operator after bootstrap.
 */
import { describe, expect, it } from "vitest";
import { testDatabase } from "../db/support/database.ts";
import {
  authApp,
  call,
  newPassword,
  OPERATOR_EMAIL,
  seed,
  sessionCookie,
  signIn,
  testClock,
} from "./support.ts";

const database = testDatabase("b9signup");

describe("T-B9-02 · one operator", () => {
  it("sign-up is refused, and neither it nor a second seed run makes a second user", async () => {
    const d = await database();
    const password = newPassword();
    await seed(d.url, password);
    const c = await d.client();
    const count = async () =>
      ((await c.query("select count(*)::int as n from users")).rows[0] as { n: number }).n;
    expect(await count()).toBe(1);

    const clock = await testClock();
    const app = authApp({ databaseUrl: d.url, clock: clock.clock });
    const other = newPassword();

    const up = await call(app, "POST", "/api/auth/sign-up/email", {
      email: "second@avel.test",
      password: other,
      name: "Second",
    });
    expect(up.status).toBeGreaterThanOrEqual(400);
    expect(up.status).toBeLessThan(500);
    expect(sessionCookie(up)).toBeUndefined();
    expect(await count()).toBe(1);

    // Signed in, sign-up is still refused.
    const ok = await signIn(app, OPERATOR_EMAIL, password);
    const cookie = sessionCookie(ok) as string;
    const again = await call(
      app,
      "POST",
      "/api/auth/sign-up/email",
      { email: "third@avel.test", password: other, name: "Third" },
      { cookie },
    );
    expect(again.status).toBeGreaterThanOrEqual(400);
    expect(again.status).toBeLessThan(500);
    expect(await count()).toBe(1);

    // A seed run with another email makes no second user (it may refuse).
    await seed(d.url, other, "second@avel.test").catch(() => undefined);
    expect(await count()).toBe(1);
    const second = await signIn(app, "second@avel.test", other, { peer: "203.0.113.20" });
    expect(second.status).toBe(401);
    expect(
      ((await c.query("select count(*)::int as n from auth_accounts")).rows[0] as { n: number }).n,
    ).toBe(1);
  });
});
