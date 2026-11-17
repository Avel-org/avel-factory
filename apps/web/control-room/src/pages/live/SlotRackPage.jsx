// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.
import { EmptyArtFor } from "../../kit/EmptyState";

export function SlotRackPage({ vals }) {
  const { es, pg, rackGlyph } = vals;
  return (
    <>
      <div className="cr-rack-head">
        {rackGlyph}
        <span>{pg?.rackLabel}</span>
      </div>
      <div className="cr-rack" role="list" aria-label={pg?.rackLabel} data-ui="SlotRack">
        {" "}
        <div className="cr-slot" role="listitem">
          <span className="cr-slot-n">Slot 1</span>
          <span>Empty</span>
        </div>{" "}
        <div className="cr-slot" role="listitem">
          <span className="cr-slot-n">Slot 2</span>
          <span>Empty</span>
        </div>{" "}
        <div className="cr-slot" role="listitem">
          <span className="cr-slot-n">Slot 3</span>
          <span>Empty</span>
        </div>{" "}
        <div className="cr-slot" role="listitem">
          <span className="cr-slot-n">Slot 4</span>
          <span>Empty</span>
        </div>{" "}
        <div className="cr-slot" role="listitem">
          <span className="cr-slot-n">Slot 5</span>
          <span>Empty</span>
        </div>{" "}
        <div className="cr-slot" role="listitem">
          <span className="cr-slot-n">Slot 6</span>
          <span>Empty</span>
        </div>{" "}
      </div>
      <div className="av-state" data-ui="WidgetState" data-state="empty" data-compact="true">
        {" "}
        <EmptyArtFor scene={es?.scene} /> <h2 className="av-state-title">{es?.title}</h2>{" "}
        <p className="av-state-msg">{es?.msg}</p>{" "}
      </div>
      {pg?.river ? (
        <>
          <section className="lib-card cr-river" aria-label="Event river" data-ui="EventRiver">
            {" "}
            <h2 className="scr-h2">Event river</h2>{" "}
            <p className="cr-hint">
              No events yet. Dispatches, attempts and reports from every project arrive here in order.
            </p>{" "}
          </section>
        </>
      ) : null}
    </>
  );
}
