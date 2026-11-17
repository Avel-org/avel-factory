// The `rules` module's tables (contract.md section 6, "One owner per table"), rebuilt from
// the database map (docs/design/AVEL Database Map.html) with section 6's changes on top.
// Value lists come from @avel/contract; triggers and functions are in drizzle/0000 and 0002.
import { IndexStatus, LibraryLayer } from "@avel/contract";
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  type PgTableExtraConfigValue,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { oneOf } from "./columns.js";
import { factoryVersions } from "./knowledge.js";
import { clients } from "./onboarding.js";

/** `rules` (Library): A rule that `avel check` runs, scoped to every mission, one stack or one client. */
export const rules = pgTable(
  "rules",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    scope: text("scope").notNull(),
    stack: text("stack"),
    clientId: uuid("client_id"),
    path: text("path").notNull(),
    sha256: text("sha256").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "rules_client_id_clients_id_fk",
      columns: [t.clientId],
      foreignColumns: [clients.id],
    }).onDelete("restrict"),
    check("rules_scope_ck", oneOf(t.scope, LibraryLayer)),
    check("rules_status_ck", oneOf(t.status, IndexStatus)),
    check(
      "rules_scope_parts_ck",
      sql`(((scope = 'client'::text) = (client_id IS NOT NULL)) AND ((scope = 'stack'::text) = (stack IS NOT NULL)))`,
    ),
    index("rules_client_id_ix").on(t.clientId),
  ],
);

/** `rules_version_rules` (Library): key (rules_version → rules_versions, rule_id → rules) */
export const rulesVersionRules = pgTable(
  "rules_version_rules",
  {
    rulesVersion: text("rules_version").notNull(),
    ruleId: uuid("rule_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    primaryKey({ name: "rules_version_rules_pkey", columns: [t.rulesVersion, t.ruleId] }),
    foreignKey({
      name: "rules_version_rules_rules_version_rules_versions_version_fk",
      columns: [t.rulesVersion],
      foreignColumns: [rulesVersions.version],
    }).onDelete("restrict"),
    foreignKey({
      name: "rules_version_rules_rule_id_rules_id_fk",
      columns: [t.ruleId],
      foreignColumns: [rules.id],
    }).onDelete("restrict"),
    index("rules_version_rules_rule_id_ix").on(t.ruleId),
  ],
);

/** `rules_versions` (Library): A numbered set of rules; each mission pins one. */
export const rulesVersions = pgTable(
  "rules_versions",
  {
    version: text("version").primaryKey(),
    sha256: text("sha256").notNull(),
    factoryCommit: text("factory_commit").notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "rules_versions_factory_commit_factory_versions_sha_fk",
      columns: [t.factoryCommit],
      foreignColumns: [factoryVersions.sha],
    }).onDelete("restrict"),
    index("rules_versions_factory_commit_ix").on(t.factoryCommit),
  ],
);
