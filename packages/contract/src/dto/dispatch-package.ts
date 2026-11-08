import * as z from "zod/mini";
import { DispatchPackageFileKind } from "../value-lists.js";
import { FileWithEtag, Uuid } from "./common.js";

/**
 * Dispatch package (CR-16, accepted Nov 6). `DispatchPackageDto` is quoted from the
 * CR-16 contract, `GET /api/missions/{missionId}/dispatch-package`, field for field:
 *
 * ```ts
 * DispatchPackageDto = {
 *   missionId: string;
 *   planVersion: number;
 *   factoryCommit: string;
 *   renderedAt: string;            // ISO time
 *   gate1PassedAt: string | null;  // the line "every section passed the pre-dispatch check"
 *   location: {                    // where it's written in the repo; null if it isn't written there
 *     repo: string;                // e.g. "avel-org/gts-landing"
 *     branch: string;              // e.g. "mission/landing"
 *     path: string;                // e.g. "docs/agent-dispatch/landing"
 *   } | null;
 *   packageSha256: string;         // hash of the sorted (path, sha256) list; changes whenever any file changes
 *   files: Array<{
 *     path: string;
 *     kind: 'codebase_analysis' | 'dispatch_md' | 'task_doc' | 'prompts_archive' | 'completion_report';
 *     dispatchId: string | null;   // set for task_doc and completion_report
 *     version: number | null;      // the task doc version
 *     sha256: string;
 *     bytes: number;
 *   }>;
 * }
 * ```
 */
export const DispatchPackageDto = z.object({
  missionId: z.string(),
  planVersion: z.number(),
  factoryCommit: z.string(),
  /** ISO time */
  renderedAt: z.string(),
  /** the line "every section passed the pre-dispatch check" */
  gate1PassedAt: z.nullable(z.string()),
  /** where it's written in the repo; null if it isn't written there */
  location: z.nullable(
    z.object({
      /** e.g. "avel-org/gts-landing" */
      repo: z.string(),
      /** e.g. "mission/landing" */
      branch: z.string(),
      /** e.g. "docs/agent-dispatch/landing" */
      path: z.string(),
    }),
  ),
  /** hash of the sorted (path, sha256) list; changes whenever any file changes */
  packageSha256: z.string(),
  files: z.array(
    z.object({
      path: z.string(),
      kind: z.enum(DispatchPackageFileKind),
      /** set for task_doc and completion_report */
      dispatchId: z.nullable(z.string()),
      /** the task doc version */
      version: z.nullable(z.number()),
      sha256: z.string(),
      bytes: z.number(),
    }),
  ),
});
export type DispatchPackageDto = z.infer<typeof DispatchPackageDto>;

/** "All three take `?planVersion=`, which defaults to the mission's current plan." */
export const DispatchPackageInput = z.object({
  missionId: Uuid,
  planVersion: z.optional(z.coerce.number().check(z.int(), z.minimum(1))),
});
export type DispatchPackageInput = z.infer<typeof DispatchPackageInput>;

/** The files route: `?path=` and `?planVersion=`. */
export const DispatchPackageFileInput = z.extend(DispatchPackageInput, {
  path: z.string().check(z.minLength(1)),
});
export type DispatchPackageFileInput = z.infer<typeof DispatchPackageFileInput>;

/** The files route returns `text/markdown`, and the archive `application/zip`, each with its `ETag`. */
export const DispatchPackageFileDto = FileWithEtag;
export const DispatchPackageArchiveDto = FileWithEtag;
