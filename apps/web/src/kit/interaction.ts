import { useMemo, useState } from "react";

// DL's hover check (`ry`) and press state (`ou`), shared by Button and DecisionTag. Hover is
// tracked only on a fine pointer that can hover; on the server there is no window, so it's false.

export function canHover(): boolean {
  try {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  } catch {
    return false;
  }
}

export interface PressState {
  handlers: {
    onPointerDown?: () => void;
    onPointerUp?: () => void;
    onPointerCancel?: () => void;
    onPointerEnter?: () => void;
    onPointerLeave?: () => void;
  };
  pressed: boolean;
  hovered: boolean;
}

export function usePress(disabled: boolean): PressState {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const hoverable = useMemo(canHover, []);
  return {
    handlers: disabled
      ? {}
      : {
          onPointerDown: () => setPressed(true),
          onPointerUp: () => setPressed(false),
          onPointerCancel: () => setPressed(false),
          onPointerEnter: () => {
            if (hoverable) setHovered(true);
          },
          onPointerLeave: () => {
            setPressed(false);
            setHovered(false);
          },
        },
    pressed,
    hovered,
  };
}
