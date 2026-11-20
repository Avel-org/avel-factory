/**
 * T-B19-04 (t-b16-rigg-02): a database failure inside GET /api/auth/get-session answers 500 with
 * the contract's body and the request's requestId, like sign-in, and no log line, stderr or
 * console output holds the query's params or the session token.
 */
import { afterAll, describe, expect, it, vi } from "vitest";
import { newPassword, seed } from "../auth/support.ts";
import { testDatabase } from "../db/support/database.ts";
import { envFor, OPERATOR_EMAIL, type Started, start } from "../server/support.ts";
import { login } from "./support.ts";

const database = testDatabase("b19session");
const running: Started[] = [];
afterAll(async () => {
  await Promise.all(running.map((s) => s.handle.close().catch(() => undefined)));
});

describe("T-B19-04 · a database failure in get-session", () => {
  it("answers the contract's 500 with the request's requestId, and prints no params or token", async () => {
    const d = await database();
    const password = newPassword();
    await seed(d.url, password);
    const lines: string[] = [];
    const printed: string[] = [];
    const take = (...args: unknown[]) =>
      printed.push(
        args.map((a) => (a instanceof Error ? `${a.message}\n${a.stack}` : String(a))).join(" "),
      );
    const spies = [
      vi.spyOn(console, "error").mockImplementation(take),
      vi.spyOn(console, "log").mockImplementation(take),
      vi.spyOn(console, "warn").mockImplementation(take),
      vi.spyOn(process.stderr, "write").mockImplementation((chunk: unknown) => {
        take(chunk);
        return true;
      }),
    ];
    const server = await start(envFor(d.url), { logLine: (line) => lines.push(line) });
    running.push(server);
    const cookie = await login(server, OPERATOR_EMAIL, password);
    const token = decodeURIComponent(cookie.split("=")[1] ?? "");
    expect(token.length).toBeGreaterThan(10);
    const rawToken = token.split(".")[0] ?? token;

    const c = await d.client();
    await c.query("alter table auth_sessions rename to auth_sessions_gone");
    let res: Response;
    try {
      res = await fetch(`${server.url}/api/auth/get-session`, {
        headers: {
          cookie,
          origin: "https://avel.test",
          "x-request-id": "0193a000-0000-7000-8000-000000000b19",
        },
      });
    } finally {
      await c.query("alter table auth_sessions_gone rename to auth_sessions");
      for (const spy of spies) spy.mockRestore();
    }

    expect(res.status).toBe(500);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong",
      requestId: res.headers.get("x-request-id"),
    });
    expect(res.headers.get("x-request-id")).toBe("0193a000-0000-7000-8000-000000000b19");
    expect(res.headers.get("x-contract-version")).toBeTruthy();
    expect(
      lines.some((l) => l.includes("0193a000-0000-7000-8000-000000000b19")),
      "no log line for the failure",
    ).toBe(true);

    const everything = [...lines, ...printed].join("\n");
    for (const [what, value] of [
      ["the session token", token],
      ["the unsigned token", rawToken],
      ["the password", password],
      ["params:", "params:"],
      ["Failed query", "Failed query"],
    ] as const) {
      expect(everything, `output contains ${what}`).not.toContain(value);
    }
    expect(printed.filter((p) => /select .* from|auth_sessions/i.test(p))).toEqual([]);
  });
});
