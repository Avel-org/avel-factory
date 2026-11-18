// Gate 0 with Canon: the interview beside the checkpoint document.
// The model talks and the backend writes: every line in a checkpoint carries its source and status.
// Sample sessions are in src/mock/onboarding.json; data shapes are CR-W18, the streaming contract CR-W19.
//
// Streaming is modelled on AI SDK v7's useChat over an oRPC event iterator:
//   status: ready → submitted (your message shows at once) → streaming (text appended once per frame) → ready
//   stop() aborts the request and keeps what arrived; facts settle into the checkpoint after the reply ends.
import { offeredFiles } from "./uploads";
import ON from "../mock/onboarding.json";
import { fmtCap, fmtDate, fmtDateTime, fmtMinutes, pct as pctOf } from "../lib/format";
import { audienceLine, gateOpen } from "./audience";
import { approveCallFor, describeCall } from "./decisions";

const SRC = {
  said: ["You said", "said"],
  relayed: ["Client, through you", "relayed"],
  uploaded: ["From an upload", "uploaded"],
  repo: ["From the repo", "repo"],
  inferred: ["Canon's proposal", "inferred"],
};
const STEP_NUM = { 0.1: "0.1", 0.2: "0.2", 0.3: "0.3", 0.4: "0.4", final: "" };
const STATE_WORD = { approved: "Approved", draft: "Drafting", locked: "Not yet", stale: "Needs another look" };
const ORDER = ["0.1", "0.2", "0.3", "0.4", "final"];
const MODULE_BUDGET = 15;

/** Checkpoint states with this session's approvals layered on: approved, then one draft, then locked. */
export function statesFor(base, local) {
  const done = new Set(
    base.checkpoints
      .filter((x) => x.state === "approved")
      .map((x) => x.key)
      .concat(local.approved || [], local.finalized ? ["final"] : []),
  );
  let seenDraft = false;
  return base.checkpoints.map((cp) => {
    if (done.has(cp.key)) return Object.assign({}, cp, { state: "approved" });
    if (!seenDraft) {
      seenDraft = true;
      return Object.assign({}, cp, { state: "draft" });
    }
    return Object.assign({}, cp, { state: "locked" });
  });
}

/** What stands between a checkpoint and your approval. Empty means it's ready. */
function blockersFor(cp, local, qDone, m) {
  const out = [];
  if (!cp || cp.state !== "draft") return out;
  if (cp.key === "0.1" && cp.needsAudience && m && m.audienceOpen)
    out.push({
      key: "who",
      text:
        m.kind === "client"
          ? "Answer Q-0.1b: which client it\u2019s for"
          : "Answer Q-0.1a: client project or internal template",
      target: m.kind === "client" ? "cv-msg-3" : "cv-msg-2",
    });
  if (cp.key === "0.2" && cp.modules) {
    if (!qDone) out.push({ key: "q", text: "Answer Q-0.2: how drivers sign in", target: "cv-msg-8" });
    if (!local.b10) out.push({ key: "b10", text: "B10 fails: a quality target has no number" });
    if (!(local.accepted || []).includes("M4"))
      out.push({ key: "f", text: "Brennan's finding on M3 is open: fix it or accept it" });
  }
  if (cp.key === "0.3" && cp.budget) {
    const raised = local.raised || {};
    cp.budget.forEach(([ref, est]) => {
      const cap = raised[ref] || MODULE_BUDGET;
      if (est * 1.5 > cap) out.push({ key: "b-" + ref, text: ref + " goes past its cap with retries" });
    });
  }
  if (cp.key === "0.4" && cp.readiness) {
    if (cp.readiness.state === "partial" && !local.waived)
      out.push({ key: "w", text: "Readiness is partial: go ahead with a reason, or stop" });
    cp.sources.forEach((x) => {
      if (!x.ok && !(local.files || []).includes(x.ref)) out.push({ key: "s-" + x.ref, text: x.ask });
    });
  }
  return out;
}

/**
 * Bottleneck audit B4: a new project used to stop at a toast ("designed in the next pass"). This is the
 * mock's stand-in for route 20 (create, a draft) followed by your first turn with Canon (route 34),
 * which opens discovery. Canon's opener is the first message; 0.1 drafts from what you say.
 */
export function freshQuestions(m) {
  const at = new Date().toISOString();
  const q = (n, code, text, options, after) => ({
    expiresAt: null,
    evidence: [],
    reasonRequired: { approve: false, reject: false },
    rejectable: false,
    unlocks: "0.1 What it is",
    previous: null,
    kind: "checkpoint_question",
    ref: "checkpoint_question:" + m.id.slice(0, 30) + "0000q" + n,
    owner: "onboarding",
    mission: { id: m.id, name: m.name, kind: null, clientName: null },
    createdAt: at,
    asOfSeq: 5000 + n,
    plain: {
      title: text,
      why: "Canon needs this before the scope can be approved (0.1 What it is).",
      ifYouApprove: "Canon takes your answer and carries on.",
      ifYouReject: null,
      returned: null,
    },
    target: {
      questionId: m.id.slice(0, 30) + "0000q" + n,
      rowVersion: 1,
      code,
      text,
      subject: { checkpoint: "0.1", moduleRef: null, risk: null, label: "0.1 What it is" },
      blocking: true,
      options,
      recommended: null,
      why: n === 1 ? "No client is attached yet, so Canon asks before anything else." : "Your two most recent clients. Type a name to start a new one.",
      after,
    },
  });
  const a = q(1, "Q-0.1a", "Is this a client project, an internal tool or an internal template?", [
    { id: "client", label: "Client project", consequence: "Canon asks which client it\u2019s for next." },
    { id: "internal", label: "Internal tool", consequence: "It\u2019s AVEL\u2019s own software, built like a client project with you as the client." },
    { id: "template", label: "Internal template", consequence: "It ships to the templates repo, and you publish it to Templates once it\u2019s verified." },
  ], null);
  const b = q(2, "Q-0.1b", "Which client is it for?", [
    { id: "gts", label: "GTS Diesel", consequence: "Canon attaches the project to GTS Diesel. Their rules and knowledge apply, and it ships to their repo." },
    { id: "blume", label: "Blume Studio", consequence: "Canon attaches the project to Blume Studio. Their rules and knowledge apply, and it ships to their repo." },
  ], { ref: a.ref, choice: "client" });
  return [a, b];
}

export function freshOnboarding(m) {
  const at = new Date().toISOString();
  return {
    fresh: true,
    stage: "discovery",
    status: "active",
    progressPct: 0,
    promptVersion: "canon-v14",
    minutes: 0,
    canonSpentMicros: 0,
    startedAt: at,
    uploads: [],
    repo: null,
    messages: [
      {
        seq: 0,
        role: "opener",
        text:
          "Hi Javaris. I\u2019m Canon. I\u2019ll ask one question at a time, twelve at most, then draft each checkpoint for you to approve. What\u2019s " +
          (m && m.name ? m.name : "this project") +
          ", and what goes wrong today?",
        at,
      },
    ].concat(
      m && m.kind
        ? []
        : [
            {
              seq: 1,
              role: "canon",
              text: "Before anything else: is this a client project, an internal tool or an internal template?",
              question: "Q-0.1a",
              options: ["Client project", "Internal tool", "Internal template"],
              recommended: null,
              blocking: true,
              at,
              ack: [
                "A client project, then. Which client? Pick one, or type a new name.",
                "An internal tool, then: AVEL\u2019s own software, built like a client project with you as the client. Next: what has to work on day one?",
                "An internal template, then. You\u2019re the client on this one, and once it\u2019s delivered with a verified receipt you can publish it to Templates. Next: which clients should start from it first?",
              ],
            },
            {
              seq: 2,
              role: "canon",
              text: "Which client is it for?",
              question: "Q-0.1b",
              options: ["GTS Diesel", "Blume Studio"],
              recommended: null,
              blocking: true,
              at,
              ack: [
                "GTS Diesel it is. Their rules and knowledge apply from here. Next: how will they know it worked?",
                "Blume Studio it is. Their rules and knowledge apply from here. Next: how will they know it worked?",
              ],
            },
          ],
    ),
    checkpoints: [
      { key: "0.1", name: "Brief", state: "draft", version: 1, needsAudience: !(m && m.kind) },
      { key: "0.2", name: "Breakdown", state: "locked" },
      { key: "0.3", name: "Mission and roster", state: "locked" },
      { key: "0.4", name: "Context", state: "locked" },
      { key: "final", name: "Finalize", state: "locked" },
    ],
  };
}

/**
 * Option 1 (CR-W28): is this checkpoint clean? Clean means the code checks don't fail, every
 * reviewer finding is settled and no question is open, so approving it is one tap with nothing
 * to read. The web computes it from the draft today; CR-W28 asks the server to send it.
 */
export function cleanSummary(cp, local) {
  if (!cp || !cp.rubric || !cp.modules) return null;
  const L = local || {};
  const res = (r) => (r.id === "B10" && L.b10 ? "pass" : r.r);
  const checks = cp.rubric.filter((r) => r.r !== "finding");
  const finds = cp.rubric.filter((r) => r.r === "finding");
  const acc = finds.filter((r) => (L.accepted || []).includes(r.id));
  const pass = checks.filter((r) => res(r) === "pass").length;
  const advisory = checks.filter((r) => res(r) === "advisory").length;
  const fail = checks.filter((r) => res(r) === "fail").length;
  const waves = new Set(cp.modules.map((x) => x.wave)).size;
  const tests = (cp.levels || []).reduce((a, [, n]) => a + n, 0);
  const reviewer = (finds[0] && finds[0].by) || "Brennan";
  return {
    clean: fail === 0 && acc.length === finds.length,
    checks:
      pass + " of " + checks.length + " pass" + (advisory ? ", " + advisory + " advisory" : "") + (fail ? ", " + fail + " fail" : ""),
    review: finds.length
      ? reviewer + "\u2019s review: " + finds.length + (finds.length === 1 ? " finding" : " findings") + ", accepted by you"
      : reviewer + "\u2019s review: passed, no findings",
    plan: cp.modules.length + " modules in " + waves + " waves, " + tests + " tests",
    short:
      pass + " of " + checks.length + " checks pass \u00b7 " + (finds.length ? "finding accepted" : reviewer + " passed") + " \u00b7 no open questions",
  };
}

/** For Decisions: the checkpoint of this mission that's ready for your approval, if any. */
export function readyCheckpoint(missionId, local, qDone) {
  const base = ON[missionId];
  if (!base || base.stage === "finalized" || (local && local.finalized)) return null;
  const L = local || {};
  const cps = statesFor(base, L);
  const cur = cps.find((x) => x.state === "draft");
  if (!cur || cur.key === "0.1") return null;
  if (blockersFor(cur, L, qDone).length) return null;
  return cur;
}

export function canonVals(logic, c) {
  const m = c.mission;
  const s = logic.state;
  const base = m && ON[m.id];
  if (!m || !base) return null;
  const I = (n, z) => logic.icon(n, z);
  const local = (s.canon || {})[m.id] || {};
  const put = (patch) => {
    const cur = (logic.state.canon || {})[m.id] || {};
    logic.setState({ canon: Object.assign({}, logic.state.canon, { [m.id]: Object.assign({}, cur, patch) }) });
  };
  const justFinalized = !!local.finalized;
  const finalized = base.stage === "finalized";

  // Canon's questions are decisions (kind checkpoint_question): one record, answered here or in Decisions
  const qs = ((s.world && s.world.decisions && s.world.decisions.items) || []).filter(
    (d) => d.kind === "checkpoint_question" && d.missionId === m.id && gateOpen(d, s.dec),
  );
  // a question is found by its ref (`checkpoint_question:<id>`) or its code ("Q-0.2")
  const allQs = ((s.world && s.world.decisions && s.world.decisions.items) || []).filter(
    (d) => d.kind === "checkpoint_question",
  );
  const refOf = (code) => (allQs.find((d) => d.code === code) || {}).ref || code;
  const isDone = (ref) => (s.dec[refOf(ref)] || {}).state === "decided";
  const labelOf = (d, key) => (d.options.find((o) => o.key === key) || {}).label || key;
  const answerOf = (d) => {
    const x = s.dec[d.ref] || {};
    if (x.state !== "decided") return null;
    return x.choice === "other" ? x.answer : labelOf(d, x.choice);
  };
  const qDone = isDone("Q-0.2");
  const cps = finalized ? base.checkpoints : statesFor(base, local);
  const current = (cps.find((x) => x.state === "draft") || cps[cps.length - 1]).key;
  const want = c.r.query && c.r.query.get("checkpoint");
  const sel = cps.some((x) => x.key === want) ? want : finalized ? "final" : current;
  const link = (k) => "#/missions/" + m.id + "/onboarding?checkpoint=" + k;
  const pick = (k) => {
    const h = link(k);
    try {
      history.replaceState(null, "", h);
    } catch (e) {
      /* the preview may not allow it */
    }
    logic.setState({ hash: h, canonTab: "doc" });
  };

  const steps = cps.map((cp) => {
    const bl = blockersFor(cp, local, qDone, m);
    return {
      key: cp.key,
      num: STEP_NUM[cp.key],
      name: cp.name,
      state: cp.state,
      word:
        cp.state === "draft"
          ? bl.length
            ? "Waiting on you"
            : cp.sections || cp.modules || cp.package || cp.analysis || cp.key === "final"
              ? "Ready to approve"
              : "Drafting"
          : STATE_WORD[cp.state],
      when: cp.approvedAt ? fmtDate(cp.approvedAt) : (local.approvedAt || {})[cp.key] ? "Today" : null,
      current: cp.key === sel ? "step" : undefined,
      href: link(cp.key),
      go: (e) => {
        if (e) e.preventDefault();
        pick(cp.key);
      },
    };
  });

  const nApproved = cps.filter((x) => x.state === "approved").length;
  const pct =
    finalized || justFinalized ? 100 : Math.min(95, Math.max(base.progressPct, nApproved * 24 + (qDone ? 6 : 0)));
  const meta = {
    pct,
    pctLabel: finalized || justFinalized ? "Finalized" : pct + "% of Gate 0",
    spent: fmtCap(base.canonSpentMicros, m.budgetMicros, "the AI budget"),
    spentShort: fmtCap(base.canonSpentMicros, m.budgetMicros, "budget"),
    minutesShort: fmtMinutes(base.minutes),
    minutes: fmtMinutes(base.minutes) + " of your time",
  };

  // ---------------------------------------------------------------- the checkpoint document
  const cp = cps.find((x) => x.key === sel);
  const line = (l) => {
    const [label, key] = SRC[l.src] || ["", l.src];
    const proposed = l.status === "proposed" || (l.src === "uploaded" && cp.state !== "approved");
    return {
      key: l.t.slice(0, 24),
      text: l.t,
      src: key,
      srcLabel: l.from ? "From " + l.from : label,
      href: l.msg != null ? "#cv-msg-" + l.msg : undefined,
      proposed: proposed ? "true" : undefined,
    };
  };
  let doc = null;
  if (cp && cp.sections) {
    const who = audienceLine(m);
    const whoMsg = isDone("Q-0.1b") ? 3 : 2;
    const sections = cp.sections.map((x) =>
      x.k === "What it is" && !x.lines.length
        ? Object.assign({}, x, {
            lines: who
              ? [{ t: who, src: "said", msg: whoMsg, status: cp.state === "approved" ? "confirmed" : "proposed" }]
              : [],
            empty: who ? null : "Canon asks this first: answer Q-0.1a in the dock.",
          })
        : x,
    );
    doc = {
      kind: "sections",
      sections: sections.map((x) => ({ key: x.k, k: x.k, lines: x.lines.map(line), empty: x.empty || null })),
    };
  } else if (cp && cp.modules) {
    const rubric = cp.rubric.map((r) => {
      const fixed = r.id === "B10" && local.b10;
      const acc = (local.accepted || []).includes(r.id);
      return {
        key: r.id,
        id: r.id,
        text: r.t,
        result: fixed ? "pass" : r.r,
        word: acc
          ? "Accepted"
          : { pass: "Passes", fail: "Fails", advisory: "Advisory", finding: "Finding" }[fixed ? "pass" : r.r],
        note: fixed ? "Quality target set: first screen under 2.5 s on Fast 4G." : r.note,
        by: r.by ? "From " + r.by : r.id.startsWith("B") ? "Code check" : null,
        fix:
          r.id === "B10" && !local.b10 && cp.state === "draft"
            ? () => {
                put({ b10: true });
                logic.toast("Quality target set. B10 passes.");
              }
            : null,
        accept:
          r.r === "finding" && !acc && cp.state === "draft"
            ? () => put({ accepted: (local.accepted || []).concat(r.id) })
            : null,
        accepted: acc ? "true" : undefined,
      };
    });
    const waves = [...new Set(cp.modules.map((x) => x.wave))].map((w) => ({
      key: w,
      label: "Wave " + (w + 1),
      mods: cp.modules.filter((x) => x.wave === w).map((x) => x.ref),
    }));
    doc = {
      kind: "breakdown",
      modules: cp.modules.map((x) => ({
        key: x.ref,
        ref: x.ref,
        title: x.title,
        kind: x.kind,
        deps: x.deps.length ? "After " + x.deps.join(", ") : "Starts first",
        counts: x.req + " requirements · " + x.scn + " scenarios",
        blocked: x.blocked && !qDone ? x.blocked : null,
      })),
      waves,
      levels: cp.levels.map(([k, n]) => ({ key: k, k, n })),
      rubric,
      risks: cp.risks.concat(local.extraRisk ? [local.extraRisk] : []),
      riskNew: local.extraRisk ? "true" : undefined,
    };
  } else if (cp && cp.key === "0.3" && cp.package) {
    const raised = local.raised || {};
    const rows = cp.budget.map(([ref, est]) => {
      const cap = raised[ref] || MODULE_BUDGET;
      const need = est * 1.5;
      // shares of the standard module cap: the control room never shows the cap in dollars
      const more = Math.ceil((need / MODULE_BUDGET - 1) * 100);
      return {
        key: ref,
        ref,
        est: pctOf(est, cap) + "% of its cap",
        need: pctOf(need, cap) + "%",
        cap: raised[ref] ? "raised by " + pctOf(raised[ref] - MODULE_BUDGET, MODULE_BUDGET) + "%" : "the standard cap",
        ok: need <= cap ? "true" : undefined,
        raisedNote: raised[ref] ? "Raised from the standard module cap" : null,
        raise:
          need > cap && cp.state === "draft"
            ? {
                label: "Raise " + ref + "\u2019s cap by " + more + "%",
                go: () => {
                  put({ raised: Object.assign({}, raised, { [ref]: Math.ceil(need) }) });
                  logic.toast("Budget increase for " + ref + ": " + more + "% more. It's printed on the receipt.");
                },
              }
            : null,
      };
    });
    const total = cp.budget.reduce((a, [, e]) => a + e * 1.5, 0) + cp.reviewsUsd + base.canonSpentMicros / 1e6;
    doc = {
      kind: "roster",
      // no package price: the control room shows no money (CR-W20 section 3)
      pkg: {
        name: cp.package.name,
        why: cp.package.why,
        deadline: cp.package.deadline,
      },
      template: cp.template.note,
      checks: cp.checks,
      roster: cp.roster.map((r) => ({
        key: r.ref,
        ref: r.ref,
        cells: [r.build, r.tests, r.e2e, r.spec, r.security || "—"],
      })),
      rosterVersion: "Roster version " + cp.rosterVersion,
      critical: cp.critical,
      rows,
      total:
        pctOf(total * 1e6, m.budgetMicros) +
        "% of the mission\u2019s AI budget, counting retries, reviews and Canon so far",
      totalOk: total * 1e6 <= m.budgetMicros ? "true" : undefined,
    };
  } else if (cp && cp.key === "0.4" && cp.analysis) {
    const files = local.files || [];
    doc = {
      kind: "context",
      analysis: [
        ["Repo", "gts-diesel/ops-app at " + cp.analysis.commit],
        ["Stack", cp.analysis.stack],
        ["Build", cp.analysis.build],
        ["Test", cp.analysis.test],
        ["Lint", cp.analysis.lint],
        ["Standing context", cp.analysis.standing],
      ].map(([k, v]) => ({ key: k, k, v })),
      readiness: {
        state: cp.readiness.state,
        word: { ready: "Ready", partial: "Partial", not_ready: "Not ready" }[cp.readiness.state],
        reason: cp.readiness.reason,
        waived: local.waived || null,
        draft: local.waiveDraft || "",
        onDraft: (e) => put({ waiveDraft: e.target.value }),
        waive:
          cp.state === "draft" && !local.waived
            ? () => {
                const r = (local.waiveDraft || "").trim();
                if (!r) return;
                put({ waived: r, waiveDraft: "" });
                logic.toast("Going ahead on partial readiness. Your reason is logged.");
              }
            : null,
      },
      territories: cp.territories.map(([ref, p]) => ({ key: ref, ref, paths: p })),
      overlap: "B8 passes: no two modules without a dependency share a path.",
      sources: cp.sources.map((x) => {
        const got = x.ok || files.includes(x.ref);
        return {
          key: x.ref,
          ref: x.ref,
          need: x.need,
          have: got ? x.have || "photo-rules.pdf" : null,
          ok: got ? "true" : undefined,
          add:
            !got && cp.state === "draft"
              ? () => {
                  put({ files: files.concat(x.ref) });
                  logic.toast("photo-rules.pdf added for " + x.ref + ". Its facts are proposed until you approve 0.4.");
                }
              : null,
        };
      }),
    };
  } else if (cp && cp.key === "final" && !finalized) {
    const raised = local.raised || {};
    doc = {
      kind: "final",
      checks: [
        ["0.1 Brief", "Approved"],
        ["0.2 Breakdown", "Approved"],
        [
          "0.3 Mission and roster",
          "Approved" +
            (Object.keys(raised).length ? ", with a budget increase for " + Object.keys(raised).join(", ") : ""),
        ],
        ["0.4 Context", "Approved" + (local.waived ? ", partial readiness accepted with your reason" : "")],
        ["Budget check", "Passes again on the rendered plan"],
      ].map(([k, v]) => ({ key: k, k, v })),
      pins: [
        ["Plan", "Version 1"],
        ["Factory version", "b7d2e11"],
        ["Roster", "Version 7"],
      ].map(([k, v]) => ({ key: k, k, v })),
      next: [
        "Code renders DISPATCH.md and a task doc for every job",
        "Gate 1 checks they're complete and the budget fits",
        "Modules start as their dependencies land; the deadline clock starts now",
      ],
    };
  } else if (cp && cp.will) {
    doc = { kind: "locked", will: cp.will };
  }

  const blockers = blockersFor(cp, local, qDone, m).map((b) =>
    Object.assign({}, b, { href: b.target ? "#" + b.target : undefined }),
  );
  // a checkpoint Canon hasn't drafted yet has nothing to approve
  const drafted = !!(cp && (cp.sections || cp.modules || cp.package || cp.analysis || cp.key === "final"));
  if (!doc && cp && cp.state === "draft" && !drafted)
    doc = {
      kind: "drafting",
      text:
        "Canon drafts the " +
        cp.name.toLowerCase() +
        " from the interview. It shows here when it\u2019s ready for you.",
    };
  const approvable = cp && cp.state === "draft" && drafted && !blockers.length && !finalized && !justFinalized;
  const NEXT = { 0.1: "0.2", 0.2: "0.3", 0.3: "0.4", 0.4: "final" };
  const act =
    cp && cp.state === "draft" && drafted && !finalized && !justFinalized
      ? {
          label: cp.key === "final" ? "Finalize: approval 1" : "Approve " + cp.key + " " + cp.name,
          unlocks:
            cp.key === "final"
              ? "Locks the plan and starts the build"
              : NEXT[cp.key] === "final"
                ? "Unlocks Finalize"
                : "Unlocks " + NEXT[cp.key] + " " + (base.checkpoints.find((x) => x.key === NEXT[cp.key]) || {}).name,
          blockers,
          can: approvable ? "true" : undefined,
          // Option 1: a clean breakdown says so next to the button, so there's nothing to re-read
          clean: approvable && cp.key === "0.2" ? (cleanSummary(cp, local) || {}).short || null : null,
          approve: approvable
            ? () => {
                if (cp.key === "final") {
                  put({ finalized: { at: new Date().toISOString() } });
                  logic.toast("Plan approved. Code is rendering the task docs; Gate 1 runs next.");
                  return;
                }
                put({
                  approved: (local.approved || []).concat(cp.key),
                  approvedAt: Object.assign({}, local.approvedAt, { [cp.key]: Date.now() }),
                });
                logic.toast("Approved " + cp.key + " " + cp.name + ".");
                pick(NEXT[cp.key]);
              }
            : null,
          // B5: was a dead end ("designed in the next pass"). A rewrite is something you tell Canon (route 34),
          // so it opens the interview line with the checkpoint named and the cursor ready
          rewrite:
            cp.key === "final"
              ? null
              : () => {
                  put({ compose: { ref: null, first: "In " + cp.key + " " + cp.name + ", change ", at: Date.now() } });
                  logic.setState({ canonTab: "chat" });
                },
        }
      : null;

  // ---------------------------------------------------------------- the interview, streamed
  const sent = local.sent || [];
  const live = local.stream || null;
  const status = live ? live.status : "ready";
  // onboarding messages name their question by its code
  const msgOf = (ref) => {
    const d = qs.find((y) => y.ref === ref || y.code === ref);
    return base.messages.find((x) => x.question === (d ? d.code : ref)) || {};
  };
  const qByRef = (ref) => qs.find((d) => d.ref === ref || d.code === ref);

  // the deck: open questions, the one that blocks first, then oldest; skipped ones go to the back
  const skipped = local.skipped || [];
  const openQs = qs
    .filter((d) => !isDone(d.ref))
    .sort((a, b) => {
      const ba = a.blocking ? 0 : 1,
        bb = b.blocking ? 0 : 1;
      const sa = skipped.indexOf(a.ref),
        sb = skipped.indexOf(b.ref);
      return ba - bb || sa - sb || Date.parse(a.createdAt) - Date.parse(b.createdAt);
    });
  const front = local.front && openQs.some((d) => d.ref === local.front) ? local.front : openQs[0] && openQs[0].ref;
  const deckList = front ? [qByRef(front)].concat(openQs.filter((d) => d.ref !== front)) : [];

  const clear = () => {
    clearTimeout(logic._cvT1);
    clearInterval(logic._cvT2);
    clearTimeout(logic._cvT3);
    clearTimeout(logic._cvT0);
  };
  const now = () => (logic.state.canon || {})[m.id] || {};
  const nextSeq = () => 100 + (now().n || 0);
  const finish = (seq, text, ttft, stopped, extra) => {
    clear();
    const cur = now();
    const msg = Object.assign({ seq, role: "canon", text, ttft, stopped, at: new Date().toISOString() }, extra || {});
    put({ sent: (cur.sent || []).concat(msg), stream: null });
    if (!stopped && extra && extra.settle) {
      // facts settle after the reply, never in front of it (the extractor runs on its own)
      logic._cvT3 = setTimeout(() => {
        const c2 = now();
        put({
          sent: (c2.sent || []).map((x) =>
            x.seq === seq
              ? Object.assign({}, x, {
                  settled: extra.settle,
                  trace: (x.trace || []).map((y) => Object.assign({}, y, { st: "done" })),
                })
              : x,
          ),
          extraRisk: extra.risk || c2.extraRisk,
        });
      }, 1100);
    }
  };
  // one reply from Canon, shaped like useChat: submitted, then streaming, then done.
  // CR-W25: while it's his turn Canon also reports what he's doing, as data-canon-step parts on the same
  // stream (read, check, write, file). The mock sends them here; contract 1.0.0 streams text only.
  const reply = (full, extra, plan) => {
    const seq = nextSeq();
    const t0 = performance.now();
    const steps = (plan || [
      { kind: "read", label: "Read what you wrote" },
      { kind: "check", label: "Checked it against the breakdown" },
    ])
      .concat([{ kind: "write", label: "Writing the reply" }])
      .concat(extra && extra.settle ? [{ kind: "file", label: extra.fileLabel || "Filing it into the checkpoint" }] : [])
      .map((x, i) => Object.assign({ key: "s" + i, st: "todo" }, x));
    const at = (k) => steps.map((x, i) => Object.assign({}, x, { st: i < k ? "done" : i === k ? "running" : "todo" }));
    put({ n: (now().n || 0) + 1, stream: { seq, status: "submitted", shown: "", t0: Date.now(), trace: at(0) } });
    const words = full.split(/(\s+)/);
    clear();
    const writeAt = steps.findIndex((x) => x.kind === "write");
    // not a fetch: the mock's stand-in for route 34's data-canon-step parts before the first word
    logic._cvT0 = setTimeout(() => {
      const st = now().stream;
      if (st && st.seq === seq && st.status === "submitted") put({ stream: Object.assign({}, st, { trace: at(1) }) });
    }, 480);
    logic._cvT1 = setTimeout(() => {
      const ttft = Math.round(performance.now() - t0);
      let i = 0;
      // not a fetch: the mock's stand-in for route 34's chunk stream, revealing the reply as it arrives
      logic._cvT2 = setInterval(() => {
        i = Math.min(words.length, i + 2);
        const cur = now().stream;
        if (!cur) return clear();
        put({ stream: Object.assign({}, cur, { status: "streaming", shown: words.slice(0, i).join(""), ttft, trace: at(writeAt) }) });
        if (i >= words.length) {
          const total = Math.round(performance.now() - t0);
          const filing = extra && extra.settle;
          finish(seq, full, ttft, false, Object.assign({}, extra || {}, { trace: at(filing ? writeAt + 1 : steps.length), totalMs: total }));
        }
      }, 32);
    }, 960);
  };
  const say = (msg) => {
    const seq = nextSeq();
    put({
      n: (now().n || 0) + 1,
      sent: (now().sent || []).concat(Object.assign({ seq, at: new Date().toISOString() }, msg)),
    });
  };

  const answer = (d, choice, text) => {
    if (!d || isDone(d.ref)) return;
    const label = choice === "other" ? text : labelOf(d, choice);
    // route 44, gate0.answerQuestion {questionId, rowVersion, choice, answer}: an option id, or other
    const call = describeCall(
      approveCallFor(d.dto, choice === "other" ? { choice: "other", answer: text } : { choice }),
    );
    logic.setDec(d.ref, { state: "decided", choice, answer: label, label, effect: "approve", call, at: Date.now() });
    logic.setState({ snack: { ref: d.ref, text: "Answered " + d.code + ": " + label, left: 6, inline: true } });
    put({ skipped: (now().skipped || []).filter((r) => r !== d.ref), front: null });
    if (choice === "other") say({ role: "operator", text, forRef: d.ref, answers: d.code });
    const mg0 = msgOf(d.ref);
    const acks = mg0.ack || [];
    const ackAt = (mg0.options || []).indexOf(label);
    const ck = (d.subject && d.subject.checkpoint) || "0.2";
    const internalWords = /\b(internal|template|starter|avel|ours|our own|in-house)\b/i;
    const text2 =
      choice === "other" && (d.code === "Q-0.1a" || d.code === "Q-0.1b")
        ? d.code === "Q-0.1a" && internalWords.test(text)
          ? acks[0]
          : text.trim() +
            (((s.world && s.world.clients && s.world.clients.items) || []).some(
              (x) => x.name.toLowerCase() === text.trim().toLowerCase(),
            )
              ? " it is. Their rules and knowledge apply from here. Next: how will they know it worked?"
              : " it is. They\u2019re new, so I\u2019ve added them as a lead; their rules and knowledge start empty. Next: how will they know it worked?")
        : choice === "other"
          ? "Thanks. I've taken that as the answer to " +
            d.code +
            " and put it in " +
            ck +
            " as proposed, so it shows flagged until you approve the checkpoint."
          : acks[ackAt] || "Noted.";
    // when the answer opens a follow-up question (Q-0.1a "For a client" → Q-0.1b), that question is the reply
    const followUp = ((s.world && s.world.decisions && s.world.decisions.items) || []).some(
      (y) => y.missionId === m.id && y.after && y.after.ref === d.ref && y.after.choice === choice,
    );
    if (!followUp && !now().stream)
      reply(text2, { forRef: d.ref }, [
        { kind: "read", label: "Read your answer to " + d.code },
        { kind: "check", label: "Checked it against " + ck },
      ]);
  };

  // a thread line belongs to an answer: if the answer is undone, the line goes with it
  const shownSent = sent.filter((x) => !x.forRef || isDone(x.forRef));
  const messages = finalized
    ? []
    : base.messages
        // a question that follows an earlier answer shows only once that answer is in
        .filter((x) => !x.question || qByRef(x.question))
        .concat(shownSent)
        .concat(live ? [{ seq: live.seq, role: "canon", text: "" }] : [])
        .map((x) => {
          const d = x.question ? qByRef(x.question) : null;
          const isLive = live && live.seq === x.seq;
          const ans = d ? answerOf(d) : null;
          return {
            key: "m" + x.seq,
            id: "cv-msg-" + x.seq,
            role: x.role,
            who: x.role === "operator" ? "You" : x.role === "system" ? null : "Canon",
            text: isLive ? live.shown : x.text,
            live: isLive ? "true" : undefined,
            stopped: x.stopped ? "true" : undefined,
            relayed: x.relayed ? "true" : undefined,
            relayedBy: x.relayedBy || null,
            answers: x.answers || null,
            attach: x.attach || null,
            ttft: x.ttft != null ? "First word in " + (x.ttft / 1000).toFixed(1) + " s" : null,
            ref: x.question || null,
            blocking: d && x.blocking && !ans ? "true" : undefined,
            blocksCk: d && d.subject ? d.subject.checkpoint : null,
            // the deck answers questions; the thread shows where each one stands
            ask: d
              ? ans
                ? { state: "answered", text: ans }
                : {
                    state: d.ref === front ? "front" : "queued",
                    text: d.ref === front ? "Waiting on you below" : "In the queue",
                    show: () => put({ front: d.ref }),
                  }
              : null,
            settled: x.settled || null,
            // CR-W25: what Canon did on this turn, live while it runs, folded once it's done
            trace: isLive ? live.trace || null : x.trace || null,
            took: x.totalMs != null ? (x.totalMs / 1000).toFixed(1) + " s" : null,
          };
        });

  const deckCard = (d, i) => {
    const subj = d.subject || {};
    return {
      key: d.ref,
      // the dock's own key and label: the question's code ("Q-0.2"); the record is d.ref
      ref: d.code,
      title: d.title,
      why: d.qWhy || d.why || null,
      blocks: d.blocking ? "Blocks " + (subj.label || "the checkpoint") : "Feeds " + (subj.label || subj.checkpoint),
      blocking: d.blocking ? "true" : undefined,
      pos: i + 1 + " of " + deckList.length,
      options: d.options.map((o, j) => ({
        key: o.key,
        n: String(j + 1),
        label: o.label,
        then: o.consequence,
        rec: o.recommended ? "true" : undefined,
        pick: () => answer(d, o.key),
      })),
      skip:
        deckList.length > 1
          ? () => put({ skipped: (now().skipped || []).filter((r) => r !== d.ref).concat(d.ref), front: null })
          : null,
      other: (text) => answer(d, "other", text),
    };
  };

  const replyFor = (t, relayed) =>
    base.fresh
      ? /\?\s*$/.test(t)
        ? "Nothing is waiting on you yet. Tell me what the project is for and what goes wrong today, and I\u2019ll draft 0.1 from it."
        : "Thanks. That\u2019s in 0.1 Brief as the problem, in your words, marked proposed. Next: who uses it, and how will they know it worked?"
      : relayed
      ? "Got it, and I've kept those words as relayed from the client. That's a rollout risk: dispatchers texting jobs while drivers switch over. I've added it to 0.2's risks as proposed, so it shows flagged until you approve."
      : /\?\s*$/.test(t)
        ? "Before 0.2: the open questions in your queue, then the B10 quality target and the M4 finding. Everything else in the breakdown passes."
        : /photo|picture/i.test(t)
          ? "Noted. Photo rules belong to M3. I've added that as a proposed fact, and Leon will ask for GTS's photo rules at 0.4 if we still don't have them."
          : "Noted. I've added that to the breakdown as a proposed fact; it shows flagged in 0.2 until you approve. Anything else before I re-run the checks?";

  // Canon's presence: what he's doing right now, from the stream (and, after a reply, the filing step)
  const lastSent = (sent || []).slice(-1)[0];
  const filing = !live && lastSent && lastSent.role === "canon" && (lastSent.trace || []).some((y) => y.st === "running");
  const runningStep = live && (live.trace || []).find((y) => y.st === "running");
  const PRESENCE = {
    read: ["searching", "Reading"],
    check: ["connecting", "Checking"],
    write: ["composing", "Writing"],
    file: ["shaping", "Filing"],
  };
  const pk = runningStep ? runningStep.kind : filing ? "file" : null;
  const presence = pk
    ? { orb: PRESENCE[pk][0], word: PRESENCE[pk][1], label: (runningStep || (lastSent.trace || []).find((y) => y.st === "running")).label, turn: "canon", t0: live ? live.t0 : null }
    : { orb: "breathing", word: deckList.length ? "Your turn" : "Listening", label: deckList.length ? deckList.length + (deckList.length === 1 ? " question waiting" : " questions waiting") : "Say anything", turn: "you" };
  const chat = finalized
    ? null
    : {
        messages,
        status,
        presence,
        busy: status !== "ready" ? "true" : undefined,
        deck: deckList.map(deckCard),
        compose: local.compose || null,
        undo:
          s.snack && s.snack.inline && qByRef(s.snack.ref)
            ? { key: s.snack.ref, text: s.snack.text, left: s.snack.left, undo: () => logic.undo(s.snack.ref) }
            : null,
        feeds:
          cp && cp.state === "draft"
            ? cp.key === "final"
              ? "Finalize"
              : cp.key + " " + cp.name
            : "the next checkpoint",
        attach: () => logic.later("Add a file"),
        stop: () => {
          const st = now().stream;
          if (!st) return;
          finish(st.seq, st.shown || "", st.ttft, true, {
            trace: (st.trace || []).map((y) => (y.st === "running" ? Object.assign({}, y, { st: "stopped" }) : y)),
          });
          logic.toast("Stopped. Canon kept what it had written.", "info");
        },
        // the relay line: your words, or the client's through you; Canon proposes the facts
        send: ({ text, relayed, who, answerTo }) => {
          const t = (text || "").trim();
          if (!t || now().stream) return false;
          const d = answerTo ? qByRef(answerTo) : null;
          if (d && !isDone(d.ref)) {
            say({ role: "operator", text: t, relayed, relayedBy: who, forRef: d.ref, answers: d.code });
            const label = t.length > 60 ? t.slice(0, 57) + "…" : t;
            const call = describeCall(approveCallFor(d.dto, { choice: "other", answer: t }));
            logic.setDec(d.ref, {
              state: "decided",
              choice: "other",
              answer: label,
              effect: "approve",
              call,
              at: Date.now(),
            });
            logic.setState({
              snack: { ref: d.ref, text: "Answered " + d.code + " in your words", left: 6, inline: true },
            });
            put({ front: null });
            reply(
              "Thanks. I've taken that as the answer to " +
                d.code +
                " and put it in " +
                ((d.subject && d.subject.checkpoint) || "0.2") +
                " as proposed, so it shows flagged until you approve the checkpoint.",
              { forRef: d.ref },
              [
                { kind: "read", label: "Read your answer to " + d.code },
                { kind: "check", label: "Checked it against " + ((d.subject && d.subject.checkpoint) || "0.2") },
              ],
            );
            return true;
          }
          say({ role: "operator", text: t, relayed, relayedBy: who });
          const isAsk = /\?\s*$/.test(t);
          // B4: in a fresh interview your first answer drafts 0.1's Problem (the mock's stand-in for route 34)
          const b01 = base.fresh && !isAsk ? base.checkpoints.find((x) => x.key === "0.1") : null;
          if (b01 && !b01.sections)
            b01.sections = [
              { k: "What it is", lines: [] },
              { k: "Problem", lines: [{ t, src: "said", msg: nextSeq() - 1, status: "proposed" }] },
              { k: "Scope", lines: [] },
            ];
          const ck0 = base.fresh ? "0.1" : "0.2";
          reply(
            replyFor(t, relayed),
            isAsk
              ? null
              : {
                  settle: relayed && !base.fresh ? "1 fact added to 0.2 risks, proposed" : "1 fact added to " + ck0 + ", proposed",
                  risk: relayed && !base.fresh ? "Dispatchers keep texting jobs while drivers switch over (relayed)" : null,
                  fileLabel: relayed && !base.fresh ? "Filing it into 0.2's risks" : "Filing it into " + ck0,
                },
            relayed
              ? [
                  { kind: "read", label: "Read the client's words you relayed" },
                  { kind: "check", label: "Looked for the same risk in past projects" },
                ]
              : isAsk
                ? [
                    { kind: "read", label: "Read your question" },
                    { kind: "check", label: base.fresh ? "Went through your queue" : "Went through the queue and 0.2's checks" },
                  ]
                : [
                    { kind: "read", label: "Read your note" },
                    { kind: "check", label: base.fresh ? "Matched it to the brief" : "Matched it to the breakdown" },
                  ],
          );
          return true;
        },
      };

  // the margin: the same questions, pinned beside the line of the document they're about
  const marginFor = (match) => {
    const d = qs.find(match);
    if (!d) return null;
    const ans = answerOf(d);
    const c0 = deckCard(d, Math.max(0, deckList.indexOf(d)));
    return {
      ref: d.code,
      title: d.title,
      answered: ans,
      options: ans ? [] : c0.options,
      focus: () => {
        put({ front: d.ref, compose: { ref: d.code, at: Date.now() } });
        logic.setState({ canonTab: "chat" });
      },
    };
  };
  if (doc && doc.kind === "breakdown") {
    doc.modules = doc.modules.map((x) =>
      Object.assign({}, x, { ask: marginFor((d) => d.subject && d.subject.module === x.ref) }),
    );
    doc.riskAsks = doc.risks.map((r) => marginFor((d) => d.subject && d.subject.risk === r));
  }

  const clientRec = ((s.world && s.world.clients && (s.world.clients.items || s.world.clients)) || []).find(
    (x) => x.id === m.clientId,
  );
  const contact = clientRec && clientRec.contacts && clientRec.contacts[0] ? clientRec.contacts[0].name : null;

  return {
    I,
    clientName: contact ? contact.split(" ")[0] : null,
    noClient: m.internal ? "true" : undefined,
    finalized: finalized ? "true" : undefined,
    justFinalized: justFinalized
      ? {
          at: fmtDateTime(local.finalized.at),
          lines: [
            "Plan version 1 approved and locked",
            "Factory version b7d2e11 and roster version 7 pinned",
            "Rendering DISPATCH.md and the task docs; Gate 1 runs next",
            "Deadline clock started: due in 10 days",
          ],
          planHref: "#/missions/" + m.id + "/plan",
        }
      : null,
    name: m.name,
    steps,
    sel,
    // CR-34: at 0.1, the client's files are offered; Canon reads the ones you keep
    offered: cp && cp.key === "0.1" && m.clientId ? offeredFiles(logic, m.clientId, m.id) : null,
    clientName: m.clientName || null,
    cp: cp
      ? {
          key: cp.key,
          name: cp.name,
          state: cp.state,
          word: STATE_WORD[cp.state],
          version: cp.version ? "Version " + cp.version : null,
          when: cp.approvedAt ? "Approved " + fmtDate(cp.approvedAt) : null,
        }
      : null,
    doc,
    act,
    chat,
    meta,
    summary: finalized
      ? {
          rows: cps.map((x) => ({
            key: x.key,
            num: STEP_NUM[x.key],
            name: x.name,
            when: x.approvedAt ? fmtDate(x.approvedAt) : null,
            text: x.summary,
            current: x.key === sel ? "true" : undefined,
          })),
          pinned: base.pinned
            ? [
                ["Plan", "Version " + base.pinned.plan],
                ["Factory version", base.pinned.factory],
                ["Roster", "Version " + base.pinned.roster],
                ["Template", base.pinned.template || "None"],
              ].map(([k, v]) => ({ key: k, k, v }))
            : [],
          finalizedAt: base.finalizedAt ? fmtDateTime(base.finalizedAt) : null,
          interview:
            base.messagesN +
            " messages · " +
            fmtMinutes(base.minutes) +
            " of your time · Canon used " +
            fmtCap(base.canonSpentMicros, m.budgetMicros, "the AI budget"),
          planHref: "#/missions/" + m.id + "/plan",
        }
      : null,
    tab: s.canonTab || "chat",
    setTab: (t) => logic.setState({ canonTab: t }),
  };
}
