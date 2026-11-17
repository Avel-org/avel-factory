import * as z from "zod/mini";
import {
  AgentStepKind,
  AttemptCompute,
  AttemptKind,
  AttemptOutcome,
  AttemptResult,
  DispatchOrigin,
  DispatchRole,
  DispatchState,
  ModulePhase,
  OverrideAction,
  OverrideKind,
  RoomKind,
  RoomState,
  WorkKind,
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
import { DispatchPlain, ModulePlain } from "./plain.js";

/** Dispatches (routes 49 to 51). */

/** `mission_docs`: DISPATCH.md for a plan version. */
export const MissionDocDto = z.object({
  id: Uuid,
  missionId: Uuid,
  planId: Uuid,
  dispatchMd: z.string(),
  hash: z.string(),
  gate1PassedAt: z.nullable(IsoTime),
  createdAt: IsoTime,
});
export type MissionDocDto = z.infer<typeof MissionDocDto>;

/** `dispatches`. */
export const DispatchDto = z.object({
  id: Uuid,
  missionId: Uuid,
  moduleRunId: z.nullable(Uuid),
  planId: Uuid,
  agent: z.string(),
  role: z.enum(DispatchRole),
  pass: z.int(),
  state: z.enum(DispatchState),
  parkedFrom: z.nullable(z.enum(DispatchState)),
  origin: z.enum(DispatchOrigin),
  taskDocVersion: z.int(),
  resultCommit: z.nullable(z.string()),
  frozenIdentity: Json,
  wave: z.int(),
  createdAt: IsoTime,
  ...mutableFields,
  /** CR-W9. */
  plain: DispatchPlain,
});
export type DispatchDto = z.infer<typeof DispatchDto>;

export const ListMissionDispatchesInput = z.extend(PageQuery, { missionId: Uuid });
export type ListMissionDispatchesInput = z.infer<typeof ListMissionDispatchesInput>;

/** Route 49: the mission's dispatches "with DISPATCH.md". */
export const MissionDispatchesDto = z.extend(Page(DispatchDto), {
  missionDoc: z.nullable(MissionDocDto),
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
  /** CR-W11 decision 4: the task doc and the activation sent word for word, by hash. */
  taskDocSha256: z.string(),
  activationSha256: z.string(),
  agentConfigHash: z.string(),
  factoryCommit: z.string(),
  branch: z.string(),
  kind: z.enum(AttemptKind),
  vendor: z.string(),
  model: z.string(),
  compute: z.enum(AttemptCompute),
  checkpointCommit: z.nullable(z.string()),
  startedAt: IsoTime,
  endedAt: z.nullable(IsoTime),
  tokensIn: z.int(),
  tokensOut: z.int(),
  cacheRead: z.int(),
  cacheWrite5m: z.int(),
  cacheWrite1h: z.int(),
  costMicros: Micros,
  reservedMicros: Micros,
  capMicros: Micros,
  outcome: z.nullable(z.enum(AttemptOutcome)),
  failureNote: z.nullable(z.string()),
  createdAt: IsoTime,
  ...mutableFields,
});
export type AttemptDto = z.infer<typeof AttemptDto>;

/** `rooms`. */
export const RoomDto = z.object({
  id: Uuid,
  kind: z.enum(RoomKind),
  missionId: Uuid,
  dispatchId: z.nullable(Uuid),
  attemptId: z.nullable(Uuid),
  integrationCommitId: z.nullable(Uuid),
  state: z.enum(RoomState),
  imageDigest: z.nullable(z.string()),
  destroyedAt: z.nullable(IsoTime),
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
  room: z.nullable(RoomDto),
});
export type DispatchDetailDto = z.infer<typeof DispatchDetailDto>;

/** `overrides` (immutable). */
export const OverrideDto = z.object({
  id: Uuid,
  missionId: Uuid,
  userId: Uuid,
  kind: z.enum(OverrideKind),
  gate: z.nullable(z.int()),
  gateEvaluationId: z.nullable(Uuid),
  dispatchId: z.nullable(Uuid),
  action: z.nullable(z.enum(OverrideAction)),
  checkId: z.nullable(z.string()),
  commitSha: z.nullable(z.string()),
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

// ---------------------------------------------------------------- CR-W21 section 2: the module page

/** One attempt as the module page shows it. `summary` is the agent's, untrusted, plain text. */
export const ModuleAttemptDto = z.object({
  id: Uuid,
  dispatchId: Uuid,
  key: z.enum(["a1", "a2", "a3", "a4"]),
  label: z.enum(["Initial", "Retry 1", "Retry 2", "Retry 3"]),
  agent: z.string(),
  role: z.enum(DispatchRole),
  model: z.string(),
  startedAt: IsoTime,
  endedAt: z.nullable(IsoTime),
  minutes: z.int(),
  costMicros: Micros,
  result: z.enum(AttemptResult),
  summary: z.nullable(z.string()),
});
export type ModuleAttemptDto = z.infer<typeof ModuleAttemptDto>;

/**
 * A module run with its retry ladder, cost against its cap (AI cost, allowed), attempts and
 * findings (CR-W21 section 2). `ref` is the plan's module label ("M3"), unique per plan.
 */
export const ModuleRunViewDto = z.object({
  missionId: Uuid,
  moduleRunId: Uuid,
  ref: z.string(),
  name: z.string(),
  workKind: z.enum(WorkKind),
  goal: z.string(),
  territory: z.array(z.string()),
  requirements: z.int(),
  scenarios: z.int(),
  tests: z.object({ passed: z.int(), total: z.int() }),
  phase: z.enum(ModulePhase),
  capMicros: Micros,
  spentMicros: Micros,
  decisionRef: z.nullable(z.string()),
  attempts: z.array(ModuleAttemptDto),
  findings: z.array(
    z.object({
      id: Uuid,
      ref: z.string(),
      title: z.string(),
      state: z.string(),
      route: z.string(),
    }),
  ),
  plain: ModulePlain,
  rowVersion: RowVersion,
});
export type ModuleRunViewDto = z.infer<typeof ModuleRunViewDto>;

export const ModuleRunInput = z.object({
  missionId: Uuid,
  moduleRef: z.string().check(z.regex(/^M[0-9]+$/)),
});
export type ModuleRunInput = z.infer<typeof ModuleRunInput>;

/**
 * An agent step (CR-W21 section 2), projected from `agent_traces` by the server: `read`,
 * `edit`, `run` and `test` from tool calls, `think` from the model's text, `note` from
 * progress notes. `text` is untrusted plain text, at most 500 characters.
 */
export const AgentStepDto = z.object({
  attemptId: Uuid,
  traceSeq: z.int(),
  at: IsoTime,
  kind: z.enum(AgentStepKind),
  text: z.string().check(z.maxLength(500)),
});
export type AgentStepDto = z.infer<typeof AgentStepDto>;

/** Steps oldest first; `after` is the last `traceSeq` you have. */
export const ListAttemptStepsInput = z.object({
  attemptId: Uuid,
  after: z.optional(z.coerce.number().check(z.int(), z.minimum(0))),
  limit: z.optional(z.coerce.number().check(z.int(), z.minimum(1), z.maximum(100))),
});
export type ListAttemptStepsInput = z.infer<typeof ListAttemptStepsInput>;
