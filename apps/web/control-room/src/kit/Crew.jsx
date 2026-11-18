import { useEffect, useRef, useState } from "react";
import { EmptyState } from "./EmptyState";

/*
 * The crew: a project's agent team live in one view. The lead at the top, one card per module (its
 * builder), and under each module the agents that check it (test writer, reviewers). Working cards
 * glow, the running line types in as the step stream arrives, and every card opens to say what the
 * agent is on, for how long, against which cap, with a link to where you act. Data: src/app/crew.js.
 * Agent text is rendered as text.
 */

const PILL = { working: "Working", done: "Done", needs: "Needs you", idle: "Idle" };

function Pill({ st, I }) {
  return (
    <span className="crew-pill" data-st={st} title={PILL[st]}>
      {st === "working" ? <i className="crew-live" aria-hidden="true"></i> : st === "done" ? I("check", 12) : st === "needs" ? <i className="crew-pip" aria-hidden="true"></i> : null}
      {PILL[st]}
    </span>
  );
}

/** The running card's line: the mock replays route 64's steps so you can watch it work. */
function useLiveLine(lines) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!lines || lines.length < 2) return undefined;
    const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) return undefined;
    // not a fetch: the mock replaying the attempt's step stream (route 64) on screen
    const t = setInterval(() => setI((n) => (n + 1) % lines.length), 2600);
    return () => clearInterval(t);
  }, [lines]);
  return lines && lines.length ? { text: lines[i], key: i } : null;
}

function Card({ a, I, sub, openKey, setOpenKey }) {
  const live = useLiveLine(a.live);
  const open = openKey === a.key;
  const line = live ? live.text : a.line;
  return (
    <div className="crew-cardwrap" data-open={open ? "true" : undefined}>
      <button
        type="button"
        className="crew-card"
        data-st={a.st}
        data-sub={sub ? "true" : undefined}
        aria-expanded={open ? "true" : "false"}
        aria-controls={"crew-pop-" + a.key}
        onClick={() => setOpenKey(open ? null : a.key)}
      >
        {sub || !a.ref ? (
          <span className="crew-head">
            <span className="crew-ic" aria-hidden="true">
              {I(a.icon, sub ? 14 : 16)}
            </span>
            <span className="crew-who">
              <b>{a.name}</b>
              <small>{sub ? a.role : a.role + " · " + a.model}</small>
            </span>
            <Pill st={a.st} I={I} />
          </span>
        ) : (
          <>
            {/* a module card leads with the module; the agent on it comes second */}
            <span className="crew-mhead">
              <span className="crew-ref kb-mono">{a.ref}</span>
              <Pill st={a.st} I={I} />
            </span>
            <span className="crew-mtitle" title={a.title}>
              {a.title}
            </span>
            <span className="crew-agent">
              <span className="crew-ic" aria-hidden="true">
                {I(a.icon, 14)}
              </span>
              <b>{a.name}</b>
              {a.model ? <small>{a.model}</small> : null}
            </span>
          </>
        )}
        <span className={"crew-line" + (a.live ? " kb-mono" : "")} key={live ? live.key : "s"} data-fresh={live ? "true" : undefined}>
          <span className="crew-line-t">{line}</span>
          {a.live ? <span className="tt-cursor" aria-hidden="true"></span> : null}
        </span>
        {a.share != null && !(a.st === "idle" && !a.share) ? (
          <span className="crew-bar" aria-label={a.share + "% " + a.shareLabel}>
            <span className="crew-bar-track">
              <span className="crew-bar-fill" style={{ width: a.share + "%" }} data-hot={a.share >= 80 ? "true" : undefined}></span>
            </span>
            <span className="crew-bar-n kb-mono">{a.share}%</span>
          </span>
        ) : null}
        {!sub && (a.attempt || a.tests || a.meta) ? (
          <span className="crew-chips">
            {a.attempt ? <span className="crew-chip">{a.attempt}</span> : null}
            {a.tests ? <span className="crew-chip kb-mono">{a.tests} tests</span> : null}
            {a.meta ? <span className="crew-chip">{a.meta}</span> : null}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="crew-pop" id={"crew-pop-" + a.key} role="group" aria-label={a.name + ", details"}>
          <div className="crew-pop-head">
            <span className="crew-ic" aria-hidden="true">
              {I(a.icon, 16)}
            </span>
            <span>
              <b>{a.name}</b>
              <small>
                {a.role}
                {a.model ? " · " + a.model : ""}
              </small>
            </span>
            <button type="button" className="crew-pop-x" aria-label="Close" onClick={() => setOpenKey(null)}>
              {I("x", 14)}
            </button>
          </div>
          {a.task ? <p className="crew-pop-task">{a.task}</p> : null}
          <dl>
            <div>
              <dt>Now</dt>
              <dd>{line}</dd>
            </div>
            {a.minutes != null ? (
              <div>
                <dt>Running</dt>
                <dd className="kb-mono">{a.minutes} min</dd>
              </div>
            ) : null}
            {a.share != null ? (
              <div>
                <dt>AI used</dt>
                <dd className="kb-mono">
                  {a.share}% {a.shareLabel}
                </dd>
              </div>
            ) : null}
            {a.attempt ? (
              <div>
                <dt>Try</dt>
                <dd>{a.attempt}</dd>
              </div>
            ) : null}
          </dl>
          {a.href || a.decHref ? (
            <div className="crew-pop-btns">
              {a.decHref ? (
                <a className="av-btn" data-size="sm" data-variant="primary" href={a.decHref}>
                  Open the decision
                </a>
              ) : null}
              {a.href ? (
                <a className="av-btn" data-size="sm" data-variant="secondary" href={a.href}>
                  {a.hrefLabel}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * crew: crewVals() output. projects: [{ id, name, working }] and pick(id) for the picker (Factory Live);
 * leave them out on a project's own page.
 */
export function Crew({ crew, I, projects, pick, titleId = "crew-h" }) {
  const [openKey, setOpenKey] = useState(null);
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const off = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpenKey(null);
        setMenu(false);
      }
    };
    const esc = (e) => {
      if (e.key === "Escape") {
        setOpenKey(null);
        setMenu(false);
      }
    };
    document.addEventListener("pointerdown", off);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", off);
      document.removeEventListener("keydown", esc);
    };
  }, []);
  useEffect(() => setOpenKey(null), [crew && crew.mission && crew.mission.id]);
  if (!crew) return null;
  const n = crew.modules.length;
  return (
    <section className="crew lib-card" aria-labelledby={titleId} ref={ref} data-ui="Crew">
      <header className="crew-top">
        <h2 id={titleId} className="sr-only">
          Crew: {crew.mission.name}
        </h2>
        {projects && pick ? (
          <div className="crew-picker">
            <button type="button" className="crew-pick" aria-expanded={menu ? "true" : "false"} aria-haspopup="listbox" onClick={() => setMenu(!menu)}>
              {I("folder", 14)}
              <span>{crew.mission.name}</span>
              {I("chevron-down", 14)}
            </button>
            {menu ? (
              <ul className="crew-menu" role="listbox" aria-label="Project">
                {projects.map((p) => (
                  <li key={p.id} role="option" aria-selected={p.id === crew.mission.id ? "true" : "false"}>
                    <button
                      type="button"
                      onClick={() => {
                        pick(p.id);
                        setMenu(false);
                      }}
                    >
                      <span className="crew-dot" style={{ "--dot": p.dot }} aria-hidden="true"></span>
                      <span className="crew-menu-n">{p.name}</span>
                      <span className="crew-menu-w">{p.working ? p.working + " working" : p.state}</span>
                      {p.id === crew.mission.id ? I("check", 14) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <span className="crew-pick crew-pick-static">
            {I("users", 14)}
            <span>Crew</span>
          </span>
        )}
        <span className="crew-count" role="status">
          <b data-on={crew.working ? "true" : undefined}>{crew.working} working</b>
          <span>{crew.total} agents</span>
        </span>
      </header>
      {!crew.lead ? (
        <EmptyState scene="noTabs" size="sm" title="No crew yet" heading="p">
          A crew forms when the plan is approved and the first module is dispatched.
        </EmptyState>
      ) : (
        <div className="crew-tree" style={{ "--n": Math.max(1, n) }}>
          <div className="crew-leadrow" data-has={n ? "true" : undefined}>
            <Card a={crew.lead} I={I} openKey={openKey} setOpenKey={setOpenKey} />
          </div>
          {n ? (
            <ol className="crew-cols">
              {crew.modules.map((x) => (
                <li key={x.key} className="crew-col" data-st={x.st}>
                  <Card a={x} I={I} openKey={openKey} setOpenKey={setOpenKey} />
                  {x.subs.length ? (
                    <ol className="crew-subs" aria-label={"Checking " + x.ref}>
                      {x.subs.map((y) => (
                        <li key={y.key} data-st={y.st}>
                          <Card a={y} I={I} sub openKey={openKey} setOpenKey={setOpenKey} />
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      )}
    </section>
  );
}
