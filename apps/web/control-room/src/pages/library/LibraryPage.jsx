import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSheet } from "../../kit/sheet";
import { CodeView, Markdown, headingId } from "../../kit/Markdown";
import { FilterBar } from "../../kit/FilterBar";
import { EmptyState } from "../../kit/EmptyState";

/**
 * The Library as a documentation site: a sidebar of sections and categories, an overview, an index of
 * every entry with filters, category pages, and one page per entry with an "On this page" outline and
 * a details panel. Nothing here approves anything: proposed entries and open PRs point to Decisions.
 */
export function LibraryPage({ vals }) {
  const { kb } = vals;
  if (!kb) return null;
  return (
    <div className="kbd-wrap">
      <div className="kbd" data-ui="Library" data-mode={kb.mode}>
        <Sidebar kb={kb} />
        <div className="kbd-main">
          {kb.mode === "home" ? (
            <Home kb={kb} />
          ) : kb.mode === "all" ? (
            <Index kb={kb} page={kb.all} />
          ) : kb.mode === "cat" ? (
            <Index kb={kb} page={kb.category} />
          ) : (
            <Doc kb={kb} d={kb.doc} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ sidebar */
function Sidebar({ kb }) {
  const I = kb.I;
  return (
    <>
      <aside className="kbd-side" aria-label="Library" data-open={kb.navOpen ? "true" : undefined}>
        <button
          type="button"
          className="kbd-browse"
          aria-haspopup="dialog"
          aria-expanded={String(kb.navOpen)}
          onClick={kb.toggleNav}
        >
          {I("menu", 16)}
          <span className="kbd-browse-label">
            <small>Browse</small>
            <b>{kb.here}</b>
          </span>
          {I("chevron-down", 16)}
        </button>
        <div className="kbd-side-body" id="kbd-nav">
          <SideNav kb={kb} idp="" />
        </div>
      </aside>
      <BrowseSheet kb={kb} />
    </>
  );
}

/** Narrow screens: Browse opens the same navigation as a bottom sheet, with a handle and a close button. */
function BrowseSheet({ kb }) {
  const ref = useRef(null);
  const [mounted, setMounted] = useState(kb.navOpen);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (kb.navOpen) {
      setMounted(true);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setOn(true)));
      return () => cancelAnimationFrame(r);
    }
    setOn(false);
    const t = setTimeout(() => setMounted(false), 160);
    return () => clearTimeout(t);
  }, [kb.navOpen]);
  useSheet(ref, { open: kb.navOpen && mounted, onClose: kb.closeNav, side: "bottom" });
  if (!mounted) return null;
  return createPortal(
    <>
      <div
        className="kbd-scrim"
        data-open={on ? "" : undefined}
        onClick={kb.closeNav}
        aria-hidden="true"
        data-sheet-keep=""
      ></div>
      <div
        ref={ref}
        className="kbd-sheet sh"
        data-open={on ? "" : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kbd-sheet-title"
      >
        <div className="sh-handle" data-sheet-drag="" aria-hidden="true"></div>
        <div className="kbd-sheet-head" data-sheet-drag="">
          <h2 id="kbd-sheet-title">Browse the library</h2>
          <button type="button" className="fb-x" onClick={kb.closeNav} aria-label="Close">
            {kb.I("x", 20)}
          </button>
        </div>
        <div className="kbd-sheet-body">
          <SideNav kb={kb} idp="s-" />
        </div>
      </div>
    </>,
    document.body,
  );
}

function SideNav({ kb, idp }) {
  const I = kb.I;
  return (
    <>
      {kb.mode === "all" ? null : (
        <label className="kbd-find">
          {I("search", 16)}
          <span className="sr-only">Find in the library</span>
          <input type="search" value={kb.q} onChange={kb.onQ} />
          {kb.q ? (
            <button type="button" className="fb-x" onClick={kb.clearQ} aria-label="Clear">
              {I("x", 14)}
            </button>
          ) : null}
        </label>
      )}

      {kb.hits ? (
        <div className="kbd-hits" role="region" aria-label="Matches">
          {kb.hits.length ? (
            <ul>
              {kb.hits.map((h) => (
                <li key={h.key}>
                  <a href={h.href} className="kbd-hit" onClick={kb.closeNav}>
                    <span>{h.title}</span>
                    <small>{h.where}</small>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="kbd-side-note">Nothing in the library matches that.</p>
          )}
          <a className="kbd-seeall" href={kb.seeAll.href} onClick={kb.closeNav}>
            {kb.seeAll.label}
            {I("arrow-right", 14)}
          </a>
        </div>
      ) : (
        <nav aria-label="Library sections" className="kbd-nav">
          <ul className="kbd-navlist">
            <li>
              <a className="kbd-cat" href="#/library" aria-current={kb.homeCurrent} onClick={kb.closeNav}>
                {I("library", 16)}
                <span>Overview</span>
              </a>
            </li>
            <li>
              <a className="kbd-cat" href={kb.allHref} aria-current={kb.allCurrent} onClick={kb.closeNav}>
                {I("list", 16)}
                <span>All entries</span>
              </a>
            </li>
          </ul>
          {kb.nav.map((sec) => (
            <div key={sec.key} className="kbd-sec">
              <p className="kbd-sec-label" id={idp + "kbd-sec-" + sec.key}>
                {sec.label}
              </p>
              <ul className="kbd-navlist" aria-labelledby={idp + "kbd-sec-" + sec.key}>
                {sec.cats.map((c) => (
                  <li key={c.key}>
                    <a
                      className="kbd-cat"
                      href={c.href}
                      aria-current={c.current}
                      data-open={c.open}
                      onClick={kb.closeNav}
                    >
                      {c.iconEl}
                      <span>{c.label}</span>
                    </a>
                    {c.items.length ? (
                      <ul className="kbd-items">
                        {c.items.map((it) => (
                          <li key={it.key}>
                            <a href={it.href} aria-current={it.current} onClick={kb.closeNav}>
                              {it.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      )}
      <p className="kbd-release">
        {I("git-branch", 14)}
        <span>
          Release <span className="kb-mono">{kb.release}</span>
        </span>
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ overview */
function Home({ kb }) {
  const h = kb.home;
  const I = kb.I;
  return (
    <div className="kbd-home">
      <header className="kbd-hero">
        <div className="kbd-hero-row">
          <h1 className="kbd-h1">Library</h1>
          <NewMenu items={kb.newMenu} I={I} />
        </div>
        <p className="kbd-lede">
          What the agents learn from. Builders, test writers, reviewers and Canon read it on every task. Every change is
          a factory PR you approve in Decisions.
        </p>
        <p className="kbd-pin">
          {I("git-branch", 14)}
          <span>
            Pinned release <span className="kb-mono">{h.release}</span>
          </span>
        </p>
        <dl className="kbd-stats kbd-statcards">
          {h.stats.map(([v, l, ic]) => (
            <div key={l} className="kbd-statcard">
              <span className="kbd-stat-ic" aria-hidden="true">
                {I(ic, 18)}
              </span>
              <dt>{l}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="kbd-hero-actions">
          {h.guide ? (
            <a className="av-btn" data-size="md" data-variant="primary" href={h.guide.href}>
              How the library works
            </a>
          ) : null}
          <a className="av-btn" data-size="md" data-variant="secondary" href={h.allHref}>
            Browse all {h.allCount}
          </a>
        </div>
      </header>

      {h.sections.map((sec) => (
        <section key={sec.key} className="kbd-home-sec" aria-labelledby={"kbd-hs-" + sec.key}>
          <h2 className="kbd-h2" id={"kbd-hs-" + sec.key}>
            {sec.label}
          </h2>
          <ul className="kbd-cards">
            {sec.cats.map((c) => (
              <li key={c.key}>
                <a className="kbd-card" href={c.href}>
                  <span className="kbd-card-ic" aria-hidden="true">
                    {c.iconEl}
                  </span>
                  <span className="kbd-card-main">
                    <b>{c.label}</b>
                    <span>{c.blurb}</span>
                  </span>
                  <small className="kbd-card-n">{c.count}</small>
                  <span className="kbd-card-go" aria-hidden="true">
                    {I("arrow-right", 16)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="kbd-two">
        <section aria-labelledby="kbd-recent">
          <h2 className="kbd-h2" id="kbd-recent">
            Recently updated
          </h2>
          <EntryList items={h.recent} I={I} compact />
        </section>
        <section aria-labelledby="kbd-used">
          <h2 className="kbd-h2" id="kbd-used">
            Most used
          </h2>
          <EntryList items={h.used} I={I} compact metric />
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ all entries, and one category */
function Index({ kb, page }) {
  const I = kb.I;
  const isAll = kb.mode === "all";
  return (
    <div className="kbd-index">
      <header className="kbd-pagehead">
        <div className="kbd-pagehead-row">
          <div className="kbd-pagehead-text">
            <h1 className="kbd-h1" data-size="md">
              {page.title}
            </h1>
            <p className="kbd-lede">{page.blurb}</p>
          </div>
          <NewMenu items={kb.newMenu} I={I} />
        </div>
      </header>

      <FilterBar
        f={page.filter}
        I={I}
        label={"Filter " + page.title.toLowerCase()}
        search={
          isAll
            ? {
                label: "Search the library",
                value: kb.q,
                onChange: kb.onQ,
                clear: kb.clearQ,
                placeholder: "Search titles, descriptions and types",
              }
            : null
        }
      />

      {page.empty ? (
        <div className="kbd-empty lib-card">
          <EmptyState
            scene="noResults"
            title="Nothing matches these filters"
            action={
              page.filter.clearAll ? (
              <button type="button" className="av-btn" data-size="md" data-variant="secondary" onClick={page.filter.clearAll}>
                Clear all filters
              </button>
              ) : null
            }
          >
            Remove a filter, or clear them all to see every entry here.
          </EmptyState>
        </div>
      ) : isAll ? (
        <EntryList items={page.items} I={I} where />
      ) : (
        page.groups.map((g) => (
          <section key={g.key} className="kbd-group" aria-label={g.label || page.title}>
            {g.label ? <h2 className="kbd-h2">{g.label}</h2> : null}
            <EntryList items={g.items} I={I} />
          </section>
        ))
      )}
    </div>
  );
}

function EntryList({ items, I, compact, metric, where }) {
  return (
    <ul className="kbd-list" data-compact={compact ? "true" : undefined}>
      {items.map((e) => (
        <li key={e.key}>
          <a className="kbd-entry" href={e.href}>
            {compact ? null : (
              <span className="kbd-ico" aria-hidden="true">
                {e.icon}
              </span>
            )}
            <span className="kbd-entry-main">
              <span className="kbd-entry-title">
                <b>{e.title}</b>
                {e.quiet ? null : (
                  <span className="av-tag" data-ui="Tag" data-tone={e.tone}>
                    {e.status}
                  </span>
                )}
              </span>
              {compact ? null : <span className="kbd-entry-desc">{e.desc}</span>}
              <span className="kbd-entry-meta">
                {e.meta && !where ? (
                  e.meta.map((m) => <span key={m}>{m}</span>)
                ) : (
                  <>
                    {where && e.where ? <span>{e.where}</span> : <span>{e.type}</span>}
                    {where && e.where && e.layer.endsWith(e.where) ? null : <span>{e.layer}</span>}
                    {metric && e.used ? <span>{e.used}</span> : <span>Updated {e.updated}</span>}
                  </>
                )}
              </span>
            </span>
            {I("chevron-right", 16)}
          </a>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ one entry */
function Doc({ kb, d }) {
  const I = kb.I;
  const active = useScrollSpy(
    d.toc.map((t) => t.id),
    d.slug,
  );
  const goTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
    el.focus({ preventScroll: true });
  };
  return (
    <div className="kbd-doc">
      <article className="kbd-article" aria-labelledby="kbd-doc-title">
        <h1 className="kbd-h1" id="kbd-doc-title" data-size="md">
          {d.title}
        </h1>
        <p className="kbd-lede">{d.desc}</p>
        {d.loads ? (
          <p className="kbd-loads">
            {I("users", 16)}
            <span>
              {d.loads.pre}
              {d.loads.roles.map((r) => (
                <Fragment key={r.key}>
                  {r.sep}
                  <a href={r.href}>{r.label}</a>
                </Fragment>
              ))}
              {d.loads.post}
            </span>
          </p>
        ) : null}
        <div className="kbd-doc-meta">
          <span className="av-tag" data-ui="Tag" data-tone={d.tone}>
            {d.status}
          </span>
          <span className="kb-mono">{d.version}</span>
          <span>{d.layer}</span>
          <span>{d.updated}</span>
          {d.canChange ? (
            <button
              type="button"
              className="av-btn kbd-propose"
              data-size="sm"
              data-variant="secondary"
              onClick={d.startEdit}
            >
              {I("edit", 14)}
              Propose a change
            </button>
          ) : null}
        </div>

        {d.note ? (
          <div className="kbd-note" role="note">
            {I(d.note.href ? "git-pull-request" : "circle-pause", 16)}
            <p>{d.note.text}</p>
            {d.note.href ? (
              <a className="av-btn" data-size="sm" data-variant="ghost" href={d.note.href}>
                Open Decisions
                {I("arrow-right", 14)}
              </a>
            ) : null}
          </div>
        ) : null}

        {d.edit ? (
          <section className="kbd-edit lib-card" aria-label="Propose a change">
            <ChangeFlow e={d.edit} I={I} />
          </section>
        ) : null}

        <div className="kbd-prose">
          <Body d={d} />

          {d.guide ? null : (
            <>
              <h2 id={headingId("Evidence")} tabIndex={-1}>
                Evidence
              </h2>
              {d.evidenceLine ? <p className="kbd-evline">{d.evidenceLine}</p> : null}
              {d.results ? (
                <>
                  <h3>Results by version</h3>
                  <table className="kbd-results">
                    <thead>
                      <tr>
                        <th scope="col">Version</th>
                        <th scope="col">Attempts</th>
                        <th scope="col">First try</th>
                        <th scope="col">Findings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.results.versions.map((v) => (
                        <tr key={v.key} data-current={v.current}>
                          <th scope="row">
                            {v.v}
                            {v.current ? <span className="kb-muted"> · current</span> : null}
                          </th>
                          <td>{v.attempts}</td>
                          <td>{v.pass}</td>
                          <td>{v.findings}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {d.results.baseline ? (
                    <p className="kbd-baseline" data-better={d.results.baseline.better}>
                      {d.results.baseline.withText}, against {d.results.baseline.withoutText}.{" "}
                      <span className="kb-muted">{d.results.baseline.note}</span>
                    </p>
                  ) : (
                    <p className="kbd-baseline kb-muted">{d.results.noBaseline}</p>
                  )}
                </>
              ) : null}
              {d.evidenceLine ? null : (
                <dl className="kbd-evidence">
                  {d.stats.map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {d.backedBy.length ? (
                <>
                  <h3>Projects behind it</h3>
                  <ul className="kbd-backed">
                    {d.backedBy.map((b) => (
                      <li key={b.key}>{b.href ? <a href={b.href}>{b.name}</a> : <span>{b.name}</span>}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {d.origin ? (
                <>
                  <h3>Origin</h3>
                  <dl className="kbd-origin">
                    <div>
                      <dt>Source</dt>
                      <dd>{d.origin.text}</dd>
                    </div>
                    {d.origin.imported ? (
                      <>
                        <div>
                          <dt>Licence</dt>
                          <dd>{d.origin.license}</dd>
                        </div>
                        <div>
                          <dt>Local changes</dt>
                          <dd>
                            {d.origin.hasChanges ? (
                              <button
                                type="button"
                                className="kbd-inline-link"
                                onClick={() => goTo(headingId("Version history"))}
                              >
                                {d.origin.changes}
                              </button>
                            ) : (
                              d.origin.changes
                            )}
                          </dd>
                        </div>
                        {d.origin.note ? (
                          <div>
                            <dt>Edition</dt>
                            <dd>{d.origin.note}</dd>
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </dl>
                </>
              ) : (
                <p className="kbd-source">
                  <b>Source</b> {d.source}. <b>Licence</b> {d.license}.
                </p>
              )}

              <h2 id={headingId("Version history")} tabIndex={-1}>
                Version history
              </h2>
              <ol className="kbd-timeline">
                {d.versions.map((v) => (
                  <li key={v.key} data-current={v.current}>
                    <span className="kbd-dot" aria-hidden="true"></span>
                    <span className="kbd-tl-head">
                      <b className="kb-mono">{v.v}</b>
                      {v.current ? (
                        <span className="av-tag" data-ui="Tag" data-tone="accent">
                          Current
                        </span>
                      ) : null}
                    </span>
                    <span className="kbd-tl-note">{v.note}</span>
                    <small>
                      {v.when} · {v.pr}
                    </small>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>

        {d.prev || d.next ? (
          <nav className="kbd-pager" aria-label="More in this category">
            {[d.prev, d.next].map((p, i) =>
              p ? (
                <a key={p.dir} href={p.href} className="kbd-pagelink" data-dir={i ? "next" : "prev"}>
                  <small>
                    {i ? null : I("arrow-left", 14)}
                    {p.dir}
                    {i ? I("arrow-right", 14) : null}
                  </small>
                  <b>{p.title}</b>
                </a>
              ) : (
                <span key={i} aria-hidden="true"></span>
              ),
            )}
          </nav>
        ) : null}
      </article>

      <aside className="kbd-rail" aria-label="On this page and details">
        {d.toc.length > 1 ? (
          <nav className="kbd-toc" aria-label="On this page">
            <p className="kbd-rail-label">On this page</p>
            <ul>
              {d.toc.map((t) => (
                <li key={t.key}>
                  <button
                    type="button"
                    onClick={() => goTo(t.id)}
                    aria-current={active === t.id ? "location" : undefined}
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        <section className="kbd-details" aria-label="Details">
          <p className="kbd-rail-label">Details</p>
          <dl>
            {d.facts.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd className={k === "Name" ? "kb-mono" : undefined}>{v}</dd>
              </div>
            ))}
          </dl>
          {d.roles.length && !d.isSkill ? (
            <>
              <p className="kbd-rail-label">Loaded for</p>
              <ul className="kbd-roles">
                {d.roleLinks.map((r) => (
                  <li key={r.key}>
                    <a href={r.href}>{r.label}</a>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {d.canChange ? (
            <button
              type="button"
              className="av-btn kbd-propose-end"
              data-size="md"
              data-variant="secondary"
              onClick={d.startEdit}
            >
              {I("edit", 14)}
              Propose a change
            </button>
          ) : null}
          {d.canChange && !d.guide ? (
            <button type="button" className="av-btn kbd-retire" data-size="sm" data-variant="ghost" onClick={d.retire}>
              Retire this entry
            </button>
          ) : null}
        </section>
      </aside>
    </div>
  );
}

function Body({ d }) {
  const b = d.body;
  if (b.kind === "md") return <Markdown text={b.text} />;
  const meta = (
    <dl className="kbd-meta">
      {b.meta.map((m) => (
        <div key={m.key}>
          <dt>{m.label}</dt>
          <dd
            className={
              m.key === "id" || m.key === "name" || m.key === "check" || m.key === "scope" ? "kb-mono" : undefined
            }
          >
            {m.value}
          </dd>
        </div>
      ))}
    </dl>
  );
  if (b.kind === "skill")
    return (
      <>
        <h2 id={headingId("Instructions")} tabIndex={-1}>
          Instructions
        </h2>
        <Markdown text={b.text} />
        <details className="kbd-src">
          <summary>View SKILL.md</summary>
          <div className="kbd-src-body">
            <CodeView text={b.source} label={b.file || "SKILL.md"} wrap />
          </div>
        </details>
      </>
    );
  return (
    <>
      <h2 id={headingId("What it checks")} tabIndex={-1}>
        What it checks
      </h2>
      {meta}
      <h2 id={headingId("Definition")} tabIndex={-1}>
        Definition
      </h2>
      <CodeView text={b.source} label={b.file || "rule.yaml"} />
    </>
  );
}

/** Which heading you're reading: the last one whose top has passed the sticky header. */
function useScrollSpy(ids, key) {
  const [active, setActive] = useState(ids[0]);
  const raf = useRef(0);
  useEffect(() => {
    setActive(ids[0]);
    const check = () => {
      raf.current = 0;
      let cur = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 140) cur = id;
      }
      setActive(cur);
    };
    const on = () => {
      if (!raf.current) raf.current = requestAnimationFrame(check);
    };
    document.addEventListener("scroll", on, { capture: true, passive: true });
    check();
    return () => {
      document.removeEventListener("scroll", on, { capture: true });
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return active;
}

/* ------------------------------------------------------------------ shared pieces */
function NewMenu({ items, I }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div className="kb-new" ref={ref}>
      <button
        type="button"
        className="av-btn"
        data-size="md"
        data-variant="ghost"
        aria-expanded={String(open)}
        aria-haspopup="menu"
        onClick={() => setOpen(!open)}
      >
        {I("plus", 16)}
        New
      </button>
      {open ? (
        <div className="kb-menu" role="menu">
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                it.pick();
              }}
            >
              {it.iconEl}
              {it.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ChangeFlow({ e, I }) {
  if (e.step === "edit")
    return (
      <div className="kb-change">
        <label className="kb-change-label" htmlFor="kb-edit">
          Your change
        </label>
        <textarea id="kb-edit" className="kb-editor" value={e.text} onChange={e.onText} rows={14} spellCheck="true" />
        <p className="kb-muted">
          Running projects keep the version they started with. Only projects finalized after the merge get this change.
        </p>
        <div className="kb-btns">
          <button type="button" className="av-btn" data-size="md" data-variant="ghost" onClick={e.cancel}>
            Cancel
          </button>
          <button type="button" className="av-btn" data-size="md" data-variant="primary" onClick={e.toReview}>
            {I("file-diff", 16)}
            Review the diff
          </button>
        </div>
      </div>
    );
  return (
    <div className="kb-change">
      <span className="kb-change-label">
        {e.noChange ? "Nothing changed yet" : e.changed + (e.changed === 1 ? " line changed" : " lines changed")}
      </span>
      <pre className="kb-diff" aria-label="Diff of your change" tabIndex={0}>
        {e.diff.map((x, i) => (
          <span key={i} className="kb-diff-line" data-k={x.k}>
            <i aria-hidden="true">{x.k === "add" ? "+" : x.k === "del" ? "−" : " "}</i>
            <span className="sr-only">{x.k === "add" ? "Added: " : x.k === "del" ? "Removed: " : ""}</span>
            {x.text || " "}
          </span>
        ))}
      </pre>
      <div className="kb-btns">
        <button type="button" className="av-btn" data-size="md" data-variant="ghost" onClick={e.back}>
          Back to editing
        </button>
        <button
          type="button"
          className="av-btn"
          data-size="md"
          data-variant="primary"
          onClick={e.file}
          disabled={e.noChange || undefined}
        >
          {I("git-pull-request", 16)}
          File the factory PR
        </button>
      </div>
    </div>
  );
}
