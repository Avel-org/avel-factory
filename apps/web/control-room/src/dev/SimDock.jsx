// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.
import { Fragment } from "react";
import { list } from "../lib/dc";

export function SimDock({ vals }) {
  const {
    dockBanner,
    dockCodes,
    dockDec,
    dockExpanded,
    dockOpen,
    dockReason,
    dockSim,
    dockStates,
    dockStream,
    dockVp,
    dockWorld,
    dockOsa,
    dockTerm,
    dockEvery,
    gapsChecked,
    ic,
    notFrame,
    pg,
    specExpanded,
    toggleDock,
    toggleGaps,
    toggleSpec,
  } = vals;
  return (
    <>
      {" "}
      <div className="cr-dock" data-ui="SimPanel">
        {dockOpen ? (
          <>
            <div
              className="cr-dock-panel"
              role="region"
              aria-label="Prototype controls"
              onKeyDown={(e) => e.key === "Escape" && (e.stopPropagation(), toggleDock())}
            >
              <div className="cr-dock-title">
                <span>
                  Prototype <small>not part of the product</small>
                </span>
                <button
                  type="button"
                  className="cr-dock-close"
                  aria-label="Close prototype controls"
                  onClick={toggleDock}
                >
                  {ic?.x16b}
                </button>
              </div>
              <div className="cr-dock-row">
                <span className="cr-dock-k">This page: {pg?.pageLabel}</span>
                <div role="radiogroup" aria-label="Page state" className="lib-seg">
                  {list(dockStates).map((s, $index) => (
                    <Fragment key={$index}>
                      <button
                        type="button"
                        role="radio"
                        className="lib-seg-btn"
                        aria-checked={s?.checked}
                        disabled={s?.disabled}
                        title={s?.title}
                        onClick={s?.pick}
                      >
                        {s?.label}
                      </button>
                    </Fragment>
                  ))}
                </div>
              </div>
              <div className="cr-dock-row">
                <span className="cr-dock-k">Inject an error</span>
                <div className="cr-dock-chips" role="radiogroup" aria-label="Error code">
                  {list(dockCodes).map((c, $index) => (
                    <Fragment key={$index}>
                      <button
                        type="button"
                        role="radio"
                        className="av-chip"
                        aria-checked={c?.checked}
                        onClick={c?.pick}
                      >
                        {c?.label}
                      </button>
                    </Fragment>
                  ))}
                </div>
              </div>
              {dockDec ? (
                <>
                  <div className="cr-dock-row">
                    <span className="cr-dock-k">Approve with a reason</span>
                    <div role="radiogroup" aria-label="Reason pattern" className="lib-seg">
                      {list(dockReason).map((s, $index) => (
                        <Fragment key={$index}>
                          <button
                            type="button"
                            role="radio"
                            className="lib-seg-btn"
                            aria-checked={s?.checked}
                            onClick={s?.pick}
                          >
                            {s?.label}
                          </button>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                  <div className="cr-dock-row">
                    <span className="cr-dock-k">Simulate on the first card</span>
                    <div className="cr-dock-chips">
                      {list(dockSim).map((s, $index) => (
                        <Fragment key={$index}>
                          <button type="button" className="av-chip" onClick={s?.pick}>
                            {s?.label}
                          </button>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
              <div className="cr-dock-row">
                <span className="cr-dock-k">Banner</span>
                <div role="radiogroup" aria-label="Banner style" className="lib-seg">
                  {list(dockBanner).map((s, $index) => (
                    <Fragment key={$index}>
                      <button
                        type="button"
                        role="radio"
                        className="lib-seg-btn"
                        aria-checked={s?.checked}
                        onClick={s?.pick}
                      >
                        {s?.label}
                      </button>
                    </Fragment>
                  ))}
                </div>
              </div>
              <div className="cr-dock-row">
                <span className="cr-dock-k">Data</span>
                <div role="radiogroup" aria-label="Data" className="lib-seg">
                  {list(dockWorld).map((s, $index) => (
                    <Fragment key={$index}>
                      <button
                        type="button"
                        role="radio"
                        className="lib-seg-btn"
                        aria-checked={s?.checked}
                        onClick={s?.pick}
                      >
                        {s?.label}
                      </button>
                    </Fragment>
                  ))}
                </div>
              </div>
              <div className="cr-dock-row">
                <span className="cr-dock-k">Decisions</span>
                <div role="radiogroup" aria-label="Decision fixtures" className="lib-seg">
                  {list(dockEvery).map((s, $index) => (
                    <Fragment key={$index}>
                      <button
                        type="button"
                        role="radio"
                        className="lib-seg-btn"
                        aria-checked={s?.checked}
                        onClick={s?.pick}
                      >
                        {s?.label}
                      </button>
                    </Fragment>
                  ))}
                </div>
              </div>
              <div className="cr-dock-row">
                <span className="cr-dock-k">OSA</span>
                <div role="radiogroup" aria-label="OSA" className="lib-seg">
                  {list(dockOsa).map((s, $index) => (
                    <Fragment key={$index}>
                      <button
                        type="button"
                        role="radio"
                        className="lib-seg-btn"
                        aria-checked={s?.checked}
                        onClick={s?.pick}
                      >
                        {s?.label}
                      </button>
                    </Fragment>
                  ))}
                </div>
              </div>
              {dockTerm ? (
                <div className="cr-dock-row">
                  <span className="cr-dock-k">Terminal</span>
                  <div role="radiogroup" aria-label="Terminal" className="lib-seg">
                    {list(dockTerm).map((s, $index) => (
                      <Fragment key={$index}>
                        <button
                          type="button"
                          role="radio"
                          className="lib-seg-btn"
                          aria-checked={s?.checked}
                          onClick={s?.pick}
                        >
                          {s?.label}
                        </button>
                      </Fragment>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="cr-dock-row">
                <span className="cr-dock-k">Event stream</span>
                <div role="radiogroup" aria-label="Event stream" className="lib-seg">
                  {list(dockStream).map((s, $index) => (
                    <Fragment key={$index}>
                      <button
                        type="button"
                        role="radio"
                        className="lib-seg-btn"
                        aria-checked={s?.checked}
                        onClick={s?.pick}
                      >
                        {s?.label}
                      </button>
                    </Fragment>
                  ))}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                className="cr-switch"
                data-ui="Switch"
                aria-checked={specExpanded}
                onClick={toggleSpec}
              >
                <span className="cr-switch-track" aria-hidden="true"></span>Show behind this screen
              </button>
              <button
                type="button"
                role="switch"
                className="cr-switch"
                data-ui="Switch"
                aria-checked={gapsChecked}
                onClick={toggleGaps}
              >
                <span className="cr-switch-track" aria-hidden="true"></span>
                Outline fields not in the contract
              </button>
              {notFrame ? (
                <>
                  <div className="cr-dock-row">
                    <span className="cr-dock-k">Preview at</span>
                    <div className="cr-dock-chips">
                      {list(dockVp).map((v, $index) => (
                        <Fragment key={$index}>
                          <button type="button" className="av-chip" onClick={v?.pick}>
                            {v?.label}
                          </button>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </>
        ) : null}
        <button type="button" className="cr-dock-toggle" aria-expanded={dockExpanded} onClick={toggleDock}>
          {ic?.sliders14}Prototype
        </button>
      </div>
    </>
  );
}
