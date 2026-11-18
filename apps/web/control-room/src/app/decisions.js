// Decisions as contract 1.0.0 defines them: route 52 returns PendingDecisionDto, a union of ten kinds,
// and every kind approves through its own route, built from the item's target alone. This file is the
// web's side of that: a port of the contract's approveCallFor (decision-routes.ts), the matching
// "no" call where a kind has one, and the view the cards render.
//
// Nothing here invents a field. Where the prototype shows more than the contract carries, it says
// so: evidence proofs come from each line's detailRef, and suggested reasons come only from an OSA
// brief (CR-29, behind the osa flag).

export const DECISION_KINDS = [
  "proposal",
  "factory_change",
  "checkpoint",
  "plan_finalize",
  "checkpoint_question",
  "pass_approval",
  "release",
  "dispatch_package_commit",
  "followup_send",
  "upkeep_offer",
];

const EVAL_VERDICT = {
  improved: "Did better on past tasks",
  as_good: "Did as well on past tasks",
  worse: "Did worse on past tasks",
  inconclusive: "Too close to call",
};
export const KIND_LABEL = {
  proposal: "Proposal",
  factory_change: "Factory change",
  checkpoint: "Checkpoint",
  plan_finalize: "Plan",
  checkpoint_question: "Canon asks",
  pass_approval: "Pass approval",
  release: "Release",
  dispatch_package_commit: "Work instructions",
  followup_send: "Follow-up",
  upkeep_offer: "Upkeep offer",
};

const PROPOSAL_LABEL = {
  parked: "Parked part",
  converge: "Reviewers disagree",
  contract_change: "Contract change",
  dependency: "Dependency",
  quarantine: "Flaky test",
  budget_increase: "AI budget",
  reentry: "Scope again",
  dispute: "Test dispute",
  gate5: "Final check",
  suppression: "Rule silenced",
  test_change: "Test change",
  review_limit: "Review limit",
  repin: "Agent setup",
};

/** decision-routes.ts, decisionApproveRoutes: [namespace, procedure] per kind. */
export const APPROVE_ROUTES = {
  proposal: ["decisions", "decide"],
  factory_change: ["factory", "mergeChange"],
  checkpoint: ["gate0", "approveCheckpoint"],
  plan_finalize: ["missions", "finalize"],
  checkpoint_question: ["gate0", "answerQuestion"],
  pass_approval: ["missions", "approvePass"],
  release: ["missions", "release"],
  dispatch_package_commit: ["dispatchPackage", "commit"],
  followup_send: ["followups", "send"],
  upkeep_offer: ["followups", "send"],
};

/** The method and path of each procedure the cards call (from API routes.md). */
export const ROUTE_OF = {
  "decisions.decide": ["POST", "/api/proposals/{proposalId}/decisions", 54],
  "factory.mergeChange": ["POST", "/api/factory/changes/{changeId}/merges", 73],
  "gate0.approveCheckpoint": ["POST", "/api/checkpoints/{checkpointId}/approvals", 40],
  "gate0.requestCheckpointChanges": ["POST", "/api/checkpoints/{checkpointId}/change-requests", 41],
  "missions.finalize": ["POST", "/api/missions/{missionId}/finalizations", 28],
  "gate0.answerQuestion": ["POST", "/api/questions/{questionId}/answers", 44],
  "missions.approvePass": ["POST", "/api/missions/{missionId}/pass-approvals", 29],
  "missions.release": ["POST", "/api/missions/{missionId}/releases", 30],
  "dispatchPackage.commit": ["POST", "/api/missions/{missionId}/dispatch-package/commits", 114],
  "followups.send": ["POST", "/api/followups/{followupId}/sends", 121],
};

/** A port of the contract's approveCallFor(item, tap): the route and its input, from the target alone. */
export function approveCallFor(d, tap = {}) {
  const t = d.target;
  const input = {
    proposal: () => ({
      proposalId: t.proposalId,
      version: t.version,
      choice:
        tap.choice ??
        (t.choices.find((c) => c.recommended) || {}).choice ??
        (t.choices.find((c) => c.effect === "approve") || {}).choice ??
        "",
      reason: tap.reason ?? "",
    }),
    factory_change: () => ({ changeId: t.changeId, headSha: t.headSha }),
    checkpoint: () => ({ checkpointId: t.checkpointId, rowVersion: t.rowVersion }),
    plan_finalize: () => ({ missionId: t.missionId, version: t.planVersion }),
    checkpoint_question: () => {
      const choice = tap.choice ?? t.recommended ?? (t.options[0] || {}).id ?? "";
      return Object.assign(
        { questionId: t.questionId, rowVersion: t.rowVersion, choice },
        choice === "other" && tap.answer !== undefined ? { answer: tap.answer } : {},
      );
    },
    pass_approval: () => ({ missionId: t.missionId, receiptHash: t.receiptHash, reason: tap.reason ?? "" }),
    release: () =>
      Object.assign(
        { missionId: t.missionId, receiptHash: t.receiptHash },
        t.passApprovalId ? { passApprovalId: t.passApprovalId } : {},
      ),
    dispatch_package_commit: () => ({ missionId: t.missionId, packageHash: t.packageHash }),
    followup_send: () => ({ followupId: t.followupId, draftHash: t.draftHash, outcome: "sent" }),
    upkeep_offer: () => ({ followupId: t.followupId, draftHash: t.draftHash, outcome: "sent" }),
  }[d.kind]();
  return { route: APPROVE_ROUTES[d.kind], input };
}

/**
 * The "no" side, where the kind has one (rejectable). approveCallFor covers only yes; the contract
 * routes the other answers like this: a proposal's reject choice through route 54, a checkpoint's
 * change request through route 41, a follow-up skipped through route 121.
 */
export function rejectCallFor(d, tap = {}) {
  const t = d.target;
  if (!d.rejectable) return null;
  if (d.kind === "proposal") {
    const no = t.choices.find((c) => c.effect === "reject");
    return no
      ? {
          route: ["decisions", "decide"],
          input: { proposalId: t.proposalId, version: t.version, choice: no.choice, reason: tap.reason ?? "" },
        }
      : null;
  }
  if (d.kind === "checkpoint")
    return {
      route: ["gate0", "requestCheckpointChanges"],
      input: { checkpointId: t.checkpointId, rowVersion: t.rowVersion, reason: tap.reason ?? "" },
    };
  if (d.kind === "followup_send" || d.kind === "upkeep_offer")
    return {
      route: ["followups", "send"],
      input: { followupId: t.followupId, draftHash: t.draftHash, outcome: "skipped" },
    };
  return null;
}

/** The version an item is bound to, in the words of its kind (for "moved to version N"). */
export function boundVersion(d) {
  const t = d.target;
  return t.version ?? t.planVersion ?? t.rowVersion ?? null;
}

/** "Sends missions.release (POST /api/missions/{missionId}/releases)" and its input, for Details. */
export function describeCall(call) {
  if (!call) return null;
  const name = call.route.join(".");
  const r = ROUTE_OF[name] || [];
  return { name, method: r[0], path: r[1], no: r[2], input: JSON.stringify(call.input, null, 2) };
}

const SHARE = (from, to) => Math.round(((to - from) / from) * 100);

/** The options a card offers, in order: yes first, then the other answers, from the kind's own fields. */
function optionsOf(d) {
  const t = d.target;
  const opt = (key, label, consequence, effect, recommended) => ({ key, label, consequence, effect, recommended });
  switch (d.kind) {
    case "proposal": {
      const cs = t.choices.slice().sort((a, b) => (a.effect === "approve" ? -1 : b.effect === "approve" ? 1 : 0));
      return cs.map((c) => opt(c.choice, c.label, c.consequence, c.effect, !!c.recommended));
    }
    case "checkpoint_question": {
      const os = t.options.slice();
      const rec = t.recommended;
      os.sort((a, b) => (a.id === rec ? -1 : b.id === rec ? 1 : 0));
      return os.map((o) => opt(o.id, o.label, o.consequence, "approve", o.id === rec));
    }
    case "checkpoint":
      return [
        opt("approve", "Approve " + t.checkpoint, d.plain.ifYouApprove, "approve", true),
        opt("reject", "Ask for changes", d.plain.ifYouReject || "Canon revises it with your note.", "reject", false),
      ];
    case "plan_finalize":
      return [opt("approve", "Approve the plan", d.plain.ifYouApprove, "approve", true)];
    case "pass_approval":
      return [opt("approve", "Accept the pass", d.plain.ifYouApprove, "approve", true)];
    case "release":
      return [opt("approve", "Release", d.plain.ifYouApprove, "approve", true)];
    case "factory_change":
      return [opt("approve", "Merge #" + t.prNumber, d.plain.ifYouApprove, "approve", true)];
    case "dispatch_package_commit":
      return [opt("approve", "Add to the repo", d.plain.ifYouApprove, "approve", true)];
    case "followup_send":
    case "upkeep_offer":
      return [
        opt("approve", t.channel === "copy" ? "Mark as sent" : "Send", d.plain.ifYouApprove, "approve", true),
        opt("reject", "Skip", d.plain.ifYouReject || "It isn’t sent.", "reject", false),
      ];
  }
  return [];
}

/** What only this kind shows: the facts in its target, in plain words. */
function factsOf(d) {
  const t = d.target;
  const short = (h) =>
    h
      ? String(h)
          .replace(/^sha256:/, "")
          .slice(0, 7)
      : "";
  const f = (k, v, mono) => ({ k, v, mono: mono ? "true" : undefined });
  switch (d.kind) {
    case "proposal":
      return [
        f("Kind", PROPOSAL_LABEL[t.proposalKind] || t.proposalKind),
        d.budget
          ? f(
              d.budget.scope === "module" ? "Module cap" : "Mission AI budget",
              "+" +
                SHARE(d.budget.fromMicros, d.budget.toMicros) +
                "% to the " +
                (d.budget.scope === "module" ? "module cap" : "mission budget"),
            )
          : null,
        f("Version", String(t.version)),
        !t.decidable ? f("Can’t be decided yet", "It waits on something else first") : null,
      ].filter(Boolean);
    case "factory_change":
      return [
        f("Pull request", "#" + t.prNumber),
        f("Area", t.area.replace("_", " ")),
        f("Head", short(t.headSha), true),
        // CR-W16: EvalRunSummaryDto; null means it wasn't tried on past tasks
        t.evalRun
          ? f("Tried on past tasks", t.evalRun.plain || EVAL_VERDICT[t.evalRun.verdict] || t.evalRun.state)
          : f("Tried on past tasks", "Not tried on past tasks"),
        t.evalRun && t.evalRun.headSha && t.evalRun.headSha !== t.headSha
          ? f("Heads up", "Ran on an earlier draft of this PR")
          : null,
        t.evalRun && t.evalRun.primary.interval
          ? f(
              "Range",
              Math.round(t.evalRun.primary.interval.low * 100) +
                " to " +
                Math.round(t.evalRun.primary.interval.high * 100) +
                " points, 95% interval",
            )
          : null,
      ].filter(Boolean);
    case "checkpoint":
      return [f("Checkpoint", t.checkpoint), f("Version", String(t.version))];
    case "plan_finalize":
      return [f("Plan", "Version " + t.planVersion)];
    case "checkpoint_question":
      return [
        t.code ? f("Question", t.code, true) : null,
        f("About", t.subject.label),
        f("Blocks approval", t.blocking ? "Yes" : "No"),
      ].filter(Boolean);
    case "pass_approval":
      return [f("Known limits", t.verdictCaps.join("; ")), f("Receipt", short(t.receiptHash), true)];
    case "release":
      return [
        f("Result", t.verdict === "verified" ? "Verified" : "Pass"),
        f("Commit", short(t.commitSha), true),
        f("Delivery", { pr: "Pull request", push: "Push to their repo", zip: "Zip file" }[t.deliveryKind]),
        f("Receipt", short(t.receiptHash), true),
      ];
    case "dispatch_package_commit":
      return [f("Package", short(t.packageHash), true)];
    case "followup_send":
      return [f("Channel", t.channel === "copy" ? "You copy and send it" : "Email")];
    case "upkeep_offer":
      return [
        f("Channel", t.channel === "copy" ? "You copy and send it" : "Email"),
        f("Why now", t.signals.join("; ")),
      ];
  }
  return [];
}

/**
 * The view every card and the dock render. `ref` is the contract's `<kind>:<id>`; `code` is a
 * question's label ("Q-0.2"), the only short label the contract gives.
 */
export function toView(d, details = {}) {
  const t = d.target;
  const options = optionsOf(d);
  const ev = d.evidence || [];
  return {
    dto: d,
    id: d.ref.slice(d.ref.indexOf(":") + 1),
    ref: d.ref,
    code: (t && t.code) || null,
    kind: d.kind,
    kindLabel: KIND_LABEL[d.kind],
    proposalKind: t.proposalKind || null,
    owner: d.owner,
    missionId: d.mission ? d.mission.id : null,
    mission: d.mission,
    title: d.plain.title,
    why: d.plain.why,
    ifYouApprove: d.plain.ifYouApprove,
    ifYouReject: d.plain.ifYouReject,
    returned: d.plain.returned,
    previous: d.previous,
    evidence: ev.map((e) => e.label + ": " + e.value),
    evidenceProofs: ev.map((e) => (e.detailRef && details[e.detailRef]) || null),
    impactIfApproved: [],
    suggestedReasons: [],
    options,
    reasonRequired: d.reasonRequired,
    rejectable: d.rejectable && options.some((o) => o.effect === "reject"),
    unlocks: d.unlocks,
    createdAt: d.createdAt,
    expiresAt: d.expiresAt,
    asOfSeq: d.asOfSeq,
    version: boundVersion(d),
    // what a brief is bound to (CR-29): the version, receipt hash, head SHA, draft hash or package hash
    binding:
      d.target.version ??
      d.target.rowVersion ??
      d.target.planVersion ??
      d.target.receiptHash ??
      d.target.headSha ??
      d.target.draftHash ??
      d.target.packageHash ??
      null,
    costImpactMicros: d.costImpact ? d.costImpact.micros : 0,
    capMicros: d.budget ? d.budget.fromMicros : null,
    budget: d.budget || null,
    facts: factsOf(d),
    draft: d.kind === "followup_send" || d.kind === "upkeep_offer" ? t.draft : null,
    // Canon's questions
    subject: t.subject
      ? { checkpoint: t.subject.checkpoint, module: t.subject.moduleRef, risk: t.subject.risk, label: t.subject.label }
      : null,
    after: t.after || null,
    blocking: t.blocking || false,
    recommended: t.recommended || null,
    qWhy: t.why || null,
    checkpoint: t.checkpoint || null,
    // CR-W28: the server's clean summary for a checkpoint (web-computed until then)
    clean: d._clean || null,
    target: t,
  };
}
