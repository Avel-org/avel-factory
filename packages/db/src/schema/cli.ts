// The `cli` module's tables (contract.md section 6, "One owner per table"), rebuilt from
// the database map (docs/design/AVEL Database Map.html) with section 6's changes on top.
// Value lists come from @avel/contract; triggers and functions are in drizzle/0000 and 0002.
import { DeviceLoginState } from "@avel/contract";
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
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { oneOf } from "./columns.js";
import { cliSessions, users } from "./platform.js";

/** `device_logins` (Plumbing): POST /api/cli/device-logins starts one; approving it needs step-up; the CLI's poll consumes it */
export const deviceLogins = pgTable(
  "device_logins",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    deviceCodeSha256: text("device_code_sha256").notNull(),
    userCode: text("user_code").notNull(),
    label: text("label").notNull(),
    state: text("state").notNull().default("pending"),
    approvedBy: uuid("approved_by"),
    cliSessionId: uuid("cli_session_id"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("device_logins_device_code_sha256_uq").on(t.deviceCodeSha256),
    uniqueIndex("device_logins_pending_user_code_uq")
      .on(t.userCode)
      .where(sql`(state = 'pending'::text)`),
    foreignKey({
      name: "device_logins_approved_by_users_id_fk",
      columns: [t.approvedBy],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "device_logins_cli_session_id_cli_sessions_id_fk",
      columns: [t.cliSessionId],
      foreignColumns: [cliSessions.id],
    }).onDelete("restrict"),
    check("device_logins_state_ck", oneOf(t.state, DeviceLoginState)),
    check(
      "device_logins_approved_ck",
      sql`((state <> ALL (ARRAY['approved'::text, 'consumed'::text])) OR ((approved_by IS NOT NULL) AND (approved_at IS NOT NULL)))`,
    ),
    check(
      "device_logins_consumed_ck",
      sql`((state <> 'consumed'::text) OR (cli_session_id IS NOT NULL))`,
    ),
    index("device_logins_approved_by_ix").on(t.approvedBy),
    index("device_logins_cli_session_id_ix").on(t.cliSessionId),
    index("device_logins_purge_ix").on(t.expiresAt),
  ],
);
