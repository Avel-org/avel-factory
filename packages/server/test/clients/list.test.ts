/** T-B14-05: route 8 pages clients and hides the internal client unless ?kind=internal; route 9 can't make one. */
import { ClientDto, Page } from "@avel/contract";
import { describe, expect, it } from "vitest";
import { testDatabase } from "../db/support/database.ts";
import {
  clientsApp,
  createClient,
  expectError,
  newKey,
  operatorCookie,
  send,
  sql,
} from "./support.ts";

const database = testDatabase("b14list");
const ClientPage = Page(ClientDto);

const list = async (app: ReturnType<typeof clientsApp>, cookie: string, query: string) => {
  const res = await send(app, "GET", `/api/clients${query}`, { cookie });
  expect(res.status).toBe(200);
  return ClientPage.parse(await res.json());
};

describe("T-B14-05 · route 8 and the internal client", () => {
  it("pages clients with a cursor, and leaves the internal client out by default", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url); // the seed makes the internal client
    const made = [];
    for (const name of ["One", "Two", "Three"])
      made.push(await createClient(app, cookie, { name }));

    const first = await list(app, cookie, "?limit=2");
    expect(first.items.length).toBe(2);
    expect(first.nextCursor).not.toBeNull();
    const second = await list(
      app,
      cookie,
      `?limit=2&cursor=${encodeURIComponent(first.nextCursor as string)}`,
    );
    expect(second.items.length).toBe(1);
    expect(second.nextCursor).toBeNull();

    const seen = [...first.items, ...second.items];
    expect(seen.map((c) => c.id).sort()).toEqual(made.map((c) => c.id).sort());
    expect(new Set(seen.map((c) => c.id)).size).toBe(3);
    expect(seen.every((c) => c.kind === "client")).toBe(true);
  });

  it("?kind=internal lists the internal client, and only it", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    await createClient(app, cookie, { name: "Ordinary" });
    const internal = await list(app, cookie, "?kind=internal");
    expect(internal.items.length).toBe(1);
    expect(internal.items[0]?.kind).toBe("internal");
    const one = await send(app, "GET", `/api/clients/${internal.items[0]?.id}`, { cookie });
    expect(one.status).toBe(200);
  });

  it("route 9 can't create an internal client: refused, no second internal row, no activity", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const internalBefore = await sql(d.url, "select id from clients where kind = 'internal'");
    expect(internalBefore.length).toBe(1);
    const activityBefore = (await sql(d.url, "select 1 from activity_log")).length;

    const res = await send(app, "POST", "/api/clients", {
      cookie,
      key: newKey(),
      body: { name: "Pretend internal", kind: "internal" },
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    await expectError(res, res.status, ((await res.clone().json()) as { code: string }).code);

    expect((await sql(d.url, "select id from clients where kind = 'internal'")).length).toBe(1);
    expect((await sql(d.url, "select 1 from clients where name = 'Pretend internal'")).length).toBe(
      0,
    );
    expect((await sql(d.url, "select 1 from activity_log")).length).toBe(activityBefore);
  });
});
