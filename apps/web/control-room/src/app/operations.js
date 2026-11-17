// Values for the screens around the work: All projects, Clients, and a project's Release, Plan, Dispatch,
// Gates and Findings, plus Factory and Activity. Sample data lives in src/mock/operations.json and is
// consistent with world.json. There's no money screen: payments, invoices and margin are private and
// stay out of the control room. Cost shows only as a share of a mission's budget.
import OPS from "../mock/operations.json";
import PIPE from "../mock/pipeline.json";
import OSA from "../mock/osa.json";
import { facets } from "./knowledge";
import { describeCall } from "./decisions";
import { historyVals, moduleTrail } from "./history";
import { clientFiles, moduleInputs, receiptInputs } from "./uploads";
import { fmtCap, fmtDate, fmtDateTime, fmtDay, fmtMinutes, fmtRelDays, pct as pctOf } from "../lib/format";

export const OPS_PAGES = [
  "projects",
  "clients",
  "release",
  "receipt",
  "module",
  "plan",
  "dispatch",
  "gates",
  "findings",
  "factory",
  "activity",
];

const NOW = new Date(OPS.asOf);
const STATE = {
  draft: ["pending", "Draft"],
  onboarding: ["accent", "Onboarding"],
  running: ["accent", "Building"],
  awaiting_release: ["needs", "Ready to release"],
  delivered: ["verified", "Delivered"],
  closed: ["pending", "Closed"],
};
const KIND_FILTER = {
  client: "Client project",
  internal: "Internal tool",
  template: "Internal template",
  unset: "Not set yet",
};
const PKG = Object.fromEntries(OPS.packages.map((p) => [p.key, p]));
const pkgLabel = (k) => (PKG[k] ? PKG[k].label : k === "custom" ? "Custom" : "No package yet");

function base(logic, c) {
  const s = logic.state;
  const missions = (c.w && c.w.missions) || [];
  const decs = (c.w && c.w.decs) || [];
  const href = (m) => logic.missionHref(m);
  const I = (n, z) => logic.icon(n, z);
  const decHref = (ref) => "#/decisions/" + encodeURIComponent(ref);
  return { s, missions, decs, href, I, decHref };
}

/** All projects: every mission with its state, client, package, gates and what's waiting on you. */
function projectsVals(logic, c) {
  const { s, missions, href, I } = base(logic, c);
  const P = s.opsProj || {};
  const set = (p) => logic.setState({ opsProj: Object.assign({}, P, p) });
  const rows = missions.map((m, i) => {
    const meta = OPS.missionMeta[m.id] || {};
    const [tone, label] = STATE[m.state] || ["pending", m.state];
    return {
      key: m.id,
      idx: i,
      href: href(m),
      name: m.name,
      client: m.forLabel || "Not set yet",
      internal: m.internal ? "true" : undefined,
      forSet: !!m.forLabel,
      pkg: pkgLabel(m.packageKey || meta.packageKey),
      state: m.state,
      stateLabel: label,
      tone,
      gates: (m.gateStrip || []).map((g, k) => ({ key: k, st: g })),
      needs: m.needsYouCount
        ? m.needsYouCount +
          (m.state === "onboarding"
            ? m.needsYouCount === 1
              ? " question"
              : " questions"
            : m.needsYouCount === 1
              ? " decision"
              : " decisions")
        : null,
      due: m.deadline && m.deadline.dueAt ? "Due " + fmtDate(m.deadline.dueAt) : null,
      dueSoon:
        m.deadline && m.deadline.dueAt && (new Date(m.deadline.dueAt) - NOW) / 86400000 <= 4 ? "true" : undefined,
      // DeadlineClock.atRisk (contract 1.0.0, CR-W18 section 6). clientMain isn't on MissionListRowDto:
      // "Client's main moved" shows on the project page (MissionDto, route 21), not here.
      atRisk: m.deadline && m.deadline.atRisk ? "Deadline at risk" : null,
      // MissionListRowDto.modules
      modules: m.modules && m.modules.total ? m.modules.landed + " of " + m.modules.total + " modules landed" : null,
      // route 19's own filter values: kind (client|internal|template|unset) and clientId
      kindKey: m.kind || "unset",
      clientId: m.kind === "client" && m.clientId ? m.clientId : null,
      // MissionListRowDto.lastEventAt
      updatedAt: m.lastEventAt || m.updatedAt || m.createdAt,
    };
  });
  const names = Object.fromEntries(missions.filter((m) => m.clientId).map((m) => [m.clientId, m.clientName]));
  const clientName = (id) => names[id] || "Client";
  const q = (P.q || "").trim().toLowerCase();
  const pool = rows.filter((r) => !q || (r.name + " " + r.client + " " + r.pkg).toLowerCase().includes(q));
  const f = facets({
    pool,
    defs: [
      // Route 19 filters by kind and clientId only (contract 1.0.0). State and package aren't filters.
      {
        key: "kind",
        name: "For",
        get: (r) => [r.kindKey],
        label: (v) => KIND_FILTER[v] || v,
        order: ["client", "internal", "template", "unset"],
      },
      {
        key: "clientId",
        name: "Client",
        get: (r) => (r.clientId ? [r.clientId] : []),
        label: (v) => clientName(v),
      },
    ],
    sel: P.sel || logic.urlSel(c, ["kind", "clientId"]),
    onSel: (v) => set({ sel: v }),
    sorts: [
      { key: "needs", label: "Needs you first", cmp: (a, b) => (b.needs ? 1 : 0) - (a.needs ? 1 : 0) || a.idx - b.idx },
      {
        key: "due",
        label: "Due soonest",
        cmp: (a, b) => (a.due ? 0 : 1) - (b.due ? 0 : 1) || String(a.due).localeCompare(String(b.due)),
      },
      {
        key: "updated",
        label: "Recently updated",
        cmp: (a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)),
      },
      { key: "az", label: "A to Z", cmp: (a, b) => a.name.localeCompare(b.name) },
    ],
    sortKey: P.sort,
    onSort: (k) => set({ sort: k }),
    noun: ["project", "projects"],
    extraChips: q ? [{ key: "q", facet: "Search", label: "“" + P.q.trim() + "”", remove: () => set({ q: "" }) }] : [],
  });
  return {
    I,
    filter: f.bar,
    q: P.q || "",
    onQ: (e) => set({ q: e.target.value }),
    clearQ: () => set({ q: "" }),
    rows: f.items,
    empty: !f.items.length,
    newHref: "#/missions/new",
  };
}

/** Clients, the relationship record (CR-W17 in contract 1.0.0). No money here. */
const STAGE = {
  lead: ["Lead", "headsup"],
  talking: ["Talking", "accent"],
  scoped: ["Scoped", "accent"],
  building: ["Building", "accent"],
  delivered: ["Delivered", "verified"],
  upkeep: ["Upkeep", "verified"],
  lost: ["Lost", "pending"],
};
const STAGES = ["lead", "talking", "scoped", "building", "delivered", "upkeep", "lost"];
// LeadLostReason and LeadSource, the contract's value lists
export const LOST_REASON = {
  timing: "Timing",
  scope: "Scope",
  went_elsewhere: "Went elsewhere",
  no_reply: "No reply",
  other: "Other",
};
export const LEAD_SOURCE = {
  referral: "Referral",
  intake: "Intake",
  past_client: "Past client",
  partner: "Partner",
  direct: "Direct",
  other: "Other",
};
const FOLLOWUP_KINDS = ["followup_send", "upkeep_offer"];

function clientsVals(logic, c) {
  const { s, missions, decs, href, I, decHref } = base(logic, c);
  const clients = (c.w && c.w.clients) || [];
  const cid = c.r.clientId;
  const L = s.opsLeads || {}; // what this tab sent: new leads (route 118), closures (119), consent (11)
  const setL = (p) => logic.setState({ opsLeads: Object.assign({}, L, p) });
  const added = L.added || [];
  const lost = L.lost || {};
  const consent = L.consent || {};
  const leadOf = (clientId) =>
    added.find((l) => l.clientId === clientId) || PIPE.leads.items.find((l) => l.clientId === clientId) || null;
  const followupsOf = (clientId) =>
    decs.filter((d) => {
      if (!FOLLOWUP_KINDS.includes(d.kind)) return false;
      const f = PIPE.followups.find((x) => x.id === d.target.followupId);
      return f ? f.clientId === clientId : d.target.clientId === clientId;
    });
  // route 122: each client's stage is derived by the server; a closure here moves it to lost
  const rowsIn = PIPE.pipeline.rows
    .concat(
      added.map((l) => ({
        clientId: l.clientId,
        clientName: l.clientName,
        stage: "lead",
        leadId: l.id,
        missionIds: [],
        lastActivityAt: l.firstContactAt,
        proofConsent: false,
        plain: l.referrerName ? "Referred by " + l.referrerName + "." : "Added just now.",
      })),
    )
    .map((r) =>
      lost[r.clientId]
        ? Object.assign({}, r, { stage: "lost", plain: "Lost: " + LOST_REASON[lost[r.clientId]].toLowerCase() + "." })
        : r,
    );
  const rows = rowsIn.map((r) => {
    const [label, tone] = STAGE[r.stage] || [r.stage, "pending"];
    const cl = clients.find((x) => x.id === r.clientId);
    const ct = cl && cl.contacts && cl.contacts[0];
    const w = decs.filter((d) => r.missionIds.includes(d.missionId)).length + followupsOf(r.clientId).length;
    return {
      key: r.clientId,
      id: r.clientId,
      href: "#/clients/" + r.clientId,
      name: r.clientName,
      stage: r.stage,
      statusLabel: label,
      tone,
      contact: ct ? ct.name + (ct.role ? " · " + ct.role : "") : "No contact yet",
      line: r.plain,
      last: r.lastActivityAt,
      waiting: w ? w + (w === 1 ? " waiting on you" : " waiting on you") : null,
    };
  });
  const C = s.opsCl || {};
  const set = (p) => logic.setState({ opsCl: Object.assign({}, C, p) });
  const f = facets({
    pool: rows,
    defs: [
      // route 117 filters leads by stage; the pipeline read carries every stage with its count
      {
        key: "stage",
        name: "Stage",
        get: (r) => [r.stage],
        label: (v) => (STAGE[v] || [v])[0],
        order: STAGES,
      },
    ],
    sel: C.sel || logic.urlSel(c, ["stage"]),
    onSel: (v) => set({ sel: v }),
    sorts: [
      {
        key: "stage",
        label: "By stage",
        cmp: (a, b) => STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage) || a.name.localeCompare(b.name),
      },
      { key: "recent", label: "Recent activity", cmp: (a, b) => String(b.last).localeCompare(String(a.last)) },
      { key: "az", label: "A to Z", cmp: (a, b) => a.name.localeCompare(b.name) },
    ],
    sortKey: C.sort,
    onSort: (k) => set({ sort: k }),
    noun: ["client", "clients"],
  });
  // the internal client isn't in the pipeline; route 8 returns it only with ?kind=internal
  const internalClient = clients.find((x) => x.kind === "internal");
  const nInternal = missions.filter((m) => m.kind === "internal" || m.kind === "template").length;
  const form = L.form || null;
  const setForm = (p) => setL({ form: Object.assign({}, form, p) });
  const listV = {
    I,
    filter: f.bar,
    stages: PIPE.pipeline.stages
      .filter((x) => x.count || rows.some((r) => r.stage === x.stage))
      .map((x) => ({
        key: x.stage,
        label: STAGE[x.stage][0],
        count: rows.filter((r) => r.stage === x.stage).length,
      })),
    internalNote: internalClient
      ? {
          text:
            internalClient.name +
            " isn’t in the pipeline. Its own work (" +
            nInternal +
            (nInternal === 1 ? " project" : " projects") +
            ") is internal tools and templates, not client work.",
          links: [
            { key: "c", label: "Open " + internalClient.name, href: "#/clients/" + internalClient.id },
            { key: "i", label: "Internal tools", href: "#/missions?kind=internal" },
            { key: "t", label: "Internal templates", href: "#/missions?kind=template" },
          ],
        }
      : null,
    rows: f.items.map((r) => Object.assign({}, r, { lastLabel: r.last ? "Last activity " + fmtDate(r.last) : null })),
    // Add a lead: POST /api/leads (route 118), a new client with status lead and its lead row
    form: form
      ? {
          name: form.name || "",
          source: form.source || "referral",
          referrerName: form.referrerName || "",
          notes: form.notes || "",
          sources: Object.keys(LEAD_SOURCE).map((k) => ({ key: k, label: LEAD_SOURCE[k] })),
          showReferrer: (form.source || "referral") === "referral" ? "true" : undefined,
          error: form.error || null,
          onName: (e) => setForm({ name: e.target.value, error: null }),
          onSource: (e) => setForm({ source: e.target.value }),
          onReferrer: (e) => setForm({ referrerName: e.target.value }),
          onNotes: (e) => setForm({ notes: e.target.value }),
          cancel: () => setL({ form: null }),
          submit: (e) => {
            e.preventDefault();
            const name = (form.name || "").trim();
            if (!name) return setForm({ error: "Give the lead a name." });
            // CLIENT_NAME_TAKEN (409) when an existing client already has the name
            if (
              clients
                .concat(added.map((l) => ({ name: l.clientName })))
                .some((x) => x.name.toLowerCase() === name.toLowerCase())
            )
              return setForm({ error: name + " is already a client. Open it from the list instead." });
            const n = added.length + 1;
            const at = new Date(NOW).toISOString();
            const lead = {
              id: "01a1c200-0000-7000-8000-0000000c000" + n,
              clientId: "01a1c100-0000-7000-8000-0000000c000" + n,
              clientName: name,
              source: form.source || "referral",
              referrerId: null,
              referrerName:
                (form.source || "referral") === "referral" ? (form.referrerName || "").trim() || null : null,
              firstContactAt: at,
              notes: (form.notes || "").trim() || null,
              lostReason: null,
              lostAt: null,
              stage: "lead",
              createdAt: at,
              rowVersion: 1,
              updatedAt: at,
            };
            setL({ form: null, added: added.concat([lead]) });
            logic.toast("Lead added: POST /api/leads (route 118)");
          },
        }
      : null,
  };

  let one = null;
  const cl =
    cid &&
    (clients.find((x) => x.id === cid) ||
      (added.find((l) => l.clientId === cid) && {
        id: cid,
        name: added.find((l) => l.clientId === cid).clientName,
        kind: "client",
        status: "lead",
        contacts: [],
        createdAt: added.find((l) => l.clientId === cid).createdAt,
        proofConsentAt: null,
        rowVersion: 1,
      }));
  if (cl) {
    const prow = rowsIn.find((r) => r.clientId === cl.id);
    const stage = prow ? prow.stage : cl.kind === "internal" ? null : cl.status;
    const [label, tone] = stage ? STAGE[stage] || [stage, "pending"] : ["Internal", "pending"];
    const lead = leadOf(cl.id);
    const isLead = stage === "lead" || stage === "lost";
    const ms = missions.filter((m) => m.clientId === cl.id);
    const open = ms.filter((m) => !["delivered", "closed"].includes(m.state));
    const past = ms.filter((m) => ["delivered", "closed"].includes(m.state));
    const waiting = decs.filter((d) => ms.some((m) => m.id === d.missionId));
    const fups = followupsOf(cl.id);
    const soonest = waiting
      .filter((d) => d.expiresAt)
      .slice()
      .sort((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt))[0];
    const lostReason = lost[cl.id] || (lead && lead.lostReason);
    // the briefing: written from the records (route 10, route 19 ?clientId=, route 52, the lead)
    const brief = isLead
      ? [
          lead && lead.notes,
          lead
            ? lead.referrerName
              ? "Referred by " + lead.referrerName + "."
              : "Source: " + LEAD_SOURCE[lead.source].toLowerCase() + "."
            : null,
          stage === "lead"
            ? "Next: start Canon’s interview when you’ve spoken."
            : "Lost" +
              (lead && lead.lostAt ? " on " + fmtDate(lead.lostAt) : "") +
              ": " +
              (LOST_REASON[lostReason] || "").toLowerCase() +
              ".",
        ].filter(Boolean)
      : [
          past.length
            ? "Delivered " + past.map((m) => m.name).join(" and ") + "."
            : cl.kind === "internal"
              ? "AVEL’s own work: internal tools and templates."
              : "First project with AVEL.",
          open.length
            ? open
                .map(
                  (m) =>
                    m.name +
                    ": " +
                    (STATE[m.state] || [0, m.state])[1].toLowerCase() +
                    (m.deadline && m.deadline.dueAt ? ", due " + fmtDate(m.deadline.dueAt) : ""),
                )
                .join(". ") + "."
            : "Nothing in progress.",
          waiting.length + fups.length
            ? waiting.length +
              fups.length +
              (waiting.length + fups.length === 1 ? " item waits" : " items wait") +
              " on you" +
              (soonest ? "; the soonest expires " + fmtRelDays(soonest.expiresAt, NOW) : "") +
              "."
            : "Nothing waits on you.",
        ];
    const KIND_ICON = {
      client: "building",
      canon: "message-square",
      receipt: "badge-check",
      call: "phone",
      decision: "check-circle",
      referral: "users",
    };
    const given = consent[cl.id] !== undefined ? consent[cl.id] : !!cl.proofConsentAt;
    const sendConsent = (v) => {
      setL({ consent: Object.assign({}, consent, { [cl.id]: v }) });
      logic.toast(
        (v ? "Consent recorded" : "Consent withdrawn") + ": PATCH /api/clients/{clientId} {proofConsent: " + v + "}",
      );
    };
    const closing = L.closing === cl.id ? L.reason || "" : null;
    one = {
      // CR-34: Overview and Files tabs; Files is the brand kit and other client files, each with where it's used
      tab: c.r.clientTab === "files" ? "files" : "overview",
      tabs: [
        { key: "overview", label: "Overview", href: "#/clients/" + cl.id },
        { key: "files", label: "Files", href: "#/clients/" + cl.id + "/files" },
      ],
      files: c.r.clientTab === "files" ? clientFiles(logic, cl.id) : null,
      kind: isLead ? "lead" : "client",
      name: cl.name,
      status: label,
      tone,
      since: isLead
        ? "First contact " + fmtDate((lead && lead.firstContactAt) || cl.createdAt)
        : (cl.kind === "internal" ? "Internal since " : "Client since ") + fmtDate(cl.createdAt),
      brief,
      contacts: (cl.contacts || []).map((ct) => ({
        key: ct.name,
        name: ct.name,
        role: ct.role,
        email: ct.email || null,
      })),
      projects: ms.map((m) => ({
        key: m.id,
        href: href(m),
        name: m.name,
        state: (STATE[m.state] || [0, m.state])[1],
        tone: (STATE[m.state] || ["pending"])[0],
      })),
      waiting: waiting.map((d) => ({
        key: d.ref,
        href: decHref(d.ref),
        ref: d.code || d.kindLabel,
        isCode: d.code ? "true" : undefined,
        title: d.title,
      })),
      // follow-ups and upkeep offers: drafted by the server (route 120), sent only through their decision (route 121)
      followups: fups.map((d) => {
        const fu = PIPE.followups.find((x) => x.id === d.target.followupId) || {};
        return {
          key: d.ref,
          href: decHref(d.ref),
          kind: d.kind === "upkeep_offer" ? "Upkeep offer" : "Follow-up",
          title: d.title,
          channel: d.target.channel === "copy" ? "You send it: copy, send, mark as sent" : "Sent by email",
          unsubscribed: fu.unsubscribed ? "Unsubscribed: nothing can be sent" : null,
        };
      }),
      timeline: OPS.timeline
        .filter((t) => t.clientId === cl.id)
        .slice()
        .sort((a, b) => b.at.localeCompare(a.at))
        .map((t, i) => ({
          key: i,
          when: fmtDate(t.at),
          text: t.text,
          kind: t.kind,
          iconEl: I(KIND_ICON[t.kind] || "circle", 14),
        })),
      consent: isLead
        ? null
        : {
            text: given
              ? "Yes" +
                (cl.proofConsentAt && consent[cl.id] === undefined ? ", since " + fmtDate(cl.proofConsentAt) : "")
              : "Not given",
            given: given ? "true" : undefined,
            action: cl.kind === "internal" ? null : given ? "Withdraw consent" : "Record consent",
            onClick: () => sendConsent(!given),
          },
      isInternal: cl.kind === "internal" ? "true" : undefined,
      // one way to start a build: New project, with this client carried over (route 20 {name, clientId})
      start:
        stage !== "lost" && cl.kind !== "internal"
          ? () => logic.go("#/missions/new?client=" + encodeURIComponent(cl.id))
          : null,
      startLabel: stage === "lead" ? "Start a project with Canon" : "New project for " + cl.name,
      // close a lead as lost: POST /api/leads/{leadId}/closures {rowVersion, lostReason} (route 119)
      close:
        stage === "lead" && lead
          ? {
              open: closing !== null ? "true" : undefined,
              reason: closing || "",
              reasons: Object.keys(LOST_REASON).map((k) => ({ key: k, label: LOST_REASON[k] })),
              toggle: () => setL({ closing: closing !== null ? null : cl.id, reason: "" }),
              onReason: (e) => setL({ reason: e.target.value }),
              submit: () => {
                if (!L.reason) return;
                setL({ closing: null, reason: "", lost: Object.assign({}, lost, { [cl.id]: L.reason }) });
                logic.toast("Closed as lost: POST /api/leads/{leadId}/closures (route 119)");
              },
            }
          : null,
    };
  }
  return { list: listV, one, I };
}

/** A project's Release: the receipt, the proof, and the one tap that ships it. Phone first. */
function releaseVals(logic, c) {
  const { s, decs, I, decHref } = base(logic, c);
  const m = c.mission;
  const rc = m && OPS.receipts[m.id];
  if (!rc) {
    const gs = (m && m.gateStrip) || [];
    const left = gs.map((g, i) => ({ g, i })).filter((x) => x.g !== "pass");
    return {
      ready: false,
      I,
      title: "Not ready to release",
      line:
        "Release opens when gate 5 issues a receipt for the exact commit that " +
        (m && m.internal ? "ships" : (m ? m.clientName || "the client" : "the client") + " will get") +
        ".",
      left: left.map((x) => ({
        key: x.i,
        gate: "Gate " + x.i,
        name: ["Scope", "Pre-dispatch", "Integration", "Job check", "Ready to merge", "Close"][x.i],
        st: x.g === "running" ? "Running" : "Waiting",
        tone: x.g === "running" ? "accent" : "pending",
      })),
      progressHref: m ? logic.missionHref(m) : "#/",
    };
  }
  const pass = decs.find((d) => d.ref === rc.passDecision);
  const rel = (s.released || {})[m.id];
  const passDone = (s.dec[rc.passDecision] || {}).state === "decided";
  // route 30: the receipt's hash and, for a pass, the pass approval's id. Only the commit the receipt names
  const sends = describeCall({
    route: ["missions", "release"],
    input: Object.assign(
      { missionId: m.id, receiptHash: rc.hash },
      rc.verdict === "pass"
        ? { passApprovalId: passDone ? m.id.slice(0, 30) + "00a1a1" : "(after your pass approval)" }
        : {},
    ),
  });
  const relTitles = {};
  (rc.modules || []).forEach(([ref, name]) => (relTitles[ref] = name));
  const history = historyVals(m.id, relTitles, {});
  return {
    ready: true,
    sends,
    I,
    history,
    verdict: rc.verdict === "verified" ? "Verified" : "Pass",
    verdictTone: rc.verdict === "verified" ? "verified" : "headsup",
    receipt: rc.id,
    commit: rc.commit,
    hash: rc.hash,
    issued: "Issued " + fmtDateTime(rc.issuedAt),
    proof: rc.proof,
    accepted: rc.accepted.map((a) => ({
      key: a.ref,
      ref: a.ref,
      title: a.title,
      reason: a.reason,
      href: "#/missions/" + m.id + "/findings",
    })),
    split: [
      ["Your time", fmtMinutes(rc.minutes)],
      ["AI cost", fmtCap(rc.aiMicros, m.budgetMicros, "the mission\u2019s AI budget")],
      ["Agents", rc.agents.join(", ")],
      ["Overrides", String(rc.overrides)],
    ].map(([k, v]) => ({ key: k, k, v })),
    delivery: rc.delivery,
    receiptHref: "#/missions/" + m.id + "/receipt",
    checkedNote: (s.verified || {})[rc.id]
      ? (s.verified[rc.id].ok ? "You checked the proof on this device, " : "The proof check failed on this device, ") +
        fmtDateTime(s.verified[rc.id].at)
      : null,
    // Bottleneck audit B3: the pass is approved here, beside Release, instead of a trip to Decisions
    // and back. It's the same decision record (pass_approval), so Decisions clears too.
    pass: pass
      ? (() => {
          const x = s.dec[pass.ref] || {};
          const reason = logic.reasonFor(pass);
          const yes = pass.options[0] || { key: "approve", label: "Accept the pass" };
          const need = logic.needsReason(pass, yes.key);
          return {
            ref: pass.ref,
            href: decHref(pass.ref),
            text: "A pass needs your approval before release: one finding was accepted rather than fixed.",
            label: yes.label,
            reason,
            need: need ? "true" : undefined,
            onReason: (e) => logic.setDec(pass.ref, { reason: e.target.value }),
            deciding: x.state === "deciding" ? "true" : undefined,
            can: !need || !!reason.trim(),
            accept: () => logic.decide(pass, yes.key),
          };
        })()
      : null,
    canRelease: !pass && !rel,
    // after release: the delivery worker ships that exact commit; Release shows it until it lands
    released: rel
      ? {
          at: fmtDateTime(rel.at),
          steps: [
            { key: "r", text: "Released commit " + rc.commit + " (receipt " + rc.id + ")", done: "true" },
            { key: "d", text: "Delivery: " + rc.delivery, done: rel.opened ? "true" : undefined },
          ],
          pr: rel.opened ? "Pull request #48 opened" : null,
        }
      : null,
    release: () => {
      if (rel) return;
      const at = new Date().toISOString();
      // the same record as the release decision in Decisions
      logic.setDec("release:" + m.id, {
        state: "decided",
        choice: "approve",
        effect: "approve",
        label: "Release",
        call: sends,
        at: Date.now(),
      });
      logic.setState({ released: Object.assign({}, s.released, { [m.id]: { at } }) });
      setTimeout(() => {
        const cur = logic.state.released || {};
        logic.setState({ released: Object.assign({}, cur, { [m.id]: { at, opened: true } }) });
      }, 1400);
    },
    approvePass: pass ? () => logic.go(decHref(pass.ref)) : null,
  };
}

/**
 * A project's receipt: what ships, what proves it, and a proof check that recomputes every digest on
 * this device. The receipt is the gate's signed record; the page never trusts its own copy of a number.
 */
function receiptVals(logic, c) {
  const { s, decs, I, decHref } = base(logic, c);
  const m = c.mission;
  const rc = m && OPS.receipts[m.id];
  if (!rc) return { ready: false, I, releaseHref: m ? "#/missions/" + m.id + "/release" : "#/" };
  const pass = decs.find((d) => d.ref === rc.passDecision);
  const rel = (s.released || {})[m.id];
  const hex = rc.hash.replace(/^sha256:/, "");
  const checked = (s.verified || {})[rc.id] || null;
  return {
    ready: true,
    I,
    // CR-34: every file the delivered software was built from; the public view shows count and hashes only
    inputs: receiptInputs(logic, m.id),
    id: rc.id,
    mission: rc.mission || m.name,
    client: rc.client || m.forLabel,
    verdict: rc.verdict === "verified" ? "Verified" : "Pass",
    verdictTone: rc.verdict === "verified" ? "verified" : "headsup",
    verdictNote:
      rc.verdict === "verified"
        ? "Every check passed and every acceptance example is verified."
        : "Every check passed. One finding was accepted rather than fixed, so it ships as a pass.",
    issued: fmtDateTime(rc.issuedAt),
    issuedDay: fmtDate(rc.issuedAt),
    commit: rc.commit,
    hex,
    hashShort: hex.slice(0, 8) + "…" + hex.slice(-4),
    signature: rc.signature,
    target: rc.target,
    plan: "Plan version " + rc.plan.version + " · approved " + fmtDate(rc.plan.approvedAt),
    modules: rc.modules.map(([ref, name, tests]) => ({ key: ref, ref, name, tests: tests + " tests" })),
    gates: rc.gates.map(([name, at], i) => ({ key: i, n: String(i), name, at: fmtDate(at) })),
    tests: rc.tests.passed + " of " + rc.tests.total,
    acceptance: rc.acceptance.verified + " of " + rc.acceptance.total + " verified",
    accepted: rc.accepted.map((a) => ({
      key: a.ref,
      ref: a.ref,
      title: a.title,
      reason: a.reason,
      href: "#/missions/" + m.id + "/findings",
    })),
    split: [
      ["Your time", fmtMinutes(rc.minutes)],
      ["AI cost", fmtCap(rc.aiMicros, m.budgetMicros, "the mission\u2019s AI budget")],
      ["Agents", rc.agents.join(", ")],
      ["Overrides", String(rc.overrides)],
    ].map(([k, v]) => ({ key: k, k, v })),
    artifacts: rc.artifacts.map((a) => ({
      key: a.key,
      label: a.label,
      file: a.file,
      lang: a.lang,
      proves: a.proves,
      content: a.content,
      sha: a.sha256,
      short: a.sha256.slice(0, 8) + "…" + a.sha256.slice(-4),
    })),
    // what the digest covers, in order; the page recomputes it with WebCrypto
    // receiptDigestInput's fields, from the receipt (contract 1.0.0: id, commitSha, verdict, createdAt)
    canon: { id: rc.id, commitSha: rc.commit, verdict: rc.verdict, createdAt: rc.issuedAt },
    delivery: rc.delivery,
    pass: pass ? { ref: pass.ref, href: decHref(pass.ref) } : null,
    released: rel ? "Released " + fmtDateTime(rel.at) : null,
    releaseHref: "#/missions/" + m.id + "/release",
    checked: checked ? { at: fmtDateTime(checked.at), ok: checked.ok } : null,
    onChecked: (ok) =>
      logic.set({
        verified: Object.assign({}, logic.state.verified, { [rc.id]: { at: new Date().toISOString(), ok } }),
      }),
  };
}

/**
 * One module (L3) and its attempts (L4): where it stands on the retry ladder, what it has cost against
 * its cap, the agent working on it right now, and every step each attempt took. The running attempt
 * stays live: new steps arrive from the event stream (simulated here) and the cost and clock tick.
 */
function moduleVals(logic, c) {
  const { s, decs, I, decHref } = base(logic, c);
  const m = c.mission;
  const ref = c.r.moduleRef;
  const mods = (s.world.modules && m && s.world.modules.missionId === m.id && s.world.modules.items) || [];
  const x = mods.find((y) => y.ref === ref);
  const run = ((OPS.moduleRuns || {})[m && m.id] || {})[ref];
  if (!x || !run) return { ready: false, I, buildHref: m ? "#/missions/" + m.id : "#/" };
  const LBL = ["Initial", "Retry 1 · focused fix", "Retry 2 · rethink", "Retry 3 · last try", "Parked"];
  const STATE = {
    landed: ["verified", "Landed"],
    running: ["accent", "Running"],
    parked: ["stopped", "Parked"],
    waiting_dependency: ["pending", "Waiting"],
  };
  const RES = {
    landed: ["verified", "Landed"],
    pass: ["verified", "Passed review"],
    failed: ["stopped", "Failed"],
    running: ["accent", "Running"],
    parked: ["stopped", "Parked"],
  };
  const room = ((s.world.rooms && s.world.rooms.items) || []).find((r) => r.missionId === m.id && r.module === ref);
  const dec = run.decision ? decs.find((d) => d.ref === run.decision) : null;
  const step = x.state === "landed" ? x.ladderStep : x.state === "parked" ? 4 : x.ladderStep;
  const pct = Math.round((x.spentMicros / x.budgetMicros) * 100);
  // the trail's "your call" row: the open decision on this module, approvable in one tap when it needs no reason
  const yes = dec && dec.options && dec.options[0];
  const no = dec && dec.rejectable ? dec.options.find((o) => o.effect === "reject") : null;
  const trailDec = yes
    ? {
        title: yes.label + "?",
        ask: dec.why,
        approveLabel: yes.label,
        declineLabel: no ? no.label : "Open the decision",
        href: decHref(dec.ref),
        approve: () => logic.decide(dec, yes.key),
        // this kind needs a reason for yes: you write it right here, and Approve waits for it
        reason: logic.needsReason(dec, yes.key)
          ? {
              value: logic.reasonFor(dec),
              onChange: (e) => logic.setDec(dec.ref, { reason: e.target.value }),
              id: "tr-why-" + x.ref,
            }
          : null,
      }
    : null;
  const out = {
    ready: true,
    I,
    // CR-34: the files linked to this module, with the reading-list meter
    inputs: moduleInputs(logic, m.id, ref),
    ref: x.ref,
    title: x.title,
    state: x.state,
    tone: STATE[x.state][0],
    stateLabel:
      x.state === "running"
        ? "Running · " + LBL[x.ladderStep].split(" · ")[0]
        : x.state === "landed"
          ? "Landed · " + x.landedCommit
          : x.state === "waiting_dependency"
            ? "Waits on " + x.dependsOn.join(" and ")
            : STATE[x.state][1],
    after: x.dependsOn.length ? x.dependsOn : null,
    territory: run.territory,
    counts: run.req + " requirements · " + run.scn + " scenarios · " + run.tests + " tests",
    ladder: ["Initial", "Retry 1", "Retry 2", "Retry 3", "Parked"].map((l, i) => {
      const a = run.attempts.filter((y) => y.role === "builder")[i];
      return {
        key: i,
        label: l,
        hint: ["", "Focused fix", "Rethink", "Last try", "Waits on you"][i],
        st:
          x.state === "parked" && i === 4
            ? "parked"
            : i < step || (x.state === "landed" && i === step)
              ? a && (a.result === "landed" || a.result === "pass")
                ? "done"
                : "failed"
              : i === step && x.state !== "waiting_dependency"
                ? "now"
                : "todo",
        cost: a ? fmtCap(a.costMicros, x.budgetMicros, "cap") : null,
      };
    }),
    spent: pct + "%",
    cap: "the module cap",
    capMicros: x.budgetMicros,
    pct,
    warn: pct >= 80 ? "true" : undefined,
    budgetNote:
      pct >= 80 && x.state === "running"
        ? "Past 80% of the cap. At the cap the module parks unless you raise it."
        : x.state === "landed"
          ? "Spent in full on the way to landing."
          : null,
    gates: x.gateStrip.map((g, i) => ({
      key: i,
      n: String(i),
      name: ["Scope", "Pre-dispatch", "Integration", "Job check", "Ready to merge", "Close"][i],
      st: g,
    })),
    room: room
      ? {
          agent: room.agent,
          role: room.role,
          model: room.model,
          slot: "Slot " + room.slot,
          startedMin: room.elapsedMin,
          costMicros: room.costMicros,
          capMicros: room.capMicros,
        }
      : null,
    decision: dec ? { ref: dec.ref, title: dec.title, href: decHref(dec.ref) } : null,
    attempts: run.attempts
      .map((a, i) => ({
        key: a.key,
        n: i + 1,
        label: a.label,
        who: a.agent + " · " + a.role + " · " + a.model,
        agent: a.agent,
        when: fmtDateTime(a.startedAt),
        minutes: a.minutes,
        dur: fmtMinutes(a.minutes),
        costMicros: a.costMicros,
        cost: fmtCap(a.costMicros, x.budgetMicros, "the module cap"),
        capMicros: a.capMicros || null,
        result: a.result,
        resultTone: RES[a.result][0],
        resultLabel: RES[a.result][1],
        summary: a.summary,
        // the icon already says pass or fail, so the text drops its own ✓ or ✗
        steps: a.steps.map((y, j) => ({ key: j, t: y.t, kind: y.kind, text: y.text.replace(/^[✓✗]\s*/, "") })),
        live: a.live ? a.live.map((y) => Object.assign({}, y, { text: y.text.replace(/^[✓✗]\s*/, "") })) : null,
      }))
      .reverse(),
    // route 58 with ?moduleRunId=, the filter CR-W18 section 9 added
    findings: run.findings
      .map((id) => OPS.findings.find((f) => f.id === id))
      .filter(Boolean)
      .map((f) => ({
        key: f.id,
        ref: f.checkId || f.kind,
        title: findingTitle(f),
        href: "#/missions/" + m.id + "/findings?moduleRunId=" + f.moduleRunId,
      })),
    watchHref: "#/missions/" + m.id + "/live",
    buildHref: "#/missions/" + m.id,
    planHref: "#/missions/" + m.id + "/plan",
    siblings: mods.map((y) => ({
      key: y.ref,
      ref: y.ref,
      href: "#/missions/" + m.id + "/modules/" + y.ref,
      current: y.ref === ref ? "page" : undefined,
      state: y.state,
    })),
  };
  out.trail = moduleTrail(out, x, run, trailDec, run.decision ? (s.dec || {})[run.decision] : null);
  return out;
}

/** Plan, Dispatch, Gates and Findings for one project. */
function planVals(logic, c) {
  const { s, I } = base(logic, c);
  const m = c.mission;
  const meta = (m && OPS.missionMeta[m.id]) || {};
  const mods = (s.world.modules && s.world.modules.missionId === (m && m.id) && s.world.modules.items) || [];
  const MS = {
    landed: ["verified", "Landed"],
    running: ["accent", "Building"],
    parked: ["stopped", "Parked"],
    blocked: ["pending", "Waiting"],
    waiting_dependency: ["pending", "Waiting on a module"],
  };
  return {
    I,
    version: meta.planVersion ? "Version " + meta.planVersion : null,
    approved: meta.planApprovedAt ? "Approved " + fmtDate(meta.planApprovedAt) : null,
    // Plan is what you approved at finalize, read-only. How it's going lives on Build.
    counts: [
      [String(mods.length), "modules"],
      [String(meta.requirements || 0), "requirements"],
      [String(meta.scenarios || 0), "scenarios"],
    ].map(([v, k]) => ({ key: k, v, k })),
    buildHref: m ? "#/missions/" + m.id + "/build" : null,
    modules: mods.map((x) => {
      const pm = ((OPS.planModules || {})[m && m.id] || {})[x.ref] || {};
      return {
        key: x.ref,
        ref: x.ref,
        title: x.title,
        goal: pm.goal || null,
        kind: pm.kind || null,
        counts: pm.req ? pm.req + " requirements · " + pm.scn + " scenarios" : null,
        deps: x.dependsOn.length ? "After " + x.dependsOn.join(", ") : "Starts first",
        budget: fmtMinutes(null),
      };
    }),
    empty: !mods.length,
    // CR-W11: the work instructions wait for your confirmation before they're committed (route 114)
    pkg: (() => {
      const all = ((s.world.decisions && s.world.decisions.items) || []).concat(logic.checkpointDecs(true));
      const d = m && all.find((y) => y.kind === "dispatch_package_commit" && y.missionId === m.id);
      if (!d) return null;
      const x = s.dec[d.ref] || {};
      const st = x.state === "decided" ? "committed" : x.state === "deciding" ? "committing" : "awaiting_confirmation";
      return {
        state: st,
        tone: st === "committed" ? "verified" : st === "committing" ? "accent" : "needs",
        label: { awaiting_confirmation: "Waiting for you", committing: "Committing", committed: "In the repo" }[st],
        text:
          st === "committed"
            ? "Added to the project\u2019s branch in one commit. A re-render asks you again."
            : "The instructions the agents work from are ready to keep with the client\u2019s code. Nothing is committed until you confirm.",
        where: (d.evidence || []).map((e) => e),
        hash: d.target.packageHash.replace(/^sha256:/, "").slice(0, 12),
        confirm: st === "awaiting_confirmation" ? () => logic.decide(d, "approve") : null,
        decHref: "#/decisions/" + encodeURIComponent(d.ref),
        sends: describeCall({
          route: ["dispatchPackage", "commit"],
          input: { missionId: m.id, packageHash: d.target.packageHash },
        }),
      };
    })(),
    dispatch: mods.map((x, i) => ({
      key: x.ref,
      ref: x.ref,
      title: x.title,
      wave: x.dependsOn.length ? "Wave 2" : "Wave 1",
      builder: ["Nemi", "Fantem", "Leon", "Ghost", "Iyo"][i % 5],
      tests: i % 2 ? "Fenn" : "Rigg",
      review: "Zero",
      doc: "Task doc v" + (x.fixRounds + 1),
      tone: (MS[x.state] || ["pending"])[0],
      state: (MS[x.state] || [0, x.state])[1],
    })),
  };
}
function gatesVals(logic, c) {
  const { s, I } = base(logic, c);
  const m = c.mission;
  const gs = (m && m.gateStrip) || [];
  const NAMES = [
    ["Scope", "Canon's interview and your checkpoints 0.1 to 0.4, then finalize"],
    [
      "Pre-dispatch",
      "Every task doc is complete, territories don't overlap, budgets fit. A failure goes back to planning.",
    ],
    ["Integration", "Each module lands only if every locked test still passes"],
    ["Job check", "Each finished job is judged in a fresh room with no agent and no network"],
    ["Ready to merge", "Every module landed and every finding routed"],
    ["Close", "decide() runs and a hashed receipt names the exact commit"],
  ];
  const T = {
    pass: ["verified", "Passed"],
    running: ["accent", "Running"],
    pending: ["pending", "Not yet"],
    fail: ["stopped", "Failed"],
  };
  const integ = s.world.integration && m && s.world.integration.missionId === m.id ? s.world.integration : null;
  const mods = (s.world.modules && m && s.world.modules.missionId === m.id && s.world.modules.items) || [];
  const landedN = mods.filter((x) => x.state === "landed").length,
    runN = mods.filter((x) => x.state === "running").length;
  const live = mods.length && landedN < mods.length && !["awaiting_release", "delivered", "closed"].includes(m.state);
  const gx = live ? gs.map((g, i) => (i === 2 || i === 3 ? "running" : i > 3 ? "pending" : g)) : gs;
  return {
    I,
    gates: NAMES.map(([n, d], i) => ({
      key: i,
      n: String(i),
      name: n,
      desc: d,
      tone: (T[gx[i]] || T.pending)[0],
      state:
        live && i === 2
          ? landedN + " of " + mods.length + " landed"
          : live && i === 3
            ? runN + " running"
            : (T[gx[i]] || T.pending)[1],
      once: i === 2 || i === 3 ? "Runs for every job" : "Runs once",
    })),
    lane: integ
      ? [
          ["Queued", integ.lane.queued],
          ["Testing", integ.lane.testing],
          ["Landed", integ.lane.landed],
          ["Rejected", integ.lane.rejected],
        ].map(([k, v]) => ({ key: k, k, v: String(v) }))
      : [],
    recent: integ
      ? integ.recent
          .slice()
          .sort((a, b) => b.at.localeCompare(a.at))
          .map((r) => ({
            key: r.commit,
            commit: r.commit,
            module: r.module,
            state: r.state === "landed" ? "Landed" : "Rejected" + (r.note ? " at " + r.note : ""),
            tone: r.state === "landed" ? "verified" : "stopped",
            when: fmtDateTime(r.at),
          }))
      : [],
  };
}
// FindingDto has no plain title (CR list): the summary rides in `evidence`, else a line from its fields
const FINDING_KIND = {
  requirement: "Requirement",
  security: "Security",
  scope: "Scope",
  integrity: "Integrity",
  advisory: "Advisory",
};
function findingTitle(f) {
  const e = f.evidence && typeof f.evidence === "object" ? f.evidence : {};
  return typeof e.summary === "string" && e.summary
    ? e.summary
    : FINDING_KIND[f.kind] + " finding" + (f.moduleRef ? " on " + f.moduleRef : "");
}
const FINDING_STATE = {
  open: ["stopped", "Open"],
  triage: ["headsup", "In triage"],
  confirmed: ["stopped", "Confirmed"],
  disputed: ["headsup", "Disputed"],
  dismissed: ["pending", "Dismissed"],
  fixed: ["verified", "Fixed"],
  accepted: ["headsup", "Accepted"],
};
const FINDING_ROUTE = {
  rework: ["Rework", "Goes to a fix attempt"],
  proposal: ["Proposal", "Comes to you as a proposal"],
  receipt: ["Receipt", "Printed on the receipt"],
};
const OPEN_STATES = ["open", "triage", "confirmed", "disputed"];

/** Findings, route 58: filters state, route and moduleRunId; accept with a reason (route 60). */
function findingsVals(logic, c) {
  const { s, I } = base(logic, c);
  const m = c.mission;
  const F = s.opsFind || {};
  const set = (p) => logic.setState({ opsFind: Object.assign({}, F, p) });
  const acc = F.accepted || {}; // findingId → reason, what this tab sent to route 60
  const pool = OPS.findings
    .filter((f) => f.missionId === (m && m.id))
    .map((f0, i) => {
      const f = acc[f0.id]
        ? Object.assign({}, f0, {
            state: "accepted",
            reason: acc[f0.id],
            decidedByKind: "user",
            cappedAtPass: f0.cappedAtPass || f0.route === "receipt",
          })
        : f0;
      const [tone, label] = FINDING_STATE[f.state] || ["pending", f.state];
      const e = f.evidence && typeof f.evidence === "object" ? f.evidence : {};
      const cites = f.citedRequirements.concat(f.citedScenarios).join(" · ");
      // Gate 5 refuses an acceptance for an integrity failure (route 60)
      const canAccept = OPEN_STATES.includes(f.state) && f.kind !== "integrity";
      const draft = F.open === f.id ? F.reason || "" : null;
      return {
        key: f.id,
        idx: i,
        ref: f.checkId || "",
        title: findingTitle(f),
        kindLabel: FINDING_KIND[f.kind] || f.kind,
        st: f.state,
        stKey: f.state,
        routeKey: f.route,
        runKey: f.moduleRunId || "",
        moduleRef: f.moduleRef,
        state: label,
        tone,
        where: [f.moduleRef, f.targetRef, cites ? "cites " + cites : null].filter(Boolean).join(" · "),
        routing: (FINDING_ROUTE[f.route] || [0, null])[1],
        evidence: typeof e.detail === "string" ? e.detail : null,
        how:
          f.state === "fixed" && f.fixedByCheck
            ? "Fixed by a passing regression check, " + f.fixedByCheck + "."
            : f.state === "accepted"
              ? "Accepted by you" +
                (f.reason ? ": " + f.reason : ".") +
                (f.cappedAtPass ? " Printed on the receipt; the result is capped at pass." : "")
              : f.state === "dismissed" && f.reason
                ? "Dismissed: " + f.reason
                : null,
        caps: f.cappedAtPass ? "true" : undefined,
        by: "Found by " + f.sourceRole + " · " + fmtDate(f.createdAt),
        at: f.createdAt,
        integrity: f.kind === "integrity" && OPEN_STATES.includes(f.state) ? "true" : undefined,
        accept: canAccept
          ? {
              open: draft !== null ? "true" : undefined,
              id: "fa-" + f.id,
              reason: draft || "",
              toggle: () => set({ open: draft !== null ? null : f.id, reason: "" }),
              onReason: (ev) => set({ reason: ev.target.value }),
              send: () => {
                const r = (F.reason || "").trim();
                if (!r) return;
                set({ open: null, reason: "", accepted: Object.assign({}, acc, { [f.id]: r }) });
                logic.toast("Accepted: POST /api/findings/{findingId}/acceptances {rowVersion, reason}");
              },
            }
          : null,
      };
    });
  const runs = {};
  pool.forEach((x) => x.runKey && (runs[x.runKey] = x.moduleRef || "Module"));
  const f = facets({
    pool,
    defs: [
      {
        key: "state",
        name: "State",
        get: (x) => [x.stKey],
        label: (v) => (FINDING_STATE[v] || [0, v])[1],
        order: Object.keys(FINDING_STATE),
      },
      {
        key: "route",
        name: "Route",
        get: (x) => [x.routeKey],
        label: (v) => (FINDING_ROUTE[v] || [v])[0],
        order: Object.keys(FINDING_ROUTE),
      },
      {
        key: "moduleRunId",
        name: "Module",
        get: (x) => (x.runKey ? [x.runKey] : []),
        label: (v) => runs[v] || "Module",
      },
    ],
    sel: F.sel || logic.urlSel(c, ["state", "route", "moduleRunId"]),
    onSel: (v) => set({ sel: v }),
    sorts: [
      {
        key: "open",
        label: "Open first",
        cmp: (a, b) =>
          (OPEN_STATES.includes(a.st) ? 0 : 1) - (OPEN_STATES.includes(b.st) ? 0 : 1) || b.at.localeCompare(a.at),
      },
      { key: "recent", label: "Newest", cmp: (a, b) => b.at.localeCompare(a.at) },
    ],
    sortKey: F.sort,
    onSort: (k) => set({ sort: k }),
    noun: ["finding", "findings"],
  });
  return { I, filter: f.bar, rows: f.items, empty: !pool.length };
}

/** Factory: open factory PRs and the versions missions are pinned to. Activity: the audit log. */
function factoryVals(logic, c) {
  const { I } = base(logic, c);
  return {
    I,
    open: OPS.openPrs
      .filter((p) => !p.dup)
      .map((p) => ({
        key: p.number + p.area,
        pr: "PR #" + p.number,
        title: p.title,
        area: p.area[0].toUpperCase() + p.area.slice(1),
        when: "Opened " + fmtDate(p.openedAt),
        href: p.href,
      })),
    versions: OPS.factoryVersions
      .slice()
      .sort((a, b) => b.mergedAt.localeCompare(a.mergedAt))
      .map((v, i) => ({
        key: v.sha,
        sha: v.sha,
        pr: "PR #" + v.pr,
        summary: v.summary,
        when: fmtDate(v.mergedAt),
        pinned: v.missions
          ? v.missions + (v.missions === 1 ? " project pinned" : " projects pinned")
          : "No projects pinned",
        current: i === 0 ? "true" : undefined,
      })),
  };
}
function activityVals(logic, c) {
  const { s, I } = base(logic, c);
  const A = s.opsAct || {};
  const set = (p) => logic.setState({ opsAct: Object.assign({}, A, p) });
  const KIND = { decision: "Decisions", gate: "Gates", finding: "Findings", factory: "Factory PRs" };
  // ActivityDto.actorKind: user, agent, system, and assistant (OSA, CR-29) while the osa flag is on
  const WHO = { user: "You", assistant: "OSA" };
  const pool = OPS.activity.concat(s.osa ? OSA.activity : []).map((a, i) => ({
    key: i,
    idx: i,
    at: a.at,
    actorKind: a.actorKind,
    assistant: a.actorKind === "assistant" ? "true" : undefined,
    actor: WHO[a.actorKind] || a.actor,
    kind: KIND[a.kind] || a.kind,
    action: a.action,
    reason: a.reason,
    mission: a.mission,
    when: fmtDateTime(a.at),
    day: fmtDay(a.at),
  }));
  const f = facets({
    pool,
    defs: [
      { key: "kind", name: "Kind", get: (x) => [x.kind], label: (v) => v },
      { key: "actor", name: "Who", get: (x) => [x.actor], label: (v) => v },
      { key: "mission", name: "Project", get: (x) => (x.mission ? [x.mission] : []), label: (v) => v },
    ],
    sel: A.sel || logic.urlSel(c, ["kind", "actor", "mission"]),
    onSel: (v) => set({ sel: v }),
    sorts: [{ key: "recent", label: "Newest first", cmp: (a, b) => b.at.localeCompare(a.at) }],
    sortKey: "recent",
    onSort: () => {},
    noun: ["entry", "entries"],
  });
  const days = [];
  f.items.forEach((x) => {
    let d = days.find((y) => y.day === x.day);
    if (!d) days.push((d = { key: x.day, day: x.day, rows: [] }));
    d.rows.push(x);
  });
  return { I, filter: Object.assign({}, f.bar, { sort: null }), days };
}

export function opsVals(logic, c) {
  switch (c.id) {
    case "projects":
      return { projects: projectsVals(logic, c) };
    case "clients":
      return { clients: clientsVals(logic, c) };
    case "release":
      return { release: releaseVals(logic, c) };
    case "receipt":
      return { receipt: receiptVals(logic, c) };
    case "module":
      return { module: moduleVals(logic, c) };
    case "plan":
      return { plan: planVals(logic, c) };
    case "dispatch":
      return { plan: Object.assign(planVals(logic, c), { dispatchView: true }) };
    case "gates":
      return { gates: gatesVals(logic, c) };
    case "findings":
      return { findings: findingsVals(logic, c) };
    case "factory":
      return { factory: factoryVals(logic, c) };
    case "activity":
      return { activity: activityVals(logic, c) };
    default:
      return {};
  }
}
