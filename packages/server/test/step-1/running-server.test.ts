/**
 * T-B20-G01 (guard, CR-42): the real server, started with startServer on a free port, signs the
 * operator in, creates a client with an Idempotency-Key and leaves one activity row, accepts a
 * signed factory merge on the webhook, and answers an unknown route with the contract's error body
 * and X-Contract-Version. Real HTTP, real Postgres; no time passes, so no TestClock is needed.
 */
import { randomUUID } from "node:crypto";
import { ClientDto, CONTRACT_VERSION } from "@avel/contract";
import { describe, expect, it } from "vitest";
import { newPassword, seed } from "../auth/support.ts";
import { testDatabase } from "../db/support/database.ts";
import { mergePayload, newDelivery, versions } from "../factory-repo/support.ts";
import {
  deliverOverHttp,
  expectErrorBody,
  serverEnv,
  sql,
  withServer,
} from "../follow-ups/support.ts";
import { cookiePair, OPERATOR_EMAIL, ORIGIN, signIn } from "../server/support.ts";

const database = testDatabase("b20running");

describe("T-B20-G01 · the running server, end to end", () => {
  it("signs in, creates a client once with one activity row, takes a signed merge, and answers an unknown route", async () => {
    const d = await database();
    const password = newPassword();
    await seed(d.url, password);

    await withServer(serverEnv(d.url), undefined, async (server) => {
      // Sign-in.
      const signedIn = await signIn(server, OPERATOR_EMAIL, password);
      expect(signedIn.status).toBe(200);
      const cookie = cookiePair(signedIn);
      expect(cookie, "sign-in gave no session cookie").toBeDefined();

      // A client, written with an Idempotency-Key.
      const key = `key-${randomUUID()}`;
      const write = () =>
        fetch(`${server.url}/api/clients`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: ORIGIN,
            cookie: cookie as string,
            "idempotency-key": key,
          },
          body: JSON.stringify({ name: "End to end", kind: "client" }),
        });
      const created = await write();
      expect(created.status).toBe(201);
      expect(created.headers.get("x-contract-version")).toBe(CONTRACT_VERSION);
      const client = ClientDto.parse(await created.json());
      expect(client.name).toBe("End to end");

      const replay = await write();
      expect(replay.status).toBe(201);
      expect(ClientDto.parse(await replay.json()).id).toBe(client.id);

      const activity = await sql(
        d.url,
        "select actor_kind, action from activity_log where target like '%' || $1 || '%'",
        [client.id],
      );
      expect(activity).toHaveLength(1);
      expect(activity[0]).toMatchObject({ actor_kind: "user" });

      // A signed merge by the factory's App on the webhook.
      const sha = "b".repeat(40);
      const merged = await deliverOverHttp(server, mergePayload({ sha, number: 20 }), {
        delivery: newDelivery(),
      });
      expect(merged.status).toBeGreaterThanOrEqual(200);
      expect(merged.status).toBeLessThan(300);
      expect((await versions(d.url)).map((v) => v.sha)).toEqual([sha]);

      // An unknown route.
      const unknown = await fetch(`${server.url}/api/no-such-route`, {
        headers: { origin: ORIGIN },
      });
      await expectErrorBody(unknown, 404);
      expect(unknown.headers.get("x-contract-version")).toBe(CONTRACT_VERSION);
    });
  });
});
