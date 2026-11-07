import { z } from "zod";
import { EventKind } from "../events.js";
import { AgentTraceKind, ProjectKind } from "../value-lists.js";
import { IsoTime, Json, Uuid } from "./common.js";

/** Events and traces (routes 63 and 64). */

/**
 * `events`: the map's row (contract.md section 5, Events, "Shape"). `kind` is one of
 * the contract's event kinds, each with an owning module (`eventOwners`).
 */
export const EventDto = z.object({
  seq: z.int(),
  schemaVersion: z.int(),
  missionId: Uuid.nullable(),
  dispatchId: Uuid.nullable(),
  attemptId: Uuid.nullable(),
  kind: z.enum(EventKind),
  payload: Json,
  at: IsoTime,
});
export type EventDto = z.infer<typeof EventDto>;

/**
 * Route 63's input: `?missionId=`. Resuming from `Last-Event-ID` (the event's `seq`)
 * is the event iterator's, not a field here.
 */
export const EventStreamInput = z.object({
  missionId: Uuid.optional(),
});
export type EventStreamInput = z.infer<typeof EventStreamInput>;

/** `agent_traces`. */
export const AgentTraceDto = z.object({
  traceSeq: z.int(),
  at: IsoTime,
  attemptId: Uuid.nullable(),
  sessionId: Uuid.nullable(),
  kind: z.enum(AgentTraceKind),
  body: Json,
});
export type AgentTraceDto = z.infer<typeof AgentTraceDto>;

/** Route 64's input: `?attemptId=` or `?sessionId=`, exactly one. */
export const TraceStreamInput = z
  .object({
    attemptId: Uuid.optional(),
    sessionId: Uuid.optional(),
  })
  .refine((v) => (v.attemptId === undefined) !== (v.sessionId === undefined), {
    message: "Send exactly one of attemptId and sessionId",
  });
export type TraceStreamInput = z.infer<typeof TraceStreamInput>;

/**
 * `mission.created`'s payload carries the mission's kind (CR-13: "the `mission.created`
 * event carries it"). Other kinds' payloads aren't typed until CR-W1 is decided.
 */
export const MissionCreatedPayload = z.object({ kind: z.enum(ProjectKind) }).loose();
export type MissionCreatedPayload = z.infer<typeof MissionCreatedPayload>;
