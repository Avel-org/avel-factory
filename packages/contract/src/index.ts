/**
 * `@avel/contract`: the only API both teams build against (contract.md section 1).
 *
 * - E1 value lists: `value-lists.ts`
 * - E2 DTOs and inputs: `dto/` (one file per route group)
 * - E3 the oRPC route definitions: `routes/`, over the one base in `base.ts`
 * - E4 the error map: `errors.ts`
 * - E5 the event-kind to owning-module map: `events.ts`
 * - E6 the completion report schema: `completion-report.ts`
 * - E7 no rep fields anywhere
 *
 * English issue messages (S1-6 amendment): classic zod sets English as the default locale;
 * zod/mini doesn't. This entry sets the same default, so S1-3's messages stay as they were
 * for everything that imports `@avel/contract` (the server, the CLI, the mock, tools/docs,
 * the contract's tests). The subpaths (D58) don't set it, so the web's bundle doesn't carry
 * the locale. An explicit z.config() locale still wins, as it does with classic. zod reads
 * the locale when it reports an issue, not when it builds a schema, so it doesn't matter
 * that this runs after the schemas below are built.
 */
import * as z from "zod/mini";

if (!z.core.globalConfig.localeError) z.config(z.locales.en());

export type { RouteMeta } from "./base.js";
export * from "./completion-report.js";
export * from "./dto/agent.js";
export * from "./dto/audit.js";
export * from "./dto/auth.js";
export * from "./dto/clients.js";
export * from "./dto/common.js";
export * from "./dto/decisions.js";
export * from "./dto/dispatch-package.js";
export * from "./dto/dispatches.js";
export * from "./dto/evals.js";
export * from "./dto/events-and-traces.js";
export * from "./dto/factory.js";
export * from "./dto/gate0.js";
export * from "./dto/gates.js";
export * from "./dto/health.js";
export * from "./dto/library.js";
export * from "./dto/metering.js";
export * from "./dto/missions.js";
export * from "./dto/packages.js";
export * from "./dto/plan.js";
export * from "./dto/receipts.js";
export * from "./dto/your-work.js";
export * from "./errors.js";
export * from "./events.js";
export { type Contract, contract } from "./routes/index.js";
export { type RouteOptions, route } from "./routes/route.js";
export * from "./value-lists.js";
