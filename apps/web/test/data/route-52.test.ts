import { ErrorBody } from "@avel/contract";
import { fixtures } from "@avel/contract-mock";
import { describe, expect, test } from "vitest";
import { createTestMock, json, request } from "../setup/app";
import { factoryRow, fromNow, proposalRow, uuid7 } from "../setup/seed";

// UC-02: route 52 on the mock: what it lists, in what order, and how it pages (UI contract
// section 2, "Route 52"; CR-W2 sections 2 and 6.7).

type Page = { items: Array<Record<string, unknown>>; nextCursor: string | null };

async function list(mock: ReturnType<typeof createTestMock>, query: string): Promise<Response> {
  return mock.fetch(request("GET", `/api/pending-decisions${query}`));
}

async function listOk(mock: ReturnType<typeof createTestMock>, query: string): Promise<Page> {
  const response = await list(mock, query);
  expect(response.status, `GET ${query} should answer 200`).toBe(200);
  return (await json(response)) as Page;
}

describe("UC-02 route 52", () => {
  test("UC-02 lists oldest first, by createdAt and then ref, across proposals and factory PRs", async () => {
    const mock = createTestMock([
      proposalRow(2, { createdAt: "2026-11-07T10:00:00.000Z" }),
      proposalRow(1, { createdAt: "2026-11-07T10:00:00.000Z" }),
      factoryRow(7, { createdAt: "2026-11-07T10:00:00.000Z" }),
      proposalRow(3, { createdAt: "2026-11-07T11:00:00.000Z" }),
      proposalRow(4, { createdAt: "2026-11-07T09:00:00.000Z" }),
    ]);
    const page = await listOk(mock, "?limit=50");
    expect(page.items.map((item) => item.ref)).toEqual([
      `proposal:${uuid7(4)}`,
      "factory_change:7",
      `proposal:${uuid7(1)}`,
      `proposal:${uuid7(2)}`,
      `proposal:${uuid7(3)}`,
    ]);
    expect(page.nextCursor).toBeNull();
  });

  test("UC-02 lists only open, unexpired proposals, and every factory PR", async () => {
    const mock = createTestMock([
      proposalRow(1),
      proposalRow(2, { state: "resolved" }),
      proposalRow(3, { state: "expired" }),
      proposalRow(4, { expiresAt: fromNow(-1000) }),
      factoryRow(8),
    ]);
    const page = await listOk(mock, "?limit=50");
    expect(page.items.map((item) => item.ref).sort()).toEqual(
      [`proposal:${uuid7(1)}`, "factory_change:8"].sort(),
    );
  });

  test.each(["0", "101", "-1", "abc"])(
    "UC-02 limit %s gives BAD_REQUEST on limit, never clamped",
    async (limit) => {
      const mock = createTestMock(fixtures.many);
      const response = await list(mock, `?limit=${limit}`);
      expect(response.status).toBe(400);
      const body = ErrorBody.parse(await json(response));
      expect(body.code).toBe("BAD_REQUEST");
      expect(body.requestId).toBe(response.headers.get("X-Request-Id"));
      expect(body.details).toMatchObject({
        field: "limit",
        issues: [{ field: "limit", message: expect.any(String) }],
      });
    },
  );

  test("UC-02 limit 100 serves at most 100 items, and has a next page for 150", async () => {
    const mock = createTestMock(fixtures.many);
    const page = await listOk(mock, "?limit=100");
    expect(page.items.length).toBe(100);
    expect(page.nextCursor).toEqual(expect.any(String));
  });

  test("UC-02 nextCursor pages through fixtures.many with no row repeated or lost", async () => {
    const mock = createTestMock(fixtures.many);
    const everything = await listOk(mock, "?limit=100");
    expect(everything.items.length).toBe(100);

    const refs: string[] = [];
    let cursor: string | null = null;
    for (let pages = 0; pages < 10; pages += 1) {
      const query: string =
        cursor === null ? "?limit=50" : `?limit=50&cursor=${encodeURIComponent(cursor)}`;
      const page: Page = await listOk(mock, query);
      expect(page.items.length).toBeLessThanOrEqual(50);
      refs.push(...page.items.map((item) => String(item.ref)));
      cursor = page.nextCursor;
      if (cursor === null) break;
    }
    expect(cursor).toBeNull();
    expect(refs).toHaveLength(150);
    expect(new Set(refs).size).toBe(150);
    // The pages together are the one list, in the same order.
    expect(refs.slice(0, 100)).toEqual(everything.items.map((item) => String(item.ref)));
  });
});
