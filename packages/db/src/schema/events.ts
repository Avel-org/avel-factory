// The `events` module's tables (contract.md section 6, "One owner per table"), rebuilt from
// the database map (docs/design/AVEL Database Map.html) with section 6's changes on top.
// Value lists come from @avel/contract; triggers and functions are in drizzle/0000 and 0002.
import { AgentTraceKind } from "@avel/contract";
import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
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
  uuid,
} from "drizzle-orm/pg-core";
import { oneOf } from "./columns.js";
import { onboardingSessions } from "./onboarding.js";
import { attempts } from "./runner.js";

/** `agent_traces` (Plumbing): partitioned by week on at; the purge drops partitions older than 30 days. Each stream (one attempt or one session) has one writer that commits in order, so within a stream trace_seq order is commit order; readers resume with ?after=<trace_seq> */
export const agentTraces = pgTable(
  "agent_traces",
  {
    traceSeq: bigserial("trace_seq", { mode: "number" }),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    attemptId: uuid("attempt_id"),
    sessionId: uuid("session_id"),
    kind: text("kind").notNull(),
    body: jsonb("body").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    primaryKey({ name: "agent_traces_pkey", columns: [t.traceSeq, t.at] }),
    foreignKey({
      name: "agent_traces_attempt_id_fk",
      columns: [t.attemptId],
      foreignColumns: [attempts.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "agent_traces_session_id_fk",
      columns: [t.sessionId],
      foreignColumns: [onboardingSessions.id],
    }).onDelete("restrict"),
    check("agent_traces_kind_ck", oneOf(t.kind, AgentTraceKind)),
    check("agent_traces_parent_ck", sql`(num_nonnulls(attempt_id, session_id) = 1)`),
    index("agent_traces_attempt_ix").on(t.attemptId, t.traceSeq),
    index("agent_traces_session_ix").on(t.sessionId, t.traceSeq),
  ],
);

/** `consumer_cursors` (Plumbing): How far each event consumer has read in the event log, fenced by its lease. */
export const consumerCursors = pgTable("consumer_cursors", {
  consumer: text("consumer").primaryKey(),
  lastSeq: bigint("last_seq", { mode: "number" }).notNull().default(0),
  // CR-6
  claimNo: integer("claim_no").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  rowVersion: integer("row_version").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** `events` (Plumbing): seq is taken under an advisory lock as the last statement before commit; no FKs; kept forever */
export const events = pgTable(
  "events",
  {
    seq: bigserial("seq", { mode: "number" }).primaryKey(),
    schemaVersion: integer("schema_version").notNull(),
    missionId: uuid("mission_id"),
    dispatchId: uuid("dispatch_id"),
    attemptId: uuid("attempt_id"),
    kind: text("kind").notNull(),
    payload: jsonb("payload").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [index("events_mission_seq_ix").on(t.missionId, t.seq)],
);
