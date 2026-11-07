import { agent } from "./agent.js";
import { audit } from "./audit.js";
import { auth } from "./auth.js";
import { clients, repoConnections } from "./clients.js";
import { decisions } from "./decisions.js";
import { dispatchPackage } from "./dispatch-package.js";
import { dispatches } from "./dispatches.js";
import { evals } from "./evals.js";
import { events, traces } from "./events.js";
import { factory } from "./factory.js";
import { gate0 } from "./gate0.js";
import { findings, gates } from "./gates.js";
import { health } from "./health.js";
import { closeoutItems, kbEntries, rules, skills, templates } from "./library.js";
import { metering } from "./metering.js";
import { missions } from "./missions.js";
import { packages } from "./packages.js";
import { plan, roster } from "./plan.js";
import { deliveries, receipts } from "./receipts.js";
import { notes, operator, timeEntries } from "./your-work.js";

/**
 * The contract: 102 routes (contract.md section 2), the 99 of API routes.md and
 * CR-16's 3. The server implements it (`implement(contract)`), and the web and the
 * CLI type their clients from it.
 */
export const contract = {
  auth,
  health,
  clients,
  repoConnections,
  packages,
  missions,
  gate0,
  plan,
  roster,
  dispatches,
  decisions,
  gates,
  findings,
  receipts,
  deliveries,
  events,
  traces,
  operator,
  timeEntries,
  notes,
  metering,
  factory,
  skills,
  kbEntries,
  rules,
  templates,
  closeoutItems,
  evals,
  audit,
  agent,
  dispatchPackage,
};
export type Contract = typeof contract;
