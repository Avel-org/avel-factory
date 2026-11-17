import { Page, PageQuery } from "../dto/common.js";
import {
  CreateNoteInput,
  NoteDto,
  OperatorEventInput,
  OperatorEventResultDto,
  TimeEntryDto,
  UpdateTimeEntryInput,
} from "../dto/your-work.js";
import { route } from "./route.js";

const tag = "Your work";

export const operator = {
  recordEvent: route(
    65,
    "POST",
    "/api/operator/events",
    tag,
    "Commits from the git hook, CLI activity heartbeats, hand-entered time",
  )
    .input(OperatorEventInput)
    .output(OperatorEventResultDto),
};

export const timeEntries = {
  update: route(66, "PATCH", "/api/time-entries/{timeEntryId}", tag, "Confirm or edit")
    .input(UpdateTimeEntryInput)
    .output(TimeEntryDto),
};

export const notes = {
  list: route(67, "GET", "/api/notes", tag, "Your notes").input(PageQuery).output(Page(NoteDto)),
  create: route(68, "POST", "/api/notes", tag, "Add a note, from the web or CLI")
    .input(CreateNoteInput)
    .output(NoteDto),
};
