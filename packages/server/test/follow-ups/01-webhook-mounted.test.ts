/**
 * T-B19-01 (t-b15-rigg-03): startServer mounts POST /api/webhooks/github from Config: a signed
 * delivery reaches it and adds its factory_versions row; startServer without GITHUB_WEBHOOK_SECRET,
 * or with an empty one, fails to start, naming the variable and never a value.
 */
import { describe, expect, it } from "vitest";
import { testDatabase } from "../db/support/database.ts";
import { mergePayload, newDelivery, operator, versions } from "../factory-repo/support.ts";
import { loadStartServer } from "../server/support.ts";
import { deliverOverHttp, serverEnv, withServer } from "./support.ts";

const database = testDatabase("b19mount");

describe("T-B19-01 · the webhook in the running server", () => {
  it("a signed delivery to the running server adds its factory_versions row", async () => {
    const d = await database();
    const userId = await operator(d.url);
    await withServer(serverEnv(d.url), undefined, async (server) => {
      const sha = "a".repeat(40);
      const res = await deliverOverHttp(server, mergePayload({ sha, number: 31 }), {
        delivery: newDelivery(),
      });
      expect(res.status, "the webhook isn't mounted in startServer").toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(300);
      expect(res.headers.get("x-request-id")).toBeTruthy();
      const found = await versions(d.url);
      expect(found).toHaveLength(1);
      expect(found[0]).toMatchObject({
        sha,
        merged_by_app: true,
        approved_by: userId,
        pr_number: 31,
      });

      // A wrong signature is refused by the mounted webhook.
      const bad = await deliverOverHttp(server, mergePayload({ sha }), { secret: "not-it" });
      expect(bad.status).toBe(401);
    });
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
  ])(
    "a %s GITHUB_WEBHOOK_SECRET stops startup, naming the variable and no value",
    async (_name, secret) => {
      const d = await database();
      const startServer = await loadStartServer();
      const env = serverEnv(d.url, { GITHUB_WEBHOOK_SECRET: secret });
      let started: { close(): Promise<void> } | undefined;
      let failure: unknown;
      try {
        started = await startServer(env);
      } catch (error) {
        failure = error;
      } finally {
        await started?.close().catch(() => undefined);
      }
      expect(started, "the server started without a webhook secret").toBeUndefined();
      const message = failure instanceof Error ? failure.message : String(failure);
      expect(message).toContain("GITHUB_WEBHOOK_SECRET");
      for (const value of [env.AVEL_AUTH_SECRET, d.url]) {
        expect(message, "the message holds a setting's value").not.toContain(value);
      }
    },
  );
});
