// Values for the Library (/library) and Templates (/templates) pages, as the doc "AVEL Library and
// Templates" lays them out. Kept out of logic.js so the two pages can grow on their own. Every value
// here is plain data or a handler bound to the logic's state; the views in src/pages/library and
// src/pages/templates only read them. Decisions about the library (approving entries, candidates)
// live on the Decisions page, never here.
import SAMPLE from "../mock/library.json";
import SKILL_RESULTS from "../mock/skill-results.json";
import { headingId } from "../kit/Markdown";

// AI cost is shown only against its cap (CR-W20 section 3). Template stats and plan estimates are
// AI dollars in the sample data, so the page turns them into shares of the standard caps.
const MODULE_AI = 15; // the standard module cap
const MISSION_AI = 150; // a mission's standard AI budget
const capShare = (usd, cap) => Math.max(1, Math.round((usd / cap) * 100)) + "%";

const DAY = (d) =>
  new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const slugify = (t) =>
  String(t)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export { headingId };

const STATUS = {
  approved: ["verified", "Approved"],
  active: ["verified", "Active"],
  proposed: ["headsup", "Proposed"],
  draft: ["pending", "Draft"],
  retired: ["pending", "Retired"],
};

/** The library's table of contents: sections, and the categories inside them. */
const SECTIONS = [
  {
    key: "start",
    label: "Get started",
    cats: [["guides", "Guides", "compass", "How the library works, and how to change it"]],
  },
  {
    key: "knowledge",
    label: "Knowledge",
    cats: [
      ["worked-examples", "Worked examples", "book-open", "Real code that passed, explained step by step"],
      ["patterns", "Patterns", "layers", "When to reach for an approach, and what it costs"],
      ["correction-pairs", "Correction pairs", "file-diff", "What failed, what passed, and why"],
      ["checklists", "Checklists", "list-checks", "What reviewers check, item by item"],
      ["lessons", "Lessons", "flag", "Things the factory learned the hard way"],
      ["decision-records", "Decision records", "scale", "Choices made once, so agents don't ask again"],
    ],
  },
  { key: "clients", label: "Clients", dynamic: "client" },
  { key: "templates", label: "Templates", dynamic: "template" },
  {
    key: "skills",
    label: "Skills",
    cats: [
      ["role-skills", "Role skills", "users", "Loaded for every agent in a role"],
      ["stack-skills", "Stack skills", "swatch-book", "Loaded when the work uses that stack"],
    ],
  },
  {
    key: "rules",
    label: "Rules",
    cats: [
      ["global-rules", "Global rules", "shield-alert", "Checks every project runs"],
      ["stack-rules", "Stack rules", "server", "Checks for one language or framework"],
    ],
  },
];
const TYPE_CAT = {
  "Worked example": "worked-examples",
  Pattern: "patterns",
  "Correction pair": "correction-pairs",
  Checklist: "checklists",
  Lesson: "lessons",
  "Decision record": "decision-records",
  "Domain fact": "domain",
  "Role skill": "role-skills",
  "Stack skill": "stack-skills",
};

/** The one category an entry is filed under. */
function categoryOf(e) {
  if (e.kind === "guide") return "guides";
  if (e.layer === "client") return "client:" + slugify(e.client);
  if (e.template) return "template:" + e.template;
  if (e.kind === "rules") return e.layer === "stack" ? "stack-rules" : "global-rules";
  return TYPE_CAT[e.type] || "patterns";
}

/** Where an entry sits, as one line: Global, "Stack · astro", "Client · GTS Diesel", "Template · landing-page". */
export function layerLabel(e) {
  if (e.template) return "Template · " + e.template;
  if (e.layer === "client") return "Client · " + e.client;
  if (e.layer === "stack") return "Stack · " + e.stack;
  return "Global";
}

/** Skills are a SKILL.md (front matter, then instructions); rules are key: value lines. */
const META_LABEL = {
  name: "Name",
  description: "Description",
  id: "Rule",
  scope: "Scope",
  check: "Check",
  fail_when: "Fails when",
  message: "Message to the agent",
};
function parseBody(e) {
  const kv = (lines) =>
    lines
      .map((l) => l.match(/^([a-z_]+):\s*(.*)$/))
      .filter(Boolean)
      .map((m) => ({ key: m[1], label: META_LABEL[m[1]] || m[1].replace(/_/g, " "), value: m[2] }));
  if (e.content.startsWith("---\n")) {
    const end = e.content.indexOf("\n---", 4);
    const meta = kv(e.content.slice(4, end).split("\n"));
    return { kind: "skill", meta, text: e.content.slice(end + 4).trim(), source: e.content };
  }
  if (e.kind === "rules") return { kind: "rule", meta: kv(e.content.split("\n")), source: e.content };
  return { kind: "md", text: e.content };
}

/** A line diff (longest common subsequence), for the review step of a change. */
export function lineDiff(a, b) {
  const x = a.split("\n"),
    y = b.split("\n"),
    n = x.length,
    m = y.length;
  const t = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) t[i][j] = x[i] === y[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
  const out = [];
  let i = 0,
    j = 0;
  while (i < n && j < m) {
    if (x[i] === y[j]) (out.push({ k: "same", text: x[i++] }), j++);
    else if (t[i + 1][j] >= t[i][j + 1]) out.push({ k: "del", text: x[i++] });
    else out.push({ k: "add", text: y[j++] });
  }
  while (i < n) out.push({ k: "del", text: x[i++] });
  while (j < m) out.push({ k: "add", text: y[j++] });
  return out;
}

/**
 * Faceted filtering shared by the Library and Templates. `defs` say how to read each facet off an
 * item (always a list of values). Counts follow the usual rule: each facet's counts apply every other
 * facet, so you can see what picking an option would give. A facet with one option and nothing
 * picked is left out, since it can't narrow anything.
 */
export function facets({ pool, defs, sel, onSel, sorts, sortKey, onSort, noun, extraChips = [] }) {
  const has = (item, d) => {
    const cur = sel[d.key] || [];
    return !cur.length || d.get(item).some((v) => cur.includes(v));
  };
  const match = (item, skip) => defs.every((d) => d.key === skip || has(item, d));
  const sort = sorts.find((x) => x.key === sortKey) || sorts[0];
  const items = pool.filter((i) => match(i)).sort(sort.cmp);
  const pick = (key, v) => {
    const cur = sel[key] || [];
    onSel(Object.assign({}, sel, { [key]: cur.includes(v) ? cur.filter((x) => x !== v) : cur.concat([v]) }));
  };
  const out = defs
    .map((d) => {
      const cur = sel[d.key] || [];
      const seen = [...new Set(pool.flatMap(d.get))];
      const values = d.order
        ? d.order.filter((v) => seen.includes(v))
        : seen.sort((a, b) => d.label(a).localeCompare(d.label(b)));
      if (values.length < 2 && !cur.length) return null;
      const base = pool.filter((i) => match(i, d.key));
      return {
        key: d.key,
        label: d.name,
        summary: cur.length === 0 ? null : cur.length === 1 ? d.label(cur[0]) : cur.length + " selected",
        active: cur.length ? "true" : undefined,
        options: values.map((v) => {
          const n = base.filter((i) => d.get(i).includes(v)).length;
          return {
            key: v,
            label: d.label(v),
            count: String(n),
            checked: cur.includes(v),
            disabled: !n && !cur.includes(v),
            pick: () => pick(d.key, v),
          };
        }),
        clear: cur.length ? () => onSel(Object.assign({}, sel, { [d.key]: [] })) : null,
      };
    })
    .filter(Boolean);
  const chips = extraChips.concat(
    defs.flatMap((d) =>
      (sel[d.key] || []).map((v) => ({
        key: d.key + ":" + v,
        label: d.label(v),
        facet: d.name,
        remove: () => pick(d.key, v),
      })),
    ),
  );
  const n = items.length;
  return {
    items,
    bar: {
      facets: out,
      chips,
      activeCount: String(chips.length),
      clearAll: chips.length
        ? () => {
            onSel({});
            extraChips.forEach((c) => c.remove());
          }
        : null,
      count: n + " " + (n === 1 ? noun[0] : noun[1]),
      sort: {
        label: sort.label,
        options: sorts.map((x) => ({
          key: x.key,
          label: x.label,
          checked: x.key === sort.key,
          pick: () => onSort(x.key),
        })),
      },
    },
  };
}

const KIND_LABEL = { knowledge: "Knowledge", skills: "Skills", rules: "Rules", guide: "Guides" };
const LAYER_LABEL = { global: "Global", stack: "Stack", client: "Client", template: "Template" };
const STATUS_LABEL = { approved: "Approved", active: "Active", proposed: "Proposed", retired: "Retired" };
const ROLE_LABEL = {
  builder: "Builder",
  "test-unit": "Unit test writer",
  "test-e2e": "End-to-end test writer",
  canon: "Canon",
  "review-spec": "Spec reviewer",
  "review-security": "Security reviewer",
  "review-a11y-perf": "Accessibility and performance reviewer",
  "review-backend": "Backend reviewer",
  "review-frontend": "Frontend reviewer",
};
const ENTRY_FACETS = [
  {
    key: "kind",
    name: "Kind",
    get: (e) => [e.kind],
    label: (v) => KIND_LABEL[v] || v,
    order: ["knowledge", "skills", "rules", "guide"],
  },
  { key: "type", name: "Type", get: (e) => [e.type], label: (v) => v },
  {
    key: "layer",
    name: "Layer",
    get: (e) => [e.template ? "template" : e.layer],
    label: (v) => LAYER_LABEL[v] || v,
    order: ["global", "stack", "client", "template"],
  },
  { key: "stack", name: "Stack", get: (e) => (e.stack ? [e.stack] : []), label: (v) => v },
  { key: "client", name: "Client", get: (e) => (e.client ? [e.client] : []), label: (v) => v },
  { key: "role", name: "Used by", get: (e) => e.roles, label: (v) => ROLE_LABEL[v] || v },
  {
    key: "status",
    name: "Status",
    get: (e) => [e.status],
    label: (v) => STATUS_LABEL[v] || v,
    order: ["approved", "active", "proposed", "retired"],
  },
];
const ENTRY_SORTS = [
  { key: "updated", label: "Recently updated", cmp: (a, b) => b.updatedAt.localeCompare(a.updatedAt) },
  {
    key: "used",
    label: "Most used",
    cmp: (a, b) => b.usage.selected + b.usage.searched - (a.usage.selected + a.usage.searched),
  },
  { key: "firstTry", label: "Best first-try pass", cmp: (a, b) => (b.usage.firstTry ?? -1) - (a.usage.firstTry ?? -1) },
  { key: "az", label: "A to Z", cmp: (a, b) => a.title.localeCompare(b.title) },
];

/** Role names joined for a sentence: "the unit test writer and the end-to-end test writer". */
const roleList = (roles) => {
  const n = roles.map((r) => (ROLE_LABEL[r] || r).toLowerCase());
  return n.length < 2 ? n.join("") : n.slice(0, -1).join(", ") + " and " + n[n.length - 1];
};
/**
 * When a skill reaches an agent, as a sentence with each role linked to Agents. Role skills load on every
 * task; stack skills when the work uses that stack.
 */
function loadsFor(e) {
  const roles = e.roles.map((r, i) => ({
    key: r,
    label: "the " + (ROLE_LABEL[r] || r).toLowerCase(),
    href: "#/roster",
    sep: i === 0 ? "" : i === e.roles.length - 1 ? " and " : ", ",
  }));
  const stack = e.type === "Stack skill";
  return {
    pre: roles.length ? (stack ? "Loaded for " : "Loaded on every task for ") : "Not loaded for any role yet",
    roles,
    post: stack && roles.length ? " when the work uses " + e.stack : "",
  };
}
/** A skill's evidence is what happened on the tasks it was loaded into. Skills are loaded, never searched. */
function skillEvidence(e) {
  const u = e.usage;
  if (!u.selected) return "Not loaded yet";
  return [
    u.selected + (u.selected === 1 ? " task" : " tasks"),
    u.firstTry == null ? null : u.firstTry + "% first try",
    u.findings + (u.findings === 1 ? " finding" : " findings") + " on those tasks",
  ]
    .filter(Boolean)
    .join(" · ");
}
/** CR-W16, route 115: results per version and a baseline without the skill. Shares are 0..1. */
const pctShare = (x) => (x == null ? "No result yet" : Math.round(x * 100) + "%");
function skillResults(e) {
  const r = e.itemId && SKILL_RESULTS.results[e.itemId];
  if (!r) return null;
  const b = r.baseline;
  return {
    call: "GET /api/library/skills/" + e.itemId + "/results (route 115)",
    versions: r.versions.map((v) => ({
      key: v.version,
      v: "v" + v.version,
      current: v.current ? "true" : undefined,
      attempts: String(v.attempts),
      pass: v.attempts ? pctShare(v.firstAttemptPass) : "Not loaded yet",
      findings: String(v.findings),
    })),
    baseline: b
      ? {
          withText: pctShare(b.with.firstAttemptPass) + " first try over " + b.with.attempts + " attempts with it",
          withoutText: pctShare(b.without.firstAttemptPass) + " over " + b.without.attempts + " attempts without it",
          note:
            "Same role and work kind, " +
            DAY(b.window.from.slice(0, 10)) +
            " to " +
            DAY(b.window.to.slice(0, 10)) +
            ".",
          better:
            b.with.firstAttemptPass != null &&
            b.without.firstAttemptPass != null &&
            b.with.firstAttemptPass > b.without.firstAttemptPass
              ? "true"
              : undefined,
        }
      : null,
    noBaseline: b ? null : "Not enough attempts to compare yet: each side needs 10.",
  };
}
/** Where a skill came from: written here, or imported with its licence and the changes made since. */
function originOf(e) {
  if (e.kind !== "skills") return null;
  const o = e.origin;
  if (!o) return { imported: false, text: "Written by AVEL" };
  const changes = o.changes ? o.changes + (o.changes === 1 ? " change since import" : " changes since import") : "None";
  return {
    imported: true,
    repo: o.repo,
    text: o.repo
      ? "Imported from " + o.repo + (o.version ? " v" + o.version : "")
      : "Imported; the upstream source wasn't recorded",
    license: o.license,
    changes,
    hasChanges: o.changes ? true : undefined,
    note: o.note,
  };
}

function kbState(logic) {
  const s = logic.state.kb || {};
  return {
    q: s.q || "",
    navOpen: !!s.navOpen,
    edit: s.edit || null,
    filed: s.filed || {},
    retired: s.retired || {},
    nextPr: s.nextPr || 147,
    sel: s.sel || {},
    sort: s.sort || {},
  };
}

/** The Library: a documentation site of the knowledge base, organised by category. */
export function libraryVals(logic, c) {
  const K = kbState(logic);
  const set = (patch) => logic.setState((x) => ({ kb: Object.assign({}, x.kb || {}, patch) }));
  const I = (n, z) => logic.icon(n, z);
  const entries = SAMPLE.entries.map((e) =>
    Object.assign({}, e, {
      cat: categoryOf(e),
      status: K.retired[e.slug] ? "retired" : e.status,
      pr: K.filed[e.slug] || e.pr,
    }),
  );
  const live = entries.filter((e) => e.status !== "retired");
  const href = (e) => "#/library/" + e.kind + "/" + e.slug;
  const missions = (logic.state.world && logic.state.world.missions && logic.state.world.missions.items) || [];
  const missionHref = (name) => {
    const m = missions.find((x) => x.name === name);
    return m ? "#/missions/" + m.id : null;
  };

  // the categories, with the client and template ones made from the entries
  const sections = SECTIONS.map((sec) => {
    let cats;
    if (sec.dynamic === "client")
      cats = [...new Set(live.filter((e) => e.layer === "client").map((e) => e.client))].map((name) => [
        "client:" + slugify(name),
        name,
        "building",
        "Language, rules and past decisions for " + name + ", never shared with another client",
      ]);
    else if (sec.dynamic === "template")
      cats = [...new Set(live.filter((e) => e.template).map((e) => e.template))].map((slug) => {
        const t = SAMPLE.templates.find((x) => x.slug === slug);
        return [
          "template:" + slug,
          t ? t.name : slug,
          "layout-grid",
          "How the " + (t ? t.name.toLowerCase() : slug) + " template's scaffold works",
        ];
      });
    else cats = sec.cats;
    return {
      key: sec.key,
      label: sec.label,
      cats: cats
        .map(([key, label, icon, blurb]) => ({
          key,
          label,
          icon,
          blurb,
          items: live.filter((e) => e.cat === key),
        }))
        .filter((x) => x.items.length),
    };
  }).filter((s) => s.cats.length);
  const allCats = sections.flatMap((s) => s.cats.map((x) => Object.assign({ section: s.label }, x)));

  // what's being shown
  const sel = c.r.item ? entries.find((e) => e.slug === c.r.item) || null : null;
  const catKey = c.id === "knowledge" ? "clients" : c.r.cat ? decodeURIComponent(c.r.cat) : null;
  const cat = sel
    ? allCats.find((x) => x.key === sel.cat)
    : catKey
      ? allCats.find((x) => x.key === catKey) || null
      : null;
  const clientsView = catKey === "clients";
  const mode = sel ? "doc" : c.r.all ? "all" : cat || clientsView ? "cat" : "home";

  // the sidebar
  const q = K.q.trim().toLowerCase();
  const hits =
    q && mode !== "all"
      ? live.filter((e) =>
          (e.slug + " " + e.title + " " + e.description + " " + e.type + " " + (e.client || ""))
            .toLowerCase()
            .includes(q),
        )
      : null;
  const nav = sections.map((s) => ({
    key: s.key,
    label: s.label,
    cats: s.cats.map((x) => {
      const open =
        (sel && sel.cat === x.key) || (cat && cat.key === x.key) || (clientsView && x.key.startsWith("client:"));
      return {
        key: x.key,
        label: x.label,
        count: String(x.items.length),
        href: "#/library/c/" + encodeURIComponent(x.key),
        iconEl: I(x.icon, 16),
        current: !sel && cat && cat.key === x.key ? "page" : undefined,
        open: open ? "true" : undefined,
        items: open
          ? x.items.map((e) => ({
              key: e.slug,
              title: e.title,
              href: href(e),
              current: sel && sel.slug === e.slug ? "page" : undefined,
            }))
          : [],
      };
    }),
  }));
  const catLabel = (e) => (allCats.find((x) => x.key === e.cat) || {}).label;
  const hitRows = hits
    ? hits.slice(0, 8).map((e) => ({ key: e.slug, title: e.title, href: href(e), where: catLabel(e) }))
    : null;

  const card = (e) => {
    const [tone, label] = STATUS[e.status] || STATUS.active;
    return {
      key: e.slug,
      href: href(e),
      title: e.title,
      desc: e.description,
      type: e.type,
      kind: KIND_LABEL[e.kind],
      icon: I(
        e.kind === "rules"
          ? "shield-alert"
          : e.kind === "skills"
            ? "wrench"
            : e.kind === "guide"
              ? "compass"
              : "book-open",
        16,
      ),
      where: catLabel(e),
      layer: layerLabel(e),
      tone,
      status: label,
      quiet: e.status === "approved" || e.status === "active" ? "true" : undefined,
      updated: DAY(e.updatedAt),
      used: e.usage.selected ? e.usage.selected + " task docs" : null,
      meta:
        e.kind === "skills"
          ? [
              e.roles.length ? roleList(e.roles).replace(/^./, (x) => x.toUpperCase()) : "No role yet",
              e.usage.selected ? e.usage.selected + (e.usage.selected === 1 ? " task" : " tasks") : "Not loaded yet",
              e.usage.firstTry == null ? null : e.usage.firstTry + "% first try",
            ].filter(Boolean)
          : null,
    };
  };

  // filters, for the all-entries page and each category page
  const scope = mode === "all" ? "all" : mode === "cat" ? (clientsView ? "clients" : cat.key) : null;
  let filtered = null;
  if (scope) {
    const base =
      mode === "all"
        ? entries.filter(
            (e) =>
              !q ||
              (e.slug + " " + e.title + " " + e.description + " " + e.type + " " + (e.client || ""))
                .toLowerCase()
                .includes(q),
          )
        : clientsView
          ? live.filter((e) => e.layer === "client")
          : cat.items;
    filtered = facets({
      pool: base,
      defs:
        mode === "all"
          ? ENTRY_FACETS
          : ENTRY_FACETS.filter((d) => d.key !== "kind" && (d.key !== "client" || clientsView)),
      sel: K.sel[scope] || (scope === "all" && c.r.kind ? { kind: [c.r.kind] } : {}),
      onSel: (v) => set({ sel: Object.assign({}, K.sel, { [scope]: v }) }),
      sorts: ENTRY_SORTS,
      sortKey: K.sort[scope],
      onSort: (k) => set({ sort: Object.assign({}, K.sort, { [scope]: k }) }),
      noun: ["entry", "entries"],
      extraChips:
        mode === "all" && q
          ? [{ key: "q", facet: "Search", label: "\u201c" + K.q.trim() + "\u201d", remove: () => set({ q: "" }) }]
          : [],
    });
  }

  // the home page
  const home =
    mode === "home"
      ? {
          stats: [
            [String(live.filter((e) => e.kind === "knowledge").length), "knowledge entries", "book-open"],
            [String(live.filter((e) => e.kind === "skills").length), "skills", "sparkles"],
            [String(live.filter((e) => e.kind === "rules").length), "rules", "shield-check"],
          ],
          release: SAMPLE.release.version,
          guide: live.find((e) => e.kind === "guide") ? card(live.find((e) => e.kind === "guide")) : null,
          allHref: "#/library/all",
          allCount: live.length + " entries",
          sections: sections
            .filter((s) => s.key !== "start")
            .map((s) => ({
              key: s.key,
              label: s.label,
              cats: s.cats.map((x) => ({
                key: x.key,
                label: x.label,
                blurb: x.blurb,
                count: x.items.length === 1 ? "1 entry" : x.items.length + " entries",
                iconEl: I(x.icon, 18),
                href: "#/library/c/" + encodeURIComponent(x.key),
              })),
            })),
          recent: [...live]
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .slice(0, 5)
            .map(card),
          used: [...live]
            .filter((e) => e.usage.selected)
            .sort((a, b) => b.usage.selected - a.usage.selected)
            .slice(0, 5)
            .map((e) => Object.assign(card(e), { uses: e.usage.selected + " task docs" })),
        }
      : null;

  // a category page
  const category =
    mode === "cat"
      ? clientsView
        ? {
            section: "Clients",
            title: "Client knowledge",
            blurb:
              "Each client's language, rules and past decisions. Client entries only ever reach that client's projects.",
            iconEl: I("building", 20),
            groups: allCats
              .filter((x) => x.key.startsWith("client:"))
              .map((x) => ({
                key: x.key,
                label: x.label,
                items: filtered.items.filter((e) => e.cat === x.key).map(card),
              }))
              .filter((g) => g.items.length),
            filter: filtered.bar,
            empty: !filtered.items.length,
          }
        : {
            section: cat.section,
            title: cat.label,
            blurb: cat.blurb,
            iconEl: I(cat.icon, 20),
            groups: filtered.items.length ? [{ key: cat.key, label: null, items: filtered.items.map(card) }] : [],
            filter: filtered.bar,
            empty: !filtered.items.length,
          }
      : null;
  const all =
    mode === "all"
      ? {
          title: "All entries",
          blurb: "Every knowledge entry, skill, rule and guide, across all categories.",
          items: filtered.items.map(card),
          filter: filtered.bar,
          empty: !filtered.items.length,
        }
      : null;

  // one entry
  let doc = null;
  if (sel) {
    const [tone, label] = STATUS[sel.status] || STATUS.active;
    const E = K.edit && K.edit.slug === sel.slug ? K.edit : null;
    const draft = E ? E.text : sel.content;
    const diff = E && E.step !== "edit" ? lineDiff(sel.content, draft) : null;
    const changed = diff ? diff.filter((d) => d.k !== "same").length : 0;
    const body = Object.assign(parseBody(sel), {
      file:
        sel.kind === "skills"
          ? "skills/" + sel.slug + "/SKILL.md"
          : sel.kind === "rules"
            ? "rules/" + sel.slug + ".yaml"
            : null,
    });
    const heads =
      body.kind === "skill"
        ? ["Instructions"]
        : body.kind === "rule"
          ? ["What it checks", "Definition"]
          : sel.content
              .split("\n")
              .filter((l) => /^## /.test(l))
              .map((l) => l.slice(3));
    const toc = (sel.kind === "guide" ? heads : heads.concat(["Evidence", "Version history"])).map((h) => ({
      key: h,
      id: headingId(h),
      label: h,
    }));
    const siblings = cat ? cat.items : [];
    const at = siblings.findIndex((e) => e.slug === sel.slug);
    const nb = (e, dir) => (e ? { href: href(e), title: e.title, dir } : null);
    doc = {
      slug: sel.slug,
      kind: sel.kind,
      guide: sel.kind === "guide",
      crumbs: [
        { key: "lib", label: "Library", href: "#/library" },
        cat ? { key: "cat", label: cat.label, href: "#/library/c/" + encodeURIComponent(cat.key) } : null,
      ].filter(Boolean),
      title: sel.title,
      desc: sel.description,
      type: sel.type,
      layer: layerLabel(sel),
      tone,
      status: label,
      version: "v" + sel.version,
      updated: "Updated " + DAY(sel.updatedAt),
      content: sel.content,
      body,
      toc,
      facts: [
        ...(sel.kind === "skills" ? [["Name", sel.slug]] : []),
        ["Type", sel.type],
        ["Layer", layerLabel(sel)],
        ["Version", "v" + sel.version],
        ["Release", sel.status === "proposed" ? "Not released yet" : SAMPLE.release.version],
        ["Updated", DAY(sel.updatedAt)],
      ],
      roles: sel.roles,
      roleLinks: sel.roles.map((r) => ({ key: r, label: ROLE_LABEL[r] || r, href: "#/roster" })),
      isSkill: sel.kind === "skills" ? "true" : undefined,
      loads: sel.kind === "skills" ? loadsFor(sel) : null,
      evidenceLine: sel.kind === "skills" ? skillEvidence(sel) : null,
      results: sel.kind === "skills" ? skillResults(sel) : null,
      origin: originOf(sel),
      copySource: () => {
        const ok = () => logic.toast("Copied SKILL.md");
        const no = () => logic.toast("Couldn't copy. Select the text instead.", "failure");
        try {
          navigator.clipboard ? navigator.clipboard.writeText(sel.content).then(ok, no) : no();
        } catch (err) {
          no();
        }
      },
      stats:
        sel.kind === "guide"
          ? []
          : [
              ["Projects behind it", String(sel.backedBy.length)],
              ["Picked into task docs", String(sel.usage.selected)],
              ["Found by search", String(sel.usage.searched)],
              ["First-try pass where used", sel.usage.firstTry == null ? "Not used yet" : sel.usage.firstTry + "%"],
              ["Findings nearby", String(sel.usage.findings)],
            ].concat(sel.usage.fired != null ? [["Times it fired", String(sel.usage.fired)]] : []),
      backedBy: sel.backedBy.map((n) => ({ key: n, name: n, href: missionHref(n) })),
      source: sel.source,
      license: sel.license,
      versions: sel.history.map((h, i) => ({
        key: i,
        v: "v" + h[0],
        note: h[1],
        when: DAY(h[2]),
        pr: h[3] ? "PR #" + h[3] : "Not merged yet",
        current: i === 0 ? "true" : undefined,
      })),
      note:
        sel.status === "proposed"
          ? {
              text:
                "Proposed for the next knowledge release. Its factory PR #" +
                sel.pr +
                " is waiting for you in Decisions.",
              href: "#/",
            }
          : sel.pr && sel.status !== "retired"
            ? {
                text:
                  "A change to this entry is open as factory PR #" + sel.pr + ". It's waiting for you in Decisions.",
                href: "#/",
              }
            : sel.status === "retired"
              ? {
                  text: "Retired. Agents no longer get this entry; projects pinned to an earlier release still do.",
                  href: null,
                }
              : null,
      prev: nb(siblings[at - 1], "Previous"),
      next: nb(siblings[at + 1], "Next"),
      canChange: sel.status !== "retired" && !E,
      edit: E
        ? {
            step: E.step,
            text: draft,
            onText: (ev) => set({ edit: Object.assign({}, E, { text: ev.target.value }) }),
            diff,
            changed,
            noChange: changed === 0,
            toReview: () => set({ edit: Object.assign({}, E, { step: "review" }) }),
            back: () => set({ edit: Object.assign({}, E, { step: "edit" }) }),
            cancel: () => set({ edit: null }),
            file: () => {
              const n = K.nextPr;
              set({ edit: null, filed: Object.assign({}, K.filed, { [sel.slug]: n }), nextPr: n + 1 });
              logic.toast("Factory PR #" + n + " opened. It's waiting for you in Decisions.");
            },
          }
        : null,
      startEdit: () => set({ edit: { slug: sel.slug, step: "edit", text: sel.content } }),
      retire: () => {
        const n = K.nextPr;
        set({ filed: Object.assign({}, K.filed, { [sel.slug]: n }), nextPr: n + 1 });
        logic.toast("Retiring " + sel.slug + " opened factory PR #" + n + ". It's waiting in Decisions.");
      },
    };
  }

  return {
    mode,
    q: K.q,
    onQ: (ev) => set({ q: ev.target.value }),
    clearQ: () => set({ q: "" }),
    hits: hitRows,
    nav,
    navOpen: K.navOpen,
    toggleNav: () => set({ navOpen: !K.navOpen }),
    closeNav: () => K.navOpen && set({ navOpen: false }),
    here: doc ? (cat ? cat.label : doc.title) : category ? category.title : all ? all.title : "Overview",
    title: doc ? doc.title : category ? category.title : all ? all.title : "Library",
    allHref: "#/library/all",
    release: SAMPLE.release.version,
    allCurrent: mode === "all" ? "page" : undefined,
    homeCurrent: mode === "home" ? "page" : undefined,
    seeAll: hits
      ? {
          href: "#/library/all",
          label: hits.length
            ? "See all " + hits.length + (hits.length === 1 ? " result" : " results")
            : "Search all entries",
        }
      : null,
    home,
    all,
    category,
    doc,
    newMenu: [
      ["New knowledge entry", "book-open"],
      ["Write a skill", "edit"],
      ["Import a skill from a URL", "upload"],
      ["New rule", "shield-alert"],
    ].map(([l, ic]) => ({ key: l, label: l, iconEl: I(ic, 16), pick: () => logic.later(l) })),
    I,
  };
}

/** The Templates portfolio and one template's showcase page. */
/** Starting values for a new template's docs, drawn from the project it's made from. */
function draftFrom(src) {
  return {
    name: "",
    pitch: "",
    bestFor: "",
    overview: "",
    use: [""],
    avoid: [""],
    quickstart: [{ title: "Canon picks it at 0.3", text: "", code: "" }],
    notes: [],
    modules: src.plan.filter((p) => p[3] > 0).map((p) => p[0]),
    annotations: {},
    keyFiles: {},
  };
}

/** The rules a template's docs must meet before its factory PR can open (CR-W20). */
export function draftChecks(d, src) {
  const files = Object.keys(src.files);
  const paths = src.tree.filter((p) => !p.endsWith("/"));
  const keyed = Object.entries(d.keyFiles).filter(([p, why]) => why != null && files.includes(p));
  return [
    ["name", "A name and a one-line pitch", !!(d.name.trim() && d.pitch.trim()), "basics"],
    ["overview", "An overview of two or three sentences", d.overview.trim().length >= 80, "docs"],
    [
      "fit",
      "At least one \u201cUse it for\u201d and one \u201cNot for\u201d",
      d.use.some((x) => x.trim()) && d.avoid.some((x) => x.trim()),
      "docs",
    ],
    [
      "quick",
      "A quickstart with at least one step that says what happens",
      d.quickstart.some((q) => q.title.trim() && q.text.trim()),
      "docs",
    ],
    ["modules", "At least one module", d.modules.length > 0, "modules"],
    ["notes", "A note on every file in the tree", paths.every((p) => (d.annotations[p] || "").trim()), "files"],
    [
      "keys",
      "At least one key file, with why it matters",
      keyed.length > 0 && keyed.every(([, why]) => why.trim()),
      "files",
    ],
  ].map(([key, label, ok, step]) => ({ key, label, ok, step }));
}

/** template.yaml as Canon will read it, written from the draft. */
export function draftManifest(d, src) {
  const slug = slugify(d.name || "new-template");
  const mods = src.plan.filter((p) => d.modules.includes(p[0]));
  return [
    "name: " + slug,
    "version: 1   # draft",
    "package: " + src.package.toLowerCase(),
    "stack: [" + src.stack.map((x) => x.toLowerCase().replace(/\s+/g, "-")).join(", ") + "]",
    "",
    "modules:",
  ]
    .concat(mods.flatMap((p) => ["  - ref: " + p[0], "    goal: " + p[1], "    kind: " + p[2]]))
    .concat(
      ["", "rules:"],
      src.rules.map((r) => "  - " + r),
    )
    .join("\n");
}

export function templatesVals(logic, c) {
  const s = logic.state.tpl || {};
  const set = (patch) => logic.setState((x) => ({ tpl: Object.assign({}, x.tpl || {}, patch) }));
  const I = (n, z) => logic.icon(n, z);
  const ALL = SAMPLE.templates.concat(s.created || []);
  const missions = (logic.state.world && logic.state.world.missions && logic.state.world.missions.items) || [];
  const missionHref = (name) => {
    const m = missions.find((x) => x.name === name);
    return m ? "#/missions/" + m.id : null;
  };
  const pkg = s.pkg || "all";
  const packages = [...new Set(ALL.map((t) => t.package))];
  // one format for every card: "3 projects · 76% first try · 25–31% of the AI budget"
  const stat = (t) =>
    t.stats.built
      ? [
          t.stats.built + (t.stats.built === 1 ? " project" : " projects"),
          t.stats.firstTry + "% first try",
          capShare(t.stats.costLow, MISSION_AI) + "–" + capShare(t.stats.costHigh, MISSION_AI) + " of the AI budget",
        ].join(" · ")
      : "Not used yet";
  const card = (t) => ({
    key: t.slug,
    href: "#/templates/" + t.slug,
    name: t.name,
    version: "v" + t.version,
    pitch: t.pitch,
    bestFor: t.bestFor,
    stack: t.stack.slice(0, 3),
    preview: t.preview,
    url: t.url,
    package: t.package,
    draft: t.status === "draft" ? "true" : undefined,
    statusLabel: t.status === "draft" ? "Draft · PR #" + t.pr : undefined,
    stats: stat(t),
  });
  const built = ALL.reduce((a, t) => a + t.stats.built, 0);
  const f = facets({
    pool: ALL.filter((t) => pkg === "all" || t.package === pkg),
    defs: [
      { key: "stack", name: "Stack", get: (t) => t.stack, label: (v) => v },
      {
        key: "status",
        name: "Status",
        get: (t) => [t.status],
        label: (v) => (v === "draft" ? "Draft" : "Active"),
        order: ["active", "draft"],
      },
    ],
    sel: s.sel || {},
    onSel: (v) => set({ sel: v }),
    sorts: [
      { key: "built", label: "Most built", cmp: (a, b) => b.stats.built - a.stats.built },
      {
        key: "firstTry",
        label: "Best first-try pass",
        cmp: (a, b) => (b.stats.firstTry ?? -1) - (a.stats.firstTry ?? -1),
      },
      { key: "cost", label: "Lowest AI cost", cmp: (a, b) => (a.stats.costLow ?? 1e9) - (b.stats.costLow ?? 1e9) },
      { key: "updated", label: "Recently updated", cmp: (a, b) => b.updatedAt.localeCompare(a.updatedAt) },
      { key: "az", label: "A to Z", cmp: (a, b) => a.name.localeCompare(b.name) },
    ],
    sortKey: s.sort,
    onSort: (k) => set({ sort: k }),
    noun: ["template", "templates"],
  });
  const gallery = {
    summary: ALL.length + " templates · " + built + " projects built from them",
    chips: [["all", "All"]].concat(packages.map((p) => [p, p])).map(([k, l]) => ({
      key: k,
      label: l,
      count: String(k === "all" ? ALL.length : ALL.filter((t) => t.package === k).length),
      checked: String(pkg === k),
      pick: () => set({ pkg: k }),
    })),
    // facets earn their place once there are more templates than fit on one screen
    filter: ALL.length > 6 ? f.bar : Object.assign({}, f.bar, { facets: [] }),
    cards: f.items.map(card),
    empty: !f.items.length,
    ready: SAMPLE.ready.map((r) => ({
      key: r.project,
      project: r.project,
      href: r.href,
      note: "was delivered " + DAY(r.delivered) + " with a verified receipt",
      // route 110 takes the delivered project's missionId
      make: () => logic.go("#/templates/new?from=" + (r.missionId || slugify(r.project))),
    })),
  };

  const t = c.r.slug ? ALL.find((x) => x.slug === c.r.slug) || null : null;
  let one = null;
  if (t) {
    const device = s.device || "desk",
      screen = Math.min(s.screen || 0, t.screens.length - 1),
      tab = s.tab || "scaffold",
      files = Object.keys(t.files),
      docs = t.docs || {},
      keyPaths = (docs.keyFiles || []).map((k) => k[0]).filter((k) => t.files[k]),
      file = keyPaths.includes(s.file) ? s.file : keyPaths[0] || (files.includes(s.file) ? s.file : files[0] || null);
    const kb = SAMPLE.entries.filter((e) => e.template === t.slug || e.slug === t.guide);
    const ruleRows = t.rules.map((r) => SAMPLE.entries.find((e) => e.slug === r)).filter(Boolean);
    const skillRows = t.skills.map((r) => SAMPLE.entries.find((e) => e.slug === r)).filter(Boolean);
    const link = (e) => ({
      key: e.slug,
      href: "#/library/" + e.kind + "/" + e.slug,
      slug: e.slug,
      title: e.title,
      layer: layerLabel(e),
      guide: e.slug === t.guide ? "true" : undefined,
    });
    const draft = t.status === "draft";
    const screenIsPhone = (i) => t.screens[i] === "Phone";
    one = {
      slug: t.slug,
      name: t.name,
      version: "v" + t.version,
      package: t.package,
      pitch: t.pitch,
      bestFor: t.bestFor,
      stack: t.stack,
      preview: t.preview,
      url: t.url,
      source: t.source,
      sourceHref: missionHref(t.source),
      commit: t.commit.slice(0, 7),
      draft: draft ? "true" : undefined,
      statusTone: draft ? "pending" : "verified",
      statusLabel: draft ? "Draft" : "Active",
      draftNote: draft
        ? "This template is a draft. Its factory PR #" +
          t.pr +
          " is waiting for you in Decisions; projects can start from it once it merges."
        : null,
      stats: [
        [
          "Built from it",
          t.stats.built ? t.stats.built + (t.stats.built === 1 ? " project" : " projects") : "None yet",
        ],
        ["First-try pass", t.stats.firstTry == null ? "No data yet" : t.stats.firstTry + "%"],
        [
          "Typical AI cost",
          t.stats.costLow == null
            ? "No data yet"
            : capShare(t.stats.costLow, MISSION_AI) +
              "–" +
              capShare(t.stats.costHigh, MISSION_AI) +
              " of a mission\u2019s AI budget",
        ],
        ["Typical time", t.stats.days == null ? "No data yet" : t.stats.days + (t.stats.days === 1 ? " day" : " days")],
      ],
      device,
      devices: [
        ["desk", "Desk", "monitor"],
        ["phone", "Phone", "smartphone"],
      ].map(([k, l, ic]) => ({
        key: k,
        label: l,
        iconEl: I(ic, 16),
        checked: String(device === k),
        pick: () =>
          set({ device: k, screen: k === "phone" ? t.screens.length - 1 : screenIsPhone(screen) ? 0 : screen }),
      })),
      screen,
      screenName: t.screens[screen],
      screens: t.screens.map((n, i) => ({
        key: i,
        label: n,
        phone: screenIsPhone(i) ? "true" : undefined,
        current: i === screen ? "true" : undefined,
        pick: () => set({ screen: i, device: screenIsPhone(i) ? "phone" : "desk" }),
      })),
      whatYouGet: t.whatYouGet.map(([n, d], i) => ({ key: i, ref: "M" + (i + 1), name: n, desc: d })),
      builtWith: t.builtWith.map(([n, cl, st, delivered, firstTry, cost], i) => ({
        key: i,
        name: n,
        client: cl,
        state: st,
        stateLabel: st[0].toUpperCase() + st.slice(1),
        delivered: delivered ? DAY(delivered) : "In progress",
        firstTry: firstTry == null ? "—" : firstTry + "%",
        cost: cost == null ? "—" : capShare(cost, MISSION_AI) + " of its AI budget" + (delivered ? "" : " so far"),
        tone: st === "verified" || st === "delivered" ? "verified" : st === "running" ? "accent" : "pending",
        href: missionHref(n),
      })),
      // the docs breakdown every template ships with (CR-W20): overview, quickstart, structure, key files, config
      docs: {
        overview: docs.overview || t.pitch,
        use: docs.use || [],
        avoid: docs.avoid || [],
        notes: (docs.notes || []).map((n, i) => ({ key: i, tone: n.tone, text: n.text })),
        quickstart: (docs.quickstart || []).map((q, i) => ({
          key: i,
          n: String(i + 1),
          title: q.title,
          text: q.text,
          code: q.code || null,
        })),
        manifest: docs.manifest || null,
        keyFiles: (docs.keyFiles || [])
          .filter(([p]) => t.files[p])
          .map(([p, why]) => ({
            key: p,
            path: p,
            name: p.split("/").pop(),
            why,
            current: p === file ? "true" : undefined,
            pick: () => set({ file: p }),
          })),
        toc: [
          ["overview", "Overview"],
          docs.quickstart && docs.quickstart.length ? ["quickstart", "Quickstart"] : null,
          ["modules", "Modules"],
          ["structure", "File structure"],
          keyPaths.length ? ["files", "Key files"] : null,
          docs.manifest ? ["config", "Configuration"] : null,
          ["loads", "Rules, skills and knowledge"],
          ["built", "Built with it"],
          ["changelog", "Changelog"],
        ]
          .filter(Boolean)
          .map(([id, label]) => ({ key: id, id: "tpd-" + id, label })),
      },
      tab,
      tree: t.tree.map((p) => ({
        key: p,
        path: p,
        depth: p.split("/").filter(Boolean).length - 1,
        name: p.split("/").filter(Boolean).pop(),
        dir: p.endsWith("/") ? "true" : undefined,
        note: (docs.annotations || {})[p] || null,
        current: p === file ? "true" : undefined,
        key2: keyPaths.includes(p) ? "true" : undefined,
        pick: t.files[p] ? () => set({ file: p }) : undefined,
      })),
      file,
      fileText: file ? t.files[file] : null,
      fileWhy: file ? ((docs.keyFiles || []).find((k) => k[0] === file) || [])[1] || null : null,
      plan: t.plan.map(([ref, goal, wk, wave, est]) => ({
        key: ref,
        ref,
        goal,
        what:
          (t.whatYouGet.find(([n]) => goal.toLowerCase().startsWith(n.toLowerCase().split(" ")[0])) || [])[1] || null,
        workKind: wk,
        wave: wave === 0 ? "In the scaffold" : "Wave " + wave,
        est: est ? capShare(est, MODULE_AI) + " of a module cap" : "—",
      })),
      planTotal:
        capShare(
          t.plan.reduce((a, p) => a + p[4], 0),
          MISSION_AI,
        ) +
        " of a mission\u2019s AI budget, estimated across " +
        t.plan.filter((p) => p[3]).length +
        " modules",
      knowledge: kb.map(link),
      rules: ruleRows.map(link),
      skills: skillRows.map(link),
      versions: t.versions.map(([v, d, note, n], i) => ({
        key: v,
        v: "v" + v,
        when: DAY(d),
        note,
        projects: n ? n + (n === 1 ? " project" : " projects") + " on it" : "No projects on it",
        current: i === 0 ? "true" : undefined,
      })),
      start: draft ? null : () => logic.later("Start a project from " + t.name),
      propose: () => logic.later("Propose a change to " + t.name),
      newVersion: () => logic.later("New version of " + t.name + " from a project"),
    };
  }
  // a new template from a delivered project: write its docs, preview them as the page, then open the PR
  let make = null;
  if (c.id === "templateNew") {
    // ?from=<missionId>: GET /api/library/templates/sources/{missionId} (route 110)
    const srcs = SAMPLE.sources || {};
    const key =
      Object.keys(srcs).find((k) => srcs[k].missionId === c.r.from) || (srcs[c.r.from] ? c.r.from : "control-room");
    const src = srcs[key];
    if (src) {
      const saved = (s.drafts || {})[key];
      const d = Object.assign(draftFrom(src), saved ? saved.d : {});
      const checks = draftChecks(d, src);
      const opened = saved && saved.pr ? saved.pr : null;
      // TemplateDraftDto: the web makes the draft's UUID; each PUT (route 112) sends the rowVersion it last got
      const draftId =
        "01a1d700-0000-7000-8000-" +
        String(src.missionId || key)
          .replace(/[^0-9a-f]/g, "")
          .slice(-12)
          .padStart(12, "0");
      const rowVersion = saved ? saved.rowVersion || 1 : null;
      make = {
        key,
        src: {
          project: src.project,
          client: src.client,
          commit: src.commit,
          receipt: src.receipt,
          package: src.package,
          stack: src.stack,
          plan: src.plan.map(([ref, goal, kind, wave, est]) => ({ key: ref, ref, goal, kind, wave, est })),
          tree: src.tree.map((p0) => ({
            key: p0,
            path: p0,
            depth: p0.split("/").filter(Boolean).length - 1,
            name: p0.split("/").filter(Boolean).pop(),
            dir: p0.endsWith("/") ? "true" : undefined,
            file: src.files[p0] != null ? "true" : undefined,
          })),
          files: src.files,
          rules: src.rules,
          skills: src.skills,
          loads: ["rules", "skills"].reduce((o, k) => {
            o[k] = src[k]
              .map((slug) => SAMPLE.entries.find((e) => e.slug === slug))
              .filter(Boolean)
              .map((e) => ({
                key: e.slug,
                href: "#/library/" + e.kind + "/" + e.slug,
                slug: e.slug,
                title: e.title,
                layer: layerLabel(e),
              }));
            return o;
          }, {}),
        },
        draft: d,
        savedAt: saved ? saved.at : null,
        draftId,
        rowVersion,
        saveCall:
          "PUT /api/library/template-drafts/{draftId} (route 112) · " +
          draftId +
          (rowVersion ? " · rowVersion " + rowVersion : " · first save"),
        opened,
        checksFor: (x) => draftChecks(x, src),
        manifestFor: (x) => draftManifest(x, src),
        checks,
        // saving is quiet and cheap: the page keeps your typing and saves when you pause
        save: (x) => {
          const cur = logic.state.tpl || {};
          set({
            drafts: Object.assign({}, cur.drafts, {
              [key]: {
                d: x,
                at: Date.now(),
                rowVersion: ((cur.drafts || {})[key]?.rowVersion || 0) + 1,
                pr: (cur.drafts || {})[key]?.pr || null,
              },
            }),
          });
        },
        openPr: (x) => {
          const slug = slugify(x.name);
          const n = 146;
          const files = {};
          Object.keys(src.files).forEach((p0) => (files[p0] = src.files[p0]));
          const tpl = {
            slug,
            name: x.name,
            version: "1",
            status: "draft",
            pr: n,
            package: src.package,
            pitch: x.pitch,
            bestFor: x.bestFor || "Teams like " + src.client + "'s",
            stack: src.stack,
            preview: "portal",
            source: src.project,
            commit: src.commit + "0000000000000000000000000000000000",
            updatedAt: new Date().toISOString().slice(0, 10),
            stats: { built: 0, firstTry: null, costLow: null, costHigh: null, days: null, findingsPer: null },
            whatYouGet: [],
            screens: ["Overview", "Table", "Settings", "Phone"],
            url: slug + ".preview.avelco.dev",
            builtWith: [],
            rules: src.rules,
            skills: src.skills,
            guide: null,
            plan: src.plan.filter((p0) => p0[3] === 0 || x.modules.includes(p0[0])),
            tree: src.tree,
            files,
            versions: [["1", new Date().toISOString().slice(0, 10), "Draft, in PR #" + n, 0]],
            docs: {
              overview: x.overview,
              use: x.use.filter((u) => u.trim()),
              avoid: x.avoid.filter((u) => u.trim()),
              notes: x.notes
                .filter((q) => q.text.trim())
                .concat([{ tone: "warning", text: "Draft. The plan and the files may still change before v1." }]),
              quickstart: x.quickstart
                .filter((q) => q.title.trim() && q.text.trim())
                .map((q) => ({
                  title: q.title,
                  text: q.text,
                  code: q.code.trim() ? { lang: "ts", title: null, code: q.code } : null,
                })),
              manifest: draftManifest(x, src),
              annotations: x.annotations,
              keyFiles: Object.entries(x.keyFiles).filter(([, why]) => why != null && why.trim()),
            },
          };
          const cur = logic.state.tpl || {};
          const w = logic.state.world;
          logic.setState({
            tpl: Object.assign({}, cur, {
              created: (cur.created || []).filter((y) => y.slug !== slug).concat(tpl),
              // route 113 returns {prNumber, decisionRef}
              drafts: Object.assign({}, cur.drafts, {
                [key]: {
                  d: x,
                  at: Date.now(),
                  rowVersion: ((cur.drafts || {})[key]?.rowVersion || 0) + 1,
                  pr: { n, slug, decisionRef: "factory_change:" + n },
                },
              }),
            }),
            world: Object.assign({}, w, {
              factoryPrs: Object.assign({}, w.factoryPrs, {
                items: w.factoryPrs.items
                  .filter((y) => y.number !== n)
                  .concat({
                    number: n,
                    title: "Template: " + x.name + " v1, with its docs",
                    state: "open",
                    openedAt: new Date().toISOString(),
                  }),
              }),
            }),
          });
          logic.toast("Factory PR #" + n + " opened. It's in Versions and PRs for review.");
        },
        draftHref: (slug) => "#/templates/" + slug,
        prHref: "#/factory",
      };
    }
  }
  return { gallery, one, I, make };
}
