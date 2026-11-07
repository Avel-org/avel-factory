// The table-owner map (D9; contract.md section 6, "One owner per table"; build plan section 4 and
// CR-15 item 2). Each table has exactly one owning module; the type below makes a missing table
// or a table that does not exist a compile error.
//
// The exceptions (DATABASE.md, Ownership): `missions.branch_head` is written by `integrator`,
// and `missions.reserved_micros` and `spent_micros` by `metering`.
import type { Module } from "@avel/contract";
import type { Table } from "drizzle-orm";
import * as schema from "./schema/index.js";

/** Every table object in the schema, by its TypeScript name. */
export const tables = schema;

type SchemaTable = Extract<(typeof schema)[keyof typeof schema], Table>;
/** Every table name in the schema, as Postgres knows it. */
export type TableName = SchemaTable["_"]["name"];

/** The module that owns each table. The ones marked proposed are new in the map (CR-19 asks for them). */
export const tableOwners = {
  activity_log: "audit",
  agent_configs: "evals",
  agent_traces: "events",
  attempts: "runner",
  auth_accounts: "platform",
  auth_passkeys: "platform",
  auth_sessions: "platform",
  auth_verifications: "platform",
  budget_reservations: "metering",
  check_results: "gate", // proposed
  checkpoint_facts: "onboarding",
  checkpoints: "onboarding",
  checks: "plan",
  cli_sessions: "platform",
  clients: "onboarding",
  closeout_items: "knowledge",
  codebase_analysis: "plan",
  completion_reports: "runner",
  consumer_cursors: "events",
  context_refs: "onboarding",
  credentials: "compute",
  deliveries: "delivery",
  dependency_requests: "integrator",
  design_systems: "knowledge", // proposed
  device_logins: "cli",
  dispatches: "factory",
  eval_results: "evals",
  eval_runs: "evals",
  eval_tasks: "evals",
  events: "events",
  factory_versions: "knowledge",
  facts: "onboarding",
  findings: "factory",
  gate_evaluations: "gate",
  gate_runs: "gate",
  human_time: "metering",
  idempotency_keys: "platform",
  integration_commits: "integrator",
  jobs: "platform",
  kb_entries: "knowledge",
  kb_release_entries: "knowledge",
  kb_releases: "knowledge",
  locked_scripts: "integrator",
  messages: "onboarding",
  mission_docs: "factory",
  mission_pauses: "factory", // proposed
  mission_refreshes: "factory", // proposed
  mission_scenarios: "plan", // proposed
  missions: "factory",
  module_checks: "plan",
  module_runs: "factory",
  notes: "factory",
  onboarding_sessions: "onboarding",
  overrides: "audit",
  packages: "packages",
  pass_approvals: "gate",
  payments: "metering",
  plan_module_deps: "plan",
  plan_modules: "plan",
  plans: "plan",
  price_table: "metering",
  progress_notes: "runner", // proposed
  proposal_findings: "factory", // proposed
  proposals: "factory",
  quality_targets: "plan",
  quarantines: "integrator",
  questions: "onboarding",
  readiness_waivers: "onboarding", // proposed
  receipts: "gate",
  redactions: "audit", // proposed
  release_approvals: "gate", // proposed
  repo_connections: "delivery",
  requirements: "plan",
  rooms: "compute",
  rubric_results: "onboarding",
  rules: "rules",
  rules_version_rules: "rules",
  rules_versions: "rules",
  scenario_modules: "plan",
  scenarios: "plan",
  secrets: "delivery",
  skill_loads: "runner",
  skills: "knowledge",
  step_up_grants: "platform",
  task_docs: "factory",
  templates: "knowledge",
  test_locks: "integrator",
  topic_coverage: "onboarding",
  uploads: "onboarding",
  usage_log: "onboarding",
  users: "platform",
  webhook_deliveries: "platform",
} as const satisfies Record<TableName, Module>;
