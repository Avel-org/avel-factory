import { Button } from "./Button";
import { HashChip } from "./HashChip";
import { type GlyphStatus, StatusGlyph } from "./StatusGlyph";

// DL's ErrorPanel (`y8`) and its copy (`AV_ERROR_COPY`, `v8`), with UI contract section 4's E1: the
// action button is drawn only when `onAction` is given. The request ID is DL's copyable chip.
// Callers always pass `body`: DL's 403 and 404 bodies are specimen text for other screens.

interface ErrorCopy {
  title: string;
  body: string;
  action: string;
  glyph: GlyphStatus;
  disabled?: boolean;
}

export const AV_ERROR_COPY: Record<number, ErrorCopy> = {
  400: {
    title: "Request rejected",
    body: "The server could not read this request. Reload and try again. If it repeats, send the request ID with your report.",
    action: "Reload",
    glyph: "stopped",
  },
  401: {
    title: "Signed out",
    body: "Your session ended. Sign in again to continue. Nothing you approved was lost.",
    action: "Sign in",
    glyph: "stopped",
  },
  403: {
    title: "Not allowed",
    body: "Releases need the release owner role. Ask an admin for it, or hand this decision to someone who has it.",
    action: "Copy link for an admin",
    glyph: "stopped",
  },
  404: {
    title: "Not found",
    body: "M14 does not exist in landing. It may have been merged into another module. Search for it or go back to the mission.",
    action: "Open mission",
    glyph: "waiting",
  },
  409: {
    title: "This changed since you opened it",
    body: "P-3 moved to version 5 while you were reading. Review the new version before approving.",
    action: "Review new version",
    glyph: "headsup",
  },
  422: {
    title: "A reason is required",
    body: "Every override goes in the log. Add a reason of at least a few words, then stop the dispatch again.",
    action: "Add reason",
    glyph: "headsup",
  },
  429: {
    title: "Too many requests",
    body: "You reached the approval rate limit. The button unlocks when the window resets.",
    action: "Retry in 42s",
    glyph: "headsup",
    disabled: true,
  },
};

const FALLBACK = AV_ERROR_COPY[400] as ErrorCopy;

export interface ErrorPanelProps {
  code?: number;
  title?: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  requestId?: string;
  compact?: boolean;
}

export function ErrorPanel({
  code = 400,
  title,
  body,
  actionLabel,
  onAction,
  requestId,
  compact,
}: ErrorPanelProps) {
  const copy = AV_ERROR_COPY[code] ?? FALLBACK;
  const hasAction = onAction !== undefined;
  return (
    <div data-ui="ErrorPanel" data-code={code} data-compact={compact ? "" : undefined} role="alert">
      <div className="av-err-head">
        <StatusGlyph status={copy.glyph} size={12} />
        <span className="av-err-code">{code}</span>
        <span className="av-err-title" data-stopped={copy.glyph === "stopped" ? "" : undefined}>
          {title || copy.title}
        </span>
      </div>
      <p className="av-err-body">{body || copy.body}</p>
      {hasAction || requestId ? (
        <div className="av-err-actions">
          {hasAction ? (
            <Button
              size="sm"
              variant={code === 409 ? "primary" : "secondary"}
              {...(copy.disabled ? { disabled: true } : {})}
              onClick={onAction}
            >
              {actionLabel || copy.action}
            </Button>
          ) : null}
          {requestId ? <HashChip kind="hash" value={requestId} length={12} prefix="req" /> : null}
        </div>
      ) : null}
    </div>
  );
}
