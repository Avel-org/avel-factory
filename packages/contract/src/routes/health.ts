import { DoctorDto, HealthDto } from "../dto/health.js";
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
};
