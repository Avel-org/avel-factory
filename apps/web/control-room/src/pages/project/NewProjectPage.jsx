// New project: a name is all it takes (route 20, {name, clientId?}). Client project, internal tool or template is Canon's first
// question in discovery (Q-0.1a), so it's answered in one place, with Canon's recommendation beside it.
// Coming from a client or lead page, that client is carried over and Canon confirms it instead.

export function NewProjectPage({ vals }) {
  const { ic, np, submitNew } = vals;
  return (
    <form className="lib-card cr-form" data-ui="NewProjectForm" onSubmit={submitNew} aria-busy={np?.busy}>
      <fieldset className="cr-fieldset" disabled={np?.saving}>
        <legend className="cr-legend">Project</legend>
        <label className="cr-field">
          <span>Project name</span>
          <input
            className="cr-input"
            type="text"
            name="name"
            required
            autoComplete="off"
            maxLength={80}
            placeholder="Fleet portal"
            data-gap="CR-20"
          />
        </label>
      </fieldset>
      <fieldset className="cr-fieldset" disabled={np?.saving}>
        <legend className="cr-legend">Who it’s for</legend>
        {np?.from ? (
          <div className="np-for" data-from="true">
            <span className="np-for-icon" aria-hidden="true">
              {ic?.building16}
            </span>
            <div>
              <p className="np-for-t">{np.from}</p>
              <p className="cr-hint">Carried over from their page. Canon confirms it as the first question.</p>
            </div>
            <a className="av-btn" data-ui="Button" data-variant="ghost" data-size="sm" href="#/missions/new">
              Let Canon ask
            </a>
          </div>
        ) : (
          <div className="np-for">
            <span className="np-for-icon" aria-hidden="true">
              {ic?.message16}
            </span>
            <div>
              <p className="np-for-t">Canon asks first</p>
              <p className="cr-hint">
                The interview opens with one question: is this a client project, an internal tool or an internal
                template? Client projects ship to the client and can start from a template. Internal tools are AVEL’s
                own software. Internal templates are AVEL’s own starters: once delivered, you publish them to Templates.
              </p>
            </div>
          </div>
        )}
      </fieldset>
      <p className="cr-hint">
        Canon starts the interview as soon as the project is saved, beginning with checkpoint 0.1, the brief.
      </p>
      <div className="cr-form-foot">
        <button
          type="submit"
          className="av-btn"
          data-ui="Button"
          data-variant="primary"
          data-busy={np?.busy}
          aria-disabled={np?.busy}
        >
          {np?.submitIcon}
          {np?.submitLabel}
        </button>
        <a className="av-btn" data-ui="Button" data-variant="ghost" href="#/missions">
          Cancel
        </a>
      </div>
    </form>
  );
}
