import { type ClientDto, type MissionListRowDto, missionPlain } from "@avel/contract";
import type { SeedRow } from "#rows";

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

/**
 * Route 8's clients for `step1`: one per `clientName` in its decision rows (shell-layout.md
 * section 4, "Project rows"), so every project row there has a client name.
 */
const step1Clients: ClientDto[] = [
  {
    id: uuid7("0193a7c2", 1),
    name: "Northwind Dental",
    contacts: {},
    status: "active",
    archivedAt: null,
    kind: "client",
    proofConsentAt: null,
    createdAt: at(-30 * DAY),
    rowVersion: 1,
    updatedAt: at(-30 * DAY),
  },
  {
    id: uuid7("0193a7c2", 2),
    name: "Harbor Logistics",
    contacts: {},
    status: "active",
    archivedAt: null,
    kind: "client",
    proofConsentAt: null,
    createdAt: at(-21 * DAY),
    rowVersion: 1,
    updatedAt: at(-21 * DAY),
  },
];

const [northwind, harbor] = step1Clients as [ClientDto, ClientDto];

/** A building mission's list row (route 19, contract 1.0.0). */
const building = (
  missionId: string,
  client: ClientDto,
  packageKey: MissionListRowDto["package"],
  createdAt: number,
  name: string,
): MissionListRowDto => ({
  id: missionId,
  name,
  rowVersion: 3,
  kind: "client",
  templateSlug: null,
  client: { id: client.id, name: client.name },
  package: packageKey,
  state: "running",
  displayState: "running",
  plain: missionPlain({
    name,
    clientName: client.name,
    kind: "client",
    displayState: "running",
    modules: { total: 4, landed: 1 },
    needsYouCount: 0,
  }),
  gates: [0, 1, 2, 3, 4, 5].map((gate) => ({
    gate,
    state: gate < 2 ? "passed" : gate < 4 ? "running" : "pending",
    runs: gate === 2 || gate === 3 ? "per_job" : "once",
    counts: gate === 2 || gate === 3 ? { landed: 1, total: 4, running: 1 } : null,
  })),
  modules: { total: 4, landed: 1, running: 1, parked: 0 },
  needsYouCount: 0,
  runningDispatches: 1,
  deadline: {
    dueAt: at(createdAt + 21 * DAY),
    startedAt: at(createdAt + DAY),
    paused: false,
    pausedSince: null,
    pausedFor: null,
    atRisk: false,
  },
  lastEventAt: at(createdAt + DAY + 30 * MINUTE),
});

/**
 * Route 19's missions for `step1`, oldest first: one building mission per distinct
 * `missionId` in its decision rows, each with its row's client and a package, then one
 * mission in onboarding with no package yet (shell-layout.md section 4).
 */
const step1Missions: MissionListRowDto[] = [
  building(uuid7("0193a7c3", 101), northwind, "landing_page", -14 * DAY, "Clinic landing page"),
  building(uuid7("0193a7c3", 102), harbor, "stabilize", -10 * DAY, "Dispatch board fix"),
  building(uuid7("0193a7c3", 103), northwind, "feature", -6 * DAY, "Online booking"),
  {
    ...building(uuid7("0193a7c3", 104), harbor, "custom", -2 * DAY, "Warehouse tool"),
    state: "onboarding",
    displayState: "onboarding",
    package: null,
    modules: { total: 0, landed: 0, running: 0, parked: 0 },
    runningDispatches: 0,
    rowVersion: 1,
    deadline: {
      dueAt: null,
      startedAt: null,
      paused: false,
      pausedSince: null,
      pausedFor: null,
      atRisk: false,
    },
  },
];

export const fixtures: {
  empty: SeedRow[];
  step1: SeedRow[];
  many: SeedRow[];
  /** Route 19's missions that match `step1`; createMock serves them unless told otherwise. */
  step1Missions: MissionListRowDto[];
  /** Route 8's clients that match `step1`; createMock serves them unless told otherwise. */
  step1Clients: ClientDto[];
} = {
  empty: [],
  step1,
  many,
  step1Missions,
  step1Clients,
};
