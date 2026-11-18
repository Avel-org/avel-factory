import { Fragment, lazy, Suspense } from "react";
import { list } from "../lib/dc";
// The thinking orb (thinking-orbs) only shows while Canon is working, so it loads then (E16, T-F8).
const Orb = lazy(() => import("../kit/Trail").then((m) => ({ default: m.Orb })));

/*
 * The phone dock: a floating bar with a lens that slides to where you are. Each item carries its
 * own live state instead of a number: a cobalt pip when decisions wait, the activity bars while a
 * room runs, the project's gates as a ring (or Canon's orb while it's his turn), a green pip when a
 * release is ready. What each state means is in the item's accessible name.
 */
export function TabBar({ vals }) {
  const { ic, openSheet, sheetExpanded, tabs } = vals;
  const items = list(tabs);
  const here = items.findIndex((t) => t?.current);
  const lensAt = here >= 0 ? here : 4; // a page the dock doesn't name sits under More
  return (
    <nav className="lib-tabbar dock" aria-label="Main" data-ui="TabBar" style={{ "--at": lensAt }}>
      <span className="dock-lens" aria-hidden="true"></span>
      {items.map((t) => (
        <Fragment key={t?.key}>
          <a className="lib-tab dock-tab" href={t?.href} aria-current={t?.current} data-k={t?.key}>
            <span className="lib-tab-icon dock-ic">
              {t?.canon ? (
                <Suspense fallback={null}>
                  <Orb size={20} state={t.canon === "thinking" ? "working" : "composing"} />
                </Suspense>
              ) : (
                t?.iconEl
              )}
              {t?.ring != null && !t?.canon ? (
                <svg className="dock-ring" viewBox="0 0 36 36" aria-hidden="true" focusable="false">
                  <circle cx="18" cy="18" r="16" pathLength="100" />
                  <circle cx="18" cy="18" r="16" pathLength="100" style={{ strokeDasharray: t.ring + " 100" }} />
                </svg>
              ) : null}
              {t?.needs ? <span className="dock-pip" data-tone="needs" aria-hidden="true"></span> : null}
              {t?.ready ? <span className="dock-pip" data-tone="ready" aria-hidden="true"></span> : null}
              {t?.live ? (
                <span className="dock-eq" aria-hidden="true">
                  <i></i>
                  <i></i>
                  <i></i>
                </span>
              ) : null}
            </span>
            <span className="lib-tab-l dock-l" title={t?.title}>
              {t?.dot ? <span className="dock-dot" style={{ "--dot": t.dot }} aria-hidden="true"></span> : null}
              <span className="dock-lt">{t?.label}</span>
            </span>
            {t?.badgeLabel ? <span className="sr-only">{", " + t.badgeLabel}</span> : null}
          </a>
        </Fragment>
      ))}
      <button
        type="button"
        className="lib-tab dock-tab"
        aria-expanded={sheetExpanded}
        onClick={openSheet}
        data-here={here < 0 ? "true" : undefined}
      >
        <span className="lib-tab-icon dock-ic">{ic?.menu20}</span>
        <span className="dock-l">
          <span className="dock-lt">More</span>
        </span>
      </button>
    </nav>
  );
}
