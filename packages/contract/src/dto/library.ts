import { z } from "zod";
import {
  CloseoutItemKind,
  CloseoutItemState,
  IndexStatus,
  KbEntryStatus,
  LibraryLayer,
  SkillAuthor,
  SkillSource,
} from "../value-lists.js";
import {
  FileBody,
  IsoTime,
  Json,
  mutableFields,
  PageQuery,
  RowVersion,
  Sha,
  Uuid,
} from "./common.js";

/**
 * Library (routes 74 to 91). "Creating or changing an item opens a factory PR;
 * approving, retiring or promoting one is merging that PR", so every create and
 * change returns the factory change it opened.
 */

/** `skills`. */
export const SkillDto = z.object({
  id: Uuid,
  slug: z.string(),
  version: z.string(),
  layer: z.string(),
  type: z.string(),
  versionRange: z.string().nullable(),
  contentSha256: z.string(),
  author: z.enum(SkillAuthor),
  source: z.enum(SkillSource),
  sourceUrl: z.string().nullable(),
  factoryCommit: z.string(),
  status: z.enum(IndexStatus),
  createdAt: IsoTime,
  ...mutableFields,
});
export type SkillDto = z.infer<typeof SkillDto>;

/**
 * Route 75: "create, or upload a skill folder; each records its source (upload,
 * written or import)". The folder's files come as multipart.
 */
export const CreateSkillInput = z.object({
  slug: z.string().min(1),
  version: z.string().min(1),
  layer: z.string().min(1),
  type: z.string().min(1),
  versionRange: z.string().min(1).optional(),
  author: z.enum(SkillAuthor),
  source: z.enum(SkillSource),
  sourceUrl: z.url().optional(),
  files: z.array(FileBody).min(1),
});
export type CreateSkillInput = z.infer<typeof CreateSkillInput>;

export const SkillIdInput = z.object({ itemId: Uuid });
export type SkillIdInput = z.infer<typeof SkillIdInput>;

/** Route 77: change a skill (a new folder, or retire it). */
export const UpdateSkillInput = z.object({
  itemId: Uuid,
  rowVersion: RowVersion,
  status: z.enum(IndexStatus).optional(),
  files: z.array(FileBody).min(1).optional(),
});
export type UpdateSkillInput = z.infer<typeof UpdateSkillInput>;

/** `kb_entries`, without `search_text` (rule 3). */
export const KbEntryDto = z.object({
  id: Uuid,
  layer: z.enum(LibraryLayer),
  clientId: Uuid.nullable(),
  kind: z.string(),
  tags: z.array(z.string()),
  path: z.string(),
  bodySha256: z.string(),
  provenance: Json,
  status: z.enum(KbEntryStatus),
  createdAt: IsoTime,
  ...mutableFields,
});
export type KbEntryDto = z.infer<typeof KbEntryDto>;

/** Route 79: a knowledge entry; its body is the file at `path` in the factory repo. */
export const CreateKbEntryInput = z.object({
  layer: z.enum(LibraryLayer),
  clientId: Uuid.optional(),
  kind: z.string().min(1),
  tags: z.array(z.string().min(1)).optional(),
  path: z.string().min(1),
  body: z.string().min(1),
});
export type CreateKbEntryInput = z.infer<typeof CreateKbEntryInput>;

export const KbEntryIdInput = z.object({ itemId: Uuid });
export type KbEntryIdInput = z.infer<typeof KbEntryIdInput>;

/** Route 81: change, approve or retire an entry. */
export const UpdateKbEntryInput = z.object({
  itemId: Uuid,
  rowVersion: RowVersion,
  status: z.enum(KbEntryStatus).optional(),
  tags: z.array(z.string().min(1)).optional(),
  body: z.string().min(1).optional(),
});
export type UpdateKbEntryInput = z.infer<typeof UpdateKbEntryInput>;

/** `rules`. */
export const RuleDto = z.object({
  id: Uuid,
  scope: z.enum(LibraryLayer),
  stack: z.string().nullable(),
  clientId: Uuid.nullable(),
  path: z.string(),
  sha256: z.string(),
  status: z.enum(IndexStatus),
  createdAt: IsoTime,
  ...mutableFields,
});
export type RuleDto = z.infer<typeof RuleDto>;

/** Route 83: a rule; its body is the file at `path` in the factory repo. */
export const CreateRuleInput = z.object({
  scope: z.enum(LibraryLayer),
  stack: z.string().min(1).optional(),
  clientId: Uuid.optional(),
  path: z.string().min(1),
  body: z.string().min(1),
});
export type CreateRuleInput = z.infer<typeof CreateRuleInput>;

export const RuleIdInput = z.object({ itemId: Uuid });
export type RuleIdInput = z.infer<typeof RuleIdInput>;

/** Route 85: change or retire a rule. */
export const UpdateRuleInput = z.object({
  itemId: Uuid,
  rowVersion: RowVersion,
  status: z.enum(IndexStatus).optional(),
  body: z.string().min(1).optional(),
});
export type UpdateRuleInput = z.infer<typeof UpdateRuleInput>;

/** `templates`, with CR-13's `source_mission_id`. */
export const TemplateDto = z.object({
  slug: z.string(),
  version: z.string(),
  packageKey: z.string(),
  path: z.string(),
  scaffoldCommit: z.string(),
  factoryCommit: z.string(),
  status: z.enum(IndexStatus),
  sourceMissionId: Uuid.nullable(),
  createdAt: IsoTime,
  ...mutableFields,
});
export type TemplateDto = z.infer<typeof TemplateDto>;

/** Route 87: a project template version. */
export const CreateTemplateInput = z.object({
  slug: z.string().min(1),
  version: z.string().min(1),
  packageKey: z.string().min(1),
  path: z.string().min(1),
  scaffoldCommit: Sha,
  sourceMissionId: Uuid.optional(),
});
export type CreateTemplateInput = z.infer<typeof CreateTemplateInput>;

/**
 * Routes 88 and 89: `templates` is keyed by `(slug, version)`, with no `id`, so its
 * `itemId` is a string the server resolves (D23 in the completion report).
 */
export const TemplateIdInput = z.object({ itemId: z.string().min(1) });
export type TemplateIdInput = z.infer<typeof TemplateIdInput>;

/** Route 89: retire a template version. */
export const UpdateTemplateInput = z.object({
  itemId: z.string().min(1),
  rowVersion: RowVersion,
  status: z.enum(IndexStatus),
});
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateInput>;

/** `rules_versions`. */
export const RulesVersionDto = z.object({
  version: z.string(),
  sha256: z.string(),
  factoryCommit: z.string(),
  approvedAt: IsoTime,
  createdAt: IsoTime,
});
export type RulesVersionDto = z.infer<typeof RulesVersionDto>;

/** Route 90: "What `avel check` runs". */
export const GetRulesBundleInput = z.object({ rulesVersion: z.string().min(1) });
export type GetRulesBundleInput = z.infer<typeof GetRulesBundleInput>;

export const RulesBundleDto = z.object({
  version: RulesVersionDto,
  rules: z.array(RuleDto),
});
export type RulesBundleDto = z.infer<typeof RulesBundleDto>;

/** `closeout_items`. */
export const CloseoutItemDto = z.object({
  id: Uuid,
  missionId: Uuid,
  kind: z.enum(CloseoutItemKind),
  findingId: Uuid.nullable(),
  moduleRunId: Uuid.nullable(),
  note: z.string().nullable(),
  state: z.enum(CloseoutItemState),
  createdAt: IsoTime,
  ...mutableFields,
});
export type CloseoutItemDto = z.infer<typeof CloseoutItemDto>;

export const ListCloseoutItemsInput = PageQuery.extend({ missionId: Uuid });
export type ListCloseoutItemsInput = z.infer<typeof ListCloseoutItemsInput>;
