import * as z from "zod/mini";
import { IsoTime, Placeholder, Sha, Uuid } from "./common.js";

/** Factory repo (routes 71 to 73). */

/** `kb_releases`. */
export const KbReleaseDto = z.object({
  version: z.string(),
  factoryCommit: z.string(),
  approvedBy: Uuid,
  approvedAt: IsoTime,
  createdAt: IsoTime,
});
export type KbReleaseDto = z.infer<typeof KbReleaseDto>;

/** `factory_versions`. */
export const FactoryVersionDto = z.object({
  sha: z.string(),
  mergedAt: IsoTime,
  approvedBy: Uuid,
  mergedByApp: z.boolean(),
  summary: z.string(),
  prNumber: z.int(),
  createdAt: IsoTime,
});
export type FactoryVersionDto = z.infer<typeof FactoryVersionDto>;

/**
 * Route 71: "Merged commits, which missions are on each, and knowledge releases".
 */
export const FactoryVersionViewDto = z.extend(FactoryVersionDto, {
  missionIds: z.array(Uuid),
  kbReleases: z.array(KbReleaseDto),
});
export type FactoryVersionViewDto = z.infer<typeof FactoryVersionViewDto>;

/**
 * Routes 72 and 73: an open factory-repo PR. PRs live on GitHub, not in a table, so
 * only `changeId` (route 73's path) and `headSha` (Q4) are known; the rest is a
 * placeholder.
 */
export const FactoryChangeDto = z.object({
  changeId: z.string().check(z.minLength(1)),
  headSha: Sha,
  change: Placeholder,
});
export type FactoryChangeDto = z.infer<typeof FactoryChangeDto>;

/** Route 73: "Approve and merge", at the head you saw (`headSha`, Q4). */
export const MergeFactoryChangeInput = z.object({
  changeId: z.string().check(z.minLength(1)),
  headSha: Sha,
});
export type MergeFactoryChangeInput = z.infer<typeof MergeFactoryChangeInput>;
