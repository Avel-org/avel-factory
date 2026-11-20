/**
 * T-B19-06 (t-b14-rigg-02): a client write that dies with a defect after taking its
 * Idempotency-Key can be retried with the same key and body and runs again (no 409
 * IDEMPOTENCY_IN_PROGRESS); a replay of a completed write still returns the first response.
 * The defect is a trigger raising an error Postgres code the Db service doesn't map.
 */
import { randomUUID } from "node:crypto";
import { ClientDto } from "@avel/contract";
import { afterAll, describe, expect, it } from "vitest";
import { newPassword, seed } from "../auth/support.ts";
import { testDatabase } from "../db/support/database.ts";
import { envFor, OPERATOR_EMAIL, type Started, start } from "../server/support.ts";
import { expectErrorBody, login, sql } from "./support.ts";

const database = testDatabase("b19defect");
const running: Started[] = [];
afterAll(async () => {
  await Promise.all(running.map((s) => s.handle.close().catch(() => undefined)));
});

const write = (server: Started, cookie: string, key: string, body: unknown) =>
  fetch(`${server.url}/api/clients`, {
    method: "POST",
    headers: {
      cookie,
      origin: "https://avel.test",
      "content-type": "application/json",
      "idempotency-key": key,
    },
    body: JSON.stringify(body),
  });

const count = async (url: string, name: string) =>
  Number(
    (await sql<{ n: string }>(url, "select count(*) n from clients where name = $1", [name]))[0]?.n,
  );

describe("T-B19-06 · a defect doesn't hold its key", () => {
  it("a retry with the same key and body runs after a defect; a completed write replays", async () => {
    const d = await database();
    const password = newPassword();
    await seed(d.url, password);
    const server = await start(envFor(d.url));
    running.push(server);
    const cookie = await login(server, OPERATOR_EMAIL, password);
    const name = `Defect ${randomUUID()}`;
    const key = `key-${randomUUID()}`;
    const body = { name, kind: "client" };

    await sql(
      d.url,
      `create function b19_boom() returns trigger language plpgsql as $$
         begin raise exception 'boom' using errcode = 'XX000'; end $$;
       create trigger b19_boom before insert on clients for each row execute function b19_boom();`,
    );
    const failed = await write(server, cookie, key, body);
    await expectErrorBody(failed, 500, "INTERNAL_SERVER_ERROR");
    expect(await count(d.url, name)).toBe(0);

    await sql(d.url, "drop trigger b19_boom on clients; drop function b19_boom()");
    const retry = await write(server, cookie, key, body);
    expect(retry.status, "the key is still held by the write that died").toBe(201);
    const first = ClientDto.parse(await retry.json());
    expect(first.name).toBe(name);
    expect(await count(d.url, name)).toBe(1);

    // The completed write still replays the first response, and makes no second client.
    const replay = await write(server, cookie, key, body);
    expect(replay.status).toBe(201);
    expect(ClientDto.parse(await replay.json())).toEqual(first);
    expect(await count(d.url, name)).toBe(1);

    // Reuse rules don't change: the same key with another body is still refused.
    const other = await write(server, cookie, key, { name: `${name} other`, kind: "client" });
    await expectErrorBody(other, 409, "IDEMPOTENCY_KEY_REUSED");
  });
});
