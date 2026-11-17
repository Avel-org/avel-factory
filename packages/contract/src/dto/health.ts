import * as z from "zod/mini";
import { AlertKind, AlertSeverity } from "../value-lists.js";
import { IsoTime, Placeholder, Uuid } from "./common.js";
import { PlainShort } from "./plain.js";

/** Health (routes 6 and 7). */

/** Route 6: "Health". The row names no field, so the body is empty: 200 means healthy. */
export const HealthDto = z.object({});
export type HealthDto = z.infer<typeof HealthDto>;

/**
 * Route 7: "Database, Docker and gVisor, proxies, token expiry dates, the last
 * isolation run; also room health". One key per item in the row; what each holds
 * is open (no doc gives it), so each is a placeholder.
 */
export const DoctorDto = z.object({
  database: Placeholder,
  docker: Placeholder,
  gvisor: Placeholder,
  proxies: Placeholder,
  tokenExpiries: Placeholder,
  lastIsolationRun: Placeholder,
  rooms: Placeholder,
});
export type DoctorDto = z.infer<typeof DoctorDto>;

/**
 * A factory alert (CR-W5): the design's alert list, minus the budget alerts. `key` is
 * stable while the alert stands (`<kind>:<subject id>`), so `system.alert.cleared` names it.
 */
export const AlertDto = z.object({
  key: z.string(),
  kind: z.enum(AlertKind),
  severity: z.enum(AlertSeverity),
  missionId: z.nullable(Uuid),
  plain: PlainShort,
  since: IsoTime,
});
export type AlertDto = z.infer<typeof AlertDto>;

/**
 * `GET /api/status` (CR-W5, Health group): the top bar, the home screen's hero counts and the
 * CLI's `avel watch` header, in one read. `stallAfterMs` is the `no_progress` alert's own
 * setting (10 minutes today), so the screen and the alert use one number. `lastSeq` is the
 * stream position the snapshot reflects. No money.
 */
export const StatusDto = z.object({
  slots: z.object({ busy: z.int(), total: z.int() }),
  needsYouCount: z.int(),
  alerts: z.array(AlertDto),
  stallAfterMs: z.int().check(z.minimum(1)),
  lastSeq: z.int(),
  at: IsoTime,
});
export type StatusDto = z.infer<typeof StatusDto>;
