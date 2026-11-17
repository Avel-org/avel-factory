import { Fragment, useEffect, useRef, useState } from "react";
import { CanonDock } from "./CanonDock.jsx";
import { list } from "../../lib/dc";
import { Orb, TNode } from "../../kit/Trail";
import { EmptyArtFor } from "../../kit/EmptyState";

/**
 * Gate 0: Canon's interview beside the checkpoint document. Before the interview starts it shows what's
 * coming; once the plan is finalized it shows every checkpoint read-only with what was pinned.
 */
export function CanonPage({ vals }) {
  const cv = vals.cv;
  if (cv && cv.finalized) return <Finalized cv={cv} />;
  if (cv && cv.justFinalized) return <JustFinalized cv={cv} />;
  if (cv) return <Interview cv={cv} />;
  return <NotStarted es={vals.es} />;
}

/* ---------------------------------------------------------------- the steps */
function Steps({ cv }) {
  return (
    <nav className="cv-steps" aria-label="Gate 0 checkpoints" data-gap="CR-W18">
      <ol>
        {cv.steps.map((st) => (
          <li key={st.key} data-state={st.state}>
            <a href={st.href} onClick={st.go} aria-current={st.current}>
              <span className="cv-step-dot" aria-hidden="true">
                {st.state === "approved" ? cv.I("check", 12) : null}
              </span>
              <span className="cv-step-text">
                <b>
                  {st.num ? <span className="cv-step-num">{st.num}</span> : null}
                  {st.name}
                </b>
                <small>{st.when || st.word}</small>
              </span>
            </a>
          </li>
        ))}
      </ol>
      <div className="cv-progress" role="img" aria-label={cv.meta.pctLabel}>
        <i style={{ "--pct": cv.meta.pct / 100 }}></i>
      </div>
    </nav>
  );
}

/* ---------------------------------------------------------------- active interview */
function Interview({ cv }) {
  const tab = cv.tab;
  return (
    <div className="cv" data-ui="CanonInterview">
      <Steps cv={cv} />
      <div className="cv-switch lib-seg" role="tablist" aria-label="Show">
        <button
          type="button"
          role="tab"
          className="lib-seg-btn"
          aria-selected={tab === "chat"}
          onClick={() => cv.setTab("chat")}
        >
          Interview
        </button>
        <button
          type="button"
          role="tab"
          className="lib-seg-btn"
          aria-selected={tab === "doc"}
          onClick={() => cv.setTab("doc")}
        >
          {cv.cp ? (cv.cp.key === "final" ? "Finalize" : "Checkpoint " + cv.cp.key) : "Checkpoint"}
        </button>
      </div>
      <div className="cv-cols" data-tab={tab}>
        <Chat cv={cv} />
        <Doc cv={cv} />
      </div>
    </div>
  );
}

function Chat({ cv }) {
  const ch = cv.chat;
  const list = useRef(null);
  // stay pinned to the newest line while Canon streams, unless you've scrolled up to read
  const pinned = useRef(true);
  useEffect(() => {
    const el = list.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  });
  const onScroll = (e) => {
    const el = e.currentTarget;
    pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  };
  return (
    <section className="cv-chat lib-card" aria-labelledby="cv-chat-h">
      <header className="cv-chat-head">
        <h2 id="cv-chat-h">Interview</h2>
        {ch.presence ? <Presence p={ch.presence} /> : null}
        <span className="cv-meta">
          <span className="cv-meta-l">
            {cv.meta.minutes} · Canon {cv.meta.spent}
          </span>
          <span className="cv-meta-s">
            {cv.meta.minutesShort} · {cv.meta.spentShort}
          </span>
        </span>
      </header>
      <ol className="cv-msgs" ref={list} onScroll={onScroll} aria-live="polite" aria-busy={ch.busy}>
        {ch.messages.map((x) => (
          <li
            key={x.key}
            id={x.id}
            className="cv-msg"
            data-role={x.role}
            data-blocking={x.blocking}
            data-relayed={x.relayed}
          >
            {x.who ? (
              <span className="cv-who">
                {x.who}
                {x.relayed ? (
                  <span className="cv-src" data-src="relayed">
                    {(x.relayedBy || "Client") + ", through you"}
                  </span>
                ) : null}
                {x.ref ? <span className="kb-mono cv-ref">{x.ref}</span> : null}
                {x.answers ? <span className="cv-src">Answers {x.answers}</span> : null}
              </span>
            ) : null}
            {x.trace ? <Turn x={x} I={cv.I} /> : null}
            {x.text || !x.live ? (
              <p className="cv-text" data-live={x.live}>
                {x.text}
                {x.live && x.text ? <span className="tt-cursor" aria-hidden="true"></span> : null}
              </p>
            ) : null}
            {x.attach ? (
              <span className="cv-attach">
                {cv.I("paperclip", 14)}
                {x.attach}
              </span>
            ) : null}
            {x.ask ? (
              x.ask.state === "answered" ? (
                <p className="cv-answer">
                  {cv.I("check", 14)}
                  You answered: {x.ask.text}
                </p>
              ) : (
                <button type="button" className="cv-ask" data-state={x.ask.state} onClick={x.ask.show}>
                  <span className="cv-ask-dot" aria-hidden="true"></span>
                  {x.ask.state === "front" ? "Waiting on you below" : "In the queue · answer now"}
                </button>
              )
            ) : null}
            {x.blocking ? (
              <p className="cv-note">
                Blocks {x.blocksCk || "0.2"}. Also in Decisions as {x.ref}: answer it in either place.
              </p>
            ) : null}
            {x.ttft || x.stopped || x.settled ? (
              <p className="cv-foot">
                {x.stopped ? <span>Stopped by you</span> : null}
                {x.ttft ? <span className="kb-mono">{x.ttft}</span> : null}
                {x.settled ? (
                  <span className="cv-settled">
                    {cv.I("check", 12)}
                    {x.settled}
                  </span>
                ) : null}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
      <CanonDock ch={ch} I={cv.I} clientName={cv.clientName} noClient={cv.noClient} />
    </section>
  );
}

/** Canon's presence: an orb whose motion says what he's doing, the word for it, and the step. */
function Presence({ p }) {
  return (
    <span className="cv-presence" data-turn={p.turn} role="status" aria-live="polite">
      <Orb size={20} state={p.orb} />
      {p.label.toLowerCase().startsWith(p.word.toLowerCase()) ? null : <span className="cv-presence-w">{p.word}</span>}
      <span className="cv-presence-l" data-lead={p.label.toLowerCase().startsWith(p.word.toLowerCase()) ? "true" : undefined}>
        {p.label}
      </span>
      {p.t0 ? <Clock t0={p.t0} /> : null}
    </span>
  );
}

// not a fetch: the on-screen clock for Canon's turn, a tenth of a second at a time
function Clock({ t0 }) {
  const [, tick] = useState(0);
  useEffect(() => {
    // not a fetch: the on-screen clock
    const t = setInterval(() => tick((n) => n + 1), 100);
    return () => clearInterval(t);
  }, [t0]);
  return <span className="cv-clock kb-mono">{((Date.now() - t0) / 1000).toFixed(1)} s</span>;
}

/** What Canon did on this turn: live as it happens, folded into one line once it's done. */
function Turn({ x, I }) {
  const [open, setOpen] = useState(false);
  const steps = x.trace || [];
  const working = steps.some((y) => y.st === "running");
  const show = x.live || working || open;
  return (
    <div className="cv-turn" data-live={x.live || (working ? "true" : undefined)}>
      {!x.live && !working ? (
        <button type="button" className="cv-turn-sum" aria-expanded={open ? "true" : "false"} onClick={() => setOpen(!open)}>
          {I("sparkles", 12)}
          <span>
            {steps.length} steps{x.took ? " · " + x.took : ""}
          </span>
          {I(open ? "chevron-up" : "chevron-down", 12)}
        </button>
      ) : null}
      {show ? (
        <ol className="cv-trace" aria-label="What Canon is doing">
          {steps.map((y) => (
            <li key={y.key} data-st={y.st}>
              <TNode st={y.st === "stopped" ? "parked" : y.st} I={I} />
              <span>{y.label}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

/** Canon's question pinned beside the line it's about. Answering here is the same answer as in the deck and in Decisions. */
function Margin({ ask, I }) {
  return (
    <aside className="cd-margin" data-answered={ask.answered ? "true" : undefined} aria-label={"Canon asks " + ask.ref}>
      <span className="cd-margin-k">
        <span className="kb-mono">{ask.ref}</span> Canon asks
      </span>
      <span className="cd-margin-q">{ask.title}</span>
      {ask.answered ? (
        <span className="cd-margin-a">
          {I("check", 14)}
          {ask.answered}
        </span>
      ) : (
        <span className="cd-margin-opts">
          {ask.options.map((o) => (
            <button
              key={o.key}
              type="button"
              className="av-btn"
              data-size="sm"
              data-variant="secondary"
              data-rec={o.rec}
              onClick={o.pick}
            >
              {o.label}
            </button>
          ))}
          <button type="button" className="cd-link" onClick={ask.focus}>
            In your words
          </button>
        </span>
      )}
    </aside>
  );
}

const SRC_ICON = {
  said: "message-circle",
  relayed: "message-circle",
  uploaded: "file-text",
  repo: "git-branch",
  inferred: "sparkles",
};

function Doc({ cv }) {
  const d = cv.doc,
    cp = cv.cp;
  if (!cp) return null;
  return (
    <section className="cv-doc lib-card" aria-labelledby="cv-doc-h" data-state={cp.state}>
      <header className="cv-doc-head">
        <div>
          <h2 id="cv-doc-h">{cp.key === "final" ? "Finalize" : cp.key + " " + cp.name}</h2>
          <span className="cv-meta">{[cp.word, cp.version, cp.when].filter(Boolean).join(" · ")}</span>
        </div>
      </header>

      {cv.offered && cv.offered.rows.length ? (
        <fieldset className="up-offered" data-ui="ClientFilesOffered">
          <legend>
            Client files offered <span className="up-muted">· {cv.clientName}</span>
          </legend>
          <p className="up-hint">Canon will read the ones you keep.</p>
          <ul>
            {cv.offered.rows.map((r) => (
              <li key={r.key}>
                <label className="up-check">
                  <input type="checkbox" checked={r.kept} onChange={r.toggle} />
                  <span className="up-box" aria-hidden="true"></span>
                  <span className="up-check-t">
                    {r.name}
                    <small>{r.type}</small>
                  </span>
                </label>
                <a className="up-offered-open" href={r.href} aria-label={"Open " + r.name}>
                  {cv.I("chevron-right", 16)}
                </a>
              </li>
            ))}
          </ul>
          <p className="up-hint">
            {cv.offered.keptCount} of {cv.offered.rows.length} kept
          </p>
        </fieldset>
      ) : null}

      {d && d.kind === "sections" ? (
        <dl className="cv-secs" data-gap="CR-W18">
          {d.sections.map((x) => (
            <div key={x.key} className="cv-sec">
              <dt>{x.k}</dt>
              {x.lines.map((l) => (
                <dd key={l.key} data-proposed={l.proposed}>
                  <span>{l.text}</span>
                  {l.href ? (
                    <a className="cv-src" data-src={l.src} href={l.href}>
                      {cv.I(SRC_ICON[l.src] || "dot", 12)}
                      {l.srcLabel}
                    </a>
                  ) : (
                    <span className="cv-src" data-src={l.src}>
                      {cv.I(SRC_ICON[l.src] || "dot", 12)}
                      {l.srcLabel}
                      {l.proposed ? ", proposed" : ""}
                    </span>
                  )}
                </dd>
              ))}
              {x.empty ? <dd className="cv-sec-empty">{x.empty}</dd> : null}
            </div>
          ))}
        </dl>
      ) : null}

      {d && d.kind === "breakdown" ? (
        <div className="cv-bd">
          <h3>Modules</h3>
          <ul className="cv-mods">
            {d.modules.map((x) => (
              <li key={x.key} data-blocked={x.blocked ? "true" : undefined} data-ask={x.ask ? "true" : undefined}>
                <b>
                  <span className="kb-mono op-ref">{x.ref}</span> {x.title}
                </b>
                <span className="op-sub">{[x.kind, x.deps, x.counts].join(" · ")}</span>
                {x.blocked ? <span className="cv-blocked">{x.blocked}</span> : null}
                {x.ask ? <Margin ask={x.ask} I={cv.I} /> : null}
              </li>
            ))}
          </ul>
          <h3>Order, computed from dependencies</h3>
          <ol className="cv-waves">
            {d.waves.map((w) => (
              <li key={w.key}>
                <span className="op-sub">{w.label}</span>
                <span className="kb-mono">{w.mods.join(", ")}</span>
              </li>
            ))}
          </ol>
          <h3>Scenarios by level</h3>
          <p className="op-p">{d.levels.map((x) => x.n + " " + x.k.toLowerCase()).join(" · ")}</p>
          <h3>Checks</h3>
          <ul className="cv-rubric" data-gap="CR-W18">
            {d.rubric.map((r) => (
              <li key={r.key} data-result={r.result} data-accepted={r.accepted}>
                <span className="cv-rb-id kb-mono">{r.id}</span>
                <span className="cv-rb-main">
                  <span>{r.text}</span>
                  {r.note ? <small>{r.note}</small> : null}
                  {r.by ? <small>{r.by}</small> : null}
                </span>
                <span className="cv-rb-side">
                  <span
                    className="av-tag"
                    data-tone={{ pass: "verified", fail: "stopped", advisory: "pending", finding: "needs" }[r.result]}
                  >
                    {r.accepted ? "Accepted" : r.word}
                  </span>
                  {r.fix ? (
                    <button type="button" className="av-btn" data-size="sm" data-variant="secondary" onClick={r.fix}>
                      Use the suggestion
                    </button>
                  ) : null}
                  {r.accept ? (
                    <button type="button" className="av-btn" data-size="sm" data-variant="secondary" onClick={r.accept}>
                      Accept with a reason
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          <h3>Risks</h3>
          <ul className="cv-plain">
            {d.risks.map((x, i) => (
              <li key={x} data-ask={d.riskAsks && d.riskAsks[i] ? "true" : undefined}>
                <span>{x}</span>
                {d.riskAsks && d.riskAsks[i] ? <Margin ask={d.riskAsks[i]} I={cv.I} /> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {d && d.kind === "roster" ? (
        <div className="cv-bd">
          <h3>Package</h3>
          <p className="op-p">
            <b>{d.pkg.name}</b>, {d.pkg.deadline}
          </p>
          <p className="op-p op-sub">{d.pkg.why}</p>
          <h3>Template</h3>
          <p className="op-p op-sub">{d.template}</p>
          <h3>What gets checked</h3>
          <ul className="cv-plain">
            {d.checks.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <h3>Who does each job</h3>
          <div className="cv-table" role="table" aria-label="Agents per job">
            <div className="cv-tr" role="row" data-head="true">
              {["Module", "Builds", "Tests", "End to end", "Reviews", "Security"].map((h) => (
                <span key={h} role="columnheader">
                  {h}
                </span>
              ))}
            </div>
            {d.roster.map((r) => (
              <div key={r.key} className="cv-tr" role="row">
                <span role="cell" className="kb-mono">
                  {r.ref}
                </span>
                {r.cells.map((c, i) => (
                  <span key={i} role="cell">
                    {c}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <p className="op-sub">
            {d.rosterVersion}. Code picked every agent from the work kind; nothing here is a model's choice.
          </p>
          <h3>Critical path</h3>
          <p className="op-p">{d.critical}</p>
          <h3>Budget check</h3>
          <ul className="cv-rubric">
            {d.rows.map((r) => (
              <li key={r.key} data-result={r.ok ? "pass" : "fail"}>
                <span className="cv-rb-id kb-mono">{r.ref}</span>
                <span className="cv-rb-main">
                  <span>
                    Estimate {r.est}, {r.need} with retries, against {r.cap}
                  </span>
                  {r.raisedNote ? <small>{r.raisedNote}</small> : null}
                </span>
                <span className="cv-rb-side">
                  <span className="av-tag" data-tone={r.ok ? "verified" : "stopped"}>
                    {r.ok ? "Fits" : "Over"}
                  </span>
                  {r.raise ? (
                    <button
                      type="button"
                      className="av-btn"
                      data-size="sm"
                      data-variant="secondary"
                      onClick={r.raise.go}
                    >
                      {r.raise.label}
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          <p className="op-p" data-ok={d.totalOk}>
            Mission: {d.total}
          </p>
        </div>
      ) : null}

      {d && d.kind === "drafting" ? <p className="cv-drafting">{d.text}</p> : null}

      {d && d.kind === "context" ? (
        <div className="cv-bd">
          <h3>Codebase</h3>
          <dl className="op-ledger cv-ledger">
            {d.analysis.map((x) => (
              <div key={x.key}>
                <dt>{x.k}</dt>
                <dd className="kb-mono">{x.v}</dd>
              </div>
            ))}
          </dl>
          <h3>Readiness</h3>
          <div className="cv-ready-box" data-state={d.readiness.state}>
            <span className="av-tag" data-tone={d.readiness.state === "ready" ? "verified" : "needs"}>
              {d.readiness.word}
            </span>
            <p className="op-p">{d.readiness.reason}</p>
            {d.readiness.waived ? (
              <p className="op-sub">You chose to go ahead: “{d.readiness.waived}”</p>
            ) : d.readiness.waive ? (
              <div className="cv-waive">
                <label htmlFor="cv-waive">Go ahead anyway? Say why</label>
                <textarea
                  id="cv-waive"
                  rows="2"
                  value={d.readiness.draft}
                  onChange={d.readiness.onDraft}
                  placeholder="Logged with the plan"
                />
                <button
                  type="button"
                  className="av-btn"
                  data-size="sm"
                  data-variant="secondary"
                  onClick={d.readiness.waive}
                  disabled={!d.readiness.draft.trim() || undefined}
                >
                  Go ahead on partial
                </button>
              </div>
            ) : null}
          </div>
          <h3>Who owns which files</h3>
          <ul className="cv-mods">
            {d.territories.map((t) => (
              <li key={t.key} className="cv-terr">
                <span className="kb-mono op-ref">{t.ref}</span>
                <span className="op-sub kb-mono">{t.paths}</span>
              </li>
            ))}
          </ul>
          <p className="op-sub">{d.overlap}</p>
          <h3>What each module needs</h3>
          <ul className="cv-rubric">
            {d.sources.map((x) => (
              <li key={x.key} data-result={x.ok ? "pass" : "fail"}>
                <span className="cv-rb-id kb-mono">{x.ref}</span>
                <span className="cv-rb-main">
                  <span>{x.need}</span>
                  {x.have ? <small>{x.have}</small> : null}
                </span>
                <span className="cv-rb-side">
                  <span className="av-tag" data-tone={x.ok ? "verified" : "needs"}>
                    {x.ok ? "Have it" : "Missing"}
                  </span>
                  {x.add ? (
                    <button type="button" className="av-btn" data-size="sm" data-variant="secondary" onClick={x.add}>
                      {cv.I("paperclip", 14)}
                      Add the file
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {d && d.kind === "final" ? (
        <div className="cv-bd">
          <h3>Checked again before you finalize</h3>
          <dl className="op-ledger cv-ledger">
            {d.checks.map((x) => (
              <div key={x.key}>
                <dt>{x.k}</dt>
                <dd>{x.v}</dd>
              </div>
            ))}
          </dl>
          <h3>Locked in when you approve</h3>
          <dl className="op-ledger cv-ledger">
            {d.pins.map((x) => (
              <div key={x.key}>
                <dt>{x.k}</dt>
                <dd className="kb-mono">{x.v}</dd>
              </div>
            ))}
          </dl>
          <h3>Then, without you</h3>
          <ol className="cv-next">
            {d.next.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {d && d.kind === "locked" ? (
        <div className="cv-locked">
          <p className="op-p">
            {d.draftingNow
              ? "Canon is drafting this checkpoint now."
              : "Opens when the checkpoint before it is approved."}{" "}
            It will hold:
          </p>
          <ul className="cv-plain">
            {d.will.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {cv.act ? (
        <footer className="cv-act">
          {cv.act.blockers.length ? (
            <ul className="cv-blockers" aria-label="Before you can approve">
              {cv.act.blockers.map((b) => (
                <li key={b.key}>
                  {cv.I("circle-dot", 14)}
                  {b.href ? <a href={b.href}>{b.text}</a> : <span>{b.text}</span>}
                </li>
              ))}
            </ul>
          ) : cv.act.clean ? (
            <p className="cv-clean" role="status">
              <span className="cv-clean-k">
                {cv.I("check", 14)}
                Clean
              </span>
              <span>{cv.act.clean}</span>
              <span className="cv-ready">{cv.act.unlocks}</span>
            </p>
          ) : (
            <p className="cv-ready">{cv.act.unlocks || "Ready to approve"}</p>
          )}
          <div className="cv-act-btns">
            {cv.act.rewrite ? (
              <button type="button" className="av-btn" data-variant="ghost" onClick={cv.act.rewrite}>
                Ask Canon for a change
              </button>
            ) : null}
            <button
              type="button"
              className="av-btn"
              data-variant="primary"
              disabled={!cv.act.can || undefined}
              onClick={cv.act.approve || undefined}
            >
              {cv.I("check", 16)}
              {cv.act.label}
            </button>
          </div>
        </footer>
      ) : null}
    </section>
  );
}

/* ---------------------------------------------------------------- finalized: the record */
function Finalized({ cv }) {
  const sm = cv.summary;
  return (
    <div className="cv" data-ui="CanonRecord">
      <Steps cv={cv} />
      <div className="cv-cols cv-cols-final">
        <section className="lib-card cv-doc" aria-labelledby="cv-rec-h">
          <header className="cv-doc-head">
            <div>
              <h2 id="cv-rec-h">Approved checkpoints</h2>
              <span className="cv-meta">
                Finalized {sm.finalizedAt}. Read-only; a change starts a new plan version.
              </span>
            </div>
          </header>
          <ol className="cv-record">
            {sm.rows.map((r) => (
              <li key={r.key} data-current={r.current}>
                <span className="cv-step-dot" aria-hidden="true">
                  {cv.I("check", 12)}
                </span>
                <span className="cv-rec-main">
                  <b>
                    {r.num ? <span className="cv-step-num">{r.num}</span> : null}
                    {r.name}
                  </b>
                  <span className="op-p">{r.text}</span>
                </span>
                <small className="op-sub">{r.when}</small>
              </li>
            ))}
          </ol>
        </section>
        <aside className="cv-side">
          <section className="lib-card op-panel" aria-labelledby="cv-pin-h">
            <h2 className="op-h" id="cv-pin-h">
              Pinned at finalize
            </h2>
            <dl className="op-ledger">
              {sm.pinned.map((x) => (
                <div key={x.key}>
                  <dt>{x.k}</dt>
                  <dd className="kb-mono">{x.v}</dd>
                </div>
              ))}
            </dl>
            <a className="op-more" href={sm.planHref}>
              Open the plan
            </a>
          </section>
          <section className="lib-card op-panel" aria-labelledby="cv-int-h">
            <h2 className="op-h" id="cv-int-h">
              Interview
            </h2>
            <p className="op-p op-sub">{sm.interview}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- not started */
const COMING = [
  ["0.1", "Brief", "Client or template, what it needs and why"],
  ["0.2", "Breakdown", "The modules of the work"],
  ["0.3", "Mission and roster", "Package, agents and the budget check"],
  ["0.4", "Context", "The repo, files and readiness"],
  ["", "Finalize", "You approve the plan; the clock starts"],
];
function NotStarted({ es }) {
  return (
    <div className="cr-two">
      <div className="lib-card cr-stepper" data-ui="StepTracker">
        <span className="scr-h3">What happens here</span>
        <ol className="cr-steps">
          {COMING.map(([n, name, what]) => (
            <li key={name} className="cr-step">
              <span className="cr-step-dot" aria-hidden="true"></span>
              <span className="cr-step-name">
                {n ? <span className="cr-step-num">{n}</span> : null}
                {name}
              </span>
              <span className="cr-step-what">{what}</span>
            </li>
          ))}
        </ol>
      </div>
      <div style={{ display: "flex", minWidth: "0" }}>
        <div className="av-state" data-ui="WidgetState" data-state="empty">
          <EmptyArtFor scene={es?.scene} />
          <h2 className="av-state-title">{es?.title}</h2>
          <p className="av-state-msg">{es?.msg}</p>
          {es?.hasActions ? (
            <div className="av-state-actions">
              {list(es?.actions).map((a, i) => (
                <Fragment key={i}>
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
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- right after you finalize */
function JustFinalized({ cv }) {
  const j = cv.justFinalized;
  return (
    <div className="cv" data-ui="CanonFinalized">
      <Steps cv={cv} />
      <section className="lib-card cv-doc cv-done cv-stagger" aria-labelledby="cv-done-h" role="status">
        <span className="cv-done-mark" aria-hidden="true">
          {cv.I("check", 20)}
        </span>
        <h2 id="cv-done-h">Plan approved</h2>
        <p className="cv-meta">Finalized {j.at}</p>
        <ul className="cv-plain">
          {j.lines.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <a className="av-btn" data-variant="secondary" href={j.planHref}>
          Open the plan
        </a>
      </section>
    </div>
  );
}
