// The `gate` module's tables (contract.md section 6, "One owner per table"), rebuilt from
// the database map (docs/design/AVEL Database Map.html) with section 6's changes on top.
// Value lists come from @avel/contract; triggers and functions are in drizzle/0000 and 0002.
import {
  CheckResultResult,
  GateEvaluationResult,
  GateRunState,
  GateRunTrigger,
  ReceiptVerdict,
} from "@avel/contract";
import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  type PgTableExtraConfigValue,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { oneOf } from "./columns.js";
import { missions, moduleRuns } from "./factory.js";
import { integrationCommits } from "./integrator.js";
import { factoryVersions } from "./knowledge.js";
import { checks, missionScenarios, plans } from "./plan.js";
import { users } from "./platform.js";
import { attempts } from "./runner.js";

/** `check_results` (Verification and delivery): one row per scenario or check per run per commit; decide() reads these */
export const checkResults = pgTable(
  "check_results",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    gateEvaluationId: uuid("gate_evaluation_id").notNull(),
    planId: uuid("plan_id").notNull(),
    scenarioKey: text("scenario_key"),
    checkId: uuid("check_id"),
    runN: integer("run_n").notNull().default(1),
    result: text("result").notNull(),
    durationMs: integer("duration_ms").notNull(),
    outputRef: text("output_ref"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("check_results_one_per_run_uq").on(t.gateEvaluationId, t.scenarioKey, t.checkId, t.runN),
    foreignKey({
      name: "check_results_gate_evaluation_fk",
      columns: [t.missionId, t.gateEvaluationId],
      foreignColumns: [gateEvaluations.missionId, gateEvaluations.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "check_results_plan_fk",
      columns: [t.missionId, t.planId],
      foreignColumns: [plans.missionId, plans.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "check_results_scenario_fk",
      columns: [t.missionId, t.scenarioKey],
      foreignColumns: [missionScenarios.missionId, missionScenarios.key],
    }).onDelete("restrict"),
    foreignKey({
      name: "check_results_check_fk",
      columns: [t.planId, t.checkId],
      foreignColumns: [checks.planId, checks.id],
    }).onDelete("restrict"),
    check("check_results_result_ck", oneOf(t.result, CheckResultResult)),
    check("check_results_subject_ck", sql`((scenario_key IS NOT NULL) OR (check_id IS NOT NULL))`),
    index("check_results_gate_evaluation_ix").on(t.missionId, t.gateEvaluationId),
    index("check_results_plan_ix").on(t.missionId, t.planId),
    index("check_results_scenario_ix").on(t.missionId, t.scenarioKey),
    index("check_results_check_ix").on(t.planId, t.checkId),
  ],
);

/** `gate_evaluations` (Verification and delivery): One gate's result on one commit, attempt or run, with its reasons. */
export const gateEvaluations = pgTable(
  "gate_evaluations",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    gate: smallint("gate").notNull(),
    commitSha: text("commit_sha").notNull(),
    moduleRunId: uuid("module_run_id"),
    integrationCommitId: uuid("integration_commit_id"),
    attemptId: uuid("attempt_id"),
    gateRunId: uuid("gate_run_id"),
    result: text("result").notNull(),
    reasons: jsonb("reasons").notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("gate_evaluations_mission_id_id_uq").on(t.missionId, t.id),
    unique("gate_evaluations_mission_id_id_gate_uq").on(t.missionId, t.id, t.gate),
    uniqueIndex("gate_evaluations_gate2_uq").on(t.integrationCommitId).where(sql`(gate = 2)`),
    uniqueIndex("gate_evaluations_gate3_uq").on(t.attemptId).where(sql`(gate = 3)`),
    uniqueIndex("gate_evaluations_gate5_uq").on(t.gateRunId).where(sql`(gate = 5)`),
    foreignKey({
      name: "gate_evaluations_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "gate_evaluations_module_run_fk",
      columns: [t.missionId, t.moduleRunId],
      foreignColumns: [moduleRuns.missionId, moduleRuns.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "gate_evaluations_integration_commit_fk",
      columns: [t.missionId, t.integrationCommitId],
      foreignColumns: [integrationCommits.missionId, integrationCommits.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "gate_evaluations_attempt_fk",
      columns: [t.missionId, t.attemptId],
      foreignColumns: [attempts.missionId, attempts.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "gate_evaluations_gate_run_fk",
      columns: [t.missionId, t.gateRunId],
      foreignColumns: [gateRuns.missionId, gateRuns.id],
    }).onDelete("restrict"),
    check("gate_evaluations_gate_ck", sql`((gate >= 1) AND (gate <= 5))`),
    check("gate_evaluations_result_ck", oneOf(t.result, GateEvaluationResult)),
    check(
      "gate_evaluations_parent_ck",
      sql`
CASE gate
    WHEN 2 THEN ((integration_commit_id IS NOT NULL) AND (attempt_id IS NULL) AND (gate_run_id IS NULL))
    WHEN 3 THEN ((attempt_id IS NOT NULL) AND (integration_commit_id IS NULL) AND (gate_run_id IS NULL))
    WHEN 5 THEN ((gate_run_id IS NOT NULL) AND (integration_commit_id IS NULL) AND (attempt_id IS NULL))
    ELSE ((integration_commit_id IS NULL) AND (attempt_id IS NULL) AND (gate_run_id IS NULL))
END`,
    ),
    index("gate_evaluations_module_run_ix").on(t.missionId, t.moduleRunId),
    index("gate_evaluations_integration_commit_ix").on(t.missionId, t.integrationCommitId),
    index("gate_evaluations_attempt_ix").on(t.missionId, t.attemptId),
    index("gate_evaluations_gate_run_ix").on(t.missionId, t.gateRunId),
    index("gate_evaluations_at_commit_ix").on(t.missionId, t.commitSha, t.gate),
  ],
);

/** `gate_runs` (Verification and delivery): A Gate 5 run over a mission's final commit, which produces its receipt. */
export const gateRuns = pgTable(
  "gate_runs",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    planId: uuid("plan_id").notNull(),
    commitSha: text("commit_sha").notNull(),
    decideVersion: integer("decide_version").notNull(),
    state: text("state").notNull().default("running"),
    trigger: text("trigger").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("gate_runs_mission_id_id_uq").on(t.missionId, t.id),
    uniqueIndex("gate_runs_one_running_uq").on(t.missionId).where(sql`(state = 'running'::text)`),
    foreignKey({
      name: "gate_runs_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "gate_runs_plan_fk",
      columns: [t.missionId, t.planId],
      foreignColumns: [plans.missionId, plans.id],
    }).onDelete("restrict"),
    check("gate_runs_state_ck", oneOf(t.state, GateRunState)),
    check("gate_runs_trigger_ck", oneOf(t.trigger, GateRunTrigger)),
    index("gate_runs_plan_ix").on(t.missionId, t.planId),
  ],
);

/** `pass_approvals` (Verification and delivery): Your approval of a pass verdict, tied to the receipt's hash, with a reason. */
export const passApprovals = pgTable(
  "pass_approvals",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    receiptId: uuid("receipt_id").notNull(),
    receiptHash: text("receipt_hash").notNull(),
    receiptVerdict: text("receipt_verdict").notNull(),
    reason: text("reason").notNull(),
    userId: uuid("user_id").notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("pass_approvals_receipt_id_uq").on(t.receiptId),
    unique("pass_approvals_id_receipt_id_uq").on(t.id, t.receiptId),
    foreignKey({
      name: "pass_approvals_user_id_users_id_fk",
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "pass_approvals_receipt_hash_fk",
      columns: [t.receiptId, t.receiptHash],
      foreignColumns: [receipts.id, receipts.hash],
    }).onDelete("restrict"),
    foreignKey({
      name: "pass_approvals_receipt_verdict_fk",
      columns: [t.receiptId, t.receiptVerdict],
      foreignColumns: [receipts.id, receipts.verdict],
    }).onDelete("restrict"),
    check("pass_approvals_verdict_ck", sql`(receipt_verdict = 'pass'::text)`),
    index("pass_approvals_user_id_ix").on(t.userId),
  ],
);

/** `receipts` (Verification and delivery): The hashed record of a mission's verdict, evidence and cost, issued by Gate 5. */
export const receipts = pgTable(
  "receipts",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    gateRunId: uuid("gate_run_id").notNull(),
    version: integer("version").notNull(),
    hash: text("hash").notNull(),
    verdict: text("verdict").notNull(),
    commitSha: text("commit_sha").notNull(),
    factoryCommit: text("factory_commit").notNull(),
    verdictCaps: text("verdict_caps").array().notNull().default(sql`'{}'::text[]`),
    body: jsonb("body").notNull(),
    humanMinutes: integer("human_minutes").notNull(),
    aiTokens: bigint("ai_tokens", { mode: "number" }).notNull(),
    aiCostMicros: bigint("ai_cost_micros", { mode: "number" }).notNull(),
    vendors: text("vendors").array().notNull().default(sql`'{}'::text[]`),
    overrideCount: integer("override_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("receipts_hash_uq").on(t.hash),
    unique("receipts_gate_run_id_version_uq").on(t.gateRunId, t.version),
    unique("receipts_id_hash_uq").on(t.id, t.hash),
    unique("receipts_id_verdict_uq").on(t.id, t.verdict),
    unique("receipts_mission_id_id_uq").on(t.missionId, t.id),
    foreignKey({
      name: "receipts_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "receipts_factory_commit_factory_versions_sha_fk",
      columns: [t.factoryCommit],
      foreignColumns: [factoryVersions.sha],
    }).onDelete("restrict"),
    foreignKey({
      name: "receipts_gate_run_fk",
      columns: [t.missionId, t.gateRunId],
      foreignColumns: [gateRuns.missionId, gateRuns.id],
    }).onDelete("restrict"),
    check("receipts_verdict_ck", oneOf(t.verdict, ReceiptVerdict)),
    check("receipts_version_ck", sql`(version >= 1)`),
    index("receipts_gate_run_ix").on(t.missionId, t.gateRunId),
    index("receipts_factory_commit_ix").on(t.factoryCommit),
  ],
);

/** `release_approvals` (Verification and delivery): Your approval to release a receipt's exact commit (approval #2). */
export const releaseApprovals = pgTable(
  "release_approvals",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    receiptId: uuid("receipt_id").notNull(),
    receiptHash: text("receipt_hash").notNull(),
    receiptVerdict: text("receipt_verdict").notNull(),
    passApprovalId: uuid("pass_approval_id"),
    userId: uuid("user_id").notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("release_approvals_receipt_id_uq").on(t.receiptId),
    unique("release_approvals_id_receipt_id_uq").on(t.id, t.receiptId),
    foreignKey({
      name: "release_approvals_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "release_approvals_user_id_users_id_fk",
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "release_approvals_receipt_fk",
      columns: [t.missionId, t.receiptId],
      foreignColumns: [receipts.missionId, receipts.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "release_approvals_receipt_hash_fk",
      columns: [t.receiptId, t.receiptHash],
      foreignColumns: [receipts.id, receipts.hash],
    }).onDelete("restrict"),
    foreignKey({
      name: "release_approvals_receipt_verdict_fk",
      columns: [t.receiptId, t.receiptVerdict],
      foreignColumns: [receipts.id, receipts.verdict],
    }).onDelete("restrict"),
    foreignKey({
      name: "release_approvals_pass_approval_fk",
      columns: [t.passApprovalId, t.receiptId],
      foreignColumns: [passApprovals.id, passApprovals.receiptId],
    }).onDelete("restrict"),
    check("release_approvals_not_fail_ck", sql`(receipt_verdict <> 'fail'::text)`),
    check(
      "release_approvals_pass_ck",
      sql`((receipt_verdict = 'pass'::text) = (pass_approval_id IS NOT NULL))`,
    ),
    index("release_approvals_receipt_ix").on(t.missionId, t.receiptId),
    index("release_approvals_pass_approval_ix").on(t.passApprovalId, t.receiptId),
    index("release_approvals_user_id_ix").on(t.userId),
  ],
);
