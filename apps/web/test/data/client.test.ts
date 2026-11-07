import { describe, expect, test, vi } from "vitest";
import { NetworkError } from "../../src/data/errors";
import { createTestApi, DECIDE_PATH, expectOk, expectRejected, type TestMock } from "../setup/app";
import { proposalRow, uuid7 } from "../setup/seed";

// UC-05: the fetch wrapper's headers (UI contract section 3, "The fetch wrapper"), and what the
// mock records of the requests it receives.

const ID = uuid7(1);
const INPUT = { proposalId: ID, version: 3, choice: "approve", reason: "Looks right to me." };

/** A fetch that is the mock's, and remembers each request it was given and each answer. */
function watching(mock: TestMock) {
  const sent: Request[] = [];
  const answered: Response[] = [];
  const spy = vi.fn(async (request: Request) => {
    sent.push(request.clone());
    const response = await mock.fetch(request);
    answered.push(response.clone());
    return response;
  });
  return { fetch: spy as unknown as typeof fetch, sent, answered };
}

describe("UC-05 the client's headers", () => {
  test("UC-05 X-Request-Id is a new ID on every request when none is given", async () => {
    const { mock } = createTestApi([proposalRow(1)]);
    const seen = watching(mock);
    const { api } = createTestApi([], { mock, api: { fetch: seen.fetch } });
    await expectOk(api.client.decisions.listPending({ limit: 50 }));
    await expectOk(api.client.decisions.listPending({ limit: 50 }));
    const ids = seen.sent.map((request) => request.headers.get("X-Request-Id"));
    expect(ids).toHaveLength(2);
    expect(ids[0]).toEqual(expect.stringMatching(/^[0-9a-f-]{36}$/));
    expect(ids[1]).toEqual(expect.stringMatching(/^[0-9a-f-]{36}$/));
    expect(ids[0]).not.toBe(ids[1]);
  });

  test("UC-05 X-Request-Id is the requestId option on every request when one is given", async () => {
    const { mock } = createTestApi([proposalRow(1)]);
    const seen = watching(mock);
    const { api } = createTestApi([], {
      mock,
      api: { fetch: seen.fetch, requestId: "fixed-id-1" },
    });
    await expectOk(api.client.decisions.listPending({ limit: 50 }));
    await expectOk(api.client.decisions.listPending({ limit: 50 }));
    expect(seen.sent.map((request) => request.headers.get("X-Request-Id"))).toEqual([
      "fixed-id-1",
      "fixed-id-1",
    ]);
  });

  test("UC-05 Idempotency-Key comes from the call's context on route 54, and a read carries none", async () => {
    const { mock } = createTestApi([proposalRow(1)]);
    const seen = watching(mock);
    const { api } = createTestApi([], { mock, api: { fetch: seen.fetch } });
    await expectOk(api.client.decisions.listPending({ limit: 50 }));
    await expectOk(
      api.client.decisions.decide(INPUT, { context: { idempotencyKey: "key-from-context" } }),
    );
    expect(seen.sent).toHaveLength(2);
    expect(seen.sent[0]?.headers.get("Idempotency-Key")).toBeNull();
    expect(seen.sent[1]?.headers.get("Idempotency-Key")).toBe("key-from-context");
  });

  test("UC-05 the mock answers every response with X-Request-Id (the request's) and X-Contract-Version", async () => {
    const { mock } = createTestApi([proposalRow(1)], { contractVersion: "7.7.7" });
    const seen = watching(mock);
    const { api } = createTestApi([], {
      mock,
      api: { fetch: seen.fetch, contractVersion: "7.7.7", requestId: "echo-me" },
    });
    await expectOk(api.client.decisions.listPending({ limit: 50 }));
    await expectOk(api.client.decisions.decide(INPUT, { context: { idempotencyKey: "k-echo" } }));
    expect(seen.answered).toHaveLength(2);
    for (const response of seen.answered) {
      expect(response.headers.get("X-Request-Id")).toBe("echo-me");
      expect(response.headers.get("X-Contract-Version")).toBe("7.7.7");
    }
  });
});

describe("UC-05 what the mock records", () => {
  test("UC-05 route 54 is recorded with the path /api/proposals/{proposalId}/decisions and the body { version, choice, reason }", async () => {
    const { mock, api } = createTestApi([proposalRow(1)]);
    await expectOk(
      api.client.decisions.decide(INPUT, { context: { idempotencyKey: "key-recorded" } }),
    );
    const recorded = mock.requests().filter((entry) => entry.route === 54);
    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({
      route: 54,
      method: "POST",
      path: DECIDE_PATH(ID),
      idempotencyKey: "key-recorded",
      requestId: expect.any(String),
      body: { version: 3, choice: "approve", reason: INPUT.reason },
    });
    // The path carries the proposalId; the body never does (OpenAPILink drops path parameters).
    expect(recorded[0]?.body).not.toHaveProperty("proposalId");
  });

  test("UC-05 a request failed with { network: true } is still recorded, with its requestId, key and body", async () => {
    const { mock, api } = createTestApi([proposalRow(1)]);
    mock.failNext(54, { network: true });
    const error = await expectRejected(
      api.client.decisions.decide(INPUT, { context: { idempotencyKey: "key-lost" } }),
    );
    expect(error).toBeInstanceOf(NetworkError);
    const [recorded] = mock.requests();
    expect(recorded).toMatchObject({
      route: 54,
      method: "POST",
      path: DECIDE_PATH(ID),
      idempotencyKey: "key-lost",
      requestId: expect.any(String),
      body: { version: 3, choice: "approve", reason: INPUT.reason },
    });
    expect((error as NetworkError).requestId).toBe(recorded?.requestId);
  });

  test("UC-05 a request failed with a status is recorded too", async () => {
    const { mock, api } = createTestApi([proposalRow(1)]);
    mock.failNext(54, { status: 500, code: "INTERNAL", data: {} });
    await expectRejected(
      api.client.decisions.decide(INPUT, { context: { idempotencyKey: "key-500" } }),
    );
    expect(mock.requests()).toHaveLength(1);
    expect(mock.requests()[0]).toMatchObject({ route: 54, idempotencyKey: "key-500" });
  });
});
