import { useEffect, useMemo, useRef, useState } from "react";
import { TemplateDocs } from "./TemplatePage.jsx";
import { CodeBlock } from "../../kit/Code.jsx";

/**
 * Make a template from a delivered project, docs included. You write the breakdown on the left and
 * see it on the right exactly as its page will show it. The factory PR opens only when the docs meet
 * the rules (CR-W20); until then the checklist says what's left and takes you to it.
 * What you type stays in this page and saves when you pause.
 */
export function TemplateNewPage({ vals }) {
  const mk = vals.tpl && vals.tpl.make;
  if (!mk) return null;
  return <Flow mk={mk} I={vals.tpl.I} key={mk.key} />;
}

const STEPS = [
  ["basics", "Basics"],
  ["modules", "Modules"],
  ["docs", "Docs"],
  ["files", "Files"],
  ["review", "Review"],
];

function Flow({ mk, I }) {
  const src = mk.src;
  const [d, setD] = useState(mk.draft);
  const [tab, setTab] = useState("write");
  const [saved, setSaved] = useState(mk.savedAt ? "Draft saved" : "");
  const [view, setView] = useState(null); // the file open in the Files step
  const timer = useRef(null);
  const checks = useMemo(() => mk.checksFor(d), [d]);
  const left = checks.filter((x) => !x.ok);
  const opened = mk.opened;

  // save a moment after you stop typing
  const put = (patch) => {
    setD((x) => {
      const next = Object.assign({}, x, typeof patch === "function" ? patch(x) : patch);
      clearTimeout(timer.current);
      setSaved("Saving…");
      timer.current = setTimeout(() => {
        mk.save(next);
        setSaved("Draft saved");
      }, 600);
      return next;
    });
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const list = (k, i, v) => put((x) => ({ [k]: x[k].map((y, j) => (j === i ? v : y)) }));
  const add = (k, v) => put((x) => ({ [k]: x[k].concat(v) }));
  const drop = (k, i) => put((x) => ({ [k]: x[k].filter((_, j) => j !== i) }));
  const go = (step) => {
    const el = document.getElementById("tn-" + step);
    if (el) {
      setTab("write");
      requestAnimationFrame(() => {
        el.scrollIntoView({
          block: "start",
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        });
        const f = el.querySelector("input, textarea, button");
        if (f) f.focus({ preventScroll: true });
      });
    }
  };

  // the preview is the template page itself, fed from the draft
  const files = src.files;
  const keyPaths = Object.keys(d.keyFiles).filter((p) => d.keyFiles[p] != null && files[p] != null);
  const [pvFile, setPvFile] = useState(null);
  const pv = pvFile && keyPaths.includes(pvFile) ? pvFile : keyPaths[0] || null;
  const preview = {
    name: d.name || "Your template",
    commit: src.commit,
    planTotal:
      Math.round((src.plan.filter((p) => d.modules.includes(p.ref)).reduce((a, p) => a + p.est, 0) / 150) * 100) +
      "% of a mission\u2019s AI budget, estimated across " +
      d.modules.length +
      " modules",
    plan: src.plan
      .filter((p) => p.wave === 0 || d.modules.includes(p.ref))
      .map((p) => ({
        key: p.ref,
        ref: p.ref,
        goal: p.goal,
        what: null,
        workKind: p.kind,
        wave: p.wave === 0 ? "In the scaffold" : "Wave " + p.wave,
        est: p.est ? Math.round((p.est / 15) * 100) + "% of a module cap" : "—",
      })),
    tree: src.tree.map((f) =>
      Object.assign({}, f, {
        note: d.annotations[f.path] || null,
        current: f.path === pv ? "true" : undefined,
        pick: keyPaths.includes(f.path) ? () => setPvFile(f.path) : undefined,
      }),
    ),
    file: pv,
    fileText: pv ? files[pv] : null,
    fileWhy: pv ? d.keyFiles[pv] : null,
    rules: src.loads.rules,
    skills: src.loads.skills,
    knowledge: [],
    builtWith: [],
    versions: [
      {
        key: "1",
        v: "v1",
        when: "Today",
        note: opened ? "Draft, in PR #" + opened.n : "Not opened yet",
        projects: "No projects on it",
        current: "true",
      },
    ],
    newVersion: () => {},
    docs: {
      overview: d.overview || "Write the overview on the left. It shows here as you type.",
      use: d.use.filter((x) => x.trim()),
      avoid: d.avoid.filter((x) => x.trim()),
      notes: d.notes.filter((n) => n.text.trim()).map((n, i) => ({ key: i, tone: n.tone, text: n.text })),
      quickstart: d.quickstart
        .filter((q) => q.title.trim() || q.text.trim())
        .map((q, i) => ({
          key: i,
          n: String(i + 1),
          title: q.title,
          text: q.text,
          code: q.code.trim() ? { lang: "ts", title: null, code: q.code } : null,
        })),
      manifest: mk.manifestFor(d),
      keyFiles: keyPaths.map((p) => ({
        key: p,
        path: p,
        name: p.split("/").pop(),
        why: d.keyFiles[p],
        current: p === pv ? "true" : undefined,
        pick: () => setPvFile(p),
      })),
      toc: [],
    },
  };

  const filePaths = src.tree.filter((f) => !f.dir);
  const viewing = view && files[view] != null ? view : null;

  return (
    <div className="tn" data-tab={tab}>
      <header className="tn-head">
        <a className="tpo-back" href="#/templates">
          {I("arrow-left", 16)}
          All templates
        </a>
        <div className="tn-title">
          <h1 tabIndex={-1}>New template</h1>
          <p>
            From <b>{src.project}</b> at <span className="kb-mono">{src.commit}</span>, delivered with a {src.receipt}{" "}
            receipt. Write its docs once; every project built from it starts with them.
          </p>
        </div>
        <span className="tn-saved" role="status" aria-live="polite" title={mk.saveCall}>
          {saved === "Draft saved" && mk.rowVersion ? "Draft saved · version " + mk.rowVersion : saved}
        </span>
      </header>

      <div className="tn-switch lib-seg" role="tablist" aria-label="Write or preview">
        {[
          ["write", "Write"],
          ["preview", "Preview"],
        ].map(([k, l]) => (
          <button
            key={k}
            type="button"
            role="tab"
            className="lib-seg-btn"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="tn-grid">
        <nav className="tn-steps" aria-label="Steps">
          <ol>
            {STEPS.map(([k, l], i) => {
              const bad = checks.filter((c) => c.step === k && !c.ok).length;
              return (
                <li key={k} data-done={k !== "review" && !bad ? "true" : undefined}>
                  <a
                    href={"#tn-" + k}
                    onClick={(e) => {
                      e.preventDefault();
                      go(k);
                    }}
                  >
                    <span className="tn-step-n" aria-hidden="true">
                      {k !== "review" && !bad ? I("check", 12) : i + 1}
                    </span>
                    {l}
                    {bad ? <span className="tn-step-bad">{bad} left</span> : null}
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="tn-form">
          {/* ---- 1 basics */}
          <section className="tn-sec lib-card" id="tn-basics" aria-labelledby="tn-basics-h">
            <h2 id="tn-basics-h">
              <span className="tn-n">1</span> Basics
            </h2>
            <Field label="Name" hint="What people call it. The slug comes from it.">
              <input value={d.name} onChange={(e) => put({ name: e.target.value })} placeholder="Operator console" />
            </Field>
            <Field label="Pitch" hint="One line on the card and at the top of the page.">
              <input
                value={d.pitch}
                onChange={(e) => put({ pitch: e.target.value })}
                placeholder="A control room for a team that runs live work"
              />
            </Field>
            <Field label="Best for" hint="Who it suits, in a few words.">
              <input
                value={d.bestFor}
                onChange={(e) => put({ bestFor: e.target.value })}
                placeholder="Operations teams and internal tools"
              />
            </Field>
            <dl className="tn-facts">
              <div>
                <dt>Package</dt>
                <dd>{src.package}</dd>
              </div>
              <div>
                <dt>Stack</dt>
                <dd className="kb-mono">{src.stack.join(" · ")}</dd>
              </div>
            </dl>
          </section>

          {/* ---- 2 modules */}
          <section className="tn-sec lib-card" id="tn-modules" aria-labelledby="tn-modules-h">
            <h2 id="tn-modules-h">
              <span className="tn-n">2</span> Modules
            </h2>
            <p className="tn-lead">
              Pick what a project gets from day one. The foundation always comes in the scaffold.
            </p>
            <ul className="tn-mods">
              {src.plan.map((p) => {
                const base = p.wave === 0;
                const on = base || d.modules.includes(p.ref);
                return (
                  <li key={p.key}>
                    <label data-on={on ? "true" : undefined} data-base={base ? "true" : undefined}>
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={base || undefined}
                        onChange={(e) =>
                          put((x) => ({
                            modules: e.target.checked ? x.modules.concat(p.ref) : x.modules.filter((r) => r !== p.ref),
                          }))
                        }
                      />
                      <code>{p.ref}</code>
                      <span className="tn-mod-goal">{p.goal}</span>
                      <span className="tn-mod-meta">
                        {p.kind} ·{" "}
                        {base
                          ? "in the scaffold"
                          : "wave " + p.wave + " · " + Math.round((p.est / 15) * 100) + "% of a module cap"}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ---- 3 docs */}
          <section className="tn-sec lib-card" id="tn-docs" aria-labelledby="tn-docs-h">
            <h2 id="tn-docs-h">
              <span className="tn-n">3</span> Docs
            </h2>
            <Field
              label="Overview"
              hint={
                "Two or three sentences: what it is and what it's good at. " +
                d.overview.trim().length +
                " characters, 80 or more."
              }
            >
              <textarea
                rows={4}
                value={d.overview}
                onChange={(e) => put({ overview: e.target.value })}
                placeholder="The scaffold for…"
              />
            </Field>
            <div className="tn-two">
              <ListField
                label="Use it for"
                items={d.use}
                onChange={(i, v) => list("use", i, v)}
                onAdd={() => add("use", "")}
                onDrop={(i) => drop("use", i)}
                I={I}
                placeholder="Teams that…"
              />
              <ListField
                label="Not for"
                items={d.avoid}
                onChange={(i, v) => list("avoid", i, v)}
                onAdd={() => add("avoid", "")}
                onDrop={(i) => drop("avoid", i)}
                I={I}
                placeholder="Public sites: start from Landing page"
              />
            </div>
            <div className="tn-sub">
              <h3>Quickstart</h3>
              <p className="tn-lead">The steps from a brief to the first build. Add code where it helps.</p>
              <ol className="tn-qs">
                {d.quickstart.map((q, i) => (
                  <li key={i}>
                    <span className="tpd-step-n" aria-hidden="true">
                      {i + 1}
                    </span>
                    <div className="tn-qs-body">
                      <input
                        aria-label={"Step " + (i + 1) + " title"}
                        value={q.title}
                        onChange={(e) => list("quickstart", i, Object.assign({}, q, { title: e.target.value }))}
                        placeholder="What happens"
                      />
                      <textarea
                        aria-label={"Step " + (i + 1) + " text"}
                        rows={2}
                        value={q.text}
                        onChange={(e) => list("quickstart", i, Object.assign({}, q, { text: e.target.value }))}
                        placeholder="One or two sentences"
                      />
                      <textarea
                        className="kb-mono tn-code"
                        aria-label={"Step " + (i + 1) + " code, optional"}
                        rows={2}
                        value={q.code}
                        onChange={(e) => list("quickstart", i, Object.assign({}, q, { code: e.target.value }))}
                        placeholder="Code, optional"
                        spellCheck={false}
                      />
                    </div>
                    {d.quickstart.length > 1 ? (
                      <button
                        type="button"
                        className="tn-x"
                        aria-label={"Remove step " + (i + 1)}
                        onClick={() => drop("quickstart", i)}
                      >
                        {I("x", 14)}
                      </button>
                    ) : null}
                  </li>
                ))}
              </ol>
              <button
                type="button"
                className="av-btn"
                data-size="sm"
                data-variant="ghost"
                onClick={() => add("quickstart", { title: "", text: "", code: "" })}
              >
                {I("plus", 14)}
                Add a step
              </button>
            </div>
            <div className="tn-sub">
              <h3>Notes</h3>
              {d.notes.map((n, i) => (
                <div key={i} className="tn-note">
                  <select
                    aria-label="Kind of note"
                    value={n.tone}
                    onChange={(e) => list("notes", i, Object.assign({}, n, { tone: e.target.value }))}
                  >
                    <option value="note">Note</option>
                    <option value="tip">Tip</option>
                    <option value="warning">Watch out</option>
                  </select>
                  <input
                    aria-label="Note text"
                    value={n.text}
                    onChange={(e) => list("notes", i, Object.assign({}, n, { text: e.target.value }))}
                    placeholder="Something a builder should know"
                  />
                  <button type="button" className="tn-x" aria-label="Remove note" onClick={() => drop("notes", i)}>
                    {I("x", 14)}
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="av-btn"
                data-size="sm"
                data-variant="ghost"
                onClick={() => add("notes", { tone: "warning", text: "" })}
              >
                {I("plus", 14)}
                Add a note
              </button>
            </div>
          </section>

          {/* ---- 4 files */}
          <section className="tn-sec lib-card" id="tn-files" aria-labelledby="tn-files-h">
            <h2 id="tn-files-h">
              <span className="tn-n">4</span> Files
            </h2>
            <p className="tn-lead">
              A line on every file, so builders know where things go. Mark the files worth reading first and say why.
            </p>
            <ul className="tn-tree">
              {src.tree.map((f) => (
                <li key={f.key} style={{ "--depth": f.depth }} data-dir={f.dir}>
                  <span className="tn-path kb-mono">
                    {I(f.dir ? "folder" : "file", 14)}
                    {f.file ? (
                      <button
                        type="button"
                        className="tn-path-btn"
                        aria-pressed={String(viewing === f.path)}
                        onClick={() => setView(viewing === f.path ? null : f.path)}
                      >
                        {f.name}
                      </button>
                    ) : (
                      f.name
                    )}
                  </span>
                  {f.dir ? (
                    <span className="tn-dir-note">{d.annotations[f.path] ? d.annotations[f.path] : ""}</span>
                  ) : (
                    <input
                      aria-label={"What " + f.path + " is"}
                      value={d.annotations[f.path] || ""}
                      onChange={(e) =>
                        put((x) => ({ annotations: Object.assign({}, x.annotations, { [f.path]: e.target.value }) }))
                      }
                      placeholder="What this file is for"
                      data-empty={!(d.annotations[f.path] || "").trim() ? "true" : undefined}
                    />
                  )}
                  {f.file ? (
                    <label className="tn-key">
                      <input
                        type="checkbox"
                        checked={d.keyFiles[f.path] != null}
                        onChange={(e) =>
                          put((x) => {
                            const k = Object.assign({}, x.keyFiles);
                            if (e.target.checked) k[f.path] = k[f.path] || "";
                            else delete k[f.path];
                            return { keyFiles: k };
                          })
                        }
                      />
                      Key file
                    </label>
                  ) : (
                    <span></span>
                  )}
                  {d.keyFiles[f.path] != null ? (
                    <input
                      className="tn-why"
                      aria-label={"Why " + f.path + " matters"}
                      value={d.keyFiles[f.path]}
                      onChange={(e) =>
                        put((x) => ({ keyFiles: Object.assign({}, x.keyFiles, { [f.path]: e.target.value }) }))
                      }
                      placeholder="Why it matters: what a builder learns from it"
                    />
                  ) : null}
                </li>
              ))}
            </ul>
            {viewing ? (
              <CodeBlock code={files[viewing]} title={viewing} numbered maxHeight="320px" />
            ) : (
              <p className="tn-lead">Open a file name to read it.</p>
            )}
            <p className="tn-count">
              {filePaths.filter((f) => (d.annotations[f.path] || "").trim()).length} of {filePaths.length} files have a
              note · {keyPaths.length} key {keyPaths.length === 1 ? "file" : "files"}
            </p>
          </section>

          {/* ---- 5 review */}
          <section className="tn-sec lib-card" id="tn-review" aria-labelledby="tn-review-h">
            <h2 id="tn-review-h">
              <span className="tn-n">5</span> Review and open the PR
            </h2>
            <ul className="tn-checks">
              {checks.map((c) => (
                <li key={c.key} data-ok={c.ok ? "true" : undefined}>
                  <span className="tn-check-i" aria-hidden="true">
                    {c.ok ? I("check", 12) : null}
                  </span>
                  <span>{c.label}</span>
                  {!c.ok ? (
                    <button type="button" className="cd-link" onClick={() => go(c.step)}>
                      Fix
                    </button>
                  ) : null}
                  <span className="sr-only">{c.ok ? "done" : "not yet"}</span>
                </li>
              ))}
            </ul>
            <CodeBlock
              code={mk.manifestFor(d)}
              title="template.yaml"
              numbered
              caption="Written from your draft. Canon reads it at 0.3."
            />
            {opened ? (
              <div className="tn-opened" role="status">
                {I("git-pull-request", 16)}
                <span>Factory PR #{opened.n} is open. The template stays a draft until you merge it.</span>
                <a className="av-btn" data-size="sm" data-variant="secondary" href={mk.draftHref(opened.slug)}>
                  Open the draft
                </a>
                <a className="av-btn" data-size="sm" data-variant="ghost" href={mk.prHref}>
                  See the PR
                </a>
              </div>
            ) : null}
            <div className="tn-actions">
              <button
                type="button"
                className="av-btn"
                data-variant="primary"
                onClick={() => (left.length ? go(left[0].step) : mk.openPr(d))}
              >
                {I("git-pull-request", 16)}
                {opened
                  ? "Update the PR"
                  : left.length
                    ? left.length + (left.length === 1 ? " thing left" : " things left")
                    : "Open the factory PR"}
              </button>
              <span className="tn-actions-note">
                {left.length
                  ? "The PR opens once the docs meet every rule above."
                  : "The docs travel with the PR and are reviewed with it."}
              </span>
            </div>
          </section>
        </div>

        <aside className="tn-preview" aria-label="Preview of the template's page">
          <div className="tn-preview-bar">
            <span className="tn-preview-dot" aria-hidden="true"></span>
            Preview · {preview.name}
          </div>
          <div className="tn-preview-body">
            <h2 className="tn-preview-title">{preview.name}</h2>
            <p className="tn-preview-pitch">{d.pitch || "Your pitch shows here."}</p>
            <TemplateDocs t={preview} I={I} preview />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="tn-field">
      <span className="tn-label">{label}</span>
      {children}
      {hint ? <span className="tn-hint">{hint}</span> : null}
    </label>
  );
}

function ListField({ label, items, onChange, onAdd, onDrop, I, placeholder }) {
  return (
    <fieldset className="tn-list">
      <legend className="tn-label">{label}</legend>
      {items.map((x, i) => (
        <div key={i} className="tn-list-row">
          <input
            aria-label={label + " " + (i + 1)}
            value={x}
            onChange={(e) => onChange(i, e.target.value)}
            placeholder={placeholder}
          />
          {items.length > 1 ? (
            <button
              type="button"
              className="tn-x"
              aria-label={"Remove " + label.toLowerCase() + " " + (i + 1)}
              onClick={() => onDrop(i)}
            >
              {I("x", 14)}
            </button>
          ) : null}
        </div>
      ))}
      <button type="button" className="av-btn" data-size="sm" data-variant="ghost" onClick={onAdd}>
        {I("plus", 14)}
        Add
      </button>
    </fieldset>
  );
}
