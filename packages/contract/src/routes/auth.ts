import {
  ApproveDeviceLoginInput,
  CliSessionCreatedDto,
  CliSessionDto,
  CreateCliSessionInput,
  DeviceLoginDto,
  DeviceLoginStartedDto,
  RevokeCliSessionInput,
  StartDeviceLoginInput,
} from "../dto/auth.js";
import { Page, PageQuery } from "../dto/common.js";
import { route } from "./route.js";

const tag = "Auth";

export const auth = {
  startDeviceLogin: route(
    1,
    "POST",
    "/api/cli/device-logins",
    tag,
    "Starts a CLI login with a device code and a short user code",
  )
    .input(StartDeviceLoginInput)
    .output(DeviceLoginStartedDto),
  approveDeviceLogin: route(
    2,
    "POST",
    "/api/cli/device-logins/{userCode}/approvals",
    tag,
    "You approve it in the web app. **Step-up.**",
    { stepUp: true },
  )
    .input(ApproveDeviceLoginInput)
    .output(DeviceLoginDto),
  createSession: route(
    3,
    "POST",
    "/api/cli/sessions",
    tag,
    "The CLI polls with its device code and gets its session once approved. Never replayable: a replayed key gets 409, and the token is never returned again.",
  )
    .input(CreateCliSessionInput)
    .output(CliSessionCreatedDto),
  listSessions: route(
    4,
    "GET",
    "/api/cli/sessions",
    tag,
    "List CLI sessions (stored hashed, 12 hours, operator scope)",
  )
    .input(PageQuery)
    .output(Page(CliSessionDto)),
  revokeSession: route(5, "DELETE", "/api/cli/sessions/{sessionId}", tag, "Revoke a session")
    .input(RevokeCliSessionInput)
    .output(CliSessionDto),
};
