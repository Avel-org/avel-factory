// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.

export function StateBar({ vals }) {
  const { bar } = vals;
  return (
    <div className="scr-state-bar" data-state={bar?.state} role="status">
      {" "}
      {bar?.glyphEl}{" "}
      <span className="cr-state-bar-text">
        <b>{bar?.title}.</b> {bar?.body}{" "}
        <span className="av-hash" data-ui="HashChip">
          <span className="av-hash-pre">req</span>
          {bar?.reqId}
        </span>
      </span>{" "}
      <button
        type="button"
        className="av-btn"
        data-ui="Button"
        data-size="sm"
        data-variant={bar?.variant}
        onClick={bar?.onAction}
      >
        {bar?.action}
      </button>{" "}
    </div>
  );
}
