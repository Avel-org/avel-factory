import { Page, PageQuery } from "../dto/common.js";
import { EvalConfigDto, EvalRunDto, EvalRunIdInput } from "../dto/evals.js";
import { route } from "./route.js";

const tag = "Evals, later";

export const evals = {
  listConfigs: route(92, "GET", "/api/eval/configs", tag, "Live results per config")
    .input(PageQuery)
    .output(Page(EvalConfigDto)),
  /** CR-W16: "See the report" on a skill PR's eval run. */
  getRun: route(null, "GET", "/api/eval/runs/{runId}", tag, "One eval run and its results (CR-W16)")
    .input(EvalRunIdInput)
    .output(EvalRunDto),
};
