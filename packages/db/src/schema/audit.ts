// The `audit` module's tables (contract.md section 6, "One owner per table"), rebuilt from
// the database map (docs/design/AVEL Database Map.html) with section 6's changes on top.
// Value lists come from @avel/contract; triggers and functions are in drizzle/0000 and 0002.
import { ActivityLogActorKind, OverrideAction, OverrideKind } from "@avel/contract";
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  type PgTableExtraConfigValue,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { oneOf, oneOfOrNull } from "./columns.js";
import { credentials } from "./compute.js";
import { dispatches, missions } from "./factory.js";
import { gateEvaluations } from "./gate.js";
import { stepUpGrants, users } from "./platform.js";

/** `activity_log` (Plumbing): An append-only record of every action taken, by whom or by which credential, and why. */
export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    actorKind: text("actor_kind").notNull(),
    userId: uuid("user_id"),
    credentialId: uuid("credential_id"),
    action: text("action").notNull(),
    target: text("target").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "activity_log_user_id_users_id_fk",
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "activity_log_credential_id_credentials_id_fk",
      columns: [t.credentialId],
      foreignColumns: [credentials.id],
    }).onDelete("restrict"),
    check("activity_log_actor_kind_ck", oneOf(t.actorKind, ActivityLogActorKind)),
    index("activity_log_user_id_ix").on(t.userId),
    index("activity_log_credential_id_ix").on(t.credentialId),
  ],
);

/** `overrides` (Judgment): any gate override caps the verdict at pass */
export const overrides = pgTable(
  "overrides",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    userId: uuid("user_id").notNull(),
    kind: text("kind").notNull(),
    gate: smallint("gate"),
    gateEvaluationId: uuid("gate_evaluation_id"),
    dispatchId: uuid("dispatch_id"),
    action: text("action"),
    checkId: text("check_id"),
    commitSha: text("commit_sha"),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "overrides_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "overrides_user_id_users_id_fk",
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "overrides_gate_evaluation_fk",
      columns: [t.missionId, t.gateEvaluationId, t.gate],
      foreignColumns: [gateEvaluations.missionId, gateEvaluations.id, gateEvaluations.gate],
    }).onDelete("restrict"),
    foreignKey({
      name: "overrides_dispatch_fk",
      columns: [t.missionId, t.dispatchId],
      foreignColumns: [dispatches.missionId, dispatches.id],
    }).onDelete("restrict"),
    check("overrides_kind_ck", oneOf(t.kind, OverrideKind)),
    check("overrides_action_ck", oneOfOrNull(t.action, OverrideAction)),
    check(
      "overrides_by_kind_ck",
      sql`
CASE kind
    WHEN 'gate'::text THEN ((gate_evaluation_id IS NOT NULL) AND (commit_sha IS NOT NULL) AND (gate = ANY (ARRAY[3, 4])) AND (dispatch_id IS NULL) AND (action IS NULL))
    WHEN 'dispatch'::text THEN ((dispatch_id IS NOT NULL) AND (action IS NOT NULL) AND (gate IS NULL) AND (gate_evaluation_id IS NULL) AND (commit_sha IS NULL))
    ELSE NULL::boolean
END`,
    ),
    index("overrides_user_id_ix").on(t.userId),
    index("overrides_gate_evaluation_ix").on(t.missionId, t.gateEvaluationId, t.gate),
    index("overrides_dispatch_ix").on(t.missionId, t.dispatchId),
  ],
);

/** `redactions` (Judgment): A record of text scrubbed from a row (the one allowed overwrite), with who did it and why. */
export const redactions = pgTable(
  "redactions",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    tableName: text("table_name").notNull(),
    rowId: text("row_id").notNull(),
    columnName: text("column_name").notNull(),
    reason: text("reason").notNull(),
    userId: uuid("user_id").notNull(),
    stepUpGrantId: uuid("step_up_grant_id").notNull(),
    redactedAt: timestamp("redacted_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("redactions_step_up_grant_id_uq").on(t.stepUpGrantId),
    foreignKey({
      name: "redactions_user_id_users_id_fk",
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "redactions_step_up_grant_id_step_up_grants_id_fk",
      columns: [t.stepUpGrantId],
      foreignColumns: [stepUpGrants.id],
    }).onDelete("restrict"),
    index("redactions_user_id_ix").on(t.userId),
  ],
);
