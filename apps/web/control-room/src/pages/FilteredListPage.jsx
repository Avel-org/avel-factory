// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.
import { Fragment } from "react";
import { list } from "../lib/dc";
import { EmptyArtFor } from "../kit/EmptyState";

export function FilteredListPage({ vals }) {
  const { clearFilters, es, ic } = vals;
  return (
    <>
      <div className="av-filters" role="search" data-ui="FilterBar">
        {" "}
        <label className="av-filter-search">
          {ic?.search14}
          <input type="search" placeholder="Search projects" aria-label="Search projects" />
        </label>{" "}
        <div role="radiogroup" aria-label="State" className="av-chips">
          {" "}
          <button type="button" role="radio" aria-checked="false" className="av-chip">
            All
          </button>{" "}
          <button type="button" role="radio" aria-checked="false" className="av-chip">
            Running
          </button>{" "}
          <button type="button" role="radio" aria-checked="false" className="av-chip">
            Onboarding
          </button>{" "}
          <button type="button" role="radio" aria-checked="true" className="av-chip">
            Awaiting release
          </button>{" "}
          <button type="button" role="radio" aria-checked="false" className="av-chip">
            Delivered
          </button>{" "}
        </div>{" "}
        <select className="av-select" aria-label="Client">
          <option>GTS Diesel</option>
          <option>All clients</option>
        </select>{" "}
        <span className="av-filters-end">
          <span className="av-filters-summary">0 of 5</span>
          <button type="button" className="av-filters-clear" onClick={clearFilters}>
            Clear
          </button>
        </span>{" "}
      </div>
      <div className="cr-stage">
        {" "}
        <div className="av-state" data-ui="WidgetState" data-state="filtered-empty">
          {" "}
          <EmptyArtFor scene={es?.scene} /> <h2 className="av-state-title">{es?.title}</h2>{" "}
          <p className="av-state-msg">{es?.msg}</p>{" "}
          {es?.hasActions ? (
            <>
              <div className="av-state-actions">
                {list(es?.actions).map((a, $index) => (
                  <Fragment key={$index}>
                    <button
                      type="button"
                      className="av-btn"
                      data-ui="Button"
                      data-variant={a?.variant}
                      onClick={a?.onClick}
                    >
                      {a?.iconEl}
                      {a?.label}
                    </button>
                  </Fragment>
                ))}
              </div>
            </>
          ) : null}{" "}
        </div>{" "}
      </div>
    </>
  );
}
