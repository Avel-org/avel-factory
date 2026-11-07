// The `factory` module's tables (contract.md section 6, "One owner per table"), rebuilt from
// the database map (docs/design/AVEL Database Map.html) with section 6's changes on top.
// Value lists come from @avel/contract; triggers and functions are in drizzle/0000 and 0002.
import {
  ArchiveStatus,
  ClientKind,
  DispatchOrigin,
  DispatchRole,
  DispatchState,
  FindingDecidedByKind,
  FindingKind,
  FindingRoute,
  FindingSource,
  FindingState,
  MissionPauseKind,
  MissionRefreshState,
  MissionState,
  ModuleRunState,
  NoteSource,
  ProjectKind,
  ProposalKind,
  ProposalState,
} from "@avel/contract";
import { sql } from "drizzle-orm";
import {
  bigint,
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
import { oneOf, oneOfOrNull } from "./columns.js";
import { repoConnections } from "./delivery.js";
import { receipts } from "./gate.js";
import { designSystems, factoryVersions, kbReleases } from "./knowledge.js";
import { checkpoints, clients } from "./onboarding.js";
import { packages } from "./packages.js";
import { planModules, plans } from "./plan.js";
import { users } from "./platform.js";
import { rulesVersions } from "./rules.js";
import { attempts } from "./runner.js";

/** `dispatches` (Execution): the task_docs key is NO ACTION, deferred to commit, because a dispatch and its first task doc are inserted in the same transaction */
export const dispatches = pgTable(
  "dispatches",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    moduleRunId: uuid("module_run_id"),
    planId: uuid("plan_id").notNull(),
    agent: text("agent").notNull(),
    role: text("role").notNull(),
    pass: integer("pass").notNull().default(1),
    state: text("state").notNull().default("pending"),
    parkedFrom: text("parked_from"),
    origin: text("origin").notNull().default("factory"),
    taskDocVersion: integer("task_doc_version").notNull().default(1),
    resultCommit: text("result_commit"),
    frozenIdentity: jsonb("frozen_identity").notNull(),
    wave: integer("wave").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("dispatches_mission_id_id_uq").on(t.missionId, t.id),
    unique("dispatches_id_module_run_id_uq").on(t.id, t.moduleRunId),
    uniqueIndex("dispatches_module_role_pass_uq")
      .on(t.moduleRunId, t.role, t.pass)
      .where(sql`(module_run_id IS NOT NULL)`),
    uniqueIndex("dispatches_mission_role_pass_uq")
      .on(t.missionId, t.role, t.pass)
      .where(sql`(module_run_id IS NULL)`),
    foreignKey({
      name: "dispatches_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "dispatches_module_run_fk",
      columns: [t.missionId, t.moduleRunId],
      foreignColumns: [moduleRuns.missionId, moduleRuns.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "dispatches_plan_fk",
      columns: [t.missionId, t.planId],
      foreignColumns: [plans.missionId, plans.id],
    }).onDelete("restrict"),
    // DEFERRABLE INITIALLY DEFERRED: drizzle-kit can't say it, so 0002_hand_written.sql sets it
    foreignKey({
      name: "dispatches_task_doc_fk",
      columns: [t.id, t.taskDocVersion],
      foreignColumns: [taskDocs.dispatchId, taskDocs.version],
    }).onDelete("no action"),
    // CR-7, CR-8
    check("dispatches_role_ck", oneOf(t.role, DispatchRole)),
    check("dispatches_state_ck", oneOf(t.state, DispatchState)),
    check("dispatches_parked_from_ck", oneOfOrNull(t.parkedFrom, DispatchState)),
    check("dispatches_origin_ck", oneOf(t.origin, DispatchOrigin)),
    check("dispatches_pass_ck", sql`(pass >= 1)`),
    check(
      "dispatches_parked_ck",
      sql`(((state = 'parked'::text) = (parked_from IS NOT NULL)) AND ((parked_from IS NULL) OR (parked_from <> 'parked'::text)))`,
    ),
    index("dispatches_module_run_ix").on(t.missionId, t.moduleRunId),
    index("dispatches_plan_ix").on(t.missionId, t.planId),
    index("dispatches_claimable_ix")
      .on(t.missionId, t.state)
      .where(sql`(state = ANY (ARRAY['pending'::text, 'ready'::text]))`),
  ],
);

/** `findings` (Judgment): decided_by_kind says who closed it: you (user), the other reviewer or a re-review (agent, through its attempt), or a passing check (check, named in fixed_by_check) */
export const findings = pgTable(
  "findings",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    checkpointId: uuid("checkpoint_id"),
    moduleRunId: uuid("module_run_id"),
    source: text("source").notNull(),
    sourceRole: text("source_role").notNull(),
    checkId: text("check_id"),
    targetRef: text("target_ref"),
    evidence: jsonb("evidence"),
    kind: text("kind").notNull(),
    route: text("route").notNull(),
    state: text("state").notNull().default("open"),
    tries: integer("tries").notNull().default(0),
    reviewedCommit: text("reviewed_commit"),
    reason: text("reason"),
    decidedByKind: text("decided_by_kind"),
    decidedByUserId: uuid("decided_by_user_id"),
    decidedByAttemptId: uuid("decided_by_attempt_id"),
    fixedByCheck: text("fixed_by_check"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("findings_mission_id_id_uq").on(t.missionId, t.id),
    foreignKey({
      name: "findings_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "findings_decided_by_user_id_users_id_fk",
      columns: [t.decidedByUserId],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "findings_checkpoint_fk",
      columns: [t.missionId, t.checkpointId],
      foreignColumns: [checkpoints.missionId, checkpoints.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "findings_module_run_fk",
      columns: [t.missionId, t.moduleRunId],
      foreignColumns: [moduleRuns.missionId, moduleRuns.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "findings_decided_by_attempt_fk",
      columns: [t.missionId, t.decidedByAttemptId],
      foreignColumns: [attempts.missionId, attempts.id],
    }).onDelete("restrict"),
    check("findings_source_ck", oneOf(t.source, FindingSource)),
    check("findings_kind_ck", oneOf(t.kind, FindingKind)),
    check("findings_route_ck", oneOf(t.route, FindingRoute)),
    check("findings_state_ck", oneOf(t.state, FindingState)),
    check("findings_decided_by_kind_ck", oneOfOrNull(t.decidedByKind, FindingDecidedByKind)),
    check(
      "findings_checkpoint_source_ck",
      sql`((checkpoint_id IS NOT NULL) = (source = 'checkpoint'::text))`,
    ),
    check(
      "findings_reviewed_commit_ck",
      sql`((reviewed_commit IS NOT NULL) = (source = ANY (ARRAY['review'::text, 'gate'::text])))`,
    ),
    check(
      "findings_cites_ck",
      sql`(((target_ref IS NOT NULL) AND (evidence IS NOT NULL)) OR (state = ANY (ARRAY['triage'::text, 'dismissed'::text])))`,
    ),
    check("findings_decided_at_ck", sql`((decided_by_kind IS NULL) = (decided_at IS NULL))`),
    check(
      "findings_decided_by_ck",
      sql`
CASE decided_by_kind
    WHEN 'user'::text THEN ((decided_by_user_id IS NOT NULL) AND (decided_by_attempt_id IS NULL) AND (fixed_by_check IS NULL))
    WHEN 'agent'::text THEN ((decided_by_user_id IS NULL) AND (decided_by_attempt_id IS NOT NULL) AND (fixed_by_check IS NULL))
    WHEN 'check'::text THEN ((decided_by_user_id IS NULL) AND (decided_by_attempt_id IS NULL) AND (fixed_by_check IS NOT NULL))
    ELSE ((decided_by_user_id IS NULL) AND (decided_by_attempt_id IS NULL) AND (fixed_by_check IS NULL))
END`,
    ),
    check(
      "findings_closed_decided_ck",
      sql`((state <> ALL (ARRAY['dismissed'::text, 'accepted'::text, 'fixed'::text])) OR (decided_by_kind IS NOT NULL))`,
    ),
    check(
      "findings_reason_ck",
      sql`((state <> ALL (ARRAY['dismissed'::text, 'accepted'::text])) OR (reason IS NOT NULL))`,
    ),
    check(
      "findings_accepted_by_user_ck",
      sql`((state <> 'accepted'::text) OR (decided_by_kind = 'user'::text))`,
    ),
    check(
      "findings_fixed_by_ck",
      sql`((state <> 'fixed'::text) OR (decided_by_kind = ANY (ARRAY['check'::text, 'agent'::text])))`,
    ),
    check(
      "findings_integrity_ck",
      sql`((kind <> 'integrity'::text) OR (state <> 'accepted'::text))`,
    ),
    index("findings_checkpoint_ix").on(t.missionId, t.checkpointId),
    index("findings_module_run_ix").on(t.missionId, t.moduleRunId),
    index("findings_decided_by_user_ix").on(t.decidedByUserId),
    index("findings_decided_by_attempt_ix").on(t.missionId, t.decidedByAttemptId),
    index("findings_pending_ix")
      .on(t.missionId)
      .where(sql`(state = ANY (ARRAY['triage'::text, 'disputed'::text]))`),
  ],
);

/** `mission_docs` (Execution): The rendered DISPATCH.md for a plan version, and when it passed Gate 1. */
export const missionDocs = pgTable(
  "mission_docs",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    planId: uuid("plan_id").notNull(),
    dispatchMd: text("dispatch_md").notNull(),
    hash: text("hash").notNull(),
    gate1PassedAt: timestamp("gate1_passed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("mission_docs_plan_id_uq").on(t.planId),
    foreignKey({
      name: "mission_docs_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "mission_docs_plan_fk",
      columns: [t.missionId, t.planId],
      foreignColumns: [plans.missionId, plans.id],
    }).onDelete("restrict"),
    index("mission_docs_plan_ix").on(t.missionId, t.planId),
  ],
);

/** `mission_pauses` (Judgment): the mission is held while any row is open. Rows are independent, not a stack: an operator pause closes when you resume it (DELETE /pauses/{pauseId}); a proposal pause closes in the same transaction that resolves its proposal; a budget pause closes when a budget increase is approved. interrupted_state is history: the work state doesn't change */
export const missionPauses = pgTable(
  "mission_pauses",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    kind: text("kind").notNull(),
    interruptedState: text("interrupted_state").notNull(),
    proposalId: uuid("proposal_id"),
    pausedBy: uuid("paused_by"),
    reason: text("reason"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    endedBy: uuid("ended_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    uniqueIndex("mission_pauses_open_proposal_uq").on(t.proposalId).where(sql`(ended_at IS NULL)`),
    uniqueIndex("mission_pauses_open_operator_uq")
      .on(t.missionId)
      .where(sql`((ended_at IS NULL) AND (kind = 'operator'::text))`),
    uniqueIndex("mission_pauses_open_budget_uq")
      .on(t.missionId)
      .where(sql`((ended_at IS NULL) AND (kind = 'budget'::text))`),
    foreignKey({
      name: "mission_pauses_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "mission_pauses_paused_by_users_id_fk",
      columns: [t.pausedBy],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "mission_pauses_ended_by_users_id_fk",
      columns: [t.endedBy],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "mission_pauses_proposal_fk",
      columns: [t.missionId, t.proposalId],
      foreignColumns: [proposals.missionId, proposals.id],
    }).onDelete("restrict"),
    check("mission_pauses_kind_ck", oneOf(t.kind, MissionPauseKind)),
    check("mission_pauses_interrupted_state_ck", oneOf(t.interruptedState, MissionState)),
    check(
      "mission_pauses_proposal_ck",
      sql`((kind <> 'proposal'::text) OR (proposal_id IS NOT NULL))`,
    ),
    check(
      "mission_pauses_operator_ck",
      sql`((kind <> 'operator'::text) OR (paused_by IS NOT NULL))`,
    ),
    check("mission_pauses_ended_ck", sql`((ended_at IS NULL) OR (ended_at >= started_at))`),
    index("mission_pauses_open_ix").on(t.missionId).where(sql`(ended_at IS NULL)`),
    index("mission_pauses_proposal_ix").on(t.missionId, t.proposalId),
    index("mission_pauses_paused_by_ix").on(t.pausedBy),
    index("mission_pauses_ended_by_ix").on(t.endedBy),
  ],
);

/** `mission_refreshes` (Verification and delivery): history of pinned_commit moves; a conflict opens a proposal. The mission is 'refreshing' while a row is 'running' */
export const missionRefreshes = pgTable(
  "mission_refreshes",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    fromCommit: text("from_commit").notNull(),
    toCommit: text("to_commit").notNull(),
    fromReceiptId: uuid("from_receipt_id").notNull(),
    newReceiptId: uuid("new_receipt_id"),
    proposalId: uuid("proposal_id"),
    state: text("state").notNull().default("running"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    uniqueIndex("mission_refreshes_one_running_uq")
      .on(t.missionId)
      .where(sql`(state = 'running'::text)`),
    foreignKey({
      name: "mission_refreshes_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "mission_refreshes_from_receipt_fk",
      columns: [t.missionId, t.fromReceiptId],
      foreignColumns: [receipts.missionId, receipts.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "mission_refreshes_new_receipt_fk",
      columns: [t.missionId, t.newReceiptId],
      foreignColumns: [receipts.missionId, receipts.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "mission_refreshes_proposal_fk",
      columns: [t.missionId, t.proposalId],
      foreignColumns: [proposals.missionId, proposals.id],
    }).onDelete("restrict"),
    check("mission_refreshes_state_ck", oneOf(t.state, MissionRefreshState)),
    check(
      "mission_refreshes_finished_ck",
      sql`((state = 'running'::text) OR (finished_at IS NOT NULL))`,
    ),
    check(
      "mission_refreshes_done_ck",
      sql`((state <> 'done'::text) OR (new_receipt_id IS NOT NULL))`,
    ),
    check(
      "mission_refreshes_conflict_ck",
      sql`((state <> 'conflict'::text) OR (proposal_id IS NOT NULL))`,
    ),
    index("mission_refreshes_from_receipt_ix").on(t.missionId, t.fromReceiptId),
    index("mission_refreshes_new_receipt_ix").on(t.missionId, t.newReceiptId),
    index("mission_refreshes_proposal_ix").on(t.missionId, t.proposalId),
  ],
);

/** `missions` (Missions and money in): plan_id is the current plan: the single source of truth. plan_state is always 'approved', so the composite key (NO ACTION, deferred to commit) forces the current plan to be the mission's one approved plan. factory_commit is pinned when onboarding starts. */
export const missions = pgTable(
  "missions",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    clientId: uuid("client_id").notNull(),
    // CR-13; no default (D20); frozen once onboarding starts (missions_frozen)
    kind: text("kind").notNull(),
    // CR-13; no default (D20); set from the client
    clientKind: text("client_kind").notNull(),
    state: text("state").notNull().default("draft"),
    packageKey: text("package_key"),
    packageVersion: text("package_version"),
    priceMicros: bigint("price_micros", { mode: "number" }),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    budgetMicros: bigint("budget_micros", { mode: "number" }).notNull(),
    reservedMicros: bigint("reserved_micros", { mode: "number" }).notNull().default(0),
    spentMicros: bigint("spent_micros", { mode: "number" }).notNull().default(0),
    planId: uuid("plan_id"),
    planState: text("plan_state"),
    repoConnectionId: uuid("repo_connection_id"),
    pinnedCommit: text("pinned_commit"),
    branchHead: text("branch_head"),
    factoryCommit: text("factory_commit"),
    rosterVersion: text("roster_version"),
    kbRelease: text("kb_release"),
    rulesVersion: text("rules_version"),
    gate5Failures: integer("gate5_failures").notNull().default(0),
    onboardingStartedAt: timestamp("onboarding_started_at", { withTimezone: true }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    renderedAt: timestamp("rendered_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    // B9 (INT): the pinned design system, set at finalize
    designSystemSlug: text("design_system_slug"),
    designSystemVersion: text("design_system_version"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "missions_client_id_clients_id_fk",
      columns: [t.clientId],
      foreignColumns: [clients.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "missions_factory_commit_factory_versions_sha_fk",
      columns: [t.factoryCommit],
      foreignColumns: [factoryVersions.sha],
    }).onDelete("restrict"),
    foreignKey({
      name: "missions_kb_release_kb_releases_version_fk",
      columns: [t.kbRelease],
      foreignColumns: [kbReleases.version],
    }).onDelete("restrict"),
    foreignKey({
      name: "missions_rules_version_rules_versions_version_fk",
      columns: [t.rulesVersion],
      foreignColumns: [rulesVersions.version],
    }).onDelete("restrict"),
    foreignKey({
      name: "missions_package_fk",
      columns: [t.packageKey, t.packageVersion],
      foreignColumns: [packages.key, packages.version],
    }).onDelete("restrict"),
    foreignKey({
      name: "missions_repo_connection_fk",
      columns: [t.clientId, t.repoConnectionId],
      foreignColumns: [repoConnections.clientId, repoConnections.id],
    }).onDelete("restrict"),
    // DEFERRABLE INITIALLY DEFERRED: drizzle-kit can't say it, so 0002_hand_written.sql sets it
    foreignKey({
      name: "missions_current_plan_fk",
      columns: [t.id, t.planId, t.planState],
      foreignColumns: [plans.missionId, plans.id, plans.state],
    }).onDelete("no action"),
    // CR-13; the one-column missions_client_id_clients_id_fk stays
    foreignKey({
      name: "missions_client_kind_fk",
      columns: [t.clientId, t.clientKind],
      foreignColumns: [clients.id, clients.kind],
    }).onDelete("restrict"),
    // B9; as plans_template_fk
    foreignKey({
      name: "missions_design_system_fk",
      columns: [t.designSystemSlug, t.designSystemVersion],
      foreignColumns: [designSystems.slug, designSystems.version],
    }).onDelete("restrict"),
    check("missions_state_ck", oneOf(t.state, MissionState)),
    check(
      "missions_draft_not_started_ck",
      sql`((state <> 'draft'::text) OR (onboarding_started_at IS NULL))`,
    ),
    check(
      "missions_started_ck",
      sql`((state = ANY (ARRAY['draft'::text, 'cancelled'::text])) OR (onboarding_started_at IS NOT NULL))`,
    ),
    check(
      "missions_started_factory_commit_ck",
      sql`((onboarding_started_at IS NULL) OR (factory_commit IS NOT NULL))`,
    ),
    check(
      "missions_approved_fields_ck",
      sql`((approved_at IS NULL) OR ((plan_id IS NOT NULL) AND (package_key IS NOT NULL) AND (package_version IS NOT NULL) AND (price_micros IS NOT NULL) AND (deadline_at IS NOT NULL) AND (roster_version IS NOT NULL) AND (kb_release IS NOT NULL) AND (rules_version IS NOT NULL)))`,
    ),
    check(
      "missions_plan_state_ck",
      sql`(((plan_id IS NULL) = (plan_state IS NULL)) AND ((plan_state IS NULL) OR (plan_state = 'approved'::text)))`,
    ),
    check("missions_package_pair_ck", sql`((package_key IS NULL) = (package_version IS NULL))`),
    check(
      "missions_rendered_fields_ck",
      sql`((rendered_at IS NULL) OR ((approved_at IS NOT NULL) AND (branch_head IS NOT NULL)))`,
    ),
    check(
      "missions_pinned_commit_ck",
      sql`((approved_at IS NULL) OR (repo_connection_id IS NULL) OR (pinned_commit IS NOT NULL))`,
    ),
    check(
      "missions_state_approved_ck",
      sql`((state <> 'approved'::text) OR (approved_at IS NOT NULL))`,
    ),
    check(
      "missions_state_rendered_ck",
      sql`((NOT (state = ANY (ARRAY['rendered'::text, 'running'::text, 'reviewing'::text, 'deciding'::text, 'awaiting_release'::text, 'refreshing'::text, 'delivering'::text, 'delivered'::text, 'closed'::text]))) OR (rendered_at IS NOT NULL))`,
    ),
    check(
      "missions_state_delivered_ck",
      sql`((state <> ALL (ARRAY['delivered'::text, 'closed'::text])) OR (delivered_at IS NOT NULL))`,
    ),
    check("missions_state_closed_ck", sql`((state <> 'closed'::text) OR (closed_at IS NOT NULL))`),
    check(
      "missions_state_cancelled_ck",
      sql`((state = 'cancelled'::text) = (cancelled_at IS NOT NULL))`,
    ),
    check(
      "missions_budget_ck",
      sql`((reserved_micros >= 0) AND (spent_micros >= 0) AND ((reserved_micros + spent_micros) <= budget_micros))`,
    ),
    // CR-13
    check("missions_kind_ck", oneOf(t.kind, ProjectKind)),
    // CR-13
    check("missions_client_kind_ck", oneOf(t.clientKind, ClientKind)),
    // CR-13
    check(
      "missions_client_kind_match_ck",
      sql`(kind = 'client'::text) = (client_kind = 'client'::text)`,
    ),
    // B9; as plans_template_pair_ck
    check(
      "missions_design_system_pair_ck",
      sql`(design_system_slug IS NULL) = (design_system_version IS NULL)`,
    ),
    index("missions_client_id_ix").on(t.clientId),
    index("missions_state_ix").on(t.state),
    index("missions_awaiting_release_ix")
      .on(t.state)
      .where(sql`(state = 'awaiting_release'::text)`),
    index("missions_package_ix").on(t.packageKey, t.packageVersion),
    index("missions_repo_connection_ix").on(t.clientId, t.repoConnectionId),
    index("missions_factory_commit_ix").on(t.factoryCommit),
    index("missions_kb_release_ix").on(t.kbRelease),
    index("missions_rules_version_ix").on(t.rulesVersion),
    // CR-13
    index("missions_client_kind_ix").on(t.clientId, t.clientKind),
    // B9; as plans_template_ix
    index("missions_design_system_ix").on(t.designSystemSlug, t.designSystemVersion),
  ],
);

/** `module_runs` (Execution): one run per module per mission across plan versions: a contract change repoints (plan_id, plan_module_id) to the new version; ref never changes. tests_base_commit: the branch head when the module starts; the test writers start here. build_base_commit: the branch head after its tests land (set at tests_locked); the build and Retries 2 and 3 start here. */
export const moduleRuns = pgTable(
  "module_runs",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    ref: text("ref").notNull(),
    planId: uuid("plan_id").notNull(),
    planModuleId: uuid("plan_module_id").notNull(),
    state: text("state").notNull().default("blocked"),
    parkedFrom: text("parked_from"),
    ladderStep: integer("ladder_step").notNull().default(0),
    fixRounds: integer("fix_rounds").notNull().default(0),
    reworkTries: integer("rework_tries").notNull().default(0),
    reviewRounds: integer("review_rounds").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }),
    testsBaseCommit: text("tests_base_commit"),
    buildBaseCommit: text("build_base_commit"),
    landedAt: timestamp("landed_at", { withTimezone: true }),
    landedCommit: text("landed_commit"),
    currentCommit: text("current_commit"),
    budgetMicros: bigint("budget_micros", { mode: "number" }).notNull(),
    reservedMicros: bigint("reserved_micros", { mode: "number" }).notNull().default(0),
    spentMicros: bigint("spent_micros", { mode: "number" }).notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("module_runs_mission_id_ref_uq").on(t.missionId, t.ref),
    unique("module_runs_mission_id_id_uq").on(t.missionId, t.id),
    foreignKey({
      name: "module_runs_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "module_runs_plan_fk",
      columns: [t.missionId, t.planId],
      foreignColumns: [plans.missionId, plans.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "module_runs_plan_module_fk",
      columns: [t.planId, t.planModuleId, t.ref],
      foreignColumns: [planModules.planId, planModules.id, planModules.ref],
    }).onDelete("restrict"),
    check("module_runs_state_ck", oneOf(t.state, ModuleRunState)),
    check("module_runs_parked_from_ck", oneOfOrNull(t.parkedFrom, ModuleRunState)),
    check(
      "module_runs_parked_ck",
      sql`(((state = 'parked'::text) = (parked_from IS NOT NULL)) AND ((parked_from IS NULL) OR (parked_from <> 'parked'::text)))`,
    ),
    check(
      "module_runs_started_ck",
      sql`(((started_at IS NULL) = (tests_base_commit IS NULL)) AND
CASE
    WHEN (COALESCE(parked_from, state) = 'blocked'::text) THEN (started_at IS NULL)
    ELSE (started_at IS NOT NULL)
END)`,
    ),
    check(
      "module_runs_build_base_ck",
      sql`
CASE
    WHEN (COALESCE(parked_from, state) = ANY (ARRAY['blocked'::text, 'tests_writing'::text])) THEN (build_base_commit IS NULL)
    ELSE (build_base_commit IS NOT NULL)
END`,
    ),
    check(
      "module_runs_landed_triple_ck",
      sql`(((landed_at IS NULL) = (landed_commit IS NULL)) AND ((landed_at IS NULL) = (current_commit IS NULL)))`,
    ),
    check(
      "module_runs_landed_ck",
      sql`(((COALESCE(parked_from, state) <> ALL (ARRAY['landed'::text, 'reworking'::text])) OR (landed_at IS NOT NULL)) AND ((COALESCE(parked_from, state) <> ALL (ARRAY['blocked'::text, 'tests_writing'::text, 'tests_locked'::text, 'building'::text, 'retrying'::text, 'fixing'::text])) OR (landed_at IS NULL)))`,
    ),
    check(
      "module_runs_budget_ck",
      sql`((reserved_micros >= 0) AND (spent_micros >= 0) AND ((reserved_micros + spent_micros) <= budget_micros))`,
    ),
    index("module_runs_plan_ix").on(t.missionId, t.planId),
    index("module_runs_plan_module_ix").on(t.planId, t.planModuleId, t.ref),
    index("module_runs_to_advance_ix")
      .on(t.missionId, t.state)
      .where(sql`(state <> ALL (ARRAY['landed'::text, 'parked'::text]))`),
  ],
);

/** `notes` (Judgment): A note you wrote, optionally about one mission. */
export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id"),
    userId: uuid("user_id").notNull(),
    body: text("body").notNull(),
    source: text("source").notNull(),
    state: text("state").notNull().default("active"),
    redactedAt: timestamp("redacted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "notes_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "notes_user_id_users_id_fk",
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    check("notes_source_ck", oneOf(t.source, NoteSource)),
    check("notes_state_ck", oneOf(t.state, ArchiveStatus)),
    index("notes_mission_id_ix").on(t.missionId),
    index("notes_user_id_ix").on(t.userId),
  ],
);

/** `proposal_findings` (Judgment): which findings a proposal decides, for example the finding a gate5 proposal would accept */
export const proposalFindings = pgTable(
  "proposal_findings",
  {
    proposalId: uuid("proposal_id").notNull(),
    findingId: uuid("finding_id").notNull(),
    missionId: uuid("mission_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    primaryKey({ name: "proposal_findings_pkey", columns: [t.proposalId, t.findingId] }),
    foreignKey({
      name: "proposal_findings_proposal_fk",
      columns: [t.missionId, t.proposalId],
      foreignColumns: [proposals.missionId, proposals.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "proposal_findings_finding_fk",
      columns: [t.missionId, t.findingId],
      foreignColumns: [findings.missionId, findings.id],
    }).onDelete("restrict"),
    index("proposal_findings_proposal_ix").on(t.missionId, t.proposalId),
    index("proposal_findings_finding_ix").on(t.missionId, t.findingId),
  ],
);

/** `proposals` (Judgment): A decision waiting on you, with its options; it expires after 7 days. */
export const proposals = pgTable(
  "proposals",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    missionId: uuid("mission_id").notNull(),
    moduleRunId: uuid("module_run_id"),
    dispatchId: uuid("dispatch_id"),
    kind: text("kind").notNull(),
    subjectKey: text("subject_key").notNull().default(""),
    version: integer("version").notNull().default(1),
    reason: text("reason").notNull(),
    options: jsonb("options").notNull(),
    state: text("state").notNull().default("open"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    choice: text("choice"),
    choiceReason: text("choice_reason"),
    resolvedBy: uuid("resolved_by"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rowVersion: integer("row_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    unique("proposals_mission_id_id_uq").on(t.missionId, t.id),
    uniqueIndex("proposals_open_module_uq")
      .on(t.moduleRunId, t.kind, t.subjectKey)
      .where(sql`((state = 'open'::text) AND (module_run_id IS NOT NULL))`),
    uniqueIndex("proposals_open_mission_uq")
      .on(t.missionId, t.kind, t.subjectKey)
      .where(sql`((state = 'open'::text) AND (module_run_id IS NULL))`),
    foreignKey({
      name: "proposals_mission_id_missions_id_fk",
      columns: [t.missionId],
      foreignColumns: [missions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "proposals_resolved_by_users_id_fk",
      columns: [t.resolvedBy],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "proposals_module_run_fk",
      columns: [t.missionId, t.moduleRunId],
      foreignColumns: [moduleRuns.missionId, moduleRuns.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "proposals_dispatch_fk",
      columns: [t.missionId, t.dispatchId],
      foreignColumns: [dispatches.missionId, dispatches.id],
    }).onDelete("restrict"),
    check("proposals_kind_ck", oneOf(t.kind, ProposalKind)),
    check("proposals_state_ck", oneOf(t.state, ProposalState)),
    check("proposals_version_ck", sql`(version >= 1)`),
    check(
      "proposals_resolved_ck",
      sql`((state = 'resolved'::text) = ((choice IS NOT NULL) AND (choice_reason IS NOT NULL) AND (resolved_by IS NOT NULL) AND (resolved_at IS NOT NULL)))`,
    ),
    index("proposals_module_run_ix").on(t.missionId, t.moduleRunId),
    index("proposals_dispatch_ix").on(t.missionId, t.dispatchId),
    index("proposals_resolved_by_ix").on(t.resolvedBy),
    index("proposals_pending_ix").on(t.missionId).where(sql`(state = 'open'::text)`),
    index("proposals_expiring_ix").on(t.expiresAt).where(sql`(state = 'open'::text)`),
  ],
);

/** `task_docs` (Execution): A versioned task doc for a dispatch; a re-render adds a version and never overwrites. */
export const taskDocs = pgTable(
  "task_docs",
  {
    dispatchId: uuid("dispatch_id").notNull(),
    version: integer("version").notNull(),
    missionId: uuid("mission_id").notNull(),
    planId: uuid("plan_id").notNull(),
    body: text("body").notNull(),
    hash: text("hash").notNull(),
    renderedAt: timestamp("rendered_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t): PgTableExtraConfigValue[] => [
    primaryKey({ name: "task_docs_pkey", columns: [t.dispatchId, t.version] }),
    foreignKey({
      name: "task_docs_dispatch_fk",
      columns: [t.missionId, t.dispatchId],
      foreignColumns: [dispatches.missionId, dispatches.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "task_docs_plan_fk",
      columns: [t.missionId, t.planId],
      foreignColumns: [plans.missionId, plans.id],
    }).onDelete("restrict"),
    check("task_docs_version_ck", sql`(version >= 1)`),
    index("task_docs_dispatch_ix").on(t.missionId, t.dispatchId),
    index("task_docs_plan_ix").on(t.missionId, t.planId),
  ],
);
