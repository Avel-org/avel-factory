import * as z from "zod/mini";
import { CompletionTaskStatus } from "./value-lists.js";

/**
 * The completion report schema (E6): what `completion_reports.body` holds.
 *
 * The sections come from two sources, and nothing else is in it:
 * - the completion report template in the task doc (Canon onboarding v0.5, Build spec,
 *   the task doc's "Completion" row): tasks, parked tasks, P0 discoveries, issues for
 *   others, dependency requests, escalations;
 * - CR-10 item 7's additions: the pre-flight results, a map from each contract item to
 *   the files that implement it, deviations from the contract with reasons, and known
 *   limitations. Gate 3 refuses a build report with no pre-flight section (CR-10), so
 *   `preflight` is required and non-empty.
 *
 * The report's own status (`done`, `partial`, `blocked`) is the `completion_reports.status`
 * column, not part of the body.
 */

const Text = z.string().check(z.trim(), z.minLength(1));

/** One pre-flight check: a verification command or a checklist item, and its result (CR-10 item 6). */
export const PreflightResult = z.object({
  check: Text,
  passed: z.boolean(),
  output: z.string(),
});
export type PreflightResult = z.infer<typeof PreflightResult>;

/** One task in the report. */
export const CompletionTask = z.object({
  id: Text,
  status: z.enum(CompletionTaskStatus),
  commit: z.nullable(z.string().check(z.minLength(1))),
});
export type CompletionTask = z.infer<typeof CompletionTask>;

/** A parked task: what was tried, and why it failed. */
export const ParkedTask = z.object({
  id: Text,
  tried: Text,
  why: Text,
});
export type ParkedTask = z.infer<typeof ParkedTask>;

/** "a map from each contract item to the files that implement it" (CR-10 item 7). */
export const ContractItemFiles = z.object({
  item: Text,
  files: z.array(Text),
});
export type ContractItemFiles = z.infer<typeof ContractItemFiles>;

/** "deviations from the contract, with reasons" (CR-10 item 7). */
export const Deviation = z.object({
  what: Text,
  why: Text,
});
export type Deviation = z.infer<typeof Deviation>;

/** `completion_reports.body`. */
export const CompletionReportBody = z.object({
  tasks: z.array(CompletionTask),
  parkedTasks: z.array(ParkedTask),
  p0Discoveries: z.array(Text),
  issuesForOthers: z.array(Text),
  dependencyRequests: z.array(Text),
  escalations: z.array(Text),
  preflight: z.array(PreflightResult).check(z.minLength(1)),
  contractToFiles: z.array(ContractItemFiles),
  deviations: z.array(Deviation),
  limitations: z.array(Text),
});
export type CompletionReportBody = z.infer<typeof CompletionReportBody>;
