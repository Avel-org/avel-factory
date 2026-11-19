/**
 * T-B9-05: a procedure run with the session cookie sees Caller with the operator's user id;
 * without it there is no Caller; a procedure can read the request's Idempotency-Key header and
 * client IP (the socket's peer, not a client-set X-Forwarded-For).
 */
import { Effect, Option } from "effect";
import { describe, expect, it } from "vitest";
import { Caller, ClientIp, RequestIdempotencyKey } from "../../src/platform/auth.ts";
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

const database = testDatabase("b9caller");

interface Seen {
  caller: Option.Option<{ userId: string; sessionId: string }>;
  ip: string | undefined;
  key: string | null | undefined;
}

describe("T-B9-05 · the caller", () => {
  it("Caller is the operator with the cookie, absent without it or with a bad one; the key and IP are readable", async () => {
    const d = await database();
    const password = newPassword();
    await seed(d.url, password);
    const clock = await testClock();
    const seen: Seen[] = [];
    const app = authApp({
      databaseUrl: d.url,
      clock: clock.clock,
      program: () =>
        Effect.gen(function* () {
          const caller = yield* Effect.serviceOption(Caller);
          const ip = yield* ClientIp;
          const key = yield* RequestIdempotencyKey;
          seen.push({ caller, ip, key });
          return {};
        }),
    });

    const login = await signIn(app, OPERATOR_EMAIL, password);
    const cookie = sessionCookie(login) as string;
    const c = await d.client();
    const user = (await c.query("select id from users")).rows[0] as { id: string };
    const session = (await c.query("select id from auth_sessions")).rows[0] as { id: string };

    // With the cookie.
    const withCookie = await call(app, "GET", "/api/health", undefined, {
      cookie,
      peer: "203.0.113.77",
      headers: { "idempotency-key": "key-abc-123", "x-forwarded-for": "10.1.1.1" },
    });
    expect(withCookie.status).toBe(200);
    const first = seen[0] as Seen;
    expect(Option.isSome(first.caller)).toBe(true);
    if (Option.isSome(first.caller)) {
      expect(first.caller.value.userId).toBe(user.id);
      expect(first.caller.value.sessionId).toBe(session.id);
    }
    expect(first.key).toBe("key-abc-123");
    expect(first.ip).toBe("203.0.113.77");

    // Without a cookie: 200 (no route here needs one), no Caller, no key.
    const bare = await call(app, "GET", "/api/health", undefined, { peer: "203.0.113.78" });
    expect(bare.status).toBe(200);
    const second = seen[1] as Seen;
    expect(Option.isNone(second.caller)).toBe(true);
    expect(second.key).toBeNull();
    expect(second.ip).toBe("203.0.113.78");

    // A cookie the server never issued, and a tampered one, give no Caller.
    for (const bad of ["better-auth.session_token=forged-value.abc", `${cookie}x`]) {
      await call(app, "GET", "/api/health", undefined, { cookie: bad });
    }
    expect(seen).toHaveLength(4);
    expect(Option.isNone((seen[2] as Seen).caller)).toBe(true);
    expect(Option.isNone((seen[3] as Seen).caller)).toBe(true);

    // After sign-out the old cookie is no longer a Caller.
    const out = await call(app, "POST", "/api/auth/sign-out", {}, { cookie });
    expect(out.status).toBe(200);
    await call(app, "GET", "/api/health", undefined, { cookie });
    expect(Option.isNone((seen[4] as Seen).caller)).toBe(true);
  });
});
