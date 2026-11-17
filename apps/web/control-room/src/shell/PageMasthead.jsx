// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.
import { Fragment, useEffect, useRef, useState } from "react";
import { css, list } from "../lib/dc";
import { Roll } from "../kit/Roll";

export function PageMasthead({ vals }) {
  const { bannerStyle, dmp, headStatus, ic, mastTone, pg, signal } = vals;
  // phone: the tab you're on scrolls into the middle of the strip, so it's never hidden off the edge
  const tabsRef = useRef(null);
  const curTab = (list(pg?.mastTabs).find((t) => t?.current) || {}).key;
  useEffect(() => {
    const nav = tabsRef.current;
    const cur = nav && nav.querySelector("[aria-current]");
    if (nav && cur && nav.scrollWidth > nav.clientWidth)
      nav.scrollLeft = cur.offsetLeft - nav.clientWidth / 2 + cur.clientWidth / 2;
  }, [curTab]);
  return (
    <header
      className="cr-mast"
      data-ui="PageMasthead"
      data-wide={pg?.wide}
      data-tabs={pg?.hasMastTabs}
      data-banner={bannerStyle}
      data-signal={signal}
      style={css(`--tone: ${mastTone ?? ""}`)}
    >
      {" "}
      <div className="cr-mast-inner">
        {" "}
        {dmp ? (
          <>
            {" "}
            {/* Decisions uses the same masthead as every other page: title, status, actions on the right, lead below */}
            <div className="cr-mast-head cr-dm-head" data-ui="DecisionsBanner">
              <div className="cr-mast-titlerow">
                <h1 className="cr-mast-title">Decisions</h1>
                {dmp?.waiting ? (
                  <span className="av-tag" data-ui="Tag" data-tone="accent">
                    <Roll value={dmp.waiting} />
                  </span>
                ) : (
                  <span className="av-tag" data-ui="Tag" data-tone="verified">
                    Clear
                  </span>
                )}
              </div>
              <p className="cr-mast-lead">
                {dmp?.date} · <Roll value={dmp?.lead} />
                <span className="cr-dm-sep"> · </span>
                <Roll value={dmp?.progLabel} className="cr-dm-progk" />
              </p>
              <span className="cr-mast-side cr-dm-prog" role="img" aria-label={dmp?.progLabel}>
                <span className="cr-dmline-bar">
                  {list(dmp?.ticks).map((tk, $index) => (
                    <Fragment key={$index}>
                      <i data-done={tk?.done}></i>
                    </Fragment>
                  ))}
                </span>
              </span>
            </div>{" "}
          </>
        ) : null}{" "}
        {pg?.genericMast ? (
          <>
            {" "}
            <div className="cr-mast-head" data-kind={pg?.tileKind}>
              <div className="cr-mast-titlerow">
                <h1 className="cr-mast-title" data-gap={pg?.titleGap}>
                  {pg?.title}
                </h1>
                {headStatus ? (
                  <>
                    <span className="av-tag" data-ui="Tag" data-tone={headStatus?.tone}>
                      {headStatus?.glyphEl}
                      {headStatus?.label}
                    </span>
                  </>
                ) : null}
              </div>
              <div className="cr-mast-side">
                {list(pg?.headActions).map((a, $index) => (
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
                {pg?.watch ? (
                  <>
                    <a
                      className="av-btn cr-watch-btn"
                      data-ui="Button"
                      data-variant="secondary"
                      href={pg?.watch?.href}
                      aria-current={pg?.watch?.current}
                    >
                      {ic?.terminal16}Watch the work
                      {pg?.watch?.live ? (
                        <>
                          <span
                            className="cr-pdot"
                            data-pulse="true"
                            style={{ "--dot": "var(--av-verified-solid)" }}
                            aria-hidden="true"
                          ></span>
                        </>
                      ) : null}
                    </a>
                  </>
                ) : null}
                {pg?.ctl ? <ProjectControls ctl={pg.ctl} I={vals.I} /> : null}
              </div>
              {pg?.hasGates ? (
                <>
                  <div className="cr-gates" data-ui="GateStrip" data-gap="Gate strip">
                    <span className="cr-gates-k">Gates</span>
                    <ol className="cr-gates-list" aria-label={pg?.gatesLabel}>
                      {list(pg?.gates).map((gt) => (
                        <li key={gt.key}>
                          <a
                            className="cr-gate"
                            data-st={gt.st}
                            data-current={gt.current}
                            title={gt.label}
                            aria-label={gt.label}
                            href={gt.href}
                            style={{ "--fill": gt.fill }}
                          >
                            <span className="cr-gate-l" aria-hidden="true">
                              {gt.glyphEl}
                              <span className="cr-gate-n">{gt.n}</span> <span className="cr-gate-name">{gt.name}</span>
                            </span>
                            <span className="cr-gate-bar" aria-hidden="true">
                              <i></i>
                            </span>
                          </a>
                        </li>
                      ))}
                    </ol>
                    <span className="cr-gates-sum">
                      {pg?.gatesHead ? <b>{pg.gatesHead}</b> : null}
                      {pg?.gatesSum}
                    </span>
                  </div>
                </>
              ) : null}
              {pg?.lead ? (
                <>
                  <p className="cr-mast-lead">{pg?.lead}</p>
                </>
              ) : null}
            </div>{" "}
          </>
        ) : null}{" "}
        {pg?.hasMastTabs ? (
          <>
            {" "}
            <nav className="cr-mast-tabs" aria-label={pg?.mastTabsLabel} data-ui="PageTabs" ref={tabsRef}>
              {list(pg?.mastTabs).map((t, $index) => (
                <Fragment key={$index}>
                  {t?.off ? (
                    <span className="cr-mast-tab" aria-disabled="true" title={t?.title} data-off="true">
                      {t?.label}
                    </span>
                  ) : (
                    <a className="cr-mast-tab" href={t?.href} aria-current={t?.current}>
                      {t?.label}
                    </a>
                  )}
                  {t?.hasSubs ? (
                    <>
                      <span className="cr-mast-subs" role="group" aria-label="Library kinds">
                        {list(t?.subs).map((sb, $index) => (
                          <Fragment key={$index}>
                            <a className="cr-mast-sub" href={sb?.href} aria-current={sb?.current}>
                              {sb?.label}
                            </a>
                          </Fragment>
                        ))}
                      </span>
                    </>
                  ) : null}
                </Fragment>
              ))}
            </nav>{" "}
          </>
        ) : null}{" "}
      </div>{" "}
    </header>
  );
}

/** Pause and resume, refresh onto the client's latest code, cancel with a reason. One menu, never a primary. */
function ProjectControls({ ctl, I }) {
  const [asking, setAsking] = useState(false);
  const [why, setWhy] = useState("");
  const box = useRef(null);
  const btn = useRef(null);
  useEffect(() => {
    if (!ctl.open) {
      setAsking(false);
      setWhy("");
      return undefined;
    }
    const first = box.current && box.current.querySelector("button, textarea");
    if (first) first.focus();
    const out = (e) => {
      if (box.current && !box.current.contains(e.target) && btn.current && !btn.current.contains(e.target)) ctl.close();
    };
    const esc = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        ctl.close();
        btn.current && btn.current.focus();
      }
    };
    document.addEventListener("pointerdown", out);
    document.addEventListener("keydown", esc, true);
    return () => {
      document.removeEventListener("pointerdown", out);
      document.removeEventListener("keydown", esc, true);
    };
  }, [ctl.open]);
  if (ctl.cancelled) return null;
  return (
    <span className="cr-ctl">
      <button
        ref={btn}
        type="button"
        className="av-btn cr-ctl-btn"
        data-variant="ghost"
        aria-haspopup="menu"
        aria-expanded={ctl.open ? "true" : "false"}
        aria-label="Project controls"
        onClick={ctl.toggle}
      >
        {I("ellipsis", 16)}
      </button>
      {ctl.open ? (
        <div className="cr-ctl-menu" role="menu" aria-label="Project controls" ref={box}>
          {asking ? (
            <div className="cr-ctl-ask" role="group" aria-labelledby="ctl-ask-h">
              <p id="ctl-ask-h" className="cr-ctl-h">
                Cancel this project?
              </p>
              <p className="cr-ctl-note">Every room stops now. The record stays; nothing is deleted.</p>
              <label className="cr-ctl-why">
                <span>Why</span>
                <textarea
                  rows="2"
                  value={why}
                  onChange={(e) => setWhy(e.target.value)}
                  placeholder="Logged with the cancellation"
                />
              </label>
              <div className="cr-ctl-btns">
                <button
                  type="button"
                  className="av-btn"
                  data-variant="secondary"
                  data-size="sm"
                  onClick={() => setAsking(false)}
                >
                  Keep it
                </button>
                <button
                  type="button"
                  className="av-btn"
                  data-variant="danger"
                  data-size="sm"
                  disabled={!why.trim() || undefined}
                  onClick={() => ctl.cancel(why.trim())}
                >
                  Cancel project
                </button>
              </div>
            </div>
          ) : (
            <>
              {ctl.paused ? (
                <button type="button" role="menuitem" className="cr-acct-item" onClick={ctl.resume}>
                  {I("play", 16)}
                  Resume
                </button>
              ) : (
                <button type="button" role="menuitem" className="cr-acct-item" onClick={ctl.pause}>
                  {I("pause", 16)}
                  Pause
                  <small>Rooms finish their step, then wait</small>
                </button>
              )}
              {ctl.canRefresh ? (
                <button type="button" role="menuitem" className="cr-acct-item" onClick={ctl.refresh}>
                  {I("refresh-cw", 16)}
                  Refresh onto the client's latest code
                  <small>Gates 2, 4 and 5 run again</small>
                </button>
              ) : null}
              <span className="cr-acct-sep" role="separator"></span>
              <button
                type="button"
                role="menuitem"
                className="cr-acct-item"
                data-danger="true"
                onClick={() => setAsking(true)}
              >
                {I("ban", 16)}
                Cancel project…
              </button>
            </>
          )}
        </div>
      ) : null}
    </span>
  );
}
