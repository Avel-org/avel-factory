import { beforeEach, describe, expect, it } from "vitest";
import { createMock, fixtures, type Mock } from "../src/index.js";

// T-B11 A (CR-W30): the mock's auth, login.md section 5 word for word. The clock is a
// closure the test moves, never the wall clock (F4). The password is the mock-only value
// login.md names, not a real one (E6).

const START = Date.parse("2026-11-18T09:00:00.000Z");
const MIN = 60_000;
const HOUR = 60 * MIN;
const COOKIE = "better-auth.session_token";

let at = START;
let mock: Mock;

type AuthMock = Mock & { resetAuth(): void; recorded(): Array<Record<string, unknown>> };
const auth = () => mock as AuthMock;

beforeEach(() => {
  at = START;
  mock = createMock({ contractVersion: "1.0.1", now: () => new Date(at) });
});

const operator = () =>
  (fixtures as unknown as { operator: Record<string, string> }).operator as {
    id: string;
    email: string;
    name: string;
    password: string;
  };

const post = (path: string, body: unknown, cookie?: string) =>
  mock.fetch(
    new Request(`http://mock.test${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
      body: JSON.stringify(body),
    }),
  );

const signIn = (email: string, password: string) =>
  post("/api/auth/sign-in/email", { email, password });

const getSession = (cookie?: string) =>
  mock.fetch(
    new Request("http://mock.test/api/auth/get-session", {
      headers: cookie ? { cookie } : {},
    }),
  );

/** The `name=value` pair of the session cookie in a Set-Cookie header. */
const cookiePair = (res: Response): string => {
  const header = res.headers.get("set-cookie") ?? "";
  const m = header.match(new RegExp(`${COOKIE}=([^;]*)`));
  expect(m, `no ${COOKIE} in Set-Cookie: ${header}`).not.toBeNull();
  return `${COOKIE}=${m?.[1]}`;
};

describe("T-B11-01: sign-in", () => {
  it("the operator's mock password gives 200, { redirect: false, token, user } and the cookie", async () => {
    const op = operator();
    expect(op, "fixtures.operator is not there yet").toBeDefined();
    expect(op.email).toBe("operator@avel.test");
    expect(op.name).toBe("Operator");

    const res = await signIn(op.email, op.password);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      redirect: boolean;
      token: string;
      user: Record<string, unknown>;
    };
    expect(body.redirect).toBe(false);
    expect(typeof body.token).toBe("string");
    expect(body.token.length).toBeGreaterThan(0);
    expect(body.user).toMatchObject({ id: op.id, email: op.email, name: "Operator" });

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${COOKIE}=`);
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
  });

  it("a wrong password or a wrong email is 401 INVALID_EMAIL_OR_PASSWORD", async () => {
    const op = operator();
    for (const [email, password] of [
      [op.email, "not-the-password"],
      ["someone-else@avel.test", op.password],
    ] as const) {
      const res = await signIn(email, password);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({
        code: "INVALID_EMAIL_OR_PASSWORD",
        message: "Invalid email or password",
      });
      expect(res.headers.get("set-cookie")).toBeNull();
    }
  });
});

describe("T-B11-02: the lockout", () => {
  it("the 11th sign-in within 15 minutes is 429 TOO_MANY_ATTEMPTS with X-Retry-After, even with the right password, until 15 minutes after the 10th failure", async () => {
    const op = operator();
    for (let i = 0; i < 10; i++) {
      expect((await signIn(op.email, "wrong")).status).toBe(401);
      at += 10_000;
    }
    // The 10th failure was 10 s ago: 15 minutes less 10 s are left.
    const failedAt = at - 10_000;
    const locked = await signIn(op.email, op.password);
    expect(locked.status).toBe(429);
    expect(await locked.json()).toEqual({
      code: "TOO_MANY_ATTEMPTS",
      message: "Too many attempts",
    });
    expect(Number(locked.headers.get("x-retry-after"))).toBe(15 * 60 - 10);

    // Wrong passwords are locked out too.
    expect((await signIn(op.email, "wrong")).status).toBe(429);

    // Another email is not.
    expect((await signIn("other@avel.test", "wrong")).status).toBe(401);

    // One second before 15 minutes after the 10th failure: still locked.
    at = failedAt + 15 * MIN - 1000;
    const still = await signIn(op.email, op.password);
    expect(still.status).toBe(429);
    expect(Number(still.headers.get("x-retry-after"))).toBe(1);

    // 15 minutes after the 10th failure: the right password gets in.
    at = failedAt + 15 * MIN;
    expect((await signIn(op.email, op.password)).status).toBe(200);
  });
});

describe("T-B11-03: get-session and sign-out", () => {
  it("with the cookie it is Better Auth's raw shape, expiresAt 12 hours after sign-in; without it, null; after sign-out, null and the cookie expired", async () => {
    const op = operator();
    const res = await signIn(op.email, op.password);
    const { token } = (await res.json()) as { token: string };
    const cookie = cookiePair(res);

    at += 5 * MIN;
    const got = await getSession(cookie);
    expect(got.status).toBe(200);
    const session = (await got.json()) as {
      session: Record<string, unknown>;
      user: Record<string, unknown>;
    };
    expect(session.user).toMatchObject({ id: op.id, email: op.email, name: "Operator" });
    expect(session.session).toMatchObject({ userId: op.id, token });
    expect(typeof session.session.id).toBe("string");
    expect("ipAddress" in session.session).toBe(true);
    expect(session.session.expiresAt).toBe(new Date(START + 12 * HOUR).toISOString());

    const none = await getSession();
    expect(none.status).toBe(200);
    expect(await none.json()).toBeNull();

    const unknown = await getSession(`${COOKIE}=not-a-token`);
    expect(await unknown.json()).toBeNull();

    const out = await post("/api/auth/sign-out", {}, cookie);
    expect(out.status).toBe(200);
    expect(await out.json()).toEqual({ success: true });
    const cleared = out.headers.get("set-cookie") ?? "";
    expect(cleared).toContain(`${COOKIE}=`);
    expect(cleared).toContain("Max-Age=0");

    const after = await getSession(cookie);
    expect(after.status).toBe(200);
    expect(await after.json()).toBeNull();
  });
});

describe("T-B11-04: what is not served, and the controls", () => {
  it("sign-up and any other /api/auth/* path is 404", async () => {
    const op = operator();
    expect(
      (await post("/api/auth/sign-up/email", { email: "new@avel.test", password: "x", name: "N" }))
        .status,
    ).toBe(404);
    expect((await post("/api/auth/forget-password", { email: op.email })).status).toBe(404);
    expect((await getSession().then(() => post("/api/auth/anything", {}))).status).toBe(404);
  });

  it("reset() keeps sessions and clears failures; resetAuth() drops sessions", async () => {
    const op = operator();
    const res = await signIn(op.email, op.password);
    const cookie = cookiePair(res);

    for (let i = 0; i < 10; i++) await signIn(op.email, "wrong");
    expect((await signIn(op.email, op.password)).status).toBe(429);

    mock.reset();
    expect(await (await getSession(cookie)).json()).not.toBeNull();
    expect((await signIn(op.email, op.password)).status).toBe(200);

    auth().resetAuth();
    expect(await (await getSession(cookie)).json()).toBeNull();
  });

  it("recorded() lists auth requests with route null and the password as [redacted]", async () => {
    const op = operator();
    await signIn(op.email, op.password);
    await signIn(op.email, "a-wrong-one");
    await getSession();

    const rows = auth().recorded();
    expect(rows.length).toBeGreaterThanOrEqual(3);
    const signIns = rows.filter((r) => r.path === "/api/auth/sign-in/email");
    expect(signIns).toHaveLength(2);
    for (const r of signIns) {
      expect(r.route).toBeNull();
      expect(r.method).toBe("POST");
      expect(r.body).toEqual({ email: op.email, password: "[redacted]" });
    }
    expect(JSON.stringify(rows)).not.toContain(op.password);
    expect(JSON.stringify(rows)).not.toContain("a-wrong-one");
    expect(rows.some((r) => r.path === "/api/auth/get-session" && r.method === "GET")).toBe(true);
  });
});
