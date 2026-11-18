// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.
import { Fragment, lazy, Suspense, useRef } from "react";
import { useSheet } from "../kit/sheet";
import { css, list } from "../lib/dc";
import { DecisionsPage } from "../pages/decisions/DecisionsPage";
import { DropTarget, FilingSheet, UploadTray } from "../pages/uploads/UploadLayer";
import { ErrorPanel } from "../shell/ErrorPanel";
import { LiveStrip } from "../shell/LiveStrip";
import { PageMasthead } from "../shell/PageMasthead";
import { OsaBar } from "../shell/OsaBar";
import { PageSkeleton } from "../shell/PageSkeleton";
import { ScreenSpec } from "../shell/ScreenSpec";
import { Sidebar } from "../shell/Sidebar";
import { StateBar } from "../shell/StateBar";
import { TabBar } from "../shell/TabBar";
import { Topbar } from "../shell/Topbar";

// Every page but Decisions loads its view when its route first opens (E16, T-F8).
const SimDock = lazy(() => import("../dev/SimDock").then((m) => ({ default: m.SimDock })));
const ViewportPreview = lazy(() => import("../dev/ViewportPreview").then((m) => ({ default: m.ViewportPreview })));
const FilteredListPage = lazy(() => import("../pages/FilteredListPage").then((m) => ({ default: m.FilteredListPage })));
const GenericPage = lazy(() => import("../pages/GenericPage").then((m) => ({ default: m.GenericPage })));
const LibraryPage = lazy(() => import("../pages/library/LibraryPage").then((m) => ({ default: m.LibraryPage })));
const OpsPage = lazy(() => import("../pages/operations/OpsPages").then((m) => ({ default: m.OpsPage })));
const TemplatePage = lazy(() => import("../pages/templates/TemplatePage").then((m) => ({ default: m.TemplatePage })));
const TemplatesGalleryPage = lazy(() => import("../pages/templates/TemplatesGalleryPage").then((m) => ({ default: m.TemplatesGalleryPage })));
const TemplateNewPage = lazy(() => import("../pages/templates/TemplateNewPage").then((m) => ({ default: m.TemplateNewPage })));
const FactoryLivePage = lazy(() => import("../pages/live/FactoryLivePage").then((m) => ({ default: m.FactoryLivePage })));
const SlotRackPage = lazy(() => import("../pages/live/SlotRackPage").then((m) => ({ default: m.SlotRackPage })));
const CanonPage = lazy(() => import("../pages/project/CanonPage").then((m) => ({ default: m.CanonPage })));
const NewProjectPage = lazy(() => import("../pages/project/NewProjectPage").then((m) => ({ default: m.NewProjectPage })));
const ProjectOverviewPage = lazy(() => import("../pages/project/ProjectOverviewPage").then((m) => ({ default: m.ProjectOverviewPage })));
const AgentRosterPage = lazy(() => import("../pages/roster/AgentRosterPage").then((m) => ({ default: m.AgentRosterPage })));
const SettingsPage = lazy(() => import("../pages/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const UploadsPage = lazy(() => import("../pages/uploads/UploadsPages").then((m) => ({ default: m.UploadsPage })));
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
              {vals.osaBar ? <OsaBar o={vals.osaBar} /> : null}
              {lvTop ? <LiveStrip vals={vals} /> : null}
              {specOpen ? <ScreenSpec vals={vals} /> : null}
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
              {show?.errorPanel ? <ErrorPanel vals={vals} /> : null}
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
      {showTabbar ? <TabBar vals={vals} /> : null}
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
      {vals.up ? <UploadTray t={vals.up.tray} I={vals.up.I} /> : null}
      {vals.up ? <FilingSheet sh={vals.up.sheet} I={vals.up.I} /> : null}
      {vals.up ? <DropTarget d={vals.up.drop} /> : null}
      {showDock ? <SimDock vals={vals} /> : null}
      {vp ? <ViewportPreview vals={vals} /> : null}
      </Suspense>
    </>
  );
}
