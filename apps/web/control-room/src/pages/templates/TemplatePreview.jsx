/**
 * A drawn preview of a template's screens, for the portfolio. The real page shows screenshots
 * captured from the scaffold at its pinned commit (a change-request item); until then each
 * template draws its screens from simple shapes so the gallery reads like a portfolio.
 */
export function TemplatePreview({ kind, device = "desk", screen = 0, size = "card", url, path = "" }) {
  const phone = device === "phone";
  return (
    <div className="tpv" data-kind={kind} data-device={device} data-size={size} aria-hidden="true">
      <div className="tpv-frame">
        <div className="tpv-bar">
          <i></i>
          <i></i>
          <i></i>
          {url ? (
            <span className="tpv-url">
              <span className="tpv-url-host">{url}</span>
              {path}
            </span>
          ) : null}
        </div>
        <div className="tpv-page">
          {phone ? <PhoneScreen kind={kind} /> : <DeskScreen kind={kind} screen={screen} />}
        </div>
      </div>
    </div>
  );
}

const Line = ({ w, strong }) => (
  <span className="tpv-line" data-strong={strong ? "true" : undefined} style={{ width: w }}></span>
);

function DeskScreen({ kind, screen }) {
  if (kind === "landing") {
    if (screen === 1)
      return (
        <>
          <Nav />
          <div className="tpv-center">
            <Line w="40%" strong />
            <Line w="58%" />
          </div>
          <div className="tpv-cols3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="tpv-card" data-featured={i === 1 ? "true" : undefined}>
                <Line w="50%" />
                <span className="tpv-price"></span>
                <Line w="80%" />
                <Line w="70%" />
                <span className="tpv-cta"></span>
              </div>
            ))}
          </div>
        </>
      );
    if (screen === 2)
      return (
        <>
          <Nav />
          <div className="tpv-split">
            <div>
              <Line w="70%" strong />
              <Line w="90%" />
              <Line w="80%" />
            </div>
            <div className="tpv-card">
              <span className="tpv-field"></span>
              <span className="tpv-field"></span>
              <span className="tpv-cta" data-wide="true"></span>
            </div>
          </div>
        </>
      );
    return (
      <>
        <Nav />
        <div className="tpv-hero">
          <div>
            <Line w="78%" strong />
            <Line w="62%" strong />
            <Line w="88%" />
            <span className="tpv-cta"></span>
          </div>
          <span className="tpv-art"></span>
        </div>
        <div className="tpv-cols3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="tpv-card">
              <span className="tpv-dot"></span>
              <Line w="60%" />
              <Line w="85%" />
            </div>
          ))}
        </div>
      </>
    );
  }
  if (kind === "booking") {
    if (screen === 2)
      return (
        <>
          <Nav />
          <div className="tpv-rows">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="tpv-trow">
                <Line w="14%" />
                <span
                  className="tpv-slot"
                  style={{ marginLeft: `${[4, 18, 8, 30, 12][i]}%`, width: `${[30, 22, 40, 18, 26][i]}%` }}
                ></span>
              </div>
            ))}
          </div>
        </>
      );
    return (
      <>
        <Nav />
        <div className="tpv-split" data-wide-left="true">
          <div className="tpv-cal">
            {Array.from({ length: 28 }, (_, i) => (
              <span
                key={i}
                data-on={[9, 10, 16, 17, 23].includes(i) ? "true" : undefined}
                data-pick={i === (screen === 1 ? 16 : 10) ? "true" : undefined}
              ></span>
            ))}
          </div>
          <div className="tpv-card">
            <Line w="60%" strong />
            {[0, 1, 2].map((i) => (
              <span key={i} className="tpv-chiprow" data-on={i === 1 ? "true" : undefined}></span>
            ))}
            <span className="tpv-cta" data-wide="true"></span>
          </div>
        </div>
      </>
    );
  }
  // portal
  if (screen === 1)
    return (
      <div className="tpv-app">
        <Side />
        <div className="tpv-main">
          <Line w="30%" strong />
          <div className="tpv-table">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="tpv-tr" data-head={i === 0 ? "true" : undefined}>
                <Line w="30%" />
                <Line w="18%" />
                <Line w="22%" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  if (screen === 2)
    return (
      <div className="tpv-app">
        <Side />
        <div className="tpv-main">
          <Line w="26%" strong />
          <span className="tpv-field"></span>
          <span className="tpv-field"></span>
          <span className="tpv-field"></span>
          <span className="tpv-cta"></span>
        </div>
      </div>
    );
  return (
    <div className="tpv-app">
      <Side />
      <div className="tpv-main">
        <Line w="34%" strong />
        <div className="tpv-cols3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="tpv-card">
              <Line w="50%" />
              <span className="tpv-num"></span>
            </div>
          ))}
        </div>
        <div className="tpv-bars">
          {[40, 62, 48, 75, 58, 82, 66].map((h, i) => (
            <span key={i} style={{ height: h + "%" }}></span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhoneScreen({ kind }) {
  return (
    <div className="tpv-phone">
      <div className="tpv-phone-bar">
        <Line w="30%" strong />
        <span className="tpv-burger"></span>
      </div>
      {kind === "booking" ? (
        <>
          <div className="tpv-cal" data-small="true">
            {Array.from({ length: 14 }, (_, i) => (
              <span
                key={i}
                data-on={[3, 4, 9].includes(i) ? "true" : undefined}
                data-pick={i === 4 ? "true" : undefined}
              ></span>
            ))}
          </div>
          <span className="tpv-chiprow" data-on="true"></span>
          <span className="tpv-chiprow"></span>
        </>
      ) : kind === "portal" ? (
        <>
          <div className="tpv-card">
            <Line w="50%" />
            <span className="tpv-num"></span>
          </div>
          <div className="tpv-card">
            <Line w="40%" />
            <span className="tpv-num"></span>
          </div>
        </>
      ) : (
        <>
          <Line w="85%" strong />
          <Line w="70%" strong />
          <Line w="90%" />
          <span className="tpv-art" data-small="true"></span>
        </>
      )}
      <span className="tpv-cta" data-wide="true"></span>
    </div>
  );
}

const Nav = () => (
  <div className="tpv-nav">
    <span className="tpv-logo"></span>
    <Line w="9%" />
    <Line w="9%" />
    <Line w="9%" />
    <span className="tpv-cta" data-small="true"></span>
  </div>
);
const Side = () => (
  <div className="tpv-side">
    <span className="tpv-logo"></span>
    {[0, 1, 2, 3].map((i) => (
      <span key={i} className="tpv-sidei" data-on={i === 0 ? "true" : undefined}></span>
    ))}
  </div>
);
