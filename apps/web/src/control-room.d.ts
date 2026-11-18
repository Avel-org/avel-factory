declare module "*/control-room/src/main" {
  import type { ComponentType } from "react";

  export interface ControlRoomProps {
    showDock?: boolean;
    bannerStyle?: string;
  }

  export const ControlRoom: ComponentType<ControlRoomProps>;
}
