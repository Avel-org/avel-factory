/**
 * Every value list, defined once (contract.md section 1, E1; section 3; Appendix A).
 *
 * The base is the map's 99 value-list CHECKs (`AVEL Database Map.html`, quoted in
 * contract.md Appendix A). Section 3's changes are applied on top, and each change
 * is marked with its source where it lands. `packages/db` imports these lists and
 * never writes one out (done-when 6).
 *
 * Naming (contract.md section 3): the names in section 3's table where one is given;
 * otherwise the singular table name plus the column, for example `AttemptOutcome`.
 *
 * No two lists here have the same set of values (D18). `valueLists` below holds
 * them all, and `checkedColumns` maps each CHECKed column to its list.
 */

// ---------------------------------------------------------------- section 3's named lists

/** `missions.state`, `mission_pauses.interrupted_state` (B1). */
export const MissionState = [
  "draft",
  "onboarding",
  "approved",
  "rendered",
  "running",
  "reviewing",
  "deciding",
  "awaiting_release",
  "refreshing",
  "delivering",
  "delivered",
  "closed",
  "cancelled",
] as const;
export type MissionState = (typeof MissionState)[number];

/** `dispatches.state`, `dispatches.parked_from` (never `parked`: `dispatches_parked_ck`; D8). */
export const DispatchState = [
  "pending",
  "ready",
  "starting",
  "running",
  "reporting",
  "waiting_dependency",
  "blocked_on_you",
  "succeeded",
  "failed",
  "parked",
  "cancelled",
] as const;
export type DispatchState = (typeof DispatchState)[number];

/** `module_runs.state`, `module_runs.parked_from`. */
export const ModuleRunState = [
  "blocked",
  "tests_writing",
  "tests_locked",
  "building",
  "in_review",
  "fixing",
  "integrating",
  "landed",
  "retrying",
  "reworking",
  "parked",
] as const;
export type ModuleRunState = (typeof ModuleRunState)[number];

/**
 * `dispatches.role`, `eval_tasks.role` (Canon). The map's six, plus `ui-contract`,
 * `review-frontend`, `review-a11y-perf`, `api-contract`, `review-backend` (CR-7, CR-8).
 */
export const DispatchRole = [
  "build",
  "test-unit",
  "test-e2e",
  "review-spec",
  "review-security",
  "red-team",
  // CR-7, CR-8
  "ui-contract",
  "review-frontend",
  "review-a11y-perf",
  "api-contract",
  "review-backend",
] as const;
export type DispatchRole = (typeof DispatchRole)[number];

/** `onboarding_sessions.package_provisional`, `package_final` (Canon; D7: no CHECK on `packages.key`). */
export const Package = [
  "diagnostic",
  "landing_page",
  "stabilize",
  "feature",
  "upkeep",
  "custom",
] as const;
export type Package = (typeof Package)[number];

/** `topic_coverage.topic` (Canon, Build spec). */
export const Topic = [
  "problem",
  "outcome",
  "scope",
  "deadline",
  "core_flows",
  "data_integrations",
  "quality_targets",
  "edge_cases",
  "existing_assets",
  "acceptance",
] as const;
export type Topic = (typeof Topic)[number];

/** `facts.kind`: `Topic` plus the rest, as Canon defines it. */
export const FactKind = [
  ...Topic,
  "nogo",
  "risk",
  "module",
  "requirement",
  "scenario",
  "work_kind",
  "package",
  "territory",
  "constraint",
  "context_ref",
  "trace",
] as const;
export type FactKind = (typeof FactKind)[number];

/** `onboarding_sessions.stage`, `questions.stage` (Canon). */
export const Stage = [
  "opener",
  "discovery",
  "breakdown",
  "mission_roster",
  "context",
  "finalize",
  "finalized",
] as const;
export type Stage = (typeof Stage)[number];

/** `checkpoints.checkpoint` (Canon). */
export const Checkpoint = ["0.1", "0.2", "0.3", "0.4", "0.1+0.2"] as const;
export type Checkpoint = (typeof Checkpoint)[number];

/** `plan_modules.work_kind` (Canon), plus `frontend-components`, `frontend-data` (CR-7). */
export const WorkKind = [
  "data",
  "infra",
  "design-system",
  "frontend",
  "api",
  "services",
  "ai",
  "maintenance",
  "docs",
  "audit",
  // CR-7
  "frontend-components",
  "frontend-data",
] as const;
export type WorkKind = (typeof WorkKind)[number];

/** `requirements.ears_pattern` (Canon). */
export const EarsPattern = [
  "ubiquitous",
  "event",
  "state",
  "optional",
  "unwanted",
  "complex",
] as const;
export type EarsPattern = (typeof EarsPattern)[number];

/** `scenarios.level` (Canon), plus `load` (CR-9). */
export const Level = [
  "unit",
  "integration",
  "e2e",
  // CR-9
  "load",
] as const;
export type Level = (typeof Level)[number];

/** `eval_runs.set`, `eval_tasks.set` (D18). */
export const EvalSet = ["dispatch", "role", "mission"] as const;
export type EvalSet = (typeof EvalSet)[number];

/** `kb_entries.layer`, `rules.scope` (D18). */
export const LibraryLayer = ["global", "stack", "client"] as const;
export type LibraryLayer = (typeof LibraryLayer)[number];

/**
 * `packages.status`, `rules.status`, `skills.status`, `templates.status`, and the new
 * `design_systems.status` (B9) (D18).
 */
export const IndexStatus = ["active", "retired"] as const;
export type IndexStatus = (typeof IndexStatus)[number];

/** `clients.status`, `notes.state` (D18). */
export const ArchiveStatus = ["active", "archived"] as const;
export type ArchiveStatus = (typeof ArchiveStatus)[number];

/** New: `clients.kind`, `missions.client_kind` (CR-13). */
export const ClientKind = ["client", "internal"] as const;
export type ClientKind = (typeof ClientKind)[number];

/** New: `missions.kind` (CR-13; B2). */
export const ProjectKind = ["client", "internal", "template"] as const;
export type ProjectKind = (typeof ProjectKind)[number];

/** New: `design_systems.layer` (B9, INT). Not `LibraryLayer`: it has no `stack`. */
export const DesignSystemLayer = ["global", "client"] as const;
export type DesignSystemLayer = (typeof DesignSystemLayer)[number];

// ---------------------------------------------------------------- the rest, by table and column

/** `activity_log.actor_kind`. */
export const ActivityLogActorKind = ["user", "agent", "system"] as const;
export type ActivityLogActorKind = (typeof ActivityLogActorKind)[number];

/** `agent_traces.kind`. */
export const AgentTraceKind = [
  "message",
  "tool_call",
  "tool_result",
  "check",
  "delta",
  "search",
] as const;
export type AgentTraceKind = (typeof AgentTraceKind)[number];

/** `attempts.kind`. */
export const AttemptKind = [
  "initial",
  "retry_1",
  "retry_2",
  "retry_3",
  "fix",
  "rework",
  "resume",
  "infra_restart",
] as const;
export type AttemptKind = (typeof AttemptKind)[number];

/** `attempts.compute`. */
export const AttemptCompute = ["docker", "boat", "miosa"] as const;
export type AttemptCompute = (typeof AttemptCompute)[number];

/** `attempts.outcome` (optional). */
export const AttemptOutcome = [
  "passed",
  "failed",
  "capped",
  "budget_parked",
  "killed",
  "crashed",
  "infra_lost",
] as const;
export type AttemptOutcome = (typeof AttemptOutcome)[number];

/** `budget_reservations.kind`. */
export const BudgetReservationKind = ["expected", "request"] as const;
export type BudgetReservationKind = (typeof BudgetReservationKind)[number];

/** `budget_reservations.state`. */
export const BudgetReservationState = ["held", "settled", "released"] as const;
export type BudgetReservationState = (typeof BudgetReservationState)[number];

/** `check_results.result`. */
export const CheckResultResult = ["passed", "failed", "skipped", "quarantined"] as const;
export type CheckResultResult = (typeof CheckResultResult)[number];

/** `checkpoints.state`. */
export const CheckpointState = ["draft", "approved", "stale"] as const;
export type CheckpointState = (typeof CheckpointState)[number];

/** `checks.kind`. */
export const CheckKind = ["file_exists", "test", "typecheck", "command", "e2e"] as const;
export type CheckKind = (typeof CheckKind)[number];

/** `closeout_items.kind`. */
export const CloseoutItemKind = ["finding", "lesson_candidate"] as const;
export type CloseoutItemKind = (typeof CloseoutItemKind)[number];

/** `closeout_items.state`. */
export const CloseoutItemState = ["open", "written", "dismissed"] as const;
export type CloseoutItemState = (typeof CloseoutItemState)[number];

/** `codebase_analysis.standing_context`. */
export const CodebaseAnalysisStandingContext = ["found", "generated"] as const;
export type CodebaseAnalysisStandingContext = (typeof CodebaseAnalysisStandingContext)[number];

/** `completion_reports.status` (unchanged; the map, B4). */
export const CompletionReportStatus = ["done", "partial", "blocked"] as const;
export type CompletionReportStatus = (typeof CompletionReportStatus)[number];

/** `context_refs.kind`. */
export const ContextRefKind = ["doc", "design", "repo_path", "fixture", "secret_name"] as const;
export type ContextRefKind = (typeof ContextRefKind)[number];

/** `credentials.kind`. */
export const CredentialKind = ["dispatch", "git", "proxy", "service"] as const;
export type CredentialKind = (typeof CredentialKind)[number];

/** `deliveries.kind`. */
export const DeliveryKind = ["zip", "pr", "push"] as const;
export type DeliveryKind = (typeof DeliveryKind)[number];

/** `deliveries.state`. */
export const DeliveryState = ["pending", "recorded", "failed"] as const;
export type DeliveryState = (typeof DeliveryState)[number];

/** `dependency_requests.state`. */
export const DependencyRequestState = ["open", "approved", "rejected", "expired"] as const;
export type DependencyRequestState = (typeof DependencyRequestState)[number];

/** `device_logins.state`. */
export const DeviceLoginState = ["pending", "approved", "denied", "expired", "consumed"] as const;
export type DeviceLoginState = (typeof DeviceLoginState)[number];

/** `dispatches.origin`. */
export const DispatchOrigin = ["factory", "override"] as const;
export type DispatchOrigin = (typeof DispatchOrigin)[number];

/** `eval_runs.stage`. */
export const EvalRunStage = ["targeted", "full"] as const;
export type EvalRunStage = (typeof EvalRunStage)[number];

/** `eval_runs.aim`. */
export const EvalRunAim = ["improve", "non_inferior"] as const;
export type EvalRunAim = (typeof EvalRunAim)[number];

/** `eval_runs.state`. */
export const EvalRunState = ["proposed", "running", "done", "failed", "cancelled"] as const;
export type EvalRunState = (typeof EvalRunState)[number];

/** `eval_tasks.source`. */
export const EvalTaskSource = ["synthetic", "internal", "replay"] as const;
export type EvalTaskSource = (typeof EvalTaskSource)[number];

/** `facts.source`. */
export const FactSource = ["said", "relayed", "uploaded", "repo", "inferred"] as const;
export type FactSource = (typeof FactSource)[number];

/** `facts.status`. */
export const FactStatus = ["confirmed", "proposed", "rejected"] as const;
export type FactStatus = (typeof FactStatus)[number];

/** `findings.source`. */
export const FindingSource = ["checkpoint", "review", "gate"] as const;
export type FindingSource = (typeof FindingSource)[number];

/** `findings.kind`. */
export const FindingKind = ["requirement", "security", "scope", "integrity", "advisory"] as const;
export type FindingKind = (typeof FindingKind)[number];

/** `findings.route`. */
export const FindingRoute = ["rework", "proposal", "receipt"] as const;
export type FindingRoute = (typeof FindingRoute)[number];

/** `findings.state`. */
export const FindingState = [
  "open",
  "triage",
  "confirmed",
  "disputed",
  "dismissed",
  "fixed",
  "accepted",
] as const;
export type FindingState = (typeof FindingState)[number];

/** `findings.decided_by_kind` (optional). */
export const FindingDecidedByKind = ["user", "agent", "check"] as const;
export type FindingDecidedByKind = (typeof FindingDecidedByKind)[number];

/** `gate_evaluations.result`. */
export const GateEvaluationResult = ["passed", "failed", "error"] as const;
export type GateEvaluationResult = (typeof GateEvaluationResult)[number];

/** `gate_runs.state`. */
export const GateRunState = ["running", "decided", "failed"] as const;
export type GateRunState = (typeof GateRunState)[number];

/** `gate_runs.trigger`. */
export const GateRunTrigger = ["auto", "override", "refresh"] as const;
export type GateRunTrigger = (typeof GateRunTrigger)[number];

/** `human_time.activity`. */
export const HumanTimeActivity = [
  "onboarding",
  "approval",
  "review",
  "fix",
  "call",
  "override",
] as const;
export type HumanTimeActivity = (typeof HumanTimeActivity)[number];

/** `human_time.source`. */
export const HumanTimeSource = ["auto", "manual"] as const;
export type HumanTimeSource = (typeof HumanTimeSource)[number];

/** `human_time.state`. */
export const HumanTimeState = ["running", "draft", "confirmed", "discarded"] as const;
export type HumanTimeState = (typeof HumanTimeState)[number];

/** `idempotency_keys.status`. */
export const IdempotencyKeyStatus = ["in_progress", "completed"] as const;
export type IdempotencyKeyStatus = (typeof IdempotencyKeyStatus)[number];

/**
 * `integration_commits.kind`: the map's four, plus `ui_contract`, `api_contract`
 * (CR-7, CR-8; B3) and `dispatch_docs` (CR-16).
 */
export const IntegrationCommitKind = [
  "tests",
  "module",
  "dependency",
  "operator",
  // CR-7, CR-8 (B3)
  "ui_contract",
  "api_contract",
  // CR-16
  "dispatch_docs",
] as const;
export type IntegrationCommitKind = (typeof IntegrationCommitKind)[number];

/** `integration_commits.state`. */
export const IntegrationCommitState = ["queued", "testing", "landed", "rejected"] as const;
export type IntegrationCommitState = (typeof IntegrationCommitState)[number];

/** `jobs.state`: the map's `leased` is `claimed` (CR-6). */
export const JobState = ["queued", "claimed", "done", "failed", "dead"] as const;
export type JobState = (typeof JobState)[number];

/** `kb_entries.status`. */
export const KbEntryStatus = ["proposed", "approved", "retired"] as const;
export type KbEntryStatus = (typeof KbEntryStatus)[number];

/** `messages.role`. */
export const MessageRole = ["opener", "canon", "operator"] as const;
export type MessageRole = (typeof MessageRole)[number];

/** `mission_pauses.kind`. */
export const MissionPauseKind = ["operator", "proposal", "budget"] as const;
export type MissionPauseKind = (typeof MissionPauseKind)[number];

/** `mission_refreshes.state`. */
export const MissionRefreshState = ["running", "done", "conflict", "failed"] as const;
export type MissionRefreshState = (typeof MissionRefreshState)[number];

/** `notes.source`. */
export const NoteSource = ["web", "cli"] as const;
export type NoteSource = (typeof NoteSource)[number];

/** `onboarding_sessions.status`. */
export const OnboardingSessionStatus = [
  "active",
  "paused",
  "context_blocked",
  "finalized",
  "abandoned",
] as const;
export type OnboardingSessionStatus = (typeof OnboardingSessionStatus)[number];

/** `overrides.kind`. */
export const OverrideKind = ["gate", "dispatch"] as const;
export type OverrideKind = (typeof OverrideKind)[number];

/** `overrides.action` (optional). */
export const OverrideAction = ["start", "retry", "park", "cancel"] as const;
export type OverrideAction = (typeof OverrideAction)[number];

/** `plan_modules.est_source`. */
export const PlanModuleEstSource = ["canon", "calibrated"] as const;
export type PlanModuleEstSource = (typeof PlanModuleEstSource)[number];

/** `plan_modules.asvs_level` (optional). */
export const PlanModuleAsvsLevel = ["L1", "L2", "L3"] as const;
export type PlanModuleAsvsLevel = (typeof PlanModuleAsvsLevel)[number];

/** `plan_modules.data_classification` (optional). */
export const PlanModuleDataClassification = ["public", "internal", "personal", "payment"] as const;
export type PlanModuleDataClassification = (typeof PlanModuleDataClassification)[number];

/** `plans.source`. */
export const PlanSource = ["onboarding", "proposal"] as const;
export type PlanSource = (typeof PlanSource)[number];

/** `plans.state`. */
export const PlanState = ["draft", "approved", "superseded"] as const;
export type PlanState = (typeof PlanState)[number];

/** `proposals.kind`. */
export const ProposalKind = [
  "parked",
  "converge",
  "contract_change",
  "dependency",
  "quarantine",
  "budget_increase",
  "reentry",
  "dispute",
  "gate5",
  "suppression",
  "test_change",
  "review_limit",
  "repin",
] as const;
export type ProposalKind = (typeof ProposalKind)[number];

/** `proposals.state`. */
export const ProposalState = ["open", "resolved", "expired"] as const;
export type ProposalState = (typeof ProposalState)[number];

/** `receipts.verdict`. */
export const ReceiptVerdict = ["verified", "pass", "fail"] as const;
export type ReceiptVerdict = (typeof ReceiptVerdict)[number];

/** `repo_connections.state`. */
export const RepoConnectionState = ["active", "revoked"] as const;
export type RepoConnectionState = (typeof RepoConnectionState)[number];

/** `rooms.kind`. */
export const RoomKind = ["dispatch", "check", "integration", "image_build"] as const;
export type RoomKind = (typeof RoomKind)[number];

/** `rooms.state`. */
export const RoomState = ["creating", "ready", "busy", "destroyed"] as const;
export type RoomState = (typeof RoomState)[number];

/** `rubric_results.result`. */
export const RubricResultResult = ["pass", "fail", "finding", "advisory"] as const;
export type RubricResultResult = (typeof RubricResultResult)[number];

/** `scenarios.kind`. */
export const ScenarioKind = ["happy", "failure", "pinning", "smoke"] as const;
export type ScenarioKind = (typeof ScenarioKind)[number];

/** `secrets.state`. */
export const SecretState = ["active", "destroyed"] as const;
export type SecretState = (typeof SecretState)[number];

/** `skills.author`. */
export const SkillAuthor = ["you", "import"] as const;
export type SkillAuthor = (typeof SkillAuthor)[number];

/** `skills.source`. */
export const SkillSource = ["upload", "written", "import"] as const;
export type SkillSource = (typeof SkillSource)[number];

/** `test_locks.kind`. */
export const TestLockKind = ["fail_first", "pinning"] as const;
export type TestLockKind = (typeof TestLockKind)[number];

/** `topic_coverage.state`. */
export const TopicCoverageState = ["clear", "partial", "missing"] as const;
export type TopicCoverageState = (typeof TopicCoverageState)[number];

/** `uploads.parse_status`. */
export const UploadParseStatus = ["pending", "parsed", "failed", "unsupported"] as const;
export type UploadParseStatus = (typeof UploadParseStatus)[number];

/** `uploads.state`. */
export const UploadState = ["active", "removed"] as const;
export type UploadState = (typeof UploadState)[number];

/** `usage_log.call_kind`. */
export const UsageLogCallKind = [
  "canon",
  "extractor",
  "breakdown",
  "brennan",
  "checkpoint_doc",
] as const;
export type UsageLogCallKind = (typeof UsageLogCallKind)[number];

// ---------------------------------------------------------------- registries

/** Every value list the schema checks, by its exported name. */
export const valueLists = {
  ActivityLogActorKind,
  AgentTraceKind,
  ArchiveStatus,
  AttemptCompute,
  AttemptKind,
  AttemptOutcome,
  BudgetReservationKind,
  BudgetReservationState,
  CheckKind,
  CheckResultResult,
  Checkpoint,
  CheckpointState,
  ClientKind,
  CloseoutItemKind,
  CloseoutItemState,
  CodebaseAnalysisStandingContext,
  CompletionReportStatus,
  ContextRefKind,
  CredentialKind,
  DeliveryKind,
  DeliveryState,
  DependencyRequestState,
  DesignSystemLayer,
  DeviceLoginState,
  DispatchOrigin,
  DispatchRole,
  DispatchState,
  EarsPattern,
  EvalRunAim,
  EvalRunStage,
  EvalRunState,
  EvalSet,
  EvalTaskSource,
  FactKind,
  FactSource,
  FactStatus,
  FindingDecidedByKind,
  FindingKind,
  FindingRoute,
  FindingSource,
  FindingState,
  GateEvaluationResult,
  GateRunState,
  GateRunTrigger,
  HumanTimeActivity,
  HumanTimeSource,
  HumanTimeState,
  IdempotencyKeyStatus,
  IndexStatus,
  IntegrationCommitKind,
  IntegrationCommitState,
  JobState,
  KbEntryStatus,
  Level,
  LibraryLayer,
  MessageRole,
  MissionPauseKind,
  MissionRefreshState,
  MissionState,
  ModuleRunState,
  NoteSource,
  OnboardingSessionStatus,
  OverrideAction,
  OverrideKind,
  Package,
  PlanModuleAsvsLevel,
  PlanModuleDataClassification,
  PlanModuleEstSource,
  PlanSource,
  PlanState,
  ProjectKind,
  ProposalKind,
  ProposalState,
  ReceiptVerdict,
  RepoConnectionState,
  RoomKind,
  RoomState,
  RubricResultResult,
  ScenarioKind,
  SecretState,
  SkillAuthor,
  SkillSource,
  Stage,
  TestLockKind,
  Topic,
  TopicCoverageState,
  UploadParseStatus,
  UploadState,
  UsageLogCallKind,
  WorkKind,
} as const;
export type ValueListName = keyof typeof valueLists;

/**
 * Each CHECKed column (`table.column`) and the list its CHECK uses: the map's 99
 * (Appendix A, in its order) with section 3's changes, then the five new columns
 * from CR-13 and B9. `packages/db` builds each value-list CHECK from this.
 */
export const checkedColumns = {
  "activity_log.actor_kind": "ActivityLogActorKind",
  "agent_traces.kind": "AgentTraceKind",
  "attempts.kind": "AttemptKind",
  "attempts.compute": "AttemptCompute",
  "attempts.outcome": "AttemptOutcome",
  "budget_reservations.kind": "BudgetReservationKind",
  "budget_reservations.state": "BudgetReservationState",
  "check_results.result": "CheckResultResult",
  "checkpoints.checkpoint": "Checkpoint",
  "checkpoints.state": "CheckpointState",
  "checks.kind": "CheckKind",
  "clients.status": "ArchiveStatus",
  "closeout_items.kind": "CloseoutItemKind",
  "closeout_items.state": "CloseoutItemState",
  "codebase_analysis.standing_context": "CodebaseAnalysisStandingContext",
  "completion_reports.status": "CompletionReportStatus",
  "context_refs.kind": "ContextRefKind",
  "credentials.kind": "CredentialKind",
  "deliveries.kind": "DeliveryKind",
  "deliveries.state": "DeliveryState",
  "dependency_requests.state": "DependencyRequestState",
  "device_logins.state": "DeviceLoginState",
  "dispatches.role": "DispatchRole",
  "dispatches.state": "DispatchState",
  "dispatches.parked_from": "DispatchState",
  "dispatches.origin": "DispatchOrigin",
  "eval_runs.stage": "EvalRunStage",
  "eval_runs.aim": "EvalRunAim",
  "eval_runs.set": "EvalSet",
  "eval_runs.state": "EvalRunState",
  "eval_tasks.set": "EvalSet",
  "eval_tasks.role": "DispatchRole",
  "eval_tasks.source": "EvalTaskSource",
  "facts.kind": "FactKind",
  "facts.source": "FactSource",
  "facts.status": "FactStatus",
  "findings.source": "FindingSource",
  "findings.kind": "FindingKind",
  "findings.route": "FindingRoute",
  "findings.state": "FindingState",
  "findings.decided_by_kind": "FindingDecidedByKind",
  "gate_evaluations.result": "GateEvaluationResult",
  "gate_runs.state": "GateRunState",
  "gate_runs.trigger": "GateRunTrigger",
  "human_time.activity": "HumanTimeActivity",
  "human_time.source": "HumanTimeSource",
  "human_time.state": "HumanTimeState",
  "idempotency_keys.status": "IdempotencyKeyStatus",
  "integration_commits.kind": "IntegrationCommitKind",
  "integration_commits.state": "IntegrationCommitState",
  "jobs.state": "JobState",
  "kb_entries.layer": "LibraryLayer",
  "kb_entries.status": "KbEntryStatus",
  "messages.role": "MessageRole",
  "mission_pauses.kind": "MissionPauseKind",
  "mission_pauses.interrupted_state": "MissionState",
  "mission_refreshes.state": "MissionRefreshState",
  "missions.state": "MissionState",
  "module_runs.state": "ModuleRunState",
  "module_runs.parked_from": "ModuleRunState",
  "notes.source": "NoteSource",
  "notes.state": "ArchiveStatus",
  "onboarding_sessions.stage": "Stage",
  "onboarding_sessions.status": "OnboardingSessionStatus",
  "onboarding_sessions.package_provisional": "Package",
  "onboarding_sessions.package_final": "Package",
  "overrides.kind": "OverrideKind",
  "overrides.action": "OverrideAction",
  "packages.status": "IndexStatus",
  "plan_modules.est_source": "PlanModuleEstSource",
  "plan_modules.work_kind": "WorkKind",
  "plan_modules.asvs_level": "PlanModuleAsvsLevel",
  "plan_modules.data_classification": "PlanModuleDataClassification",
  "plans.source": "PlanSource",
  "plans.state": "PlanState",
  "proposals.kind": "ProposalKind",
  "proposals.state": "ProposalState",
  "questions.stage": "Stage",
  "receipts.verdict": "ReceiptVerdict",
  "repo_connections.state": "RepoConnectionState",
  "requirements.ears_pattern": "EarsPattern",
  "rooms.kind": "RoomKind",
  "rooms.state": "RoomState",
  "rubric_results.result": "RubricResultResult",
  "rules.scope": "LibraryLayer",
  "rules.status": "IndexStatus",
  "scenarios.level": "Level",
  "scenarios.kind": "ScenarioKind",
  "secrets.state": "SecretState",
  "skills.author": "SkillAuthor",
  "skills.source": "SkillSource",
  "skills.status": "IndexStatus",
  "templates.status": "IndexStatus",
  "test_locks.kind": "TestLockKind",
  "topic_coverage.topic": "Topic",
  "topic_coverage.state": "TopicCoverageState",
  "uploads.parse_status": "UploadParseStatus",
  "uploads.state": "UploadState",
  "usage_log.call_kind": "UsageLogCallKind",
  // New columns (contract.md section 3, "Changes applied on top of the map")
  "clients.kind": "ClientKind",
  "missions.kind": "ProjectKind",
  "missions.client_kind": "ClientKind",
  "design_systems.layer": "DesignSystemLayer",
  "design_systems.status": "IndexStatus",
} as const satisfies Record<string, ValueListName>;
export type CheckedColumn = keyof typeof checkedColumns;

// ---------------------------------------------------------------- lists no CHECK backs

/**
 * `MissionDto.displayState`: `state`, or the hold an open `mission_pauses` row shows
 * (contract.md section 4, item 6; Q8; O2; D16). Computed by the server, never stored.
 */
export const MissionDisplayState = [...MissionState, "paused", "blocked_on_you"] as const;
export type MissionDisplayState = (typeof MissionDisplayState)[number];

/** `DispatchPackageDto.files[].kind`, quoted from the CR-16 contract. */
export const DispatchPackageFileKind = [
  "codebase_analysis",
  "dispatch_md",
  "task_doc",
  "prompts_archive",
  "completion_report",
] as const;
export type DispatchPackageFileKind = (typeof DispatchPackageFileKind)[number];

/**
 * A task's status inside a completion report's body (E6). Its values differ from
 * `CompletionReportStatus` (`partial` there, `parked` here), so it isn't a repeat.
 */
export const CompletionTaskStatus = ["done", "parked", "blocked"] as const;
export type CompletionTaskStatus = (typeof CompletionTaskStatus)[number];

/** The lists the contract exports that no schema CHECK uses. */
export const contractOnlyLists = {
  CompletionTaskStatus,
  DispatchPackageFileKind,
  MissionDisplayState,
} as const;
