import * as z from "zod/mini";
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
  dispatchId: z.nullable(Uuid),
  activity: z.enum(HumanTimeActivity),
  startedAt: IsoTime,
  endedAt: z.nullable(IsoTime),
  minutes: z.nullable(z.int()),
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
    missionId: z.optional(Uuid),
    at: IsoTime,
  }),
  z.object({
    source: z.literal("time"),
    missionId: Uuid,
    dispatchId: z.optional(Uuid),
    activity: z.enum(HumanTimeActivity),
    startedAt: IsoTime,
    minutes: z.int().check(z.minimum(1)),
  }),
]);
export type OperatorEventInput = z.infer<typeof OperatorEventInput>;

/** Route 65's output: the time entry it opened or moved, if any. */
export const OperatorEventResultDto = z.object({
  timeEntry: z.nullable(TimeEntryDto),
});
export type OperatorEventResultDto = z.infer<typeof OperatorEventResultDto>;

/** Route 66: "Confirm or edit". */
export const UpdateTimeEntryInput = z.object({
  timeEntryId: Uuid,
  rowVersion: RowVersion,
  state: z.optional(
    z.enum(["confirmed", "discarded"] as const satisfies readonly HumanTimeState[]),
  ),
  activity: z.optional(z.enum(HumanTimeActivity)),
  minutes: z.optional(z.int().check(z.minimum(0))),
});
export type UpdateTimeEntryInput = z.infer<typeof UpdateTimeEntryInput>;

/** `notes`. */
export const NoteDto = z.object({
  id: Uuid,
  missionId: z.nullable(Uuid),
  userId: Uuid,
  body: z.string(),
  source: z.enum(NoteSource),
  state: z.enum(ArchiveStatus),
  redactedAt: z.nullable(IsoTime),
  createdAt: IsoTime,
  ...mutableFields,
});
export type NoteDto = z.infer<typeof NoteDto>;

/** Route 68: "Add a note, from the web or CLI". */
export const CreateNoteInput = z.object({
  body: z.string().check(z.trim(), z.minLength(1)),
  source: z.enum(NoteSource),
  missionId: z.optional(Uuid),
});
export type CreateNoteInput = z.infer<typeof CreateNoteInput>;
