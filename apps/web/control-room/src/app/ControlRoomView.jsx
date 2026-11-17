// Compiled from the Claude Design export (AVEL Control Room). Edit freely: this is the source now.
import { Fragment, useRef } from "react";
import { useSheet } from "../kit/sheet";
import { css, list } from "../lib/dc";
import { SimDock } from "../dev/SimDock";
import { ViewportPreview } from "../dev/ViewportPreview";
import { FilteredListPage } from "../pages/FilteredListPage";
import { GenericPage } from "../pages/GenericPage";
import { DecisionsPage } from "../pages/decisions/DecisionsPage";
import { LibraryPage } from "../pages/library/LibraryPage";
import { OpsPage } from "../pages/operations/OpsPages";
import { TemplatePage } from "../pages/templates/TemplatePage";
import { TemplatesGalleryPage } from "../pages/templates/TemplatesGalleryPage";
import { TemplateNewPage } from "../pages/templates/TemplateNewPage";
import { FactoryLivePage } from "../pages/live/FactoryLivePage";
import { SlotRackPage } from "../pages/live/SlotRackPage";
import { CanonPage } from "../pages/project/CanonPage";
import { NewProjectPage } from "../pages/project/NewProjectPage";
import { ProjectOverviewPage } from "../pages/project/ProjectOverviewPage";
import { AgentRosterPage } from "../pages/roster/AgentRosterPage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { UploadsPage } from "../pages/uploads/UploadsPages";
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
import { CommandPalette, KeysSheet } from "../shell/CommandPalette";

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
      {vals.pal ? <CommandPalette p={vals.pal} /> : null}
      {vals.keys ? <KeysSheet k={vals.keys} /> : null}
      {vals.up ? <UploadTray t={vals.up.tray} I={vals.up.I} /> : null}
      {vals.up ? <FilingSheet sh={vals.up.sheet} I={vals.up.I} /> : null}
      {vals.up ? <DropTarget d={vals.up.drop} /> : null}
      {showDock ? <SimDock vals={vals} /> : null}
      {vp ? <ViewportPreview vals={vals} /> : null}
    </>
  );
}
