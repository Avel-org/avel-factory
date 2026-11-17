// The bad (and good) inputs for route 54, `DecideProposalInput` (S1-6 check 5, S1-3).
// Shared by the recorder (scripts/record-decide-proposal-issues.mjs) and the test.
// Plain JSON values only, so a case can be written to the fixture and read back.

const GOOD_ID = "0190a5e0-7b3c-7d2e-8a4f-1b2c3d4e5f60";

export const DECIDE_PROPOSAL_CASES = [
  { name: "empty object", input: {} },
  { name: "not an object (null)", input: null },
  {
    name: "proposalId is not a UUID",
    input: { proposalId: "not-a-uuid", version: 1, choice: "approve", reason: "ok" },
  },
  {
    name: "proposalId is a v4 UUID, not v7",
    input: {
      proposalId: "3b241101-e2bb-4255-8caf-4136c566a962",
      version: 1,
      choice: "approve",
      reason: "ok",
    },
  },
  {
    name: "version 0, empty choice, blank reason",
    input: { proposalId: GOOD_ID, version: 0, choice: "", reason: "   " },
  },
  {
    name: "version is not an integer",
    input: { proposalId: GOOD_ID, version: 1.5, choice: "approve", reason: "ok" },
  },
  {
    name: "wrong types everywhere",
    input: { proposalId: 123, version: "1", choice: 5, reason: null },
  },
  {
    name: "good input with a padded reason (reason is trimmed)",
    input: {
      proposalId: GOOD_ID,
      version: 3,
      choice: "approve",
      reason: "  because it is right  ",
    },
  },
  {
    name: "good input with an extra key (stripped)",
    input: { proposalId: GOOD_ID, version: 1, choice: "reject", reason: "no", extra: true },
  },
];
