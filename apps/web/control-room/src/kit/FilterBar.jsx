import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSheet } from "./sheet";

/**
 * The filter bar the Library and Templates share. On a wide page each facet is its own button with a
 * popover of checkboxes and live counts; on a narrow page the facets fold into one "Filters" sheet.
 * Sort is a popover of radios. What's picked shows as removable chips under the bar, with the result
 * count announced politely so screen readers hear the list change.
 *
 * `f` comes from facets() in src/app/knowledge.js. `search` and `lead` are optional: a search field,
 * and a segmented control that sits first in the row (the Templates package switch).
 */
export function FilterBar({ f, I, search, lead, label = "Filters" }) {
  const [open, setOpen] = useState(null);
  const ref = useRef(null);
  const triggers = useRef({});
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (open === "sheet") return; // the sheet handles its own Escape, focus and dismissal
    const outside = (e) => {
      if (open === "sheet") return;
      if (ref.current && !ref.current.contains(e.target)) setOpen(null);
    };
    const esc = (e) => {
      if (e.key !== "Escape") return;
      const t = triggers.current[open];
      setOpen(null);
      if (t) t.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  // move focus into a popover or the sheet when it opens
  useEffect(() => {
    if (!open || !ref.current || open === "sheet") return;
    const pop = (open === "sheet" ? document : ref.current).querySelector('[data-pop="' + open + '"]');
    const first = pop && pop.querySelector("input:not([disabled]), button");
    if (first) first.focus();
  }, [open]);

  const toggle = (k) => setOpen(open === k ? null : k);
  const close = () => {
    const t = triggers.current[open];
    setOpen(null);
    if (t) t.focus();
  };
  const reg = (k) => (el) => {
    triggers.current[k] = el;
  };
  const n = Number(f.activeCount);
  useSheet(sheetRef, { open: open === "sheet", onClose: close, side: "bottom" });

  return (
    <div className="fb-wrap">
      <div className="fb" ref={ref} role="group" aria-label={label}>
        <div className="fb-row">
          {search ? (
            <label className="fb-search">
              {I("search", 16)}
              <span className="sr-only">{search.label}</span>
              <input type="search" value={search.value} onChange={search.onChange} placeholder={search.placeholder} />
              {search.value ? (
                <button type="button" className="fb-x" onClick={search.clear} aria-label="Clear search">
                  {I("x", 14)}
                </button>
              ) : null}
            </label>
          ) : null}
          {lead || null}

          <div className="fb-facets">
            {f.facets.map((x) => (
              <div key={x.key} className="fb-anchor">
                <button
                  type="button"
                  ref={reg(x.key)}
                  className="fb-btn"
                  data-active={x.active}
                  aria-expanded={String(open === x.key)}
                  aria-haspopup="dialog"
                  onClick={() => toggle(x.key)}
                >
                  <span className="fb-btn-label">{x.label}</span>
                  {x.summary ? <span className="fb-btn-val">{x.summary}</span> : null}
                  {I("chevron-down", 14)}
                </button>
                {open === x.key ? (
                  <div
                    className="fb-pop"
                    role="dialog"
                    aria-label={"Filter by " + x.label.toLowerCase()}
                    data-pop={x.key}
                  >
                    <Options facet={x} />
                    <div className="fb-pop-foot">
                      <button
                        type="button"
                        className="av-btn"
                        data-size="sm"
                        data-variant="ghost"
                        onClick={x.clear || undefined}
                        disabled={!x.clear || undefined}
                      >
                        Clear
                      </button>
                      <button type="button" className="av-btn" data-size="sm" data-variant="secondary" onClick={close}>
                        Done
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {f.facets.length ? (
            <button
              type="button"
              ref={reg("sheet")}
              className="fb-btn fb-sheet-btn"
              data-active={n ? "true" : undefined}
              aria-expanded={String(open === "sheet")}
              aria-haspopup="dialog"
              onClick={() => toggle("sheet")}
            >
              {I("sliders-horizontal", 16)}
              <span className="fb-btn-label">Filters</span>
              {n ? <span className="fb-count">{n}</span> : null}
            </button>
          ) : null}

          {f.sort ? (
            <div className="fb-anchor fb-sort">
              <button
                type="button"
                ref={reg("sort")}
                className="fb-btn"
                data-variant="plain"
                aria-expanded={String(open === "sort")}
                aria-haspopup="dialog"
                onClick={() => toggle("sort")}
              >
                {I("arrow-down-up", 16)}
                <span className="fb-sort-label">
                  <span className="fb-sort-pre">Sort: </span>
                  {f.sort.label}
                </span>
              </button>
              {open === "sort" ? (
                <div className="fb-pop" data-align="end" role="dialog" aria-label="Sort" data-pop="sort">
                  <fieldset className="fb-opts">
                    <legend className="sr-only">Sort by</legend>
                    {f.sort.options.map((o) => (
                      <label key={o.key} className="fb-opt" data-radio="true">
                        <input
                          type="radio"
                          name="fb-sort"
                          checked={o.checked}
                          onChange={() => {
                            o.pick();
                            close();
                          }}
                        />
                        <span className="fb-mark" aria-hidden="true">
                          {I("check", 14)}
                        </span>
                        <span className="fb-opt-label">{o.label}</span>
                      </label>
                    ))}
                  </fieldset>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="fb-status">
          <span className="fb-total" aria-live="polite">
            {f.count}
          </span>
          {f.chips.length ? (
            <ul className="fb-chips" aria-label="Active filters">
              {f.chips.map((c) => (
                <li key={c.key}>
                  <button
                    type="button"
                    className="fb-chip"
                    onClick={c.remove}
                    aria-label={"Remove " + c.facet + ": " + c.label}
                  >
                    <span className="fb-chip-facet">{c.facet}</span>
                    <span>{c.label}</span>
                    {I("x", 14)}
                  </button>
                </li>
              ))}
              <li>
                <button type="button" className="fb-clear" onClick={f.clearAll}>
                  Clear all
                </button>
              </li>
            </ul>
          ) : null}
        </div>

        {createPortal(
          <>
            <div
              className="fb-scrim"
              data-open={open === "sheet" ? "" : undefined}
              onClick={close}
              aria-hidden="true"
              data-sheet-keep=""
            ></div>
            <div
              ref={sheetRef}
              className="fb-sheet sh"
              data-side="bottom"
              data-open={open === "sheet" ? "" : undefined}
              role="dialog"
              aria-modal="true"
              aria-labelledby="fb-sheet-title"
              data-pop="sheet"
            >
              <div className="sh-handle" data-sheet-drag="" aria-hidden="true"></div>
              <div className="fb-sheet-head" data-sheet-drag="">
                <h2 id="fb-sheet-title">Filters</h2>
                <button type="button" className="fb-x" onClick={close} aria-label="Close filters">
                  {I("x", 20)}
                </button>
              </div>
              <div className="fb-sheet-body">
                {f.facets.map((x) => (
                  <section key={x.key} className="fb-sheet-sec">
                    <h3>{x.label}</h3>
                    <Options facet={x} />
                  </section>
                ))}
              </div>
              <div className="fb-sheet-foot">
                <button
                  type="button"
                  className="av-btn"
                  data-size="md"
                  data-variant="ghost"
                  onClick={f.clearAll || undefined}
                  disabled={!f.clearAll || undefined}
                >
                  Clear all
                </button>
                <button type="button" className="av-btn" data-size="md" data-variant="primary" onClick={close}>
                  Show {f.count}
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
      </div>
    </div>
  );
}

function Options({ facet }) {
  // options that would return nothing with the other filters on are left out, unless already picked
  const shown = facet.options.filter((o) => !o.disabled);
  return (
    <fieldset className="fb-opts">
      <legend className="sr-only">{facet.label}</legend>
      {shown.length ? null : <p className="fb-none">Nothing to narrow with the other filters on.</p>}
      {shown.map((o) => (
        <label key={o.key} className="fb-opt" data-disabled={o.disabled ? "true" : undefined}>
          <input type="checkbox" checked={o.checked} disabled={o.disabled || undefined} onChange={o.pick} />
          <span className="fb-box" aria-hidden="true"></span>
          <span className="fb-opt-label">{o.label}</span>
          <small>{o.count}</small>
        </label>
      ))}
    </fieldset>
  );
}
