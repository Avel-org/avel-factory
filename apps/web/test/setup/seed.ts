import type { SeedRow } from "@avel/contract-mock";

// Seed rows the tests build by hand, where a fixture's own rows would hide what is being checked.
// IDs are lowercase UUIDv7s, as the contract requires.

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** An ISO time `ms` from the real clock. The mock's clock is real unless a test sets one. */
export function fromNow(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

/** A UUIDv7 that sorts by `n`. */
export function uuid7(n: number): string {
  return `0193a7c2-0000-7000-8000-${String(n).padStart(12, "0")}`;
}

export const GOOD_OPTIONS = {
  choices: [
    {
      choice: "approve",
      label: "Approve",
      effect: "approve",
      consequence: "The work goes ahead.",
    },
    { choice: "reject", label: "Reject", effect: "reject", consequence: "The work stops." },
  ],
};

type ProposalSeed = Extract<SeedRow, { kind: "proposal" }>;

export function proposalRow(n: number, overrides: Partial<ProposalSeed> = {}): ProposalSeed {
  return {
    kind: "proposal",
    id: uuid7(n),
    missionId: uuid7(900 + n),
    clientName: `Client ${n}`,
    proposalKind: "parked",
    subjectKey: `module-${n}`,
    title: `Parked: module-${n}`,
    evidence: `Module ${n} failed its checks three times.`,
    version: 3,
    options: GOOD_OPTIONS,
    createdAt: fromNow(-2 * HOUR),
    expiresAt: fromNow(7 * DAY),
    ...overrides,
  };
}

type FactorySeed = Extract<SeedRow, { kind: "factory_change" }>;

export function factoryRow(prNumber: number, overrides: Partial<FactorySeed> = {}): FactorySeed {
  return {
    kind: "factory_change",
    prNumber,
    title: `Update skill ${prNumber}`,
    headSha: "0123456789abcdef0123456789abcdef01234567",
    url: `https://github.com/avel/factory/pull/${prNumber}`,
    createdAt: "2026-11-07T10:00:00.000Z",
    ...overrides,
  };
}
