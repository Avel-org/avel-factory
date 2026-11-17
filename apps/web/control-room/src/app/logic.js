// The control room's logic, from the Claude Design export: routing, state, the sample world and
// every value the views render (renderVals). The views in src/shell, src/pages and src/dev read
// those values; nothing else holds state. DCLogic (src/lib/dc.js) keeps Claude Design's
// synchronous setState, so this file runs unchanged.
import React from "react";
import { DCLogic } from "../lib/dc";
import { sawLiveEvent } from "../lib/live";
import { facets, libraryVals, templatesVals } from "./knowledge";
import { OPS_PAGES, opsVals } from "./operations";
import { fmtCapChange, fmtDate, fmtDay as fmtWeekday, fmtTime as fmtClock } from "../lib/format";
import { CHORDS, KEYS, paletteItems, paletteResults } from "./palette";
import { flushSync } from "react-dom";
import { canonVals, cleanSummary, freshOnboarding, freshQuestions, readyCheckpoint, statesFor } from "./canon";
import { agentWork, historyVals } from "./history";
import { crewVals } from "./crew";
import { addUploads, dropTarget, initUploads, missionFiles, offeredFiles, rerenderLine, startTray, uploadsVals } from "./uploads";
import ON from "../mock/onboarding.json";
import { gateOpen, withAudience } from "./audience";
import { KIND_LABEL, approveCallFor, describeCall, rejectCallFor, toView } from "./decisions";
import PENDING from "../mock/pending-decisions.json";
import EVERY_KIND from "../mock/contract-mock-decisions.json";
import EVIDENCE from "../mock/evidence-details.json";
import OSA from "../mock/osa.json";

const LS = "avel-cr";
const STATE_LABEL = {
  draft: "Draft",
  onboarding: "Onboarding",
  approved: "Approved",
  rendered: "Rendered",
  running: "Running",
  reviewing: "Reviewing",
  deciding: "Deciding",
  awaiting_release: "Awaiting release",
  refreshing: "Refreshing",
  delivering: "Delivering",
  delivered: "Delivered",
  closed: "Closed",
  cancelled: "Cancelled",
  paused: "Paused",
  blocked_on_you: "Needs you",
};
const NO_TREE = ["onboarding", "draft"];
const HIDDEN = ["closed", "cancelled"];
const PROJECT_PAGES = [
  // In the order a build moves: scope it, plan it, hand it out, build it, check it, ship it.
  ["canon", "Scope", "/onboarding"],
  ["plan", "Plan", "/plan"],
  ["dispatch", "Dispatch", "/dispatch"],
  ["progress", "Build", "/build"],
  ["watch", "Watch the work", "/live"],
  ["gates", "Gates", "/gates"],
  ["findings", "Findings", "/findings"],
  ["release", "Release", "/release"],
  // CR-34: the project's files, open from Gate 0 on
  ["files", "Files", "/files"],
];
/** Mission states where Gate 5 has run: the project opens on Release. */
const CLOSE_STATES = ["awaiting_release", "delivered", "closed"];
const LIB_KINDS = [
  ["skills", "Skills", "skill"],
  ["knowledge", "Knowledge", "knowledge entry"],
  ["rules", "Rules", "rule"],
  ["templates", "Templates", "template"],
];
const MOVES = {
  draft: ["Start onboarding", "Cancel"],
  onboarding: ["Pause", "Cancel"],
  running: ["Pause", "Cancel"],
  awaiting_release: ["Approve release", "Cancel"],
  delivered: ["Close"],
  closed: ["Reopen"],
  factory: ["Refresh"],
};

const P = (tone, status, cr, text) => ({ tone, status, cr, text });
// Built in contract 1.0.0 ("Contract response to CR-W1 to W22", Nov 12) unless marked open. The
// screens read these routes and events as the contract defines them; nothing polls except the
// stall check (StatusDto.stallAfterMs).
const B = (cr, text) => P("verified", "Built in 1.0.0", cr, text);
const G = {
  name: B("CR-20", "Mission name on every row, the breadcrumb and the title; routes 19, 21 and 52."),
  list: B(
    "CR-W5",
    "Route 19 returns MissionListRowDto: name, client, gate strip with counts, modules, deadline, plain.",
  ),
  status: B("CR-W5", "Route 104, GET /api/status: slots, needsYouCount, alerts, stallAfterMs and lastSeq."),
  dec: B("CR-W2", "Route 52 returns the 10-kind PendingDecisionDto union; approveCallFor builds each approve call."),
  returned: B("CR-W15", "previous and plain.returned on a decision that came back; <owner>.decision.returned."),
  step: B("CR-W18", "MissionDetailDto.onboarding, the Gate 0 journey behind “Step N of 5”."),
  nameWrite: B("CR-20", "POST /api/missions takes {name, clientId?}."),
  kind: B(
    "CR-W22",
    "Mission kind: client, internal or template, null until Canon’s Q-0.1a is answered and frozen once the plan is approved. Route 19 filters ?kind=client|internal|template|unset.",
  ),
  gateStrip: B("CR-W18", "Gate strip with runs and counts (gates 2 and 3 run per job)."),
  moduleRun: B(
    "CR-W21",
    "Route 108 returns one module run (ladder, cost against its cap, attempts, findings); route 109 and the trace stream give its agent steps.",
  ),
  rooms: P(
    "proposed",
    "Open",
    "Gap 4",
    "Running rooms across missions, with slots (GET /api/rooms?state=running, proposed). Until it lands the rack is built from factory.dispatch.changed and runner.attempt.* events.",
  ),
  evDecisions: B("CR-27", "<owner>.decision.opened, resolved, expired and returned for the 10 decision owners."),
  evCheckpoints: B("CR-27", "onboarding.checkpoint.changed, onboarding.fact.proposed and onboarding.question.changed."),
  evFindings: B("CR-27", "gate.finding.created and gate.finding.changed."),
  evGates: B("CR-27", "gate.evaluation.recorded and integrator.commit.changed."),
  evDeliveries: B("CR-27", "gate.pass.approved and delivery.delivery.changed."),
  scope: B("CR-W18", "Checkpoint sections of FactLineDto, the onboarding journey and rubric suggestions."),
  canon: B(
    "CR-W19",
    "Route 34 streams Canon’s reply as CanonStreamChunk; route 105 resumes it; route 44 takes choice and answer.",
  ),
  receipt: B(
    "CR-W21",
    "Receipt proof artifacts and digests (route 107), ?verify=1, and receiptDigestInput for the check on your device.",
  ),
  dispatchCommit: B("CR-W11", "Route 114 confirms the package commit, bound to packageHash."),
  pipeline: B("CR-W17", "Leads, follow-ups and upkeep offers: routes 117 to 122; pipeline.* events."),
  clientTimeline: P(
    "proposed",
    "Open",
    "CR-W23",
    "A client's timeline: route 93 (GET /api/activity) takes no clientId, so nothing reads a client's history yet. Shown from sample data until CR-W23 lands.",
  ),
  history: P(
    "proposed",
    "Open",
    "CR-W24",
    "History on main and the agent trail: a landing's title, diff stat and author (IntegrationCommitDto), every try on route 55, and optional machine detail on a step. The graph itself comes from route 55's baseSha and commitSha.",
  ),
  skillResults: B(
    "CR-W16",
    "Route 115 results per version with a baseline, route 116 the eval run, and evalRun on a factory change.",
  ),
  templateDocs: B("CR-W20", "TemplateViewDto.docs on route 88."),
  templateDrafts: B("CR-W21", "Template drafts: routes 110 to 113, saved against rowVersion."),
  osa: P(
    "proposed",
    "Proposed, behind a flag",
    "CR-29",
    "OSA, the operator agent: decision briefs, Ask OSA tasks, shared focus and the terminal-attached view. Contract 1.1.0 doesn’t exist yet; the assumed routes, fields and events are in contract/cr-29-assumed.json.",
  ),
};
const CR34 = {
  state: "proposed",
  label: "Open",
  cr: "CR-34",
  text: "One upload inbox (revision 2). Its routes aren\u2019t in contract-mock yet: these screens run on sample data, with CR-34\u2019s field names (StatusDto.inboxCount, uploads.state, scanStatus, link state).",
};
const PROJ = "{mission} · {client}";
const PAGES = {
  decisions: {
    href: "/",
    label: "Decisions",
    icon: "inbox",
    title: "Decisions",
    eyebrow: "Decide",
    keys: "home approve inbox waiting",
    emptyLabel: "Clear",
    extraStates: [{ id: "waiting", label: "Waiting" }],
    lead: "Everything waiting on you, with what approving does and what it costs.",
    empty: {
      icon: "inbox",
      title: "When a project needs you",
      msg: "Each decision lands here with its evidence, what approving and rejecting will do, the cost impact and when it expires.",
      actions: [{ label: "Open Live", href: "#/live" }],
    },
    spec: {
      route: "/",
      note: "Home. Server-rendered, under 150 KB of JavaScript, content on screen in 1.5 s on a mid-range phone.",
      calls: [
        "GET /api/pending-decisions (route 52): the 10-kind PendingDecisionDto union",
        "GET /api/status (route 104): the waiting total, alerts and stallAfterMs",
        "Each card approves through approveCallFor(item, tap): decisions.decide, factory.mergeChange, gate0.approveCheckpoint, missions.finalize, gate0.answerQuestion, missions.approvePass, missions.release, dispatchPackage.commit, followups.send",
        "GET /api/proposals/{proposalId} (route 53) for a proposal's full view",
      ],
      fresh: [
        "<owner>.decision.opened, resolved, expired and returned on the global stream",
        "A newer event for the same item than its asOfSeq marks the card stale; it refetches before you can decide",
        "The stall check: no event for stallAfterMs (600000) flags the stream as stalled. The only timer on this page",
      ],
      states:
        "Loading, clear (\u201cNothing needs you\u201d), error, ready, deciding, decided with a 6 s Undo, came back (previous and plain.returned), stale (409 STALE_VERSION: review the current item first), expired, decided elsewhere.",
      gaps: [G.dec, G.returned, G.status, G.evDecisions, G.osa],
    },
  },
  projects: {
    href: "/missions",
    label: "All projects",
    icon: "layout-grid",
    title: "All projects",
    eyebrow: "Projects",
    keys: "missions list filter",
    lead: "Every project with its client, state, deadline and gates.",
    headActions: [{ label: "New project", href: "#/missions/new", variant: "primary", icon: "plus" }],
    empty: {
      icon: "layout-grid",
      title: "No projects yet",
      msg: "Pick a client and name the project. Canon starts the interview from there.",
      actions: [{ label: "New project", href: "#/missions/new", variant: "primary", icon: "plus" }],
    },
    filtered: {
      icon: "search",
      title: "No projects match these filters",
      msg: "Nothing for GTS Diesel is awaiting release. Clear a filter to see more.",
      actions: [{ label: "Clear filters", action: "clear" }],
    },
    extraStates: [
      { id: "ready", label: "Ready" },
      { id: "filtered", label: "Filtered" },
    ],
    spec: {
      route: "/missions?kind=&clientId=",
      calls: ["GET /api/missions?kind=&clientId=&limit=&cursor= (route 19): MissionListRowDto rows"],
      fresh: [
        "missions.mission.created, missions.mission.changed, missions.mission.kind_set and missions.mission.closed",
      ],
      states: "Loading, empty, filtered-empty, error, ready.",
      gaps: [G.name, G.list, G.gateStrip, G.kind],
    },
  },
  newProject: {
    href: "/missions/new",
    label: "New project",
    icon: "plus",
    title: "New project",
    eyebrow: "Projects",
    layout: "form",
    emptyLabel: "Form",
    keys: "create client canon",
    lead: "Name the project and start Canon. Client project or internal template is Canon\u2019s first question.",
    extraStates: [{ id: "saving", label: "Saving" }],
    spec: {
      route: "/missions/new?client=",
      calls: ["POST /api/missions (route 20) with {name, clientId?}; no kind: Canon\u2019s first question decides it"],
      fresh: ["Nothing to keep fresh: a form."],
      states: "Form, from a client or lead page (that client carried over), saving, error.",
      gaps: [G.nameWrite, G.kind],
    },
  },
  canon: {
    href: "/missions/$id/onboarding",
    label: "Onboarding",
    icon: "message-circle",
    title: "Onboarding with Canon",
    eyebrow: PROJ,
    layout: "canon",
    emptyLabel: "Not started",
    extraStates: [{ id: "ready", label: "Interviewing" }],
    titleGap: false,
    lead: "Four checkpoints with Canon, then the plan. You approve each one.",
    empty: {
      icon: "message-circle",
      title: "Canon hasn\u2019t started",
      msg: "Canon asks first whether it\u2019s a client project or an internal template, then about the work and its limits, and drafts each checkpoint for you to approve. You can add files at any point.",
      actions: [
        { label: "Start the interview", variant: "primary", icon: "play", action: "startInterview" },
        { label: "Add files first", icon: "upload" },
      ],
    },
    spec: {
      route: "/missions/$id/onboarding",
      note: "Focus mode: the sidebar steps away and the menu button brings it back as a sheet. Canon's dock: the question deck, the relay line and hold to relay (CR-W19).",
      calls: [
        "missions.postMessage (route 34): Canon\u2019s reply streams back as CanonStreamChunk, rendered as plain text as it arrives",
        "missions.resumeMessage (route 105) and missions.listMessages (route 33)",
        "gate0.answerQuestion (route 44) {questionId, rowVersion, choice, answer}: an option, or other in your own words",
        "missions.transcribe (route 106): the recorded clip in, its transcript streamed back for review",
        "GET /api/missions/{missionId} (route 21) for the onboarding journey and checkpoints; the gate0 upload and checkpoint routes",
      ],
      fresh: [
        "onboarding.fact.proposed and onboarding.message.updated on the mission stream",
        "onboarding.checkpoint.changed and onboarding.question.changed",
        "onboarding.decision.* for questions answered in Decisions",
        "missions.mission.kind_set once Q-0.1a is answered",
      ],
      states: "Interviewing, Canon writing (Stop), drafting, waiting on you, context blocked, paused, finalized.",
      gaps: [G.name, G.step, G.evCheckpoints, G.scope, G.canon, G.kind],
    },
  },
  progress: {
    href: "/missions/$id",
    label: "Progress",
    icon: "list-checks",
    title: "{mission}",
    titleGap: true,
    eyebrow: "{client} · {state}",
    extraStates: [{ id: "overview", label: "Building" }],
    lead: "Every module with its state, retry step and rounds, and what has shipped.",
    empty: {
      icon: "list-checks",
      title: "No modules yet",
      msg: "The plan splits the work into modules. They show here, with their gates and retry step, once the plan is approved.",
      actions: [{ label: "Open Plan", href: "{base}/plan" }],
    },
    spec: {
      route: "/missions/$id",
      calls: [
        "GET /api/missions/{missionId} (route 21)",
        "GET /api/missions/{missionId}/modules/{moduleRef} (route 108) for a module row",
        "GET /api/missions/{missionId}/gates (route 55): integration commits for History on main",
      ],
      fresh: [
        "factory.module.changed, factory.dispatch.changed, runner.attempt.started and runner.attempt.ended",
        "gate.receipt.issued and delivery.delivery.changed",
      ],
      states: "Building, waiting on you, released, closed.",
      gaps: [G.name, G.gateStrip, G.moduleRun, G.evDeliveries, G.history],
    },
  },
  watch: {
    href: "/missions/$id/live",
    label: "Watch the work",
    icon: "terminal",
    title: "Watch the work",
    eyebrow: PROJ,
    layout: "rack",
    extraStates: [{ id: "running", label: "Running" }],
    emptyLabel: "Idle",
    wide: true,
    rackLabel: "0 of 6 rooms running for this project",
    lead: "Up to 6 rooms at once, each held to its attempt cap and 60 minutes an attempt.",
    empty: {
      icon: "terminal",
      title: "No rooms running",
      msg: "A room opens when a module starts: test writers first, then the builder, then reviewers.",
    },
    spec: {
      route: "/missions/$id/live",
      calls: [
        "GET /api/missions/{missionId}/dispatches (route 49)",
        "GET /api/events/stream?missionId= (route 63)",
        "GET /api/traces/stream?attemptId=&view=steps (route 64), one per open terminal",
      ],
      fresh: [
        "factory.dispatch.changed, runner.attempt.started and runner.attempt.ended",
        "The trace stream (view=steps), at 60 fps with 6 rooms.",
      ],
      states:
        "Idle, running, parked. Hidden while a terminal is attached (CR-29), since the terminal shows the live flow.",
      gaps: [G.rooms, G.osa],
    },
  },
  release: {
    href: "/missions/$id/release",
    extraStates: [{ id: "ready", label: "Ready" }],
    label: "Release",
    icon: "package-check",
    title: "Release",
    eyebrow: PROJ,
    emptyLabel: "No receipt",
    lead: "The verdict, the commit and receipt hash, and proof for each acceptance example.",
    empty: {
      icon: "receipt",
      title: "No receipt yet",
      msg: "Gate 5 issues a hashed receipt when every module has landed. Verified ships after your release approval. Pass needs a pass approval first. Fail can\u2019t ship.",
    },
    spec: {
      route: "/missions/$id/release",
      note: "Phone-first. Server-rendered, under 150 KB of JavaScript.",
      calls: [
        "GET /api/missions/{missionId} (route 21)",
        "GET /api/receipts/{receiptId}?verify= (route 61)",
        "POST /api/missions/{missionId}/pass-approvals (route 29) {receiptHash, reason}",
        "POST /api/missions/{missionId}/releases (route 30) {receiptHash, passApprovalId for a pass}: only the commit the receipt names",
        "GET /api/missions/{missionId}/gates (route 55): integration commits for What ships",
      ],
      fresh: ["gate.receipt.issued, gate.pass.approved and delivery.delivery.changed"],
      states: "No receipt yet, verified, pass (needs a pass approval), fail, releasing, released.",
      gaps: [G.evDeliveries, G.receipt, G.history],
    },
  },
  receipt: {
    href: "/missions/$id/receipt",
    extraStates: [{ id: "ready", label: "Ready" }],
    label: "Receipt",
    icon: "receipt",
    title: "Receipt",
    eyebrow: PROJ,
    emptyLabel: "No receipt",
    lead: "What ships, what proves it, and a check you run yourself.",
    empty: { icon: "receipt", title: "No receipt yet", msg: "Gate 5 issues the receipt when every module has landed." },
    spec: {
      route: "/missions/$id/receipt",
      note: "Phone-first. The proof check recomputes every digest on the device with WebCrypto, from receiptDigestInput.",
      calls: [
        "GET /api/receipts/{receiptId}?verify= (route 61)",
        "GET /api/receipts/{receiptId}/artifacts/{key} (route 107)",
      ],
      fresh: ["gate.receipt.issued and gate.pass.approved"],
      states: "No receipt, pass, verified, checking, checked, check failed, superseded (RECEIPT_SUPERSEDED).",
      gaps: [G.receipt],
    },
  },
  module: {
    href: "/missions/$id/modules/$ref",
    extraStates: [{ id: "ready", label: "Ready" }],
    label: "Module",
    icon: "box",
    title: "Module",
    eyebrow: PROJ,
    emptyLabel: "No module",
    lead: "One module: its runs, the agents working on it right now, its checks and its cost against the cap.",
    empty: { icon: "box", title: "No such module", msg: "This project's plan has no module with that name." },
    spec: {
      route: "/missions/$id/modules/$ref",
      note: "Live: runner.attempt.* and factory.module.changed from the event stream; agent steps from the trace stream with view=steps.",
      calls: [
        "GET /api/missions/{missionId}/modules/{moduleRef} (route 108): ModuleRunViewDto",
        "GET /api/attempts/{attemptId}/steps?after= (route 109) to backfill",
        "GET /api/traces/stream?attemptId=&view=steps (route 64) for the live feed",
        "GET /api/integration-commits/{integrationCommitId} (route 56) for a landing",
      ],
      fresh: ["runner.attempt.started and runner.attempt.ended", "factory.module.changed", "integrator.commit.changed"],
      states: "Waiting, running, retrying, parked, landed.",
      gaps: [G.moduleRun, G.history],
    },
  },
  dispatch: {
    href: "/missions/$id/dispatch",
    extraStates: [{ id: "ready", label: "Ready" }],
    label: "Dispatch",
    icon: "file",
    title: "Dispatch",
    eyebrow: PROJ,
    emptyLabel: "Not rendered",
    lead: "DISPATCH.md, task docs, completion reports and the package.",
    empty: {
      icon: "file",
      title: "Not rendered yet",
      msg: "The dispatch package renders once the plan is approved, and shows as out of date when the plan changes.",
    },
    spec: {
      route: "/missions/$id/dispatch",
      calls: [
        "GET /api/missions/{missionId}/dispatch-package (route 100), its files (101) and archive (102)",
        "POST /api/missions/{missionId}/dispatch-package/commits (route 114) {packageHash}: confirm the commit",
        "GET /api/missions/{missionId}/dispatches (route 49)",
      ],
      fresh: ["factory.task_doc.rendered, factory.dispatch_package.rendered and integrator.dispatch_package.committed"],
      states:
        "Not rendered, rendered, waiting for your confirmation, committing, committed, out of date (409 STALE_VERSION on packageHash), archive building (ARCHIVE_BUILDING).",
      gaps: [G.dispatchCommit],
    },
  },
  plan: {
    href: "/missions/$id/plan",
    extraStates: [{ id: "ready", label: "Ready" }],
    label: "Plan",
    icon: "list",
    title: "Plan",
    eyebrow: PROJ,
    emptyLabel: "No plan",
    lead: "Modules, EARS requirements, given/when/then scenarios and quality targets.",
    empty: {
      icon: "list",
      title: "No plan yet",
      msg: "Canon drafts the plan after checkpoint 0.4. Every approved version is kept, and a newer one supersedes it.",
    },
    spec: {
      route: "/missions/$id/plan?version=",
      calls: ["GET /api/missions/{missionId}/plan?version= (route 46)"],
      fresh: ["None needed: a plan version never changes, so it is cached forever."],
      states: "No plan yet, approved, superseded.",
      gaps: [],
    },
  },
  gates: {
    href: "/missions/$id/gates",
    extraStates: [{ id: "ready", label: "Ready" }],
    label: "Gates and integration",
    icon: "git-branch",
    title: "Gates and integration",
    eyebrow: PROJ,
    emptyLabel: "None yet",
    lead: "Gate results for each commit, and the lane where work lands one commit at a time.",
    empty: {
      icon: "git-branch",
      title: "No gate results yet",
      msg: "Results appear when a module\u2019s first commit is tested. The lane shows each commit as queued, testing, landed or rejected.",
    },
    spec: {
      route: "/missions/$id/gates",
      calls: [
        "GET /api/missions/{missionId}/gates (route 55)",
        "GET /api/integration-commits/{integrationCommitId} (route 56)",
      ],
      fresh: ["gate.evaluation.recorded and integrator.commit.changed"],
      states: "None yet, testing, landed, rejected.",
      gaps: [G.gateStrip, G.evGates],
    },
  },
  files: {
    href: "/missions/$id/files",
    extraStates: [{ id: "ready", label: "Ready" }],
    label: "Files",
    icon: "folder",
    title: "Files",
    eyebrow: PROJ,
    layout: "uploads",
    lead: "What Canon read in Gate 0, and the files kept here that no module uses yet.",
    empty: { icon: "folder", title: "No files yet", msg: "Drop files on this page to suggest them here, or on a module\u2019s page to give them to it." },
    spec: {
      route: "/missions/$id/files",
      calls: ["CR-34 (proposed): the project\u2019s files and their links, from sample data"],
      fresh: ["CR-34\u2019s upload and link events, once they\u2019re in the contract"],
      states: "Loading, empty, error, ready, live.",
      gaps: [CR34],
    },
  },
  findings: {
    href: "/missions/$id/findings",
    extraStates: [{ id: "ready", label: "Ready" }],
    label: "Findings",
    icon: "flag",
    title: "Findings",
    eyebrow: PROJ,
    lead: "What reviewers and gates reported. Confirm, dismiss or accept each, with a reason.",
    empty: { icon: "flag", title: "No findings", msg: "Nothing has been reported for this project." },
    spec: {
      route: "/missions/$id/findings?state=&route=&moduleRunId=",
      calls: [
        "GET /api/missions/{missionId}/findings?state=&route=&moduleRunId= (route 58)",
        "PATCH /api/findings/{findingId} (route 59): confirm or dismiss, with a reason",
        "POST /api/findings/{findingId}/acceptances (route 60): accept, with a reason; caps the verdict at pass",
      ],
      fresh: ["gate.finding.created and gate.finding.changed"],
      states: "Empty, open, triage.",
      gaps: [G.evFindings],
    },
  },
  toFile: {
    href: "/drive",
    label: "Drive",
    icon: "hard-drive",
    title: "Drive",
    eyebrow: "Files",
    layout: "uploads",
    keys: "upload files inbox drop",
    extraStates: [{ id: "ready", label: "Ready" }],
    lead: "Files waiting for a place. Each comes with a suggestion; one tap files it there.",
    empty: { icon: "hard-drive", title: "Drive is empty", msg: "Drop files anywhere, or on a page to file them there." },
    spec: {
      route: "/drive",
      calls: ["CR-34 (proposed): the inbox, StatusDto.inboxCount, filing, discarding"],
      fresh: ["CR-34\u2019s upload events (uploads.state, scanStatus), live, no refresh"],
      states: "Loading, empty, error, ready, live. Flagged files sit first and can\u2019t be filed.",
      gaps: [CR34],
    },
  },
  file: {
    href: "/files/$id",
    label: "File",
    icon: "file",
    title: "File",
    eyebrow: "Files",
    layout: "uploads",
    extraStates: [{ id: "ready", label: "Ready" }],
    lead: "",
    spec: {
      route: "/files/$id",
      calls: ["CR-34 (proposed): the file, its versions, links, readers and receipts; unlink, new version, purge"],
      fresh: ["CR-34\u2019s link events"],
      states: "Ready, refused link, purged.",
      gaps: [CR34],
    },
  },
  uploadStates: {
    href: "/drive/states",
    label: "Upload states",
    icon: "layers",
    title: "Upload states",
    eyebrow: "Design review · CR-34",
    layout: "uploads",
    extraStates: [{ id: "ready", label: "Ready" }],
    lead: "Every state of the upload screens in one place: each region\u2019s loading, empty, error and live states, every tray status and error, and every link state.",
    spec: { route: "/drive/states", calls: ["None: a review sheet"], fresh: [], states: "Ready.", gaps: [CR34] },
  },
  live: {
    href: "/live",
    label: "Live",
    icon: "activity",
    title: "Live",
    eyebrow: "Watch",
    layout: "rack",
    extraStates: [
      { id: "running", label: "Running" },
      { id: "full", label: "Full" },
    ],
    river: true,
    wide: true,
    emptyLabel: "Quiet",
    rackLabel: "0 of 6 slots in use",
    keys: "rooms rack running river",
    lead: "Every running room across projects, and the event river.",
    empty: {
      icon: "radio",
      title: "Quiet",
      msg: "Nothing is running. Rooms fill these slots as modules start, across every project.",
    },
    spec: {
      route: "/live",
      calls: [
        "GET /api/events/stream (route 63)",
        "GET /api/status (route 104) for the slots",
        "GET /api/traces/stream?attemptId=&view=steps (route 64), one per open terminal",
      ],
      fresh: [
        "factory.dispatch.changed, runner.attempt.started and runner.attempt.ended",
        "system.alert.raised and system.alert.cleared",
      ],
      states: "Quiet, running, full (6 of 6). Hidden while a terminal is attached (CR-29).",
      gaps: [G.rooms, G.osa],
    },
  },
  clients: {
    href: "/clients",
    extraStates: [{ id: "ready", label: "Ready" }],
    label: "Clients",
    icon: "building",
    title: "Clients",
    eyebrow: "Clients",
    keys: "contacts repo tokens",
    lead: "Everyone you work with or might: active clients, leads, past and lost.",
    headActions: [{ label: "Add a lead", icon: "plus", variant: "primary", action: "addLead" }],
    empty: {
      icon: "building",
      title: "No clients yet",
      msg: "Add a client here, or while starting a new project.",
      actions: [{ label: "Add client", variant: "primary", icon: "plus" }],
    },
    spec: {
      route: "/clients, /clients/$id",
      calls: [
        "GET /api/clients (route 8); AVEL itself only with ?kind=internal",
        "GET /api/clients/{clientId} (route 10), POST /api/clients (route 9)",
        "PATCH /api/clients/{clientId} (route 11) {proofConsent}",
        "GET /api/pipeline (route 122), GET /api/leads?stage= (route 117), POST /api/leads (route 118), POST /api/leads/{leadId}/closures (route 119)",
        "GET /api/followups/{followupId} (route 120), POST /api/followups/{followupId}/sends (route 121) {draftHash, outcome}",
        "GET /api/missions?kind=internal (route 19) for AVEL\u2019s own projects",
        "Repo connections: list, create, update, revoke, verify, rotate (routes 12 to 17)",
      ],
      fresh: [
        "pipeline.lead.created, pipeline.lead.closed and pipeline.followup.sent",
        "pipeline.decision.* for follow-ups and upkeep offers",
      ],
      states:
        "Empty, ready, needs step-up (create, update and rotate a repo connection only), unsubscribed (CONTACT_UNSUBSCRIBED).",
      gaps: [G.pipeline, G.clientTimeline],
    },
  },
  knowledge: {
    href: "/library/knowledge?layer=client",
    label: "Client knowledge",
    icon: "book-open",
    title: "Client knowledge",
    eyebrow: "Factory",
    keys: "kb language rules journeys risks",
    wide: true,
    extraStates: [{ id: "ready", label: "Ready" }],
    lead: "The Library filtered to each client\u2019s own knowledge: language, rules, journeys and risks.",
    empty: {
      icon: "book-open",
      title: "No client knowledge yet",
      msg: "Canon proposes entries during onboarding. Once approved, every project for that client uses them.",
    },
    spec: {
      route: "/library/knowledge?layer=client",
      calls: [
        "GET /api/library/kb-entries?cursor=&limit= (route 78), filtered to the client layer in the browser",
        "POST /api/library/kb-entries (route 79), GET and PATCH /api/library/kb-entries/{itemId} (routes 80, 81)",
      ],
      fresh: ["knowledge.change.opened, knowledge.change.updated and knowledge.change.closed"],
      states: "Empty, proposed, approved.",
      gaps: [
        P(
          "proposed",
          "Open",
          "Library CR 11",
          "A layer filter on route 78; until it lands the page filters in the browser.",
        ),
      ],
    },
  },
  library: {
    href: "/library",
    label: "Library",
    icon: "swatch-book",
    title: "Library",
    wide: true,
    extraStates: [{ id: "ready", label: "Ready" }],
    eyebrow: "Factory",
    keys: "skills knowledge rules kb learning",
    lead: "The knowledge base the agents learn from: knowledge, skills and rules. Every change is a factory PR you approve.",
    empty: {
      icon: "swatch-book",
      title: "The library is empty",
      msg: "Knowledge, skills and rules land here once their factory PRs merge. Closeout and retries suggest the first entries.",
      actions: [{ label: "New knowledge entry", icon: "plus" }],
    },
    spec: {
      route: "/library, /library/all, /library/c/$category, /library/$kind/$itemId",
      calls: [
        "GET /api/library/skills, /api/library/kb-entries and /api/library/rules (routes 74, 78, 82), merged in the browser until a search across kinds exists",
        "GET and PATCH /api/library/skills/{itemId}, /api/library/kb-entries/{itemId}, /api/library/rules/{itemId}",
        "GET /api/library/skills/{itemId}/results (route 115) and GET /api/eval/runs/{runId} (route 116)",
        "GET /api/missions/{missionId}/closeout-items (route 91)",
      ],
      fresh: [
        "knowledge.change.opened, knowledge.change.updated, knowledge.change.closed and knowledge.release.cut",
        "evals.run.started and evals.run.finished",
      ],
      states: "Empty, ready, nothing matches, proposed, PR open, retired.",
      gaps: [
        P("proposed", "Open", "Library CR 1", "Read an item's content: the get routes return only a path and a hash."),
        P("proposed", "Open", "Library CR 5, 7, 8", "Usage per entry, the roles that load it, and version history."),
        P("proposed", "Open", "Library CR 2", "A template field on knowledge entries."),
        P(
          "proposed",
          "Open",
          "Library CR 11",
          "One search across kinds with facet counts (kind, type, layer, stack, role, status) and sort.",
        ),
        G.skillResults,
      ],
    },
  },
  templates: {
    href: "/templates",
    label: "Templates",
    icon: "layout-grid",
    title: "Templates",
    wide: true,
    extraStates: [{ id: "ready", label: "Ready" }],
    eyebrow: "Factory",
    keys: "templates starters portfolio scaffold",
    lead: "Where projects start. Each template comes from an internal project delivered with a verified receipt.",
    empty: {
      icon: "layout-grid",
      title: "No templates yet",
      msg: "Deliver an internal project with a verified receipt, then make a template from it.",
    },
    spec: {
      route: "/templates",
      calls: [
        "GET /api/library/templates (route 86)",
        "GET /api/missions?kind=template (route 19): template builds, delivered ones ready to publish",
      ],
      fresh: ["knowledge.change.opened and knowledge.change.closed for template PRs", "missions.mission.changed"],
      states: "Empty, ready, ready to become a template, draft in PR.",
      gaps: [
        P(
          "proposed",
          "Open",
          "Library CR 4, 6",
          "A template's plan, rules, skills and guide entry, and results from the projects built with it.",
        ),
        P(
          "proposed",
          "Open",
          "Portfolio",
          "Screenshots captured at the pinned commit; until then the cards draw a preview.",
        ),
      ],
    },
  },
  template: {
    href: "/templates/$slug",
    label: "Template",
    icon: "layout-grid",
    title: "Template",
    wide: true,
    extraStates: [{ id: "ready", label: "Ready" }],
    eyebrow: "Factory",
    keys: "template",
    lead: "",
    empty: { icon: "layout-grid", title: "Template not found", msg: "It may have been retired. Go back to Templates." },
    spec: {
      route: "/templates/$itemId",
      calls: [
        "GET /api/library/templates/{itemId} (route 88): TemplateViewDto with docs",
        "PATCH /api/library/templates/{itemId} (route 89)",
      ],
      fresh: ["knowledge.change.opened and knowledge.change.closed"],
      states: "Ready, draft in PR, retired.",
      gaps: [
        G.templateDocs,
        P("proposed", "Open", "Library CR 6", "Built from it, first-try pass, cost against cap and time."),
      ],
    },
  },
  templateNew: {
    href: "/templates/new",
    label: "New template",
    icon: "layout-grid",
    title: "New template",
    wide: true,
    extraStates: [{ id: "ready", label: "Ready" }],
    eyebrow: "Factory",
    keys: "new template docs",
    lead: "",
    empty: {
      icon: "layout-grid",
      title: "Nothing to make a template from",
      msg: "Templates come from projects delivered with a verified receipt.",
    },
    spec: {
      route: "/templates/new?from=$missionId",
      calls: [
        "GET /api/library/templates/sources/{missionId} (route 110): a delivered template build to cut it from",
        "GET and PUT /api/library/template-drafts/{draftId} (routes 111, 112), each save bound to the rowVersion from the last one",
        "POST /api/library/template-drafts/{draftId}/pull-requests (route 113): checks the draft and opens its factory PR; returns {prNumber, decisionRef}",
      ],
      fresh: ["Your own saves (a second tab gets 409 STALE_VERSION instead of losing text)."],
      states:
        "Writing, saved, ready to open, PR open, docs invalid (TEMPLATE_DOCS_INVALID), slug taken (TEMPLATE_SLUG_TAKEN), not shipped (SOURCE_NOT_SHIPPED), not verified (TEMPLATE_SOURCE_NOT_VERIFIED).",
      gaps: [G.templateDrafts, G.templateDocs],
    },
  },
  factory: {
    href: "/factory",
    extraStates: [{ id: "ready", label: "Ready" }],
    label: "Factory versions",
    icon: "git-pull-request",
    title: "Versions and PRs",
    eyebrow: "Factory",
    keys: "commits prs merges",
    lead: "Factory commits, the projects on each, and open factory PRs.",
    empty: {
      icon: "git-pull-request",
      title: "No open changes",
      msg: "Changes to the library, the roster or client knowledge open a factory PR here.",
    },
    spec: {
      route: "/factory",
      calls: [
        "GET /api/factory/versions (route 71)",
        "GET /api/factory/changes (route 72)",
        "POST /api/factory/changes/{changeId}/merges (route 73) {headSha}",
      ],
      fresh: ["knowledge.change.opened, knowledge.change.updated and knowledge.change.closed", "knowledge.decision.*"],
      states: "None open, open changes.",
      gaps: [],
    },
  },
  roster: {
    href: "/roster",
    label: "Agents",
    icon: "bot",
    title: "Agents",
    wide: true,
    extraStates: [
      { id: "ready", label: "Ready" },
      { id: "stale", label: "Stale on file (409)" },
    ],
    eyebrow: "Factory",
    keys: "agents models roles",
    lead: "Who builds, who checks and who leads",
    empty: {
      icon: "bot",
      title: "No roster saved",
      msg: "Until a roster is saved, every role runs on the factory defaults.",
    },
    spec: {
      route: "/roster",
      calls: [
        "GET /api/roster (route 47)",
        "PUT /api/roster (route 48): the whole roster as a new version, filed as a factory PR",
      ],
      fresh: ["roster.decision.* for the roster PR"],
      states: "Loading, ready, editing, rule broken, filing, PR open, stale (409), error.",
      gaps: [
        P(
          "proposed",
          "Open",
          "Roster CR",
          "The roster\u2019s inner shape (teams, agents, workKinds, roles, disputes). The contract only fixes { version, roster }.",
        ),
        P("proposed", "Open", "Gap 4", "Each agent\u2019s live status, from running rooms."),
        P(
          "proposed",
          "Open",
          "Roster CR",
          "Attaching a skill to roles. The old avel-web route isn\u2019t in the contract, so skills attach inside the roster draft sent with PUT /api/roster.",
        ),
      ],
    },
  },
  activity: {
    href: "/activity",
    extraStates: [{ id: "ready", label: "Ready" }],
    label: "Activity",
    icon: "list",
    title: "Activity log",
    eyebrow: "Factory",
    keys: "audit log overrides",
    lead: "Who did what, to what, and why. Overrides included.",
    empty: {
      icon: "list",
      title: "No activity yet",
      msg: "Every approval, override and change is recorded here with its reason.",
    },
    spec: {
      route: "/activity",
      calls: ["GET /api/activity?cursor=&limit= (route 93)"],
      fresh: ["Refetched when opened."],
      states: "Empty, ready. Actors: you, an agent, the system, and OSA (assistant, CR-29).",
      gaps: [G.osa],
    },
  },
  settings: {
    href: "/settings",
    label: "Settings",
    icon: "settings-2",
    title: "Settings",
    eyebrow: "Factory",
    layout: "settings",
    keys: "theme cli sessions health doctor",
    lead: "Display, CLI sessions and health checks.",
    spec: {
      route: "/settings",
      calls: [
        "GET /api/cli/sessions (route 4), DELETE /api/cli/sessions/{sessionId} (route 5)",
        "GET /api/health (route 6), GET /api/doctor (route 7)",
        "OSA, behind the flag: the assistant session, pause (revokes it) and spend against its cap (CR-29)",
      ],
      fresh: ["Refetched when opened.", "cli.assistant.paused (CR-29)"],
      states: "Ready, a check failing.",
      gaps: [G.osa],
    },
  },
  notFound: {
    href: "/",
    label: "Not found",
    icon: "search",
    title: "Not found",
    eyebrow: "",
    lead: "",
    resource: "This page",
    spec: { route: "—", calls: [], fresh: [], states: "404.", gaps: [] },
  },
};
const NAV = [
  { key: "main", items: ["decisions", "toFile", "live", "clients"] },
  { key: "projects", label: "Projects", projects: true },
  // CR-28 (the learning layer) is held, not drafted: its item will sit in this group, after "roster".
  // Nothing is built for it and no route is called; this comment is the reserved space.
  { key: "factory", label: "Factory", items: ["library", "templates", "roster", "activity", "factory"], small: true },
];
const FACTORY_TABS = [
  ["library", "Library", "/library"],
  ["templates", "Templates", "/templates"],
  ["template", "Template", "/templates"],
  ["knowledge", "Client knowledge", "/library/knowledge?layer=client"],
  ["roster", "Agents", "/roster"],
  ["factory", "Versions and PRs", "/factory"],
  ["activity", "Activity log", "/activity"],
];
const FACTORY_IDS = FACTORY_TABS.map((t) => t[0]);
const PROJECT_IDS = [
  "progress",
  "watch",
  "release",
  "receipt",
  "module",
  "dispatch",
  "plan",
  "gates",
  "findings",
  "canon",
  "files",
];
const NAV_LABEL = {
  live: "Live",
  factory: "Versions and PRs",
  knowledge: "Client knowledge",
  roster: "Agents",
  activity: "Activity log",
};
const DOTS = ["var(--cr-id-1)", "var(--cr-id-2)", "var(--cr-id-3)", "var(--cr-id-4)", "var(--cr-id-5)"];
const PULSE = ["running", "reviewing", "deciding", "refreshing", "delivering", "onboarding"];
const ERR = {
  400: {
    title: "Request rejected",
    glyph: "stopped",
    body: "The server couldn\u2019t read this request. Reload and try again. If it repeats, send the request ID with your report.",
    action: "Reload",
  },
  401: {
    title: "Signed out",
    glyph: "stopped",
    body: "Your session ended. Sign in again to continue. Nothing you approved was lost.",
    action: "Sign in",
  },
  403: {
    title: "Not allowed",
    glyph: "stopped",
    body: "{res} needs your password again before it opens. Approvals never ask for it; rotating, verifying and revoking tokens do.",
    action: "Enter password",
  },
  404: {
    title: "Not found",
    glyph: "waiting",
    body: "{res} doesn\u2019t exist, or it was closed. Go back to All projects.",
    action: "Go to All projects",
    href: "#/missions",
  },
  409: {
    bar: "staleVersion",
    title: "This changed since you opened it",
    glyph: "headsup",
    body: "A newer version arrived while you were reading. Review the new version first.",
    action: "Review new version",
    primary: true,
  },
  422: {
    title: "Not allowed in this state",
    glyph: "headsup",
    body: "{res} can\u2019t do that while {subject} is {state}. Allowed from here:",
    action: "Refresh",
  },
  429: {
    title: "Slow down",
    glyph: "headsup",
    body: "Too many requests in a short time. The button unlocks when the window resets.",
    action: "Retry",
  },
  500: {
    bar: "serverError",
    title: "Server error",
    glyph: "stopped",
    body: "The last refresh failed on our side. Showing what loaded 2 min ago.",
    action: "Retry",
  },
  offline: {
    bar: "offline",
    title: "Offline",
    glyph: "waiting",
    body: "Showing what loaded 2 min ago. AVEL reconnects on its own.",
    action: "Retry now",
  },
};
const CODES = [400, 401, 403, 404, 409, 422, 429, 500, "offline"];
const VPS = [
  { id: "phone", label: "Phone", short: "390", w: 390 },
  { id: "tablet", label: "Tablet", short: "820", w: 820 },
  { id: "desk", label: "Desk", short: "1280", w: 1280 },
];

export class ControlRoomLogic extends DCLogic {
  state = this.initState();
  progressRef = React.createRef();
  canvasRef = React.createRef();
  topbarRef = React.createRef();
  mainRef = React.createRef();

  initState() {
    let p = {};
    try {
      p = JSON.parse(localStorage.getItem(LS) || "{}");
    } catch (e) {}
    const night = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
    return {
      theme: p.theme || (night ? "night" : "light"),
      depth: p.depth || "flat",
      collapsed: !!p.collapsed,
      dock: !!p.dock,
      fresh: !!p.fresh,
      stream: p.stream || "live",
      gaps: !!p.gaps,
      spec: !!p.spec,
      // CR-29, OSA as the operator agent: proposed, so its screens sit behind this flag
      osa: !!p.osa,
      banner: p.banner || null,
      pageStates: p.pageStates || {},
      errCode: p.errCode || 500,
      lastMission: p.lastMission || null,
      hash: location.hash,
      icons: null,
      // CR-34 (proposed): the upload tray, Drive, the filing sheet and every file's record, from sample data
      up: initUploads(),
      world: null,
      worldErr: false,
      sheet: false,
      acct: false,
      tip: null,
      toast: null,
      vp: null,
      libSel: null,
      rosterEdits: {},
      retryIn: 0,
      reqId: this.newReq(),
      dec: {},
      snack: null,
      focusRef: null,
      // a decision link opens that decision, on first load as well as on a hash change
      openDec: this.parseRoute(location.hash).ref || undefined,
      proofOpen: {},
      reasonVariant: p.reasonVariant || "prefilled",
      riverProj: "all",
      riverKind: "all",
      riverPaused: false,
      termOpen: null,
      liveView: p.liveView || "rooms",
      stopOpen: null,
      stopReason: {},
      stopped: {},
    };
  }
  newReq() {
    return Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  }
  persist() {
    const s = this.state;
    try {
      localStorage.setItem(
        LS,
        JSON.stringify({
          theme: s.theme,
          depth: s.depth,
          collapsed: s.collapsed,
          dock: s.dock,
          fresh: s.fresh,
          stream: s.stream,
          gaps: s.gaps,
          spec: s.spec,
          osa: s.osa,
          banner: s.banner,
          reasonVariant: s.reasonVariant,
          liveView: s.liveView,
          pageStates: s.pageStates,
          errCode: s.errCode,
          lastMission: s.lastMission,
        }),
      );
    } catch (e) {}
  }
  set(patch) {
    this.setState(patch, () => this.persist());
  }

  componentDidMount() {
    // the walk-in moment: one sweep as the control room opens
    setTimeout(sawLiveEvent, 500);
    // the pointer light over cards is off (Nov 14: it followed the cursor around Decisions)
    this.offSpotlight = () => {};
    this.installDrop();
    startTray(this);
    this.mq = window.matchMedia("(max-width: 760px)");
    this.onMq = () => this.applyHtml();
    this.mq.addEventListener("change", this.onMq);
    this.applyHtml();
    Promise.all([
      import("../kit/icons.json").then((m) => m.default),
      import("../mock/world.json").then((m) => m.default),
    ])
      // route 52's response, in contract 1.0.0's shapes, read through the decisions adapter
      .then(([icons, world]) => {
        this.setState({
          icons,
          world: Object.assign({}, world, {
            decisions: { items: PENDING.items.map((d) => toView(d, EVIDENCE.details)), nextCursor: null },
          }),
        });
        // Prototype switches in the URL, for reviews and the e2e checks: ?sim=every and ?osa=1|0
        const q = (location.hash.split("?")[1] || "") + "&" + (location.search || "").slice(1);
        if (/(^|&)sim=every(&|$)/.test(q)) this.everyKind(true);
        if (/(^|&)osa=1(&|$)/.test(q)) this.set({ osa: true });
        if (/(^|&)osa=0(&|$)/.test(q)) this.set({ osa: false });
      })
      .catch(() => this.setState({ worldErr: true }));
    this.lastPath = (location.hash || "#/").split("?")[0];
    this.onHash = () => {
      const r = this.parse(location.hash);
      const path = (location.hash || "#/").split("?")[0];
      const moved = path !== this.lastPath;
      this.lastPath = path;
      const patch = { hash: location.hash, sheet: false, acct: false, tip: null, pal: null, keysOpen: false };
      if (r.missionId) patch.lastMission = r.missionId;
      // CR-34: the tray closes on a new page, so it never sits over that page's buttons; Drive keeps the progress
      if (moved && this.state.up && this.state.up.trayOpen) patch.up = Object.assign({}, this.state.up, { trayOpen: false });
      if (r.ref) Object.assign(patch, { openDec: r.ref, focusRef: r.ref });
      if (r.page === "roster" && r.query.get("q")) patch.roQ = r.query.get("q");
      // moving to another page eases the new one in (View Transitions); a filter change just updates
      const calm = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (moved && document.startViewTransition && !calm) {
        try {
          const vt = document.startViewTransition(() => flushSync(() => this.set(patch)));
          // a transition the browser skips (a resize, a second click) has nothing to report
          [vt.ready, vt.finished, vt.updateCallbackDone].forEach((x) => x && x.catch(() => {}));
        } catch (e) {
          this.set(patch);
        }
      } else this.set(patch);
      if (!moved) return; // a filter written to the link: stay where you are
      const c = this.canvasRef.current;
      if (c) c.scrollTop = 0;
      requestAnimationFrame(() => {
        const t = document.querySelector('.cr-mast-tabs [aria-current="page"]');
        if (t && t.scrollIntoView) t.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
      // Move focus to the new page's title, so a screen reader and the keyboard start at the top.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (r.ref) {
            const card =
              document.querySelector('.cr-dq-row[data-ref="' + r.ref + '"][aria-expanded="true"]') ||
              document.querySelector("#hero-t");
            if (card) {
              if (!card.hasAttribute("tabindex") && card.tagName !== "BUTTON") card.setAttribute("tabindex", "-1");
              card.scrollIntoView({ block: "nearest" });
              return card.focus({ preventScroll: true });
            }
          }
          const h = document.querySelector("#cr-main h1, .cr-mast h1, .cr-canvas h1");
          if (h) {
            if (!h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1");
            h.focus({ preventScroll: true });
          }
        }),
      );
    };
    // Business was removed: an old #/business link becomes #/clients without adding a history entry
    this.fixOld = () => {
      if (/^#\/business\b/.test(location.hash))
        try {
          history.replaceState(null, "", "#/clients");
        } catch (e) {
          /* the preview may not allow it */
        }
    };
    this.fixOld();
    window.addEventListener("hashchange", this.fixOld);
    window.addEventListener("hashchange", this.onHash);
    window.addEventListener("keydown", this.onKey);
    this.onDown = (e) => {
      if (this.state.acct && !(e.target.closest && e.target.closest(".cr-acct, .cr-avatar-btn")))
        this.setState({ acct: false });
    };
    document.addEventListener("pointerdown", this.onDown);
    this.onResize = () => this.placeIndicators();
    window.addEventListener("resize", this.onResize);
    this.lastEventAt = Date.now();
    // not a fetch: the 1 s tick for the stall check (StatusDto.stallAfterMs) and on-screen countdowns
    this.tick = setInterval(() => {
      if (this.state.retryIn > 0) this.setState((s) => ({ retryIn: s.retryIn - 1 }));
      // the stall check, the only timed refresh left: no event for stallAfterMs flags the stream
      const st = this.state.world && this.state.world.status;
      if (st && this.state.stream === "live" && Date.now() - this.lastEventAt > st.stallAfterMs)
        this.setState({ stream: "stalled" });
      if (
        (location.hash.indexOf("#/roster") === 0 ||
          (location.hash.indexOf("#/live") === 0 && this.state.liveView === "canvas")) &&
        this.state.stream === "live"
      )
        this.setState((x) => ({ roTick: (x.roTick || 0) + 1 }));
      const sn = this.state.snack;
      if (sn) this.setState({ snack: sn.left > 1 ? Object.assign({}, sn, { left: sn.left - 1 }) : null });
    }, 1000);
  }
  /**
   * CR-34: drop any file anywhere. Dragging files over the window shows where they'll go (the page decides:
   * a module, a client, or Drive). The bytes are never read here: only each file's name, size and type.
   */
  installDrop() {
    let depth = 0;
    const hasFiles = (e) => e.dataTransfer && [...(e.dataTransfer.types || [])].includes("Files");
    const setUp = (patch) => this.setState((s) => ({ up: Object.assign({}, s.up, patch) }));
    this.onDragEnter = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth += 1;
      const items = [...(e.dataTransfer.items || [])];
      const folder = items.length === 1 && items[0].kind === "file" && !items[0].type && items[0].webkitGetAsEntry && items[0].webkitGetAsEntry() && items[0].webkitGetAsEntry().isDirectory;
      if (!this.state.up.drag) setUp({ drag: { count: items.length, folder: !!folder } });
    };
    this.onDragOver = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      if (!this.state.up.drag) setUp({ drag: { count: (e.dataTransfer.items || []).length, folder: false } });
    };
    this.onDragLeave = (e) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (!depth || !e.relatedTarget) setUp({ drag: null });
    };
    this.onDrop = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setUp({ drag: null });
      const target = dropTarget(this, this.ctx());
      const entries = [...(e.dataTransfer.items || [])].map((it) => (it.webkitGetAsEntry ? it.webkitGetAsEntry() : null));
      const files = [...(e.dataTransfer.files || [])];
      const list = files.map((f, i) => {
        const en = entries[i];
        return en && en.isDirectory ? { name: f.name, size: 0, type: "", folder: true, entry: en } : { name: f.name, size: f.size, type: f.type };
      });
      // a folder: count what's inside (one level), then add it as one row
      Promise.all(
        list.map((x) =>
          x.entry
            ? new Promise((res) => x.entry.createReader().readEntries((es) => res(Object.assign({}, x, { count: es.length, entry: null })), () => res(x)))
            : Promise.resolve(x),
        ),
      ).then((ready) => addUploads(this, ready, target));
    };
    window.addEventListener("dragenter", this.onDragEnter);
    window.addEventListener("dragover", this.onDragOver);
    window.addEventListener("dragleave", this.onDragLeave);
    window.addEventListener("drop", this.onDrop);
    this.dropOff = () => {
      window.removeEventListener("dragenter", this.onDragEnter);
      window.removeEventListener("dragover", this.onDragOver);
      window.removeEventListener("dragleave", this.onDragLeave);
      window.removeEventListener("drop", this.onDrop);
    };
  }
  componentWillUnmount() {
    if (this.offSpotlight) this.offSpotlight();
    if (this.dropOff) this.dropOff();
    clearTimeout(this.upTimer);
    window.removeEventListener("hashchange", this.onHash);
    window.removeEventListener("hashchange", this.fixOld);
    window.removeEventListener("keydown", this.onKey);
    document.removeEventListener("pointerdown", this.onDown);
    window.removeEventListener("resize", this.onResize);
    if (this.mq) this.mq.removeEventListener("change", this.onMq);
    clearInterval(this.tick);
    clearTimeout(this.toastT);
    clearTimeout(this.saveT);
  }
  componentDidUpdate(pp, ps) {
    this.applyHtml();
    const W = this.state.world,
      parked = W && !this.state.fresh && W.rooms ? W.rooms.parked.length : 0,
      stall = W && !this.state.fresh && W.rooms ? W.rooms.items.filter((r) => r.lastEventSec >= 480).length : 0;
    const cx = this.ctx(),
      nWait = cx.w && !this.state.fresh ? Number(cx.w.waiting) || 0 : 0,
      where = (PAGES[cx.id] && (NAV_LABEL[cx.id] || PAGES[cx.id].label)) || "",
      base =
        (nWait ? nWait + " waiting \u00b7 " : "") +
        (where && cx.id !== "decisions" ? where + " \u00b7 " : cx.id === "decisions" ? "Decisions \u00b7 " : "") +
        "AVEL",
      flag = ""; // the count that matters in a tab title is what waits on you
    void parked;
    void stall;
    if (document.title !== flag + base) document.title = flag + base;
    this.placeIndicators();
    if (this._prevCollapsed !== this.state.collapsed) {
      this._prevCollapsed = this.state.collapsed;
      setTimeout(() => this.placeIndicators(), 280);
    }
  }

  attr(el, name, on, val) {
    if (on) el.setAttribute(name, val == null ? "" : val);
    else el.removeAttribute(name);
  }
  applyHtml() {
    const el = document.documentElement,
      s = this.state,
      c = this.ctx();
    if (el.getAttribute("data-theme") !== s.theme) {
      const st = document.createElement("style");
      st.textContent = "*,*::before,*::after{transition:none!important}";
      document.head.appendChild(st);
      el.setAttribute("data-theme", s.theme);
      void document.body.offsetHeight; // commit the new colours while transitions are off
      requestAnimationFrame(() => requestAnimationFrame(() => st.remove()));
    }
    el.setAttribute("data-depth", s.depth);
    // the heartbeat (taste pass): live while the stream is, faster the more rooms are running, still when stalled
    el.setAttribute("data-stream", s.fresh ? "quiet" : s.stream || "live");
    const used = (s.world && s.world.status && s.world.status.slots && s.world.status.slots.busy) || 0;
    el.style.setProperty("--beat", (2.6 / (1 + Math.min(used, 6) * 0.18)).toFixed(2) + "s");
    el.setAttribute("data-rail", s.collapsed ? "collapsed" : "open");
    el.setAttribute("data-density", "desk");
    this.attr(el, "data-focus", c.id === "canon");
    this.attr(el, "data-gaps", s.gaps);
  }
  placeIndicators() {
    document.querySelectorAll(".lib-nav").forEach((nav) => {
      const ind = nav.querySelector(".lib-nav-indicator");
      if (!ind) return;
      // only rows carry the indicator; the Projects header's "All" link marks itself
      let cur = nav.querySelector('.lib-nav-item[aria-current="page"]');
      if (!cur || !cur.offsetParent) cur = nav.querySelector('.lib-nav-item[aria-current="location"]');
      if (!cur || !cur.offsetParent) {
        ind.style.opacity = "0";
        return;
      }
      const nr = nav.getBoundingClientRect(),
        cr = cur.getBoundingClientRect();
      ind.style.height = cr.height + "px";
      ind.style.transform = "translateY(" + (cr.top - nr.top + nav.scrollTop) + "px)";
      ind.style.opacity = "1";
    });
  }
  parse(hash) {
    const r = this.parseRoute(hash);
    r.query = new URLSearchParams((hash || "").split("?")[1] || "");
    return r;
  }
  /** Filters kept in the link: ?state=Building&client=GTS%20Diesel → { state: ["Building"], client: ["GTS Diesel"] } */
  urlSel(c, keys) {
    const q = c.r.query || new URLSearchParams("");
    const out = {};
    keys.forEach((k) => {
      const v = q
        .getAll(k)
        .flatMap((x) => x.split(","))
        .filter(Boolean);
      if (v.length) out[k] = v;
    });
    return out;
  }
  parseRoute(hash) {
    const h = (hash || "").replace(/^#/, "") || "/";
    const [path, qs] = h.split("?");
    const q = new URLSearchParams(qs || "");
    const seg = path.split("/").filter(Boolean);
    if (!seg.length || seg[0] === "decisions")
      return { page: "decisions", ref: seg[1] ? decodeURIComponent(seg[1]) : null };
    if (seg[0] === "clients") return { page: "clients", clientId: seg[1] || null, clientTab: seg[2] === "files" ? "files" : null };
    // CR-34: Drive, its state sheet, and one file's page
    if (seg[0] === "drive" || seg[0] === "to-file") return { page: seg[1] === "states" ? "uploadStates" : "toFile" };
    if (seg[0] === "files") return seg[1] ? { page: "file", fileId: decodeURIComponent(seg[1]) } : { page: "toFile" };
    if (seg[0] === "missions") {
      if (!seg[1]) return { page: "projects" };
      if (seg[1] === "new") return { page: "newProject" };
      const map = {
        "": "progress",
        build: "progress",
        onboarding: "canon",
        live: "watch",
        release: "release",
        receipt: "receipt",
        modules: "module",
        dispatch: "dispatch",
        plan: "plan",
        gates: "gates",
        findings: "findings",
        files: "files",
      };
      return {
        page: map[seg[2] || ""] || "notFound",
        missionId: seg[1],
        index: !seg[2],
        moduleRef: seg[2] === "modules" ? seg[3] || null : null,
      };
    }
    if (seg[0] === "library") {
      const kind = seg[1] || null;
      if (kind === "templates") return { page: "templates" };
      if (kind === "knowledge" && q.get("layer") === "client") return { page: "knowledge", kind, item: seg[2] || null };
      if (kind === "c" && seg[2]) return { page: "library", cat: seg[2] };
      if (kind === "all") return { page: "library", all: true };
      // an older kind list (/library/skills) opens every entry, filtered to that kind
      if (["knowledge", "skills", "rules", "guide"].includes(kind) && !seg[2])
        return { page: "library", all: true, kind };
      if (!kind || (["knowledge", "skills", "rules", "guide"].includes(kind) && seg[2]))
        return { page: "library", kind, item: seg[2] || null };
      return { page: "notFound" };
    }
    if (seg[0] === "templates")
      return seg[1] === "new"
        ? { page: "templateNew", from: q.get("from") }
        : seg[1]
          ? { page: "template", slug: seg[1] }
          : { page: "templates" };
    // /roster?status=parked opens the roster already filtered
    // /roster/<agent> is one agent's overview page
    if (seg[0] === "roster")
      return { page: "roster", status: q.get("status") || null, agent: seg[1] ? decodeURIComponent(seg[1]).toLowerCase() : null };
    const top = {
      live: "live",
      // Business was removed (private); old links land on Clients
      business: "clients",
      clients: "clients",
      factory: "factory",
      roster: "roster",
      activity: "activity",
      settings: "settings",
    };
    return { page: top[seg[0]] || "notFound" };
  }
  ctx() {
    const s = this.state,
      r = this.parse(s.hash);
    let w = null;
    if (s.world && s.fresh) w = { clients: [], missions: [], waiting: 0, decs: [] };
    else if (s.world) {
      const all = s.world.decisions ? s.world.decisions.items : [];
      const decs = all.concat(this.checkpointDecs()).filter((d) => {
        const x = s.dec[d.ref] || {};
        return (
          gateOpen(d, s.dec) && !["decided", "removed"].includes(x.state) && !["elsewhere", "expired"].includes(x.sim)
        );
      });
      w = {
        clients: s.world.clients.items,
        decs,
        // StatusDto.needsYouCount (route 104), kept in step by the <owner>.decision.* events
        waiting: decs.length,
        missions: s.world.missions.items.map((m) =>
          Object.assign(withAudience(m, all, s.dec, s.world.clients.items), {
            needsYouCount: decs.filter((d) => d.missionId === m.id).length,
          }),
        ),
      };
    }
    let id = r.page,
      mission = null;
    if (r.missionId && w) {
      mission = w.missions.find((m) => m.id === r.missionId) || null;
      if (!mission) id = "notFound";
      else if (id === "progress" && NO_TREE.includes(mission.state)) id = "canon";
      // a project opens on its current phase: Scope before finalize, Build while it runs, Release after Gate 5
      else if (id === "progress" && r.index && CLOSE_STATES.includes(mission.state)) id = "release";
    }
    return { r, w, id, mission };
  }

  /** A question's ref from its code ("Q-0.2"): codes are labels, refs are `<kind>:<id>` (contract 1.0.0). */
  refOf(code) {
    const items = (this.state.world && this.state.world.decisions && this.state.world.decisions.items) || [];
    const d = items.find((x) => x.code === code);
    return d ? d.ref : code;
  }

  /**
   * Decisions that become due as you work: a checkpoint ready to approve, the plan ready to finalize,
   * and a release once its pass is approved. Route 52 adds them as they come due; here they're built
   * in the same PendingDecisionDto shape and read through the same adapter.
   */
  checkpointDecs(includeDone) {
    const out = [];
    const all = this.state.canon || {};
    const dec = this.state.dec;
    const qDone = (dec[this.refOf("Q-0.2")] || {}).state === "decided";
    const ms = (this.state.world && this.state.world.missions.items) || [];
    const mOf = (id) => ms.find((x) => x.id === id) || {};
    const NEXT = { 0.2: "0.3 Mission and roster", 0.3: "0.4 Context", 0.4: "the final plan" };
    const NAME = { 0.2: "0.2 Breakdown", 0.3: "0.3 Mission and roster", 0.4: "0.4 Context" };
    const EVID = {
      0.2: [
        ["Code checks", "Every check passes; one is advisory until Feature missions are measured"],
        ["Review", "Brennan\u2019s finding on the job page is accepted with your reason"],
        ["Sign-in", "SMS codes, from your answer to Canon"],
      ],
      0.3: [
        ["Roster", "Every job has an agent from roster version 7"],
        ["Budget check", "Passes, with one module\u2019s cap raised by 7%"],
        ["Template", "None matches, so the plan starts from the breakdown"],
      ],
      0.4: [
        ["Readiness", "Partial; you chose to go ahead, with a reason"],
        ["Territories", "Don\u2019t overlap"],
        ["Files", "Every module has the files it asked for"],
      ],
    };
    const baseOf = (m, ref, kind) => ({
      ref,
      kind,
      owner: "onboarding",
      mission: { id: m.id, name: m.name, kind: m.kind || "client", clientName: m.clientName || null },
      createdAt: new Date(Date.now() - 60000).toISOString(),
      expiresAt: null,
      asOfSeq: 4000,
      evidence: [],
      reasonRequired: { approve: false, reject: kind === "checkpoint" },
      rejectable: kind === "checkpoint",
      unlocks: null,
      previous: null,
    });
    const view = (d) => Object.assign(toView(d, EVIDENCE.details), { due: true });
    Object.keys(all).forEach((mid) => {
      const L = all[mid] || {};
      const m = mOf(mid);
      const cur = readyCheckpoint(mid, L, qDone || !!L.answered);
      const keys = cur ? [cur.key] : [];
      // keep decided ones so Decided today can show them
      if (includeDone)
        ["0.2", "0.3", "0.4", "final"].forEach((k) => {
          const r = k === "final" ? "plan_finalize:" + mid : "checkpoint:" + mid + "-" + k.replace(".", "");
          if ((dec[r] || {}).state === "decided" && !keys.includes(k)) keys.push(k);
        });
      keys.forEach((k) => {
        if (k === "final") {
          out.push(
            view(
              Object.assign(baseOf(m, "plan_finalize:" + mid, "plan_finalize"), {
                plain: {
                  title: "Approve the plan for " + m.name,
                  why: "The plan splits the work into 5 parts, each with its own tests.",
                  ifYouApprove: "Building starts, and the deadline clock starts.",
                  ifYouReject: null,
                  returned: null,
                },
                evidence: [
                  { label: "Checkpoints", value: "All four are approved" },
                  { label: "Pinned", value: "Plan version 1, factory version b7d2e11, roster version 7" },
                ],
                target: { missionId: mid, planId: mid.slice(0, 30) + "000006", planVersion: 1 },
              }),
            ),
          );
          return;
        }
        if (!NAME[k]) return;
        // Option 1 (CR-W28): a clean 0.2 says so up front, so approving it is one tap with nothing to read
        const cl = k === "0.2" && k === (cur && cur.key) ? cleanSummary(cur, L) : null;
        const clean = cl && cl.clean ? cl : null;
        out.push(
          view(
            Object.assign(baseOf(m, "checkpoint:" + mid + "-" + k.replace(".", ""), "checkpoint"), {
              unlocks: NEXT[k],
              _clean: clean ? { href: "#/missions/" + mid + "/onboarding" } : null,
              plain: {
                title: clean ? NAME[k] + " for " + m.name + " is clean" : "Approve " + NAME[k] + " for " + m.name,
                why: clean
                  ? "The code checks and Brennan\u2019s review pass and no question is open. Nothing here needs a closer look."
                  : "Canon has drafted this part of the scope from what you and the client said.",
                ifYouApprove: "It\u2019s locked in, and Canon moves on to " + NEXT[k] + ".",
                ifYouReject: "Canon revises it with your note.",
                returned: null,
              },
              evidence: clean
                ? [
                    { label: "Code checks", value: clean.checks },
                    { label: "Brennan\u2019s review", value: clean.review.replace(/^[^:]+: /, "") },
                    { label: "Questions", value: "None open; you answered Q-0.2" },
                    { label: "Plan", value: clean.plan },
                  ]
                : (EVID[k] || []).map(([label, value]) => ({ label, value })),
              target: {
                checkpointId: mid.slice(0, 30) + "00000" + k.replace(".", ""),
                checkpoint: k,
                version: 1,
                rowVersion: 1,
              },
            }),
          ),
        );
      });
    });
    // a release comes due once its pass is approved (or straight away for a verified receipt)
    const items = (this.state.world && this.state.world.decisions && this.state.world.decisions.items) || [];
    items
      .filter(
        (d) => d.kind === "pass_approval" && (dec[d.ref] || {}).state === "decided" && dec[d.ref].effect === "approve",
      )
      .forEach((pa) => {
        const m = mOf(pa.missionId);
        const r = "release:" + m.id;
        if (!includeDone && (dec[r] || {}).state === "decided") return;
        out.push(
          view(
            Object.assign(baseOf(m, r, "release"), {
              owner: "delivery",
              plain: {
                title: "Release " + m.name,
                why: "It passed, with the limits you accepted.",
                ifYouApprove: "The client gets that exact version, as a pull request.",
                ifYouReject: null,
                returned: null,
              },
              evidence: [
                {
                  label: "Pass",
                  value: "Approved by you " + (dec[pa.ref].reason ? "\u201c" + dec[pa.ref].reason + "\u201d" : ""),
                },
                { label: "Commit", value: "a41e9c2, the one the receipt names" },
              ],
              target: {
                missionId: m.id,
                receiptId: pa.target.receiptId,
                receiptHash: pa.target.receiptHash,
                verdict: "pass",
                passApprovalId: pa.missionId.slice(0, 30) + "00a1a1",
                commitSha: "a41e9c2" + "0".repeat(33),
                deliveryKind: "pr",
              },
            }),
          ),
        );
      });
    return out;
  }

  icon(name, size, style) {
    const nodes = (this.state.icons || {})[name] || [];
    return React.createElement(
      "svg",
      {
        "data-ui": "Icon",
        "data-icon": name,
        width: size || 16,
        height: size || 16,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.5,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
        className: "lucide",
        style: Object.assign({ flex: "none", display: "block" }, style),
      },
      nodes.map(([t, a], i) => React.createElement(t, Object.assign({ key: i }, a))),
    );
  }
  glyph(st, n) {
    n = n || 12;
    const h = React.createElement,
      a = n / 2;
    const svg = (kids, vb) =>
      h(
        "svg",
        {
          "data-ui": "StatusGlyph",
          width: n,
          height: n,
          viewBox: vb || "0 0 " + n + " " + n,
          "aria-hidden": true,
          style: { flex: "none", display: "block" },
        },
        kids,
      );
    if (st === "stopped")
      return svg(
        h("rect", { x: n * 0.1, y: n * 0.1, width: n * 0.8, height: n * 0.8, rx: n * 0.12, fill: "var(--av-stopped)" }),
      );
    if (st === "needs")
      return svg(
        h("path", {
          d: "M" + a + " " + n * 0.08 + " L" + n * 0.95 + " " + n * 0.88 + " L" + n * 0.05 + " " + n * 0.88 + " Z",
          fill: "var(--av-needs)",
          stroke: "var(--av-ink)",
          strokeWidth: Math.max(1, n / 11),
          strokeLinejoin: "round",
        }),
      );
    if (st === "headsup")
      return svg([
        h("circle", {
          key: 1,
          cx: a,
          cy: a,
          r: a * 0.6,
          fill: "none",
          stroke: "var(--av-needs)",
          strokeWidth: n * 0.2,
        }),
        h("circle", {
          key: 2,
          cx: a,
          cy: a,
          r: a - 0.6,
          fill: "none",
          stroke: "var(--av-ink)",
          strokeOpacity: 0.5,
          strokeWidth: 1,
        }),
      ]);
    if (st === "verified")
      return svg(
        h("path", {
          d: "M2.2 6.4 L4.9 9 L9.9 3.3",
          fill: "none",
          stroke: "var(--av-verified)",
          strokeWidth: 2,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }),
        "0 0 12 12",
      );
    if (st === "running") return svg(h("circle", { cx: a, cy: a, r: n * 0.3, fill: "var(--av-ink)" }));
    return svg(h("circle", { cx: a, cy: a, r: n * 0.34, fill: "none", stroke: "var(--av-muted)", strokeWidth: 1.4 }));
  }
  missionIcon(m) {
    return m.state === "onboarding"
      ? "message-circle"
      : m.state === "draft"
        ? "circle-dashed"
        : m.state === "awaiting_release"
          ? "package-check"
          : m.state === "delivered" || m.state === "closed"
            ? "circle-check"
            : "list-checks";
  }
  missionHref(m) {
    return "#/missions/" + m.id + (NO_TREE.includes(m.state) ? "/onboarding" : "");
  }
  go(href) {
    if (href) location.hash = href.replace(/^#/, "");
  }
  /** tone: "success" (a check), "info" (nothing went wrong, nothing happened yet), "warning", "failure" */
  toast(text, tone) {
    clearTimeout(this.toastT);
    this.setState({ toast: text, toastTone: tone || "success" });
    this.toastT = setTimeout(() => this.setState({ toast: null }), tone === "failure" ? 6000 : 3200);
  }
  /**
   * B4: start Canon's interview for a draft project. The real app's first postMessage (route 34) moves the
   * mission from draft to onboarding; the mock does the same and opens the Scope page on Canon's opener.
   */
  startInterview(id) {
    const w = this.state.world;
    const m = w && w.missions.items.find((x) => x.id === id);
    if (!m) return;
    if (!ON[id]) ON[id] = freshOnboarding(m);
    // a project with no client yet gets Canon's first question, Q-0.1a (and Q-0.1b behind it), in the queue
    const qs = m.kind || w.decisions.items.some((d) => d.missionId === id) ? [] : freshQuestions(m).map((d) => toView(d, EVIDENCE.details));
    const items = w.missions.items.map((x) =>
      x.id === id
        ? Object.assign({}, x, {
            state: "onboarding",
            displayState: "blocked_on_you",
            onboardingStep: 1,
            gateStrip: ["running", "pending", "pending", "pending", "pending", "pending"],
            updatedAt: new Date().toISOString(),
          })
        : x,
    );
    this.setState({
      world: Object.assign({}, w, {
        missions: Object.assign({}, w.missions, { items }),
        decisions: Object.assign({}, w.decisions, { items: w.decisions.items.concat(qs) }),
      }),
    });
    this.go("#/missions/" + id + "/onboarding");
  }
  /** B4: route 20 in the mock: a draft mission with a name (and the client carried over, if any). */
  createMission(name, client) {
    const w = this.state.world;
    if (!w) return null;
    const hex = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, "0");
    const id = "01a1" + hex() + "-" + hex() + "-7" + hex().slice(1) + "-8" + hex().slice(1) + "-" + hex() + hex() + hex();
    const at = new Date().toISOString();
    const m = {
      id,
      clientId: client ? client.id : null,
      state: "draft",
      displayState: "draft",
      packageKey: null,
      budgetMicros: 150000000,
      reservedMicros: 0,
      spentMicros: 0,
      createdAt: at,
      updatedAt: at,
      name,
      clientName: client ? client.name : null,
      needsYouCount: 0,
      onboardingStep: 1,
      gateStrip: ["pending", "pending", "pending", "pending", "pending", "pending"],
      kind: client ? "client" : null,
      deadline: { dueAt: null, startedAt: null, paused: false, pausedSince: null, pausedFor: null, atRisk: false },
      clientMain: { pinnedCommit: null, latestCommit: null, moved: false },
      modules: { total: 0, landed: 0, running: 0, parked: 0 },
      runningDispatches: 0,
      lastEventAt: at,
    };
    this.setState({
      world: Object.assign({}, w, { missions: Object.assign({}, w.missions, { items: w.missions.items.concat(m) }) }),
    });
    return id;
  }
  later(label) {
    this.toast(label + ": designed in the next pass", "info");
  }
  setPageState(id, st, extra) {
    this.set(Object.assign({ pageStates: Object.assign({}, this.state.pageStates, { [id]: st }) }, extra || {}));
  }

  /** Any event on the stream resets the stall check. */
  sawEvent() {
    this.lastEventAt = Date.now();
    sawLiveEvent();
    if (this.state.stream === "stalled") this.setState({ stream: "live" });
  }
  setDec(ref, patch) {
    this.lastEventAt = Date.now();
    sawLiveEvent();
    this.setState((s) => ({ dec: Object.assign({}, s.dec, { [ref]: Object.assign({}, s.dec[ref] || {}, patch) }) }));
  }
  reasonFor(d) {
    const x = this.state.dec[d.ref] || {};
    // OSA's reasonDraft is offered as "Use OSA's reason", never filled in for you (CR-29: OSA prepares, you decide)
    return x.reason != null ? x.reason : "";
  }
  /** Whether this answer needs a reason: reasonRequired { approve, reject } from the item itself. */
  needsReason(d, key) {
    const o = d.options.find((y) => y.key === key) || d.options[0];
    // CR-W26: a reason is asked for only where someone needs the information. On a proposal that's
    // when you go against what the agent recommends (it learns why); taking the recommendation is
    // one tap. Elsewhere the item's own reasonRequired decides: a pass approval and a checkpoint's
    // "request changes" still ask why, because the release record and Canon need it.
    if (d.kind === "proposal") return d.options.some((y) => y.recommended) ? !(o && o.recommended) : false;
    return !!(d.reasonRequired && d.reasonRequired[o && o.effect === "reject" ? "reject" : "approve"]);
  }
  /**
   * Decide one item. `key` is the option you tapped ("approve", a choice or option id, or "other").
   * The call comes from the contract's approveCallFor, or the kind's own "no" route; the web holds it
   * for 6 seconds so Undo never needs the server to reverse anything (CR-W15).
   */
  decide(d, key, answerText) {
    const x = this.state.dec[d.ref] || {};
    if (x.sim || x.state === "deciding" || x.refetching) return;
    const o =
      key === "other" ? { key: "other", label: answerText, effect: "approve" } : d.options.find((y) => y.key === key);
    if (!o) return;
    const reason = this.reasonFor(d);
    if (this.needsReason(d, key) && (!reason || !reason.trim())) return;
    const tap = { choice: o.key === "approve" || o.key === "reject" ? undefined : o.key, reason: reason || undefined };
    if (key === "other") Object.assign(tap, { choice: "other", answer: answerText });
    const call = o.effect === "reject" ? rejectCallFor(d.dto, tap) : approveCallFor(d.dto, tap);
    const ask = d.kind === "checkpoint_question";
    this.setDec(d.ref, { state: "deciding" });
    setTimeout(() => {
      this.setDec(d.ref, {
        state: "decided",
        choice: o.key,
        effect: o.effect,
        answer: ask ? o.label : undefined,
        label: o.label,
        reason: ask ? null : reason || null,
        call: describeCall(call),
        at: Date.now(),
      });
      if (d.kind === "checkpoint" && o.effect === "approve") {
        const cur = (this.state.canon || {})[d.missionId] || {};
        const k = d.checkpoint;
        const patch = {
          approved: (cur.approved || []).concat(k),
          approvedAt: Object.assign({}, cur.approvedAt, { [k]: Date.now() }),
        };
        this.setState({ canon: Object.assign({}, this.state.canon, { [d.missionId]: Object.assign({}, cur, patch) }) });
      }
      if (d.kind === "plan_finalize") {
        const cur = (this.state.canon || {})[d.missionId] || {};
        const patch = { finalized: { at: new Date().toISOString() } };
        this.setState({ canon: Object.assign({}, this.state.canon, { [d.missionId]: Object.assign({}, cur, patch) }) });
      }
      if (d.kind === "release") {
        const at = new Date().toISOString();
        this.setState({ released: Object.assign({}, this.state.released, { [d.missionId]: { at } }) });
        setTimeout(() => {
          const cur = this.state.released || {};
          this.setState({ released: Object.assign({}, cur, { [d.missionId]: { at, opened: true } }) });
        }, 1400);
      }
      if (this.state.openDec === undefined || this.state.openDec === d.ref) this.setState({ openDec: undefined });
      const tag = d.code || d.kindLabel;
      this.setState({
        snack: {
          ref: d.ref,
          text: ask
            ? "Answered " + tag + ": " + o.label + ". Canon continues."
            : o.label + " \u00b7 " + d.title + (reason ? ". Reason: \u201c" + reason + "\u201d" : ""),
          left: 6,
        },
      });
    }, 450);
  }
  undo(ref) {
    const d = ((this.state.world && this.state.world.decisions && this.state.world.decisions.items) || [])
      .concat(this.checkpointDecs(true))
      .find((x) => x.ref === ref);
    this.setDec(ref, { state: "open", choice: null, effect: null, call: null });
    if (d && d.kind === "release")
      this.setState({ released: Object.assign({}, this.state.released, { [d.missionId]: null }) });
    this.setState({ snack: null });
    this.toast("Undone. Nothing was sent; " + (d ? d.code || "it" : "it") + " is waiting again.");
  }
  /**
   * The Simulator's "One of every kind": route 52 answered by @avel/contract-mock's ten decisions
   * (contract-mock-decisions.json), one of each kind, including one that came back.
   */
  everyKind(on) {
    const src = on ? EVERY_KIND : PENDING;
    this.setState({
      everyKind: on || undefined,
      dec: {},
      snack: null,
      openDec: undefined,
      world: Object.assign({}, this.state.world, {
        decisions: { items: src.items.map((d) => toView(d, EVIDENCE.details)), nextCursor: null },
      }),
    });
  }
  simFirst(kind) {
    const c = this.ctx();
    const first = c.w && c.w.decs && this.sortDecs(c.w.decs)[0];
    if (!first) return;
    if (kind === "newer") {
      // an event newer than the row's asOfSeq: refetch the item before it can be decided
      this.setDec(first.ref, { refetching: true });
      setTimeout(() => {
        this.setDec(first.ref, { refetching: false, asOf: (first.asOfSeq || 0) + 1 });
        this.toast(
          "Refreshed to event " + ((first.asOfSeq || 0) + 1) + ". Nothing changed that needs you to look again.",
        );
      }, 900);
      return;
    }
    this.setDec(first.ref, { sim: kind });
    if (kind === "elsewhere" || kind === "expired")
      setTimeout(() => this.setDec(first.ref, { sim: null, state: "removed" }), 4000);
  }
  /** Route 52's order: items that came back first (CR-W15), then soonest to expire, then oldest. */
  sortDecs(list) {
    const exp = (d) => (d.expiresAt ? Date.parse(d.expiresAt) : Infinity);
    return list
      .slice()
      .sort(
        (a, b) =>
          (b.returned ? 1 : 0) - (a.returned ? 1 : 0) ||
          exp(a) - exp(b) ||
          Date.parse(a.createdAt) - Date.parse(b.createdAt),
      );
  }
  /** CR-29, behind the osa flag: OSA's brief for this item, or null. */
  briefFor(d) {
    if (!this.state.osa || !d) return null;
    return (OSA.briefs || {})[d.ref] || null;
  }
  /**
   * CR-29, behind the osa flag (proposed: contract 1.1.0 doesn't exist; see contract/cr-29-assumed.json).
   * Ask OSA goes through the server as an assistant task (POST /api/assistant/tasks), never to a local
   * port; OSA's progress arrives as cli.assistant_task.changed. Follow OSA is off by default (decision 3).
   */
  osaVals(c) {
    const s = this.state;
    if (!s.osa) return null;
    const O = s.osaUi || {};
    const setO = (p) => this.setState({ osaUi: Object.assign({}, this.state.osaUi, p) });
    const I = (n, z) => this.icon(n, z);
    const st = OSA.status;
    const paused = !!O.paused;
    const attached = !paused && st.terminal.attached && !O.termOff;
    // what you're on: the subject a task gets, and your side of the shared focus (PUT /api/operator/focus)
    const d = c.id === "decisions" && c.r.ref && c.w ? c.w.decs.find((x) => x.ref === c.r.ref) : null;
    const m = c.mission;
    const def = PAGES[c.id] || {};
    const subject = d
      ? { kind: d.kind, ref: d.ref, label: d.title }
      : m
        ? {
            kind: c.id === "module" ? "module" : "mission",
            ref: "mission:" + m.id,
            label: m.name + (c.id === "module" && c.r.moduleRef ? ", " + c.r.moduleRef : ""),
          }
        : { kind: "page", ref: null, label: def.label || def.title || "This page" };
    const TASK_STATE = {
      queued: ["pending", "Queued"],
      working: ["accent", "Working"],
      done: ["verified", "Done"],
      failed: ["stopped", "Failed"],
    };
    const tasks = (O.tasks || []).concat(OSA.tasks.items).map((t) => {
      const [tone, label] = TASK_STATE[t.state] || ["pending", t.state];
      return {
        key: t.id,
        about: t.subject.label,
        request: t.request,
        state: label,
        tone,
        result: t.result,
        links: (t.links || []).map((h) => ({ key: h, href: "#" + h, label: "Open" })),
        when: fmtDate(t.updatedAt) + ", " + fmtClock(t.updatedAt),
      };
    });
    const focus = OSA.focus;
    const focusHref = focus.ref ? "#/decisions/" + encodeURIComponent(focus.ref) : null;
    const follow = !!O.follow;
    return {
      on: "true",
      paused: paused ? "true" : undefined,
      sessionLabel: paused ? "Paused" : "Working in your terminal",
      // shared focus: OSA's side, and Follow OSA (off by default)
      osaOn: focus.label,
      osaOnHref: focusHref,
      follow: follow ? "true" : "false",
      toggleFollow: () => {
        setO({ follow: !follow });
        if (!follow && focusHref) this.go(focusHref);
      },
      mine: subject.label,
      // the task box
      askOpen: O.ask ? "true" : undefined,
      toggleAsk: () => setO({ ask: !O.ask, text: O.ask ? "" : O.text || "" }),
      text: O.text || "",
      onText: (e) => setO({ text: e.target.value }),
      about: subject.label,
      send: (e) => {
        if (e) e.preventDefault();
        const text = (O.text || "").trim();
        if (!text || paused) return;
        const at = new Date().toISOString();
        const id = "01a1d800-0000-7000-8000-1" + String(Date.now()).slice(-11);
        const t = {
          id,
          subject,
          request: text,
          state: "queued",
          result: null,
          links: [],
          createdAt: at,
          updatedAt: at,
        };
        setO({ text: "", ask: false, tasksOpen: true, tasks: [t].concat(O.tasks || []) });
        this.toast("Sent to OSA: POST /api/assistant/tasks");
        // OSA picks it up from cli.assistant_task.created and reports back with cli.assistant_task.changed
        clearTimeout(this.osaT);
        this.osaT = setTimeout(() => {
          sawLiveEvent();
          const cur = this.state.osaUi || {};
          this.setState({
            osaUi: Object.assign({}, cur, {
              tasks: (cur.tasks || []).map((x) =>
                x.id === id ? Object.assign({}, x, { state: "working", updatedAt: new Date().toISOString() }) : x,
              ),
            }),
          });
        }, 1800);
      },
      // the task list stays folded to one line, so the page's own work comes first (Decisions on a phone)
      tasksOpen: O.tasksOpen ? "true" : undefined,
      tasksSummary:
        tasks.length +
        (tasks.length === 1 ? " task" : " tasks") +
        ": " +
        ["Working", "Queued", "Done", "Failed"]
          .map((l) => [l, tasks.filter((t) => t.state === l).length])
          .filter(([, n]) => n)
          .map(([l, n]) => n + " " + l.toLowerCase())
          .join(", "),
      toggleTasks: () => setO({ tasksOpen: !O.tasksOpen }),
      tasks: O.tasksOpen ? tasks.slice(0, O.all ? 20 : 3) : [],
      moreTasks: O.tasksOpen && tasks.length > 3 && !O.all ? "See all " + tasks.length + " tasks" : null,
      showAll: () => setO({ all: true }),
      // the terminal-attached view (Appendix C): the terminal shows what's happening now
      attached: attached ? "true" : undefined,
      attachedNote:
        attached && ["live", "watch", "module", "rack"].includes(c.id)
          ? "Your terminal is attached, so the live feed is there: run avel tail. This page keeps decisions, gates and proof."
          : null,
      robot: I("bot", 16),
      sendIcon: I("send", 14),
    };
  }
  /** Settings, behind the osa flag: the assistant session, pause, and spend against its cap (no dollars). */
  osaSettings() {
    const s = this.state;
    if (!s.osa) return null;
    const O = s.osaUi || {};
    const a = OSA.status.assistant;
    const paused = !!O.paused;
    const share = a.spendCap ? Math.round((a.spendUsed / a.spendCap) * 100) : null;
    return {
      session: paused ? "Paused. Resuming needs a fresh login." : "Signed in as assistant",
      paused: paused ? "true" : undefined,
      lastSeen:
        "Terminal last seen " +
        fmtDate(OSA.status.terminal.lastSeenAt) +
        ", " +
        fmtClock(OSA.status.terminal.lastSeenAt),
      pause: () => {
        this.setState({ osaUi: Object.assign({}, O, { paused: true }) });
        this.toast("OSA paused: DELETE /api/cli/sessions/{sessionId} (route 5) revoked its session");
      },
      resumeHelp: "Run avel login --as assistant in your terminal, then approve it here.",
      spend: share == null ? "No cap set" : share + "% of its monthly cap used",
      spendShare: share,
      spendHigh: share != null && share >= 80 ? "true" : undefined,
      spendNote: "OSA\u2019s model use is AVEL\u2019s own cost. It never touches a mission\u2019s budget.",
    };
  }
  /** CR-29 shared focus: what you're looking at is the CLI's focus too (PUT /api/operator/focus). */
  setFocus(f) {
    const cur = this.state.focus;
    if (cur && cur.ref === f.ref) return;
    this.setState({ focus: Object.assign({ at: new Date().toISOString() }, f) });
  }
  openPal = () => {
    this.palReturn = document.activeElement;
    this.setState({ pal: { q: "", active: 0 }, keysOpen: false });
  };
  closePal = () => {
    this.setState({ pal: null, keysOpen: false });
    const el = this.palReturn;
    this.palReturn = null;
    if (el && el.focus && document.contains(el)) setTimeout(() => el.focus(), 0);
  };
  onKey = (e) => {
    const k = (e.key || "").toLowerCase(),
      mod = e.metaKey || e.ctrlKey;
    const typing = e.target && (/^(input|textarea|select)$/i.test(e.target.tagName) || e.target.isContentEditable);
    if (mod && k === "k") {
      e.preventDefault();
      if (this.state.pal) this.closePal();
      else this.openPal();
      return;
    }
    if (this.state.pal || this.state.keysOpen) {
      if (k === "escape") this.closePal();
      return;
    }
    if (!mod && !typing && !e.altKey) {
      if (e.key === "?") {
        e.preventDefault();
        this.palReturn = document.activeElement;
        this.setState({ keysOpen: true });
        return;
      }
      if (this.gAt && Date.now() - this.gAt < 1200) {
        this.gAt = 0;
        const hit = CHORDS.find((x) => x[0] === k);
        if (hit) {
          e.preventDefault();
          this.go(hit[2]);
          return;
        }
      }
      if (k === "g") {
        this.gAt = Date.now();
        return;
      }
    }
    if (!mod && !typing && ["j", "k", "a", "r"].includes(k) && this.ctx().id === "decisions") {
      const cards = Array.from(document.querySelectorAll(".cr-dq-row"));
      if (!cards.length) return;
      const i = cards.findIndex((el) => el === document.activeElement);
      if (k === "j" || k === "k") {
        e.preventDefault();
        const n = k === "j" ? Math.min(cards.length - 1, i + 1) : Math.max(0, i < 0 ? 0 : i - 1);
        cards[n].focus();
        return;
      }
      const c = this.ctx();
      const d = c.w.decs.find((x) => x.ref === this.state.focusRef);
      if (d && i >= 0) {
        e.preventDefault();
        this.decide(d, k === "a" ? "approve" : "reject");
      }
      return;
    }
    if (mod && k === "b") {
      e.preventDefault();
      this.toggleRail();
    } else if (k === "escape") {
      const s = this.state;
      if (s.vp) this.setState({ vp: null });
      else if (s.sheet) this.setState({ sheet: false });
      else if (s.acct) this.setState({ acct: false });
    }
  };
  palVals(c) {
    const P = this.state.pal;
    if (!this.palCache || this.palCache.w !== c.w) this.palCache = { w: c.w, items: paletteItems(this, c, PAGES) };
    const groups = paletteResults(this.palCache.items, P.q);
    const flat = groups.flatMap((g) => g.rows);
    const active = Math.min(P.active, Math.max(0, flat.length - 1));
    const set = (patch) => this.setState({ pal: Object.assign({}, this.state.pal, patch) });
    return {
      q: P.q,
      groups,
      active,
      activeId: flat.length ? "cmdk-o-" + active : null,
      I: (n, z) => this.icon(n, z),
      setQ: (q) => set({ q, active: 0 }),
      move: (d) => set({ active: flat.length ? (active + d + flat.length) % flat.length : 0 }),
      hover: (i) => set({ active: i }),
      close: this.closePal,
      run: (i) => {
        const x = flat[i == null ? active : i];
        if (!x) return;
        this.palReturn = null;
        this.setState({ pal: null });
        if (x.href) this.go(x.href);
      },
    };
  }
  toggleRail = () => this.set({ collapsed: !this.state.collapsed, tip: null });
  onRailOver = (e) => {
    if (!this.state.collapsed) return;
    const el = e.target && e.target.closest && e.target.closest("[data-tip]");
    if (!el || !el.closest(".lib-aside")) {
      if (this.state.tip) this.setState({ tip: null });
      return;
    }
    const r = el.getBoundingClientRect();
    const tip = {
      text: el.getAttribute("data-tip"),
      top: Math.round(r.top + r.height / 2),
      left: Math.round(r.right + 10),
    };
    const t = this.state.tip;
    if (!t || t.text !== tip.text || t.top !== tip.top) this.setState({ tip });
  };
  hideTip = () => {
    if (this.state.tip) this.setState({ tip: null });
  };
  onNavClick = (e) => {
    if (e.target.closest && e.target.closest("a") && this.state.sheet) this.setState({ sheet: false });
  };
  onCanvasScroll = (e) => {
    const el = e.currentTarget,
      max = el.scrollHeight - el.clientHeight;
    if (this.progressRef.current)
      this.progressRef.current.style.transform = "scaleX(" + (max > 0 ? el.scrollTop / max : 0) + ")";
    const top = this.topbarRef.current,
      mast = el.querySelector(".cr-mast"),
      h1 = mast ? null : el.querySelector("h1:not(.sr-only)");
    // the bar scrolls away with the page now (desk.css), so it never condenses
    if (top && (mast || h1) && getComputedStyle(top).position === "sticky") {
      const flush = top.hasAttribute("data-flush");
      const on = flush
        ? el.scrollTop > 28 // the title sits in the bar's row; once it leaves, the bar shows it small
        : mast
          ? el.scrollTop > mast.offsetHeight - top.offsetHeight - 8
          : h1.getBoundingClientRect().bottom < top.getBoundingClientRect().bottom;
      if (on !== top.hasAttribute("data-condensed")) {
        if (on) top.setAttribute("data-condensed", "");
        else top.removeAttribute("data-condensed");
      }
    }
  };

  navGroups(c) {
    const s = this.state;
    return NAV.map((g) => {
      const items = (g.items || []).map((id) => {
        const p = PAGES[id],
          label = NAV_LABEL[id] || p.label;
        const cur =
          c.id === id ||
          (id === "templates" && (c.id === "template" || c.id === "templateNew")) ||
          (id === "library" && c.id === "knowledge");
        const badge =
          id === "decisions" && c.w && c.w.waiting ? (c.w.waiting > 50 ? "50+" : String(c.w.waiting)) : null;
        return {
          key: id,
          label,
          href: "#" + p.href,
          size: g.small ? "sm" : undefined,
          iconEl: this.icon(p.icon, g.small ? 14 : 16),
          current: cur ? "page" : undefined,
          tip: label + (badge ? "  " + badge : ""),
          badge,
          badgeLabel: badge ? badge + " waiting on you" : undefined,
          gap: badge ? "CR-W5" : undefined,
          // Live shows the factory's activity bars while rooms are running
          live:
            id === "live" && s.world && s.world.status && s.world.status.slots && s.world.status.slots.busy && !s.fresh
              ? "true"
              : undefined,
        };
      });
      let loading = false,
        empty = false;
      if (g.projects) {
        if (!c.w) loading = true;
        else {
          const open = c.w.missions.filter((m) => !HIDDEN.includes(m.state));
          empty = !open.length;
          open.forEach((m) => items.push(this.missionRow(m, c)));
        }
      }
      return {
        key: g.key,
        label: g.label,
        isProjects: !!g.projects,
        allCurrent: g.projects && c.id === "projects" ? "page" : undefined,
        items,
        loading,
        empty,
      };
    });
  }
  measureRo() {
    const host = document.querySelector(".ro-lanes"),
      want = this.roWant || [];
    if (!host || !want.length) {
      if (this.state.roEdges) this.setState({ roEdges: null });
      return;
    }
    const hb = host.getBoundingClientRect(),
      rect = (n) => {
        const el = host.querySelector('[data-agent="' + n + '"]');
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return {
          l: Math.round(b.left - hb.left),
          r: Math.round(b.right - hb.left),
          y: Math.round(b.top - hb.top + b.height / 2),
        };
      };
    const out = want
      .map((e) => {
        const a = rect(e.from),
          b = rect(e.to);
        if (!a || !b) return null;
        let d;
        if (Math.abs(a.l - b.l) < 8)
          d =
            "M" +
            a.r +
            " " +
            a.y +
            " C" +
            (a.r + 24) +
            " " +
            a.y +
            " " +
            (a.r + 24) +
            " " +
            b.y +
            " " +
            a.r +
            " " +
            b.y;
        else if (b.l > a.l) {
          const k = Math.max(16, Math.round((b.l - a.r) / 2));
          d =
            "M" + a.r + " " + a.y + " C" + (a.r + k) + " " + a.y + " " + (b.l - k) + " " + b.y + " " + b.l + " " + b.y;
        } else {
          const k = Math.max(16, Math.round((a.l - b.r) / 2));
          d =
            "M" + a.l + " " + a.y + " C" + (a.l - k) + " " + a.y + " " + (b.r + k) + " " + b.y + " " + b.r + " " + b.y;
        }
        return e.kind + "|" + d;
      })
      .filter(Boolean)
      .join(";");
    if (out !== (this.state.roEdges || "")) this.setState({ roEdges: out || null });
  }
  missionDot(m, c) {
    const i = c.w ? c.w.missions.findIndex((x) => x.id === m.id) : 0;
    return DOTS[Math.max(0, i) % DOTS.length];
  }
  missionRow(m, c) {
    const here = !!c.mission && c.mission.id === m.id,
      tree = !NO_TREE.includes(m.state);
    // a question from Canon waits on you as much as a build decision does
    const badge = m.needsYouCount ? String(m.needsYouCount) : null;
    void tree;
    // the phase in a word: no checkpoint numbers in the sidebar
    const meta =
      m.state === "onboarding"
        ? "Scoping"
        : m.state === "draft"
          ? "Draft"
          : m.state === "delivered"
            ? "Delivered"
            : null;
    return {
      key: m.id,
      label: m.name,
      href: this.missionHref(m),
      iconEl: null,
      dot: this.missionDot(m, c),
      pulse: PULSE.includes(m.state) ? "true" : undefined,
      current: here ? "page" : undefined,
      badge,
      badgeLabel: badge ? badge + " waiting on you" : undefined,
      meta,
      tip: m.name + (meta ? "\n" + meta : badge ? "  " + badge : ""),
    };
  }
  templateName(c) {
    const t = templatesVals(this, c).one;
    return t ? t.name : "Template";
  }
  crumbs(c, title) {
    const L = (label, href, gap) => ({ label, href, gap });
    let list;
    if (c.id === "notFound") list = [L("Not found")];
    else if (c.r.missionId) {
      const m = c.mission;
      // Projects › the project › its tab › (a module, the receipt): the same path the tabs show
      list = [L("Projects", "#/missions"), L(m ? m.name : "\u2026", m ? "#/missions/" + m.id : "#/missions", "CR-20")];
      const tabId = c.id === "module" || c.id === "watch" ? "progress" : c.id === "receipt" ? "release" : c.id;
      const tab = PROJECT_PAGES.find((p) => p[0] === tabId);
      if (tab && m) list.push(L(tab[1], "#/missions/" + m.id + tab[2]));
      else if (!tab) list.push(L(PAGES[c.id].label));
      if (c.id === "module") list.push(L(c.r.moduleRef || "Module"));
      else if (c.id === "receipt") list.push(L("Receipt"));
      else if (c.id === "watch") list.push(L("Watch the work"));
    } else if (c.id === "newProject") list = [L("Projects", "#/missions"), L("New project")];
    else if (c.id === "projects") list = [L("Projects")];
    else if (c.id === "library" && (c.r.item || c.r.cat || c.r.all)) {
      // the top bar is the Library's one breadcrumb: Factory › Library › category › entry
      const kv = libraryVals(this, c);
      list = [L("Library", "#/library")];
      const cc = kv.doc && kv.doc.crumbs[1];
      if (cc) list.push(L(cc.label, cc.href));
      list.push(L(kv.title));
    } else if (c.id === "library") list = [L("Library")];
    else if (c.id === "templates") list = [L("Templates")];
    else if (c.id === "template") list = [L("Templates", "#/templates"), L(this.templateName(c))];
    else if (c.id === "templateNew") list = [L("Templates", "#/templates"), L("New template")];
    else if (c.id === "clients" && c.r.clientId) {
      const cl = ((s0) => ((s0.world && s0.world.clients && s0.world.clients.items) || []).find((x) => x.id === c.r.clientId))(this.state);
      list = [L("Clients", "#/clients"), L(cl ? cl.name : "Client")];
    }
    else if (c.id === "file") {
      // a file's page sits under where it lives: a client's files, a project's files, or Drive
      const st0 = this.state;
      const f = st0.up.files[c.r.fileId] || st0.up.items.find((x) => x.id === c.r.fileId);
      const o = (f && f.owner) || {};
      const W0 = st0.world || { clients: { items: [] }, missions: { items: [] } };
      const cl = o.clientId && W0.clients.items.find((x) => x.id === o.clientId);
      const ms = o.missionId && W0.missions.items.find((x) => x.id === o.missionId);
      list = cl
        ? [L("Clients", "#/clients"), L(cl.name, "#/clients/" + cl.id), L("Files", "#/clients/" + cl.id + "/files")]
        : ms
          ? [L("Projects", "#/missions"), L(ms.name, "#/missions/" + ms.id), L("Files", "#/missions/" + ms.id + "/files")]
          : [L("Drive", "#/drive")];
      list.push(L(f ? f.name : "File"));
    } else if (c.id === "uploadStates") list = [L("Drive", "#/drive"), L("Upload states")];
    else if (c.id === "roster" && c.r.agent) {
      const ag = ((this.state.world && this.state.world.roster && this.state.world.roster.agents) || []).find((x) => x.name.toLowerCase() === c.r.agent);
      list = [L("Agents", "#/roster"), L(ag ? ag.name : "Agent")];
    }
    else if (FACTORY_IDS.includes(c.id)) list = [L(FACTORY_TABS.find((t) => t[0] === c.id)[1])];
    else list = [L(PAGES[c.id].label)];
    return list.map((x, i) => {
      const last = i === list.length - 1;
      return {
        key: i,
        label: x.label,
        href: last ? undefined : x.href,
        gap: x.gap,
        sep: i > 0,
        link: !last,
        isLast: last,
      };
    });
  }

  renderVals() {
    const s = this.state,
      c = this.ctx(),
      I = (n, z) => this.icon(n, z);
    const def = PAGES[c.id] || PAGES.notFound,
      m = c.mission;
    const kind = LIB_KINDS.find((k) => k[0] === c.r.kind) || LIB_KINDS[0];
    const subject = m ? m.name : "the factory",
      mstate = m ? (STATE_LABEL[m.displayState] || m.displayState).toLowerCase() : "paused";
    const fill = (t) =>
      typeof t !== "string"
        ? t
        : t
            .replace(/\{mission\}/g, m ? m.name : "\u2026")
            .replace(/\{client\}/g, m ? m.forLabel || "Not set yet" : "\u2026")
            .replace(/\{state\}/g, m ? STATE_LABEL[m.displayState] || m.displayState : "\u2026")
            .replace(/\{base\}/g, m ? "#/missions/" + m.id : "#/missions")
            .replace(/\{kind\}/g, kind[1].toLowerCase())
            .replace(/\{kindOne\}/g, kind[2]);
    const btn = (a, i) => ({
      key: i,
      label: fill(a.label),
      variant: a.variant || "secondary",
      iconEl: a.icon ? I(a.icon, 16) : null,
      onClick: () =>
        a.href
          ? this.go(fill(a.href))
          : a.action === "clear"
            ? this.setPageState(c.id, "empty")
            : a.action === "addLead"
              ? this.setState({ opsLeads: Object.assign({}, this.state.opsLeads, { form: {} }) })
              : a.action === "startInterview" && c.mission
                ? this.startInterview(c.mission.id)
                : this.later(fill(a.label)),
    });

    const valid = ["empty", "loading", "error"].concat((def.extraStates || []).map((x) => x.id));
    const live0 = !!(c.w && !s.fresh && s.world.rooms);
    const hasMods = !!(m && live0 && s.world.modules && s.world.modules.missionId === m.id);
    const roomsAll = live0 ? s.world.rooms.items : [],
      roomsHere = c.id === "watch" && m ? roomsAll.filter((r) => r.missionId === m.id) : roomsAll;
    const kbReady = !!(c.w && !s.fresh),
      kbPage = c.id === "library" || c.id === "knowledge",
      tplPage = c.id === "templates" || c.id === "template" || c.id === "templateNew";
    const rosterReady = !!(c.w && !s.fresh && s.world.roster);
    const opsPage = OPS_PAGES.includes(c.id) && kbReady;
    const canonReady = c.id === "canon" && kbReady && !!(m && ON[m.id]);
    const upPage = ["toFile", "file", "uploadStates", "files"].includes(c.id) && kbReady;
    const dflt =
      ((kbPage || tplPage) && kbReady) || (c.id === "roster" && rosterReady) || opsPage || canonReady || (upPage && !(c.id === "toFile" && !s.up.items.length))
        ? "ready"
        : c.id === "decisions"
          ? c.w && c.w.waiting
            ? "waiting"
            : "empty"
          : c.id === "progress" && hasMods
            ? "overview"
            : (c.id === "live" || c.id === "watch") && roomsHere.length
              ? "running"
              : "empty";
    let st = s.pageStates[c.id];
    if (!valid.includes(st)) st = dflt;
    if (st === "waiting" && !(c.w && c.w.waiting)) st = "empty";
    if (c.id === "canon" && st === "ready" && !canonReady) st = "empty";
    if (st === "overview" && !hasMods) st = "empty";
    if ((st === "running" || st === "full") && !roomsHere.length) st = "empty";
    if (c.id === "notFound") st = "error";
    if (!c.w) st = s.worldErr ? "error" : "loading";
    const kb = kbPage && kbReady ? libraryVals(this, c) : null;
    const tpl = tplPage && kbReady ? templatesVals(this, c) : null;
    if (c.id === "template" && st === "ready" && !(tpl && tpl.one)) st = "empty";
    const code = c.id === "notFound" ? 404 : s.worldErr ? 500 : s.errCode;
    const E = ERR[code] || ERR[500];
    const isErr = st === "error",
      bar = isErr && !!E.bar,
      form = def.layout === "form";
    const res = fill(def.resource || def.title);
    const errBody =
      code === 422 && !m
        ? "This action isn\u2019t allowed right now. Reload to see what the server allows."
        : (E.body || "").replace("{res}", res).replace("{subject}", subject).replace("{state}", mstate);
    const counting = code === 429 && s.retryIn > 0;
    const err = {
      code: String(code),
      codeLabel: String(code),
      title: E.title,
      tone: E.glyph === "stopped" ? "stopped" : "ink",
      glyphEl: this.glyph(E.glyph, 12),
      body: errBody,
      action: code === 429 ? (counting ? "Retry in " + s.retryIn + "s" : "Retry") : E.action,
      variant: E.primary ? "primary" : "secondary",
      disabled: counting || undefined,
      reason: counting ? "The rate limit resets in " + s.retryIn + " seconds." : null,
      reasonId: counting ? "cr-err-reason" : undefined,
      reqId: s.reqId,
      hasMoves: code === 422 && !!m,
      moves: (m ? MOVES[m.state] || [] : []).map((x, i) => ({ key: i, label: x, onClick: () => this.later(x) })),
      onAction: () =>
        E.href
          ? this.go(E.href)
          : code === 401 || code === 403
            ? this.later(E.action)
            : this.setPageState(c.id, "empty"),
    };
    const barV = {
      state: E.bar,
      title: E.title,
      body: errBody,
      glyphEl: this.glyph(E.glyph, 12),
      action: E.action,
      variant: E.primary ? "primary" : "secondary",
      reqId: s.reqId,
      onAction: () => this.setPageState(c.id, "empty"),
    };

    const emptyDef = st === "filtered" ? def.filtered : def.empty;
    // the empty state's scene (Rico UI's instrument panels), picked by what the page holds
    const SCENE = {
      decisions: "nothing", projects: "emptyFolder", newProject: "nothing", progress: "emptyList", watch: "noTabs",
      release: "emptyList", receipt: "emptyList", module: "blockedPage", dispatch: "emptyFolder", plan: "nothing",
      gates: "emptyList", findings: "emptyList", live: "noTabs", clients: "emptyFolder", knowledge: "emptyFolder",
      library: "emptyFolder", templates: "emptyFolder", template: "blockedPage", templateNew: "nothing",
      factory: "emptyList", roster: "emptyFolder", activity: "noNotifications",
    };
    const es = emptyDef
      ? {
          scene: st === "filtered" ? "noResults" : SCENE[c.id] || "nothing",
          iconEl: I(emptyDef.icon, 16),
          title: fill(emptyDef.title),
          msg: fill(emptyDef.msg),
          actions: (emptyDef.actions || []).map((a, i) =>
            btn(Object.assign({}, a, { variant: i === 0 ? "primary" : "secondary" }), i),
          ),
          hasActions: !!(emptyDef.actions && emptyDef.actions.length),
        }
      : {};
    const emptyLabels = ((emptyDef && emptyDef.actions) || []).map((a) => a.label);
    const showEmptyCta = (st === "empty" || st === "filtered") && !!emptyDef;
    const showContent = st !== "loading" && (!isErr || bar || form);
    const isLive = (c.id === "live" || c.id === "watch") && (st === "running" || st === "full");
    const L = {
      library: kbPage && st === "ready" && !!kb,
      templates: c.id === "templates" && st === "ready" && !!tpl,
      template: c.id === "template" && st === "ready" && !!(tpl && tpl.one),
      templateNew: c.id === "templateNew" && st === "ready" && !!(tpl && tpl.make),
      roster: c.id === "roster" && (st === "ready" || st === "stale") && rosterReady,
      ops: opsPage && st === "ready",
      decisions: c.id === "decisions",
      overview: c.id === "progress" && st === "overview",
      live: isLive,
      generic: c.id !== "decisions" && !def.layout && st !== "filtered" && !!def.empty,
      filtered: st === "filtered",
      form,
      canon: def.layout === "canon",
      rack: def.layout === "rack" && !isLive,
      settings: def.layout === "settings",
      uploads: def.layout === "uploads" && st === "ready",
    };
    if (L.library || L.templates || L.template || L.templateNew || L.roster || L.overview || L.live || L.ops || L.uploads)
      L.generic = false;
    const ops = L.ops ? opsVals(this, c) : {};
    // CR-34: the tray, the drop target, the filing sheet and the Drive badge are on every page
    const up = uploadsVals(this, c);
    const projectFiles =
      c.id === "files" && m
        ? Object.assign({ name: m.name, gate0Note: NO_TREE.includes(m.state) ? "Canon reads these during Gate 0." : "Canon read these during Gate 0." }, missionFiles(this, m.id))
        : null;
    const cv = c.id === "canon" && st === "ready" && canonReady ? canonVals(this, c) : null;

    const isProj = !!m && PROJECT_IDS.includes(c.id),
      isFactory = FACTORY_IDS.includes(c.id);
    const preFinal = isProj && NO_TREE.includes(m.state);
    const mastTabs = isProj
      ? PROJECT_PAGES.filter((p) => p[0] !== "watch").map(([id, label, suf]) => ({
          key: id,
          label,
          // before finalize only Scope has anything in it; the rest say when they open
          href: preFinal && !["canon", "files"].includes(id) ? undefined : "#/missions/" + m.id + suf,
          off: preFinal && !["canon", "files"].includes(id) ? "true" : undefined,
          title: preFinal && !["canon", "files"].includes(id) ? "Opens when you finalize the plan" : undefined,
          current:
            c.id === id ||
            (id === "progress" && (c.id === "watch" || c.id === "module")) ||
            (id === "release" && c.id === "receipt")
              ? "page"
              : undefined,
        }))
      : false && isFactory
        ? FACTORY_TABS.filter((t) => t[0] === "library" || t[0] === "roster").map(([id, label, href]) => ({
            key: id,
            label,
            href: "#" + href,
            current: c.id === id ? "page" : undefined,
            hasSubs: id === "library" && c.id === "library" ? "true" : undefined,
            subs:
              id === "library" && c.id === "library"
                ? LIB_KINDS.map((k) => ({
                    key: k[0],
                    label: k[1],
                    href: "#/library/" + k[0],
                    current: (c.r.kind || "skills") === k[0] ? "page" : undefined,
                  }))
                : [],
          }))
        : [];
    const open = c.w ? c.w.missions.filter((x) => !HIDDEN.includes(x.state)) : [];
    const prs = c.w && !s.fresh && s.world.factoryPrs ? s.world.factoryPrs.items.filter((p) => p.state === "open") : [];
    const chip = (x, value, tone) => ({
      key: x.id,
      href: this.missionHref(x),
      name: x.name,
      dot: this.missionDot(x, c),
      pulse: PULSE.includes(x.state) ? "true" : undefined,
      value,
      tone,
    });
    let dm = null;
    if (c.id === "decisions") {
      const n = c.w ? c.w.waiting : 0,
        date = fmtWeekday(new Date());
      if (st === "loading")
        dm = {
          tone: "pending",
          date,
          tileEl: I("inbox", 20),
          headline: "Decisions",
          lead: "Checking what needs you.",
          loading: true,
        };
      else if (st === "error")
        dm = {
          tone: "pending",
          date,
          tileEl: I("inbox", 20),
          headline: "Decisions",
          lead: "Couldn\u2019t load what\u2019s waiting.",
        };
      else if (st === "waiting")
        dm = {
          tone: "needs",
          date,
          tileEl: I("inbox", 20),
          count: String(n),
          headline: n === 1 ? " decision needs you" : " decisions need you",
          lead: "Approve in one tap, with the evidence in front of you.",
          chips: open.filter((x) => x.needsYouCount).map((x) => chip(x, x.needsYouCount + " waiting", "needs")),
          chipsLabel: "Waiting by project",
          pr: prs[0] || null,
        };
      else
        dm = {
          tone: "clear",
          date,
          tileEl: I("check", 20),
          headline: "Nothing needs you",
          lead: open.length
            ? "Every open project is moving on its own."
            : "No open projects yet. Start one from Projects.",
          chips: open.map((x) => chip(x, STATE_LABEL[x.displayState] || x.displayState, "muted")),
          chipsLabel: "Open projects",
          pr: null,
        };
      dm.hasChips = !!((dm.chips && dm.chips.length) || dm.pr);
    }
    const GW = { pass: "passed", running: "testing", fail: "failed", pending: "not yet" };
    const waitRows =
      st === "waiting"
        ? open
            .filter((x) => x.needsYouCount)
            .map((x) => ({
              key: x.id,
              mini: (x.gateStrip || []).map((g, i) => ({ key: i, st: g })),
              miniN: (x.gateStrip || []).filter((g) => g === "pass").length + "/6",
              miniLabel: "Gates: " + (x.gateStrip || []).map((g, i) => i + " " + GW[g]).join(", "),
              href: this.missionHref(x),
              name: x.name,
              client: x.forLabel || "Not set yet",
              state: STATE_LABEL[x.displayState] || x.displayState,
              dot: this.missionDot(x, c),
              pulse: PULSE.includes(x.state) ? "true" : undefined,
              count: x.needsYouCount,
              glyphEl: this.glyph("needs", 10),
            }))
        : [];
    const prRows = prs.map((p) => ({ key: String(p.number), number: p.number, title: p.title }));
    const fmtDay = (iso) => fmtDate(iso);
    const PKG = { "landing-page": "Landing page" };
    const needing = open.filter((x) => x.needsYouCount);
    let mastStats = [];
    const oldest =
      c.w && c.w.decs
        ? c.w.decs
            .map((d) => d.expiresAt)
            .filter(Boolean)
            .sort()[0]
        : null;
    const exp = oldest ? Math.max(0, Math.ceil((Date.parse(oldest) - Date.now()) / 864e5)) : null;
    if (c.id === "decisions" && st === "waiting")
      mastStats = [{ k: "Projects", v: needing.length + " of " + open.length }].concat(
        exp == null
          ? []
          : [
              {
                k: "Oldest expires",
                v: exp === 0 ? "Today" : "In " + exp + (exp === 1 ? " day" : " days"),
                tone: exp <= 1 ? "needs" : undefined,
              },
            ],
        [{ k: "Factory PRs", v: String(prs.length) }],
      );
    else if (c.id === "decisions" && st === "empty" && c.w)
      mastStats = [
        { k: "Waiting", v: "0", tone: "clear" },
        { k: "Open projects", v: String(open.length) },
      ];
    else if (isProj && NO_TREE.includes(m.state))
      mastStats = [
        { k: "Step", v: (m.onboardingStep || 1) + " of 5" },
        { k: "Needs you", v: String(m.needsYouCount || 0), tone: m.needsYouCount ? "needs" : undefined },
      ];
    else if (isProj) {
      const dd =
        m.deadline && m.deadline.dueAt
          ? Math.ceil((Date.parse(m.deadline && m.deadline.dueAt) - Date.now()) / 864e5)
          : null;
      const fOpen =
        live0 && s.world.findings && s.world.findings.missionId === m.id
          ? s.world.findings.items.filter((x) => x.state === "open")
          : [];
      mastStats = (
        fOpen.length ? [{ k: "Open findings", v: fOpen.length + " · " + fOpen[0].kind, tone: "stopped" }] : []
      )
        .concat([
          { k: "Needs you", v: String(m.needsYouCount || 0), tone: m.needsYouCount ? "needs" : undefined },
          {
            k: "Due",
            v:
              dd == null
                ? "No deadline"
                : dd < 0
                  ? fmtDay(m.deadline && m.deadline.dueAt)
                  : dd === 0
                    ? "Today"
                    : "In " + dd + (dd === 1 ? " day" : " days"),
            tone: (dd != null && dd <= 3) || (m.deadline && m.deadline.atRisk) ? "needs" : undefined,
          },
        ])
        .concat(
          m.deadline && m.deadline.atRisk ? [{ k: "Deadline", v: "At risk", tone: "needs" }] : [],
          m.clientMain && m.clientMain.moved
            ? [{ k: "Client\u2019s main", v: "Moved since the pin", tone: "needs" }]
            : [],
        );
    } else if (c.id === "live" && c.w)
      mastStats = [
        { k: "Rooms", v: (st === "full" ? 6 : isLive ? roomsAll.length : 0) + "/6", gap: "Gap 4" },
        {
          k: "Parked",
          v: String(live0 ? s.world.rooms.parked.length : 0),
          tone: live0 && s.world.rooms.parked.length ? "stopped" : undefined,
        },
        { k: "Next in line", v: String(live0 ? s.world.rooms.queue.length : 0) },
      ];
    else if (c.id === "projects" && c.w && st !== "empty")
      mastStats = [
        { k: "Open", v: String(open.length) },
        { k: "Need you", v: String(needing.length), tone: needing.length ? "needs" : undefined },
      ];
    mastStats = mastStats.map((x, i) => Object.assign({ key: i }, x));
    const mastTone =
      c.id === "decisions"
        ? st === "waiting"
          ? "var(--av-needs)"
          : st === "empty"
            ? "var(--av-verified-solid)"
            : "var(--av-pending-solid)"
        : isProj
          ? this.missionDot(m, c)
          : "var(--av-primary)";
    const parkedN = live0 ? s.world.rooms.parked.filter((p) => !isProj || p.missionId === m.id).length : 0;
    const signal =
      c.id === "decisions"
        ? st === "waiting"
          ? "needs"
          : st === "empty"
            ? "verified"
            : "quiet"
        : isProj
          ? m.needsYouCount
            ? "needs"
            : m.state === "delivered" || m.state === "closed"
              ? "verified"
              : m.state === "running"
                ? "running"
                : "quiet"
          : c.id === "live"
            ? parkedN
              ? "stopped"
              : "running"
            : "quiet";
    const GATE = {
      pass: ["verified", "passed"],
      running: ["running", "testing"],
      fail: ["stopped", "failed"],
      pending: ["waiting", "not yet"],
    };
    // Gates 0, 1, 4 and 5 happen once. Gates 2 and 3 run again for every job and every merge, so while
    // modules are still building they show a count, never a check mark.
    const mm = s.world && s.world.modules && m && s.world.modules.missionId === m.id ? s.world.modules.items : null;
    const landedN = mm ? mm.filter((x) => x.state === "landed").length : 0,
      runN = mm ? mm.filter((x) => x.state === "running").length : 0;
    const strip0 = isProj && m.gateStrip ? m.gateStrip : null;
    const strip =
      strip0 && mm && landedN < mm.length && !CLOSE_STATES.includes(m.state)
        ? strip0.map((g, i) => (i === 2 || i === 3 ? "running" : i > 3 ? "pending" : g))
        : strip0;
    // Gate 0 fills as Canon's checkpoints are approved (five of them, Finalize included)
    const ob0 = isProj && m && ON[m.id] && ON[m.id].checkpoints ? ON[m.id] : null;
    const cps0 = ob0 && m.state === "onboarding" ? statesFor(ob0, (s.canon || {})[m.id] || {}) : null;
    const cpDone = cps0 ? cps0.filter((x) => x.state === "approved").length : 0;
    const GATE_NAME = ["Scope", "Pre-dispatch", "Integration", "Job check", "Ready to merge", "Close"];
    const cur = strip ? strip.findIndex((g) => g !== "pass") : -1;
    const gates = strip
      ? strip.map((g, i) => {
          const live = mm && g === "running" && (i === 2 || i === 3);
          const fill =
            g === "pass" || g === "fail"
              ? 1
              : live
                ? landedN / mm.length
                : i === 0 && cps0
                  ? cpDone / cps0.length
                  : g === "running"
                    ? 0.5
                    : 0;
          const status =
            g === "pass"
              ? "passed"
              : g === "fail"
                ? "failed"
                : live
                  ? i === 2
                    ? landedN + " of " + mm.length + " modules landed"
                    : runN + " running, each job is checked when it finishes"
                  : i === 0 && cps0
                    ? cpDone + " of " + cps0.length + " checkpoints approved"
                    : g === "running"
                      ? "running"
                      : "not yet";
          return {
            key: i,
            n: String(i),
            name: GATE_NAME[i],
            st: g,
            current: i === cur ? "true" : undefined,
            fill: String(Math.round(fill * 100) / 100),
            href: "#/missions/" + m.id + "/gates",
            glyphEl: g === "pass" ? this.icon("check", 12) : g === "fail" ? this.icon("x", 12) : null,
            label: "Gate " + i + " " + GATE_NAME[i] + ": " + status,
          };
        })
      : [];
    const passed = strip ? strip.filter((g) => g === "pass").length : 0;
    const failAt = strip ? strip.indexOf("fail") : -1;
    const lead = failAt >= 0 ? failAt : cur;
    const gatesSum = !strip
      ? ""
      : passed === 6
        ? "All 6 gates passed"
        : failAt >= 0
          ? "failed"
          : gates[lead].label.split(": ")[1];
    const gatesHead = !strip || passed === 6 ? null : "Gate " + lead + " " + GATE_NAME[lead];
    const bannerStyle = s.banner || this.props.bannerStyle || "stats";
    const topTitle =
      dm && dm.count
        ? dm.count + dm.headline
        : dm
          ? dm.headline
          : isProj
            ? m.name
            : c.id === "template"
              ? this.templateName(c)
              : fill(def.title);
    const nW = c.w ? c.w.waiting : 0;
    const dp =
      c.id === "decisions"
        ? {
            date: fmtWeekday(new Date()),
            tone: st === "waiting" ? "needs" : "clear",
            clear: st === "empty",
            count: st === "waiting" ? String(nW) : "0",
            countGlyph: this.glyph(st === "waiting" ? "needs" : "verified", 11),
            countSub:
              st === "waiting"
                ? "across " + needing.length + (needing.length === 1 ? " project" : " projects")
                : "Every open project is moving on its own",
            facts: (st === "waiting" && exp != null
              ? [
                  {
                    key: "e",
                    k: "Oldest expires",
                    v: exp === 0 ? "Today" : "In " + exp + (exp === 1 ? " day" : " days"),
                    tone: exp <= 1 ? "needs" : undefined,
                  },
                ]
              : []
            ).concat([
              { key: "o", k: "Open projects", v: String(open.length) },
              { key: "p", k: "Factory PRs", v: prs.length + " open" },
            ]),
            queueMeta: st === "waiting" ? nW + " across " + needing.length : "",
            movers: open
              .filter((x) => !x.needsYouCount)
              .map((x) => ({
                key: x.id,
                href: this.missionHref(x),
                name: x.name,
                dot: this.missionDot(x, c),
                pulse: PULSE.includes(x.state) ? "true" : undefined,
                state: STATE_LABEL[x.displayState] || x.displayState,
              })),
            hasPrs: prs.length > 0,
          }
        : null;
    if (dp) {
      dp.hasMovers = dp.movers.length > 0;
      dp.moversMeta = String(dp.movers.length);
    }
    const fmtTime = (iso) => fmtClock(iso);
    const fmtWhen = (iso) => fmtDate(iso) + ", " + fmtTime(iso);
    const daysTo = (iso) => (iso ? Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 864e5)) : null);
    const expL = (n) =>
      n == null ? "No expiry" : n === 0 ? "Expires today" : "Expires in " + n + (n === 1 ? " day" : " days");
    const rvar = s.reasonVariant;
    const DEC = (ref) => s.dec[ref] || {};
    const card = (d) => {
      const x = DEC(d.ref),
        mm = d.missionId ? c.w.missions.find((y) => y.id === d.missionId) : null,
        n = daysTo(d.expiresAt),
        reason = this.reasonFor(d),
        deciding = x.state === "deciding",
        brief = this.briefFor(d);
      const yes = d.options[0] || { key: "approve", label: "Approve", consequence: "" };
      const no = d.rejectable ? d.options.find((o) => o.effect === "reject") : null;
      const more = d.options.filter((o) => o !== yes && o !== no);
      // reasonRequired { approve, reject } from the item: questions and most approvals take none
      const needYes = this.needsReason(d, yes.key),
        needNo = no ? this.needsReason(d, no.key) : false;
      const askWhy = needYes || needNo;
      const blank = !reason || !reason.trim();
      // asOfSeq: a newer event for this item than the row reflects means refetch before deciding
      const refetching = !!x.refetching;
      const call = describeCall(approveCallFor(d.dto, { reason: reason || undefined }));
      return {
        noWhy: askWhy ? undefined : "true",
        // the box is optional for the main answer: it stays one line until you use it
        whyOptional: askWhy && !needYes ? "true" : undefined,
        whyHelp:
          needYes && needNo
            ? "Needed either way."
            : needYes
              ? d.kind === "pass_approval"
                ? "Needed to approve: it goes on the release record."
                : "Needed to approve."
              : needNo
                ? d.kind === "proposal"
                  ? "Only if you " + (no ? no.label.charAt(0).toLowerCase() + no.label.slice(1) : "say no") + ": it tells the agent why."
                  : "Only if you " + (no ? no.label.charAt(0).toLowerCase() + no.label.slice(1) : "say no") + ": Canon needs to know what to change."
                : "",
        key: d.ref,
        ref: d.code,
        hid: "dc-" + d.ref,
        state: x.sim || (refetching ? "refetching" : deciding ? "deciding" : "open"),
        focused: s.focusRef === d.ref ? "true" : undefined,
        onFocus: () => {
          if (this.state.focusRef !== d.ref) this.setState({ focusRef: d.ref });
          if (this.state.osa) this.setFocus({ ref: d.ref, label: d.title, setBy: "operator" });
        },
        kind: d.kind,
        kindLabel: d.kindLabel,
        // Option 1: a clean checkpoint is marked so you can approve without opening it
        clean: d.clean ? "true" : undefined,
        // CR-34: a package re-rendered because late files came in says so, and lists them
        rerender: d.kind === "dispatch_package_commit" ? rerenderLine(this, d.missionId || (d.dto && d.dto.mission && d.dto.mission.id) || (d.mission && d.mission.id)) : null,
        cleanHref: d.clean ? d.clean.href : null,
        kindTone: d.kind === "release" || d.kind === "pass_approval" ? "accent" : undefined,
        project: mm ? mm.name : d.kind === "factory_change" ? "AVEL factory" : "Clients",
        client: mm ? mm.forLabel || "Not set yet" : d.kind === "factory_change" ? "avel/factory" : "Pipeline",
        dot: mm ? this.missionDot(mm, c) : "var(--av-muted)",
        projHref: mm ? this.missionHref(mm) : d.kind === "factory_change" ? "#/factory" : "#/clients",
        expLabel: expL(n),
        expTone: n != null && n <= 1 ? "needs" : undefined,
        expGlyph: n != null && n <= 1 ? this.glyph("needs", 10) : null,
        title: d.title,
        why: d.why,
        evidence: d.evidence.map((t, i) => ({ key: i, text: t.replace(/`/g, "") })),
        facts: d.facts.map((f, i) => Object.assign({ key: i }, f)),
        draft: d.draft,
        copyDraft: d.draft
          ? () => {
              try {
                navigator.clipboard && navigator.clipboard.writeText(d.draft);
              } catch (e) {}
              this.toast("Copied. Send it, then mark it as sent.");
            }
          : null,
        // CR-W15: an item that came back says what you decided before, above the new ask
        returned: d.returned
          ? {
              text: d.returned,
              before: d.previous
                ? "You " +
                  { approved: "approved", rejected: "rejected", chose: "chose", answered: "answered" }[
                    d.previous.verdict
                  ] +
                  (d.previous.optionLabel ? " \u201c" + d.previous.optionLabel + "\u201d" : "") +
                  " on " +
                  fmtDate(d.previous.decidedAt) +
                  (d.previous.reason ? ": \u201c" + d.previous.reason + "\u201d" : ".")
                : null,
              glyph: this.glyph("headsup", 12),
            }
          : null,
        approveLabel: yes.label,
        rejectLabel: no ? no.label : null,
        approveCons: yes.consequence,
        rejectCons: no ? no.consequence : null,
        more: more.map((o) => ({
          key: o.key,
          label: o.label,
          cons: o.consequence,
          pick: () => this.decide(d, o.key),
        })),
        ifYes: d.ifYouApprove,
        ifNo: d.ifYouReject,
        unlocks: d.unlocks,
        cost: d.budget
          ? "+" + Math.round(((d.budget.toMicros - d.budget.fromMicros) / d.budget.fromMicros) * 100) + "%"
          : null,
        costNote: d.budget ? "to the " + (d.budget.scope === "module" ? "module cap" : "mission\u2019s AI budget") : "",
        stale: x.sim === "stale",
        staleGlyph: this.glyph("headsup", 12),
        nextVersion: (d.version || 1) + 1,
        review: () => {
          this.setDec(d.ref, { sim: null });
          this.toast("Showing version " + ((d.version || 1) + 1) + ".");
        },
        refetching,
        refetchText: "A newer event arrived for this item. Refreshing it before you can decide.",
        gone: x.sim === "elsewhere" || x.sim === "expired",
        goneGlyph: this.glyph(x.sim === "expired" ? "waiting" : "done", 12),
        goneText:
          x.sim === "elsewhere"
            ? "Decided on your phone a moment ago. Removing it from the list."
            : "Expired. Nothing was approved. It comes back if it still matters.",
        actionable: !x.sim && !refetching,
        reason,
        onReason: (e) => this.setDec(d.ref, { reason: e.target.value }),
        chips: [],
        // you need a reason for yes (approve disabled) or for no (no disabled), never both by default
        noReason: (needYes && blank) || deciding || refetching || undefined,
        noReasonNo: (needNo && blank) || deciding || refetching || undefined,
        busy: deciding || refetching || undefined,
        approveIcon: deciding ? I("loader", 16, { animation: "av-spin 900ms linear infinite" }) : I("check", 16),
        approve: () => this.decide(d, yes.key),
        reject: no ? () => this.decide(d, no.key) : null,
        call,
        asOfSeq: d.asOfSeq,
        brief: brief
          ? {
              summary: brief.summary,
              recommendation: brief.recommendation,
              recLabel:
                (d.options.find((o) => o.key === brief.recommendation) || {}).label ||
                (brief.recommendation === "ask_client"
                  ? "Ask the client"
                  : brief.recommendation === "ask_javaris"
                    ? "Your call"
                    : brief.recommendation),
              confidence: brief.confidence,
              risk: brief.risk,
              evidence: (brief.evidence || []).map((e, i) => ({ key: i, text: e })),
              stale:
                brief.boundVersion != null && d.binding != null && String(brief.boundVersion) !== String(d.binding)
                  ? "true"
                  : undefined,
              useReason: brief.reasonDraft && askWhy ? () => this.setDec(d.ref, { reason: brief.reasonDraft }) : null,
            }
          : null,
      };
    };
    const decsAll =
      c.w && c.w.decs
        ? this.sortDecs(
            c.w.decs.concat(
              s.world && !s.fresh && s.world.decisions
                ? s.world.decisions.items.filter((d) => {
                    const x = s.dec[d.ref] || {};
                    return x.sim === "elsewhere" || x.sim === "expired";
                  })
                : [],
            ),
          )
        : [];
    const groupsDef = [
      ["soon", "Expiring in 2 days", (d) => daysTo(d.expiresAt) <= 2, "Oldest first"],
      ["week", "This week", (d) => daysTo(d.expiresAt) > 2 && daysTo(d.expiresAt) <= 7, ""],
      ["later", "Later", (d) => daysTo(d.expiresAt) > 7, ""],
    ];
    const bucket = (d) => {
      if (d.returned) return "Back for you";
      const n = daysTo(d.expiresAt);
      return n == null ? "No expiry" : n === 0 ? "Today" : n <= 2 ? "Next 2 days" : n <= 7 ? "This week" : "Later";
    };
    const listDecs = c.id === "decisions" && st === "waiting" ? decsAll : [];
    const firstOpen = listDecs.find((d) => !(s.dec[d.ref] || {}).sim) || listDecs[0];
    const openRef = s.openDec === undefined ? (firstOpen ? firstOpen.ref : null) : s.openDec;
    let lastB = null;
    const heroDec = listDecs.find((d) => d.ref === openRef) || null;
    let hero = null;
    if (heroDec) {
      const base = card(heroDec),
        po = s.proofOpen || {};
      hero = Object.assign({}, base, {
        approveVerb: "approve",
        rejectVerb: base.rejectLabel ? "say \u201c" + base.rejectLabel + "\u201d" : null,
        evidence: heroDec.evidence.map((t, i) => {
          const pr = heroDec.evidenceProofs && heroDec.evidenceProofs[i],
            k = heroDec.ref + ":" + i,
            op = !!po[k];
          return {
            key: i,
            text: t.replace(/`/g, ""),
            hasProof: pr ? true : undefined,
            proof: pr || "",
            open: op || undefined,
            openStr: String(op),
            chipLabel: op ? "Hide proof" : "Show proof",
            toggle: () => this.setState((x) => ({ proofOpen: Object.assign({}, x.proofOpen || {}, { [k]: !op }) })),
          };
        }),
      });
      const rs = this.reasonFor(heroDec) || "";
      Object.assign(hero, {
        reason: rs,
        reasonCount: String(rs.length),
        reasonEmpty: rs.trim() || base.noWhy ? undefined : "true",
        clearReason: () => this.setDec(heroDec.ref, { reason: "" }),
        // suggestions come only from an OSA brief's reasonDraft (CR-29); the contract carries none
        suggest:
          base.brief && base.brief.useReason
            ? [
                {
                  key: 0,
                  label: "Use OSA\u2019s reason",
                  on: String(rs === (this.briefFor(heroDec) || {}).reasonDraft),
                  pick: base.brief.useReason,
                },
              ]
            : [],
        // the foot asks for a reason only when the main answer needs one; otherwise it's the undo promise
        footNote:
          rs.trim() || base.noWhy || !this.needsReason(heroDec, (heroDec.options[0] || {}).key)
            ? "Undo for 6 seconds after you decide"
            : "Add a reason to approve",
      });
    }
    const decRows = listDecs
      .filter((d) => d !== heroDec)
      .map((d) => {
        const base = card(d),
          x = s.dec[d.ref] || {},
          b = bucket(d),
          n = daysTo(d.expiresAt),
          open = false;
        const row = Object.assign({}, base, {
          divider: b !== lastB ? b : null,
          open: open || undefined,
          openStr: String(open),
          bodyId: "dq-" + d.ref,
          expShort: n == null ? "" : n === 0 ? "Today" : n + (n === 1 ? " day" : " days"),
          flag:
            x.sim === "stale"
              ? "New version"
              : x.sim === "elsewhere"
                ? "Decided elsewhere"
                : x.sim === "expired"
                  ? "Expired"
                  : x.refetching
                    ? "Refreshing"
                    : d.returned
                      ? "Back for you"
                      : x.state === "deciding"
                        ? "Sending"
                        : null,
          flagTone: x.sim === "stale" || d.returned ? "needs" : undefined,
          toggle: () => {
            this.setState({ openDec: d.ref, focusRef: d.ref });
            const cv = this.canvasRef.current;
            if (cv) cv.scrollTop = 0;
          },
        });
        lastB = b;
        return row;
      });
    const decGroups = false
      ? groupsDef
          .map(([k, label, fn, note]) => {
            const cards = decsAll.filter(fn).map(card);
            return { key: k, hid: "grp-" + k, label, note, count: String(cards.length), cards };
          })
          .filter((g) => g.cards.length)
      : [];
    const sessionDone =
      s.world && !s.fresh && s.world.decisions
        ? s.world.decisions.items
            .concat(this.checkpointDecs(true))
            .filter((d) => (s.dec[d.ref] || {}).state === "decided")
            .map((d) => {
              const x = s.dec[d.ref];
              const mm = d.missionId ? c.w.missions.find((y) => y.id === d.missionId) : null;
              return {
                key: d.ref,
                choice:
                  x.choice === "other" ? x.answer : x.label || (d.options.find((o) => o.key === x.choice) || {}).label,
                tone: x.effect === "reject" ? "pending" : "verified",
                title: d.title,
                meta: [d.code || d.kindLabel, mm ? mm.name : null, "just now"].filter(Boolean).join(" · "),
                sent: x.call ? x.call.name : null,
                reason: x.reason || null,
                undo: s.snack && s.snack.ref === d.ref ? () => this.undo(d.ref) : null,
              };
            })
        : [];
    const decDone = sessionDone.concat(
      s.world && !s.fresh && s.world.decidedToday
        ? s.world.decidedToday.map((x) => ({
            key: x.ref,
            choice: x.choice,
            tone: "verified",
            title: x.title,
            meta: x.mission + " · " + fmtTime(x.at),
            reason: x.reason,
            undo: null,
          }))
        : [],
    );
    let dmp = null;
    if (c.id === "decisions" && c.w) {
      const doneN = decDone.length,
        waitN = c.w.waiting,
        tot = doneN + waitN;
      dmp = {
        date: fmtWeekday(new Date()),
        summary: waitN
          ? waitN +
            (waitN === 1 ? " decision" : " decisions") +
            (exp != null
              ? ", oldest expires " + (exp === 0 ? "today" : "in " + exp + (exp === 1 ? " day" : " days"))
              : "")
          : "Clear for now. Nothing needs you.",
        progLabel: tot ? doneN + " of " + tot + " decided today" : "Nothing to decide today",
        // the masthead's status tag and lead line (same anatomy as every other page)
        waiting: waitN ? waitN + " waiting" : null,
        lead: waitN
          ? exp != null
            ? "the oldest expires " + (exp === 0 ? "today" : "in " + exp + (exp === 1 ? " day" : " days"))
            : "nothing expires soon"
          : "nothing needs you. The factory is moving on its own.",
        ticks: Array.from({ length: Math.max(tot, 1) }, (_, i) => ({ key: i, done: i < doneN ? "true" : undefined })),
      };
    }
    const roomRow = (r) => {
      const mm = c.w.missions.find((y) => y.id === r.missionId);
      return {
        key: r.id,
        module: r.module,
        role: r.role,
        attempt: r.attemptLabel.split(" · ")[0],
        elapsed: r.elapsedMin + " min",
        dot: this.missionDot(mm, c),
        href: "#/missions/" + mm.id + "/live",
      };
    };
    const liveSum = {
      n: String(roomsAll.length),
      bars: [0, 1, 2, 3, 4, 5].map((i) => ({ key: i, on: i < roomsAll.length ? "true" : undefined })),
      rooms: roomsAll.map(roomRow),
      parked: live0
        ? s.world.rooms.parked.map((p) => ({
            key: p.module,
            module: p.module,
            project: c.w.missions.find((y) => y.id === p.missionId).name,
            ref: p.proposalRef,
            href: "#/decisions/" + encodeURIComponent(p.proposalRef),
            glyph: this.glyph("stopped", 10),
          }))
        : [],
    };
    const LADDER = ["initial", "retry_1", "retry_2", "retry_3"];
    const ladderOf = (step, parked) =>
      [0, 1, 2, 3, 4].map((i) => ({
        key: i,
        st: parked && i === 4 ? "parked" : i < step ? "done" : i === step ? "now" : "todo",
      }));
    let ov = null;
    if (c.id === "progress" && st === "overview") {
      const mods = s.world.modules.items,
        run = mods.find((x) => x.state === "running"),
        park = mods.find((x) => x.state === "parked"),
        wait = mods.find((x) => x.state === "waiting_dependency");
      const LBL = ["Initial", "Retry 1", "Retry 2", "Retry 3", "Parked"];
      const MS = {
        landed: ["verified", "verified", "Landed"],
        running: [undefined, "running", "Running"],
        parked: ["stopped", "stopped", "Parked"],
        waiting_dependency: ["pending", "waiting", "Waiting"],
      };
      const props = decsAll
        .filter((d) => d.missionId === m.id && !(s.dec[d.ref] || {}).sim)
        .map((d) => {
          const n = daysTo(d.expiresAt);
          const cd = card(d);
          return {
            key: d.ref,
            kindLabel: d.kindLabel,
            kindTone: undefined,
            title: (d.code ? d.code + ". " : "") + d.title,
            expLabel: expL(n),
            expTone: n != null && n <= 1 ? "needs" : undefined,
            cost: cd.cost ? cd.cost + " " + cd.costNote : null,
            approveLabel: cd.approveLabel,
            rejectLabel: cd.rejectLabel,
            // a tap here needs no reason only when the kind needs none; otherwise it opens the item
            approve: cd.noReason ? () => this.go("#/decisions/" + encodeURIComponent(d.ref)) : cd.approve,
            reject:
              cd.reject && !cd.noReasonNo
                ? cd.reject
                : cd.reject
                  ? () => this.go("#/decisions/" + encodeURIComponent(d.ref))
                  : null,
          };
        });
      const pct = (a, b) => Math.round((a / b) * 100);
      const it = s.world.integration,
        act = s.world.activity,
        fnd = s.world.findings;
      ov = {
        nextGlyph: this.glyph("running", 12),
        gatesHref: "#/missions/" + m.id + "/gates",
        findingsHref: "#/missions/" + m.id + "/findings",
        next:
          (run ? run.ref + " is on " + LBL[run.ladderStep].toLowerCase() + ". " : "") +
          (park ? park.ref + " is parked until you decide. " : "") +
          (wait ? wait.ref + " starts when both land." : ""),
        nextItems: [
          run
            ? { key: "r", ref: run.ref, text: LBL[run.ladderStep].toLowerCase(), href: "#/missions/" + m.id + "/live" }
            : null,
          park ? { key: "p", ref: park.ref, text: "parked", href: "#/" } : null,
          wait ? { key: "w", ref: wait.ref, text: "waiting", href: "#/missions/" + m.id + "/plan" } : null,
        ].filter(Boolean),
        props,
        propCount: String(props.length),
        noProps: !props.length,
        modMeta: mods.filter((x) => x.state === "landed").length + " of " + mods.length + " landed",
        modules: mods.map((x) => {
          const p = pct(x.spentMicros, x.budgetMicros),
            ms = MS[x.state];
          return {
            key: x.ref,
            ref: x.ref,
            href: "#/missions/" + m.id + "/modules/" + x.ref,
            title: x.title,
            state: x.state,
            tone: ms[0],
            glyphEl: this.glyph(ms[1], 10),
            stateLabel:
              x.state === "waiting_dependency"
                ? "Waits on " + x.dependsOn.join(", ")
                : x.state === "landed"
                  ? "Landed \u00b7 " + x.landedCommit
                  : ms[2],
            ladder: ladderOf(x.ladderStep, x.state === "parked"),
            ladderText:
              (x.state === "landed" ? "Landed on " + LBL[x.ladderStep].toLowerCase() : LBL[x.ladderStep]) +
              (x.fixRounds ? " · " + x.fixRounds + " fix" : "") +
              (x.reviewRounds ? " · " + x.reviewRounds + " review" : ""),
            ladderLabel: "Retry ladder: " + LBL[x.ladderStep],
            mini: x.gateStrip.map((g, i) => ({ key: i, st: g })),
            gatesN: x.gateStrip.filter((g) => g === "pass").length + "/6",
            gatesLabel: "Gates: " + x.gateStrip.filter((g) => g === "pass").length + " of 6 passed",
            commit: x.landedCommit || "\u2014",
            pct: p,
            warn: p >= 80 ? "true" : undefined,
            budgetLabel: p + "% of the module budget used",
          };
        }),
        depCols: [
          ["Landed", mods.filter((x) => x.state === "landed")],
          ["In progress", mods.filter((x) => x.state === "running" || x.state === "parked")],
          ["Waiting", mods.filter((x) => x.state === "waiting_dependency")],
        ].map(([label, list]) => ({
          key: label,
          label,
          nodes: list.map((x) => ({
            key: x.ref,
            ref: x.ref,
            state: x.state,
            glyphEl: this.glyph(MS[x.state][1], 10),
            note:
              x.state === "waiting_dependency"
                ? "needs " + x.dependsOn.join(", ")
                : x.state === "parked"
                  ? "parked"
                  : x.state === "running"
                    ? LBL[x.ladderStep].toLowerCase()
                    : x.landedCommit,
          })),
        })),
        budgetPct: pct(m.spentMicros, m.budgetMicros),
        budgetWarn: pct(m.spentMicros, m.budgetMicros) >= 80 ? "true" : undefined,
        budgetNote: run ? run.ref + " has used " + pct(run.spentMicros, run.budgetMicros) + "% of its module cap." : "",
        lane: [
          ["queued", "Queued"],
          ["testing", "Testing"],
          ["landed", "Landed"],
          ["rejected", "Rejected"],
        ].map(([k, label]) => ({ key: k, k, label, v: String(it.lane[k]) })),
        commits: it.recent.map((x) => ({
          key: x.commit,
          commit: x.commit,
          module: x.module,
          note: x.note || "",
          when: fmtDay(x.at),
          glyphEl: this.glyph(x.state === "landed" ? "verified" : "stopped", 10),
        })),
        findings: fnd.items
          .filter((x) => x.state === "open")
          // FindingDto (route 58): no title field, so the summary comes from evidence (CR list)
          .map((x) => ({
            key: x.id,
            ref: x.checkId || x.moduleRef,
            kind: x.kind,
            title: (x.evidence && typeof x.evidence.summary === "string" && x.evidence.summary) || x.kind + " finding",
            route: [x.moduleRef, x.targetRef].filter(Boolean).join(" · "),
            glyphEl: this.glyph("stopped", 9),
          })),
        activity: act.items.map((x, i) => ({
          key: i,
          when: fmtWhen(x.at),
          actor: x.actor,
          action: x.action,
          reason: x.reason,
        })),
      };
      // CR-W24: history on main, worked out from route 55's integration commits and route 108's attempts
      {
        const titles = {};
        ((s.world.modules && s.world.modules.missionId === m.id && s.world.modules.items) || []).forEach((y) => (titles[y.ref] = y.title));
        const open = !!(s.histOpen || {})[m.id];
        const h = historyVals(m.id, titles, { limit: 12, expanded: open });
        ov.history = h
          ? Object.assign(h, {
              I: (n, z, st) => this.icon(n, z, st),
              onEarlier: h.canExpand ? () => this.setState({ histOpen: Object.assign({}, s.histOpen, { [m.id]: true }) }) : null,
            })
          : null;
      }
    }
    let lv = null;
    if (isLive) {
      const rm = roomsHere.filter((r) => !s.stopped[r.id]),
        full = st === "full";
      const room = (r) => {
        const mm = c.w.missions.find((y) => y.id === r.missionId),
          cp = Math.round((r.costMicros / r.capMicros) * 100),
          tp = Math.round((r.elapsedMin / 60) * 100),
          step = LADDER.indexOf(r.attempt);
        return {
          module: r.module,
          role: r.role,
          model: r.model,
          project: mm.name,
          dot: this.missionDot(mm, c),
          attempt: r.attemptLabel,
          ladder: ladderOf(step, false),
          ladderLabel: "Retry ladder: " + r.attemptLabel,
          lines: r.lines.map((t, i) => ({ key: i, text: t })),
          costPct: cp,
          costLabel: cp + "% of its cap",
          costWarn: cp >= 80 ? "true" : undefined,
          timePct: tp,
          timeLabel: r.elapsedMin + "/60 min",
          timeWarn: tp >= 80 ? "true" : undefined,
          warn: tp >= 80 || r.lastEventSec >= 480 ? "true" : undefined,
          last:
            r.lastEventSec >= 480
              ? "Stalled"
              : r.lastEventSec < 60
                ? r.lastEventSec + "s ago"
                : Math.round(r.lastEventSec / 60) + "m ago",
          stall: r.lastEventSec >= 480 ? "true" : undefined,
          aria:
            r.module +
            " " +
            r.role +
            ", " +
            r.attemptLabel +
            ", cost at " +
            cp +
            "% of cap, " +
            r.elapsedMin +
            " of 60 minutes",
        };
      };
      const slots = [0, 1, 2, 3, 4, 5].map((i) => {
        const r = rm[i];
        return r
          ? { key: i, n: i + 1, room: room(r) }
          : { key: i, n: i + 1, empty: true, label: full ? "In use" : "Empty" };
      });
      const roomsW = rm
        .map((r, i) =>
          Object.assign(room(r), {
            key: r.id,
            slot: r.slot || i + 1,
            projHref: "#/missions/" + r.missionId,
            modHref: "#/missions/" + r.missionId + "/modules/" + r.module,
            lastGlyph: this.glyph(r.lastEventSec >= 480 ? "needs" : "running", 10),
            attemptShort: r.attemptLabel.split(" · ")[0].toLowerCase(),
            attempt: r.attemptLabel.split(" · ")[0],
            lines: r.lines.map((t, j) => ({
              key: j,
              text: t,
              k: /^\$/.test(t) ? "cmd" : /✗|failed|expected/.test(t) ? "err" : /✓|passed/.test(t) ? "ok" : undefined,
            })),
            termOpen: s.termOpen === r.id ? "true" : undefined,
            termLabel: s.termOpen === r.id ? "Show fewer lines" : "Show more lines",
            toggleTerm: () => this.setState((x) => ({ termOpen: x.termOpen === r.id ? null : r.id })),
            stopOpen: s.stopOpen === r.id || undefined,
            stopOpenStr: String(s.stopOpen === r.id),
            askStop: () => this.setState((x) => ({ stopOpen: x.stopOpen === r.id ? null : r.id })),
            cancelStop: () => this.setState({ stopOpen: null }),
            stopReason: s.stopReason[r.id] || "",
            onStopReason: (e) => {
              const v = e.target.value;
              this.setState((x) => ({ stopReason: Object.assign({}, x.stopReason, { [r.id]: v }) }));
            },
            stopDisabled: !(s.stopReason[r.id] || "").trim() || undefined,
            confirmStop: () => {
              this.setState((x) => ({ stopOpen: null, stopped: Object.assign({}, x.stopped, { [r.id]: true }) }));
              this.toast(r.module + " stopped. Reason logged in Activity.");
            },
          }),
        )
        .sort((a, b) => (b.warn ? 1 : 0) - (a.warn ? 1 : 0));
      const usedN = full ? 6 : rm.length,
        freeSlots = [0, 1, 2, 3, 4, 5].slice(usedN).map((i) => ({ key: i, n: String(i + 1) }));
      let lastDay = null;
      const dayOf = (iso) => {
        const d = new Date(iso),
          t = new Date();
        const same = d.toDateString() === t.toDateString();
        const y = new Date(t - 864e5).toDateString() === d.toDateString();
        return same ? "Today" : y ? "Yesterday" : fmtWeekday(d);
      };
      const evAll = s.world.events.filter(
        (e) =>
          (c.id === "watch" ? e.missionId === m.id : s.riverProj === "all" || e.missionId === s.riverProj) &&
          (s.riverKind === "all" || e.kind === s.riverKind),
      );
      const evProjects = c.w.missions.filter((y) => s.world.events.some((e) => e.missionId === y.id));
      const qu = s.world.rooms.queue.filter((q) => c.id !== "watch" || q.missionId === m.id),
        pk = s.world.rooms.parked.filter((p) => c.id !== "watch" || p.missionId === m.id);
      lv = {
        full,
        fullGlyph: this.glyph("headsup", 12),
        nextText: qu[0]
          ? qu[0].module +
            " (" +
            c.w.missions.find((y) => y.id === qu[0].missionId).name +
            ") starts next, when a slot frees."
          : "Nothing is waiting for a slot.",
        rackGlyph: this.glyph("running", 12),
        rackLabel: usedN + " of 6 slots in use" + (c.id === "watch" ? " for this project" : ""),
        slots,
        rooms: roomsW,
        inUse: usedN + "/6",
        bars: [0, 1, 2, 3, 4, 5].map((i) => ({
          key: i,
          on: i < usedN ? "true" : undefined,
          warn: roomsW[i] && roomsW[i].warn ? "true" : undefined,
        })),
        free: freeSlots,
        freeN: freeSlots.length ? "true" : undefined,
        freeLabel: freeSlots.length + " free",
        freeNote: (qu0) => "",
        parked: pk.map((p) => ({
          key: p.module,
          module: p.module,
          project: c.w.missions.find((y) => y.id === p.missionId).name,
          attempt: p.attemptLabel,
          reason: p.reason,
          ref: p.proposalRef,
          href: "#/decisions/" + encodeURIComponent(p.proposalRef),
          glyph: this.glyph("stopped", 12),
        })),
        queue: qu.map((q) => {
          const mm = c.w.missions.find((y) => y.id === q.missionId);
          return {
            key: q.module,
            module: q.module,
            project: mm.name,
            dot: this.missionDot(mm, c),
            waitingOn: q.waitingOn.join(", "),
          };
        }),
        queueMeta: String(qu.length),
        togglePause: () => this.setState((x) => ({ riverPaused: !x.riverPaused })),
        pauseLabel: s.riverPaused ? "Catch up · 2 new" : "Pause",
        pauseIcon: I(s.riverPaused ? "play" : "pause", 14),
        projChips:
          c.id === "watch"
            ? []
            : [
                {
                  key: "all",
                  label: "All projects",
                  checked: String(s.riverProj === "all"),
                  pick: () => this.setState({ riverProj: "all" }),
                },
              ].concat(
                evProjects.map((y) => ({
                  key: y.id,
                  label: y.name,
                  dot: this.missionDot(y, c),
                  checked: String(s.riverProj === y.id),
                  pick: () => this.setState({ riverProj: y.id }),
                })),
              ),
        kindChips: [
          ["all", "All"],
          ["dispatch", "Dispatch"],
          ["attempt", "Attempt"],
          ["decision", "Decision"],
          ["checkpoint", "Checkpoint"],
          ["finding", "Finding"],
          ["receipt", "Receipt"],
        ].map(([k, label]) => ({
          key: k,
          label,
          checked: String(s.riverKind === k),
          pick: () => this.setState({ riverKind: k }),
        })),
        events: evAll.map((e, i) => {
          const mm = c.w.missions.find((y) => y.id === e.missionId),
            d = dayOf(e.at),
            day = d !== lastDay ? d : null;
          lastDay = d;
          return {
            key: i,
            day,
            time: fmtTime(e.at),
            dot: this.missionDot(mm, c),
            kind: e.kind,
            text: e.text,
            href: e.href || undefined,
            plain: !e.href || undefined,
            linked: e.href ? "true" : undefined,
          };
        }),
        noEvents: !evAll.length,
      };
      const view = c.id === "live" && (s.liveView === "canvas" || s.liveView === "crew") ? s.liveView : "rooms",
        W = s.world.timeline;
      lv.view = view;
      lv.viewRooms = view === "rooms";
      lv.viewCompact = false;
      lv.viewCanvas = view === "canvas";
      lv.viewTimeline = false;
      lv.viewCrew = view === "crew";
      lv.showRiver = view === "rooms";
      // the crew: Factory Live's Crew view picks a project; a project's Watch page shows its own crew on top
      if (view === "crew" || c.id === "watch") {
        const decRefs = ((s.world.decisions && s.world.decisions.items) || []).map((d) => d.ref);
        const live = (s.world.missions.items || []).filter((x) => !["closed", "draft"].includes(x.state));
        const crewOf = (id) => crewVals(s.world, id, decRefs);
        const firstRunning = live.find((x) => x.state === "running") || live[0];
        const crewId = c.id === "watch" && m ? m.id : s.crewMission || (firstRunning && firstRunning.id);
        lv.crew = crewId ? crewOf(crewId) : null;
        lv.crewI = (n, z, st) => this.icon(n, z, st);
        if (c.id !== "watch")
          lv.crewProjects = live.map((x) => {
            const cw = crewOf(x.id);
            return {
              id: x.id,
              name: x.name,
              dot: this.missionDot(x, c),
              working: cw ? cw.working : 0,
              state: (x.displayState || x.state || "").replace(/_/g, " "),
            };
          });
        lv.crewPick = (id) => this.set({ crewMission: id });
      }
      if (view === "canvas")
        try {
          const tk = s.roTick || 0,
            pane = s.lvPane || {},
            items = s.world.rooms.items,
            pkd = s.world.rooms.parked,
            qu0 = s.world.rooms.queue[0],
            MI = s.world.miosa,
            nm = (id) => (c.w.missions.find((y) => y.id === id) || {}).name || "Project";
          const layout = ["grid", "focus", "split"].includes(s.cvLayout) ? s.cvLayout : "grid",
            hold = s.cvHold || null;
          const tone = (t) =>
            /^✓.*✗/.test(t)
              ? undefined
              : /✗/.test(t) || /^\s*error\b/i.test(t) || /\bgate \d failed\b/.test(t)
                ? "fail"
                : /^✓/.test(t) || /^no type errors$/.test(t)
                  ? "pass"
                  : /^\$/.test(t)
                    ? "cmd"
                    : undefined;
          const tail = (L, n, len) =>
            Array.from({ length: Math.min(len, L.length) }, (_, i) => {
              const t = L[(n + i) % L.length];
              return { key: i, text: t, tone: tone(t), last: i === Math.min(len, L.length) - 1 ? "true" : undefined };
            });
          const all = items
            .map((r) => ({ id: r.id, kind: "run", r }))
            .concat(pkd.map((p) => ({ id: "parked-" + p.module, kind: "park", p })));
          const selId = all.some((x) => x.id === s.cvSel) ? s.cvSel : (all[0] || {}).id,
            single = layout !== "grid";
          const build = (x) => {
            const big = single;
            if (x.kind === "park") {
              const p = x.p;
              return {
                key: x.id,
                label: p.module + " parked, " + nm(p.missionId),
                st: "parked",
                parked: true,
                name: p.module,
                mono: p.module,
                title: nm(p.missionId),
                meta: [{ key: 0, text: p.attemptLabel }],
                term: true,
                lines: (p.lastLines || []).map((t, i) => ({ key: i, text: t, tone: tone(t) })),
                reason: p.reason,
                canExpand: layout === "grid" ? true : undefined,
                expand: () => this.setState({ cvLayout: "focus", cvSel: x.id }),
              };
            }
            const r = x.r,
              held = hold && hold.id === r.id,
              n = Math.floor((held ? hold.tk : tk) / 2),
              el = r.elapsedMin + Math.floor(tk / 60),
              sec = (r.lastEventSec + tk) % 7,
              split = layout === "split",
              desk = split || pane[r.id] === "desktop";
            return {
              key: x.id,
              label: r.agent + " working on " + r.module + ", " + nm(r.missionId),
              st: "working",
              running: true,
              name: r.agent,
              mono: String(r.agent).slice(0, 2),
              title: r.module + " · " + nm(r.missionId),
              split: split ? "true" : undefined,
              meta: [
                { key: 0, cls: "ro-mono", text: "sbx-" + r.id.slice(-6) },
                { key: 1, text: MI.size.name + " · " + MI.size.vcpu + " vCPU · " + MI.size.memGb + " GB" },
                { key: 2, cls: "ro-mono", text: r.model },
                { key: 3, text: r.attemptLabel },
              ],
              term: split || !desk ? true : undefined,
              desk: desk ? true : undefined,
              lines: tail(r.lines, n, big ? 16 : 9),
              held: held ? true : undefined,
              hold: () => this.setState({ cvHold: { id: r.id, tk } }),
              release: () => this.setState({ cvHold: null }),
              hasTabs: split ? undefined : true,
              tabs: [
                ["terminal", "Terminal"],
                ["desktop", "Desktop"],
              ].map(([v, label]) => ({
                key: v,
                label,
                on: String((desk ? "desktop" : "terminal") === v),
                pick: () => this.setState({ lvPane: Object.assign({}, pane, { [r.id]: v }) }),
              })),
              canExpand: layout === "grid" ? true : undefined,
              expand: () => this.setState({ cvLayout: "focus", cvSel: x.id }),
              timePct: Math.min(100, Math.round((el / 60) * 100)),
              timeLabel: el + " of 60 min",
              warn: el >= 50 ? "true" : undefined,
              beat: s.stream !== "live" ? "paused" : sec < 2 ? "just now" : sec + "s ago",
              stop: () => this.toast("Stopping " + r.module + " asks for a reason first"),
            };
          };
          const deskN =
              layout === "split"
                ? all.find((x) => x.id === selId && x.kind === "run")
                  ? 1
                  : 0
                : items.filter((r) => pane[r.id] === "desktop").length,
            freeN = 6 - items.length;
          const meter = (label, n, max) => ({
            key: label,
            label,
            n: String(n),
            max: String(max),
            pct: Math.max(n ? 3 : 0, Math.round((n / max) * 100)),
          });
          lv.cv = {
            layout,
            none: all.length ? undefined : true,
            meters: [
              meter("Sandboxes", items.length, MI.sandboxesMax),
              meter("Computers", deskN, MI.computersMax),
              meter("Memory GB", items.length * MI.size.memGb, MI.memTotalGb),
            ],
            layouts: [
              ["grid", "Grid"],
              ["focus", "Focus"],
              ["split", "Split"],
            ].map(([v, label]) => ({
              key: v,
              label,
              on: String(layout === v),
              pick: () => this.setState({ cvLayout: v }),
            })),
            eventsOn: String(!!s.cvEvents),
            events: s.cvEvents ? true : undefined,
            toggleEvents: () => this.setState({ cvEvents: !s.cvEvents }),
            wins: (single ? all.filter((x) => x.id === selId) : all).map(build),
            ghosts: single
              ? []
              : Array.from({ length: Math.min(freeN, 2) }, (_, i) => ({
                  key: i,
                  n: String(items.length + i + 1),
                  note:
                    i === 0 && qu0
                      ? qu0.module + " starts here when " + qu0.waitingOn.join(" and ") + " land"
                      : freeN > 2 && i === 1
                        ? "and " + (freeN - 2) + " more free"
                        : "Opens when a room starts",
                })),
            hasStrip: single && all.length > 1 ? true : undefined,
            freeLabel: freeN + " of 6 rooms free",
            thumbs: single
              ? all
                  .filter((x) => x.id !== selId)
                  .map((x) =>
                    x.kind === "run"
                      ? {
                          key: x.id,
                          name: x.r.agent,
                          title: x.r.module + " · " + nm(x.r.missionId),
                          st: "working",
                          stLabel: "Working",
                          line: x.r.lines[Math.floor(tk / 2) % x.r.lines.length],
                          pick: () => this.setState({ cvSel: x.id }),
                        }
                      : {
                          key: x.id,
                          name: x.p.module,
                          title: nm(x.p.missionId),
                          st: "parked",
                          stLabel: "Parked",
                          line: x.p.reason,
                          pick: () => this.setState({ cvSel: x.id }),
                        },
                  )
              : [],
          };
        } catch (e) {
          console.warn("Live canvas fell back to Rooms", e);
          lv.view = "rooms";
          lv.viewCanvas = false;
          lv.viewRooms = true;
          lv.showRiver = true;
        }
      lv.ticks = [120, 90, 60, 30, 0].map((mn) => ({
        key: mn,
        pct: (1 - mn / 120) * 100,
        label: mn === 0 ? "Now" : mn === 120 ? "2 h ago" : mn + " min",
      }));
      const OUT = { succeeded: "succeeded", failed: "failed", parked: "parked", running: "running" };
      lv.tlRows = W
        ? W.slots
            .filter((sl) => c.id !== "watch" || sl.bars.some((b) => b.missionId === m.id))
            .map((sl) => ({
              key: sl.slot,
              slot: sl.slot,
              idle: !sl.bars.length || undefined,
              bars: sl.bars.map((b, j) => {
                const mm = c.w.missions.find((y) => y.id === b.missionId) || {};
                return {
                  key: j,
                  outcome: OUT[b.outcome],
                  left: (1 - b.from / 120) * 100,
                  width: Math.max(2, ((b.from - b.to) / 120) * 100),
                  dot: mm.id ? this.missionDot(mm, c) : "var(--av-muted)",
                  label: b.module + " " + b.role + " · " + b.attempt,
                  href: b.missionId ? "#/missions/" + b.missionId + "/live" : undefined,
                  title:
                    (mm.name || "") +
                    ": " +
                    b.module +
                    " " +
                    b.role +
                    ", " +
                    b.attempt +
                    ", " +
                    (b.from - b.to) +
                    " min, " +
                    b.outcome +
                    (b.note ? " (" + b.note + ")" : ""),
                };
              }),
            }))
        : [];
      const cpRooms = roomsW.map((r) => ({
        key: r.key,
        slot: String(r.slot),
        dot: r.dot,
        module: r.module,
        role: r.role,
        project: r.project,
        attempt: r.attempt,
        costPct: r.costPct,
        costPctL: r.costPct + "%",
        costWarn: r.costWarn,
        timePct: r.timePct,
        timePctL: r.timeLabel,
        timeWarn: r.timeWarn,
        last: r.last,
        stall: r.stall,
        warn: r.warn,
      }));
      lv.cpRows = cpRooms.concat(
        freeSlots.map((fs) => ({
          key: "f" + fs.n,
          slot: fs.n,
          free: "true",
          module: "Free",
          role: "",
          project: "",
          attempt: "",
          costPct: 0,
          costPctL: "",
          timePct: 0,
          timePctL: "",
          last: "",
        })),
      );
      const sp =
        c.id === "live" && s.world.spendToday
          ? s.world.spendToday.items.map((x) => {
              const mm = c.w.missions.find((y) => y.id === x.missionId);
              return { key: x.missionId, name: mm.name, dot: this.missionDot(mm, c), pct: x.pctOfCap };
            })
          : null;
      lv.spend = sp && sp.length ? sp : null;
      lv.freeNote = qu.length
        ? qu[0].module + " takes the next free slot once " + qu[0].waitingOn.join(" and ") + " land."
        : "Rooms open here as modules start.";
    }
    let ro = null;
    if (c.id === "roster" && rosterReady) {
      const R0 = s.world.roster,
        E = s.roEdit || { on: false, agents: {}, kinds: {}, step: "edit" },
        tk = s.roTick || 0;
      const byName = {};
      R0.agents.forEach((a) => {
        byName[a.name] = a;
      });
      const teamLabel = {};
      R0.teams.forEach((t) => {
        teamLabel[t.id] = t.label;
      });
      const KW = { builds: "Builds", leads: "Leads", checks: "Checks", onboards: "Onboards" },
        AGO = ["2h ago", "yesterday", "40 min ago", "3h ago", "Friday"];
      const kind0 = (k) => R0.workKinds.find((x) => x.kind === k).agent,
        kindOwner = (k) => E.kinds[k] || kind0(k);
      const eff = (a) => Object.assign({}, a, E.agents[a.name] || {});
      const rulerOf = (n) => {
        const d = R0.disputes.find((x) => x.from === n);
        return d ? d.ruler : null;
      };
      const ruleErr = (n) => {
        const t = byName[n];
        return t.kind === "builds"
          ? null
          : t.kind === "leads"
            ? "A lead can’t take a builder slot"
            : t.name + " reviews or tests, so it can’t build. No work grades itself";
      };
      const mName = (id) => {
        const mm = c.w.missions.find((x) => x.id === id);
        return mm ? mm.name || mm.title || "a project" : "a project";
      };
      const rooms = s.world.rooms || {},
        room = (rooms.items || [])[0],
        parked = (rooms.parked || [])[0],
        live = {};
      if (room) {
        const sec = (room.lastEventSec + tk) % 9;
        live.Leon = {
          st: "working",
          label: "Working",
          what: room.module + " · " + mName(room.missionId),
          time: room.elapsedMin + Math.floor(tk / 60) + " of 60 min",
          line: room.lines[Math.floor(tk / 3) % room.lines.length],
          beat: sec < 2 ? "just now" : sec + "s ago",
        };
      }
      if (parked) live.Ghost = { st: "parked", label: "Parked", what: parked.module + " · " + mName(parked.missionId) };
      live.Canon = { st: "waiting", label: "Waiting on you", what: "Fleet portal · step 2 of 5" };
      const EV = [
        ["Leon", "ran signup.spec.ts, 11 of 12 passing"],
        ["Canon", "is waiting on 2 questions for Fleet portal"],
        ["Leon", "patched the email validator"],
        ["Zero", "is queued to review M3"],
        ["Leon", "re-ran the suite"],
        ["Fenn", "holds 12 locked tests for M3"],
      ];
      const evN = Math.floor(tk / 4),
        ev = EV[evN % EV.length],
        evAge = tk % 4;
      const setE = (p) => this.setState({ roEdit: Object.assign({}, E, p) });
      const setAgent = (n, p) =>
        setE({ agents: Object.assign({}, E.agents, { [n]: Object.assign({}, E.agents[n] || {}, p) }) });
      const changes = [];
      Object.keys(E.agents).forEach((n) => {
        const d = E.agents[n],
          o = byName[n];
        if (d.model && d.model !== o.model) changes.push({ what: n + " model", from: o.model, to: d.model });
        if (d.effort && d.effort !== o.effort) changes.push({ what: n + " effort", from: o.effort, to: d.effort });
        if (d.skills && d.skills.join() !== o.skills.join())
          changes.push({ what: n + " skills", from: o.skills.join(", ") || "none", to: d.skills.join(", ") || "none" });
      });
      Object.keys(E.kinds).forEach((k) => {
        if (E.kinds[k] !== kind0(k))
          changes.push({ what: k, from: kind0(k), to: E.kinds[k], err: ruleErr(E.kinds[k]) });
      });
      const broken = changes.filter((x) => x.err);
      const slugOf = (n) => n.toLowerCase();
      const pageA = c.r.agent ? R0.agents.find((a) => slugOf(a.name) === c.r.agent) || null : null;
      const q = (s.roQ || "").trim().toLowerCase(),
        // on an agent's page that agent is the selection; on the list, the lookup's answer is
        sel = pageA || (!c.r.agent && s.roSel && byName[s.roSel] ? byName[s.roSel] : null),
        selRuler = sel ? rulerOf(sel.name) : null;
      const card = (a0, i) => {
        const a = eff(a0),
          lv = live[a.name] || { st: "idle", label: "Idle", what: "Last ran " + AGO[i % AGO.length] };
        const slots =
          a.kind === "builds" ? R0.workKinds.filter((k) => kindOwner(k.kind) === a.name).map((k) => k.kind) : a.slots;
        const isRev = sel && sel.reviewedBy.includes(a.name),
          isRul = sel && selRuler === a.name;
        const rel =
          sel && sel.name !== a.name
            ? isRev && isRul
              ? "Reviews " + sel.name + " and rules disputes"
              : isRev
                ? "Reviews " + sel.name
                : isRul
                  ? "Rules " + sel.name + "’s disputes"
                  : a.reviewedBy.includes(sel.name)
                    ? "Reviewed by " + sel.name
                    : null
            : null;
        return {
          key: a.name,
          idx: i,
          name: a.name,
          mono: a.name.slice(0, 2),
          kind: a.kind,
          kindWord: KW[a.kind],
          team: teamLabel[a.team],
          does: a.does,
          slots: slots.map((x) => ({ key: x, label: x })),
          slotText: slots.join(" "),
          slotLine: slots.join(" · "),
          model: a.model,
          effort: a.effort,
          vendor: a.vendor,
          reviewedBy: a.reviewedBy.length ? a.reviewedBy.join(", ") : "No one",
          neverBuilds: a.neverBuilds ? "true" : undefined,
          st: lv.st,
          stLabel: lv.label,
          // idle is the normal state, so only a status that isn't idle is printed
          stShow: lv.st === "idle" ? undefined : "true",
          what: lv.what,
          // the room's lines start with a prompt mark; the card draws its own
          line: lv.line ? lv.line.replace(/^[\u203a>$]\s*/, "") : lv.line,
          time: lv.time,
          beat: lv.beat,
          sel: sel && sel.name === a.name ? "true" : "false",
          rel: rel || undefined,
          dim: undefined,
          ping: undefined,
          changed: changes.some((x) => x.what.indexOf(a.name + " ") === 0 || x.to === a.name || x.from === a.name)
            ? "true"
            : undefined,
          pr: a.pr ? "PR #" + a.pr.number + " moves this to " + a.pr.model : undefined,
          href: "#/roster/" + slugOf(a.name),
          pick: () => this.go("#/roster/" + slugOf(a.name)),
        };
      };
      const cards = R0.agents.map(card);
      // the roster's filters: search, status (with counts), and team, kind, model and vendor facets
      const roF = s.roF || {},
        status = roF.status !== undefined ? roF.status : c.r.status || "all",
        setF = (p) => this.setState({ roF: Object.assign({}, roF, { status }, p) });
      const searched = cards.filter(
        (n) =>
          !q || (n.name + " " + n.kindWord + " " + n.team + " " + n.slotText + " " + n.does).toLowerCase().includes(q),
      );
      const RANK = { waiting: 0, parked: 1, working: 2, idle: 3 };
      const fz = facets({
        pool: searched,
        defs: [
          { key: "team", name: "Team", get: (n) => [n.team], label: (v) => v, order: R0.teams.map((t) => t.label) },
          {
            key: "kind",
            name: "Does",
            get: (n) => [n.kindWord],
            label: (v) => v,
            order: ["Leads", "Builds", "Checks", "Onboards"],
          },
          { key: "model", name: "Model", get: (n) => [n.model], label: (v) => v },
          { key: "vendor", name: "Vendor", get: (n) => [n.vendor], label: (v) => v },
        ],
        sel: roF.sel || {},
        onSel: (v) => setF({ sel: v }),
        sorts: [
          { key: "roster", label: "Roster order", cmp: (a, b) => a.idx - b.idx },
          { key: "busy", label: "Needs attention first", cmp: (a, b) => RANK[a.st] - RANK[b.st] || a.idx - b.idx },
          { key: "az", label: "A to Z", cmp: (a, b) => a.name.localeCompare(b.name) },
        ],
        sortKey: roF.sort,
        onSort: (k) => setF({ sort: k }),
        noun: ["agent", "agents"],
        extraChips: q
          ? [
              {
                key: "q",
                facet: "Search",
                label: "\u201c" + (s.roQ || "").trim() + "\u201d",
                remove: () => this.setState({ roQ: "" }),
              },
            ]
          : [],
      });
      const shown = fz.items.filter((n) => status === "all" || n.st === status);
      const statusOpts = [
        ["all", "All"],
        ["working", "Working"],
        ["waiting", "Waiting on you"],
        ["parked", "Parked"],
        ["idle", "Idle"],
      ].map(([k, l]) => ({
        key: k,
        label: l,
        count: String(k === "all" ? fz.items.length : fz.items.filter((n) => n.st === k).length),
        checked: String(status === k),
        pick: () => setF({ status: k }),
      }));
      const nShown = shown.length;
      const filterBar = Object.assign({}, fz.bar, { count: nShown + (nShown === 1 ? " agent" : " agents") });
      const lanes = R0.teams
        .map((t) => ({
          key: t.id,
          label: t.label,
          // "Zero leads" repeats the lead's own card; keep only notes that state a rule
          note: / leads$/.test(t.note) ? null : t.note,
          count: String(shown.filter((x) => x.team === t.label).length),
          closed: (s.roClosed || {})[t.id] ? "true" : undefined,
          toggle: () =>
            this.setState({ roClosed: Object.assign({}, s.roClosed || {}, { [t.id]: !(s.roClosed || {})[t.id] }) }),
          agents: shown.filter((x) => x.team === t.label),
        }))
        .filter((l) => l.agents.length);
      let det = null;
      const libS = (s.world.library && s.world.library.skills) || [];
      if (sel) {
        const a = eff(sel),
          cd = cards.find((x) => x.name === sel.name);
        det = Object.assign({}, cd, {
          skillCount: String(a.skills.length),
          noSkills: a.skills.length ? undefined : true,
          skillRows: a.skills.map((n) => {
            const l = libS.find((x) => x.name === n);
            return {
              key: n,
              name: n,
              meta: l ? "v" + l.version : "Not in Library",
              isNew: sel.skills.includes(n) ? undefined : "true",
              detach: () => setAgent(sel.name, { skills: a.skills.filter((x) => x !== n) }),
            };
          }),
          skillAvail: libS
            .filter((l) => !a.skills.includes(l.name))
            .map((l) => ({
              key: l.name,
              name: l.name,
              meta:
                l.status === "active"
                  ? "v" + l.version
                  : l.status === "draft"
                    ? "Draft. Approve it in Library first"
                    : "Proposed. Waiting on its PR",
              off: l.status === "active" ? undefined : true,
              attach: () => setAgent(sel.name, { skills: a.skills.concat([l.name]) }),
            })),
          addSkill: () =>
            this.setState({
              roEdit: Object.assign({}, E.on ? E : { on: true, agents: {}, kinds: {} }, { step: "edit" }),
              roFiled: null,
            }),
          prompt: a.promptVersion,
          ruler:
            selRuler ||
            (rulerOf(sel.reviewedBy[0]) || "Brennan") + (sel.reviewedBy[0] ? " (via " + sel.reviewedBy[0] + ")" : ""),
          close: () => this.setState({ roSel: null }),
          editing: E.on && E.step === "edit" ? true : undefined,
          reading: E.on && E.step === "edit" ? undefined : true,
          modelOpts: R0.models.map((mo) => ({ key: mo.id, v: mo.id, label: mo.id + " · " + mo.vendor })),
          onModel: (e) =>
            setAgent(sel.name, {
              model: e.target.value,
              vendor: (R0.models.find((x) => x.id === e.target.value) || {}).vendor,
            }),
          effOpts: ["low", "medium", "high"].map((v) => ({
            key: v,
            label: v[0].toUpperCase() + v.slice(1),
            on: String(a.effort === v),
            pick: () => setAgent(sel.name, { effort: v }),
          })),
          kinds: R0.workKinds
            .filter((k) => k.agent === sel.name)
            .map((k) => {
              const v = kindOwner(k.kind),
                err = v !== k.agent ? ruleErr(v) : null;
              return {
                key: k.kind,
                kind: k.kind,
                value: v,
                err: err || undefined,
                invalid: err ? "true" : undefined,
                opts: R0.agents.map((x) => ({ key: x.name, v: x.name, label: x.name + " · " + KW[x.kind] })),
                onPick: (e) => setE({ kinds: Object.assign({}, E.kinds, { [k.kind]: e.target.value }) }),
              };
            }),
        });
      }
      const edgesWant = sel
        ? sel.reviewedBy
            .map((to) => ({ from: sel.name, to, kind: "rev" }))
            .concat(
              selRuler && !sel.reviewedBy.includes(selRuler) ? [{ from: sel.name, to: selRuler, kind: "rule" }] : [],
            )
        : [];
      // the team canvas and its edges are gone (Nov 14); relations show on the agent's own page
      this.roWant = [];
      void edgesWant;
      const edgesEl = React.createElement(
        "svg",
        { className: "ro-edges", "aria-hidden": true },
        (s.roEdges ? s.roEdges.split(";") : []).map((e, i) => {
          const p = e.split("|");
          return React.createElement("path", { key: i, d: p[1], "data-k": p[0] });
        }),
      );
      // The agent's overview page: everything about one agent, with links to the agents it works with
      let one = null;
      if (pageA && det) {
        const a = eff(pageA);
        const linkA = (n) => {
          const x = byName[n];
          return { key: n, name: n, href: "#/roster/" + slugOf(n), mono: n.slice(0, 2), kind: x ? x.kind : "builds", kindWord: x ? KW[x.kind] : "", team: x ? teamLabel[x.team] : "" };
        };
        const team = R0.teams.find((t) => t.id === pageA.team) || {};
        const order = R0.agents.map((x) => x.name),
          at = order.indexOf(pageA.name);
        const roleHeld = R0.roles
          .filter((r) => (typeof r.agent === "string" ? r.agent === pageA.name : Object.values(r.agent).includes(pageA.name)))
          .map((r) => r.role);
        // a builder's disputes go where its reviewer's go (Leon → Zero → Brennan)
        const via = !rulerOf(pageA.name) && pageA.reviewedBy[0] ? pageA.reviewedBy[0] : null;
        const ruler = rulerOf(pageA.name) || (via ? rulerOf(via) || "Brennan" : null);
        const work = agentWork(pageA.name, mName);
        one = Object.assign({}, det, {
          slug: slugOf(pageA.name),
          teamLabel: team.label,
          teamNote: / leads$/.test(team.note || "") ? null : team.note,
          vendor: a.vendor,
          effortWord: a.effort[0].toUpperCase() + a.effort.slice(1),
          // roles that only repeat the work kinds it takes aren't listed twice
          roles: roleHeld.filter((r) => !(det.slots || []).some((x) => x.label === r)).map((r) => ({ key: r, label: r })),
          reviewers: pageA.reviewedBy.map(linkA),
          reviews: R0.agents.filter((x) => x.reviewedBy.includes(pageA.name)).map((x) => linkA(x.name)),
          ruler: ruler ? linkA(ruler) : null,
          rulerVia: via ? "Through " + via + ", who reviews its work" : null,
          rulesFor: R0.disputes.filter((d) => d.ruler === pageA.name).map((d) => linkA(d.from)),
          teammates: R0.agents.filter((x) => x.team === pageA.team && x.name !== pageA.name).map((x) => linkA(x.name)),
          work: work.map((w) => Object.assign({}, w, { tone: w.node === "failed" || w.node === "rejected" ? "bad" : w.node === "parked" ? "park" : w.node === "uncommitted" ? "live" : "ok" })),
          noWork: work.length ? undefined : true,
          prev: at > 0 ? linkA(order[at - 1]) : null,
          next: at < order.length - 1 ? linkA(order[at + 1]) : null,
          edit: !E.on
            ? () => this.setState({ roEdit: { on: true, agents: {}, kinds: {}, step: "edit" }, roFiled: null, roSel: pageA.name })
            : null,
          back: "#/roster",
        });
      }
      // "Who gets this?": a lookup, not a filter. It starts empty and only offers pairs that exist.
      const roleArea = {
        "ui-contract": "frontend",
        "review-frontend": "frontend",
        "api-contract": "backend",
        "review-backend": "backend",
        "test-e2e": "frontend",
      };
      const fits = (kind, role) => {
        const w = R0.workKinds.find((x) => x.kind === kind);
        return !roleArea[role] || !w || roleArea[role] === w.area;
      };
      const ownerOf = (kind, role) => {
        const w = R0.workKinds.find((x) => x.kind === kind),
          r = R0.roles.find((x) => x.role === role);
        return role === "build" ? kindOwner(kind) : typeof r.agent === "string" ? r.agent : r.agent[w.area];
      };
      const lkK = s.roLkKind || "",
        lkR = s.roLkRole || "";
      const both = !!(lkK && lkR && fits(lkK, lkR));
      const pickLk = (p) => {
        const k = p.roLkKind !== undefined ? p.roLkKind : lkK,
          r = p.roLkRole !== undefined ? p.roLkRole : lkR,
          ok = k && r && fits(k, r);
        this.setState(Object.assign({ roLk: !!ok, roSel: ok ? ownerOf(k, r) : s.roSel }, p));
      };
      let answer = null;
      if (both) {
        const who = ownerOf(lkK, lkR),
          whoA = byName[who],
          tests = lkR.indexOf("test") === 0;
        const rulerName = tests ? "Brennan" : rulerOf(who) || rulerOf(whoA.reviewedBy[0]) || "Brennan";
        const pickA = (nm) => () => this.go("#/roster/" + slugOf(nm));
        answer = {
          who: { name: who, pick: pickA(who) },
          verb: lkR === "build" ? "builds it." : "takes " + lkR + ".",
          reviewers: whoA.reviewedBy.map((nm, i) => ({
            key: nm,
            name: nm,
            sep: i === 0 ? "" : i === whoA.reviewedBy.length - 1 ? " and " : ", ",
            pick: pickA(nm),
          })),
          noReview: whoA.reviewedBy.length ? undefined : true,
          reviewVerb: whoA.reviewedBy.length === 1 ? "reviews it." : "review it.",
          ruler: { name: rulerName, pick: pickA(rulerName) },
          rulerNote: tests ? "Acceptance tests also need you." : null,
        };
      }
      const done = () => this.setState({ roEdit: { on: false, agents: {}, kinds: {}, step: "edit" }, roFiled: 143 });
      const file = () => {
        const wasStale = E.step === "stale";
        setE({ step: "filing" });
        clearTimeout(this.roT);
        this.roT = setTimeout(() => {
          if (st === "stale" && !wasStale) this.setState({ roEdit: Object.assign({}, E, { step: "stale" }) });
          else done();
        }, 900);
      };
      const flow = [
        ["Contracts", ["Axis", "Zero", "Nemi"]],
        ["Tests first", ["Rigg", "Fenn"]],
        ["Builds", ["Soap", "Ghost", "Fantem"]],
        ["Builds that wait", ["Iyo", "Leon"]],
        ["Reviews", ["Brennan", "Axis", "Zero", "Leah", "Zane"]],
        ["Integration", []],
        ["Mission checks", ["Breach", "Fenn"]],
        ["Gate 5", []],
      ];
      const grp = {};
      R0.workKinds.forEach((k) => {
        const o = kindOwner(k.kind);
        (grp[o] = grp[o] || []).push(k.kind);
      });
      ro = {
        version: R0.version,
        lastPr: String(R0.lastChange.pr),
        lastAt: fmtDate(R0.lastChange.at),
        filed: s.roFiled ? String(s.roFiled) : undefined,
        openPr: !s.roFiled && R0.openPr ? { number: String(R0.openPr.number), title: R0.openPr.title } : null,
        tallies: [
          ["16", "agents"],
          ["7", "build code"],
          ["2", "leads"],
          ["6", "review or test"],
          ["6", "rooms at once"],
          [String(Object.keys(live).filter((n) => live[n].st === "working").length), "working now", "true"],
        ].map(([n, label, lv], i) => ({ key: i, n, label, live: lv })),
        viewing: !E.on ? true : undefined,
        startEdit: () =>
          this.setState({
            roEdit: { on: true, agents: {}, kinds: {}, step: "edit" },
            roFiled: null,
            roSel: s.roSel || "Leon",
          }),
        draft:
          E.on && E.step === "edit"
            ? {
                text: changes.length
                  ? changes.length +
                    (changes.length === 1 ? " change" : " changes") +
                    (R0.openPr ? ". Filing replaces open PR #" + R0.openPr.number : "")
                  : "Pick an agent to change its model, effort or work kinds",
                err: broken.length ? broken[0].err : undefined,
                blocked: !changes.length || broken.length ? true : undefined,
              }
            : null,
        discard: () => this.setState({ roEdit: { on: false, agents: {}, kinds: {}, step: "edit" } }),
        toReview: () => setE({ step: "review" }),
        review:
          E.on && E.step !== "edit"
            ? {
                title: E.step === "stale" ? "Roster changed" : "Review changes",
                meta: changes.length + (changes.length === 1 ? " change" : " changes") + " against " + R0.version,
                stale: E.step === "stale" ? true : undefined,
                newerPr: String(R0.newer.pr),
                newerV: R0.newer.version,
                newer: R0.newer.lines.map((l, i) => ({ key: i, text: l[1] })),
                changes: changes.map((x, i) => Object.assign({ key: i }, x)),
                inflight: R0.inFlight.map((x, i) => ({
                  key: i,
                  mission: x.mission,
                  state: x.state,
                  version: "keeps " + x.version,
                })),
                warn: R0.openPr ? "Filing replaces open PR #" + R0.openPr.number : "",
                busy: E.step === "filing" ? true : undefined,
                fileLabel:
                  E.step === "filing"
                    ? "Filing…"
                    : E.step === "stale"
                      ? "Reapply on " + R0.newer.version
                      : "File as factory PR",
                back: () => setE({ step: "edit" }),
                file,
              }
            : null,
        none: lanes.length ? undefined : true,
        resetFilters: () => this.setState({ roQ: "", roF: { status: "all" } }),
        lk: {
          kind: lkK,
          role: lkR,
          kinds: [{ key: "", v: "", label: "any work kind" }].concat(
            R0.workKinds
              .filter((k) => !lkR || fits(k.kind, lkR))
              .map((k) => ({ key: k.kind, v: k.kind, label: k.kind })),
          ),
          roles: [{ key: "", v: "", label: "a role" }].concat(
            [{ role: "build" }]
              .concat(R0.roles)
              .filter((r) => !lkK || fits(lkK, r.role))
              .map((r) => ({ key: r.role, v: r.role, label: r.role })),
          ),
          onKind: (e) => pickLk({ roLkKind: e.target.value }),
          onRole: (e) => pickLk({ roLkRole: e.target.value }),
          open: s.roLkOpen ? "true" : undefined,
          toggle: () => this.setState({ roLkOpen: !s.roLkOpen }),
          answer,
          hint: !both
            ? "Pick a role and a work kind to see who takes it, who reviews it and who settles disputes."
            : null,
          clear: lkK || lkR ? () => this.setState({ roLk: false, roSel: null, roLkKind: "", roLkRole: "" }) : null,
        },
        filterBar,
        status: statusOpts,
        I: (nm, z) => this.icon(nm, z),
        q: s.roQ || "",
        onQ: (e) => this.setState({ roQ: e.target.value }),
        clearQ: () => this.setState({ roQ: "" }),
        lanes,
        edgesEl,
        hasSel: det ? "true" : undefined,
        det,
        one,
        missing: c.r.agent && !pageA ? c.r.agent : null,
        teams: lanes,
        tick: {
          who: ev[0],
          text: ev[1],
          age: s.stream === "live" ? (evAge < 1 ? "just now" : evAge + "s ago") : "stream paused",
        },
        flow: flow.map(([title, who], i) => ({
          key: i,
          n: String(i + 1),
          title,
          who: who.length ? who.join(", ") : i === 5 ? "One module at a time" : "Hashed receipt and verdict",
          here: sel && who.includes(sel.name) ? "true" : undefined,
          live: who.includes("Leon") && i === 3 && live.Leon ? "true" : undefined,
        })),
        maps: [
          {
            key: "b",
            title: "Builders by work kind",
            rows: Object.keys(grp)
              .map((a) => ({ key: a, k: grp[a].join(", "), v: a }))
              .concat([{ key: "audit", k: "audit", v: "By area: Brennan, Zane, Leah, Rigg" }]),
          },
          {
            key: "r",
            title: "Dispatch roles",
            rows: R0.roles.map((r) => ({
              key: r.role,
              k: r.role,
              v:
                typeof r.agent === "string"
                  ? r.agent
                  : r.agent.frontend + " on frontend, " + r.agent.backend + " on backend",
            })),
          },
          {
            key: "d",
            title: "Who settles disputes",
            rows: R0.disputes
              .map((d) => ({ key: d.from, k: d.from + "’s findings", v: d.ruler }))
              .concat([{ key: "lt", k: "locked tests", v: "Brennan. Acceptance tests need you" }]),
          },
        ],
        ref: ["map", "flow", "rules", "open"].reduce((o, k) => {
          const on = s.roRef === k;
          o[k] = {
            open: String(on),
            on: on ? true : undefined,
            sign: on ? "−" : "+",
            toggle: () => this.setState({ roRef: on ? null : k }),
          };
          return o;
        }, {}),
        open: R0.open.map((t, i) => ({ key: i, text: t })),
        openCount: String(R0.open.length),
      };
    }
    const pkgName = isProj && m.packageKey ? PKG[m.packageKey] || m.packageKey : null;
    const pg = {
      id: c.id,
      showMast: !["live", "template", "templateNew", "library", "knowledge"].includes(c.id),
      idShort: isProj ? m.id.slice(0, 8) : undefined,
      idFull: isProj ? m.id : undefined,
      watch:
        isProj && !NO_TREE.includes(m.state)
          ? {
              href: "#/missions/" + m.id + "/live",
              current: c.id === "watch" ? "page" : undefined,
              live: m.state === "running" ? "true" : undefined,
            }
          : null,
      // Project controls: pause and resume, refresh onto the client's latest code, cancel with a reason
      ctl: isProj
        ? {
            paused: !!(s.paused || {})[m.id],
            cancelled: !!(s.cancelled || {})[m.id],
            open: s.ctlOpen === m.id,
            toggle: () => this.setState({ ctlOpen: s.ctlOpen === m.id ? null : m.id }),
            close: () => this.setState({ ctlOpen: null }),
            canRefresh: CLOSE_STATES.includes(m.state) || m.state === "running",
            pause: () => {
              this.setState({ ctlOpen: null, paused: Object.assign({}, s.paused, { [m.id]: true }) });
              this.toast("Paused " + m.name + ". Rooms finish their current step, then wait.");
            },
            resume: () => {
              this.setState({ ctlOpen: null, paused: Object.assign({}, s.paused, { [m.id]: false }) });
              this.toast("Resumed " + m.name + ".");
            },
            refresh: () => {
              this.setState({ ctlOpen: null });
              this.toast(
                "Refresh asked for: Gates 2, 4 and 5 run again on the client's latest code, then you release again.",
              );
            },
            cancel: (reason) => {
              this.setState({ ctlOpen: null, cancelled: Object.assign({}, s.cancelled, { [m.id]: true }) });
              this.toast("Cancelled " + m.name + ". Logged with your reason: \u201c" + reason + "\u201d", "warning");
            },
          }
        : null,
      hasGates: gates.length ? "true" : undefined,
      gates,
      gatesSum,
      gatesHead,
      gatesLabel: "Gates 0 to 5" + (gatesHead ? ", now at " + gatesHead : "") + ": " + gatesSum,
      genericMast: c.id !== "decisions",
      state: st,
      wide: def.wide ? "true" : undefined,
      pageLabel: isProj
        ? c.id === "progress"
          ? "Progress"
          : fill(def.title)
        : c.id === "template"
          ? this.templateName(c)
          : fill(def.title),
      title: isProj
        ? m.name
        : c.id === "template"
          ? this.templateName(c)
          : kb
            ? kb.title
            : ops.clients && ops.clients.one
              ? ops.clients.one.name
              : ro && ro.one
                ? ro.one.name
                : up && up.file && up.file.name
                  ? up.file.name
                  : fill(def.title),
      eyebrow: isProj
        ? (m.forLabel || "Not set yet") + (pkgName ? " \u00b7 " + pkgName : "")
        : isFactory
          ? "Factory"
          : fill(def.eyebrow) === fill(def.title)
            ? ""
            : fill(def.eyebrow),
      lead: isProj
        ? [
            m.internal ? "Internal template" : m.forLabel || "Client or template: Canon asks first",
            pkgName,
            m.deadline && m.deadline.dueAt
              ? "due " +
                fmtDate(m.deadline && m.deadline.dueAt) +
                (m.displayState === "blocked_on_you" ? ", clock paused while it waits on you" : "")
              : NO_TREE.includes(m.state)
                ? "the deadline clock starts when you finalize"
                : null,
          ]
            .filter(Boolean)
            .join(" \u00b7 ")
        : ops.clients && ops.clients.one
          ? ops.clients.one.since
          : ro && ro.one
            ? ro.one.does
            : up && up.file && up.file.type
              ? up.file.type + " · " + up.file.size
              : fill(def.lead),
      rackLabel: def.rackLabel,
      river: !!def.river,
      kindTabs: !!def.tabs,
      tileKind: isProj ? "project" : "page",
      dot: isProj ? this.missionDot(m, c) : undefined,
      pulse: isProj && PULSE.includes(m.state) ? "true" : undefined,
      tileEl: isProj ? null : I(def.icon, 20),
      mastTabs,
      hasMastTabs: mastTabs.length ? "true" : undefined,
      mastTabsLabel: isProj ? "Project pages" : "Factory pages",
      titleGap: isProj ? "CR-20" : undefined,
      eyebrowGap: isProj ? "CR-W5" : undefined,
      headActions: (c.id === "clients" && c.r.clientId ? [] : def.headActions || [])
        .filter((a) => !(showEmptyCta && emptyLabels.includes(a.label)))
        .map(btn),
    };
    const sp = def.spec || {};
    const spec = {
      route: sp.route,
      note: sp.note,
      states: sp.states,
      calls: (sp.calls || []).map((t) => ({ key: t, text: t })),
      fresh: (sp.fresh || []).map((t) => ({ key: t, text: t })),
      gaps: (sp.gaps || []).map((g, i) => Object.assign({ key: i }, g)),
      noGaps: !(sp.gaps && sp.gaps.length),
    };

    const clients = c.w ? c.w.clients : [];
    // ?client=<clientId> comes from a client or lead page (a lead is a client with status lead, CR-W17);
    // route 20 takes {name, clientId?} and Canon's Q-0.1a confirms it
    const npAsk = c.id === "newProject" && c.r.query ? c.r.query.get("client") : null,
      npHit = npAsk ? ((clients && clients.items) || clients || []).find((x) => x.id === npAsk) : null;
    const saving = st === "saving";
    const np = {
      // who it's for is asked in discovery; a client carried over from their page is confirmed there
      from: npHit ? "For " + npHit.name : null,
      saving: saving || undefined,
      busy: saving ? "true" : undefined,
      submitLabel: saving ? "Saving\u2026" : "Start Canon",
      submitIcon: saving ? I("loader", 16, { animation: "av-spin 900ms linear infinite" }) : I("play", 16),
    };

    const projPages = [
      "progress",
      "watch",
      "module",
      "dispatch",
      "plan",
      "gates",
      "findings",
      "projects",
      "newProject",
    ];
    const pick =
      (m && !NO_TREE.includes(m.state) ? m : null) ||
      (c.w &&
        c.w.missions.find((x) => x.id === s.lastMission && !NO_TREE.includes(x.state) && !HIDDEN.includes(x.state))) ||
      (c.w && c.w.missions.find((x) => x.state === "running")) ||
      null;
    const waiting = c.w && c.w.waiting ? String(c.w.waiting) : null;
    // the dock's live states: rooms working, the project's gates, Canon's turn, a release that's ready
    const roomsOn = ((s.world && s.world.rooms && s.world.rooms.items) || []).filter((r) => r.state === "running").length;
    const gs = (pick && pick.gateStrip) || [];
    const gatesDone = gs.filter((g) => g === "pass").length;
    const canonTurn = pick && ((s.canon || {})[pick.id] || {}).stream;
    const tabs = [
      {
        key: "d",
        label: "Decisions",
        href: "#/",
        iconEl: I("inbox", 20),
        current: c.id === "decisions" ? "page" : undefined,
        badge: waiting,
        badgeLabel: waiting ? waiting + " waiting on you" : undefined,
        needs: waiting ? "true" : undefined,
      },
      {
        key: "l",
        label: "Live",
        href: "#/live",
        iconEl: I("activity", 20),
        current: c.id === "live" ? "page" : undefined,
        badge: null,
        live: roomsOn ? "true" : undefined,
        badgeLabel: roomsOn ? roomsOn + (roomsOn === 1 ? " room running" : " rooms running") : undefined,
      },
      {
        key: "p",
        label: pick ? pick.name : "Projects",
        title: pick ? pick.name + ", project" : "Projects",
        href: pick ? "#/missions/" + pick.id : "#/missions",
        iconEl: I("list-checks", 20),
        current: projPages.includes(c.id) || c.id === "projects" ? "page" : undefined,
        badge: null,
        dot: pick ? this.missionDot(pick, c) : null,
        ring: pick && gs.length ? Math.round((gatesDone / gs.length) * 100) : null,
        canon: canonTurn ? (canonTurn.status === "submitted" ? "thinking" : "writing") : null,
        badgeLabel: canonTurn
          ? "Canon is " + (canonTurn.status === "submitted" ? "thinking" : "replying")
          : pick && gs.length
            ? gatesDone + " of " + gs.length + " gates passed"
            : undefined,
      },
      {
        key: "r",
        label: "Release",
        href: pick ? "#/missions/" + pick.id + "/release" : "#/missions",
        iconEl: I("package-check", 20),
        current: c.id === "release" || c.id === "receipt" ? "page" : undefined,
        badge: null,
        ready: pick && pick.state === "awaiting_release" ? "true" : undefined,
        badgeLabel: pick && pick.state === "awaiting_release" ? "ready to release" : undefined,
      },
    ];

    const seg = (opts, cur, key) =>
      opts.map((o) => ({
        key: o.v,
        label: o.label,
        iconEl: o.icon ? I(o.icon, 14) : null,
        checked: String(cur === o.v),
        pick: () => this.set({ [key]: o.v }),
      }));

    const dockStates = [{ id: "empty", label: def.emptyLabel || "Empty" }]
      .concat(def.extraStates || [], [
        { id: "loading", label: "Loading" },
        { id: "error", label: "Error" },
      ])
      .map((x) => ({
        key: x.id,
        label: x.label,
        checked: String(st === x.id),
        pick: () =>
          this.setPageState(
            c.id,
            x.id,
            x.id === "error" ? { reqId: this.newReq(), retryIn: s.errCode === 429 ? 42 : 0 } : null,
          ),
      }))
      .concat([
        {
          key: "ready",
          label: "Ready",
          checked: "false",
          disabled: true,
          title: "Ready state with sample data: next pass",
          pick: null,
        },
      ]);
    const dockCodes = CODES.map((cd) => ({
      key: String(cd),
      label: cd === 500 ? "5xx" : cd === "offline" ? "Offline" : String(cd),
      checked: String(isErr && code === cd),
      pick: () => this.setPageState(c.id, "error", { errCode: cd, reqId: this.newReq(), retryIn: cd === 429 ? 42 : 0 }),
    }));
    const frame = /[?&]frame=1/.test(location.search);
    const dockVp = VPS.map((v) => ({
      key: v.id,
      label: v.label + " " + v.w,
      short: v.short,
      checked: String(!!s.vp && s.vp.w === v.w),
      pick: () => {
        const base = location.href.split("#")[0];
        this.setState({
          vp: { label: v.label, w: v.w, src: base + (base.includes("?") ? "&" : "?") + "frame=1" + location.hash },
        });
      },
    }));
    const streamLabel =
      s.stream === "live"
        ? "Live"
        : s.stream === "stalled"
          ? "Stalled"
          : s.stream === "reconnecting"
            ? "Reconnecting\u2026"
            : "Offline";
    const focus = c.id === "canon";
    const hs = m
      ? {
          running: ["running", undefined, "Running"],
          awaiting_release: ["needs", "headsup", "Awaiting release"],
          onboarding:
            m.displayState === "blocked_on_you"
              ? ["needs", "needs", "Waiting on you"]
              : ["waiting", "pending", "Scoping with Canon"],
          draft: ["waiting", "pending", "Draft"],
          delivered: ["verified", "verified", "Delivered"],
        }[m.state] || ["running", undefined, STATE_LABEL[m.displayState] || m.displayState]
      : null;
    if (m && (s.cancelled || {})[m.id]) hs.splice(0, 3, "stopped", "stopped", "Cancelled");
    else if (m && (s.paused || {})[m.id]) hs.splice(0, 3, "waiting", "pending", "Paused");

    return {
      ic: {
        expand14: I("maximize-2", 14),
        panelLeft: I("panel-left", 16),
        x20: I("x", 20),
        x16: I("x", 16),
        searchBar: I("search", 16),
        search20: I("search", 20),
        search14: I("search", 14),
        search16: I("search", 16, { color: "var(--av-muted)" }),
        menuBar: I("menu", 20),
        menu20: I("menu", 20),
        chevronCrumb: I("chevron-right", 14, { color: "var(--av-muted)" }),
        logout16: I("log-out", 16),
        blocksNav: I("blocks", 16),
        plus14: I("plus", 14),
        check20: I("check", 20),
        radio16: I("radio", 16),
        check14: I("check", 14),
        x14: I("x", 14),
        arrowRight14: I("arrow-right", 14),
        copy14: I("copy", 14),
        refresh14: I("refresh-cw", 14),
        square14: I("square", 12),
        gauge14: I("gauge", 14),
        chevronDown16: I("chevron-down", 16),
        chevronUp16: I("chevron-up", 16),
        chevronUpDown16: I("chevrons-up-down", 16),
        settings16: I("settings", 16),
        sun16: I("sun", 16),
        moon16: I("moon", 16),
        keyboard16: I("keyboard", 16),
        logOut16: I("log-out", 16),
        radioTab: I("radio", 20),
        inboxTab: I("inbox", 20),
        plusTab: I("plus", 20),
        settingsTab: I("settings-2", 20),
        pr14: I("git-pull-request", 14),
        pr16: I("git-pull-request", 16, { color: "var(--av-muted)" }),
        chevron16: I("chevron-right", 16, { color: "var(--av-muted)" }),
        plus16: I("plus", 16),
        building16: I("building", 16),
        message16: I("message-square", 16),
        terminal16: I("terminal", 16),
        play16: I("play", 16),
        gauge16: I("gauge", 16),
        enter13: I("corner-down-left", 14, { color: "var(--av-muted)" }),
        sliders14: I("settings-2", 14),
        chevronLeft20: I("chevron-left", 20),
        chevronLeft16: I("chevron-left", 16),
        chevronRight16: I("chevron-right", 16),
        chevronRight20: I("chevron-right", 20),
        x16b: I("x", 16),
        edit14: I("edit", 14),
      },
      rails: [
        {
          key: "aside",
          wrapClass: "lib-aside",
          isAside: true,
          isSheet: false,
          collapsed: s.collapsed ? "true" : undefined,
          aria: "Sidebar",
        },
        {
          key: "sheet",
          wrapClass: "lib-sheet",
          isAside: false,
          isSheet: true,
          open: s.sheet ? "true" : undefined,
          role: "dialog",
          modal: "true",
          aria: "Navigation",
          hidden: s.sheet ? undefined : "true",
        },
      ],
      navGroups: this.navGroups(c),
      crumbs: this.crumbs(c),
      railToggleTip: s.collapsed ? "Expand sidebar  \u2318B" : undefined,
      railToggleLabel: s.collapsed ? "Expand sidebar" : "Collapse sidebar",
      railToggleTitle: s.collapsed ? undefined : "Collapse sidebar (\u2318B)",
      railExpanded: String(!s.collapsed),
      toggleRail: this.toggleRail,
      onRailOver: this.onRailOver,
      hideTip: this.hideTip,
      onNavClick: this.onNavClick,
      tip: s.tip,
      streamLabel,
      streamOn: s.stream === "live" ? "true" : undefined,
      streamState: s.stream,
      tabbarAttr: focus ? undefined : "",
      showTabbar: !focus,
      tabs,
      sheetOpen: s.sheet ? "true" : undefined,
      sheetExpanded: String(s.sheet),
      openSheet: () => this.setState({ sheet: true, acct: false }),
      openPal: () => this.openPal(),
      closeSheet: () => this.setState({ sheet: false }),
      canvasRef: this.canvasRef,
      topbarRef: this.topbarRef,
      progressRef: this.progressRef,
      mainRef: this.mainRef,
      onCanvasScroll: this.onCanvasScroll,
      skipToMain: (e) => {
        e.preventDefault();
        if (this.mainRef.current) this.mainRef.current.focus();
      },
      themeOpts: seg(
        [
          { v: "light", label: "Light", icon: "sun" },
          { v: "night", label: "Night", icon: "moon" },
        ],
        s.theme,
        "theme",
      ),
      depthOpts: seg(
        [
          { v: "flat", label: "Flat", icon: "square" },
          { v: "glass", label: "Glass", icon: "layers" },
        ],
        s.depth,
        "depth",
      ),
      hp: (() => {
        const run = live0 ? s.world.rooms.items.length : 0,
          pk = live0 ? s.world.rooms.parked.length : 0,
          n = c.w ? c.w.waiting : 0;
        return {
          running: String(run),
          runWord: run === 1 ? "room running" : "rooms running",
          parked: pk ? String(pk) : undefined,
          livePulse: s.stream === "live" && run ? "true" : undefined,
          liveDot: s.stream === "live" ? (run ? "var(--cr-pass)" : "var(--av-muted)") : "var(--av-muted)",
          liveState: s.stream,
          offline:
            s.stream === "offline"
              ? "Offline"
              : s.stream === "reconnecting"
                ? "Reconnecting\u2026"
                : s.stream === "stalled"
                  ? "No events for 10 min"
                  : undefined,
          needsState: n ? "on" : "clear",
          needsLabel: n ? "need you" : "All clear",
          needsN: n ? String(n) : undefined,
          needsIcon: I(n ? "inbox" : "check", 16),
        };
      })(),
      hLive: {
        state: s.stream,
        title:
          s.stream === "live"
            ? "Live: connected"
            : s.stream === "stalled"
              ? "Live: no event for 10 minutes (stallAfterMs). Reconnecting on the next event."
              : s.stream === "reconnecting"
                ? "Live: reconnecting"
                : "Live: offline",
      },
      hInbox: {
        count: waiting,
        gap: waiting ? "CR-W5" : undefined,
        title: waiting ? waiting + " decisions need you" : "Nothing needs you",
      },
      acct: {
        name: "Javaris",
        role: "Operator",
        initial: "J",
        open: !!s.acct,
        settingsCurrent: c.id === "settings" ? "page" : undefined,
        night: s.theme === "night",
        flipTheme: () => this.set({ theme: s.theme === "night" ? "light" : "night" }),
        keys: () => this.setState({ acct: false, keysOpen: true }),
      },
      acctOpen: s.acct,
      acctExpanded: String(s.acct),
      toggleAcct: () => this.setState((x) => ({ acct: !x.acct })),
      signOut: () => {
        this.setState({ acct: false });
        this.later("Sign out");
      },
      headStatus: hs
        ? { glyphEl: this.glyph(hs[0], 10), tone: hs[1], label: hs[2] }
        : ops.clients && ops.clients.one
          ? { tone: ops.clients.one.tone, label: ops.clients.one.status }
          : null,
      pg,
      spec,
      specOpen: s.spec,
      specExpanded: String(s.spec),
      toggleSpec: () => this.set({ spec: !s.spec }),
      libTabs: LIB_KINDS.map((k) => ({
        key: k[0],
        label: k[1],
        href: "#/library/" + k[0],
        sel: String(c.id === "library" && kind[0] === k[0]),
      })),
      show: { loading: st === "loading", errorPanel: isErr && !bar, bar, content: showContent },
      err,
      bar: barV,
      mergedHead: c.id !== "live" ? "true" : undefined,
      signal,
      onRiverScroll: (e) => {
        const p = e.currentTarget.closest(".cr-river-panel");
        if (p) {
          if (e.currentTarget.scrollTop > 2) p.setAttribute("data-scrolled", "");
          else p.removeAttribute("data-scrolled");
        }
      },
      dmp,
      hero,
      queueTitle: hero ? "Also waiting" : "Waiting on you",
      kb,
      tpl,
      ro,
      up,
      projectFiles,
      ...ops,
      contentCls: bar ? "scr-state-dim" : "cr-content",
      decRows,
      decCount: String(decRows.filter((r) => !r.gone).length),
      topTitle: dm ? topTitle : pg.title || topTitle,
      lvTop:
        c.id === "live"
          ? (() => {
              const run = isLive ? (st === "full" ? 6 : lv ? lv.rooms.length : 0) : 0,
                pk = live0 ? s.world.rooms.parked.length : 0,
                sec = live0 && s.world.rooms.items[0] ? s.world.rooms.items[0].lastEventSec : null;
              const stale = s.stream !== "live" || (sec != null && sec >= 240);
              return {
                quiet: !run && !pk ? true : undefined,
                busy: run || pk ? true : undefined,
                running: String(run),
                runWord: run === 1 ? "room" : "rooms",
                parked: pk ? String(pk) : undefined,
                beat:
                  s.stream === "offline"
                    ? "Offline. Showing the last events"
                    : s.stream === "reconnecting"
                      ? "Reconnecting\u2026"
                      : sec == null
                        ? "Waiting for events"
                        : stale
                          ? "No events for " + Math.round(sec / 60) + " min"
                          : "Last event " + (sec < 60 ? sec + "s" : Math.round(sec / 60) + " min") + " ago",
                stale: stale ? "true" : undefined,
                pulse: !stale ? "true" : undefined,
                beatDot: stale ? "var(--av-muted)" : "var(--cr-pass)",
              };
            })()
          : null,
      lvTopX:
        c.id === "live"
          ? {
              stream: s.stream,
              streamLabel,
              offline: s.stream !== "live" || undefined,
              stats: mastStats.filter((x) => x.k !== "Next in line"),
              views: [
                ["rooms", "Rooms", "layout-grid"],
                ["crew", "Crew", "users"],
                ["canvas", "Canvas", "terminal"],
              ].map(([v, l, icn]) => ({
                key: v,
                label: l,
                iconEl: I(icn, 14),
                checked: String((["canvas", "crew"].includes(s.liveView) ? s.liveView : "rooms") === v),
                pick: () => this.set({ liveView: v }),
              })),
            }
          : null,
      L,
      es,
      dm,
      dp,
      decGroups,
      decClear: c.id === "decisions" && st === "empty",
      decDone,
      decDoneCount: String(decDone.length),
      liveSum,
      ov,
      lv,
      rv: { prefilled: rvar === "prefilled", chips: rvar === "chips", after: rvar === "after" },
      // an answer given in Canon's dock shows its undo in the dock, next to what you just did
      snack:
        s.snack && !s.snack.inline
          ? { text: s.snack.text, left: s.snack.left, glyph: I("check", 16), undo: () => this.undo(s.snack.ref) }
          : null,
      dockDec: c.id === "decisions" || c.id === "progress",
      dockReason: [
        ["prefilled", "Prefilled"],
        ["chips", "Chips"],
        ["after", "After tap"],
      ].map(([v, l]) => ({
        key: v,
        label: l,
        checked: String(rvar === v),
        pick: () => this.set({ reasonVariant: v }),
      })),
      dockSim: [
        ["stale", "Stale (409)"],
        ["newer", "Newer event (asOfSeq)"],
        ["elsewhere", "Decided elsewhere"],
        ["expired", "Expired"],
      ]
        .map(([k, l]) => ({ key: k, label: l, pick: () => this.simFirst(k) }))
        .concat([
          {
            key: "every",
            label: s.everyKind ? "Back to the sample world" : "One of every kind",
            pick: () => this.everyKind(!s.everyKind),
          },
          { key: "reset", label: "Reset", pick: () => this.setState({ dec: {}, snack: null }) },
        ]),
      waitRows,
      prRows,
      mastStats,
      mastTone,
      bannerStyle,
      dockBanner: [
        ["plain", "Plain"],
        ["stats", "Stat strip"],
        ["tinted", "Tinted"],
      ].map(([v, l]) => ({
        key: v,
        label: l,
        checked: String(bannerStyle === v),
        pick: () => this.set({ banner: v }),
      })),
      np,
      rackGlyph: this.glyph("waiting", 12),
      clearFilters: () => this.setPageState(c.id, "empty"),
      submitNew: (e) => {
        e.preventDefault();
        if (saving) return;
        const name = (new FormData(e.currentTarget).get("name") || "").toString().trim();
        if (!name) {
          const f = e.currentTarget.querySelector("input[name=name]");
          if (f) f.focus();
          return;
        }
        this.setPageState(c.id, "saving");
        clearTimeout(this.saveT);
        // B4: Start Canon used to end on a toast and leave you on the form. It now creates the project
        // (route 20) and opens Canon's interview on it. not a fetch: the mock's stand-in for the request's time
        this.saveT = setTimeout(() => {
          this.setPageState("newProject", "empty");
          const id = this.createMission(name, npHit);
          if (id) this.startInterview(id);
        }, 500);
      },
      runDoctor: () => this.later("Doctor checks"),
      toast: s.toast,
      toastTone: s.toastTone || "success",
      toastIcon: {
        success: I("check", 14),
        info: I("info", 14),
        warning: I("triangle-alert", 14),
        failure: I("circle-x", 14),
      }[s.toastTone || "success"],
      pal: s.pal ? this.palVals(c) : null,
      cv,
      I,
      keys: s.keysOpen ? { groups: KEYS, I, close: this.closePal } : null,
      showDock: this.props.showDock !== false,
      dockOpen: s.dock,
      dockExpanded: String(s.dock),
      toggleDock: () => this.set({ dock: !s.dock }),
      openProto: () => {
        this.setState({ sheet: false });
        this.set({ dock: true });
      },
      dockStates,
      dockCodes,
      gapsOn: s.gaps,
      gapsChecked: String(s.gaps),
      toggleGaps: () => this.set({ gaps: !s.gaps }),
      osaBar: this.osaVals(c),
      osaSet: this.osaSettings(),
      termAttached:
        s.osa && !(s.osaUi || {}).paused && !(s.osaUi || {}).termOff && OSA.status.terminal.attached
          ? "attached"
          : undefined,
      dockOsa: [
        { key: "off", label: "Off", checked: String(!s.osa), pick: () => this.set({ osa: false }) },
        { key: "on", label: "On (CR-29)", checked: String(!!s.osa), pick: () => this.set({ osa: true }) },
      ],
      dockTerm: s.osa
        ? [
            {
              key: "a",
              label: "Attached",
              checked: String(!(s.osaUi || {}).termOff),
              pick: () => this.setState({ osaUi: Object.assign({}, s.osaUi, { termOff: false }) }),
            },
            {
              key: "n",
              label: "Not attached",
              checked: String(!!(s.osaUi || {}).termOff),
              pick: () => this.setState({ osaUi: Object.assign({}, s.osaUi, { termOff: true }) }),
            },
          ]
        : null,
      dockEvery: [
        { key: "s", label: "Sample", checked: String(!s.everyKind), pick: () => this.everyKind(false) },
        {
          key: "e",
          label: "Every kind (contract-mock)",
          checked: String(!!s.everyKind),
          pick: () => this.everyKind(true),
        },
      ],
      dockWorld: [
        { key: "s", label: "Sample world", checked: String(!s.fresh), pick: () => this.set({ fresh: false }) },
        { key: "f", label: "Fresh install", checked: String(s.fresh), pick: () => this.set({ fresh: true }) },
      ],
      dockStream: [
        ["live", "Live"],
        ["stalled", "Stalled"],
        ["reconnecting", "Reconnecting"],
        ["offline", "Offline"],
      ].map(([v, l]) => ({
        key: v,
        label: l,
        checked: String(s.stream === v),
        pick: () => {
          this.lastEventAt = Date.now();
          this.set({ stream: v });
        },
      })),
      notFrame: !frame,
      dockVp,
      vp: s.vp,
      closeVp: () => this.setState({ vp: null }),
    };
  }
}
export const PAGE_SPECS = PAGES;
