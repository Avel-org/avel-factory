import type { SeedRow } from "./rows.js";

/**
 * The mock's fixtures (UI contract section 2, "Fixtures"). Times are relative to when the
 * module loads, so every proposal is open at the real clock: created in the last hours, and
 * expiring 7 days after it was created (CR-W2 2.2, `expiresAt`).
 */

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const loadedAt = Date.now();

const at = (ms: number): string => new Date(loadedAt + ms).toISOString();

/** A lowercase UUIDv7 that sorts by `n`, under a fixed prefix per fixture set. */
const uuid7 = (prefix: string, n: number): string =>
  `${prefix}-0000-7000-8000-${String(n).padStart(12, "0")}`;

const options = (approve: [string, string], reject: [string, string]) => ({
  choices: [
    { choice: "approve", label: approve[0], effect: "approve", consequence: approve[1] },
    { choice: "reject", label: reject[0], effect: "reject", consequence: reject[1] },
  ],
});

const step1: SeedRow[] = [
  {
    kind: "proposal",
    id: uuid7("0193a7c3", 1),
    missionId: uuid7("0193a7c3", 101),
    clientName: "Northwind Dental",
    proposalKind: "parked",
    subjectKey: "payments-api",
    title: "Parked: payments-api",
    evidence: "The payments-api module failed its checks three times on the same test.",
    version: 2,
    options: options(
      ["Approve", "The module is retried with a fresh attempt."],
      ["Reject", "The module stays parked until you look at it."],
    ),
    createdAt: at(-95 * MINUTE),
    expiresAt: at(-95 * MINUTE + 7 * DAY),
  },
  {
    kind: "proposal",
    id: uuid7("0193a7c3", 2),
    missionId: uuid7("0193a7c3", 102),
    clientName: "Harbor Logistics",
    proposalKind: "budget_increase",
    subjectKey: "",
    title: "Budget increase",
    evidence: "The mission has used 92% of its budget with two modules left.",
    version: 1,
    options: options(
      ["Approve", "The mission's budget goes up and work continues."],
      ["Reject", "The mission pauses when it reaches its budget."],
    ),
    createdAt: at(-40 * MINUTE),
    expiresAt: at(-40 * MINUTE + 7 * DAY),
  },
  {
    // Its options don't parse (one choice, no reject): listed without approve and reject.
    kind: "proposal",
    id: uuid7("0193a7c3", 3),
    missionId: uuid7("0193a7c3", 103),
    clientName: "Northwind Dental",
    proposalKind: "contract_change",
    subjectKey: "orders",
    title: "Contract change: orders",
    evidence: "The orders module asks to add a field to an output DTO.",
    version: 1,
    options: {
      choices: [
        {
          choice: "approve",
          label: "Approve",
          effect: "approve",
          consequence: "The change lands.",
        },
      ],
    },
    createdAt: at(-20 * MINUTE),
    expiresAt: at(-20 * MINUTE + 7 * DAY),
  },
  {
    kind: "factory_change",
    prNumber: 142,
    title: "Add the retry-ladder skill",
    headSha: "3f9c2a7e1b4d8c6f0a5e9d2b7c1f4a8e6d3b0c95",
    url: "https://github.com/avel/factory/pull/142",
    createdAt: at(-10 * MINUTE),
  },
];

const many: SeedRow[] = Array.from({ length: 150 }, (_, i) => {
  const createdAt = -(150 - i) * MINUTE;
  return {
    kind: "proposal",
    id: uuid7("0193a7c4", i + 1),
    missionId: uuid7("0193a7c4", 1000 + i + 1),
    clientName: `Client ${(i % 5) + 1}`,
    proposalKind: "parked",
    subjectKey: `module-${i + 1}`,
    title: `Parked: module-${i + 1}`,
    evidence: `Module ${i + 1} failed its checks three times.`,
    version: 1,
    options: options(
      ["Approve", "The module is retried with a fresh attempt."],
      ["Reject", "The module stays parked until you look at it."],
    ),
    createdAt: at(createdAt),
    expiresAt: at(createdAt + 7 * DAY),
  };
});

export const fixtures: { empty: SeedRow[]; step1: SeedRow[]; many: SeedRow[] } = {
  empty: [],
  step1,
  many,
};
