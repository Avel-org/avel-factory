import { FilterBar } from "../../kit/FilterBar";
import { TemplatePreview } from "./TemplatePreview";
import { EmptyState } from "../../kit/EmptyState";

/** Templates as a portfolio: what each one looks like, what it's for, and what it has produced. */
export function TemplatesGalleryPage({ vals }) {
  const { tpl } = vals;
  if (!tpl) return null;
  const g = tpl.gallery;
  const I = tpl.I;
  return (
    <div className="tpg" data-ui="TemplatesGallery">
      {g.ready.map((r) => (
        <div key={r.key} className="tpg-ready" role="region" aria-label="Ready to become a template">
          <p className="tpg-ready-text">
            <a href={r.href}>{r.project}</a> {r.note}
          </p>
          <button type="button" className="av-btn" data-size="md" data-variant="secondary" onClick={r.make}>
            Make a template
          </button>
        </div>
      ))}

      <p className="op-note tpg-building">
        Internal templates still being built are projects. <a href="#/missions?kind=template">See them in Projects</a>
      </p>

      <FilterBar
        f={g.filter}
        I={I}
        label="Filter templates"
        lead={
          <div className="lib-seg tpg-pkgs" role="radiogroup" aria-label="Package">
            {g.chips.map((ch) => (
              <button
                key={ch.key}
                type="button"
                role="radio"
                aria-checked={ch.checked}
                className="lib-seg-btn"
                onClick={ch.pick}
              >
                {ch.label}
                <small>{ch.count}</small>
              </button>
            ))}
          </div>
        }
      />

      {g.empty ? (
        <div className="kbd-empty lib-card">
          <EmptyState
            scene="noResults"
            title="No templates match these filters"
            action={
              g.filter.clearAll ? (
              <button type="button" className="av-btn" data-size="md" data-variant="secondary" onClick={g.filter.clearAll}>
                Clear all filters
              </button>
              ) : null
            }
          >
            Pick another package or remove a filter.
          </EmptyState>
        </div>
      ) : (
        <ul className="tpg-grid">
          {g.cards.map((t) => (
            <li key={t.key}>
              <a className="tpg-card" href={t.href} data-draft={t.draft}>
                <span className="tpg-shot">
                  <TemplatePreview kind={t.preview} />
                </span>
                <span className="tpg-card-body">
                  <span className="tpg-card-head">
                    <b>{t.name}</b>
                    <span className="tpg-v">{t.version}</span>
                    {t.statusLabel ? (
                      <span className="av-tag" data-ui="Tag" data-tone="pending">
                        {t.statusLabel}
                      </span>
                    ) : null}
                  </span>
                  <span className="tpg-pitch">{t.pitch}</span>
                  <span className="tpg-stackline">{t.stack.join(" · ")}</span>
                  <span className="tpg-stats">{t.stats}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
