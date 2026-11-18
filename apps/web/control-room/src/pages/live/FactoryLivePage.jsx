// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.
import { Fragment, useRef, useState } from "react";
import { css, list } from "../../lib/dc";
import { EmptyState } from "../../kit/EmptyState";
import { Crew } from "../../kit/Crew";

export function FactoryLivePage({ vals }) {
  const { ic, lv, onRiverScroll, pg } = vals;
  // phone: rooms sit in a swipeable row; this tracks which one is in view and moves by one
  const rowRef = useRef(null);
  const [at, setAt] = useState(0);
  const count = list(lv?.rooms).length + (lv?.freeN ? 1 : 0);
  const step = () => {
    const el = rowRef.current;
    const first = el && el.firstElementChild;
    return first ? first.getBoundingClientRect().width + 12 : 1;
  };
  const onRow = () => {
    const el = rowRef.current;
    if (el) setAt(Math.max(0, Math.min(count - 1, Math.round(el.scrollLeft / step()))));
  };
  const goRoom = (i) => {
    const el = rowRef.current;
    if (!el) return;
    const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: i * step(), behavior: still ? "auto" : "smooth" });
  };
  return (
    <div className="cr-live" data-ui="LiveRack" data-page={pg?.id} data-view={lv?.view}>
      <div className="cr-live-main">
        {lv?.full ? (
          <>
            <div className="scr-state-bar" data-state="staleVersion" role="status">
              {lv?.fullGlyph}
              <span className="cr-state-bar-text">
                <b>All 6 slots in use.</b> {lv?.nextText}
              </span>
            </div>
          </>
        ) : null}
        {list(lv?.parked).map((pk, $index) => (
          <Fragment key={$index}>
            <div className="cr-parked" role="status">
              {pk?.glyph}
              <span className="cr-parked-main">
                <b>{pk?.module} parked</b> · {pk?.project}
              </span>
              <a className="av-btn" data-ui="Button" data-size="sm" data-variant="primary" href={pk?.href || "#/"}>
                Review the proposal
              </a>
            </div>
          </Fragment>
        ))}
        {lv?.crew && (lv?.viewCrew || pg?.id === "watch") ? (
          <Crew
            crew={lv.crew}
            I={lv.crewI}
            projects={pg?.id === "watch" ? null : lv.crewProjects}
            pick={pg?.id === "watch" ? null : lv.crewPick}
          />
        ) : null}
        {lv?.viewCanvas ? (
          <>
            <section
              className="lib-card cr-panel cv"
              aria-label="Agent terminals"
              data-ui="LiveCanvas"
              data-layout={lv?.cv?.layout}
            >
              {" "}
              <header className="cv-bar">
                {" "}
                <b className="cv-bar-brand">MIOSA</b>{" "}
                <div className="cv-meters" data-ui="PlanMeters">
                  {list(lv?.cv?.meters).map((mt, $index) => (
                    <Fragment key={$index}>
                      <span className="cv-meter">
                        <span className="cv-meter-k">{mt?.label}</span>
                        <span className="cr-bar-track" aria-hidden="true">
                          <i style={css(`width: ${mt?.pct ?? ""}%`)}></i>
                        </span>
                        <span className="cv-meter-n">
                          <b>{mt?.n}</b> of {mt?.max}
                        </span>
                      </span>
                    </Fragment>
                  ))}
                </div>{" "}
                <div className="cv-bar-ctl">
                  {" "}
                  <div className="ro-seg" role="group" aria-label="Layout">
                    {list(lv?.cv?.layouts).map((lo, $index) => (
                      <Fragment key={$index}>
                        <button type="button" aria-pressed={lo?.on} onClick={lo?.pick}>
                          {lo?.label}
                        </button>
                      </Fragment>
                    ))}
                  </div>{" "}
                  <button
                    type="button"
                    className="av-btn"
                    data-ui="Button"
                    data-size="sm"
                    data-variant="secondary"
                    aria-pressed={lv?.cv?.eventsOn}
                    onClick={lv?.cv?.toggleEvents}
                  >
                    Events
                  </button>{" "}
                </div>{" "}
              </header>{" "}
              <div className="cv-body">
                {" "}
                <div className="cv-ground">
                  {" "}
                  {list(lv?.cv?.wins).map((wn, $index) => (
                    <Fragment key={$index}>
                      {" "}
                      <article className="cv-win" data-st={wn?.st} data-split={wn?.split} aria-label={wn?.label}>
                        {" "}
                        <header className="cv-win-head">
                          {" "}
                          <span className="ro-tile" data-kind="builds" aria-hidden="true">
                            {wn?.mono}
                          </span>{" "}
                          <span className="cv-win-id">
                            <b>{wn?.name}</b>
                            <small>{wn?.title}</small>
                          </span>{" "}
                          {wn?.parked ? (
                            <>
                              <span className="ro-st" data-st="parked">
                                <i aria-hidden="true"></i>Parked
                              </span>
                            </>
                          ) : null}{" "}
                          {wn?.hasTabs ? (
                            <>
                              <div className="ro-seg" role="group" aria-label="Show">
                                {list(wn?.tabs).map((tb, $index) => (
                                  <Fragment key={$index}>
                                    <button type="button" aria-pressed={tb?.on} onClick={tb?.pick}>
                                      {tb?.label}
                                    </button>
                                  </Fragment>
                                ))}
                              </div>
                            </>
                          ) : null}{" "}
                          {wn?.canExpand ? (
                            <>
                              <button
                                type="button"
                                className="cv-icon"
                                aria-label={`Expand ${wn?.name ?? ""}`}
                                title="Expand"
                                onClick={wn?.expand}
                              >
                                {ic?.expand14}
                              </button>
                            </>
                          ) : null}{" "}
                        </header>{" "}
                        <div className="cv-meta">
                          {list(wn?.meta).map((me, $index) => (
                            <Fragment key={$index}>
                              <span className={me?.cls}>{me?.text}</span>
                            </Fragment>
                          ))}
                        </div>{" "}
                        <div className="cv-panes">
                          {" "}
                          {wn?.term ? (
                            <>
                              {" "}
                              <div
                                className="cv-term"
                                role="log"
                                aria-live="off"
                                aria-label="Terminal"
                                data-dim={wn?.parked}
                                onMouseEnter={wn?.hold}
                                onMouseLeave={wn?.release}
                              >
                                {" "}
                                {list(wn?.lines).map((tl, $index) => (
                                  <Fragment key={$index}>
                                    <div className="cv-line" data-tone={tl?.tone} data-last={tl?.last}>
                                      {tl?.text}
                                      {tl?.last ? <span className="tt-cursor" aria-hidden="true"></span> : null}
                                    </div>
                                  </Fragment>
                                ))}{" "}
                                {wn?.held ? (
                                  <>
                                    <span className="cv-held">Paused while you hover</span>
                                  </>
                                ) : null}{" "}
                              </div>{" "}
                            </>
                          ) : null}{" "}
                          {wn?.desk ? (
                            <>
                              {" "}
                              <div className="cv-desk">
                                <span className="cv-desk-k">Desktop stream</span>
                                <span>
                                  The computer screen for {wn?.name} shows here once the MIOSA desktop stream is
                                  connected. It uses 1 of 5 computers
                                </span>
                              </div>{" "}
                            </>
                          ) : null}{" "}
                        </div>{" "}
                        {wn?.parked ? (
                          <>
                            <div className="cv-stopped">
                              <p>{wn?.reason}</p>
                              <span>Sandbox closed. Nothing runs until you decide</span>
                            </div>
                          </>
                        ) : null}{" "}
                        <footer className="cv-win-foot">
                          {" "}
                          {wn?.running ? (
                            <>
                              {" "}
                              <span className="cr-bar" data-warn={wn?.warn}>
                                <span className="cr-bar-track">
                                  <i style={css(`width: ${wn?.timePct ?? ""}%`)}></i>
                                </span>
                                <small>{wn?.timeLabel}</small>
                              </span>{" "}
                              <span className="cv-beat">Last event {wn?.beat}</span>{" "}
                              <button
                                type="button"
                                className="av-btn"
                                data-ui="Button"
                                data-size="sm"
                                data-variant="secondary"
                                onClick={wn?.stop}
                              >
                                Stop
                              </button>{" "}
                            </>
                          ) : null}{" "}
                          {wn?.parked ? (
                            <>
                              <span className="cv-beat">Waiting on you</span>
                              <a className="av-btn" data-ui="Button" data-size="sm" data-variant="primary" href="#/">
                                Open decision
                              </a>
                            </>
                          ) : null}{" "}
                        </footer>{" "}
                      </article>{" "}
                    </Fragment>
                  ))}{" "}
                  {list(lv?.cv?.ghosts).map((gh, $index) => (
                    <Fragment key={$index}>
                      <div className="cv-ghost">
                        <b>Slot {gh?.n} free</b>
                        <span>{gh?.note}</span>
                      </div>
                    </Fragment>
                  ))}{" "}
                  {lv?.cv?.none ? (
                    <>
                      <p className="cv-none">No sandboxes running. A window opens here when a room starts</p>
                    </>
                  ) : null}{" "}
                </div>{" "}
                {lv?.cv?.hasStrip ? (
                  <>
                    {" "}
                    <aside className="cv-strip" aria-label="Other windows">
                      {" "}
                      {list(lv?.cv?.thumbs).map((th, $index) => (
                        <Fragment key={$index}>
                          <button type="button" className="cv-thumb" data-st={th?.st} onClick={th?.pick}>
                            <span className="cv-thumb-id">
                              <b>{th?.name}</b>
                              <span className="ro-st" data-st={th?.st}>
                                <i aria-hidden="true"></i>
                                {th?.stLabel}
                              </span>
                            </span>
                            <small>{th?.title}</small>
                            <span className="cv-thumb-line">{th?.line}</span>
                          </button>
                        </Fragment>
                      ))}{" "}
                      <span className="cv-strip-free">{lv?.cv?.freeLabel}</span>{" "}
                    </aside>{" "}
                  </>
                ) : null}{" "}
                {lv?.cv?.events ? (
                  <>
                    {" "}
                    <aside className="cv-drawer" aria-label="Events" data-ui="EventsDrawer">
                      {" "}
                      <header>
                        <b>Events</b>
                        <button
                          type="button"
                          className="av-btn"
                          data-ui="Button"
                          data-size="sm"
                          data-variant="ghost"
                          onClick={lv?.cv?.toggleEvents}
                        >
                          Close
                        </button>
                      </header>{" "}
                      <ol>
                        {list(lv?.events).map((ev, $index) => (
                          <Fragment key={$index}>
                            <li>
                              <span className="cv-ev-t">{ev?.time}</span>
                              <span
                                className="cr-pdot"
                                style={css(`--dot: ${ev?.dot ?? ""}`)}
                                aria-hidden="true"
                              ></span>
                              <span>{ev?.text}</span>
                            </li>
                          </Fragment>
                        ))}
                      </ol>{" "}
                    </aside>{" "}
                  </>
                ) : null}{" "}
              </div>{" "}
            </section>
          </>
        ) : null}
        {lv?.viewRooms ? (
          <>
            <section className="cr-rooms" aria-labelledby="lv-rooms" data-ui="Rooms">
              <header className="cr-sect-head cr-rooms-head">
                <h2 className="cr-sect-title" id="lv-rooms">
                  Rooms
                </h2>
                <span className="cr-sect-count">{String(lv?.inUse || "").replace("/", " of ")} slots in use</span>
                <span className="cr-slotbar cr-slotbar-inline" role="img" aria-label={lv?.rackLabel}>
                  {list(lv?.bars).map((b, $index) => (
                    <Fragment key={$index}>
                      <i data-on={b?.on} data-warn={b?.warn}></i>
                    </Fragment>
                  ))}
                </span>
              </header>
              <div className="cr-room-list" role="list" ref={rowRef} onScroll={onRow}>
                {list(lv?.rooms).map((rm, $index) => (
                  <Fragment key={$index}>
                    <div
                      className="cr-wroom"
                      role="listitem"
                      data-warn={rm?.warn}
                      data-stall={rm?.stall}
                      aria-label={rm?.aria}
                      data-ui="RoomCard"
                    >
                      <div className="cr-wroom-id">
                        <span className="cr-slot-n">Slot {rm?.slot}</span>
                        <a className="cr-wroom-proj" href={rm?.projHref}>
                          <span
                            className="cr-pdot"
                            data-pulse="true"
                            style={css(`--dot: ${rm?.dot ?? ""}`)}
                            aria-hidden="true"
                          ></span>
                          {rm?.project}
                        </a>
                        <a className="cr-wroom-mod" href={rm?.modHref}>
                          <b>{rm?.module}</b> {rm?.role}
                        </a>
                        <div className="cr-ladder" aria-label={rm?.ladderLabel}>
                          <span className="cr-ladder-steps" aria-hidden="true">
                            {list(rm?.ladder).map((ls, $index) => (
                              <Fragment key={$index}>
                                <i data-st={ls?.st}></i>
                              </Fragment>
                            ))}
                          </span>
                          <small>{rm?.attempt}</small>
                        </div>
                      </div>
                      <div className="cr-wroom-term">
                        <div className="cr-cli" data-open={rm?.termOpen} data-ui="RoomTerminal">
                          <div className="cr-cli-bar">
                            <span className="cr-cli-dots" aria-hidden="true">
                              <i></i>
                              <i></i>
                              <i></i>
                            </span>
                            <span className="cr-cli-title">
                              {rm?.module} · {rm?.role} · attempt {rm?.attemptShort}
                            </span>
                            <span className="cr-cli-live">
                              <span
                                className="cr-pdot"
                                data-pulse="true"
                                style={{ "--dot": "var(--cr-pass)" }}
                                aria-hidden="true"
                              ></span>
                              live
                            </span>
                          </div>
                          <pre className="cr-cli-body" aria-label="Terminal, last lines">
                            {list(rm?.lines).map((tl, $index) => (
                              <Fragment key={$index}>
                                <span className="cr-cli-line" data-k={tl?.k}>
                                  {tl?.text}
                                </span>
                              </Fragment>
                            ))}
                            {list(rm?.lines).length ? (
                              <span className="cr-cli-line tt-prompt-line" aria-hidden="true">
                                <span className="tt-ps">›</span> <span className="tt-cursor"></span>
                              </span>
                            ) : null}
                          </pre>
                        </div>
                      </div>
                      <div className="cr-wroom-gauges">
                        <button
                          type="button"
                          className="cr-icon-btn cr-stop-x"
                          data-ui="IconButton"
                          title="Stop room"
                          aria-label={`Stop ${rm?.module ?? ""}`}
                          onClick={rm?.askStop}
                          aria-expanded={rm?.stopOpenStr}
                        >
                          {ic?.square14}
                        </button>
                        <div className="cr-gauge" data-warn={rm?.timeWarn}>
                          <span className="cr-gauge-k">Time</span>
                          <span className="cr-gauge-v">{rm?.timeLabel}</span>
                          <span className="cr-bar-track">
                            <i style={css(`width: ${rm?.timePct ?? ""}%`)}></i>
                          </span>
                        </div>
                        <div className="cr-gauge-last" data-stall={rm?.stall}>
                          {rm?.lastGlyph}
                          {rm?.last}
                        </div>
                      </div>
                      {rm?.stopOpen ? (
                        <>
                          <div className="cr-stop" role="group" aria-label="Stop this room">
                            <label className="cr-dc-reason">
                              <span>
                                Reason <small>overrides are logged with your reason</small>
                              </span>
                              <textarea
                                rows="2"
                                value={rm?.stopReason ?? ""}
                                onChange={rm?.onStopReason}
                                placeholder="Why stop this attempt?"
                              ></textarea>
                            </label>
                            <div className="cr-dc-btns">
                              <span className="cr-stop-note">
                                The attempt ends now and counts as a failed rung on the retry ladder.
                              </span>
                              <button
                                type="button"
                                className="av-btn"
                                data-size="sm"
                                data-variant="ghost"
                                onClick={rm?.cancelStop}
                              >
                                Keep running
                              </button>
                              <button
                                type="button"
                                className="av-btn"
                                data-size="sm"
                                data-variant="primary"
                                disabled={rm?.stopDisabled}
                                onClick={rm?.confirmStop}
                              >
                                Stop {rm?.module}
                              </button>
                            </div>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </Fragment>
                ))}
                {lv?.freeN ? (
                  <>
                    <div className="cr-free" role="listitem">
                      <span className="cr-free-k">{lv?.freeLabel}</span>
                      <span className="cr-free-slots">
                        {list(lv?.free).map((fr, $index) => (
                          <Fragment key={$index}>
                            <span className="cr-free-slot">{fr?.n}</span>
                          </Fragment>
                        ))}
                      </span>
                    </div>
                  </>
                ) : null}
              </div>
              {count > 1 ? (
                <div className="cr-room-pager" data-ui="RoomPager">
                  <button
                    type="button"
                    aria-label="Previous room"
                    onClick={() => goRoom(at - 1)}
                    disabled={at === 0 || undefined}
                  >
                    {ic?.chevronLeft20}
                  </button>
                  <span className="cr-room-dots" aria-hidden="true">
                    {Array.from({ length: count }, (_, k) => (
                      <i key={k} data-on={k === at ? "true" : undefined}></i>
                    ))}
                  </span>
                  <span className="cr-room-pos sr-only" aria-live="polite">
                    {at + 1 <= list(lv?.rooms).length
                      ? "Room " + (at + 1) + " of " + list(lv?.rooms).length
                      : "Free slots"}
                  </span>
                  <button
                    type="button"
                    aria-label="Next room"
                    onClick={() => goRoom(at + 1)}
                    disabled={at >= count - 1 || undefined}
                  >
                    {ic?.chevronRight20}
                  </button>
                </div>
              ) : null}
            </section>
          </>
        ) : null}
        <section className="lib-card cr-panel" aria-labelledby="lv-q">
          {" "}
          <header className="cr-panel-head">
            <h2 className="cr-panel-title" id="lv-q">
              Next in line
            </h2>
            <span className="cr-panel-meta">{lv?.queueMeta}</span>
          </header>{" "}
          {list(lv?.queue).map((qu, $index) => (
            <Fragment key={$index}>
              <div className="cr-mini-row">
                <span className="cr-pdot" style={css(`--dot: ${qu?.dot ?? ""}`)} aria-hidden="true"></span>
                <span className="cr-mini-row-name">
                  <b>{qu?.module}</b> {qu?.project}
                </span>
                <span className="cr-mini-row-state">Waiting on {qu?.waitingOn}</span>
              </div>
            </Fragment>
          ))}{" "}
        </section>
      </div>
      {lv?.showRiver ? (
        <>
          <div className="cr-live-side">
            <section className="lib-card cr-panel cr-river-panel" aria-labelledby="lv-r" data-ui="EventRiver">
              {" "}
              <header className="cr-panel-head">
                <h2 className="cr-panel-title" id="lv-r">
                  Event river
                </h2>
                <button
                  type="button"
                  className="av-btn"
                  data-size="sm"
                  data-variant="secondary"
                  onClick={lv?.togglePause}
                >
                  {lv?.pauseIcon}
                  {lv?.pauseLabel}
                </button>
              </header>{" "}
              <div className="cr-river-filters">
                <div className="av-chips" role="radiogroup" aria-label="Project">
                  {list(lv?.projChips).map((pc, $index) => (
                    <Fragment key={$index}>
                      <button
                        type="button"
                        role="radio"
                        className="av-chip"
                        aria-checked={pc?.checked}
                        onClick={pc?.pick}
                      >
                        {pc?.dot ? (
                          <>
                            <span className="cr-pdot" style={css(`--dot: ${pc?.dot ?? ""}`)} aria-hidden="true"></span>
                          </>
                        ) : null}
                        {pc?.label}
                      </button>
                    </Fragment>
                  ))}
                </div>
              </div>{" "}
              <ol className="cr-river-list" onScroll={onRiverScroll}>
                {" "}
                {list(lv?.events).map((ev, $index) => (
                  <Fragment key={$index}>
                    {ev?.day ? (
                      <>
                        <li className="cr-ev-day">{ev?.day}</li>
                      </>
                    ) : null}
                    <li className="cr-ev" data-link={ev?.linked}>
                      <time className="cr-ev-t">{ev?.time}</time>
                      <span className="cr-pdot" style={css(`--dot: ${ev?.dot ?? ""}`)} aria-hidden="true"></span>
                      <span className="cr-ev-k">{ev?.kind}</span>
                      {ev?.href ? (
                        <>
                          <a className="cr-ev-text" href={ev?.href}>
                            {ev?.text}
                          </a>
                        </>
                      ) : null}
                      {ev?.plain ? (
                        <>
                          <span className="cr-ev-text">{ev?.text}</span>
                        </>
                      ) : null}
                    </li>
                  </Fragment>
                ))}{" "}
                {lv?.noEvents ? (
                  <>
                    <li className="cr-panel-empty cr-panel-empty-art">
                      <EmptyState scene="noResults" size="sm" title="No events match these filters" heading="p" />
                    </li>
                  </>
                ) : null}{" "}
              </ol>{" "}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
