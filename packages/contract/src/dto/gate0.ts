import * as z from "zod/mini";
import {
  Checkpoint,
  CheckpointState,
  FactKind,
  FactSource,
  FactStatus,
  SecretState,
  Stage,
  UploadParseStatus,
  UploadState,
} from "../value-lists.js";
import {
  FileBody,
  IsoTime,
  Json,
  mutableFields,
  PageQuery,
  Reason,
  RowVersion,
  Uuid,
} from "./common.js";

/** Gate 0 (routes 35 to 45). */

/** `uploads`. */
export const UploadDto = z.object({
  id: Uuid,
  missionId: Uuid,
  sessionId: z.nullable(Uuid),
  blobKey: z.nullable(z.string()),
  name: z.string(),
  mime: z.string(),
  sizeBytes: z.int(),
  parseStatus: z.enum(UploadParseStatus),
  state: z.enum(UploadState),
  removedAt: z.nullable(IsoTime),
  createdAt: IsoTime,
  ...mutableFields,
});
export type UploadDto = z.infer<typeof UploadDto>;

export const ListUploadsInput = z.extend(PageQuery, { missionId: Uuid });
export type ListUploadsInput = z.infer<typeof ListUploadsInput>;

/** Route 36: one file, sent as multipart. */
export const CreateUploadInput = z.object({
  missionId: Uuid,
  file: FileBody,
});
export type CreateUploadInput = z.infer<typeof CreateUploadInput>;

/** Route 37: refused once an approved fact cites the upload. */
export const DeleteUploadInput = z.object({
  uploadId: Uuid,
  rowVersion: RowVersion,
});
export type DeleteUploadInput = z.infer<typeof DeleteUploadInput>;

/** `checkpoints`. */
export const CheckpointDto = z.object({
  id: Uuid,
  missionId: Uuid,
  sessionId: Uuid,
  checkpoint: z.enum(Checkpoint),
  version: z.int(),
  sections: Json,
  state: z.enum(CheckpointState),
  staleModuleLabels: z.array(z.string()),
  approvedAt: z.nullable(IsoTime),
  approvedBy: z.nullable(Uuid),
  createdAt: IsoTime,
  ...mutableFields,
});
export type CheckpointDto = z.infer<typeof CheckpointDto>;

export const CheckpointIdInput = z.object({ checkpointId: Uuid });
export type CheckpointIdInput = z.infer<typeof CheckpointIdInput>;

/** Route 39: generate a draft. Sends the checkpoint's `rowVersion` (D25, finding 01). */
export const DraftCheckpointInput = z.extend(CheckpointIdInput, { rowVersion: RowVersion });
export type DraftCheckpointInput = z.infer<typeof DraftCheckpointInput>;

/** Route 38: edit one section of `checkpoints.sections`. */
export const UpdateCheckpointSectionInput = z.object({
  checkpointId: Uuid,
  sectionKey: z.string().check(z.minLength(1)),
  rowVersion: RowVersion,
  section: Json,
});
export type UpdateCheckpointSectionInput = z.infer<typeof UpdateCheckpointSectionInput>;

/** Route 40: approve the checkpoint at the version you saw. */
export const ApproveCheckpointInput = z.object({
  checkpointId: Uuid,
  rowVersion: RowVersion,
});
export type ApproveCheckpointInput = z.infer<typeof ApproveCheckpointInput>;

/** Route 41: ask for changes, saying what. */
export const RequestCheckpointChangesInput = z.object({
  checkpointId: Uuid,
  rowVersion: RowVersion,
  reason: Reason,
});
export type RequestCheckpointChangesInput = z.infer<typeof RequestCheckpointChangesInput>;

/** Route 42: reopen. */
export const ReopenCheckpointInput = z.object({
  checkpointId: Uuid,
  rowVersion: RowVersion,
  reason: z.optional(Reason),
});
export type ReopenCheckpointInput = z.infer<typeof ReopenCheckpointInput>;

/** `facts`. */
export const FactDto = z.object({
  id: Uuid,
  missionId: Uuid,
  sessionId: Uuid,
  kind: z.enum(FactKind),
  value: Json,
  source: z.enum(FactSource),
  status: z.enum(FactStatus),
  messageId: z.nullable(Uuid),
  spanStart: z.nullable(z.int()),
  spanEnd: z.nullable(z.int()),
  uploadId: z.nullable(Uuid),
  repoCommit: z.nullable(z.string()),
  repoPath: z.nullable(z.string()),
  supersedesFactId: z.nullable(Uuid),
  scanFlagged: z.boolean(),
  redactedAt: z.nullable(IsoTime),
  createdAt: IsoTime,
  ...mutableFields,
});
export type FactDto = z.infer<typeof FactDto>;

/** Route 43: "Confirm or reject". */
export const UpdateFactInput = z.object({
  factId: Uuid,
  rowVersion: RowVersion,
  status: z.enum(FactStatus.filter((v): v is Exclude<FactStatus, "proposed"> => v !== "proposed")),
});
export type UpdateFactInput = z.infer<typeof UpdateFactInput>;

/** `questions`. */
export const QuestionDto = z.object({
  id: Uuid,
  sessionId: Uuid,
  stage: z.enum(Stage),
  text: z.string(),
  options: z.nullable(Json),
  recommended: z.nullable(z.string()),
  answer: z.nullable(z.string()),
  answeredAt: z.nullable(IsoTime),
  blocking: z.boolean(),
  moduleLabel: z.nullable(z.string()),
  createdAt: IsoTime,
  ...mutableFields,
});
export type QuestionDto = z.infer<typeof QuestionDto>;

/** Route 44: answer. Sends the question's `rowVersion` (D25, finding 01). */
export const AnswerQuestionInput = z.object({
  questionId: Uuid,
  rowVersion: RowVersion,
  answer: z.string().check(z.trim(), z.minLength(1)),
});
export type AnswerQuestionInput = z.infer<typeof AnswerQuestionInput>;

/**
 * `secrets`, without `ciphertext`, `wrapped_dek` or `kms_key_id` (rule 3): the
 * value is write-only and never comes back.
 */
export const SecretDto = z.object({
  id: Uuid,
  missionId: z.nullable(Uuid),
  clientId: z.nullable(Uuid),
  name: z.string(),
  keyVersion: z.int(),
  state: z.enum(SecretState),
  destroyedAt: z.nullable(IsoTime),
  createdAt: IsoTime,
  ...mutableFields,
});
export type SecretDto = z.infer<typeof SecretDto>;

/** Route 45: write-only. Step-up. (Step 4, per CR-1.) */
export const PutSecretInput = z.object({
  missionId: Uuid,
  secretName: z.string().check(z.minLength(1)),
  value: z.string().check(z.minLength(1)),
});
export type PutSecretInput = z.infer<typeof PutSecretInput>;
