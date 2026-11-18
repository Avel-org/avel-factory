import { EmptyStates } from "./EmptyArt";
import { useNight } from "./Trail";

/*
 * One empty state for the whole app: Rico UI's instrument-panel scene, a title, one line, and at most
 * one action. The scene is decorative (the words say it), so it's hidden from screen readers.
 * Scenes: nothing, emptyList, emptyFolder, noResults, noCommands, noTabs, noNotifications,
 * loadFailed, offline, accessDenied, sessionExpired, blockedPage.
 * size: "md" (240×180) for a page or a card, "sm" (160×120) inside a panel.
 */
export function EmptyState({ scene, title, children, action, size = "md", heading = "h3", status }) {
  const night = useNight();
  const [w, h] = size === "sm" ? [160, 120] : [240, 180];
  const H = heading;
  return (
    <div className="es" data-size={size} data-ui="EmptyState" role={status ? "status" : undefined}>
      <EmptyStates state={scene} theme={night ? "dark" : "light"} title="" width={w} height={h} className="es-art" />
      {title ? <H className="es-t">{title}</H> : null}
      {children ? <p className="es-m">{children}</p> : null}
      {action ? <div className="es-a">{action}</div> : null}
    </div>
  );
}

/** Just the scene, for layouts that already set their own title and words (the page-level states). */
export function EmptyArtFor({ scene = "nothing", size = "md" }) {
  const night = useNight();
  const [w, h] = size === "sm" ? [160, 120] : [240, 180];
  return <EmptyStates state={scene} theme={night ? "dark" : "light"} title="" width={w} height={h} className="es-art" />;
}
