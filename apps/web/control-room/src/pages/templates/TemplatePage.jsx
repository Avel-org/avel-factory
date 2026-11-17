import { useEffect, useState } from "react";
import { CodeBlock } from "../../kit/Code.jsx";
import { TemplatePreview } from "./TemplatePreview";

const pathOf = (name) =>
  name === "Home" || name === "Phone" ? "/" : "/" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** One template's page: the preview first, then its docs: overview, quickstart, modules, files, config, changelog. */
export function TemplatePage({ vals }) {
  const { tpl } = vals;
  const t = tpl && tpl.one;
  if (!t) return null;
  const I = tpl.I;
  return (
    <div className="tpo" data-ui="Template">
      <a className="tpo-back" href="#/templates">
        {I("arrow-left", 16)}
        All templates
      </a>

      <section className="tpo-hero lib-card" aria-labelledby="tpo-name">
        <div className="tpo-stage">
          <div className="tpo-stage-bar">
            <div className="lib-seg" role="radiogroup" aria-label="Device">
              {t.devices.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  role="radio"
                  aria-checked={d.checked}
                  className="lib-seg-btn"
                  onClick={d.pick}
                >
                  {d.iconEl}
                  <span>{d.label}</span>
                </button>
              ))}
            </div>
            <span className="tpo-screen-name" aria-live="polite">
              {t.screenName}
            </span>
          </div>
          <TemplatePreview
            kind={t.preview}
            device={t.device}
            screen={t.screen}
            size="hero"
            url={t.url}
            path={pathOf(t.screenName)}
          />
          <ul className="tpo-screens" aria-label="Screens">
            {t.screens.map((s) => (
              <li key={s.key}>
                <button type="button" className="tpo-screen" aria-pressed={String(!!s.current)} onClick={s.pick}>
                  <TemplatePreview kind={t.preview} device={s.phone ? "phone" : "desk"} screen={s.key} size="mini" />
                  <span>{s.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="tpo-info">
          <span className="tpo-eyebrow">
            <span className="kb-mono">{t.version}</span>
            <span className="av-tag" data-ui="Tag" data-tone={t.statusTone}>
              {t.statusLabel}
            </span>
          </span>
          <h1 className="tpo-name" id="tpo-name">
            {t.name}
          </h1>
          <p className="tpo-pitch">{t.pitch}</p>
          {t.draftNote ? (
            <div className="kbd-note" role="note">
              {I("git-pull-request", 16)}
              <p>{t.draftNote}</p>
              <a className="av-btn" data-size="sm" data-variant="ghost" href="#/">
                Open Decisions
                {I("arrow-right", 14)}
              </a>
            </div>
          ) : null}
          <div className="kb-btns tpo-actions">
            {t.start ? (
              <button type="button" className="av-btn" data-size="md" data-variant="primary" onClick={t.start}>
                Start a project from this
              </button>
            ) : null}
            <button type="button" className="av-btn" data-size="md" data-variant="secondary" onClick={t.propose}>
              Propose a change
            </button>
          </div>
          <dl className="tpo-stats">
            {t.stats.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="tpo-best">
            <b>Best for</b> {t.bestFor}
          </p>
          <p className="tpo-best">
            <b>Stack</b> <span className="kb-mono">{t.stack.join(" · ")}</span>
          </p>
          <p className="tpo-from">
            Made from {t.sourceHref ? <a href={t.sourceHref}>{t.source}</a> : <b>{t.source}</b>} at{" "}
            <span className="kb-mono">{t.commit}</span>
          </p>
        </div>
      </section>

      <TemplateDocs t={t} I={I} />
    </div>
  );
}

const CALLOUT = { note: "Note", tip: "Tip", warning: "Watch out" };

/** Which section you're reading, for "On this page": the last heading that has passed the sticky header. */
function useSpy(ids) {
  const [cur, setCur] = useState(ids[0]);
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      let at = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 140) at = id;
      }
      setCur(at);
    };
    // the page scrolls inside the app's canvas, so listen at the document in the capture phase
    const on = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    document.addEventListener("scroll", on, true);
    check();
    return () => {
      document.removeEventListener("scroll", on, true);
      cancelAnimationFrame(raf);
    };
  }, [ids.join(",")]);
  return cur;
}

function DocH({ id, children, note }) {
  return (
    <div className="tpd-h-row">
      <h2 className="tpd-h" id={"tpd-" + id} tabIndex={-1}>
        {children}
      </h2>
      {note ? <span className="tpd-h-note">{note}</span> : null}
    </div>
  );
}

export function TemplateDocs({ t, I, preview }) {
  const d = t.docs;
  const cur = useSpy(d.toc.map((x) => x.id));
  const go = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    el.focus({ preventScroll: true });
  };
  const pickFile = (f) => {
    f.pick();
    requestAnimationFrame(() => {
      const el = document.getElementById("tpd-files");
      if (el) el.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  };
  return (
    <div className="tpd" data-preview={preview ? "true" : undefined}>
      <article className="tpd-main kb-md">
        <section aria-labelledby="tpd-overview">
          <DocH id="overview">Overview</DocH>
          <p className="tpd-lead">{d.overview}</p>
          {d.use.length || d.avoid.length ? (
            <div className="tpd-fit">
              <div className="tpd-fit-col" data-tone="use">
                <h3>Use it for</h3>
                <ul>
                  {d.use.map((x) => (
                    <li key={x}>
                      {I("check", 14)}
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="tpd-fit-col" data-tone="avoid">
                <h3>Not for</h3>
                <ul>
                  {d.avoid.map((x) => (
                    <li key={x}>
                      {I("x", 14)}
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
          {d.notes.map((n) => (
            <aside key={n.key} className="kb-callout" data-tone={n.tone} aria-label={CALLOUT[n.tone]}>
              <span className="kb-callout-k">{CALLOUT[n.tone]}</span>
              <p>{n.text}</p>
            </aside>
          ))}
        </section>

        {d.quickstart.length ? (
          <section aria-labelledby="tpd-quickstart">
            <DocH id="quickstart" note="From a brief to the first build">
              Quickstart
            </DocH>
            <ol className="tpd-steps">
              {d.quickstart.map((q) => (
                <li key={q.key}>
                  <span className="tpd-step-n" aria-hidden="true">
                    {q.n}
                  </span>
                  <div className="tpd-step-body">
                    <h3>{q.title}</h3>
                    <p>{q.text}</p>
                    {q.code ? (
                      <CodeBlock code={q.code.code} lang={q.code.lang} title={q.code.title} numbered={false} />
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section aria-labelledby="tpd-modules">
          <DocH id="modules" note={t.planTotal}>
            Modules
          </DocH>
          <div className="tpd-table-wrap" role="region" aria-label="Modules in this template" tabIndex={0}>
            <table className="kb-table tpd-mods">
              <thead>
                <tr>
                  <th scope="col">Module</th>
                  <th scope="col">Goal</th>
                  <th scope="col">Kind</th>
                  <th scope="col">Runs</th>
                  <th scope="col" className="tpd-num">
                    Estimate
                  </th>
                </tr>
              </thead>
              <tbody>
                {t.plan.map((p) => (
                  <tr key={p.key}>
                    <td>
                      <code>{p.ref}</code>
                    </td>
                    <td>
                      <span className="tpd-goal">{p.goal}</span>
                      {p.what ? <span className="tpd-sub">{p.what}</span> : null}
                    </td>
                    <td>
                      <code>{p.workKind}</code>
                    </td>
                    <td>{p.wave}</td>
                    <td className="tpd-num">{p.est}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="tpd-structure">
          <DocH id="structure" note={"Pinned at " + t.commit}>
            File structure
          </DocH>
          <ul className="tpd-tree" aria-label={"Files in " + t.name + " at " + t.commit}>
            {t.tree.map((f) => (
              <li key={f.key} style={{ "--depth": f.depth }} data-dir={f.dir}>
                {f.pick ? (
                  <button
                    type="button"
                    className="tpd-path"
                    aria-pressed={String(!!f.current)}
                    onClick={() => pickFile(f)}
                  >
                    {I("file", 14)}
                    <span className="kb-mono">{f.name}</span>
                  </button>
                ) : (
                  <span className="tpd-path">
                    {I(f.dir ? "folder" : "file", 14)}
                    <span className="kb-mono">{f.name}</span>
                  </span>
                )}
                {f.note ? <span className="tpd-note">{f.note}</span> : null}
              </li>
            ))}
          </ul>
        </section>

        {d.keyFiles.length ? (
          <section aria-labelledby="tpd-files">
            <DocH id="files" note="Read-only, at the pinned commit">
              Key files
            </DocH>
            <div className="tpd-group">
              <div className="tpd-group-tabs" role="tablist" aria-label="Key files">
                {d.keyFiles.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    role="tab"
                    id={"tpd-tab-" + f.name}
                    aria-selected={String(!!f.current)}
                    aria-controls="tpd-file"
                    className="tpd-group-tab kb-mono"
                    onClick={f.pick}
                    title={f.path}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
              <div role="tabpanel" id="tpd-file" aria-label={t.file}>
                {t.fileWhy ? <p className="tpd-why">{t.fileWhy}</p> : null}
                <CodeBlock code={t.fileText} title={t.file} numbered maxHeight="480px" />
              </div>
            </div>
          </section>
        ) : null}

        {d.manifest ? (
          <section aria-labelledby="tpd-config">
            <DocH id="config">Configuration</DocH>
            <p>
              The manifest Canon reads at 0.3. It names the modules, the rules every job loads and the quality bar Gate
              4 holds the project to.
            </p>
            <CodeBlock code={d.manifest} title="template.yaml" numbered />
          </section>
        ) : null}

        <section aria-labelledby="tpd-loads">
          <DocH id="loads">Rules, skills and knowledge</DocH>
          <p>
            Every job on a project built from this template loads these. Builders and Canon also search the knowledge.
          </p>
          <div className="tpd-loads">
            <div>
              <h3>Rules</h3>
              <LinkList items={t.rules} I={I} />
            </div>
            <div>
              <h3>Skills</h3>
              <LinkList items={t.skills} I={I} />
            </div>
            <div>
              <h3>Knowledge</h3>
              <LinkList items={t.knowledge} I={I} />
            </div>
          </div>
        </section>

        <section aria-labelledby="tpd-built">
          <DocH id="built" note={t.builtWith.length + (t.builtWith.length === 1 ? " project" : " projects")}>
            Built with it
          </DocH>
          {t.builtWith.length ? (
            <div className="tpd-table-wrap" role="region" aria-label="Projects built with this template" tabIndex={0}>
              <table className="kb-table">
                <thead>
                  <tr>
                    <th scope="col">Project</th>
                    <th scope="col">Client</th>
                    <th scope="col">Delivered</th>
                    <th scope="col" className="tpd-num">
                      First try
                    </th>
                    <th scope="col" className="tpd-num">
                      AI cost
                    </th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {t.builtWith.map((b) => (
                    <tr key={b.key}>
                      <td>{b.href ? <a href={b.href}>{b.name}</a> : b.name}</td>
                      <td>{b.client}</td>
                      <td>{b.delivered}</td>
                      <td className="tpd-num">{b.firstTry}</td>
                      <td className="tpd-num">{b.cost}</td>
                      <td>
                        <span className="av-tag" data-ui="Tag" data-tone={b.tone}>
                          {b.stateLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="kb-muted">No projects yet.</p>
          )}
        </section>

        <section aria-labelledby="tpd-changelog">
          <div className="tpd-h-row">
            <h2 className="tpd-h" id="tpd-changelog" tabIndex={-1}>
              Changelog
            </h2>
            <button type="button" className="av-btn" data-size="sm" data-variant="ghost" onClick={t.newVersion}>
              New version from a project
            </button>
          </div>
          <ol className="tpd-log">
            {t.versions.map((v) => (
              <li key={v.key} data-current={v.current}>
                <span className="tpd-log-v">
                  <code>{v.v}</code>
                  {v.current ? (
                    <span className="av-tag" data-ui="Tag" data-tone="accent">
                      Current
                    </span>
                  ) : null}
                </span>
                <span className="tpd-log-note">{v.note}</span>
                <span className="tpd-log-meta">
                  {v.when} · {v.projects}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </article>

      {preview ? null : (
        <nav className="tpd-toc" aria-label="On this page">
          <span className="tpd-toc-k">On this page</span>
          <ul>
            {d.toc.map((x) => (
              <li key={x.key}>
                <a href={"#" + x.id} onClick={go(x.id)} aria-current={cur === x.id ? "location" : undefined}>
                  {x.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

function LinkList({ items, I }) {
  if (!items.length) return <p className="kb-muted">None yet.</p>;
  return (
    <ul className="tpo-links">
      {items.map((x) => (
        <li key={x.key}>
          <a href={x.href} className="tpo-link">
            <span>
              <b>{x.title}</b>
              <span className="kb-row-slug">
                {x.slug} · {x.layer}
              </span>
            </span>
            {x.guide ? (
              <span className="av-tag" data-ui="Tag" data-tone="accent">
                Guide
              </span>
            ) : null}
            {I("chevron-right", 16)}
          </a>
        </li>
      ))}
    </ul>
  );
}
