// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.
import { Fragment } from "react";
import { list } from "../../lib/dc";
import { FilterBar } from "../../kit/FilterBar";
import { EmptyState } from "../../kit/EmptyState";
import { AgentCard, AgentOverview } from "./AgentParts";

export function AgentRosterPage({ vals }) {
  const { ic, ro } = vals;
  const I = ro?.I || (() => null);
  const one = ro?.one;
  return (
    <div className="ro" data-ui="AgentRoster" data-view={one ? "agent" : "list"}>
      {ro?.missing ? (
        <EmptyState
          scene="noResults"
          title={"No agent called \u201c" + ro.missing + "\u201d"}
          action={
            <a className="av-btn" data-variant="secondary" href="#/roster">
              All agents
            </a>
          }
        >
          The roster has 16 agents. This one may have been renamed in a roster PR.
        </EmptyState>
      ) : null}
      {one ? null : (
        <div className="ro-top">
          <p className="ro-sum">
            <b>16 agents</b> in 5 teams
            <span aria-hidden="true">·</span>
            <span className="ro-mono">{ro?.version}</span>
            <span aria-hidden="true">·</span>
            changed by PR #{ro?.lastPr} on {ro?.lastAt}
          </p>
          {ro?.viewing ? (
            <button type="button" className="av-btn" data-ui="Button" data-variant="primary" onClick={ro?.startEdit}>
              Change the roster
            </button>
          ) : null}
          {ro?.filed || ro?.openPr ? (
            <a className="ro-prline" href="#/">
              {ic?.pr14}
              {ro?.filed ? (
                <span>PR #{ro?.filed} opened · waiting for you in Decisions</span>
              ) : (
                <span>
                  PR #{ro?.openPr?.number} · {ro?.openPr?.title} · waiting for you in Decisions
                </span>
              )}
            </a>
          ) : null}
        </div>
      )}
      {ro?.draft ? (
        <>
          <div className="ro-draft" role="status" data-err={ro?.draft?.err} data-ui="DraftBar">
            {" "}
            <span className="ro-draft-t">
              <b>Draft on {ro?.version}</b> · {ro?.draft?.text}
              {ro?.draft?.err ? (
                <>
                  <span className="ro-draft-err">{ro?.draft?.err}</span>
                </>
              ) : null}
            </span>{" "}
            <button
              type="button"
              className="av-btn"
              data-ui="Button"
              data-size="sm"
              data-variant="ghost"
              onClick={ro?.discard}
            >
              Discard
            </button>{" "}
            <button
              type="button"
              className="av-btn"
              data-ui="Button"
              data-size="sm"
              data-variant="primary"
              onClick={ro?.toReview}
              disabled={ro?.draft?.blocked}
            >
              Review changes
            </button>{" "}
          </div>
        </>
      ) : null}
      {ro?.review ? (
        <>
          <section className="lib-card cr-panel ro-review" aria-labelledby="ro-rv" data-ui="RosterReview">
            {" "}
            <header className="cr-panel-head">
              <h2 className="cr-panel-title" id="ro-rv">
                {ro?.review?.title}
              </h2>
              <span className="cr-panel-meta">{ro?.review?.meta}</span>
            </header>{" "}
            {ro?.review?.stale ? (
              <>
                {" "}
                <div className="ro-stale">
                  <p>
                    <b>The roster changed since you opened it.</b> PR #{ro?.review?.newerPr} landed {ro?.review?.newerV}
                    . Your draft is kept. Check the newer change, then reapply.
                  </p>{" "}
                  <ul className="ro-diff">
                    {list(ro?.review?.newer).map((nl, $index) => (
                      <Fragment key={$index}>
                        <li>
                          <b>{ro?.review?.newerV}</b>
                          <span className="ro-diff-new">{nl?.text}</span>
                        </li>
                      </Fragment>
                    ))}
                  </ul>
                </div>{" "}
              </>
            ) : null}{" "}
            <ul className="ro-diff">
              {list(ro?.review?.changes).map((ch, $index) => (
                <Fragment key={$index}>
                  <li>
                    <b>{ch?.what}</b>
                    <span className="ro-diff-old">− {ch?.from}</span>
                    <span className="ro-diff-new">+ {ch?.to}</span>
                  </li>
                </Fragment>
              ))}
            </ul>{" "}
            <div className="ro-inflight">
              <h3>In-flight projects keep the version they started on</h3>{" "}
              <ul>
                {list(ro?.review?.inflight).map((fl, $index) => (
                  <Fragment key={$index}>
                    <li>
                      <span>{fl?.mission}</span>
                      <span className="ro-muted">{fl?.state}</span>
                      <span className="ro-mono">{fl?.version}</span>
                    </li>
                  </Fragment>
                ))}
              </ul>
            </div>{" "}
            <footer className="ro-review-foot">
              <span className="ro-review-warn">{ro?.review?.warn}</span>
              <button
                type="button"
                className="av-btn"
                data-ui="Button"
                data-variant="secondary"
                onClick={ro?.review?.back}
                disabled={ro?.review?.busy}
              >
                Back to editing
              </button>
              <button
                type="button"
                className="av-btn"
                data-ui="Button"
                data-variant="primary"
                onClick={ro?.review?.file}
                disabled={ro?.review?.busy}
              >
                {ro?.review?.fileLabel}
              </button>
            </footer>{" "}
          </section>
        </>
      ) : null}
      {one ? (
        <AgentOverview a={one} I={I} />
      ) : (
        <section className="ro-list" aria-label="Agents" data-ui="AgentCards">
          <div className="lib-card ag-tools">
            <div className="ro-bar">
              <FilterBar
                f={ro?.filterBar}
                I={I}
                label="Filter agents"
                search={{
                  label: "Search agents",
                  value: ro?.q,
                  onChange: ro?.onQ,
                  clear: ro?.clearQ,
                  placeholder: "Search agents, teams or skills",
                }}
                lead={
                  <div className="lib-seg ro-status" role="radiogroup" aria-label="Status">
                    {list(ro?.status).map((o) => (
                      <button
                        key={o.key}
                        type="button"
                        role="radio"
                        aria-checked={o.checked}
                        className="lib-seg-btn"
                        onClick={o.pick}
                      >
                        {o.label}
                        <small>{o.count}</small>
                      </button>
                    ))}
                  </div>
                }
              />
            </div>
            <div className="ro-lookup" data-open={ro?.lk?.open} data-ui="WhoGetsThis">
              <button
                type="button"
                className="ro-lookup-toggle"
                aria-expanded={String(!!ro?.lk?.open)}
                onClick={ro?.lk?.toggle}
              >
                Who gets this?
                {I("chevron-down", 16)}
              </button>
              <div className="ro-lookup-body">
                <p className="ro-q">
                  <span className="ro-q-k">Who takes</span>
                  <select
                    className="av-select ro-select"
                    aria-label="Role"
                    value={ro?.lk?.role ?? ""}
                    onChange={ro?.lk?.onRole}
                  >
                    {list(ro?.lk?.roles).map((op) => (
                      <option key={op.key} value={op.v}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                  <span className="ro-q-k">on</span>
                  <select
                    className="av-select ro-select"
                    aria-label="Work kind"
                    value={ro?.lk?.kind ?? ""}
                    onChange={ro?.lk?.onKind}
                  >
                    {list(ro?.lk?.kinds).map((op) => (
                      <option key={op.key} value={op.v}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                  <span className="ro-q-end">work?</span>
                  {ro?.lk?.clear ? (
                    <button type="button" className="ro-link" onClick={ro?.lk?.clear}>
                      Clear
                    </button>
                  ) : null}
                </p>
                <p className="ro-answer" role="status">
                  {ro?.lk?.answer ? (
                    <>
                      <button type="button" className="ro-name" onClick={ro.lk.answer.who.pick}>
                        {ro.lk.answer.who.name}
                      </button>{" "}
                      {ro.lk.answer.verb}{" "}
                      {ro.lk.answer.noReview ? (
                        <>No one reviews it. </>
                      ) : (
                        <>
                          {ro.lk.answer.reviewers.map((r) => (
                            <Fragment key={r.key}>
                              {r.sep}
                              <button type="button" className="ro-name" onClick={r.pick}>
                                {r.name}
                              </button>
                            </Fragment>
                          ))}{" "}
                          {ro.lk.answer.reviewVerb}{" "}
                        </>
                      )}
                      Disputes go to{" "}
                      <button type="button" className="ro-name" onClick={ro.lk.answer.ruler.pick}>
                        {ro.lk.answer.ruler.name}
                      </button>
                      .{ro.lk.answer.rulerNote ? " " + ro.lk.answer.rulerNote : ""}
                    </>
                  ) : (
                    <span className="ro-muted">{ro?.lk?.hint}</span>
                  )}
                </p>
              </div>
            </div>{" "}
          </div>
          {list(ro?.teams).map((ln) => (
            <section key={ln.key} className="ag-team" aria-labelledby={"ag-t-" + ln.key}>
              <header className="ag-team-h">
                <h2 id={"ag-t-" + ln.key}>{ln.label}</h2>
                <span className="ag-count">{ln.count}</span>
                {ln.note ? <p>{ln.note}</p> : null}
              </header>
              <ul className="ag-grid">
                {list(ln.agents).map((nd) => (
                  <li key={nd.key}>
                    <AgentCard nd={nd} I={I} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {ro?.none ? (
            <p className="ro-none">
              No agents match.{" "}
              <button type="button" className="ro-link" onClick={ro?.resetFilters}>
                Clear filters
              </button>
            </p>
          ) : null}
          <p className="ag-ticker" aria-live="off">
            <i aria-hidden="true"></i>
            <b>{ro?.tick?.who}</b> {ro?.tick?.text}
            <span className="ro-muted">{ro?.tick?.age}</span>
          </p>
        </section>
      )}
      {one ? null : (
        <section className="lib-card cr-panel ro-ref" aria-label="Reference" data-ui="RosterReference">
          {" "}
          <button
            type="button"
            className="ro-ref-row"
            aria-expanded={ro?.ref?.map?.open}
            onClick={ro?.ref?.map?.toggle}
          >
            <b>Slot map</b>
            <span>Which agent takes each work kind and role, and who settles disputes</span>
            <i aria-hidden="true">{ro?.ref?.map?.sign}</i>
          </button>{" "}
          {ro?.ref?.map?.on ? (
            <>
              <div className="ro-ref-body">
                <div className="ro-maps">
                  {list(ro?.maps).map((mp, $index) => (
                    <Fragment key={$index}>
                      <div>
                        <h3 className="ro-ref-h">{mp?.title}</h3>
                        <ul className="ro-map">
                          {list(mp?.rows).map((mr, $index) => (
                            <Fragment key={$index}>
                              <li>
                                <span className="ro-mono">{mr?.k}</span>
                                <span>{mr?.v}</span>
                              </li>
                            </Fragment>
                          ))}
                        </ul>
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>
            </>
          ) : null}{" "}
          <button
            type="button"
            className="ro-ref-row"
            aria-expanded={ro?.ref?.flow?.open}
            onClick={ro?.ref?.flow?.toggle}
          >
            <b>How work moves</b>
            <span>Contracts to Gate 5, and what limits parallel work</span>
            <i aria-hidden="true">{ro?.ref?.flow?.sign}</i>
          </button>{" "}
          {ro?.ref?.flow?.on ? (
            <>
              <div className="ro-ref-body">
                {" "}
                <ol className="ro-flow">
                  {list(ro?.flow).map((fs, $index) => (
                    <Fragment key={$index}>
                      <li data-here={fs?.here} data-live={fs?.live}>
                        <span className="ro-flow-n">{fs?.n}</span>
                        <b>{fs?.title}</b>
                        <span>{fs?.who}</span>
                      </li>
                    </Fragment>
                  ))}
                </ol>{" "}
                <ul className="ro-limits">
                  <li>
                    <b>Slots</b>6 rooms at once
                  </li>
                  <li>
                    <b>Dependencies</b>a module waits for what it needs
                  </li>
                  <li>
                    <b>Locks</b>tests are locked before the build
                  </li>
                  <li>
                    <b>Territories</b>no shared files
                  </li>
                  <li>
                    <b>Integration</b>one module at a time
                  </li>
                </ul>{" "}
              </div>
            </>
          ) : null}{" "}
          <button
            type="button"
            className="ro-ref-row"
            aria-expanded={ro?.ref?.rules?.open}
            onClick={ro?.ref?.rules?.toggle}
          >
            <b>Rules</b>
            <span>Six rules every slot follows</span>
            <i aria-hidden="true">{ro?.ref?.rules?.sign}</i>
          </button>{" "}
          {ro?.ref?.rules?.on ? (
            <>
              <div className="ro-ref-body">
                <ul className="ro-rules">
                  <li>
                    <h3>Code assigns agents, never a model</h3>
                    <p>Work goes to the agent for its work kind and role</p>
                  </li>
                  <li>
                    <h3>No work grades itself</h3>
                    <p>A builder never tests or reviews the kinds it builds</p>
                  </li>
                  <li>
                    <h3>Contracts come first</h3>
                    <p>Zero and Axis write the contract before anyone builds</p>
                  </li>
                  <li>
                    <h3>Contract changes have a path</h3>
                    <p>Additive changes go through the lead and Brennan. Breaking ones come to you as a proposal</p>
                  </li>
                  <li>
                    <h3>Every finding cites evidence</h3>
                    <p>A file, a line, a failing test or a trace</p>
                  </li>
                  <li>
                    <h3>An agent is a setup</h3>
                    <p>A model, role skills, a prompt and an effort level</p>
                  </li>
                </ul>
              </div>
            </>
          ) : null}{" "}
          <button
            type="button"
            className="ro-ref-row"
            aria-expanded={ro?.ref?.open?.open}
            onClick={ro?.ref?.open?.toggle}
          >
            <b>Still to decide</b>
            <span>{ro?.openCount} open items</span>
            <i aria-hidden="true">{ro?.ref?.open?.sign}</i>
          </button>{" "}
          {ro?.ref?.open?.on ? (
            <>
              <ul className="ro-open">
                {list(ro?.open).map((oi, $index) => (
                  <Fragment key={$index}>
                    <li>
                      <span>{oi?.text}</span>
                      <a className="ro-link" href="#/">
                        Decide
                      </a>
                    </li>
                  </Fragment>
                ))}
              </ul>
            </>
          ) : null}{" "}
        </section>
      )}
    </div>
  );
}
