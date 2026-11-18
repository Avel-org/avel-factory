// The values modules that only some pages read load when a page first needs them (E16, T-F8):
// the first load holds Decisions and the shell. `LAZY[name]` is the module once it has loaded;
// `ensure` starts any that haven't and re-renders the control room when they arrive.
import {
  AgentRosterPage,
  FactoryLivePage,
  LibraryPage,
  OpsPage,
  ProjectOverviewPage,
  TemplateNewPage,
  TemplatePage,
  TemplatesGalleryPage,
} from "./views";
const LOADERS = {
  knowledge: () => import("./knowledge"),
  operations: () => import("./operations"),
  history: () => import("./history"),
  crew: () => import("./crew"),
  palette: () => import("./palette"),
  // the two sample-data files that only the OSA flag and sim=every read
  osa: () => import("../mock/osa.json"),
  every: () => import("../mock/contract-mock-decisions.json"),
};

export const LAZY = {};
const started = {};

// The pages operations.js renders, kept here so asking "is this one?" needs no import of it.
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

/** Which modules page `id` reads while it renders. */
export function needsFor(id, crew) {
  const n = [];
  if (["library", "knowledge", "templates", "template", "templateNew", "roster"].includes(id)) n.push("knowledge");
  if (OPS_PAGES.includes(id)) n.push("operations");
  if (id === "roster" || id === "progress" || id === "overview") n.push("history");
  if (crew || id === "watch") n.push("crew");
  return n;
}

// The view each of those pages shows. Its chunk is fetched with the values module, not after it,
// so a page costs one round trip, not two.
const VIEWS = {
  library: LibraryPage,
  knowledge: LibraryPage,
  templates: TemplatesGalleryPage,
  template: TemplatePage,
  templateNew: TemplateNewPage,
  roster: AgentRosterPage,
  progress: ProjectOverviewPage,
  live: FactoryLivePage,
  watch: FactoryLivePage,
};
OPS_PAGES.forEach((id) => {
  VIEWS[id] = OpsPage;
});

/** Starts fetching page `id`'s view. */
export function preloadView(id) {
  if (VIEWS[id]) VIEWS[id].preload();
}

/**
* Resolves once page `id`'s view and values modules have loaded, or after `ms` (a slow network shows the
 * page's skeleton instead), or when a load fails (the page then shows what it can). Null for a page that needs nothing.
 */
export function pageReady(id, ms) {
  const parts = needsFor(id).map(load);
  if (VIEWS[id]) parts.push(VIEWS[id].preload());
  if (!parts.length) return null;
  return Promise.race([Promise.all(parts), new Promise((r) => setTimeout(r, ms))]).catch(() => {});
}

/** Loads one module (once) and resolves with it. */
export function load(name) {
  started[name] ||= LOADERS[name]().then((m) => {
    LAZY[name] = m;
    return m;
  });
  return started[name];
}

/** True when every named module has loaded; otherwise starts the missing ones and asks `logic` to render again. */
export function ensure(logic, names) {
  const missing = names.filter((n) => !LAZY[n]);
  missing.forEach((n) => {
    if (!started[n]) load(n).then(() => logic.setState({}));
  });
  return !missing.length;
}
