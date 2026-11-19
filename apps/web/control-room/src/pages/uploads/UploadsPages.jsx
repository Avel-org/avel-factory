// CR-34 pages: Drive, one file's page, a project's Files tab, and the upload state sheet.
// File names and contents are untrusted: names render as text, files are never rendered inline.
import { useRef, useState } from "react";
import { FilterBar } from "../../kit/FilterBar";
import { EmptyState } from "../../kit/EmptyState";
import { facets } from "../../app/knowledge";
import { FileThumb } from "./UploadLayer";
import { UploadStatesPage } from "./UploadStates";

export function UploadsPage({ vals }) {
  const up = vals.up;
  const id = vals.pg && vals.pg.id;
  if (!up) return null;
  if (id === "toFile") return <ToFile t={up.toFile} I={up.I} />;
  if (id === "file") return up.file && up.file.missing ? <FileMissing id={up.file.missing} /> : <FilePage f={up.file} I={up.I} />;
  if (id === "files") return <ProjectFiles p={vals.projectFiles} I={up.I} pick={up.pick} />;
  if (id === "uploadStates") return <UploadStatesPage I={up.I} osa={!!vals.osaBar} />;
  return null;
}

const SCAN_TONE = { ok: "verified", live: "accent", bad: "stopped", warn: "needs" };
export const ScanTag = ({ tone, children }) => (
  <span className="av-tag up-scan" data-tone={SCAN_TONE[tone]} data-ui="Tag">
    {children}
  </span>
);
const LINK_TONE = { active: "verified", waiting: "accent", refused: "stopped", removed: "pending" };
export const LinkTag = ({ state, children }) => (
  <span className="av-tag up-ltag" data-tone={LINK_TONE[state]} data-state={state} data-ui="Tag">
    {children}
  </span>
);

/** The phone's upload button and the desk's "Upload" button: the system picker, same rule as a drop. */
export function UploadButton({ pick, I, label = "Upload", variant = "secondary" }) {
  const inp = useRef(null);
  return (
    <>
      <input
        ref={inp}
        type="file"
        multiple
        className="up-sr"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
      <button type="button" className="av-btn" data-variant={variant} data-size="md" onClick={() => inp.current && inp.current.click()}>
        {I("upload", 16)}
        {label}
      </button>
    </>
  );
}

/* ------------------------------------------------------------------ Drive */
function ItemRow({ r, I, flaggedGroup }) {
  return (
    <li className="up-item" data-flagged={r.flagged} data-checked={r.checked ? "true" : undefined} data-fresh={r.fresh}>
      {!flaggedGroup ? (
        <label className="up-check up-item-check">
          <input type="checkbox" checked={r.checked} onChange={r.toggle} aria-label={"Select " + r.name} />
          <span className="up-box" aria-hidden="true"></span>
        </label>
      ) : (
        <span className="up-item-check" aria-hidden="true"></span>
      )}
      <FileThumb t={r.thumb} />
      <div className="up-item-main">
        <a className="up-name" href={r.href}>
          {r.name}
        </a>
        <p className="up-item-meta">
          <span>{r.type}</span> <span>{r.size}</span> <span>{r.from}</span> <span>{r.age}</span>{" "}
          <span data-soon={r.soon}>{r.expires}</span>
        </p>
        {r.flag ? (
          <p className="up-flag">
            {I("shield-alert", 16)}
            <span>{r.flag}</span>
          </p>
        ) : r.sug ? (
          <p className="up-sug">
            {I("corner-down-right", 16)}
            <span>
              <b>{r.sug.label}</b>
              {r.sug.why ? <span className="up-muted">, {r.sug.why}</span> : null}
              {r.sug.canon ? <span className="up-by">suggested by Canon</span> : null}
            </span>
          </p>
        ) : r.noSug ? (
          <p className="up-sug up-muted">No suggestion yet: pick where it goes</p>
        ) : null}
        {r.version ? <p className="up-item-ver">{r.version}</p> : null}
      </div>
      <div className="up-item-side">
        <ScanTag tone={r.scanTone}>{r.scan}</ScanTag>
        {r.discarding ? (
          <div className="up-item-acts" role="group" aria-label={"Discard " + r.name + "?"}>
            <span className="up-confirm">Discard it?</span>
            <button type="button" className="av-btn" data-size="sm" data-variant="danger" onClick={r.discard}>
              Discard
            </button>
            <button type="button" className="av-btn" data-size="sm" data-variant="ghost" onClick={r.keep}>
              Keep
            </button>
          </div>
        ) : (
          <div className="up-item-acts">
            {r.file ? (
              <button type="button" className="av-btn" data-size="sm" data-variant="primary" onClick={r.file}>
                File
              </button>
            ) : null}
            {r.change ? (
              <button type="button" className="av-btn" data-size="sm" data-variant={r.file ? "secondary" : "primary"} onClick={r.change}>
                {r.file ? "Change…" : "Pick a place…"}
              </button>
            ) : null}
            {r.secrets ? (
              <a className="av-btn" data-size="sm" data-variant="secondary" href={r.secrets}>
                {I("key-round", 14)}
                Go to Secrets
              </a>
            ) : null}
            <button type="button" className="av-btn" data-size="sm" data-variant="ghost" onClick={r.askDiscard}>
              Discard
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

const SORTS = [
  { key: "new", label: "Newest first", cmp: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) },
  { key: "exp", label: "Expiring first", cmp: (a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt) },
];
function ToFile({ t, I }) {
  const [sortKey, setSort] = useState("new");
  const fx = facets({
    pool: t.pool,
    defs: t.defs,
    sel: t.fsel,
    onSel: t.onFsel,
    sorts: SORTS,
    sortKey,
    onSort: setSort,
    noun: ["file", "files"],
  });
  const f = fx.bar;
  const shown = fx.items.map((x) => t.rowsById[x.id]).filter(Boolean);
  t = Object.assign({}, t, {
    flagged: shown.filter((r) => r.flagged),
    rows: shown.filter((r) => !r.flagged),
    filteredOut: t.count && !shown.length ? "true" : undefined,
  });
  return (
    <div className="up-page" data-ui="ToFile">
      <div className="up-tofile-bar">
        <FilterBar f={f} I={I} label="Filter files" />
        <UploadButton pick={t.pick} I={I} />
      </div>
      {t.flagged.length ? (
        <section className="lib-card up-group" data-tone="bad" aria-labelledby="up-flag-h">
          <header className="up-group-h">
            <h2 id="up-flag-h">Held</h2>
            <span className="ag-count">{t.flagged.length}</span>
            <p>These can’t be filed. Nothing uses them; discard them, or move a key to Secrets.</p>
          </header>
          <ul className="up-items">
            {t.flagged.map((r) => (
              <ItemRow key={r.key} r={r} I={I} flaggedGroup />
            ))}
          </ul>
        </section>
      ) : null}
      <section className="lib-card up-group" aria-labelledby="up-wait-h">
        <header className="up-group-h">
          <label className="up-check" title="Select all">
            <input type="checkbox" checked={!!t.allSel} onChange={t.toggleAll} aria-label="Select every file" />
            <span className="up-box" aria-hidden="true"></span>
          </label>
          <h2 id="up-wait-h">Waiting for a place</h2>
          <span className="ag-count">{t.rows.length}</span>
          <p>Tap File to take the suggestion, or Change to pick other places. Files that aren’t filed expire after 14 days.</p>
        </header>
        {t.rows.length ? (
          <ul className="up-items">
            {t.rows.map((r) => (
              <ItemRow key={r.key} r={r} I={I} />
            ))}
          </ul>
        ) : t.filteredOut ? (
          <EmptyState scene="noResults" title="No file matches" size="sm" action={<button type="button" className="av-btn" data-variant="secondary" onClick={t.clearF}>Clear filters</button>}>
            Every file waiting is filtered out.
          </EmptyState>
        ) : (
          <EmptyState scene="emptyFolder" title="Drive is empty" size="sm">
            Drop files anywhere, or on a page to file them there.
          </EmptyState>
        )}
      </section>
      {t.selCount ? (
        <div className="up-bulk" role="region" aria-label="Selected files">
          <span>
            <b>{t.selCount}</b> selected
          </span>
          <button type="button" className="av-btn" data-variant="primary" onClick={t.bulk}>
            File {t.selCount === 1 ? "it" : "all " + t.selCount} to one place…
          </button>
          <button type="button" className="av-btn" data-variant="ghost" onClick={t.clearSel}>
            Clear
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ one file */
function FileMissing({ id }) {
  return (
    <EmptyState scene="noResults" title="No file here" action={<a className="av-btn" data-variant="secondary" href="#/drive">Open Drive</a>}>
      Nothing is filed as “{id}”. It may have expired from Drive after 14 days.
    </EmptyState>
  );
}

function FilePage({ f, I }) {
  if (!f) return null;
  if (f.purged) return <Purged f={f} I={I} />;
  return (
    <div className="up-page up-file" data-ui="FilePage">
      <section className="lib-card up-fhead" aria-label="The file">
        <FileThumb t={f.thumb} size="lg" />
        <div className="up-fhead-id">
          <div className="up-fhead-tags">
            {f.scan ? <ScanTag tone={f.scan[0]}>{f.scan[1]}</ScanTag> : null}
            <span className="av-tag" data-ui="Tag">
              {f.versions.length > 1 ? f.versions.length + " versions" : "1 version"}
            </span>
          </div>
          <p className="up-fhead-from">Sent by {f.from}</p>
        </div>
        <button type="button" className="av-btn" data-variant="secondary" onClick={f.download}>
          {I("download", 16)}
          Download
        </button>
        {f.inbox ? (
          <div className="up-fhead-inbox" data-flagged={f.inbox.flagged}>
            <p>
              {I("folder-open", 16)}
              <span>{f.inbox.text}</span>
            </p>
            {!f.inbox.flagged ? (
              <button type="button" className="av-btn" data-size="sm" data-variant="primary" onClick={f.inbox.file}>
                File it…
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className="up-fcols">
        <div className="up-fmain">
          <section className="lib-card up-sec" aria-labelledby="up-used-h">
            <header className="up-sec-h">
              <h2 id="up-used-h">Where it’s used</h2>
              <span className="ag-count">{f.links.filter((l) => l.state !== "removed").length}</span>
            </header>
            {f.noLinks ? <p className="up-muted">Not used anywhere yet. File it to give it a place.</p> : null}
            <ul className="up-links">
              {f.links.map((l) => (
                <li key={l.key} className="up-link-row" data-state={l.state}>
                  <div className="up-link-main">
                    <p className="up-link-top">
                      <span className="up-link-k">{l.kindWord}</span>
                      <a href={l.href}>{l.label}</a>
                      <span className="up-muted kb-mono">{l.version}</span>
                    </p>
                    <p className="up-link-why">{l.why}</p>
                    {l.listed ? <p className="up-link-sub">{l.listed}</p> : null}
                    {l.refused ? (
                      <div className="up-link-acts">
                        <button type="button" className="av-btn" data-size="sm" data-variant="secondary" onClick={l.refused.instead}>
                          Link to a module instead
                        </button>
                        <button type="button" className="av-btn" data-size="sm" data-variant="secondary" onClick={l.refused.fixed}>
                          {I("upload", 14)}
                          Upload fixed version
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <div className="up-link-side">
                    <LinkTag state={l.state}>{l.stateLabel}</LinkTag>
                    {l.unlink ? (
                      <button
                        type="button"
                        className="up-link-un"
                        onClick={l.unlink.go || undefined}
                        aria-disabled={l.unlink.off}
                        title={l.unlink.why || undefined}
                        aria-describedby={l.unlink.why ? "why-" + l.key : undefined}
                      >
                        {I("link-2-off", 14)}
                        Unlink
                      </button>
                    ) : null}
                    {l.unlink && l.unlink.why ? (
                      <small className="up-muted" id={"why-" + l.key}>
                        {l.unlink.why}
                      </small>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="lib-card up-sec" aria-labelledby="up-read-h">
            <header className="up-sec-h">
              <h2 id="up-read-h">Read by</h2>
            </header>
            {f.readBy.length ? (
              <ul className="up-reads">
                {f.readBy.map((r) => (
                  <li key={r.key}>
                    <a href={r.href}>{r.label}</a>
                    <span className="kb-mono up-muted">{r.version}</span>
                    <span className="up-muted">{r.when}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="up-muted">No attempt has read it yet.</p>
            )}
            <h3 className="up-sub">Receipts</h3>
            {f.receipts.length ? (
              <ul className="up-reads">
                {f.receipts.map((r) => (
                  <li key={r.key}>
                    <a className="kb-mono" href={r.href}>
                      {r.id}
                    </a>
                    <span className="up-muted">lists this file</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="up-muted">Listed on no receipt yet.</p>
            )}
          </section>
        </div>

        <aside className="up-fside">
          <section className="lib-card up-sec" aria-labelledby="up-facts-h">
            <header className="up-sec-h">
              <h2 id="up-facts-h">Facts</h2>
            </header>
            <dl className="up-facts">
              {f.facts.map((x) => (
                <div key={x.key}>
                  <dt>{x.k}</dt>
                  <dd>
                    <span className={x.copy ? "kb-mono" : undefined} title={x.full || undefined}>
                      {x.v}
                    </span>
                    {x.copy ? (
                      <button type="button" className="up-copy" onClick={f.copy} aria-label="Copy the full SHA-256">
                        {I("copy", 14)}
                      </button>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
            {f.contents ? (
              <>
                <h3 className="up-sub">Inside</h3>
                <ul className="up-contents">
                  {f.contents.map((n) => (
                    <li key={n} className="kb-mono">
                      {n}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>

          <section className="lib-card up-sec" aria-labelledby="up-ver-h">
            <header className="up-sec-h">
              <h2 id="up-ver-h">Versions</h2>
              <button type="button" className="av-btn" data-size="sm" data-variant="secondary" onClick={f.newVersion}>
                {I("upload", 14)}
                Upload new version
              </button>
            </header>
            <ol className="up-vers">
              {f.versions.map((v) => (
                <li key={v.key} data-current={v.current}>
                  <span className="up-vdot" aria-hidden="true"></span>
                  <div>
                    <p className="up-vtop">
                      <b>{v.label}</b>
                      {v.current ? <span className="av-tag" data-tone="verified">Current</span> : null}
                      {v.waiting ? <span className="av-tag" data-tone="accent">{v.waiting}</span> : null}
                    </p>
                    <p className="up-muted">
                      {v.when} · {v.by} · {v.size}
                    </p>
                    <p className="kb-mono up-muted">{v.hash}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {f.purge ? (
            <section className="lib-card up-sec up-danger" aria-labelledby="up-purge-h">
              <header className="up-sec-h">
                <h2 id="up-purge-h">Purge at the client’s request</h2>
              </header>
              {!f.purge.open ? (
                <>
                  <p className="up-muted">Removes the content everywhere. Its name and hash stay.</p>
                  <button type="button" className="av-btn" data-variant="secondary" onClick={f.purge.start}>
                    {I("trash-2", 16)}
                    Purge…
                  </button>
                </>
              ) : (
                <div className="up-purge">
                  <p className="up-warnline">
                    Removes the content everywhere. The name and hash stay; quotes from it are replaced with “removed at the
                    client’s request”.
                  </p>
                  <label className="cr-field" data-err={f.purge.err ? "true" : undefined}>
                    <span>Why (required)</span>
                    <textarea
                      className="cr-input"
                      rows={2}
                      value={f.purge.reason}
                      onChange={f.purge.onReason}
                      placeholder="The client asked us to delete it, by email on…"
                      aria-invalid={f.purge.err ? "true" : undefined}
                      autoFocus
                    />
                  </label>
                  {f.purge.err ? <p className="up-err">{f.purge.err}</p> : null}
                  <div className="up-link-acts">
                    <button type="button" className="av-btn" data-variant="danger" onClick={f.purge.go} aria-disabled={f.purge.reason.trim() ? undefined : "true"}>
                      Purge it
                    </button>
                    <button type="button" className="av-btn" data-variant="ghost" onClick={f.purge.cancel}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Purged({ f, I }) {
  return (
    <div className="up-page up-file" data-ui="FilePage" data-purged="true">
      <section className="lib-card up-fhead" aria-label="The file">
        <span className="up-thumb" data-size="lg" data-purged="true" aria-hidden="true">
          {I("ban", 24)}
        </span>
        <div className="up-fhead-id">
          <div className="up-fhead-tags">
            <span className="av-tag" data-tone="stopped">
              Purged
            </span>
          </div>
          <p className="up-fhead-from">
            {f.purged.at} · by {f.purged.by}
          </p>
        </div>
      </section>
      <section className="lib-card up-sec" aria-labelledby="up-pg-h">
        <header className="up-sec-h">
          <h2 id="up-pg-h">Purged at the client’s request</h2>
        </header>
        <p className="up-reason">“{f.purged.reason}”</p>
        <dl className="up-facts">
          <div>
            <dt>SHA-256</dt>
            <dd className="kb-mono up-hash">{f.purged.hash}</dd>
          </div>
        </dl>
        <p className="up-muted">
          The content is gone everywhere: no preview, no download. Quotes from it now read “removed at the client’s request”.
          The name and hash stay so receipts still add up.
        </p>
      </section>
      {f.links.length ? (
        <section className="lib-card up-sec" aria-labelledby="up-pg-used">
          <header className="up-sec-h">
            <h2 id="up-pg-used">Where it was used</h2>
          </header>
          <ul className="up-links">
            {f.links.map((l) => (
              <li key={l.key} className="up-link-row" data-state={l.state}>
                <div className="up-link-main">
                  <p className="up-link-top">
                    <span className="up-link-k">{l.kindWord}</span>
                    <span>{l.label}</span>
                  </p>
                  <p className="up-link-why">{l.why}</p>
                </div>
                <div className="up-link-side">
                  <LinkTag state={l.state}>{l.stateLabel}</LinkTag>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ lists of files (client and project tabs) */
export function FileList({ rows, I, empty }) {
  if (!rows || !rows.length) return <p className="up-muted up-list-empty">{empty}</p>;
  return (
    <ul className="up-flist">
      {rows.map((r) => (
        <li key={r.key} className="up-frow" data-purged={r.purged ? "true" : undefined}>
          <span className="up-thumb" data-kind={r.kind} data-size="sm" aria-hidden="true">
            {r.purged ? I("ban", 16) : r.icon}
          </span>
          <div className="up-frow-main">
            <a className="up-name" href={r.href}>
              {r.name}
            </a>
            <p className="up-muted">{r.purged || r.type + " · " + r.meta}</p>
          </div>
          <ul className="up-uses" aria-label={"Where " + r.name + " is used"}>
            {r.uses.map((x) => (
              <li key={x.key} data-state={x.state} title={x.why || undefined}>
                <i aria-hidden="true"></i>
                <span>{x.label}</span>
              </li>
            ))}
            {!r.uses.length && !r.purged ? <li className="up-muted">Not used yet</li> : null}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function ProjectFiles({ p, I, pick }) {
  if (!p) return null;
  return (
    <div className="up-page" data-ui="ProjectFiles">
      <div className="up-tofile-bar">
        <p className="up-muted">
          Drop files on this page and they wait in Drive, suggested for {p.name}. Drop them on a module’s page to give them
          to that module.
        </p>
        <UploadButton pick={pick} I={I} />
      </div>
      <section className="lib-card up-sec" aria-labelledby="pf-g0">
        <header className="up-sec-h">
          <h2 id="pf-g0">Gate 0 sources</h2>
          <span className="ag-count">{p.gate0.length}</span>
          <p className="up-sec-note">{p.gate0Note}</p>
        </header>
        <FileList rows={p.gate0} I={I} empty="No sources yet. Canon reads what you add here during Gate 0." />
      </section>
      <section className="lib-card up-sec" aria-labelledby="pf-un">
        <header className="up-sec-h">
          <h2 id="pf-un">Project files, not yet linked</h2>
          <span className="ag-count">{p.unlinked.length}</span>
          <p className="up-sec-note">Kept on the project. Link one to a module to give it to its agents.</p>
        </header>
        <FileList rows={p.unlinked} I={I} empty="Nothing waiting to be linked." />
      </section>
    </div>
  );
}
