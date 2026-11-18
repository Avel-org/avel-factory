// The Agents page's cards and one agent's overview page (Nov 14). Data comes from ro in logic.js.
// Agent text (does, live lines, work titles) is data from the roster and history: rendered as text only.
import { list } from "../../lib/dc";

const Pill = ({ tone, children, mono }) => (
  <span className="ag-pill" data-tone={tone} data-mono={mono ? "" : undefined}>
    {children}
  </span>
);

function Status({ st, label }) {
  return (
    <span className="ag-st" data-st={st}>
      <i aria-hidden="true"></i>
      {label}
    </span>
  );
}

/** One agent on the Agents page. The whole card is a link to the agent's overview. */
export function AgentCard({ nd, I }) {
  return (
    <a
      className="ag-card"
      href={nd.href}
      data-st={nd.st}
      data-kind={nd.kind}
      data-rel={nd.rel ? "true" : undefined}
      data-changed={nd.changed}
    >
      <span className="ag-head">
        <span className="ag-av" data-kind={nd.kind} aria-hidden="true">
          {nd.mono}
        </span>
        <span className="ag-id">
          <b className="ag-name">{nd.name}</b>
          <span className="ag-role">{nd.kindWord}</span>
        </span>
        <Status st={nd.st} label={nd.stLabel} />
      </span>
      <span className="ag-does">{nd.does}</span>
      {nd.line ? (
        <span className="ag-live">
          <span aria-hidden="true">›</span>
          <span className="ag-live-t">{nd.line}</span>
        </span>
      ) : nd.stShow ? (
        <span className="ag-what">{nd.what}</span>
      ) : null}
      <span className="ag-pills">
        {list(nd.slots).map((sl) => (
          <Pill key={sl.key} mono>
            {sl.label}
          </Pill>
        ))}
      </span>
      <span className="ag-foot">
        <Pill tone="model" mono>
          {nd.model}
        </Pill>
        <span className="ag-effort">{nd.effort} effort</span>
        <span className="ag-go" aria-hidden="true">
          {I("chevron-right", 16)}
        </span>
      </span>
      {nd.rel ? <span className="ag-rel">{nd.rel}</span> : null}
      {nd.pr ? <span className="ag-pr">{nd.pr}</span> : null}
    </a>
  );
}

/** A small linked agent pill: avatar, name, what it does. */
function AgentChip({ a }) {
  return (
    <a className="ag-chip" href={a.href}>
      <span className="ag-av" data-kind={a.kind} data-size="sm" aria-hidden="true">
        {a.mono}
      </span>
      <span className="ag-chip-n">{a.name}</span>
      <span className="ag-chip-k">{a.kindWord}</span>
    </a>
  );
}

function Rel({ k, people, none, note }) {
  return (
    <div className="ag-rel-row">
      <dt>{k}</dt>
      <dd>
        {people && people.length ? (
          <span className="ag-chips">
            {people.map((p) => (
              <AgentChip key={p.key} a={p} />
            ))}
          </span>
        ) : (
          <span className="ag-none">{none}</span>
        )}
        {note ? <small className="ag-rel-note">{note}</small> : null}
      </dd>
    </div>
  );
}

/** One agent's overview page: what it's doing now, its recent work, who it works with and its setup. */
export function AgentOverview({ a, I }) {
  return (
    <div className="ag-page" data-ui="AgentOverview">
      <section className="lib-card ag-hero" data-st={a.st} aria-label={a.name + " now"}>
        <span className="ag-av" data-kind={a.kind} data-size="lg" aria-hidden="true">
          {a.mono}
        </span>
        <div className="ag-hero-id">
          <div className="ag-hero-pills">
            <Status st={a.st} label={a.stLabel} />
            <Pill>{a.kindWord}</Pill>
            <Pill>{a.teamLabel}</Pill>
            {a.neverBuilds ? <Pill>Never builds</Pill> : null}
          </div>
          <p className="ag-hero-what">{a.what}</p>
          {a.time ? (
            <p className="ag-hero-time">
              {a.time} · last event {a.beat}
            </p>
          ) : null}
        </div>
        {a.edit ? (
          <button type="button" className="av-btn" data-variant="secondary" onClick={a.edit}>
            {I("pen-line", 16)}
            Change this agent
          </button>
        ) : null}
        {a.line ? (
          <p className="ag-hero-line">
            <span aria-hidden="true">›</span>
            <span>{a.line}</span>
          </p>
        ) : null}
      </section>

      <div className="ag-cols">
        <div className="ag-main">
          <section className="lib-card ag-sec" aria-labelledby="ag-work">
            <header className="ag-sec-h">
              <h2 id="ag-work">Recent work</h2>
              <span className="ag-count">{a.work.length}</span>
            </header>
            {a.noWork ? (
              <p className="ag-none">Nothing in project history yet. Work shows here as {a.name} lands or tries it.</p>
            ) : (
              <ul className="ag-work">
                {a.work.map((w) => (
                  <li key={w.key}>
                    <a href={w.href} className="ag-work-row" data-tone={w.tone}>
                      <i aria-hidden="true"></i>
                      <span className="ag-work-t">{w.title}</span>
                      <span className="ag-work-m">
                        {w.project}
                        {w.module ? " · " + w.module : ""}
                      </span>
                      <span className="ag-work-age">{w.age}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="lib-card ag-sec" aria-labelledby="ag-with">
            <header className="ag-sec-h">
              <h2 id="ag-with">Works with</h2>
            </header>
            <dl className="ag-rels">
              <Rel k="Reviewed by" people={a.reviewers} none="No one. Its work is checked by the gates" />
              <Rel k="Reviews" people={a.reviews} none="No one" />
              <Rel k="Disputes go to" people={a.ruler ? [a.ruler] : []} none="You" note={a.rulerVia} />
              {a.rulesFor.length ? <Rel k="Settles disputes for" people={a.rulesFor} /> : null}
              <Rel k="Same team" people={a.teammates} none="The only agent on this team" />
            </dl>
            {a.teamNote ? (
              <p className="ag-note">
                {a.teamLabel}: {a.teamNote}
              </p>
            ) : null}
          </section>
        </div>

        <aside className="ag-side">
          <section className="lib-card ag-sec" aria-labelledby="ag-setup">
            <header className="ag-sec-h">
              <h2 id="ag-setup">Setup</h2>
              {a.pr ? <span className="ag-pr">{a.pr}</span> : null}
            </header>
            {a.editing ? (
              <div className="ro-edit">
                <label className="ro-field">
                  <span>Model</span>
                  <select className="av-select ro-select" value={a.model ?? ""} onChange={a.onModel}>
                    {list(a.modelOpts).map((op) => (
                      <option key={op.key} value={op.v ?? ""}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="ro-field">
                  <span>Effort</span>
                  <div className="ro-seg" role="group" aria-label="Effort">
                    {list(a.effOpts).map((eo) => (
                      <button key={eo.key} type="button" aria-pressed={eo.on} onClick={eo.pick}>
                        {eo.label}
                      </button>
                    ))}
                  </div>
                </div>
                {list(a.kinds).map((kd) => (
                  <label key={kd.key} className="ro-field" data-err={kd.err}>
                    <span>
                      <span className="ro-mono">{kd.kind}</span> goes to
                    </span>
                    <select
                      className="av-select ro-select"
                      aria-invalid={kd.invalid}
                      value={kd.value ?? ""}
                      onChange={kd.onPick}
                    >
                      {list(kd.opts).map((op) => (
                        <option key={op.key} value={op.v ?? ""}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                    {kd.err ? <small className="ro-field-err">{kd.err}</small> : null}
                  </label>
                ))}
              </div>
            ) : (
              <dl className="ag-facts">
                <dt>Model</dt>
                <dd>
                  <Pill tone="model" mono>
                    {a.model}
                  </Pill>
                </dd>
                <dt>Vendor</dt>
                <dd>{a.vendor}</dd>
                <dt>Effort</dt>
                <dd>{a.effortWord}</dd>
                <dt>Prompt</dt>
                <dd className="ro-mono">{a.prompt}</dd>
              </dl>
            )}
            <div className="ag-facts-list">
              <h3>Takes</h3>
              <span className="ag-pills">
                {list(a.slots).length ? (
                  list(a.slots).map((sl) => (
                    <Pill key={sl.key} mono>
                      {sl.label}
                    </Pill>
                  ))
                ) : (
                  <span className="ag-none">No work kinds</span>
                )}
              </span>
            </div>
            {a.roles.length ? (
              <div className="ag-facts-list">
                <h3>Roles</h3>
                <span className="ag-pills">
                  {a.roles.map((r) => (
                    <Pill key={r.key} mono>
                      {r.label}
                    </Pill>
                  ))}
                </span>
              </div>
            ) : null}
          </section>

          <section className="lib-card ag-sec" aria-labelledby="ag-skills" data-ui="AgentSkills">
            <header className="ag-sec-h">
              <h2 id="ag-skills">Skills</h2>
              <span className="ag-count">{a.skillCount}</span>
              <a className="ro-link ag-sec-link" href="#/library/skills">
                Open Library
              </a>
            </header>
            {a.noSkills ? <p className="ag-none">No skills attached</p> : null}
            <ul className="ag-skills">
              {list(a.skillRows).map((sk) => (
                <li key={sk.key} data-new={sk.isNew}>
                  <span className="ro-mono">{sk.name}</span>
                  <small>{sk.meta}</small>
                  {a.editing ? (
                    <button type="button" className="ro-link" onClick={sk.detach}>
                      Detach
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
            {a.reading ? (
              <button type="button" className="av-btn" data-size="sm" data-variant="secondary" onClick={a.addSkill}>
                {I("plus", 16)}
                Add a skill
              </button>
            ) : null}
            {a.editing ? (
              <>
                <h3 className="ag-sub">Add from Library</h3>
                <ul className="ag-skills">
                  {list(a.skillAvail).map((sk) => (
                    <li key={sk.key}>
                      <span className="ro-mono">{sk.name}</span>
                      <small>{sk.meta}</small>
                      <button type="button" className="ro-link" onClick={sk.attach} disabled={sk.off}>
                        Attach
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        </aside>
      </div>

      <nav className="ag-pager" aria-label="Other agents">
        {a.prev ? (
          <a className="ag-chip" href={a.prev.href} data-dir="prev">
            {I("chevron-left", 16)}
            <span className="ag-chip-n">{a.prev.name}</span>
            <span className="ag-chip-k">{a.prev.kindWord}</span>
          </a>
        ) : (
          <span />
        )}
        <a className="ro-link" href={a.back}>
          All agents
        </a>
        {a.next ? (
          <a className="ag-chip" href={a.next.href} data-dir="next">
            <span className="ag-chip-n">{a.next.name}</span>
            <span className="ag-chip-k">{a.next.kindWord}</span>
            {I("chevron-right", 16)}
          </a>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
