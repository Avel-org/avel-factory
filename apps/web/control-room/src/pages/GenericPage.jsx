// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.
import { Fragment } from "react";
import { list } from "../lib/dc";
import { EmptyArtFor } from "../kit/EmptyState";

export function GenericPage({ vals }) {
  const { es } = vals;
  return (
    <div className="cr-stage">
      <div className="av-state" data-ui="WidgetState" data-state="empty">
        <EmptyArtFor scene={es?.scene} />
        <h2 className="av-state-title">{es?.title}</h2>
        <p className="av-state-msg">{es?.msg}</p>
        {es?.hasActions ? (
          <>
            <div className="av-state-actions">
              {list(es?.actions).map((a, $index) => (
                <Fragment key={$index}>
                  <button
                    type="button"
                    className="av-btn"
                    data-ui="Button"
                    data-variant={a?.variant}
                    onClick={a?.onClick}
                  >
                    {a?.iconEl}
                    {a?.label}
                  </button>
                </Fragment>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
