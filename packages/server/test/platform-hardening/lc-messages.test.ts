/**
 * T-B8-05: the Db layer refuses a server whose lc_messages isn't English, because the foreign
 * key split reads Postgres's English message (t-b3-rigg-02). Set per database, so the test
 * leaves the shared server alone; the setting applies to new connections.
 */
import { Cause, Effect, Exit } from "effect";
import { describe, expect, it } from "vitest";
import { Db } from "../../src/platform/db/db.ts";
import { testDatabase } from "../db/support/database.ts";
import { runDb } from "./support.ts";

const database = testDatabase("b8lc");

const build = (url: string) =>
  runDb(
    url,
    {},
    Effect.gen(function* () {
      yield* Db;
      return "built" as const;
    }),
  );

describe("T-B8-05 · lc_messages", () => {
  it("fails to build when lc_messages isn't C, POSIX or en*, and the failure names lc_messages", async () => {
    const d = await database();
    const admin = await d.client();

    await admin.query(`alter database "${d.name}" set lc_messages = 'de_DE.UTF-8'`);
    const refused = await build(d.url);
    expect(Exit.isFailure(refused)).toBe(true);
    if (Exit.isFailure(refused)) expect(Cause.pretty(refused.cause)).toContain("lc_messages");

    for (const accepted of ["C", "POSIX", "en_GB.UTF-8"]) {
      await admin.query(`alter database "${d.name}" set lc_messages = '${accepted}'`);
      const exit = await build(d.url);
      expect(Exit.isSuccess(exit), `lc_messages ${accepted} should build`).toBe(true);
    }
  });
});
