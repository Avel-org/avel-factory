import { z } from "zod";
import { Placeholder } from "./common.js";

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
