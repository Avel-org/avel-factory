import { fixtures } from "@avel/contract-mock";
import { describe, expect, test } from "vitest";
import { PendingDecisionRow } from "../../src/data/pending-decisions";
import { createTestMock, json, request } from "../setup/app";

// UC-01: the mock's rows against the data core's copy of CR-W2's row (UI contract section 1).

type Item = Record<string, unknown>;

async function listStep1(): Promise<Item[]> {
  const mock = createTestMock(fixtures.step1);
  const response = await mock.fetch(request("GET", "/api/pending-decisions?limit=50"));
  expect(response.status, "route 52 should answer 200").toBe(200);
  const page = (await json(response)) as { items: Item[] };
  expect(page.items).toHaveLength(4);
  return page.items;
}

const isUnreadable = (item: Item): boolean =>
  item.kind === "proposal" && item.approve === undefined && item.reject === undefined;

describe("UC-01 fixtures.step1 against PendingDecisionRow", () => {
  test("UC-01 every row of fixtures.step1 parses, as a proposal or a factory PR", async () => {
    const items = await listStep1();
    for (const item of items) {
      const parsed = PendingDecisionRow.safeParse(item);
      expect(parsed.success, `${String(item.ref)} should parse`).toBe(true);
    }
    expect(items.map((item) => item.kind).sort()).toEqual([
      "factory_change",
      "proposal",
      "proposal",
      "proposal",
    ]);
  });

  test("UC-01 fixtures.step1 has two decidable proposals with different clients, one of them a budget_increase", async () => {
    const items = await listStep1();
    const decidable = items.filter((item) => item.kind === "proposal" && !isUnreadable(item));
    expect(decidable).toHaveLength(2);
    expect(new Set(decidable.map((item) => item.clientName)).size).toBe(2);
    expect(decidable.some((item) => item.proposalKind === "budget_increase")).toBe(true);
    for (const item of decidable) {
      expect(item.ref).toBe(`proposal:${String(item.proposalId)}`);
      expect(item.approve).toMatchObject({
        choice: expect.any(String),
        label: expect.any(String),
        consequence: expect.any(String),
      });
      expect(item.reject).toMatchObject({
        choice: expect.any(String),
        label: expect.any(String),
        consequence: expect.any(String),
      });
    }
  });

  test("UC-01 a row missing ref fails to parse", async () => {
    const [first] = await listStep1();
    expect(first, "route 52 should list a first row").toBeDefined();
    expect(PendingDecisionRow.safeParse(first).success, "the row as sent parses").toBe(true);
    const { ref: _ref, ...withoutRef } = first as Item;
    expect(PendingDecisionRow.safeParse(withoutRef).success).toBe(false);
  });

  test("UC-01 the proposal whose options don't parse still parses, without approve and reject", async () => {
    const items = await listStep1();
    const unreadable = items.filter(isUnreadable);
    expect(unreadable).toHaveLength(1);
    const parsed = PendingDecisionRow.safeParse(unreadable[0]);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).not.toHaveProperty("approve");
      expect(parsed.data).not.toHaveProperty("reject");
    }
  });

  test("UC-01 the factory PR parses, with digits for its id, a 40-hex commit and no client or cost", async () => {
    const items = await listStep1();
    const pr = items.find((item) => item.kind === "factory_change");
    expect(pr, "a factory PR row").toBeDefined();
    expect(PendingDecisionRow.safeParse(pr).success).toBe(true);
    expect(pr).toMatchObject({
      changeId: expect.stringMatching(/^[1-9][0-9]*$/),
      headSha: expect.stringMatching(/^[0-9a-f]{40}$/),
      missionId: null,
      clientName: null,
    });
    expect(pr?.ref).toBe(`factory_change:${String(pr?.changeId)}`);
    expect(pr).not.toHaveProperty("costImpact");
  });
});
