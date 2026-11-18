// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.
import { Fragment, useLayoutEffect, useRef } from "react";
import { css, list } from "../lib/dc";
import { Roll } from "../kit/Roll";

export function Topbar({ vals }) {
  const { crumbs, headStatus, hp, ic, openPal, openSheet, pg, progressRef, sheetExpanded, topTitle, topbarRef } = vals;
  // phone: a back button to the nearest parent in the breadcrumb (the tab bar handles top-level moves)
  const back = [...list(crumbs)].reverse().find((c) => c?.link && c?.label !== pg?.title);
  // At the top of a page the big title already says where you are, so the bar shows only the parents.
  // Every page below the top level shows its whole path; the last item is where you are.
  const trail = list(crumbs).length > 1 ? list(crumbs) : [];
  // Header A: a top-level page has no parent to show, so its own title rises into the bar's row.
  const flush = !trail.length && !back;
  // The page header leaves room on the right for the pulse and search. Measured, because their width
  // changes with what's running.
  const right = useRef(null);
  useLayoutEffect(() => {
    const bar = topbarRef && topbarRef.current;
    const canvas = bar && bar.parentElement;
    if (!canvas) return;
    const pulse = bar.querySelector(".cr-pulse");
    const r = bar.getBoundingClientRect();
    const from =
      pulse && pulse.offsetParent
        ? pulse.getBoundingClientRect().left
        : right.current
          ? right.current.getBoundingClientRect().left
          : r.right;
    const px = Math.max(0, Math.round(r.right - from)) + "px";
    if (canvas.style.getPropertyValue("--bar-right") !== px) canvas.style.setProperty("--bar-right", px);
  });
  return (
    <div
      role="navigation"
      aria-label="Top bar"
      className="lib-topbar"
      data-ui="Topbar"
      data-back={back ? "true" : undefined}
      data-flush={flush ? "" : undefined}
      ref={topbarRef}
    >
      {back ? (
        <a className="cr-top-back" href={back.href} aria-label={"Back to " + back.label} data-ui="BackButton">
          {ic?.chevronLeft20}
          <span className="cr-top-back-l">{back.label}</span>
        </a>
      ) : null}
      <button
        type="button"
        className="lib-icon-btn lib-only-narrow"
        aria-label="Open navigation"
        aria-expanded={sheetExpanded}
        onClick={openSheet}
      >
        {ic?.menuBar}
      </button>
      <div className="cr-top-title" aria-hidden="true">
        {pg?.dot ? (
          <>
            <span className="cr-pdot" data-pulse={pg?.pulse} style={css(`--dot: ${pg?.dot ?? ""}`)}></span>
          </>
        ) : null}
        <span className="cr-top-title-text">{topTitle}</span>
        {headStatus ? (
          <>
            <span className="av-tag" data-tone={headStatus?.tone}>
              {headStatus?.glyphEl}
              {headStatus?.label}
            </span>
          </>
        ) : null}
      </div>
      {trail.length ? (
        <nav aria-label="Breadcrumb" className="lib-crumbs" data-ui="Breadcrumb">
          <ol className="lib-crumb-list">
            {trail.map((c, i) => (
              <li key={i} className="lib-crumb-item">
                {i ? <span className="lib-crumb-sep" aria-hidden="true">{ic?.chevronCrumb}</span> : null}
                {c?.link ? (
                  <a className="lib-crumb" href={c?.href} data-gap={c?.gap} title={c?.label}>
                    {c?.label}
                  </a>
                ) : (
                  <span className="lib-crumb" aria-current="page" title={c?.label}>
                    {c?.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : (
        <span className="lib-crumbs" aria-hidden="true"></span>
      )}
      <nav className="cr-pulse" aria-label="Factory status" data-ui="FactoryPulse">
        <a
          className="cr-pulse-item"
          href="#/live"
          data-state={hp?.liveState}
          data-minor={hp?.parked ? "true" : undefined}
        >
          <span
            className="cr-pdot"
            data-pulse={hp?.livePulse}
            style={css(`--dot: ${hp?.liveDot ?? ""}`)}
            aria-hidden="true"
          ></span>
          <b>
            <Roll value={hp?.running} />
          </b>{" "}
          <span className="cr-pulse-w">{hp?.runWord}</span>
          {/* activity level: three bars that move with the heartbeat while rooms run, flat when none do */}
          <span className="cr-eq" data-on={hp?.livePulse ? "true" : undefined} aria-hidden="true">
            <i></i>
            <i></i>
            <i></i>
          </span>
        </a>
        {hp?.parked ? (
          <>
            <span className="cr-pulse-sep" aria-hidden="true"></span>
            <a className="cr-pulse-item" href="#/live">
              <span className="cr-sq" aria-hidden="true"></span>
              <b>
                <Roll value={hp?.parked} />
              </b>{" "}
              <span className="cr-pulse-w">parked</span>
            </a>
          </>
        ) : null}
        {hp?.offline ? (
          <>
            <span className="cr-pulse-sep" aria-hidden="true"></span>
            <span className="cr-pulse-item" data-state="offline">
              {hp?.offline}
            </span>
          </>
        ) : null}
      </nav>
      <div className="cr-head-right" ref={right}>
        <button
          type="button"
          className="cr-search"
          onClick={openPal}
          aria-keyshortcuts="Meta+K Control+K"
          data-ui="SearchButton"
        >
          {ic?.searchBar}
          <span className="cr-search-l">Search</span>
          <kbd className="cr-search-k" aria-hidden="true">
            ⌘K
          </kbd>
        </button>
      </div>
      <span className="lib-progress" aria-hidden="true" ref={progressRef} style={{ transform: "scaleX(0)" }}></span>
    </div>
  );
}

