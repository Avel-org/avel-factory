import { Page, PageQuery } from "../dto/common.js";
import {
  FactoryChangeDto,
  FactoryVersionViewDto,
  MergeFactoryChangeInput,
} from "../dto/factory.js";
import { route } from "./route.js";

const tag = "Factory repo";

export const factory = {
  listVersions: route(
    71,
    "GET",
    "/api/factory/versions",
    tag,
    "Merged commits, which missions are on each, and knowledge releases",
  )
    .input(PageQuery)
    .output(Page(FactoryVersionViewDto)),
  listChanges: route(72, "GET", "/api/factory/changes", tag, "Open PRs")
    .input(PageQuery)
    .output(Page(FactoryChangeDto)),
  mergeChange: route(73, "POST", "/api/factory/changes/{changeId}/merges", tag, "Approve and merge")
    .input(MergeFactoryChangeInput)
    .output(FactoryChangeDto),
};
