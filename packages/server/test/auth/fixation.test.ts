/**
 * T-B9-06: the session id after sign-in differs from any session id the client presented before
 * it (no fixation; Breach). A cookie the attacker planted is never adopted.
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

const database = testDatabase("b9fixation");

describe("T-B9-06 · no session fixation", () => {
  it("a session id presented before sign-in is not the one after it", async () => {
    const d = await database();
    const password = newPassword();
    await seed(d.url, password);
    const clock = await testClock();
    const app = authApp({ databaseUrl: d.url, clock: clock.clock });
    const c = await d.client();

    // 1. Signed in once: session A.
    const a = await signIn(app, OPERATOR_EMAIL, password, { peer: "203.0.113.31" });
    expect(a.status).toBe(200);
    const cookieA = sessionCookie(a) as string;
    const rowsA = (await c.query("select id, token from auth_sessions")).rows as {
      id: string;
      token: string;
    }[];
    expect(rowsA).toHaveLength(1);

    // 2. Signing in again while presenting A's cookie makes a new session, never reuses A's id or token.
    const b = await signIn(app, OPERATOR_EMAIL, password, {
      peer: "203.0.113.32",
      cookie: cookieA,
    });
    expect(b.status).toBe(200);
    const cookieB = sessionCookie(b) as string;
    expect(cookieB).not.toBe(cookieA);
    const rowsB = (await c.query("select id, token from auth_sessions")).rows as {
      id: string;
      token: string;
    }[];
    const newest = rowsB.filter((r) => r.id !== rowsA[0]?.id);
    expect(newest).toHaveLength(1);
    expect(newest[0]?.token).not.toBe(rowsA[0]?.token);

    // 3. An attacker-chosen cookie presented at sign-in is not adopted as the session.
    const planted = "better-auth.session_token=attacker-chosen-value.sig";
    const f = await signIn(app, OPERATOR_EMAIL, password, {
      peer: "203.0.113.33",
      cookie: planted,
    });
    expect(f.status).toBe(200);
    expect(sessionCookie(f)).not.toBe(planted);
    expect(sessionCookie(f)?.includes("attacker-chosen-value")).toBe(false);
    const tokens = (await c.query("select token from auth_sessions")).rows as { token: string }[];
    expect(tokens.some((t) => t.token.includes("attacker-chosen-value"))).toBe(false);
  });
});
