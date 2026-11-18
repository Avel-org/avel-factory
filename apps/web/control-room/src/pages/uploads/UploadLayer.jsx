// CR-34: the pieces that sit over every page: the drop target, the upload tray and the filing sheet.
// File names are untrusted text: rendered as text, never as markup. No file is ever rendered inline.
import { useEffect, useRef } from "react";
import { useSheet } from "../../kit/sheet";

/** A file's preview: the type icon in a tile (the server's bitmap thumbnail would sit here; never the file). */
export function FileThumb({ t, size }) {
  if (!t) return null;
  return (
    <span className="up-thumb" data-kind={t.kind} data-size={size} aria-hidden="true">
      {t.icon}
    </span>
  );
}

/** The full-window overlay while files are dragged over the app: where they'll go, in one line. */
export function DropTarget({ d }) {
  if (!d) return null;
  return (
    <div className="up-drop" data-kind={d.kind} role="status" aria-live="assertive" data-sheet-keep="">
      <div className="up-drop-card">
        <span className="up-drop-icon">{d.icon}</span>
        <p className="up-drop-line">{d.line}</p>
        <p className="up-drop-sub">{d.sub}</p>
      </div>
    </div>
  );
}

export function TrayRow({ r, I }) {
  return (
    <li className="up-trow" data-tone={r.tone} data-state={r.state}>
      <FileThumb t={r.thumb} size="sm" />
      <div className="up-trow-main">
        <div className="up-trow-top">
          {r.href ? (
            <a className="up-name" href={r.href}>
              {r.name}
            </a>
          ) : (
            <span className="up-name">{r.name}</span>
          )}
          <span className="up-trow-size">{r.size}</span>
        </div>
        {r.pct != null ? (
          <div
            className="up-bar"
            data-ind={r.indeterminate}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={r.indeterminate ? undefined : r.pct}
            aria-label={r.name + ": " + r.line}
            style={{ "--pct": r.pct / 100 }}
          >
            <i></i>
          </div>
        ) : null}
        <p className="up-trow-line">
          {r.tone === "bad" ? I("triangle-alert", 14) : r.tone === "ok" ? I("check", 14) : null}
          <span>{r.line}</span>
          {r.from ? <span className="up-muted"> · {r.from}</span> : null}
        </p>
        {r.ask ? (
          <form
            className="up-ask"
            onSubmit={(e) => {
              e.preventDefault();
              r.ask.save();
            }}
          >
            <label className="up-sr" htmlFor={"ask-" + r.key}>
              {r.ask.label}
            </label>
            <input
              id={"ask-" + r.key}
              className="cr-input"
              value={r.ask.value}
              onChange={r.ask.on}
              placeholder={r.ask.label}
              maxLength={140}
              autoComplete="off"
            />
            <button type="submit" className="av-btn" data-size="sm" data-variant="secondary" aria-disabled={r.ask.value.trim() ? undefined : "true"}>
              Save
            </button>
          </form>
        ) : null}
        {r.retry || r.secrets || r.dup ? (
          <div className="up-trow-acts">
            {r.retry ? (
              <button type="button" className="av-btn" data-size="sm" data-variant="secondary" onClick={r.retry}>
                {I("refresh-cw", 14)}
                Retry
              </button>
            ) : null}
            {r.secrets ? (
              <a className="av-btn" data-size="sm" data-variant="secondary" href={r.secrets}>
                {I("key-round", 14)}
                Go to Secrets
              </a>
            ) : null}
            {r.dup ? (
              <>
                <button type="button" className="av-btn" data-size="sm" data-variant="secondary" onClick={r.dup.same}>
                  Use the same places
                </button>
                <button type="button" className="av-btn" data-size="sm" data-variant="ghost" onClick={r.dup.separate}>
                  Keep separate
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
      {r.dismiss ? (
        <button type="button" className="up-x" onClick={r.dismiss} aria-label={"Clear " + r.name + " from the list"}>
          {I("x", 16)}
        </button>
      ) : null}
    </li>
  );
}

/** Bottom right on a desk, a bottom sheet on a phone; folds to a pill with the count. */
export function UploadTray({ t, I }) {
  // shown only while you're uploading something from this page: no folded pill left on screen
  if (!t || !t.open) return null;
  return (
    <section className="up-tray" data-open="true" aria-label="Uploads" data-sheet-keep="">
      <div className="up-tray-card">
        <header className="up-tray-head">
          <h2>{t.title}</h2>
          {t.clear ? (
            <button type="button" className="up-link" onClick={t.clear}>
              Clear done
            </button>
          ) : null}
          <button type="button" className="up-x" onClick={t.toggle} aria-label="Close the uploads">
            {I("x", 16)}
          </button>
        </header>
        <ul className="up-trows" aria-live="polite">
          {t.rows.map((r) => (
            <TrayRow key={r.key} r={r} I={I} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function Check({ on, onChange, children, sub, id }) {
  return (
    <label className="up-check" htmlFor={id}>
      <input id={id} type="checkbox" checked={!!on} onChange={onChange} />
      <span className="up-box" aria-hidden="true"></span>
      <span className="up-check-t">
        {children}
        {sub ? <small>{sub}</small> : null}
      </span>
    </label>
  );
}

/** Pick one or more destinations; each asks only what it needs. A side sheet on a desk, full screen on a phone. */
export function FilingSheet({ sh, I }) {
  const ref = useRef(null);
  useSheet(ref, { open: !!sh, onClose: sh ? sh.close : () => {}, side: "bottom" });
  const body = useRef(null);
  useEffect(() => {
    if (sh && sh.problems.length && body.current) {
      const bad = body.current.querySelector("[data-err]");
      if (bad) bad.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [sh && sh.problems.length]);
  if (!sh) return null;
  return (
    <>
      <div className="up-scrim" onClick={sh.close} aria-hidden="true"></div>
      <aside ref={ref} className="up-sheet" role="dialog" aria-modal="true" aria-labelledby="up-sheet-t" data-open="true">
        <header className="up-sheet-head" data-sheet-drag="">
          <span className="up-grab" aria-hidden="true"></span>
          <div className="up-sheet-id">
            <h2 id="up-sheet-t">{sh.title}</h2>
            <p>{sh.many ? sh.names.map((n) => n.name).join(", ") : sh.names[0].type + " · " + sh.names[0].size}</p>
          </div>
          <button type="button" className="up-x" onClick={sh.close} aria-label="Close without filing">
            {I("x", 20)}
          </button>
        </header>
        <div className="up-sheet-body" ref={body}>
          {sh.scanNote ? <p className="up-note">{sh.scanNote}</p> : null}
          <fieldset className="up-dests">
            <legend>Where it goes</legend>
            {sh.kinds.map((k) => (
              <div key={k.key} className="up-dest" data-on={k.on ? "true" : undefined} data-err={k.err ? "true" : undefined}>
                <Check id={"dest-" + k.key} on={k.on} onChange={k.toggle} sub={k.hint}>
                  {k.label}
                </Check>
                {k.on ? <DestFields k={k.key} sh={sh} I={I} /> : null}
                {k.err ? <p className="up-err">{k.err}</p> : null}
              </div>
            ))}
          </fieldset>

          {sh.effects.length ? (
            <section className="up-what" aria-labelledby="up-what-h">
              <h3 id="up-what-h">What filing will do</h3>
              <ul>
                {sh.effects.map((e) => (
                  <li key={e.key}>
                    <b className="kb-mono">{e.ref}</b>
                    <span className="up-muted">({e.state})</span> {e.text}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {sh.batch ? (
            <p className="up-note" data-tone="info">
              {I("clock", 16)}
              <span>{sh.batch}</span>
            </p>
          ) : null}
          {sh.scope ? (
            <fieldset className="up-scope">
              <legend>Does this change what’s being built?</legend>
              <div className="lib-seg" role="radiogroup" aria-label="Does this change what’s being built?">
                <button type="button" className="lib-seg-btn" role="radio" aria-checked={sh.scope.no} onClick={sh.scope.setNo}>
                  No, it helps the work
                </button>
                <button type="button" className="lib-seg-btn" role="radio" aria-checked={sh.scope.yes} onClick={sh.scope.setYes}>
                  Yes
                </button>
              </div>
              {sh.scope.yes ? <p className="up-note">{sh.scope.note}</p> : null}
            </fieldset>
          ) : null}
        </div>
        <footer className="up-sheet-foot">
          {sh.problems.length ? (
            <p className="up-err" role="alert">
              {sh.problems[0]}
              {sh.problems.length > 1 ? " (and " + (sh.problems.length - 1) + " more)" : ""}
            </p>
          ) : sh.summary.length ? (
            <p className="up-sum">
              To <b>{sh.summary.map((x) => x.label).join(", ")}</b>
            </p>
          ) : null}
          <div className="up-foot-btns">
            <button type="button" className="av-btn" data-variant="ghost" onClick={sh.close}>
              Cancel
            </button>
            <button type="button" className="av-btn" data-variant="primary" onClick={sh.confirm} aria-disabled={sh.blocked}>
              {sh.confirmLabel}
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
}

function DestFields({ k, sh, I }) {
  if (k === "client" && sh.client)
    return (
      <div className="up-fields">
        <label className="cr-field">
          <span>Client</span>
          <select className="av-select" value={sh.client.value} onChange={sh.client.onPick}>
            {sh.client.opts.map((o) => (
              <option key={o.key} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <Check id="dest-client-kb" on={sh.client.kb} onChange={sh.client.onKb} sub="Opens a knowledge change for review">
          Also propose as a knowledge entry
        </Check>
      </div>
    );
  if (k === "mission" && sh.mission)
    return (
      <div className="up-fields">
        <label className="cr-field">
          <span>Project</span>
          <select className="av-select" value={sh.mission.value} onChange={sh.mission.onPick}>
            {sh.mission.opts.map((o) => (
              <option key={o.key} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <p className="up-hint">{sh.mission.note}</p>
      </div>
    );
  if (k === "module" && sh.module) {
    const M = sh.module;
    return (
      <div className="up-fields">
        <label className="cr-field">
          <span>Find a module</span>
          <input className="cr-input" type="search" value={M.q} onChange={M.onQ} placeholder="M3 or signup" autoComplete="off" />
        </label>
        <ul className="up-mods" aria-label="Modules">
          {M.list.map((m) => (
            <li key={m.key}>
              <Check id={"mod-" + m.key} on={m.on} onChange={m.toggle} sub={m.sub}>
                <b className="kb-mono">{m.ref}</b> {m.title}
              </Check>
            </li>
          ))}
        </ul>
        {M.none ? <p className="up-hint">{M.none}</p> : null}
        <label className="cr-field" data-err={M.reasonErr ? "true" : undefined}>
          <span>What it’s for (required)</span>
          <input
            className="cr-input"
            value={M.reason}
            onChange={M.onReason}
            placeholder="updated pricing table, section 3"
            maxLength={140}
            aria-invalid={M.reasonErr ? "true" : undefined}
            aria-describedby="up-reason-help"
          />
        </label>
        <p className="up-hint" id="up-reason-help">
          {M.reasonErr || "It becomes the line on the agents’ reading list."}
        </p>
        <div className="lib-seg up-seg" role="radiogroup" aria-label="How the agents get it">
          <button type="button" className="lib-seg-btn" role="radio" aria-checked={M.listed} onClick={M.setListed(true)}>
            On the reading list
          </button>
          <button type="button" className="lib-seg-btn" role="radio" aria-checked={!M.listed} onClick={M.setListed(false)}>
            Available only
          </button>
        </div>
        <p className="up-hint">{M.listed ? "The agent reads it before it starts." : "In the agent’s workspace, not read unless it needs it."}</p>
        {M.docLike && M.listed ? (
          <>
            <label className="cr-field">
              <span>Pages or section (optional)</span>
              <input className="cr-input" value={M.range} onChange={M.onRange} placeholder="pages 3–9, or section 3" autoComplete="off" />
            </label>
            <p className="up-hint">{M.pagesHint}</p>
          </>
        ) : null}
        {M.meters.map((m) => (
          <div key={m.key} className="up-meter" data-warn={m.warn}>
            <div className="up-meter-top">
              <span>
                <b className="kb-mono">{m.ref}</b> reading list
              </span>
              <span className="up-meter-n">{m.text}</span>
            </div>
            <div
              className="mdp-meter"
              data-warn={m.warn}
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(100, m.pct)}
              aria-label={m.ref + " reading list " + m.text}
              style={{ "--pct": Math.min(1, m.pct / 100) }}
            >
              <i></i>
              <span className="mdp-meter-mark" aria-hidden="true"></span>
            </div>
            <p className="up-hint">
              {m.add}
              {m.note ? (
                <b className="up-meter-note">
                  {" · "}
                  {m.note}
                </b>
              ) : null}
            </p>
          </div>
        ))}
      </div>
    );
  }
  if (k === "library" && sh.library)
    return (
      <div className="up-fields">
        <div className="lib-seg up-seg" role="radiogroup" aria-label="Kind">
          {sh.library.kinds.map((x) => (
            <button key={x.key} type="button" className="lib-seg-btn" role="radio" aria-checked={x.on} onClick={x.pick}>
              {x.label}
            </button>
          ))}
        </div>
        <p className="up-hint">Opens a factory change for review. Nothing changes until you merge it.</p>
      </div>
    );
  if (k === "repo" && sh.repo) {
    const R = sh.repo;
    return (
      <div className="up-fields">
        <label className="cr-field">
          <span>Path in the repo</span>
          <input className="cr-input kb-mono" value={R.path} onChange={R.onPath} autoComplete="off" spellCheck="false" />
        </label>
        <div className="up-folders" aria-label="The project’s folders">
          {R.folders.map((f) => (
            <button key={f.key} type="button" className="up-chip kb-mono" onClick={f.pick}>
              {f.label}
            </button>
          ))}
        </div>
        {R.taken ? (
          <div className="up-warn" data-err={!R.replace ? "true" : undefined}>
            <p>
              {I("triangle-alert", 16)}
              <span>Replaces an existing file</span>
            </p>
            <Check id="repo-replace" on={R.replace} onChange={R.onReplace}>
              Replace it
            </Check>
          </div>
        ) : null}
        {R.licence ? (
          <>
            <label className="cr-field" data-err={R.licence.err ? "true" : undefined}>
              <span>Licence (required)</span>
              <input
                className="cr-input"
                value={R.licence.value}
                onChange={R.licence.on}
                placeholder="SIL OFL 1.1, from rsms.me/inter"
                aria-invalid={R.licence.err ? "true" : undefined}
              />
            </label>
            <p className="up-hint">{R.licence.err || "Printed on the receipt."}</p>
          </>
        ) : null}
        <p className="up-hint">Photo location and camera data will be removed; scanned for malware.</p>
      </div>
    );
  }
  return null;
}
