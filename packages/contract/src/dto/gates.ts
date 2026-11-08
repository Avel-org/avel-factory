import * as z from "zod/mini";
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
  moduleRunId: z.nullable(Uuid),
  integrationCommitId: z.nullable(Uuid),
  attemptId: z.nullable(Uuid),
  gateRunId: z.nullable(Uuid),
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
  moduleRunId: z.nullable(Uuid),
  attemptId: z.nullable(Uuid),
  dependencyRequestId: z.nullable(Uuid),
  baseSha: z.nullable(z.string()),
  commitSha: z.nullable(z.string()),
  state: z.enum(IntegrationCommitState),
  results: z.nullable(Json),
  queuedAt: IsoTime,
  startedAt: z.nullable(IsoTime),
  finishedAt: z.nullable(IsoTime),
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
export const IntegrationCommitDetailDto = z.extend(IntegrationCommitDto, {
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
  checkId: z.optional(z.string().check(z.minLength(1))),
  reason: Reason,
});
export type CreateGateOverrideInput = z.infer<typeof CreateGateOverrideInput>;

/** `findings`. */
export const FindingDto = z.object({
  id: Uuid,
  missionId: Uuid,
  checkpointId: z.nullable(Uuid),
  moduleRunId: z.nullable(Uuid),
  source: z.enum(FindingSource),
  sourceRole: z.string(),
  checkId: z.nullable(z.string()),
  targetRef: z.nullable(z.string()),
  evidence: z.nullable(Json),
  kind: z.enum(FindingKind),
  route: z.enum(FindingRoute),
  state: z.enum(FindingState),
  tries: z.int(),
  reviewedCommit: z.nullable(z.string()),
  reason: z.nullable(z.string()),
  decidedByKind: z.nullable(z.enum(FindingDecidedByKind)),
  decidedByUserId: z.nullable(Uuid),
  decidedByAttemptId: z.nullable(Uuid),
  fixedByCheck: z.nullable(z.string()),
  decidedAt: z.nullable(IsoTime),
  createdAt: IsoTime,
  ...mutableFields,
});
export type FindingDto = z.infer<typeof FindingDto>;

export const ListFindingsInput = z.extend(PageQuery, { missionId: Uuid });
export type ListFindingsInput = z.infer<typeof ListFindingsInput>;

/** Route 59: "Confirm or dismiss, with a reason". */
export const UpdateFindingInput = z.object({
  findingId: Uuid,
  rowVersion: RowVersion,
  state: z.enum(["confirmed", "dismissed"] as const satisfies readonly FindingState[]),
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
