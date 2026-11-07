import type { ReactNode } from "react";
import { ago } from "./ago";
import { Button } from "./Button";
import { HashChip } from "./HashChip";
import { Icon, type IconName } from "./Icon";
import { StatusGlyph } from "./StatusGlyph";

// DL's WidgetState (`ly`, with its empty card `x8`), with UI contract section 4's W1: `requestId`
// draws the request ID chip under the error state's message. Not ported: `needs`, `height`,
// `lines` (DL's default of 3 skeleton lines is kept) and `compact`, and the states
// `notConfigured` and `populated`.

export interface WidgetStateProps {
  state: "loading" | "empty" | "error" | "staleVersion";
  title?: string;
  message?: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
  /** In ms. With `children`, the error state keeps them on screen as the last good value. */
  lastGoodAge?: number;
  requestId?: string;
  children?: ReactNode;
}

const LINES = 3;

function RequestIdChip({ requestId }: { requestId: string }) {
  return <HashChip kind="hash" value={requestId} length={12} prefix="req" />;
}

export function WidgetState({
  state,
  title,
  message,
  icon,
  actionLabel,
  onAction,
  lastGoodAge,
  requestId,
  children,
}: WidgetStateProps) {
  if (state === "loading") {
    return (
      // biome-ignore lint/a11y/useAriaPropsSupportedByRole: DL's loading state as it is: aria-label on a div with no role (reported to Zero and Leah).
      <div
        data-ui="WidgetState"
        data-state="loading"
        aria-busy="true"
        aria-label="Loading"
        className="av-ws-frame"
      >
        {Array.from({ length: LINES }, (_, i) => (
          // The skeleton lines are fixed and never reorder; kit.css sizes each by its position.
          // biome-ignore lint/suspicious/noArrayIndexKey: see above.
          <span key={i} data-skeleton="" />
        ))}
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div data-ui="WidgetState" data-state="empty">
        <span className="av-ws-empty-icon">
          <Icon name={icon ?? "inbox"} size={16} />
        </span>
        {title ? <h4 className="av-ws-empty-title">{title}</h4> : null}
        <p className="av-ws-empty-message">{message || "Nothing here yet."}</p>
        {actionLabel ? (
          <div className="av-ws-empty-action">
            <Button size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  if (state === "staleVersion") {
    return (
      <div data-ui="WidgetState" data-state="staleVersion" role="alert" className="av-ws-frame">
        <StatusGlyph status="headsup" size={14} />
        <span className="av-ws-stale-message">
          {message || "This changed since you opened it."}
        </span>
        <Button size="sm" variant="secondary" onClick={onAction}>
          {actionLabel || "Review new version"}
        </Button>
      </div>
    );
  }

  // The error state. With rows on screen, they stay under DL's stale band.
  if (children != null && lastGoodAge != null) {
    return (
      <div data-ui="WidgetState" data-state="error" className="av-ws-band">
        <div role="status" className="av-ws-band-row">
          <StatusGlyph status="stalled" size={12} />
          <span className="av-ws-band-text">
            {message || `Stale, last good value ${ago(lastGoodAge)} old`}
          </span>
          <Button size="sm" variant="ghost" icon="refresh-cw" onClick={onAction}>
            {actionLabel || "Retry"}
          </Button>
        </div>
        {/* W1: the request ID on its own line under the status row, in the band's gap. */}
        {requestId ? (
          <div>
            <RequestIdChip requestId={requestId} />
          </div>
        ) : null}
        <div className="av-ws-lastgood">{children}</div>
      </div>
    );
  }

  return (
    <div data-ui="WidgetState" data-state="error" role="alert" className="av-ws-frame">
      <div className="av-ws-error-head">
        <StatusGlyph status="stopped" size={12} />
        <span className="av-ws-error-title">Couldn't load</span>
      </div>
      <p className="av-ws-prose">{message || "The server did not answer. Nothing was changed."}</p>
      {requestId ? (
        <div>
          <RequestIdChip requestId={requestId} />
        </div>
      ) : null}
      <div>
        <Button size="sm" icon="refresh-cw" onClick={onAction}>
          {actionLabel || "Retry"}
        </Button>
      </div>
    </div>
  );
}
