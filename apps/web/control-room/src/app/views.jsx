// Every page's view except Decisions' loads when its route first opens (E16, T-F8). A view that was
// preloaded (lazy.js, pageReady) renders at once, with no skeleton flash in between.
import { use } from "react";

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
    if (!View) use(preload());
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
