import HISTORY from "../mock/history.json";
import OPS from "../mock/operations.json";

/*
 * The crew: a project's whole agent team live in one view. Built from contract-shaped data:
 *   the team lead       roster (route 47) team of the project's builders, kind "leads"
 *   one card per module route 108's module run: state, its builder (latest attempt), cost against the cap
 *   under each module   its test writer (route 55, the tests commit) and reviewers (review attempts)
 *   live line           route 64's step stream for the running attempt
 * Not in contract 1.0.0 (CR-W27): who delegated to whom, each agent's context use, messages between
 * agents, connected tools, and pause / stop on one agent. The view leaves those out rather than invent them.
 */

const MODEL = { "claude-opus-5": "Opus 5", "claude-sonnet-5": "Sonnet 5", "claude-haiku-5": "Haiku 5" };
const ROLE_ICON = { lead: "git-branch", build: "hammer", test: "flask-conical", review: "scan-eye", onboard: "sparkles" };

function agentOf(roster, name) {
  return (roster.agents || []).find((a) => a.name === name) || { name, team: null, model: "claude-opus-5" };
}

/** What a module card says, from its run and its decision. */
function moduleLine(state, run, att, room) {
  if (state === "landed" || state === "accepted") return "Landed on main";
  if (state === "parked") return "Parked at the cap";
  if (state === "waiting_dependency") return "Waiting on another module";
  if (state === "queued") return "Queued";
  if (room && room.lines && room.lines.length) return room.lines[room.lines.length - 1].trim();
  const last = att && att.steps && att.steps[att.steps.length - 1];
  return last ? last.text : "Working";
}

export function crewVals(world, missionId, decRefs) {
  const m = (world.missions.items || []).find((x) => x.id === missionId);
  if (!m) return null;
  const roster = world.roster || { agents: [] };
  const H = HISTORY.missions[missionId];
  const runs = (OPS.moduleRuns || {})[missionId] || {};
  const rooms = ((world.rooms && world.rooms.items) || []).filter((r) => r.missionId === missionId);

  // onboarding: Canon is the whole crew
  if (m.state === "onboarding" || m.state === "draft") {
    const canon = agentOf(roster, "Canon");
    return {
      mission: m,
      working: m.state === "onboarding" ? 1 : 0,
      total: 1,
      lead: {
        key: "canon",
        name: "Canon",
        role: "Onboarding",
        icon: ROLE_ICON.onboard,
        model: MODEL[canon.model] || canon.model,
        st: m.state === "onboarding" ? "working" : "idle",
        line: m.state === "onboarding" ? "Interviewing you for the plan" : "Waiting for the first conversation",
        share: Math.round((m.spentMicros / m.budgetMicros) * 100),
        shareLabel: "of the project's AI budget",
        href: "#/missions/" + m.id + "/onboarding",
        hrefLabel: "Open onboarding",
        task: "Runs Gate 0: interviews you and drafts checkpoints 0.1 to 0.4.",
      },
      modules: [],
    };
  }

  // modules: the plan's list when the world carries it, else the refs in the project's history
  const plan =
    world.modules && world.modules.missionId === missionId
      ? world.modules.items.map((x) => ({ ref: x.ref, title: x.title, state: x.state, budget: [x.spentMicros, x.budgetMicros] }))
      : Object.keys((H && H.attempts) || {}).map((ref) => ({
          ref,
          title: ((((OPS.receipts || {})[missionId] || {}).modules || []).find((y) => y[0] === ref) || [])[1] || ref,
          state: m.state === "awaiting_release" || m.state === "delivered" ? "landed" : "queued",
        }));
  if (!plan.length) return { mission: m, working: 0, total: 0, lead: null, modules: [] };

  const teams = {};
  const modules = plan.map((p) => {
    const run = runs[p.ref] || {};
    const atts = (H && H.attempts && H.attempts[p.ref]) || [];
    const opsAtts = run.attempts || [];
    const build = atts.filter((a) => !/review/i.test(a.label));
    const last = build[build.length - 1];
    const lastOps = opsAtts[opsAtts.length - 1];
    const room = rooms.find((r) => r.module === p.ref);
    const builderName = (room && room.agent) || (last && last.agent) || (lastOps && lastOps.agent) || null;
    const builder = builderName ? agentOf(roster, builderName) : null;
    if (builder && builder.team) teams[builder.team] = (teams[builder.team] || 0) + 1;
    const st =
      p.state === "running" ? "working" : p.state === "landed" || p.state === "accepted" ? "done" : p.state === "parked" ? "needs" : "idle";
    // the module's AI against its own budget (the same figure as the Modules table), never money
    const cost = p.budget && p.budget[1] ? p.budget : room ? [room.costMicros, room.capMicros] : null;
    const tests = H && H.integrationCommits.find((c) => c.kind === "tests" && c.moduleRef === p.ref);
    const reviews = atts.filter((a) => /review/i.test(a.label));
    const tester = tests ? agentOf(roster, tests.by.agent) : agentOf(roster, "Fenn");
    const subs = [
      {
        key: p.ref + "-t",
        name: tester.name,
        role: "Test writer",
        icon: ROLE_ICON.test,
        model: MODEL[tester.model] || tester.model,
        st: tests ? "done" : st === "idle" ? "idle" : "working",
        line: tests
          ? tests._cr
            ? tests._cr.title
            : "Tests locked"
          : st === "idle"
            ? "Writes the tests when " + p.ref + " is dispatched"
            : "Writing the tests first",
      },
    ].concat(
      reviews.length
        ? reviews.map((a) => {
            const r = agentOf(roster, a.agent);
            return {
              key: p.ref + "-" + a.key,
              name: r.name,
              role: a.role === "review-security" ? "Security review" : "Spec review",
              icon: ROLE_ICON.review,
              model: MODEL[r.model] || r.model,
              st: a.result === "landed" ? "done" : "working",
              line: a.result === "landed" ? "Passed review" : "Reviewing",
            };
          })
        : st === "done" || st === "idle"
          ? []
          : [
              {
                key: p.ref + "-r",
                name: "Zane",
                role: "Spec review",
                icon: ROLE_ICON.review,
                model: MODEL[agentOf(roster, "Zane").model],
                st: "idle",
                line: "Reviews when the builder hands off",
              },
            ],
    );
    const decRef = run.decision && decRefs.includes(run.decision) ? run.decision : null;
    const label = (last && last.label) || (lastOps && lastOps.label) || "";
    return {
      key: p.ref,
      ref: p.ref,
      title: p.title,
      name: builder ? builder.name : "No builder yet",
      role: p.ref + " · " + p.title,
      icon: ROLE_ICON.build,
      model: builder ? MODEL[builder.model] || builder.model : "",
      st: decRef && st !== "working" ? "needs" : st,
      attempt: label ? label.split(" · ")[0] : null,
      line: moduleLine(p.state, run, lastOps, room),
      live: p.state === "running" && lastOps && lastOps.live ? lastOps.live.map((x) => x.text) : null,
      share: cost && cost[1] ? Math.min(100, Math.round((cost[0] / cost[1]) * 100)) : null,
      shareLabel: "of its budget",
      tests: run.tests && run.tests !== "—" ? run.tests : null,
      minutes: room ? room.elapsedMin : lastOps ? lastOps.minutes : null,
      href: "#/missions/" + missionId + "/modules/" + p.ref,
      hrefLabel: "Open " + p.ref,
      decHref: decRef ? "#/decisions/" + encodeURIComponent(decRef) : null,
      task: run.summary || (lastOps && lastOps.summary) || (((OPS.planModules || {})[missionId] || {})[p.ref] || {}).goal || null,
      subs,
    };
  });

  const team = Object.entries(teams).sort((a, b) => b[1] - a[1])[0];
  const leadAgent = (roster.agents || []).find((a) => a.kind === "leads" && team && a.team === team[0]) || agentOf(roster, "Zero");
  const working = modules.filter((x) => x.st === "working").length + modules.reduce((n, x) => n + x.subs.filter((y) => y.st === "working").length, 0);
  const waiting = modules.filter((x) => x.st === "needs").length;
  const running = modules.find((x) => x.st === "working");
  const landed = modules.filter((x) => x.st === "done").length;
  const names = new Set([leadAgent.name]);
  modules.forEach((x) => {
    names.add(x.name);
    x.subs.forEach((y) => names.add(y.name));
  });
  return {
    mission: m,
    working: working + (running || waiting ? 1 : 0),
    total: names.size,
    lead: {
      key: "lead",
      name: leadAgent.name,
      role: ((roster.teams || []).find((t) => t.id === leadAgent.team) || { label: "Team" }).label + " lead",
      icon: ROLE_ICON.lead,
      model: MODEL[leadAgent.model] || leadAgent.model,
      st: running ? "working" : waiting ? "needs" : landed === modules.length ? "done" : "idle",
      line: running
        ? "Watching " + running.ref + "'s " + (running.attempt || "try").toLowerCase()
        : waiting
          ? waiting + (waiting === 1 ? " module waits on you" : " modules wait on you")
          : landed === modules.length
            ? "Every module landed"
            : "Waiting for dispatch",
      share: Math.round((m.spentMicros / m.budgetMicros) * 100),
      shareLabel: "of the project's AI budget",
      meta: landed + " of " + modules.length + " landed",
      href: "#/missions/" + missionId + "/progress",
      hrefLabel: "Open Build",
      task: "Splits the plan into modules, dispatches each room and watches the gates.",
    },
    modules,
  };
}
