// The kit (UI contract section 4): DL's components with their data-ui names, taking plain props.
// Named exports only (Frontend Map v0.6, What every module looks like).
// kitStylesheetHref is the URL of the kit's one static stylesheet, kit.css, which the page links
// (UI contract section 4, "The kit's styles"): the kit renders no style element and writes no CSS
// in JS.
import kitStylesheetHref from "./kit.css?url";

export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from "./Button";
export {
  AV_DECISION_VARIANTS,
  type DecisionState,
  DecisionTag,
  type DecisionTagProps,
  type DecisionVariant,
} from "./DecisionTag";
export { AV_ERROR_COPY, ErrorPanel, type ErrorPanelProps } from "./ErrorPanel";
export { HashChip, type HashChipProps } from "./HashChip";
export { Icon, type IconName, type IconProps } from "./Icon";
export type { ReasonDialogProps } from "./ReasonDialog";

/**
 * R7: the reason dialog loaded lazily through the kit's index, never by a deep import. It's the
 * index's only way to the dialog (revision 13): the index exports no ReasonDialog value, only its
 * props type, so ReasonDialog and Dialog build into a chunk of their own, outside `/`'s first load.
 * It's R7's `() => import("./ReasonDialog")` as written: the arrow minifies smaller than a function.
 */
export const loadReasonDialog = (): Promise<{
  ReasonDialog: typeof import("./ReasonDialog").ReasonDialog;
}> => import("./ReasonDialog");
export { type GlyphStatus, StatusGlyph, type StatusGlyphProps } from "./StatusGlyph";
export { Tag, type TagProps, type TagToneName } from "./Tag";
export { WidgetState, type WidgetStateProps } from "./WidgetState";
export { kitStylesheetHref };
