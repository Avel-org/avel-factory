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
  OpenTemplatePrInput,
  RuleDto,
  RuleIdInput,
  RulesBundleDto,
  SaveTemplateDraftInput,
  SkillDto,
  SkillIdInput,
  SkillResultsDto,
  SkillResultsInput,
  TemplateDraftDto,
  TemplateDraftIdInput,
  TemplateDto,
  TemplateIdInput,
  TemplatePrDto,
  TemplateSourceDto,
  TemplateSourceInput,
  TemplateViewDto,
  UpdateKbEntryInput,
  UpdateRuleInput,
  UpdateSkillInput,
  UpdateTemplateInput,
} from "../dto/library.js";
import { skillErrorMap, templateErrorMap } from "../errors.js";
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
    .errors(skillErrorMap)
    .input(CreateSkillInput)
    .output(FactoryChangeDto),
  get: route(76, "GET", "/api/library/skills/{itemId}", tag, SKILLS)
    .input(SkillIdInput)
    .output(SkillDto),
  update: route(77, "PATCH", "/api/library/skills/{itemId}", tag, SKILLS)
    .input(UpdateSkillInput)
    .output(FactoryChangeDto),
  /** CR-W16: does loading it help? Per version, and against comparable attempts without it. */
  results: route(
    null,
    "GET",
    "/api/library/skills/{itemId}/results",
    tag,
    "Results per version and a baseline without the skill (CR-W16)",
  )
    .input(SkillResultsInput)
    .output(SkillResultsDto),
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
    .errors(templateErrorMap)
    .input(CreateTemplateInput)
    .output(FactoryChangeDto),
  get: route(88, "GET", "/api/library/templates/{itemId}", tag, "Project templates")
    .input(TemplateIdInput)
    .output(TemplateViewDto),
  update: route(89, "PATCH", "/api/library/templates/{itemId}", tag, "Project templates")
    .input(UpdateTemplateInput)
    .output(FactoryChangeDto),
  /** CR-W21 section 3: what a template is cut from. */
  source: route(
    null,
    "GET",
    "/api/library/templates/sources/{missionId}",
    tag,
    "A delivered project to cut a template from (CR-W21, CR-W22)",
  )
    .errors(templateErrorMap)
    .input(TemplateSourceInput)
    .output(TemplateSourceDto),
  getDraft: route(
    null,
    "GET",
    "/api/library/template-drafts/{draftId}",
    tag,
    "A template draft (CR-W21)",
  )
    .input(TemplateDraftIdInput)
    .output(TemplateDraftDto),
  saveDraft: route(
    null,
    "PUT",
    "/api/library/template-drafts/{draftId}",
    tag,
    "Create or save a template draft, bound to its row version (CR-W21)",
  )
    .errors(templateErrorMap)
    .input(SaveTemplateDraftInput)
    .output(TemplateDraftDto),
  openDraftPr: route(
    null,
    "POST",
    "/api/library/template-drafts/{draftId}/pull-requests",
    tag,
    "Check the draft and open its factory PR, approved in Decisions (CR-W21)",
  )
    .errors(templateErrorMap)
    .input(OpenTemplatePrInput)
    .output(TemplatePrDto),
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
