/** T-B4-01: withTransaction commits a program that succeeds: its rows are there afterwards. */
import { users } from "@avel/db";
import { Effect, Exit } from "effect";
import { describe, expect, it } from "vitest";
import { Db, Tx } from "../../src/platform/db/db.ts";
import { testDatabase } from "../db/support/database.ts";
import { runDb } from "./support/db.ts";

const database = testDatabase("b4commit");

describe("T-B4-01 · withTransaction commits a program that succeeds", () => {
  it("leaves its rows, and hands back the program's value", async () => {
    const { url, client } = await (async () => {
      const d = await database();
      return { url: d.url, client: await d.client() };
    })();

    const exit = await runDb(
      url,
      Effect.gen(function* () {
        const db = yield* Db;
        return yield* db.withTransaction(
          Effect.gen(function* () {
            const tx = yield* Tx;
            yield* Effect.promise(() =>
              tx.insert(users).values([
                { name: "One", email: "commit-1@avel.test" },
                { name: "Two", email: "commit-2@avel.test" },
              ]),
            );
            return "done";
          }),
        );
      }),
    );
    expect(Exit.isSuccess(exit) && exit.value).toBe("done");

    const rows = await client.query(
      "select email from users where email like 'commit-%@avel.test' order by email",
    );
    expect(rows.rows.map((r) => r.email)).toEqual(["commit-1@avel.test", "commit-2@avel.test"]);
  });

  it("is invisible to other connections until it commits, then visible", async () => {
    const d = await database();
    const client = await d.client();
    let seenInside = -1;
    await runDb(
      d.url,
      Effect.gen(function* () {
        const db = yield* Db;
        yield* db.withTransaction(
          Effect.gen(function* () {
            const tx = yield* Tx;
            yield* Effect.promise(() =>
              tx.insert(users).values({ name: "Vis", email: "commit-vis@avel.test" }),
            );
            const other = yield* Effect.promise(() =>
              client.query(
                "select count(*)::int as n from users where email = 'commit-vis@avel.test'",
              ),
            );
            seenInside = other.rows[0].n;
          }),
        );
      }),
    );
    expect(seenInside).toBe(0);
    const after = await client.query(
      "select count(*)::int as n from users where email = 'commit-vis@avel.test'",
    );
    expect(after.rows[0].n).toBe(1);
  });
});
