import type { HTTPMethod, HTTPPath } from "@orpc/contract";
import { base, type RouteMeta } from "../base.js";

export interface RouteOptions {
  stepUp?: boolean;
  caller?: RouteMeta["caller"];
  /** For routes whose response carries headers (`ETag`) or a binary body. */
  outputStructure?: "compact" | "detailed";
}

/**
 * One route on the base: its row number, method, path, group tag and its row's
 * "What it does", word for word, as the summary. A non-GET method is a write, and a
 * POST creates something, so it answers 201 (Frontend Map v0.6, Contract conventions).
 */
export function route(
  routeNo: number | null,
  method: HTTPMethod,
  path: HTTPPath,
  tag: string,
  summary: string,
  options: RouteOptions = {},
) {
  return base
    .meta({
      write: method !== "GET",
      stepUp: options.stepUp ?? false,
      caller: options.caller ?? "operator",
      routeNo,
    })
    .route({
      method,
      path,
      tags: [tag],
      summary,
      successStatus: method === "POST" ? 201 : 200,
      ...(options.outputStructure ? { outputStructure: options.outputStructure } : {}),
    });
}
