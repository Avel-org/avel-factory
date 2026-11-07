import { z } from "zod";
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
  sessionId: Uuid.nullable(),
  blobKey: z.string().nullable(),
  name: z.string(),
  mime: z.string(),
  sizeBytes: z.int(),
  parseStatus: z.enum(UploadParseStatus),
  state: z.enum(UploadState),
  removedAt: IsoTime.nullable(),
  createdAt: IsoTime,
  ...mutableFields,
});
export type UploadDto = z.infer<typeof UploadDto>;

export const ListUploadsInput = PageQuery.extend({ missionId: Uuid });
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
  approvedAt: IsoTime.nullable(),
  approvedBy: Uuid.nullable(),
  createdAt: IsoTime,
  ...mutableFields,
});
export type CheckpointDto = z.infer<typeof CheckpointDto>;

export const CheckpointIdInput = z.object({ checkpointId: Uuid });
export type CheckpointIdInput = z.infer<typeof CheckpointIdInput>;

/** Route 38: edit one section of `checkpoints.sections`. */
export const UpdateCheckpointSectionInput = z.object({
  checkpointId: Uuid,
  sectionKey: z.string().min(1),
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
  reason: Reason.optional(),
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
  messageId: Uuid.nullable(),
  spanStart: z.int().nullable(),
  spanEnd: z.int().nullable(),
  uploadId: Uuid.nullable(),
  repoCommit: z.string().nullable(),
  repoPath: z.string().nullable(),
  supersedesFactId: Uuid.nullable(),
  scanFlagged: z.boolean(),
  redactedAt: IsoTime.nullable(),
  createdAt: IsoTime,
  ...mutableFields,
});
export type FactDto = z.infer<typeof FactDto>;

/** Route 43: "Confirm or reject". */
export const UpdateFactInput = z.object({
  factId: Uuid,
  rowVersion: RowVersion,
  status: z.enum(FactStatus).exclude(["proposed"]),
});
export type UpdateFactInput = z.infer<typeof UpdateFactInput>;

/** `questions`. */
export const QuestionDto = z.object({
  id: Uuid,
  sessionId: Uuid,
  stage: z.enum(Stage),
  text: z.string(),
  options: Json.nullable(),
  recommended: z.string().nullable(),
  answer: z.string().nullable(),
  answeredAt: IsoTime.nullable(),
  blocking: z.boolean(),
  moduleLabel: z.string().nullable(),
  createdAt: IsoTime,
  ...mutableFields,
});
export type QuestionDto = z.infer<typeof QuestionDto>;

/** Route 44: answer. */
export const AnswerQuestionInput = z.object({
  questionId: Uuid,
  answer: z.string().trim().min(1),
});
export type AnswerQuestionInput = z.infer<typeof AnswerQuestionInput>;

/**
 * `secrets`, without `ciphertext`, `wrapped_dek` or `kms_key_id` (rule 3): the
 * value is write-only and never comes back.
 */
export const SecretDto = z.object({
  id: Uuid,
  missionId: Uuid.nullable(),
  clientId: Uuid.nullable(),
  name: z.string(),
  keyVersion: z.int(),
  state: z.enum(SecretState),
  destroyedAt: IsoTime.nullable(),
  createdAt: IsoTime,
  ...mutableFields,
});
export type SecretDto = z.infer<typeof SecretDto>;

/** Route 45: write-only. Step-up. (Step 4, per CR-1.) */
export const PutSecretInput = z.object({
  missionId: Uuid,
  secretName: z.string().min(1),
  value: z.string().min(1),
});
export type PutSecretInput = z.infer<typeof PutSecretInput>;
