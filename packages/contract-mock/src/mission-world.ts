import {
  type CheckpointDto,
  type DispatchPackageCommitDto,
  decisionPlain,
  type GateStripItem,
  type MissionDetailDto,
  type MissionDto,
  type MissionListRowDto,
  type MissionState,
  type ModuleRunViewDto,
  missionPlain,
  type PassApprovalDto,
  type PendingDecisionDto,
  type QuestionDto,
  type ReleaseApprovalDto,
} from "@avel/contract";
import * as world from "#world";

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

const DAY = 24 * 60 * 60_000;
const hex = (c: string, n = 64) => c.repeat(n);

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
      options: world.KIND_OPTIONS,
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
  const avel = world.CLIENTS.avel;
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
function gatesOf(m: LiveMission): GateStripItem[] {
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
    gates: gatesOf(m),
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
    gates: gatesOf(m),
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
  if (m.mission.planId === null || moduleRef !== world.MODULE_RUN.ref) return null;
  return {
    ...structuredClone(world.MODULE_RUN),
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
        options: world.KIND_OPTIONS,
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
