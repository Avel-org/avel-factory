import type { CSSProperties, ReactNode } from "react";
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
  const frame: CSSProperties = {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    justifyContent: "center",
  };
  const prose: CSSProperties = {
    margin: 0,
    color: "var(--av-muted)",
    fontSize: "var(--av-fs-body)",
    lineHeight: "var(--av-lh-body)",
    textWrap: "pretty",
    maxWidth: "52ch",
  };

  if (state === "loading") {
    return (
      // biome-ignore lint/a11y/useAriaPropsSupportedByRole: DL's loading state as it is: aria-label on a div with no role (reported to Zero and Leah).
      <div
        data-ui="WidgetState"
        data-state="loading"
        aria-busy="true"
        aria-label="Loading"
        style={{ ...frame, justifyContent: "flex-start", gap: 10 }}
      >
        {Array.from({ length: LINES }, (_, i) => (
          <span
            // The skeleton lines are fixed and never reorder.
            // biome-ignore lint/suspicious/noArrayIndexKey: see above.
            key={i}
            data-skeleton=""
            style={{
              display: "block",
              height: i === 0 ? 22 : 14,
              width: i === 0 ? "42%" : i % 2 ? "86%" : "64%",
              borderRadius: "var(--av-radius-stamp)",
              background: "var(--av-skeleton)",
              animation: "av-skeleton 1.6s var(--av-ease) infinite",
            }}
          />
        ))}
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div
        data-ui="WidgetState"
        data-state="empty"
        style={{
          flex: "1 1 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          textAlign: "center",
          boxSizing: "border-box",
          padding: "48px 24px",
          borderRadius: "var(--av-radius-faceplate)",
          border: "1px dashed var(--av-hairline-strong)",
          background: "var(--av-hollow)",
        }}
      >
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 32,
            height: 32,
            marginBottom: 4,
            borderRadius: "var(--av-radius-tile)",
            background: "var(--av-float)",
            boxShadow: "inset 0 0 0 1px var(--av-hairline)",
            color: "var(--av-subtle)",
          }}
        >
          <Icon name={icon ?? "inbox"} size={16} />
        </span>
        {title ? (
          <h4
            style={{
              margin: 0,
              maxWidth: 420,
              fontSize: "var(--av-fs-title)",
              lineHeight: "var(--av-lh-title)",
              fontWeight: "var(--av-weight-title)",
              textWrap: "balance",
            }}
          >
            {title}
          </h4>
        ) : null}
        <p
          style={{
            margin: 0,
            maxWidth: "38ch",
            fontSize: "var(--av-fs-caption)",
            lineHeight: "var(--av-lh-caption)",
            color: "var(--av-muted)",
            textWrap: "pretty",
          }}
        >
          {message || "Nothing here yet."}
        </p>
        {actionLabel ? (
          <div style={{ marginTop: 8 }}>
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
      <div
        data-ui="WidgetState"
        data-state="staleVersion"
        role="alert"
        style={{
          ...frame,
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          padding: "10px 12px",
          borderRadius: "var(--av-radius-control)",
          background: "var(--av-inset)",
          minHeight: 0,
        }}
      >
        <StatusGlyph status="headsup" size={14} />
        <span style={{ flex: "1 1 200px", fontWeight: 500 }}>
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
      <div
        data-ui="WidgetState"
        data-state="error"
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        <div
          role="status"
          style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
        >
          <StatusGlyph status="stalled" size={12} />
          <span style={{ color: "var(--av-muted)", fontWeight: 500, flex: "1 1 auto" }}>
            {message || `Stale, last good value ${ago(lastGoodAge)} old`}
          </span>
          {requestId ? <RequestIdChip requestId={requestId} /> : null}
          <Button size="sm" variant="ghost" icon="refresh-cw" onClick={onAction}>
            {actionLabel || "Retry"}
          </Button>
        </div>
        <div
          style={{
            opacity: 0.72,
            outline: "1px dashed var(--av-hairline-strong)",
            outlineOffset: 4,
            borderRadius: 4,
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div data-ui="WidgetState" data-state="error" role="alert" style={frame}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <StatusGlyph status="stopped" size={12} />
        <span style={{ fontWeight: 500, color: "var(--av-stopped)" }}>Couldn't load</span>
      </div>
      <p style={prose}>{message || "The server did not answer. Nothing was changed."}</p>
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
