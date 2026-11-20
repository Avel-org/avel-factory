/** T-B14-07 (Step 1 test 13): each write leaves exactly one activity_log row; a refused write leaves none. */
import { describe, expect, it } from "vitest";
import { testDatabase } from "../db/support/database.ts";
import {
  activityFor,
  clientsApp,
  createClient,
  newKey,
  operatorCookie,
  operatorId,
  send,
  sql,
  UNKNOWN_CLIENT,
} from "./support.ts";

const database = testDatabase("b14activity");
const total = async (url: string) =>
  Number((await sql<{ n: string }>(url, "select count(*) n from activity_log"))[0]?.n);

describe("T-B14-07 · the activity log", () => {
  it("create and edit each leave one row naming the operator, the action and the client", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const operator = await operatorId(d.url);
    const base = await total(d.url);

    const created = await createClient(app, cookie, { name: "Logged" });
    const afterCreate = await activityFor(d.url, created.id);
    expect(afterCreate.length).toBe(1);
    expect(await total(d.url)).toBe(base + 1);
    expect(afterCreate[0]).toMatchObject({ actor_kind: "user", user_id: operator });
    expect(afterCreate[0]?.action.length).toBeGreaterThan(0);

    const edit = await send(app, "PATCH", `/api/clients/${created.id}`, {
      cookie,
      key: newKey(),
      body: { rowVersion: created.rowVersion, name: "Logged 2" },
    });
    expect(edit.status).toBe(200);
    const afterEdit = await activityFor(d.url, created.id);
    expect(afterEdit.length).toBe(2);
    expect(await total(d.url)).toBe(base + 2);
    expect(afterEdit[1]).toMatchObject({ actor_kind: "user", user_id: operator });
    expect(afterEdit[1]?.action).not.toBe(afterEdit[0]?.action);
  });

  it("a replayed write leaves no second row, and reads leave none", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const key = newKey();
    const body = { name: "Once", kind: "client" };
    const first = await send(app, "POST", "/api/clients", { cookie, key, body });
    const id = ((await first.json()) as { id: string }).id;
    const afterFirst = await total(d.url);
    await send(app, "POST", "/api/clients", { cookie, key, body });
    await send(app, "GET", `/api/clients/${id}`, { cookie });
    await send(app, "GET", "/api/clients", { cookie });
    expect(await total(d.url)).toBe(afterFirst);
    expect((await activityFor(d.url, id)).length).toBe(1);
  });

  it("a refused write (stale, unknown, invalid, unauthenticated) leaves no row", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const created = await createClient(app, cookie, { name: "Refusals" });
    const base = await total(d.url);

    const stale = await send(app, "PATCH", `/api/clients/${created.id}`, {
      cookie,
      key: newKey(),
      body: { rowVersion: 99, name: "Nope" },
    });
    const unknown = await send(app, "PATCH", `/api/clients/${UNKNOWN_CLIENT}`, {
      cookie,
      key: newKey(),
      body: { rowVersion: 1, name: "Nope" },
    });
    const invalid = await send(app, "POST", "/api/clients", {
      cookie,
      key: newKey(),
      body: { name: "   ", kind: "client" },
    });
    const anonymous = await send(app, "POST", "/api/clients", {
      key: newKey(),
      body: { name: "Anon", kind: "client" },
    });
    expect([stale.status, unknown.status, invalid.status, anonymous.status]).toEqual([
      409, 404, 400, 401,
    ]);
    expect(await total(d.url)).toBe(base);
    expect((await sql(d.url, "select 1 from clients where name in ('Nope','Anon')")).length).toBe(
      0,
    );
  });
});
