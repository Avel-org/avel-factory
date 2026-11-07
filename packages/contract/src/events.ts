/**
 * Event kinds and their owning modules (contract.md section 5, E5; CR-15 item 8; B5; O1).
 *
 * Kinds keep their entity names, so nothing stored is ever renamed. `eventOwners` is
 * exhaustive: it `satisfies Record<EventKind, Module>`, so a kind added to `EventKind`
 * without an owner fails to compile, and so does an owner for a kind that isn't one
 * (done-when 7). Each later step adds its own kinds here.
 */

/**
 * The backend's 19 modules (Backend modules and build plan, section 4), with the
 * server side of `contract` named `platform` (CR-15 item 3; contract.md section 6).
 */
export const Module = [
  "platform",
  "events",
  "audit",
  "cli",
  "onboarding",
  "packages",
  "plan",
  "roster",
  "factory",
  "integrator",
  "runner",
  "harness",
  "compute",
  "metering",
  "gate",
  "delivery",
  "rules",
  "knowledge",
  "evals",
] as const;
export type Module = (typeof Module)[number];

/** Step 0's 12 kinds (O1). `cli.ran` comes in with CR-17. */
export const EventKind = [
  "dispatch.ready",
  "dispatch.started",
  "dispatch.parked",
  "attempt.started",
  "attempt.ended",
  "mission.created",
  "pass.approved",
  "receipt.issued",
  "usage.recorded",
  "task_doc.rendered",
  "message.stopped",
  "mission.closed",
] as const;
export type EventKind = (typeof EventKind)[number];

/** Each kind's owning module (contract.md section 5, "The kinds"). */
export const eventOwners = {
  "dispatch.ready": "factory",
  "dispatch.started": "factory",
  "dispatch.parked": "factory",
  "attempt.started": "runner",
  "attempt.ended": "runner",
  "mission.created": "factory",
  "pass.approved": "gate",
  "receipt.issued": "gate",
  "usage.recorded": "metering",
  "task_doc.rendered": "factory",
  "message.stopped": "onboarding",
  "mission.closed": "factory",
} as const satisfies Record<EventKind, Module>;

/** The module that owns an event kind. */
export function ownerOf(kind: EventKind): Module {
  return eventOwners[kind];
}

/** The kinds a module owns, in `EventKind` order. */
export function kindsOwnedBy(module: Module): EventKind[] {
  return EventKind.filter((kind) => eventOwners[kind] === module);
}
