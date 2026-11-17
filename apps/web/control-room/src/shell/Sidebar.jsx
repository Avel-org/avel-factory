// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.
import { Fragment } from "react";
import { css, list } from "../lib/dc";

export function Sidebar({ vals, r, index: $index }) {
  const {
    acct,
    acctExpanded,
    closeSheet,
    hideTip,
    signOut,
    toggleAcct,
    openProto,
    showDock,
    ic,
    navGroups,
    onNavClick,
    onRailOver,
    railExpanded,
    railToggleLabel,
    railToggleTip,
    railToggleTitle,
    streamLabel,
    streamOn,
    streamState,
    toggleRail,
  } = vals;
  return (
    <div
      className="lib-rail"
      data-ui="Sidebar"
      data-collapsed={r?.collapsed}
      onPointerOver={onRailOver}
      onPointerLeave={hideTip}
      onFocus={onRailOver}
      onBlur={hideTip}
    >
      <div className="lib-rail-head" data-sheet-drag={r?.isSheet ? "" : undefined}>
        <a href="#/" className="lib-brand" data-tip="AVEL">
          <span className="lib-brand-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <rect
                x="1.5"
                y="1.5"
                width="15"
                height="15"
                rx="4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              ></rect>
              <path
                d="M5 12.5 9 5l4 7.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path d="M6.6 10h4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"></path>
            </svg>
          </span>
          <span className="lib-brand-text">
            <span className="lib-brand-name">
              AVEL
              <span className="lib-live-dot" data-on={streamOn} data-state={streamState} aria-hidden="true"></span>
            </span>
            <span className="lib-brand-sub">Control room</span>
          </span>
        </a>
        {r?.isAside ? (
          <>
            <button
              type="button"
              className="lib-rail-toggle"
              data-tip={railToggleTip}
              aria-label={railToggleLabel}
              aria-expanded={railExpanded}
              title={railToggleTitle}
              onClick={toggleRail}
            >
              {ic?.panelLeft}
            </button>
          </>
        ) : null}
      </div>
      {r?.isSheet ? (
        <>
          <button
            type="button"
            className="lib-icon-btn lib-rail-close"
            aria-label="Close navigation"
            onClick={closeSheet}
          >
            {ic?.x20}
          </button>
        </>
      ) : null}
      <nav className="lib-nav" aria-label="Main" onClick={onNavClick}>
        <span className="lib-nav-indicator" aria-hidden="true"></span>
        {list(navGroups).map((g, $index) => (
          <Fragment key={$index}>
            <div className="lib-nav-sec">
              {g?.label ? (
                <>
                  <div className="cr-nav-head">
                    <span className="lib-nav-group">{g?.label}</span>
                    {g?.isProjects ? (
                      <>
                        <a className="cr-nav-head-link" href="#/missions" aria-current={g?.allCurrent}>
                          All
                        </a>
                        <a
                          className="cr-nav-head-btn"
                          href="#/missions/new"
                          aria-label="New project"
                          title="New project"
                        >
                          {ic?.plus14}
                        </a>
                      </>
                    ) : null}
                  </div>
                </>
              ) : null}
              {list(g?.items).map((it, $index) => (
                <Fragment key={$index}>
                  <a
                    className="lib-nav-item"
                    href={it?.href}
                    aria-current={it?.current}
                    data-tip={it?.tip}
                    data-gap={it?.gap}
                    data-size={it?.size}
                  >
                    {" "}
                    {it?.iconEl}{" "}
                    {it?.dot ? (
                      <>
                        <span
                          className="cr-pdot"
                          data-pulse={it?.pulse}
                          style={css(`--dot: ${it?.dot ?? ""}`)}
                          aria-hidden="true"
                        ></span>
                      </>
                    ) : null}
                    <span className="lib-nav-label">{it?.label}</span>
                    {it?.live ? (
                      <span className="cr-eq" data-on="true" aria-hidden="true">
                        <i></i>
                        <i></i>
                        <i></i>
                      </span>
                    ) : null}
                    {it?.meta ? <span className="lib-nav-meta">{it?.meta}</span> : null}
                    {/* no numbers in the sidebar; screen readers still hear what waits */}
                    {it?.badge ? <span className="sr-only">{", " + it?.badgeLabel}</span> : null}
                  </a>
                </Fragment>
              ))}
              {g?.loading ? (
                <>
                  <div className="cr-nav-skel" aria-hidden="true">
                    <span
                      className="av-skel"
                      data-skeleton="true"
                      style={{ width: "10px", height: "10px", borderRadius: "50%", margin: "0 3px" }}
                    ></span>
                    <span className="av-skel" data-skeleton="true" style={{ width: "60%" }}></span>
                  </div>
                  <div className="cr-nav-skel" aria-hidden="true">
                    <span
                      className="av-skel"
                      data-skeleton="true"
                      style={{ width: "10px", height: "10px", borderRadius: "50%", margin: "0 3px" }}
                    ></span>
                    <span className="av-skel" data-skeleton="true" style={{ width: "45%" }}></span>
                  </div>
                </>
              ) : null}
              {g?.empty ? (
                <>
                  <a className="cr-nav-empty" href="#/missions/new">
                    No projects yet. Start one
                  </a>
                </>
              ) : null}
            </div>
          </Fragment>
        ))}
      </nav>
      {r?.isSheet && showDock ? (
        <button type="button" className="cr-sheet-proto" onClick={openProto}>
          {ic?.sliders14}
          <span>Prototype controls</span>
          <small>not part of the product</small>
        </button>
      ) : null}
      <div className="cr-acct-wrap">
        {acct?.open ? (
          <div className="cr-acct" role="menu" aria-label="Account" id={"acct-menu-" + (r?.key || "x")}>
            <a role="menuitem" className="cr-acct-item" href="#/settings" aria-current={acct?.settingsCurrent}>
              {ic?.settings16}
              Settings
            </a>
            <button type="button" role="menuitem" className="cr-acct-item" onClick={acct?.flipTheme}>
              {acct?.night ? ic?.sun16 : ic?.moon16}
              {acct?.night ? "Light theme" : "Night theme"}
            </button>
            <button type="button" role="menuitem" className="cr-acct-item" onClick={acct?.keys}>
              {ic?.keyboard16}
              Keyboard
              <kbd>?</kbd>
            </button>
            <span className="cr-acct-sep" role="separator"></span>
            <button type="button" role="menuitem" className="cr-acct-item" onClick={signOut}>
              {ic?.logOut16}
              Sign out
            </button>
          </div>
        ) : null}
        <button
          type="button"
          className="cr-avatar-btn"
          aria-haspopup="menu"
          aria-expanded={acctExpanded}
          aria-controls={acct?.open ? "acct-menu-" + (r?.key || "x") : undefined}
          onClick={toggleAcct}
          data-tip={acct?.name}
        >
          <span className="cr-avatar" aria-hidden="true">
            {acct?.initial}
          </span>
          <span className="cr-acct-who lib-nav-label">
            <b>{acct?.name}</b>
            <small>
              <span className="lib-live-dot" data-on={streamOn} data-state={streamState} aria-hidden="true"></span>
              <span aria-live="polite">{streamLabel}</span>
            </small>
          </span>
          {ic?.chevronUpDown16}
        </button>
      </div>
    </div>
  );
}
