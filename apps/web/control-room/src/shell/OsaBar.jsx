// CR-29 (proposed), behind the osa flag: OSA, the operator agent, beside every page.
// Ask OSA creates an assistant task through the server; OSA works it in your terminal and
// reports back. OSA prepares; only you decide, so nothing here approves anything.
// Task text is OSA's and yours: rendered as text only.

export function OsaBar({ o }) {
  if (!o) return null;
  return (
    <section className="osa" data-ui="OsaBar" data-paused={o.paused} aria-label="OSA, your operator agent">
      <div className="osa-row">
        <span className="osa-who">
          <span className="osa-icon" aria-hidden="true">
            {o.robot}
          </span>
          <b>OSA</b>
          <span className="osa-sub">{o.sessionLabel}</span>
        </span>
        <span className="osa-focus">
          <span className="osa-sub">On:</span>{" "}
          {o.osaOnHref ? <a href={o.osaOnHref}>{o.osaOn}</a> : <span>{o.osaOn}</span>}
          <span className="osa-sub osa-mine"> · You: {o.mine}</span>
        </span>
        <span className="osa-acts">
          <button
            type="button"
            className="av-btn"
            data-size="sm"
            data-variant="ghost"
            role="switch"
            aria-checked={o.follow}
            onClick={o.toggleFollow}
          >
            Follow OSA: {o.follow === "true" ? "on" : "off"}
          </button>
          <button
            type="button"
            className="av-btn"
            data-size="sm"
            data-variant="secondary"
            aria-expanded={o.askOpen ? "true" : "false"}
            onClick={o.toggleAsk}
            disabled={!!o.paused}
          >
            Ask OSA
          </button>
        </span>
      </div>
      {o.attachedNote ? (
        <p className="osa-note" role="status">
          {o.attachedNote}
        </p>
      ) : null}
      {o.askOpen ? (
        <form className="osa-ask" onSubmit={o.send}>
          <label className="cr-field" htmlFor="osa-ask-text">
            <span>Ask OSA about {o.about}</span>
          </label>
          <textarea
            id="osa-ask-text"
            className="cr-input"
            rows={2}
            maxLength={2000}
            value={o.text}
            onChange={o.onText}
            placeholder="Check the price sheet against the plan"
          />
          <span className="osa-ask-foot">
            <span className="osa-sub">Goes to your terminal through the server. Works from your phone too.</span>
            <button
              type="submit"
              className="av-btn"
              data-size="sm"
              data-variant="primary"
              aria-disabled={o.text.trim() ? undefined : "true"}
            >
              {o.sendIcon}
              Send to OSA
            </button>
          </span>
        </form>
      ) : null}
      {o.tasksSummary ? (
        <button
          type="button"
          className="osa-fold"
          aria-expanded={o.tasksOpen ? "true" : "false"}
          aria-controls="osa-tasks"
          onClick={o.toggleTasks}
        >
          {o.tasksSummary}
          <span className="osa-sub">{o.tasksOpen ? " · Hide" : " · Show"}</span>
        </button>
      ) : null}
      {o.tasks.length ? (
        <ul className="osa-tasks" id="osa-tasks" aria-label="OSA tasks">
          {o.tasks.map((t) => (
            <li key={t.key}>
              <span className="av-tag" data-tone={t.tone}>
                {t.state}
              </span>
              <span className="osa-task-main">
                <span className="osa-task-req">{t.request}</span>
                <span className="osa-sub">
                  {t.about} · {t.when}
                </span>
                {t.result ? <span className="osa-task-res">{t.result}</span> : null}
              </span>
              {t.links.map((l) => (
                <a key={l.key} className="osa-task-link" href={l.href}>
                  {l.label}
                </a>
              ))}
            </li>
          ))}
          {o.moreTasks ? (
            <li>
              <button type="button" className="av-btn" data-size="sm" data-variant="ghost" onClick={o.showAll}>
                {o.moreTasks}
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </section>
  );
}
