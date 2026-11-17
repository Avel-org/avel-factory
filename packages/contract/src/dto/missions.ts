import * as z from "zod/mini";
import {
  BlockerKind,
  Checkpoint,
  ClientKind,
  GateRuns,
  GateStripState,
  JourneyStep,
  JourneyStepState,
  MessageRole,
  MessageSource,
  MessageStatus,
  MissionDisplayState,
  MissionPauseKind,
  MissionRefreshState,
  MissionState,
  OnboardingSessionStatus,
  Package,
  ProjectKind,
  Stage,
  Topic,
  TopicCoverageState,
  TranscriptChunkType,
} from "../value-lists.js";
import { IsoTime, Micros, mutableFields, PageQuery, Reason, RowVersion, Uuid } from "./common.js";
import { CheckpointDto, FactLineDto } from "./gate0.js";
import { MissionPlain } from "./plain.js";
import { DeliveryViewDto } from "./receipts.js";

/** Missions (routes 19 to 34). */

/**
 * CR-W18 section 6: the deadline clock. It starts at plan approval and pauses while the
 * mission waits on you or the client. `atRisk` is the server's call (CR-W5).
 */
export const DeadlineClock = z.object({
  dueAt: z.nullable(IsoTime),
  startedAt: z.nullable(IsoTime),
  paused: z.boolean(),
  pausedSince: z.nullable(IsoTime),
  pausedFor: z.nullable(z.enum(["operator", "client"])),
  atRisk: z.boolean(),
});
export type DeadlineClock = z.infer<typeof DeadlineClock>;

/**
 * CR-W18 section 10: the client's main, so Refresh is offered only when it moved.
 * `latestCommit` is the last push the webhook saw on the connection's default branch.
 */
export const ClientMain = z.object({
  pinnedCommit: z.nullable(z.string()),
  latestCommit: z.nullable(z.string()),
  moved: z.boolean(),
});
export type ClientMain = z.infer<typeof ClientMain>;

/**
 * `missions` (contract 1.0.0):
 * - CR-13's `kind` and `clientKind`, both null until Q-0.1a is answered (CR-W22), and
 *   `clientId` null with them. `kind` stays CR-13's three values: `client`, `internal`
 *   (AVEL's own software, such as the Control room) and `template` (CR-W22's internal
 *   template build). The prototype's `audience` is this field.
 * - `name` (CR-W22: a new project is just a name), `templateSlug` (CR-W22), `leadId` and
 *   `followsDeliveryId` (CR-W17).
 * - No `priceMicros` (CR-W20 section 3). Budget and spend stay: they're AI cost against its cap.
 * - `plain` (CR-W9), `deadline` (CR-W18 section 6) and `clientMain` (section 10), computed.
 * - `displayState` (rule 6): `state`, or `paused` for an open `operator` pause, or
 *   `blocked_on_you` for an open `proposal` or `budget` pause (O2, D16).
 */
export const MissionDto = z.object({
  id: Uuid,
  name: z.string(),
  clientId: z.nullable(Uuid),
  state: z.enum(MissionState),
  packageKey: z.nullable(z.string()),
  packageVersion: z.nullable(z.string()),
  budgetMicros: Micros,
  reservedMicros: Micros,
  spentMicros: Micros,
  planId: z.nullable(Uuid),
  planState: z.nullable(z.string()),
  repoConnectionId: z.nullable(Uuid),
  pinnedCommit: z.nullable(z.string()),
  branchHead: z.nullable(z.string()),
  factoryCommit: z.nullable(z.string()),
  rosterVersion: z.nullable(z.string()),
  kbRelease: z.nullable(z.string()),
  rulesVersion: z.nullable(z.string()),
  gate5Failures: z.int(),
  onboardingStartedAt: z.nullable(IsoTime),
  approvedAt: z.nullable(IsoTime),
  renderedAt: z.nullable(IsoTime),
  deliveredAt: z.nullable(IsoTime),
  closedAt: z.nullable(IsoTime),
  cancelledAt: z.nullable(IsoTime),
  kind: z.nullable(z.enum(ProjectKind)),
  clientKind: z.nullable(z.enum(ClientKind)),
  templateSlug: z.nullable(z.string()),
  leadId: z.nullable(Uuid),
  followsDeliveryId: z.nullable(Uuid),
  designSystemSlug: z.nullable(z.string()),
  designSystemVersion: z.nullable(z.string()),
  createdAt: IsoTime,
  ...mutableFields,
  displayState: z.enum(MissionDisplayState),
  plain: MissionPlain,
  deadline: DeadlineClock,
  clientMain: ClientMain,
});
export type MissionDto = z.infer<typeof MissionDto>;

/**
 * A gate on the strip (CR-W5; CR-W18 section 5). Gates 0, 1, 4 and 5 run once; Gates 2 and
 * 3 run for every job and merge, so they carry counts.
 */
export const GateStripItem = z.object({
  gate: z.int().check(z.minimum(0), z.maximum(5)),
  state: z.enum(GateStripState),
  runs: z.enum(GateRuns),
  counts: z.nullable(z.object({ landed: z.int(), total: z.int(), running: z.int() })),
});
export type GateStripItem = z.infer<typeof GateStripItem>;

/**
 * Route 19's row (CR-W5): one call draws every mission's strip on the home screen. No
 * money (CR-W5, "money stays off these screens").
 */
export const MissionListRowDto = z.object({
  id: Uuid,
  name: z.string(),
  rowVersion: RowVersion,
  kind: z.nullable(z.enum(ProjectKind)),
  templateSlug: z.nullable(z.string()),
  client: z.nullable(z.object({ id: Uuid, name: z.string() })),
  package: z.nullable(z.enum(Package)),
  state: z.enum(MissionState),
  displayState: z.enum(MissionDisplayState),
  plain: MissionPlain,
  gates: z.array(GateStripItem),
  modules: z.object({ total: z.int(), landed: z.int(), running: z.int(), parked: z.int() }),
  needsYouCount: z.int(),
  runningDispatches: z.int(),
  deadline: DeadlineClock,
  lastEventAt: z.nullable(IsoTime),
});
export type MissionListRowDto = z.infer<typeof MissionListRowDto>;

/**
 * Route 19's input: `?kind=` filters by project kind (CR-13; CR-W22's "For" filter), and
 * `unset` lists the missions whose first question is still open.
 */
export const ListMissionsInput = z.extend(PageQuery, {
  kind: z.optional(z.enum([...ProjectKind, "unset"])),
  clientId: z.optional(Uuid),
});
export type ListMissionsInput = z.infer<typeof ListMissionsInput>;

/**
 * Route 20 (CR-W22): a name, and optionally the client page it was started from. The kind
 * isn't sent: Canon's first question (Q-0.1a) decides it, with the client project
 * recommended when `clientId` is given.
 */
export const CreateMissionInput = z.object({
  name: z.string().check(z.trim(), z.minLength(1), z.maxLength(80)),
  clientId: z.optional(Uuid),
});
export type CreateMissionInput = z.infer<typeof CreateMissionInput>;

export const MissionIdInput = z.object({ missionId: Uuid });
export type MissionIdInput = z.infer<typeof MissionIdInput>;

/** `onboarding_sessions`. */
export const OnboardingSessionDto = z.object({
  id: Uuid,
  missionId: Uuid,
  stage: z.enum(Stage),
  status: z.enum(OnboardingSessionStatus),
  pauseReason: z.nullable(z.string()),
  packageProvisional: z.nullable(z.enum(Package)),
  packageFinal: z.nullable(z.enum(Package)),
  promptVersion: z.string(),
  lastActivityAt: IsoTime,
  finalizedAt: z.nullable(IsoTime),
  createdAt: IsoTime,
  ...mutableFields,
});
export type OnboardingSessionDto = z.infer<typeof OnboardingSessionDto>;

/**
 * CR-W18 section 2: the Gate 0 journey, computed on the server. `progressPct` is capped
 * at 95 per stage until you approve. `blockers` is what stands between the current
 * checkpoint and its approval (Q-0.1a and Q-0.1b among them, CR-W22). Canon's spend is AI
 * cost against the mission budget (allowed, CR-W20 section 3).
 */
export const OnboardingJourneyDto = z.object({
  session: z.nullable(OnboardingSessionDto),
  progressPct: z.int().check(z.minimum(0), z.maximum(100)),
  checkpoints: z.array(
    z.object({
      key: z.enum(JourneyStep),
      checkpointId: z.nullable(Uuid),
      state: z.enum(JourneyStepState),
      version: z.nullable(z.int()),
      approvedAt: z.nullable(IsoTime),
    }),
  ),
  blockers: z.array(
    z.object({
      kind: z.enum(BlockerKind),
      ref: z.string(),
      text: z.string(),
      targetId: Uuid,
    }),
  ),
  topics: z.array(z.object({ topic: z.enum(Topic), state: z.enum(TopicCoverageState) })),
  canonSpentMicros: Micros,
  operatorMinutes: z.int(),
});
export type OnboardingJourneyDto = z.infer<typeof OnboardingJourneyDto>;

/** Route 21: the mission, its gate strip with counts, the journey, checkpoints and deliveries. */
export const MissionDetailDto = z.object({
  mission: MissionDto,
  gates: z.array(GateStripItem),
  onboarding: OnboardingJourneyDto,
  checkpoints: z.array(CheckpointDto),
  deliveries: z.array(DeliveryViewDto),
});
export type MissionDetailDto = z.infer<typeof MissionDetailDto>;

export const UpdateMissionInput = z.object({
  missionId: Uuid,
  rowVersion: RowVersion,
  repoConnectionId: z.nullable(Uuid),
});
export type UpdateMissionInput = z.infer<typeof UpdateMissionInput>;

/** `mission_pauses`: independent rows, not a stack (B7). */
export const MissionPauseDto = z.object({
  id: Uuid,
  missionId: Uuid,
  kind: z.enum(MissionPauseKind),
  interruptedState: z.enum(MissionState),
  proposalId: z.nullable(Uuid),
  pausedBy: z.nullable(Uuid),
  reason: z.nullable(z.string()),
  startedAt: IsoTime,
  endedAt: z.nullable(IsoTime),
  endedBy: z.nullable(Uuid),
  createdAt: IsoTime,
  ...mutableFields,
});
export type MissionPauseDto = z.infer<typeof MissionPauseDto>;

/** Route 23: an `operator` pause. */
export const PauseMissionInput = z.object({
  missionId: Uuid,
  reason: z.optional(z.string().check(z.trim(), z.minLength(1))),
});
export type PauseMissionInput = z.infer<typeof PauseMissionInput>;

/** Route 24: resume, which ends that pause row. */
export const ResumeMissionInput = z.object({
  missionId: Uuid,
  pauseId: Uuid,
  rowVersion: RowVersion,
});
export type ResumeMissionInput = z.infer<typeof ResumeMissionInput>;

/** Route 25: cancel. */
export const CancelMissionInput = z.object({
  missionId: Uuid,
  rowVersion: RowVersion,
  reason: z.optional(z.string().check(z.trim(), z.minLength(1))),
});
export type CancelMissionInput = z.infer<typeof CancelMissionInput>;

/** `readiness_waivers`. */
export const ReadinessWaiverDto = z.object({
  id: Uuid,
  missionId: Uuid,
  sessionId: Uuid,
  checkId: z.string(),
  reason: z.string(),
  userId: Uuid,
  createdAt: IsoTime,
});
export type ReadinessWaiverDto = z.infer<typeof ReadinessWaiverDto>;

/** Route 27: "Proceed on a partial readiness result, with a reason". */
export const CreateReadinessWaiverInput = z.object({
  missionId: Uuid,
  checkId: z.string().check(z.minLength(1)),
  reason: Reason,
});
export type CreateReadinessWaiverInput = z.infer<typeof CreateReadinessWaiverInput>;

/** Route 28: "Approval #1, with the plan version" (`version`, Q4). */
export const FinalizeMissionInput = z.object({
  missionId: Uuid,
  version: z.int().check(z.minimum(1)),
});
export type FinalizeMissionInput = z.infer<typeof FinalizeMissionInput>;

/** `pass_approvals` (immutable). */
export const PassApprovalDto = z.object({
  id: Uuid,
  receiptId: Uuid,
  receiptHash: z.string(),
  receiptVerdict: z.string(),
  reason: z.string(),
  userId: Uuid,
  approvedAt: IsoTime,
  createdAt: IsoTime,
});
export type PassApprovalDto = z.infer<typeof PassApprovalDto>;

/** Route 29: "The receipt hash and a reason". */
export const CreatePassApprovalInput = z.object({
  missionId: Uuid,
  receiptHash: z.string().check(z.minLength(1)),
  reason: Reason,
});
export type CreatePassApprovalInput = z.infer<typeof CreatePassApprovalInput>;

/** `release_approvals` (immutable). */
export const ReleaseApprovalDto = z.object({
  id: Uuid,
  missionId: Uuid,
  receiptId: Uuid,
  receiptHash: z.string(),
  receiptVerdict: z.string(),
  passApprovalId: z.nullable(Uuid),
  userId: Uuid,
  approvedAt: IsoTime,
  createdAt: IsoTime,
});
export type ReleaseApprovalDto = z.infer<typeof ReleaseApprovalDto>;

/** Route 30: "Approval #2, with the receipt hash and, for a pass, the pass approval ID". */
export const CreateReleaseInput = z.object({
  missionId: Uuid,
  receiptHash: z.string().check(z.minLength(1)),
  passApprovalId: z.optional(Uuid),
});
export type CreateReleaseInput = z.infer<typeof CreateReleaseInput>;

/** `mission_refreshes`. */
export const MissionRefreshDto = z.object({
  id: Uuid,
  missionId: Uuid,
  fromCommit: z.string(),
  toCommit: z.string(),
  fromReceiptId: Uuid,
  newReceiptId: z.nullable(Uuid),
  proposalId: z.nullable(Uuid),
  state: z.enum(MissionRefreshState),
  startedAt: IsoTime,
  finishedAt: z.nullable(IsoTime),
  createdAt: IsoTime,
  ...mutableFields,
});
export type MissionRefreshDto = z.infer<typeof MissionRefreshDto>;

/**
 * Route 32: "naming the module or mission budget and the amount". With no
 * `moduleRunId`, it's the mission budget.
 */
export const CreateBudgetIncreaseInput = z.object({
  missionId: Uuid,
  moduleRunId: z.optional(Uuid),
  amountMicros: Micros.check(z.minimum(1)),
});
export type CreateBudgetIncreaseInput = z.infer<typeof CreateBudgetIncreaseInput>;

/**
 * A Canon message (CR-W19 section 2), from `messages`. Canon's, the client's and voice text
 * is untrusted and returned as plain text. `ttftMs` is from request received to first text
 * chunk; `costMicros` is Canon's AI cost for the turn (allowed, CR-W20 section 3).
 */
export const CanonMessageDto = z.object({
  id: Uuid,
  sessionId: Uuid,
  seq: z.int(),
  clientMessageId: z.nullable(Uuid),
  role: z.enum(MessageRole),
  source: z.nullable(z.enum(MessageSource)),
  relayedBy: z.nullable(z.string()),
  answersQuestionId: z.nullable(Uuid),
  questionId: z.nullable(Uuid),
  text: z.string(),
  checkpoint: z.nullable(z.enum(Checkpoint)),
  status: z.enum(MessageStatus),
  ttftMs: z.nullable(z.int()),
  totalMs: z.nullable(z.int()),
  costMicros: z.nullable(Micros),
  redactedAt: z.nullable(IsoTime),
  createdAt: IsoTime,
});
export type CanonMessageDto = z.infer<typeof CanonMessageDto>;

/** Route 33: newest first, by cursor. */
export const ListMessagesInput = z.extend(PageQuery, { missionId: Uuid });
export type ListMessagesInput = z.infer<typeof ListMessagesInput>;

/** At most 8 000 characters (CR-W19 section 2; `MESSAGE_TOO_LONG` above it). */
export const MESSAGE_MAX_CHARS = 8000;

/**
 * Route 34 (CR-W19): your turn with Canon. Returns an event iterator of AI SDK UI message
 * chunks; the client's `AbortSignal` stops the reply and the partial text is kept as
 * `stopped`. `clientMessageId` is the web's, so the message shows before the server answers;
 * it's also the idempotency of the turn (a repeat returns `CANON_BUSY` or the stored reply).
 */
export const SendMessageInput = z.object({
  missionId: Uuid,
  clientMessageId: Uuid,
  text: z.string().check(z.trim(), z.minLength(1), z.maxLength(MESSAGE_MAX_CHARS)),
  source: z.enum(MessageSource),
  relayedBy: z.optional(z.string().check(z.trim(), z.minLength(1), z.maxLength(80))),
  answersQuestionId: z.optional(Uuid),
  checkpoint: z.enum(["0.1", "0.2", "0.3", "0.4"]),
  uploadIds: z.optional(z.array(Uuid).check(z.maxLength(10))),
});
export type SendMessageInput = z.infer<typeof SendMessageInput>;

/**
 * The chunks route 34 and its resume stream: AI SDK v5's `UIMessageChunk` subset Canon
 * sends. `finish` carries the message's status and timings in `messageMetadata`.
 */
export const CanonStreamChunk = z.discriminatedUnion("type", [
  z.object({ type: z.literal("start"), messageId: Uuid }),
  z.object({ type: z.literal("text-start"), id: z.string() }),
  z.object({ type: z.literal("text-delta"), id: z.string(), delta: z.string() }),
  z.object({ type: z.literal("text-end"), id: z.string() }),
  z.object({
    type: z.literal("finish"),
    messageMetadata: z.object({
      messageId: Uuid,
      status: z.enum(MessageStatus),
      ttftMs: z.nullable(z.int()),
      totalMs: z.nullable(z.int()),
    }),
  }),
  z.object({ type: z.literal("error"), errorText: z.string() }),
]);
export type CanonStreamChunk = z.infer<typeof CanonStreamChunk>;

/** Resume (CR-W19): re-attach to a reply still streaming; `STREAM_GONE` once it's finished. */
export const ResumeMessageInput = z.object({ missionId: Uuid, messageId: Uuid });
export type ResumeMessageInput = z.infer<typeof ResumeMessageInput>;

/**
 * Transcribe (CR-W19 section 8.3, accepted with changes): the recorded clip, at most 8 MB,
 * sent when you let go. The transcript still streams back as it's decoded. Live partials
 * while you talk need a duplex channel the OpenAPI handler doesn't have; they wait.
 * Audio isn't stored after the final transcript.
 */
export const TranscribeInput = z.object({
  missionId: Uuid,
  audio: z
    .file()
    .check(
      z.maxSize(8 * 1024 * 1024),
      z.mime(["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"]),
    ),
});
export type TranscribeInput = z.infer<typeof TranscribeInput>;

export const TranscriptChunk = z.object({
  type: z.enum(TranscriptChunkType),
  text: z.string(),
});
export type TranscriptChunk = z.infer<typeof TranscriptChunk>;

/** `onboarding.fact.proposed` (CR-W19): the facts a reply proposed, after the reply ends. */
export const ProposedFacts = z.object({
  missionId: Uuid,
  messageId: Uuid,
  facts: z.array(FactLineDto),
});
export type ProposedFacts = z.infer<typeof ProposedFacts>;
