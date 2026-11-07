import { type ReactNode, type RefObject, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

// DL's Dialog (`Uo`) and its focus handling (`Dy`), the frame ReasonDialog draws in. It isn't one
// of the kit's components in UI contract section 4, so index.ts doesn't export it.

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

/** DL's `Dy`: focus the autofocus field, trap Tab, close on Escape, lock the page's scroll. */
function useDialogFocus(
  open: boolean,
  onClose: (() => void) | undefined,
  panel: RefObject<HTMLDivElement | null>,
) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = panel.current;
    const focusable = () => (node ? Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)) : []);
    const frame = requestAnimationFrame(() => {
      const first = node?.querySelector<HTMLElement>("[data-autofocus]") ?? focusable()[0];
      first?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown, true);
      document.documentElement.style.overflow = overflow;
      previous?.focus?.({ preventScroll: true });
    };
  }, [open, panel]);
}

export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  dataUi?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dataUi = "Dialog",
}: DialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialogFocus(open, onClose, panel);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: DL's scrim closes the dialog on a press outside it; Escape and the Close button do the same from the keyboard. */}
      <div
        data-ui="DialogScrim"
        className="av-scrim"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose?.();
        }}
      >
        <div
          ref={panel}
          data-ui={dataUi}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="av-dialog"
          data-size={size}
        >
          <div className="av-dialog-head">
            <div className="av-dialog-titles">
              <h2 id={titleId} className="av-dialog-title">
                {title}
              </h2>
              {description ? <p className="av-dialog-desc">{description}</p> : null}
            </div>
            <button type="button" className="av-icon-close" onClick={onClose} aria-label="Close">
              <Icon name="x" size={16} />
            </button>
          </div>
          {children ? <div className="av-dialog-body">{children}</div> : null}
          {footer ? <div className="av-dialog-foot">{footer}</div> : null}
        </div>
      </div>
    </>,
    document.body,
  );
}
