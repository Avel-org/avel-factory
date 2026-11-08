// The decisions module's screens, for files in src/routes only (FM, What every module looks
// like). The route's loader prefetches with the same options the screen reads, so the route
// file imports only this file (UI contract section 5).
import { kitStylesheetHref } from "../../kit";
import decisionsStylesheetHref from "./decisions.css?url";

export { ensurePendingDecisions as loadDecisionsScreen } from "./api";
export { DecisionsScreen } from "./screens/DecisionsScreen";

/**
 * The screen's static stylesheets, the kit's and the module's (section 5, "Styles and loading"):
 * route /'s head links both, so the server's HTML carries them and the first paint is styled.
 * They move to the shell when a second page uses the kit (W2).
 */
export const decisionsScreenStylesheets: readonly string[] = [
  kitStylesheetHref,
  decisionsStylesheetHref,
];
