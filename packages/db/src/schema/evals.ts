// The `evals` module's tables (contract.md section 6, "One owner per table"), rebuilt from
// the database map (docs/design/AVEL Database Map.html) with section 6's changes on top.
// Value lists come from @avel/contract; triggers and functions are in drizzle/0000 and 0002.
import {
  DispatchRole,
  EvalRunAim,
  EvalRunStage,
  EvalRunState,
  EvalSet,
  EvalTaskSource,
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
  type PgTableExtraConfigValue,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { oneOf, oneOfOrNull } from "./columns.js";
import { factoryVersions } from "./knowledge.js";
import { users } from "./platform.js";

/** `agent_configs` (Designed, not built yet): One frozen agent setup (model, effort, tools, skills, versions), hashed so results can be compared. */
export const agentConfigs = pgTable(
  "agent_configs",
  {
    hash: text("hash").primaryKey(),
    factoryCommit: text("factory_commit").notNull(),
    model: text("model").notNull(),
    modelSnapshot: text("model_snapshot").notNull(),
    effort: text("effort").notNull(),
    sdkVersion: text("sdk_version").notNull(),
    harnessVersion: text("harness_version").notNull(),
    rendererVersion: text("renderer_version").notNull(),
    selectorVersion: text("selector_version").notNull(),
    agentVersionSha256: text("agent_version_sha256").notNull(),
    skillsSha256: text("skills_sha256").notNull(),
    rulesVersion: text("rules_version").notNull(),
    kbRelease: text("kb_release").notNull(),
    tools: text("tools").array().notNull().default(sql`'{}'::text[]`),
    capMinutes: integer("cap_minutes").notNull(),
    capMicros: bigint("cap_micros", { mode: "number" }).notNull(),
    maxTurns: integer("max_turns").notNull(),
    retryProtocolVersion: text("retry_protocol_version").notNull(),
    roomImageDigest: text("room_image_digest").notNull(),
    checkRunnerDigest: text("check_runner_digest").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "agent_configs_factory_commit_factory_versions_sha_fk",
      columns: [t.factoryCommit],
      foreignColumns: [factoryVersions.sha],
    }).onDelete("restrict"),
    index("agent_configs_factory_commit_ix").on(t.factoryCommit),
  ],
);

/** `eval_results` (Designed, not built yet): One task's result in an eval run (designed, not running yet). */
export const evalResults = pgTable(
  "eval_results",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    evalRunId: uuid("eval_run_id").notNull(),
    taskId: uuid("task_id").notNull(),
    configHash: text("config_hash").notNull(),
    repeat: integer("repeat").notNull(),
    passedFirst: boolean("passed_first").notNull(),
    passedWithinRetries: boolean("passed_within_retries").notNull(),
    tokens: bigint("tokens", { mode: "number" }).notNull(),
    costMicros: bigint("cost_micros", { mode: "number" }).notNull(),
    wallMs: integer("wall_ms").notNull(),
    findings: jsonb("findings").notNull().default(sql`'[]'::jsonb`),
    seededCaught: boolean("seeded_caught"),
    violations: integer("violations").notNull().default(0),
    hiddenPassed: boolean("hidden_passed").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "eval_results_eval_run_id_eval_runs_id_fk",
      columns: [t.evalRunId],
      foreignColumns: [evalRuns.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "eval_results_task_id_eval_tasks_id_fk",
      columns: [t.taskId],
      foreignColumns: [evalTasks.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "eval_results_config_hash_agent_configs_hash_fk",
      columns: [t.configHash],
      foreignColumns: [agentConfigs.hash],
    }).onDelete("restrict"),
    index("eval_results_eval_run_id_ix").on(t.evalRunId),
    index("eval_results_task_id_ix").on(t.taskId),
    index("eval_results_config_hash_ix").on(t.configHash),
  ],
);

/** `eval_runs` (Designed, not built yet): A comparison of a candidate agent setup against the current one (designed, not running yet). */
export const evalRuns = pgTable(
  "eval_runs",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    baselineConfig: text("baseline_config").notNull(),
    candidateConfig: text("candidate_config").notNull(),
    graderVersion: text("grader_version").notNull(),
    stage: text("stage").notNull(),
    aim: text("aim").notNull(),
    set: text("set").notNull(),
    repeats: integer("repeats").notNull(),
    budgetMicros: bigint("budget_micros", { mode: "number" }).notNull(),
    state: text("state").notNull().default("proposed"),
    report: jsonb("report"),
    approvedBy: uuid("approved_by"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "eval_runs_baseline_config_agent_configs_hash_fk",
      columns: [t.baselineConfig],
      foreignColumns: [agentConfigs.hash],
    }).onDelete("restrict"),
    foreignKey({
      name: "eval_runs_candidate_config_agent_configs_hash_fk",
      columns: [t.candidateConfig],
      foreignColumns: [agentConfigs.hash],
    }).onDelete("restrict"),
    foreignKey({
      name: "eval_runs_approved_by_users_id_fk",
      columns: [t.approvedBy],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    check("eval_runs_stage_ck", oneOf(t.stage, EvalRunStage)),
    check("eval_runs_aim_ck", oneOf(t.aim, EvalRunAim)),
    check("eval_runs_set_ck", oneOf(t.set, EvalSet)),
    check("eval_runs_state_ck", oneOf(t.state, EvalRunState)),
    index("eval_runs_baseline_config_ix").on(t.baselineConfig),
    index("eval_runs_candidate_config_ix").on(t.candidateConfig),
    index("eval_runs_approved_by_ix").on(t.approvedBy),
  ],
);

/** `eval_tasks` (Designed, not built yet): A fixed task used to test agent setups (designed, not running yet). */
export const evalTasks = pgTable(
  "eval_tasks",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    set: text("set").notNull(),
    role: text("role"),
    fixtureRef: text("fixture_ref").notNull(),
    startCommit: text("start_commit").notNull(),
    taskDocHash: text("task_doc_hash").notNull(),
    lockManifestHash: text("lock_manifest_hash").notNull(),
    holdout: boolean("holdout").notNull().default(false),
    source: text("source").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    check("eval_tasks_set_ck", oneOf(t.set, EvalSet)),
    // CR-7, CR-8
    check("eval_tasks_role_ck", oneOfOrNull(t.role, DispatchRole)),
    check("eval_tasks_source_ck", oneOf(t.source, EvalTaskSource)),
  ],
);
