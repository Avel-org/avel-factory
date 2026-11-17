// The `pipeline` module's tables (CR-W17 Phase 1): leads and follow-ups. No amounts anywhere
// (CR-W17 rule 5). Value lists come from @avel/contract.
import {
  FollowupChannel,
  FollowupKind,
  FollowupSentBy,
  FollowupState,
  LeadLostReason,
  LeadSource,
} from "@avel/contract";
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  type PgTableExtraConfigValue,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { oneOf, oneOfOrNull } from "./columns.js";
import { missions } from "./factory.js";
import { clients } from "./onboarding.js";
import { users } from "./platform.js";

/** `leads` (Pipeline): a lead is a client with status `lead`; this row holds only its extra fields. */
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    clientId: uuid("client_id").notNull(),
    source: text("source").notNull(),
    referrerId: uuid("referrer_id"),
    referrerName: text("referrer_name"),
    firstContactAt: timestamp("first_contact_at", { withTimezone: true }).notNull().defaultNow(),
    notes: text("notes"),
    lostReason: text("lost_reason"),
    lostAt: timestamp("lost_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("leads_client_id_uq").on(t.clientId),
    foreignKey({
      name: "leads_client_id_clients_id_fk",
      columns: [t.clientId],
      foreignColumns: [clients.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "leads_referrer_id_users_id_fk",
      columns: [t.referrerId],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    index("leads_referrer_id_ix").on(t.referrerId),
    check("leads_source_ck", oneOf(t.source, LeadSource)),
    check("leads_lost_reason_ck", oneOfOrNull(t.lostReason, LeadLostReason)),
    check("leads_lost_ck", sql`((lost_reason IS NULL) = (lost_at IS NULL))`),
  ],
);

/** `followups` (Pipeline): a server-drafted message that goes out only through a decision. */
export const followups = pgTable(
  "followups",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    clientId: uuid("client_id").notNull(),
    missionId: uuid("mission_id"),
    kind: text("kind").notNull(),
    subjectId: uuid("subject_id"),
    draft: text("draft").notNull(),
    draftHash: text("draft_hash").notNull(),
    channel: text("channel").notNull(),
    state: text("state").notNull().default("drafted"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    sentBy: text("sent_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "followups_client_id_clients_id_fk",
      columns: [t.clientId],
      foreignColumns: [clients.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "followups_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    index("followups_client_id_ix").on(t.clientId),
    index("followups_mission_id_ix").on(t.missionId),
    index("followups_drafted_ix").on(t.clientId).where(sql`(state = 'drafted'::text)`),
    check("followups_kind_ck", oneOf(t.kind, FollowupKind)),
    check("followups_channel_ck", oneOf(t.channel, FollowupChannel)),
    check("followups_state_ck", oneOf(t.state, FollowupState)),
    check("followups_sent_by_ck", oneOfOrNull(t.sentBy, FollowupSentBy)),
    check(
      "followups_sent_ck",
      sql`(((state = 'sent'::text) = (sent_at IS NOT NULL)) AND ((sent_at IS NULL) = (sent_by IS NULL)) AND ((channel <> 'copy'::text) OR (sent_by IS NULL) OR (sent_by = 'you'::text)))`,
    ),
  ],
);
