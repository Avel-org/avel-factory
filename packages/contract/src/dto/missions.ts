import { z } from "zod";
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
  packageKey: z.string().nullable(),
  packageVersion: z.string().nullable(),
  priceMicros: Micros.nullable(),
  deadlineAt: IsoTime.nullable(),
  budgetMicros: Micros,
  reservedMicros: Micros,
  spentMicros: Micros,
  planId: Uuid.nullable(),
  planState: z.string().nullable(),
  repoConnectionId: Uuid.nullable(),
  pinnedCommit: z.string().nullable(),
  branchHead: z.string().nullable(),
  factoryCommit: z.string().nullable(),
  rosterVersion: z.string().nullable(),
  kbRelease: z.string().nullable(),
  rulesVersion: z.string().nullable(),
  gate5Failures: z.int(),
  onboardingStartedAt: IsoTime.nullable(),
  approvedAt: IsoTime.nullable(),
  renderedAt: IsoTime.nullable(),
  deliveredAt: IsoTime.nullable(),
  closedAt: IsoTime.nullable(),
  cancelledAt: IsoTime.nullable(),
  kind: z.enum(ProjectKind),
  clientKind: z.enum(ClientKind),
  designSystemSlug: z.string().nullable(),
  designSystemVersion: z.string().nullable(),
  createdAt: IsoTime,
  ...mutableFields,
  displayState: z.enum(MissionDisplayState),
});
export type MissionDto = z.infer<typeof MissionDto>;

/** Route 19: the list, with CR-13's optional `?kind=`. */
export const ListMissionsInput = PageQuery.extend({
  kind: z.enum(ProjectKind).optional(),
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
  pauseReason: z.string().nullable(),
  packageProvisional: z.enum(Package).nullable(),
  packageFinal: z.enum(Package).nullable(),
  promptVersion: z.string(),
  lastActivityAt: IsoTime,
  finalizedAt: IsoTime.nullable(),
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
    session: OnboardingSessionDto.nullable(),
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
  repoConnectionId: Uuid.nullable(),
});
export type UpdateMissionInput = z.infer<typeof UpdateMissionInput>;

/** `mission_pauses`: independent rows, not a stack (B7). */
export const MissionPauseDto = z.object({
  id: Uuid,
  missionId: Uuid,
  kind: z.enum(MissionPauseKind),
  interruptedState: z.enum(MissionState),
  proposalId: Uuid.nullable(),
  pausedBy: Uuid.nullable(),
  reason: z.string().nullable(),
  startedAt: IsoTime,
  endedAt: IsoTime.nullable(),
  endedBy: Uuid.nullable(),
  createdAt: IsoTime,
  ...mutableFields,
});
export type MissionPauseDto = z.infer<typeof MissionPauseDto>;

/** Route 23: an `operator` pause. */
export const PauseMissionInput = z.object({
  missionId: Uuid,
  reason: z.string().trim().min(1).optional(),
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
  reason: z.string().trim().min(1).optional(),
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
  checkId: z.string().min(1),
  reason: Reason,
});
export type CreateReadinessWaiverInput = z.infer<typeof CreateReadinessWaiverInput>;

/** Route 28: "Approval #1, with the plan version" (`version`, Q4). */
export const FinalizeMissionInput = z.object({
  missionId: Uuid,
  version: z.int().min(1),
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
  receiptHash: z.string().min(1),
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
  passApprovalId: Uuid.nullable(),
  userId: Uuid,
  approvedAt: IsoTime,
  createdAt: IsoTime,
});
export type ReleaseApprovalDto = z.infer<typeof ReleaseApprovalDto>;

/** Route 30: "Approval #2, with the receipt hash and, for a pass, the pass approval ID". */
export const CreateReleaseInput = z.object({
  missionId: Uuid,
  receiptHash: z.string().min(1),
  passApprovalId: Uuid.optional(),
});
export type CreateReleaseInput = z.infer<typeof CreateReleaseInput>;

/** `mission_refreshes`. */
export const MissionRefreshDto = z.object({
  id: Uuid,
  missionId: Uuid,
  fromCommit: z.string(),
  toCommit: z.string(),
  fromReceiptId: Uuid,
  newReceiptId: Uuid.nullable(),
  proposalId: Uuid.nullable(),
  state: z.enum(MissionRefreshState),
  startedAt: IsoTime,
  finishedAt: IsoTime.nullable(),
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
  moduleRunId: Uuid.optional(),
  amountMicros: Micros.min(1),
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
  redactedAt: IsoTime.nullable(),
  createdAt: IsoTime,
});
export type MessageDto = z.infer<typeof MessageDto>;

export const ListMessagesInput = PageQuery.extend({ missionId: Uuid });
export type ListMessagesInput = z.infer<typeof ListMessagesInput>;

/** Route 34: your turn with Canon; replies stream on the trace stream. */
export const PostMessageInput = z.object({
  missionId: Uuid,
  text: z.string().trim().min(1),
});
export type PostMessageInput = z.infer<typeof PostMessageInput>;
