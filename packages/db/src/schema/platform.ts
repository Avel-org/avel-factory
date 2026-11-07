// The `platform` module's tables (contract.md section 6, "One owner per table"), rebuilt from
// the database map (docs/design/AVEL Database Map.html) with section 6's changes on top.
// Value lists come from @avel/contract; triggers and functions are in drizzle/0000 and 0002.
import { IdempotencyKeyStatus, JobState } from "@avel/contract";
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

/** `auth_accounts` (People and clients): Better Auth's own table (sessions, accounts, verification codes or passkeys); it cascades from users. */
export const authAccounts = pgTable(
  "auth_accounts",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    userId: uuid("user_id").notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "auth_accounts_user_id_users_id_fk",
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    index("auth_accounts_user_id_ix").on(t.userId),
  ],
);

/** `auth_passkeys` (People and clients): Better Auth's own table (sessions, accounts, verification codes or passkeys); it cascades from users. */
export const authPasskeys = pgTable(
  "auth_passkeys",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    userId: uuid("user_id").notNull(),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    credentialId: text("credential_id").notNull(),
    counter: integer("counter").notNull(),
    deviceType: text("device_type").notNull(),
    backedUp: boolean("backed_up").notNull(),
    transports: text("transports"),
    aaguid: text("aaguid"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "auth_passkeys_user_id_users_id_fk",
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    index("auth_passkeys_user_id_ix").on(t.userId),
  ],
);

/** `auth_sessions` (People and clients): Better Auth's own table (sessions, accounts, verification codes or passkeys); it cascades from users. */
export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    userId: uuid("user_id").notNull(),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    uniqueIndex("auth_sessions_token_uq").on(t.token),
    foreignKey({
      name: "auth_sessions_user_id_users_id_fk",
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    index("auth_sessions_user_id_ix").on(t.userId),
  ],
);

/** `auth_verifications` (People and clients): Better Auth's own table (sessions, accounts, verification codes or passkeys); it cascades from users. */
export const authVerifications = pgTable("auth_verifications", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** `cli_sessions` (Plumbing): A signed-in CLI session (12 hours), stored as a hash of its token. */
export const cliSessions = pgTable(
  "cli_sessions",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    userId: uuid("user_id").notNull(),
    tokenSha256: text("token_sha256").notNull(),
    label: text("label").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("cli_sessions_token_sha256_uq").on(t.tokenSha256),
    foreignKey({
      name: "cli_sessions_user_id_users_id_fk",
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    index("cli_sessions_user_id_ix").on(t.userId),
  ],
);

/** `idempotency_keys` (Plumbing): A recently used Idempotency-Key and its response, so a repeated write isn't run twice (kept 24 hours). */
export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    principal: text("principal").notNull(),
    key: text("key").notNull(),
    route: text("route").notNull(),
    bodySha256: text("body_sha256").notNull(),
    status: text("status").notNull().default("in_progress"),
    httpStatus: integer("http_status"),
    response: jsonb("response"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    primaryKey({ name: "idempotency_keys_pkey", columns: [t.principal, t.key] }),
    check("idempotency_keys_status_ck", oneOf(t.status, IdempotencyKeyStatus)),
    index("idempotency_keys_purge_ix").on(t.expiresAt),
  ],
);

/** `jobs` (Plumbing): the transactional outbox: a state change and its follow-up job commit together. Finalize's render request is the job ('render_dispatch', key 'render:<plan_id>') */
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    kind: text("kind").notNull(),
    key: text("key").notNull(),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    state: text("state").notNull().default("queued"),
    // CR-6
    claimExpiresAt: timestamp("claim_expires_at", { withTimezone: true }),
    claimedBy: text("claimed_by"),
    // CR-6
    claimNo: integer("claim_no").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    runAfter: timestamp("run_after", { withTimezone: true }).notNull().defaultNow(),
    lastError: text("last_error"),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    // CR-6: 'leased' -> 'claimed'
    uniqueIndex("jobs_one_live_key_uq")
      .on(t.key)
      .where(sql`(state = ANY (ARRAY['queued'::text, 'claimed'::text]))`),
    check("jobs_state_ck", oneOf(t.state, JobState)),
    // CR-6 (the name is CR-6's)
    check(
      "jobs_claim_ck",
      sql`(((claim_expires_at IS NOT NULL) = (state = 'claimed'::text)) AND ((claimed_by IS NOT NULL) = (state = 'claimed'::text)))`,
    ),
    check(
      "jobs_finished_ck",
      sql`((state <> ALL (ARRAY['done'::text, 'dead'::text])) OR (finished_at IS NOT NULL))`,
    ),
    index("jobs_claimable_ix").on(t.runAfter).where(sql`(state = 'queued'::text)`),
    // CR-6 (the name is CR-6's)
    index("jobs_expired_claims_ix").on(t.claimExpiresAt).where(sql`(state = 'claimed'::text)`),
    index("jobs_purge_ix")
      .on(t.finishedAt)
      .where(sql`(state = ANY (ARRAY['done'::text, 'dead'::text]))`),
  ],
);

/** `step_up_grants` (Plumbing): credential actions only */
export const stepUpGrants = pgTable(
  "step_up_grants",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    userId: uuid("user_id").notNull(),
    action: text("action").notNull(),
    target: text("target").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "step_up_grants_user_id_users_id_fk",
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    index("step_up_grants_user_id_ix").on(t.userId),
    index("step_up_grants_purge_ix").on(t.expiresAt),
  ],
);

/** `users` (People and clients): Better Auth's user table: one row, you. Better Auth also owns auth_sessions, auth_accounts, */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [uniqueIndex("users_email_uq").on(t.email)],
);

/** `webhook_deliveries` (Plumbing): X-GitHub-Delivery dedupe */
export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    deliveryId: text("delivery_id").primaryKey(),
    event: text("event").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [index("webhook_deliveries_purge_ix").on(t.receivedAt)],
);
