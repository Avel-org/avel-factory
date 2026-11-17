// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.
import { Fragment } from "react";
import { list } from "../lib/dc";

export function ScreenSpec({ vals }) {
  const { spec } = vals;
  return (
    <section className="scr-spec" aria-label="Behind this screen" data-ui="ScreenSpec">
      {" "}
      <div className="scr-spec-grid">
        {" "}
        <div>
          <h3>Route</h3>
          <code>{spec?.route}</code>
          {spec?.note ? (
            <>
              <p style={{ marginTop: "6px" }}>{spec?.note}</p>
            </>
          ) : null}
        </div>{" "}
        <div>
          <h3>Reads and writes</h3>
          <ul className="cr-spec-calls">
            {list(spec?.calls).map((x, $index) => (
              <Fragment key={$index}>
                <li>
                  <code>{x?.text}</code>
                </li>
              </Fragment>
            ))}
          </ul>
        </div>{" "}
        <div>
          <h3>Kept fresh by</h3>
          <ul>
            {list(spec?.fresh).map((x, $index) => (
              <Fragment key={$index}>
                <li>{x?.text}</li>
              </Fragment>
            ))}
          </ul>
        </div>{" "}
        <div>
          <h3>States</h3>
          <p>{spec?.states}</p>
        </div>{" "}
      </div>{" "}
      <div className="cr-gaps">
        {" "}
        <h3>Not in the contract yet</h3>{" "}
        {list(spec?.gaps).map((g, $index) => (
          <Fragment key={$index}>
            <div className="cr-gap">
              <span>
                <span className="av-tag" data-ui="Tag" data-tone={g?.tone}>
                  {g?.status}
                </span>
              </span>
              <code>{g?.cr}</code>
              <span>{g?.text}</span>
            </div>
          </Fragment>
        ))}{" "}
        {spec?.noGaps ? (
          <>
            <p>Every field this page shows is in the contract today.</p>
          </>
        ) : null}{" "}
        <p style={{ color: "var(--av-muted)" }}>
          Shell, on every page: <code>GET /api/missions</code> (route 19) for the sidebar, <code>GET /api/status</code>{" "}
          (route 104) for the badges and the stall check, <code>GET /api/events/stream</code> (route 63) for the live
          dot. Contract 1.0.0.
        </p>{" "}
      </div>{" "}
    </section>
  );
}
