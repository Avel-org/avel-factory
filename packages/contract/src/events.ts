/**
 * Event kinds, their prefixes and their owning modules (contract.md section 5, E5; CR-W1;
 * CR-W10).
 *
 * CR-W10 (accepted, Nov 12): every kind is `<module>.<object>.<verb>`, lowercase, snake_case
 * within a part, the verb in the past tense. This replaces CR-15 item 8's entity names
 * (`mission.created`): no event had been stored when the rename landed, so nothing stored
 * is renamed.
 *
 * Two prefixes aren't backend modules (CR-W10's two calls, both accepted):
 * - `missions.` for the mission lifecycle. The `factory` module writes them (it owns
 *   `missions`), and the web's `missions` module handles them.
 * - `system.` for factory-wide alerts. `platform` writes them.
 * Every other prefix is the module that writes the kind, so ownership reads off the name.
 *
 * `eventOwners` is exhaustive: it `satisfies Record<EventKind, Module>`, so a kind added
 * without an owner fails to compile, and so does an owner for a kind that isn't one. The
 * payload of each kind is in `dto/events-and-traces.ts` (`eventPayloads`), which is
 * exhaustive the same way.
 */

/**
 * The backend's modules (Backend modules and build plan, section 4), with the server side
 * of `contract` named `platform` (CR-15 item 3). `pipeline` is new with CR-W17: it owns
 * leads and follow-ups (CR-W17's open question 1).
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
  "pipeline",
] as const;
export type Module = (typeof Module)[number];

/** An event kind's first part: a module, or `missions` or `system` (CR-W10). */
export const EventPrefix = [...Module, "missions", "system"] as const;
export type EventPrefix = (typeof EventPrefix)[number];

/**
 * The modules that own decision kinds (Frontend Map v0.6, "Decision kinds belong to the
 * module that owns the work"; CR-W17 adds `pipeline`). Each emits
 * `<module>.decision.opened|resolved|expired|returned` for its own kinds (CR-W10, CR-W15).
 */
export const DecisionOwner = [
  "onboarding",
  "factory",
  "integrator",
  "gate",
  "delivery",
  "metering",
  "knowledge",
  "rules",
  "roster",
  "pipeline",
] as const;
export type DecisionOwner = (typeof DecisionOwner)[number];

export const DecisionVerb = ["opened", "resolved", "expired", "returned"] as const;
export type DecisionVerb = (typeof DecisionVerb)[number];

export type DecisionEventKind = `${DecisionOwner}.decision.${DecisionVerb}`;

const decisionKinds = DecisionOwner.flatMap((m) =>
  DecisionVerb.map((v) => `${m}.decision.${v}` as const),
) as DecisionEventKind[];

/** Every kind that isn't a decision event, with the module that writes it. */
const objectKinds = {
  // missions: the lifecycle, written by factory
  "missions.mission.created": "factory",
  "missions.mission.changed": "factory",
  "missions.mission.kind_set": "factory",
  "missions.mission.paused": "factory",
  "missions.mission.resumed": "factory",
  "missions.mission.cancelled": "factory",
  "missions.mission.closed": "factory",
  // onboarding: Canon and Gate 0
  "onboarding.session.changed": "onboarding",
  "onboarding.message.created": "onboarding",
  "onboarding.message.updated": "onboarding",
  "onboarding.fact.proposed": "onboarding",
  "onboarding.fact.changed": "onboarding",
  "onboarding.checkpoint.changed": "onboarding",
  "onboarding.question.changed": "onboarding",
  "onboarding.plan.finalized": "onboarding",
  // factory: modules, dispatches, the package
  "factory.module.changed": "factory",
  "factory.dispatch.changed": "factory",
  "factory.task_doc.rendered": "factory",
  "factory.dispatch_package.rendered": "factory",
  // runner: attempts
  "runner.attempt.started": "runner",
  "runner.attempt.ended": "runner",
  // integrator: the mission branch
  "integrator.commit.changed": "integrator",
  "integrator.tests.locked": "integrator",
  "integrator.dispatch_package.committed": "integrator",
  // gate: gates, findings, receipts
  "gate.evaluation.recorded": "gate",
  "gate.finding.created": "gate",
  "gate.finding.changed": "gate",
  "gate.receipt.issued": "gate",
  "gate.pass.approved": "gate",
  "gate.override.recorded": "gate",
  // delivery
  "delivery.release.approved": "delivery",
  "delivery.delivery.changed": "delivery",
  "delivery.dispatch_package.built": "delivery",
  // metering: AI spend against budgets only (CR-W1; CR-W20 section 3)
  "metering.spend.updated": "metering",
  "metering.budget.warned": "metering",
  "metering.budget.increased": "metering",
  // knowledge: factory PRs and KB releases
  "knowledge.change.opened": "knowledge",
  "knowledge.change.updated": "knowledge",
  "knowledge.change.closed": "knowledge",
  "knowledge.release.cut": "knowledge",
  // evals (CR-W16)
  "evals.run.started": "evals",
  "evals.run.finished": "evals",
  // pipeline (CR-W17)
  "pipeline.lead.created": "pipeline",
  "pipeline.lead.closed": "pipeline",
  "pipeline.followup.sent": "pipeline",
  // system: factory-wide alerts, written by platform (CR-W5)
  "system.alert.raised": "platform",
  "system.alert.cleared": "platform",
} as const satisfies Record<string, Module>;

type ObjectEventKind = keyof typeof objectKinds;

/** Every event kind: the object kinds, then each decision owner's four. */
export const EventKind = [
  ...(Object.keys(objectKinds) as ObjectEventKind[]),
  ...decisionKinds,
] as const;
export type EventKind = ObjectEventKind | DecisionEventKind;

/** Each kind's owning module: the module that writes it. */
export const eventOwners: { readonly [K in EventKind]: Module } = {
  ...objectKinds,
  ...(Object.fromEntries(decisionKinds.map((k) => [k, k.split(".")[0]])) as Record<
    DecisionEventKind,
    DecisionOwner
  >),
} satisfies Record<EventKind, Module>;

/** The CR-W10 rule: three lowercase snake_case parts, the first a known prefix. */
export const EVENT_KIND_PATTERN = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/** The module that owns an event kind. */
export function ownerOf(kind: EventKind): Module {
  return eventOwners[kind];
}

/** An event kind's prefix: the web module that handles it (CR-W10). */
export function prefixOf(kind: EventKind): EventPrefix {
  return kind.split(".")[0] as EventPrefix;
}

/** The kinds a module owns, in `EventKind` order. */
export function kindsOwnedBy(module: Module): EventKind[] {
  return EventKind.filter((kind) => eventOwners[kind] === module);
}

/** The kinds with a given prefix, in `EventKind` order. */
export function kindsWithPrefix(prefix: EventPrefix): EventKind[] {
  return EventKind.filter((kind) => prefixOf(kind) === prefix);
}

/**
 * CR-W1's mapping from the design's names, for anyone reading an older doc. Nothing stored
 * uses the old names.
 */
export const renamedEventKinds = {
  "dispatch.ready": "factory.dispatch.changed",
  "dispatch.started": "factory.dispatch.changed",
  "dispatch.parked": "factory.dispatch.changed",
  "attempt.started": "runner.attempt.started",
  "attempt.ended": "runner.attempt.ended",
  "mission.created": "missions.mission.created",
  "pass.approved": "gate.pass.approved",
  "receipt.issued": "gate.receipt.issued",
  "usage.recorded": "metering.spend.updated",
  "task_doc.rendered": "factory.task_doc.rendered",
  "message.stopped": "onboarding.message.updated",
  "mission.closed": "missions.mission.closed",
} as const satisfies Record<string, EventKind>;
