// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.
import { Fragment, lazy, Suspense, use, useRef } from "react";
import { useSheet } from "../kit/sheet";
import { css, list } from "../lib/dc";
import { DecisionsPage } from "../pages/decisions/DecisionsPage";
import { PageMasthead } from "../shell/PageMasthead";
import { PageSkeleton } from "../shell/PageSkeleton";
import { Sidebar } from "../shell/Sidebar";
import { StateBar } from "../shell/StateBar";
import { Topbar } from "../shell/Topbar";

// Every page but Decisions loads its view when its route first opens (E16, T-F8). A view that was
// preloaded (logic.js, pageReady) renders at once, with no skeleton flash in between.
/** A view loaded on demand: `preload()` starts it; once it has loaded it renders without suspending. */
function lazyView(load, name) {
  let View = null;
  let loading = null;
  const preload = () => {
    if (!loading) {
      loading = load().then((m) => {
        View = m[name];
        loading.status = "fulfilled";
        loading.value = View;
      });
    }
    return loading;
  };
  function Lazy(props) {
    use(preload());
    return <View {...props} />;
  }
  Lazy.preload = preload;
  return Lazy;
}

export const FilteredListPage = lazyView(() => import("../pages/FilteredListPage"), "FilteredListPage");
export const GenericPage = lazyView(() => import("../pages/GenericPage"), "GenericPage");
export const LibraryPage = lazyView(() => import("../pages/library/LibraryPage"), "LibraryPage");
export const OpsPage = lazyView(() => import("../pages/operations/OpsPages"), "OpsPage");
export const TemplatePage = lazyView(() => import("../pages/templates/TemplatePage"), "TemplatePage");
export const TemplatesGalleryPage = lazyView(() => import("../pages/templates/TemplatesGalleryPage"), "TemplatesGalleryPage");
export const TemplateNewPage = lazyView(() => import("../pages/templates/TemplateNewPage"), "TemplateNewPage");
export const FactoryLivePage = lazyView(() => import("../pages/live/FactoryLivePage"), "FactoryLivePage");
export const SlotRackPage = lazyView(() => import("../pages/live/SlotRackPage"), "SlotRackPage");
export const CanonPage = lazyView(() => import("../pages/project/CanonPage"), "CanonPage");
export const NewProjectPage = lazyView(() => import("../pages/project/NewProjectPage"), "NewProjectPage");
export const ProjectOverviewPage = lazyView(() => import("../pages/project/ProjectOverviewPage"), "ProjectOverviewPage");
export const AgentRosterPage = lazyView(() => import("../pages/roster/AgentRosterPage"), "AgentRosterPage");
export const SettingsPage = lazyView(() => import("../pages/settings/SettingsPage"), "SettingsPage");
export const UploadsPage = lazyView(() => import("../pages/uploads/UploadsPages"), "UploadsPage");

// The shell's pieces that aren't always shown load when they are.
const ErrorPanel = lazy(() => import("../shell/ErrorPanel").then((m) => ({ default: m.ErrorPanel })));
const TabBar = lazy(() => import("../shell/TabBar").then((m) => ({ default: m.TabBar })));
const LiveStrip = lazy(() => import("../shell/LiveStrip").then((m) => ({ default: m.LiveStrip })));
const OsaBar = lazy(() => import("../shell/OsaBar").then((m) => ({ default: m.OsaBar })));
const ScreenSpec = lazy(() => import("../shell/ScreenSpec").then((m) => ({ default: m.ScreenSpec })));
const UploadTray = lazy(() => import("../pages/uploads/UploadLayer").then((m) => ({ default: m.UploadTray })));
const FilingSheet = lazy(() => import("../pages/uploads/UploadLayer").then((m) => ({ default: m.FilingSheet })));
const DropTarget = lazy(() => import("../pages/uploads/UploadLayer").then((m) => ({ default: m.DropTarget })));
const SimDock = lazy(() => import("../dev/SimDock").then((m) => ({ default: m.SimDock })));
const ViewportPreview = lazy(() => import("../dev/ViewportPreview").then((m) => ({ default: m.ViewportPreview })));
const CommandPalette = lazy(() => import("../shell/CommandPalette").then((m) => ({ default: m.CommandPalette })));
const KeysSheet = lazy(() => import("../shell/CommandPalette").then((m) => ({ default: m.KeysSheet })));

export function ControlRoomView({ vals }) {
  const {
    L,
    canvasRef,
    closeSheet,
    contentCls,
    ic,
    libTabs,
    lvTop,
    mainRef,
    mergedHead,
    onCanvasScroll,
    pg,
    rails,
    sheetOpen,
    show,
    showDock,
    showTabbar,
    skipToMain,
    snack,
    specOpen,
    tabbarAttr,
    tip,
    toast,
    vp,
  } = vals;
  const navRef = useRef(null);
  useSheet(navRef, { open: !!sheetOpen, onClose: closeSheet, side: "left" });
  return (
    <>
      <a className="lib-skip" href="#cr-main" onClick={skipToMain}>
        Skip to content
      </a>
      <div className="lib-app cr-app" data-tabbar={tabbarAttr} data-ui="AppShell">
        {list(rails).map((r, $index) => (
          <Fragment key={$index}>
            <aside
              ref={r?.isSheet ? navRef : undefined}
              className={r?.wrapClass}
              data-open={r?.open}
              role={r?.role}
              aria-modal={r?.modal}
              aria-label={r?.aria}
              aria-hidden={r?.hidden}
            >
              {" "}
              <Sidebar vals={vals} r={r} index={$index} />{" "}
            </aside>
          </Fragment>
        ))}
        <div className="lib-main-col cr-canvas" ref={canvasRef} onScroll={onCanvasScroll} data-merged={mergedHead}>
          <span className="cr-sweep" aria-hidden="true"></span>
          <Topbar vals={vals} />
          {pg?.showMast ? <PageMasthead vals={vals} /> : null}
          <main id="cr-main" tabIndex="-1" className="lib-main" ref={mainRef}>
            {" "}
            <div
              className="lib-screen"
              data-wide={pg?.wide}
              data-ui="Page"
              data-page={pg?.id}
              data-state={pg?.state}
              data-term={vals.termAttached}
            >
              <Suspense fallback={null}>
                {vals.osaBar ? <OsaBar o={vals.osaBar} /> : null}
                {lvTop ? <LiveStrip vals={vals} /> : null}
                {specOpen ? <ScreenSpec vals={vals} /> : null}
              </Suspense>
              {pg?.kindTabsOff ? (
                <>
                  <div className="lib-screen-tabs cr-tabs" role="tablist" aria-label="Library kinds">
                    {" "}
                    {list(libTabs).map((t, $index) => (
                      <Fragment key={$index}>
                        <a className="lib-screen-tab" role="tab" aria-selected={t?.sel} href={t?.href}>
                          {t?.label}
                        </a>
                      </Fragment>
                    ))}{" "}
                  </div>
                </>
              ) : null}
              {show?.loading ? <PageSkeleton vals={vals} /> : null}
              <Suspense fallback={null}>{show?.errorPanel ? <ErrorPanel vals={vals} /> : null}</Suspense>
              {show?.bar ? <StateBar vals={vals} /> : null}
              {show?.content ? (
                <>
                  <Suspense fallback={<PageSkeleton vals={vals} />}>
                  <div className={contentCls}>
                    {L?.decisions ? <DecisionsPage vals={vals} /> : null}
                    {L?.overview ? <ProjectOverviewPage vals={vals} /> : null}
                    {L?.live ? <FactoryLivePage vals={vals} /> : null}
                    {L?.library ? <LibraryPage vals={vals} /> : null}
                    {L?.templates ? <TemplatesGalleryPage vals={vals} /> : null}
                    {L?.template ? <TemplatePage vals={vals} /> : null}
                    {L?.templateNew ? <TemplateNewPage vals={vals} /> : null}
                    {L?.roster ? <AgentRosterPage vals={vals} /> : null}
                    {L?.ops ? <OpsPage vals={vals} /> : null}
                    {L?.generic ? <GenericPage vals={vals} /> : null}
                    {L?.filtered ? <FilteredListPage vals={vals} /> : null}
                    {L?.form ? <NewProjectPage vals={vals} /> : null}
                    {L?.canon ? <CanonPage vals={vals} /> : null}
                    {L?.rack ? <SlotRackPage vals={vals} /> : null}
                    {L?.settings ? <SettingsPage vals={vals} /> : null}
                    {L?.uploads ? <UploadsPage vals={vals} /> : null}
                  </div>
                  </Suspense>
                </>
              ) : null}
            </div>{" "}
          </main>
        </div>
      </div>
      <div
        className="lib-sheet-scrim"
        data-open={sheetOpen}
        onClick={closeSheet}
        aria-hidden="true"
        data-sheet-keep=""
      ></div>
      <Suspense fallback={null}>{showTabbar ? <TabBar vals={vals} /> : null}</Suspense>
      {snack ? (
        <>
          <div className="dec-snack" role="status" data-ui="Snackbar">
            {snack?.glyph}
            <span className="dec-snack-text">{snack?.text}</span>
            <button type="button" className="dec-snack-undo" onClick={snack?.undo}>
              Undo · {snack?.left}s
            </button>
          </div>
        </>
      ) : null}
      <div className="lib-toast-wrap" aria-live="polite" data-sheet-keep="">
        {toast ? (
          <>
            <div
              className="lib-toast"
              data-tone={vals.toastTone}
              role={vals.toastTone === "failure" ? "alert" : undefined}
            >
              {vals.toastIcon}
              <span>{toast}</span>
            </div>
          </>
        ) : null}
      </div>
      {tip ? (
        <>
          <span
            className="lib-rail-tip"
            role="tooltip"
            style={css(`top: ${tip?.top ?? ""}px; left: ${tip?.left ?? ""}px`)}
          >
            {tip?.text}
          </span>
        </>
      ) : null}
      <Suspense fallback={null}>
      {vals.pal ? <CommandPalette p={vals.pal} /> : null}
      {vals.keys ? <KeysSheet k={vals.keys} /> : null}
      {vals.up?.tray?.open ? <UploadTray t={vals.up.tray} I={vals.up.I} /> : null}
      {vals.up?.sheet ? <FilingSheet sh={vals.up.sheet} I={vals.up.I} /> : null}
      {vals.up?.drop ? <DropTarget d={vals.up.drop} /> : null}
      {showDock ? <SimDock vals={vals} /> : null}
      {vp ? <ViewportPreview vals={vals} /> : null}
      </Suspense>
    </>
  );
}
