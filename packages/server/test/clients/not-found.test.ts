/** T-B14-03 (Step 1 test 3): routes 10 and 11 answer an unknown client with the contract's 404 and the request's id. */
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

const database = testDatabase("b14notfound");
const REQUEST_ID = "0193a000-0000-7000-8000-0000000b1403";

describe("T-B14-03 · an unknown client", () => {
  it("route 10 is 404 NOT_FOUND with the request's requestId", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const res = await send(app, "GET", `/api/clients/${UNKNOWN_CLIENT}`, {
      cookie,
      requestId: REQUEST_ID,
    });
    const body = await expectError(res, 404, "NOT_FOUND");
    expect(body.requestId).toBe(REQUEST_ID);
  });

  it("route 11 is 404 NOT_FOUND with the request's requestId, and writes nothing", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const before = await sql(d.url, "select 1 from activity_log");
    const res = await send(app, "PATCH", `/api/clients/${UNKNOWN_CLIENT}`, {
      cookie,
      key: newKey(),
      requestId: REQUEST_ID,
      body: { rowVersion: 1, name: "Nobody" },
    });
    const body = await expectError(res, 404, "NOT_FOUND");
    expect(body.requestId).toBe(REQUEST_ID);
    expect((await sql(d.url, "select 1 from activity_log")).length).toBe(before.length);
  });
});
