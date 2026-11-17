import { useEffect, useState } from "react";
import { ThinkingOrb } from "thinking-orbs";

/*
 * The trail kit: one set of markers (TNode) shared by the Agent Trail and the Commit graph, so a
 * finished step, a running one, one waiting on you, a landing and the head all read the same way
 * everywhere. Text inside rows comes from agents and is rendered as text, never as HTML.
 */

// html[data-theme] is "night" or absent; the orb wants dark or light
export function useNight() {
  const read = () => typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "night";
  const [night, setNight] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setNight(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  return night;
}

/** A running agent: the thinking orb (from thinking-orbs, reviewed 0.3.2), tinted cobalt. */
export function Orb({ size = 20, state = "working" }) {
  const night = useNight();
  return (
    <span className="tn-orb" data-size={size} aria-hidden="true">
      <ThinkingOrb
        state={state}
        size={size}
        dotSize={size === 20 ? 1.35 : 1}
        theme={night ? "dark" : "light"}
        color={night ? "#7ba1fc" : "#3a64e4"}
      />
    </span>
  );
}

const SR = {
  done: "done",
  failed: "failed",
  running: "running now",
  paused: "waiting on you",
  needs: "waiting on you",
  todo: "not started",
  approval: "needs your approval when it gets here",
  parked: "parked",
  uncommitted: "not landed yet",
  head: "head of main",
  commit: "",
  merge: "",
  branch: "",
  rejected: "rejected",
  collapsed: "",
};

/** One marker. `st` picks the shape; `n` is the count on a collapsed run of history. */
export function TNode({ st, n, I }) {
  let inner = null;
  if (st === "done") inner = I("check", 12);
  else if (st === "failed" || st === "rejected") inner = I("x", 12);
  else if (st === "paused" || st === "parked") inner = I("pause", 12);
  else if (st === "needs") inner = <span className="tn-pip" aria-hidden="true"></span>;
  else if (st === "collapsed") inner = <span className="tn-n">{n}</span>;
  return (
    <span className="tn" data-st={st}>
      {st === "running" ? <Orb /> : inner}
      {SR[st] ? <span className="sr-only">{SR[st]}</span> : null}
    </span>
  );
}

/* ================================================================ the Agent Trail */
/**
 * Where an agent is in a piece of work. rows: [{ key, st, icon, label, meta, status, sub, open,
 * subs: [{ key, st, text, mono, t, fresh }], approval: { ask, approveLabel, declineLabel,
 * approve, declineHref, busy, done } }]. A finished row with sub-steps folds them away and opens
 * them again on request; the running row keeps them open; the approval row opens its ask inline.
 */
export function AgentTrail({ title, titleId, agent, count, rows, I, foot }) {
  const [open, setOpen] = useState(() => new Set());
  const [ask, setAsk] = useState(true);
  const toggle = (k) =>
    setOpen((s0) => {
      const s1 = new Set(s0);
      if (s1.has(k)) s1.delete(k);
      else s1.add(k);
      return s1;
    });
  return (
    <section className="tr lib-card" aria-labelledby={titleId}>
      <header className="tr-head">
        <h3 id={titleId}>{title}</h3>
        {agent ? (
          <span className="tr-agent">
            <span className="tr-agent-av" aria-hidden="true">
              {agent.name[0]}
              <i></i>
            </span>
            {agent.name}
            <span className="tr-agent-role">{agent.role}</span>
          </span>
        ) : null}
        <span className="tr-count kb-mono" aria-label={count.replace("/", " of ") + " steps done"}>
          {count}
        </span>
      </header>
      <ol className="tr-rows">
        {rows.map((r, i) => {
          const hasSubs = r.subs && r.subs.length > 0;
          const subsOpen = hasSubs && (r.st === "running" || open.has(r.key));
          const last = i === rows.length - 1;
          const nextSt = last ? null : rows[i + 1].st;
          const isAsk = r.approval && (r.st === "needs" || r.st === "paused");
          return (
            <li
              key={r.key}
              className="tr-row"
              data-st={r.st}
              data-next={nextSt || undefined}
              data-last={last ? "true" : undefined}
              data-subs={subsOpen ? "true" : undefined}
            >
              <div className="tr-line">
                <TNode st={r.st} I={I} />
                <span className="tr-ic" aria-hidden="true">
                  {I(r.icon, 14)}
                </span>
                {hasSubs && r.st !== "running" ? (
                  <button
                    type="button"
                    className="tr-label tr-label-btn"
                    aria-expanded={subsOpen ? "true" : "false"}
                    onClick={() => toggle(r.key)}
                  >
                    <span>{r.label}</span>
                    <span className="tr-chev" aria-hidden="true">
                      {I(subsOpen ? "chevron-down" : "chevron-right", 14)}
                    </span>
                    <span className="sr-only">{subsOpen ? ", hide its steps" : ", show its " + r.subs.length + " steps"}</span>
                  </button>
                ) : (
                  <span className="tr-label">
                    <span title={r.label}>{r.label}</span>
                  </span>
                )}
                <span className="tr-right">
                  {isAsk ? (
                    <button
                      type="button"
                      className="tr-needs"
                      aria-expanded={ask ? "true" : "false"}
                      onClick={() => setAsk(!ask)}
                    >
                      Needs you {I(ask ? "chevron-up" : "chevron-down", 12)}
                    </button>
                  ) : r.approval && r.st === "approval" ? (
                    <span className="tr-appr">Approval</span>
                  ) : r.status ? (
                    <span className="tr-status" data-tone={r.statusTone || undefined}>
                      {r.status}
                    </span>
                  ) : null}
                  {r.meta ? <span className="tr-meta kb-mono">{r.meta}</span> : null}
                </span>
              </div>
              {r.sub ? <p className="tr-sub">{r.sub}</p> : null}
              {subsOpen ? (
                <div className="tr-branch" data-rejoin={last ? undefined : "true"}>
                  <svg className="tr-bend tr-bend-out" width="22" height="20" viewBox="0 0 22 20" aria-hidden="true" focusable="false">
                    <path d="M1 0 C1 11 21 9 21 20" />
                  </svg>
                <ol className="tr-subs" aria-label={"Steps in " + r.label} aria-live={r.st === "running" ? "polite" : undefined}>
                  {r.subs.map((x) => (
                    <li key={x.key} data-st={x.st} data-fresh={x.fresh ? "true" : undefined}>
                      <span className="tr-dot" aria-hidden="true"></span>
                      <span className={x.mono ? "tr-sub-t kb-mono" : "tr-sub-t"}>{x.text}</span>
                      {x.t ? <span className="tr-sub-m kb-mono">{x.t}</span> : null}
                    </li>
                  ))}
                </ol>
                  {!last ? (
                    <svg className="tr-bend tr-bend-in" width="22" height="20" viewBox="0 0 22 20" aria-hidden="true" focusable="false">
                      <path d="M21 0 C21 11 1 9 1 20" />
                    </svg>
                  ) : null}
                </div>
              ) : null}
              {isAsk && ask ? (
                <div className="tr-ask">
                  <p>{r.approval.ask}</p>
                  {r.approval.done ? (
                    <p className="tr-ask-done" role="status">
                      {I("check", 14)} {r.approval.done}
                    </p>
                  ) : (
                    <>
                    {r.approval.reason ? (
                      <div className="tr-why">
                        <label className="cr-why-label" htmlFor={r.approval.reason.id}>
                          Why
                        </label>
                        <div className="cr-why-field" data-empty={r.approval.reason.value.trim() ? undefined : "true"}>
                          <textarea
                            id={r.approval.reason.id}
                            className="cr-why-input"
                            rows="2"
                            maxLength="280"
                            value={r.approval.reason.value}
                            onChange={r.approval.reason.onChange}
                            placeholder="Say why in a sentence. It's logged with the decision."
                          ></textarea>
                        </div>
                      </div>
                    ) : null}
                    <div className="tr-ask-btns">
                      {r.approval.declineHref ? (
                        <a className="av-btn" data-size="sm" data-variant="ghost" href={r.approval.declineHref}>
                          {r.approval.declineLabel}
                        </a>
                      ) : null}
                      <button
                        type="button"
                        className="av-btn"
                        data-size="sm"
                        data-variant="primary"
                        disabled={r.approval.busy || r.approval.blocked}
                        onClick={r.approval.approve}
                      >
                        {r.approval.busy ? I("loader", 14, { animation: "av-spin 900ms linear infinite" }) : I("check", 14)}
                        {r.approval.approveLabel}
                      </button>
                    </div>
                    </>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
      {foot ? <p className="tr-foot">{foot}</p> : null}
    </section>
  );
}

/* ================================================================ the Commit graph */
const LANE = 20; // px between lanes
const X0 = 11; // the main lane's centre

/**
 * The lines one row draws. main: "full" | "lower" | "upper" | "none". segs: [{ lane, color, top, bottom }]
 * where top is "none" | "line" | "dash" | "merge" (a curve in from main) and bottom is "none" |
 * "line" | "dash" | "fork" (a curve back to main). Dots sit at the row's centre.
 */
function RowLines({ r, h, lanes }) {
  const x = (l) => X0 + l * LANE;
  const m = h / 2;
  const P = [];
  if (r.main === "full") P.push({ d: `M${x(0)},0 V${h}`, c: "main" });
  if (r.main === "lower") P.push({ d: `M${x(0)},${m} V${h}`, c: "main" });
  if (r.main === "upper") P.push({ d: `M${x(0)},0 V${m}`, c: "main" });
  for (const g of r.segs || []) {
    const xl = x(g.lane);
    if (g.top === "line" || g.top === "dash") P.push({ d: `M${xl},0 V${m}`, c: g.color, dash: g.top === "dash" });
    if (g.top === "merge") P.push({ d: `M${x(0)},0 C${x(0)},${h * 0.3} ${xl},${h * 0.2} ${xl},${m}`, c: g.color });
    if (g.bottom === "line" || g.bottom === "dash") P.push({ d: `M${xl},${m} V${h}`, c: g.color, dash: g.bottom === "dash" });
    if (g.bottom === "fork") P.push({ d: `M${xl},${m} C${xl},${h * 0.8} ${x(0)},${h * 0.7} ${x(0)},${h}`, c: g.color });
  }
  const w = X0 * 2 + lanes * LANE;
  return (
    <svg className="cg-lines" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
      {P.map((p, i) => (
        <path key={i} d={p.d} style={{ stroke: "var(--cg-" + p.c + ")" }} strokeDasharray={p.dash ? "2 4" : undefined} />
      ))}
    </svg>
  );
}

/**
 * History on main: one row per landing or attempt, newest first. rows: [{ key, lane, node, color,
 * title, tag, dim, author, age, card, main, segs }], with `segs` worked out by history.js.
 */
export function CommitGraph({ title, titleId, count, rows, lanes, I, earlier, onEarlier, foot }) {
  const [openKey, setOpenKey] = useState(null);
  return (
    <section className="cg lib-card" aria-labelledby={titleId}>
      <header className="cg-head">
        <h3 id={titleId}>{title}</h3>
        {count != null ? <span className="cg-count kb-mono">{count}</span> : null}
        <span className="cg-branch">
          {I("git-branch", 14)}
          <span className="kb-mono">main</span>
        </span>
      </header>
      <ol className="cg-rows" style={{ "--cg-rail": X0 * 2 + lanes * LANE + "px" }}>
        {rows.map((r) => {
          const isOpen = openKey === r.key;
          return (
            <li
              key={r.key}
              className="cg-row"
              data-node={r.node}
              data-dim={r.dim ? "true" : undefined}
              data-open={isOpen ? "true" : undefined}
              style={{ "--lane": r.lane, "--lc": "var(--cg-" + r.color + ")" }}
            >
              <RowLines r={r} h={44} lanes={lanes} />
              <span className="cg-node" style={{ left: X0 + r.lane * LANE + "px" }}>
                <TNode st={r.node} n={r.n} I={I} />
              </span>
              {r.node === "collapsed" ? (
                <button type="button" className="cg-main cg-earlier" onClick={onEarlier}>
                  <span className="cg-title">{r.title}</span>
                  <span className="cg-earlier-t">{earlier}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="cg-main"
                  aria-expanded={isOpen ? "true" : "false"}
                  aria-controls={"cg-card-" + r.key}
                  onClick={() => setOpenKey(isOpen ? null : r.key)}
                >
                  <span className="cg-title" title={r.title}>
                    {r.title}
                  </span>
                  {r.tag ? (
                    <span className={r.tag.mono ? "cg-tag kb-mono" : "cg-tag"} data-tone={r.tag.tone} title={r.tag.full}>
                      {r.tag.text}
                      {r.tag.full ? <span className="sr-only">, {r.tag.full}</span> : null}
                    </span>
                  ) : null}
                  <span className="cg-who">
                    <span className="cg-av" data-agent={r.author.agent ? "true" : undefined} aria-hidden="true">
                      {r.author.initial}
                      {r.author.agent ? <i></i> : null}
                    </span>
                    <span className="cg-name">{r.author.name}</span>
                  </span>
                  <span className="cg-age kb-mono">{r.age}</span>
                </button>
              )}
              {r.card ? (
                <div className="cg-card" id={"cg-card-" + r.key} role="group" aria-label={"Details: " + r.title}>
                  <div className="cg-card-who">
                    <span className="cg-av" data-agent={r.author.agent ? "true" : undefined} aria-hidden="true">
                      {r.author.initial}
                      {r.author.agent ? <i></i> : null}
                    </span>
                    <span>
                      <b>{r.author.name}</b>
                      <small>{r.card.byline}</small>
                    </span>
                  </div>
                  <dl>
                    {r.card.rows.map((x) => (
                      <div key={x.k}>
                        <dt>{x.k}</dt>
                        <dd className={x.mono ? "kb-mono" : undefined}>
                          {x.v}
                          {x.plus != null ? (
                            <>
                              {" "}
                              <span className="cg-plus">+{x.plus}</span> <span className="cg-minus">−{x.minus}</span>
                            </>
                          ) : null}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {r.card.href ? (
                    <a className="cg-card-go" href={r.card.href}>
                      {r.card.hrefLabel} {I("arrow-right", 14)}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
      {foot ? <p className="cg-foot">{foot}</p> : null}
    </section>
  );
}
