// The `onboarding` module's tables (contract.md section 6, "One owner per table"), rebuilt from
// the database map (docs/design/AVEL Database Map.html) with section 6's changes on top.
// Value lists come from @avel/contract; triggers and functions are in drizzle/0000 and 0002.
import {
  ArchiveStatus,
  Checkpoint,
  CheckpointState,
  ClientKind,
  ContextRefKind,
  FactKind,
  FactSource,
  FactStatus,
  MessageRole,
  OnboardingSessionStatus,
  Package,
  RubricResultResult,
  Stage,
  Topic,
  TopicCoverageState,
  UploadParseStatus,
  UploadState,
  UsageLogCallKind,
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
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { oneOf, oneOfOrNull } from "./columns.js";
import { missions } from "./factory.js";
import { users } from "./platform.js";

/** `checkpoint_facts` (Canon): Which facts a checkpoint version showed you and you approved. */
export const checkpointFacts = pgTable(
  "checkpoint_facts",
  {
    checkpointId: uuid("checkpoint_id").notNull(),
    factId: uuid("fact_id").notNull(),
    missionId: uuid("mission_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    primaryKey({ name: "checkpoint_facts_pkey", columns: [t.checkpointId, t.factId] }),
    foreignKey({
      name: "checkpoint_facts_fact_fk",
      columns: [t.missionId, t.factId],
      foreignColumns: [facts.missionId, facts.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "checkpoint_facts_checkpoint_fk",
      columns: [t.missionId, t.checkpointId],
      foreignColumns: [checkpoints.missionId, checkpoints.id],
    }).onDelete("restrict"),
    index("checkpoint_facts_checkpoint_ix").on(t.missionId, t.checkpointId),
    index("checkpoint_facts_fact_ix").on(t.missionId, t.factId),
  ],
);

/** `checkpoints` (Canon): One Gate 0 checkpoint (0.1 to 0.4) and its versions, drafted by Canon and approved by you. */
export const checkpoints = pgTable(
  "checkpoints",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    sessionId: uuid("session_id").notNull(),
    checkpoint: text("checkpoint").notNull(),
    version: integer("version").notNull(),
    sections: jsonb("sections").notNull(),
    state: text("state").notNull().default("draft"),
    staleModuleLabels: text("stale_module_labels").array().notNull().default(sql`'{}'::text[]`),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedBy: uuid("approved_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("checkpoints_session_checkpoint_version_uq").on(t.sessionId, t.checkpoint, t.version),
    unique("checkpoints_mission_id_id_uq").on(t.missionId, t.id),
    foreignKey({
      name: "checkpoints_approved_by_users_id_fk",
      columns: [t.approvedBy],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "checkpoints_session_fk",
      columns: [t.missionId, t.sessionId],
      foreignColumns: [onboardingSessions.missionId, onboardingSessions.id],
    }).onDelete("restrict"),
    check("checkpoints_checkpoint_ck", oneOf(t.checkpoint, Checkpoint)),
    check("checkpoints_state_ck", oneOf(t.state, CheckpointState)),
    check("checkpoints_version_ck", sql`(version >= 1)`),
    check(
      "checkpoints_approved_ck",
      sql`((state <> 'approved'::text) OR ((approved_at IS NOT NULL) AND (approved_by IS NOT NULL)))`,
    ),
    index("checkpoints_session_ix").on(t.missionId, t.sessionId),
    index("checkpoints_approved_by_ix").on(t.approvedBy),
    index("checkpoints_drafts_ix").on(t.sessionId).where(sql`(state = 'draft'::text)`),
  ],
);

/** `clients` (People and clients): A client you build for. */
export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    name: text("name").notNull(),
    // CR-13; no default (D20)
    kind: text("kind").notNull(),
    contacts: jsonb("contacts").notNull().default(sql`'[]'::jsonb`),
    status: text("status").notNull().default("active"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    // CR-13: one internal client
    uniqueIndex("clients_one_internal_uq").on(t.kind).where(sql`(kind = 'internal'::text)`),
    // CR-13: the target of missions_client_kind_fk
    unique("clients_id_kind_uq").on(t.id, t.kind),
    check("clients_status_ck", oneOf(t.status, ArchiveStatus)),
    check("clients_archived_at_ck", sql`((status = 'archived'::text) = (archived_at IS NOT NULL))`),
    // CR-13
    check("clients_kind_ck", oneOf(t.kind, ClientKind)),
  ],
);

/** `context_refs` (Canon): A piece of context Canon cites (an upload passage, a repo file or a message) and where it came from. */
export const contextRefs = pgTable(
  "context_refs",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    sessionId: uuid("session_id").notNull(),
    moduleLabel: text("module_label").notNull(),
    kind: text("kind").notNull(),
    target: text("target").notNull(),
    uploadId: uuid("upload_id"),
    reason: text("reason").notNull(),
    readOrder: integer("read_order").notNull(),
    resolved: boolean("resolved").notNull().default(false),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "context_refs_session_fk",
      columns: [t.missionId, t.sessionId],
      foreignColumns: [onboardingSessions.missionId, onboardingSessions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "context_refs_upload_fk",
      columns: [t.missionId, t.uploadId],
      foreignColumns: [uploads.missionId, uploads.id],
    }).onDelete("restrict"),
    check("context_refs_kind_ck", oneOf(t.kind, ContextRefKind)),
    index("context_refs_session_ix").on(t.missionId, t.sessionId),
    index("context_refs_upload_ix").on(t.missionId, t.uploadId),
  ],
);

/** `facts` (Canon): uploaded facts start 'proposed' with the source quote shown; approving the checkpoint confirms them */
export const facts = pgTable(
  "facts",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    sessionId: uuid("session_id").notNull(),
    kind: text("kind").notNull(),
    value: jsonb("value").notNull(),
    source: text("source").notNull(),
    status: text("status").notNull().default("proposed"),
    messageId: uuid("message_id"),
    spanStart: integer("span_start"),
    spanEnd: integer("span_end"),
    uploadId: uuid("upload_id"),
    repoCommit: text("repo_commit"),
    repoPath: text("repo_path"),
    supersedesFactId: uuid("supersedes_fact_id"),
    scanFlagged: boolean("scan_flagged").notNull().default(false),
    redactedAt: timestamp("redacted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("facts_mission_id_id_uq").on(t.missionId, t.id),
    foreignKey({
      name: "facts_session_fk",
      columns: [t.missionId, t.sessionId],
      foreignColumns: [onboardingSessions.missionId, onboardingSessions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "facts_message_fk",
      columns: [t.sessionId, t.messageId],
      foreignColumns: [messages.sessionId, messages.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "facts_upload_fk",
      columns: [t.missionId, t.uploadId],
      foreignColumns: [uploads.missionId, uploads.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "facts_supersedes_fk",
      columns: [t.missionId, t.supersedesFactId],
      foreignColumns: [t.missionId, t.id],
    }).onDelete("restrict"),
    check("facts_kind_ck", oneOf(t.kind, FactKind)),
    check("facts_source_ck", oneOf(t.source, FactSource)),
    check("facts_status_ck", oneOf(t.status, FactStatus)),
    check(
      "facts_source_said_ck",
      sql`((source <> ALL (ARRAY['said'::text, 'relayed'::text])) OR (message_id IS NOT NULL))`,
    ),
    check(
      "facts_source_uploaded_ck",
      sql`((source <> 'uploaded'::text) OR (upload_id IS NOT NULL))`,
    ),
    check(
      "facts_source_repo_ck",
      sql`((source <> 'repo'::text) OR ((repo_commit IS NOT NULL) AND (repo_path IS NOT NULL)))`,
    ),
    check(
      "facts_span_ck",
      sql`(((span_start IS NULL) = (span_end IS NULL)) AND ((span_start IS NULL) OR (message_id IS NOT NULL)))`,
    ),
    index("facts_session_ix").on(t.missionId, t.sessionId),
    index("facts_message_ix").on(t.sessionId, t.messageId),
    index("facts_upload_ix").on(t.missionId, t.uploadId),
    index("facts_supersedes_ix").on(t.missionId, t.supersedesFactId),
  ],
);

/** `messages` (Canon): Canon chat history is served from here, not from traces */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    sessionId: uuid("session_id").notNull(),
    seq: integer("seq").notNull(),
    role: text("role").notNull(),
    text: text("text").notNull(),
    promptVersion: text("prompt_version").notNull(),
    tokensIn: integer("tokens_in").notNull().default(0),
    tokensOut: integer("tokens_out").notNull().default(0),
    cacheWrite5m: integer("cache_write_5m").notNull().default(0),
    cacheWrite1h: integer("cache_write_1h").notNull().default(0),
    cacheRead: integer("cache_read").notNull().default(0),
    redactedAt: timestamp("redacted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("messages_session_id_seq_uq").on(t.sessionId, t.seq),
    unique("messages_session_id_id_uq").on(t.sessionId, t.id),
    foreignKey({
      name: "messages_session_id_onboarding_sessions_id_fk",
      columns: [t.sessionId],
      foreignColumns: [onboardingSessions.id],
    }).onDelete("restrict"),
    check("messages_role_ck", oneOf(t.role, MessageRole)),
  ],
);

/** `onboarding_sessions` (Canon): The Canon session that takes a mission through Gate 0. */
export const onboardingSessions = pgTable(
  "onboarding_sessions",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    stage: text("stage").notNull().default("opener"),
    status: text("status").notNull().default("active"),
    pauseReason: text("pause_reason"),
    packageProvisional: text("package_provisional"),
    packageFinal: text("package_final"),
    promptVersion: text("prompt_version").notNull(),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
    finalizedAt: timestamp("finalized_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("onboarding_sessions_mission_id_id_uq").on(t.missionId, t.id),
    uniqueIndex("onboarding_sessions_one_live_uq")
      .on(t.missionId)
      .where(sql`(status = ANY (ARRAY['active'::text, 'paused'::text, 'context_blocked'::text]))`),
    foreignKey({
      name: "onboarding_sessions_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    check("onboarding_sessions_stage_ck", oneOf(t.stage, Stage)),
    check("onboarding_sessions_status_ck", oneOf(t.status, OnboardingSessionStatus)),
    check("onboarding_sessions_package_provisional_ck", oneOfOrNull(t.packageProvisional, Package)),
    check("onboarding_sessions_package_final_ck", oneOfOrNull(t.packageFinal, Package)),
    check(
      "onboarding_sessions_finalized_at_ck",
      sql`((status = 'finalized'::text) = (finalized_at IS NOT NULL))`,
    ),
  ],
);

/** `questions` (Canon): A question Canon asked you during onboarding, and your answer. */
export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    sessionId: uuid("session_id").notNull(),
    stage: text("stage").notNull(),
    text: text("text").notNull(),
    options: jsonb("options"),
    recommended: text("recommended"),
    answer: text("answer"),
    answeredAt: timestamp("answered_at", { withTimezone: true }),
    blocking: boolean("blocking").notNull().default(false),
    moduleLabel: text("module_label"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "questions_session_id_onboarding_sessions_id_fk",
      columns: [t.sessionId],
      foreignColumns: [onboardingSessions.id],
    }).onDelete("restrict"),
    check("questions_stage_ck", oneOf(t.stage, Stage)),
    check("questions_answered_ck", sql`((answer IS NULL) = (answered_at IS NULL))`),
    index("questions_session_id_ix").on(t.sessionId),
  ],
);

/** `readiness_waivers` (Canon): Your decision to proceed on a partial readiness result at 0.4, with a reason. */
export const readinessWaivers = pgTable(
  "readiness_waivers",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    sessionId: uuid("session_id").notNull(),
    checkId: text("check_id").notNull(),
    reason: text("reason").notNull(),
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "readiness_waivers_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "readiness_waivers_user_id_users_id_fk",
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "readiness_waivers_session_fk",
      columns: [t.missionId, t.sessionId],
      foreignColumns: [onboardingSessions.missionId, onboardingSessions.id],
    }).onDelete("restrict"),
    index("readiness_waivers_session_ix").on(t.missionId, t.sessionId),
    index("readiness_waivers_user_id_ix").on(t.userId),
  ],
);

/** `rubric_results` (Canon): How a checkpoint scored against its rubric. */
export const rubricResults = pgTable(
  "rubric_results",
  {
    checkpointId: uuid("checkpoint_id").notNull(),
    checkId: text("check_id").notNull(),
    applies: boolean("applies").notNull(),
    result: text("result").notNull(),
    detail: text("detail").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    primaryKey({ name: "rubric_results_pkey", columns: [t.checkpointId, t.checkId] }),
    foreignKey({
      name: "rubric_results_checkpoint_id_checkpoints_id_fk",
      columns: [t.checkpointId],
      foreignColumns: [checkpoints.id],
    }).onDelete("restrict"),
    check("rubric_results_result_ck", oneOf(t.result, RubricResultResult)),
  ],
);

/** `topic_coverage` (Canon): Which onboarding topics a session has covered, so Canon knows what's left to ask. */
export const topicCoverage = pgTable(
  "topic_coverage",
  {
    sessionId: uuid("session_id").notNull(),
    topic: text("topic").notNull(),
    state: text("state").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    primaryKey({ name: "topic_coverage_pkey", columns: [t.sessionId, t.topic] }),
    foreignKey({
      name: "topic_coverage_session_id_onboarding_sessions_id_fk",
      columns: [t.sessionId],
      foreignColumns: [onboardingSessions.id],
    }).onDelete("restrict"),
    check("topic_coverage_topic_ck", oneOf(t.topic, Topic)),
    check("topic_coverage_state_ck", oneOf(t.state, TopicCoverageState)),
  ],
);

/** `uploads` (Canon): removing purges the blob and keeps the row; see Integrity rules for when it's refused */
export const uploads = pgTable(
  "uploads",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    sessionId: uuid("session_id"),
    blobKey: text("blob_key"),
    name: text("name").notNull(),
    mime: text("mime").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    parseStatus: text("parse_status").notNull().default("pending"),
    state: text("state").notNull().default("active"),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("uploads_mission_id_id_uq").on(t.missionId, t.id),
    foreignKey({
      name: "uploads_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "uploads_session_fk",
      columns: [t.missionId, t.sessionId],
      foreignColumns: [onboardingSessions.missionId, onboardingSessions.id],
    }).onDelete("restrict"),
    check("uploads_parse_status_ck", oneOf(t.parseStatus, UploadParseStatus)),
    check("uploads_state_ck", oneOf(t.state, UploadState)),
    check("uploads_removed_at_ck", sql`((state = 'removed'::text) = (removed_at IS NOT NULL))`),
    check("uploads_active_blob_ck", sql`((state <> 'active'::text) OR (blob_key IS NOT NULL))`),
    index("uploads_session_ix").on(t.missionId, t.sessionId),
  ],
);

/** `usage_log` (Canon): Canon's model usage per call, priced at the proxy. */
export const usageLog = pgTable(
  "usage_log",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    sessionId: uuid("session_id").notNull(),
    callKind: text("call_kind").notNull(),
    model: text("model").notNull(),
    // CR-5
    vendor: text("vendor").notNull(),
    tokensIn: integer("tokens_in").notNull(),
    tokensOut: integer("tokens_out").notNull(),
    cacheWrite5m: integer("cache_write_5m").notNull().default(0),
    cacheWrite1h: integer("cache_write_1h").notNull().default(0),
    cacheRead: integer("cache_read").notNull().default(0),
    costMicros: bigint("cost_micros", { mode: "number" }).notNull(),
    ok: boolean("ok").notNull(),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "usage_log_session_id_onboarding_sessions_id_fk",
      columns: [t.sessionId],
      foreignColumns: [onboardingSessions.id],
    }).onDelete("restrict"),
    check("usage_log_call_kind_ck", oneOf(t.callKind, UsageLogCallKind)),
    index("usage_log_session_id_ix").on(t.sessionId),
  ],
);
