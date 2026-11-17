// One pending decision of every kind, written from the item's own fields only, for the
// approve-route tests. IDs are UUIDv7-shaped fixtures; nothing here is a secret.
import type { PendingDecisionDto } from "../../src/index.ts";

const id = (n: number) => `0193a7c2-0000-7000-8000-${n.toString(16).padStart(12, "0")}`;
const missionId = id(1);
const sha = "a".repeat(40);

const base = {
  owner: "onboarding" as const,
  mission: { id: missionId, name: "Field app", kind: "template" as const, clientName: "AVEL" },
  createdAt: "2026-11-12T09:00:00.000Z",
  expiresAt: null,
  asOfSeq: 10,
  plain: {
    title: "Approve the plan for Field app",
    why: "The plan splits the work into 6 parts, each with its own tests.",
    ifYouApprove: "Building starts, and the deadline clock starts.",
    ifYouReject: null,
    returned: null,
  },
  evidence: [{ label: "Parts", value: "6" }],
  reasonRequired: { approve: false, reject: false },
  rejectable: false,
  unlocks: null,
  previous: null,
};

export const SAMPLE_DECISIONS: PendingDecisionDto[] = [
  {
    ...base,
    kind: "proposal",
    owner: "metering",
    ref: `proposal:${id(2)}`,
    reasonRequired: { approve: true, reject: true },
    rejectable: true,
    target: {
      proposalId: id(2),
      proposalKind: "budget_increase",
      subjectKey: "",
      moduleRunId: id(3),
      version: 2,
      choices: [
        {
          choice: "raise",
          label: "Raise to $20",
          consequence: "The part keeps going.",
          effect: "approve",
          recommended: true,
        },
        {
          choice: "park",
          label: "Park it",
          consequence: "The part stops.",
          effect: "reject",
          recommended: false,
        },
      ],
      decidable: true,
    },
    budget: { scope: "module", moduleRef: "M3", fromMicros: 15_000_000, toMicros: 20_000_000 },
  },
  {
    ...base,
    kind: "factory_change",
    owner: "knowledge",
    ref: "factory_change:142",
    mission: null,
    target: {
      changeId: "142",
      prNumber: 142,
      headSha: sha,
      url: "https://github.com/avel/factory/pull/142",
      area: "skill",
      evalRun: null,
    },
  },
  {
    ...base,
    kind: "checkpoint",
    ref: `checkpoint:${id(4)}`,
    reasonRequired: { approve: false, reject: true },
    rejectable: true,
    unlocks: "0.3 Mission and roster",
    target: { checkpointId: id(4), checkpoint: "0.2", version: 3, rowVersion: 5 },
  },
  {
    ...base,
    kind: "plan_finalize",
    ref: `plan_finalize:${missionId}`,
    target: { missionId, planId: id(5), planVersion: 1 },
  },
  {
    ...base,
    kind: "checkpoint_question",
    ref: `checkpoint_question:${id(6)}`,
    target: {
      questionId: id(6),
      rowVersion: 1,
      code: "Q-0.1a",
      text: "Is this a client project, or an internal template?",
      subject: { checkpoint: "0.1", moduleRef: null, risk: null, label: "0.1 What it is" },
      blocking: true,
      options: [
        {
          id: "template",
          label: "Internal template",
          consequence: "It ships to the templates repo.",
        },
        { id: "client", label: "Client project", consequence: "Canon asks which client next." },
      ],
      recommended: "template",
      why: "No client is attached, and the work is a starter many clients would begin from.",
      after: null,
    },
  },
  {
    ...base,
    kind: "pass_approval",
    owner: "gate",
    ref: `pass_approval:${missionId}`,
    reasonRequired: { approve: true, reject: false },
    target: {
      missionId,
      receiptId: id(7),
      receiptHash: `sha256:${"b".repeat(64)}`,
      verdictCaps: ["perf"],
    },
  },
  {
    ...base,
    kind: "release",
    owner: "delivery",
    ref: `release:${missionId}`,
    target: {
      missionId,
      receiptId: id(7),
      receiptHash: `sha256:${"b".repeat(64)}`,
      verdict: "pass",
      passApprovalId: id(8),
      commitSha: sha,
      deliveryKind: "pr",
    },
  },
  {
    ...base,
    kind: "dispatch_package_commit",
    owner: "integrator",
    ref: `dispatch_package_commit:${missionId}`,
    target: { missionId, packageHash: "c".repeat(64) },
  },
  {
    ...base,
    kind: "followup_send",
    owner: "pipeline",
    ref: `followup_send:${id(9)}`,
    rejectable: true,
    target: {
      followupId: id(9),
      draftHash: "d".repeat(64),
      channel: "copy",
      draft: "Hi Dale, checking in on the quote form.",
    },
  },
  {
    ...base,
    kind: "upkeep_offer",
    owner: "pipeline",
    ref: `upkeep_offer:${id(10)}`,
    rejectable: true,
    target: {
      followupId: id(10),
      clientId: id(11),
      signals: ["Delivered 30 days ago"],
      draftHash: "e".repeat(64),
      channel: "copy",
      draft: "Hi Dale, want us to keep it up to date?",
    },
  },
];
