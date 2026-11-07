// The `metering` module's tables (contract.md section 6, "One owner per table"), rebuilt from
// the database map (docs/design/AVEL Database Map.html) with section 6's changes on top.
// Value lists come from @avel/contract; triggers and functions are in drizzle/0000 and 0002.
import {
  BudgetReservationKind,
  BudgetReservationState,
  HumanTimeActivity,
  HumanTimeSource,
  HumanTimeState,
} from "@avel/contract";
import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  index,
  integer,
  type PgTableExtraConfigValue,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { oneOf } from "./columns.js";
import { dispatches, missions, moduleRuns } from "./factory.js";
import { onboardingSessions } from "./onboarding.js";
import { users } from "./platform.js";
import { attempts } from "./runner.js";

/** `budget_reservations` (Cost and time): expected: the scheduler reserves a dispatch's expected cost before any attempt exists, and Canon reserves a session's expected cost the same way; request: the model proxy reserves each request's maximum cost. module_run_id is filled from the dispatch by the reservation function, and (dispatch_id, module_run_id) checks it matches. A row with module_run_id counts against that module and the mission; without it, against the mission only */
export const budgetReservations = pgTable(
  "budget_reservations",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    moduleRunId: uuid("module_run_id"),
    kind: text("kind").notNull(),
    dispatchId: uuid("dispatch_id"),
    attemptId: uuid("attempt_id"),
    sessionId: uuid("session_id"),
    requestId: text("request_id"),
    reservedMicros: bigint("reserved_micros", { mode: "number" }).notNull(),
    settledMicros: bigint("settled_micros", { mode: "number" }),
    state: text("state").notNull().default("held"),
    settledAt: timestamp("settled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    uniqueIndex("budget_reservations_attempt_request_uq")
      .on(t.attemptId, t.requestId)
      .where(sql`((request_id IS NOT NULL) AND (attempt_id IS NOT NULL))`),
    uniqueIndex("budget_reservations_session_request_uq")
      .on(t.sessionId, t.requestId)
      .where(sql`((request_id IS NOT NULL) AND (session_id IS NOT NULL))`),
    foreignKey({
      name: "budget_reservations_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "budget_reservations_module_run_fk",
      columns: [t.missionId, t.moduleRunId],
      foreignColumns: [moduleRuns.missionId, moduleRuns.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "budget_reservations_dispatch_fk",
      columns: [t.missionId, t.dispatchId],
      foreignColumns: [dispatches.missionId, dispatches.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "budget_reservations_dispatch_module_fk",
      columns: [t.dispatchId, t.moduleRunId],
      foreignColumns: [dispatches.id, dispatches.moduleRunId],
    }).onDelete("restrict"),
    foreignKey({
      name: "budget_reservations_attempt_fk",
      columns: [t.dispatchId, t.attemptId],
      foreignColumns: [attempts.dispatchId, attempts.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "budget_reservations_session_fk",
      columns: [t.missionId, t.sessionId],
      foreignColumns: [onboardingSessions.missionId, onboardingSessions.id],
    }).onDelete("restrict"),
    check("budget_reservations_kind_ck", oneOf(t.kind, BudgetReservationKind)),
    check("budget_reservations_state_ck", oneOf(t.state, BudgetReservationState)),
    check(
      "budget_reservations_expected_ck",
      sql`((kind <> 'expected'::text) OR ((num_nonnulls(dispatch_id, session_id) = 1) AND (attempt_id IS NULL) AND (request_id IS NULL)))`,
    ),
    check(
      "budget_reservations_request_ck",
      sql`((kind <> 'request'::text) OR ((num_nonnulls(attempt_id, session_id) = 1) AND (request_id IS NOT NULL)))`,
    ),
    check(
      "budget_reservations_attempt_dispatch_ck",
      sql`((attempt_id IS NULL) OR (dispatch_id IS NOT NULL))`,
    ),
    check(
      "budget_reservations_settled_ck",
      sql`(((state = 'settled'::text) = (settled_micros IS NOT NULL)) AND ((settled_micros IS NULL) OR (settled_micros <= reserved_micros)))`,
    ),
    check(
      "budget_reservations_amount_ck",
      sql`((reserved_micros >= 0) AND ((settled_micros IS NULL) OR (settled_micros >= 0)))`,
    ),
    index("budget_reservations_module_run_ix").on(t.missionId, t.moduleRunId),
    index("budget_reservations_dispatch_ix").on(t.missionId, t.dispatchId),
    index("budget_reservations_dispatch_module_ix").on(t.dispatchId, t.moduleRunId),
    index("budget_reservations_attempt_ix").on(t.dispatchId, t.attemptId),
    index("budget_reservations_session_ix").on(t.missionId, t.sessionId),
    index("budget_reservations_held_attempt_ix").on(t.attemptId).where(sql`(state = 'held'::text)`),
    index("budget_reservations_held_dispatch_ix")
      .on(t.dispatchId)
      .where(sql`(state = 'held'::text)`),
    index("budget_reservations_held_session_ix").on(t.sessionId).where(sql`(state = 'held'::text)`),
  ],
);

/** `human_time` (Cost and time): Time you spent on a mission, recorded automatically or by hand, for margin. */
export const humanTime = pgTable(
  "human_time",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    userId: uuid("user_id").notNull(),
    missionId: uuid("mission_id").notNull(),
    dispatchId: uuid("dispatch_id"),
    activity: text("activity").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    minutes: integer("minutes"),
    source: text("source").notNull(),
    state: text("state").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "human_time_user_id_users_id_fk",
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "human_time_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "human_time_dispatch_fk",
      columns: [t.missionId, t.dispatchId],
      foreignColumns: [dispatches.missionId, dispatches.id],
    }).onDelete("restrict"),
    check("human_time_activity_ck", oneOf(t.activity, HumanTimeActivity)),
    check("human_time_source_ck", oneOf(t.source, HumanTimeSource)),
    check("human_time_state_ck", oneOf(t.state, HumanTimeState)),
    check(
      "human_time_confirmed_ck",
      sql`((state <> 'confirmed'::text) OR ((ended_at IS NOT NULL) AND (minutes IS NOT NULL)))`,
    ),
    index("human_time_user_id_ix").on(t.userId),
    index("human_time_dispatch_ix").on(t.missionId, t.dispatchId),
    index("human_time_drafts_ix").on(t.userId).where(sql`(state = 'draft'::text)`),
  ],
);

/** `payments` (Missions and money in): revenue counts cash collected */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    amountMicros: bigint("amount_micros", { mode: "number" }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
    recordedBy: uuid("recorded_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "payments_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "payments_recorded_by_users_id_fk",
      columns: [t.recordedBy],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    index("payments_mission_id_ix").on(t.missionId),
    index("payments_recorded_by_ix").on(t.recordedBy),
  ],
);

/** `price_table` (Cost and time): Model prices per million tokens, by date; the model proxy prices usage from it. */
export const priceTable = pgTable(
  "price_table",
  {
    vendor: text("vendor").notNull(),
    model: text("model").notNull(),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
    inputMicros: bigint("input_micros", { mode: "number" }).notNull(),
    outputMicros: bigint("output_micros", { mode: "number" }).notNull(),
    cacheWrite5mMicros: bigint("cache_write_5m_micros", { mode: "number" }).notNull(),
    cacheWrite1hMicros: bigint("cache_write_1h_micros", { mode: "number" }).notNull(),
    cacheReadMicros: bigint("cache_read_micros", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    primaryKey({ name: "price_table_pkey", columns: [t.vendor, t.model, t.validFrom] }),
  ],
);
