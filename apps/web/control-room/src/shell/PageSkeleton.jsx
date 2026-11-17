// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.

export function PageSkeleton({ vals }) {
  return (
    <div className="lib-card cr-skel-card" data-ui="Skeleton" aria-busy="true" aria-label="Loading">
      {" "}
      <div className="cr-skel-head">
        <span className="av-skel" data-skeleton="true" style={{ width: "180px", height: "14px" }}></span>
      </div>{" "}
      <div className="cr-skel-row">
        <span className="av-skel" data-skeleton="true" data-round="true"></span>
        <span className="cr-skel-lines">
          <span className="av-skel" data-skeleton="true" style={{ width: "58%" }}></span>
          <span className="av-skel" data-skeleton="true" style={{ width: "34%", height: "10px" }}></span>
        </span>
        <span className="av-skel" data-skeleton="true"></span>
      </div>{" "}
      <div className="cr-skel-row">
        <span className="av-skel" data-skeleton="true" data-round="true"></span>
        <span className="cr-skel-lines">
          <span className="av-skel" data-skeleton="true" style={{ width: "44%" }}></span>
          <span className="av-skel" data-skeleton="true" style={{ width: "28%", height: "10px" }}></span>
        </span>
        <span className="av-skel" data-skeleton="true"></span>
      </div>{" "}
      <div className="cr-skel-row">
        <span className="av-skel" data-skeleton="true" data-round="true"></span>
        <span className="cr-skel-lines">
          <span className="av-skel" data-skeleton="true" style={{ width: "66%" }}></span>
          <span className="av-skel" data-skeleton="true" style={{ width: "40%", height: "10px" }}></span>
        </span>
        <span className="av-skel" data-skeleton="true"></span>
      </div>{" "}
    </div>
  );
}
