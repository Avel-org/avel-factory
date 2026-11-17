import { hostLogic } from "../lib/dc";
import { ControlRoomLogic } from "./logic";
import { ControlRoomView } from "./ControlRoomView";

/** The control room: the logic (logic.js) hosted with its view (ControlRoomView.jsx). */
export const ControlRoom = hostLogic(ControlRoomLogic, ControlRoomView, "ControlRoom");
ControlRoom.defaultProps = { showDock: true, bannerStyle: "stats" };
