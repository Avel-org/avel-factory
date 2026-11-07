// The `knowledge` module's tables (contract.md section 6, "One owner per table"), rebuilt from
// the database map (docs/design/AVEL Database Map.html) with section 6's changes on top.
// Value lists come from @avel/contract; triggers and functions are in drizzle/0000 and 0002.
import {
  CloseoutItemKind,
  CloseoutItemState,
  DesignSystemLayer,
  IndexStatus,
  KbEntryStatus,
  LibraryLayer,
  SkillAuthor,
  SkillSource,
} from "@avel/contract";
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
  uuid,
} from "drizzle-orm/pg-core";
import { oneOf, tsvector } from "./columns.js";
import { findings, missions, moduleRuns } from "./factory.js";
import { clients } from "./onboarding.js";
import { users } from "./platform.js";

/** `closeout_items` (Judgment): A confirmed finding or lesson candidate that closeout lists for you to write up as a factory PR. */
export const closeoutItems = pgTable(
  "closeout_items",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    kind: text("kind").notNull(),
    findingId: uuid("finding_id"),
    moduleRunId: uuid("module_run_id"),
    note: text("note"),
    state: text("state").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "closeout_items_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "closeout_items_finding_fk",
      columns: [t.missionId, t.findingId],
      foreignColumns: [findings.missionId, findings.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "closeout_items_module_run_fk",
      columns: [t.missionId, t.moduleRunId],
      foreignColumns: [moduleRuns.missionId, moduleRuns.id],
    }).onDelete("restrict"),
    check("closeout_items_kind_ck", oneOf(t.kind, CloseoutItemKind)),
    check("closeout_items_state_ck", oneOf(t.state, CloseoutItemState)),
    check(
      "closeout_items_parent_ck",
      sql`
CASE kind
    WHEN 'finding'::text THEN ((finding_id IS NOT NULL) AND (module_run_id IS NULL))
    WHEN 'lesson_candidate'::text THEN ((module_run_id IS NOT NULL) AND (finding_id IS NULL))
    ELSE NULL::boolean
END`,
    ),
    index("closeout_items_finding_ix").on(t.missionId, t.findingId),
    index("closeout_items_module_run_ix").on(t.missionId, t.moduleRunId),
  ],
);

/** `design_systems` (Library): The design library index: one row per design system version under design/<slug> in the factory repo (B9, CR-7). A mission pins one at finalize. */
export const designSystems = pgTable(
  "design_systems",
  {
    slug: text("slug").notNull(),
    version: text("version").notNull(),
    layer: text("layer").notNull(),
    clientId: uuid("client_id"),
    path: text("path").notNull(),
    factoryCommit: text("factory_commit").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    primaryKey({ name: "design_systems_pkey", columns: [t.slug, t.version] }),
    foreignKey({
      name: "design_systems_client_id_clients_id_fk",
      columns: [t.clientId],
      foreignColumns: [clients.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "design_systems_factory_commit_factory_versions_sha_fk",
      columns: [t.factoryCommit],
      foreignColumns: [factoryVersions.sha],
    }).onDelete("restrict"),
    check("design_systems_layer_ck", oneOf(t.layer, DesignSystemLayer)),
    check("design_systems_status_ck", oneOf(t.status, IndexStatus)),
    check(
      "design_systems_client_layer_ck",
      sql`((layer = 'client'::text) = (client_id IS NOT NULL))`,
    ),
    index("design_systems_client_id_ix").on(t.clientId),
    index("design_systems_factory_commit_ix").on(t.factoryCommit),
  ],
);

/** `factory_versions` (Library): A merged commit of the factory repo; each mission pins one. */
export const factoryVersions = pgTable(
  "factory_versions",
  {
    sha: text("sha").primaryKey(),
    mergedAt: timestamp("merged_at", { withTimezone: true }).notNull(),
    approvedBy: uuid("approved_by").notNull(),
    mergedByApp: boolean("merged_by_app").notNull(),
    summary: text("summary").notNull(),
    prNumber: integer("pr_number").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "factory_versions_approved_by_users_id_fk",
      columns: [t.approvedBy],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    index("factory_versions_approved_by_ix").on(t.approvedBy),
  ],
);

/** `kb_entries` (Library): the body lives in the factory repo; search_text is built from it when the factory commit is indexed, so the agents' kb-search tool (GET /api/agent/kb-entries?query=) has something to search */
export const kbEntries = pgTable(
  "kb_entries",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    layer: text("layer").notNull(),
    clientId: uuid("client_id"),
    kind: text("kind").notNull(),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    path: text("path").notNull(),
    bodySha256: text("body_sha256").notNull(),
    searchText: tsvector("search_text").notNull().default(sql`''::tsvector`),
    provenance: jsonb("provenance").notNull().default(sql`'{}'::jsonb`),
    status: text("status").notNull().default("proposed"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "kb_entries_client_id_clients_id_fk",
      columns: [t.clientId],
      foreignColumns: [clients.id],
    }).onDelete("restrict"),
    check("kb_entries_client_layer_ck", sql`((layer = 'client'::text) = (client_id IS NOT NULL))`),
    check("kb_entries_layer_ck", oneOf(t.layer, LibraryLayer)),
    check("kb_entries_status_ck", oneOf(t.status, KbEntryStatus)),
    index("kb_entries_client_id_ix").on(t.clientId),
    index("kb_entries_search_text_gin").using("gin", t.searchText),
    index("kb_entries_tags_gin").using("gin", t.tags),
  ],
);

/** `kb_release_entries` (Library): key (kb_release → kb_releases, kb_entry_id → kb_entries) */
export const kbReleaseEntries = pgTable(
  "kb_release_entries",
  {
    kbRelease: text("kb_release").notNull(),
    kbEntryId: uuid("kb_entry_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    primaryKey({ name: "kb_release_entries_pkey", columns: [t.kbRelease, t.kbEntryId] }),
    foreignKey({
      name: "kb_release_entries_kb_release_kb_releases_version_fk",
      columns: [t.kbRelease],
      foreignColumns: [kbReleases.version],
    }).onDelete("restrict"),
    foreignKey({
      name: "kb_release_entries_kb_entry_id_kb_entries_id_fk",
      columns: [t.kbEntryId],
      foreignColumns: [kbEntries.id],
    }).onDelete("restrict"),
    index("kb_release_entries_kb_entry_id_ix").on(t.kbEntryId),
  ],
);

/** `kb_releases` (Library): A numbered release of knowledge entries; each mission pins one. */
export const kbReleases = pgTable(
  "kb_releases",
  {
    version: text("version").primaryKey(),
    factoryCommit: text("factory_commit").notNull(),
    approvedBy: uuid("approved_by").notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "kb_releases_factory_commit_factory_versions_sha_fk",
      columns: [t.factoryCommit],
      foreignColumns: [factoryVersions.sha],
    }).onDelete("restrict"),
    foreignKey({
      name: "kb_releases_approved_by_users_id_fk",
      columns: [t.approvedBy],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    index("kb_releases_factory_commit_ix").on(t.factoryCommit),
    index("kb_releases_approved_by_ix").on(t.approvedBy),
  ],
);

/** `skills` (Library): source says how the skill arrived: you uploaded it, you wrote it, or it was imported from source_url */
export const skills = pgTable(
  "skills",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    slug: text("slug").notNull(),
    version: text("version").notNull(),
    layer: text("layer").notNull(),
    type: text("type").notNull(),
    versionRange: text("version_range"),
    contentSha256: text("content_sha256").notNull(),
    author: text("author").notNull(),
    source: text("source").notNull(),
    sourceUrl: text("source_url"),
    factoryCommit: text("factory_commit").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("skills_slug_version_uq").on(t.slug, t.version),
    foreignKey({
      name: "skills_factory_commit_factory_versions_sha_fk",
      columns: [t.factoryCommit],
      foreignColumns: [factoryVersions.sha],
    }).onDelete("restrict"),
    check("skills_author_ck", oneOf(t.author, SkillAuthor)),
    check("skills_source_ck", oneOf(t.source, SkillSource)),
    check("skills_status_ck", oneOf(t.status, IndexStatus)),
    check("skills_source_url_ck", sql`((source <> 'import'::text) OR (source_url IS NOT NULL))`),
    index("skills_factory_commit_ix").on(t.factoryCommit),
  ],
);

/** `templates` (Library): A project template: a scaffold repo at a pinned commit, plus a plan template, for one package. */
export const templates = pgTable(
  "templates",
  {
    slug: text("slug").notNull(),
    version: text("version").notNull(),
    packageKey: text("package_key").notNull(),
    path: text("path").notNull(),
    scaffoldCommit: text("scaffold_commit").notNull(),
    factoryCommit: text("factory_commit").notNull(),
    status: text("status").notNull().default("active"),
    // CR-13
    sourceMissionId: uuid("source_mission_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    primaryKey({ name: "templates_pkey", columns: [t.slug, t.version] }),
    foreignKey({
      name: "templates_factory_commit_factory_versions_sha_fk",
      columns: [t.factoryCommit],
      foreignColumns: [factoryVersions.sha],
    }).onDelete("restrict"),
    // CR-13
    foreignKey({
      name: "templates_source_mission_id_missions_id_fk",
      columns: [t.sourceMissionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    check("templates_status_ck", oneOf(t.status, IndexStatus)),
    index("templates_factory_commit_ix").on(t.factoryCommit),
    // CR-13
    index("templates_source_mission_id_ix").on(t.sourceMissionId),
  ],
);
