// The `delivery` module's tables (contract.md section 6, "One owner per table"), rebuilt from
// the database map (docs/design/AVEL Database Map.html) with section 6's changes on top.
// Value lists come from @avel/contract; triggers and functions are in drizzle/0000 and 0002.
import { DeliveryKind, DeliveryState, RepoConnectionState, SecretState } from "@avel/contract";
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
import { bytea, oneOf } from "./columns.js";
import { missions } from "./factory.js";
import { receipts, releaseApprovals } from "./gate.js";
import { clients } from "./onboarding.js";

/** `deliveries` (Verification and delivery): One delivery of a released commit: a PR, a push or a zip. */
export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    releaseApprovalId: uuid("release_approval_id").notNull(),
    receiptId: uuid("receipt_id").notNull(),
    repoConnectionId: uuid("repo_connection_id"),
    kind: text("kind").notNull(),
    commitSha: text("commit_sha").notNull(),
    ref: text("ref"),
    state: text("state").notNull().default("pending"),
    error: text("error"),
    recordedAt: timestamp("recorded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    uniqueIndex("deliveries_one_pending_uq").on(t.missionId).where(sql`(state = 'pending'::text)`),
    foreignKey({
      name: "deliveries_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "deliveries_repo_connection_id_repo_connections_id_fk",
      columns: [t.repoConnectionId],
      foreignColumns: [repoConnections.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "deliveries_release_approval_fk",
      columns: [t.releaseApprovalId, t.receiptId],
      foreignColumns: [releaseApprovals.id, releaseApprovals.receiptId],
    }).onDelete("restrict"),
    foreignKey({
      name: "deliveries_receipt_fk",
      columns: [t.missionId, t.receiptId],
      foreignColumns: [receipts.missionId, receipts.id],
    }).onDelete("restrict"),
    check("deliveries_kind_ck", oneOf(t.kind, DeliveryKind)),
    check("deliveries_state_ck", oneOf(t.state, DeliveryState)),
    check(
      "deliveries_connection_ck",
      sql`((kind <> ALL (ARRAY['pr'::text, 'push'::text])) OR (repo_connection_id IS NOT NULL))`,
    ),
    check(
      "deliveries_recorded_ck",
      sql`((state <> 'recorded'::text) OR ((recorded_at IS NOT NULL) AND (ref IS NOT NULL)))`,
    ),
    check("deliveries_failed_ck", sql`((state <> 'failed'::text) OR (error IS NOT NULL))`),
    index("deliveries_release_approval_ix").on(t.releaseApprovalId, t.receiptId),
    index("deliveries_receipt_ix").on(t.missionId, t.receiptId),
    index("deliveries_repo_connection_id_ix").on(t.repoConnectionId),
  ],
);

/** `repo_connections` (People and clients): both tokens belong to the same client as the connection; only the delivery worker decrypts the write secret */
export const repoConnections = pgTable(
  "repo_connections",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    clientId: uuid("client_id").notNull(),
    owner: text("owner").notNull(),
    repos: text("repos").array().notNull(),
    readSecretId: uuid("read_secret_id").notNull(),
    writeSecretId: uuid("write_secret_id").notNull(),
    readExpiresAt: timestamp("read_expires_at", { withTimezone: true }).notNull(),
    writeExpiresAt: timestamp("write_expires_at", { withTimezone: true }).notNull(),
    state: text("state").notNull().default("active"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("repo_connections_client_id_id_uq").on(t.clientId, t.id),
    uniqueIndex("repo_connections_one_active_uq")
      .on(t.clientId)
      .where(sql`(state = 'active'::text)`),
    foreignKey({
      name: "repo_connections_client_id_clients_id_fk",
      columns: [t.clientId],
      foreignColumns: [clients.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "repo_connections_read_secret_fk",
      columns: [t.clientId, t.readSecretId],
      foreignColumns: [secrets.clientId, secrets.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "repo_connections_write_secret_fk",
      columns: [t.clientId, t.writeSecretId],
      foreignColumns: [secrets.clientId, secrets.id],
    }).onDelete("restrict"),
    check("repo_connections_state_ck", oneOf(t.state, RepoConnectionState)),
    check(
      "repo_connections_revoked_at_ck",
      sql`((state = 'revoked'::text) = (revoked_at IS NOT NULL))`,
    ),
    index("repo_connections_read_secret_ix").on(t.clientId, t.readSecretId),
    index("repo_connections_write_secret_ix").on(t.clientId, t.writeSecretId),
    index("repo_connections_repos_gin").using("gin", t.repos),
  ],
);

/** `secrets` (Plumbing): envelope encryption, key in AWS KMS; destroying wipes the ciphertext and keeps the row */
export const secrets = pgTable(
  "secrets",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id"),
    clientId: uuid("client_id"),
    name: text("name").notNull(),
    ciphertext: bytea("ciphertext"),
    wrappedDek: bytea("wrapped_dek"),
    kmsKeyId: text("kms_key_id").notNull(),
    keyVersion: integer("key_version").notNull(),
    state: text("state").notNull().default("active"),
    destroyedAt: timestamp("destroyed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("secrets_client_id_id_uq").on(t.clientId, t.id),
    uniqueIndex("secrets_client_name_uq")
      .on(t.clientId, t.name)
      .where(sql`((state = 'active'::text) AND (client_id IS NOT NULL))`),
    uniqueIndex("secrets_mission_name_uq")
      .on(t.missionId, t.name)
      .where(sql`((state = 'active'::text) AND (mission_id IS NOT NULL))`),
    foreignKey({
      name: "secrets_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "secrets_client_id_clients_id_fk",
      columns: [t.clientId],
      foreignColumns: [clients.id],
    }).onDelete("restrict"),
    check("secrets_state_ck", oneOf(t.state, SecretState)),
    check(
      "secrets_destroyed_at_ck",
      sql`((state = 'destroyed'::text) = (destroyed_at IS NOT NULL))`,
    ),
    check(
      "secrets_material_ck",
      sql`(((ciphertext IS NOT NULL) = (state = 'active'::text)) AND ((wrapped_dek IS NOT NULL) = (state = 'active'::text)))`,
    ),
    check("secrets_owner_ck", sql`(num_nonnulls(mission_id, client_id) <= 1)`),
    index("secrets_mission_id_ix").on(t.missionId),
  ],
);
