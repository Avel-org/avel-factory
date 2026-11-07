import { Page } from "../dto/common.js";
import {
  AnswerQuestionInput,
  ApproveCheckpointInput,
  CheckpointDto,
  CheckpointIdInput,
  CreateUploadInput,
  DeleteUploadInput,
  FactDto,
  ListUploadsInput,
  PutSecretInput,
  QuestionDto,
  ReopenCheckpointInput,
  RequestCheckpointChangesInput,
  SecretDto,
  UpdateCheckpointSectionInput,
  UpdateFactInput,
  UploadDto,
} from "../dto/gate0.js";
import { route } from "./route.js";

const tag = "Gate 0";

export const gate0 = {
  listUploads: route(35, "GET", "/api/missions/{missionId}/uploads", tag, "List uploads")
    .input(ListUploadsInput)
    .output(Page(UploadDto)),
  createUpload: route(36, "POST", "/api/missions/{missionId}/uploads", tag, "Upload")
    .input(CreateUploadInput)
    .output(UploadDto),
  deleteUpload: route(
    37,
    "DELETE",
    "/api/uploads/{uploadId}",
    tag,
    "Refused once an approved fact cites the upload",
  )
    .input(DeleteUploadInput)
    .output(UploadDto),
  updateCheckpointSection: route(
    38,
    "PATCH",
    "/api/checkpoints/{checkpointId}/sections/{sectionKey}",
    tag,
    "Edit one section",
  )
    .input(UpdateCheckpointSectionInput)
    .output(CheckpointDto),
  draftCheckpoint: route(39, "POST", "/api/checkpoints/{checkpointId}/drafts", tag, "Generate")
    .input(CheckpointIdInput)
    .output(CheckpointDto),
  approveCheckpoint: route(40, "POST", "/api/checkpoints/{checkpointId}/approvals", tag, "Approve")
    .input(ApproveCheckpointInput)
    .output(CheckpointDto),
  requestCheckpointChanges: route(
    41,
    "POST",
    "/api/checkpoints/{checkpointId}/change-requests",
    tag,
    "Ask for changes",
  )
    .input(RequestCheckpointChangesInput)
    .output(CheckpointDto),
  reopenCheckpoint: route(42, "POST", "/api/checkpoints/{checkpointId}/reopenings", tag, "Reopen")
    .input(ReopenCheckpointInput)
    .output(CheckpointDto),
  updateFact: route(43, "PATCH", "/api/facts/{factId}", tag, "Confirm or reject")
    .input(UpdateFactInput)
    .output(FactDto),
  answerQuestion: route(44, "POST", "/api/questions/{questionId}/answers", tag, "Answer")
    .input(AnswerQuestionInput)
    .output(QuestionDto),
  putSecret: route(
    45,
    "PUT",
    "/api/missions/{missionId}/secrets/{secretName}",
    tag,
    "Write-only. **Step-up.** (Step 4, per CR-1.)",
    { stepUp: true },
  )
    .input(PutSecretInput)
    .output(SecretDto),
};
