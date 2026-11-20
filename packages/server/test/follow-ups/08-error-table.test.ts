/**
 * T-B19-08 (t-b14-rigg-01): the clients routes' 401 without a session and 400 (a missing
 * Idempotency-Key, a malformed cursor) answer the same status and body as before, and now come
 * from errors.ts's table: it has a row for each code, and each tag's status is the contract's.
 */
import { errorMap, errorStatus } from "@avel/contract";
import { afterAll, describe, expect, it } from "vitest";
import { errorTable } from "../../src/platform/errors.ts";
import { newPassword, seed } from "../auth/support.ts";
import { testDatabase } from "../db/support/database.ts";
import { envFor, OPERATOR_EMAIL, type Started, start } from "../server/support.ts";
import { expectErrorBody, login } from "./support.ts";

const database = testDatabase("b19table");
const running: Started[] = [];
afterAll(async () => {
  await Promise.all(running.map((s) => s.handle.close().catch(() => undefined)));
});

const tagsFor = (code: string) =>
  Object.entries(errorTable)
    .filter(([, c]) => c === code)
    .map(([tag]) => tag);

describe("T-B19-08 · the 401 and the 400 come from the error table", () => {
  it("the table has a tag for UNAUTHORIZED and one for BAD_REQUEST, each with the contract's status", () => {
    for (const code of ["UNAUTHORIZED", "BAD_REQUEST"] as const) {
      const tags = tagsFor(code);
      expect(tags.length, `no tag in errorTable maps to ${code}`).toBeGreaterThan(0);
      expect(errorStatus[code]).toBe(errorMap[code].status);
    }
    expect(errorStatus.UNAUTHORIZED).toBe(401);
    expect(errorStatus.BAD_REQUEST).toBe(400);
    // Every tag in the table resolves to a status the contract knows.
    for (const code of Object.values(errorTable)) expect(errorStatus[code]).toBeGreaterThan(399);
  });

  it("the wire answers are unchanged: 401 without a session, 400 without a key or on a bad cursor", async () => {
    const d = await database();
    const password = newPassword();
    await seed(d.url, password);
    const server: Started = await start(envFor(d.url));
    running.push(server);
    const cookie = await login(server, OPERATOR_EMAIL, password);
    const headers = (extra: Record<string, string> = {}) => ({
      origin: "https://avel.test",
      "content-type": "application/json",
      ...extra,
    });

    // 401: no session, on a read and a write.
    for (const [method, path] of [
      ["GET", "/api/clients"],
      ["POST", "/api/clients"],
    ] as const) {
      const res = await fetch(`${server.url}${path}`, {
        method,
        headers: headers({ "idempotency-key": "key-b19-401" }),
        ...(method === "POST" ? { body: JSON.stringify({ name: "X", kind: "client" }) } : {}),
      });
      const body = await expectErrorBody(res, 401, "UNAUTHORIZED");
      expect(body.message).toBe(errorMap.UNAUTHORIZED.message);
      expect(Object.keys(body).sort()).toEqual(["code", "message", "requestId"]);
    }

    // 400: a write without Idempotency-Key.
    const noKey = await fetch(`${server.url}/api/clients`, {
      method: "POST",
      headers: headers({ cookie }),
      body: JSON.stringify({ name: "X", kind: "client" }),
    });
    const noKeyBody = await expectErrorBody(noKey, 400, "BAD_REQUEST");
    expect(noKeyBody.message).toBe(errorMap.BAD_REQUEST.message);
    expect(Object.keys(noKeyBody).sort()).toEqual(["code", "message", "requestId"]);

    // 400: a cursor that isn't a UUID.
    const badCursor = await fetch(`${server.url}/api/clients?cursor=not-a-uuid`, {
      headers: headers({ cookie }),
    });
    const cursorBody = await expectErrorBody(badCursor, 400, "BAD_REQUEST");
    expect(cursorBody.message).toBe(errorMap.BAD_REQUEST.message);
  });
});
