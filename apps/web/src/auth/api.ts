// login.md section 1: the only module that calls /api/auth/*. Better Auth's endpoints sit outside
// @avel/contract, so they're called with fetch. Every answer is rebuilt from the named fields: a raw
// body (with its token or ipAddress) is never returned. Sign-in's and sign-out's bodies aren't read.

/** Every call gives up after this long; the caller then sees a rejected fetch. */
const TIMEOUT_MS = 10_000;

export interface Session {
  session: { id: string; userId: string; expiresAt: string };
  user: { id: string; email: string; name: string };
}

export interface SignInResult {
  status: number;
  /** X-Retry-After in seconds, on a 429 that sends it; otherwise null. */
  retryAfterSeconds: number | null;
}

function field(from: unknown, name: string): string {
  const value = typeof from === "object" && from !== null ? Reflect.get(from, name) : undefined;
  if (typeof value !== "string") throw new Error(`get-session's ${name} isn't a string`);
  return value;
}

function toSession(body: unknown): Session | null {
  if (body === null) return null;
  const session = typeof body === "object" ? Reflect.get(body, "session") : undefined;
  const user = typeof body === "object" ? Reflect.get(body, "user") : undefined;
  return {
    session: {
      id: field(session, "id"),
      userId: field(session, "userId"),
      expiresAt: field(session, "expiresAt"),
    },
    user: { id: field(user, "id"), email: field(user, "email"), name: field(user, "name") },
  };
}

/**
 * GET /api/auth/get-session. On the server, `cookie` is the incoming request's header and `origin`
 * its origin; nothing else of the request is sent. Signed out is `null`. Any answer but a 200 with
 * a session or `null` throws, and the guard counts that as signed out (login.md section 2).
 */
export async function getSession(init: { cookie?: string; origin?: string } = {}) {
  const res = await fetch(`${init.origin ?? ""}/api/auth/get-session`, {
    headers: init.cookie ? { cookie: init.cookie } : {},
    // A redirect means something other than Better Auth answered: it's a failed read.
    redirect: "manual",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status !== 200) throw new Error(`get-session answered ${res.status}`);
  return toSession(await res.json());
}

function post(path: string, body: unknown) {
  return fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

/** POST /api/auth/sign-in/email. Read for its status, and X-Retry-After on a 429. */
export async function signIn(email: string, password: string): Promise<SignInResult> {
  const res = await post("/api/auth/sign-in/email", { email, password });
  const retry = res.status === 429 ? Number(res.headers.get("x-retry-after") ?? "") : Number.NaN;
  return {
    status: res.status,
    retryAfterSeconds: Number.isFinite(retry) && retry > 0 ? retry : null,
  };
}

/** POST /api/auth/sign-out. Read for its status only. */
export async function signOut(): Promise<{ status: number }> {
  const res = await post("/api/auth/sign-out", {});
  return { status: res.status };
}
