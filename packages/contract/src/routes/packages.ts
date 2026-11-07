import { Page, PageQuery } from "../dto/common.js";
import { PackageDto } from "../dto/packages.js";
import { route } from "./route.js";

const tag = "Packages";

export const packages = {
  list: route(
    18,
    "GET",
    "/api/packages",
    tag,
    "A paged list; read-only (packages change through a factory PR)",
  )
    .input(PageQuery)
    .output(Page(PackageDto)),
};
