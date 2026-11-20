import { CONTRACT_VERSION } from "@avel/contract";
import { createMock, fixtures } from "@avel/contract-mock";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// login.md section 1: apps/web/src/auth/api.ts is the only module that calls /api/auth/* (T-F12 builds it).
//   getSession(init?: { cookie?: string; origin?: string }) -> { session, user } | null
//   signIn(email, password)  -> { status: number; retryAfterSeconds: number | null }
//   signOut()                -> { status: number }
import { getSession, signIn, signOut } from "@/auth/api";

const FIXED = new Date("2026-11-20T10:00:00Z");
const ORIGIN = "http://localhost";

let seen: Request[];

/** Sends `fetch` to an in-process mock, so api.ts runs against the mock's raw Better Auth shapes. */
function serve(now: () => Date = () => FIXED) {
  const mock = createMock({ contractVersion: CONTRACT_VERSION, world: true, now });
  seen = [];
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(new URL(String(input), ORIGIN), init);
    seen.push(request.clone());
    return mock.fetch(request);
  });
  return mock;
}

const { email, password } = fixtures.operator;

beforeEach(() => {
  seen = [];
});
afterEach(() => {
  vi.unstubAllGlobals();
});

async function cookieFromSignIn(): Promise<string> {
  const res = await fetch("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return (res.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
}

describe("T-F12-02: api.ts reads get-session for section 1's fields only", () => {
  it("returns { session: { id, userId, expiresAt }, user: { id, email, name } } and no token or ipAddress", async () => {
    serve();
    const cookie = await cookieFromSignIn();
    const token = cookie.split("=")[1] ?? "";
    expect(token.length, "the mock set a session cookie").toBeGreaterThan(10);

    const result = await getSession({ cookie, origin: ORIGIN });

    expect(result).toEqual({
      session: {
        id: expect.any(String),
        userId: fixtures.operator.id,
        expiresAt: "2026-11-20T22:00:00.000Z",
      },
      user: { id: fixtures.operator.id, email, name: fixtures.operator.name },
    });
    expect(Object.keys(result?.session ?? {}).sort()).toEqual(["expiresAt", "id", "userId"]);
    expect(JSON.stringify(result)).not.toContain(token);
    expect(JSON.stringify(result)).not.toMatch(/token|ipAddress/i);
  });

  it("forwards the request's cookie header to GET /api/auth/get-session, and nothing else of the request", async () => {
    serve();
    const cookie = await cookieFromSignIn();
    seen = [];
    await getSession({ cookie, origin: ORIGIN });
    expect(seen).toHaveLength(1);
    const [request] = seen;
    expect(request?.method).toBe("GET");
    expect(new URL(request?.url ?? "").pathname).toBe("/api/auth/get-session");
    expect(request?.headers.get("cookie")).toBe(cookie);
    expect(request?.headers.get("authorization")).toBeNull();
  });

  it("returns null when signed out", async () => {
    serve();
    expect(await getSession({ origin: ORIGIN })).toBeNull();
    expect(
      await getSession({ cookie: "better-auth.session_token=nope", origin: ORIGIN }),
    ).toBeNull();
  });

  it("counts a 500 and a rejected fetch as signed out (it returns null or throws, never a session)", async () => {
    vi.stubGlobal("fetch", async () => new Response("boom", { status: 500 }));
    expect(await getSession({ origin: ORIGIN }).catch(() => null)).toBeNull();
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("network down");
    });
    expect(await getSession({ origin: ORIGIN }).catch(() => null)).toBeNull();
  });
});

describe("T-F12-02: api.ts reads sign-in and sign-out for their status only", () => {
  it("sign-in 200 gives the status and nothing from the body (no token, no user)", async () => {
    serve();
    const result = await signIn(email, password);
    expect(result).toEqual({ status: 200, retryAfterSeconds: null });
    expect(JSON.stringify(result)).not.toMatch(/token|user|operator@/i);
  });

  it("sign-in posts JSON { email, password } to /api/auth/sign-in/email", async () => {
    serve();
    await signIn(email, password);
    const [request] = seen;
    expect(request?.method).toBe("POST");
    expect(new URL(request?.url ?? "").pathname).toBe("/api/auth/sign-in/email");
    expect(await request?.json()).toEqual({ email, password });
  });

  it("sign-in 401 gives status 401", async () => {
    serve();
    expect(await signIn(email, "wrong")).toEqual({ status: 401, retryAfterSeconds: null });
  });

  it("sign-in 429 gives the status and X-Retry-After as seconds (15 minutes at the mock's 10th failure)", async () => {
    serve();
    for (let i = 0; i < 10; i++) await signIn(email, "wrong");
    expect(await signIn(email, password)).toEqual({ status: 429, retryAfterSeconds: 900 });
  });

  it("sign-in 500 gives status 500, and a rejected fetch rejects", async () => {
    vi.stubGlobal("fetch", async () => new Response("boom", { status: 500 }));
    expect((await signIn(email, password)).status).toBe(500);
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("network down");
    });
    await expect(signIn(email, password)).rejects.toBeInstanceOf(Error);
  });

  it("sign-out gives the status and nothing from the body", async () => {
    serve();
    const result = await signOut();
    expect(result).toEqual({ status: 200 });
    const [request] = seen;
    expect(request?.method).toBe("POST");
    expect(new URL(request?.url ?? "").pathname).toBe("/api/auth/sign-out");
    expect(await request?.json()).toEqual({});
  });
});
