import { z } from "zod";
import {
  ArchiveStatus,
  HumanTimeActivity,
  HumanTimeSource,
  HumanTimeState,
  NoteSource,
} from "../value-lists.js";
import { IsoTime, mutableFields, RowVersion, Sha, Uuid } from "./common.js";

/** Your work (routes 65 to 68). */

/** `human_time`, which the routes call time entries. */
export const TimeEntryDto = z.object({
  id: Uuid,
  userId: Uuid,
  missionId: Uuid,
  dispatchId: Uuid.nullable(),
  activity: z.enum(HumanTimeActivity),
  startedAt: IsoTime,
  endedAt: IsoTime.nullable(),
  minutes: z.int().nullable(),
  source: z.enum(HumanTimeSource),
  state: z.enum(HumanTimeState),
  createdAt: IsoTime,
  ...mutableFields,
});
export type TimeEntryDto = z.infer<typeof TimeEntryDto>;

/**
 * Route 65: "Commits from the git hook, CLI activity heartbeats, hand-entered time".
 * One body per source; the fields of each are drafted from `human_time` and the row.
 */
export const OperatorEventInput = z.discriminatedUnion("source", [
  z.object({
    source: z.literal("commit"),
    missionId: Uuid,
    commitSha: Sha,
    at: IsoTime,
  }),
  z.object({
    source: z.literal("heartbeat"),
    missionId: Uuid.optional(),
    at: IsoTime,
  }),
  z.object({
    source: z.literal("time"),
    missionId: Uuid,
    dispatchId: Uuid.optional(),
    activity: z.enum(HumanTimeActivity),
    startedAt: IsoTime,
    minutes: z.int().min(1),
  }),
]);
export type OperatorEventInput = z.infer<typeof OperatorEventInput>;

/** Route 65's output: the time entry it opened or moved, if any. */
export const OperatorEventResultDto = z.object({
  timeEntry: TimeEntryDto.nullable(),
});
export type OperatorEventResultDto = z.infer<typeof OperatorEventResultDto>;

/** Route 66: "Confirm or edit". */
export const UpdateTimeEntryInput = z.object({
  timeEntryId: Uuid,
  rowVersion: RowVersion,
  state: z.enum(HumanTimeState).extract(["confirmed", "discarded"]).optional(),
  activity: z.enum(HumanTimeActivity).optional(),
  minutes: z.int().min(0).optional(),
});
export type UpdateTimeEntryInput = z.infer<typeof UpdateTimeEntryInput>;

/** `notes`. */
export const NoteDto = z.object({
  id: Uuid,
  missionId: Uuid.nullable(),
  userId: Uuid,
  body: z.string(),
  source: z.enum(NoteSource),
  state: z.enum(ArchiveStatus),
  redactedAt: IsoTime.nullable(),
  createdAt: IsoTime,
  ...mutableFields,
});
export type NoteDto = z.infer<typeof NoteDto>;

/** Route 68: "Add a note, from the web or CLI". */
export const CreateNoteInput = z.object({
  body: z.string().trim().min(1),
  source: z.enum(NoteSource),
  missionId: Uuid.optional(),
});
export type CreateNoteInput = z.infer<typeof CreateNoteInput>;
