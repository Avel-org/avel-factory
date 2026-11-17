import { useEffect, useRef, useState } from "react";
import { sawLiveEvent } from "../../lib/live";
import { AgentTrail } from "../../kit/Trail";
import { stepWord } from "../../app/history";
import { EmptyState } from "../../kit/EmptyState";

/**
 * One module (L3) with its attempts (L4). The running attempt is live: steps arrive as the agent works
 * (from the event stream; simulated here), and the clock, the cost and "last step" tick while you watch.
 */
export function ModulePage({ v }) {
  if (!v.ready)
    return (
      <div className="rcp-empty lib-card">
        <EmptyState
          scene="blockedPage"
          heading="h2"
          title="No such module"
          action={
            <a className="av-btn" data-variant="secondary" href={v.buildHref}>
              Back to Build
            </a>
          }
        >
          This project's plan has no module with that name.
        </EmptyState>
      </div>
    );
  return <Module v={v} key={v.ref} />;
}

const KIND_ICON = { cmd: "terminal", read: "book-open", edit: "file-diff", pass: "check", fail: "x", done: "flag" };
// AI cost only ever against its cap (CR-W20 section 3)
const share = (micros, cap) => (cap ? Math.max(1, Math.round((micros / cap) * 100)) + "%" : "—");

function Module({ v }) {
  const I = v.I;
  const running = v.attempts.find((a) => a.result === "running") || null;
  const [follow, setFollow] = useState(true);
  const [extra, setExtra] = useState([]); // live steps that arrived while you watched
  const [tick, setTick] = useState(0); // seconds since you opened the page
  const [since, setSince] = useState(12); // seconds since the last step
  const feed = useRef(null);
  const shown = useRef(0);

  // the trace stream (route 64, view=steps), simulated: a new step every few seconds while you follow, until the attempt hands off
  useEffect(() => {
    if (!running || !follow) return;
    const live = running.live || [];
    // not a fetch: the mock replays route 64's view=steps stream one step at a time
    const t = setInterval(() => {
      const i = shown.current;
      if (i >= live.length) return clearInterval(t);
      shown.current = i + 1;
      sawLiveEvent();
      // the attempt's own clock: a minute after its last step, and on from there
      const last = (running.steps[running.steps.length - 1] || {}).t || "00:00";
      const [h0, m0] = last.split(":").map(Number);
      const tm = h0 * 60 + m0 + i + 1;
      const hh = String(Math.floor(tm / 60) % 24).padStart(2, "0") + ":" + String(tm % 60).padStart(2, "0");
      setExtra((xs) => xs.concat(Object.assign({}, live[i], { key: "live" + i, t: hh, fresh: true })));
      setSince(0);
    }, 3200);
    return () => clearInterval(t);
  }, [running && running.key, follow]);
  useEffect(() => {
    if (!running) return;
    // not a fetch: the "12s ago" clock on screen
    const t = setInterval(() => {
      setTick((n) => n + 1);
      setSince((n) => n + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [running && running.key]);
  // keep the newest step in view while following
  useEffect(() => {
    const el = feed.current;
    if (el && follow) el.scrollTop = el.scrollHeight;
  }, [extra.length, follow]);

  const handedOff = running && extra.length && extra[extra.length - 1].kind === "done";
  const attemptCost = running ? running.costMicros + extra.length * 60000 : 0;
  const mins = running ? running.minutes + Math.floor(tick / 60) : 0;
  const secs = tick % 60;

  // the running try's row takes the live steps as they arrive, newest last, and its clock ticks
  const trailRows = v.trail.rows.map((r) => {
    if (r.st !== "running") return r;
    const live = extra.map((st) => ({
      key: st.key,
      st: st.kind === "fail" ? "fail" : st.kind === "pass" ? "pass" : undefined,
      text: st.text,
      mono: st.kind === "cmd" || st.kind === "edit",
      t: st.t,
      fresh: true,
    }));
    const subs = r.subs.slice(-4).concat(live);
    const lastKind = extra.length ? extra[extra.length - 1].kind : null;
    return Object.assign({}, r, {
      subs,
      status: handedOff ? "Handing off" : lastKind ? stepWord(lastKind) : r.status,
      meta: mins + "m " + String(secs).padStart(2, "0") + "s",
    });
  });

  return (
    <div className="mdp">
      {/* ------------------------------------------------ who it is */}
      <section className="mdp-hero lib-card" aria-labelledby="mdp-title">
        <span className="mdp-tile kb-mono" aria-hidden="true">
          {v.ref}
        </span>
        <div className="mdp-hero-main">
          <div className="mdp-hero-top">
            <h2 id="mdp-title">
              <span className="sr-only">{v.ref} </span>
              {v.title}
            </h2>
            <span className="av-tag" data-ui="Tag" data-tone={v.tone}>
              {v.state === "running" ? <span className="mdp-pulse" aria-hidden="true"></span> : null}
              {v.stateLabel}
            </span>
          </div>
          <p className="mdp-counts">{v.counts}</p>
          <div className="mdp-chips">
            {v.after ? (
              <span className="mdp-chip-group">
                <span className="mdp-chip-k">After</span>
                {v.after.map((r) => (
                  <code key={r}>{r}</code>
                ))}
              </span>
            ) : (
              <span className="mdp-chip-group">
                <span className="mdp-chip-k">Starts first</span>
              </span>
            )}
            <span className="mdp-chip-group">
              <span className="mdp-chip-k">Owns</span>
              {v.territory.map((p) => (
                <code key={p}>{p}</code>
              ))}
            </span>
          </div>
        </div>
        <nav className="mdp-sibs" aria-label="Modules in this project">
          {v.siblings.map((x) => (
            <a key={x.key} href={x.href} aria-current={x.current} data-state={x.state} className="kb-mono">
              <i aria-hidden="true"></i>
              {x.ref}
            </a>
          ))}
        </nav>
      </section>

      <div className="mdp-row">
        {/* ------------------------------------------------ the retry ladder */}
        <section className="mdp-card lib-card" aria-labelledby="mdp-ladder-h">
          <h3 id="mdp-ladder-h">Retry ladder</h3>
          <ol className="mdp-ladder">
            {v.ladder.map((l) => (
              <li key={l.key} data-st={l.st}>
                <span className="mdp-node" aria-hidden="true">
                  {l.st === "done"
                    ? I("check", 12)
                    : l.st === "failed"
                      ? I("x", 12)
                      : l.st === "parked"
                        ? I("pause", 12)
                        : null}
                </span>
                <span className="mdp-ladder-l">{l.label}</span>
                <span className="mdp-ladder-h">{l.hint || " "}</span>
                <span className="mdp-ladder-c kb-mono">{l.cost || " "}</span>
                <span className="sr-only">
                  {{ done: "done", failed: "failed", now: "now", todo: "not reached", parked: "parked" }[l.st]}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* ------------------------------------------------ cost against the cap */}
        <section className="mdp-card lib-card" aria-labelledby="mdp-cost-h">
          <h3 id="mdp-cost-h">Cost against the cap</h3>
          <p className="mdp-big">
            <b>{v.spent}</b> <span>of {v.cap}</span>
          </p>
          <div
            className="mdp-meter"
            data-warn={v.warn}
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={v.pct}
            aria-label={v.pct + "% of the module cap used"}
            style={{ "--pct": Math.min(1, v.pct / 100) }}
          >
            <i></i>
            <span className="mdp-meter-mark" aria-hidden="true"></span>
          </div>
          {v.budgetNote ? <p className="mdp-note">{v.budgetNote}</p> : null}
          {v.decision ? (
            <a
              className="mdp-dec"
              href={v.decision.href}
              onClick={(e) => {
                // B6: the same ask is answerable in the trail below; go there instead of leaving the page
                const ask = document.querySelector(".tr-ask");
                if (!ask) return;
                e.preventDefault();
                const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
                ask.scrollIntoView({ block: "center", behavior: still ? "auto" : "smooth" });
                const b = ask.querySelector("button, textarea");
                if (b) b.focus({ preventScroll: true });
              }}
            >
              <span className="mdp-dec-k">Waiting on you</span>
              {/* B6: the title only; the raw decision ref was an id you had to read past */}
              <span>{v.decision.title}</span>
              {I("arrow-right", 16)}
            </a>
          ) : null}
        </section>
      </div>

      {/* ------------------------------------------------ right now */}
      {running && v.room ? (
        <section className="mdp-now lib-card" aria-labelledby="mdp-now-h" data-follow={follow ? "true" : undefined}>
          <div className="mdp-now-head">
            <span className="mdp-avatar" aria-hidden="true">
              {v.room.agent[0]}
            </span>
            <div className="mdp-now-who">
              <h3 id="mdp-now-h">
                {handedOff ? v.room.agent + " handed off to review" : v.room.agent + " is working on it"}
              </h3>
              <p>
                {v.room.role} · <span className="kb-mono">{v.room.model}</span> · {v.room.slot} · {running.label}
              </p>
            </div>
            <dl className="mdp-now-stats">
              <div>
                <dt>Running for</dt>
                <dd className="kb-mono">
                  {mins}m {String(secs).padStart(2, "0")}s
                </dd>
              </div>
              <div>
                <dt>This attempt</dt>
                <dd className="kb-mono">
                  {share(attemptCost, v.room.capMicros)} <span>of its cap</span>
                </dd>
              </div>
              <div>
                <dt>Last step</dt>
                <dd className="kb-mono" aria-live="off">
                  {since}s ago
                </dd>
              </div>
            </dl>
            <button
              type="button"
              className="av-btn"
              data-size="sm"
              data-variant="secondary"
              aria-pressed={follow ? "true" : "false"}
              onClick={() => setFollow(!follow)}
            >
              {I(follow ? "pause" : "play", 14)}
              {follow ? "Pause" : "Follow live"}
            </button>
          </div>
          <ol className="mdp-feed" ref={feed} aria-live="polite" aria-label="What the agent is doing">
            {running.steps
              .slice(-6)
              .concat(extra)
              .map((st) => (
                <li key={st.key} data-kind={st.kind} data-fresh={st.fresh ? "true" : undefined}>
                  <span className="mdp-feed-t kb-mono">{st.t}</span>
                  <span className="mdp-feed-i" aria-hidden="true">
                    {I(KIND_ICON[st.kind] || "circle", 14)}
                  </span>
                  <span className={st.kind === "cmd" || st.kind === "edit" ? "kb-mono mdp-feed-x" : "mdp-feed-x"}>
                    {st.text}
                  </span>
                </li>
              ))}
            {follow && !handedOff ? (
              <li className="tt-prompt" aria-hidden="true">
                <span className="mdp-feed-t kb-mono"></span>
                <span className="mdp-feed-i"></span>
                <span className="kb-mono mdp-feed-x">
                  <span className="tt-ps">›</span> <span className="tt-cursor"></span>
                </span>
              </li>
            ) : null}
          </ol>
          <div className="mdp-now-foot">
            <span>{follow ? "Following live" : "Paused. New steps wait until you follow again."}</span>
            <a href={v.watchHref}>Watch every room</a>
          </div>
        </section>
      ) : null}

      {v.inputs ? <ModuleInputs n={v.inputs} I={I} refName={v.ref} /> : null}

      <div className="mdp-row mdp-row-wide">
        {/* ------------------------------------------------ every attempt */}
        <div className="mdp-attempts">
          <AgentTrail
            title={"Where " + v.ref + " is"}
            titleId="mdp-att-h"
            agent={running && v.room ? { name: v.room.agent, role: v.room.role } : null}
            count={v.trail.count}
            rows={trailRows}
            I={I}
            foot={
              running
                ? "The running try fills in as the agent works. Finished tries fold away; open one to see its steps."
                : "Every try, oldest first. Open one to see its steps."
            }
          />
        </div>

        {/* ------------------------------------------------ its checks */}
        <aside className="mdp-side">
          <section className="mdp-card lib-card" aria-labelledby="mdp-gates-h">
            <h3 id="mdp-gates-h">Its gates</h3>
            <ol className="mdp-gates">
              {v.gates.map((g) => (
                <li key={g.key} data-st={g.st}>
                  <span className="kb-mono">{g.n}</span>
                  <span>{g.name}</span>
                  <span className="mdp-gate-st">
                    {{ pass: "Passed", running: "Running", fail: "Failed", pending: "Not yet" }[g.st]}
                  </span>
                </li>
              ))}
            </ol>
          </section>
          <section className="mdp-card lib-card" aria-labelledby="mdp-f-h">
            <h3 id="mdp-f-h">Findings</h3>
            {v.findings.length ? (
              <ul className="mdp-findings">
                {v.findings.map((f) => (
                  <li key={f.key}>
                    <a href={f.href}>
                      <code>{f.ref}</code> {f.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="kb-muted">None on this module.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

/** CR-34: the files linked to this module, what each is for, and the reading-list meter. */
function ModuleInputs({ n, I, refName }) {
  return (
    <section className="mdp-card lib-card up-inputs" aria-labelledby="mdp-in-h">
      <header className="up-sec-h">
        <h3 id="mdp-in-h">Inputs</h3>
        <span className="ag-count">{n.rows.length}</span>
        <button type="button" className="av-btn" data-size="sm" data-variant="secondary" onClick={n.add}>
          {I("upload", 14)}
          Add a file
        </button>
      </header>
      {n.meter ? (
        <div className="up-meter up-meter-inline" data-warn={n.meter.warn}>
          <div className="up-meter-top">
            <span>Reading list</span>
            <span className="up-meter-n">{n.meter.text}</span>
          </div>
          <div
            className="mdp-meter"
            data-warn={n.meter.warn}
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(100, n.meter.pct)}
            aria-label={refName + " reading list " + n.meter.text}
            style={{ "--pct": Math.min(1, n.meter.pct / 100) }}
          >
            <i></i>
            <span className="mdp-meter-mark" aria-hidden="true"></span>
          </div>
        </div>
      ) : null}
      {n.none ? (
        <p className="kb-muted">No inputs yet. Drop files on this page to give them to {refName}.</p>
      ) : (
        <ul className="up-inlist">
          {n.rows.map((r) => (
            <li key={r.key} data-state={r.state}>
              <span className="up-thumb" data-size="sm" aria-hidden="true">
                {r.icon}
              </span>
              <div className="up-in-main">
                <p className="up-in-top">
                  <a className="up-name" href={r.href}>
                    {r.name}
                  </a>
                  <span className="kb-mono up-muted">{r.version}</span>
                </p>
                <p className="up-in-reason">{r.reason ? "“" + r.reason + "”" : r.why}</p>
                <p className="up-muted up-in-meta">
                  <span data-listed={r.isListed}>{r.listed}</span>
                  {r.range ? <span>{r.range}</span> : null}
                  <span>{r.firstRead}</span>
                </p>
              </div>
              <span className="av-tag up-ltag" data-tone={{ active: "verified", waiting: "accent", refused: "stopped", removed: "pending" }[r.state]} data-ui="Tag">
                {r.stateLabel}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
