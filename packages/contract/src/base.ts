import { oc } from "@orpc/contract";
import { errorMap } from "./errors.js";

/**
 * What each route declares beyond its method and path (API routes.md, "Rules on every
 * write"; contract.md section 2). The server reads it in Step 1's middleware.
 */
export interface RouteMeta {
  /** A write: an `Idempotency-Key` is required. */
  write: boolean;
  /** Password re-entry: credential actions only. */
  stepUp: boolean;
  /**
   * Who may call it: `operator` (a web or CLI session) or `agent` (the host tool
   * server, with a dispatch token).
   */
  caller: "operator" | "agent";
  /** The row number in API routes.md (1 to 99), or null for CR-16's three. */
  routeNo: number | null;
}

/**
 * The one base every route extends (Frontend Map v0.6, `contract/base.ts`): the typed
 * error map, and the route metadata, defaulting to an operator read.
 */
export const base = oc
  .$meta<RouteMeta>({ write: false, stepUp: false, caller: "operator", routeNo: null })
  .errors(errorMap);
