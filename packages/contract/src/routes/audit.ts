import { ActivityDto } from "../dto/audit.js";
import { Page, PageQuery } from "../dto/common.js";
import { route } from "./route.js";

const tag = "Audit";

export const audit = {
  activity: route(93, "GET", "/api/activity", tag, "The activity log, overrides included")
    .input(PageQuery)
    .output(Page(ActivityDto)),
};
