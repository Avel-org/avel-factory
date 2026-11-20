/** T-B14-02 (Step 1 test 4): route 9 is idempotent: replay, reuse, and a duplicate while the first runs. */
import { randomUUID } from "node:crypto";
import { ClientDto } from "@avel/contract";
import pg from "pg";
import { describe, expect, it, vi } from "vitest";
import { testDatabase } from "../db/support/database.ts";
import { clientsApp, expectError, newKey, operatorCookie, send, sql } from "./support.ts";

const database = testDatabase("b14replay");

const count = async (url: string, name: string) =>
  Number(
    (await sql<{ n: string }>(url, "select count(*) n from clients where name = $1", [name]))[0]?.n,
  );

describe("T-B14-02 · route 9 replays", () => {
  it("the same key and body return the first response and make one client; another body is IDEMPOTENCY_KEY_REUSED", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const name = `Replay ${randomUUID()}`;
    const key = newKey();
    const body = { name, kind: "client" };

    const first = await send(app, "POST", "/api/clients", { cookie, key, body });
    expect(first.status).toBe(201);
    const firstJson = await first.json();

    const again = await send(app, "POST", "/api/clients", { cookie, key, body });
    expect(again.status).toBe(first.status);
    expect(await again.json()).toEqual(firstJson);
    expect(await count(d.url, name)).toBe(1);

    const other = await send(app, "POST", "/api/clients", {
      cookie,
      key,
      body: { name: `${name} other`, kind: "client" },
    });
    await expectError(other, 409, "IDEMPOTENCY_KEY_REUSED");
    expect(await count(d.url, `${name} other`)).toBe(0);
    expect(await count(d.url, name)).toBe(1);
  });

  it("a duplicate sent while the first still runs is IDEMPOTENCY_IN_PROGRESS, and the first still makes one client", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const name = `Running ${randomUUID()}`;
    const key = newKey();
    const body = { name, kind: "client" };

    // Hold the clients table so the first request stops at its insert, after it claimed the key.
    const holder = new pg.Client({ connectionString: d.url });
    await holder.connect();
    await holder.query("begin");
    await holder.query("lock table clients in access exclusive mode");
    let released = false;
    try {
      const firstP = send(app, "POST", "/api/clients", { cookie, key, body });
      await vi.waitFor(async () => {
        const rows = await sql(d.url, "select 1 from idempotency_keys where key = $1", [key]);
        expect(rows.length).toBe(1);
      });

      const dup = await send(app, "POST", "/api/clients", { cookie, key, body });
      await expectError(dup, 409, "IDEMPOTENCY_IN_PROGRESS");

      await holder.query("rollback");
      released = true;
      const first = await firstP;
      expect(first.status).toBe(201);
      ClientDto.parse(await first.json());
    } finally {
      if (!released) await holder.query("rollback").catch(() => undefined);
      await holder.end();
    }
    expect(await count(d.url, name)).toBe(1);

    // Finished now, the same request replays instead.
    const replay = await send(app, "POST", "/api/clients", { cookie, key, body });
    expect(replay.status).toBe(201);
  });
});
