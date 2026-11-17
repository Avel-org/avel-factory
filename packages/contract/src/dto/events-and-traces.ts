import * as z from "zod/mini";
import type * as core from "zod/v4/core";
import { type DecisionEventKind, DecisionOwner, EventKind } from "../events.js";
import {
  AgentTraceKind,
  AttemptOutcome,
  Checkpoint,
  CheckpointState,
  ClientKind,
  DispatchState,
  FactStatus,
  FindingState,
  FollowupSentBy,
  GateEvaluationResult,
  IntegrationCommitState,
  LeadLostReason,
  MissionDisplayState,
  MissionPauseKind,
  MissionState,
  OnboardingSessionStatus,
  ProjectKind,
  ReceiptVerdict,
  Stage,
} from "../value-lists.js";
import { IsoTime, Micros, Uuid } from "./common.js";
import { PendingDecisionDto, PreviousDecision } from "./decisions.js";
import { EvalRunSummaryDto } from "./evals.js";
import { FactLineDto } from "./gate0.js";
import { FindingDto } from "./gates.js";
import { AlertDto } from "./health.js";
import { CanonMessageDto, DeadlineClock } from "./missions.js";
import { DispatchPlain, MissionPlain, ModulePlain } from "./plain.js";
import { DeliveryViewDto } from "./receipts.js";

/**
 * The event catalog (CR-W1, accepted with changes): one payload schema per kind, and the
 * envelope around it. Routes 63 and 64.
 *
 * Payload rules (CR-W1):
 * - Enough to patch, or enough to find. A small change carries the new state, the object's
 *   new `rowVersion` and its new `plain`; a large one carries IDs and the web refetches.
 * - No money except AI spend against its budget (`metering.*`, a module's spend).
 * - Bounded: at most one `metering.spend.updated` per attempt per second. Agent output never
 *   rides here: it's on the trace stream (route 64), including the module page's steps
 *   (conflict 4).
 */

const missionChange = {
  missionId: Uuid,
  rowVersion: z.int(),
  state: z.enum(MissionState),
  displayState: z.enum(MissionDisplayState),
  plain: MissionPlain,
};

const decisionPayloads = {
  /** The whole item: the list patches without a read. */
  opened: z.object({ item: PendingDecisionDto }),
  resolved: z.object({
    ref: z.string(),
    verdict: z.enum(["approved", "rejected", "chose", "answered"]),
    resolvedAt: IsoTime,
  }),
  expired: z.object({ ref: z.string(), expiredAt: IsoTime }),
  /** CR-W15: the new item, with `previous` and `plain.returned` set. */
  returned: z.object({ item: PendingDecisionDto, previous: PreviousDecision }),
} as const;

const objectPayloads = {
  "missions.mission.created": z.object({
    missionId: Uuid,
    name: z.string(),
    rowVersion: z.int(),
    plain: MissionPlain,
  }),
  "missions.mission.changed": z.object({ ...missionChange, deadline: DeadlineClock }),
  /** CR-W22: sent when Q-0.1a or Q-0.1b is answered. */
  "missions.mission.kind_set": z.object({
    missionId: Uuid,
    kind: z.enum(ProjectKind),
    clientId: Uuid,
    clientKind: z.enum(ClientKind),
    templateSlug: z.nullable(z.string()),
    rowVersion: z.int(),
  }),
  "missions.mission.paused": z.object({
    ...missionChange,
    pauseId: Uuid,
    kind: z.enum(MissionPauseKind),
  }),
  "missions.mission.resumed": z.object({ ...missionChange, pauseId: Uuid }),
  "missions.mission.cancelled": z.object(missionChange),
  "missions.mission.closed": z.object(missionChange),

  "onboarding.session.changed": z.object({
    missionId: Uuid,
    sessionId: Uuid,
    stage: z.enum(Stage),
    status: z.enum(OnboardingSessionStatus),
    progressPct: z.int(),
    rowVersion: z.int(),
  }),
  "onboarding.message.created": z.object({ missionId: Uuid, message: CanonMessageDto }),
  /** CR-W19's `canon.message.updated`: done, stopped or failed. Replaces `message.stopped`. */
  "onboarding.message.updated": z.object({ missionId: Uuid, message: CanonMessageDto }),
  /** CR-W19's `fact.proposed`: sent after the reply ends, never in front of it. */
  "onboarding.fact.proposed": z.object({
    missionId: Uuid,
    messageId: z.nullable(Uuid),
    facts: z.array(FactLineDto),
  }),
  "onboarding.fact.changed": z.object({
    missionId: Uuid,
    factId: Uuid,
    status: z.enum(FactStatus),
    rowVersion: z.int(),
  }),
  "onboarding.checkpoint.changed": z.object({
    missionId: Uuid,
    checkpointId: Uuid,
    checkpoint: z.enum(Checkpoint),
    state: z.enum(CheckpointState),
    version: z.int(),
    rowVersion: z.int(),
  }),
  "onboarding.question.changed": z.object({
    missionId: Uuid,
    questionId: Uuid,
    answered: z.boolean(),
    rowVersion: z.int(),
  }),
  "onboarding.plan.finalized": z.object({ missionId: Uuid, planId: Uuid, planVersion: z.int() }),

  /** CR-W21's `module.updated`: state, spend against the cap, tests. */
  "factory.module.changed": z.object({
    missionId: Uuid,
    moduleRunId: Uuid,
    moduleRef: z.string(),
    state: z.string(),
    spentMicros: Micros,
    capMicros: Micros,
    tests: z.object({ passed: z.int(), total: z.int() }),
    plain: ModulePlain,
    rowVersion: z.int(),
  }),
  "factory.dispatch.changed": z.object({
    missionId: Uuid,
    dispatchId: Uuid,
    moduleRunId: z.nullable(Uuid),
    state: z.enum(DispatchState),
    plain: DispatchPlain,
    rowVersion: z.int(),
  }),
  "factory.task_doc.rendered": z.object({ missionId: Uuid, dispatchId: Uuid, version: z.int() }),
  "factory.dispatch_package.rendered": z.object({
    missionId: Uuid,
    planVersion: z.int(),
    packageHash: z.string(),
  }),

  "runner.attempt.started": z.object({
    missionId: Uuid,
    dispatchId: Uuid,
    attemptId: Uuid,
    n: z.int(),
  }),
  "runner.attempt.ended": z.object({
    missionId: Uuid,
    dispatchId: Uuid,
    attemptId: Uuid,
    outcome: z.enum(AttemptOutcome),
    costMicros: Micros,
  }),

  "integrator.commit.changed": z.object({
    missionId: Uuid,
    integrationCommitId: Uuid,
    moduleRunId: z.nullable(Uuid),
    state: z.enum(IntegrationCommitState),
    commitSha: z.nullable(z.string()),
  }),
  "integrator.tests.locked": z.object({ missionId: Uuid, moduleRunId: Uuid }),
  "integrator.dispatch_package.committed": z.object({
    missionId: Uuid,
    packageHash: z.string(),
    sha: z.string(),
  }),

  "gate.evaluation.recorded": z.object({
    missionId: Uuid,
    gate: z.int().check(z.minimum(0), z.maximum(5)),
    gateEvaluationId: Uuid,
    moduleRunId: z.nullable(Uuid),
    result: z.enum(GateEvaluationResult),
  }),
  "gate.finding.created": z.object({ finding: FindingDto }),
  "gate.finding.changed": z.object({
    missionId: Uuid,
    findingId: Uuid,
    state: z.enum(FindingState),
    rowVersion: z.int(),
  }),
  "gate.receipt.issued": z.object({
    missionId: Uuid,
    receiptId: Uuid,
    verdict: z.enum(ReceiptVerdict),
    hash: z.string(),
  }),
  "gate.pass.approved": z.object({ missionId: Uuid, passApprovalId: Uuid, receiptId: Uuid }),
  "gate.override.recorded": z.object({
    missionId: Uuid,
    overrideId: Uuid,
    gate: z.nullable(z.int()),
  }),

  "delivery.release.approved": z.object({
    missionId: Uuid,
    releaseApprovalId: Uuid,
    receiptId: Uuid,
  }),
  /** CR-W18 section 8's `delivery.opened|merged|failed`, as one kind carrying the delivery. */
  "delivery.delivery.changed": z.object({ delivery: DeliveryViewDto }),
  "delivery.dispatch_package.built": z.object({
    missionId: Uuid,
    packageHash: z.string(),
    archiveSha256: z.string(),
    bytes: z.int(),
  }),

  /** AI spend against its budget, aggregated: at most one per attempt per second. */
  "metering.spend.updated": z.object({
    missionId: Uuid,
    moduleRunId: z.nullable(Uuid),
    attemptId: z.nullable(Uuid),
    spentMicros: Micros,
    budgetMicros: Micros,
  }),
  "metering.budget.warned": z.object({
    missionId: Uuid,
    moduleRunId: z.nullable(Uuid),
    pct: z.int(),
  }),
  "metering.budget.increased": z.object({
    missionId: Uuid,
    moduleRunId: z.nullable(Uuid),
    budgetMicros: Micros,
  }),

  "knowledge.change.opened": z.object({
    changeId: z.string(),
    prNumber: z.int(),
    headSha: z.string(),
  }),
  "knowledge.change.updated": z.object({ changeId: z.string(), headSha: z.string() }),
  "knowledge.change.closed": z.object({ changeId: z.string(), merged: z.boolean() }),
  "knowledge.release.cut": z.object({ version: z.string(), factoryCommit: z.string() }),

  "evals.run.started": z.object({ run: EvalRunSummaryDto }),
  "evals.run.finished": z.object({ run: EvalRunSummaryDto }),

  "pipeline.lead.created": z.object({ leadId: Uuid, clientId: Uuid }),
  "pipeline.lead.closed": z.object({
    leadId: Uuid,
    clientId: Uuid,
    lostReason: z.enum(LeadLostReason),
  }),
  "pipeline.followup.sent": z.object({
    followupId: Uuid,
    clientId: Uuid,
    sentBy: z.enum(FollowupSentBy),
  }),

  "system.alert.raised": z.object({ alert: AlertDto }),
  "system.alert.cleared": z.object({ key: z.string(), clearedAt: IsoTime }),
} as const;

const decisionKindPayloads = Object.fromEntries(
  DecisionOwner.flatMap((m) =>
    (Object.keys(decisionPayloads) as (keyof typeof decisionPayloads)[]).map((v) => [
      `${m}.decision.${v}`,
      decisionPayloads[v],
    ]),
  ),
) as {
  [K in DecisionEventKind]: (typeof decisionPayloads)[K extends `${string}.decision.${infer V extends keyof typeof decisionPayloads}`
    ? V
    : never];
};

/** Each kind's payload. A kind without one, or a payload for a non-kind, fails to compile. */
export const eventPayloads = {
  ...objectPayloads,
  ...decisionKindPayloads,
} satisfies Record<EventKind, core.$ZodType>;

type Payloads = typeof eventPayloads;

/** The envelope (CR-W1): `seq` is commit order and the SSE `id`. */
function envelope<K extends EventKind>(kind: K) {
  return z.object({
    seq: z.int(),
    schemaVersion: z.int(),
    kind: z.literal(kind),
    at: IsoTime,
    missionId: z.nullable(Uuid),
    dispatchId: z.nullable(Uuid),
    attemptId: z.nullable(Uuid),
    payload: eventPayloads[kind] as Payloads[K],
  });
}

/** One event of kind `K`. */
export type EventOf<K extends EventKind> = {
  seq: number;
  schemaVersion: number;
  kind: K;
  at: string;
  missionId: string | null;
  dispatchId: string | null;
  attemptId: string | null;
  payload: z.infer<Payloads[K]>;
};

/** One event: a union of every kind, discriminated on `kind`. */
export type EventDto = { [K in EventKind]: EventOf<K> }[EventKind];

/**
 * The schema. Its static type is `EventDto` (a named alias, so declarations stay small); the
 * catalog tests check every kind against it.
 */
export const EventDto = z.discriminatedUnion(
  "kind",
  EventKind.map((k) => envelope(k)) as unknown as [
    ReturnType<typeof envelope>,
    ...ReturnType<typeof envelope>[],
  ],
) as unknown as z.ZodMiniType<EventDto, EventDto>;

/**
 * The web's event registry: one handler per kind. Leaving a kind out is a type error
 * (CR-W1 done-when).
 */
export type EventHandlers<R = void> = { [K in EventKind]: (event: EventOf<K>) => R };

/**
 * Route 63's input: `?missionId=`, or the global stream without one. Resuming from
 * `Last-Event-ID` (the event's `seq`, for up to 30 days) is the event iterator's. A
 * heartbeat comment goes every 15 seconds.
 */
export const EventStreamInput = z.object({
  missionId: z.optional(Uuid),
});
export type EventStreamInput = z.infer<typeof EventStreamInput>;

/** `agent_traces`. */
export const AgentTraceDto = z.object({
  traceSeq: z.int(),
  at: IsoTime,
  attemptId: z.nullable(Uuid),
  sessionId: z.nullable(Uuid),
  kind: z.enum(AgentTraceKind),
  body: z.json(),
});
export type AgentTraceDto = z.infer<typeof AgentTraceDto>;

/**
 * Route 64's input: `?attemptId=` or `?sessionId=`, exactly one. `view=steps` (CR-W21,
 * conflict 4) sends `AgentStepDto`s instead of raw traces: the module page's live feed opens
 * this beside the mission stream, so agent output never crowds the event catalog.
 */
export const TraceStreamInput = z
  .object({
    attemptId: z.optional(Uuid),
    sessionId: z.optional(Uuid),
    view: z.optional(z.enum(["raw", "steps"])),
  })
  .check(
    z.refine((v) => (v.attemptId === undefined) !== (v.sessionId === undefined), {
      message: "Send exactly one of attemptId and sessionId",
    }),
  );
export type TraceStreamInput = z.infer<typeof TraceStreamInput>;
