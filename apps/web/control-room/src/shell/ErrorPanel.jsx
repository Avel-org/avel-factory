// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.
import { Fragment } from "react";
import { list } from "../lib/dc";
import { EmptyArtFor } from "../kit/EmptyState";

// each error code's scene: who you are (401), what you can't open (403/404), the line being down (offline)
const ERR_SCENE = { 401: "sessionExpired", 403: "accessDenied", 404: "blockedPage", offline: "offline" };

export function ErrorPanel({ vals }) {
  const { err } = vals;
  return (
    <div className="lib-card av-err-card">
      {" "}
      <div className="av-err" data-ui="ErrorPanel" data-code={err?.code} role="alert">
        <EmptyArtFor scene={ERR_SCENE[err?.code] || "loadFailed"} size="sm" />
        <div className="av-err-head">
          {err?.glyphEl}
          <span className="av-err-code">{err?.codeLabel}</span>
          <span className="av-err-title" data-tone={err?.tone}>
            {err?.title}
          </span>
        </div>
        <p className="av-err-body">{err?.body}</p>
        {err?.hasMoves ? (
          <>
            <div className="av-err-moves">
              {list(err?.moves).map((mv, $index) => (
                <Fragment key={$index}>
                  <button
                    type="button"
                    className="av-btn"
                    data-ui="Button"
                    data-size="sm"
                    data-variant="secondary"
                    onClick={mv?.onClick}
                  >
                    {mv?.label}
                  </button>
                </Fragment>
              ))}
            </div>
          </>
        ) : null}
        <div className="av-err-actions">
          <button
            type="button"
            className="av-btn"
            data-ui="Button"
            data-size="sm"
            data-variant={err?.variant}
            disabled={err?.disabled}
            aria-describedby={err?.reasonId}
            onClick={err?.onAction}
          >
            {err?.action}
          </button>
          <span className="av-hash" data-ui="HashChip">
            <span className="av-hash-pre">req</span>
            {err?.reqId}
          </span>
        </div>
        {err?.reason ? (
          <>
            <span id="cr-err-reason" className="av-btn-reason">
              {err?.reason}
            </span>
          </>
        ) : null}
      </div>{" "}
    </div>
  );
}
