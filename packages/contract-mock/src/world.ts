import {
  type AgentStepDto,
  type AlertDto,
  type CanonMessageDto,
  type CheckpointDto,
  type ClientDto,
  type DispatchPackageCommitDto,
  decisionPlain,
  type EvalRunDto,
  type EventDto,
  type EventKind,
  EventKind as EventKinds,
  type FollowupDto,
  type GateStripItem,
  type LeadDto,
  type MissionDetailDto,
  type MissionDto,
  type MissionListRowDto,
  type MissionState,
  type ModuleRunViewDto,
  missionPlain,
  modulePlain,
  type PassApprovalDto,
  type PendingDecisionDto,
  type PipelineDto,
  packagePlain,
  type QuestionDto,
  type ReceiptViewDto,
  type ReleaseApprovalDto,
  receiptPlain,
  returnedLine,
  type SkillResultsDto,
  type StatusDto,
  type TemplateDraftDto,
  type TemplateSourceDto,
} from "@avel/contract";

/**
 * The control room's sample world (CR-W1 to W22 done-when): six projects (Fleet portal,
 * Spring launch site, Booking fix, Field app, Parts catalogue and Control room), their
 * clients, a pending decision of every kind, a receipt with proof files, a module run, Canon's
 * messages, the status read, the pipeline, and one event of every kind. Every value is typed
 * by the contract, and the mock's tests parse each one against its schema. No money but AI
 * cost against its cap; no secrets.
 */

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const loadedAt = Date.parse("2026-11-12T15:00:00.000Z");
const at = (ms: number): string => new Date(loadedAt + ms).toISOString();
const id = (n: number): string => `0193b000-0000-7000-8000-${String(n).padStart(12, "0")}`;
const hex = (c: string, n = 64) => c.repeat(n);

// ---------------------------------------------------------------- clients

const client = (n: number, name: string, extra: Partial<ClientDto> = {}): ClientDto => ({
  id: id(n),
  name,
  contacts: [],
  status: "active",
  archivedAt: null,
  kind: "client",
  proofConsentAt: null,
  createdAt: at(-60 * DAY),
  rowVersion: 1,
  updatedAt: at(-60 * DAY),
  ...extra,
});

export const CLIENTS = {
  gts: client(1, "GTS Diesel", {
    contacts: [{ name: "Dale", role: "owner" }],
    proofConsentAt: at(-20 * DAY),
  }),
  blume: client(2, "Blume Studio", { contacts: [{ name: "Ana", role: "founder" }] }),
  harbor: client(3, "Harbor Parts", { status: "lead" }),
  avel: client(4, "AVEL", { kind: "internal" }),
} as const;

// ---------------------------------------------------------------- missions

type Seed = {
  n: number;
  name: string;
  client: ClientDto | null;
  kind: MissionDto["kind"];
  state: MissionDto["state"];
  displayState: MissionDto["displayState"];
  packageKey: string | null;
  modules: MissionListRowDto["modules"];
  needsYou: number;
  gates: GateStripItem["state"][];
  templateSlug?: string;
};

const gateStrip = (
  states: GateStripItem["state"][],
  landed: number,
  total: number,
): GateStripItem[] =>
  states.map((state, gate) => ({
    gate,
    state,
    runs: gate === 2 || gate === 3 ? "per_job" : "once",
    counts:
      gate === 2 || gate === 3 ? { landed, total, running: state === "running" ? 1 : 0 } : null,
  }));

const SEEDS: Seed[] = [
  {
    n: 101,
    name: "Fleet portal",
    client: CLIENTS.gts,
    kind: "client",
    state: "running",
    displayState: "blocked_on_you",
    packageKey: "feature",
    modules: { total: 8, landed: 4, running: 2, parked: 1 },
    needsYou: 3,
    gates: ["passed", "passed", "running", "running", "pending", "pending"],
  },
  {
    n: 102,
    name: "Spring launch site",
    client: CLIENTS.blume,
    kind: "client",
    state: "awaiting_release",
    displayState: "awaiting_release",
    packageKey: "landing_page",
    modules: { total: 4, landed: 4, running: 0, parked: 0 },
    needsYou: 1,
    gates: ["passed", "passed", "passed", "passed", "passed", "passed"],
  },
  {
    n: 103,
    name: "Booking fix",
    client: CLIENTS.gts,
    kind: "client",
    state: "deciding",
    displayState: "deciding",
    packageKey: "stabilize",
    modules: { total: 3, landed: 3, running: 0, parked: 0 },
    needsYou: 1,
    gates: ["passed", "passed", "passed", "passed", "passed", "failed"],
  },
  {
    n: 104,
    name: "Field app",
    client: null,
    kind: null,
    state: "onboarding",
    displayState: "onboarding",
    packageKey: null,
    modules: { total: 0, landed: 0, running: 0, parked: 0 },
    needsYou: 1,
    gates: ["running", "pending", "pending", "pending", "pending", "pending"],
  },
  {
    n: 105,
    name: "Parts catalogue",
    client: CLIENTS.avel,
    kind: "template",
    state: "delivered",
    displayState: "delivered",
    packageKey: "feature",
    modules: { total: 5, landed: 5, running: 0, parked: 0 },
    needsYou: 0,
    gates: ["passed", "passed", "passed", "passed", "passed", "passed"],
    templateSlug: "parts-catalogue",
  },
  {
    n: 106,
    name: "Control room",
    client: CLIENTS.avel,
    kind: "internal",
    state: "running",
    displayState: "running",
    packageKey: "custom",
    modules: { total: 12, landed: 7, running: 3, parked: 0 },
    needsYou: 1,
    gates: ["passed", "passed", "running", "running", "pending", "pending"],
  },
];

const deadline = (s: Seed): MissionDto["deadline"] => ({
  dueAt: s.state === "onboarding" ? null : at(8 * DAY),
  startedAt: s.state === "onboarding" ? null : at(-6 * DAY),
  paused: s.displayState === "blocked_on_you",
  pausedSince: s.displayState === "blocked_on_you" ? at(-2 * 60 * MINUTE) : null,
  pausedFor: s.displayState === "blocked_on_you" ? "operator" : null,
  atRisk: s.n === 101,
});

const plainOf = (s: Seed) =>
  missionPlain({
    name: s.name,
    clientName: s.client?.name ?? null,
    kind: s.kind,
    displayState: s.displayState,
    modules: s.modules,
    needsYouCount: s.needsYou,
  });

export const MISSIONS: MissionDto[] = SEEDS.map((s) => ({
  id: id(s.n),
  name: s.name,
  clientId: s.client?.id ?? null,
  state: s.state,
  packageKey: s.packageKey,
  packageVersion: s.packageKey ? "1" : null,
  budgetMicros: s.state === "onboarding" ? 20_000_000 : 150_000_000,
  reservedMicros: 4_000_000,
  spentMicros: s.state === "onboarding" ? 1_200_000 : 61_000_000,
  planId: s.state === "onboarding" ? null : id(s.n + 100),
  planState: s.state === "onboarding" ? null : "approved",
  repoConnectionId: null,
  pinnedCommit: s.state === "onboarding" ? null : hex("1", 40),
  branchHead: s.state === "onboarding" ? null : hex("2", 40),
  factoryCommit: s.state === "onboarding" ? null : hex("3", 40),
  rosterVersion: null,
  kbRelease: null,
  rulesVersion: null,
  gate5Failures: s.n === 103 ? 1 : 0,
  onboardingStartedAt: at(-10 * DAY),
  approvedAt: s.state === "onboarding" ? null : at(-6 * DAY),
  renderedAt: s.state === "onboarding" ? null : at(-6 * DAY + 30 * MINUTE),
  deliveredAt: s.state === "delivered" ? at(-1 * DAY) : null,
  closedAt: null,
  cancelledAt: null,
  kind: s.kind,
  clientKind: s.client?.kind ?? null,
  templateSlug: s.templateSlug ?? null,
  leadId: null,
  followsDeliveryId: null,
  designSystemSlug: null,
  designSystemVersion: null,
  createdAt: at(-10 * DAY),
  rowVersion: 3,
  updatedAt: at(-1 * MINUTE),
  displayState: s.displayState,
  plain: plainOf(s),
  deadline: deadline(s),
  clientMain: {
    pinnedCommit: s.state === "onboarding" ? null : hex("1", 40),
    latestCommit: s.n === 101 ? hex("4", 40) : null,
    moved: s.n === 101,
  },
}));

export const MISSION_ROWS: MissionListRowDto[] = SEEDS.map((s, i) => {
  const m = MISSIONS[i] as MissionDto;
  return {
    id: m.id,
    name: m.name,
    rowVersion: m.rowVersion,
    kind: m.kind,
    templateSlug: m.templateSlug,
    client: s.client && s.kind === "client" ? { id: s.client.id, name: s.client.name } : null,
    package: (s.packageKey as MissionListRowDto["package"]) ?? null,
    state: m.state,
    displayState: m.displayState,
    plain: m.plain,
    gates: gateStrip(s.gates, s.modules.landed, s.modules.total),
    modules: s.modules,
    needsYouCount: s.needsYou,
    runningDispatches: s.modules.running,
    deadline: m.deadline,
    lastEventAt: at(-1 * MINUTE),
  };
});

export const missionById = (missionId: string) => MISSIONS.find((m) => m.id === missionId) ?? null;
export const gatesOf = (missionId: string): GateStripItem[] =>
  MISSION_ROWS.find((r) => r.id === missionId)?.gates ?? [];

const [fleet, spring, booking, field, parts, controlRoom] = MISSIONS as [
  MissionDto,
  MissionDto,
  MissionDto,
  MissionDto,
  MissionDto,
  MissionDto,
];

// ---------------------------------------------------------------- decisions, one of every kind

const base = (m: MissionDto | null, n: number) => ({
  mission: m
    ? {
        id: m.id,
        name: m.name,
        kind: m.kind,
        clientName:
          m.kind === "client"
            ? m.clientId === CLIENTS.gts.id
              ? CLIENTS.gts.name
              : CLIENTS.blume.name
            : null,
      }
    : null,
  createdAt: at(-n * 60 * MINUTE),
  expiresAt: null,
  asOfSeq: 1000 + n,
  evidence: [],
  reasonRequired: { approve: false, reject: false },
  rejectable: false,
  unlocks: null,
  previous: null,
});

/** Q-0.1a's three answers (CR-W22): the project's kind. */
export const KIND_OPTIONS = [
  {
    id: "template",
    label: "Internal template",
    consequence:
      "It ships to the templates repo, and you publish it to Templates once it's verified.",
  },
  {
    id: "client",
    label: "Client project",
    consequence: "Canon asks which client it's for next.",
  },
  {
    id: "internal",
    label: "Internal tool",
    consequence: "It's AVEL's own software, built like a client project with you as the client.",
  },
];

export const DECISIONS: PendingDecisionDto[] = [
  {
    ...base(fleet, 1),
    kind: "proposal",
    ref: `proposal:${id(201)}`,
    owner: "metering",
    expiresAt: at(6 * DAY),
    reasonRequired: { approve: true, reject: true },
    rejectable: true,
    evidence: [{ label: "Spent", value: "$14.20 of $15" }],
    plain: {
      ...decisionPlain({
        kind: "proposal",
        proposalKind: "budget_increase",
        subject: "Quote form",
        reason: "The quote form needs a second try and its AI budget is nearly spent.",
      }),
      returned: returnedLine({
        verdict: "approved",
        boundVersion: 1,
        newVersion: 2,
        changedBy: "an agent",
      }),
    },
    previous: {
      ref: `proposal:${id(200)}`,
      verdict: "approved",
      optionLabel: "Raise to $18",
      boundVersion: "1",
      decidedAt: at(-3 * 60 * MINUTE),
      reason: "Worth one more try",
      tookEffect: false,
    },
    target: {
      proposalId: id(201),
      proposalKind: "budget_increase",
      subjectKey: "M3",
      moduleRunId: id(301),
      version: 2,
      choices: [
        {
          choice: "raise",
          label: "Raise to $20",
          consequence: "The quote form keeps going with a higher AI cap.",
          effect: "approve",
          recommended: true,
        },
        {
          choice: "park",
          label: "Park it",
          consequence: "The quote form stops until you look at it.",
          effect: "reject",
          recommended: false,
        },
      ],
      decidable: true,
    },
    budget: { scope: "module", moduleRef: "M3", fromMicros: 15_000_000, toMicros: 20_000_000 },
  },
  {
    ...base(null, 2),
    kind: "factory_change",
    ref: "factory_change:142",
    owner: "knowledge",
    plain: decisionPlain({
      kind: "factory_change",
      area: "skill",
      title: "Sharper form-validation skill",
    }),
    target: {
      changeId: "142",
      prNumber: 142,
      headSha: hex("a", 40),
      url: "https://github.com/avel/factory/pull/142",
      area: "skill",
      evalRun: {
        id: id(601),
        stage: "targeted",
        set: "role",
        aim: "improve",
        state: "done",
        headSha: hex("a", 40),
        tasks: 3,
        repeats: 2,
        primary: {
          metric: "first_attempt_pass",
          baseline: 0.67,
          candidate: 1,
          interval: { low: 0.05, high: 0.6 },
        },
        verdict: "improved",
        plain: "Passed first try on 3 of 3 tasks, was 2 of 3",
      },
    },
  },
  {
    ...base(controlRoom, 3),
    kind: "checkpoint",
    ref: `checkpoint:${id(401)}`,
    owner: "onboarding",
    reasonRequired: { approve: false, reject: true },
    rejectable: true,
    unlocks: "0.3 Mission and roster",
    plain: decisionPlain({
      kind: "checkpoint",
      checkpointName: "0.2 Breakdown",
      projectName: "Control room",
      next: "0.3 Mission and roster",
    }),
    target: { checkpointId: id(401), checkpoint: "0.2", version: 3, rowVersion: 4 },
  },
  {
    ...base(controlRoom, 4),
    kind: "plan_finalize",
    ref: `plan_finalize:${controlRoom.id}`,
    owner: "onboarding",
    plain: decisionPlain({ kind: "plan_finalize", projectName: "Control room", parts: 12 }),
    target: { missionId: controlRoom.id, planId: id(206), planVersion: 2 },
  },
  {
    ...base(field, 5),
    kind: "checkpoint_question",
    ref: `checkpoint_question:${id(501)}`,
    owner: "onboarding",
    unlocks: "0.1 What it is",
    plain: decisionPlain({
      kind: "checkpoint_question",
      question: "Is this a client project, or an internal template?",
      subjectLabel: "0.1 What it is",
      blocking: true,
    }),
    target: {
      questionId: id(501),
      rowVersion: 1,
      code: "Q-0.1a",
      text: "Is this a client project, or an internal template?",
      subject: { checkpoint: "0.1", moduleRef: null, risk: null, label: "0.1 What it is" },
      blocking: true,
      options: KIND_OPTIONS,
      recommended: "template",
      why: "You described a starter every field-service client would begin from, and no client is attached.",
      after: null,
    },
  },
  {
    ...base(booking, 6),
    kind: "pass_approval",
    ref: `pass_approval:${booking.id}`,
    owner: "gate",
    reasonRequired: { approve: true, reject: false },
    plain: decisionPlain({ kind: "pass_approval", projectName: "Booking fix", caps: 1 }),
    target: {
      missionId: booking.id,
      receiptId: id(701),
      receiptHash: `sha256:${hex("b")}`,
      verdictCaps: ["One slow page on older phones"],
    },
  },
  {
    ...base(spring, 7),
    kind: "release",
    ref: `release:${spring.id}`,
    owner: "delivery",
    plain: decisionPlain({
      kind: "release",
      projectName: "Spring launch site",
      verdict: "verified",
      method: "pr",
    }),
    target: {
      missionId: spring.id,
      receiptId: id(702),
      receiptHash: `sha256:${hex("c")}`,
      verdict: "verified",
      passApprovalId: null,
      commitSha: hex("5", 40),
      deliveryKind: "pr",
    },
  },
  {
    ...base(fleet, 8),
    kind: "dispatch_package_commit",
    ref: `dispatch_package_commit:${fleet.id}`,
    owner: "integrator",
    plain: decisionPlain({
      kind: "dispatch_package_commit",
      projectName: "Fleet portal",
      repoName: "GTS",
    }),
    target: { missionId: fleet.id, packageHash: hex("d") },
  },
  {
    ...base(null, 9),
    kind: "followup_send",
    ref: `followup_send:${id(801)}`,
    owner: "pipeline",
    rejectable: true,
    plain: decisionPlain({ kind: "followup_send", clientName: "Harbor Parts", channel: "copy" }),
    target: {
      followupId: id(801),
      draftHash: hex("e"),
      channel: "copy",
      draft:
        "Hi, following up on the parts catalogue we talked about. Want to pick a time this week?",
    },
  },
  {
    ...base(parts, 10),
    kind: "upkeep_offer",
    ref: `upkeep_offer:${id(802)}`,
    owner: "pipeline",
    rejectable: true,
    plain: decisionPlain({ kind: "upkeep_offer", clientName: "GTS Diesel", channel: "copy" }),
    target: {
      followupId: id(802),
      clientId: CLIENTS.gts.id,
      signals: ["Booking fix delivered 30 days ago", "Two dependency updates waiting"],
      draftHash: hex("f"),
      channel: "copy",
      draft: "Hi Dale, want us to keep the booking flow up to date each month?",
    },
  },
];

// ---------------------------------------------------------------- status, module, receipt, canon

export const ALERTS: AlertDto[] = [
  {
    key: `retry_3:${id(301)}`,
    kind: "retry_3",
    severity: "heads_up",
    missionId: fleet.id,
    plain: "The quote form is on its last try",
    since: at(-40 * MINUTE),
  },
  {
    key: `deadline_risk:${fleet.id}`,
    kind: "deadline_risk",
    severity: "heads_up",
    missionId: fleet.id,
    plain: "Fleet portal may miss its date",
    since: at(-2 * 60 * MINUTE),
  },
];

export const STATUS: StatusDto = {
  slots: { busy: 5, total: 6 },
  needsYouCount: DECISIONS.length,
  alerts: ALERTS,
  stallAfterMs: 600_000,
  lastSeq: 1200,
  at: at(0),
};

export const MODULE_RUN: ModuleRunViewDto = {
  missionId: fleet.id,
  moduleRunId: id(301),
  ref: "M3",
  name: "Quote form",
  workKind: "frontend",
  goal: "Drivers send a quote request from the job page",
  territory: ["src/features/quote/**"],
  requirements: 6,
  scenarios: 9,
  tests: { passed: 31, total: 38 },
  phase: "running",
  capMicros: 15_000_000,
  spentMicros: 14_200_000,
  decisionRef: `proposal:${id(201)}`,
  attempts: [
    {
      id: id(311),
      dispatchId: id(321),
      key: "a1",
      label: "Initial",
      agent: "Brennan",
      role: "build",
      model: "claude-sonnet-5-5",
      startedAt: at(-5 * 60 * MINUTE),
      endedAt: at(-4 * 60 * MINUTE),
      minutes: 58,
      costMicros: 3_900_000,
      result: "failed",
      summary: "Validation passed locally but two end-to-end checks failed on the date picker.",
    },
    {
      id: id(312),
      dispatchId: id(321),
      key: "a2",
      label: "Retry 1",
      agent: "Brennan",
      role: "build",
      model: "claude-sonnet-5-5",
      startedAt: at(-3 * 60 * MINUTE),
      endedAt: null,
      minutes: 41,
      costMicros: 2_700_000,
      result: "running",
      summary: null,
    },
  ],
  findings: [
    { id: id(331), ref: "F-7", title: "Date picker loses focus", state: "open", route: "rework" },
  ],
  plain: modulePlain({
    name: "Quote form",
    goal: "Drivers send a quote request from the job page",
    state: "retrying",
    retry: 1,
  }),
  rowVersion: 7,
};

export const STEPS: AgentStepDto[] = [
  {
    attemptId: id(312),
    traceSeq: 1,
    at: at(-30 * MINUTE),
    kind: "read",
    text: "Read the task doc and the two failing checks",
  },
  {
    attemptId: id(312),
    traceSeq: 2,
    at: at(-29 * MINUTE),
    kind: "think",
    text: "The date picker re-renders on every keystroke, so focus is lost",
  },
  {
    attemptId: id(312),
    traceSeq: 3,
    at: at(-25 * MINUTE),
    kind: "edit",
    text: "src/features/quote/DatePicker.tsx",
  },
  {
    attemptId: id(312),
    traceSeq: 4,
    at: at(-20 * MINUTE),
    kind: "test",
    text: "38 checks: 35 pass, 3 fail",
  },
];

/** The proof files' bytes; the artifacts' hashes are computed from them at load. */
export const ARTIFACT_FILES: Record<string, string> = {
  tests: "PASS 472 of 472 tests\n",
  acceptance: "Verified 9 of 9 acceptance examples\n",
  build: "Build ok\n",
  diff: "diff --git a/src/app.tsx b/src/app.tsx\n",
};

export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function buildReceipt(): Promise<ReceiptViewDto> {
  const keys = ["tests", "acceptance", "build", "diff"] as const;
  const artifacts = await Promise.all(
    keys.map(async (key) => ({
      key,
      label: { tests: "Tests", acceptance: "Acceptance", build: "Build", diff: "Changes" }[key],
      file: `proof/${key}.txt`,
      lang: key === "diff" ? "diff" : "text",
      proves: {
        tests: "Every test passed on the released commit",
        acceptance: "Each acceptance example was checked",
        build: "It builds from clean",
        diff: "What changed",
      }[key],
      sha256: await sha256Hex(ARTIFACT_FILES[key] ?? ""),
      bytes: new TextEncoder().encode(ARTIFACT_FILES[key] ?? "").length,
    })),
  );
  const receipt = {
    id: id(702),
    missionId: spring.id,
    gateRunId: id(703),
    version: 1,
    hash: "",
    verdict: "verified" as const,
    commitSha: hex("5", 40),
    factoryCommit: hex("3", 40),
    verdictCaps: [],
    body: {},
    humanMinutes: 95,
    aiTokens: 4_100_000,
    aiCostMicros: 38_400_000,
    vendors: ["anthropic"],
    overrideCount: 0,
    createdAt: at(-60 * MINUTE),
    target: { repo: "blume-spring", branch: "mission/spring-launch", commit: hex("5", 40) },
    plan: { version: 1, approvedAt: at(-6 * DAY) },
    modules: [
      { ref: "M1", name: "Hero and story", result: "landed" as const },
      { ref: "M2", name: "Signup form", result: "landed" as const },
    ],
    gates: [0, 1, 2, 3, 4, 5].map((g) => ({
      name: `Gate ${g}`,
      result: "pass" as const,
      decision: null,
    })),
    tests: { passed: 472, total: 472 },
    acceptance: { verified: 9, total: 9 },
    artifacts,
    signature: {
      by: "Gate 5" as const,
      key: "gate5-2026-11",
      alg: "Ed25519" as const,
      value: "c2FtcGxlLXNpZ25hdHVyZQ",
    },
    plain: receiptPlain({
      verdict: "verified",
      tests: { passed: 472, total: 472 },
      acceptance: { verified: 9, total: 9 },
      accepted: 0,
    }),
    verified: null,
  };
  const digest = [
    receipt.id,
    receipt.commitSha,
    receipt.verdict,
    receipt.createdAt,
    ...artifacts.map((a) => a.sha256),
  ].join("\n");
  receipt.hash = `sha256:${await sha256Hex(digest)}`;
  return receipt;
}

export const CANON_MESSAGES: CanonMessageDto[] = [
  {
    id: id(901),
    sessionId: id(910),
    seq: 1,
    clientMessageId: null,
    role: "canon",
    source: null,
    relayedBy: null,
    answersQuestionId: null,
    questionId: id(501),
    text: "Let's start with what this is. Is it for a client, or one of our own templates?",
    checkpoint: "0.1",
    status: "done",
    ttftMs: 410,
    totalMs: 1900,
    costMicros: 6_000,
    redactedAt: null,
    createdAt: at(-20 * MINUTE),
  },
  {
    id: id(902),
    sessionId: id(910),
    seq: 2,
    clientMessageId: id(920),
    role: "operator",
    source: "said",
    relayedBy: null,
    answersQuestionId: null,
    questionId: null,
    text: "It's a starter for field-service crews: jobs, photos, sign-off.",
    checkpoint: "0.1",
    status: "done",
    ttftMs: null,
    totalMs: null,
    costMicros: null,
    redactedAt: null,
    createdAt: at(-18 * MINUTE),
  },
];

export const LEADS: LeadDto[] = [
  {
    id: id(1001),
    clientId: CLIENTS.harbor.id,
    clientName: CLIENTS.harbor.name,
    source: "referral",
    referrerId: null,
    referrerName: "Dale at GTS Diesel",
    firstContactAt: at(-5 * DAY),
    notes: "Wants a parts catalogue",
    lostReason: null,
    lostAt: null,
    stage: "lead",
    createdAt: at(-5 * DAY),
    rowVersion: 1,
    updatedAt: at(-5 * DAY),
  },
];

export const FOLLOWUPS: FollowupDto[] = [
  {
    id: id(801),
    clientId: CLIENTS.harbor.id,
    missionId: null,
    kind: "followup",
    channel: "copy",
    draft:
      "Hi, following up on the parts catalogue we talked about. Want to pick a time this week?",
    draftHash: hex("e"),
    state: "drafted",
    sentAt: null,
    sentBy: null,
    unsubscribed: false,
    createdAt: at(-60 * MINUTE),
    rowVersion: 1,
    updatedAt: at(-60 * MINUTE),
  },
  {
    id: id(802),
    clientId: CLIENTS.gts.id,
    missionId: booking.id,
    kind: "upkeep",
    channel: "copy",
    draft: "Hi Dale, want us to keep the booking flow up to date each month?",
    draftHash: hex("f"),
    state: "drafted",
    sentAt: null,
    sentBy: null,
    unsubscribed: false,
    createdAt: at(-90 * MINUTE),
    rowVersion: 1,
    updatedAt: at(-90 * MINUTE),
  },
];

export const PIPELINE: PipelineDto = {
  stages: [
    { stage: "lead", count: 1 },
    { stage: "talking", count: 0 },
    { stage: "scoped", count: 0 },
    { stage: "building", count: 2 },
    { stage: "delivered", count: 0 },
    { stage: "upkeep", count: 0 },
    { stage: "lost", count: 0 },
  ],
  rows: [
    {
      clientId: CLIENTS.gts.id,
      clientName: "GTS Diesel",
      stage: "building",
      leadId: null,
      missionIds: [fleet.id, booking.id],
      lastActivityAt: at(-MINUTE),
      salesMinutes: 45,
      proofConsent: true,
      plain: "Two projects underway",
    },
    {
      clientId: CLIENTS.blume.id,
      clientName: "Blume Studio",
      stage: "building",
      leadId: null,
      missionIds: [spring.id],
      lastActivityAt: at(-60 * MINUTE),
      salesMinutes: 20,
      proofConsent: false,
      plain: "Ready to release",
    },
    {
      clientId: CLIENTS.harbor.id,
      clientName: "Harbor Parts",
      stage: "lead",
      leadId: id(1001),
      missionIds: [],
      lastActivityAt: at(-5 * DAY),
      salesMinutes: 15,
      proofConsent: false,
      plain: "Referred by GTS Diesel",
    },
  ],
};

export const SKILL_RESULTS: SkillResultsDto = {
  slug: "form-validation",
  versions: [
    {
      version: "3.2.0",
      current: true,
      attempts: 22,
      firstAttemptPass: 0.77,
      findings: 3,
      from: at(-14 * DAY),
      to: null,
    },
    {
      version: "3.1.0",
      current: false,
      attempts: 31,
      firstAttemptPass: 0.71,
      findings: 6,
      from: at(-45 * DAY),
      to: at(-14 * DAY),
    },
  ],
  baseline: {
    window: { from: at(-30 * DAY), to: at(0) },
    with: { attempts: 22, firstAttemptPass: 0.77 },
    without: { attempts: 40, firstAttemptPass: 0.69 },
    match: "role+workKind",
  },
  origin: {
    kind: "import",
    url: "https://github.com/example/skills",
    upstreamRef: "v3.0.0",
    license: "MIT",
    editionNote: "Trimmed for our form library",
    changesSinceImport: 2,
  },
};

const EVAL_SUMMARY = (DECISIONS[1] as Extract<PendingDecisionDto, { kind: "factory_change" }>)
  .target.evalRun as NonNullable<
  Extract<PendingDecisionDto, { kind: "factory_change" }>["target"]["evalRun"]
>;

export const EVAL_RUN: EvalRunDto = {
  ...EVAL_SUMMARY,
  baselineConfigHash: hex("6"),
  candidateConfigHash: hex("7"),
  aiCostMicros: 2_100_000,
  startedAt: at(-3 * 60 * MINUTE),
  finishedAt: at(-2 * 60 * MINUTE),
  results: [
    { taskId: id(611), repeat: 1, config: "baseline", passedFirstAttempt: true },
    { taskId: id(611), repeat: 1, config: "candidate", passedFirstAttempt: true },
  ],
};

export const TEMPLATE_SOURCE: TemplateSourceDto = {
  missionId: parts.id,
  name: "Parts catalogue",
  client: null,
  packageKey: "feature",
  stack: ["react", "hono", "postgres"],
  commit: hex("8", 40),
  tree: ["README.md", "src/app.tsx", "src/catalogue/list.tsx"],
  files: { "README.md": "# Parts catalogue\n", "src/app.tsx": "export function App() {}\n" },
};

export const TEMPLATE_DRAFT: TemplateDraftDto = {
  id: id(1101),
  sourceMissionId: parts.id,
  slug: "parts-catalogue",
  name: "Parts catalogue",
  pitch: "A searchable catalogue with categories, stock and a quote basket.",
  bestFor: "Suppliers with a few thousand parts",
  docs: { overview: "", use: [], avoid: [] },
  modules: ["Catalogue", "Search", "Quote basket"],
  state: "draft",
  prNumber: null,
  savedAt: at(-5 * MINUTE),
  createdAt: at(-DAY),
  rowVersion: 4,
  updatedAt: at(-5 * MINUTE),
};

export const PACKAGE_PLAIN = packagePlain({ projectName: "Fleet portal", repoName: "GTS" });

// ---------------------------------------------------------------- one event of every kind

const decisionItem = (owner: string) =>
  (DECISIONS.find((d) => d.owner === owner) ?? DECISIONS[0]) as PendingDecisionDto;

/** A payload for each kind, built from the world above. */
function payloadOf(kind: EventKind): unknown {
  const [prefix, object, verb] = kind.split(".") as [string, string, string];
  if (object === "decision") {
    const item = decisionItem(prefix);
    if (verb === "opened") return { item };
    if (verb === "returned") return { item: DECISIONS[0], previous: DECISIONS[0]?.previous };
    if (verb === "resolved") return { ref: item.ref, verdict: "approved", resolvedAt: at(0) };
    return { ref: item.ref, expiredAt: at(0) };
  }
  const change = {
    missionId: fleet.id,
    rowVersion: 4,
    state: fleet.state,
    displayState: fleet.displayState,
    plain: fleet.plain,
  };
  const p: Partial<Record<EventKind, unknown>> = {
    "missions.mission.created": {
      missionId: field.id,
      name: field.name,
      rowVersion: 1,
      plain: field.plain,
    },
    "missions.mission.changed": { ...change, deadline: fleet.deadline },
    "missions.mission.kind_set": {
      missionId: field.id,
      kind: "template",
      clientId: CLIENTS.avel.id,
      clientKind: "internal",
      templateSlug: "field-app",
      rowVersion: 2,
    },
    "missions.mission.paused": { ...change, pauseId: id(1201), kind: "operator" },
    "missions.mission.resumed": { ...change, pauseId: id(1201) },
    "missions.mission.cancelled": change,
    "missions.mission.closed": change,
    "onboarding.session.changed": {
      missionId: field.id,
      sessionId: id(910),
      stage: "discovery",
      status: "active",
      progressPct: 20,
      rowVersion: 3,
    },
    "onboarding.message.created": { missionId: field.id, message: CANON_MESSAGES[1] },
    "onboarding.message.updated": { missionId: field.id, message: CANON_MESSAGES[0] },
    "onboarding.fact.proposed": {
      missionId: field.id,
      messageId: id(902),
      facts: [
        {
          factId: id(1301),
          text: "Crews sign off jobs on site",
          source: "said",
          status: "proposed",
          relayedBy: null,
          messageId: id(902),
          span: [0, 40],
          uploadId: null,
          uploadName: null,
          page: null,
          repoRef: null,
          scanFlagged: false,
          rowVersion: 1,
        },
      ],
    },
    "onboarding.fact.changed": {
      missionId: field.id,
      factId: id(1301),
      status: "confirmed",
      rowVersion: 2,
    },
    "onboarding.checkpoint.changed": {
      missionId: controlRoom.id,
      checkpointId: id(401),
      checkpoint: "0.2",
      state: "draft",
      version: 3,
      rowVersion: 4,
    },
    "onboarding.question.changed": {
      missionId: field.id,
      questionId: id(501),
      answered: false,
      rowVersion: 1,
    },
    "onboarding.plan.finalized": { missionId: controlRoom.id, planId: id(206), planVersion: 2 },
    "factory.module.changed": {
      missionId: fleet.id,
      moduleRunId: id(301),
      moduleRef: "M3",
      state: "retrying",
      spentMicros: 14_200_000,
      capMicros: 15_000_000,
      tests: MODULE_RUN.tests,
      plain: MODULE_RUN.plain,
      rowVersion: 7,
    },
    "factory.dispatch.changed": {
      missionId: fleet.id,
      dispatchId: id(321),
      moduleRunId: id(301),
      state: "running",
      plain: { summary: "Builds it for Quote form", role: "Builds it", step: "Working" },
      rowVersion: 5,
    },
    "factory.task_doc.rendered": { missionId: fleet.id, dispatchId: id(321), version: 2 },
    "factory.dispatch_package.rendered": {
      missionId: fleet.id,
      planVersion: 1,
      packageHash: hex("d"),
    },
    "runner.attempt.started": {
      missionId: fleet.id,
      dispatchId: id(321),
      attemptId: id(312),
      n: 2,
    },
    "runner.attempt.ended": {
      missionId: fleet.id,
      dispatchId: id(321),
      attemptId: id(311),
      outcome: "failed",
      costMicros: 3_900_000,
    },
    "integrator.commit.changed": {
      missionId: fleet.id,
      integrationCommitId: id(1401),
      moduleRunId: id(301),
      state: "testing",
      commitSha: null,
    },
    "integrator.tests.locked": { missionId: fleet.id, moduleRunId: id(301) },
    "integrator.dispatch_package.committed": {
      missionId: fleet.id,
      packageHash: hex("d"),
      sha: hex("9", 40),
    },
    "gate.evaluation.recorded": {
      missionId: fleet.id,
      gate: 2,
      gateEvaluationId: id(1501),
      moduleRunId: id(301),
      result: "failed",
    },
    "gate.finding.changed": {
      missionId: fleet.id,
      findingId: id(331),
      state: "confirmed",
      rowVersion: 2,
    },
    "gate.receipt.issued": {
      missionId: spring.id,
      receiptId: id(702),
      verdict: "verified",
      hash: `sha256:${hex("c")}`,
    },
    "gate.pass.approved": { missionId: booking.id, passApprovalId: id(1601), receiptId: id(701) },
    "gate.override.recorded": { missionId: fleet.id, overrideId: id(1701), gate: 3 },
    "delivery.release.approved": {
      missionId: spring.id,
      releaseApprovalId: id(1801),
      receiptId: id(702),
    },
    "delivery.dispatch_package.built": {
      missionId: fleet.id,
      packageHash: hex("d"),
      archiveSha256: hex("0"),
      bytes: 48_211,
    },
    "metering.spend.updated": {
      missionId: fleet.id,
      moduleRunId: id(301),
      attemptId: id(312),
      spentMicros: 14_200_000,
      budgetMicros: 15_000_000,
    },
    "metering.budget.warned": { missionId: fleet.id, moduleRunId: id(301), pct: 95 },
    "metering.budget.increased": {
      missionId: fleet.id,
      moduleRunId: id(301),
      budgetMicros: 20_000_000,
    },
    "knowledge.change.opened": { changeId: "142", prNumber: 142, headSha: hex("a", 40) },
    "knowledge.change.updated": { changeId: "142", headSha: hex("b", 40) },
    "knowledge.change.closed": { changeId: "142", merged: true },
    "knowledge.release.cut": { version: "2026.11.2", factoryCommit: hex("3", 40) },
    "evals.run.started": { run: { ...EVAL_RUN, state: "running", verdict: null } },
    "evals.run.finished": {
      run: (DECISIONS[1] as Extract<PendingDecisionDto, { kind: "factory_change" }>).target.evalRun,
    },
    "pipeline.lead.created": { leadId: id(1001), clientId: CLIENTS.harbor.id },
    "pipeline.lead.closed": { leadId: id(1001), clientId: CLIENTS.harbor.id, lostReason: "timing" },
    "pipeline.followup.sent": { followupId: id(801), clientId: CLIENTS.harbor.id, sentBy: "you" },
    "system.alert.raised": { alert: ALERTS[0] },
    "system.alert.cleared": { key: ALERTS[0]?.key, clearedAt: at(0) },
  };
  return p[kind];
}

/** The two kinds whose payload needs an async-built object. */
export async function sampleEvents(): Promise<EventDto[]> {
  const receipt = await buildReceipt();
  return EventKinds.map((kind, i) => {
    let payload = payloadOf(kind);
    if (kind === "gate.finding.created") {
      payload = { finding: FINDING };
    }
    if (kind === "delivery.delivery.changed") {
      payload = { delivery: { ...DELIVERY, receiptId: receipt.id } };
    }
    return {
      seq: 1001 + i,
      schemaVersion: 1,
      kind,
      at: at(i * 1000),
      missionId: null,
      dispatchId: null,
      attemptId: null,
      payload,
    } as EventDto;
  });
}

export const FINDING = {
  id: id(331),
  missionId: fleet.id,
  checkpointId: null,
  moduleRunId: id(301),
  source: "review" as const,
  sourceRole: "review-frontend",
  checkId: "CK12",
  targetRef: "src/features/quote/DatePicker.tsx",
  evidence: { citedRequirements: ["R-3"], citedScenarios: ["S-5"] },
  kind: "requirement" as const,
  route: "rework" as const,
  state: "open" as const,
  tries: 1,
  reviewedCommit: hex("2", 40),
  reason: null,
  decidedByKind: null,
  decidedByUserId: null,
  decidedByAttemptId: null,
  fixedByCheck: null,
  decidedAt: null,
  createdAt: at(-2 * 60 * MINUTE),
  rowVersion: 1,
  updatedAt: at(-2 * 60 * MINUTE),
  moduleRef: "M3",
  citedRequirements: ["R-3"],
  citedScenarios: ["S-5"],
  cappedAtPass: false,
};

export const DELIVERY = {
  id: id(1901),
  missionId: spring.id,
  releaseApprovalId: id(1801),
  receiptId: id(702),
  repoConnectionId: null,
  kind: "pr" as const,
  commitSha: hex("5", 40),
  ref: "https://github.com/blume/spring/pull/12",
  state: "recorded" as const,
  error: null,
  recordedAt: at(-30 * MINUTE),
  createdAt: at(-40 * MINUTE),
  rowVersion: 2,
  updatedAt: at(-30 * MINUTE),
  prNumber: 12,
  prUrl: "https://github.com/blume/spring/pull/12",
  mergedAt: null,
  target: "blume/spring",
};

// ---------------------------------------------------------------- the mission state module

/**
 * The mission state module (CR-W31 part a): the missions the mock's routes make and move, one
 * record each. The routes check a move first (404, 422 with the allowed moves, 409 when stale)
 * and then call one of the moves below, which assume it's allowed. Everything else is computed
 * from the record, so a read never changes it: the mission's DTOs, and its route 52 rows.
 *
 * The walk, in the contract's MissionState order:
 * - `draft`: a name, no kind; Canon's first question (Q-0.1a) is open (route 20, CR-W22).
 * - `onboarding`: checkpoints 0.1 to 0.4, one draft at a time (route 40); then the plan.
 * - finalize (route 28): `approved`, and the render, so `rendered` with Gate 1 passed.
 * - the package commit (route 114), then `running`.
 * - Gate 5: a pass is `deciding` until its pass approval (route 29); a verified receipt goes
 *   straight to `awaiting_release`.
 * - release (route 30): `delivering`, then `delivered`.
 * The moves no part (a) route makes (Canon starting the interview, the build, Gate 5's
 * receipt, the delivery) are made only by `seedMission`.
 */

export const MISSION_STAGES = [
  "draft",
  "0.1",
  "0.2",
  "0.3",
  "0.4",
  "finalized",
  "building",
  "gate5",
  "awaiting_release",
  "delivered",
] as const;
export type MissionStage = (typeof MISSION_STAGES)[number];

type Key = "0.1" | "0.2" | "0.3" | "0.4";
const KEYS: readonly Key[] = ["0.1", "0.2", "0.3", "0.4"];
const CHECKPOINT_NAMES: Record<Key, string> = {
  "0.1": "0.1 What it is",
  "0.2": "0.2 Breakdown",
  "0.3": "0.3 Mission and roster",
  "0.4": "0.4 Context",
};

/** The plan's parts once it's rendered; route 108 serves the sample world's module M3. */
const PLAN_MODULES = 3;

export interface LiveMission {
  /** The stored columns; `displayState`, `plain`, `deadline` and `clientMain` are computed. */
  mission: MissionDto;
  sessionId: string;
  /** Route 20's client page, if any (CR-W22: Q-0.1a then recommends a client project). */
  startedFrom: { id: string; name: string } | null;
  /** Set with the kind when Q-0.1a is answered. */
  client: { id: string; name: string } | null;
  question: QuestionDto;
  checkpoints: CheckpointDto[];
  plan: { id: string; version: number };
  packageHash: string;
  packageCommit: DispatchPackageCommitDto | null;
  receipt: { id: string; hash: string; verdict: "verified" | "pass"; caps: string[] } | null;
  passApproval: PassApprovalDto | null;
  release: ReleaseApprovalDto | null;
  moduleRunId: string;
  /** When the step now waiting on you opened: its route 52 row's `createdAt`. */
  openedAt: string;
}

export interface Ctx {
  /** A new UUIDv7. */
  ids: () => string;
  /** Now, as an ISO time. */
  at: string;
}

// ---------------------------------------------------------------- making one

/** Route 20: a draft with a name, and Q-0.1a open. */
export function newMission(
  ctx: Ctx,
  opts: { id?: string; name: string; startedFrom: { id: string; name: string } | null },
): LiveMission {
  const id = opts.id ?? ctx.ids();
  const sessionId = ctx.ids();
  const { at } = ctx;
  return {
    mission: {
      id,
      name: opts.name,
      clientId: null,
      state: "draft",
      packageKey: null,
      packageVersion: null,
      budgetMicros: 150_000_000,
      reservedMicros: 0,
      spentMicros: 0,
      planId: null,
      planState: null,
      repoConnectionId: null,
      pinnedCommit: null,
      branchHead: null,
      factoryCommit: null,
      rosterVersion: null,
      kbRelease: null,
      rulesVersion: null,
      gate5Failures: 0,
      onboardingStartedAt: null,
      approvedAt: null,
      renderedAt: null,
      deliveredAt: null,
      closedAt: null,
      cancelledAt: null,
      kind: null,
      clientKind: null,
      templateSlug: null,
      leadId: null,
      followsDeliveryId: null,
      designSystemSlug: null,
      designSystemVersion: null,
      createdAt: at,
      rowVersion: 1,
      updatedAt: at,
      displayState: "draft",
      plain: { summary: opts.name },
      deadline: deadlineOf(null),
      clientMain: { pinnedCommit: null, latestCommit: null, moved: false },
    },
    sessionId,
    startedFrom: opts.startedFrom,
    client: null,
    question: {
      id: ctx.ids(),
      sessionId,
      stage: "opener",
      text: "Is this a client project, or an internal template?",
      options: KIND_OPTIONS,
      recommended: opts.startedFrom ? "client" : null,
      answer: null,
      answeredAt: null,
      blocking: true,
      moduleLabel: null,
      code: "Q-0.1a",
      subjectCheckpoint: "0.1",
      subjectRisk: null,
      why: opts.startedFrom
        ? `You started it from ${opts.startedFrom.name}'s page.`
        : "Canon asks this first, for every new project.",
      afterQuestionId: null,
      afterChoice: null,
      answerSource: null,
      createdAt: at,
      rowVersion: 1,
      updatedAt: at,
    },
    checkpoints: [],
    plan: { id: ctx.ids(), version: 1 },
    packageHash: hex("4"),
    packageCommit: null,
    receipt: null,
    passApproval: null,
    release: null,
    moduleRunId: ctx.ids(),
    openedAt: at,
  };
}

/**
 * The world's one internal client (AVEL) and one mission, at `stage`: a draft made the way
 * route 20 makes one, then walked by the same moves the routes make, so a seeded mission is
 * the one the routes would have left.
 */
export function seedMission(
  ctx: Ctx,
  id: string,
  stage: MissionStage,
  operatorId: string,
): LiveMission {
  const m = newMission(ctx, { id, name: "Ops console", startedFrom: null });
  m.question.recommended = "internal";
  m.question.why = "It's for AVEL itself, so it belongs to the internal client.";
  if (stage === "draft") return m;
  answerQuestion(m, ctx, "internal", undefined);
  startOnboarding(m, ctx);
  for (const key of KEYS) {
    if (stage === key) return m;
    const open = openCheckpoint(m);
    if (open) approveCheckpoint(m, ctx, open, operatorId);
  }
  finalize(m, ctx);
  if (stage === "finalized") return m;
  commitPackage(m, ctx);
  startBuilding(m, ctx);
  if (stage === "building") return m;
  issueReceipt(m, ctx, stage === "gate5" ? "pass" : "verified");
  if (stage === "gate5" || stage === "awaiting_release") return m;
  release(m, ctx, operatorId);
  deliver(m, ctx);
  return m;
}

// ---------------------------------------------------------------- the moves

function moved(m: LiveMission, ctx: Ctx, state?: MissionState) {
  if (state !== undefined) m.mission.state = state;
  m.mission.rowVersion += 1;
  m.mission.updatedAt = ctx.at;
  m.openedAt = ctx.at;
}

/**
 * Route 44 on Q-0.1a: an option, or `other` in your own words. Internal tool and internal
 * template set the kind with the internal client; a client project sets it with the client
 * route 20 started from. With no client known, the kind stays unset: asking which client is
 * Q-0.1b, which isn't in part (a).
 */
export function answerQuestion(
  m: LiveMission,
  ctx: Ctx,
  choice: string,
  answer: string | undefined,
): QuestionDto {
  const q = m.question;
  Object.assign(q, {
    answer: choice === "other" ? (answer ?? null) : choice,
    answerSource: choice === "other" ? "own_words" : "option",
    answeredAt: ctx.at,
    rowVersion: q.rowVersion + 1,
    updatedAt: ctx.at,
  } satisfies Partial<QuestionDto>);
  const avel = CLIENTS.avel;
  const client =
    choice === "internal" || choice === "template"
      ? {
          kind: choice as "internal" | "template",
          id: avel.id,
          name: avel.name,
          clientKind: "internal" as const,
        }
      : choice === "client" && m.startedFrom
        ? { kind: "client" as const, ...m.startedFrom, clientKind: "client" as const }
        : null;
  if (client) {
    m.client = { id: client.id, name: client.name };
    Object.assign(m.mission, {
      kind: client.kind,
      clientId: client.id,
      clientKind: client.clientKind,
    } satisfies Partial<MissionDto>);
  }
  moved(m, ctx);
  return structuredClone(q);
}

/** Canon starts the interview (seed only): `onboarding`, with checkpoint 0.1 drafted. */
function startOnboarding(m: LiveMission, ctx: Ctx) {
  m.mission.onboardingStartedAt = ctx.at;
  m.mission.factoryCommit = hex("3", 40);
  m.checkpoints.push(draftCheckpoint(m, ctx, "0.1"));
  moved(m, ctx, "onboarding");
}

function draftCheckpoint(m: LiveMission, ctx: Ctx, key: Key): CheckpointDto {
  return {
    id: ctx.ids(),
    missionId: m.mission.id,
    sessionId: m.sessionId,
    checkpoint: key,
    version: 1,
    sections: [],
    rubric: [],
    state: "draft",
    staleModuleLabels: [],
    approvedAt: null,
    approvedBy: null,
    createdAt: ctx.at,
    rowVersion: 1,
    updatedAt: ctx.at,
  };
}

/** The checkpoint waiting on you: the one draft, when the mission is onboarding. */
export function openCheckpoint(m: LiveMission): CheckpointDto | null {
  if (m.mission.state !== "onboarding") return null;
  return m.checkpoints.find((c) => c.state === "draft") ?? null;
}

/** Route 40: approved; Canon drafts the next one, or after 0.4 the plan waits on you. */
export function approveCheckpoint(
  m: LiveMission,
  ctx: Ctx,
  cp: CheckpointDto,
  operatorId: string,
): CheckpointDto {
  Object.assign(cp, {
    state: "approved",
    approvedAt: ctx.at,
    approvedBy: operatorId,
    rowVersion: cp.rowVersion + 1,
    updatedAt: ctx.at,
  } satisfies Partial<CheckpointDto>);
  const next = KEYS[KEYS.indexOf(cp.checkpoint as Key) + 1];
  if (next !== undefined) m.checkpoints.push(draftCheckpoint(m, ctx, next));
  m.openedAt = ctx.at;
  return structuredClone(cp);
}

/** All four checkpoints approved, the kind set, and the plan not yet approved. */
export function canFinalize(m: LiveMission): boolean {
  return (
    m.mission.state === "onboarding" &&
    m.mission.kind !== null &&
    KEYS.every((key) => m.checkpoints.some((c) => c.checkpoint === key && c.state === "approved"))
  );
}

/**
 * Route 28, approval #1: `approved`, then the render runs and Gate 1 passes, so it answers
 * `rendered` with the package waiting on its commit. The deadline clock starts.
 */
export function finalize(m: LiveMission, ctx: Ctx): MissionDto {
  Object.assign(m.mission, {
    approvedAt: ctx.at,
    renderedAt: ctx.at,
    planId: m.plan.id,
    planState: "approved",
    packageKey: "custom",
    packageVersion: "1",
    rosterVersion: "1",
    kbRelease: "2026.11.2",
    rulesVersion: "1",
    branchHead: hex("2", 40),
  } satisfies Partial<MissionDto>);
  moved(m, ctx, "rendered");
  return missionDto(m);
}

/** Route 114: the integrator commits the package to the mission branch. */
export function commitPackage(m: LiveMission, ctx: Ctx): DispatchPackageCommitDto {
  m.packageCommit = {
    missionId: m.mission.id,
    packageHash: m.packageHash,
    state: "committing",
    confirmedAt: ctx.at,
  };
  m.openedAt = ctx.at;
  return structuredClone(m.packageCommit);
}

/** The package landed and the scheduler starts the build (seed only). */
function startBuilding(m: LiveMission, ctx: Ctx) {
  if (m.packageCommit) m.packageCommit.state = "committed";
  moved(m, ctx, "running");
}

/** Gate 5 issues the receipt (seed only): a pass waits on its approval, verified on release. */
function issueReceipt(m: LiveMission, ctx: Ctx, verdict: "verified" | "pass") {
  m.receipt = {
    id: ctx.ids(),
    hash: `sha256:${hex(verdict === "pass" ? "5" : "6")}`,
    verdict,
    caps: verdict === "pass" ? ["One slow page on older phones"] : [],
  };
  moved(m, ctx, verdict === "pass" ? "deciding" : "awaiting_release");
}

/** Route 29: the pass is accepted with a reason, and the release waits on you. */
export function approvePass(
  m: LiveMission,
  ctx: Ctx,
  reason: string,
  operatorId: string,
): PassApprovalDto {
  const receipt = m.receipt as NonNullable<LiveMission["receipt"]>;
  m.passApproval = {
    id: ctx.ids(),
    receiptId: receipt.id,
    receiptHash: receipt.hash,
    receiptVerdict: receipt.verdict,
    reason,
    userId: operatorId,
    approvedAt: ctx.at,
    createdAt: ctx.at,
  };
  moved(m, ctx, "awaiting_release");
  return structuredClone(m.passApproval);
}

/** Route 30, approval #2: the exact commit the receipt names goes out (`delivering`). */
export function release(m: LiveMission, ctx: Ctx, operatorId: string): ReleaseApprovalDto {
  const receipt = m.receipt as NonNullable<LiveMission["receipt"]>;
  m.release = {
    id: ctx.ids(),
    missionId: m.mission.id,
    receiptId: receipt.id,
    receiptHash: receipt.hash,
    receiptVerdict: receipt.verdict,
    passApprovalId: m.passApproval?.id ?? null,
    userId: operatorId,
    approvedAt: ctx.at,
    createdAt: ctx.at,
  };
  moved(m, ctx, "delivering");
  return structuredClone(m.release);
}

/** The delivery is recorded (seed only). */
function deliver(m: LiveMission, ctx: Ctx) {
  m.mission.deliveredAt = ctx.at;
  moved(m, ctx, "delivered");
}

/**
 * INVALID_TRANSITION's `allowed`: the states the mission can move to now, by a part (a) route.
 * Empty when nothing it waits on is a mission move (a checkpoint, Q-0.1a, the package).
 */
export function allowedMoves(m: LiveMission): MissionState[] {
  if (canFinalize(m)) return ["approved"];
  if (m.mission.state === "deciding" && m.receipt?.verdict === "pass" && !m.passApproval)
    return ["awaiting_release"];
  if (m.mission.state === "awaiting_release" && !m.release) return ["delivering"];
  return [];
}

// ---------------------------------------------------------------- what the routes read

function deadlineOf(approvedAt: string | null): MissionDto["deadline"] {
  return {
    dueAt: approvedAt === null ? null : new Date(Date.parse(approvedAt) + 14 * DAY).toISOString(),
    startedAt: approvedAt,
    paused: false,
    pausedSince: null,
    pausedFor: null,
    atRisk: false,
  };
}

function modulesOf(m: LiveMission): MissionListRowDto["modules"] {
  const state = m.mission.state;
  if (m.mission.planId === null) return { total: 0, landed: 0, running: 0, parked: 0 };
  if (state === "rendered") return { total: PLAN_MODULES, landed: 0, running: 0, parked: 0 };
  if (state === "running") return { total: PLAN_MODULES, landed: 1, running: 1, parked: 0 };
  return { total: PLAN_MODULES, landed: PLAN_MODULES, running: 0, parked: 0 };
}

/** The gate strip (CR-W18 section 5), from the mission's state. */
function missionGatesOf(m: LiveMission): GateStripItem[] {
  const passed = {
    draft: 0,
    onboarding: 0,
    approved: 1,
    rendered: 2,
    running: 2,
    reviewing: 4,
    deciding: 6,
    awaiting_release: 6,
    refreshing: 6,
    delivering: 6,
    delivered: 6,
    closed: 6,
    cancelled: 0,
  }[m.mission.state];
  const running =
    m.mission.state === "onboarding"
      ? [0]
      : m.mission.state === "running"
        ? [2, 3]
        : m.mission.state === "reviewing"
          ? [4]
          : [];
  const modules = modulesOf(m);
  return [0, 1, 2, 3, 4, 5].map((gate) => ({
    gate,
    state: gate < passed ? "passed" : running.includes(gate) ? "running" : "pending",
    runs: gate === 2 || gate === 3 ? "per_job" : "once",
    counts:
      gate === 2 || gate === 3
        ? { landed: modules.landed, total: modules.total, running: running.includes(gate) ? 1 : 0 }
        : null,
  }));
}

/** Route 21's and route 28's mission, with its computed fields. */
export function missionDto(m: LiveMission): MissionDto {
  const modules = modulesOf(m);
  const mission = structuredClone(m.mission);
  return {
    ...mission,
    displayState: mission.state,
    plain: missionPlain({
      name: mission.name,
      clientName: mission.kind === "client" ? (m.client?.name ?? null) : null,
      kind: mission.kind,
      displayState: mission.state,
      modules,
      needsYouCount: pendingRows(m).length,
    }),
    deadline: deadlineOf(mission.approvedAt),
    clientMain: { pinnedCommit: mission.pinnedCommit, latestCommit: null, moved: false },
  };
}

/** Route 19's row. */
export function listRow(m: LiveMission): MissionListRowDto {
  const dto = missionDto(m);
  const modules = modulesOf(m);
  return {
    id: dto.id,
    name: dto.name,
    rowVersion: dto.rowVersion,
    kind: dto.kind,
    templateSlug: dto.templateSlug,
    client: dto.kind === "client" && m.client ? { ...m.client } : null,
    package: dto.packageKey === null ? null : "custom",
    state: dto.state,
    displayState: dto.displayState,
    plain: dto.plain,
    gates: missionGatesOf(m),
    modules,
    needsYouCount: pendingRows(m).length,
    runningDispatches: modules.running,
    deadline: dto.deadline,
    lastEventAt: dto.updatedAt,
  };
}

/** Route 21. */
export function detail(m: LiveMission): MissionDetailDto {
  const onboarded = m.mission.planId !== null;
  const approved = m.checkpoints.filter((c) => c.state === "approved").length;
  const q = m.question;
  return {
    mission: missionDto(m),
    gates: missionGatesOf(m),
    onboarding: {
      session: null,
      progressPct: onboarded ? 100 : Math.min(95, approved * 20),
      checkpoints: [
        ...KEYS.map((key) => {
          const c = m.checkpoints.find((x) => x.checkpoint === key);
          return {
            key,
            checkpointId: c?.id ?? null,
            state: c?.state ?? ("locked" as const),
            version: c?.version ?? null,
            approvedAt: c?.approvedAt ?? null,
          };
        }),
        {
          key: "final" as const,
          checkpointId: null,
          state: onboarded ? "approved" : canFinalize(m) ? "draft" : "locked",
          version: onboarded || canFinalize(m) ? m.plan.version : null,
          approvedAt: m.mission.approvedAt,
        },
      ],
      blockers:
        q.answeredAt === null
          ? [{ kind: "question", ref: `checkpoint_question:${q.id}`, text: q.text, targetId: q.id }]
          : [],
      topics: [],
      canonSpentMicros: 0,
      operatorMinutes: 0,
    },
    checkpoints: structuredClone(m.checkpoints),
    deliveries: [],
  };
}

/** Route 108: the sample module page, on this mission, once the plan has made its modules. */
export function moduleRun(m: LiveMission, moduleRef: string): ModuleRunViewDto | null {
  if (m.mission.planId === null || moduleRef !== MODULE_RUN.ref) return null;
  return {
    ...structuredClone(MODULE_RUN),
    missionId: m.mission.id,
    moduleRunId: m.moduleRunId,
    decisionRef: null,
  };
}

// ---------------------------------------------------------------- route 52's rows

/** What waits on you for this mission, as route 52's rows: at most one at a time here. */
export function pendingRows(m: LiveMission): PendingDecisionDto[] {
  const mission = {
    id: m.mission.id,
    name: m.mission.name,
    kind: m.mission.kind,
    clientName: m.mission.kind === "client" ? (m.client?.name ?? null) : null,
  };
  const common = {
    mission,
    createdAt: m.openedAt,
    expiresAt: null,
    asOfSeq: 0,
    evidence: [],
    reasonRequired: { approve: false, reject: false },
    rejectable: false,
    unlocks: null,
    previous: null,
  };
  const projectName = m.mission.name;
  const rows: PendingDecisionDto[] = [];
  const q = m.question;
  if (q.answeredAt === null) {
    const label = CHECKPOINT_NAMES["0.1"];
    rows.push({
      ...common,
      kind: "checkpoint_question",
      ref: `checkpoint_question:${q.id}`,
      owner: "onboarding",
      unlocks: label,
      plain: decisionPlain({
        kind: "checkpoint_question",
        question: q.text,
        subjectLabel: label,
        blocking: q.blocking,
      }),
      target: {
        questionId: q.id,
        rowVersion: q.rowVersion,
        code: q.code,
        text: q.text,
        subject: { checkpoint: "0.1", moduleRef: null, risk: null, label },
        blocking: q.blocking,
        options: KIND_OPTIONS,
        recommended: q.recommended,
        why: q.why,
        after: null,
      },
    });
  }
  const cp = openCheckpoint(m);
  if (cp) {
    const key = cp.checkpoint as Key;
    const next = KEYS[KEYS.indexOf(key) + 1];
    const nextName = next === undefined ? "the plan" : CHECKPOINT_NAMES[next];
    rows.push({
      ...common,
      kind: "checkpoint",
      ref: `checkpoint:${cp.id}`,
      owner: "onboarding",
      reasonRequired: { approve: false, reject: true },
      rejectable: true,
      unlocks: nextName,
      plain: decisionPlain({
        kind: "checkpoint",
        checkpointName: CHECKPOINT_NAMES[key],
        projectName,
        next: nextName,
      }),
      target: {
        checkpointId: cp.id,
        checkpoint: cp.checkpoint,
        version: cp.version,
        rowVersion: cp.rowVersion,
      },
    });
  }
  if (canFinalize(m)) {
    rows.push({
      ...common,
      kind: "plan_finalize",
      ref: `plan_finalize:${m.mission.id}`,
      owner: "onboarding",
      plain: decisionPlain({ kind: "plan_finalize", projectName, parts: PLAN_MODULES }),
      target: { missionId: m.mission.id, planId: m.plan.id, planVersion: m.plan.version },
    });
  }
  if (m.mission.state === "rendered" && m.packageCommit === null) {
    rows.push({
      ...common,
      kind: "dispatch_package_commit",
      ref: `dispatch_package_commit:${m.mission.id}`,
      owner: "integrator",
      plain: decisionPlain({
        kind: "dispatch_package_commit",
        projectName,
        repoName: m.client?.name ?? "AVEL",
      }),
      target: { missionId: m.mission.id, packageHash: m.packageHash },
    });
  }
  const receipt = m.receipt;
  if (m.mission.state === "deciding" && receipt?.verdict === "pass" && !m.passApproval) {
    rows.push({
      ...common,
      kind: "pass_approval",
      ref: `pass_approval:${m.mission.id}`,
      owner: "gate",
      reasonRequired: { approve: true, reject: false },
      plain: decisionPlain({ kind: "pass_approval", projectName, caps: receipt.caps.length }),
      target: {
        missionId: m.mission.id,
        receiptId: receipt.id,
        receiptHash: receipt.hash,
        verdictCaps: [...receipt.caps],
      },
    });
  }
  if (m.mission.state === "awaiting_release" && receipt && !m.release) {
    rows.push({
      ...common,
      kind: "release",
      ref: `release:${m.mission.id}`,
      owner: "delivery",
      plain: decisionPlain({
        kind: "release",
        projectName,
        verdict: receipt.verdict,
        method: "zip",
      }),
      target: {
        missionId: m.mission.id,
        receiptId: receipt.id,
        receiptHash: receipt.hash,
        verdict: receipt.verdict,
        passApprovalId: m.passApproval?.id ?? null,
        commitSha: m.mission.branchHead ?? hex("2", 40),
        deliveryKind: "zip",
      },
    });
  }
  return rows;
}

/** The mission's one row of `kind`, for a 409's `current`. */
export function rowOf<K extends PendingDecisionDto["kind"]>(
  m: LiveMission,
  kind: K,
): Extract<PendingDecisionDto, { kind: K }> | undefined {
  return pendingRows(m).find((r): r is Extract<PendingDecisionDto, { kind: K }> => r.kind === kind);
}
