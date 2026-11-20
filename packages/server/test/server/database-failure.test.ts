/**
 * T-B16-04: a database failure inside sign-in (auth_sessions renamed) answers the contract's 500
 * with the request's requestId, and neither stderr, console.error nor any log line carries the
 * query's params, a session token, the email or the password (t-b9-rigg-03, t-b9-axis-06).
 */
import { afterAll, describe, expect, it, vi } from "vitest";
import { newPassword, seed } from "../auth/support.ts";
import { testDatabase } from "../db/support/database.ts";
import { envFor, OPERATOR_EMAIL, type Started, signIn, start } from "./support.ts";

const database = testDatabase("b16dbfail");
const running: Started[] = [];
afterAll(async () => {
  await Promise.all(running.map((s) => s.handle.close().catch(() => undefined)));
});

describe("T-B16-04 · a database failure in sign-in", () => {
  it("answers 500 with the contract's body and requestId, and prints no query params", async () => {
    const d = await database();
    const password = newPassword();
    await seed(d.url, password);
    const lines: string[] = [];
    const printed: string[] = [];
    const record = (chunk: unknown) => {
      printed.push(typeof chunk === "string" ? chunk : String(chunk));
    };
    const consoleError = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      printed.push(
        args.map((a) => (a instanceof Error ? `${a.message}\n${a.stack}` : String(a))).join(" "),
      );
    });
    const consoleLog = vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      printed.push(args.map(String).join(" "));
    });
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation((chunk: unknown) => {
      record(chunk);
      return true;
    });
    const server = await start(envFor(d.url), { logLine: (line) => lines.push(line) });
    running.push(server);
    const c = await d.client();
    await c.query("alter table auth_sessions rename to auth_sessions_gone");
    try {
      const res = await signIn(server, OPERATOR_EMAIL, password, { "x-request-id": "req-b16-04" });
      expect(res.status).toBe(500);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body).toEqual({
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
        requestId: res.headers.get("x-request-id"),
      });
      expect(typeof body.requestId).toBe("string");
      expect((body.requestId as string).length).toBeGreaterThan(0);
      expect(res.headers.get("x-contract-version")).toBeTruthy();
      // The failure is logged, value-free: a line exists for it.
      expect(lines.some((l) => l.includes(body.requestId as string))).toBe(true);
    } finally {
      await c.query("alter table auth_sessions_gone rename to auth_sessions");
      consoleError.mockRestore();
      consoleLog.mockRestore();
      stderr.mockRestore();
    }

    const everything = [...lines, ...printed].join("\n");
    for (const value of [password, OPERATOR_EMAIL, "params:", "Failed query"]) {
      expect(
        everything,
        `output contains ${value === password ? "the password" : value}`,
      ).not.toContain(value);
    }
    expect(printed.filter((p) => /insert into|auth_sessions/i.test(p))).toEqual([]);
  });
});
