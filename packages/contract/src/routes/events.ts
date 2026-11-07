import { eventIterator } from "@orpc/contract";
import {
  AgentTraceDto,
  EventDto,
  EventStreamInput,
  TraceStreamInput,
} from "../dto/events-and-traces.js";
import { route } from "./route.js";

const tag = "Events and traces";

export const events = {
  stream: route(
    63,
    "GET",
    "/api/events/stream",
    tag,
    "Server-sent events through oRPC's event iterator; resumes from `Last-Event-ID` (the event's `seq`), replaying up to 30 days",
  )
    .input(EventStreamInput)
    .output(eventIterator(EventDto)),
};

export const traces = {
  stream: route(
    64,
    "GET",
    "/api/traces/stream",
    tag,
    "`?attemptId=` or `?sessionId=`; resumes from `Last-Event-ID` (the trace ID)",
  )
    .input(TraceStreamInput)
    .output(eventIterator(AgentTraceDto)),
};
