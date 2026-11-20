/** T-B14-04 (Step 1 test 6): route 11 edits a client; stale rowVersion is 409; a CHECK refusal is 422; the write replays. */
import { ClientDto } from "@avel/contract";
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

const database = testDatabase("b14update");

describe("T-B14-04 · route 11", () => {
  it("edits a client and bumps rowVersion; archive and restore keep archivedAt in step with status", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const created = await createClient(app, cookie, { name: "Before" });

    const res = await send(app, "PATCH", `/api/clients/${created.id}`, {
      cookie,
      key: newKey(),
      body: { rowVersion: created.rowVersion, name: "After", proofConsent: true },
    });
    expect(res.status).toBe(200);
    const edited = ClientDto.parse(await res.json());
    expect(edited.id).toBe(created.id);
    expect(edited.name).toBe("After");
    expect(edited.rowVersion).toBe(created.rowVersion + 1);
    expect(edited.proofConsentAt).not.toBeNull();
    expect(edited.kind).toBe("client");

    const archived = ClientDto.parse(
      await (
        await send(app, "PATCH", `/api/clients/${created.id}`, {
          cookie,
          key: newKey(),
          body: { rowVersion: edited.rowVersion, status: "archived" },
        })
      ).json(),
    );
    expect(archived.status).toBe("archived");
    expect(archived.archivedAt).not.toBeNull();

    const restored = ClientDto.parse(
      await (
        await send(app, "PATCH", `/api/clients/${created.id}`, {
          cookie,
          key: newKey(),
          body: { rowVersion: archived.rowVersion, status: "active" },
        })
      ).json(),
    );
    expect(restored.status).toBe("active");
    expect(restored.archivedAt).toBeNull();
    expect(restored.rowVersion).toBe(archived.rowVersion + 1);
  });

  it("a stale rowVersion is 409 STALE_VERSION naming the current version, and changes nothing", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const created = await createClient(app, cookie, { name: "Stale" });
    const ok = await send(app, "PATCH", `/api/clients/${created.id}`, {
      cookie,
      key: newKey(),
      body: { rowVersion: 1, name: "Stale 2" },
    });
    expect(ok.status).toBe(200);

    const stale = await send(app, "PATCH", `/api/clients/${created.id}`, {
      cookie,
      key: newKey(),
      body: { rowVersion: 1, name: "Stale 3" },
    });
    const body = await expectError(stale, 409, "STALE_VERSION");
    expect(body.details).toMatchObject({ field: "rowVersion", currentVersion: 2 });
    const rows = await sql<{ name: string; row_version: number }>(
      d.url,
      "select name, row_version from clients where id = $1",
      [created.id],
    );
    expect(rows[0]).toEqual({ name: "Stale 2", row_version: 2 });
  });

  it("the same key and body replay the first answer: one edit, one version bump", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const created = await createClient(app, cookie, { name: "Replay edit" });
    const key = newKey();
    const body = { rowVersion: 1, name: "Replay edited" };
    const first = await send(app, "PATCH", `/api/clients/${created.id}`, { cookie, key, body });
    expect(first.status).toBe(200);
    const firstJson = await first.json();
    const again = await send(app, "PATCH", `/api/clients/${created.id}`, { cookie, key, body });
    expect(again.status).toBe(200);
    expect(await again.json()).toEqual(firstJson);
    const rows = await sql<{ row_version: number }>(
      d.url,
      "select row_version from clients where id = $1",
      [created.id],
    );
    expect(rows[0]?.row_version).toBe(2);

    const reused = await send(app, "PATCH", `/api/clients/${created.id}`, {
      cookie,
      key,
      body: { rowVersion: 1, name: "Something else" },
    });
    await expectError(reused, 409, "IDEMPOTENCY_KEY_REUSED");
  });

  it("a value the database's CHECK refuses is 422 CONSTRAINT_VIOLATION naming the constraint, and writes no activity", async () => {
    const d = await database();
    const app = clientsApp(d.url);
    const cookie = await operatorCookie(app, d.url);
    const created = await createClient(app, cookie, { name: "Check me" });
    // No contract-valid edit breaks a shipped CHECK, so this database gets one more rule. The
    // route must let the database refuse it and map the refusal (AGENTS.md: the database enforces).
    await sql(
      d.url,
      "alter table clients add constraint clients_test_name_ck check (name <> 'Refused by the database')",
    );
    const before = (await sql(d.url, "select 1 from activity_log")).length;

    const res = await send(app, "PATCH", `/api/clients/${created.id}`, {
      cookie,
      key: newKey(),
      body: { rowVersion: created.rowVersion, name: "Refused by the database" },
    });
    const body = await expectError(res, 422, "CONSTRAINT_VIOLATION");
    expect(body.details).toMatchObject({ constraint: "clients_test_name_ck" });
    const rows = await sql<{ name: string; row_version: number }>(
      d.url,
      "select name, row_version from clients where id = $1",
      [created.id],
    );
    expect(rows[0]).toEqual({ name: "Check me", row_version: 1 });
    expect((await sql(d.url, "select 1 from activity_log")).length).toBe(before);
  });
});
