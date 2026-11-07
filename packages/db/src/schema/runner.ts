// The `runner` module's tables (contract.md section 6, "One owner per table"), rebuilt from
// the database map (docs/design/AVEL Database Map.html) with section 6's changes on top.
// Value lists come from @avel/contract; triggers and functions are in drizzle/0000 and 0002.
import {
  AttemptCompute,
  AttemptKind,
  AttemptOutcome,
  CompletionReportStatus,
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
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { oneOf, oneOfOrNull } from "./columns.js";
import { dispatches, taskDocs } from "./factory.js";
import { factoryVersions, skills } from "./knowledge.js";

/** `attempts` (Execution): reserved_micros: per-request reservations still held; cost_micros: what's been settled */
export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    dispatchId: uuid("dispatch_id").notNull(),
    n: integer("n").notNull(),
    taskDocVersion: integer("task_doc_version").notNull(),
    agentConfigHash: text("agent_config_hash").notNull(),
    factoryCommit: text("factory_commit").notNull(),
    branch: text("branch").notNull(),
    kind: text("kind").notNull(),
    vendor: text("vendor").notNull(),
    model: text("model").notNull(),
    compute: text("compute").notNull(),
    checkpointCommit: text("checkpoint_commit"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    tokensIn: integer("tokens_in").notNull().default(0),
    tokensOut: integer("tokens_out").notNull().default(0),
    cacheRead: integer("cache_read").notNull().default(0),
    cacheWrite5m: integer("cache_write_5m").notNull().default(0),
    cacheWrite1h: integer("cache_write_1h").notNull().default(0),
    costMicros: bigint("cost_micros", { mode: "number" }).notNull().default(0),
    reservedMicros: bigint("reserved_micros", { mode: "number" }).notNull().default(0),
    capMicros: bigint("cap_micros", { mode: "number" }).notNull(),
    outcome: text("outcome"),
    failureNote: text("failure_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("attempts_dispatch_id_n_uq").on(t.dispatchId, t.n),
    unique("attempts_mission_id_id_uq").on(t.missionId, t.id),
    unique("attempts_dispatch_id_id_uq").on(t.dispatchId, t.id),
    uniqueIndex("attempts_one_running_uq").on(t.dispatchId).where(sql`(outcome IS NULL)`),
    foreignKey({
      name: "attempts_factory_commit_factory_versions_sha_fk",
      columns: [t.factoryCommit],
      foreignColumns: [factoryVersions.sha],
    }).onDelete("restrict"),
    foreignKey({
      name: "attempts_dispatch_fk",
      columns: [t.missionId, t.dispatchId],
      foreignColumns: [dispatches.missionId, dispatches.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "attempts_task_doc_fk",
      columns: [t.dispatchId, t.taskDocVersion],
      foreignColumns: [taskDocs.dispatchId, taskDocs.version],
    }).onDelete("restrict"),
    check("attempts_kind_ck", oneOf(t.kind, AttemptKind)),
    check("attempts_compute_ck", oneOf(t.compute, AttemptCompute)),
    check("attempts_outcome_ck", oneOfOrNull(t.outcome, AttemptOutcome)),
    check("attempts_n_ck", sql`(n >= 1)`),
    check("attempts_ended_ck", sql`((ended_at IS NULL) = (outcome IS NULL))`),
    check(
      "attempts_cap_ck",
      sql`((reserved_micros >= 0) AND (cost_micros >= 0) AND ((reserved_micros + cost_micros) <= cap_micros))`,
    ),
    index("attempts_dispatch_ix").on(t.missionId, t.dispatchId),
    index("attempts_task_doc_ix").on(t.dispatchId, t.taskDocVersion),
    index("attempts_factory_commit_ix").on(t.factoryCommit),
  ],
);

/** `completion_reports` (Execution): The report an agent files when its attempt ends: what it did, what it couldn't, and its commit. */
export const completionReports = pgTable(
  "completion_reports",
  {
    attemptId: uuid("attempt_id").primaryKey(),
    status: text("status").notNull(),
    resultCommit: text("result_commit"),
    body: jsonb("body").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "completion_reports_attempt_id_attempts_id_fk",
      columns: [t.attemptId],
      foreignColumns: [attempts.id],
    }).onDelete("restrict"),
    check("completion_reports_status_ck", oneOf(t.status, CompletionReportStatus)),
  ],
);

/** `progress_notes` (Execution): POST /api/agent/progress-notes; append-only */
export const progressNotes = pgTable(
  "progress_notes",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    attemptId: uuid("attempt_id").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "progress_notes_attempt_id_attempts_id_fk",
      columns: [t.attemptId],
      foreignColumns: [attempts.id],
    }).onDelete("restrict"),
    index("progress_notes_attempt_id_ix").on(t.attemptId),
  ],
);

/** `skill_loads` (Library): Which skills an attempt actually loaded. */
export const skillLoads = pgTable(
  "skill_loads",
  {
    attemptId: uuid("attempt_id").notNull(),
    skillId: uuid("skill_id").notNull(),
    loadedAt: timestamp("loaded_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    primaryKey({ name: "skill_loads_pkey", columns: [t.attemptId, t.skillId] }),
    foreignKey({
      name: "skill_loads_attempt_id_attempts_id_fk",
      columns: [t.attemptId],
      foreignColumns: [attempts.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "skill_loads_skill_id_skills_id_fk",
      columns: [t.skillId],
      foreignColumns: [skills.id],
    }).onDelete("restrict"),
    index("skill_loads_skill_id_ix").on(t.skillId),
  ],
);
