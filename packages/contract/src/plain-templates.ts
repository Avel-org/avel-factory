/**
 * CR-W9: the plain templates. Code writes every plain block from typed fields, here, so
 * the server, the CLI, receipts and the contract mock say the same thing. No model writes
 * plain text at read time (CR-W1 open question 4: confirmed).
 *
 * Names passed in (a project's, a module's, a client's) are operator- or plan-written and
 * already plain. Nothing here takes an ID, hash or gate number; the template tests check
 * every state's output against the length limits and the ID lint (`plainTextIssues`).
 */
import type {
  DecisionPlain,
  DispatchPlain,
  MissionPlain,
  ModulePlain,
  PackagePlain,
  ReceiptPlain,
} from "./dto/plain.js";
import type {
  DecisionKind,
  DispatchRole,
  DispatchState,
  MissionDisplayState,
  ModuleRunState,
  ProposalKind,
  ReceiptVerdict,
} from "./value-lists.js";

/** Bumped when any template's wording changes. */
export const PLAIN_TEMPLATES_VERSION = "1.0.0";

/** Cut to `max` characters at a word, with an ellipsis. */
export function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const at = cut.lastIndexOf(" ");
  return `${(at > max / 2 ? cut.slice(0, at) : cut).trimEnd()}…`;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// ---------------------------------------------------------------- missions

const missionStep: Record<MissionDisplayState, string> = {
  draft: "not started yet",
  onboarding: "being scoped with Canon",
  approved: "plan approved, getting ready",
  rendered: "ready to build",
  running: "being built",
  reviewing: "in final checks",
  deciding: "waiting on your decision",
  awaiting_release: "ready for you to release",
  refreshing: "moving onto the client's latest code",
  delivering: "being delivered",
  delivered: "delivered",
  closed: "closed",
  cancelled: "cancelled",
  paused: "paused by you",
  blocked_on_you: "waiting on you",
};

export function missionPlain(m: {
  name: string;
  clientName: string | null;
  kind: "client" | "internal" | "template" | null;
  displayState: MissionDisplayState;
  modules: { total: number; landed: number };
  needsYouCount: number;
}): MissionPlain {
  const who =
    m.kind === "template"
      ? "internal template"
      : m.kind === "internal"
        ? "internal project"
        : m.clientName
          ? `for ${m.clientName}`
          : "client or template not set yet";
  const parts =
    m.modules.total > 0 ? `, ${m.modules.landed} of ${plural(m.modules.total, "part")} done` : "";
  const you = m.needsYouCount > 0 ? `, ${plural(m.needsYouCount, "thing")} waiting on you` : "";
  return {
    summary: clip(`${m.name} (${who}): ${missionStep[m.displayState]}${parts}${you}`, 120),
  };
}

// ---------------------------------------------------------------- modules

const moduleStep: Record<ModuleRunState, string> = {
  blocked: "Waiting on another part",
  tests_writing: "Tests being written",
  tests_locked: "Tests locked, build next",
  building: "Being built",
  in_review: "Being reviewed",
  fixing: "Review fixes underway",
  integrating: "Being merged in",
  landed: "Done and merged",
  retrying: "Being built again",
  reworking: "Being reworked",
  parked: "Stopped, needs your call",
};

const tryWord = ["", " (second try)", " (third try)", " (last try)"];

export function modulePlain(m: {
  name: string;
  goal: string;
  state: ModuleRunState;
  /** 0 for the first attempt, 1 to 3 for retries. */
  retry: number;
}): ModulePlain {
  const retrying = m.state === "building" || m.state === "retrying";
  return {
    name: clip(m.name, 60),
    summary: clip(m.goal, 120),
    step: clip(`${moduleStep[m.state]}${retrying ? (tryWord[m.retry] ?? "") : ""}`, 60),
  };
}

// ---------------------------------------------------------------- dispatches

const roleWords: Record<DispatchRole, string> = {
  build: "Builds it",
  "test-unit": "Writes the tests",
  "test-e2e": "Writes the end-to-end tests",
  "review-spec": "Checks it against the plan",
  "review-security": "Checks its security",
  "red-team": "Tries to break it",
  "ui-contract": "Writes the screen contract",
  "review-frontend": "Reviews the screens",
  "review-a11y-perf": "Checks access and speed",
  "api-contract": "Writes the API contract",
  "review-backend": "Reviews the server side",
};

const dispatchStep: Record<DispatchState, string> = {
  pending: "Waiting its turn",
  ready: "Ready to start",
  starting: "Starting",
  running: "Working",
  reporting: "Reporting back",
  waiting_dependency: "Waiting on something it needs",
  blocked_on_you: "Waiting on you",
  succeeded: "Finished",
  failed: "Didn't finish",
  parked: "Stopped, needs your call",
  cancelled: "Cancelled",
};

export function dispatchPlain(d: {
  moduleName: string | null;
  role: DispatchRole;
  state: DispatchState;
}): DispatchPlain {
  const role = roleWords[d.role];
  return {
    summary: clip(d.moduleName ? `${role} for ${d.moduleName}` : role, 120),
    role,
    step: dispatchStep[d.state],
  };
}

// ---------------------------------------------------------------- decisions

const proposalTitle: Record<ProposalKind, string> = {
  parked: "A part stopped and needs your call",
  converge: "Reviewers disagree on a part",
  contract_change: "An agent asks to change an agreed contract",
  dependency: "An agent asks for a new dependency",
  quarantine: "A flaky test should be set aside",
  budget_increase: "A part needs more AI budget",
  reentry: "Scope needs another look with Canon",
  dispute: "An agent disputes a locked test",
  gate5: "The final check found a problem",
  suppression: "An agent asks to silence a rule",
  test_change: "An agent asks to change a locked test",
  review_limit: "A part hit its review limit",
  repin: "A part should move to a newer agent setup",
};

/** The fields a decision's text is built from, per kind. */
export type DecisionFacts =
  | { kind: "proposal"; proposalKind: ProposalKind; subject: string | null; reason: string }
  | { kind: "factory_change"; area: string; title: string }
  | { kind: "checkpoint"; checkpointName: string; projectName: string; next: string | null }
  | { kind: "plan_finalize"; projectName: string; parts: number }
  | { kind: "checkpoint_question"; question: string; subjectLabel: string; blocking: boolean }
  | { kind: "pass_approval"; projectName: string; caps: number }
  | {
      kind: "release";
      projectName: string;
      verdict: "verified" | "pass";
      method: "pr" | "push" | "zip";
    }
  | { kind: "dispatch_package_commit"; projectName: string; repoName: string }
  | { kind: "followup_send"; clientName: string; channel: "email" | "copy" }
  | { kind: "upkeep_offer"; clientName: string; channel: "email" | "copy" };

const methodWords = { pr: "a pull request", push: "a push to their repo", zip: "a zip file" };

/** The plain block of a decision, without `returned` (see `returnedLine`). */
export function decisionPlain(f: DecisionFacts, returned: string | null = null): DecisionPlain {
  const p = (title: string, why: string, yes: string, no: string | null): DecisionPlain => ({
    title: clip(title, 120),
    why: clip(why, 240),
    ifYouApprove: clip(yes, 240),
    ifYouReject: no === null ? null : clip(no, 240),
    returned,
  });
  switch (f.kind) {
    case "proposal":
      return p(
        f.subject
          ? `${proposalTitle[f.proposalKind]}: ${f.subject}`
          : proposalTitle[f.proposalKind],
        f.reason,
        "The factory carries out the option you choose.",
        "Nothing changes, and the part stays where it is.",
      );
    case "factory_change":
      return p(
        `Factory change: ${f.title}`,
        `A change to the factory's ${f.area.replace("_", " ")}, reviewed before it's merged.`,
        "It's merged, and new work uses it from now on.",
        "It isn't merged. Work in progress isn't affected.",
      );
    case "checkpoint":
      return p(
        `Approve ${f.checkpointName} for ${f.projectName}`,
        "Canon has drafted this part of the scope from what you and the client said.",
        f.next ? `It's locked in, and Canon moves on to ${f.next}.` : "It's locked in.",
        "Canon revises it with your note.",
      );
    case "plan_finalize":
      return p(
        `Approve the plan for ${f.projectName}`,
        `The plan splits the work into ${plural(f.parts, "part")}, each with its own tests.`,
        "Building starts, and the deadline clock starts.",
        null,
      );
    case "checkpoint_question":
      return p(
        f.question,
        f.blocking
          ? `Canon needs this before the scope can be approved (${f.subjectLabel}).`
          : `This shapes ${f.subjectLabel}.`,
        "Canon takes your answer and carries on.",
        null,
      );
    case "pass_approval":
      return p(
        `Accept a passing result for ${f.projectName}`,
        `Everything passed, with ${plural(f.caps, "known limit")} you'd ship with.`,
        "You can release it as passing rather than verified.",
        "It goes back for more work.",
      );
    case "release":
      return p(
        `Release ${f.projectName}`,
        f.verdict === "verified"
          ? "Every check passed on the exact version the client gets."
          : "It passed, with the limits you accepted.",
        `The client gets that exact version, as ${methodWords[f.method]}.`,
        null,
      );
    case "dispatch_package_commit":
      return p(
        `Add the ${f.projectName} work instructions to the ${f.repoName} repo`,
        "The instructions the agents work from are ready to keep with the client's code.",
        "They're added to the project's branch in one commit.",
        null,
      );
    case "followup_send":
    case "upkeep_offer": {
      const what = f.kind === "followup_send" ? "a follow-up" : "an upkeep offer";
      return p(
        `Send ${what} to ${f.clientName}`,
        f.channel === "copy"
          ? "You send this yourself: copy it, send it, then mark it as sent."
          : "The factory sends it from your address once you approve.",
        f.channel === "copy" ? "It's recorded as sent by you." : "It's sent now.",
        "It isn't sent, and no reminder follows.",
      );
    }
  }
}

/**
 * CR-W15's `plain.returned`, set exactly when an earlier decision was superseded before it
 * took effect. Versions are plain numbers ("version 5"), never hashes.
 */
export function returnedLine(r: {
  verdict: "approved" | "rejected" | "chose" | "answered";
  boundVersion: number | null;
  newVersion: number | null;
  changedBy: "an agent" | "Canon" | "the client's code" | "a new check";
}): string {
  const said = {
    approved: "approved",
    rejected: "rejected",
    chose: "decided",
    answered: "answered",
  }[r.verdict];
  const was = r.boundVersion === null ? "this" : `version ${r.boundVersion}`;
  const now = r.newVersion === null ? "a new version" : `version ${r.newVersion}`;
  return clip(
    `You ${said} ${was}. ${r.changedBy[0]?.toUpperCase()}${r.changedBy.slice(1)} changed it to ${now} before it took effect, so your decision no longer applies.`,
    240,
  );
}

/** Every decision kind has a template; the type fails to compile otherwise. */
export const decisionTemplateKinds = {
  proposal: true,
  factory_change: true,
  checkpoint: true,
  plan_finalize: true,
  checkpoint_question: true,
  pass_approval: true,
  release: true,
  dispatch_package_commit: true,
  followup_send: true,
  upkeep_offer: true,
} as const satisfies Record<DecisionKind, true>;

// ---------------------------------------------------------------- receipts and packages

export function receiptPlain(r: {
  verdict: ReceiptVerdict;
  tests: { passed: number; total: number };
  acceptance: { verified: number; total: number };
  accepted: number;
}): ReceiptPlain {
  const verdictLine = {
    verified: `All ${r.tests.total} tests pass on the exact version the client gets`,
    pass: `It passes, with ${plural(r.accepted, "known limit")} you accepted`,
    fail: "It didn't pass, so it can't be released",
  }[r.verdict];
  return {
    verdictLine: clip(verdictLine, 120),
    proofLines: [
      `${r.tests.passed} of ${plural(r.tests.total, "test")} pass`,
      `${r.acceptance.verified} of ${plural(r.acceptance.total, "acceptance example")} checked`,
      "Every proof file is listed with its fingerprint",
    ],
  };
}

export function packagePlain(p: { projectName: string; repoName: string }): PackagePlain {
  return {
    summary: clip(`Add the ${p.projectName} work instructions to the ${p.repoName} repo`, 120),
  };
}
