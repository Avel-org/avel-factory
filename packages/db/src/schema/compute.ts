// The `compute` module's tables (contract.md section 6, "One owner per table"), rebuilt from
// the database map (docs/design/AVEL Database Map.html) with section 6's changes on top.
// Value lists come from @avel/contract; triggers and functions are in drizzle/0000 and 0002.
import { CredentialKind, RoomKind, RoomState } from "@avel/contract";
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
import { oneOf } from "./columns.js";
import { dispatches, missions } from "./factory.js";
import { integrationCommits } from "./integrator.js";
import { onboardingSessions } from "./onboarding.js";
import { attempts } from "./runner.js";

/** `credentials` (Plumbing): git: reads the mission's branches, pushes only its own attempt branch */
export const credentials = pgTable(
  "credentials",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    kind: text("kind").notNull(),
    dispatchId: uuid("dispatch_id"),
    attemptId: uuid("attempt_id"),
    sessionId: uuid("session_id"),
    tokenSha256: text("token_sha256").notNull(),
    scope: text("scope").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("credentials_token_sha256_uq").on(t.tokenSha256),
    foreignKey({
      name: "credentials_dispatch_id_dispatches_id_fk",
      columns: [t.dispatchId],
      foreignColumns: [dispatches.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "credentials_session_id_onboarding_sessions_id_fk",
      columns: [t.sessionId],
      foreignColumns: [onboardingSessions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "credentials_attempt_fk",
      columns: [t.dispatchId, t.attemptId],
      foreignColumns: [attempts.dispatchId, attempts.id],
    }).onDelete("restrict"),
    check("credentials_kind_ck", oneOf(t.kind, CredentialKind)),
    check(
      "credentials_parent_ck",
      sql`
CASE
    WHEN (kind = 'service'::text) THEN ((dispatch_id IS NULL) AND (attempt_id IS NULL))
    ELSE ((dispatch_id IS NOT NULL) AND (attempt_id IS NOT NULL) AND (session_id IS NULL))
END`,
    ),
    index("credentials_attempt_ix").on(t.dispatchId, t.attemptId),
    index("credentials_session_id_ix").on(t.sessionId),
    index("credentials_to_revoke_ix").on(t.expiresAt).where(sql`(revoked_at IS NULL)`),
  ],
);

/** `rooms` (Plumbing): A sandboxed room created for a dispatch, a check, an integration or an image build. */
export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    kind: text("kind").notNull(),
    missionId: uuid("mission_id").notNull(),
    dispatchId: uuid("dispatch_id"),
    attemptId: uuid("attempt_id"),
    integrationCommitId: uuid("integration_commit_id"),
    state: text("state").notNull().default("creating"),
    imageDigest: text("image_digest"),
    destroyedAt: timestamp("destroyed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "rooms_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "rooms_dispatch_fk",
      columns: [t.missionId, t.dispatchId],
      foreignColumns: [dispatches.missionId, dispatches.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "rooms_attempt_fk",
      columns: [t.dispatchId, t.attemptId],
      foreignColumns: [attempts.dispatchId, attempts.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "rooms_integration_commit_fk",
      columns: [t.missionId, t.integrationCommitId],
      foreignColumns: [integrationCommits.missionId, integrationCommits.id],
    }).onDelete("restrict"),
    check("rooms_kind_ck", oneOf(t.kind, RoomKind)),
    check("rooms_state_ck", oneOf(t.state, RoomState)),
    check("rooms_destroyed_at_ck", sql`((state = 'destroyed'::text) = (destroyed_at IS NOT NULL))`),
    check(
      "rooms_parent_ck",
      sql`
CASE kind
    WHEN 'integration'::text THEN ((integration_commit_id IS NOT NULL) AND (dispatch_id IS NULL) AND (attempt_id IS NULL))
    WHEN 'image_build'::text THEN ((integration_commit_id IS NULL) AND (dispatch_id IS NULL) AND (attempt_id IS NULL))
    ELSE ((dispatch_id IS NOT NULL) AND (attempt_id IS NOT NULL) AND (integration_commit_id IS NULL))
END`,
    ),
    index("rooms_dispatch_ix").on(t.missionId, t.dispatchId),
    index("rooms_attempt_ix").on(t.dispatchId, t.attemptId),
    index("rooms_integration_commit_ix").on(t.missionId, t.integrationCommitId),
    index("rooms_alive_ix").on(t.state).where(sql`(state <> 'destroyed'::text)`),
  ],
);
