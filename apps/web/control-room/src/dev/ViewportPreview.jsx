// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.
import { Fragment } from "react";
import { css, list } from "../lib/dc";

export function ViewportPreview({ vals }) {
  const { closeVp, dockVp, ic, vp } = vals;
  return (
    <>
      {" "}
      <div className="cr-vp" role="dialog" aria-modal="true" aria-label="Viewport preview">
        {" "}
        <div className="cr-vp-bar">
          {" "}
          <span>
            {vp?.label}, {vp?.w} px
          </span>{" "}
          <div className="cr-dock-chips">
            {list(dockVp).map((v, $index) => (
              <Fragment key={$index}>
                <button type="button" className="av-chip" aria-checked={v?.checked} onClick={v?.pick}>
                  {v?.short}
                </button>
              </Fragment>
            ))}
          </div>{" "}
          <button type="button" className="lib-icon-btn" aria-label="Close preview" onClick={closeVp}>
            {ic?.x16}
          </button>{" "}
        </div>{" "}
        <iframe
          className="cr-vp-frame"
          src={vp?.src}
          title="Control room preview"
          style={css(`width: ${vp?.w ?? ""}px`)}
        ></iframe>{" "}
      </div>
    </>
  );
}
