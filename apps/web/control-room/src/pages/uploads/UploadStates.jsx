// CR-34's state sheet: every region's loading, empty, error and live states, every tray status and error,
// every link state, the drop target's lines and the filing sheet's warnings. A review page, built from the
// same components the screens use, with fixed sample rows.
import { TrayRow } from "./UploadLayer";
import { LinkTag, ScanTag } from "./UploadsPages";

const GB = 1024 ** 3;
const row = (I, key, name, kind, size, line, tone, extra) =>
  Object.assign(
    {
      key,
      name,
      size,
      line,
      tone,
      thumb: { kind, icon: I({ video: "film", image: "image", pdf: "file-text", archive: "file-archive", json: "file-json" }[kind] || "file", 20) },
    },
    extra,
  );

function Region({ name, where, I }) {
  return (
    <div className="ups-region">
      <h3>{name}</h3>
      <p className="up-muted">{where}</p>
      <div className="ups-four">
        <figure className="ups-cell" data-st="loading">
          <figcaption>Loading</figcaption>
          <div className="ups-skel" aria-hidden="true">
            <i></i>
            <i></i>
            <i></i>
          </div>
          <p className="up-muted">Skeleton rows the size of the real ones, so nothing jumps.</p>
        </figure>
        <figure className="ups-cell" data-st="empty">
          <figcaption>Empty</figcaption>
          <p className="ups-empty">
            {I("folder-open", 20)}
            <span>{EMPTY[name]}</span>
          </p>
        </figure>
        <figure className="ups-cell" data-st="error">
          <figcaption>Error</figcaption>
          <p className="ups-error">
            {I("triangle-alert", 16)}
            <span>Couldn’t load {name.toLowerCase()}. Your files are safe.</span>
          </p>
          <span className="av-btn" data-size="sm" data-variant="secondary">
            {I("refresh-cw", 14)}
            Retry
          </span>
        </figure>
        <figure className="ups-cell" data-st="live">
          <figcaption>
            Live <span className="ups-live" aria-hidden="true"></span>
          </figcaption>
          <p className="ups-new">
            <b>{LIVE[name]}</b>
            <span className="up-muted">just now</span>
          </p>
          <p className="up-muted">Arrives from the event stream and settles in place. No refresh button.</p>
        </figure>
      </div>
    </div>
  );
}
const EMPTY = {
  "Drive": "Drive is empty. Drop files anywhere, or on a page to file them there.",
  Uploads: "No tray: it appears when something uploads.",
  "Where it’s used": "Not used anywhere yet. File it to give it a place.",
  Versions: "One version: the first upload.",
  "Read by": "No attempt has read it yet.",
  "Client files": "No files for this client yet. Drop files on this page to add them.",
  "Project files": "No sources yet. Canon reads what you add here during Gate 0.",
  "Module inputs": "No inputs. Drop files on this page to give them to the module.",
};
const LIVE = {
  "Drive": "brief.pdf arrived from OSA",
  Uploads: "walkthrough.mp4 went from Scanning to In Drive",
  "Where it’s used": "M5 went from Waiting to Active",
  Versions: "v3 uploaded by you",
  "Read by": "M3 attempt 2 read v2",
  "Client files": "Inter.zip filed to the brand kit",
  "Project files": "dispatch-sheet.pdf: scan clean",
  "Module inputs": "requirements-v3.pdf added to the reading list",
};

export function UploadStatesPage({ I }) {
  const noop = () => {};
  const tray = [
    row(I, "a", "walkthrough.mp4", "video", "2 GB", "Uploading 41% · 820 MB of 2 GB", "live", { pct: 41, state: "uploading" }),
    row(I, "b", "walkthrough.mp4", "video", "1.4 GB", "Reconnecting… resumes where it stopped", "live", { pct: 63, state: "reconnecting" }),
    row(I, "c", "requirements-v3.pdf", "pdf", "2.1 MB", "Checking hash", "live", { pct: 100, indeterminate: "true", state: "hashing" }),
    row(I, "d", "Inter.zip", "archive", "4.6 MB", "Scanning", "live", { pct: 100, indeterminate: "true", state: "scanning" }),
    row(I, "e", "pricing-table.pdf", "pdf", "640 KB", "Filed to M3 · waiting for scan", "live", { pct: 100, indeterminate: "true", state: "scanning" }),
    row(I, "f", "brief.pdf", "pdf", "1.2 MB", "In Drive", "ok", { pct: 100, state: "done", dismiss: noop }),
    row(I, "g", "pricing-table.pdf", "pdf", "640 KB", "Filed to M3", "ok", { pct: 100, state: "done", dismiss: noop }),
  ];
  const errs = [
    row(I, "h", "launch-film.mov", "video", "2.6 GB", "Too big: video is limited to 2 GB", "bad", { state: "error", dismiss: noop }),
    row(I, "i", "sitemap-damaged.md", "other", "6 KB", "Upload damaged, retry", "bad", { state: "error", retry: noop, dismiss: noop }),
    row(I, "j", "config-export.json", "json", "12 KB", "Held: looks like it contains a key. Use Secrets instead.", "bad", { state: "held", secrets: "#/settings", dismiss: noop }),
    row(I, "k", "logo-acme.svg", "image", "21 KB", "Already filed to M5 and Blume Studio · brand kit", "warn", { state: "duplicate", dup: { same: noop, separate: noop }, dismiss: noop }),
  ];
  const links = [
    ["waiting", "Waiting", "Module", "M5 · Launch analytics", "In its next instructions"],
    ["waiting", "Waiting", "Repo", "Repo · public/brand/logo.svg", "Waiting for scan: location and camera data removed, malware check"],
    ["waiting", "Waiting", "Module", "M3 · Signup and spring code", "Waiting for M3 to land"],
    ["waiting", "Waiting", "Module", "M3 · Signup and spring code", "Goes out at 3:10 PM"],
    ["active", "Active", "Client", "Blume Studio · brand kit", "In the brand kit, so every Blume Studio project sees it"],
    ["refused", "Refused", "Repo", "Repo · public/img/hero.jpg", "Gate 2 failed: snapshot test header.spec"],
    ["removed", "Removed", "Module", "M1 · Content model and CMS", "Unlinked by you"],
  ];
  return (
    <div className="up-page ups" data-ui="UploadStates">
      <section className="lib-card up-sec" aria-labelledby="ups-tray">
        <header className="up-sec-h">
          <h2 id="ups-tray">Tray: every status</h2>
        </header>
        <p className="up-muted">From uploads.state and scanStatus, in the order a file moves through them.</p>
        <div className="ups-trays">
          <ul className="up-trows ups-card">
            {tray.map((r) => (
              <TrayRow key={r.key} r={r} I={I} />
            ))}
          </ul>
          <div className="ups-side">
            <h3>Errors, each with its next step</h3>
            <ul className="up-trows ups-card">
              {errs.map((r) => (
                <TrayRow key={r.key} r={r} I={I} />
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="lib-card up-sec" aria-labelledby="ups-drop">
        <header className="up-sec-h">
          <h2 id="ups-drop">Drop target: where the file goes, before you drop it</h2>
        </header>
        <div className="ups-drops">
          {[
            ["module", "Drop to add to M3 · Spring launch site", "On module M3’s page"],
            ["client", "Drop to add to Blume Studio’s files", "On a client’s page"],
            ["inbox", "Drop to put in Drive", "On Decisions, or anywhere else"],
            ["inbox", "Drop folder (18 files) to put in Drive", "A folder, anywhere"],
          ].map(([k, line, where]) => (
            <figure key={line} className="ups-drop" data-kind={k}>
              <span className="up-drop-icon">{I("upload", 20)}</span>
              <b>{line}</b>
              <figcaption className="up-muted">{where}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="lib-card up-sec" aria-labelledby="ups-links">
        <header className="up-sec-h">
          <h2 id="ups-links">Every link state</h2>
        </header>
        <ul className="up-links">
          {links.map(([st, lbl, kind, label, why], i) => (
            <li key={i} className="up-link-row" data-state={st}>
              <div className="up-link-main">
                <p className="up-link-top">
                  <span className="up-link-k">{kind}</span>
                  <span>{label}</span>
                </p>
                <p className="up-link-why">{why}</p>
                {st === "refused" ? (
                  <div className="up-link-acts">
                    <span className="av-btn" data-size="sm" data-variant="secondary">
                      Link to a module instead
                    </span>
                    <span className="av-btn" data-size="sm" data-variant="secondary">
                      {I("upload", 14)}
                      Upload fixed version
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="up-link-side">
                <LinkTag state={st}>{lbl}</LinkTag>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="lib-card up-sec" aria-labelledby="ups-scan">
        <header className="up-sec-h">
          <h2 id="ups-scan">Scan and flags</h2>
        </header>
        <div className="ups-tags">
          <ScanTag tone="live">Arriving · 63%</ScanTag>
          <ScanTag tone="live">Scanning</ScanTag>
          <ScanTag tone="ok">Scan clean</ScanTag>
          <ScanTag tone="bad">Held</ScanTag>
        </div>
        <ul className="ups-flags">
          <li>
            {I("shield-alert", 16)}
            <span>
              A <code>.png</code> that’s really a script
            </span>
            <span className="up-muted">Discard only</span>
          </li>
          <li>
            {I("shield-alert", 16)}
            <span>Looks like it contains an API key</span>
            <span className="up-muted">Discard, or Go to Secrets</span>
          </li>
        </ul>
      </section>

      <section className="lib-card up-sec" aria-labelledby="ups-meter">
        <header className="up-sec-h">
          <h2 id="ups-meter">Reading-list meter</h2>
        </header>
        <div className="ups-meters">
          {[
            [38, "38k of 60k tokens", undefined, "Room to spare"],
            [87, "52k of 60k tokens", "amber", "Close to the budget"],
            [104, "62k of 60k tokens", "over", "Over budget: Gate 1 will flag it"],
          ].map(([p, t, w, note]) => (
            <div key={t} className="up-meter" data-warn={w}>
              <div className="up-meter-top">
                <span>
                  <b className="kb-mono">M3</b> reading list
                </span>
                <span className="up-meter-n">{t}</span>
              </div>
              <div className="mdp-meter" data-warn={w} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, p)} aria-label={"M3 reading list " + t} style={{ "--pct": Math.min(1, p / 100) }}>
                <i></i>
                <span className="mdp-meter-mark" aria-hidden="true"></span>
              </div>
              <p className="up-hint">{w ? <b className="up-meter-note">{note}</b> : note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lib-card up-sec" aria-labelledby="ups-regions">
        <header className="up-sec-h">
          <h2 id="ups-regions">Every region: loading, empty, error, live</h2>
        </header>
        <p className="up-muted">Ready is the screen itself. Live means it changes from the event stream with no refresh.</p>
        {["Drive", "Uploads", "Where it’s used", "Versions", "Read by", "Client files", "Project files", "Module inputs"].map((n) => (
          <Region key={n} name={n} where={WHERE[n]} I={I} />
        ))}
      </section>
    </div>
  );
}
const WHERE = {
  "Drive": "The Drive page",
  Uploads: "The tray, bottom right (a bottom sheet on a phone)",
  "Where it’s used": "A file’s page",
  Versions: "A file’s page",
  "Read by": "A file’s page",
  "Client files": "A client’s Files tab",
  "Project files": "A project’s Files tab",
  "Module inputs": "A module’s page",
};
