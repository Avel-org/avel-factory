import * as z from "zod/mini";
import {
  CloseoutItemKind,
  CloseoutItemState,
  IndexStatus,
  KbEntryStatus,
  LibraryLayer,
  SkillAuthor,
  SkillSource,
  TemplateDraftState,
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
  versionRange: z.nullable(z.string()),
  contentSha256: z.string(),
  author: z.enum(SkillAuthor),
  source: z.enum(SkillSource),
  sourceUrl: z.nullable(z.string()),
  /** CR-W16: an SPDX id, required for an import; the tag or commit imported; an edition note. */
  license: z.nullable(z.string()),
  upstreamRef: z.nullable(z.string()),
  editionNote: z.nullable(z.string()),
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
export const CreateSkillInput = z
  .object({
    slug: z.string().check(z.minLength(1)),
    version: z.string().check(z.minLength(1)),
    layer: z.string().check(z.minLength(1)),
    type: z.string().check(z.minLength(1)),
    versionRange: z.optional(z.string().check(z.minLength(1))),
    author: z.enum(SkillAuthor),
    source: z.enum(SkillSource),
    sourceUrl: z.optional(z.url()),
    license: z.optional(z.string().check(z.minLength(1))),
    upstreamRef: z.optional(z.string().check(z.minLength(1))),
    editionNote: z.optional(z.string().check(z.minLength(1))),
    files: z.array(FileBody).check(z.minLength(1)),
  })
  .check(
    z.refine((v) => v.source !== "import" || v.license !== undefined, {
      message: "An imported skill needs its licence",
      path: ["license"],
    }),
  );
export type CreateSkillInput = z.infer<typeof CreateSkillInput>;

export const SkillIdInput = z.object({ itemId: Uuid });
export type SkillIdInput = z.infer<typeof SkillIdInput>;

/** Route 77: change a skill (a new folder, or retire it). */
export const UpdateSkillInput = z.object({
  itemId: Uuid,
  rowVersion: RowVersion,
  status: z.optional(z.enum(IndexStatus)),
  files: z.optional(z.array(FileBody).check(z.minLength(1))),
});
export type UpdateSkillInput = z.infer<typeof UpdateSkillInput>;

/** `kb_entries`, without `search_text` (rule 3). */
export const KbEntryDto = z.object({
  id: Uuid,
  layer: z.enum(LibraryLayer),
  clientId: z.nullable(Uuid),
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
  clientId: z.optional(Uuid),
  kind: z.string().check(z.minLength(1)),
  tags: z.optional(z.array(z.string().check(z.minLength(1)))),
  path: z.string().check(z.minLength(1)),
  body: z.string().check(z.minLength(1)),
});
export type CreateKbEntryInput = z.infer<typeof CreateKbEntryInput>;

export const KbEntryIdInput = z.object({ itemId: Uuid });
export type KbEntryIdInput = z.infer<typeof KbEntryIdInput>;

/** Route 81: change, approve or retire an entry. */
export const UpdateKbEntryInput = z.object({
  itemId: Uuid,
  rowVersion: RowVersion,
  status: z.optional(z.enum(KbEntryStatus)),
  tags: z.optional(z.array(z.string().check(z.minLength(1)))),
  body: z.optional(z.string().check(z.minLength(1))),
});
export type UpdateKbEntryInput = z.infer<typeof UpdateKbEntryInput>;

/** `rules`. */
export const RuleDto = z.object({
  id: Uuid,
  scope: z.enum(LibraryLayer),
  stack: z.nullable(z.string()),
  clientId: z.nullable(Uuid),
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
  stack: z.optional(z.string().check(z.minLength(1))),
  clientId: z.optional(Uuid),
  path: z.string().check(z.minLength(1)),
  body: z.string().check(z.minLength(1)),
});
export type CreateRuleInput = z.infer<typeof CreateRuleInput>;

export const RuleIdInput = z.object({ itemId: Uuid });
export type RuleIdInput = z.infer<typeof RuleIdInput>;

/** Route 85: change or retire a rule. */
export const UpdateRuleInput = z.object({
  itemId: Uuid,
  rowVersion: RowVersion,
  status: z.optional(z.enum(IndexStatus)),
  body: z.optional(z.string().check(z.minLength(1))),
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
  sourceMissionId: z.nullable(Uuid),
  createdAt: IsoTime,
  ...mutableFields,
});

/**
 * A template's docs breakdown (CR-W20 section 1). It lives in the factory repo with the
 * template and is read at the pinned commit, never main. Every `keyFiles` path must be in
 * `files`; the factory PR is refused with `TEMPLATE_DOCS_INVALID` otherwise.
 */
export const TemplateDocs = z.object({
  overview: z.string().check(z.minLength(80)),
  use: z.array(z.string()).check(z.minLength(1)),
  avoid: z.array(z.string()).check(z.minLength(1)),
  notes: z.array(z.object({ tone: z.enum(["note", "tip", "warning"]), text: z.string() })),
  quickstart: z
    .array(
      z.object({
        title: z.string().check(z.minLength(1)),
        text: z.string().check(z.minLength(1)),
        code: z.nullable(
          z.object({ lang: z.string(), title: z.nullable(z.string()), code: z.string() }),
        ),
      }),
    )
    .check(z.minLength(1)),
  manifest: z.string(),
  annotations: z.record(z.string(), z.string()),
  keyFiles: z.array(z.tuple([z.string(), z.string()])).check(z.minLength(1)),
});
export type TemplateDocs = z.infer<typeof TemplateDocs>;

/**
 * Route 89's output (one template): the index row, and what the factory repo holds at the
 * pinned commit. `docs` is null only for a template indexed before CR-W20. `files` holds the
 * key files' text, plain and untrusted.
 */
export const TemplateViewDto = z.extend(TemplateDto, {
  name: z.string(),
  pitch: z.string(),
  bestFor: z.nullable(z.string()),
  stack: z.array(z.string()),
  modules: z.array(z.string()),
  tree: z.array(z.string()),
  files: z.record(z.string(), z.string()),
  docs: z.nullable(TemplateDocs),
});
export type TemplateViewDto = z.infer<typeof TemplateViewDto>;
export type TemplateDto = z.infer<typeof TemplateDto>;

/** Route 87: a project template version. */
export const CreateTemplateInput = z.object({
  slug: z.string().check(z.minLength(1)),
  version: z.string().check(z.minLength(1)),
  packageKey: z.string().check(z.minLength(1)),
  path: z.string().check(z.minLength(1)),
  scaffoldCommit: Sha,
  sourceMissionId: z.optional(Uuid),
});
export type CreateTemplateInput = z.infer<typeof CreateTemplateInput>;

/**
 * Routes 88 and 89: `templates` is keyed by `(slug, version)`, with no `id`, so its
 * `itemId` is the string `<slug>@<version>` (e.g. `landing-page@3`), which the server
 * parses, so a template slug can't contain `@` (D31).
 */
export const TemplateIdInput = z.object({ itemId: z.string().check(z.minLength(1)) });
export type TemplateIdInput = z.infer<typeof TemplateIdInput>;

/** Route 89: retire a template version. */
export const UpdateTemplateInput = z.object({
  itemId: z.string().check(z.minLength(1)),
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
export const GetRulesBundleInput = z.object({ rulesVersion: z.string().check(z.minLength(1)) });
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
  findingId: z.nullable(Uuid),
  moduleRunId: z.nullable(Uuid),
  note: z.nullable(z.string()),
  state: z.enum(CloseoutItemState),
  createdAt: IsoTime,
  ...mutableFields,
});
export type CloseoutItemDto = z.infer<typeof CloseoutItemDto>;

export const ListCloseoutItemsInput = z.extend(PageQuery, { missionId: Uuid });
export type ListCloseoutItemsInput = z.infer<typeof ListCloseoutItemsInput>;

// ---------------------------------------------------------------- CR-W16: skill results

const Share = z.number().check(z.minimum(0), z.maximum(1));

/** Per version: initial attempts that loaded that exact row (`skill_loads`), never by date. */
export const SkillVersionResult = z.object({
  version: z.string(),
  current: z.boolean(),
  attempts: z.int(),
  firstAttemptPass: z.nullable(Share),
  findings: z.int(),
  from: z.nullable(IsoTime),
  to: z.nullable(IsoTime),
});

/**
 * `GET /api/library/skills/{itemId}/results`, computed on read. `baseline` is null when either
 * side has fewer than 10 initial attempts. It matches role and work kind (CR-W16 open
 * question 1: stack is left out until there are enough attempts per stack to compare).
 */
export const SkillResultsDto = z.object({
  slug: z.string(),
  versions: z.array(SkillVersionResult),
  baseline: z.nullable(
    z.object({
      window: z.object({ from: IsoTime, to: IsoTime }),
      with: z.object({ attempts: z.int(), firstAttemptPass: z.nullable(Share) }),
      without: z.object({ attempts: z.int(), firstAttemptPass: z.nullable(Share) }),
      match: z.literal("role+workKind"),
    }),
  ),
  /** CR-W16: where it came from. `changesSinceImport` counts later versions of the slug. */
  origin: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("written") }),
    z.object({ kind: z.literal("upload") }),
    z.object({
      kind: z.literal("import"),
      url: z.string(),
      upstreamRef: z.nullable(z.string()),
      license: z.string(),
      editionNote: z.nullable(z.string()),
      changesSinceImport: z.int(),
    }),
  ]),
});
export type SkillResultsDto = z.infer<typeof SkillResultsDto>;

export const SkillResultsInput = z.object({
  itemId: Uuid,
  from: z.optional(IsoTime),
  to: z.optional(IsoTime),
});
export type SkillResultsInput = z.infer<typeof SkillResultsInput>;

// ---------------------------------------------------------------- CR-W21 section 3: template authoring

/**
 * What a template is cut from: a delivered project (`SOURCE_NOT_SHIPPED` otherwise). An
 * internal template build needs a verified receipt (`TEMPLATE_SOURCE_NOT_VERIFIED`, CR-W22).
 * A client project needs that client's consent (`clients.proof_consent_at`, CR-W17 rule 4).
 */
export const TemplateSourceDto = z.object({
  missionId: Uuid,
  name: z.string(),
  client: z.nullable(z.string()),
  packageKey: z.nullable(z.string()),
  stack: z.array(z.string()),
  commit: z.string(),
  tree: z.array(z.string()),
  files: z.record(z.string(), z.string()),
});
export type TemplateSourceDto = z.infer<typeof TemplateSourceDto>;

export const TemplateSourceInput = z.object({ missionId: Uuid });
export type TemplateSourceInput = z.infer<typeof TemplateSourceInput>;

/**
 * A template draft (`template_drafts`). Partial while you write: the checks run when the PR
 * opens. `docs` is a draft of `TemplateDocs`, stored as you typed it.
 */
export const TemplateDraftDto = z.object({
  id: Uuid,
  sourceMissionId: z.nullable(Uuid),
  slug: z.nullable(z.string()),
  name: z.string(),
  pitch: z.string(),
  bestFor: z.nullable(z.string()),
  docs: Json,
  modules: z.array(z.string()),
  state: z.enum(TemplateDraftState),
  prNumber: z.nullable(z.int()),
  savedAt: IsoTime,
  createdAt: IsoTime,
  ...mutableFields,
});
export type TemplateDraftDto = z.infer<typeof TemplateDraftDto>;

export const TemplateDraftIdInput = z.object({ draftId: Uuid });
export type TemplateDraftIdInput = z.infer<typeof TemplateDraftIdInput>;

/**
 * Save a draft (accepted with changes): `PUT` creates it with the web's UUID or replaces it.
 * Not "last write wins": a save sends the `rowVersion` it last got (absent on the first save),
 * so a second tab gets `STALE_VERSION` instead of silently losing text.
 */
export const SaveTemplateDraftInput = z.object({
  draftId: Uuid,
  rowVersion: z.optional(RowVersion),
  sourceMissionId: z.optional(Uuid),
  slug: z.optional(z.string().check(z.regex(/^[a-z0-9][a-z0-9-]*$/))),
  name: z.string().check(z.maxLength(80)),
  pitch: z.string().check(z.maxLength(240)),
  bestFor: z.optional(z.string().check(z.maxLength(240))),
  docs: Json,
  modules: z.array(z.string()),
});
export type SaveTemplateDraftInput = z.infer<typeof SaveTemplateDraftInput>;

/**
 * Open the factory PR. Returns its number and the decision's `ref`; the PR shows in
 * Decisions as a `factory_change` with area `template`.
 */
export const OpenTemplatePrInput = z.object({ draftId: Uuid, rowVersion: RowVersion });
export type OpenTemplatePrInput = z.infer<typeof OpenTemplatePrInput>;

export const TemplatePrDto = z.object({ prNumber: z.int(), decisionRef: z.string() });
export type TemplatePrDto = z.infer<typeof TemplatePrDto>;
