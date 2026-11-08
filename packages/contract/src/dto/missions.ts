import * as z from "zod/mini";
import {
  ClientKind,
  MessageRole,
  MissionDisplayState,
  MissionPauseKind,
  MissionRefreshState,
  MissionState,
  OnboardingSessionStatus,
  Package,
  ProjectKind,
  Stage,
} from "../value-lists.js";
import {
  IsoTime,
  Micros,
  mutableFields,
  PageQuery,
  Placeholder,
  Reason,
  RowVersion,
  Uuid,
} from "./common.js";
import { CheckpointDto } from "./gate0.js";
import { DeliveryDto } from "./receipts.js";

/** Missions (routes 19 to 34). */

/**
 * `missions` with section 6's changes: CR-13's `kind` and `clientKind`, B9's design
 * system pin, and no `rep_id` or `rep_pct` (CR-18). Plus the computed `displayState`
 * (rule 6): `state`, or `paused` for an open `operator` pause, or `blocked_on_you` for
 * an open `proposal` or `budget` pause (O2); `blocked_on_you` wins when both kinds are
 * open (D16).
 */
export const MissionDto = z.object({
  id: Uuid,
  clientId: Uuid,
  state: z.enum(MissionState),
  packageKey: z.nullable(z.string()),
  packageVersion: z.nullable(z.string()),
  priceMicros: z.nullable(Micros),
  deadlineAt: z.nullable(IsoTime),
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
  kind: z.enum(ProjectKind),
  clientKind: z.enum(ClientKind),
  designSystemSlug: z.nullable(z.string()),
  designSystemVersion: z.nullable(z.string()),
  createdAt: IsoTime,
  ...mutableFields,
  displayState: z.enum(MissionDisplayState),
});
export type MissionDto = z.infer<typeof MissionDto>;

/** Route 19: the list, with CR-13's optional `?kind=`. */
export const ListMissionsInput = z.extend(PageQuery, {
  kind: z.optional(z.enum(ProjectKind)),
});
export type ListMissionsInput = z.infer<typeof ListMissionsInput>;

/**
 * Route 20: "a new mission starts as a draft with a client". `kind` is required
 * (CR-13: "chosen when the mission is created"; D20). The server sets `clientKind`
 * from the client; it isn't an input.
 */
export const CreateMissionInput = z.object({
  clientId: Uuid,
  kind: z.enum(ProjectKind),
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
 * Route 21: "State, gate strip, onboarding progress and checkpoints, why, deliveries".
 * The gate strip, onboarding progress and why have no field list in an accepted doc
 * (CR-W2, CR-W5 and CR-W9 aren't accepted), so they're typed placeholders (rule 6).
 */
export const MissionDetailDto = z.object({
  mission: MissionDto,
  gateStrip: Placeholder,
  onboarding: z.object({
    session: z.nullable(OnboardingSessionDto),
    progress: Placeholder,
    checkpoints: z.array(CheckpointDto),
  }),
  why: Placeholder,
  deliveries: z.array(DeliveryDto),
});
export type MissionDetailDto = z.infer<typeof MissionDetailDto>;

/** Route 22: "Links a repo connection" (`null` unlinks it). */
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

/** `messages`: the Canon chat history (route 33). */
export const MessageDto = z.object({
  id: Uuid,
  sessionId: Uuid,
  seq: z.int(),
  role: z.enum(MessageRole),
  text: z.string(),
  promptVersion: z.string(),
  tokensIn: z.int(),
  tokensOut: z.int(),
  cacheWrite5m: z.int(),
  cacheWrite1h: z.int(),
  cacheRead: z.int(),
  redactedAt: z.nullable(IsoTime),
  createdAt: IsoTime,
});
export type MessageDto = z.infer<typeof MessageDto>;

export const ListMessagesInput = z.extend(PageQuery, { missionId: Uuid });
export type ListMessagesInput = z.infer<typeof ListMessagesInput>;

/** Route 34: your turn with Canon; replies stream on the trace stream. */
export const PostMessageInput = z.object({
  missionId: Uuid,
  text: z.string().check(z.trim(), z.minLength(1)),
});
export type PostMessageInput = z.infer<typeof PostMessageInput>;
