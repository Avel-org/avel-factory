/**
 * T-B19-07 (t-b14-rigg-03): route 9 with kind internal is 422 with the contract's body, in code,
 * on a database where the seed's internal client doesn't exist, and on one where it does.
 * (The contract's catalog has more than one 422 code; the test pins the status and the body.)
 */
import { afterAll, describe, expect, it } from "vitest";
import { newPassword, seed } from "../auth/support.ts";
import { testDatabase } from "../db/support/database.ts";
import { envFor, OPERATOR_EMAIL, type Started, start } from "../server/support.ts";
import { expectErrorBody, login, sql } from "./support.ts";

const database = testDatabase("b19internal");
const running: Started[] = [];
afterAll(async () => {
  await Promise.all(running.map((s) => s.handle.close().catch(() => undefined)));
});

const create = (server: Started, cookie: string, key: string, body: unknown) =>
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

const internals = async (url: string) =>
  Number(
    (await sql<{ n: string }>(url, "select count(*) n from clients where kind = 'internal'"))[0]?.n,
  );

describe("T-B19-07 · route 9 refuses kind internal", () => {
  it("is 422 whether or not the seed's internal client exists, and makes no client", async () => {
    const d = await database();
    const password = newPassword();
    await seed(d.url, password);
    const server = await start(envFor(d.url));
    running.push(server);
    const cookie = await login(server, OPERATOR_EMAIL, password);

    // With the seed's row there: not a 409 from the unique index, a 422 from the code.
    expect(await internals(d.url)).toBe(1);
    const withSeed = await create(server, cookie, "key-b19-internal-1", {
      name: "Second",
      kind: "internal",
    });
    await expectErrorBody(withSeed, 422);
    expect(await internals(d.url)).toBe(1);

    // Without it: still refused, and none is made.
    await sql(d.url, "delete from clients where kind = 'internal'");
    expect(await internals(d.url)).toBe(0);
    const without = await create(server, cookie, "key-b19-internal-2", {
      name: "First",
      kind: "internal",
    });
    await expectErrorBody(without, 422);
    expect(await internals(d.url)).toBe(0);

    // A client of kind client is still made.
    const fine = await create(server, cookie, "key-b19-internal-3", {
      name: "Fine",
      kind: "client",
    });
    expect(fine.status).toBe(201);
  });
});
