import * as z from "zod/mini";
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
  missionId: z.nullable(Uuid),
  dispatchId: z.nullable(Uuid),
  attemptId: z.nullable(Uuid),
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
  missionId: z.optional(Uuid),
});
export type EventStreamInput = z.infer<typeof EventStreamInput>;

/** `agent_traces`. */
export const AgentTraceDto = z.object({
  traceSeq: z.int(),
  at: IsoTime,
  attemptId: z.nullable(Uuid),
  sessionId: z.nullable(Uuid),
  kind: z.enum(AgentTraceKind),
  body: Json,
});
export type AgentTraceDto = z.infer<typeof AgentTraceDto>;

/** Route 64's input: `?attemptId=` or `?sessionId=`, exactly one. */
export const TraceStreamInput = z
  .object({
    attemptId: z.optional(Uuid),
    sessionId: z.optional(Uuid),
  })
  .check(
    z.refine((v) => (v.attemptId === undefined) !== (v.sessionId === undefined), {
      message: "Send exactly one of attemptId and sessionId",
    }),
  );
export type TraceStreamInput = z.infer<typeof TraceStreamInput>;

/**
 * `mission.created`'s payload carries the mission's kind (CR-13: "the `mission.created`
 * event carries it"). Other kinds' payloads aren't typed until CR-W1 is decided.
 */
export const MissionCreatedPayload = z.looseObject({ kind: z.enum(ProjectKind) });
export type MissionCreatedPayload = z.infer<typeof MissionCreatedPayload>;
