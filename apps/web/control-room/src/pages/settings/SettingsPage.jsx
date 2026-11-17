// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.
import { Fragment } from "react";
import { list } from "../../lib/dc";
import { EmptyArtFor } from "../../kit/EmptyState";

export function SettingsPage({ vals }) {
  const { depthOpts, ic, runDoctor, signOut, themeOpts, osaSet } = vals;
  return (
    <div className="cr-settings">
      <section className="lib-card cr-sec" aria-labelledby="set-account">
        <div className="cr-sec-head">
          <h2 className="scr-h2" id="set-account">
            Account
          </h2>
          <p>The operator signed in on this device.</p>
        </div>
        <div className="cr-sec-row">
          <span className="cr-sec-k">
            Javaris<small>Operator</small>
          </span>
          <button type="button" className="av-btn" data-ui="Button" data-variant="secondary" onClick={signOut}>
            {ic?.logout16}Sign out
          </button>
        </div>
      </section>
      {osaSet ? (
        <section className="lib-card cr-sec" aria-labelledby="set-osa" data-ui="OsaSettings">
          <div className="cr-sec-head">
            <h2 className="scr-h2" id="set-osa">
              OSA
            </h2>
            <p>Your operator agent. It prepares decisions in your terminal; only you take them.</p>
          </div>
          <div className="cr-sec-row">
            <span className="cr-sec-k">
              Session<small>{osaSet.lastSeen}</small>
            </span>
            <span className="cr-sec-v">{osaSet.session}</span>
            {osaSet.paused ? (
              <span className="cr-hint">{osaSet.resumeHelp}</span>
            ) : (
              <button type="button" className="av-btn" data-ui="Button" data-variant="secondary" onClick={osaSet.pause}>
                Pause OSA
              </button>
            )}
          </div>
          <div className="cr-sec-row">
            <span className="cr-sec-k">
              Model use<small>{osaSet.spendNote}</small>
            </span>
            <span className="osa-spend" data-high={osaSet.spendHigh}>
              {osaSet.spendShare != null ? (
                <span
                  className="osa-meter"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={osaSet.spendShare}
                  aria-label="OSA's model use against its monthly cap"
                >
                  <i style={{ width: Math.min(100, osaSet.spendShare) + "%" }}></i>
                </span>
              ) : null}
              <span>{osaSet.spend}</span>
            </span>
          </div>
        </section>
      ) : null}
      <section className="lib-card cr-sec" aria-labelledby="set-display">
        <div className="cr-sec-head">
          <h2 className="scr-h2" id="set-display">
            Display
          </h2>
          <p>Saved on this device. ⌘B collapses the sidebar on desk.</p>
        </div>
        <div className="cr-sec-row">
          <span className="cr-sec-k">Theme</span>
          <div role="radiogroup" aria-label="Theme" className="lib-seg">
            {list(themeOpts).map((o, $index) => (
              <Fragment key={$index}>
                <button type="button" role="radio" aria-checked={o?.checked} className="lib-seg-btn" onClick={o?.pick}>
                  {o?.iconEl}
                  <span>{o?.label}</span>
                </button>
              </Fragment>
            ))}
          </div>
        </div>
        <div className="cr-sec-row">
          <span className="cr-sec-k">
            Depth<small>Glass makes panels translucent over the page.</small>
          </span>
          <div role="radiogroup" aria-label="Depth" className="lib-seg">
            {list(depthOpts).map((o, $index) => (
              <Fragment key={$index}>
                <button type="button" role="radio" aria-checked={o?.checked} className="lib-seg-btn" onClick={o?.pick}>
                  {o?.iconEl}
                  <span>{o?.label}</span>
                </button>
              </Fragment>
            ))}
          </div>
        </div>
      </section>
      <section className="lib-card cr-sec" aria-labelledby="set-cli">
        <div className="cr-sec-head">
          <h2 className="scr-h2" id="set-cli">
            CLI sessions
          </h2>
          <p>Every signed-in AVEL CLI. Revoke one to sign it out.</p>
        </div>
        <div className="av-state" data-ui="WidgetState" data-state="empty" data-compact="true">
          <EmptyArtFor scene="noCommands" size="sm" />
          <h3 className="av-state-title">No CLI sessions</h3>
          <p className="av-state-msg">Sign in from the AVEL CLI and the session shows here.</p>
        </div>
      </section>
      <section className="lib-card cr-sec" aria-labelledby="set-health">
        <div className="cr-sec-head">
          <h2 className="scr-h2" id="set-health">
            Health
          </h2>
          <p>Health and doctor checks for the factory.</p>
        </div>
        <div className="av-state" data-ui="WidgetState" data-state="empty" data-compact="true">
          <EmptyArtFor scene="emptyList" size="sm" />
          <h3 className="av-state-title">Not checked yet</h3>
          <p className="av-state-msg">Run the checks to see whether the factory is ready to build.</p>
          <div className="av-state-actions">
            <button type="button" className="av-btn" data-ui="Button" data-variant="primary" onClick={runDoctor}>
              {ic?.play16}Run doctor
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
