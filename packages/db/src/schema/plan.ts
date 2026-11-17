// The `plan` module's tables (contract.md section 6, "One owner per table"), rebuilt from
// the database map (docs/design/AVEL Database Map.html) with section 6's changes on top.
// Value lists come from @avel/contract; triggers and functions are in drizzle/0000 and 0002.
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
} from "@avel/contract";
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  type PgTableExtraConfigValue,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { oneOf, oneOfOrNull } from "./columns.js";
import { missions, proposals } from "./factory.js";
import { templates } from "./knowledge.js";
import { facts, onboardingSessions } from "./onboarding.js";
import { packages } from "./packages.js";
import { users } from "./platform.js";

/** `checks` (Plan): One check the plan requires, such as a test suite, lint or a security scan. */
export const checks = pgTable(
  "checks",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    planId: uuid("plan_id").notNull(),
    ref: text("ref").notNull(),
    kind: text("kind").notNull(),
    spec: jsonb("spec").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("checks_plan_id_ref_uq").on(t.planId, t.ref),
    unique("checks_plan_id_id_uq").on(t.planId, t.id),
    foreignKey({
      name: "checks_plan_id_plans_id_fk",
      columns: [t.planId],
      foreignColumns: [plans.id],
    }).onDelete("restrict"),
    check("checks_kind_ck", oneOf(t.kind, CheckKind)),
  ],
);

/** `codebase_analysis` (Plan): Canon's read of an existing repo: stack, structure and risks, used from 0.1 on. */
export const codebaseAnalysis = pgTable(
  "codebase_analysis",
  {
    planId: uuid("plan_id").primaryKey(),
    repoCommit: text("repo_commit"),
    stack: jsonb("stack").notNull(),
    conventions: text("conventions").notNull(),
    buildCmd: text("build_cmd").notNull(),
    testCmd: text("test_cmd").notNull(),
    lintCmd: text("lint_cmd").notNull(),
    standingContext: text("standing_context").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "codebase_analysis_plan_id_plans_id_fk",
      columns: [t.planId],
      foreignColumns: [plans.id],
    }).onDelete("restrict"),
    check(
      "codebase_analysis_standing_context_ck",
      oneOf(t.standingContext, CodebaseAnalysisStandingContext),
    ),
  ],
);

/** `mission_scenarios` (Plan): a scenario's identity across plan versions, like module_runs.ref for modules. Locks, quarantines and check results point here, so a contract change can't lose them */
export const missionScenarios = pgTable(
  "mission_scenarios",
  {
    missionId: uuid("mission_id").notNull(),
    key: text("key").notNull(),
    firstPlanId: uuid("first_plan_id").notNull(),
    retiredAt: timestamp("retired_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    primaryKey({ name: "mission_scenarios_pkey", columns: [t.missionId, t.key] }),
    foreignKey({
      name: "mission_scenarios_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "mission_scenarios_first_plan_fk",
      columns: [t.missionId, t.firstPlanId],
      foreignColumns: [plans.missionId, plans.id],
    }).onDelete("restrict"),
    index("mission_scenarios_first_plan_ix").on(t.missionId, t.firstPlanId),
  ],
);

/** `module_checks` (Plan): Which checks apply to which plan module. */
export const moduleChecks = pgTable(
  "module_checks",
  {
    planModuleId: uuid("plan_module_id").notNull(),
    checkId: uuid("check_id").notNull(),
    planId: uuid("plan_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    primaryKey({ name: "module_checks_pkey", columns: [t.planModuleId, t.checkId] }),
    foreignKey({
      name: "module_checks_plan_id_plans_id_fk",
      columns: [t.planId],
      foreignColumns: [plans.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "module_checks_module_fk",
      columns: [t.planId, t.planModuleId],
      foreignColumns: [planModules.planId, planModules.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "module_checks_check_fk",
      columns: [t.planId, t.checkId],
      foreignColumns: [checks.planId, checks.id],
    }).onDelete("restrict"),
    index("module_checks_module_ix").on(t.planId, t.planModuleId),
    index("module_checks_check_ix").on(t.planId, t.checkId),
  ],
);

/** `plan_module_deps` (Plan): Which plan modules depend on which. */
export const planModuleDeps = pgTable(
  "plan_module_deps",
  {
    planModuleId: uuid("plan_module_id").notNull(),
    dependsOnId: uuid("depends_on_id").notNull(),
    planId: uuid("plan_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    primaryKey({ name: "plan_module_deps_pkey", columns: [t.planModuleId, t.dependsOnId] }),
    foreignKey({
      name: "plan_module_deps_plan_id_plans_id_fk",
      columns: [t.planId],
      foreignColumns: [plans.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "plan_module_deps_module_fk",
      columns: [t.planId, t.planModuleId],
      foreignColumns: [planModules.planId, planModules.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "plan_module_deps_depends_on_fk",
      columns: [t.planId, t.dependsOnId],
      foreignColumns: [planModules.planId, planModules.id],
    }).onDelete("restrict"),
    check("plan_module_deps_not_self_ck", sql`(plan_module_id <> depends_on_id)`),
    index("plan_module_deps_module_ix").on(t.planId, t.planModuleId),
    index("plan_module_deps_depends_on_ix").on(t.planId, t.dependsOnId),
  ],
);

/** `plan_modules` (Plan): One module in a plan version: its goal, its write paths and its wave. */
export const planModules = pgTable(
  "plan_modules",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    planId: uuid("plan_id").notNull(),
    ref: text("ref").notNull(),
    goal: text("goal").notNull(),
    workKind: text("work_kind").notNull(),
    wave: integer("wave").notNull(),
    writePaths: text("write_paths").array().notNull().default(sql`'{}'::text[]`),
    forbiddenPaths: jsonb("forbidden_paths").notNull().default(sql`'[]'::jsonb`),
    constraints: text("constraints").array().notNull().default(sql`'{}'::text[]`),
    escalateWhen: text("escalate_when").array().notNull().default(sql`'{}'::text[]`),
    referencePaths: text("reference_paths").array().notNull().default(sql`'{}'::text[]`),
    securityTriggers: text("security_triggers").array().notNull().default(sql`'{}'::text[]`),
    asvsLevel: text("asvs_level"),
    dataClassification: text("data_classification"),
    trace: jsonb("trace"),
    estMinutes: integer("est_minutes").notNull(),
    estMicros: bigint("est_micros", { mode: "number" }).notNull(),
    estSource: text("est_source").notNull(),
    provisional: boolean("provisional").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("plan_modules_plan_id_id_ref_uq").on(t.planId, t.id, t.ref),
    unique("plan_modules_plan_id_ref_uq").on(t.planId, t.ref),
    unique("plan_modules_plan_id_id_uq").on(t.planId, t.id),
    foreignKey({
      name: "plan_modules_plan_id_plans_id_fk",
      columns: [t.planId],
      foreignColumns: [plans.id],
    }).onDelete("restrict"),
    check("plan_modules_est_source_ck", oneOf(t.estSource, PlanModuleEstSource)),
    // CR-7
    check("plan_modules_work_kind_ck", oneOf(t.workKind, WorkKind)),
    check("plan_modules_asvs_level_ck", oneOfOrNull(t.asvsLevel, PlanModuleAsvsLevel)),
    check(
      "plan_modules_data_classification_ck",
      oneOfOrNull(t.dataClassification, PlanModuleDataClassification),
    ),
  ],
);

/** `plans` (Plan): source 'proposal': a contract_change or reentry decision produced this version */
export const plans = pgTable(
  "plans",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    version: integer("version").notNull(),
    source: text("source").notNull(),
    sessionId: uuid("session_id"),
    proposalId: uuid("proposal_id"),
    packageKey: text("package_key").notNull(),
    packageVersion: text("package_version").notNull(),
    rosterVersion: text("roster_version").notNull(),
    briefSnapshot: jsonb("brief_snapshot").notNull(),
    state: text("state").notNull().default("draft"),
    supersedesPlanId: uuid("supersedes_plan_id"),
    templateSlug: text("template_slug"),
    templateVersion: text("template_version"),
    priceMicros: bigint("price_micros", { mode: "number" }).notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedBy: uuid("approved_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("plans_mission_id_id_uq").on(t.missionId, t.id),
    unique("plans_mission_id_id_state_uq").on(t.missionId, t.id, t.state),
    unique("plans_mission_id_version_uq").on(t.missionId, t.version),
    uniqueIndex("plans_one_approved_uq").on(t.missionId).where(sql`(state = 'approved'::text)`),
    uniqueIndex("plans_one_draft_uq").on(t.missionId).where(sql`(state = 'draft'::text)`),
    foreignKey({
      name: "plans_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "plans_approved_by_users_id_fk",
      columns: [t.approvedBy],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "plans_session_fk",
      columns: [t.missionId, t.sessionId],
      foreignColumns: [onboardingSessions.missionId, onboardingSessions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "plans_proposal_fk",
      columns: [t.missionId, t.proposalId],
      foreignColumns: [proposals.missionId, proposals.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "plans_package_fk",
      columns: [t.packageKey, t.packageVersion],
      foreignColumns: [packages.key, packages.version],
    }).onDelete("restrict"),
    foreignKey({
      name: "plans_supersedes_fk",
      columns: [t.missionId, t.supersedesPlanId],
      foreignColumns: [t.missionId, t.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "plans_template_fk",
      columns: [t.templateSlug, t.templateVersion],
      foreignColumns: [templates.slug, templates.version],
    }).onDelete("restrict"),
    check("plans_source_ck", oneOf(t.source, PlanSource)),
    check("plans_state_ck", oneOf(t.state, PlanState)),
    check("plans_version_ck", sql`(version >= 1)`),
    check(
      "plans_source_onboarding_ck",
      sql`((source <> 'onboarding'::text) OR ((session_id IS NOT NULL) AND (proposal_id IS NULL)))`,
    ),
    check(
      "plans_source_proposal_ck",
      sql`((source <> 'proposal'::text) OR ((proposal_id IS NOT NULL) AND (session_id IS NULL)))`,
    ),
    check("plans_template_pair_ck", sql`((template_slug IS NULL) = (template_version IS NULL))`),
    check(
      "plans_approved_ck",
      sql`
CASE
    WHEN (state = 'draft'::text) THEN ((approved_at IS NULL) AND (approved_by IS NULL))
    ELSE ((approved_at IS NOT NULL) AND (approved_by IS NOT NULL))
END`,
    ),
    index("plans_session_ix").on(t.missionId, t.sessionId),
    index("plans_proposal_ix").on(t.missionId, t.proposalId),
    index("plans_package_ix").on(t.packageKey, t.packageVersion),
    index("plans_supersedes_ix").on(t.missionId, t.supersedesPlanId),
    index("plans_template_ix").on(t.templateSlug, t.templateVersion),
    index("plans_approved_by_ix").on(t.approvedBy),
  ],
);

/** `quality_targets` (Plan): A measurable target the plan sets, such as a performance or coverage threshold. */
export const qualityTargets = pgTable(
  "quality_targets",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    planId: uuid("plan_id").notNull(),
    planModuleId: uuid("plan_module_id"),
    metric: text("metric").notNull(),
    threshold: numeric("threshold").notNull(),
    checkId: uuid("check_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "quality_targets_plan_id_plans_id_fk",
      columns: [t.planId],
      foreignColumns: [plans.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "quality_targets_module_fk",
      columns: [t.planId, t.planModuleId],
      foreignColumns: [planModules.planId, planModules.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "quality_targets_check_fk",
      columns: [t.planId, t.checkId],
      foreignColumns: [checks.planId, checks.id],
    }).onDelete("restrict"),
    index("quality_targets_module_ix").on(t.planId, t.planModuleId),
    index("quality_targets_check_ix").on(t.planId, t.checkId),
  ],
);

/** `requirements` (Plan): One requirement in a plan version, traced to the facts it came from. */
export const requirements = pgTable(
  "requirements",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    planId: uuid("plan_id").notNull(),
    planModuleId: uuid("plan_module_id").notNull(),
    ref: text("ref").notNull(),
    earsPattern: text("ears_pattern").notNull(),
    text: text("text").notNull(),
    factId: uuid("fact_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("requirements_plan_id_ref_uq").on(t.planId, t.ref),
    unique("requirements_plan_id_id_uq").on(t.planId, t.id),
    foreignKey({
      name: "requirements_plan_fk",
      columns: [t.missionId, t.planId],
      foreignColumns: [plans.missionId, plans.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "requirements_module_fk",
      columns: [t.planId, t.planModuleId],
      foreignColumns: [planModules.planId, planModules.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "requirements_fact_fk",
      columns: [t.missionId, t.factId],
      foreignColumns: [facts.missionId, facts.id],
    }).onDelete("restrict"),
    check("requirements_ears_pattern_ck", oneOf(t.earsPattern, EarsPattern)),
    index("requirements_plan_ix").on(t.missionId, t.planId),
    index("requirements_module_ix").on(t.planId, t.planModuleId),
    index("requirements_fact_ix").on(t.missionId, t.factId),
  ],
);

/** `scenario_modules` (Plan): the modules a scenario needs; its test is locked with the last of them to land */
export const scenarioModules = pgTable(
  "scenario_modules",
  {
    scenarioId: uuid("scenario_id").notNull(),
    planModuleId: uuid("plan_module_id").notNull(),
    planId: uuid("plan_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    primaryKey({ name: "scenario_modules_pkey", columns: [t.scenarioId, t.planModuleId] }),
    foreignKey({
      name: "scenario_modules_plan_id_plans_id_fk",
      columns: [t.planId],
      foreignColumns: [plans.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "scenario_modules_scenario_fk",
      columns: [t.planId, t.scenarioId],
      foreignColumns: [scenarios.planId, scenarios.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "scenario_modules_module_fk",
      columns: [t.planId, t.planModuleId],
      foreignColumns: [planModules.planId, planModules.id],
    }).onDelete("restrict"),
    index("scenario_modules_scenario_ix").on(t.planId, t.scenarioId),
    index("scenario_modules_module_ix").on(t.planId, t.planModuleId),
  ],
);

/** `scenarios` (Plan): An acceptance scenario in a plan version. */
export const scenarios = pgTable(
  "scenarios",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    planId: uuid("plan_id").notNull(),
    requirementId: uuid("requirement_id").notNull(),
    ref: text("ref").notNull(),
    level: text("level").notNull(),
    given: text("given").notNull(),
    when: text("when").notNull(),
    // biome-ignore lint/suspicious/noThenProperty: the map's column name; a column builder, never a thenable
    then: text("then").notNull(),
    kind: text("kind").notNull(),
    acceptance: boolean("acceptance").notNull(),
    checkId: uuid("check_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("scenarios_plan_id_ref_uq").on(t.planId, t.ref),
    unique("scenarios_plan_id_id_uq").on(t.planId, t.id),
    foreignKey({
      name: "scenarios_plan_fk",
      columns: [t.missionId, t.planId],
      foreignColumns: [plans.missionId, plans.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "scenarios_requirement_fk",
      columns: [t.planId, t.requirementId],
      foreignColumns: [requirements.planId, requirements.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "scenarios_mission_scenario_fk",
      columns: [t.missionId, t.ref],
      foreignColumns: [missionScenarios.missionId, missionScenarios.key],
    }).onDelete("restrict"),
    foreignKey({
      name: "scenarios_check_fk",
      columns: [t.planId, t.checkId],
      foreignColumns: [checks.planId, checks.id],
    }).onDelete("restrict"),
    // CR-9
    check("scenarios_level_ck", oneOf(t.level, Level)),
    check("scenarios_kind_ck", oneOf(t.kind, ScenarioKind)),
    index("scenarios_plan_ix").on(t.missionId, t.planId),
    index("scenarios_requirement_ix").on(t.planId, t.requirementId),
    index("scenarios_mission_scenario_ix").on(t.missionId, t.ref),
    index("scenarios_check_ix").on(t.planId, t.checkId),
  ],
);
