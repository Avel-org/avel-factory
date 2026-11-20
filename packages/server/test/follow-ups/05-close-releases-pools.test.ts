/**
 * T-B19-05 (t-b16-rigg-03): after a clients request (and a webhook delivery), close() leaves no
 * open database client from the server's pools in pg_stat_activity, and returns within 2 s: the
 * router's and the webhook's pools join startServer's scope.
 */
import { describe, expect, it, vi } from "vitest";
import { newPassword, seed } from "../auth/support.ts";
import { testDatabase } from "../db/support/database.ts";
import { OPERATOR_EMAIL, start } from "../server/support.ts";
import { deliverOverHttp, login, serverEnv } from "./support.ts";

const database = testDatabase("b19close");

describe("T-B19-05 · close() releases every pool at once", () => {
  it("no server connection is left after a clients request, and close() returns within 2 s", async () => {
    const d = await database();
    const password = newPassword();
    await seed(d.url, password);
    const watcher = await d.client();
    const others = async () =>
      Number(
        (
          await watcher.query(
            "select count(*)::int as n from pg_stat_activity where datname = current_database() and pid <> pg_backend_pid()",
          )
        ).rows[0].n,
      );
    const before = await others();

    const server = await start(serverEnv(d.url));
    const cookie = await login(server, OPERATOR_EMAIL, password);
    const list = await fetch(`${server.url}/api/clients`, {
      headers: { cookie, origin: "https://avel.test" },
    });
    expect(list.status).toBe(200);
    // A delivery too, so the webhook's pool is open when it matters (ignored if not mounted).
    await deliverOverHttp(server, { zen: "hi" }, { event: "ping" });
    expect(await others(), "the requests opened pooled connections").toBeGreaterThan(before);

    const started = performance.now();
    await server.handle.close();
    const tookMs = performance.now() - started;
    expect(tookMs, "close() took longer than 2 s").toBeLessThan(2_000);

    // Right after close(): not after Postgres's or the pool's idle timeout.
    await vi.waitFor(async () => expect(await others()).toBe(before), {
      timeout: 1_000,
      interval: 50,
    });
  });
});
