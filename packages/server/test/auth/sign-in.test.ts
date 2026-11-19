/**
 * T-B9-01: the seeded operator signs in with the right password and gets a session cookie; a
 * wrong password is refused with no session. Also the Drizzle adapter's name mapping (users,
 * auth_accounts, auth_sessions) and the cookie flags (httpOnly, SameSite=Lax, Secure outside tests).
 */
import { describe, expect, it } from "vitest";
import { testDatabase } from "../db/support/database.ts";
import {
  authApp,
  call,
  OPERATOR_EMAIL,
  operatorPassword,
  sessionCookie,
  setCookieLine,
  signIn,
  testClock,
} from "./support.ts";

const database = testDatabase("b9signin");

describe("T-B9-01 · sign-in", () => {
  it("the right password: 200, the user, a session cookie, and a row in auth_sessions", async () => {
    const d = await database();
    const password = await operatorPassword(d.url);
    const clock = await testClock();
    const app = authApp({ databaseUrl: d.url, clock: clock.clock });

    const res = await signIn(app, OPERATOR_EMAIL, password);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { id: string; email: string; name: string } };
    expect(body.user.email).toBe(OPERATOR_EMAIL);
    expect(body.user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(typeof body.user.name).toBe("string");

    const cookie = sessionCookie(res);
    expect(cookie).toBeDefined();
    const line = setCookieLine(res);
    expect(line).toMatch(/HttpOnly/i);
    expect(line).toMatch(/SameSite=Lax/i);
    expect(line).not.toMatch(/;\s*Secure/i);

    const c = await d.client();
    const users = await c.query("select id, email from users");
    expect(users.rows).toHaveLength(1);
    expect(body.user.id).toBe(users.rows[0].id);
    const sessions = await c.query("select user_id from auth_sessions");
    expect(sessions.rows).toHaveLength(1);
    expect(sessions.rows[0].user_id).toBe(users.rows[0].id);

    const me = await call(app, "GET", "/api/auth/get-session", undefined, {
      cookie: cookie as string,
    });
    expect(me.status).toBe(200);
    const session = (await me.json()) as { user: { email: string }; session: { userId: string } };
    expect(session.user.email).toBe(OPERATOR_EMAIL);
    expect(session.session.userId).toBe(users.rows[0].id);
  });

  it("the cookie is Secure when the app is built for production (secureCookies)", async () => {
    const d = await database();
    const password = await operatorPassword(d.url);
    const clock = await testClock();
    const app = authApp({ databaseUrl: d.url, clock: clock.clock, secureCookies: true });
    const res = await signIn(app, OPERATOR_EMAIL, password, { peer: "203.0.113.11" });
    expect(res.status).toBe(200);
    expect(setCookieLine(res)).toMatch(/;\s*Secure/i);
  });

  it("a wrong password, and an unknown email, are 401 INVALID_EMAIL_OR_PASSWORD with no cookie and no session", async () => {
    const d = await database();
    const password = await operatorPassword(d.url);
    const c = await d.client();
    await c.query("delete from auth_sessions");
    const clock = await testClock();
    const app = authApp({ databaseUrl: d.url, clock: clock.clock });

    for (const [email, pw] of [
      [OPERATOR_EMAIL, `${password}-wrong`],
      ["nobody@avel.test", password],
    ] as const) {
      const res = await signIn(app, email, pw, { peer: "203.0.113.12" });
      expect(res.status).toBe(401);
      const body = (await res.json()) as { code: string };
      expect(body.code).toBe("INVALID_EMAIL_OR_PASSWORD");
      expect(sessionCookie(res)).toBeUndefined();
      // Neither answer leaks the password or which half was wrong.
      expect(JSON.stringify(body)).not.toContain(pw);
    }
    const sessions = await c.query("select count(*)::int as n from auth_sessions");
    expect(sessions.rows[0].n).toBe(0);
  });
});
