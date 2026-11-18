// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.
import { Fragment } from "react";
import { css, list } from "../../lib/dc";
import { CommitGraph } from "../../kit/Trail";

export function ProjectOverviewPage({ vals }) {
  const { ov } = vals;
  return (
    <div className="cr-ov" data-ui="ProjectOverview">
      <div className="cr-next" data-ui="UpNext">
        {ov?.nextGlyph}
        <b>Up next</b>
        <span className="cr-next-items">
          {list(ov?.nextItems).map((nx, $index) => (
            <Fragment key={$index}>
              <a className="cr-next-item" href={nx?.href}>
                <b>{nx?.ref}</b> {nx?.text}
              </a>
            </Fragment>
          ))}
        </span>
      </div>
      <div className="cr-dash">
        <div className="cr-dash-main">
          <section className="lib-card cr-panel" aria-labelledby="ov-p">
            {" "}
            <header className="cr-panel-head">
              <h2 className="cr-panel-title" id="ov-p">
                Waiting on you
              </h2>
              <span className="cr-panel-meta">{ov?.propCount}</span>
            </header>{" "}
            {list(ov?.props).map((pr, $index) => (
              <Fragment key={$index}>
                {" "}
                <div className="cr-prop-row" data-state={pr?.state}>
                  <span className="av-tag" data-ui="Tag" data-tone={pr?.kindTone}>
                    {pr?.kindLabel}
                  </span>
                  <span className="cr-prop-main">
                    <b>{pr?.title}</b>
                    <small>
                      <span data-tone={pr?.expTone}>{pr?.expLabel}</span>
                      {pr?.cost ? <> · Cost impact {pr?.cost}</> : null}
                    </small>
                  </span>
                  <span className="cr-prop-btns">
                    {pr?.rejectLabel && pr?.reject ? (
                      <button
                        type="button"
                        className="av-btn"
                        data-size="sm"
                        data-variant="secondary"
                        onClick={pr.reject}
                      >
                        {pr.rejectLabel}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="av-btn"
                      data-size="sm"
                      data-variant="secondary"
                      data-emph="true"
                      onClick={pr?.approve}
                    >
                      {pr?.approveLabel}
                    </button>
                  </span>
                </div>{" "}
              </Fragment>
            ))}{" "}
            {ov?.noProps ? (
              <>
                <p className="cr-panel-empty">Nothing waiting on you for this project.</p>
              </>
            ) : null}{" "}
          </section>
          <section className="lib-card cr-panel" aria-labelledby="ov-m">
            {" "}
            <header className="cr-panel-head">
              <h2 className="cr-panel-title" id="ov-m">
                Modules
              </h2>
              <span className="cr-panel-meta">{ov?.modMeta}</span>
            </header>{" "}
            <div className="cr-mt" role="table" aria-labelledby="ov-m">
              <div className="cr-mt-row cr-mt-headrow" role="row">
                <span role="columnheader">Module</span>
                <span role="columnheader">State</span>
                <span role="columnheader">Retry ladder</span>
                <span role="columnheader">Gates</span>
                <span role="columnheader">Module budget</span>
              </div>
              {list(ov?.modules).map((md, $index) => (
                <Fragment key={$index}>
                  <div className="cr-mt-row" role="row" data-state={md?.state}>
                    <span role="cell" className="cr-mt-name">
                      <a className="cr-mt-link" href={md?.href}>
                        <b>{md?.ref}</b>
                        <small>{md?.title}</small>
                      </a>
                    </span>
                    <span role="cell">
                      <span className="av-tag" data-ui="Tag" data-tone={md?.tone}>
                        {md?.glyphEl}
                        {md?.stateLabel}
                      </span>
                    </span>
                    <span role="cell" className="cr-ladder" aria-label={md?.ladderLabel}>
                      <span className="cr-ladder-steps" aria-hidden="true">
                        {list(md?.ladder).map((ls, $index) => (
                          <Fragment key={$index}>
                            <i data-st={ls?.st}></i>
                          </Fragment>
                        ))}
                      </span>
                      <small>{md?.ladderText}</small>
                    </span>
                    <span role="cell" className="cr-mini" aria-label={md?.gatesLabel}>
                      <span className="cr-mini-gates" aria-hidden="true">
                        {list(md?.mini).map((g, $index) => (
                          <Fragment key={$index}>
                            <i data-st={g?.st}></i>
                          </Fragment>
                        ))}
                      </span>
                      <span className="cr-mini-n">{md?.gatesN}</span>
                    </span>
                    <span role="cell" className="cr-bar" data-warn={md?.warn} aria-label={md?.budgetLabel}>
                      <span className="cr-bar-track">
                        <i style={css(`width: ${md?.pct ?? ""}%`)}></i>
                      </span>
                      <small>{md?.pct}%</small>
                    </span>
                  </div>
                </Fragment>
              ))}
            </div>{" "}
          </section>
          <section className="lib-card cr-panel" aria-labelledby="ov-d">
            {" "}
            <header className="cr-panel-head">
              <h2 className="cr-panel-title" id="ov-d">
                Dependencies
              </h2>
              <span className="cr-panel-meta">M5 starts when M3 and M4 land</span>
            </header>{" "}
            <div className="cr-deps" data-ui="DependencyMap">
              {list(ov?.depCols).map((col, $index) => (
                <Fragment key={$index}>
                  <div className="cr-deps-col">
                    <span className="cr-deps-k">{col?.label}</span>
                    {list(col?.nodes).map((nd, $index) => (
                      <Fragment key={$index}>
                        <span className="cr-deps-node" data-state={nd?.state}>
                          {nd?.glyphEl}
                          <b>{nd?.ref}</b>
                          <small>{nd?.note}</small>
                        </span>
                      </Fragment>
                    ))}
                  </div>
                </Fragment>
              ))}
            </div>{" "}
          </section>
          {ov?.history ? (
            <CommitGraph
              title="History on main"
              titleId="ov-h"
              count={ov.history.count}
              rows={ov.history.rows}
              lanes={ov.history.lanes}
              I={ov.history.I}
              earlier={ov.history.earlier}
              onEarlier={ov.history.onEarlier}
              foot="Every landing on main, newest first, with each module's tries on its own branch. Tap a row for its commit."
            />
          ) : null}
        </div>
        <aside className="cr-dash-rail" aria-label="Project context">
          <section className="lib-card cr-panel cr-pad" aria-labelledby="ov-b">
            <h2 className="cr-panel-title" id="ov-b">
              Mission budget
            </h2>
            <div className="cr-big-pct">
              <b>{ov?.budgetPct}%</b>
              <span>used of the mission cap</span>
            </div>
            <span className="cr-bar-track cr-bar-lg" data-warn={ov?.budgetWarn}>
              <i style={css(`width: ${ov?.budgetPct ?? ""}%`)}></i>
            </span>
            <p className="cr-hint">{ov?.budgetNote}</p>
          </section>
          <section className="lib-card cr-panel" aria-labelledby="ov-l">
            {" "}
            <header className="cr-panel-head">
              <h2 className="cr-panel-title" id="ov-l">
                Integration lane
              </h2>
              <a className="wl-link" href={ov?.gatesHref}>
                Gates
              </a>
            </header>{" "}
            <div className="cr-lane">
              {list(ov?.lane).map((ln, $index) => (
                <Fragment key={$index}>
                  <div className="cr-lane-cell" data-k={ln?.k}>
                    <b>{ln?.v}</b>
                    <span>{ln?.label}</span>
                  </div>
                </Fragment>
              ))}
            </div>{" "}
            {list(ov?.commits).map((cm, $index) => (
              <Fragment key={$index}>
                <div className="cr-mini-row">
                  {cm?.glyphEl}
                  <span className="cr-mini-row-name">
                    <code className="cr-sha">{cm?.commit}</code> {cm?.module}
                    {cm?.note ? <> · {cm?.note}</> : null}
                  </span>
                  <span className="cr-mini-row-state">{cm?.when}</span>
                </div>
              </Fragment>
            ))}{" "}
          </section>
          <section className="lib-card cr-panel" aria-labelledby="ov-f">
            {" "}
            <header className="cr-panel-head">
              <h2 className="cr-panel-title" id="ov-f">
                Open findings
              </h2>
              <a className="wl-link" href={ov?.findingsHref}>
                Findings
              </a>
            </header>{" "}
            {list(ov?.findings).map((fd, $index) => (
              <Fragment key={$index}>
                <a className="cr-mini-row" href={ov?.findingsHref}>
                  <span className="av-tag" data-ui="Tag" data-tone="stopped">
                    {fd?.glyphEl}
                    {fd?.kind}
                  </span>
                  <span className="cr-mini-row-name">
                    <b>{fd?.ref}</b> {fd?.title}
                  </span>
                  <span className="cr-mini-row-state">
                    <code>{fd?.route}</code>
                  </span>
                </a>
              </Fragment>
            ))}{" "}
          </section>
          <section className="lib-card cr-panel" aria-labelledby="ov-dl">
            {" "}
            <header className="cr-panel-head">
              <h2 className="cr-panel-title" id="ov-dl">
                Deliveries
              </h2>
            </header>{" "}
            <p className="cr-panel-empty">None yet. Gate 5 issues the receipt when every module has landed.</p>{" "}
          </section>
          <section className="lib-card cr-panel" aria-labelledby="ov-a">
            {" "}
            <header className="cr-panel-head">
              <h2 className="cr-panel-title" id="ov-a">
                Recent activity
              </h2>
              <a className="wl-link" href="#/activity">
                Activity log
              </a>
            </header>{" "}
            <ol className="cr-act">
              {list(ov?.activity).map((ac, $index) => (
                <Fragment key={$index}>
                  <li>
                    <span className="cr-act-when">{ac?.when}</span>
                    <span className="cr-act-main">
                      <b>{ac?.actor}</b> {ac?.action}
                      <small>{ac?.reason}</small>
                    </span>
                  </li>
                </Fragment>
              ))}
            </ol>{" "}
          </section>
        </aside>
      </div>
    </div>
  );
}
