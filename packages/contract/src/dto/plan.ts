import { z } from "zod";
import {
  CheckKind,
  CodebaseAnalysisStandingContext,
  EarsPattern,
  Level,
  PlanModuleAsvsLevel,
  PlanModuleDataClassification,
  PlanModuleEstSource,
  PlanSource,
  PlanState,
  ScenarioKind,
  WorkKind,
} from "../value-lists.js";
import { IsoTime, Json, Micros, mutableFields, Placeholder, Uuid } from "./common.js";

/** Plan and roster (routes 46 to 48). */

/** `plans`. */
export const PlanDto = z.object({
  id: Uuid,
  missionId: Uuid,
  version: z.int(),
  source: z.enum(PlanSource),
  sessionId: Uuid.nullable(),
  proposalId: Uuid.nullable(),
  packageKey: z.string(),
  packageVersion: z.string(),
  rosterVersion: z.string(),
  briefSnapshot: Json,
  state: z.enum(PlanState),
  supersedesPlanId: Uuid.nullable(),
  templateSlug: z.string().nullable(),
  templateVersion: z.string().nullable(),
  priceMicros: Micros,
  approvedAt: IsoTime.nullable(),
  approvedBy: Uuid.nullable(),
  createdAt: IsoTime,
  ...mutableFields,
});
export type PlanDto = z.infer<typeof PlanDto>;

/** `codebase_analysis`. */
export const CodebaseAnalysisDto = z.object({
  planId: Uuid,
  repoCommit: z.string().nullable(),
  stack: Json,
  conventions: z.string(),
  buildCmd: z.string(),
  testCmd: z.string(),
  lintCmd: z.string(),
  standingContext: z.enum(CodebaseAnalysisStandingContext),
  createdAt: IsoTime,
});
export type CodebaseAnalysisDto = z.infer<typeof CodebaseAnalysisDto>;

/** `plan_modules`. */
export const PlanModuleDto = z.object({
  id: Uuid,
  planId: Uuid,
  ref: z.string(),
  goal: z.string(),
  workKind: z.enum(WorkKind),
  wave: z.int(),
  writePaths: z.array(z.string()),
  forbiddenPaths: Json,
  constraints: z.array(z.string()),
  escalateWhen: z.array(z.string()),
  referencePaths: z.array(z.string()),
  securityTriggers: z.array(z.string()),
  asvsLevel: z.enum(PlanModuleAsvsLevel).nullable(),
  dataClassification: z.enum(PlanModuleDataClassification).nullable(),
  trace: Json.nullable(),
  estMinutes: z.int(),
  estMicros: Micros,
  estSource: z.enum(PlanModuleEstSource),
  provisional: z.boolean(),
  createdAt: IsoTime,
});
export type PlanModuleDto = z.infer<typeof PlanModuleDto>;

/** `plan_module_deps`. */
export const PlanModuleDepDto = z.object({
  planModuleId: Uuid,
  dependsOnId: Uuid,
  planId: Uuid,
  createdAt: IsoTime,
});
export type PlanModuleDepDto = z.infer<typeof PlanModuleDepDto>;

/** `requirements`. */
export const RequirementDto = z.object({
  id: Uuid,
  missionId: Uuid,
  planId: Uuid,
  planModuleId: Uuid,
  ref: z.string(),
  earsPattern: z.enum(EarsPattern),
  text: z.string(),
  factId: Uuid,
  createdAt: IsoTime,
});
export type RequirementDto = z.infer<typeof RequirementDto>;

/** `scenarios`. */
export const ScenarioDto = z.object({
  id: Uuid,
  missionId: Uuid,
  planId: Uuid,
  requirementId: Uuid,
  ref: z.string(),
  level: z.enum(Level),
  given: z.string(),
  when: z.string(),
  // biome-ignore lint/suspicious/noThenProperty: the map's column `scenarios.then`; its value is a string, never a function, so the object is never thenable.
  then: z.string(),
  kind: z.enum(ScenarioKind),
  acceptance: z.boolean(),
  checkId: Uuid,
  createdAt: IsoTime,
});
export type ScenarioDto = z.infer<typeof ScenarioDto>;

/** `scenario_modules`. */
export const ScenarioModuleDto = z.object({
  scenarioId: Uuid,
  planModuleId: Uuid,
  planId: Uuid,
  createdAt: IsoTime,
});
export type ScenarioModuleDto = z.infer<typeof ScenarioModuleDto>;

/** `checks`. */
export const CheckDto = z.object({
  id: Uuid,
  planId: Uuid,
  ref: z.string(),
  kind: z.enum(CheckKind),
  spec: Json,
  createdAt: IsoTime,
});
export type CheckDto = z.infer<typeof CheckDto>;

/** `module_checks`. */
export const ModuleCheckDto = z.object({
  planModuleId: Uuid,
  checkId: Uuid,
  planId: Uuid,
  createdAt: IsoTime,
});
export type ModuleCheckDto = z.infer<typeof ModuleCheckDto>;

/** `quality_targets`. */
export const QualityTargetDto = z.object({
  id: Uuid,
  planId: Uuid,
  planModuleId: Uuid.nullable(),
  metric: z.string(),
  threshold: z.number(),
  checkId: Uuid,
  createdAt: IsoTime,
});
export type QualityTargetDto = z.infer<typeof QualityTargetDto>;

/** Route 46's input: `?version=`, defaulting to the mission's current plan. */
export const GetPlanInput = z.object({
  missionId: Uuid,
  version: z.coerce.number().int().min(1).optional(),
});
export type GetPlanInput = z.infer<typeof GetPlanInput>;

/** Route 46's output: one plan version and the tables frozen with it. */
export const PlanViewDto = z.object({
  plan: PlanDto,
  codebaseAnalysis: CodebaseAnalysisDto.nullable(),
  modules: z.array(PlanModuleDto),
  moduleDeps: z.array(PlanModuleDepDto),
  requirements: z.array(RequirementDto),
  scenarios: z.array(ScenarioDto),
  scenarioModules: z.array(ScenarioModuleDto),
  checks: z.array(CheckDto),
  moduleChecks: z.array(ModuleCheckDto),
  qualityTargets: z.array(QualityTargetDto),
});
export type PlanViewDto = z.infer<typeof PlanViewDto>;

/**
 * Routes 47 and 48: the roster lives in the factory repo, not a table. Its version
 * is the `roster_version` that missions and plans pin; the rest is a placeholder.
 */
export const RosterDto = z.object({
  version: z.string().min(1),
  roster: Placeholder,
});
export type RosterDto = z.infer<typeof RosterDto>;

/**
 * Route 48: "Replaces the whole roster as a new version, filed as a factory-repo PR".
 * `version` is the roster version it replaces, so a stale one gets 409.
 */
export const PutRosterInput = RosterDto;
export type PutRosterInput = z.infer<typeof PutRosterInput>;
