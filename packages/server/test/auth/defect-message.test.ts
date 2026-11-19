/**
 * T-B9-08: a defect in a procedure answers 500 whose body.message equals
 * errorMap.INTERNAL_SERVER_ERROR.message and whose requestId is the request's (t-b3-rigg-03).
 * The text of the defect never shows.
 */
import { ErrorBody, errorMap, REQUEST_ID_HEADER } from "@avel/contract";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { appRunning, fixedIds, get } from "../support/harness.ts";

const ID = "0193a000-0000-7000-8000-0000000009a8";

describe("T-B9-08 · a defect's 500 carries the contract's message", () => {
  it("is errorMap's text, with the request's ID in the body and the header", async () => {
    const app = appRunning(() => Effect.die(new Error("boom-internal-detail")), {
      layer: fixedIds(ID),
    });
    const res = await get(app, "/api/health");
    expect(res.status).toBe(500);
    const text = await res.text();
    const body = ErrorBody.parse(JSON.parse(text));
    expect(body.code).toBe("INTERNAL_SERVER_ERROR");
    expect(body.message).toBe(errorMap.INTERNAL_SERVER_ERROR.message);
    expect(body.requestId).toBe(ID);
    expect(res.headers.get(REQUEST_ID_HEADER)).toBe(ID);
    expect(text).not.toContain("boom-internal-detail");

    // An incoming request ID is the one answered.
    const mine = "0193a000-0000-7000-8000-0000000009b8";
    const echoed = await get(app, "/api/health", { [REQUEST_ID_HEADER]: mine });
    const echoedBody = ErrorBody.parse(await echoed.json());
    expect(echoedBody.message).toBe(errorMap.INTERNAL_SERVER_ERROR.message);
    expect(echoedBody.requestId).toBe(mine);
  });
});
