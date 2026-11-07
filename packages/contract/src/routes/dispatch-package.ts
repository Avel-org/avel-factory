import {
  DispatchPackageArchiveDto,
  DispatchPackageDto,
  DispatchPackageFileDto,
  DispatchPackageFileInput,
  DispatchPackageInput,
} from "../dto/dispatch-package.js";
import { dispatchPackageErrorMap } from "../errors.js";
import { route } from "./route.js";

const tag = "Dispatch package";

/**
 * CR-16's three routes (accepted Nov 6). Reads only: no `Idempotency-Key` and no
 * step-up, and only an operator session may call them. Each also returns CR-16's
 * four 404 codes.
 */
export const dispatchPackage = {
  manifest: route(
    null,
    "GET",
    "/api/missions/{missionId}/dispatch-package",
    tag,
    "The package manifest (`DispatchPackageDto`)",
  )
    .errors(dispatchPackageErrorMap)
    .input(DispatchPackageInput)
    .output(DispatchPackageDto),
  file: route(
    null,
    "GET",
    "/api/missions/{missionId}/dispatch-package/files",
    tag,
    "One file, `text/markdown`",
    { outputStructure: "detailed" },
  )
    .errors(dispatchPackageErrorMap)
    .input(DispatchPackageFileInput)
    .output(DispatchPackageFileDto),
  archive: route(
    null,
    "GET",
    "/api/missions/{missionId}/dispatch-package/archive",
    tag,
    "The deterministic zip",
    { outputStructure: "detailed" },
  )
    .errors(dispatchPackageErrorMap)
    .input(DispatchPackageInput)
    .output(DispatchPackageArchiveDto),
};
