/**
 * T-B16-06: close() leaves no open Better Auth database client: pg_stat_activity shows none from
 * its pool afterwards (t-b9-rigg-02).
 */
import { describe, expect, it, vi } from "vitest";
import { newPassword, seed } from "../auth/support.ts";
import { testDatabase } from "../db/support/database.ts";
import { envFor, OPERATOR_EMAIL, signIn, start } from "./support.ts";

const database = testDatabase("b16close");

describe("T-B16-06 · close() releases Better Auth's pool", () => {
  it("after close(), no connection from the server's pool is left on the database", async () => {
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
    // The test's own other clients (none here besides the watcher) are the baseline.
    const before = await others();

    const server = await start(envFor(d.url));
    expect((await signIn(server, OPERATOR_EMAIL, password)).status).toBe(200);
    expect(await others(), "sign-in opened a pooled connection").toBeGreaterThan(before);

    await server.handle.close();
    await vi.waitFor(async () => expect(await others()).toBe(before), { timeout: 10_000 });

    // And the port is released: nothing answers.
    await expect(fetch(`${server.url}/api/health`)).rejects.toThrow();
  });
});
