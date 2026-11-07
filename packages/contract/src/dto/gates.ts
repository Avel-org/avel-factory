import { z } from "zod";
import {
  FindingDecidedByKind,
  FindingKind,
  FindingRoute,
  FindingSource,
  FindingState,
  GateEvaluationResult,
  IntegrationCommitKind,
  IntegrationCommitState,
} from "../value-lists.js";
import {
  IsoTime,
  Json,
  mutableFields,
  PageQuery,
  Placeholder,
  Reason,
  RowVersion,
  Uuid,
} from "./common.js";

/** Gates and findings (routes 55 to 60). */

/** `gate_evaluations`. */
export const GateEvaluationDto = z.object({
  id: Uuid,
  missionId: Uuid,
  gate: z.int(),
  commitSha: z.string(),
  moduleRunId: Uuid.nullable(),
  integrationCommitId: Uuid.nullable(),
  attemptId: Uuid.nullable(),
  gateRunId: Uuid.nullable(),
  result: z.enum(GateEvaluationResult),
  reasons: Json,
  createdAt: IsoTime,
  ...mutableFields,
});
export type GateEvaluationDto = z.infer<typeof GateEvaluationDto>;

/** `integration_commits`. */
export const IntegrationCommitDto = z.object({
  id: Uuid,
  missionId: Uuid,
  kind: z.enum(IntegrationCommitKind),
  moduleRunId: Uuid.nullable(),
  attemptId: Uuid.nullable(),
  dependencyRequestId: Uuid.nullable(),
  baseSha: z.string().nullable(),
  commitSha: z.string().nullable(),
  state: z.enum(IntegrationCommitState),
  results: Json.nullable(),
  queuedAt: IsoTime,
  startedAt: IsoTime.nullable(),
  finishedAt: IsoTime.nullable(),
  createdAt: IsoTime,
  ...mutableFields,
});
export type IntegrationCommitDto = z.infer<typeof IntegrationCommitDto>;

/** Route 55: "Every gate evaluation and integration commit". */
export const MissionGatesDto = z.object({
  gateEvaluations: z.array(GateEvaluationDto),
  integrationCommits: z.array(IntegrationCommitDto),
});
export type MissionGatesDto = z.infer<typeof MissionGatesDto>;

export const IntegrationCommitIdInput = z.object({ integrationCommitId: Uuid });
export type IntegrationCommitIdInput = z.infer<typeof IntegrationCommitIdInput>;

/**
 * Route 56: "Results and log". `results` is the column; the log has no column, so
 * it's a placeholder.
 */
export const IntegrationCommitDetailDto = IntegrationCommitDto.extend({
  log: Placeholder,
});
export type IntegrationCommitDetailDto = z.infer<typeof IntegrationCommitDetailDto>;

/**
 * Route 57: "Gates 3 and 4 only; caps the verdict at pass". Bound to the gate
 * evaluation's `rowVersion` (Q4), with a reason. `gate` is typed 3 or 4, so 1, 2
 * and 5 are refused as bad input.
 */
export const CreateGateOverrideInput = z.object({
  missionId: Uuid,
  gate: z.union([z.literal(3), z.literal(4)]),
  gateEvaluationId: Uuid,
  rowVersion: RowVersion,
  checkId: z.string().min(1).optional(),
  reason: Reason,
});
export type CreateGateOverrideInput = z.infer<typeof CreateGateOverrideInput>;

/** `findings`. */
export const FindingDto = z.object({
  id: Uuid,
  missionId: Uuid,
  checkpointId: Uuid.nullable(),
  moduleRunId: Uuid.nullable(),
  source: z.enum(FindingSource),
  sourceRole: z.string(),
  checkId: z.string().nullable(),
  targetRef: z.string().nullable(),
  evidence: Json.nullable(),
  kind: z.enum(FindingKind),
  route: z.enum(FindingRoute),
  state: z.enum(FindingState),
  tries: z.int(),
  reviewedCommit: z.string().nullable(),
  reason: z.string().nullable(),
  decidedByKind: z.enum(FindingDecidedByKind).nullable(),
  decidedByUserId: Uuid.nullable(),
  decidedByAttemptId: Uuid.nullable(),
  fixedByCheck: z.string().nullable(),
  decidedAt: IsoTime.nullable(),
  createdAt: IsoTime,
  ...mutableFields,
});
export type FindingDto = z.infer<typeof FindingDto>;

export const ListFindingsInput = PageQuery.extend({ missionId: Uuid });
export type ListFindingsInput = z.infer<typeof ListFindingsInput>;

/** Route 59: "Confirm or dismiss, with a reason". */
export const UpdateFindingInput = z.object({
  findingId: Uuid,
  rowVersion: RowVersion,
  state: z.enum(FindingState).extract(["confirmed", "dismissed"]),
  reason: Reason,
});
export type UpdateFindingInput = z.infer<typeof UpdateFindingInput>;

/** Route 60: "Accept with a reason; caps the verdict at pass". */
export const AcceptFindingInput = z.object({
  findingId: Uuid,
  rowVersion: RowVersion,
  reason: Reason,
});
export type AcceptFindingInput = z.infer<typeof AcceptFindingInput>;
