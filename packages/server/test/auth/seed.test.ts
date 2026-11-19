/**
 * T-B9-07: the seed is idempotent: run twice, one operator and one internal client (CR-13). The
 * password is stored hashed, and the operator can sign in with it.
 */
import { describe, expect, it } from "vitest";
import { testDatabase } from "../db/support/database.ts";
import { authApp, newPassword, OPERATOR_EMAIL, seed, signIn, testClock } from "./support.ts";

const database = testDatabase("b9seed");

describe("T-B9-07 · the seed", () => {
  it("runs twice: one user, one credential account, one internal client; the password is hashed", async () => {
    const d = await database();
    const password = newPassword();
    await seed(d.url, password);
    await seed(d.url, password);

    const c = await d.client();
    const n = async (sql: string) => ((await c.query(sql)).rows[0] as { n: number }).n;
    expect(await n("select count(*)::int as n from users")).toBe(1);
    expect(await n("select count(*)::int as n from auth_accounts")).toBe(1);
    expect(await n("select count(*)::int as n from clients where kind = 'internal'")).toBe(1);
    expect(await n("select count(*)::int as n from clients")).toBe(1);

    const account = (await c.query("select provider_id, password from auth_accounts")).rows[0] as {
      provider_id: string;
      password: string;
    };
    expect(account.provider_id).toBe("credential");
    expect(account.password).toBeTruthy();
    expect(account.password).not.toContain(password);

    // A second run with a different password doesn't change the operator's: it still signs in with the first.
    await seed(d.url, newPassword()).catch(() => undefined);
    const clock = await testClock();
    const app = authApp({ databaseUrl: d.url, clock: clock.clock });
    expect((await signIn(app, OPERATOR_EMAIL, password)).status).toBe(200);
    expect(await n("select count(*)::int as n from users")).toBe(1);
    expect(await n("select count(*)::int as n from clients where kind = 'internal'")).toBe(1);
  });
});
