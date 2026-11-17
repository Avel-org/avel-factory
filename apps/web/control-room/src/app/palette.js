// The command palette (⌘K) and the keyboard map. Items come from the world the screens already read:
// pages, projects, decisions, clients and leads, agents, Library entries and templates. Verbs never act
// blind: "Approve" on a parked module's proposal opens the decision with its plain block and the Approve button in front of you.
import LIB from "../mock/library.json";

/** g-chords: press g, then the letter. Shown in the palette and in the ? sheet. */
export const CHORDS = [
  ["d", "Decisions", "#/"],
  ["l", "Live", "#/live"],
  ["p", "Projects", "#/missions"],
  ["c", "Clients", "#/clients"],
  ["k", "Library", "#/library"],
  ["t", "Templates", "#/templates"],
  ["a", "Agents", "#/roster"],
  ["v", "Activity log", "#/activity"],
  ["f", "Factory changes", "#/factory"],
  ["s", "Settings", "#/settings"],
];

export const KEYS = [
  {
    key: "anywhere",
    title: "Anywhere",
    rows: [
      [["⌘", "K"], "Search and run a command"],
      [["?"], "Show these keys"],
      [["⌘", "B"], "Hide or show the sidebar"],
      [["Esc"], "Close what's open"],
    ],
  },
  { key: "go", title: "Go to", rows: CHORDS.map(([k, label]) => [["G", k.toUpperCase()], label]) },
  {
    key: "dec",
    title: "Decisions",
    rows: [
      [["J"], "Next decision"],
      [["K"], "Previous decision"],
      [["A"], "Approve the focused decision, with its reason"],
      [["R"], "Reject the focused decision, with its reason"],
    ],
  },
];

const norm = (t) =>
  String(t || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s#-]/g, " ");

function score(item, words) {
  const hay = norm(item.label + " " + (item.hint || "") + " " + (item.keys || ""));
  let sc = 0;
  for (const w of words) {
    const i = hay.indexOf(w);
    if (i < 0) return -1;
    sc += i === 0 ? 3 : hay[i - 1] === " " ? 2 : 1;
  }
  return sc + (item.weight || 0);
}

/** Every item the palette can offer, grouped. */
export function paletteItems(logic, c, PAGES) {
  const w = c.w || {};
  const missions = w.missions || [];
  const decs = logic.sortDecs(w.decs || []);
  const roster = (logic.state.world && logic.state.world.roster) || { agents: [] };
  const chord = Object.fromEntries(CHORDS.map(([k, , h]) => [h, ["G", k.toUpperCase()]]));
  const items = [];
  const add = (group, x) => items.push(Object.assign({ group }, x));

  decs.forEach((d, i) => {
    const m = missions.find((x) => x.id === d.missionId);
    const where = m ? m.name : "Factory";
    add("Waiting on you", {
      id: "open:" + d.ref,
      icon: "inbox",
      label: d.title,
      ref: d.ref,
      hint: where,
      keys: "open decision why " + d.ref,
      href: "#/decisions/" + encodeURIComponent(d.ref),
      weight: 3 - Math.min(i, 3),
      waiting: true,
    });
    add("Verbs", {
      id: "approve:" + d.ref,
      icon: "check",
      label: "Approve " + d.ref,
      hint: d.title,
      keys: "approve yes accept",
      href: "#/decisions/" + encodeURIComponent(d.ref),
      note: "Opens it with Approve ready",
      verb: true,
    });
  });
  missions.forEach((m) => {
    add("Projects", {
      id: "p:" + m.id,
      icon: "folder",
      label: m.name,
      hint: m.forLabel || "Client or template: not set",
      keys: "project mission open",
      href: logic.missionHref(m),
    });
    if (m.state === "running")
      add("Verbs", {
        id: "watch:" + m.id,
        icon: "terminal",
        label: "Watch " + m.name,
        hint: "Live rooms",
        keys: "watch live rooms terminal",
        href: "#/missions/" + m.id + "/live",
        verb: true,
      });
    if (m.state === "awaiting_release")
      add("Verbs", {
        id: "rel:" + m.id,
        icon: "package-check",
        label: "Release " + m.name,
        hint: "Receipt and proof",
        keys: "release ship deliver",
        href: "#/missions/" + m.id + "/release",
        verb: true,
      });
  });
  [{ label: "Start a new project", href: "#/missions/new", keys: "new create project canon", icon: "plus" }].forEach(
    (x) => add("Verbs", Object.assign({ id: "v:" + x.label, verb: true }, x)),
  );
  Object.keys(PAGES).forEach((id) => {
    const p = PAGES[id];
    if (!p.href || p.href.includes("$") || p.href.includes(":") || !p.label || p.hideInPalette) return;
    const href = "#" + (p.href === "/" ? "/" : p.href);
    add("Pages", {
      id: "pg:" + id,
      icon: p.icon,
      label: p.label,
      keys: (p.keys || "") + " page",
      href,
      kbd: chord[href],
    });
  });
  // a lead is a client with status lead (CR-W17), so leads come from the same list
  (w.clients || []).forEach((cl) =>
    add("Clients", {
      id: "c:" + cl.id,
      icon: cl.status === "lead" || cl.status === "lost" ? "users" : "building",
      label: cl.name,
      hint:
        cl.status === "lead"
          ? "Lead"
          : cl.status === "lost"
            ? "Lost lead"
            : cl.kind === "internal"
              ? "Internal"
              : "Client",
      keys: cl.status === "lead" || cl.status === "lost" ? "lead client" : "client",
      href: "#/clients/" + cl.id,
    }),
  );
  (roster.agents || []).forEach((a) =>
    add("Agents", {
      id: "a:" + a.name,
      icon: "bot",
      label: a.name,
      hint: a.does,
      keys: "agent " + a.team + " " + a.kind,
      href: "#/roster?q=" + encodeURIComponent(a.name),
    }),
  );
  (LIB.entries || []).forEach((e) =>
    add("Library", {
      id: "l:" + e.slug,
      icon: e.kind === "skills" ? "sparkles" : "book-open",
      label: e.title,
      hint: e.type || e.kind,
      keys: "library " + e.kind,
      href: "#/library/" + e.kind + "/" + e.slug,
    }),
  );
  (LIB.templates || []).forEach((t) =>
    add("Templates", {
      id: "t:" + t.slug,
      icon: "layout-grid",
      label: t.name,
      hint: "Template, v" + t.version,
      keys: "template",
      href: "#/templates/" + t.slug,
    }),
  );
  return items;
}

const ORDER = ["Waiting on you", "Verbs", "Pages", "Projects", "Clients", "Agents", "Library", "Templates"];

/** Filter and group for the current query. Empty query: what waits on you, then pages. */
export function paletteResults(items, q) {
  const words = norm(q).split(/\s+/).filter(Boolean);
  let list;
  if (!words.length) list = items.filter((x) => x.group === "Waiting on you" || x.group === "Pages").map((x) => [x, 0]);
  else
    list = items
      .map((x) => [x, score(x, words)])
      .filter(([, s]) => s >= 0)
      .sort((a, b) => b[1] - a[1]);
  const groups = [];
  ORDER.forEach((g) => {
    const rows = list.filter(([x]) => x.group === g).map(([x]) => x);
    if (rows.length) groups.push({ key: g, title: g, rows: rows.slice(0, words.length ? 6 : 8) });
  });
  if (words.length) groups.sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key));
  return groups;
}
