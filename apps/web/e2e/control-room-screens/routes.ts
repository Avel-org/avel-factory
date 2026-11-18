/**
 * Every route in the export's page registry (PAGES in control-room/src/app/logic.js), each $param
 * filled from the sample world (control-room/src/mock/*.json). `title` is what the page's first
 * h1 shows once it has loaded. A project page (any tab of one mission) shows the mission's name.
 */
const RUNNING = "01a1912f-ee80-709f-891e-7d29547e91a0"; // Spring launch site
const ONBOARDING = "01a1b016-1680-7ea7-9b27-8f75c199eac7"; // Fleet portal
const AWAITING = "01a17770-2280-7db5-9be9-18411454e558"; // Booking fix
const BLUME = "01a100fd-de80-73fb-b3d1-fa439f3a8218"; // Blume Studio

export interface ScreenRoute {
  id: string;
  hash: string;
  title: RegExp;
}

export const ROUTES: readonly ScreenRoute[] = [
  { id: "decisions", hash: "#/", title: /^Decisions$/ },
  { id: "projects", hash: "#/missions", title: /^All projects$/ },
  { id: "newProject", hash: "#/missions/new", title: /^New project$/ },
  { id: "canon", hash: `#/missions/${ONBOARDING}/onboarding`, title: /^Fleet portal$/ },
  { id: "progress", hash: `#/missions/${RUNNING}`, title: /Spring launch site/ },
  { id: "watch", hash: `#/missions/${RUNNING}/live`, title: /^Spring launch site$/ },
  { id: "release", hash: `#/missions/${AWAITING}/release`, title: /^Booking fix$/ },
  { id: "receipt", hash: `#/missions/${AWAITING}/receipt`, title: /^Booking fix$/ },
  { id: "module", hash: `#/missions/${RUNNING}/modules/M3`, title: /^Spring launch site$/ },
  { id: "dispatch", hash: `#/missions/${RUNNING}/dispatch`, title: /^Spring launch site$/ },
  { id: "plan", hash: `#/missions/${RUNNING}/plan`, title: /^Spring launch site$/ },
  { id: "gates", hash: `#/missions/${RUNNING}/gates`, title: /^Spring launch site$/ },
  { id: "files", hash: `#/missions/${RUNNING}/files`, title: /^Spring launch site$/ },
  { id: "findings", hash: `#/missions/${RUNNING}/findings`, title: /^Spring launch site$/ },
  { id: "toFile", hash: "#/drive", title: /Drive/ },
  { id: "file", hash: "#/files/u-1", title: /logo-acme\.svg|File/ },
  { id: "uploadStates", hash: "#/drive/states", title: /Upload states/ },
  { id: "live", hash: "#/live", title: /^Live$/ },
  { id: "clients", hash: "#/clients", title: /^Clients$/ },
  { id: "client", hash: `#/clients/${BLUME}`, title: /Blume Studio/ },
  { id: "knowledge", hash: "#/library/knowledge?layer=client", title: /Client knowledge/ },
  { id: "library", hash: "#/library", title: /^Library$/ },
  { id: "libraryAll", hash: "#/library/all", title: /Library|All/ },
  { id: "libraryItem", hash: "#/library/knowledge/stripe-checkout", title: /Stripe checkout/ },
  { id: "templates", hash: "#/templates", title: /^Templates$/ },
  { id: "template", hash: "#/templates/landing-page", title: /Landing page/ },
  { id: "templateNew", hash: "#/templates/new", title: /^New template$/ },
  { id: "factory", hash: "#/factory", title: /Versions and PRs/ },
  { id: "roster", hash: "#/roster", title: /Agents/ },
  { id: "activity", hash: "#/activity", title: /Activity log/ },
  { id: "settings", hash: "#/settings", title: /^Settings$/ },
];

export const VIEWS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "phone", width: 390, height: 844 },
] as const;

export const THEMES = ["light", "night"] as const;
