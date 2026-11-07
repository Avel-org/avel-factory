import { FactoryChangeDto } from "../dto/factory.js";
import { GetPlanInput, PlanViewDto, PutRosterInput, RosterDto } from "../dto/plan.js";
import { route } from "./route.js";

const tag = "Plan and roster";

export const plan = {
  get: route(46, "GET", "/api/missions/{missionId}/plan", tag, "`?version=`")
    .input(GetPlanInput)
    .output(PlanViewDto),
};

export const roster = {
  get: route(47, "GET", "/api/roster", tag, "The roster").output(RosterDto),
  put: route(
    48,
    "PUT",
    "/api/roster",
    tag,
    "Replaces the whole roster as a new version, filed as a factory-repo PR; running missions keep theirs",
  )
    .input(PutRosterInput)
    .output(FactoryChangeDto),
};
