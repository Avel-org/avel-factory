import { hostLogic } from "../lib/dc";
import { ControlRoomLogic } from "./logic";
import { ControlRoomView } from "./ControlRoomView";

const Host = hostLogic(ControlRoomLogic, ControlRoomView, "ControlRoom");

/**
 * The control room: the logic (logic.js) hosted with its view (ControlRoomView.jsx). React 19 drops
 * defaultProps, so the defaults are parameter defaults. The Prototype dock shows only in a dev build.
 */
export function ControlRoom({ showDock = import.meta.env.DEV, bannerStyle = "stats", ...props }) {
  return <Host showDock={showDock} bannerStyle={bannerStyle} {...props} />;
}
