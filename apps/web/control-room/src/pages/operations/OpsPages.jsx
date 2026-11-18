import { FileList } from "../uploads/UploadsPages";
import { FilterBar } from "../../kit/FilterBar";
import { ReceiptPage } from "./ReceiptPage.jsx";
import { ModulePage } from "./ModulePage.jsx";
import { CommitGraph } from "../../kit/Trail";
import { EmptyState } from "../../kit/EmptyState";

/**
 * The screens around the work: All projects, Clients, and a project's Release, Plan, Dispatch,
 * Gates and Findings, plus Factory and Activity. Values come from src/app/operations.js. Shared pieces:
 * Panel (a card with a heading), Tag, and the row list.
 */
export function OpsPage({ vals }) {
  if (vals.projects) return <Projects v={vals.projects} />;
  if (vals.clients) return vals.clients.one ? <Client v={vals.clients} /> : <Clients v={vals.clients} />;
  if (vals.release) return <Release v={vals.release} />;
  if (vals.receipt) return <ReceiptPage v={vals.receipt} />;
  if (vals.module) return <ModulePage v={vals.module} />;
  if (vals.plan) return vals.plan.dispatchView ? <Dispatch v={vals.plan} /> : <Plan v={vals.plan} />;
  if (vals.gates) return <Gates v={vals.gates} />;
  if (vals.findings) return <Findings v={vals.findings} />;
  if (vals.factory) return <Factory v={vals.factory} />;
  if (vals.activity) return <Activity v={vals.activity} />;
  return null;
}

const Tag = ({ tone, children }) => (
  <span className="av-tag" data-ui="Tag" data-tone={tone}>
    {children}
  </span>
);

function Panel({ title, meta, action, children, gap, id }) {
  const hid =
    id ||
    "op-" +
      String(title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
  return (
    <section className="lib-card op-panel" aria-labelledby={hid} data-gap={gap}>
      <header className="op-panel-head">
        <h2 className="op-h" id={hid}>
          {title}
        </h2>
        {meta ? <span className="op-meta">{meta}</span> : null}
        {action || null}
      </header>
      {children}
    </section>
  );
}

function Empty({ title, msg, scene = "emptyList", action }) {
  return (
    <div className="op-empty">
      <EmptyState scene={scene} title={title} action={action}>
        {msg}
      </EmptyState>
    </div>
  );
}

/* ---------------------------------------------------------------- All projects */
function Projects({ v }) {
  return (
    <div className="op">
      <FilterBar
        f={v.filter}
        I={v.I}
        label="Filter projects"
        search={{
          label: "Search projects",
          value: v.q,
          onChange: v.onQ,
          clear: v.clearQ,
          placeholder: "Search projects or clients",
        }}
      />
      {v.empty ? (
        <Empty scene="noResults" title="No projects match these filters" msg="Remove a filter, or clear them all." />
      ) : (
        <ul className="op-list lib-card">
          {v.rows.map((r) => (
            <li key={r.key}>
              <a className="op-row op-proj" href={r.href}>
                <span className="op-row-main">
                  <b>{r.name}</b>
                  <span className="op-sub">
                    {r.internal ? (
                      <span className="op-for" data-for="internal">
                        {r.client}
                      </span>
                    ) : (
                      r.client
                    )}{" "}
                    · {r.pkg}
                  </span>
                </span>
                <span
                  className="op-gates"
                  aria-label={"Gates: " + r.gates.filter((g) => g.st === "pass").length + " of 6 passed"}
                >
                  {r.gates.map((g) => (
                    <i key={g.key} data-st={g.st}></i>
                  ))}
                </span>
                <span className="op-row-side">
                  <Tag tone={r.tone}>{r.stateLabel}</Tag>
                  {r.needs ? <span className="op-needs">{r.needs}</span> : null}
                  {r.atRisk ? <span className="op-needs">{r.atRisk}</span> : null}
                  {r.modules ? <span className="op-sub">{r.modules}</span> : null}
                  {r.due ? (
                    <span className="op-sub" data-soon={r.dueSoon}>
                      {r.due}
                    </span>
                  ) : null}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Clients */
function Clients({ v }) {
  const L = v.list;
  const F = L.form;
  return (
    <div className="op">
      {L.stages.length ? (
        <ul className="op-stages" aria-label="Pipeline stages">
          {L.stages.map((st) => (
            <li key={st.key}>
              <b>{st.count}</b> <span className="op-sub">{st.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {F ? (
        <form className="lib-card cr-form op-lead-form" onSubmit={F.submit} aria-label="Add a lead">
          <label className="cr-field">
            <span>Name</span>
            <input
              className="cr-input"
              type="text"
              value={F.name}
              onChange={F.onName}
              aria-invalid={F.error ? "true" : undefined}
              aria-describedby={F.error ? "lead-err" : undefined}
            />
          </label>
          {F.error ? (
            <p className="cr-error" id="lead-err" role="alert">
              {F.error}
            </p>
          ) : null}
          <label className="cr-field">
            <span>Source</span>
            <select className="av-select" value={F.source} onChange={F.onSource}>
              {F.sources.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {F.showReferrer ? (
            <label className="cr-field">
              <span>Referred by</span>
              <input className="cr-input" type="text" value={F.referrerName} onChange={F.onReferrer} />
            </label>
          ) : null}
          <label className="cr-field">
            <span>Notes</span>
            <textarea className="cr-input" rows={3} maxLength={2000} value={F.notes} onChange={F.onNotes} />
          </label>
          <div className="cr-form-foot">
            <button type="submit" className="av-btn" data-ui="Button" data-variant="primary">
              Add lead
            </button>
            <button type="button" className="av-btn" data-ui="Button" data-variant="ghost" onClick={F.cancel}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      <FilterBar f={L.filter} I={L.I} label="Filter clients" />
      <ul className="op-list lib-card">
        {L.rows.map((r) => (
          <li key={r.key}>
            <a className="op-row" href={r.href}>
              <span className="op-row-main">
                <b>{r.name}</b>
                <span className="op-sub">{r.contact}</span>
                <span className="op-sub">{r.line}</span>
              </span>
              <span className="op-row-side">
                <Tag tone={r.tone}>{r.statusLabel}</Tag>
                {r.waiting ? <span className="op-needs">{r.waiting}</span> : null}
                {r.lastLabel ? <span className="op-sub">{r.lastLabel}</span> : null}
              </span>
            </a>
          </li>
        ))}
      </ul>
      {L.internalNote ? (
        <p className="op-note">
          {L.internalNote.text}{" "}
          {L.internalNote.links.map((l, i) => (
            <span key={l.key}>
              {i ? " · " : null}
              <a href={l.href}>{l.label}</a>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

function ClientTabs({ o }) {
  return (
    <nav className="lib-screen-tabs cr-tabs up-ctabs" aria-label="Client sections">
      {o.tabs.map((t) => (
        <a key={t.key} className="lib-screen-tab" href={t.href} aria-current={o.tab === t.key ? "page" : undefined}>
          {t.label}
        </a>
      ))}
    </nav>
  );
}

/** CR-34: a client's files: the brand kit every project of theirs shares, and their other files. */
function ClientFiles({ v }) {
  const o = v.one;
  const F = o.files;
  return (
    <div className="op op-client">
      <ClientTabs o={o} />
      <p className="up-muted up-drop-hint">
        Drop files on this page to add them to {o.name}’s files. Every {o.name} project can use them once their scan is clean.
      </p>
      <Panel title="Brand kit" meta={String(F.kit.length)}>
        <FileList rows={F.kit} I={v.I} empty={"No brand kit yet. Drop " + o.name + "’s logo, colours or fonts here."} />
      </Panel>
      <Panel title="Other files" meta={String(F.other.length)}>
        <FileList rows={F.other} I={v.I} empty="No other files." />
      </Panel>
    </div>
  );
}

function Client({ v }) {
  const o = v.one;
  const X = o.close;
  if (o.tab === "files") return <ClientFiles v={v} />;
  return (
    <div className="op op-client">
      <ClientTabs o={o} />
      <section className="op-brief lib-card" aria-label="Briefing">
        <p className="op-label">Briefing</p>
        {o.brief.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
        <div className="op-brief-acts">
          {o.start ? (
            <button type="button" className="av-btn" data-size="md" data-variant="primary" onClick={o.start}>
              {o.startLabel}
            </button>
          ) : null}
          {X ? (
            <button type="button" className="av-btn" data-size="md" data-variant="ghost" onClick={X.toggle}>
              Close as lost
            </button>
          ) : null}
        </div>
        {X && X.open ? (
          <div className="op-close-lead">
            <label className="cr-field">
              <span>Why it was lost</span>
              <select className="av-select" value={X.reason} onChange={X.onReason}>
                <option value="">Pick a reason</option>
                {X.reasons.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="av-btn"
              data-variant="secondary"
              onClick={X.submit}
              aria-disabled={X.reason ? undefined : "true"}
            >
              Close the lead
            </button>
          </div>
        ) : null}
      </section>
      <div className="op-split">
        <Panel title="Timeline" meta={o.timeline.length + " events"}>
          <p className="op-p op-sub" data-gap="CR-W23">
            No contract route reads activity by client yet (CR-W23). Shown from sample data.
          </p>
          <ol className="op-timeline">
            {o.timeline.map((t) => (
              <li key={t.key} data-kind={t.kind}>
                <span className="op-tl-icon" aria-hidden="true">
                  {t.iconEl}
                </span>
                <span className="op-tl-text">{t.text}</span>
                <time className="op-sub">{t.when}</time>
              </li>
            ))}
          </ol>
        </Panel>
        <div className="op-side">
          {o.followups.length ? (
            <Panel title="Follow-ups" meta={String(o.followups.length)}>
              <ul className="op-links">
                {o.followups.map((fu) => (
                  <li key={fu.key} className="op-contact">
                    <a href={fu.href} className="op-wait-link">
                      <span className="op-wait-k">{fu.kind}</span>
                      <span>{fu.title}</span>
                    </a>
                    <span className="op-sub">{fu.channel}</span>
                    {fu.unsubscribed ? <span className="op-needs">{fu.unsubscribed}</span> : null}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
          {o.waiting.length ? (
            <Panel title="Waiting on you" meta={String(o.waiting.length)}>
              <ul className="op-links">
                {o.waiting.map((w) => (
                  <li key={w.key}>
                    <a href={w.href} className="op-wait-link">
                      <span className={w.isCode ? "kb-mono op-wait-k" : "op-wait-k"}>{w.ref}</span>
                      <span>{w.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
          {o.projects.length ? (
            <Panel title="Projects" meta={String(o.projects.length)}>
              <ul className="op-links">
                {o.projects.map((p) => (
                  <li key={p.key}>
                    <a href={p.href}>{p.name}</a>
                    <Tag tone={p.tone}>{p.state}</Tag>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
          <Panel title="Contacts">
            <ul className="op-links">
              {o.contacts.length ? (
                o.contacts.map((ct) => (
                  <li key={ct.key} className="op-contact">
                    <b>{ct.name}</b>
                    {ct.role ? <span className="op-sub">{ct.role}</span> : null}
                    {ct.email ? <span className="op-sub kb-mono">{ct.email}</span> : null}
                  </li>
                ))
              ) : (
                <li className="op-sub">No contact yet</li>
              )}
            </ul>
          </Panel>
          {o.consent ? (
            <Panel title="Show their work">
              <p className="op-p">{o.consent.text}</p>
              <p className="op-p op-sub">Proof pages use only receipts from clients who said yes.</p>
              {o.consent.action ? (
                <button
                  type="button"
                  className="av-btn"
                  data-size="sm"
                  data-variant="secondary"
                  onClick={o.consent.onClick}
                >
                  {o.consent.action}
                </button>
              ) : null}
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Release (phone first) */
function Release({ v }) {
  if (!v.ready)
    return (
      <div className="op op-release">
        <Panel title={v.title}>
          <p className="op-p">{v.line}</p>
          <ul className="op-list">
            {v.left.map((g) => (
              <li key={g.key}>
                <div className="op-row">
                  <span className="op-row-main">
                    <b>{g.name}</b>
                    <span className="op-sub">{g.gate}</span>
                  </span>
                  <Tag tone={g.tone}>{g.st}</Tag>
                </div>
              </li>
            ))}
          </ul>
          <a className="op-more" href={v.progressHref}>
            See the project's progress
          </a>
        </Panel>
      </div>
    );
  return (
    <div className="op op-release">
      <section className="lib-card op-receipt" aria-labelledby="op-rc">
        <div className="op-stamp" data-tone={v.verdictTone}>
          {v.verdict}
        </div>
        <h2 className="op-h" id="op-rc">
          Receipt <span className="kb-mono">{v.receipt}</span>
        </h2>
        <p className="op-sub">
          {v.issued} · commit <span className="kb-mono">{v.commit}</span>
        </p>
        <ul className="op-proof">
          {v.proof.map((p, i) => (
            <li key={i}>
              {v.I("check", 16)}
              <span>{p}</span>
            </li>
          ))}
        </ul>
        {v.accepted.length ? (
          <div className="op-accepted">
            <p className="op-label">Accepted, not fixed</p>
            {v.accepted.map((a) => (
              <a key={a.key} href={a.href} className="op-accepted-row">
                <span className="kb-mono">{a.ref}</span> {a.title}
                <span className="op-sub op-block">{a.reason}</span>
              </a>
            ))}
          </div>
        ) : null}
        <dl className="op-ledger">
          {v.split.map((x) => (
            <div key={x.key}>
              <dt>{x.k}</dt>
              <dd>{x.v}</dd>
            </div>
          ))}
        </dl>
        <p className="op-sub">
          The hash is <span className="kb-mono">{v.hash.slice(0, 15)}…</span>. Delivery: {v.delivery}.
        </p>
        <div className="op-rc-check" data-checked={v.checkedNote ? "true" : undefined}>
          {v.I("shield-check", 16)}
          <span>{v.checkedNote || "Check the proof yourself before you release: it takes about a second."}</span>
          <a className="av-btn" data-size="sm" data-variant="secondary" href={v.receiptHref}>
            {v.checkedNote ? "Open the receipt" : "Check the proof"}
          </a>
        </div>
      </section>
      {v.history ? (
        <CommitGraph
          title="What ships"
          titleId="op-hist"
          count={v.history.count}
          rows={v.history.rows}
          lanes={v.history.lanes}
          I={v.I}
          earlier={v.history.earlier}
          foot={"The top commit, " + v.commit + ", is the one the receipt names. Release sends that commit and nothing else."}
        />
      ) : null}
      {v.released ? (
        <section className="lib-card op-panel op-released" aria-labelledby="op-rel-h" role="status">
          <h2 className="op-h" id="op-rel-h">
            Released {v.released.at}
          </h2>
          {/* the delivery worker's log, as a terminal: each line types in as it happens */}
          <div className="cr-cli tt-term" data-ui="DeliveryTerminal">
            <div className="cr-cli-bar">
              <span className="cr-cli-dots" aria-hidden="true">
                <i></i>
                <i></i>
                <i></i>
              </span>
              <span className="cr-cli-title">delivery · {v.commit}</span>
            </div>
            <ol className="cr-cli-body tt-steps" aria-label="Delivery log">
              {v.released.steps.map((x) => (
                <li key={x.key} className="cr-cli-line" data-done={x.done}>
                  <span className="tt-ps" aria-hidden="true">
                    {x.done ? "✓" : "›"}
                  </span>{" "}
                  <span className="tt-x">{x.text}</span>
                  {x.done ? null : <span className="tt-cursor" aria-hidden="true"></span>}
                  <span className="sr-only">{x.done ? ", done" : ", in progress"}</span>
                </li>
              ))}
            </ol>
          </div>
          {v.released.pr ? <p className="op-p">{v.released.pr}. The project closes when it merges.</p> : null}
        </section>
      ) : null}
      <div className="op-release-bar" role="region" aria-label="Release" hidden={v.released ? true : undefined}>
        {v.pass ? (
          <p className="op-p">
            {v.pass.text}{" "}
            <a className="op-more" href={v.pass.href}>
              Open it in Decisions
            </a>
          </p>
        ) : (
          <p className="op-p">This exact commit ships. Nothing else.</p>
        )}
        {v.pass && v.pass.need ? (
          <div className="op-pass-why">
            <label className="cr-why-label" htmlFor="op-pass-why">
              Why you accept the pass
            </label>
            <span className="cr-why-help">It goes on the release record.</span>
            <textarea
              id="op-pass-why"
              className="op-pass-input"
              rows="2"
              maxLength="280"
              value={v.pass.reason}
              onChange={v.pass.onReason}
              placeholder="Say why in a sentence."
            ></textarea>
          </div>
        ) : null}
        <div className="op-release-btns">
          {v.pass ? (
            <button
              type="button"
              className="av-btn"
              data-size="md"
              data-variant="primary"
              onClick={v.pass.accept}
              disabled={!v.pass.can || v.pass.deciding ? true : undefined}
            >
              {v.I("check", 16)}
              {v.pass.deciding ? "Accepting…" : v.pass.label}
            </button>
          ) : null}
          <button
            type="button"
            className="av-btn"
            data-size="md"
            data-variant={v.pass ? "secondary" : "primary"}
            onClick={v.release}
            disabled={!v.canRelease || undefined}
          >
            {v.canRelease ? "Release" : "Release after the pass"}
          </button>
        </div>
        {v.sends ? (
          <details className="cr-dc-sends">
            <summary>What Release sends</summary>
            <p>
              <code>{v.sends.name}</code> · <code>{v.sends.method + " " + v.sends.path}</code> (route {v.sends.no})
            </p>
            <pre>{v.sends.input}</pre>
          </details>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Plan, Dispatch, Gates, Findings */
function Plan({ v }) {
  if (v.empty) return <Empty scene="nothing" title="No plan yet" msg="Canon drafts the plan after checkpoint 0.4." />;
  return (
    <div className="op">
      <div className="op-client-head">
        <b>{v.version}</b>
        <span className="op-sub">{v.approved}</span>
      </div>
      <dl className="op-stats op-stats-sm">
        {v.counts.map((x) => (
          <div key={x.key}>
            <dt>{x.k}</dt>
            <dd>{x.v}</dd>
          </div>
        ))}
      </dl>
      <Panel
        title="Modules"
        meta="As approved"
        action={
          v.buildHref ? (
            <a className="op-more" href={v.buildHref}>
              How they're going is on Build
            </a>
          ) : null
        }
      >
        <ul className="op-list">
          {v.modules.map((m) => (
            <li key={m.key}>
              <div className="op-row">
                <span className="op-row-main">
                  <b>
                    <span className="kb-mono op-ref">{m.ref}</span> {m.title}
                  </b>
                  {m.goal ? <span className="op-p">{m.goal}</span> : null}
                  <span className="op-sub">{[m.kind, m.deps, m.counts].filter(Boolean).join(" · ")}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
function Dispatch({ v }) {
  if (v.empty) return <Empty scene="emptyFolder" title="Nothing dispatched yet" msg="Dispatch starts after gate 1." />;
  const waves = ["Wave 1", "Wave 2"]
    .map((w) => ({ w, rows: v.dispatch.filter((d) => d.wave === w) }))
    .filter((g) => g.rows.length);
  return (
    <div className="op">
      {v.pkg ? (
        <Panel title="Work instructions" meta={<Tag tone={v.pkg.tone}>{v.pkg.label}</Tag>}>
          <p className="op-p">{v.pkg.text}</p>
          <ul className="op-list">
            {v.pkg.where.map((w) => (
              <li key={w}>{w}</li>
            ))}
            <li>
              Package <span className="kb-mono">{v.pkg.hash}</span>, the version you confirm
            </li>
          </ul>
          <div className="op-release-btns">
            {v.pkg.confirm ? (
              <button type="button" className="av-btn" data-variant="primary" onClick={v.pkg.confirm}>
                Add to the repo
              </button>
            ) : null}
            <a className="av-btn" data-variant="secondary" href={v.pkg.decHref}>
              Open in Decisions
            </a>
          </div>
          <details className="cr-dc-sends">
            <summary>What confirming sends</summary>
            <p>
              <code>{v.pkg.sends.name}</code> · <code>{v.pkg.sends.method + " " + v.pkg.sends.path}</code> (route{" "}
              {v.pkg.sends.no}). A re-render first gets 409 STALE_VERSION on packageHash.
            </p>
            <pre>{v.pkg.sends.input}</pre>
          </details>
        </Panel>
      ) : null}
      {waves.map((g) => (
        <Panel key={g.w} title={g.w} meta={g.w === "Wave 1" ? "Starts first" : "Starts when its dependencies land"}>
          <div className="op-table" role="table" aria-label={g.w}>
            <div className="op-tr op-tr-dsp" role="row" data-head="true">
              <span role="columnheader">Module</span>
              <span role="columnheader">Builds</span>
              <span role="columnheader">Tests</span>
              <span role="columnheader">Reviews</span>
              <span role="columnheader">Task doc</span>
              <span role="columnheader">State</span>
            </div>
            {g.rows.map((d) => (
              <div key={d.key} className="op-tr op-tr-dsp" role="row">
                <span role="cell" data-k="Module">
                  <b>{d.title}</b>
                  <span className="op-sub op-block kb-mono">{d.ref}</span>
                </span>
                <span role="cell" data-k="Builds">
                  {d.builder}
                </span>
                <span role="cell" data-k="Tests">
                  {d.tests}
                </span>
                <span role="cell" data-k="Reviews">
                  {d.review}
                </span>
                <span role="cell" data-k="Task doc" className="op-sub">
                  {d.doc}
                </span>
                <span role="cell" data-k="State">
                  <Tag tone={d.tone}>{d.state}</Tag>
                </span>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}
function Gates({ v }) {
  return (
    <div className="op">
      <ol className="op-gatelist lib-card">
        {v.gates.map((g) => (
          <li key={g.key} data-tone={g.tone}>
            <span className="op-gate-n kb-mono">{g.n}</span>
            <span className="op-row-main">
              <b>{g.name}</b>
              <span className="op-sub">{g.desc}</span>
              <span className="op-sub">{g.once}</span>
            </span>
            <Tag tone={g.tone}>{g.state}</Tag>
          </li>
        ))}
      </ol>
      {v.lane.length ? (
        <Panel title="Integration" meta="Modules landing on the project branch">
          <dl className="op-stats op-stats-sm">
            {v.lane.map((x) => (
              <div key={x.key}>
                <dt>{x.k}</dt>
                <dd>{x.v}</dd>
              </div>
            ))}
          </dl>
          <ul className="op-list">
            {v.recent.map((r) => (
              <li key={r.key}>
                <div className="op-row">
                  <span className="op-row-main">
                    <b>{r.module}</b>
                    <span className="op-sub">
                      <span className="kb-mono">{r.commit}</span> · {r.when}
                    </span>
                  </span>
                  <Tag tone={r.tone}>{r.state}</Tag>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
function Findings({ v }) {
  if (v.empty) return <Empty title="No findings" msg="Nothing has been reported for this project." />;
  return (
    <div className="op">
      <FilterBar f={v.filter} I={v.I} label="Filter findings" />
      <ul className="op-list lib-card">
        {v.rows.map((f) => (
          <li key={f.key}>
            <div className="op-row">
              <span className="op-row-main">
                <b>{f.title}</b>
                <span className="op-sub">
                  {f.ref ? <span className="kb-mono">{f.ref}</span> : null}
                  {f.ref ? " · " : null}
                  {f.kindLabel} · {f.where}
                </span>
                {f.evidence ? <span className="op-sub">Evidence: {f.evidence}</span> : null}
                <span className="op-sub">
                  {f.by}
                  {f.routing ? " · " + f.routing : ""}
                </span>
                {f.how ? (
                  <span className="op-p op-how" data-caps={f.caps}>
                    {f.how}
                  </span>
                ) : null}
                {f.integrity ? (
                  <span className="op-p op-sub">
                    An integrity failure at Gate 5 can’t be accepted. It has to be fixed.
                  </span>
                ) : null}
                {f.accept ? (
                  <span className="op-accept">
                    {f.accept.open ? (
                      <>
                        <label className="cr-field" htmlFor={f.accept.id}>
                          <span>Why you accept it</span>
                        </label>
                        <textarea
                          id={f.accept.id}
                          className="cr-input"
                          rows={2}
                          value={f.accept.reason}
                          onChange={f.accept.onReason}
                        />
                        <span className="op-sub">Accepting caps the receipt at pass.</span>
                        <span className="op-accept-acts">
                          <button
                            type="button"
                            className="av-btn"
                            data-size="sm"
                            data-variant="primary"
                            onClick={f.accept.send}
                            aria-disabled={f.accept.reason.trim() ? undefined : "true"}
                          >
                            Accept with this reason
                          </button>
                          <button
                            type="button"
                            className="av-btn"
                            data-size="sm"
                            data-variant="ghost"
                            onClick={f.accept.toggle}
                          >
                            Cancel
                          </button>
                        </span>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="av-btn"
                        data-size="sm"
                        data-variant="secondary"
                        onClick={f.accept.toggle}
                      >
                        Accept it
                      </button>
                    )}
                  </span>
                ) : null}
              </span>
              <Tag tone={f.tone}>{f.state}</Tag>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------- Factory and Activity */
function Factory({ v }) {
  return (
    <div className="op">
      <Panel title="Open changes" meta={v.open.length + " waiting for you in Decisions"}>
        <ul className="op-list">
          {v.open.map((p) => (
            <li key={p.key}>
              <a className="op-row" href={p.href}>
                <span className="op-row-main">
                  <b>{p.title}</b>
                  <span className="op-sub">
                    <span className="kb-mono">{p.pr}</span> · {p.area} · {p.when}
                  </span>
                </span>
                <Tag tone="needs">Waiting on you</Tag>
              </a>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Factory versions" meta="Each project stays on the version it started with">
        <ol className="kbd-timeline op-versions">
          {v.versions.map((x) => (
            <li key={x.key} data-current={x.current}>
              <span className="kbd-dot" aria-hidden="true"></span>
              <span className="kbd-tl-head">
                <b className="kb-mono">{x.sha}</b>
                {x.current ? <Tag tone="accent">Current</Tag> : null}
              </span>
              <span className="kbd-tl-note">{x.summary}</span>
              <small>
                {x.when} · {x.pr} · {x.pinned}
              </small>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
function Activity({ v }) {
  return (
    <div className="op">
      <FilterBar f={v.filter} I={v.I} label="Filter activity" />
      {v.days.map((d) => (
        <section key={d.key} className="op-day" aria-label={d.day}>
          <h2 className="op-h op-day-h">{d.day}</h2>
          <ul className="op-list lib-card">
            {d.rows.map((a) => (
              <li key={a.key}>
                <div className="op-row">
                  <span className="op-row-main">
                    <b>
                      {a.actor}
                      {a.assistant ? (
                        <span className="av-tag op-osa-tag" data-tone="accent">
                          Assistant
                        </span>
                      ) : null}{" "}
                      <span className="op-action">{a.action}</span>
                    </b>
                    {a.reason ? <span className="op-sub">“{a.reason}”</span> : null}
                    <span className="op-sub">
                      {a.when}
                      {a.mission ? " · " + a.mission : ""}
                    </span>
                  </span>
                  <span className="op-row-side">
                    <span className="op-sub">{a.kind}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
