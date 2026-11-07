import { Page, PageQuery } from "../dto/common.js";
import { EvalConfigDto } from "../dto/evals.js";
import { route } from "./route.js";

const tag = "Evals, later";

export const evals = {
  listConfigs: route(92, "GET", "/api/eval/configs", tag, "Live results per config")
    .input(PageQuery)
    .output(Page(EvalConfigDto)),
};
