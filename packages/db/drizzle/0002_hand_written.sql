-- What drizzle-kit can't say: the two deferred foreign keys and the triggers.
-- The triggers are the map's 65, word for word, plus design_systems_touch_updated_at (B9) and
-- missions_frozen (CR-13; INT, finding 02). The functions they call are in 0000_functions.sql.
-- (agent_traces' PARTITION BY RANGE (at) is the one hand edit in 0001_schema.sql: drizzle-kit has
-- no partitioning. Its weekly partitions are made at run time.)

-- Checked at commit: the current plan is always the one approved plan, and a dispatch's task doc
-- version can be written in the same transaction as the dispatch.
ALTER TABLE "dispatches" ALTER CONSTRAINT "dispatches_task_doc_fk" DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
ALTER TABLE "missions" ALTER CONSTRAINT "missions_current_plan_fk" DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
CREATE TRIGGER attempts_touch_updated_at BEFORE UPDATE ON public.attempts FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER attempts_frozen BEFORE UPDATE ON public.attempts FOR EACH ROW EXECUTE FUNCTION freeze_once_set('started_at', 'kind');
--> statement-breakpoint
CREATE TRIGGER budget_reservations_touch_updated_at BEFORE UPDATE ON public.budget_reservations FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER check_results_immutable BEFORE UPDATE ON public.check_results FOR EACH ROW EXECUTE FUNCTION refuse_update();
--> statement-breakpoint
CREATE TRIGGER checkpoints_touch_updated_at BEFORE UPDATE ON public.checkpoints FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER checks_frozen BEFORE INSERT OR DELETE OR UPDATE ON public.checks FOR EACH ROW EXECUTE FUNCTION freeze_plan_detail();
--> statement-breakpoint
CREATE TRIGGER cli_sessions_touch_updated_at BEFORE UPDATE ON public.cli_sessions FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER clients_touch_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER closeout_items_touch_updated_at BEFORE UPDATE ON public.closeout_items FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER codebase_analysis_frozen BEFORE INSERT OR DELETE OR UPDATE ON public.codebase_analysis FOR EACH ROW EXECUTE FUNCTION freeze_plan_detail();
--> statement-breakpoint
CREATE TRIGGER completion_reports_immutable BEFORE UPDATE ON public.completion_reports FOR EACH ROW EXECUTE FUNCTION refuse_update();
--> statement-breakpoint
CREATE TRIGGER consumer_cursors_touch_updated_at BEFORE UPDATE ON public.consumer_cursors FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER context_refs_touch_updated_at BEFORE UPDATE ON public.context_refs FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER credentials_touch_updated_at BEFORE UPDATE ON public.credentials FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER deliveries_touch_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER dependency_requests_touch_updated_at BEFORE UPDATE ON public.dependency_requests FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER design_systems_touch_updated_at BEFORE UPDATE ON public.design_systems FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER device_logins_touch_updated_at BEFORE UPDATE ON public.device_logins FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER dispatches_touch_updated_at BEFORE UPDATE ON public.dispatches FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER eval_runs_touch_updated_at BEFORE UPDATE ON public.eval_runs FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER facts_touch_updated_at BEFORE UPDATE ON public.facts FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER findings_touch_updated_at BEFORE UPDATE ON public.findings FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER gate_evaluations_touch_updated_at BEFORE UPDATE ON public.gate_evaluations FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER gate_runs_touch_updated_at BEFORE UPDATE ON public.gate_runs FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER human_time_touch_updated_at BEFORE UPDATE ON public.human_time FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER idempotency_keys_touch_updated_at BEFORE UPDATE ON public.idempotency_keys FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER integration_commits_touch_updated_at BEFORE UPDATE ON public.integration_commits FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER jobs_touch_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER kb_entries_touch_updated_at BEFORE UPDATE ON public.kb_entries FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER mission_pauses_touch_updated_at BEFORE UPDATE ON public.mission_pauses FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER mission_pauses_frozen BEFORE UPDATE ON public.mission_pauses FOR EACH ROW EXECUTE FUNCTION freeze_once_set('started_at', 'kind', 'interrupted_state');
--> statement-breakpoint
CREATE TRIGGER mission_refreshes_touch_updated_at BEFORE UPDATE ON public.mission_refreshes FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER mission_scenarios_touch_updated_at BEFORE UPDATE ON public.mission_scenarios FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER missions_touch_updated_at BEFORE UPDATE ON public.missions FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER missions_frozen BEFORE UPDATE ON public.missions FOR EACH ROW EXECUTE FUNCTION freeze_after_set('onboarding_started_at', 'kind');
--> statement-breakpoint
CREATE TRIGGER module_checks_frozen BEFORE INSERT OR DELETE OR UPDATE ON public.module_checks FOR EACH ROW EXECUTE FUNCTION freeze_plan_detail();
--> statement-breakpoint
CREATE TRIGGER module_runs_touch_updated_at BEFORE UPDATE ON public.module_runs FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER module_runs_frozen BEFORE UPDATE ON public.module_runs FOR EACH ROW EXECUTE FUNCTION freeze_once_set('landed_at', 'landed_commit', 'tests_base_commit', 'build_base_commit');
--> statement-breakpoint
CREATE TRIGGER notes_touch_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER onboarding_sessions_touch_updated_at BEFORE UPDATE ON public.onboarding_sessions FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER packages_touch_updated_at BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER pass_approvals_immutable BEFORE UPDATE ON public.pass_approvals FOR EACH ROW EXECUTE FUNCTION refuse_update();
--> statement-breakpoint
CREATE TRIGGER payments_immutable BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION refuse_update();
--> statement-breakpoint
CREATE TRIGGER plan_module_deps_frozen BEFORE INSERT OR DELETE OR UPDATE ON public.plan_module_deps FOR EACH ROW EXECUTE FUNCTION freeze_plan_detail();
--> statement-breakpoint
CREATE TRIGGER plan_modules_frozen BEFORE INSERT OR DELETE OR UPDATE ON public.plan_modules FOR EACH ROW EXECUTE FUNCTION freeze_plan_detail();
--> statement-breakpoint
CREATE TRIGGER plans_touch_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER plans_frozen BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION freeze_plan();
--> statement-breakpoint
CREATE TRIGGER proposals_touch_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER quality_targets_frozen BEFORE INSERT OR DELETE OR UPDATE ON public.quality_targets FOR EACH ROW EXECUTE FUNCTION freeze_plan_detail();
--> statement-breakpoint
CREATE TRIGGER quarantines_touch_updated_at BEFORE UPDATE ON public.quarantines FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER questions_touch_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER receipts_immutable BEFORE UPDATE ON public.receipts FOR EACH ROW EXECUTE FUNCTION refuse_update();
--> statement-breakpoint
CREATE TRIGGER release_approvals_immutable BEFORE UPDATE ON public.release_approvals FOR EACH ROW EXECUTE FUNCTION refuse_update();
--> statement-breakpoint
CREATE TRIGGER repo_connections_touch_updated_at BEFORE UPDATE ON public.repo_connections FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER requirements_frozen BEFORE INSERT OR DELETE OR UPDATE ON public.requirements FOR EACH ROW EXECUTE FUNCTION freeze_plan_detail();
--> statement-breakpoint
CREATE TRIGGER rooms_touch_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER rules_touch_updated_at BEFORE UPDATE ON public.rules FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER scenario_modules_frozen BEFORE INSERT OR DELETE OR UPDATE ON public.scenario_modules FOR EACH ROW EXECUTE FUNCTION freeze_plan_detail();
--> statement-breakpoint
CREATE TRIGGER scenarios_frozen BEFORE INSERT OR DELETE OR UPDATE ON public.scenarios FOR EACH ROW EXECUTE FUNCTION freeze_plan_detail();
--> statement-breakpoint
CREATE TRIGGER secrets_touch_updated_at BEFORE UPDATE ON public.secrets FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER skills_touch_updated_at BEFORE UPDATE ON public.skills FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER step_up_grants_touch_updated_at BEFORE UPDATE ON public.step_up_grants FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER task_docs_immutable BEFORE UPDATE ON public.task_docs FOR EACH ROW EXECUTE FUNCTION refuse_update();
--> statement-breakpoint
CREATE TRIGGER templates_touch_updated_at BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER test_locks_touch_updated_at BEFORE UPDATE ON public.test_locks FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER topic_coverage_touch_updated_at BEFORE UPDATE ON public.topic_coverage FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER uploads_touch_updated_at BEFORE UPDATE ON public.uploads FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
