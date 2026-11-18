// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.
import { Fragment, lazy, Suspense, useEffect, useRef, useState } from "react";
import { css, list } from "../../lib/dc";
// The empty state art is only needed when the queue is empty (E16, T-F8).
const EmptyState = lazy(() => import("../../kit/EmptyState").then((m) => ({ default: m.EmptyState })));

export function DecisionsPage({ vals }) {
  const { decClear, decCount, decDone, decDoneCount, decRows, dp, hero, ic, queueTitle, rv } = vals;
  // Bottleneck audit B1: after you decide, the next item used to arrive scrolled out of sight (its
  // title 376px above the viewport) and focus fell back to the page. Bring the new item's title
  // into view and put focus on it, so the next decision is in front of you without scrolling back.
  const firstKey = useRef(hero?.key);
  useEffect(() => {
    if (!hero?.key || hero.key === firstKey.current) return;
    firstKey.current = null;
    const t = document.getElementById("hero-t");
    const sec = t && t.closest(".cr-hero");
    if (!sec) return;
    const top = sec.getBoundingClientRect().top;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (top < 0 || top > innerHeight * 0.6) sec.scrollIntoView({ block: "start", behavior: still ? "auto" : "smooth" });
    t.focus({ preventScroll: true });
  }, [hero?.key]);
  return (
    <div className="cr-dash" data-ui="DecisionsDashboard">
      {hero?.actionable ? <DecisionPin hero={hero} ic={ic} /> : null}
      <div className="cr-dash-main">
        {hero ? (
          <>
            <section
              key={hero?.key}
              className="cr-hero"
              aria-labelledby="hero-t"
              data-ui="DecisionHero"
              data-state={hero?.state}
              data-kind={hero?.kind}
            >
              <header className="cr-hero-top">
                <span className="cr-hero-k">Next up</span>
                <span className="av-tag" data-ui="Tag">
                  {hero?.kindLabel}
                </span>
                {hero?.clean ? (
                  <span className="av-tag cr-clean-tag" data-ui="Tag">
                    {ic?.check14}
                    Clean
                  </span>
                ) : null}
                <a className="cr-dc-proj" href={hero?.projHref}>
                  <span className="cr-pdot" style={css(`--dot: ${hero?.dot ?? ""}`)} aria-hidden="true"></span>
                  {hero?.project}
                  <span className="cr-dc-client">{hero?.client}</span>
                </a>
                <span className="cr-dc-exp" data-tone={hero?.expTone}>
                  {hero?.expGlyph}
                  {hero?.expLabel}
                </span>
              </header>
              {hero?.returned ? <Returned r={hero.returned} /> : null}
              <h2 className="cr-hero-title" id="hero-t" tabIndex={-1}>
                {hero?.ref ? <span className="cr-dc-ref">{hero?.ref}</span> : null}
                {hero?.title}
              </h2>
              <p className="cr-hero-why">{hero?.why}</p>
              {hero?.brief ? <Brief b={hero.brief} /> : null}
              <div className="cr-hero-grid">
                <div className="cr-hero-col">
                  <span className="cr-hero-label">
                    Evidence
                    {hero?.cleanHref ? (
                      <a className="cr-clean-link" href={hero.cleanHref}>
                        See the breakdown
                      </a>
                    ) : null}
                  </span>
                  <ul className="cr-evl">
                    {list(hero?.evidence).map((e, $index) => (
                      <Fragment key={$index}>
                        <li className="cr-evl-item">
                          <span className="cr-evl-text">{e?.text}</span>
                          {e?.hasProof ? (
                            <>
                              <button
                                type="button"
                                className="cr-proof-chip"
                                aria-expanded={e?.openStr}
                                onClick={e?.toggle}
                              >
                                {e?.chipLabel}
                              </button>
                            </>
                          ) : null}
                          {e?.open ? (
                            <>
                              <pre className="cr-proof">{e?.proof}</pre>
                            </>
                          ) : null}
                        </li>
                      </Fragment>
                    ))}
                  </ul>
                </div>
                <div className="cr-hero-col">
                  <span className="cr-hero-label">If you approve</span>
                  <p className="cr-hero-rej">{hero?.ifYes}</p>
                  {hero?.unlocks ? (
                    <p className="cr-dc-unlocks">
                      {ic?.arrowRight14}
                      <span>
                        Unlocks <b>{hero.unlocks}</b>
                      </span>
                    </p>
                  ) : null}
                  {hero?.rejectVerb && hero?.ifNo ? (
                    <>
                      <span className="cr-hero-label">If you {hero?.rejectVerb}</span>
                      <p className="cr-hero-rej">{hero?.ifNo}</p>
                    </>
                  ) : null}
                  {hero?.cost ? (
                    <>
                      <div className="cr-dc-cost">
                        <span>AI budget</span>
                        <b>{hero?.cost}</b>
                        <span>{hero?.costNote}</span>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
              <KindBody d={hero} ic={ic} />
              {hero?.stale ? (
                <>
                  <div className="scr-state-bar" data-state="staleVersion" role="status">
                    {hero?.staleGlyph}
                    <span className="cr-state-bar-text">
                      <b>Review the new version first.</b> {hero?.ref} moved to version {hero?.nextVersion} while you
                      were reading.
                    </span>
                    <button
                      type="button"
                      className="av-btn"
                      data-size="sm"
                      data-variant="primary"
                      onClick={hero?.review}
                    >
                      Review v{hero?.nextVersion}
                    </button>
                  </div>
                </>
              ) : null}
              {hero?.refetching ? (
                <div className="scr-state-bar" data-state="staleVersion" role="status">
                  {hero?.staleGlyph}
                  <span className="cr-state-bar-text">{hero?.refetchText}</span>
                </div>
              ) : null}
              {hero?.gone ? (
                <>
                  <div className="cr-dc-gone" role="status">
                    {hero?.goneGlyph}
                    {hero?.goneText}
                  </div>
                </>
              ) : null}
              {hero?.actionable ? (
                <>
                  {!hero?.noWhy ? (
                    <div className="cr-why" data-ui="ReasonField">
                      <div className="cr-why-head">
                        <label className="cr-why-label" htmlFor={`why-${hero?.hid ?? ""}`}>
                          Why
                        </label>
                        <span className="cr-why-help">{hero?.whyHelp} Logged with the decision in Activity.</span>
                      </div>
                      <div className="cr-why-field" data-empty={hero?.reasonEmpty} data-optional={hero?.whyOptional}>
                        <textarea
                          id={`why-${hero?.hid ?? ""}`}
                          className="cr-why-input"
                          rows="3"
                          maxLength="280"
                          value={hero?.reason ?? ""}
                          onChange={hero?.onReason}
                          placeholder="Say why in a sentence. Your future self will read this."
                        ></textarea>
                        <div className="cr-why-foot">
                          <span className="cr-why-count">{hero?.reasonCount}/280</span>
                          <button type="button" className="cr-why-clear" onClick={hero?.clearReason}>
                            Clear
                          </button>
                        </div>
                      </div>
                      {hero?.suggest?.length ? (
                        <div className="cr-why-sugg" role="group" aria-label="Suggested reasons">
                          <span className="cr-why-sugg-k">From OSA</span>
                          {list(hero?.suggest).map((sg, $index) => (
                            <Fragment key={$index}>
                              <button type="button" className="cr-why-chip" aria-pressed={sg?.on} onClick={sg?.pick}>
                                {sg?.label}
                              </button>
                            </Fragment>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="cr-hero-foot">
                    <span className="cr-hero-foot-note">{hero?.footNote}</span>
                    {list(hero?.more).map((o) => (
                      <button
                        key={o.key}
                        type="button"
                        className="av-btn"
                        data-ui="Button"
                        data-variant="secondary"
                        title={o.cons}
                        onClick={o.pick}
                        disabled={hero?.busy}
                      >
                        {o.label}
                      </button>
                    ))}
                    {hero?.reject ? (
                      <button
                        type="button"
                        className="av-btn"
                        data-ui="Button"
                        data-variant="secondary"
                        onClick={hero?.reject}
                        disabled={hero?.noReasonNo}
                      >
                        {hero?.rejectLabel}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="av-btn cr-hero-approve"
                      data-ui="Button"
                      data-variant="primary"
                      onClick={hero?.approve}
                      disabled={hero?.noReason}
                      data-busy={hero?.busy}
                    >
                      {hero?.approveIcon}
                      {hero?.approveLabel}
                    </button>
                  </div>
                  <SendsLine call={hero?.call} />
                </>
              ) : null}
            </section>
          </>
        ) : null}
        {decRows?.length ? (
          <>
            <section className="cr-sect" aria-labelledby="dq-h">
              <header className="cr-sect-head">
                <h2 className="cr-sect-title" id="dq-h">
                  {queueTitle}
                </h2>
                <span className="cr-sect-count">{decCount}</span>
                <span className="cr-sect-note">Soonest to expire first</span>
              </header>
              <div className="lib-card cr-dq" role="list" data-ui="DecisionQueue">
                {" "}
                {list(decRows).map((d, $index) => (
                  <Fragment key={$index}>
                    {" "}
                    {d?.divider ? (
                      <>
                        <div className="cr-dq-div" role="presentation">
                          <span>{d?.divider}</span>
                        </div>
                      </>
                    ) : null}{" "}
                    <div
                      className="cr-dq-item"
                      role="listitem"
                      data-open={d?.open}
                      data-state={d?.state}
                      data-kind={d?.kind}
                    >
                      {" "}
                      <button
                        type="button"
                        className="cr-dq-row"
                        data-ref={d?.ref}
                        aria-expanded={d?.openStr}
                        aria-controls={d?.bodyId}
                        onClick={d?.toggle}
                        onFocus={d?.onFocus}
                      >
                        <span className="cr-pdot" style={css(`--dot: ${d?.dot ?? ""}`)} aria-hidden="true"></span>
                        <span className="cr-dq-main">
                          <span className="cr-dq-title">
                            {d?.ref ? <span className="cr-dc-ref">{d?.ref}</span> : null}
                            {d?.title}
                          </span>
                          <span className="cr-dq-meta">
                            {d?.project} · {d?.kindLabel}
                            {d?.clean ? (
                              <>
                                {" "}
                                · <b data-tone="ok">Clean</b>
                              </>
                            ) : null}
                            {d?.flag ? (
                              <>
                                {" "}
                                · <b data-tone={d?.flagTone}>{d?.flag}</b>
                              </>
                            ) : null}
                          </span>
                        </span>
                        {d?.cost ? (
                          <>
                            <span className="cr-dq-cost">{d?.cost}</span>
                          </>
                        ) : null}
                        <span className="cr-dc-exp" data-tone={d?.expTone}>
                          {d?.expGlyph}
                          {d?.expShort}
                        </span>
                        <span className="cr-dq-chev" aria-hidden="true">
                          {ic?.chevronDown16}
                        </span>
                      </button>{" "}
                      {d?.open ? (
                        <>
                          {" "}
                          <div className="cr-dq-body" id={d?.bodyId}>
                            {" "}
                            {d?.returned ? <Returned r={d.returned} /> : null}
                            <p className="cr-hero-why">{d?.why}</p>
                            {d?.brief ? <Brief b={d.brief} /> : null}
                            <ul className="cr-dc-evidence">
                              {list(d?.evidence).map((e, $index) => (
                                <Fragment key={$index}>
                                  <li>{e?.text}</li>
                                </Fragment>
                              ))}
                            </ul>{" "}
                            <div className="cr-dc-opts">
                              {" "}
                              <div className="cr-dc-opt" data-k="approve">
                                <span className="cr-dc-opt-k">
                                  {ic?.check14}
                                  {d?.approveLabel}
                                </span>
                                <p>{d?.approveCons}</p>
                              </div>{" "}
                              {d?.rejectLabel ? (
                                <div className="cr-dc-opt" data-k="reject">
                                  <span className="cr-dc-opt-k">
                                    {ic?.x14}
                                    {d?.rejectLabel}
                                  </span>
                                  <p>{d?.rejectCons}</p>
                                </div>
                              ) : null}
                              {list(d?.more).map((o) => (
                                <div key={o.key} className="cr-dc-opt" data-k="other">
                                  <span className="cr-dc-opt-k">{o.label}</span>
                                  <p>{o.cons}</p>
                                </div>
                              ))}
                            </div>{" "}
                            <KindBody d={d} ic={ic} />
                            {d?.cost ? (
                              <>
                                <div className="cr-dc-cost">
                                  <span>AI budget</span>
                                  <b>{d?.cost}</b>
                                  <span>{d?.costNote}</span>
                                </div>
                              </>
                            ) : null}{" "}
                            {d?.stale ? (
                              <>
                                <div className="scr-state-bar" data-state="staleVersion" role="status">
                                  {d?.staleGlyph}
                                  <span className="cr-state-bar-text">
                                    <b>Review the new version first.</b> {d?.ref} moved to version {d?.nextVersion}{" "}
                                    while you were reading.
                                  </span>
                                  <button
                                    type="button"
                                    className="av-btn"
                                    data-size="sm"
                                    data-variant="primary"
                                    onClick={d?.review}
                                  >
                                    Review v{d?.nextVersion}
                                  </button>
                                </div>
                              </>
                            ) : null}{" "}
                            {d?.refetching ? (
                              <div className="scr-state-bar" data-state="staleVersion" role="status">
                                {d?.staleGlyph}
                                <span className="cr-state-bar-text">{d?.refetchText}</span>
                              </div>
                            ) : null}
                            {d?.gone ? (
                              <>
                                <div className="cr-dc-gone" role="status">
                                  {d?.goneGlyph}
                                  {d?.goneText}
                                </div>
                              </>
                            ) : null}{" "}
                            {d?.actionable ? (
                              <>
                                {" "}
                                <div className="cr-dc-act">
                                  {" "}
                                  {!d?.noWhy ? (
                                    <label className="cr-dc-reason">
                                      <span>
                                        Reason <small>{d?.whyHelp}</small>
                                      </span>
                                      <textarea rows="2" value={d?.reason ?? ""} onChange={d?.onReason}></textarea>
                                    </label>
                                  ) : null}
                                  {false && rv?.prefilled ? (
                                    <>
                                      <label className="cr-dc-reason">
                                        <span>
                                          Reason <small>prefilled, edit if needed</small>
                                        </span>
                                        <textarea rows="2" value={d?.reason ?? ""} onChange={d?.onReason}></textarea>
                                      </label>
                                    </>
                                  ) : null}{" "}
                                  {rv?.chips ? (
                                    <>
                                      <div className="cr-dc-chips" role="radiogroup" aria-label="Reason">
                                        <span className="cr-dc-chips-k">Reason</span>
                                        {list(d?.chips).map((rc, $index) => (
                                          <Fragment key={$index}>
                                            <button
                                              type="button"
                                              role="radio"
                                              className="av-chip"
                                              aria-checked={rc?.checked}
                                              onClick={rc?.pick}
                                            >
                                              {rc?.label}
                                            </button>
                                          </Fragment>
                                        ))}
                                      </div>
                                    </>
                                  ) : null}{" "}
                                  {rv?.after ? (
                                    <>
                                      <p className="cr-dc-after">
                                        Reason after you tap: <q>{d?.reason}</q> You can change it for 6 seconds.
                                      </p>
                                    </>
                                  ) : null}{" "}
                                  <div className="cr-dc-btns">
                                    {" "}
                                    <a className="wl-link cr-dq-proj" href={d?.projHref}>
                                      Open {d?.project}
                                    </a>{" "}
                                    {list(d?.more).map((o) => (
                                      <button
                                        key={o.key}
                                        type="button"
                                        className="av-btn"
                                        data-ui="Button"
                                        data-variant="secondary"
                                        onClick={o.pick}
                                        disabled={d?.busy}
                                      >
                                        {o.label}
                                      </button>
                                    ))}
                                    {d?.reject ? (
                                      <button
                                        type="button"
                                        className="av-btn"
                                        data-ui="Button"
                                        data-variant="secondary"
                                        onClick={d?.reject}
                                        disabled={d?.noReasonNo}
                                      >
                                        {d?.rejectLabel}
                                      </button>
                                    ) : null}{" "}
                                    <button
                                      type="button"
                                      className="av-btn"
                                      data-ui="Button"
                                      data-variant="primary"
                                      onClick={d?.approve}
                                      disabled={d?.noReason}
                                      data-busy={d?.busy}
                                    >
                                      {d?.approveIcon}
                                      {d?.approveLabel}
                                    </button>{" "}
                                  </div>{" "}
                                  <SendsLine call={d?.call} />
                                </div>{" "}
                              </>
                            ) : null}{" "}
                          </div>{" "}
                        </>
                      ) : null}{" "}
                    </div>{" "}
                  </Fragment>
                ))}{" "}
              </div>
            </section>
          </>
        ) : null}
        {decClear ? (
          <>
            <section className="lib-card cr-panel">
              <Suspense fallback={null}>
              <EmptyState
                scene="nothing"
                title="Nothing needs you"
                action={
                  <a className="av-btn" data-ui="Button" data-variant="primary" href="#/live">
                    {ic?.radio16}Open Live
                  </a>
                }
              >
                The factory is at rest. New decisions land here with what approving and rejecting will do, before you
                tap.
              </EmptyState>
              </Suspense>
            </section>
          </>
        ) : null}
      </div>
      <aside className="cr-dash-rail" aria-label="Context">
        <section className="lib-card cr-panel" aria-labelledby="dr-done">
          {" "}
          <header className="cr-panel-head">
            <h2 className="cr-panel-title" id="dr-done">
              Decided today
            </h2>
            <span className="cr-panel-meta">{decDoneCount}</span>
          </header>{" "}
          {list(decDone).map((dd, $index) => (
            <Fragment key={$index}>
              {" "}
              <div className="cr-done-row">
                <span className="av-tag" data-ui="Tag" data-tone={dd?.tone}>
                  {dd?.choice}
                </span>
                <span className="cr-done-main">
                  <b>{dd?.title}</b>
                  <small>{dd?.meta}</small>
                  {dd?.sent ? <small className="cr-done-sent">Sent {dd.sent}</small> : null}
                  {dd?.reason ? <q>{dd?.reason}</q> : null}
                </span>
                {dd?.undo ? (
                  <>
                    <button type="button" className="wl-link" onClick={dd?.undo}>
                      Undo
                    </button>
                  </>
                ) : null}
              </div>{" "}
            </Fragment>
          ))}{" "}
        </section>
        {dp?.hasMovers ? (
          <>
            <section className="lib-card cr-panel" aria-labelledby="dr-mv">
              {" "}
              <header className="cr-panel-head">
                <h2 className="cr-panel-title" id="dr-mv">
                  Moving on their own
                </h2>
                <span className="cr-panel-meta">{dp?.moversMeta}</span>
              </header>{" "}
              {list(dp?.movers).map((mv, $index) => (
                <Fragment key={$index}>
                  <a className="cr-mini-row" href={mv?.href}>
                    <span
                      className="cr-pdot"
                      data-pulse={mv?.pulse}
                      style={css(`--dot: ${mv?.dot ?? ""}`)}
                      aria-hidden="true"
                    ></span>
                    <span className="cr-mini-row-name">{mv?.name}</span>
                    <span className="cr-mini-row-state">{mv?.state}</span>
                  </a>
                </Fragment>
              ))}{" "}
            </section>
          </>
        ) : null}
      </aside>
    </div>
  );
}

/**
 * Phone only: the decision you're on, pinned above the tab bar, so approving never needs a scroll. Same
 * handlers as the card's own buttons; when a reason is required and missing, it takes you to the field.
 */
function DecisionPin({ hero, ic }) {
  // The bar can be tucked away to a slim strip (button, or drag the handle down) and brought back the
  // same way. It comes back on its own when the next decision takes the top spot.
  const [tucked, setTucked] = useState(false);
  const [forRef, setForRef] = useState(hero.key);
  if (forRef !== hero.key) {
    setForRef(hero.key);
    setTucked(false);
  }
  const drag = useRef(null);
  const onDown = (e) => {
    if (e.target.closest("button")) return;
    drag.current = { y: e.clientY, id: e.pointerId };
    e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onUp = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId) return;
    const dy = e.clientY - d.y;
    if (dy > 32) setTucked(true);
    else if (dy < -32) setTucked(false);
    else if (Math.abs(dy) < 6 && tucked) setTucked(false);
  };
  const toWhy = () => {
    const el = document.getElementById("why-" + hero.hid);
    if (!el) return;
    const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: still ? "auto" : "smooth" });
    el.focus({ preventScroll: true });
  };
  return (
    <div
      className="cr-pin"
      role="region"
      aria-label={"Decide: " + hero.title}
      data-ui="DecisionPin"
      data-tucked={tucked ? "" : undefined}
    >
      <div
        className="cr-pin-grip"
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={() => (drag.current = null)}
      >
        <span className="cr-pin-handle" aria-hidden="true"></span>
        <div className="cr-pin-text">
          {hero.ref ? <span className="cr-pin-ref">{hero.ref}</span> : null}
          <span className="cr-pin-title">{hero.title}</span>
          <button
            type="button"
            className="cr-pin-tuck"
            aria-expanded={tucked ? "false" : "true"}
            aria-label={tucked ? "Show the decision bar" : "Hide the decision bar"}
            onClick={() => setTucked(!tucked)}
          >
            {tucked ? ic?.chevronUp16 : ic?.chevronDown16}
          </button>
        </div>
      </div>
      <div className="cr-pin-sub" hidden={tucked || undefined}>
        {hero.reasonEmpty ? (
          <button type="button" className="cr-pin-why" onClick={toWhy}>
            {ic?.edit14}
            {hero.whyOptional ? hero.whyHelp.replace(/:.*$/, "") + ": add why" : "Write why to decide"}
          </button>
        ) : (
          <span>{hero.footNote}</span>
        )}
      </div>
      <div className="cr-pin-btns" hidden={tucked || undefined}>
        {hero.reject ? (
          <button
            type="button"
            className="av-btn"
            data-ui="Button"
            data-variant="secondary"
            onClick={hero.reject}
            disabled={hero.noReasonNo}
          >
            {hero.rejectLabel}
          </button>
        ) : null}
        <button
          type="button"
          className="av-btn"
          data-ui="Button"
          data-variant="primary"
          onClick={hero.approve}
          disabled={hero.noReason}
          data-busy={hero.busy}
        >
          {hero.approveIcon}
          {hero.approveLabel}
        </button>
      </div>
    </div>
  );
}

/** CR-W15: an item that came back, with what you decided before, above the new ask. */
function Returned({ r }) {
  return (
    <div className="cr-dc-back" role="note">
      {r.glyph}
      <span>
        <b>Back for you.</b> {r.text}
        {r.before ? <small>{r.before}</small> : null}
      </span>
    </div>
  );
}

/** What only this kind carries: its target's facts, and a follow-up's draft with Copy. */
function KindBody({ d, ic }) {
  if (!d) return null;
  return (
    <>
      {d.facts && d.facts.length ? (
        <dl className="cr-dc-facts" data-ui="DecisionFacts">
          {d.facts.map((f) => (
            <div key={f.key}>
              <dt>{f.k}</dt>
              <dd className={f.mono ? "kb-mono" : undefined}>{f.v}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {d.rerender ? (
        <div className="up-rerender" data-ui="PackageRerender">
          <p>
            {ic?.refresh14 || null}
            <b>{d.rerender.text}</b>
            <span className="up-muted"> · {d.rerender.at}</span>
          </p>
          <ul>
            {d.rerender.files.map((f) => (
              <li key={f.key}>
                <a href={f.href}>{f.name}</a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {d.draft ? (
        <div className="cr-dc-draft" data-ui="FollowupDraft">
          <div className="cr-dc-draft-head">
            <span>The draft</span>
            <button type="button" className="av-btn" data-size="sm" data-variant="ghost" onClick={d.copyDraft}>
              {ic?.copy14}Copy
            </button>
          </div>
          <p>{d.draft}</p>
        </div>
      ) : null}
    </>
  );
}

/** CR-29, behind the osa flag: OSA's brief, as plain text. You still decide. */
function Brief({ b }) {
  return (
    <section className="cr-brief" data-stale={b.stale} aria-label="Prepared by OSA">
      <header>
        <span className="cr-brief-k">Prepared by OSA</span>
        <span
          className="av-tag"
          data-tone={b.confidence === "high" ? "verified" : b.confidence === "low" ? "needs" : undefined}
        >
          {b.confidence} confidence
        </span>
        {b.stale ? <span className="cr-brief-stale">Written for an earlier version; OSA is rewriting it</span> : null}
      </header>
      <p>{b.summary}</p>
      <p className="cr-brief-rec">
        Recommends <b>{b.recLabel}</b>. If that’s wrong: {b.risk}
      </p>
      {b.evidence.length ? (
        <ul>
          {b.evidence.map((e) => (
            <li key={e.key}>{e.text}</li>
          ))}
        </ul>
      ) : null}
      <p className="cr-brief-note">OSA prepares; only you decide. Nothing here is applied on its own.</p>
    </section>
  );
}

/** Details: exactly what the tap sends, built by approveCallFor from the item alone. */
function SendsLine({ call }) {
  if (!call) return null;
  return (
    <details className="cr-dc-sends">
      <summary>What this sends</summary>
      <p>
        <code>{call.name}</code> · <code>{call.method + " " + call.path}</code>
        {call.no ? " (route " + call.no + ")" : ""}, held 6 seconds for Undo
      </p>
      <pre>{call.input}</pre>
    </details>
  );
}
