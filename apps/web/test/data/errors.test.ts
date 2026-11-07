import { ORPCError } from "@orpc/client";
import { describe, expect, test } from "vitest";
import { createApiClient } from "../../src/data/client";
import { ApiError, decodeErrorBody, NetworkError, toUiError } from "../../src/data/errors";
import {
  createTestApi,
  createTestMock,
  expectOk,
  expectRejected,
  ORIGIN,
  type TestMock,
} from "../setup/app";
import { proposalRow, uuid7 } from "../setup/seed";

// UC-04: toUiError, one case per row of UI contract section 3's table; each branch of "Reading
// an error", with its request ID; and the round trip from the mock through createApiClient.

const ID = uuid7(1);
const REASON = "Looks right to me.";

function apiError(code: string, status: number, details?: unknown, message = `${code} message`) {
  return new ApiError({ code, message, details: details as never, requestId: "req-1" }, status);
}

describe("UC-04 toUiError, one case per row of the table", () => {
  const rows: Array<[string, () => unknown, Record<string, unknown>]> = [
    [
      "409 STALE_VERSION gives stale with field and currentVersion",
      () => apiError("STALE_VERSION", 409, { field: "version", currentVersion: 5 }),
      { kind: "stale", field: "version", currentVersion: 5, code: "STALE_VERSION" },
    ],
    [
      "422 INVALID_TRANSITION gives notAllowedNow",
      () => apiError("INVALID_TRANSITION", 422, { allowed: [] }),
      { kind: "notAllowedNow", code: "INVALID_TRANSITION" },
    ],
    [
      "422 INVALID_TRANSITION with state resolved carries it",
      () => apiError("INVALID_TRANSITION", 422, { state: "resolved", allowed: [] }),
      { kind: "notAllowedNow", state: "resolved" },
    ],
    [
      "422 INVALID_TRANSITION with state expired carries it",
      () => apiError("INVALID_TRANSITION", 422, { state: "expired", allowed: [] }),
      { kind: "notAllowedNow", state: "expired" },
    ],
    ["404 NOT_FOUND gives notFound", () => apiError("NOT_FOUND", 404), { kind: "notFound" }],
    [
      "404 with any other code gives notFound",
      () => apiError("MISSION_NOT_FOUND", 404),
      { kind: "notFound", code: "MISSION_NOT_FOUND" },
    ],
    [
      "400 gives badRequest with the field from details",
      () => apiError("BAD_REQUEST", 400, { field: "reason", issues: [] }),
      { kind: "badRequest", field: "reason" },
    ],
    ["401 gives signedOut", () => apiError("UNAUTHORIZED", 401), { kind: "signedOut" }],
    [
      "403 gives forbidden with the message",
      () => apiError("FORBIDDEN", 403, undefined, "No."),
      { kind: "forbidden", message: "No." },
    ],
    [
      "403 with any other code gives forbidden",
      () => apiError("STEP_UP_REQUIRED", 403, undefined, "Password again."),
      { kind: "forbidden", message: "Password again." },
    ],
    [
      "429 gives rateLimited with retryAfterMs from details",
      () => apiError("TOO_MANY_REQUESTS", 429, { retryAfterMs: 3000 }),
      { kind: "rateLimited", retryAfterMs: 3000 },
    ],
    [
      "409 IDEMPOTENCY_KEY_REUSED gives idempotencyConflict",
      () => apiError("IDEMPOTENCY_KEY_REUSED", 409),
      { kind: "idempotencyConflict" },
    ],
    [
      "409 IDEMPOTENCY_IN_PROGRESS gives inProgress",
      () => apiError("IDEMPOTENCY_IN_PROGRESS", 409),
      { kind: "inProgress" },
    ],
    [
      "409 CONFLICT gives conflict, not stale",
      () => apiError("CONFLICT", 409, undefined, "Changed."),
      { kind: "conflict", message: "Changed." },
    ],
    [
      "409 ALREADY_EXISTS gives conflict",
      () => apiError("ALREADY_EXISTS", 409, { constraint: "x" }, "Exists."),
      { kind: "conflict", message: "Exists." },
    ],
    [
      "422 UNPROCESSABLE_CONTENT gives unprocessable with the message",
      () => apiError("UNPROCESSABLE_CONTENT", 422, undefined, "Can't."),
      { kind: "unprocessable", message: "Can't." },
    ],
    [
      "422 CONSTRAINT_VIOLATION gives unprocessable",
      () => apiError("CONSTRAINT_VIOLATION", 422, { constraint: "y" }, "Check."),
      { kind: "unprocessable", message: "Check." },
    ],
    [
      "500 gives server with the status",
      () => apiError("INTERNAL", 500),
      { kind: "server", status: 500 },
    ],
    [
      "503 gives server with the status",
      () => apiError("UNAVAILABLE", 503),
      { kind: "server", status: 503 },
    ],
  ];

  test.each(rows)("UC-04 %s", (_name, make, expected) => {
    const mapped = toUiError(make());
    expect(mapped).toMatchObject(expected);
    expect(mapped.requestId).toBe("req-1");
  });

  test("UC-04 stale is keyed on STALE_VERSION alone: a 409 with another code is never stale", () => {
    for (const code of ["CONFLICT", "ALREADY_EXISTS", "TOKEN_REPLAYED", "DELETE_REFUSED"]) {
      expect(toUiError(apiError(code, 409)).kind, code).toBe("conflict");
    }
    expect(
      toUiError(apiError("STALE_VERSION", 409, { field: "version", currentVersion: 2 })).kind,
    ).toBe("stale");
  });
});

describe("UC-04 reading an error", () => {
  test("UC-04 decodeErrorBody turns an ErrorBody into an ApiError with the body's code, status and data", () => {
    const body = {
      code: "STALE_VERSION",
      message: "The body's version isn't current",
      details: { field: "version", currentVersion: 4 },
      requestId: "req-9",
    };
    const decoded = decodeErrorBody(body, { status: 409 });
    expect(decoded).toBeInstanceOf(ApiError);
    expect(decoded).toBeInstanceOf(ORPCError);
    expect(decoded?.code).toBe("STALE_VERSION");
    expect(decoded?.status).toBe(409);
    expect(decoded?.message).toBe(body.message);
    expect(decoded?.data).toEqual({ details: body.details, requestId: "req-9" });
  });

  test("UC-04 decodeErrorBody returns null for a body that isn't an ErrorBody", () => {
    expect(
      decodeErrorBody({ defined: false, code: "CONFLICT", status: 409 }, { status: 409 }),
    ).toBeNull();
    expect(decodeErrorBody("nope", { status: 500 })).toBeNull();
    expect(decodeErrorBody(null, { status: 500 })).toBeNull();
    // Reaching this assertion needs the decoder to exist and to decode a real body.
    const real = decodeErrorBody({ code: "X", message: "m", requestId: "r" }, { status: 400 });
    expect(real).toBeInstanceOf(ApiError);
  });

  test("UC-04 an ApiError's requestId comes from the body", () => {
    const decoded = decodeErrorBody(
      { code: "NOT_FOUND", message: "m", requestId: "from-body" },
      {
        status: 404,
      },
    );
    expect(decoded).not.toBeNull();
    expect(toUiError(decoded).requestId).toBe("from-body");
    expect(toUiError(decoded).code).toBe("NOT_FOUND");
  });

  test("UC-04 a non-ErrorBody 409 gives conflict with code null, and requestId from the response's X-Request-Id", async () => {
    const mock = createTestMock([proposalRow(1)]);
    const odd: typeof fetch = async () =>
      new Response(JSON.stringify({ unexpected: true }), {
        status: 409,
        headers: { "content-type": "application/json", "X-Request-Id": "echo-from-server" },
      });
    const { api } = createTestApi([], { mock, api: { fetch: odd } });
    const error = await expectRejected(
      api.client.decisions.decide(
        { proposalId: ID, version: 3, choice: "approve", reason: REASON },
        { context: { idempotencyKey: "k-1" } },
      ),
    );
    expect(toUiError(error)).toMatchObject({
      kind: "conflict",
      code: null,
      requestId: "echo-from-server",
    });
  });

  test("UC-04 a non-ErrorBody 409 with no X-Request-Id gives the ID the client sent", async () => {
    const mock: TestMock = createTestMock([proposalRow(1)]);
    const odd: typeof fetch = async () =>
      new Response(JSON.stringify({ unexpected: true }), {
        status: 409,
        headers: { "content-type": "application/json" },
      });
    const { api } = createTestApi([], { mock, api: { fetch: odd, requestId: "sent-id-7" } });
    const error = await expectRejected(
      api.client.decisions.decide(
        { proposalId: ID, version: 3, choice: "approve", reason: REASON },
        { context: { idempotencyKey: "k-2" } },
      ),
    );
    expect(toUiError(error)).toMatchObject({
      kind: "conflict",
      code: null,
      requestId: "sent-id-7",
    });
  });

  test("UC-04 a failed fetch gives network, with the requestId the mock recorded", async () => {
    const { mock, api } = createTestApi([proposalRow(1)]);
    mock.failNext(54, { network: true });
    const error = await expectRejected(
      api.client.decisions.decide(
        { proposalId: ID, version: 3, choice: "approve", reason: REASON },
        { context: { idempotencyKey: "k-3" } },
      ),
    );
    expect(error).toBeInstanceOf(NetworkError);
    expect(error).toBeInstanceOf(TypeError);
    const [recorded] = mock.requests();
    expect(recorded?.requestId).toEqual(expect.any(String));
    expect(toUiError(error)).toMatchObject({
      kind: "network",
      requestId: recorded?.requestId,
    });
  });

  test("UC-04 a NetworkError maps to network with the ID it carries", () => {
    const error = new NetworkError("sent-id-1", new TypeError("fetch failed"));
    expect(error.requestId).toBe("sent-id-1");
    expect(toUiError(error)).toMatchObject({ kind: "network", requestId: "sent-id-1" });
  });

  test("UC-04 any other thrown value gives network with requestId null", () => {
    for (const thrown of [new Error("boom"), "text", undefined, null, { status: 500 }]) {
      expect(toUiError(thrown), String(thrown)).toMatchObject({ kind: "network", requestId: null });
    }
  });

  test("UC-04 an ORPCError that isn't an ApiError maps by status, never to stale, and reads the request ID from its headers", () => {
    const error = new ORPCError("CONFLICT", {
      status: 409,
      data: { status: 409, headers: { "x-request-id": "hdr-1" }, body: "x" },
    });
    expect(toUiError(error)).toMatchObject({ kind: "conflict", code: null, requestId: "hdr-1" });
  });
});

describe("UC-04 round trip: the mock through createApiClient", () => {
  test("UC-04 a mock STALE_VERSION comes out as stale with the mock's requestId, not conflict", async () => {
    const { mock, api } = createTestApi([proposalRow(1, { version: 3 })]);
    const newVersion = mock.bumpVersion(ID);
    const error = await expectRejected(
      api.client.decisions.decide(
        { proposalId: ID, version: 3, choice: "approve", reason: REASON },
        { context: { idempotencyKey: "k-4" } },
      ),
    );
    const ui = toUiError(error);
    expect(ui.kind).not.toBe("conflict");
    expect(ui).toMatchObject({
      kind: "stale",
      code: "STALE_VERSION",
      field: "version",
      currentVersion: newVersion,
    });
    const last = mock.requests().at(-1);
    expect(ui.requestId).toBe(last?.requestId);
  });

  test("UC-04 a mock IDEMPOTENCY_KEY_REUSED comes out as idempotencyConflict", async () => {
    const { mock, api } = createTestApi([proposalRow(1, { version: 3 })]);
    const key = "k-5";
    await expectOk(
      api.client.decisions.decide(
        { proposalId: ID, version: 3, choice: "approve", reason: REASON },
        { context: { idempotencyKey: key } },
      ),
    );
    const error = await expectRejected(
      api.client.decisions.decide(
        { proposalId: ID, version: 3, choice: "approve", reason: "Another reason." },
        { context: { idempotencyKey: key } },
      ),
    );
    expect(toUiError(error)).toMatchObject({
      kind: "idempotencyConflict",
      code: "IDEMPOTENCY_KEY_REUSED",
      requestId: mock.requests().at(-1)?.requestId,
    });
  });

  test("UC-04 a mock failNext 5xx comes out as server, and a createApiClient built on the mock's fetch decodes it", async () => {
    const mock = createTestMock([proposalRow(1)]);
    const client = createApiClient({ fetch: mock.fetch, baseUrl: ORIGIN });
    mock.failNext(52, { status: 500, code: "INTERNAL", data: {} });
    const error = await expectRejected(client.decisions.listPending({ limit: 50 }));
    expect(toUiError(error)).toMatchObject({ kind: "server", status: 500, code: "INTERNAL" });
  });
});
