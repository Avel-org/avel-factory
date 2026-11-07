import { z } from "zod";
import {
  AttemptCompute,
  AttemptKind,
  AttemptOutcome,
  DispatchOrigin,
  DispatchRole,
  DispatchState,
  OverrideAction,
  OverrideKind,
  RoomKind,
  RoomState,
} from "../value-lists.js";
import {
  IsoTime,
  Json,
  Micros,
  mutableFields,
  Page,
  PageQuery,
  Reason,
  RowVersion,
  Uuid,
} from "./common.js";

/** Dispatches (routes 49 to 51). */

/** `mission_docs`: DISPATCH.md for a plan version. */
export const MissionDocDto = z.object({
  id: Uuid,
  missionId: Uuid,
  planId: Uuid,
  dispatchMd: z.string(),
  hash: z.string(),
  gate1PassedAt: IsoTime.nullable(),
  createdAt: IsoTime,
});
export type MissionDocDto = z.infer<typeof MissionDocDto>;

/** `dispatches`. */
export const DispatchDto = z.object({
  id: Uuid,
  missionId: Uuid,
  moduleRunId: Uuid.nullable(),
  planId: Uuid,
  agent: z.string(),
  role: z.enum(DispatchRole),
  pass: z.int(),
  state: z.enum(DispatchState),
  parkedFrom: z.enum(DispatchState).nullable(),
  origin: z.enum(DispatchOrigin),
  taskDocVersion: z.int(),
  resultCommit: z.string().nullable(),
  frozenIdentity: Json,
  wave: z.int(),
  createdAt: IsoTime,
  ...mutableFields,
});
export type DispatchDto = z.infer<typeof DispatchDto>;

export const ListMissionDispatchesInput = PageQuery.extend({ missionId: Uuid });
export type ListMissionDispatchesInput = z.infer<typeof ListMissionDispatchesInput>;

/** Route 49: the mission's dispatches "with DISPATCH.md". */
export const MissionDispatchesDto = Page(DispatchDto).extend({
  missionDoc: MissionDocDto.nullable(),
});
export type MissionDispatchesDto = z.infer<typeof MissionDispatchesDto>;

/** `task_docs`. */
export const TaskDocDto = z.object({
  dispatchId: Uuid,
  version: z.int(),
  missionId: Uuid,
  planId: Uuid,
  body: z.string(),
  hash: z.string(),
  renderedAt: IsoTime,
  createdAt: IsoTime,
});
export type TaskDocDto = z.infer<typeof TaskDocDto>;

/** `attempts`. */
export const AttemptDto = z.object({
  id: Uuid,
  missionId: Uuid,
  dispatchId: Uuid,
  n: z.int(),
  taskDocVersion: z.int(),
  agentConfigHash: z.string(),
  factoryCommit: z.string(),
  branch: z.string(),
  kind: z.enum(AttemptKind),
  vendor: z.string(),
  model: z.string(),
  compute: z.enum(AttemptCompute),
  checkpointCommit: z.string().nullable(),
  startedAt: IsoTime,
  endedAt: IsoTime.nullable(),
  tokensIn: z.int(),
  tokensOut: z.int(),
  cacheRead: z.int(),
  cacheWrite5m: z.int(),
  cacheWrite1h: z.int(),
  costMicros: Micros,
  reservedMicros: Micros,
  capMicros: Micros,
  outcome: z.enum(AttemptOutcome).nullable(),
  failureNote: z.string().nullable(),
  createdAt: IsoTime,
  ...mutableFields,
});
export type AttemptDto = z.infer<typeof AttemptDto>;

/** `rooms`. */
export const RoomDto = z.object({
  id: Uuid,
  kind: z.enum(RoomKind),
  missionId: Uuid,
  dispatchId: Uuid.nullable(),
  attemptId: Uuid.nullable(),
  integrationCommitId: Uuid.nullable(),
  state: z.enum(RoomState),
  imageDigest: z.string().nullable(),
  destroyedAt: IsoTime.nullable(),
  createdAt: IsoTime,
  ...mutableFields,
});
export type RoomDto = z.infer<typeof RoomDto>;

export const DispatchIdInput = z.object({ dispatchId: Uuid });
export type DispatchIdInput = z.infer<typeof DispatchIdInput>;

/** Route 50: "Task doc versions, attempts, room". */
export const DispatchDetailDto = z.object({
  dispatch: DispatchDto,
  taskDocs: z.array(TaskDocDto),
  attempts: z.array(AttemptDto),
  room: RoomDto.nullable(),
});
export type DispatchDetailDto = z.infer<typeof DispatchDetailDto>;

/** `overrides` (immutable). */
export const OverrideDto = z.object({
  id: Uuid,
  missionId: Uuid,
  userId: Uuid,
  kind: z.enum(OverrideKind),
  gate: z.int().nullable(),
  gateEvaluationId: Uuid.nullable(),
  dispatchId: Uuid.nullable(),
  action: z.enum(OverrideAction).nullable(),
  checkId: z.string().nullable(),
  commitSha: z.string().nullable(),
  reason: z.string(),
  createdAt: IsoTime,
});
export type OverrideDto = z.infer<typeof OverrideDto>;

/** Route 51: "Start, retry, park or cancel by hand, with a reason". */
export const CreateDispatchOverrideInput = z.object({
  dispatchId: Uuid,
  rowVersion: RowVersion,
  action: z.enum(OverrideAction),
  reason: Reason,
});
export type CreateDispatchOverrideInput = z.infer<typeof CreateDispatchOverrideInput>;
