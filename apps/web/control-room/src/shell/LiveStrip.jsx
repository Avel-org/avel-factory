// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.
import { Fragment } from "react";
import { css, list } from "../lib/dc";

export function LiveStrip({ vals }) {
  const { lvTop, lvTopX } = vals;
  return (
    <div className="cr-lvtop" data-ui="LiveStrip">
      <div className="cr-lvtop-id">
        <h1 className="cr-lvtop-title cr-lvtop-plain">Live</h1>
        <span className="cr-lvtop-beat" data-stale={lvTop?.stale}>
          <span
            className="cr-pdot"
            data-pulse={lvTop?.pulse}
            style={css(`--dot: ${lvTop?.beatDot ?? ""}`)}
            aria-hidden="true"
          ></span>
          {lvTop?.beat}
        </span>
        {lvTopX?.offline ? (
          <>
            <span className="cr-lvtop-stream" data-state={lvTopX?.stream}>
              <span className="cr-hicon-dot" data-state={lvTopX?.stream} aria-hidden="true"></span>
              {lvTopX?.streamLabel}
            </span>
          </>
        ) : null}
      </div>
      <div role="radiogroup" aria-label="View" className="lib-seg cr-viewseg" data-ui="ViewToggle">
        {list(lvTopX?.views).map((vw, $index) => (
          <Fragment key={$index}>
            <button
              type="button"
              role="radio"
              className="lib-seg-btn"
              aria-checked={vw?.checked}
              aria-label={vw?.label}
              onClick={vw?.pick}
            >
              {vw?.iconEl}
              <span>{vw?.label}</span>
            </button>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
