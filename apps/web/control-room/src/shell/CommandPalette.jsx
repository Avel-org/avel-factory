import { Fragment, useEffect, useRef } from "react";
import { EmptyArtFor } from "../kit/EmptyState";

/** ⌘K: one search for pages, projects, decisions, clients, agents, Library and templates, plus verbs. */
export function CommandPalette({ p }) {
  const input = useRef(null);
  const listRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => input.current && input.current.focus(), 0);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const el = listRef.current && listRef.current.querySelector('[aria-selected="true"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }, [p.active]);
  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      p.move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      p.move(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      p.run();
    } else if (e.key === "Escape") {
      e.preventDefault();
      p.close();
    }
  };
  let n = -1;
  return (
    <div className="cmdk-wrap" onMouseDown={(e) => e.target === e.currentTarget && p.close()}>
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Search and run a command">
        <div className="cmdk-field">
          {p.I("search", 16)}
          <input
            ref={input}
            autoFocus
            className="cmdk-input"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-list"
            aria-activedescendant={p.activeId || undefined}
            aria-autocomplete="list"
            placeholder="Search projects, decisions, pages, agents…"
            value={p.q}
            onChange={(e) => p.setQ(e.target.value)}
            onKeyDown={onKey}
            spellCheck="false"
            autoComplete="off"
          />
          <kbd className="cmdk-esc">Esc</kbd>
          <button type="button" className="cmdk-cancel" onClick={p.close}>
            Cancel
          </button>
        </div>
        <div className="cmdk-list" id="cmdk-list" role="listbox" aria-label="Results" ref={listRef}>
          {p.groups.length ? (
            p.groups.map((g) => (
              <div
                key={g.key}
                role="group"
                aria-labelledby={"cmdk-g-" + g.key.replace(/\W+/g, "")}
                className="cmdk-group"
              >
                <p className="cmdk-gtitle" id={"cmdk-g-" + g.key.replace(/\W+/g, "")}>
                  {g.title}
                </p>
                {g.rows.map((x) => {
                  n += 1;
                  const i = n;
                  const id = "cmdk-o-" + i;
                  return (
                    <div
                      key={x.id}
                      id={id}
                      role="option"
                      aria-selected={i === p.active ? "true" : "false"}
                      className="cmdk-opt"
                      data-waiting={x.waiting ? "true" : undefined}
                      onMouseMove={() => i !== p.active && p.hover(i)}
                      onClick={() => p.run(i)}
                    >
                      <span className="cmdk-icon" aria-hidden="true">
                        {p.I(x.icon || "arrow-right", 16)}
                      </span>
                      <span className="cmdk-text">
                        <span className="cmdk-label">
                          {x.label}
                          {x.ref ? <span className="cmdk-ref"> {x.ref}</span> : null}
                        </span>
                        {x.hint ? <span className="cmdk-hint">{x.hint}</span> : null}
                      </span>
                      {x.kbd ? (
                        <span className="cmdk-kbd" aria-label={"Shortcut " + x.kbd.join(" then ")}>
                          {x.kbd.map((k, j) => (
                            <kbd key={j}>{k}</kbd>
                          ))}
                        </span>
                      ) : x.note ? (
                        <span className="cmdk-note">{x.note}</span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="cmdk-none">
              <EmptyArtFor scene="noCommands" size="sm" />
              <p>Nothing matches “{p.q}”.</p>
            </div>
          )}
        </div>
        <div className="cmdk-foot" aria-hidden="true">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> to move
          </span>
          <span>
            <kbd>Enter</kbd> to open
          </span>
          <span>
            <kbd>?</kbd> for all keys
          </span>
        </div>
      </div>
    </div>
  );
}

/** The ? sheet: every key, grouped. */
export function KeysSheet({ k }) {
  const ref = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => ref.current && ref.current.focus(), 0);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="cmdk-wrap" onMouseDown={(e) => e.target === e.currentTarget && k.close()}>
      <div
        className="cmdk keys"
        role="dialog"
        aria-modal="true"
        aria-labelledby="keys-h"
        tabIndex="-1"
        ref={ref}
        onKeyDown={(e) => e.key === "Escape" && k.close()}
      >
        <div className="keys-head">
          <h2 id="keys-h">Keyboard</h2>
          <button
            type="button"
            className="av-btn"
            data-variant="ghost"
            data-size="sm"
            onClick={k.close}
            aria-label="Close"
          >
            {k.I("x", 16)}
          </button>
        </div>
        <div className="keys-cols">
          {k.groups.map((g) => (
            <section key={g.key} className="keys-group" aria-label={g.title}>
              <h3>{g.title}</h3>
              <dl>
                {g.rows.map(([keys, label], i) => (
                  <Fragment key={i}>
                    <dt>
                      {keys.map((x, j) => (
                        <kbd key={j}>{x}</kbd>
                      ))}
                    </dt>
                    <dd>{label}</dd>
                  </Fragment>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
