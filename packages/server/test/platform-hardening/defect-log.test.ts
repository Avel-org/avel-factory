/**
 * T-B8-01: a defect thrown by a Drizzle query is logged with the request ID and the pg error's
 * code, and the log holds no bound value; the response is a 500 with no database text.
 * (body.message equal to errorMap's text moved to T-B9, which owns effect-handler.ts.)
 *
 * The query breaks a NOT NULL (23502), which isn't one of T-B3's mapped violations, so it stays
 * a defect. Drizzle's DrizzleQueryError message is the query and its params (t-b3-rigg-01).
 */
import { ErrorBody, REQUEST_ID_HEADER } from "@avel/contract";
import { users } from "@avel/db";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { Db, Tx } from "../../src/platform/db/db.ts";
import { testDatabase } from "../db/support/database.ts";
import { appRunning, fixedIds, get } from "../support/harness.ts";
import { dbLayer } from "./support.ts";

const ID = "0193a000-0000-7000-8000-0000000008a1";
const SECRET = "bound-value-7f3a9c-do-not-log";
const database = testDatabase("b8defect");

async function breakingRequest() {
  const d = await database();
  const lines: string[] = [];
  const app = appRunning(
    () =>
      Effect.gen(function* () {
        const db = yield* Db;
        return yield* db.withTransaction(
          Effect.gen(function* () {
            const tx = yield* Tx;
            // email is NOT NULL: Postgres refuses it with 23502, carrying our bound name.
            yield* Effect.promise(() =>
              tx.insert(users).values({ name: SECRET, email: null as never }),
            );
          }),
        );
      }).pipe(Effect.provide(Layer.orDie(dbLayer(d.url)))),
    { layer: fixedIds(ID), logLine: (line) => lines.push(line) },
  );
  const res = await get(app, "/api/health");
  return { res, text: await res.text(), lines };
}

describe("T-B8-01 · a Drizzle defect is logged without its bound values", () => {
  it("logs the requestId and the pg code, never 'params:' or the value; answers 500 with no database text", async () => {
    const { res, text, lines } = await breakingRequest();

    expect(res.status).toBe(500);
    const body = ErrorBody.parse(JSON.parse(text));
    expect(body.requestId).toBe(ID);
    expect(res.headers.get(REQUEST_ID_HEADER)).toBe(ID);
    expect(text).not.toContain(SECRET);
    expect(text.toLowerCase()).not.toContain("failed query");
    expect(text.toLowerCase()).not.toContain("null value");

    const defectLines = lines.filter((l) => JSON.parse(l).level === "Error");
    expect(defectLines.length).toBeGreaterThanOrEqual(1);
    // The defect is logged with the request's ID and the pg error's code.
    const withCode = defectLines.filter((l) => l.includes("23502"));
    expect(withCode.length).toBeGreaterThanOrEqual(1);
    for (const line of withCode) expect(JSON.parse(line).requestId).toBe(ID);
    // No line of the whole request holds a bound value.
    for (const line of lines) {
      expect(line).not.toContain("params:");
      expect(line).not.toContain(SECRET);
    }
  });
});
