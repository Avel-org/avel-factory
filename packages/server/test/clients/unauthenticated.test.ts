/** T-B14-06: every route without a session is 401 UNAUTHORIZED with the contract's body. */
import { describe, expect, it } from "vitest";
import { testDatabase } from "../db/support/database.ts";
import {
  clientsApp,
  expectError,
  newKey,
  operatorCookie,
  send,
  sql,
  UNKNOWN_CLIENT,
} from "./support.ts";

const database = testDatabase("b14unauth");

describe("T-B14-06 · no session", () => {
  it("routes 8, 9, 10 and 11 are 401 with ErrorBody and requestId, and a bad cookie is the same", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    await operatorCookie(app, d.url); // the operator exists; these callers have no session
    const before = (await sql(d.url, "select 1 from clients")).length;

    for (const cookie of [undefined, "better-auth.session_token=not-a-session"]) {
      const calls = [
        send(app, "GET", "/api/clients", { cookie }),
        send(app, "POST", "/api/clients", {
          cookie,
          key: newKey(),
          body: { name: "X", kind: "client" },
        }),
        send(app, "GET", `/api/clients/${UNKNOWN_CLIENT}`, { cookie }),
        send(app, "PATCH", `/api/clients/${UNKNOWN_CLIENT}`, {
          cookie,
          key: newKey(),
          body: { rowVersion: 1, name: "X" },
        }),
      ];
      for (const res of await Promise.all(calls)) {
        const body = await expectError(res, 401, "UNAUTHORIZED");
        expect(body.message).toBe("Not signed in");
      }
    }
    expect((await sql(d.url, "select 1 from clients")).length).toBe(before);
  });
});
