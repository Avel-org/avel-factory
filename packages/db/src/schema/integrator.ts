// The `integrator` module's tables (contract.md section 6, "One owner per table"), rebuilt from
// the database map (docs/design/AVEL Database Map.html) with section 6's changes on top.
// Value lists come from @avel/contract; triggers and functions are in drizzle/0000 and 0002.
import {
  DependencyRequestState,
  IntegrationCommitKind,
  IntegrationCommitState,
  TestLockKind,
} from "@avel/contract";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  type PgTableExtraConfigValue,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { oneOf } from "./columns.js";
import { dispatches, missions, moduleRuns, proposals } from "./factory.js";
import { missionScenarios } from "./plan.js";
import { users } from "./platform.js";
import { attempts } from "./runner.js";

/** `dependency_requests` (Execution): An agent's request for a package, approved by you when it's new to the factory. */
export const dependencyRequests = pgTable(
  "dependency_requests",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    dispatchId: uuid("dispatch_id").notNull(),
    proposalId: uuid("proposal_id"),
    name: text("name").notNull(),
    version: text("version").notNull(),
    reason: text("reason").notNull(),
    newToFactory: boolean("new_to_factory").notNull(),
    state: text("state").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("dependency_requests_mission_id_id_uq").on(t.missionId, t.id),
    foreignKey({
      name: "dependency_requests_dispatch_fk",
      columns: [t.missionId, t.dispatchId],
      foreignColumns: [dispatches.missionId, dispatches.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "dependency_requests_proposal_fk",
      columns: [t.missionId, t.proposalId],
      foreignColumns: [proposals.missionId, proposals.id],
    }).onDelete("restrict"),
    check("dependency_requests_state_ck", oneOf(t.state, DependencyRequestState)),
    index("dependency_requests_dispatch_ix").on(t.missionId, t.dispatchId),
    index("dependency_requests_proposal_ix").on(t.missionId, t.proposalId),
  ],
);

/** `integration_commits` (Execution): One commit the integrator tests and lands on the mission branch: tests, a module, a dependency or your own work. */
export const integrationCommits = pgTable(
  "integration_commits",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    kind: text("kind").notNull(),
    moduleRunId: uuid("module_run_id"),
    attemptId: uuid("attempt_id"),
    dependencyRequestId: uuid("dependency_request_id"),
    baseSha: text("base_sha"),
    commitSha: text("commit_sha"),
    state: text("state").notNull().default("queued"),
    results: jsonb("results"),
    queuedAt: timestamp("queued_at", { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("integration_commits_mission_id_id_uq").on(t.missionId, t.id),
    uniqueIndex("integration_commits_one_testing_uq")
      .on(t.missionId)
      .where(sql`(state = 'testing'::text)`),
    uniqueIndex("integration_commits_one_in_flight_uq")
      .on(t.moduleRunId)
      .where(sql`(state = ANY (ARRAY['queued'::text, 'testing'::text]))`),
    foreignKey({
      name: "integration_commits_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "integration_commits_module_run_fk",
      columns: [t.missionId, t.moduleRunId],
      foreignColumns: [moduleRuns.missionId, moduleRuns.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "integration_commits_attempt_fk",
      columns: [t.missionId, t.attemptId],
      foreignColumns: [attempts.missionId, attempts.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "integration_commits_dependency_fk",
      columns: [t.missionId, t.dependencyRequestId],
      foreignColumns: [dependencyRequests.missionId, dependencyRequests.id],
    }).onDelete("restrict"),
    // CR-7, CR-8 (B3); CR-16
    check("integration_commits_kind_ck", oneOf(t.kind, IntegrationCommitKind)),
    check("integration_commits_state_ck", oneOf(t.state, IntegrationCommitState)),
    check(
      "integration_commits_started_ck",
      sql`((state = 'queued'::text) OR ((base_sha IS NOT NULL) AND (started_at IS NOT NULL)))`,
    ),
    check(
      "integration_commits_finished_ck",
      sql`((state <> ALL (ARRAY['landed'::text, 'rejected'::text])) OR ((results IS NOT NULL) AND (finished_at IS NOT NULL)))`,
    ),
    check(
      "integration_commits_landed_ck",
      sql`((state <> 'landed'::text) OR (commit_sha IS NOT NULL))`,
    ),
    // INT finding 01 (ui_contract, api_contract: the tests shape); CR-16 (dispatch_docs: the operator shape)
    check(
      "integration_commits_by_kind_ck",
      sql`
CASE kind
    WHEN 'module'::text THEN ((module_run_id IS NOT NULL) AND (attempt_id IS NOT NULL))
    WHEN 'tests'::text THEN (module_run_id IS NOT NULL)
    WHEN 'dependency'::text THEN (dependency_request_id IS NOT NULL)
    WHEN 'operator'::text THEN ((module_run_id IS NULL) AND (attempt_id IS NULL) AND (dependency_request_id IS NULL))
    WHEN 'ui_contract'::text THEN (module_run_id IS NOT NULL)
    WHEN 'api_contract'::text THEN (module_run_id IS NOT NULL)
    WHEN 'dispatch_docs'::text THEN ((module_run_id IS NULL) AND (attempt_id IS NULL) AND (dependency_request_id IS NULL))
    ELSE NULL::boolean
END`,
    ),
    index("integration_commits_module_run_ix").on(t.missionId, t.moduleRunId),
    index("integration_commits_attempt_ix").on(t.missionId, t.attemptId),
    index("integration_commits_dependency_ix").on(t.missionId, t.dependencyRequestId),
    index("integration_commits_queue_ix")
      .on(t.missionId, t.queuedAt)
      .where(sql`(state = ANY (ARRAY['queued'::text, 'testing'::text]))`),
  ],
);

/** `locked_scripts` (Execution): package.json test scripts, locked by value */
export const lockedScripts = pgTable(
  "locked_scripts",
  {
    moduleRunId: uuid("module_run_id").notNull(),
    name: text("name").notNull(),
    valueSha256: text("value_sha256").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    primaryKey({ name: "locked_scripts_pkey", columns: [t.moduleRunId, t.name] }),
    foreignKey({
      name: "locked_scripts_module_run_id_module_runs_id_fk",
      columns: [t.moduleRunId],
      foreignColumns: [moduleRuns.id],
    }).onDelete("restrict"),
  ],
);

/** `quarantines` (Judgment): A flaky test you agreed to set aside for one mission. */
export const quarantines = pgTable(
  "quarantines",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    scenarioKey: text("scenario_key"),
    testPath: text("test_path").notNull(),
    reason: text("reason").notNull(),
    proposalId: uuid("proposal_id").notNull(),
    approvedBy: uuid("approved_by").notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    uniqueIndex("quarantines_one_open_uq")
      .on(t.missionId, t.testPath)
      .where(sql`(ended_at IS NULL)`),
    foreignKey({
      name: "quarantines_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "quarantines_approved_by_users_id_fk",
      columns: [t.approvedBy],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "quarantines_scenario_fk",
      columns: [t.missionId, t.scenarioKey],
      foreignColumns: [missionScenarios.missionId, missionScenarios.key],
    }).onDelete("restrict"),
    foreignKey({
      name: "quarantines_proposal_fk",
      columns: [t.missionId, t.proposalId],
      foreignColumns: [proposals.missionId, proposals.id],
    }).onDelete("restrict"),
    index("quarantines_scenario_ix").on(t.missionId, t.scenarioKey),
    index("quarantines_proposal_ix").on(t.missionId, t.proposalId),
    index("quarantines_approved_by_ix").on(t.approvedBy),
  ],
);

/** `test_locks` (Execution): integration_commit_id: the tests commit that landed this lock (null until it lands). Pinning tests record today's behaviour and pass by design, so they have no fail-first time */
export const testLocks = pgTable(
  "test_locks",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    moduleRunId: uuid("module_run_id").notNull(),
    kind: text("kind").notNull(),
    scenarioKey: text("scenario_key"),
    integrationCommitId: uuid("integration_commit_id"),
    path: text("path").notNull(),
    sha256: text("sha256").notNull(),
    assertionCount: integer("assertion_count").notNull(),
    failedFirstAt: timestamp("failed_first_at", { withTimezone: true }),
    lockedAt: timestamp("locked_at", { withTimezone: true }).notNull().defaultNow(),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    uniqueIndex("test_locks_one_active_uq")
      .on(t.moduleRunId, t.path)
      .where(sql`(released_at IS NULL)`),
    foreignKey({
      name: "test_locks_module_run_fk",
      columns: [t.missionId, t.moduleRunId],
      foreignColumns: [moduleRuns.missionId, moduleRuns.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "test_locks_scenario_fk",
      columns: [t.missionId, t.scenarioKey],
      foreignColumns: [missionScenarios.missionId, missionScenarios.key],
    }).onDelete("restrict"),
    foreignKey({
      name: "test_locks_integration_commit_fk",
      columns: [t.missionId, t.integrationCommitId],
      foreignColumns: [integrationCommits.missionId, integrationCommits.id],
    }).onDelete("restrict"),
    check("test_locks_kind_ck", oneOf(t.kind, TestLockKind)),
    check(
      "test_locks_fail_first_ck",
      sql`((kind = 'fail_first'::text) = (failed_first_at IS NOT NULL))`,
    ),
    check("test_locks_released_ck", sql`((released_at IS NULL) OR (released_at >= locked_at))`),
    index("test_locks_module_run_ix").on(t.missionId, t.moduleRunId),
    index("test_locks_scenario_ix").on(t.missionId, t.scenarioKey),
    index("test_locks_integration_commit_ix").on(t.missionId, t.integrationCommitId),
  ],
);
