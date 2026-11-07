import { ErrorBody, ProposalDto } from "@avel/contract";
import { MOCK_OPERATOR_ID } from "@avel/contract-mock";
import { describe, expect, test } from "vitest";
import { createTestMock, DECIDE_PATH, decide, json, request, type TestMock } from "../setup/app";
import { fromNow, proposalRow, uuid7 } from "../setup/seed";

// UC-03: route 54 on the mock. Each check in CR-W2 section 5's order gives its code and details
// as an ErrorBody; idempotency; and the success answer (UI contract section 2, "Route 54").

const ID = uuid7(1);
const GOOD = { version: 3, choice: "approve", reason: "Looks right to me." };

function openMock(): TestMock {
  return createTestMock([proposalRow(1, { version: 3 }), proposalRow(2, { version: 3 })]);
}

/** Reads an error response as the contract's ErrorBody, and checks the headers that go with it. */
async function errorBody(response: Response, status: number): Promise<ErrorBody> {
  expect(response.status).toBe(status);
  const body = ErrorBody.parse(await json(response));
  expect(body.requestId).toBe(response.headers.get("X-Request-Id"));
  expect(response.headers.get("X-Contract-Version")).toEqual(expect.any(String));
  return body;
}

describe("UC-03 route 54, check 1: the schema", () => {
  test("UC-03 a missing version gives BAD_REQUEST with field and issues, and message from the first issue", async () => {
    const mock = openMock();
    const response = await decide(mock, ID, { choice: "approve", reason: "A reason." });
    const body = await errorBody(response, 400);
    expect(body.code).toBe("BAD_REQUEST");
    expect(body.details).toMatchObject({
      field: "version",
      issues: [{ field: "version", message: expect.any(String) }],
    });
    const issues = (body.details as { issues: Array<{ message: string }> }).issues;
    expect(body.message).toBe(issues[0]?.message);
  });

  test("UC-03 issues lists every failing path, in the validator's order", async () => {
    const mock = openMock();
    const body = await errorBody(await decide(mock, ID, { reason: "A reason." }), 400);
    const details = body.details as { field: string; issues: Array<{ field: string }> };
    expect(details.issues.map((issue) => issue.field)).toEqual(["version", "choice"]);
    expect(details.field).toBe("version");
  });

  test("UC-03 a body with no proposalId passes check 1, and the decision is recorded", async () => {
    const mock = openMock();
    const response = await decide(mock, ID, GOOD);
    expect(response.status).toBe(201);
  });

  test("UC-03 a body proposalId that differs from the path's is ignored: the path's proposal is decided", async () => {
    const mock = openMock();
    const response = await decide(mock, ID, { ...GOOD, proposalId: uuid7(2) });
    expect(response.status).toBe(201);
    const decided = ProposalDto.parse(await json(response));
    expect(decided.id).toBe(ID);
    expect(decided.state).toBe("resolved");

    // The proposal named only in the body is untouched: still open, so still listed.
    const listed = await mock.fetch(request("GET", "/api/pending-decisions?limit=50"));
    const page = (await json(listed)) as { items: Array<{ ref: string }> };
    expect(page.items.map((item) => item.ref)).toEqual([`proposal:${uuid7(2)}`]);
  });

  test("UC-03 no Idempotency-Key gives BAD_REQUEST on the header, with message required", async () => {
    const mock = openMock();
    const response = await decide(mock, ID, GOOD, {});
    const body = await errorBody(response, 400);
    expect(body.code).toBe("BAD_REQUEST");
    expect(body.message).toBe("required");
    expect(body.details).toEqual({
      field: "Idempotency-Key",
      issues: [{ field: "Idempotency-Key", message: "required" }],
    });
  });
});

describe("UC-03 route 54, checks 2 to 5, in CR-W2's order", () => {
  test("UC-03 check 2: no such proposal gives NOT_FOUND", async () => {
    const mock = openMock();
    const body = await errorBody(await decide(mock, uuid7(99), GOOD), 404);
    expect(body.code).toBe("NOT_FOUND");
  });

  test.each(["resolved", "expired"] as const)(
    "UC-03 check 3: a %s proposal gives INVALID_TRANSITION with allowed [] and no state",
    async (state) => {
      const mock = createTestMock([proposalRow(1, { version: 3, state })]);
      const body = await errorBody(await decide(mock, ID, GOOD), 422);
      expect(body.code).toBe("INVALID_TRANSITION");
      expect(body.details).toEqual({ allowed: [] });
    },
  );

  test("UC-03 check 3: a proposal whose expiresAt has passed gives INVALID_TRANSITION", async () => {
    const mock = createTestMock([proposalRow(1, { version: 3, expiresAt: fromNow(-1000) })]);
    const body = await errorBody(await decide(mock, ID, GOOD), 422);
    expect(body.code).toBe("INVALID_TRANSITION");
  });

  test("UC-03 check 4: a stale version gives STALE_VERSION with field and currentVersion", async () => {
    const mock = openMock();
    const body = await errorBody(await decide(mock, ID, { ...GOOD, version: 2 }), 409);
    expect(body.code).toBe("STALE_VERSION");
    expect(body.details).toEqual({ field: "version", currentVersion: 3 });
  });

  test("UC-03 check 5: a choice the proposal doesn't offer gives BAD_REQUEST on choice", async () => {
    const mock = openMock();
    const body = await errorBody(await decide(mock, ID, { ...GOOD, choice: "maybe" }), 400);
    expect(body.code).toBe("BAD_REQUEST");
    expect(body.details).toMatchObject({ field: "choice" });
  });

  test("UC-03 the checks run in order: 1 before 2, 3 before 4, and 4 before 5", async () => {
    const mock = createTestMock([
      proposalRow(1, { version: 3 }),
      proposalRow(2, { version: 3, state: "resolved" }),
    ]);
    // 1 before 2: an invalid body for a proposal that doesn't exist is a 400, not a 404.
    const first = await errorBody(await decide(mock, uuid7(99), { reason: "A reason." }), 400);
    expect(first.code).toBe("BAD_REQUEST");
    // 2 before 3 and 4: no such proposal is a 404 even with a stale version.
    const second = await errorBody(await decide(mock, uuid7(99), { ...GOOD, version: 1 }), 404);
    expect(second.code).toBe("NOT_FOUND");
    // 3 before 4: a resolved proposal with a stale version is INVALID_TRANSITION.
    const third = await errorBody(await decide(mock, uuid7(2), { ...GOOD, version: 1 }), 422);
    expect(third.code).toBe("INVALID_TRANSITION");
    // 4 before 5: a stale version with a bad choice is STALE_VERSION.
    const fourth = await errorBody(
      await decide(mock, ID, { ...GOOD, version: 1, choice: "maybe" }),
      409,
    );
    expect(fourth.code).toBe("STALE_VERSION");
  });
});

describe("UC-03 route 54, idempotency", () => {
  test("UC-03 the same key, path and body replays the first response, status and body", async () => {
    const mock = openMock();
    const headers = { "Idempotency-Key": "key-replay-1" };
    const first = await decide(mock, ID, GOOD, headers);
    expect(first.status).toBe(201);
    const firstBody = await json(first);
    const second = await decide(mock, ID, GOOD, headers);
    expect(second.status).toBe(201);
    expect(await json(second)).toEqual(firstBody);
  });

  test("UC-03 the same key with a different body gives IDEMPOTENCY_KEY_REUSED", async () => {
    const mock = openMock();
    const headers = { "Idempotency-Key": "key-reuse-1" };
    expect((await decide(mock, ID, GOOD, headers)).status).toBe(201);
    const body = await errorBody(
      await decide(mock, ID, { ...GOOD, reason: "A different reason." }, headers),
      409,
    );
    expect(body.code).toBe("IDEMPOTENCY_KEY_REUSED");
  });

  test("UC-03 the same key with a different path gives IDEMPOTENCY_KEY_REUSED", async () => {
    const mock = openMock();
    const headers = { "Idempotency-Key": "key-reuse-2" };
    expect((await decide(mock, ID, GOOD, headers)).status).toBe(201);
    const response = await mock.fetch(
      request("POST", DECIDE_PATH(uuid7(2)), { headers, body: GOOD }),
    );
    const body = await errorBody(response, 409);
    expect(body.code).toBe("IDEMPOTENCY_KEY_REUSED");
  });
});

describe("UC-03 route 54, success", () => {
  test("UC-03 success is 201 with the resolved ProposalDto: state, choice, choiceReason, resolvedBy, resolvedAt and rowVersion + 1", async () => {
    const mock = openMock();
    const read = await mock.fetch(request("GET", `/api/proposals/${ID}`));
    expect(read.status, "route 53 should answer 200").toBe(200);
    const before = ProposalDto.parse(await json(read));
    expect(before.state).toBe("open");

    const sentAt = Date.now();
    const response = await decide(mock, ID, GOOD);
    expect(response.status).toBe(201);
    const after = ProposalDto.parse(await json(response));
    expect(after).toMatchObject({
      id: ID,
      state: "resolved",
      choice: "approve",
      choiceReason: GOOD.reason,
      resolvedBy: MOCK_OPERATOR_ID,
      rowVersion: before.rowVersion + 1,
    });
    const resolvedAt = new Date(after.resolvedAt ?? "").getTime();
    expect(resolvedAt).toBeGreaterThanOrEqual(sentAt - 1000);
    expect(resolvedAt).toBeLessThanOrEqual(Date.now() + 1000);
  });

  test("UC-03 a decided proposal is gone from route 52", async () => {
    const mock = openMock();
    expect((await decide(mock, ID, GOOD)).status).toBe(201);
    const listed = await mock.fetch(request("GET", "/api/pending-decisions?limit=50"));
    expect(listed.status).toBe(200);
    const page = (await json(listed)) as { items: Array<{ ref: string }> };
    expect(page.items.map((item) => item.ref)).toEqual([`proposal:${uuid7(2)}`]);
  });
});
