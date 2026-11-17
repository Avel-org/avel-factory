CREATE TABLE "auth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_passkeys" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"aaguid" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_verifications" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cli_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_sha256" text NOT NULL,
	"label" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cli_sessions_token_sha256_uq" UNIQUE("token_sha256")
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"principal" text NOT NULL,
	"key" text NOT NULL,
	"route" text NOT NULL,
	"body_sha256" text NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"http_status" integer,
	"response" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY("principal","key"),
	CONSTRAINT "idempotency_keys_status_ck" CHECK ("status" IN ('in_progress', 'completed'))
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"kind" text NOT NULL,
	"key" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"state" text DEFAULT 'queued' NOT NULL,
	"claim_expires_at" timestamp with time zone,
	"claimed_by" text,
	"claim_no" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"run_after" timestamp with time zone DEFAULT now() NOT NULL,
	"last_error" text,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_state_ck" CHECK ("state" IN ('queued', 'claimed', 'done', 'failed', 'dead')),
	CONSTRAINT "jobs_claim_ck" CHECK ((((claim_expires_at IS NOT NULL) = (state = 'claimed'::text)) AND ((claimed_by IS NOT NULL) = (state = 'claimed'::text)))),
	CONSTRAINT "jobs_finished_ck" CHECK (((state <> ALL (ARRAY['done'::text, 'dead'::text])) OR (finished_at IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "step_up_grants" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"delivery_id" text PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_traces" (
	"trace_seq" bigserial NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"attempt_id" uuid,
	"session_id" uuid,
	"kind" text NOT NULL,
	"body" jsonb NOT NULL,
	CONSTRAINT "agent_traces_pkey" PRIMARY KEY("trace_seq","at"),
	CONSTRAINT "agent_traces_kind_ck" CHECK ("kind" IN ('message', 'tool_call', 'tool_result', 'check', 'delta', 'search')),
	CONSTRAINT "agent_traces_parent_ck" CHECK ((num_nonnulls(attempt_id, session_id) = 1))
) PARTITION BY RANGE ("at");
--> statement-breakpoint
CREATE TABLE "consumer_cursors" (
	"consumer" text PRIMARY KEY NOT NULL,
	"last_seq" bigint DEFAULT 0 NOT NULL,
	"claim_no" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"seq" bigserial PRIMARY KEY NOT NULL,
	"schema_version" integer NOT NULL,
	"mission_id" uuid,
	"dispatch_id" uuid,
	"attempt_id" uuid,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"actor_kind" text NOT NULL,
	"user_id" uuid,
	"credential_id" uuid,
	"action" text NOT NULL,
	"target" text NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_log_actor_kind_ck" CHECK ("actor_kind" IN ('user', 'agent', 'system'))
);
--> statement-breakpoint
CREATE TABLE "overrides" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"gate" smallint,
	"gate_evaluation_id" uuid,
	"dispatch_id" uuid,
	"action" text,
	"check_id" text,
	"commit_sha" text,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "overrides_kind_ck" CHECK ("kind" IN ('gate', 'dispatch')),
	CONSTRAINT "overrides_action_ck" CHECK (("action" IS NULL) OR ("action" IN ('start', 'retry', 'park', 'cancel'))),
	CONSTRAINT "overrides_by_kind_ck" CHECK (
CASE kind
    WHEN 'gate'::text THEN ((gate_evaluation_id IS NOT NULL) AND (commit_sha IS NOT NULL) AND (gate = ANY (ARRAY[3, 4])) AND (dispatch_id IS NULL) AND (action IS NULL))
    WHEN 'dispatch'::text THEN ((dispatch_id IS NOT NULL) AND (action IS NOT NULL) AND (gate IS NULL) AND (gate_evaluation_id IS NULL) AND (commit_sha IS NULL))
    ELSE NULL::boolean
END)
);
--> statement-breakpoint
CREATE TABLE "redactions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"table_name" text NOT NULL,
	"row_id" text NOT NULL,
	"column_name" text NOT NULL,
	"reason" text NOT NULL,
	"user_id" uuid NOT NULL,
	"step_up_grant_id" uuid NOT NULL,
	"redacted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "redactions_step_up_grant_id_uq" UNIQUE("step_up_grant_id")
);
--> statement-breakpoint
CREATE TABLE "device_logins" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"device_code_sha256" text NOT NULL,
	"user_code" text NOT NULL,
	"label" text NOT NULL,
	"state" text DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"cli_session_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "device_logins_device_code_sha256_uq" UNIQUE("device_code_sha256"),
	CONSTRAINT "device_logins_state_ck" CHECK ("state" IN ('pending', 'approved', 'denied', 'expired', 'consumed')),
	CONSTRAINT "device_logins_approved_ck" CHECK (((state <> ALL (ARRAY['approved'::text, 'consumed'::text])) OR ((approved_by IS NOT NULL) AND (approved_at IS NOT NULL)))),
	CONSTRAINT "device_logins_consumed_ck" CHECK (((state <> 'consumed'::text) OR (cli_session_id IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "checkpoint_facts" (
	"checkpoint_id" uuid NOT NULL,
	"fact_id" uuid NOT NULL,
	"mission_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkpoint_facts_pkey" PRIMARY KEY("checkpoint_id","fact_id")
);
--> statement-breakpoint
CREATE TABLE "checkpoints" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"checkpoint" text NOT NULL,
	"version" integer NOT NULL,
	"sections" jsonb NOT NULL,
	"state" text DEFAULT 'draft' NOT NULL,
	"stale_module_labels" text[] DEFAULT '{}'::text[] NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkpoints_session_checkpoint_version_uq" UNIQUE("session_id","checkpoint","version"),
	CONSTRAINT "checkpoints_mission_id_id_uq" UNIQUE("mission_id","id"),
	CONSTRAINT "checkpoints_checkpoint_ck" CHECK ("checkpoint" IN ('0.1', '0.2', '0.3', '0.4', '0.1+0.2')),
	CONSTRAINT "checkpoints_state_ck" CHECK ("state" IN ('draft', 'approved', 'stale')),
	CONSTRAINT "checkpoints_version_ck" CHECK ((version >= 1)),
	CONSTRAINT "checkpoints_approved_ck" CHECK (((state <> 'approved'::text) OR ((approved_at IS NOT NULL) AND (approved_by IS NOT NULL))))
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"contacts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clients_id_kind_uq" UNIQUE("id","kind"),
	CONSTRAINT "clients_status_ck" CHECK ("status" IN ('active', 'archived')),
	CONSTRAINT "clients_archived_at_ck" CHECK (((status = 'archived'::text) = (archived_at IS NOT NULL))),
	CONSTRAINT "clients_kind_ck" CHECK ("kind" IN ('client', 'internal'))
);
--> statement-breakpoint
CREATE TABLE "context_refs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"module_label" text NOT NULL,
	"kind" text NOT NULL,
	"target" text NOT NULL,
	"upload_id" uuid,
	"reason" text NOT NULL,
	"read_order" integer NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "context_refs_kind_ck" CHECK ("kind" IN ('doc', 'design', 'repo_path', 'fixture', 'secret_name'))
);
--> statement-breakpoint
CREATE TABLE "facts" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"value" jsonb NOT NULL,
	"source" text NOT NULL,
	"status" text DEFAULT 'proposed' NOT NULL,
	"message_id" uuid,
	"span_start" integer,
	"span_end" integer,
	"upload_id" uuid,
	"repo_commit" text,
	"repo_path" text,
	"supersedes_fact_id" uuid,
	"scan_flagged" boolean DEFAULT false NOT NULL,
	"redacted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "facts_mission_id_id_uq" UNIQUE("mission_id","id"),
	CONSTRAINT "facts_kind_ck" CHECK ("kind" IN ('problem', 'outcome', 'scope', 'deadline', 'core_flows', 'data_integrations', 'quality_targets', 'edge_cases', 'existing_assets', 'acceptance', 'nogo', 'risk', 'module', 'requirement', 'scenario', 'work_kind', 'package', 'territory', 'constraint', 'context_ref', 'trace')),
	CONSTRAINT "facts_source_ck" CHECK ("source" IN ('said', 'relayed', 'uploaded', 'repo', 'inferred')),
	CONSTRAINT "facts_status_ck" CHECK ("status" IN ('confirmed', 'proposed', 'rejected')),
	CONSTRAINT "facts_source_said_ck" CHECK (((source <> ALL (ARRAY['said'::text, 'relayed'::text])) OR (message_id IS NOT NULL))),
	CONSTRAINT "facts_source_uploaded_ck" CHECK (((source <> 'uploaded'::text) OR (upload_id IS NOT NULL))),
	CONSTRAINT "facts_source_repo_ck" CHECK (((source <> 'repo'::text) OR ((repo_commit IS NOT NULL) AND (repo_path IS NOT NULL)))),
	CONSTRAINT "facts_span_ck" CHECK ((((span_start IS NULL) = (span_end IS NULL)) AND ((span_start IS NULL) OR (message_id IS NOT NULL))))
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"session_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"role" text NOT NULL,
	"text" text NOT NULL,
	"prompt_version" text NOT NULL,
	"tokens_in" integer DEFAULT 0 NOT NULL,
	"tokens_out" integer DEFAULT 0 NOT NULL,
	"cache_write_5m" integer DEFAULT 0 NOT NULL,
	"cache_write_1h" integer DEFAULT 0 NOT NULL,
	"cache_read" integer DEFAULT 0 NOT NULL,
	"redacted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messages_session_id_seq_uq" UNIQUE("session_id","seq"),
	CONSTRAINT "messages_session_id_id_uq" UNIQUE("session_id","id"),
	CONSTRAINT "messages_role_ck" CHECK ("role" IN ('opener', 'canon', 'operator'))
);
--> statement-breakpoint
CREATE TABLE "onboarding_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"stage" text DEFAULT 'opener' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"pause_reason" text,
	"package_provisional" text,
	"package_final" text,
	"prompt_version" text NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finalized_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "onboarding_sessions_mission_id_id_uq" UNIQUE("mission_id","id"),
	CONSTRAINT "onboarding_sessions_stage_ck" CHECK ("stage" IN ('opener', 'discovery', 'breakdown', 'mission_roster', 'context', 'finalize', 'finalized')),
	CONSTRAINT "onboarding_sessions_status_ck" CHECK ("status" IN ('active', 'paused', 'context_blocked', 'finalized', 'abandoned')),
	CONSTRAINT "onboarding_sessions_package_provisional_ck" CHECK (("package_provisional" IS NULL) OR ("package_provisional" IN ('diagnostic', 'landing_page', 'stabilize', 'feature', 'upkeep', 'custom'))),
	CONSTRAINT "onboarding_sessions_package_final_ck" CHECK (("package_final" IS NULL) OR ("package_final" IN ('diagnostic', 'landing_page', 'stabilize', 'feature', 'upkeep', 'custom'))),
	CONSTRAINT "onboarding_sessions_finalized_at_ck" CHECK (((status = 'finalized'::text) = (finalized_at IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"session_id" uuid NOT NULL,
	"stage" text NOT NULL,
	"text" text NOT NULL,
	"options" jsonb,
	"recommended" text,
	"answer" text,
	"answered_at" timestamp with time zone,
	"blocking" boolean DEFAULT false NOT NULL,
	"module_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "questions_stage_ck" CHECK ("stage" IN ('opener', 'discovery', 'breakdown', 'mission_roster', 'context', 'finalize', 'finalized')),
	CONSTRAINT "questions_answered_ck" CHECK (((answer IS NULL) = (answered_at IS NULL)))
);
--> statement-breakpoint
CREATE TABLE "readiness_waivers" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"check_id" text NOT NULL,
	"reason" text NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rubric_results" (
	"checkpoint_id" uuid NOT NULL,
	"check_id" text NOT NULL,
	"applies" boolean NOT NULL,
	"result" text NOT NULL,
	"detail" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rubric_results_pkey" PRIMARY KEY("checkpoint_id","check_id"),
	CONSTRAINT "rubric_results_result_ck" CHECK ("result" IN ('pass', 'fail', 'finding', 'advisory'))
);
--> statement-breakpoint
CREATE TABLE "topic_coverage" (
	"session_id" uuid NOT NULL,
	"topic" text NOT NULL,
	"state" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "topic_coverage_pkey" PRIMARY KEY("session_id","topic"),
	CONSTRAINT "topic_coverage_topic_ck" CHECK ("topic" IN ('problem', 'outcome', 'scope', 'deadline', 'core_flows', 'data_integrations', 'quality_targets', 'edge_cases', 'existing_assets', 'acceptance')),
	CONSTRAINT "topic_coverage_state_ck" CHECK ("state" IN ('clear', 'partial', 'missing'))
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"session_id" uuid,
	"blob_key" text,
	"name" text NOT NULL,
	"mime" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"parse_status" text DEFAULT 'pending' NOT NULL,
	"state" text DEFAULT 'active' NOT NULL,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uploads_mission_id_id_uq" UNIQUE("mission_id","id"),
	CONSTRAINT "uploads_parse_status_ck" CHECK ("parse_status" IN ('pending', 'parsed', 'failed', 'unsupported')),
	CONSTRAINT "uploads_state_ck" CHECK ("state" IN ('active', 'removed')),
	CONSTRAINT "uploads_removed_at_ck" CHECK (((state = 'removed'::text) = (removed_at IS NOT NULL))),
	CONSTRAINT "uploads_active_blob_ck" CHECK (((state <> 'active'::text) OR (blob_key IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "usage_log" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"session_id" uuid NOT NULL,
	"call_kind" text NOT NULL,
	"model" text NOT NULL,
	"vendor" text NOT NULL,
	"tokens_in" integer NOT NULL,
	"tokens_out" integer NOT NULL,
	"cache_write_5m" integer DEFAULT 0 NOT NULL,
	"cache_write_1h" integer DEFAULT 0 NOT NULL,
	"cache_read" integer DEFAULT 0 NOT NULL,
	"cost_micros" bigint NOT NULL,
	"ok" boolean NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_log_call_kind_ck" CHECK ("call_kind" IN ('canon', 'extractor', 'breakdown', 'brennan', 'checkpoint_doc'))
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"key" text NOT NULL,
	"version" text NOT NULL,
	"deadline_hours" integer NOT NULL,
	"price_micros" bigint NOT NULL,
	"monthly_price_micros" bigint,
	"check_set" jsonb NOT NULL,
	"rubric_profile" jsonb NOT NULL,
	"factory_commit" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "packages_pkey" PRIMARY KEY("key","version"),
	CONSTRAINT "packages_status_ck" CHECK ("status" IN ('active', 'retired'))
);
--> statement-breakpoint
CREATE TABLE "checks" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"plan_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"kind" text NOT NULL,
	"spec" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checks_plan_id_ref_uq" UNIQUE("plan_id","ref"),
	CONSTRAINT "checks_plan_id_id_uq" UNIQUE("plan_id","id"),
	CONSTRAINT "checks_kind_ck" CHECK ("kind" IN ('file_exists', 'test', 'typecheck', 'command', 'e2e'))
);
--> statement-breakpoint
CREATE TABLE "codebase_analysis" (
	"plan_id" uuid PRIMARY KEY NOT NULL,
	"repo_commit" text,
	"stack" jsonb NOT NULL,
	"conventions" text NOT NULL,
	"build_cmd" text NOT NULL,
	"test_cmd" text NOT NULL,
	"lint_cmd" text NOT NULL,
	"standing_context" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "codebase_analysis_standing_context_ck" CHECK ("standing_context" IN ('found', 'generated'))
);
--> statement-breakpoint
CREATE TABLE "mission_scenarios" (
	"mission_id" uuid NOT NULL,
	"key" text NOT NULL,
	"first_plan_id" uuid NOT NULL,
	"retired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mission_scenarios_pkey" PRIMARY KEY("mission_id","key")
);
--> statement-breakpoint
CREATE TABLE "module_checks" (
	"plan_module_id" uuid NOT NULL,
	"check_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "module_checks_pkey" PRIMARY KEY("plan_module_id","check_id")
);
--> statement-breakpoint
CREATE TABLE "plan_module_deps" (
	"plan_module_id" uuid NOT NULL,
	"depends_on_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plan_module_deps_pkey" PRIMARY KEY("plan_module_id","depends_on_id"),
	CONSTRAINT "plan_module_deps_not_self_ck" CHECK ((plan_module_id <> depends_on_id))
);
--> statement-breakpoint
CREATE TABLE "plan_modules" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"plan_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"goal" text NOT NULL,
	"work_kind" text NOT NULL,
	"wave" integer NOT NULL,
	"write_paths" text[] DEFAULT '{}'::text[] NOT NULL,
	"forbidden_paths" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"constraints" text[] DEFAULT '{}'::text[] NOT NULL,
	"escalate_when" text[] DEFAULT '{}'::text[] NOT NULL,
	"reference_paths" text[] DEFAULT '{}'::text[] NOT NULL,
	"security_triggers" text[] DEFAULT '{}'::text[] NOT NULL,
	"asvs_level" text,
	"data_classification" text,
	"trace" jsonb,
	"est_minutes" integer NOT NULL,
	"est_micros" bigint NOT NULL,
	"est_source" text NOT NULL,
	"provisional" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plan_modules_plan_id_id_ref_uq" UNIQUE("plan_id","id","ref"),
	CONSTRAINT "plan_modules_plan_id_ref_uq" UNIQUE("plan_id","ref"),
	CONSTRAINT "plan_modules_plan_id_id_uq" UNIQUE("plan_id","id"),
	CONSTRAINT "plan_modules_est_source_ck" CHECK ("est_source" IN ('canon', 'calibrated')),
	CONSTRAINT "plan_modules_work_kind_ck" CHECK ("work_kind" IN ('data', 'infra', 'design-system', 'frontend', 'api', 'services', 'ai', 'maintenance', 'docs', 'audit', 'frontend-components', 'frontend-data')),
	CONSTRAINT "plan_modules_asvs_level_ck" CHECK (("asvs_level" IS NULL) OR ("asvs_level" IN ('L1', 'L2', 'L3'))),
	CONSTRAINT "plan_modules_data_classification_ck" CHECK (("data_classification" IS NULL) OR ("data_classification" IN ('public', 'internal', 'personal', 'payment')))
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"source" text NOT NULL,
	"session_id" uuid,
	"proposal_id" uuid,
	"package_key" text NOT NULL,
	"package_version" text NOT NULL,
	"roster_version" text NOT NULL,
	"brief_snapshot" jsonb NOT NULL,
	"state" text DEFAULT 'draft' NOT NULL,
	"supersedes_plan_id" uuid,
	"template_slug" text,
	"template_version" text,
	"price_micros" bigint NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_mission_id_id_uq" UNIQUE("mission_id","id"),
	CONSTRAINT "plans_mission_id_id_state_uq" UNIQUE("mission_id","id","state"),
	CONSTRAINT "plans_mission_id_version_uq" UNIQUE("mission_id","version"),
	CONSTRAINT "plans_source_ck" CHECK ("source" IN ('onboarding', 'proposal')),
	CONSTRAINT "plans_state_ck" CHECK ("state" IN ('draft', 'approved', 'superseded')),
	CONSTRAINT "plans_version_ck" CHECK ((version >= 1)),
	CONSTRAINT "plans_source_onboarding_ck" CHECK (((source <> 'onboarding'::text) OR ((session_id IS NOT NULL) AND (proposal_id IS NULL)))),
	CONSTRAINT "plans_source_proposal_ck" CHECK (((source <> 'proposal'::text) OR ((proposal_id IS NOT NULL) AND (session_id IS NULL)))),
	CONSTRAINT "plans_template_pair_ck" CHECK (((template_slug IS NULL) = (template_version IS NULL))),
	CONSTRAINT "plans_approved_ck" CHECK (
CASE
    WHEN (state = 'draft'::text) THEN ((approved_at IS NULL) AND (approved_by IS NULL))
    ELSE ((approved_at IS NOT NULL) AND (approved_by IS NOT NULL))
END)
);
--> statement-breakpoint
CREATE TABLE "quality_targets" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"plan_id" uuid NOT NULL,
	"plan_module_id" uuid,
	"metric" text NOT NULL,
	"threshold" numeric NOT NULL,
	"check_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirements" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"plan_module_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"ears_pattern" text NOT NULL,
	"text" text NOT NULL,
	"fact_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "requirements_plan_id_ref_uq" UNIQUE("plan_id","ref"),
	CONSTRAINT "requirements_plan_id_id_uq" UNIQUE("plan_id","id"),
	CONSTRAINT "requirements_ears_pattern_ck" CHECK ("ears_pattern" IN ('ubiquitous', 'event', 'state', 'optional', 'unwanted', 'complex'))
);
--> statement-breakpoint
CREATE TABLE "scenario_modules" (
	"scenario_id" uuid NOT NULL,
	"plan_module_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scenario_modules_pkey" PRIMARY KEY("scenario_id","plan_module_id")
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"requirement_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"level" text NOT NULL,
	"given" text NOT NULL,
	"when" text NOT NULL,
	"then" text NOT NULL,
	"kind" text NOT NULL,
	"acceptance" boolean NOT NULL,
	"check_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scenarios_plan_id_ref_uq" UNIQUE("plan_id","ref"),
	CONSTRAINT "scenarios_plan_id_id_uq" UNIQUE("plan_id","id"),
	CONSTRAINT "scenarios_level_ck" CHECK ("level" IN ('unit', 'integration', 'e2e', 'load')),
	CONSTRAINT "scenarios_kind_ck" CHECK ("kind" IN ('happy', 'failure', 'pinning', 'smoke'))
);
--> statement-breakpoint
CREATE TABLE "dispatches" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"module_run_id" uuid,
	"plan_id" uuid NOT NULL,
	"agent" text NOT NULL,
	"role" text NOT NULL,
	"pass" integer DEFAULT 1 NOT NULL,
	"state" text DEFAULT 'pending' NOT NULL,
	"parked_from" text,
	"origin" text DEFAULT 'factory' NOT NULL,
	"task_doc_version" integer DEFAULT 1 NOT NULL,
	"result_commit" text,
	"frozen_identity" jsonb NOT NULL,
	"wave" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dispatches_mission_id_id_uq" UNIQUE("mission_id","id"),
	CONSTRAINT "dispatches_id_module_run_id_uq" UNIQUE("id","module_run_id"),
	CONSTRAINT "dispatches_role_ck" CHECK ("role" IN ('build', 'test-unit', 'test-e2e', 'review-spec', 'review-security', 'red-team', 'ui-contract', 'review-frontend', 'review-a11y-perf', 'api-contract', 'review-backend')),
	CONSTRAINT "dispatches_state_ck" CHECK ("state" IN ('pending', 'ready', 'starting', 'running', 'reporting', 'waiting_dependency', 'blocked_on_you', 'succeeded', 'failed', 'parked', 'cancelled')),
	CONSTRAINT "dispatches_parked_from_ck" CHECK (("parked_from" IS NULL) OR ("parked_from" IN ('pending', 'ready', 'starting', 'running', 'reporting', 'waiting_dependency', 'blocked_on_you', 'succeeded', 'failed', 'parked', 'cancelled'))),
	CONSTRAINT "dispatches_origin_ck" CHECK ("origin" IN ('factory', 'override')),
	CONSTRAINT "dispatches_pass_ck" CHECK ((pass >= 1)),
	CONSTRAINT "dispatches_parked_ck" CHECK ((((state = 'parked'::text) = (parked_from IS NOT NULL)) AND ((parked_from IS NULL) OR (parked_from <> 'parked'::text))))
);
--> statement-breakpoint
CREATE TABLE "findings" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"checkpoint_id" uuid,
	"module_run_id" uuid,
	"source" text NOT NULL,
	"source_role" text NOT NULL,
	"check_id" text,
	"target_ref" text,
	"evidence" jsonb,
	"kind" text NOT NULL,
	"route" text NOT NULL,
	"state" text DEFAULT 'open' NOT NULL,
	"tries" integer DEFAULT 0 NOT NULL,
	"reviewed_commit" text,
	"reason" text,
	"decided_by_kind" text,
	"decided_by_user_id" uuid,
	"decided_by_attempt_id" uuid,
	"fixed_by_check" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "findings_mission_id_id_uq" UNIQUE("mission_id","id"),
	CONSTRAINT "findings_source_ck" CHECK ("source" IN ('checkpoint', 'review', 'gate')),
	CONSTRAINT "findings_kind_ck" CHECK ("kind" IN ('requirement', 'security', 'scope', 'integrity', 'advisory')),
	CONSTRAINT "findings_route_ck" CHECK ("route" IN ('rework', 'proposal', 'receipt')),
	CONSTRAINT "findings_state_ck" CHECK ("state" IN ('open', 'triage', 'confirmed', 'disputed', 'dismissed', 'fixed', 'accepted')),
	CONSTRAINT "findings_decided_by_kind_ck" CHECK (("decided_by_kind" IS NULL) OR ("decided_by_kind" IN ('user', 'agent', 'check'))),
	CONSTRAINT "findings_checkpoint_source_ck" CHECK (((checkpoint_id IS NOT NULL) = (source = 'checkpoint'::text))),
	CONSTRAINT "findings_reviewed_commit_ck" CHECK (((reviewed_commit IS NOT NULL) = (source = ANY (ARRAY['review'::text, 'gate'::text])))),
	CONSTRAINT "findings_cites_ck" CHECK ((((target_ref IS NOT NULL) AND (evidence IS NOT NULL)) OR (state = ANY (ARRAY['triage'::text, 'dismissed'::text])))),
	CONSTRAINT "findings_decided_at_ck" CHECK (((decided_by_kind IS NULL) = (decided_at IS NULL))),
	CONSTRAINT "findings_decided_by_ck" CHECK (
CASE decided_by_kind
    WHEN 'user'::text THEN ((decided_by_user_id IS NOT NULL) AND (decided_by_attempt_id IS NULL) AND (fixed_by_check IS NULL))
    WHEN 'agent'::text THEN ((decided_by_user_id IS NULL) AND (decided_by_attempt_id IS NOT NULL) AND (fixed_by_check IS NULL))
    WHEN 'check'::text THEN ((decided_by_user_id IS NULL) AND (decided_by_attempt_id IS NULL) AND (fixed_by_check IS NOT NULL))
    ELSE ((decided_by_user_id IS NULL) AND (decided_by_attempt_id IS NULL) AND (fixed_by_check IS NULL))
END),
	CONSTRAINT "findings_closed_decided_ck" CHECK (((state <> ALL (ARRAY['dismissed'::text, 'accepted'::text, 'fixed'::text])) OR (decided_by_kind IS NOT NULL))),
	CONSTRAINT "findings_reason_ck" CHECK (((state <> ALL (ARRAY['dismissed'::text, 'accepted'::text])) OR (reason IS NOT NULL))),
	CONSTRAINT "findings_accepted_by_user_ck" CHECK (((state <> 'accepted'::text) OR (decided_by_kind = 'user'::text))),
	CONSTRAINT "findings_fixed_by_ck" CHECK (((state <> 'fixed'::text) OR (decided_by_kind = ANY (ARRAY['check'::text, 'agent'::text])))),
	CONSTRAINT "findings_integrity_ck" CHECK (((kind <> 'integrity'::text) OR (state <> 'accepted'::text)))
);
--> statement-breakpoint
CREATE TABLE "mission_docs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"dispatch_md" text NOT NULL,
	"hash" text NOT NULL,
	"gate1_passed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mission_docs_plan_id_uq" UNIQUE("plan_id")
);
--> statement-breakpoint
CREATE TABLE "mission_pauses" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"interrupted_state" text NOT NULL,
	"proposal_id" uuid,
	"paused_by" uuid,
	"reason" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"ended_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mission_pauses_kind_ck" CHECK ("kind" IN ('operator', 'proposal', 'budget')),
	CONSTRAINT "mission_pauses_interrupted_state_ck" CHECK ("interrupted_state" IN ('draft', 'onboarding', 'approved', 'rendered', 'running', 'reviewing', 'deciding', 'awaiting_release', 'refreshing', 'delivering', 'delivered', 'closed', 'cancelled')),
	CONSTRAINT "mission_pauses_proposal_ck" CHECK (((kind <> 'proposal'::text) OR (proposal_id IS NOT NULL))),
	CONSTRAINT "mission_pauses_operator_ck" CHECK (((kind <> 'operator'::text) OR (paused_by IS NOT NULL))),
	CONSTRAINT "mission_pauses_ended_ck" CHECK (((ended_at IS NULL) OR (ended_at >= started_at)))
);
--> statement-breakpoint
CREATE TABLE "mission_refreshes" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"from_commit" text NOT NULL,
	"to_commit" text NOT NULL,
	"from_receipt_id" uuid NOT NULL,
	"new_receipt_id" uuid,
	"proposal_id" uuid,
	"state" text DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mission_refreshes_state_ck" CHECK ("state" IN ('running', 'done', 'conflict', 'failed')),
	CONSTRAINT "mission_refreshes_finished_ck" CHECK (((state = 'running'::text) OR (finished_at IS NOT NULL))),
	CONSTRAINT "mission_refreshes_done_ck" CHECK (((state <> 'done'::text) OR (new_receipt_id IS NOT NULL))),
	CONSTRAINT "mission_refreshes_conflict_ck" CHECK (((state <> 'conflict'::text) OR (proposal_id IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "missions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"client_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"client_kind" text NOT NULL,
	"state" text DEFAULT 'draft' NOT NULL,
	"package_key" text,
	"package_version" text,
	"price_micros" bigint,
	"deadline_at" timestamp with time zone,
	"budget_micros" bigint NOT NULL,
	"reserved_micros" bigint DEFAULT 0 NOT NULL,
	"spent_micros" bigint DEFAULT 0 NOT NULL,
	"plan_id" uuid,
	"plan_state" text,
	"repo_connection_id" uuid,
	"pinned_commit" text,
	"branch_head" text,
	"factory_commit" text,
	"roster_version" text,
	"kb_release" text,
	"rules_version" text,
	"gate5_failures" integer DEFAULT 0 NOT NULL,
	"onboarding_started_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"rendered_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"design_system_slug" text,
	"design_system_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "missions_state_ck" CHECK ("state" IN ('draft', 'onboarding', 'approved', 'rendered', 'running', 'reviewing', 'deciding', 'awaiting_release', 'refreshing', 'delivering', 'delivered', 'closed', 'cancelled')),
	CONSTRAINT "missions_draft_not_started_ck" CHECK (((state <> 'draft'::text) OR (onboarding_started_at IS NULL))),
	CONSTRAINT "missions_started_ck" CHECK (((state = ANY (ARRAY['draft'::text, 'cancelled'::text])) OR (onboarding_started_at IS NOT NULL))),
	CONSTRAINT "missions_started_factory_commit_ck" CHECK (((onboarding_started_at IS NULL) OR (factory_commit IS NOT NULL))),
	CONSTRAINT "missions_approved_fields_ck" CHECK (((approved_at IS NULL) OR ((plan_id IS NOT NULL) AND (package_key IS NOT NULL) AND (package_version IS NOT NULL) AND (price_micros IS NOT NULL) AND (deadline_at IS NOT NULL) AND (roster_version IS NOT NULL) AND (kb_release IS NOT NULL) AND (rules_version IS NOT NULL)))),
	CONSTRAINT "missions_plan_state_ck" CHECK ((((plan_id IS NULL) = (plan_state IS NULL)) AND ((plan_state IS NULL) OR (plan_state = 'approved'::text)))),
	CONSTRAINT "missions_package_pair_ck" CHECK (((package_key IS NULL) = (package_version IS NULL))),
	CONSTRAINT "missions_rendered_fields_ck" CHECK (((rendered_at IS NULL) OR ((approved_at IS NOT NULL) AND (branch_head IS NOT NULL)))),
	CONSTRAINT "missions_pinned_commit_ck" CHECK (((approved_at IS NULL) OR (repo_connection_id IS NULL) OR (pinned_commit IS NOT NULL))),
	CONSTRAINT "missions_state_approved_ck" CHECK (((state <> 'approved'::text) OR (approved_at IS NOT NULL))),
	CONSTRAINT "missions_state_rendered_ck" CHECK (((NOT (state = ANY (ARRAY['rendered'::text, 'running'::text, 'reviewing'::text, 'deciding'::text, 'awaiting_release'::text, 'refreshing'::text, 'delivering'::text, 'delivered'::text, 'closed'::text]))) OR (rendered_at IS NOT NULL))),
	CONSTRAINT "missions_state_delivered_ck" CHECK (((state <> ALL (ARRAY['delivered'::text, 'closed'::text])) OR (delivered_at IS NOT NULL))),
	CONSTRAINT "missions_state_closed_ck" CHECK (((state <> 'closed'::text) OR (closed_at IS NOT NULL))),
	CONSTRAINT "missions_state_cancelled_ck" CHECK (((state = 'cancelled'::text) = (cancelled_at IS NOT NULL))),
	CONSTRAINT "missions_budget_ck" CHECK (((reserved_micros >= 0) AND (spent_micros >= 0) AND ((reserved_micros + spent_micros) <= budget_micros))),
	CONSTRAINT "missions_kind_ck" CHECK ("kind" IN ('client', 'internal', 'template')),
	CONSTRAINT "missions_client_kind_ck" CHECK ("client_kind" IN ('client', 'internal')),
	CONSTRAINT "missions_client_kind_match_ck" CHECK ((kind = 'client'::text) = (client_kind = 'client'::text)),
	CONSTRAINT "missions_design_system_pair_ck" CHECK ((design_system_slug IS NULL) = (design_system_version IS NULL))
);
--> statement-breakpoint
CREATE TABLE "module_runs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"plan_id" uuid NOT NULL,
	"plan_module_id" uuid NOT NULL,
	"state" text DEFAULT 'blocked' NOT NULL,
	"parked_from" text,
	"ladder_step" integer DEFAULT 0 NOT NULL,
	"fix_rounds" integer DEFAULT 0 NOT NULL,
	"rework_tries" integer DEFAULT 0 NOT NULL,
	"review_rounds" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"tests_base_commit" text,
	"build_base_commit" text,
	"landed_at" timestamp with time zone,
	"landed_commit" text,
	"current_commit" text,
	"budget_micros" bigint NOT NULL,
	"reserved_micros" bigint DEFAULT 0 NOT NULL,
	"spent_micros" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "module_runs_mission_id_ref_uq" UNIQUE("mission_id","ref"),
	CONSTRAINT "module_runs_mission_id_id_uq" UNIQUE("mission_id","id"),
	CONSTRAINT "module_runs_state_ck" CHECK ("state" IN ('blocked', 'tests_writing', 'tests_locked', 'building', 'in_review', 'fixing', 'integrating', 'landed', 'retrying', 'reworking', 'parked')),
	CONSTRAINT "module_runs_parked_from_ck" CHECK (("parked_from" IS NULL) OR ("parked_from" IN ('blocked', 'tests_writing', 'tests_locked', 'building', 'in_review', 'fixing', 'integrating', 'landed', 'retrying', 'reworking', 'parked'))),
	CONSTRAINT "module_runs_parked_ck" CHECK ((((state = 'parked'::text) = (parked_from IS NOT NULL)) AND ((parked_from IS NULL) OR (parked_from <> 'parked'::text)))),
	CONSTRAINT "module_runs_started_ck" CHECK ((((started_at IS NULL) = (tests_base_commit IS NULL)) AND
CASE
    WHEN (COALESCE(parked_from, state) = 'blocked'::text) THEN (started_at IS NULL)
    ELSE (started_at IS NOT NULL)
END)),
	CONSTRAINT "module_runs_build_base_ck" CHECK (
CASE
    WHEN (COALESCE(parked_from, state) = ANY (ARRAY['blocked'::text, 'tests_writing'::text])) THEN (build_base_commit IS NULL)
    ELSE (build_base_commit IS NOT NULL)
END),
	CONSTRAINT "module_runs_landed_triple_ck" CHECK ((((landed_at IS NULL) = (landed_commit IS NULL)) AND ((landed_at IS NULL) = (current_commit IS NULL)))),
	CONSTRAINT "module_runs_landed_ck" CHECK ((((COALESCE(parked_from, state) <> ALL (ARRAY['landed'::text, 'reworking'::text])) OR (landed_at IS NOT NULL)) AND ((COALESCE(parked_from, state) <> ALL (ARRAY['blocked'::text, 'tests_writing'::text, 'tests_locked'::text, 'building'::text, 'retrying'::text, 'fixing'::text])) OR (landed_at IS NULL)))),
	CONSTRAINT "module_runs_budget_ck" CHECK (((reserved_micros >= 0) AND (spent_micros >= 0) AND ((reserved_micros + spent_micros) <= budget_micros)))
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"source" text NOT NULL,
	"state" text DEFAULT 'active' NOT NULL,
	"redacted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notes_source_ck" CHECK ("source" IN ('web', 'cli')),
	CONSTRAINT "notes_state_ck" CHECK ("state" IN ('active', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "proposal_findings" (
	"proposal_id" uuid NOT NULL,
	"finding_id" uuid NOT NULL,
	"mission_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposal_findings_pkey" PRIMARY KEY("proposal_id","finding_id")
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"module_run_id" uuid,
	"dispatch_id" uuid,
	"kind" text NOT NULL,
	"subject_key" text DEFAULT '' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"reason" text NOT NULL,
	"options" jsonb NOT NULL,
	"state" text DEFAULT 'open' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"choice" text,
	"choice_reason" text,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposals_mission_id_id_uq" UNIQUE("mission_id","id"),
	CONSTRAINT "proposals_kind_ck" CHECK ("kind" IN ('parked', 'converge', 'contract_change', 'dependency', 'quarantine', 'budget_increase', 'reentry', 'dispute', 'gate5', 'suppression', 'test_change', 'review_limit', 'repin')),
	CONSTRAINT "proposals_state_ck" CHECK ("state" IN ('open', 'resolved', 'expired')),
	CONSTRAINT "proposals_version_ck" CHECK ((version >= 1)),
	CONSTRAINT "proposals_resolved_ck" CHECK (((state = 'resolved'::text) = ((choice IS NOT NULL) AND (choice_reason IS NOT NULL) AND (resolved_by IS NOT NULL) AND (resolved_at IS NOT NULL))))
);
--> statement-breakpoint
CREATE TABLE "task_docs" (
	"dispatch_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"mission_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"body" text NOT NULL,
	"hash" text NOT NULL,
	"rendered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_docs_pkey" PRIMARY KEY("dispatch_id","version"),
	CONSTRAINT "task_docs_version_ck" CHECK ((version >= 1))
);
--> statement-breakpoint
CREATE TABLE "dependency_requests" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"dispatch_id" uuid NOT NULL,
	"proposal_id" uuid,
	"name" text NOT NULL,
	"version" text NOT NULL,
	"reason" text NOT NULL,
	"new_to_factory" boolean NOT NULL,
	"state" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dependency_requests_mission_id_id_uq" UNIQUE("mission_id","id"),
	CONSTRAINT "dependency_requests_state_ck" CHECK ("state" IN ('open', 'approved', 'rejected', 'expired'))
);
--> statement-breakpoint
CREATE TABLE "integration_commits" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"module_run_id" uuid,
	"attempt_id" uuid,
	"dependency_request_id" uuid,
	"base_sha" text,
	"commit_sha" text,
	"state" text DEFAULT 'queued' NOT NULL,
	"results" jsonb,
	"queued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "integration_commits_mission_id_id_uq" UNIQUE("mission_id","id"),
	CONSTRAINT "integration_commits_kind_ck" CHECK ("kind" IN ('tests', 'module', 'dependency', 'operator', 'ui_contract', 'api_contract', 'dispatch_docs')),
	CONSTRAINT "integration_commits_state_ck" CHECK ("state" IN ('queued', 'testing', 'landed', 'rejected')),
	CONSTRAINT "integration_commits_started_ck" CHECK (((state = 'queued'::text) OR ((base_sha IS NOT NULL) AND (started_at IS NOT NULL)))),
	CONSTRAINT "integration_commits_finished_ck" CHECK (((state <> ALL (ARRAY['landed'::text, 'rejected'::text])) OR ((results IS NOT NULL) AND (finished_at IS NOT NULL)))),
	CONSTRAINT "integration_commits_landed_ck" CHECK (((state <> 'landed'::text) OR (commit_sha IS NOT NULL))),
	CONSTRAINT "integration_commits_by_kind_ck" CHECK (
CASE kind
    WHEN 'module'::text THEN ((module_run_id IS NOT NULL) AND (attempt_id IS NOT NULL))
    WHEN 'tests'::text THEN (module_run_id IS NOT NULL)
    WHEN 'dependency'::text THEN (dependency_request_id IS NOT NULL)
    WHEN 'operator'::text THEN ((module_run_id IS NULL) AND (attempt_id IS NULL) AND (dependency_request_id IS NULL))
    WHEN 'ui_contract'::text THEN (module_run_id IS NOT NULL)
    WHEN 'api_contract'::text THEN (module_run_id IS NOT NULL)
    WHEN 'dispatch_docs'::text THEN ((module_run_id IS NULL) AND (attempt_id IS NULL) AND (dependency_request_id IS NULL))
    ELSE NULL::boolean
END)
);
--> statement-breakpoint
CREATE TABLE "locked_scripts" (
	"module_run_id" uuid NOT NULL,
	"name" text NOT NULL,
	"value_sha256" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "locked_scripts_pkey" PRIMARY KEY("module_run_id","name")
);
--> statement-breakpoint
CREATE TABLE "quarantines" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"scenario_key" text,
	"test_path" text NOT NULL,
	"reason" text NOT NULL,
	"proposal_id" uuid NOT NULL,
	"approved_by" uuid NOT NULL,
	"approved_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_locks" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"module_run_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"scenario_key" text,
	"integration_commit_id" uuid,
	"path" text NOT NULL,
	"sha256" text NOT NULL,
	"assertion_count" integer NOT NULL,
	"failed_first_at" timestamp with time zone,
	"locked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "test_locks_kind_ck" CHECK ("kind" IN ('fail_first', 'pinning')),
	CONSTRAINT "test_locks_fail_first_ck" CHECK (((kind = 'fail_first'::text) = (failed_first_at IS NOT NULL))),
	CONSTRAINT "test_locks_released_ck" CHECK (((released_at IS NULL) OR (released_at >= locked_at)))
);
--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"dispatch_id" uuid NOT NULL,
	"n" integer NOT NULL,
	"task_doc_version" integer NOT NULL,
	"agent_config_hash" text NOT NULL,
	"factory_commit" text NOT NULL,
	"branch" text NOT NULL,
	"kind" text NOT NULL,
	"vendor" text NOT NULL,
	"model" text NOT NULL,
	"compute" text NOT NULL,
	"checkpoint_commit" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"tokens_in" integer DEFAULT 0 NOT NULL,
	"tokens_out" integer DEFAULT 0 NOT NULL,
	"cache_read" integer DEFAULT 0 NOT NULL,
	"cache_write_5m" integer DEFAULT 0 NOT NULL,
	"cache_write_1h" integer DEFAULT 0 NOT NULL,
	"cost_micros" bigint DEFAULT 0 NOT NULL,
	"reserved_micros" bigint DEFAULT 0 NOT NULL,
	"cap_micros" bigint NOT NULL,
	"outcome" text,
	"failure_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attempts_dispatch_id_n_uq" UNIQUE("dispatch_id","n"),
	CONSTRAINT "attempts_mission_id_id_uq" UNIQUE("mission_id","id"),
	CONSTRAINT "attempts_dispatch_id_id_uq" UNIQUE("dispatch_id","id"),
	CONSTRAINT "attempts_kind_ck" CHECK ("kind" IN ('initial', 'retry_1', 'retry_2', 'retry_3', 'fix', 'rework', 'resume', 'infra_restart')),
	CONSTRAINT "attempts_compute_ck" CHECK ("compute" IN ('docker', 'boat', 'miosa')),
	CONSTRAINT "attempts_outcome_ck" CHECK (("outcome" IS NULL) OR ("outcome" IN ('passed', 'failed', 'capped', 'budget_parked', 'killed', 'crashed', 'infra_lost'))),
	CONSTRAINT "attempts_n_ck" CHECK ((n >= 1)),
	CONSTRAINT "attempts_ended_ck" CHECK (((ended_at IS NULL) = (outcome IS NULL))),
	CONSTRAINT "attempts_cap_ck" CHECK (((reserved_micros >= 0) AND (cost_micros >= 0) AND ((reserved_micros + cost_micros) <= cap_micros)))
);
--> statement-breakpoint
CREATE TABLE "completion_reports" (
	"attempt_id" uuid PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"result_commit" text,
	"body" jsonb NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "completion_reports_status_ck" CHECK ("status" IN ('done', 'partial', 'blocked'))
);
--> statement-breakpoint
CREATE TABLE "progress_notes" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_loads" (
	"attempt_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"loaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skill_loads_pkey" PRIMARY KEY("attempt_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "credentials" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"kind" text NOT NULL,
	"dispatch_id" uuid,
	"attempt_id" uuid,
	"session_id" uuid,
	"token_sha256" text NOT NULL,
	"scope" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credentials_token_sha256_uq" UNIQUE("token_sha256"),
	CONSTRAINT "credentials_kind_ck" CHECK ("kind" IN ('dispatch', 'git', 'proxy', 'service')),
	CONSTRAINT "credentials_parent_ck" CHECK (
CASE
    WHEN (kind = 'service'::text) THEN ((dispatch_id IS NULL) AND (attempt_id IS NULL))
    ELSE ((dispatch_id IS NOT NULL) AND (attempt_id IS NOT NULL) AND (session_id IS NULL))
END)
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"kind" text NOT NULL,
	"mission_id" uuid NOT NULL,
	"dispatch_id" uuid,
	"attempt_id" uuid,
	"integration_commit_id" uuid,
	"state" text DEFAULT 'creating' NOT NULL,
	"image_digest" text,
	"destroyed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_kind_ck" CHECK ("kind" IN ('dispatch', 'check', 'integration', 'image_build')),
	CONSTRAINT "rooms_state_ck" CHECK ("state" IN ('creating', 'ready', 'busy', 'destroyed')),
	CONSTRAINT "rooms_destroyed_at_ck" CHECK (((state = 'destroyed'::text) = (destroyed_at IS NOT NULL))),
	CONSTRAINT "rooms_parent_ck" CHECK (
CASE kind
    WHEN 'integration'::text THEN ((integration_commit_id IS NOT NULL) AND (dispatch_id IS NULL) AND (attempt_id IS NULL))
    WHEN 'image_build'::text THEN ((integration_commit_id IS NULL) AND (dispatch_id IS NULL) AND (attempt_id IS NULL))
    ELSE ((dispatch_id IS NOT NULL) AND (attempt_id IS NOT NULL) AND (integration_commit_id IS NULL))
END)
);
--> statement-breakpoint
CREATE TABLE "budget_reservations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"module_run_id" uuid,
	"kind" text NOT NULL,
	"dispatch_id" uuid,
	"attempt_id" uuid,
	"session_id" uuid,
	"request_id" text,
	"reserved_micros" bigint NOT NULL,
	"settled_micros" bigint,
	"state" text DEFAULT 'held' NOT NULL,
	"settled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "budget_reservations_kind_ck" CHECK ("kind" IN ('expected', 'request')),
	CONSTRAINT "budget_reservations_state_ck" CHECK ("state" IN ('held', 'settled', 'released')),
	CONSTRAINT "budget_reservations_expected_ck" CHECK (((kind <> 'expected'::text) OR ((num_nonnulls(dispatch_id, session_id) = 1) AND (attempt_id IS NULL) AND (request_id IS NULL)))),
	CONSTRAINT "budget_reservations_request_ck" CHECK (((kind <> 'request'::text) OR ((num_nonnulls(attempt_id, session_id) = 1) AND (request_id IS NOT NULL)))),
	CONSTRAINT "budget_reservations_attempt_dispatch_ck" CHECK (((attempt_id IS NULL) OR (dispatch_id IS NOT NULL))),
	CONSTRAINT "budget_reservations_settled_ck" CHECK ((((state = 'settled'::text) = (settled_micros IS NOT NULL)) AND ((settled_micros IS NULL) OR (settled_micros <= reserved_micros)))),
	CONSTRAINT "budget_reservations_amount_ck" CHECK (((reserved_micros >= 0) AND ((settled_micros IS NULL) OR (settled_micros >= 0))))
);
--> statement-breakpoint
CREATE TABLE "human_time" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"user_id" uuid NOT NULL,
	"mission_id" uuid NOT NULL,
	"dispatch_id" uuid,
	"activity" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"minutes" integer,
	"source" text NOT NULL,
	"state" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "human_time_activity_ck" CHECK ("activity" IN ('onboarding', 'approval', 'review', 'fix', 'call', 'override')),
	CONSTRAINT "human_time_source_ck" CHECK ("source" IN ('auto', 'manual')),
	CONSTRAINT "human_time_state_ck" CHECK ("state" IN ('running', 'draft', 'confirmed', 'discarded')),
	CONSTRAINT "human_time_confirmed_ck" CHECK (((state <> 'confirmed'::text) OR ((ended_at IS NOT NULL) AND (minutes IS NOT NULL))))
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"amount_micros" bigint NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"recorded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_table" (
	"vendor" text NOT NULL,
	"model" text NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"input_micros" bigint NOT NULL,
	"output_micros" bigint NOT NULL,
	"cache_write_5m_micros" bigint NOT NULL,
	"cache_write_1h_micros" bigint NOT NULL,
	"cache_read_micros" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "price_table_pkey" PRIMARY KEY("vendor","model","valid_from")
);
--> statement-breakpoint
CREATE TABLE "check_results" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"gate_evaluation_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"scenario_key" text,
	"check_id" uuid,
	"run_n" integer DEFAULT 1 NOT NULL,
	"result" text NOT NULL,
	"duration_ms" integer NOT NULL,
	"output_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_results_one_per_run_uq" UNIQUE("gate_evaluation_id","scenario_key","check_id","run_n"),
	CONSTRAINT "check_results_result_ck" CHECK ("result" IN ('passed', 'failed', 'skipped', 'quarantined')),
	CONSTRAINT "check_results_subject_ck" CHECK (((scenario_key IS NOT NULL) OR (check_id IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "gate_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"gate" smallint NOT NULL,
	"commit_sha" text NOT NULL,
	"module_run_id" uuid,
	"integration_commit_id" uuid,
	"attempt_id" uuid,
	"gate_run_id" uuid,
	"result" text NOT NULL,
	"reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gate_evaluations_mission_id_id_uq" UNIQUE("mission_id","id"),
	CONSTRAINT "gate_evaluations_mission_id_id_gate_uq" UNIQUE("mission_id","id","gate"),
	CONSTRAINT "gate_evaluations_gate_ck" CHECK (((gate >= 1) AND (gate <= 5))),
	CONSTRAINT "gate_evaluations_result_ck" CHECK ("result" IN ('passed', 'failed', 'error')),
	CONSTRAINT "gate_evaluations_parent_ck" CHECK (
CASE gate
    WHEN 2 THEN ((integration_commit_id IS NOT NULL) AND (attempt_id IS NULL) AND (gate_run_id IS NULL))
    WHEN 3 THEN ((attempt_id IS NOT NULL) AND (integration_commit_id IS NULL) AND (gate_run_id IS NULL))
    WHEN 5 THEN ((gate_run_id IS NOT NULL) AND (integration_commit_id IS NULL) AND (attempt_id IS NULL))
    ELSE ((integration_commit_id IS NULL) AND (attempt_id IS NULL) AND (gate_run_id IS NULL))
END)
);
--> statement-breakpoint
CREATE TABLE "gate_runs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"commit_sha" text NOT NULL,
	"decide_version" integer NOT NULL,
	"state" text DEFAULT 'running' NOT NULL,
	"trigger" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gate_runs_mission_id_id_uq" UNIQUE("mission_id","id"),
	CONSTRAINT "gate_runs_state_ck" CHECK ("state" IN ('running', 'decided', 'failed')),
	CONSTRAINT "gate_runs_trigger_ck" CHECK ("trigger" IN ('auto', 'override', 'refresh'))
);
--> statement-breakpoint
CREATE TABLE "pass_approvals" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"receipt_id" uuid NOT NULL,
	"receipt_hash" text NOT NULL,
	"receipt_verdict" text NOT NULL,
	"reason" text NOT NULL,
	"user_id" uuid NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pass_approvals_receipt_id_uq" UNIQUE("receipt_id"),
	CONSTRAINT "pass_approvals_id_receipt_id_uq" UNIQUE("id","receipt_id"),
	CONSTRAINT "pass_approvals_verdict_ck" CHECK ((receipt_verdict = 'pass'::text))
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"gate_run_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"hash" text NOT NULL,
	"verdict" text NOT NULL,
	"commit_sha" text NOT NULL,
	"factory_commit" text NOT NULL,
	"verdict_caps" text[] DEFAULT '{}'::text[] NOT NULL,
	"body" jsonb NOT NULL,
	"human_minutes" integer NOT NULL,
	"ai_tokens" bigint NOT NULL,
	"ai_cost_micros" bigint NOT NULL,
	"vendors" text[] DEFAULT '{}'::text[] NOT NULL,
	"override_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "receipts_hash_uq" UNIQUE("hash"),
	CONSTRAINT "receipts_gate_run_id_version_uq" UNIQUE("gate_run_id","version"),
	CONSTRAINT "receipts_id_hash_uq" UNIQUE("id","hash"),
	CONSTRAINT "receipts_id_verdict_uq" UNIQUE("id","verdict"),
	CONSTRAINT "receipts_mission_id_id_uq" UNIQUE("mission_id","id"),
	CONSTRAINT "receipts_verdict_ck" CHECK ("verdict" IN ('verified', 'pass', 'fail')),
	CONSTRAINT "receipts_version_ck" CHECK ((version >= 1))
);
--> statement-breakpoint
CREATE TABLE "release_approvals" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"receipt_id" uuid NOT NULL,
	"receipt_hash" text NOT NULL,
	"receipt_verdict" text NOT NULL,
	"pass_approval_id" uuid,
	"user_id" uuid NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "release_approvals_receipt_id_uq" UNIQUE("receipt_id"),
	CONSTRAINT "release_approvals_id_receipt_id_uq" UNIQUE("id","receipt_id"),
	CONSTRAINT "release_approvals_not_fail_ck" CHECK ((receipt_verdict <> 'fail'::text)),
	CONSTRAINT "release_approvals_pass_ck" CHECK (((receipt_verdict = 'pass'::text) = (pass_approval_id IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"release_approval_id" uuid NOT NULL,
	"receipt_id" uuid NOT NULL,
	"repo_connection_id" uuid,
	"kind" text NOT NULL,
	"commit_sha" text NOT NULL,
	"ref" text,
	"state" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"recorded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deliveries_kind_ck" CHECK ("kind" IN ('zip', 'pr', 'push')),
	CONSTRAINT "deliveries_state_ck" CHECK ("state" IN ('pending', 'recorded', 'failed')),
	CONSTRAINT "deliveries_connection_ck" CHECK (((kind <> ALL (ARRAY['pr'::text, 'push'::text])) OR (repo_connection_id IS NOT NULL))),
	CONSTRAINT "deliveries_recorded_ck" CHECK (((state <> 'recorded'::text) OR ((recorded_at IS NOT NULL) AND (ref IS NOT NULL)))),
	CONSTRAINT "deliveries_failed_ck" CHECK (((state <> 'failed'::text) OR (error IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "repo_connections" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"client_id" uuid NOT NULL,
	"owner" text NOT NULL,
	"repos" text[] NOT NULL,
	"read_secret_id" uuid NOT NULL,
	"write_secret_id" uuid NOT NULL,
	"read_expires_at" timestamp with time zone NOT NULL,
	"write_expires_at" timestamp with time zone NOT NULL,
	"state" text DEFAULT 'active' NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "repo_connections_client_id_id_uq" UNIQUE("client_id","id"),
	CONSTRAINT "repo_connections_state_ck" CHECK ("state" IN ('active', 'revoked')),
	CONSTRAINT "repo_connections_revoked_at_ck" CHECK (((state = 'revoked'::text) = (revoked_at IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "secrets" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid,
	"client_id" uuid,
	"name" text NOT NULL,
	"ciphertext" "bytea",
	"wrapped_dek" "bytea",
	"kms_key_id" text NOT NULL,
	"key_version" integer NOT NULL,
	"state" text DEFAULT 'active' NOT NULL,
	"destroyed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "secrets_client_id_id_uq" UNIQUE("client_id","id"),
	CONSTRAINT "secrets_state_ck" CHECK ("state" IN ('active', 'destroyed')),
	CONSTRAINT "secrets_destroyed_at_ck" CHECK (((state = 'destroyed'::text) = (destroyed_at IS NOT NULL))),
	CONSTRAINT "secrets_material_ck" CHECK ((((ciphertext IS NOT NULL) = (state = 'active'::text)) AND ((wrapped_dek IS NOT NULL) = (state = 'active'::text)))),
	CONSTRAINT "secrets_owner_ck" CHECK ((num_nonnulls(mission_id, client_id) <= 1))
);
--> statement-breakpoint
CREATE TABLE "rules" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"scope" text NOT NULL,
	"stack" text,
	"client_id" uuid,
	"path" text NOT NULL,
	"sha256" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rules_scope_ck" CHECK ("scope" IN ('global', 'stack', 'client')),
	CONSTRAINT "rules_status_ck" CHECK ("status" IN ('active', 'retired')),
	CONSTRAINT "rules_scope_parts_ck" CHECK ((((scope = 'client'::text) = (client_id IS NOT NULL)) AND ((scope = 'stack'::text) = (stack IS NOT NULL))))
);
--> statement-breakpoint
CREATE TABLE "rules_version_rules" (
	"rules_version" text NOT NULL,
	"rule_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rules_version_rules_pkey" PRIMARY KEY("rules_version","rule_id")
);
--> statement-breakpoint
CREATE TABLE "rules_versions" (
	"version" text PRIMARY KEY NOT NULL,
	"sha256" text NOT NULL,
	"factory_commit" text NOT NULL,
	"approved_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "closeout_items" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"mission_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"finding_id" uuid,
	"module_run_id" uuid,
	"note" text,
	"state" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "closeout_items_kind_ck" CHECK ("kind" IN ('finding', 'lesson_candidate')),
	CONSTRAINT "closeout_items_state_ck" CHECK ("state" IN ('open', 'written', 'dismissed')),
	CONSTRAINT "closeout_items_parent_ck" CHECK (
CASE kind
    WHEN 'finding'::text THEN ((finding_id IS NOT NULL) AND (module_run_id IS NULL))
    WHEN 'lesson_candidate'::text THEN ((module_run_id IS NOT NULL) AND (finding_id IS NULL))
    ELSE NULL::boolean
END)
);
--> statement-breakpoint
CREATE TABLE "design_systems" (
	"slug" text NOT NULL,
	"version" text NOT NULL,
	"layer" text NOT NULL,
	"client_id" uuid,
	"path" text NOT NULL,
	"factory_commit" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "design_systems_pkey" PRIMARY KEY("slug","version"),
	CONSTRAINT "design_systems_layer_ck" CHECK ("layer" IN ('global', 'client')),
	CONSTRAINT "design_systems_status_ck" CHECK ("status" IN ('active', 'retired')),
	CONSTRAINT "design_systems_client_layer_ck" CHECK (((layer = 'client'::text) = (client_id IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "factory_versions" (
	"sha" text PRIMARY KEY NOT NULL,
	"merged_at" timestamp with time zone NOT NULL,
	"approved_by" uuid NOT NULL,
	"merged_by_app" boolean NOT NULL,
	"summary" text NOT NULL,
	"pr_number" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kb_entries" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"layer" text NOT NULL,
	"client_id" uuid,
	"kind" text NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"path" text NOT NULL,
	"body_sha256" text NOT NULL,
	"search_text" "tsvector" DEFAULT ''::tsvector NOT NULL,
	"provenance" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'proposed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kb_entries_client_layer_ck" CHECK (((layer = 'client'::text) = (client_id IS NOT NULL))),
	CONSTRAINT "kb_entries_layer_ck" CHECK ("layer" IN ('global', 'stack', 'client')),
	CONSTRAINT "kb_entries_status_ck" CHECK ("status" IN ('proposed', 'approved', 'retired'))
);
--> statement-breakpoint
CREATE TABLE "kb_release_entries" (
	"kb_release" text NOT NULL,
	"kb_entry_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kb_release_entries_pkey" PRIMARY KEY("kb_release","kb_entry_id")
);
--> statement-breakpoint
CREATE TABLE "kb_releases" (
	"version" text PRIMARY KEY NOT NULL,
	"factory_commit" text NOT NULL,
	"approved_by" uuid NOT NULL,
	"approved_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"slug" text NOT NULL,
	"version" text NOT NULL,
	"layer" text NOT NULL,
	"type" text NOT NULL,
	"version_range" text,
	"content_sha256" text NOT NULL,
	"author" text NOT NULL,
	"source" text NOT NULL,
	"source_url" text,
	"factory_commit" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skills_slug_version_uq" UNIQUE("slug","version"),
	CONSTRAINT "skills_author_ck" CHECK ("author" IN ('you', 'import')),
	CONSTRAINT "skills_source_ck" CHECK ("source" IN ('upload', 'written', 'import')),
	CONSTRAINT "skills_status_ck" CHECK ("status" IN ('active', 'retired')),
	CONSTRAINT "skills_source_url_ck" CHECK (((source <> 'import'::text) OR (source_url IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"slug" text NOT NULL,
	"version" text NOT NULL,
	"package_key" text NOT NULL,
	"path" text NOT NULL,
	"scaffold_commit" text NOT NULL,
	"factory_commit" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"source_mission_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "templates_pkey" PRIMARY KEY("slug","version"),
	CONSTRAINT "templates_status_ck" CHECK ("status" IN ('active', 'retired'))
);
--> statement-breakpoint
CREATE TABLE "agent_configs" (
	"hash" text PRIMARY KEY NOT NULL,
	"factory_commit" text NOT NULL,
	"model" text NOT NULL,
	"model_snapshot" text NOT NULL,
	"effort" text NOT NULL,
	"sdk_version" text NOT NULL,
	"harness_version" text NOT NULL,
	"renderer_version" text NOT NULL,
	"selector_version" text NOT NULL,
	"agent_version_sha256" text NOT NULL,
	"skills_sha256" text NOT NULL,
	"rules_version" text NOT NULL,
	"kb_release" text NOT NULL,
	"tools" text[] DEFAULT '{}'::text[] NOT NULL,
	"cap_minutes" integer NOT NULL,
	"cap_micros" bigint NOT NULL,
	"max_turns" integer NOT NULL,
	"retry_protocol_version" text NOT NULL,
	"room_image_digest" text NOT NULL,
	"check_runner_digest" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eval_results" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"eval_run_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"config_hash" text NOT NULL,
	"repeat" integer NOT NULL,
	"passed_first" boolean NOT NULL,
	"passed_within_retries" boolean NOT NULL,
	"tokens" bigint NOT NULL,
	"cost_micros" bigint NOT NULL,
	"wall_ms" integer NOT NULL,
	"findings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"seeded_caught" boolean,
	"violations" integer DEFAULT 0 NOT NULL,
	"hidden_passed" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eval_runs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"baseline_config" text NOT NULL,
	"candidate_config" text NOT NULL,
	"grader_version" text NOT NULL,
	"stage" text NOT NULL,
	"aim" text NOT NULL,
	"set" text NOT NULL,
	"repeats" integer NOT NULL,
	"budget_micros" bigint NOT NULL,
	"state" text DEFAULT 'proposed' NOT NULL,
	"report" jsonb,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "eval_runs_stage_ck" CHECK ("stage" IN ('targeted', 'full')),
	CONSTRAINT "eval_runs_aim_ck" CHECK ("aim" IN ('improve', 'non_inferior')),
	CONSTRAINT "eval_runs_set_ck" CHECK ("set" IN ('dispatch', 'role', 'mission')),
	CONSTRAINT "eval_runs_state_ck" CHECK ("state" IN ('proposed', 'running', 'done', 'failed', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "eval_tasks" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"set" text NOT NULL,
	"role" text,
	"fixture_ref" text NOT NULL,
	"start_commit" text NOT NULL,
	"task_doc_hash" text NOT NULL,
	"lock_manifest_hash" text NOT NULL,
	"holdout" boolean DEFAULT false NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "eval_tasks_set_ck" CHECK ("set" IN ('dispatch', 'role', 'mission')),
	CONSTRAINT "eval_tasks_role_ck" CHECK (("role" IS NULL) OR ("role" IN ('build', 'test-unit', 'test-e2e', 'review-spec', 'review-security', 'red-team', 'ui-contract', 'review-frontend', 'review-a11y-perf', 'api-contract', 'review-backend'))),
	CONSTRAINT "eval_tasks_source_ck" CHECK ("source" IN ('synthetic', 'internal', 'replay'))
);
--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_passkeys" ADD CONSTRAINT "auth_passkeys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cli_sessions" ADD CONSTRAINT "cli_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_up_grants" ADD CONSTRAINT "step_up_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_traces" ADD CONSTRAINT "agent_traces_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_traces" ADD CONSTRAINT "agent_traces_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."onboarding_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_credential_id_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."credentials"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overrides" ADD CONSTRAINT "overrides_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overrides" ADD CONSTRAINT "overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overrides" ADD CONSTRAINT "overrides_gate_evaluation_fk" FOREIGN KEY ("mission_id","gate_evaluation_id","gate") REFERENCES "public"."gate_evaluations"("mission_id","id","gate") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overrides" ADD CONSTRAINT "overrides_dispatch_fk" FOREIGN KEY ("mission_id","dispatch_id") REFERENCES "public"."dispatches"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redactions" ADD CONSTRAINT "redactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redactions" ADD CONSTRAINT "redactions_step_up_grant_id_step_up_grants_id_fk" FOREIGN KEY ("step_up_grant_id") REFERENCES "public"."step_up_grants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_logins" ADD CONSTRAINT "device_logins_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_logins" ADD CONSTRAINT "device_logins_cli_session_id_cli_sessions_id_fk" FOREIGN KEY ("cli_session_id") REFERENCES "public"."cli_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkpoint_facts" ADD CONSTRAINT "checkpoint_facts_fact_fk" FOREIGN KEY ("mission_id","fact_id") REFERENCES "public"."facts"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkpoint_facts" ADD CONSTRAINT "checkpoint_facts_checkpoint_fk" FOREIGN KEY ("mission_id","checkpoint_id") REFERENCES "public"."checkpoints"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkpoints" ADD CONSTRAINT "checkpoints_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkpoints" ADD CONSTRAINT "checkpoints_session_fk" FOREIGN KEY ("mission_id","session_id") REFERENCES "public"."onboarding_sessions"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_refs" ADD CONSTRAINT "context_refs_session_fk" FOREIGN KEY ("mission_id","session_id") REFERENCES "public"."onboarding_sessions"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_refs" ADD CONSTRAINT "context_refs_upload_fk" FOREIGN KEY ("mission_id","upload_id") REFERENCES "public"."uploads"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facts" ADD CONSTRAINT "facts_session_fk" FOREIGN KEY ("mission_id","session_id") REFERENCES "public"."onboarding_sessions"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facts" ADD CONSTRAINT "facts_message_fk" FOREIGN KEY ("session_id","message_id") REFERENCES "public"."messages"("session_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facts" ADD CONSTRAINT "facts_upload_fk" FOREIGN KEY ("mission_id","upload_id") REFERENCES "public"."uploads"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facts" ADD CONSTRAINT "facts_supersedes_fk" FOREIGN KEY ("mission_id","supersedes_fact_id") REFERENCES "public"."facts"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_onboarding_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."onboarding_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_session_id_onboarding_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."onboarding_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_waivers" ADD CONSTRAINT "readiness_waivers_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_waivers" ADD CONSTRAINT "readiness_waivers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_waivers" ADD CONSTRAINT "readiness_waivers_session_fk" FOREIGN KEY ("mission_id","session_id") REFERENCES "public"."onboarding_sessions"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubric_results" ADD CONSTRAINT "rubric_results_checkpoint_id_checkpoints_id_fk" FOREIGN KEY ("checkpoint_id") REFERENCES "public"."checkpoints"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_coverage" ADD CONSTRAINT "topic_coverage_session_id_onboarding_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."onboarding_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_session_fk" FOREIGN KEY ("mission_id","session_id") REFERENCES "public"."onboarding_sessions"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_log" ADD CONSTRAINT "usage_log_session_id_onboarding_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."onboarding_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_factory_commit_factory_versions_sha_fk" FOREIGN KEY ("factory_commit") REFERENCES "public"."factory_versions"("sha") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checks" ADD CONSTRAINT "checks_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codebase_analysis" ADD CONSTRAINT "codebase_analysis_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_scenarios" ADD CONSTRAINT "mission_scenarios_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_scenarios" ADD CONSTRAINT "mission_scenarios_first_plan_fk" FOREIGN KEY ("mission_id","first_plan_id") REFERENCES "public"."plans"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_checks" ADD CONSTRAINT "module_checks_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_checks" ADD CONSTRAINT "module_checks_module_fk" FOREIGN KEY ("plan_id","plan_module_id") REFERENCES "public"."plan_modules"("plan_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_checks" ADD CONSTRAINT "module_checks_check_fk" FOREIGN KEY ("plan_id","check_id") REFERENCES "public"."checks"("plan_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_module_deps" ADD CONSTRAINT "plan_module_deps_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_module_deps" ADD CONSTRAINT "plan_module_deps_module_fk" FOREIGN KEY ("plan_id","plan_module_id") REFERENCES "public"."plan_modules"("plan_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_module_deps" ADD CONSTRAINT "plan_module_deps_depends_on_fk" FOREIGN KEY ("plan_id","depends_on_id") REFERENCES "public"."plan_modules"("plan_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_modules" ADD CONSTRAINT "plan_modules_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_session_fk" FOREIGN KEY ("mission_id","session_id") REFERENCES "public"."onboarding_sessions"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_proposal_fk" FOREIGN KEY ("mission_id","proposal_id") REFERENCES "public"."proposals"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_package_fk" FOREIGN KEY ("package_key","package_version") REFERENCES "public"."packages"("key","version") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_supersedes_fk" FOREIGN KEY ("mission_id","supersedes_plan_id") REFERENCES "public"."plans"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_template_fk" FOREIGN KEY ("template_slug","template_version") REFERENCES "public"."templates"("slug","version") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_targets" ADD CONSTRAINT "quality_targets_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_targets" ADD CONSTRAINT "quality_targets_module_fk" FOREIGN KEY ("plan_id","plan_module_id") REFERENCES "public"."plan_modules"("plan_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_targets" ADD CONSTRAINT "quality_targets_check_fk" FOREIGN KEY ("plan_id","check_id") REFERENCES "public"."checks"("plan_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_plan_fk" FOREIGN KEY ("mission_id","plan_id") REFERENCES "public"."plans"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_module_fk" FOREIGN KEY ("plan_id","plan_module_id") REFERENCES "public"."plan_modules"("plan_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_fact_fk" FOREIGN KEY ("mission_id","fact_id") REFERENCES "public"."facts"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_modules" ADD CONSTRAINT "scenario_modules_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_modules" ADD CONSTRAINT "scenario_modules_scenario_fk" FOREIGN KEY ("plan_id","scenario_id") REFERENCES "public"."scenarios"("plan_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_modules" ADD CONSTRAINT "scenario_modules_module_fk" FOREIGN KEY ("plan_id","plan_module_id") REFERENCES "public"."plan_modules"("plan_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_plan_fk" FOREIGN KEY ("mission_id","plan_id") REFERENCES "public"."plans"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_requirement_fk" FOREIGN KEY ("plan_id","requirement_id") REFERENCES "public"."requirements"("plan_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_mission_scenario_fk" FOREIGN KEY ("mission_id","ref") REFERENCES "public"."mission_scenarios"("mission_id","key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_check_fk" FOREIGN KEY ("plan_id","check_id") REFERENCES "public"."checks"("plan_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_module_run_fk" FOREIGN KEY ("mission_id","module_run_id") REFERENCES "public"."module_runs"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_plan_fk" FOREIGN KEY ("mission_id","plan_id") REFERENCES "public"."plans"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_task_doc_fk" FOREIGN KEY ("id","task_doc_version") REFERENCES "public"."task_docs"("dispatch_id","version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_checkpoint_fk" FOREIGN KEY ("mission_id","checkpoint_id") REFERENCES "public"."checkpoints"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_module_run_fk" FOREIGN KEY ("mission_id","module_run_id") REFERENCES "public"."module_runs"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_decided_by_attempt_fk" FOREIGN KEY ("mission_id","decided_by_attempt_id") REFERENCES "public"."attempts"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_docs" ADD CONSTRAINT "mission_docs_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_docs" ADD CONSTRAINT "mission_docs_plan_fk" FOREIGN KEY ("mission_id","plan_id") REFERENCES "public"."plans"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_pauses" ADD CONSTRAINT "mission_pauses_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_pauses" ADD CONSTRAINT "mission_pauses_paused_by_users_id_fk" FOREIGN KEY ("paused_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_pauses" ADD CONSTRAINT "mission_pauses_ended_by_users_id_fk" FOREIGN KEY ("ended_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_pauses" ADD CONSTRAINT "mission_pauses_proposal_fk" FOREIGN KEY ("mission_id","proposal_id") REFERENCES "public"."proposals"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_refreshes" ADD CONSTRAINT "mission_refreshes_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_refreshes" ADD CONSTRAINT "mission_refreshes_from_receipt_fk" FOREIGN KEY ("mission_id","from_receipt_id") REFERENCES "public"."receipts"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_refreshes" ADD CONSTRAINT "mission_refreshes_new_receipt_fk" FOREIGN KEY ("mission_id","new_receipt_id") REFERENCES "public"."receipts"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_refreshes" ADD CONSTRAINT "mission_refreshes_proposal_fk" FOREIGN KEY ("mission_id","proposal_id") REFERENCES "public"."proposals"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_factory_commit_factory_versions_sha_fk" FOREIGN KEY ("factory_commit") REFERENCES "public"."factory_versions"("sha") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_kb_release_kb_releases_version_fk" FOREIGN KEY ("kb_release") REFERENCES "public"."kb_releases"("version") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_rules_version_rules_versions_version_fk" FOREIGN KEY ("rules_version") REFERENCES "public"."rules_versions"("version") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_package_fk" FOREIGN KEY ("package_key","package_version") REFERENCES "public"."packages"("key","version") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_repo_connection_fk" FOREIGN KEY ("client_id","repo_connection_id") REFERENCES "public"."repo_connections"("client_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_current_plan_fk" FOREIGN KEY ("id","plan_id","plan_state") REFERENCES "public"."plans"("mission_id","id","state") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_client_kind_fk" FOREIGN KEY ("client_id","client_kind") REFERENCES "public"."clients"("id","kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_design_system_fk" FOREIGN KEY ("design_system_slug","design_system_version") REFERENCES "public"."design_systems"("slug","version") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_runs" ADD CONSTRAINT "module_runs_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_runs" ADD CONSTRAINT "module_runs_plan_fk" FOREIGN KEY ("mission_id","plan_id") REFERENCES "public"."plans"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_runs" ADD CONSTRAINT "module_runs_plan_module_fk" FOREIGN KEY ("plan_id","plan_module_id","ref") REFERENCES "public"."plan_modules"("plan_id","id","ref") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_findings" ADD CONSTRAINT "proposal_findings_proposal_fk" FOREIGN KEY ("mission_id","proposal_id") REFERENCES "public"."proposals"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_findings" ADD CONSTRAINT "proposal_findings_finding_fk" FOREIGN KEY ("mission_id","finding_id") REFERENCES "public"."findings"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_module_run_fk" FOREIGN KEY ("mission_id","module_run_id") REFERENCES "public"."module_runs"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_dispatch_fk" FOREIGN KEY ("mission_id","dispatch_id") REFERENCES "public"."dispatches"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_docs" ADD CONSTRAINT "task_docs_dispatch_fk" FOREIGN KEY ("mission_id","dispatch_id") REFERENCES "public"."dispatches"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_docs" ADD CONSTRAINT "task_docs_plan_fk" FOREIGN KEY ("mission_id","plan_id") REFERENCES "public"."plans"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dependency_requests" ADD CONSTRAINT "dependency_requests_dispatch_fk" FOREIGN KEY ("mission_id","dispatch_id") REFERENCES "public"."dispatches"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dependency_requests" ADD CONSTRAINT "dependency_requests_proposal_fk" FOREIGN KEY ("mission_id","proposal_id") REFERENCES "public"."proposals"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_commits" ADD CONSTRAINT "integration_commits_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_commits" ADD CONSTRAINT "integration_commits_module_run_fk" FOREIGN KEY ("mission_id","module_run_id") REFERENCES "public"."module_runs"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_commits" ADD CONSTRAINT "integration_commits_attempt_fk" FOREIGN KEY ("mission_id","attempt_id") REFERENCES "public"."attempts"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_commits" ADD CONSTRAINT "integration_commits_dependency_fk" FOREIGN KEY ("mission_id","dependency_request_id") REFERENCES "public"."dependency_requests"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locked_scripts" ADD CONSTRAINT "locked_scripts_module_run_id_module_runs_id_fk" FOREIGN KEY ("module_run_id") REFERENCES "public"."module_runs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quarantines" ADD CONSTRAINT "quarantines_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quarantines" ADD CONSTRAINT "quarantines_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quarantines" ADD CONSTRAINT "quarantines_scenario_fk" FOREIGN KEY ("mission_id","scenario_key") REFERENCES "public"."mission_scenarios"("mission_id","key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quarantines" ADD CONSTRAINT "quarantines_proposal_fk" FOREIGN KEY ("mission_id","proposal_id") REFERENCES "public"."proposals"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_locks" ADD CONSTRAINT "test_locks_module_run_fk" FOREIGN KEY ("mission_id","module_run_id") REFERENCES "public"."module_runs"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_locks" ADD CONSTRAINT "test_locks_scenario_fk" FOREIGN KEY ("mission_id","scenario_key") REFERENCES "public"."mission_scenarios"("mission_id","key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_locks" ADD CONSTRAINT "test_locks_integration_commit_fk" FOREIGN KEY ("mission_id","integration_commit_id") REFERENCES "public"."integration_commits"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_factory_commit_factory_versions_sha_fk" FOREIGN KEY ("factory_commit") REFERENCES "public"."factory_versions"("sha") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_dispatch_fk" FOREIGN KEY ("mission_id","dispatch_id") REFERENCES "public"."dispatches"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_task_doc_fk" FOREIGN KEY ("dispatch_id","task_doc_version") REFERENCES "public"."task_docs"("dispatch_id","version") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completion_reports" ADD CONSTRAINT "completion_reports_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_notes" ADD CONSTRAINT "progress_notes_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_loads" ADD CONSTRAINT "skill_loads_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_loads" ADD CONSTRAINT "skill_loads_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_dispatch_id_dispatches_id_fk" FOREIGN KEY ("dispatch_id") REFERENCES "public"."dispatches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_session_id_onboarding_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."onboarding_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_attempt_fk" FOREIGN KEY ("dispatch_id","attempt_id") REFERENCES "public"."attempts"("dispatch_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_dispatch_fk" FOREIGN KEY ("mission_id","dispatch_id") REFERENCES "public"."dispatches"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_attempt_fk" FOREIGN KEY ("dispatch_id","attempt_id") REFERENCES "public"."attempts"("dispatch_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_integration_commit_fk" FOREIGN KEY ("mission_id","integration_commit_id") REFERENCES "public"."integration_commits"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_reservations" ADD CONSTRAINT "budget_reservations_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_reservations" ADD CONSTRAINT "budget_reservations_module_run_fk" FOREIGN KEY ("mission_id","module_run_id") REFERENCES "public"."module_runs"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_reservations" ADD CONSTRAINT "budget_reservations_dispatch_fk" FOREIGN KEY ("mission_id","dispatch_id") REFERENCES "public"."dispatches"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_reservations" ADD CONSTRAINT "budget_reservations_dispatch_module_fk" FOREIGN KEY ("dispatch_id","module_run_id") REFERENCES "public"."dispatches"("id","module_run_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_reservations" ADD CONSTRAINT "budget_reservations_attempt_fk" FOREIGN KEY ("dispatch_id","attempt_id") REFERENCES "public"."attempts"("dispatch_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_reservations" ADD CONSTRAINT "budget_reservations_session_fk" FOREIGN KEY ("mission_id","session_id") REFERENCES "public"."onboarding_sessions"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_time" ADD CONSTRAINT "human_time_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_time" ADD CONSTRAINT "human_time_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_time" ADD CONSTRAINT "human_time_dispatch_fk" FOREIGN KEY ("mission_id","dispatch_id") REFERENCES "public"."dispatches"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_results" ADD CONSTRAINT "check_results_gate_evaluation_fk" FOREIGN KEY ("mission_id","gate_evaluation_id") REFERENCES "public"."gate_evaluations"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_results" ADD CONSTRAINT "check_results_plan_fk" FOREIGN KEY ("mission_id","plan_id") REFERENCES "public"."plans"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_results" ADD CONSTRAINT "check_results_scenario_fk" FOREIGN KEY ("mission_id","scenario_key") REFERENCES "public"."mission_scenarios"("mission_id","key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_results" ADD CONSTRAINT "check_results_check_fk" FOREIGN KEY ("plan_id","check_id") REFERENCES "public"."checks"("plan_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_evaluations" ADD CONSTRAINT "gate_evaluations_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_evaluations" ADD CONSTRAINT "gate_evaluations_module_run_fk" FOREIGN KEY ("mission_id","module_run_id") REFERENCES "public"."module_runs"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_evaluations" ADD CONSTRAINT "gate_evaluations_integration_commit_fk" FOREIGN KEY ("mission_id","integration_commit_id") REFERENCES "public"."integration_commits"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_evaluations" ADD CONSTRAINT "gate_evaluations_attempt_fk" FOREIGN KEY ("mission_id","attempt_id") REFERENCES "public"."attempts"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_evaluations" ADD CONSTRAINT "gate_evaluations_gate_run_fk" FOREIGN KEY ("mission_id","gate_run_id") REFERENCES "public"."gate_runs"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_runs" ADD CONSTRAINT "gate_runs_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_runs" ADD CONSTRAINT "gate_runs_plan_fk" FOREIGN KEY ("mission_id","plan_id") REFERENCES "public"."plans"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pass_approvals" ADD CONSTRAINT "pass_approvals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pass_approvals" ADD CONSTRAINT "pass_approvals_receipt_hash_fk" FOREIGN KEY ("receipt_id","receipt_hash") REFERENCES "public"."receipts"("id","hash") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pass_approvals" ADD CONSTRAINT "pass_approvals_receipt_verdict_fk" FOREIGN KEY ("receipt_id","receipt_verdict") REFERENCES "public"."receipts"("id","verdict") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_factory_commit_factory_versions_sha_fk" FOREIGN KEY ("factory_commit") REFERENCES "public"."factory_versions"("sha") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_gate_run_fk" FOREIGN KEY ("mission_id","gate_run_id") REFERENCES "public"."gate_runs"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_approvals" ADD CONSTRAINT "release_approvals_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_approvals" ADD CONSTRAINT "release_approvals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_approvals" ADD CONSTRAINT "release_approvals_receipt_fk" FOREIGN KEY ("mission_id","receipt_id") REFERENCES "public"."receipts"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_approvals" ADD CONSTRAINT "release_approvals_receipt_hash_fk" FOREIGN KEY ("receipt_id","receipt_hash") REFERENCES "public"."receipts"("id","hash") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_approvals" ADD CONSTRAINT "release_approvals_receipt_verdict_fk" FOREIGN KEY ("receipt_id","receipt_verdict") REFERENCES "public"."receipts"("id","verdict") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_approvals" ADD CONSTRAINT "release_approvals_pass_approval_fk" FOREIGN KEY ("pass_approval_id","receipt_id") REFERENCES "public"."pass_approvals"("id","receipt_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_repo_connection_id_repo_connections_id_fk" FOREIGN KEY ("repo_connection_id") REFERENCES "public"."repo_connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_release_approval_fk" FOREIGN KEY ("release_approval_id","receipt_id") REFERENCES "public"."release_approvals"("id","receipt_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_receipt_fk" FOREIGN KEY ("mission_id","receipt_id") REFERENCES "public"."receipts"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repo_connections" ADD CONSTRAINT "repo_connections_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repo_connections" ADD CONSTRAINT "repo_connections_read_secret_fk" FOREIGN KEY ("client_id","read_secret_id") REFERENCES "public"."secrets"("client_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repo_connections" ADD CONSTRAINT "repo_connections_write_secret_fk" FOREIGN KEY ("client_id","write_secret_id") REFERENCES "public"."secrets"("client_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "secrets" ADD CONSTRAINT "secrets_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "secrets" ADD CONSTRAINT "secrets_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rules" ADD CONSTRAINT "rules_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rules_version_rules" ADD CONSTRAINT "rules_version_rules_rules_version_rules_versions_version_fk" FOREIGN KEY ("rules_version") REFERENCES "public"."rules_versions"("version") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rules_version_rules" ADD CONSTRAINT "rules_version_rules_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rules_versions" ADD CONSTRAINT "rules_versions_factory_commit_factory_versions_sha_fk" FOREIGN KEY ("factory_commit") REFERENCES "public"."factory_versions"("sha") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "closeout_items" ADD CONSTRAINT "closeout_items_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "closeout_items" ADD CONSTRAINT "closeout_items_finding_fk" FOREIGN KEY ("mission_id","finding_id") REFERENCES "public"."findings"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "closeout_items" ADD CONSTRAINT "closeout_items_module_run_fk" FOREIGN KEY ("mission_id","module_run_id") REFERENCES "public"."module_runs"("mission_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_systems" ADD CONSTRAINT "design_systems_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_systems" ADD CONSTRAINT "design_systems_factory_commit_factory_versions_sha_fk" FOREIGN KEY ("factory_commit") REFERENCES "public"."factory_versions"("sha") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factory_versions" ADD CONSTRAINT "factory_versions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_entries" ADD CONSTRAINT "kb_entries_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_release_entries" ADD CONSTRAINT "kb_release_entries_kb_release_kb_releases_version_fk" FOREIGN KEY ("kb_release") REFERENCES "public"."kb_releases"("version") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_release_entries" ADD CONSTRAINT "kb_release_entries_kb_entry_id_kb_entries_id_fk" FOREIGN KEY ("kb_entry_id") REFERENCES "public"."kb_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_releases" ADD CONSTRAINT "kb_releases_factory_commit_factory_versions_sha_fk" FOREIGN KEY ("factory_commit") REFERENCES "public"."factory_versions"("sha") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_releases" ADD CONSTRAINT "kb_releases_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_factory_commit_factory_versions_sha_fk" FOREIGN KEY ("factory_commit") REFERENCES "public"."factory_versions"("sha") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_factory_commit_factory_versions_sha_fk" FOREIGN KEY ("factory_commit") REFERENCES "public"."factory_versions"("sha") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_source_mission_id_missions_id_fk" FOREIGN KEY ("source_mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_configs" ADD CONSTRAINT "agent_configs_factory_commit_factory_versions_sha_fk" FOREIGN KEY ("factory_commit") REFERENCES "public"."factory_versions"("sha") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eval_results" ADD CONSTRAINT "eval_results_eval_run_id_eval_runs_id_fk" FOREIGN KEY ("eval_run_id") REFERENCES "public"."eval_runs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eval_results" ADD CONSTRAINT "eval_results_task_id_eval_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."eval_tasks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eval_results" ADD CONSTRAINT "eval_results_config_hash_agent_configs_hash_fk" FOREIGN KEY ("config_hash") REFERENCES "public"."agent_configs"("hash") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eval_runs" ADD CONSTRAINT "eval_runs_baseline_config_agent_configs_hash_fk" FOREIGN KEY ("baseline_config") REFERENCES "public"."agent_configs"("hash") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eval_runs" ADD CONSTRAINT "eval_runs_candidate_config_agent_configs_hash_fk" FOREIGN KEY ("candidate_config") REFERENCES "public"."agent_configs"("hash") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eval_runs" ADD CONSTRAINT "eval_runs_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_accounts_user_id_ix" ON "auth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_passkeys_user_id_ix" ON "auth_passkeys" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_token_uq" ON "auth_sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_id_ix" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cli_sessions_user_id_ix" ON "cli_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idempotency_keys_purge_ix" ON "idempotency_keys" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_one_live_key_uq" ON "jobs" USING btree ("key") WHERE (state = ANY (ARRAY['queued'::text, 'claimed'::text]));--> statement-breakpoint
CREATE INDEX "jobs_claimable_ix" ON "jobs" USING btree ("run_after") WHERE (state = 'queued'::text);--> statement-breakpoint
CREATE INDEX "jobs_expired_claims_ix" ON "jobs" USING btree ("claim_expires_at") WHERE (state = 'claimed'::text);--> statement-breakpoint
CREATE INDEX "jobs_purge_ix" ON "jobs" USING btree ("finished_at") WHERE (state = ANY (ARRAY['done'::text, 'dead'::text]));--> statement-breakpoint
CREATE INDEX "step_up_grants_user_id_ix" ON "step_up_grants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "step_up_grants_purge_ix" ON "step_up_grants" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_purge_ix" ON "webhook_deliveries" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "agent_traces_attempt_ix" ON "agent_traces" USING btree ("attempt_id","trace_seq");--> statement-breakpoint
CREATE INDEX "agent_traces_session_ix" ON "agent_traces" USING btree ("session_id","trace_seq");--> statement-breakpoint
CREATE INDEX "events_mission_seq_ix" ON "events" USING btree ("mission_id","seq");--> statement-breakpoint
CREATE INDEX "activity_log_user_id_ix" ON "activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_log_credential_id_ix" ON "activity_log" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "overrides_user_id_ix" ON "overrides" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "overrides_gate_evaluation_ix" ON "overrides" USING btree ("mission_id","gate_evaluation_id","gate");--> statement-breakpoint
CREATE INDEX "overrides_dispatch_ix" ON "overrides" USING btree ("mission_id","dispatch_id");--> statement-breakpoint
CREATE INDEX "redactions_user_id_ix" ON "redactions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "device_logins_pending_user_code_uq" ON "device_logins" USING btree ("user_code") WHERE (state = 'pending'::text);--> statement-breakpoint
CREATE INDEX "device_logins_approved_by_ix" ON "device_logins" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "device_logins_cli_session_id_ix" ON "device_logins" USING btree ("cli_session_id");--> statement-breakpoint
CREATE INDEX "device_logins_purge_ix" ON "device_logins" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "checkpoint_facts_checkpoint_ix" ON "checkpoint_facts" USING btree ("mission_id","checkpoint_id");--> statement-breakpoint
CREATE INDEX "checkpoint_facts_fact_ix" ON "checkpoint_facts" USING btree ("mission_id","fact_id");--> statement-breakpoint
CREATE INDEX "checkpoints_session_ix" ON "checkpoints" USING btree ("mission_id","session_id");--> statement-breakpoint
CREATE INDEX "checkpoints_approved_by_ix" ON "checkpoints" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "checkpoints_drafts_ix" ON "checkpoints" USING btree ("session_id") WHERE (state = 'draft'::text);--> statement-breakpoint
CREATE UNIQUE INDEX "clients_one_internal_uq" ON "clients" USING btree ("kind") WHERE (kind = 'internal'::text);--> statement-breakpoint
CREATE INDEX "context_refs_session_ix" ON "context_refs" USING btree ("mission_id","session_id");--> statement-breakpoint
CREATE INDEX "context_refs_upload_ix" ON "context_refs" USING btree ("mission_id","upload_id");--> statement-breakpoint
CREATE INDEX "facts_session_ix" ON "facts" USING btree ("mission_id","session_id");--> statement-breakpoint
CREATE INDEX "facts_message_ix" ON "facts" USING btree ("session_id","message_id");--> statement-breakpoint
CREATE INDEX "facts_upload_ix" ON "facts" USING btree ("mission_id","upload_id");--> statement-breakpoint
CREATE INDEX "facts_supersedes_ix" ON "facts" USING btree ("mission_id","supersedes_fact_id");--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_sessions_one_live_uq" ON "onboarding_sessions" USING btree ("mission_id") WHERE (status = ANY (ARRAY['active'::text, 'paused'::text, 'context_blocked'::text]));--> statement-breakpoint
CREATE INDEX "questions_session_id_ix" ON "questions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "readiness_waivers_session_ix" ON "readiness_waivers" USING btree ("mission_id","session_id");--> statement-breakpoint
CREATE INDEX "readiness_waivers_user_id_ix" ON "readiness_waivers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "uploads_session_ix" ON "uploads" USING btree ("mission_id","session_id");--> statement-breakpoint
CREATE INDEX "usage_log_session_id_ix" ON "usage_log" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "packages_factory_commit_ix" ON "packages" USING btree ("factory_commit");--> statement-breakpoint
CREATE INDEX "mission_scenarios_first_plan_ix" ON "mission_scenarios" USING btree ("mission_id","first_plan_id");--> statement-breakpoint
CREATE INDEX "module_checks_module_ix" ON "module_checks" USING btree ("plan_id","plan_module_id");--> statement-breakpoint
CREATE INDEX "module_checks_check_ix" ON "module_checks" USING btree ("plan_id","check_id");--> statement-breakpoint
CREATE INDEX "plan_module_deps_module_ix" ON "plan_module_deps" USING btree ("plan_id","plan_module_id");--> statement-breakpoint
CREATE INDEX "plan_module_deps_depends_on_ix" ON "plan_module_deps" USING btree ("plan_id","depends_on_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plans_one_approved_uq" ON "plans" USING btree ("mission_id") WHERE (state = 'approved'::text);--> statement-breakpoint
CREATE UNIQUE INDEX "plans_one_draft_uq" ON "plans" USING btree ("mission_id") WHERE (state = 'draft'::text);--> statement-breakpoint
CREATE INDEX "plans_session_ix" ON "plans" USING btree ("mission_id","session_id");--> statement-breakpoint
CREATE INDEX "plans_proposal_ix" ON "plans" USING btree ("mission_id","proposal_id");--> statement-breakpoint
CREATE INDEX "plans_package_ix" ON "plans" USING btree ("package_key","package_version");--> statement-breakpoint
CREATE INDEX "plans_supersedes_ix" ON "plans" USING btree ("mission_id","supersedes_plan_id");--> statement-breakpoint
CREATE INDEX "plans_template_ix" ON "plans" USING btree ("template_slug","template_version");--> statement-breakpoint
CREATE INDEX "plans_approved_by_ix" ON "plans" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "quality_targets_module_ix" ON "quality_targets" USING btree ("plan_id","plan_module_id");--> statement-breakpoint
CREATE INDEX "quality_targets_check_ix" ON "quality_targets" USING btree ("plan_id","check_id");--> statement-breakpoint
CREATE INDEX "requirements_plan_ix" ON "requirements" USING btree ("mission_id","plan_id");--> statement-breakpoint
CREATE INDEX "requirements_module_ix" ON "requirements" USING btree ("plan_id","plan_module_id");--> statement-breakpoint
CREATE INDEX "requirements_fact_ix" ON "requirements" USING btree ("mission_id","fact_id");--> statement-breakpoint
CREATE INDEX "scenario_modules_scenario_ix" ON "scenario_modules" USING btree ("plan_id","scenario_id");--> statement-breakpoint
CREATE INDEX "scenario_modules_module_ix" ON "scenario_modules" USING btree ("plan_id","plan_module_id");--> statement-breakpoint
CREATE INDEX "scenarios_plan_ix" ON "scenarios" USING btree ("mission_id","plan_id");--> statement-breakpoint
CREATE INDEX "scenarios_requirement_ix" ON "scenarios" USING btree ("plan_id","requirement_id");--> statement-breakpoint
CREATE INDEX "scenarios_mission_scenario_ix" ON "scenarios" USING btree ("mission_id","ref");--> statement-breakpoint
CREATE INDEX "scenarios_check_ix" ON "scenarios" USING btree ("plan_id","check_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dispatches_module_role_pass_uq" ON "dispatches" USING btree ("module_run_id","role","pass") WHERE (module_run_id IS NOT NULL);--> statement-breakpoint
CREATE UNIQUE INDEX "dispatches_mission_role_pass_uq" ON "dispatches" USING btree ("mission_id","role","pass") WHERE (module_run_id IS NULL);--> statement-breakpoint
CREATE INDEX "dispatches_module_run_ix" ON "dispatches" USING btree ("mission_id","module_run_id");--> statement-breakpoint
CREATE INDEX "dispatches_plan_ix" ON "dispatches" USING btree ("mission_id","plan_id");--> statement-breakpoint
CREATE INDEX "dispatches_claimable_ix" ON "dispatches" USING btree ("mission_id","state") WHERE (state = ANY (ARRAY['pending'::text, 'ready'::text]));--> statement-breakpoint
CREATE INDEX "findings_checkpoint_ix" ON "findings" USING btree ("mission_id","checkpoint_id");--> statement-breakpoint
CREATE INDEX "findings_module_run_ix" ON "findings" USING btree ("mission_id","module_run_id");--> statement-breakpoint
CREATE INDEX "findings_decided_by_user_ix" ON "findings" USING btree ("decided_by_user_id");--> statement-breakpoint
CREATE INDEX "findings_decided_by_attempt_ix" ON "findings" USING btree ("mission_id","decided_by_attempt_id");--> statement-breakpoint
CREATE INDEX "findings_pending_ix" ON "findings" USING btree ("mission_id") WHERE (state = ANY (ARRAY['triage'::text, 'disputed'::text]));--> statement-breakpoint
CREATE INDEX "mission_docs_plan_ix" ON "mission_docs" USING btree ("mission_id","plan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mission_pauses_open_proposal_uq" ON "mission_pauses" USING btree ("proposal_id") WHERE (ended_at IS NULL);--> statement-breakpoint
CREATE UNIQUE INDEX "mission_pauses_open_operator_uq" ON "mission_pauses" USING btree ("mission_id") WHERE ((ended_at IS NULL) AND (kind = 'operator'::text));--> statement-breakpoint
CREATE UNIQUE INDEX "mission_pauses_open_budget_uq" ON "mission_pauses" USING btree ("mission_id") WHERE ((ended_at IS NULL) AND (kind = 'budget'::text));--> statement-breakpoint
CREATE INDEX "mission_pauses_open_ix" ON "mission_pauses" USING btree ("mission_id") WHERE (ended_at IS NULL);--> statement-breakpoint
CREATE INDEX "mission_pauses_proposal_ix" ON "mission_pauses" USING btree ("mission_id","proposal_id");--> statement-breakpoint
CREATE INDEX "mission_pauses_paused_by_ix" ON "mission_pauses" USING btree ("paused_by");--> statement-breakpoint
CREATE INDEX "mission_pauses_ended_by_ix" ON "mission_pauses" USING btree ("ended_by");--> statement-breakpoint
CREATE UNIQUE INDEX "mission_refreshes_one_running_uq" ON "mission_refreshes" USING btree ("mission_id") WHERE (state = 'running'::text);--> statement-breakpoint
CREATE INDEX "mission_refreshes_from_receipt_ix" ON "mission_refreshes" USING btree ("mission_id","from_receipt_id");--> statement-breakpoint
CREATE INDEX "mission_refreshes_new_receipt_ix" ON "mission_refreshes" USING btree ("mission_id","new_receipt_id");--> statement-breakpoint
CREATE INDEX "mission_refreshes_proposal_ix" ON "mission_refreshes" USING btree ("mission_id","proposal_id");--> statement-breakpoint
CREATE INDEX "missions_client_id_ix" ON "missions" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "missions_state_ix" ON "missions" USING btree ("state");--> statement-breakpoint
CREATE INDEX "missions_awaiting_release_ix" ON "missions" USING btree ("state") WHERE (state = 'awaiting_release'::text);--> statement-breakpoint
CREATE INDEX "missions_package_ix" ON "missions" USING btree ("package_key","package_version");--> statement-breakpoint
CREATE INDEX "missions_repo_connection_ix" ON "missions" USING btree ("client_id","repo_connection_id");--> statement-breakpoint
CREATE INDEX "missions_factory_commit_ix" ON "missions" USING btree ("factory_commit");--> statement-breakpoint
CREATE INDEX "missions_kb_release_ix" ON "missions" USING btree ("kb_release");--> statement-breakpoint
CREATE INDEX "missions_rules_version_ix" ON "missions" USING btree ("rules_version");--> statement-breakpoint
CREATE INDEX "missions_client_kind_ix" ON "missions" USING btree ("client_id","client_kind");--> statement-breakpoint
CREATE INDEX "missions_design_system_ix" ON "missions" USING btree ("design_system_slug","design_system_version");--> statement-breakpoint
CREATE INDEX "module_runs_plan_ix" ON "module_runs" USING btree ("mission_id","plan_id");--> statement-breakpoint
CREATE INDEX "module_runs_plan_module_ix" ON "module_runs" USING btree ("plan_id","plan_module_id","ref");--> statement-breakpoint
CREATE INDEX "module_runs_to_advance_ix" ON "module_runs" USING btree ("mission_id","state") WHERE (state <> ALL (ARRAY['landed'::text, 'parked'::text]));--> statement-breakpoint
CREATE INDEX "notes_mission_id_ix" ON "notes" USING btree ("mission_id");--> statement-breakpoint
CREATE INDEX "notes_user_id_ix" ON "notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "proposal_findings_proposal_ix" ON "proposal_findings" USING btree ("mission_id","proposal_id");--> statement-breakpoint
CREATE INDEX "proposal_findings_finding_ix" ON "proposal_findings" USING btree ("mission_id","finding_id");--> statement-breakpoint
CREATE UNIQUE INDEX "proposals_open_module_uq" ON "proposals" USING btree ("module_run_id","kind","subject_key") WHERE ((state = 'open'::text) AND (module_run_id IS NOT NULL));--> statement-breakpoint
CREATE UNIQUE INDEX "proposals_open_mission_uq" ON "proposals" USING btree ("mission_id","kind","subject_key") WHERE ((state = 'open'::text) AND (module_run_id IS NULL));--> statement-breakpoint
CREATE INDEX "proposals_module_run_ix" ON "proposals" USING btree ("mission_id","module_run_id");--> statement-breakpoint
CREATE INDEX "proposals_dispatch_ix" ON "proposals" USING btree ("mission_id","dispatch_id");--> statement-breakpoint
CREATE INDEX "proposals_resolved_by_ix" ON "proposals" USING btree ("resolved_by");--> statement-breakpoint
CREATE INDEX "proposals_pending_ix" ON "proposals" USING btree ("mission_id") WHERE (state = 'open'::text);--> statement-breakpoint
CREATE INDEX "proposals_expiring_ix" ON "proposals" USING btree ("expires_at") WHERE (state = 'open'::text);--> statement-breakpoint
CREATE INDEX "task_docs_dispatch_ix" ON "task_docs" USING btree ("mission_id","dispatch_id");--> statement-breakpoint
CREATE INDEX "task_docs_plan_ix" ON "task_docs" USING btree ("mission_id","plan_id");--> statement-breakpoint
CREATE INDEX "dependency_requests_dispatch_ix" ON "dependency_requests" USING btree ("mission_id","dispatch_id");--> statement-breakpoint
CREATE INDEX "dependency_requests_proposal_ix" ON "dependency_requests" USING btree ("mission_id","proposal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "integration_commits_one_testing_uq" ON "integration_commits" USING btree ("mission_id") WHERE (state = 'testing'::text);--> statement-breakpoint
CREATE UNIQUE INDEX "integration_commits_one_in_flight_uq" ON "integration_commits" USING btree ("module_run_id") WHERE (state = ANY (ARRAY['queued'::text, 'testing'::text]));--> statement-breakpoint
CREATE INDEX "integration_commits_module_run_ix" ON "integration_commits" USING btree ("mission_id","module_run_id");--> statement-breakpoint
CREATE INDEX "integration_commits_attempt_ix" ON "integration_commits" USING btree ("mission_id","attempt_id");--> statement-breakpoint
CREATE INDEX "integration_commits_dependency_ix" ON "integration_commits" USING btree ("mission_id","dependency_request_id");--> statement-breakpoint
CREATE INDEX "integration_commits_queue_ix" ON "integration_commits" USING btree ("mission_id","queued_at") WHERE (state = ANY (ARRAY['queued'::text, 'testing'::text]));--> statement-breakpoint
CREATE UNIQUE INDEX "quarantines_one_open_uq" ON "quarantines" USING btree ("mission_id","test_path") WHERE (ended_at IS NULL);--> statement-breakpoint
CREATE INDEX "quarantines_scenario_ix" ON "quarantines" USING btree ("mission_id","scenario_key");--> statement-breakpoint
CREATE INDEX "quarantines_proposal_ix" ON "quarantines" USING btree ("mission_id","proposal_id");--> statement-breakpoint
CREATE INDEX "quarantines_approved_by_ix" ON "quarantines" USING btree ("approved_by");--> statement-breakpoint
CREATE UNIQUE INDEX "test_locks_one_active_uq" ON "test_locks" USING btree ("module_run_id","path") WHERE (released_at IS NULL);--> statement-breakpoint
CREATE INDEX "test_locks_module_run_ix" ON "test_locks" USING btree ("mission_id","module_run_id");--> statement-breakpoint
CREATE INDEX "test_locks_scenario_ix" ON "test_locks" USING btree ("mission_id","scenario_key");--> statement-breakpoint
CREATE INDEX "test_locks_integration_commit_ix" ON "test_locks" USING btree ("mission_id","integration_commit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attempts_one_running_uq" ON "attempts" USING btree ("dispatch_id") WHERE (outcome IS NULL);--> statement-breakpoint
CREATE INDEX "attempts_dispatch_ix" ON "attempts" USING btree ("mission_id","dispatch_id");--> statement-breakpoint
CREATE INDEX "attempts_task_doc_ix" ON "attempts" USING btree ("dispatch_id","task_doc_version");--> statement-breakpoint
CREATE INDEX "attempts_factory_commit_ix" ON "attempts" USING btree ("factory_commit");--> statement-breakpoint
CREATE INDEX "progress_notes_attempt_id_ix" ON "progress_notes" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "skill_loads_skill_id_ix" ON "skill_loads" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "credentials_attempt_ix" ON "credentials" USING btree ("dispatch_id","attempt_id");--> statement-breakpoint
CREATE INDEX "credentials_session_id_ix" ON "credentials" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "credentials_to_revoke_ix" ON "credentials" USING btree ("expires_at") WHERE (revoked_at IS NULL);--> statement-breakpoint
CREATE INDEX "rooms_dispatch_ix" ON "rooms" USING btree ("mission_id","dispatch_id");--> statement-breakpoint
CREATE INDEX "rooms_attempt_ix" ON "rooms" USING btree ("dispatch_id","attempt_id");--> statement-breakpoint
CREATE INDEX "rooms_integration_commit_ix" ON "rooms" USING btree ("mission_id","integration_commit_id");--> statement-breakpoint
CREATE INDEX "rooms_alive_ix" ON "rooms" USING btree ("state") WHERE (state <> 'destroyed'::text);--> statement-breakpoint
CREATE UNIQUE INDEX "budget_reservations_attempt_request_uq" ON "budget_reservations" USING btree ("attempt_id","request_id") WHERE ((request_id IS NOT NULL) AND (attempt_id IS NOT NULL));--> statement-breakpoint
CREATE UNIQUE INDEX "budget_reservations_session_request_uq" ON "budget_reservations" USING btree ("session_id","request_id") WHERE ((request_id IS NOT NULL) AND (session_id IS NOT NULL));--> statement-breakpoint
CREATE INDEX "budget_reservations_module_run_ix" ON "budget_reservations" USING btree ("mission_id","module_run_id");--> statement-breakpoint
CREATE INDEX "budget_reservations_dispatch_ix" ON "budget_reservations" USING btree ("mission_id","dispatch_id");--> statement-breakpoint
CREATE INDEX "budget_reservations_dispatch_module_ix" ON "budget_reservations" USING btree ("dispatch_id","module_run_id");--> statement-breakpoint
CREATE INDEX "budget_reservations_attempt_ix" ON "budget_reservations" USING btree ("dispatch_id","attempt_id");--> statement-breakpoint
CREATE INDEX "budget_reservations_session_ix" ON "budget_reservations" USING btree ("mission_id","session_id");--> statement-breakpoint
CREATE INDEX "budget_reservations_held_attempt_ix" ON "budget_reservations" USING btree ("attempt_id") WHERE (state = 'held'::text);--> statement-breakpoint
CREATE INDEX "budget_reservations_held_dispatch_ix" ON "budget_reservations" USING btree ("dispatch_id") WHERE (state = 'held'::text);--> statement-breakpoint
CREATE INDEX "budget_reservations_held_session_ix" ON "budget_reservations" USING btree ("session_id") WHERE (state = 'held'::text);--> statement-breakpoint
CREATE INDEX "human_time_user_id_ix" ON "human_time" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "human_time_dispatch_ix" ON "human_time" USING btree ("mission_id","dispatch_id");--> statement-breakpoint
CREATE INDEX "human_time_drafts_ix" ON "human_time" USING btree ("user_id") WHERE (state = 'draft'::text);--> statement-breakpoint
CREATE INDEX "payments_mission_id_ix" ON "payments" USING btree ("mission_id");--> statement-breakpoint
CREATE INDEX "payments_recorded_by_ix" ON "payments" USING btree ("recorded_by");--> statement-breakpoint
CREATE INDEX "check_results_gate_evaluation_ix" ON "check_results" USING btree ("mission_id","gate_evaluation_id");--> statement-breakpoint
CREATE INDEX "check_results_plan_ix" ON "check_results" USING btree ("mission_id","plan_id");--> statement-breakpoint
CREATE INDEX "check_results_scenario_ix" ON "check_results" USING btree ("mission_id","scenario_key");--> statement-breakpoint
CREATE INDEX "check_results_check_ix" ON "check_results" USING btree ("plan_id","check_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gate_evaluations_gate2_uq" ON "gate_evaluations" USING btree ("integration_commit_id") WHERE (gate = 2);--> statement-breakpoint
CREATE UNIQUE INDEX "gate_evaluations_gate3_uq" ON "gate_evaluations" USING btree ("attempt_id") WHERE (gate = 3);--> statement-breakpoint
CREATE UNIQUE INDEX "gate_evaluations_gate5_uq" ON "gate_evaluations" USING btree ("gate_run_id") WHERE (gate = 5);--> statement-breakpoint
CREATE INDEX "gate_evaluations_module_run_ix" ON "gate_evaluations" USING btree ("mission_id","module_run_id");--> statement-breakpoint
CREATE INDEX "gate_evaluations_integration_commit_ix" ON "gate_evaluations" USING btree ("mission_id","integration_commit_id");--> statement-breakpoint
CREATE INDEX "gate_evaluations_attempt_ix" ON "gate_evaluations" USING btree ("mission_id","attempt_id");--> statement-breakpoint
CREATE INDEX "gate_evaluations_gate_run_ix" ON "gate_evaluations" USING btree ("mission_id","gate_run_id");--> statement-breakpoint
CREATE INDEX "gate_evaluations_at_commit_ix" ON "gate_evaluations" USING btree ("mission_id","commit_sha","gate");--> statement-breakpoint
CREATE UNIQUE INDEX "gate_runs_one_running_uq" ON "gate_runs" USING btree ("mission_id") WHERE (state = 'running'::text);--> statement-breakpoint
CREATE INDEX "gate_runs_plan_ix" ON "gate_runs" USING btree ("mission_id","plan_id");--> statement-breakpoint
CREATE INDEX "pass_approvals_user_id_ix" ON "pass_approvals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "receipts_gate_run_ix" ON "receipts" USING btree ("mission_id","gate_run_id");--> statement-breakpoint
CREATE INDEX "receipts_factory_commit_ix" ON "receipts" USING btree ("factory_commit");--> statement-breakpoint
CREATE INDEX "release_approvals_receipt_ix" ON "release_approvals" USING btree ("mission_id","receipt_id");--> statement-breakpoint
CREATE INDEX "release_approvals_pass_approval_ix" ON "release_approvals" USING btree ("pass_approval_id","receipt_id");--> statement-breakpoint
CREATE INDEX "release_approvals_user_id_ix" ON "release_approvals" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "deliveries_one_pending_uq" ON "deliveries" USING btree ("mission_id") WHERE (state = 'pending'::text);--> statement-breakpoint
CREATE INDEX "deliveries_release_approval_ix" ON "deliveries" USING btree ("release_approval_id","receipt_id");--> statement-breakpoint
CREATE INDEX "deliveries_receipt_ix" ON "deliveries" USING btree ("mission_id","receipt_id");--> statement-breakpoint
CREATE INDEX "deliveries_repo_connection_id_ix" ON "deliveries" USING btree ("repo_connection_id");--> statement-breakpoint
CREATE UNIQUE INDEX "repo_connections_one_active_uq" ON "repo_connections" USING btree ("client_id") WHERE (state = 'active'::text);--> statement-breakpoint
CREATE INDEX "repo_connections_read_secret_ix" ON "repo_connections" USING btree ("client_id","read_secret_id");--> statement-breakpoint
CREATE INDEX "repo_connections_write_secret_ix" ON "repo_connections" USING btree ("client_id","write_secret_id");--> statement-breakpoint
CREATE INDEX "repo_connections_repos_gin" ON "repo_connections" USING gin ("repos");--> statement-breakpoint
CREATE UNIQUE INDEX "secrets_client_name_uq" ON "secrets" USING btree ("client_id","name") WHERE ((state = 'active'::text) AND (client_id IS NOT NULL));--> statement-breakpoint
CREATE UNIQUE INDEX "secrets_mission_name_uq" ON "secrets" USING btree ("mission_id","name") WHERE ((state = 'active'::text) AND (mission_id IS NOT NULL));--> statement-breakpoint
CREATE INDEX "secrets_mission_id_ix" ON "secrets" USING btree ("mission_id");--> statement-breakpoint
CREATE INDEX "rules_client_id_ix" ON "rules" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "rules_version_rules_rule_id_ix" ON "rules_version_rules" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "rules_versions_factory_commit_ix" ON "rules_versions" USING btree ("factory_commit");--> statement-breakpoint
CREATE INDEX "closeout_items_finding_ix" ON "closeout_items" USING btree ("mission_id","finding_id");--> statement-breakpoint
CREATE INDEX "closeout_items_module_run_ix" ON "closeout_items" USING btree ("mission_id","module_run_id");--> statement-breakpoint
CREATE INDEX "design_systems_client_id_ix" ON "design_systems" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "design_systems_factory_commit_ix" ON "design_systems" USING btree ("factory_commit");--> statement-breakpoint
CREATE INDEX "factory_versions_approved_by_ix" ON "factory_versions" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "kb_entries_client_id_ix" ON "kb_entries" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "kb_entries_search_text_gin" ON "kb_entries" USING gin ("search_text");--> statement-breakpoint
CREATE INDEX "kb_entries_tags_gin" ON "kb_entries" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "kb_release_entries_kb_entry_id_ix" ON "kb_release_entries" USING btree ("kb_entry_id");--> statement-breakpoint
CREATE INDEX "kb_releases_factory_commit_ix" ON "kb_releases" USING btree ("factory_commit");--> statement-breakpoint
CREATE INDEX "kb_releases_approved_by_ix" ON "kb_releases" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "skills_factory_commit_ix" ON "skills" USING btree ("factory_commit");--> statement-breakpoint
CREATE INDEX "templates_factory_commit_ix" ON "templates" USING btree ("factory_commit");--> statement-breakpoint
CREATE INDEX "templates_source_mission_id_ix" ON "templates" USING btree ("source_mission_id");--> statement-breakpoint
CREATE INDEX "agent_configs_factory_commit_ix" ON "agent_configs" USING btree ("factory_commit");--> statement-breakpoint
CREATE INDEX "eval_results_eval_run_id_ix" ON "eval_results" USING btree ("eval_run_id");--> statement-breakpoint
CREATE INDEX "eval_results_task_id_ix" ON "eval_results" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "eval_results_config_hash_ix" ON "eval_results" USING btree ("config_hash");--> statement-breakpoint
CREATE INDEX "eval_runs_baseline_config_ix" ON "eval_runs" USING btree ("baseline_config");--> statement-breakpoint
CREATE INDEX "eval_runs_candidate_config_ix" ON "eval_runs" USING btree ("candidate_config");--> statement-breakpoint
CREATE INDEX "eval_runs_approved_by_ix" ON "eval_runs" USING btree ("approved_by");