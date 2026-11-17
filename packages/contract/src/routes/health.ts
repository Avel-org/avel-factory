import { DoctorDto, HealthDto, StatusDto } from "../dto/health.js";
import { route } from "./route.js";

const tag = "Health";

export const health = {
  health: route(6, "GET", "/api/health", tag, "Health").output(HealthDto),
  doctor: route(
    7,
    "GET",
    "/api/doctor",
    tag,
    "Database, Docker and gVisor, proxies, token expiry dates, the last isolation run; also room health",
  ).output(DoctorDto),
  /** CR-W5: slots, what needs you and alerts, in one read. */
  status: route(
    null,
    "GET",
    "/api/status",
    tag,
    "Slots, what needs you and alerts, for the top bar and `avel watch` (CR-W5)",
  ).output(StatusDto),
};
