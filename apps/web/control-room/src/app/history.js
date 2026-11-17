import HISTORY from "../mock/history.json";
import { fmtDateTime, fmtMinutes } from "../lib/format";

/*
 * History on main and the agent trail, worked out from contract-shaped data:
 *   route 55 (gates.listForMission) → integrationCommits: kind, baseSha, commitSha, state, finishedAt
 *   route 108 (dispatches.getModule) → each module's attempts; AttemptDto.branch and checkpointCommit
 *   route 109 + route 64 (view=steps) → an attempt's agent steps
 * A landing's title and diff stat are not in contract 1.0.0 (CR-W24); they sit under `_cr` in the mock.
 */

const NOW = Date.parse("2026-11-10T09:00:00Z"); // the mock's "now", same as world.status.at

const ROLE = {
  build: "builder",
  "test-unit": "test writer",
  "test-e2e": "test writer",
  "review-spec": "spec reviewer",
  "review-security": "security reviewer",
  "red-team": "red team",
  builder: "builder",
  reviewer: "reviewer",
};
export const roleLabel = (r) => ROLE[r] || r;

export function ageShort(iso, now = NOW) {
  const min = Math.max(0, Math.round((now - Date.parse(iso)) / 60000));
  if (min < 60) return min + "m";
  const h = Math.round(min / 60);
  if (h < 24) return h + "h";
  const d = Math.round(h / 24);
  if (d < 7) return d + "d";
  return Math.round(d / 7) + "w";
}

const ATTEMPT_PHRASE = {
  landed: "passed",
  pass: "passed",
  failed: "failed its tests",
  parked: "parked at the cap",
  running: "working now",
};

/* ---------------------------------------------------------------- history on main */
/**
 * rows newest first. opts.limit folds older rows into one "earlier" node, cutting only where no
 * branch crosses; opts.expanded shows everything.
 */
export function historyVals(missionId, modTitles, opts = {}) {
  const H = HISTORY.missions[missionId];
  if (!H) return null;
  const rows = [];
  const title = (ref) => ref + " " + (modTitles[ref] || "");
  const rejectedBy = {};
  for (const c of H.integrationCommits) {
    if (c.kind === "module" && c.state === "rejected") rejectedBy[c.moduleRef + ":" + c.attemptKey] = c;
    if (c.state !== "landed") continue;
    const tests = c.kind === "tests";
    const landedBy = !tests && (H.attempts[c.moduleRef] || []).find((a) => a.key === c.attemptKey);
    rows.push({
      key: c.id,
      t: c.finishedAt,
      lane: 0,
      color: "main",
      node: tests ? "commit" : "merge",
      kind: tests ? "tests" : "merge",
      module: c.moduleRef,
      sha: c.commitSha,
      title: c._cr ? c._cr.title : (tests ? "Locked " + c.moduleRef + "'s tests" : "Landed " + title(c.moduleRef)),
      author: tests
        ? { name: c.by.agent, initial: c.by.agent[0], agent: true, role: roleLabel(c.by.role) }
        : { name: "Integrator", initial: "I", agent: true, role: "the factory" },
      card: {
        byline: tests
          ? roleLabel(c.by.role) + " agent · wrote the tests before any code"
          : "The factory landed " + (landedBy ? landedBy.agent + "'s " + landedBy.label.toLowerCase() : "it") + " after the integration gates",
        rows: [
          { k: "Commit", v: c.commitSha, mono: true },
          c._cr ? { k: "Changed", v: c._cr.files + " files", plus: c._cr.plus, minus: c._cr.minus } : null,
          { k: "Landed", v: fmtDateTime(c.finishedAt) },
          { k: "Branch", v: "main", mono: true },
        ].filter(Boolean),
        href: "#/missions/" + missionId + "/modules/" + c.moduleRef,
        hrefLabel: "Open " + c.moduleRef,
      },
    });
  }
  for (const [ref, atts] of Object.entries(H.attempts)) {
    for (const a of atts) {
      const rej = rejectedBy[ref + ":" + a.key];
      const node = a.result === "running" ? "uncommitted" : a.result === "parked" ? "parked" : rej ? "rejected" : a.result === "failed" ? "failed" : "branch";
      const phrase = rej ? "rejected at gate 3" : ATTEMPT_PHRASE[a.result] || a.result;
      const isReview = /review/i.test(a.label);
      rows.push({
        key: ref + "-" + a.key,
        t: a.endedAt || a.startedAt,
        lane: null,
        color: ref.toLowerCase(),
        node,
        kind: "attempt",
        module: ref,
        dim: node === "failed" || node === "branch" || node === "rejected" ? true : undefined,
        title: (isReview ? "Review " : a.label + " ") + phrase,
        author: { name: a.agent, initial: a.agent[0], agent: true, role: roleLabel(a.role) },
        card: {
          byline: roleLabel(a.role) + " agent · " + a.label,
          rows: [
            rej
              ? { k: "Commit", v: rej.commitSha, mono: true }
              : { k: a.result === "running" ? "Commit" : "Checkpoint", v: a.checkpointCommit || "Not landed yet", mono: !!a.checkpointCommit },
            rej && rej._cr ? { k: "Changed", v: rej._cr.files + " files", plus: rej._cr.plus, minus: rej._cr.minus } : null,
            { k: a.result === "running" ? "Started" : "Ended", v: fmtDateTime(a.endedAt || a.startedAt) },
            { k: "Branch", v: a.branch, mono: true },
            rej ? { k: "Result", v: rej.note } : null,
          ].filter(Boolean),
          href: "#/missions/" + missionId + "/modules/" + ref,
          hrefLabel: "Open " + ref,
        },
      });
    }
  }
  rows.sort((x, y) => Date.parse(y.t) - Date.parse(x.t));
  rows.forEach((r) => (r.age = ageShort(r.t)));

  // groups: a module's attempts, the main commit that merged them (if any) and the tests commit they forked from
  const groups = [];
  for (const ref of Object.keys(H.attempts)) {
    const idx = rows.map((r, i) => (r.kind === "attempt" && r.module === ref ? i : -1)).filter((i) => i >= 0);
    if (!idx.length) continue;
    const mergeIdx = rows.findIndex((r) => r.kind === "merge" && r.module === ref);
    const forkIdx = rows.findIndex((r) => r.kind === "tests" && r.module === ref);
    const top = mergeIdx >= 0 ? mergeIdx : idx[0];
    groups.push({ ref, idx, mergeIdx, forkIdx, top, bottom: forkIdx, lane: 0 });
  }
  // inner spans take the inner lanes, so a curve back to main never crosses another branch
  const byLen = groups.slice().sort((a, b) => a.bottom - a.top - (b.bottom - b.top));
  for (const g of byLen) {
    let l = 1;
    while (byLen.some((o) => o !== g && o.lane === l && !(o.bottom < g.top || o.top > g.bottom))) l++;
    g.lane = l;
  }
  groups.forEach((g) => g.idx.forEach((i) => (rows[i].lane = g.lane)));

  // the head: the newest commit on main; the commit that ships gets the tag
  const headIdx = rows.findIndex((r) => r.lane === 0);
  rows[headIdx].node = "head";
  if (H.ships && rows[headIdx].sha === H.ships.commitSha)
    rows[headIdx].tag = { text: "Ships to the client", tone: "accent" };
  else rows[headIdx].tag = { text: "Head of main", tone: "main" };
  // each group's newest row carries the module's name, in its lane colour
  // each group's newest row carries its branch name (AttemptDto.branch), in the lane's colour
  groups.forEach((g) => {
    const br = ((H.attempts[g.ref] || [])[0] || {}).branch || g.ref;
    rows[g.idx[0]].tag = { text: br.replace(/^avel\//, ""), tone: g.ref.toLowerCase(), mono: true, full: title(g.ref) };
  });

  // lines
  rows.forEach((r, i) => {
    r.main = i < headIdx ? "none" : i === headIdx ? "lower" : "full";
    r.segs = [];
  });
  for (const g of groups) {
    const merged = g.mergeIdx >= 0;
    const start = merged ? g.mergeIdx + 1 : g.idx[0];
    const end = g.forkIdx - 1;
    for (let i = start; i <= end; i++) {
      const seg = {
        lane: g.lane,
        color: g.ref.toLowerCase(),
        top: i === start ? (merged ? "merge" : "none") : "line",
        bottom: i === end ? "fork" : "line",
      };
      if (rows[i].node === "uncommitted" && rows[i].lane === g.lane && seg.bottom === "line") seg.bottom = "dash";
      if (i > start && rows[i - 1].node === "uncommitted" && rows[i - 1].lane === g.lane) seg.top = "dash";
      rows[i].segs.push(seg);
    }
  }
  const lanes = Math.max(0, ...groups.map((g) => g.lane));

  // fold the oldest rows into one node, cutting only where no branch crosses
  let shown = rows;
  let hidden = 0;
  if (opts.limit && !opts.expanded && rows.length > opts.limit) {
    let cut = opts.limit;
    while (cut < rows.length && groups.some((g) => g.top < cut && g.bottom >= cut)) cut++;
    hidden = rows.length - cut;
    shown = rows.slice(0, cut);
  }
  const earlierN = hidden + ((H.earlier && H.earlier.count) || 0);
  const out = shown.concat(
    earlierN
      ? [
          {
            key: "earlier",
            node: "collapsed",
            n: earlierN,
            lane: 0,
            color: "main",
            title: hidden ? "Earlier history" : "Before the first test",
            main: "full",
            segs: [],
          },
        ]
      : [],
  );
  return {
    rows: out,
    lanes,
    count: rows.length,
    earlier: hidden ? "Show " + hidden + " more" : (H.earlier && H.earlier.text) || "",
    canExpand: hidden > 0,
  };
}

/* ---------------------------------------------------------------- the agent trail */
const WORD = { read: "Reading", cmd: "Running", edit: "Editing", pass: "Testing", fail: "Testing", done: "Handing off", note: "Writing", think: "Thinking", run: "Running", test: "Testing" };
const STEP_ICON = { read: "book-open", cmd: "terminal", edit: "file-diff", pass: "check", fail: "x", done: "flag", note: "pen-line", think: "sparkles", run: "terminal", test: "flask-conical" };
export const stepWord = (k) => WORD[k] || "Working";

/**
 * A module's trail: tests locked → each attempt → your call (if one waits) → landing → gates.
 * mv is moduleVals' own output (attempts oldest last, as the page shows them); dec is the open decision.
 */
export function moduleTrail(mv, x, run, decision, decState) {
  const atts = mv.attempts.slice().reverse(); // oldest first
  const rows = [];
  rows.push({
    key: "tests",
    st: "done",
    icon: "lock",
    label: "Tests written and locked",
    meta: String(run.tests).split(" ").pop() + " tests",
  });
  for (const a of atts) {
    const st = a.result === "landed" || a.result === "pass" ? "done" : a.result === "failed" ? "failed" : a.result === "parked" ? "parked" : "running";
    const last = a.steps[a.steps.length - 1];
    rows.push({
      key: "att-" + a.key,
      st,
      icon: /review/i.test(a.label) ? "scan-eye" : "hammer",
      label: a.label.replace(" · ", ": "),
      meta: st === "running" ? null : a.dur,
      status: st === "running" ? stepWord(last && last.kind) : null,
      sub: a.agent + " · " + a.cost + (a.summary ? " · " + a.summary : ""),
      subs: a.steps.map((y) => ({
        key: y.key,
        st: y.kind === "fail" ? "fail" : y.kind === "pass" ? "pass" : undefined,
        text: y.text,
        mono: y.kind === "cmd" || y.kind === "edit",
        t: y.t,
        icon: STEP_ICON[y.kind],
      })),
    });
  }
  if (decision || (decState && decState.state === "decided")) {
    const decided = decState && decState.state === "decided";
    rows.push({
      key: "you",
      st: decided ? "done" : "needs",
      icon: "inbox",
      label: decided ? "You chose: " + decState.label : decision.title,
      meta: decided ? "just now" : null,
      sub: decided && decState.reason ? "Your reason: " + decState.reason : null,
      approval: decided
        ? null
        : {
            ask: decision.ask,
            approveLabel: decision.approveLabel,
            declineLabel: decision.declineLabel,
            declineHref: decision.href,
            approve: decision.approve,
            reason: decision.reason,
            blocked: !!(decision.reason && !decision.reason.value.trim()),
            busy: decState && decState.state === "deciding",
          },
    });
  }
  const landed = x.state === "landed";
  rows.push({
    key: "land",
    st: landed ? "done" : x.state === "parked" ? "todo" : "todo",
    icon: "git-merge",
    label: landed ? "Landed on main" : "Land on main",
    meta: landed ? x.landedCommit : null,
  });
  const gatesPassed = x.gateStrip.filter((g) => g === "pass").length;
  rows.push({
    key: "gates",
    st: gatesPassed === x.gateStrip.length ? "done" : "todo",
    icon: "shield-check",
    label: "Pass every gate",
    meta: gatesPassed + " of " + x.gateStrip.length,
  });
  const done = rows.filter((r) => r.st === "done" || r.st === "failed").length;
  return { rows, count: done + "/" + rows.length };
}

export { fmtMinutes };

/**
 * An agent's own recent work across projects (the agent overview page): every landing and attempt in
 * history whose author is this agent, newest first. Built from the same route 55 / route 108 data as the graph.
 */
export function agentWork(name, missionName, limit = 8) {
  const out = [];
  for (const mid of Object.keys(HISTORY.missions)) {
    const h = historyVals(mid, {}, {});
    if (!h) continue;
    h.rows
      .filter((r) => r.author && r.author.name === name)
      .forEach((r) =>
        out.push({
          key: mid + ":" + r.key,
          t: r.t,
          title: r.title,
          module: r.module,
          node: r.node,
          project: missionName(mid),
          age: r.age,
          href: r.card ? r.card.href : "#/missions/" + mid,
        }),
      );
  }
  return out.sort((x, y) => Date.parse(y.t) - Date.parse(x.t)).slice(0, limit);
}
