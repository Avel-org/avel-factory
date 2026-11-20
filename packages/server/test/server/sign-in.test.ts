/**
 * T-B16-01: startServer with a seeded operator signs in over HTTP: a session cookie that is Secure
 * for an https origin, and get-session then names the operator.
 */
import { afterAll, describe, expect, it } from "vitest";
import { newPassword, seed } from "../auth/support.ts";
import { testDatabase } from "../db/support/database.ts";
import {
  cookiePair,
  envFor,
  OPERATOR_EMAIL,
  ORIGIN,
  type Started,
  sessionCookieLine,
  signIn,
  start,
} from "./support.ts";

const database = testDatabase("b16signin");
const running: Started[] = [];
afterAll(async () => {
  await Promise.all(running.map((s) => s.handle.close().catch(() => undefined)));
});

describe("T-B16-01 · sign-in in the real server", () => {
  it("POST /api/auth/sign-in/email sets a Secure session cookie, and get-session names the operator", async () => {
    const d = await database();
    const password = newPassword();
    await seed(d.url, password);
    const server = await start(envFor(d.url));
    running.push(server);

    const res = await signIn(server, OPERATOR_EMAIL, password);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { id: string; email: string } };
    expect(body.user.email).toBe(OPERATOR_EMAIL);
    const line = sessionCookieLine(res);
    expect(line).toMatch(/;\s*Secure/i);
    expect(line).toMatch(/HttpOnly/i);
    expect(line).toMatch(/SameSite=Lax/i);
    expect(res.headers.get("x-request-id")).toBeTruthy();
    expect(res.headers.get("x-contract-version")).toBeTruthy();

    const cookie = cookiePair(res);
    expect(cookie).toBeDefined();
    const me = await fetch(`${server.url}/api/auth/get-session`, {
      headers: { cookie: cookie as string, origin: ORIGIN },
    });
    expect(me.status).toBe(200);
    const session = (await me.json()) as { user: { id: string; email: string } };
    expect(session.user.email).toBe(OPERATOR_EMAIL);
    expect(session.user.id).toBe(body.user.id);
  });
});
