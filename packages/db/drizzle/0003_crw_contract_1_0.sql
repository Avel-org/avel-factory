CREATE TABLE "receipt_artifacts" (
	"receipt_id" uuid NOT NULL,
	"key" text NOT NULL,
	"ordinal" integer NOT NULL,
	"label" text NOT NULL,
	"file" text NOT NULL,
	"lang" text NOT NULL,
	"proves" text NOT NULL,
	"sha256" text NOT NULL,
	"bytes" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "receipt_artifacts_pkey" PRIMARY KEY("receipt_id","key"),
	CONSTRAINT "receipt_artifacts_receipt_id_ordinal_uq" UNIQUE("receipt_id","ordinal"),
	CONSTRAINT "receipt_artifacts_key_ck" CHECK ("key" IN ('tests', 'acceptance', 'build', 'diff', 'sbom', 'screens')),
	CONSTRAINT "receipt_artifacts_amounts_ck" CHECK (((ordinal >= 0) AND (bytes >= 0)))
);
--> statement-breakpoint
CREATE TABLE "template_drafts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_mission_id" uuid,
	"slug" text,
	"name" text NOT NULL,
	"pitch" text NOT NULL,
	"best_for" text,
	"docs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"modules" text[] DEFAULT '{}'::text[] NOT NULL,
	"state" text DEFAULT 'draft' NOT NULL,
	"pr_number" integer,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "template_drafts_state_ck" CHECK ("state" IN ('draft', 'pr_open', 'merged', 'closed')),
	CONSTRAINT "template_drafts_pr_ck" CHECK (((state = 'draft'::text) OR (pr_number IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "followups" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"client_id" uuid NOT NULL,
	"mission_id" uuid,
	"kind" text NOT NULL,
	"subject_id" uuid,
	"draft" text NOT NULL,
	"draft_hash" text NOT NULL,
	"channel" text NOT NULL,
	"state" text DEFAULT 'drafted' NOT NULL,
	"sent_at" timestamp with time zone,
	"sent_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "followups_kind_ck" CHECK ("kind" IN ('followup', 'upkeep', 'intake_reply')),
	CONSTRAINT "followups_channel_ck" CHECK ("channel" IN ('email', 'copy')),
	CONSTRAINT "followups_state_ck" CHECK ("state" IN ('drafted', 'sent', 'skipped')),
	CONSTRAINT "followups_sent_by_ck" CHECK (("sent_by" IS NULL) OR ("sent_by" IN ('factory', 'you'))),
	CONSTRAINT "followups_sent_ck" CHECK ((((state = 'sent'::text) = (sent_at IS NOT NULL)) AND ((sent_at IS NULL) = (sent_by IS NULL)) AND ((channel <> 'copy'::text) OR (sent_by IS NULL) OR (sent_by = 'you'::text))))
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"client_id" uuid NOT NULL,
	"source" text NOT NULL,
	"referrer_id" uuid,
	"referrer_name" text,
	"first_contact_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"lost_reason" text,
	"lost_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_client_id_uq" UNIQUE("client_id"),
	CONSTRAINT "leads_source_ck" CHECK ("source" IN ('referral', 'intake', 'past_client', 'partner', 'direct', 'other')),
	CONSTRAINT "leads_lost_reason_ck" CHECK (("lost_reason" IS NULL) OR ("lost_reason" IN ('timing', 'scope', 'went_elsewhere', 'no_reply', 'other'))),
	CONSTRAINT "leads_lost_ck" CHECK (((lost_reason IS NULL) = (lost_at IS NULL)))
);
--> statement-breakpoint
ALTER TABLE "clients" DROP CONSTRAINT "clients_status_ck";--> statement-breakpoint
ALTER TABLE "missions" DROP CONSTRAINT "missions_kind_ck";--> statement-breakpoint
ALTER TABLE "missions" DROP CONSTRAINT "missions_client_kind_ck";--> statement-breakpoint
ALTER TABLE "proposals" DROP CONSTRAINT "proposals_state_ck";--> statement-breakpoint
ALTER TABLE "proposals" DROP CONSTRAINT "proposals_resolved_ck";--> statement-breakpoint
ALTER TABLE "budget_reservations" DROP CONSTRAINT "budget_reservations_expected_ck";--> statement-breakpoint
ALTER TABLE "budget_reservations" DROP CONSTRAINT "budget_reservations_request_ck";--> statement-breakpoint
ALTER TABLE "human_time" DROP CONSTRAINT "human_time_activity_ck";--> statement-breakpoint
ALTER TABLE "missions" ALTER COLUMN "client_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "missions" ALTER COLUMN "kind" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "missions" ALTER COLUMN "client_kind" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "budget_reservations" ALTER COLUMN "mission_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "proof_consent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "client_message_id" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "relayed_by" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "answers_question_id" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "question_id" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "checkpoint" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "status" text DEFAULT 'done' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "ttft_ms" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "total_ms" integer;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "code" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "subject_checkpoint" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "subject_risk" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "why" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "after_question_id" uuid;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "after_choice" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "answer_source" text;--> statement-breakpoint
ALTER TABLE "mission_docs" ADD COLUMN "commit_state" text DEFAULT 'awaiting_confirmation' NOT NULL;--> statement-breakpoint
ALTER TABLE "mission_docs" ADD COLUMN "commit_sha" text;--> statement-breakpoint
ALTER TABLE "mission_docs" ADD COLUMN "confirmed_by" uuid;--> statement-breakpoint
ALTER TABLE "mission_docs" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "mission_docs" ADD COLUMN "confirmed_hash" text;--> statement-breakpoint
ALTER TABLE "missions" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "missions" ADD COLUMN "template_slug" text;--> statement-breakpoint
ALTER TABLE "missions" ADD COLUMN "lead_id" uuid;--> statement-breakpoint
ALTER TABLE "missions" ADD COLUMN "follows_delivery_id" uuid;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "superseded_by" uuid;--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "task_doc_sha256" text NOT NULL;--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "activation_sha256" text NOT NULL;--> statement-breakpoint
ALTER TABLE "budget_reservations" ADD COLUMN "scope" text DEFAULT 'mission' NOT NULL;--> statement-breakpoint
ALTER TABLE "budget_reservations" ADD COLUMN "eval_run_id" uuid;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "signature_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "signature" text NOT NULL;--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN "pr_number" integer;--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN "merged_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "repo_connections" ADD COLUMN "main_head" text;--> statement-breakpoint
ALTER TABLE "repo_connections" ADD COLUMN "main_head_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "license" text;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "upstream_ref" text;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "edition_note" text;--> statement-breakpoint
ALTER TABLE "receipt_artifacts" ADD CONSTRAINT "receipt_artifacts_receipt_id_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_drafts" ADD CONSTRAINT "template_drafts_source_mission_id_missions_id_fk" FOREIGN KEY ("source_mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_drafts" ADD CONSTRAINT "template_drafts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followups" ADD CONSTRAINT "followups_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followups" ADD CONSTRAINT "followups_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "template_drafts_source_mission_id_ix" ON "template_drafts" USING btree ("source_mission_id");--> statement-breakpoint
CREATE INDEX "template_drafts_created_by_ix" ON "template_drafts" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "followups_client_id_ix" ON "followups" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "followups_mission_id_ix" ON "followups" USING btree ("mission_id");--> statement-breakpoint
CREATE INDEX "followups_drafted_ix" ON "followups" USING btree ("client_id") WHERE (state = 'drafted'::text);--> statement-breakpoint
CREATE INDEX "leads_referrer_id_ix" ON "leads" USING btree ("referrer_id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_answers_question_id_questions_id_fk" FOREIGN KEY ("answers_question_id") REFERENCES "public"."questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_after_question_id_questions_id_fk" FOREIGN KEY ("after_question_id") REFERENCES "public"."questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_docs" ADD CONSTRAINT "mission_docs_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_follows_delivery_id_deliveries_id_fk" FOREIGN KEY ("follows_delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_superseded_by_proposals_id_fk" FOREIGN KEY ("superseded_by") REFERENCES "public"."proposals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_reservations" ADD CONSTRAINT "budget_reservations_eval_run_id_eval_runs_id_fk" FOREIGN KEY ("eval_run_id") REFERENCES "public"."eval_runs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "messages_client_message_id_uq" ON "messages" USING btree ("session_id","client_message_id") WHERE (client_message_id IS NOT NULL);--> statement-breakpoint
CREATE UNIQUE INDEX "messages_one_streaming_uq" ON "messages" USING btree ("session_id") WHERE (status = 'streaming'::text);--> statement-breakpoint
CREATE INDEX "messages_answers_question_id_ix" ON "messages" USING btree ("answers_question_id");--> statement-breakpoint
CREATE INDEX "messages_question_id_ix" ON "messages" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "questions_session_id_code_uq" ON "questions" USING btree ("session_id","code") WHERE (code IS NOT NULL);--> statement-breakpoint
CREATE INDEX "questions_after_question_id_ix" ON "questions" USING btree ("after_question_id");--> statement-breakpoint
CREATE INDEX "mission_docs_confirmed_by_ix" ON "mission_docs" USING btree ("confirmed_by");--> statement-breakpoint
CREATE INDEX "missions_lead_id_ix" ON "missions" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "missions_follows_delivery_id_ix" ON "missions" USING btree ("follows_delivery_id");--> statement-breakpoint
CREATE INDEX "proposals_superseded_by_ix" ON "proposals" USING btree ("superseded_by");--> statement-breakpoint
CREATE INDEX "budget_reservations_eval_run_id_ix" ON "budget_reservations" USING btree ("eval_run_id");--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_status_ck" CHECK ("status" IN ('active', 'archived', 'lead', 'lost'));--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_source_ck" CHECK (("source" IS NULL) OR ("source" IN ('said', 'relayed')));--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_status_ck" CHECK ("status" IN ('streaming', 'done', 'stopped', 'failed'));--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_checkpoint_ck" CHECK (("checkpoint" IS NULL) OR ("checkpoint" IN ('0.1', '0.2', '0.3', '0.4', '0.1+0.2')));--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_operator_source_ck" CHECK (((role = 'operator'::text) = (source IS NOT NULL)));--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_relayed_by_ck" CHECK (((relayed_by IS NULL) OR (source = 'relayed'::text)));--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_streaming_ck" CHECK (((status <> 'streaming'::text) OR (role = 'canon'::text)));--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_timing_ck" CHECK ((((ttft_ms IS NULL) OR (ttft_ms >= 0)) AND ((total_ms IS NULL) OR (total_ms >= 0))));--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_subject_checkpoint_ck" CHECK (("subject_checkpoint" IS NULL) OR ("subject_checkpoint" IN ('0.1', '0.2', '0.3', '0.4', '0.1+0.2')));--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_answer_source_ck" CHECK (("answer_source" IS NULL) OR ("answer_source" IN ('option', 'own_words')));--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_answer_source_set_ck" CHECK (((answer IS NULL) = (answer_source IS NULL)));--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_after_ck" CHECK ((((after_question_id IS NULL) = (after_choice IS NULL)) AND ((after_question_id IS NULL) OR (after_question_id <> id))));--> statement-breakpoint
ALTER TABLE "mission_docs" ADD CONSTRAINT "mission_docs_commit_state_ck" CHECK ("commit_state" IN ('awaiting_confirmation', 'committing', 'committed', 'failed'));--> statement-breakpoint
ALTER TABLE "mission_docs" ADD CONSTRAINT "mission_docs_confirmed_ck" CHECK ((((confirmed_at IS NULL) = (confirmed_by IS NULL)) AND ((confirmed_at IS NULL) = (confirmed_hash IS NULL)) AND ((commit_state = 'awaiting_confirmation'::text) OR (confirmed_at IS NOT NULL))));--> statement-breakpoint
ALTER TABLE "mission_docs" ADD CONSTRAINT "mission_docs_committed_ck" CHECK (((commit_state = 'committed'::text) = (commit_sha IS NOT NULL)));--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_kind_client_ck" CHECK ((((kind IS NULL) = (client_id IS NULL)) AND ((client_id IS NULL) = (client_kind IS NULL))));--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_kind_set_ck" CHECK (((state = ANY (ARRAY['draft'::text, 'onboarding'::text, 'cancelled'::text])) OR (kind IS NOT NULL)));--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_template_slug_ck" CHECK (((template_slug IS NULL) OR (kind = 'template'::text)));--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_name_ck" CHECK ((name <> ''::text));--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_kind_ck" CHECK (("kind" IS NULL) OR ("kind" IN ('client', 'internal', 'template')));--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_client_kind_ck" CHECK (("client_kind" IS NULL) OR ("client_kind" IN ('client', 'internal')));--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_superseded_ck" CHECK ((((state = 'superseded'::text) = (superseded_by IS NOT NULL)) AND ((superseded_by IS NULL) OR (superseded_by <> id))));--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_state_ck" CHECK ("state" IN ('open', 'resolved', 'expired', 'superseded'));--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_resolved_ck" CHECK (((state = ANY (ARRAY['resolved'::text, 'superseded'::text])) = ((choice IS NOT NULL) AND (choice_reason IS NOT NULL) AND (resolved_by IS NOT NULL) AND (resolved_at IS NOT NULL))));--> statement-breakpoint
ALTER TABLE "budget_reservations" ADD CONSTRAINT "budget_reservations_scope_ck" CHECK ("scope" IN ('mission', 'eval'));--> statement-breakpoint
ALTER TABLE "budget_reservations" ADD CONSTRAINT "budget_reservations_scope_owner_ck" CHECK ((((scope = 'mission'::text) = (mission_id IS NOT NULL)) AND ((scope = 'eval'::text) = (eval_run_id IS NOT NULL))));--> statement-breakpoint
ALTER TABLE "budget_reservations" ADD CONSTRAINT "budget_reservations_expected_ck" CHECK (((kind <> 'expected'::text) OR ((num_nonnulls(dispatch_id, session_id, eval_run_id) = 1) AND (attempt_id IS NULL) AND (request_id IS NULL))));--> statement-breakpoint
ALTER TABLE "budget_reservations" ADD CONSTRAINT "budget_reservations_request_ck" CHECK (((kind <> 'request'::text) OR ((num_nonnulls(attempt_id, session_id, eval_run_id) = 1) AND (request_id IS NOT NULL))));--> statement-breakpoint
ALTER TABLE "human_time" ADD CONSTRAINT "human_time_activity_ck" CHECK ("activity" IN ('onboarding', 'approval', 'review', 'fix', 'call', 'override', 'sales'));--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_pr_fields_ck" CHECK ((((pr_number IS NULL) OR (kind = 'pr'::text)) AND ((merged_at IS NULL) OR (pr_number IS NOT NULL))));--> statement-breakpoint
ALTER TABLE "repo_connections" ADD CONSTRAINT "repo_connections_main_head_ck" CHECK (((main_head IS NULL) = (main_head_at IS NULL)));--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_import_license_ck" CHECK (((source <> 'import'::text) OR (license IS NOT NULL)));--> statement-breakpoint
-- Hand-written (contract 1.0.0): the kind, the client and its kind are settled during onboarding
-- (CR-W22), so they freeze once the plan is approved instead of once onboarding starts.
DROP TRIGGER "missions_frozen" ON "missions";--> statement-breakpoint
CREATE TRIGGER missions_frozen BEFORE UPDATE ON public.missions FOR EACH ROW EXECUTE FUNCTION freeze_after_set('approved_at', 'kind', 'client_id', 'client_kind');--> statement-breakpoint
CREATE TRIGGER leads_touch_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION touch_updated_at();--> statement-breakpoint
CREATE TRIGGER followups_touch_updated_at BEFORE UPDATE ON public.followups FOR EACH ROW EXECUTE FUNCTION touch_updated_at();--> statement-breakpoint
CREATE TRIGGER template_drafts_touch_updated_at BEFORE UPDATE ON public.template_drafts FOR EACH ROW EXECUTE FUNCTION touch_updated_at();--> statement-breakpoint
CREATE TRIGGER receipt_artifacts_immutable BEFORE UPDATE ON public.receipt_artifacts FOR EACH ROW EXECUTE FUNCTION refuse_update();
