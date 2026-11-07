import { Page, PageQuery } from "../dto/common.js";
import { FactoryChangeDto } from "../dto/factory.js";
import {
  CloseoutItemDto,
  CreateKbEntryInput,
  CreateRuleInput,
  CreateSkillInput,
  CreateTemplateInput,
  GetRulesBundleInput,
  KbEntryDto,
  KbEntryIdInput,
  ListCloseoutItemsInput,
  RuleDto,
  RuleIdInput,
  RulesBundleDto,
  SkillDto,
  SkillIdInput,
  TemplateDto,
  TemplateIdInput,
  UpdateKbEntryInput,
  UpdateRuleInput,
  UpdateSkillInput,
  UpdateTemplateInput,
} from "../dto/library.js";
import { route } from "./route.js";

const tag = "Library";

/** The same four routes for each kind (D1: `/api/library/<kind>`). */
const SKILLS =
  "Skills: create, or upload a skill folder; each records its source (upload, written or import)";

export const skills = {
  list: route(74, "GET", "/api/library/skills", tag, SKILLS)
    .input(PageQuery)
    .output(Page(SkillDto)),
  create: route(75, "POST", "/api/library/skills", tag, SKILLS)
    .input(CreateSkillInput)
    .output(FactoryChangeDto),
  get: route(76, "GET", "/api/library/skills/{itemId}", tag, SKILLS)
    .input(SkillIdInput)
    .output(SkillDto),
  update: route(77, "PATCH", "/api/library/skills/{itemId}", tag, SKILLS)
    .input(UpdateSkillInput)
    .output(FactoryChangeDto),
};

export const kbEntries = {
  list: route(78, "GET", "/api/library/kb-entries", tag, "Knowledge entries")
    .input(PageQuery)
    .output(Page(KbEntryDto)),
  create: route(79, "POST", "/api/library/kb-entries", tag, "Knowledge entries")
    .input(CreateKbEntryInput)
    .output(FactoryChangeDto),
  get: route(80, "GET", "/api/library/kb-entries/{itemId}", tag, "Knowledge entries")
    .input(KbEntryIdInput)
    .output(KbEntryDto),
  update: route(81, "PATCH", "/api/library/kb-entries/{itemId}", tag, "Knowledge entries")
    .input(UpdateKbEntryInput)
    .output(FactoryChangeDto),
};

export const rules = {
  list: route(82, "GET", "/api/library/rules", tag, "Rules").input(PageQuery).output(Page(RuleDto)),
  create: route(83, "POST", "/api/library/rules", tag, "Rules")
    .input(CreateRuleInput)
    .output(FactoryChangeDto),
  get: route(84, "GET", "/api/library/rules/{itemId}", tag, "Rules")
    .input(RuleIdInput)
    .output(RuleDto),
  update: route(85, "PATCH", "/api/library/rules/{itemId}", tag, "Rules")
    .input(UpdateRuleInput)
    .output(FactoryChangeDto),
  bundle: route(90, "GET", "/api/rules/{rulesVersion}/bundle", tag, "What `avel check` runs")
    .input(GetRulesBundleInput)
    .output(RulesBundleDto),
};

export const templates = {
  list: route(86, "GET", "/api/library/templates", tag, "Project templates")
    .input(PageQuery)
    .output(Page(TemplateDto)),
  create: route(87, "POST", "/api/library/templates", tag, "Project templates")
    .input(CreateTemplateInput)
    .output(FactoryChangeDto),
  get: route(88, "GET", "/api/library/templates/{itemId}", tag, "Project templates")
    .input(TemplateIdInput)
    .output(TemplateDto),
  update: route(89, "PATCH", "/api/library/templates/{itemId}", tag, "Project templates")
    .input(UpdateTemplateInput)
    .output(FactoryChangeDto),
};

export const closeoutItems = {
  list: route(
    91,
    "GET",
    "/api/missions/{missionId}/closeout-items",
    tag,
    "Confirmed findings and lesson candidates to write up",
  )
    .input(ListCloseoutItemsInput)
    .output(Page(CloseoutItemDto)),
};
